import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getMe, updateProfile } from '../controllers/auth.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getMe);
router.patch('/profile', updateProfile);

export default router;
