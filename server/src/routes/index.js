/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/routes/index.js
 *
 * @description Root API router aggregating domain route modules (/auth,
 *              /users, /game, /leaderboard) under a modular Express hierarchy.
 *
 * @references
 * 1. Express.js Modular Routing:
 *    OpenJS Foundation, "Express Routing Guide", https://expressjs.com/en/guide/routing.html
 * 2. Layered Software Architecture (Separation of Concerns):
 *    Martin Fowler, "Patterns of Enterprise Application Architecture"
 * 3. Generative AI Acknowledgement:
 *    Modular router layout and header documentation were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import gameRoutes from './game.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/game', gameRoutes);
router.use('/leaderboard', leaderboardRoutes);

export default router;
