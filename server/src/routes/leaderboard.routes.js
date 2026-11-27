/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/routes/leaderboard.routes.js
 *
 * @description Exposes the public GET /api/leaderboard endpoint backed by
 *              live PostgreSQL player rankings via Prisma ORM.
 *
 * @references
 * 1. Express.js Router:
 *    OpenJS Foundation, "express.Router Documentation", https://expressjs.com/en/guide/routing.html
 * 2. Prisma ORM Sorting & Filtering:
 *    Prisma Data, "Filtering and Sorting", https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting
 * 3. Generative AI Acknowledgement:
 *    Route definition and documentation headers were refined with iterative
 *    assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { Router } from 'express';
import { getLeaderboard } from '../controllers/game.controller.js';

const router = Router();

router.get('/', getLeaderboard);

export default router;

