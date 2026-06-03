import { Request, Response } from 'express';
import { Task, Project, ProjectUser, User } from '../models';

// Yardımcı: Kullanıcı bu projeye erişebilir mi?
const checkProjectAccess = async (
  projectId: string | number,
  userId: number,
  isAdmin: boolean
): Promise<boolean> => {
  const project = await Project.findOne({ where: { id: projectId, isActive: true } });
  if (!project) return false;
  if (isAdmin) return true;

  const membership = await ProjectUser.findOne({
    where: { projectId, userId, isActive: true },
  });
  return !!membership;
};

// GET /api/projects/:projectId/tasks
export const getTasksByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { id: userId, isAdmin } = req.user!;

    const hasAccess = await checkProjectAccess(projectId, userId, isAdmin);
    if (!hasAccess) {
      res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
      return;
    }

    const tasks = await Task.findAll({
      where: { projectId, isActive: true },
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ tasks });
  } catch (error) {
    console.error('GetTasksByProject error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects/:projectId/tasks/:id
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, id } = req.params;
    const { id: userId, isAdmin } = req.user!;

    const hasAccess = await checkProjectAccess(projectId, userId, isAdmin);
    if (!hasAccess) {
      res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
      return;
    }

    const task = await Task.findOne({
      where: { id, projectId, isActive: true },
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'username'] },
      ],
    });

    if (!task) {
      res.status(404).json({ message: 'Görev bulunamadı.' });
      return;
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error('GetTaskById error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/projects/:projectId/tasks — Admin only
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedUserId, dueDate } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Görev başlığı zorunludur.' });
      return;
    }

    const project = await Project.findOne({ where: { id: projectId, isActive: true } });
    if (!project) {
      res.status(404).json({ message: 'Proje bulunamadı.' });
      return;
    }

    // Atanacak kullanıcı bu projenin üyesi mi?
    if (assignedUserId) {
      const isMember = await ProjectUser.findOne({
        where: { projectId, userId: assignedUserId, isActive: true },
      });
      if (!isMember) {
        res.status(400).json({ message: 'Atanacak kullanıcı bu projenin üyesi değil.' });
        return;
      }
    }

    const task = await Task.create({
      projectId: Number(projectId),
      title,
      description,
      assignedUserId: assignedUserId ?? null,
      dueDate,
    });

    res.status(201).json({ message: 'Görev başarıyla oluşturuldu.', task });
  } catch (error) {
    console.error('CreateTask error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PUT /api/projects/:projectId/tasks/:id
// Admin: her şeyi güncelleyebilir
// User: sadece kendisine atanmış görevin status'unu güncelleyebilir
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, id } = req.params;
    const { id: userId, isAdmin } = req.user!;

    const hasAccess = await checkProjectAccess(projectId, userId, isAdmin);
    if (!hasAccess) {
      res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
      return;
    }

    const task = await Task.findOne({ where: { id, projectId, isActive: true } });
    if (!task) {
      res.status(404).json({ message: 'Görev bulunamadı.' });
      return;
    }

    if (isAdmin) {
      // Admin tam güncelleme yapabilir
      const { title, description, assignedUserId, dueDate, status } = req.body;

      if (assignedUserId !== undefined) {
        if (assignedUserId !== null) {
          const isMember = await ProjectUser.findOne({
            where: { projectId, userId: assignedUserId, isActive: true },
          });
          if (!isMember) {
            res.status(400).json({ message: 'Atanacak kullanıcı bu projenin üyesi değil.' });
            return;
          }
        }
        task.assignedUserId = assignedUserId;
      }

      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (status) task.status = status;
    } else {
      // Standart kullanıcı: sadece kendi görevinin status'unu değiştirebilir
      if (task.assignedUserId !== userId) {
        res.status(403).json({ message: 'Sadece size atanmış görevleri güncelleyebilirsiniz.' });
        return;
      }

      const { status } = req.body;
      if (!status) {
        res.status(400).json({ message: 'Güncelleme için status zorunludur.' });
        return;
      }

      task.status = status;
    }

    await task.save();

    res.status(200).json({ message: 'Görev başarıyla güncellendi.', task });
  } catch (error) {
    console.error('UpdateTask error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/projects/:projectId/tasks/:id — Soft delete, Admin only
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, id } = req.params;

    const task = await Task.findOne({ where: { id, projectId, isActive: true } });
    if (!task) {
      res.status(404).json({ message: 'Görev bulunamadı.' });
      return;
    }

    task.isActive = false;
    await task.save();

    res.status(200).json({ message: 'Görev başarıyla silindi.' });
  } catch (error) {
    console.error('DeleteTask error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
