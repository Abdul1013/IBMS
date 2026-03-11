import { Router } from 'express';
import * as CommentController from './comment.controller';
import { verifyToken } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { UpdateCommentSchema } from './comment.dto';

const router = Router();
router.patch('/:id', verifyToken, validate(UpdateCommentSchema), CommentController.update);
router.delete('/:id', verifyToken, CommentController.remove);
export default router;
