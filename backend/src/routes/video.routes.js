import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { listFinalVideos, getVideoById, recordVideoView } from '../controllers/video.controller.js';

const router = Router();

router.post('/:id/view', recordVideoView);

router.use(requireAuth);

router.get('/', listFinalVideos);
router.get('/:id', getVideoById);

export default router;
