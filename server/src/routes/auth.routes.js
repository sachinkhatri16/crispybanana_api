/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/routes/auth.routes.js
 *
 * @description Express router mapping virtual identity endpoints (/register,
 *              /login, /logout, /me) to validation and auth middleware.
 *
 * @references
 * 1. Express Routing Documentation:
 *    OpenJS Foundation, "Express 4.x Routing Guide", https://expressjs.com/
 * 2. Password & Session Security Standards:
 *    OWASP Foundation, "Password Storage Cheat Sheet",
 *    https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 * 3. JSON Web Token & HTTP-Only Cookies:
 *    IETF RFC 7519 (JWT) & MDN Web Docs HTTP Cookies
 * 4. Generative AI Acknowledgement:
 *    Logout route wiring and documentation header were assisted by AI tools.
 * ============================================================================
 */
import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../middleware/validate.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;

