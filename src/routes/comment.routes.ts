import { Router } from 'express';
import {
  getCommentsByTask,
  createComment,
  deleteComment,
} from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getCommentsByTask);
router.post('/', createComment);
router.delete('/:id', deleteComment);

export default router;
