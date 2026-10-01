import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { config } from '../config/env.js';
import { logger } from '../core/logger/logger.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from '../orchestration/events.js';
import { FrameSampler } from './frameSampler.js';
import { frameExtractor } from './frameExtractor.js';
import { visionAnalyzer } from './visionAnalyzer.js';
import { VideoUnderstandingError } from './errors.js';
import { validateVideoUnderstandingResult } from './schemas.js';
import { memoryLearningService } from '../memory/index.js';

export class VideoUnderstandingService {
  constructor(options = {}) {
    this.extractor = options.extractor || frameExtractor;
    this.analyzer = options.analyzer || visionAnalyzer;
  }

  generateIdempotencyKey(executionId, finalVideoId) {
    return `vision:${executionId}:${finalVideoId || 'default'}:v1`;
  }

  /**
   * Run full multimodal video understanding pipeline on a rendered video.
   * @param {Object} params
   * @param {string} params.campaignId
   * @param {string} params.executionId
   * @param {string} [params.stepId]
   * @param {string} [params.finalVideoId]
   * @param {Object} [params.options]
   * @returns {Promise<Object>} { run, scenes, reused }
   */
  async analyzeVideo({
    campaignId,
    executionId,
    stepId = null,
    finalVideoId = null,
    options = {},
  }) {
    if (!campaignId) {
      throw new VideoUnderstandingError('Campaign ID is required for video understanding');
    }

    const idempotencyKey = options.idempotencyKey || this.generateIdempotencyKey(executionId, finalVideoId);

    // 1. Check Idempotency Replay
    if (idempotencyKey && !options.forceRefresh) {
      const { data: existingRuns } = await supabase
        .from('video_understanding_runs')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .eq('status', 'COMPLETED')
        .limit(1);

      if (existingRuns && existingRuns.length > 0) {
        const existingRun = existingRuns[0];
        logger.info(`[VideoUnderstandingService] Reusing existing video understanding run ${existingRun.id}`);
        const { data: existingScenes } = await supabase
          .from('video_understanding_scenes')
          .select('*')
          .eq('run_id', existingRun.id)
          .order('scene_index', { ascending: true });

        return {
          run: existingRun,
          scenes: existingScenes || [],
          reused: true,
        };
      }
    }

    // 2. Fetch Campaign Context
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    // 3. Resolve Final Video
    let finalVideo = null;
    if (finalVideoId) {
      const { data: fv } = await supabase
        .from('final_videos')
        .select('*')
        .eq('id', finalVideoId)
        .maybeSingle();
      finalVideo = fv || null;
    } else if (executionId) {
      const { data: fvList } = await supabase
        .from('final_videos')
        .select('*')
        .eq('workflow_execution_id', executionId)
        .order('created_at', { ascending: false })
        .limit(1);
      finalVideo = fvList?.[0] || null;
    }

    // 4. Resolve Scenes
    let scenes = options.scenes || [];
    if (scenes.length === 0) {
      const { data: scenesData } = await supabase
        .from('scenes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sequence_number', { ascending: true });
      scenes = scenesData || [];
    }

    if (scenes.length === 0) {
      // Create minimal fallback scene representation
      scenes = [
        {
          id: 'scene-1',
          sequence_number: 1,
          shot_type: 'Full Commercial Shot',
          visual_prompt: campaign?.product_name || 'Commercial video',
          duration_seconds: campaign?.duration_seconds || 15,
        },
      ];
    }

    // 5. Initialize Run Record in Supabase
    const runId = crypto.randomUUID();
    const runRow = {
      id: runId,
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      workflow_step_id: stepId,
      final_video_asset_id: finalVideo?.asset_id || null,
      status: 'PROCESSING',
      frame_count: 0,
      scene_count: scenes.length,
      overall_confidence: 1.0,
      summary: 'Processing visual inspection...',
      dimensions: {},
      detected_issues: [],
      idempotency_key: idempotencyKey,
      metadata: {
        startedAt: new Date().toISOString(),
        videoUrl: finalVideo?.storage_url || finalVideo?.url || 'mock-video.mp4',
      },
      created_at: new Date().toISOString(),
    };

    await supabase.from('video_understanding_runs').insert(runRow);

    await recordWorkflowEvent({
      executionId,
      campaignId,
      stepId,
      eventType: WORKFLOW_EVENT_TYPES.VIDEO_UNDERSTANDING_STARTED,
      payload: { runId, finalVideoId: finalVideo?.id || null, sceneCount: scenes.length },
    });

    const tempDir = this.extractor.createTempDirectory(config.videoUnderstanding?.tempDir);

    try {
      // 6. Frame Sampling Plan
      const framesPerScene = options.framesPerScene || config.videoUnderstanding?.framesPerScene || 5;
      const samplingPlan = FrameSampler.sampleTimelineScenes({
        scenes,
        samplesPerScene: framesPerScene,
      });

      // 7. Frame Extraction
      const targetVideoPath =
        finalVideo?.local_path ||
        finalVideo?.storage_url ||
        finalVideo?.url ||
        'test-video.mp4';

      const extractedFrames = await this.extractor.extractFrames({
        videoPath: targetVideoPath,
        samplingPlan,
        tempDir,
      });

      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.VIDEO_FRAMES_EXTRACTED,
        payload: { runId, frameCount: extractedFrames.length },
      });

      // 8. Multimodal Vision Analysis
      const creativeBible = options.creativeBible || campaign?.creative_bible || {};
      const brandContext = options.brandContext || {
        product_name: campaign?.product_name,
        goal: campaign?.goal,
        target_platform: campaign?.target_platform,
      };

      const analysisResult = await this.analyzer.analyzeVideo({
        scenes,
        frames: extractedFrames,
        creativeBible,
        brandContext,
        options,
      });

      // 9. Validate Overall Result Structure
      const validated = validateVideoUnderstandingResult({
        id: runId,
        campaignId,
        workflowExecutionId: executionId,
        finalVideoId: finalVideo?.id || null,
        status: 'COMPLETED',
        frameCount: extractedFrames.length,
        sceneCount: scenes.length,
        overallConfidence: analysisResult.overallConfidence,
        summary: analysisResult.summary,
        dimensions: analysisResult.dimensions,
        detectedIssues: analysisResult.detectedIssues,
        scenes: analysisResult.scenes,
        createdAt: runRow.created_at,
        completedAt: new Date().toISOString(),
      });

      // 10. Persist Completed Run & Scenes
      await supabase
        .from('video_understanding_runs')
        .update({
          status: 'COMPLETED',
          frame_count: validated.frameCount,
          overall_confidence: validated.overallConfidence,
          summary: validated.summary,
          dimensions: validated.dimensions,
          detected_issues: validated.detectedIssues,
          completed_at: validated.completedAt,
        })
        .eq('id', runId);

      const sceneRows = validated.scenes.map((s) => ({
        id: crypto.randomUUID(),
        run_id: runId,
        scene_id: s.sceneId,
        scene_index: s.sceneIndex,
        frame_count: s.frameCount,
        confidence: s.confidence,
        dimensions: s.dimensions,
        detected_issues: s.detectedIssues,
        observations: s.observations,
        created_at: new Date().toISOString(),
      }));

      if (sceneRows.length > 0) {
        await supabase.from('video_understanding_scenes').insert(sceneRows);
      }

      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.VIDEO_UNDERSTANDING_COMPLETED,
        payload: {
          runId,
          frameCount: validated.frameCount,
          sceneCount: validated.sceneCount,
          dimensions: validated.dimensions,
          detectedIssuesCount: validated.detectedIssues.length,
        },
      });

      logger.info(
        `[VideoUnderstandingService] Completed run ${runId} for campaign ${campaignId} with ${validated.frameCount} frames across ${validated.sceneCount} scenes`
      );

      return {
        run: {
          ...runRow,
          status: 'COMPLETED',
          frame_count: validated.frameCount,
          overall_confidence: validated.overallConfidence,
          summary: validated.summary,
          dimensions: validated.dimensions,
          detected_issues: validated.detectedIssues,
          completed_at: validated.completedAt,
        },
        scenes: sceneRows,
        reused: false,
      };
    } catch (err) {
      logger.error(`[VideoUnderstandingService] Execution failed for run ${runId}: ${err.message}`);

      await supabase
        .from('video_understanding_runs')
        .update({
          status: 'FAILED',
          error_message: err.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);

      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.VIDEO_UNDERSTANDING_FAILED,
        payload: { runId, error: err.message },
      });

      if (err instanceof VideoUnderstandingError) throw err;
      throw new VideoUnderstandingError(`Video understanding execution failed: ${err.message}`, 500, 'VIDEO_UNDERSTANDING_FAILED', { cause: err });
    } finally {
      // 11. Guaranteed Temporary Frame Cleanup
      this.extractor.cleanup(tempDir);
    }
  }

  /**
   * Fetch the latest video understanding run for a campaign with sanitized fields.
   * @param {string} campaignId
   * @returns {Promise<Object|null>}
   */
  async getLatestRun(campaignId) {
    const { data: runs } = await supabase
      .from('video_understanding_runs')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!runs || runs.length === 0) {
      return null;
    }

    const run = runs[0];
    const { data: scenes } = await supabase
      .from('video_understanding_scenes')
      .select('*')
      .eq('run_id', run.id)
      .order('scene_index', { ascending: true });

    return {
      runId: run.id,
      campaignId: run.campaign_id,
      workflowExecutionId: run.workflow_execution_id,
      finalVideoId: run.final_video_asset_id,
      status: run.status,
      frameCount: run.frame_count,
      sceneCount: run.scene_count,
      overallConfidence: run.overall_confidence,
      summary: run.summary,
      dimensions: run.dimensions,
      detectedIssues: run.detected_issues || [],
      scenes: (scenes || []).map((s) => ({
        sceneId: s.scene_id,
        sceneIndex: s.scene_index,
        frameCount: s.frame_count,
        confidence: s.confidence,
        dimensions: s.dimensions,
        detectedIssues: s.detected_issues || [],
        observations: s.observations || [],
      })),
      createdAt: run.created_at,
      completedAt: run.completed_at,
    };
  }
}

export const videoUnderstandingService = new VideoUnderstandingService();
export default VideoUnderstandingService;
