import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (token gerekli)
router.get('/me', authenticate, getMe);

export default router;
