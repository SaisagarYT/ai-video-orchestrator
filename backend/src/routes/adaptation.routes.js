import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createCampaignAdaptation,
  bulkCreateCampaignAdaptations,
  listCampaignAdaptations,
  getCampaignAdaptation,
  renderCampaignAdaptation,
  cancelCampaignAdaptation,
  getCampaignAdaptationEvents,
} from '../controllers/adaptation.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/:campaignId/adaptations/bulk', bulkCreateCampaignAdaptations);
router.post('/:campaignId/adaptations', createCampaignAdaptation);
router.get('/:campaignId/adaptations', listCampaignAdaptations);
router.get('/:campaignId/adaptations/:adaptationId', getCampaignAdaptation);
router.post('/:campaignId/adaptations/:adaptationId/render', renderCampaignAdaptation);
router.post('/:campaignId/adaptations/:adaptationId/cancel', cancelCampaignAdaptation);
router.get('/:campaignId/adaptations/:adaptationId/events', getCampaignAdaptationEvents);

export const adaptationRoutes = router;
