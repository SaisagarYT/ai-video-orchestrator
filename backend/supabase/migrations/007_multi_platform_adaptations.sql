-- ==============================================================================
-- SLICE 10: Multi-Format & Multi-Platform Adaptation Migration
-- ==============================================================================

CREATE TABLE IF NOT EXISTS campaign_adaptations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    source_timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    source_timeline_version VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    platform_profile_version VARCHAR(50) NOT NULL DEFAULT 'v1',
    target_aspect_ratio VARCHAR(20) NOT NULL,
    target_width INT NOT NULL,
    target_height INT NOT NULL,
    target_duration_seconds NUMERIC(6, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    adaptation_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,
    render_job_id UUID REFERENCES render_jobs(id) ON DELETE SET NULL,
    final_video_id UUID REFERENCES final_videos(id) ON DELETE SET NULL,
    validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluation_id UUID REFERENCES quality_evaluations(id) ON DELETE SET NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key VARCHAR(255) UNIQUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_adaptations_campaign_id ON campaign_adaptations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adaptations_workflow_exec_id ON campaign_adaptations(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_adaptations_platform ON campaign_adaptations(platform);
CREATE INDEX IF NOT EXISTS idx_adaptations_status ON campaign_adaptations(status);
CREATE INDEX IF NOT EXISTS idx_adaptations_idempotency ON campaign_adaptations(idempotency_key);
