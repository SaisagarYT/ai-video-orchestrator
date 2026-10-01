import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { logger } from '../core/logger/logger.js';

export const workflowEventEmitter = new EventEmitter();
workflowEventEmitter.setMaxListeners(100);

export const WORKFLOW_EVENT_TYPES = {
  WORKFLOW_STARTED: 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  STEP_STARTED: 'STEP_STARTED',
  STEP_COMPLETED: 'STEP_COMPLETED',
  STEP_FAILED: 'STEP_FAILED',
  MEDIA_JOB_CREATED: 'MEDIA_JOB_CREATED',
  MEDIA_JOB_COMPLETED: 'MEDIA_JOB_COMPLETED',
  MEDIA_JOB_FAILED: 'MEDIA_JOB_FAILED',
  ASSET_CREATED: 'ASSET_CREATED',
  TIMELINE_CREATED: 'TIMELINE_CREATED',
  RENDER_JOB_CREATED: 'RENDER_JOB_CREATED',
  RENDER_PROCESSING: 'RENDER_PROCESSING',
  RENDER_COMPLETED: 'RENDER_COMPLETED',
  RENDER_FAILED: 'RENDER_FAILED',
  FINAL_VIDEO_CREATED: 'FINAL_VIDEO_CREATED',
  SUBTITLE_GENERATED: 'SUBTITLE_GENERATED',
  AUDIO_MASTERED: 'AUDIO_MASTERED',
  QUALITY_EVALUATION_STARTED: 'QUALITY_EVALUATION_STARTED',
  QUALITY_EVALUATION_COMPLETED: 'QUALITY_EVALUATION_COMPLETED',
  QUALITY_EVALUATION_FAILED: 'QUALITY_EVALUATION_FAILED',
  REVISION_LOOP_STARTED: 'REVISION_LOOP_STARTED',
  REVISION_ATTEMPT_STARTED: 'REVISION_ATTEMPT_STARTED',
  REVISION_ATTEMPT_COMPLETED: 'REVISION_ATTEMPT_COMPLETED',
  PROMPT_HEALED: 'PROMPT_HEALED',
  SCENE_REGENERATED: 'SCENE_REGENERATED',
  REVISION_EXHAUSTED: 'REVISION_EXHAUSTED',
  VIDEO_UNDERSTANDING_STARTED: 'VIDEO_UNDERSTANDING_STARTED',
  VIDEO_FRAMES_EXTRACTED: 'VIDEO_FRAMES_EXTRACTED',
  SCENE_VISION_ANALYSIS_STARTED: 'SCENE_VISION_ANALYSIS_STARTED',
  SCENE_VISION_ANALYSIS_COMPLETED: 'SCENE_VISION_ANALYSIS_COMPLETED',
  VIDEO_UNDERSTANDING_COMPLETED: 'VIDEO_UNDERSTANDING_COMPLETED',
  VIDEO_UNDERSTANDING_FAILED: 'VIDEO_UNDERSTANDING_FAILED',
};

const sequenceCounters = new Map();

/**
 * Record a durable workflow event in PostgreSQL and broadcast to active listeners.
 */
export const recordWorkflowEvent = async ({
  executionId,
  campaignId,
  stepId = null,
  eventType,
  payload = {},
}) => {
  try {
    const currentSeq = (sequenceCounters.get(executionId) || 0) + 1;
    sequenceCounters.set(executionId, currentSeq);

    const eventRecord = {
      id: crypto.randomUUID(),
      execution_id: executionId,
      campaign_id: campaignId,
      step_id: stepId,
      event_type: eventType,
      payload: {
        ...payload,
        campaignId,
        executionId,
        stepId,
        eventType,
        timestamp: new Date().toISOString(),
      },
      sequence_number: currentSeq,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('workflow_events')
      .insert(eventRecord);

    if (error) {
      logger.error('Failed to persist workflow event into PostgreSQL', {
        error: error.message,
        executionId,
        eventType,
      });
    }

    const savedEvent = Array.isArray(data) ? data[0] : data || eventRecord;

    workflowEventEmitter.emit(`campaign:${campaignId}`, savedEvent);
    workflowEventEmitter.emit(`execution:${executionId}`, savedEvent);

    logger.debug(`[Event] Recorded ${eventType} (seq: ${currentSeq}) for campaign ${campaignId}`);
    return savedEvent;
  } catch (err) {
    logger.error('Unexpected error recording workflow event', { error: err.message, eventType });
    throw err;
  }
};

/**
 * Fetch all historical events for catch-up playback on client SSE connection.
 */
export const getHistoricalEvents = async (campaignId, executionId = null) => {
  try {
    let query = supabase
      .from('workflow_events')
      .select('*')
      .eq('campaign_id', campaignId);

    if (executionId) {
      query = query.eq('execution_id', executionId);
    }

    const { data, error } = await query.order('sequence_number', { ascending: true });

    if (error) {
      logger.error('Failed to load historical workflow events', { error: error.message, campaignId });
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('Unexpected error loading historical events', { error: err.message, campaignId });
    return [];
  }
};

/**
 * Subscribe to real-time events for a campaign
 */
export const subscribeToCampaignEvents = (campaignId, listener) => {
  const eventName = `campaign:${campaignId}`;
  workflowEventEmitter.on(eventName, listener);

  return () => {
    workflowEventEmitter.off(eventName, listener);
  };
};

export default {
  recordWorkflowEvent,
  getHistoricalEvents,
  subscribeToCampaignEvents,
  workflowEventEmitter,
};
