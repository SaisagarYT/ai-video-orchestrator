// Brand & Creative Memory data structure reference definitions.
// Concrete runtime schemas and validations are defined in schemas.js.

export const MEMORY_STRUCTURES = {
  BrandMemoryItem: 'Reusable brand rule { id, business_id, category, key, value, type, priority, status }',
  CreativeMemoryItem: 'Successful creative pattern { id, business_id, category, pattern, description, usage_count }',
  MemoryEvidence: 'Audit provenance { id, memory_item_id, memory_type, source_type, evidence }',
  MemoryConflict: 'Precedence resolution { type, memoryId, category, resolution, reason }',
  MemoryContext: 'Immutable frozen snapshot { brandId, identity, hardConstraints, softPreferences, creativePatterns }',
};
