import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignUserToProject,
  removeUserFromProject,
} from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();

// Tüm proje route'ları için önce JWT doğrulama
router.use(authenticate);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Sadece admin işlemleri
router.post('/', isAdmin, createProject);
router.put('/:id', isAdmin, updateProject);
router.delete('/:id', isAdmin, deleteProject);

// Kullanıcı atama/çıkarma (Admin only)
router.post('/:id/users', isAdmin, assignUserToProject);
router.delete('/:id/users/:userId', isAdmin, removeUserFromProject);

export default router;
