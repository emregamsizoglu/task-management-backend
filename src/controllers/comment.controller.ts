import { Request, Response } from 'express';
import { Comment, Task, ProjectUser, User } from '../models';

// Yardımcı: kullanıcının göreve erişimi var mı?
const checkTaskAccess = async (
  taskId: string | number,
  userId: number,
  isAdmin: boolean
): Promise<Task | null> => {
  const task = await Task.findOne({ where: { id: taskId, isActive: true } });
  if (!task) return null;

  if (isAdmin) return task;

  const membership = await ProjectUser.findOne({
    where: { projectId: task.projectId, userId, isActive: true },
  });
  return membership ? task : null;
};

// GET /api/tasks/:taskId/comments
export const getCommentsByTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { id: userId, isAdmin } = req.user!;

    const task = await checkTaskAccess(taskId, userId, isAdmin);
    if (!task) {
      res.status(403).json({ message: 'Bu göreve erişim yetkiniz yok veya görev bulunamadı.' });
      return;
    }

    const comments = await Comment.findAll({
      where: { taskId, isActive: true },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'username'] }],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({ comments });
  } catch (error) {
    console.error('GetCommentsByTask error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/tasks/:taskId/comments
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { id: userId, isAdmin } = req.user!;
    const { comment } = req.body;

    if (!comment) {
      res.status(400).json({ message: 'Yorum içeriği zorunludur.' });
      return;
    }

    const task = await checkTaskAccess(taskId, userId, isAdmin);
    if (!task) {
      res.status(403).json({ message: 'Bu göreve erişim yetkiniz yok veya görev bulunamadı.' });
      return;
    }

    const newComment = await Comment.create({
      taskId: Number(taskId),
      userId,
      comment,
    });

    res.status(201).json({ message: 'Yorum başarıyla eklendi.', comment: newComment });
  } catch (error) {
    console.error('CreateComment error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/tasks/:taskId/comments/:id — Soft delete
// Kullanıcı kendi yorumunu, Admin herkesinkini silebilir
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, id } = req.params;
    const { id: userId, isAdmin } = req.user!;

    const comment = await Comment.findOne({ where: { id, taskId, isActive: true } });
    if (!comment) {
      res.status(404).json({ message: 'Yorum bulunamadı.' });
      return;
    }

    if (!isAdmin && comment.userId !== userId) {
      res.status(403).json({ message: 'Sadece kendi yorumlarınızı silebilirsiniz.' });
      return;
    }

    comment.isActive = false;
    await comment.save();

    res.status(200).json({ message: 'Yorum başarıyla silindi.' });
  } catch (error) {
    console.error('DeleteComment error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
