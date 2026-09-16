import express from 'express';
import {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  likeNews,
  shareNews,
} from '../controllers/newsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getNews);
router.get('/:id', getNewsById);
router.post('/', protect, createNews);
router.put('/:id', protect, updateNews);
router.delete('/:id', protect, deleteNews);
router.post('/:id/like', protect, likeNews);
router.post('/:id/share', protect, shareNews);

export default router;