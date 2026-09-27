import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { updateScene, rerollScene } from '../controllers/scene.controller.js';

const router = Router();

router.use(requireAuth);

router.patch('/:id', updateScene);
router.post('/:id/reroll', rerollScene);

export default router;
