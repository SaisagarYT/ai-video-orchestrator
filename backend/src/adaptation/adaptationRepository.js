import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { campaignAdaptationRecordSchema } from './schemas.js';
import { AdaptationNotFoundError, AdaptationConflictError } from './errors.js';
import { logger } from '../core/logger/logger.js';

export class AdaptationRepository {
  /**
   * Create a new campaign adaptation record.
   *
   * @param {object} adaptationData
   * @returns {Promise<object>}
   */
  async createAdaptation(adaptationData) {
    const validated = campaignAdaptationRecordSchema.parse({
      ...adaptationData,
      id: adaptationData.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (validated.idempotency_key) {
      const existing = await this.getAdaptationByIdempotencyKey(validated.idempotency_key);
      if (existing) {
        logger.info(`[AdaptationRepository] Idempotency match: Returning existing adaptation ${existing.id}`);
        return existing;
      }
    }

    const { data, error } = await supabase
      .from('campaign_adaptations')
      .insert(validated)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AdaptationConflictError('Adaptation with this idempotency key already exists');
      }
      throw error;
    }

    return data || validated;
  }

  /**
   * Retrieve an adaptation by its UUID.
   *
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getAdaptationById(id) {
    if (!id) throw new AdaptationNotFoundError('Adaptation ID is required');

    const { data, error } = await supabase
      .from('campaign_adaptations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AdaptationNotFoundError(`Adaptation ${id} not found`);
    }

    return data;
  }

  /**
   * Retrieve an adaptation by idempotency key.
   *
   * @param {string} key
   * @returns {Promise<object|null>}
   */
  async getAdaptationByIdempotencyKey(key) {
    if (!key) return null;

    const { data } = await supabase
      .from('campaign_adaptations')
      .select('*')
      .eq('idempotency_key', key);

    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Update an adaptation by ID.
   *
   * @param {string} id
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateAdaptation(id, updates) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('campaign_adaptations')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * List adaptations for a campaign with optional filtering.
   *
   * @param {string} campaignId
   * @param {object} [filters={}]
   * @returns {Promise<Array<object>>}
   */
  async listAdaptationsByCampaign(campaignId, filters = {}) {
    let query = supabase
      .from('campaign_adaptations')
      .select('*')
      .eq('campaign_id', campaignId);

    if (filters.platform) {
      query = query.eq('platform', filters.platform.toUpperCase());
    }
    if (filters.status) {
      query = query.eq('status', filters.status.toUpperCase());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}

export const adaptationRepository = new AdaptationRepository();
