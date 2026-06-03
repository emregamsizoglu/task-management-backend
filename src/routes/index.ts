import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import commentRoutes from './comment.routes';
import statsRoutes from './stats.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/stats', statsRoutes);

// Nested routes
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/tasks/:taskId/comments', commentRoutes);

export default router;