import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  attendEvent,
  shareEvent,
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/attend', protect, attendEvent);
router.post('/:id/share', protect, shareEvent);

export default router;