import express from 'express';
import {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  getCommentCount,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getComments);
router.get('/count', getCommentCount);
router.get('/:id', getCommentById);
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);

export default router;