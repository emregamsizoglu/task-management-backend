import { Request, Response } from 'express';
import { User, Project, Task } from '../models';

/**
 * GET /api/stats — Admin only
 * Dashboard için sistem genelinde istatistikler döndürür.
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // ── Kullanıcı istatistikleri ──────────────────────────────────────────
    const [totalUsers, adminCount] = await Promise.all([
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: true, isAdmin: true } }),
    ]);

    // ── Proje istatistikleri ──────────────────────────────────────────────
    const totalProjects = await Project.count({ where: { isActive: true } });

    // ── Görev istatistikleri ──────────────────────────────────────────────
    const [totalTasks, openTasks, inProgressTasks, doneTasks] = await Promise.all([
      Task.count({ where: { isActive: true } }),
      Task.count({ where: { isActive: true, status: 'Open' } }),
      Task.count({ where: { isActive: true, status: 'InProgress' } }),
      Task.count({ where: { isActive: true, status: 'Done' } }),
    ]);

    const completionRate = totalTasks > 0
      ? Math.round((doneTasks / totalTasks) * 100)
      : 0;

    // ── Son 5 güncellenen görev ───────────────────────────────────────────
    const recentTasks = await Task.findAll({
      where: { isActive: true },
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'projectName'] },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 5,
    });

    // ── En aktif projeler (görev sayısına göre) ───────────────────────────
    const projects = await Project.findAll({
      where: { isActive: true },
      include: [
        {
          model: Task,
          as: 'tasks',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'status'],
        },
      ],
    });

    const projectStats = projects
      .map((p: any) => ({
        id: p.id,
        projectName: p.projectName,
        totalTasks: p.tasks?.length ?? 0,
        doneTasks: p.tasks?.filter((t: any) => t.status === 'Done').length ?? 0,
      }))
      .sort((a, b) => b.totalTasks - a.totalTasks)  // en çok göreve göre sırala
      .slice(0, 5);

    res.status(200).json({
      users: {
        total: totalUsers,
        admins: adminCount,
        regular: totalUsers - adminCount,
      },
      projects: {
        total: totalProjects,
      },
      tasks: {
        total: totalTasks,
        open: openTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        completionRate,
      },
      recentTasks,
      projectStats,
    });
  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};