import { Router } from 'express';
import {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router({ mergeParams: true }); // projectId'yi parent route'tan alabilmek için

router.use(authenticate);

router.get('/', getTasksByProject);
router.get('/:id', getTaskById);
router.post('/', isAdmin, createTask);
router.put('/:id', updateTask);          // Admin tam güncelleme, User sadece kendi görev status'u
router.delete('/:id', isAdmin, deleteTask);

export default router;
