import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { logger } from '../core/logger/logger.js';
import {
  brandMemoryItemSchema,
  creativeMemoryItemSchema,
  memoryEvidenceSchema,
} from './schemas.js';
import { MemoryNotFoundError, MemoryConflictError } from './errors.js';
import { MEMORY_STATUS } from './memory.constants.js';

export class MemoryRepository {
  /**
   * ==========================================
   * BRAND MEMORY ITEMS
   * ==========================================
   */

  async createBrandMemoryItem(payload, evidenceText = null) {
    const validated = brandMemoryItemSchema.parse({
      ...payload,
      id: payload.id || crypto.randomUUID(),
      created_at: payload.created_at || new Date().toISOString(),
      updated_at: payload.updated_at || new Date().toISOString(),
    });

    // Check idempotency key if provided
    if (validated.idempotency_key) {
      const { data: existing } = await supabase
        .from('brand_memory_items')
        .select('*')
        .eq('business_id', validated.business_id)
        .eq('idempotency_key', validated.idempotency_key)
        .maybeSingle();

      if (existing) {
        return { item: existing, isExisting: true };
      }
    }

    // Deduplication check: check if an ACTIVE memory with same (business_id, category, key) already exists
    const { data: duplicateKeyItem } = await supabase
      .from('brand_memory_items')
      .select('*')
      .eq('business_id', validated.business_id)
      .eq('category', validated.category)
      .eq('key', validated.key)
      .eq('status', MEMORY_STATUS.ACTIVE)
      .maybeSingle();

    if (duplicateKeyItem) {
      // If same value, reuse existing
      if (JSON.stringify(duplicateKeyItem.value) === JSON.stringify(validated.value)) {
        return { item: duplicateKeyItem, isExisting: true };
      }
      // If updating existing active rule with new value, update it cleanly
      const updated = await this.updateBrandMemoryItem(
        duplicateKeyItem.id,
        {
          value: validated.value,
          priority: validated.priority,
          confidence: validated.confidence,
          source: validated.source,
          source_id: validated.source_id,
        },
        evidenceText || `Updated existing rule for key '${validated.key}'`
      );
      return { item: updated, isExisting: false, wasUpdated: true };
    }

    const { data, error } = await supabase
      .from('brand_memory_items')
      .insert(validated)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505' && validated.idempotency_key) {
        const { data: existing } = await supabase
          .from('brand_memory_items')
          .select('*')
          .eq('idempotency_key', validated.idempotency_key)
          .single();
        if (existing) return { item: existing, isExisting: true };
      }
      throw error;
    }

    const item = data || validated;

    // Record provenance audit evidence if text provided or by default
    if (evidenceText || item.source) {
      await this.recordEvidence({
        memory_item_id: item.id,
        memory_type: 'BRAND_MEMORY',
        source_type: item.source,
        source_id: item.source_id,
        evidence: evidenceText || `Initial creation of brand memory item '${item.key}' via ${item.source}`,
        confidence: item.confidence,
      });
    }

    logger.debug(`[MemoryRepository] Created brand memory item: ${item.id} (${item.key})`);
    return { item, isExisting: false };
  }

  async getBrandMemoryItem(id) {
    const { data, error } = await supabase
      .from('brand_memory_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new MemoryNotFoundError(`Brand memory item ${id} not found`);
    }
    return data;
  }

  async listBrandMemoryItems(businessId, filters = {}) {
    let query = supabase
      .from('brand_memory_items')
      .select('*')
      .eq('business_id', businessId);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query.order('priority', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateBrandMemoryItem(id, updates, evidenceText = null) {
    const existing = await this.getBrandMemoryItem(id);

    const merged = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const validated = brandMemoryItemSchema.parse(merged);

    const { data, error } = await supabase
      .from('brand_memory_items')
      .update(validated)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    if (evidenceText) {
      await this.recordEvidence({
        memory_item_id: id,
        memory_type: 'BRAND_MEMORY',
        source_type: validated.source || existing.source,
        source_id: validated.source_id || existing.source_id,
        evidence: evidenceText,
        confidence: validated.confidence,
      });
    }

    return data || validated;
  }

  async archiveBrandMemoryItem(id, reason = 'Archived by user') {
    return this.updateBrandMemoryItem(
      id,
      { status: MEMORY_STATUS.ARCHIVED },
      reason
    );
  }

  /**
   * ==========================================
   * CREATIVE MEMORY ITEMS
   * ==========================================
   */

  async createCreativeMemoryItem(payload, evidenceText = null) {
    const validated = creativeMemoryItemSchema.parse({
      ...payload,
      id: payload.id || crypto.randomUUID(),
      created_at: payload.created_at || new Date().toISOString(),
      updated_at: payload.updated_at || new Date().toISOString(),
    });

    if (validated.idempotency_key) {
      const { data: existing } = await supabase
        .from('creative_memory_items')
        .select('*')
        .eq('business_id', validated.business_id)
        .eq('idempotency_key', validated.idempotency_key)
        .maybeSingle();

      if (existing) {
        return { item: existing, isExisting: true };
      }
    }

    // Deduplicate by business_id + category + pattern
    const { data: duplicatePattern } = await supabase
      .from('creative_memory_items')
      .select('*')
      .eq('business_id', validated.business_id)
      .eq('category', validated.category)
      .eq('pattern', validated.pattern)
      .eq('status', MEMORY_STATUS.ACTIVE)
      .maybeSingle();

    if (duplicatePattern) {
      return { item: duplicatePattern, isExisting: true };
    }

    const { data, error } = await supabase
      .from('creative_memory_items')
      .insert(validated)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505' && validated.idempotency_key) {
        const { data: existing } = await supabase
          .from('creative_memory_items')
          .select('*')
          .eq('idempotency_key', validated.idempotency_key)
          .single();
        if (existing) return { item: existing, isExisting: true };
      }
      throw error;
    }

    const item = data || validated;

    if (evidenceText || item.evidence_summary) {
      await this.recordEvidence({
        memory_item_id: item.id,
        memory_type: 'CREATIVE_MEMORY',
        source_type: item.source,
        source_id: item.source_id,
        evidence: evidenceText || item.evidence_summary || `Created creative pattern '${item.pattern}'`,
        confidence: item.confidence,
      });
    }

    logger.debug(`[MemoryRepository] Created creative memory item: ${item.id} (${item.pattern})`);
    return { item, isExisting: false };
  }

  async getCreativeMemoryItem(id) {
    const { data, error } = await supabase
      .from('creative_memory_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new MemoryNotFoundError(`Creative memory item ${id} not found`);
    }
    return data;
  }

  async listCreativeMemoryItems(businessId, filters = {}) {
    let query = supabase
      .from('creative_memory_items')
      .select('*')
      .eq('business_id', businessId);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }

    const { data, error } = await query.order('confidence', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateCreativeMemoryItem(id, updates, evidenceText = null) {
    const existing = await this.getCreativeMemoryItem(id);

    const merged = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const validated = creativeMemoryItemSchema.parse(merged);

    const { data, error } = await supabase
      .from('creative_memory_items')
      .update(validated)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    if (evidenceText) {
      await this.recordEvidence({
        memory_item_id: id,
        memory_type: 'CREATIVE_MEMORY',
        source_type: validated.source || existing.source,
        source_id: validated.source_id || existing.source_id,
        evidence: evidenceText,
        confidence: validated.confidence,
      });
    }

    return data || validated;
  }

  async archiveCreativeMemoryItem(id, reason = 'Archived by user') {
    return this.updateCreativeMemoryItem(
      id,
      { status: MEMORY_STATUS.ARCHIVED },
      reason
    );
  }

  /**
   * ==========================================
   * MEMORY EVIDENCE / AUDITING
   * ==========================================
   */

  async recordEvidence(evidencePayload) {
    const validated = memoryEvidenceSchema.parse({
      ...evidencePayload,
      id: evidencePayload.id || crypto.randomUUID(),
      created_at: evidencePayload.created_at || new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('memory_evidence')
      .insert(validated)
      .select('*')
      .single();

    if (error) {
      logger.warn(`Failed to insert memory evidence: ${error.message}`);
      return validated;
    }
    return data || validated;
  }

  async listEvidenceForMemoryItem(memoryItemId) {
    const { data, error } = await supabase
      .from('memory_evidence')
      .select('*')
      .eq('memory_item_id', memoryItemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const memoryRepository = new MemoryRepository();
export default memoryRepository;

