import { Router } from 'express';
import { getUserProfile, updateAvatar, getUserHistory } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getUserProfile);
router.patch('/avatar', updateAvatar);
router.get('/history', getUserHistory);

export default router;

