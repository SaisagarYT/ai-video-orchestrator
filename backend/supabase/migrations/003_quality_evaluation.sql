-- ==============================================================================
-- AI VIDEO ORCHESTRATOR - SLICE 6: QUALITY EVALUATIONS SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS quality_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    final_video_id UUID REFERENCES final_videos(id) ON DELETE SET NULL,
    evaluation_version TEXT NOT NULL DEFAULT '1.0',
    overall_score NUMERIC(4, 2) NOT NULL,
    threshold NUMERIC(4, 2) NOT NULL DEFAULT 7.50,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    dimensions JSONB NOT NULL DEFAULT '{}',
    technical_checks JSONB NOT NULL DEFAULT '{}',
    issues JSONB NOT NULL DEFAULT '[]',
    recommendations JSONB NOT NULL DEFAULT '[]',
    revision_instructions JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and query isolation
CREATE INDEX IF NOT EXISTS idx_quality_evaluations_campaign_id ON quality_evaluations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_quality_evaluations_execution_id ON quality_evaluations(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_quality_evaluations_final_video_id ON quality_evaluations(final_video_id);
