import express from 'express';
import {
  createLeague,
  getLeagues,
  getLeagueByKey,
  updateLeague,
  deleteLeague,
  addFixture,
  updateFixture,
  addResult,
  addStanding,
  addNews,
} from '../controllers/leagueController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getLeagues);
router.get('/:key', getLeagueByKey);
router.post('/', protect, createLeague);
router.put('/:key', protect, updateLeague);
router.delete('/:key', protect, deleteLeague);
router.post('/:key/fixtures', protect, addFixture);
router.put('/:key/fixtures/:fixtureId', protect, updateFixture);
router.post('/:key/results', protect, addResult);
router.post('/:key/standings', protect, addStanding);
router.post('/:key/news', protect, addNews);

export default router;