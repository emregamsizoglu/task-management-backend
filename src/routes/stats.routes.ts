import { Router } from 'express';
import { getStats } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();

router.get('/', authenticate, isAdmin, getStats);

export default router;