-- ============================================================================
-- Migration 006: Brand & Creative Memory System
-- ============================================================================

-- 1. Brand Memory Items
CREATE TABLE IF NOT EXISTS brand_memory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string',
  type TEXT NOT NULL DEFAULT 'SOFT_PREFERENCE',
  priority INTEGER NOT NULL DEFAULT 50,
  confidence NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  source TEXT NOT NULL DEFAULT 'USER_DEFINED',
  source_id TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Creative Memory Items
CREATE TABLE IF NOT EXISTS creative_memory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  pattern TEXT NOT NULL,
  description TEXT,
  constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_summary TEXT,
  confidence NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  approval_count INTEGER NOT NULL DEFAULT 0,
  rejection_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  source TEXT NOT NULL DEFAULT 'USER_DEFINED',
  source_id TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Memory Evidence
CREATE TABLE IF NOT EXISTS memory_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_item_id UUID NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'BRAND_MEMORY',
  source_type TEXT NOT NULL,
  source_id TEXT,
  evidence TEXT NOT NULL,
  confidence NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_brand_memory_business ON brand_memory_items(business_id);
CREATE INDEX IF NOT EXISTS idx_brand_memory_category ON brand_memory_items(category);
CREATE INDEX IF NOT EXISTS idx_brand_memory_status ON brand_memory_items(status);
CREATE INDEX IF NOT EXISTS idx_brand_memory_priority ON brand_memory_items(priority);
CREATE INDEX IF NOT EXISTS idx_brand_memory_key ON brand_memory_items(key);
CREATE INDEX IF NOT EXISTS idx_brand_memory_idempotency ON brand_memory_items(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_creative_memory_business ON creative_memory_items(business_id);
CREATE INDEX IF NOT EXISTS idx_creative_memory_campaign ON creative_memory_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creative_memory_category ON creative_memory_items(category);
CREATE INDEX IF NOT EXISTS idx_creative_memory_status ON creative_memory_items(status);
CREATE INDEX IF NOT EXISTS idx_creative_memory_idempotency ON creative_memory_items(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_memory_evidence_item ON memory_evidence(memory_item_id);
CREATE INDEX IF NOT EXISTS idx_memory_evidence_source ON memory_evidence(source_type, source_id);

