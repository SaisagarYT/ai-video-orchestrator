import { adaptationService } from '../adaptation/adaptation.service.js';
import {
  createAdaptationInputSchema,
  bulkAdaptationInputSchema,
} from '../adaptation/schemas.js';
import { supabase } from '../config/supabase.js';

export async function createCampaignAdaptation(req, res, next) {
  try {
    const { campaignId } = req.params;
    const body = createAdaptationInputSchema.parse(req.body);

    const idempotencyKey = req.headers['idempotency-key'] || body.idempotencyKey;

    const adaptation = await adaptationService.createAdaptation({
      campaignId,
      sourceTimelineId: body.sourceTimelineId,
      platform: body.platform,
      profileVersion: body.profileVersion,
      options: body.options,
      idempotencyKey,
      user: req.user,
    });

    return res.status(201).json({
      success: true,
      adaptation,
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkCreateCampaignAdaptations(req, res, next) {
  try {
    const { campaignId } = req.params;
    const body = bulkAdaptationInputSchema.parse(req.body);

    const idempotencyKey = req.headers['idempotency-key'] || body.idempotencyKey;

    const result = await adaptationService.bulkCreateAdaptations({
      campaignId,
      platforms: body.platforms,
      sourceTimelineId: body.sourceTimelineId,
      options: body.options,
      idempotencyKey,
      user: req.user,
    });

    return res.status(202).json({
      success: true,
      message: 'Bulk adaptation request accepted for processing',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listCampaignAdaptations(req, res, next) {
  try {
    const { campaignId } = req.params;
    const { platform, status } = req.query;

    const adaptations = await adaptationService.listAdaptations(campaignId, req.user, {
      platform,
      status,
    });

    return res.status(200).json({
      success: true,
      adaptations,
      count: adaptations.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignAdaptation(req, res, next) {
  try {
    const { adaptationId } = req.params;
    const adaptation = await adaptationService.getAdaptation(adaptationId, req.user);

    return res.status(200).json({
      success: true,
      adaptation,
    });
  } catch (err) {
    next(err);
  }
}

export async function renderCampaignAdaptation(req, res, next) {
  try {
    const { adaptationId } = req.params;
    const adaptation = await adaptationService.executeAdaptation(adaptationId, {
      user: req.user,
      runRender: true,
      runEvaluation: true,
    });

    return res.status(200).json({
      success: true,
      adaptation,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelCampaignAdaptation(req, res, next) {
  try {
    const { adaptationId } = req.params;
    const reason = req.body?.reason || 'Cancelled by user';

    const adaptation = await adaptationService.cancelAdaptation(adaptationId, req.user, reason);

    return res.status(200).json({
      success: true,
      adaptation,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignAdaptationEvents(req, res, next) {
  try {
    const { adaptationId } = req.params;
    const adaptation = await adaptationService.getAdaptation(adaptationId, req.user);

    let query = supabase
      .from('workflow_events')
      .select('*')
      .eq('campaign_id', adaptation.campaign_id)
      .order('created_at', { ascending: true });

    if (adaptation.workflow_execution_id) {
      query = query.eq('workflow_execution_id', adaptation.workflow_execution_id);
    }

    const { data: events } = await query;

    return res.status(200).json({
      success: true,
      events: events || [],
    });
  } catch (err) {
    next(err);
  }
}
