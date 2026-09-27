import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { workflowQueue } from './queue.js';
import { recordWorkflowEvent } from './events.js';
import { runStep } from './stepRunner.js';
import { NotFoundError } from '../core/errors/AppError.js';
import { logger } from '../core/logger/logger.js';

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

const STAGE_CONTEXT_KEYS = {
  CONTEXT_INGESTION: 'contextIngestion',
  DIRECTOR: 'director',
  SCREENWRITER: 'screenwriter',
  CRITIC: 'critic',
  CINEMATOGRAPHER: 'cinematographer',
  PROMPT_COMPILER: 'promptCompiler',
  SCENE_VIDEO_GENERATION: 'sceneVideoGeneration',
  SCENE_AUDIO_GENERATION: 'sceneAudioGeneration',
  ASSET_PERSISTENCE: 'assetPersistence',
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
  const activeStages = stages || (includeMedia ? FULL_WORKFLOW_STAGES : WORKFLOW_STAGES);
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
    }

    const completedAt = new Date().toISOString();
    await supabase
      .from('workflow_executions')
      .update({
        status: 'COMPLETED',
        current_stage: 'COMPLETED',
        progress_percent: 100,
        completed_at: completedAt,
      })
      .eq('id', executionId);

    await supabase
      .from('campaigns')
      .update({ status: 'COMPLETED' })
      .eq('id', campaignId);

    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: 'WORKFLOW_COMPLETED',
      payload: { progress: 100, completedAt },
    });

    return { success: true, executionId };
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
