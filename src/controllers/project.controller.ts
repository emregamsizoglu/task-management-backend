import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Project, ProjectUser, User, Task } from '../models';

// GET /api/projects
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isAdmin, id: userId } = req.user!;

    let projects;

    if (isAdmin) {
      projects = await Project.findAll({
        where: { isActive: true },
        include: [{ model: User, as: 'admin', attributes: ['id', 'name', 'username'] }],
        order: [['createdAt', 'DESC']],
      });
    } else {
      const assignments = await ProjectUser.findAll({
        where: { userId, isActive: true },
        attributes: ['projectId'],
      });

      // BUG FIX: Kullanıcının hiç projesi yoksa boş dizi döndür (Op.in: [] DB'ye gitmesin)
      if (assignments.length === 0) {
        res.status(200).json({ projects: [] });
        return;
      }

      const projectIds = assignments.map((a) => a.projectId);

      projects = await Project.findAll({
        where: { id: { [Op.in]: projectIds }, isActive: true },
        include: [{ model: User, as: 'admin', attributes: ['id', 'name', 'username'] }],
        order: [['createdAt', 'DESC']],
      });
    }

    res.status(200).json({ projects });
  } catch (error) {
    console.error('GetAllProjects error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects/:id
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isAdmin, id: userId } = req.user!;

    const project = await Project.findOne({
      where: { id, isActive: true },
      include: [
        { model: User, as: 'admin', attributes: ['id', 'name', 'username'] },
        {
          model: ProjectUser,
          as: 'projectUsers',
          where: { isActive: true },
          required: false,
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'username', 'email'] }],
        },
      ],
    });

    if (!project) {
      res.status(404).json({ message: 'Proje bulunamadı.' });
      return;
    }

    if (!isAdmin) {
      const isMember = await ProjectUser.findOne({
        where: { projectId: id, userId, isActive: true },
      });
      if (!isMember) {
        res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
        return;
      }
    }

    res.status(200).json({ project });
  } catch (error) {
    console.error('GetProjectById error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/projects
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectName, description, userLimit } = req.body;
    const createdByAdminId = req.user!.id;

    if (!projectName || !String(projectName).trim()) {
      res.status(400).json({ message: 'Proje adı zorunludur.' });
      return;
    }

    if (userLimit !== undefined && (isNaN(Number(userLimit)) || Number(userLimit) < 1)) {
      res.status(400).json({ message: 'Kullanıcı limiti en az 1 olmalıdır.' });
      return;
    }

    const project = await Project.create({
      projectName: String(projectName).trim(),
      description: description || undefined,
      userLimit: userLimit ? Number(userLimit) : 5,
      createdByAdminId,
    });

    res.status(201).json({ message: 'Proje başarıyla oluşturuldu.', project });
  } catch (error) {
    console.error('CreateProject error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PUT /api/projects/:id
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { projectName, description, userLimit } = req.body;

    const project = await Project.findOne({ where: { id, isActive: true } });
    if (!project) {
      res.status(404).json({ message: 'Proje bulunamadı.' });
      return;
    }

    if (userLimit !== undefined) {
      const newLimit = Number(userLimit);
      if (isNaN(newLimit) || newLimit < 1) {
        res.status(400).json({ message: 'Kullanıcı limiti en az 1 olmalıdır.' });
        return;
      }
      const currentMemberCount = await ProjectUser.count({
        where: { projectId: id, isActive: true },
      });
      if (newLimit < currentMemberCount) {
        res.status(400).json({
          message: `Mevcut aktif üye sayısı (${currentMemberCount}) yeni limitten büyük olamaz.`,
        });
        return;
      }
      project.userLimit = newLimit;
    }

    if (projectName && String(projectName).trim()) {
      project.projectName = String(projectName).trim();
    }
    if (description !== undefined) project.description = description;

    await project.save();

    res.status(200).json({ message: 'Proje başarıyla güncellendi.', project });
  } catch (error) {
    console.error('UpdateProject error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ where: { id, isActive: true } });
    if (!project) {
      res.status(404).json({ message: 'Proje bulunamadı.' });
      return;
    }

    project.isActive = false;
    await project.save();

    res.status(200).json({ message: 'Proje başarıyla silindi.' });
  } catch (error) {
    console.error('DeleteProject error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/projects/:id/users
export const assignUserToProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: 'userId zorunludur.' });
      return;
    }

    const [project, user] = await Promise.all([
      Project.findOne({ where: { id: projectId, isActive: true } }),
      User.findOne({ where: { id: userId, isActive: true } }),
    ]);

    if (!project) { res.status(404).json({ message: 'Proje bulunamadı.' }); return; }
    if (!user) { res.status(404).json({ message: 'Kullanıcı bulunamadı.' }); return; }

    const existingAssignment = await ProjectUser.findOne({ where: { projectId, userId } });

    if (existingAssignment) {
      if (existingAssignment.isActive) {
        res.status(409).json({ message: 'Kullanıcı zaten bu projeye atanmış.' });
        return;
      }
      const activeCount = await ProjectUser.count({ where: { projectId, isActive: true } });
      if (activeCount >= project.userLimit) {
        res.status(400).json({ message: `Proje kullanıcı limitine (${project.userLimit}) ulaşıldı.` });
        return;
      }
      existingAssignment.isActive = true;
      existingAssignment.assignedAt = new Date();
      await existingAssignment.save();
      res.status(200).json({ message: 'Kullanıcı projeye tekrar atandı.' });
      return;
    }

    const activeCount = await ProjectUser.count({ where: { projectId, isActive: true } });
    if (activeCount >= project.userLimit) {
      res.status(400).json({ message: `Proje kullanıcı limitine (${project.userLimit}) ulaşıldı.` });
      return;
    }

    await ProjectUser.create({ projectId: Number(projectId), userId: Number(userId) });

    res.status(201).json({ message: 'Kullanıcı projeye başarıyla atandı.' });
  } catch (error) {
    console.error('AssignUserToProject error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/projects/:id/users/:userId
export const removeUserFromProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: projectId, userId } = req.params;

    const assignment = await ProjectUser.findOne({
      where: { projectId, userId, isActive: true },
    });

    if (!assignment) {
      res.status(404).json({ message: 'Kullanıcı bu projede bulunamadı.' });
      return;
    }

    await Task.update(
      { assignedUserId: null },
      { where: { projectId, assignedUserId: userId, isActive: true } }
    );

    assignment.isActive = false;
    await assignment.save();

    res.status(200).json({ message: 'Kullanıcı projeden çıkarıldı.' });
  } catch (error) {
    console.error('RemoveUserFromProject error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};