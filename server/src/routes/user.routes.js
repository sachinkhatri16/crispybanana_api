/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/routes/user.routes.js
 *
 * @description Protected Express router for authenticated user profile,
 *              avatar customization, and round history endpoints.
 *
 * @references
 * 1. Express.js Router-Level Middleware:
 *    OpenJS Foundation, "Using Middleware (Router-Level)", https://expressjs.com/en/guide/using-middleware.html#middleware.router
 * 2. Authentication & Session Protection:
 *    OWASP Foundation, "Authentication Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 * 3. Generative AI Acknowledgement:
 *    Route middleware guards and header documentation were refined with
 *    iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
import { Router } from 'express';
import { getUserProfile, updateAvatar, getUserHistory } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getUserProfile);
router.patch('/avatar', updateAvatar);
router.get('/history', getUserHistory);

export default router;

