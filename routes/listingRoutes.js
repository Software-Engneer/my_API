import express from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
} from '../controllers/listingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getListings);
router.get('/my-listings', protect, getMyListings);
router.get('/:id', getListingById);
router.post('/', protect, createListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);

export default router;