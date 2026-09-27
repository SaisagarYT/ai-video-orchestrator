import crypto from 'node:crypto';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../core/logger/logger.js';
import { NotFoundError } from '../../core/errors/AppError.js';

export class AssetService {
  /**
   * Create and persist a new media asset with full provenance tracking.
   * @param {Object} data
   * @returns {Promise<Object>} The persisted asset record
   */
  async createAsset(data) {
    const assetId = data.id || crypto.randomUUID();
    const assetRecord = {
      id: assetId,
      campaign_id: data.campaign_id || data.campaignId,
      workflow_execution_id: data.workflow_execution_id || data.executionId || null,
      workflow_step_id: data.workflow_step_id || data.stepId || null,
      scene_id: data.scene_id || data.sceneId ? String(data.scene_id || data.sceneId) : null,
      asset_type: data.asset_type || data.assetType || 'video',
      provider: data.provider || 'unknown',
      provider_asset_id: data.provider_asset_id || data.providerAssetId || null,
      storage_provider: data.storage_provider || data.storageProvider || 'cloudinary',
      storage_asset_id: data.storage_asset_id || data.storageAssetId || null,
      url: data.url,
      secure_url: data.secure_url || data.secureUrl || data.url,
      mime_type: data.mime_type || data.mimeType || null,
      format: data.format || null,
      duration_ms: data.duration_ms ?? data.durationMs ?? null,
      width: data.width || null,
      height: data.height || null,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from('assets')
      .insert(assetRecord)
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to persist asset record', { error: error.message, assetId });
      throw new Error(`Asset persistence failed: ${error.message}`);
    }

    logger.debug(`[AssetService] Persisted asset ${assetId} of type ${assetRecord.asset_type}`);
    return created || assetRecord;
  }

  /**
   * Retrieve asset by unique ID.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getAssetById(id) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Asset with ID ${id} not found`);
    }

    return data;
  }

  /**
   * List all assets associated with a specific campaign.
   * @param {string} campaignId
   * @param {Object} [options]
   * @param {string} [options.assetType]
   * @returns {Promise<Array<Object>>}
   */
  async getAssetsByCampaign(campaignId, { assetType } = {}) {
    let query = supabase
      .from('assets')
      .select('*')
      .eq('campaign_id', campaignId);

    if (assetType) {
      query = query.eq('asset_type', assetType);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) {
      throw new Error(`Failed to query campaign assets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * List assets for a specific scene.
   * @param {string} sceneId
   * @returns {Promise<Array<Object>>}
   */
  async getAssetsByScene(sceneId) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('scene_id', String(sceneId))
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to query scene assets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * List assets created by a specific workflow execution.
   * @param {string} executionId
   * @returns {Promise<Array<Object>>}
   */
  async getAssetsByExecution(executionId) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('workflow_execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to query execution assets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Retrieve full provenance and lineage for an asset.
   * @param {string} assetId
   * @returns {Promise<Object>}
   */
  async getAssetProvenance(assetId) {
    const asset = await this.getAssetById(assetId);

    let campaign = null;
    if (asset.campaign_id) {
      const { data } = await supabase.from('campaigns').select('*').eq('id', asset.campaign_id).single();
      campaign = data || null;
    }

    let workflowExecution = null;
    if (asset.workflow_execution_id) {
      const { data } = await supabase.from('workflow_executions').select('*').eq('id', asset.workflow_execution_id).single();
      workflowExecution = data || null;
    }

    return {
      asset,
      provenance: {
        campaignId: asset.campaign_id,
        campaignTitle: campaign?.title || null,
        executionId: asset.workflow_execution_id,
        stepId: asset.workflow_step_id,
        sceneId: asset.scene_id,
        provider: asset.provider,
        providerAssetId: asset.provider_asset_id,
        storageProvider: asset.storage_provider,
        storageAssetId: asset.storage_asset_id,
        generationMetadata: asset.metadata || {},
        createdAt: asset.created_at,
      },
    };
  }
}

export const assetService = new AssetService();
