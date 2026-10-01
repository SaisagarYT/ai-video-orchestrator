-- ==============================================================================
-- AI VIDEO ORCHESTRATOR - SLICE 7: AUTONOMOUS REVISION & PROMPT SELF-HEALING SCHEMA
-- ==============================================================================

-- 1. Revision Attempts (Durable Tracking of Revision Loops & Crash Recovery)
CREATE TABLE IF NOT EXISTS revision_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    evaluation_id UUID REFERENCES quality_evaluations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    diagnostics JSONB DEFAULT '{}',
    affected_scene_ids JSONB DEFAULT '[]',
    timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,
    final_video_id UUID REFERENCES final_videos(id) ON DELETE SET NULL,
    subsequent_evaluation_id UUID REFERENCES quality_evaluations(id) ON DELETE SET NULL,
    passed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_revision_execution_attempt UNIQUE(workflow_execution_id, attempt_number)
);

-- 2. Revision Targets (Scene-level Prompt Self-Healing & Asset Provenance Tracking)
CREATE TABLE IF NOT EXISTS revision_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_attempt_id UUID NOT NULL REFERENCES revision_attempts(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    scene_id TEXT NOT NULL,
    scene_index INTEGER,
    original_prompt TEXT NOT NULL,
    healed_prompt TEXT NOT NULL,
    applied_operations JSONB NOT NULL DEFAULT '[]',
    explanation TEXT,
    previous_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    new_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance, isolation, and query efficiency
CREATE INDEX IF NOT EXISTS idx_revision_attempts_campaign_id ON revision_attempts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_revision_attempts_execution_id ON revision_attempts(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_revision_attempts_evaluation_id ON revision_attempts(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_revision_targets_attempt_id ON revision_targets(revision_attempt_id);
CREATE INDEX IF NOT EXISTS idx_revision_targets_scene_id ON revision_targets(scene_id);
CREATE INDEX IF NOT EXISTS idx_revision_targets_campaign_id ON revision_targets(campaign_id);
