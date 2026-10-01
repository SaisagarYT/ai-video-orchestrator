import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { createCampaignSchema, updateCampaignSchema } from '../schemas/campaign.schema.js';
import { createWorkflowExecution } from '../orchestration/engine.js';
import { getHistoricalEvents, subscribeToCampaignEvents } from '../orchestration/events.js';
import { NotFoundError } from '../core/errors/AppError.js';
import { evaluationService } from '../services/evaluation/index.js';

export const listCampaigns = async (req, res, next) => {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: campaigns || [] });
  } catch (err) {
    next(err);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const validated = createCampaignSchema.parse(req.body);
    const campaignId = crypto.randomUUID();
    const newCampaign = {
      id: campaignId,
      user_id: req.user.id,
      business_id: validated.business_id || validated.businessId || null,
      title: validated.title,
      goal: validated.goal,
      product_name: validated.product_name || validated.productName,
      product_summary: validated.product_summary || validated.productSummary || null,
      unique_points: validated.unique_points || validated.uniquePoints || null,
      call_to_action: validated.call_to_action || validated.callToAction || null,
      target_platform: validated.target_platform || validated.targetPlatform || 'tiktok',
      aspect_ratio: validated.aspect_ratio || validated.aspectRatio || '9:16',
      duration_seconds: validated.duration_seconds || validated.durationSeconds || 30,
      status: 'DRAFT',
    };

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert(newCampaign);

    if (error) throw error;
    return res.status(201).json({
      success: true,
      data: Array.isArray(campaign) ? campaign[0] : campaign,
    });
  } catch (err) {
    next(err);
  }
};

export const getCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!campaign) {
      return next(new NotFoundError('Campaign not found'));
    }

    return res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = updateCampaignSchema.parse(req.body);

    const { data: existing, error: findError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      return next(new NotFoundError('Campaign not found'));
    }

    const updatePayload = {};
    for (const [key, val] of Object.entries(validated)) {
      if (val !== undefined) {
        updatePayload[key] = val;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('campaigns')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) throw updateError;
    const result = Array.isArray(updated) ? updated[0] : updated || { ...existing, ...updatePayload };
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const generateCampaignVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: campaign, error: findError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (findError) throw findError;
    if (!campaign) {
      return next(new NotFoundError('Campaign not found'));
    }

    const idempotencyKey =
      req.headers['idempotency-key'] ||
      req.headers['x-idempotency-key'] ||
      req.body?.idempotencyKey ||
      req.body?.idempotency_key;

    const { execution } = await createWorkflowExecution({
      campaignId: id,
      userId: req.user.id,
      idempotencyKey,
    });

    return res.status(202).json({
      success: true,
      message: 'Workflow execution created and queued',
      data: {
        workflowExecutionId: execution.id,
        campaignId: id,
        sseStreamUrl: `/api/campaigns/${id}/progress`,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const streamCampaignProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: campaign, error: findError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (findError) throw findError;
    if (!campaign) {
      return next(new NotFoundError('Campaign not found'));
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    // Replay historical events
    const history = await getHistoricalEvents(id);
    for (const evt of history) {
      res.write(`event: ${evt.event_type}\ndata: ${JSON.stringify(evt.payload)}\n\n`);
    }

    // Subscribe to live events
    const unsubscribe = subscribeToCampaignEvents(id, (evt) => {
      res.write(`event: ${evt.event_type}\ndata: ${JSON.stringify(evt.payload)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  } catch (err) {
    next(err);
  }
};

export const getCampaignEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) {
      return next(new NotFoundError('Campaign not found'));
    }

    const evaluation = await evaluationService.getLatestEvaluation(id);

    return res.json({
      success: true,
      data: {
        evaluationId: evaluation.id,
        campaignId: evaluation.campaign_id,
        workflowExecutionId: evaluation.workflow_execution_id,
        finalVideoId: evaluation.final_video_id,
        evaluationVersion: evaluation.evaluation_version,
        overallScore: Number(evaluation.overall_score),
        threshold: Number(evaluation.threshold),
        passed: Boolean(evaluation.passed),
        dimensions: evaluation.dimensions,
        technicalChecks: evaluation.technical_checks,
        issues: evaluation.issues || [],
        recommendations: evaluation.recommendations || [],
        revisionInstructions: evaluation.revision_instructions || [],
        createdAt: evaluation.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  generateCampaignVideo,
  streamCampaignProgress,
  getCampaignEvaluation,
};
