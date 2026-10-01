/**
 * Brand & Creative Memory System JSDoc Type Definitions
 * @module memory/types
 */

/**
 * @typedef {Object} BrandMemoryItem
 * @property {string} id - Unique identifier (UUID)
 * @property {string} business_id - Associated business / brand ID (UUID)
 * @property {string} category - Category enum from BRAND_MEMORY_CATEGORIES
 * @property {string} key - Unique key within the business/category scope
 * @property {any} value - Stored value (scalar, array, or object)
 * @property {string} [value_type='string'] - Type description ('string'|'array'|'object'|'boolean'|'number')
 * @property {'HARD_CONSTRAINT'|'SOFT_PREFERENCE'} type - Constraint classification
 * @property {number} priority - Priority value (1-100)
 * @property {number} confidence - Confidence score (0.00-1.00)
 * @property {'ACTIVE'|'DISABLED'|'PENDING_REVIEW'|'ARCHIVED'} status - Lifecycle state
 * @property {'USER_DEFINED'|'CAMPAIGN'|'REVISION'|'EVALUATION'|'IMPORTED'|'SYSTEM'} source - Origin provenance
 * @property {string} [source_id] - Reference identifier for source (campaign ID, revision ID, etc.)
 * @property {string} [idempotency_key] - Deterministic deduplication key
 * @property {Record<string, any>} [metadata] - Arbitrary structured metadata
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} CreativeMemoryItem
 * @property {string} id - Unique identifier (UUID)
 * @property {string} business_id - Associated business / brand ID (UUID)
 * @property {string} [campaign_id] - Provenance campaign ID (UUID)
 * @property {string} category - Category enum from CREATIVE_MEMORY_CATEGORIES
 * @property {string} pattern - Short name or descriptor of the pattern
 * @property {string} [description] - Detailed explanation of when and how to apply
 * @property {Array<string>} [constraints] - Concrete guardrails or conditions
 * @property {string} [evidence_summary] - Human-readable rationale for why this exists
 * @property {number} confidence - Confidence score (0.00-1.00)
 * @property {number} usage_count - Times applied in campaigns
 * @property {number} approval_count - Times approved by users or passed evaluation
 * @property {number} rejection_count - Times rejected or revised away
 * @property {'ACTIVE'|'DISABLED'|'PENDING_REVIEW'|'ARCHIVED'} status - Lifecycle state
 * @property {'USER_DEFINED'|'CAMPAIGN'|'REVISION'|'EVALUATION'|'IMPORTED'|'SYSTEM'} source - Provenance
 * @property {string} [source_id] - Source reference ID
 * @property {string} [idempotency_key] - Deterministic deduplication key
 * @property {Record<string, any>} [metadata] - Additional metadata
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} MemoryEvidence
 * @property {string} id - Unique identifier (UUID)
 * @property {string} memory_item_id - Related brand or creative memory item ID
 * @property {'BRAND_MEMORY'|'CREATIVE_MEMORY'} memory_type - Target entity type
 * @property {string} source_type - Provenance source type
 * @property {string} [source_id] - Source record identifier
 * @property {string} evidence - Audit string explaining why this item exists or was updated
 * @property {number} confidence - Confidence at time of recording
 * @property {Record<string, any>} [metadata] - Supplemental details
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} MemoryConflict
 * @property {'CAMPAIGN_OVERRIDE'|'POLICY_CONFLICT'|'INCOMPATIBLE_PREFERENCE'} type
 * @property {string} memoryId - Brand memory item ID
 * @property {string} category - Memory category
 * @property {string} memoryKey - Memory item key
 * @property {any} memoryValue - Stored brand constraint/preference value
 * @property {any} campaignInstruction - Current campaign explicit instruction value
 * @property {string} resolution - E.g. 'CAMPAIGN_EXPLICIT_PRECEDENCE'
 * @property {string} reason - Human-readable explanation of why campaign explicit won
 */

/**
 * @typedef {Object} MemoryContext
 * @property {string} brandId - Business / brand ID
 * @property {Record<string, any>} identity - Core brand identity profile
 * @property {Array<BrandMemoryItem>} hardConstraints - Active hard rules
 * @property {Array<BrandMemoryItem>} softPreferences - Active soft style/tone preferences
 * @property {Array<BrandMemoryItem>} negativeConstraints - Active negative guardrails
 * @property {Array<CreativeMemoryItem>} relevantCreativePatterns - Filtered reusable patterns
 * @property {Array<MemoryConflict>} conflicts - Detected conflicts between brand memory and campaign instructions
 * @property {string} snapshotTimestamp - ISO timestamp of when this context was retrieved & frozen
 * @property {Record<string, any>} [metadata] - Additional execution context
 */

