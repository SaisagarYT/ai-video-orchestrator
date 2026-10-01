import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { workflowQueue } from './queue.js';
import { recordWorkflowEvent } from './events.js';
import { runStep } from './stepRunner.js';
import { NotFoundError } from '../core/errors/AppError.js';
import { logger } from '../core/logger/logger.js';
import { revisionService } from '../services/revision/index.js';

export const WORKFLOW_STAGES = [
  'CONTEXT_INGESTION',
  'DIRECTOR',
  'SCREENWRITER',
  'CRITIC',
  'CINEMATOGRAPHER',
  'PROMPT_COMPILER',
];

export const FULL_WORKFLOW_STAGES = [
  'CONTEXT_INGESTION',
  'DIRECTOR',
  'SCREENWRITER',
  'CRITIC',
  'CINEMATOGRAPHER',
  'PROMPT_COMPILER',
  'SCENE_VIDEO_GENERATION',
  'SCENE_AUDIO_GENERATION',
  'ASSET_PERSISTENCE',
];

export const RENDER_WORKFLOW_STAGES = [
  'CONTEXT_INGESTION',
  'DIRECTOR',
  'SCREENWRITER',
  'CRITIC',
  'CINEMATOGRAPHER',
  'PROMPT_COMPILER',
  'SCENE_VIDEO_GENERATION',
  'SCENE_AUDIO_GENERATION',
  'ASSET_PERSISTENCE',
  'TIMELINE_BUILD',
  'VIDEO_RENDER',
  'FINAL_VIDEO_PERSISTENCE',
];

export const EVALUATION_WORKFLOW_STAGES = [
  ...RENDER_WORKFLOW_STAGES,
  'QUALITY_EVALUATION',
];

export const REVISION_WORKFLOW_STAGES = [
  ...EVALUATION_WORKFLOW_STAGES,
  'AUTONOMOUS_REVISION',
];

export const MULTIMODAL_EVALUATION_WORKFLOW_STAGES = [
  ...RENDER_WORKFLOW_STAGES,
  'VIDEO_UNDERSTANDING',
  'QUALITY_EVALUATION',
];

export const MULTIMODAL_REVISION_WORKFLOW_STAGES = [
  ...MULTIMODAL_EVALUATION_WORKFLOW_STAGES,
  'AUTONOMOUS_REVISION',
];

export const MEMORY_WORKFLOW_STAGES = [
  'CONTEXT_INGESTION',
  'MEMORY_RETRIEVAL',
  'DIRECTOR',
  'SCREENWRITER',
  'CRITIC',
  'CINEMATOGRAPHER',
  'PROMPT_COMPILER',
];

const STAGE_CONTEXT_KEYS = {
  CONTEXT_INGESTION: 'contextIngestion',
  MEMORY_RETRIEVAL: 'memoryRetrieval',
  DIRECTOR: 'director',
  SCREENWRITER: 'screenwriter',
  CRITIC: 'critic',
  CINEMATOGRAPHER: 'cinematographer',
  PROMPT_COMPILER: 'promptCompiler',
  SCENE_VIDEO_GENERATION: 'sceneVideoGeneration',
  SCENE_AUDIO_GENERATION: 'sceneAudioGeneration',
  ASSET_PERSISTENCE: 'assetPersistence',
  TIMELINE_BUILD: 'timelineBuild',
  VIDEO_RENDER: 'videoRender',
  FINAL_VIDEO_PERSISTENCE: 'finalVideoPersistence',
  VIDEO_UNDERSTANDING: 'videoUnderstanding',
  QUALITY_EVALUATION: 'qualityEvaluation',
  AUTONOMOUS_REVISION: 'autonomousRevision',
};

/**
 * Initialize durable workflow execution and enqueue job
 */
export const createWorkflowExecution = async ({
  campaignId,
  userId,
  idempotencyKey = null,
  stages = null,
  includeMedia = false,
  includeRender = false,
  includeEvaluation = false,
  includeRevision = false,
  includeVision = false,
  includeMultimodal = false,
  includeMemory = false,
}) => {
  // 1. Verify campaign ownership
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .maybeSingle();

  if (campaignError) throw campaignError;
  if (!campaign) {
    throw new NotFoundError(`Campaign ${campaignId} not found or not accessible by user ${userId}`);
  }

  // 2. Check Idempotency
  if (idempotencyKey) {
    const { data: existingExecution } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingExecution) {
      return { execution: existingExecution, isExisting: true };
    }
  }

  // 3. Create execution row
  const executionId = crypto.randomUUID();
  const executionRow = {
    id: executionId,
    campaign_id: campaignId,
    user_id: userId,
    idempotency_key: idempotencyKey || null,
    status: 'QUEUED',
    current_stage: 'INIT',
    progress_percent: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await supabase.from('workflow_executions').insert(executionRow);

  // 4. Create pending workflow steps
  let activeStages =
    stages ||
    (includeRevision
      ? (includeVision || includeMultimodal ? MULTIMODAL_REVISION_WORKFLOW_STAGES : REVISION_WORKFLOW_STAGES)
      : includeMultimodal || includeVision
        ? MULTIMODAL_EVALUATION_WORKFLOW_STAGES
        : includeEvaluation
          ? EVALUATION_WORKFLOW_STAGES
          : includeRender
            ? RENDER_WORKFLOW_STAGES
            : includeMedia
              ? FULL_WORKFLOW_STAGES
              : (includeMemory ? MEMORY_WORKFLOW_STAGES : WORKFLOW_STAGES));

  if (includeMemory && !activeStages.includes('MEMORY_RETRIEVAL')) {
    const ciIdx = activeStages.indexOf('CONTEXT_INGESTION');
    if (ciIdx !== -1) {
      activeStages = [
        ...activeStages.slice(0, ciIdx + 1),
        'MEMORY_RETRIEVAL',
        ...activeStages.slice(ciIdx + 1),
      ];
    } else {
      activeStages = ['MEMORY_RETRIEVAL', ...activeStages];
    }
  }
  const steps = activeStages.map((stageName, index) => ({
    id: crypto.randomUUID(),
    execution_id: executionId,
    step_name: stageName,
    sequence_number: index + 1,
    status: 'PENDING',
    max_retries: 3,
    retry_count: 0,
    output_artifact: null,
    created_at: new Date().toISOString(),
  }));

  await supabase.from('workflow_steps').insert(steps);

  // 5. Update campaign status
  await supabase
    .from('campaigns')
    .update({ status: 'GENERATING' })
    .eq('id', campaignId);

  // 6. Record queued event
  await recordWorkflowEvent({
    executionId,
    campaignId,
    eventType: 'WORKFLOW_QUEUED',
    payload: { stage: 'INIT', progress: 0 },
  });

  // 7. Enqueue into workflowQueue
  await workflowQueue.enqueue({
    jobId: executionId,
    executionId,
    campaignId,
    userId,
  });

  return { execution: executionRow, isExisting: false };
};

/**
 * Execute all stages of a workflow job
 */
export const executeWorkflowJob = async (job) => {
  const { executionId, campaignId, userId } = job.data;

  const { data: execution } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  await supabase
    .from('workflow_executions')
    .update({
      status: 'RUNNING',
      started_at: new Date().toISOString(),
    })
    .eq('id', executionId);

  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('execution_id', executionId)
    .order('sequence_number', { ascending: true });

  const totalSteps = steps.length;
  const context = { campaign };

  try {
    for (let i = 0; i < totalSteps; i++) {
      const step = steps[i];
      const contextKey = STAGE_CONTEXT_KEYS[step.step_name] || step.step_name.toLowerCase();

      if (step.status === 'COMPLETED') {
        context[contextKey] = step.output_artifact;
        continue;
      }

      const progress = Math.round((i / totalSteps) * 100);

      await supabase
        .from('workflow_executions')
        .update({
          current_stage: step.step_name,
          progress_percent: progress,
        })
        .eq('id', executionId);

      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId: step.id,
        eventType: 'STAGE_TRANSITION',
        payload: { stage: step.step_name, progress },
      });

      const output = await runStep(step, context);
      context[contextKey] = output;
      if (step.step_name === 'MEMORY_RETRIEVAL' && output) {
        context.memory = output;
      }
    }

    // Check if autonomous revision is required (evaluation failed and not already revised)
    if (
      context.qualityEvaluation &&
      context.qualityEvaluation.passed === false &&
      !context.autonomousRevision &&
      campaign.auto_revise !== false
    ) {
      await supabase
        .from('workflow_executions')
        .update({
          current_stage: 'AUTONOMOUS_REVISION',
          progress_percent: 95,
        })
        .eq('id', executionId);

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: 'STAGE_TRANSITION',
        payload: { stage: 'AUTONOMOUS_REVISION', progress: 95 },
      });

      const revisionResult = await revisionService.executeAutonomousRevisionLoop({
        campaignId,
        executionId,
        initialEvaluation: context.qualityEvaluation,
        context,
        maxAttempts: campaign.max_revision_attempts || 2,
      });

      context.autonomousRevision = revisionResult;
      if (revisionResult.finalEvaluation) {
        context.qualityEvaluation = revisionResult.finalEvaluation;
      }
    }

    const isRevisionExhausted = context.autonomousRevision && !context.autonomousRevision.passed;
    const isWarningAccepted = context.autonomousRevision?.status === 'WARNING_ACCEPTED';
    const finalExecutionStatus = isRevisionExhausted
      ? isWarningAccepted
        ? 'WARNING_ACCEPTED'
        : 'REVISION_EXHAUSTED'
      : 'COMPLETED';
    const finalStage = isRevisionExhausted ? finalExecutionStatus : 'COMPLETED';

    const completedAt = new Date().toISOString();
    await supabase
      .from('workflow_executions')
      .update({
        status: finalExecutionStatus,
        current_stage: finalStage,
        progress_percent: 100,
        completed_at: completedAt,
      })
      .eq('id', executionId);

    await supabase
      .from('campaigns')
      .update({ status: finalExecutionStatus })
      .eq('id', campaignId);

    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: 'WORKFLOW_COMPLETED',
      payload: { progress: 100, completedAt, status: finalExecutionStatus },
    });

    return { success: true, executionId, status: finalExecutionStatus };
  } catch (err) {
    logger.error(`Workflow execution ${executionId} failed`, { error: err.message });

    await supabase
      .from('workflow_executions')
      .update({
        status: 'FAILED',
        error_message: err.message,
      })
      .eq('id', executionId);

    await supabase
      .from('campaigns')
      .update({ status: 'FAILED' })
      .eq('id', campaignId);

    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: 'WORKFLOW_FAILED',
      payload: { error: err.message },
    });

    throw err;
  }
};

/**
 * Recover orphaned RUNNING workflows on backend startup
 */
export const recoverWorkflows = async () => {
  const { data: runningExecutions, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('status', 'RUNNING');

  if (error || !runningExecutions || runningExecutions.length === 0) {
    return { recoveredCount: 0 };
  }

  for (const execution of runningExecutions) {
    const { data: runningSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .eq('status', 'RUNNING');

    if (runningSteps && runningSteps.length > 0) {
      for (const step of runningSteps) {
        await supabase
          .from('workflow_steps')
          .update({ status: 'PENDING' })
          .eq('id', step.id);
      }
    }

    await recordWorkflowEvent({
      executionId: execution.id,
      campaignId: execution.campaign_id,
      eventType: 'WORKFLOW_RECOVERED',
      payload: { previousStatus: 'RUNNING' },
    });

    await workflowQueue.enqueue({
      jobId: execution.id,
      executionId: execution.id,
      campaignId: execution.campaign_id,
      userId: execution.user_id,
    });
  }

  return { recoveredCount: runningExecutions.length };
};

/**
 * Start background worker loop (for server runtime)
 */
export const startWorkflowWorker = () => {
  workflowQueue.process(executeWorkflowJob);
  logger.info('Workflow Queue Worker registered and processing jobs');
};

export default {
  createWorkflowExecution,
  executeWorkflowJob,
  recoverWorkflows,
  startWorkflowWorker,
  WORKFLOW_STAGES,
};
