import { Router } from 'express';
import { recordRound, useHint, getPuzzle } from '../controllers/game.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/puzzle', getPuzzle);
router.post('/hint', authenticateToken, useHint);
router.post('/round', authenticateToken, recordRound);

export default router;
