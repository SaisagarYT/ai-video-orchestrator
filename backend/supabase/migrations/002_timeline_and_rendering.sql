-- ==============================================================================
-- AI VIDEO ORCHESTRATOR - SLICE 5: TIMELINE, RENDERING & FINAL VIDEO SCHEMA
-- ==============================================================================

-- 10. Timelines (Canonical Timeline Intermediate Representation)
CREATE TABLE IF NOT EXISTS timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    duration_ms INTEGER NOT NULL,
    output_config JSONB NOT NULL DEFAULT '{}',
    timeline_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Render Jobs (Durable Rendering Execution & Idempotency)
CREATE TABLE IF NOT EXISTS render_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    renderer TEXT NOT NULL DEFAULT 'mock',
    status TEXT NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT,
    attempt INTEGER DEFAULT 1,
    output_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_render_jobs_idemp UNIQUE(idempotency_key)
);

-- 12. Final Videos (Persisted Final Deliverable Commercial Videos with Provenance)
CREATE TABLE IF NOT EXISTS final_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,
    render_job_id UUID REFERENCES render_jobs(id) ON DELETE SET NULL,
    renderer TEXT NOT NULL,
    storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
    storage_asset_id TEXT,
    url TEXT NOT NULL,
    secure_url TEXT,
    mime_type TEXT DEFAULT 'video/mp4',
    format TEXT DEFAULT 'mp4',
    width INTEGER NOT NULL DEFAULT 1080,
    height INTEGER NOT NULL DEFAULT 1920,
    duration_ms INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for query isolation and performance
CREATE INDEX IF NOT EXISTS idx_timelines_campaign_id ON timelines(campaign_id);
CREATE INDEX IF NOT EXISTS idx_timelines_execution_id ON timelines(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_campaign_id ON render_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_execution_id ON render_jobs(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_timeline_id ON render_jobs(timeline_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_idemp ON render_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_final_videos_campaign_id ON final_videos(campaign_id);
CREATE INDEX IF NOT EXISTS idx_final_videos_execution_id ON final_videos(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_final_videos_timeline_id ON final_videos(timeline_id);
