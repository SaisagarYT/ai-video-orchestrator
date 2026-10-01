-- ============================================================================
-- Migration 005: Multimodal Video Understanding & Visual Quality Validation
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_understanding_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  final_video_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  frame_count INTEGER NOT NULL DEFAULT 0,
  scene_count INTEGER NOT NULL DEFAULT 0,
  overall_confidence NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  summary TEXT,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key TEXT UNIQUE,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS video_understanding_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES video_understanding_runs(id) ON DELETE CASCADE,
  scene_id TEXT NOT NULL,
  scene_index INTEGER NOT NULL,
  frame_count INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_video_understanding_runs_campaign ON video_understanding_runs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_video_understanding_runs_execution ON video_understanding_runs(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_video_understanding_runs_idempotency ON video_understanding_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_video_understanding_scenes_run ON video_understanding_scenes(run_id);
CREATE INDEX IF NOT EXISTS idx_video_understanding_scenes_scene ON video_understanding_scenes(scene_id);
