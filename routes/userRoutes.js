import express from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);

export default router;
