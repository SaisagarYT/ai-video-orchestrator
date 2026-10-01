import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  generateCampaignVideo,
  streamCampaignProgress,
  getCampaignEvaluation,
  getCampaignRevisions,
  getCampaignVideoUnderstanding,
} from '../controllers/campaign.controller.js';

const router = Router();

// Progress route accepts token in query params or Authorization header
router.get('/:id/progress', requireAuth, streamCampaignProgress);

router.use(requireAuth);

router.get('/', listCampaigns);
router.post('/', createCampaign);
router.get('/:id', getCampaign);
router.put('/:id', updateCampaign);
router.post('/:id/generate', generateCampaignVideo);
router.get('/:id/evaluation', getCampaignEvaluation);
router.get('/:id/revisions', getCampaignRevisions);
router.get('/:id/video-understanding', getCampaignVideoUnderstanding);

export default router;
