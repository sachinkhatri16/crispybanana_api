/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/routes/game.routes.js
 *
 * @description Defines REST endpoints for puzzle retrieval (BFF proxy),
 *              authenticated hint unlocking, and round score submission.
 *
 * @references
 * 1. Express.js Router & Route-Level Middleware:
 *    OpenJS Foundation, "express.Router Documentation", https://expressjs.com/en/guide/routing.html#express-router
 * 2. Enterprise Integration Patterns (BFF Gateway):
 *    Martin Fowler, "Backend for Frontend", https://martinfowler.com/articles/bff.html
 * 3. Generative AI Acknowledgement:
 *    Route organization and header comments were refined with iterative
 *    assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { Router } from 'express';
import { recordRound, useHint, getPuzzle } from '../controllers/game.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/puzzle', getPuzzle);
router.post('/hint', authenticateToken, useHint);
router.post('/round', authenticateToken, recordRound);

export default router;
