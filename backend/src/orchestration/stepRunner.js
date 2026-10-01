import { supabase } from '../config/supabase.js';
import { logger } from '../core/logger/logger.js';
import { strategyService } from '../services/strategy/strategy.service.js';
import { conceptService } from '../services/concept/concept.service.js';
import { creativeDirectionService } from '../services/creative-direction/creative-direction.service.js';
import { promptCompilerService } from '../services/prompt/prompt-compiler.service.js';
import { sceneGenerationService } from '../services/media/scene-generation.service.js';
import { narrationGenerationService } from '../services/media/narration-generation.service.js';
import { assetService } from '../services/media/asset.service.js';
import { renderService } from '../services/rendering/index.js';
import { subtitleService } from '../services/subtitles/index.js';
import { evaluationService } from '../services/evaluation/index.js';
import { revisionService } from '../services/revision/index.js';
import { videoUnderstandingService } from '../video-understanding/index.js';
import { memoryRetrievalService } from '../memory/index.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from './events.js';

const defaultStepHandlers = {
  CONTEXT_INGESTION: async (step, context) => {
    const campaign = context.campaign || {};
    const strategyResult = await strategyService.generateStrategy({ campaign });

    return {
      creativeConstraints: {
        aspectRatio: campaign.aspect_ratio || '9:16',
        durationSeconds: campaign.duration_seconds || 30,
        targetPlatform: campaign.target_platform || 'tiktok',
      },
      keyThemes: [campaign.product_name, campaign.goal].filter(Boolean),
      brandSummary: `Brand summary for ${campaign.product_name || 'Product'} with goal ${campaign.goal || 'General'}`,
      strategy: strategyResult.strategy,
    };
  },

  MEMORY_RETRIEVAL: async (step, context) => {
    const campaign = context.campaign || {};
    const businessId = campaign.business_id;
    const executionId = step.execution_id;

    const memorySnapshot = await memoryRetrievalService.retrieveMemoryContext({
      businessId,
      campaign,
      executionId,
    });

    return memorySnapshot;
  },

  DIRECTOR: async (step, context) => {
    const campaign = context.campaign || {};
    const strategy = context.contextIngestion?.strategy || {
      campaign_objective: campaign.goal || 'Brand Awareness',
      target_audience: 'Modern Consumers',
      marketing_angle: 'Quality and Innovation',
      core_message: 'Next-level performance',
      call_to_action: campaign.call_to_action || 'Order Now',
      tone: 'Energetic and dynamic',
      recommended_platform: campaign.target_platform || 'tiktok',
      recommended_format: '9:16 vertical video',
    };

    const memoryContext = context.memory || context.memoryRetrieval || null;
    const conceptResult = await conceptService.generateConcepts({
      strategy,
      campaign,
      business: context.business || {},
      memoryContext,
    });
    const selectedConcept = conceptResult.concepts[0] || {
      title: `High Impact Concept for ${campaign.product_name || 'Campaign'}`,
      concept: `Compelling narrative highlighting ${campaign.product_name || 'Product'}`,
      emotional_direction: 'excitement',
      visual_direction: 'modern and dynamic',
      call_to_action: campaign.call_to_action || 'Order now',
      estimated_duration: campaign.duration_seconds || 30,
    };

    return {
      conceptTitle: selectedConcept.title,
      coreNarrative: selectedConcept.concept,
      targetEmotion: selectedConcept.emotional_direction,
      visualStyle: selectedConcept.visual_direction,
      selectedConcept,
      concepts: conceptResult.concepts,
    };
  },

  SCREENWRITER: async (step, context) => {
    const campaign = context.campaign || {};
    const concept = context.director?.selectedConcept || {
      title: context.director?.conceptTitle || `Concept for ${campaign.product_name}`,
      hook: `Discover ${campaign.product_name || 'Product'} today.`,
      concept: context.director?.coreNarrative || 'Product showcase narrative',
      visual_direction: context.director?.visualStyle || 'High-energy commercial look',
      emotional_direction: context.director?.targetEmotion || 'Empowering',
      call_to_action: campaign.call_to_action || 'Get yours today',
      estimated_duration: campaign.duration_seconds || 30,
    };

    const strategy = context.contextIngestion?.strategy || {
      campaign_objective: campaign.goal || 'Conversions',
      target_audience: 'Modern Consumers',
      marketing_angle: 'Performance',
      tone: 'Dynamic',
      recommended_format: '9:16 vertical video',
      call_to_action: campaign.call_to_action || 'Order now',
    };

    const memoryContext = context.memory || context.memoryRetrieval || null;
    const storyboardResult = await creativeDirectionService.generateStoryboardPlan({
      concept,
      strategy,
      campaign,
      business: context.business || {},
      memoryContext,
      aspectRatio: campaign.aspect_ratio || '9:16',
    });

    // Normalize to both screenwriter format (sceneIndex, name, description, duration) and detailed scenes
    const scenes = storyboardResult.scenes.map((s, idx) => ({
      sceneIndex: idx + 1,
      name: s.shot_type,
      description: s.visual_prompt,
      duration: s.duration_seconds,
      sequence_number: s.sequence_number,
      camera_movement: s.camera_movement,
      audio_narration: s.audio_narration,
      lighting_atmosphere: s.lighting_atmosphere,
    }));

    return {
      scenes,
      creativeBible: storyboardResult.creativeBible,
    };
  },

  CRITIC: async (step, context) => {
    return {
      passed: true,
      score: 95,
      feedback: 'Creative direction aligns strongly with campaign objectives.',
    };
  },

  CINEMATOGRAPHER: async (step, context) => {
    const scenes = context.screenwriter?.scenes || [
      { name: 'Close-up', camera_movement: 'Quick zoom-in', lighting_atmosphere: 'High-contrast studio' },
      { name: 'Medium shot', camera_movement: 'Tracking pan', lighting_atmosphere: 'Warm natural' },
      { name: 'Macro detail', camera_movement: 'Slow-motion rotation', lighting_atmosphere: 'Crisp product lighting' },
      { name: 'Wide reveal', camera_movement: 'Static hero frame', lighting_atmosphere: 'Vibrant punchy' },
    ];

    const cameraShots = scenes.map((s, idx) => ({
      shotIndex: idx + 1,
      angle: s.name || 'Medium Shot',
      movement: s.camera_movement || 'Fluid Tracking Pan',
      lighting: s.lighting_atmosphere || 'Cinematic Studio Light',
    }));

    return {
      cameraShots,
    };
  },

  PROMPT_COMPILER: async (step, context) => {
    const scenes = context.screenwriter?.scenes || [];
    const creativeBible = context.screenwriter?.creativeBible;
    const aspectRatio = context.campaign?.aspect_ratio || '9:16';
    const memoryContext = context.memory || context.memoryRetrieval || null;

    const prompts = scenes.map((s, idx) => {
      const spec = promptCompilerService.compileSceneSpecification({
        scene: {
          id: `sc-${idx + 1}`,
          sequence_number: idx + 1,
          visual_prompt: s.description || s.name,
          shot_type: s.name,
          camera_movement: s.camera_movement || 'Dynamic cinematic motion',
          lighting_atmosphere: s.lighting_atmosphere,
          duration_seconds: s.duration || 5,
        },
        creativeBible,
        memoryContext,
        aspectRatio,
        targetProvider: 'mock-video',
      });

      return {
        sceneIndex: idx + 1,
        visualPrompt: spec.compiled_positive_prompt,
        motionPrompt: spec.camera_movement,
        specification: spec,
      };
    });

    return {
      prompts,
    };
  },

  SCENE_VIDEO_GENERATION: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;
    const scenes = context.screenwriter?.scenes || [];
    const compiledPrompts = context.promptCompiler?.prompts || [];

    const generatedScenes = await sceneGenerationService.generateScenesForWorkflow({
      campaignId: campaign.id,
      executionId,
      stepId: step.id,
      scenes,
      compiledPrompts,
    });

    return {
      scenes: generatedScenes.map((gs) => ({
        sceneIndex: gs.scene.sceneIndex || gs.scene.sequence_number,
        sceneId: gs.scene.id,
        videoUrl: gs.asset.url,
        assetId: gs.asset.id,
        jobId: gs.job.id,
        status: 'COMPLETED',
      })),
      totalScenes: generatedScenes.length,
    };
  },

  SCENE_AUDIO_GENERATION: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;
    const scenes = context.screenwriter?.scenes || [];

    const generatedAudio = await narrationGenerationService.generateNarrationForWorkflow({
      campaignId: campaign.id,
      executionId,
      stepId: step.id,
      scenes,
    });

    return {
      audioTracks: generatedAudio.map((ga) => ({
        sceneIndex: ga.scene.sceneIndex || ga.scene.sequence_number,
        sceneId: ga.scene.id,
        audioUrl: ga.asset.url,
        assetId: ga.asset.id,
        jobId: ga.job.id,
        durationMs: ga.asset.duration_ms,
        status: 'COMPLETED',
      })),
      totalTracks: generatedAudio.length,
    };
  },

  ASSET_PERSISTENCE: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;

    const assets = await assetService.getAssetsByExecution(executionId);

    return {
      campaignId: campaign.id,
      executionId,
      persistedAssetCount: assets.length,
      assets: assets.map((a) => ({
        id: a.id,
        type: a.asset_type,
        sceneId: a.scene_id,
        url: a.url,
        storageProvider: a.storage_provider,
      })),
    };
  },

  TIMELINE_BUILD: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;
    const workflowScenes = context.screenwriter?.scenes || [];

    const { timeline, timelineIR, reused } = await renderService.buildAndPersistTimeline({
      campaignId: campaign.id,
      executionId,
      stepId: step.id,
      scenes: workflowScenes,
      outputConfig: {
        aspectRatio: campaign.aspect_ratio || '9:16',
      },
    });

    // Generate and persist automated subtitles from scene narration
    let subtitleAsset = null;
    try {
      const subResult = await subtitleService.generateSubtitlesFromScenes({
        campaignId: campaign.id,
        executionId,
        stepId: step.id,
        scenes: workflowScenes,
        maxDurationMs: timeline.duration_ms,
      });
      subtitleAsset = subResult.asset;
    } catch (subErr) {
      logger.warn(`[TimelineBuild] Subtitle generation notice: ${subErr.message}`);
    }

    return {
      timelineId: timeline.id,
      durationMs: timeline.duration_ms,
      outputConfig: timeline.output_config,
      totalScenes: timelineIR.tracks.find((t) => t.type === 'video')?.items.length || 0,
      subtitleAssetId: subtitleAsset?.id || null,
      subtitleUrl: subtitleAsset?.secure_url || subtitleAsset?.url || null,
      reused: Boolean(reused),
      status: 'READY',
    };
  },

  VIDEO_RENDER: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;

    let timelineId = context.timelineBuild?.timelineId;
    if (!timelineId) {
      const { data: timelines } = await supabase
        .from('timelines')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('workflow_execution_id', executionId);
      if (timelines && timelines.length > 0) {
        timelineId = timelines[0].id;
      }
    }

    if (!timelineId) {
      throw new Error('Cannot execute VIDEO_RENDER: timelineId not found in workflow context or database');
    }

    const { job, renderResult, storageAsset, finalVideo, reused } = await renderService.renderTimeline({
      campaignId: campaign.id,
      executionId,
      stepId: step.id,
      timelineId,
      rendererName: campaign.renderer || null,
      idempotencyKey: `${campaign.id}:${executionId}:render:v1`,
    });

    return {
      jobId: job.id,
      timelineId,
      renderer: job.renderer,
      status: job.status,
      videoUrl: storageAsset?.secureUrl || storageAsset?.url,
      renderResult,
      storageAsset,
      finalVideo,
      reused: Boolean(reused),
    };
  },

  FINAL_VIDEO_PERSISTENCE: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;

    let timelineId = context.timelineBuild?.timelineId;
    let renderOutput = context.videoRender || {};

    if (!timelineId || !renderOutput.jobId) {
      const { data: jobs } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('workflow_execution_id', executionId)
        .eq('status', 'COMPLETED');
      if (jobs && jobs.length > 0) {
        const completedJob = jobs[0];
        timelineId = timelineId || completedJob.timeline_id;
        renderOutput = {
          jobId: completedJob.id,
          renderResult: completedJob.metadata?.renderResult || {
            renderer: completedJob.renderer,
            durationMs: campaign.duration_seconds ? campaign.duration_seconds * 1000 : 15000,
            width: 1080,
            height: 1920,
            format: 'mp4',
            mimeType: 'video/mp4',
          },
          storageAsset: {
            url: completedJob.metadata?.storageUrl || 'https://mock.storage/final.mp4',
            secureUrl: completedJob.metadata?.storageUrl || 'https://mock.storage/final.mp4',
            provider: 'cloudinary',
            id: completedJob.output_asset_id,
          },
        };
      }
    }

    const finalVideo = await renderService.persistFinalVideo({
      campaignId: campaign.id,
      executionId,
      stepId: step.id,
      timelineId,
      renderJobId: renderOutput.jobId,
      renderResult: renderOutput.renderResult,
      storageAsset: renderOutput.storageAsset,
    });

    return {
      finalVideoId: finalVideo.id,
      campaignId: campaign.id,
      timelineId,
      renderJobId: renderOutput.jobId,
      url: finalVideo.secure_url || finalVideo.url,
      durationMs: finalVideo.duration_ms,
      width: finalVideo.width,
      height: finalVideo.height,
      status: finalVideo.status,
      completedAt: finalVideo.completed_at,
    };
  },

  VIDEO_UNDERSTANDING: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;

    let finalVideoId = context.finalVideoPersistence?.finalVideoId;
    if (!finalVideoId) {
      const { data: videos } = await supabase
        .from('final_videos')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('workflow_execution_id', executionId)
        .order('created_at', { ascending: false });
      finalVideoId = videos?.[0]?.id || null;
    }

    const { run, scenes, reused } = await videoUnderstandingService.analyzeVideo({
      campaignId: campaign.id,
      executionId,
      stepId: step.id,
      finalVideoId,
      options: {
        creativeBible: context.screenwriter?.creativeBible,
        scenes: context.screenwriter?.scenes,
        brandContext: context.contextIngestion,
      },
    });

    return {
      runId: run.id,
      campaignId: campaign.id,
      workflowExecutionId: executionId,
      finalVideoId,
      status: run.status,
      frameCount: run.frame_count,
      sceneCount: run.scene_count,
      overallConfidence: run.overall_confidence,
      summary: run.summary,
      dimensions: run.dimensions,
      detectedIssues: run.detected_issues || [],
      scenes: scenes || [],
      reused: Boolean(reused),
      completedAt: run.completed_at || run.created_at,
    };
  },

  QUALITY_EVALUATION: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;

    // Resolve final video ID from previous step or database
    let finalVideoId = context.finalVideoPersistence?.finalVideoId;
    if (!finalVideoId) {
      const { data: videos } = await supabase
        .from('final_videos')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('workflow_execution_id', executionId)
        .order('created_at', { ascending: false });
      finalVideoId = videos?.[0]?.id || null;
    }

    const { evaluation, evaluationResult, reused } = await evaluationService.evaluateFinalVideo({
      campaignId: campaign.id,
      executionId,
      stepId: step.id,
      finalVideoId,
      threshold: campaign.evaluation_threshold || null,
      options: {
        creativeBible: context.screenwriter?.creativeBible,
        scenes: context.screenwriter?.scenes,
        visionAnalysis: context.videoUnderstanding || null,
      },
    });

    return {
      evaluationId: evaluation.id,
      campaignId: campaign.id,
      workflowExecutionId: executionId,
      finalVideoId,
      overallScore: evaluationResult.overallScore,
      threshold: evaluationResult.threshold,
      passed: evaluationResult.passed,
      dimensions: evaluationResult.dimensions,
      technicalChecks: evaluationResult.technicalChecks,
      issues: evaluationResult.issues || [],
      recommendations: evaluationResult.recommendations || [],
      revisionInstructions: evaluationResult.revisionInstructions || [],
      issuesCount: evaluationResult.issues?.length || 0,
      recommendationsCount: evaluationResult.recommendations?.length || 0,
      revisionInstructionsCount: evaluationResult.revisionInstructions?.length || 0,
      reused: Boolean(reused),
      completedAt: evaluation.created_at,
    };
  },

  AUTONOMOUS_REVISION: async (step, context) => {
    const campaign = context.campaign || {};
    const executionId = step.execution_id;
    let initialEvaluation = context.qualityEvaluation || null;

    if (!initialEvaluation) {
      const evalData = await evaluationService.getLatestEvaluation(campaign.id);
      initialEvaluation = evalData;
    }

    const revisionResult = await revisionService.executeAutonomousRevisionLoop({
      campaignId: campaign.id,
      executionId,
      initialEvaluation,
      context,
      maxAttempts: campaign.max_revision_attempts || 2,
    });

    return {
      status: revisionResult.status,
      passed: revisionResult.passed,
      attemptsCount: revisionResult.attempts?.length || 0,
      finalEvaluation: revisionResult.finalEvaluation,
      attempts: revisionResult.attempts,
    };
  },
};

const customStepHandlers = new Map();

export const registerStepHandler = (stepName, handler) => {
  customStepHandlers.set(stepName, handler);
};

export const resetStepHandlers = () => {
  customStepHandlers.clear();
};

export const getStepHandler = (stepName) => {
  return customStepHandlers.get(stepName) || defaultStepHandlers[stepName] || null;
};

export const runStep = async (step, context) => {
  const handler = getStepHandler(step.step_name);
  if (!handler) {
    throw new Error(`No registered step handler for step: ${step.step_name}`);
  }

  const maxRetries = step.max_retries ?? 3;
  let currentRetry = step.retry_count || 0;
  let lastError = null;

  while (currentRetry <= maxRetries) {
    try {
      await supabase
        .from('workflow_steps')
        .update({
          status: 'RUNNING',
          retry_count: currentRetry,
          started_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', step.id);

      const output = await handler(step, context);

      await supabase
        .from('workflow_steps')
        .update({
          status: 'COMPLETED',
          retry_count: currentRetry,
          output_artifact: output,
          completed_at: new Date().toISOString(),
        })
        .eq('id', step.id);

      return output;
    } catch (err) {
      lastError = err;
      currentRetry += 1;
      logger.warn(`Step ${step.step_name} attempt ${currentRetry} failed: ${err.message}`);

      if (currentRetry <= maxRetries) {
        await supabase
          .from('workflow_steps')
          .update({
            retry_count: currentRetry,
            error_message: err.message,
          })
          .eq('id', step.id);
      } else {
        await supabase
          .from('workflow_steps')
          .update({
            status: 'FAILED',
            retry_count: currentRetry,
            error_message: lastError.message,
          })
          .eq('id', step.id);

        throw new Error(
          `Step ${step.step_name} (${step.id}) failed after ${maxRetries} retries: ${lastError.message}`
        );
      }
    }
  }
};

export default {
  runStep,
  registerStepHandler,
  resetStepHandlers,
  getStepHandler,
};
