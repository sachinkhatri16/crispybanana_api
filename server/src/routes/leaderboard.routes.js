import { Router } from 'express';
import { getLeaderboard } from '../controllers/game.controller.js';

const router = Router();

router.get('/', getLeaderboard);

export default router;

