import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../middleware/validate.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticateToken, getMe);

export default router;

