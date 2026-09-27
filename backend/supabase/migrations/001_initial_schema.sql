-- ==============================================================================
-- AI VIDEO ORCHESTRATOR - CANONICAL SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'creator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    target_audience TEXT,
    tone_of_voice TEXT,
    brand_colors TEXT,
    brand_guidelines TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    goal TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_summary TEXT,
    unique_points TEXT,
    call_to_action TEXT,
    target_platform TEXT DEFAULT 'tiktok',
    aspect_ratio TEXT DEFAULT '9:16',
    duration_seconds INTEGER DEFAULT 30,
    status TEXT DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scenes
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    shot_type TEXT,
    camera_movement TEXT,
    visual_prompt TEXT,
    audio_narration TEXT,
    duration_seconds NUMERIC DEFAULT 5,
    lighting_atmosphere TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Workflow Executions
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key TEXT,
    status TEXT DEFAULT 'QUEUED',
    current_stage TEXT DEFAULT 'INIT',
    progress_percent INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_workflow_executions_user_idemp UNIQUE(user_id, idempotency_key)
);

-- 6. Workflow Steps
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING',
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    output_artifact JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Workflow Events
CREATE TABLE IF NOT EXISTS workflow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Provider Jobs (Slice 4 Media Job Tracking)
CREATE TABLE IF NOT EXISTS provider_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    scene_id TEXT,
    provider TEXT NOT NULL,
    provider_job_id TEXT,
    media_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    attempt INTEGER DEFAULT 1,
    idempotency_key TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_provider_jobs_idemp UNIQUE(idempotency_key)
);

-- 9. Assets (Slice 4 Durable Media Assets with Provenance)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    scene_id TEXT,
    asset_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_asset_id TEXT,
    storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
    storage_asset_id TEXT,
    url TEXT NOT NULL,
    secure_url TEXT,
    mime_type TEXT,
    format TEXT,
    duration_ms INTEGER,
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & query isolation
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_campaign_id ON scenes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_executions_campaign_id ON workflow_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_steps_execution_id ON workflow_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_events_campaign_id ON workflow_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_execution_id ON workflow_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_provider_jobs_execution_id ON provider_jobs(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_provider_jobs_idemp ON provider_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_assets_campaign_id ON assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_assets_scene_id ON assets(scene_id);
