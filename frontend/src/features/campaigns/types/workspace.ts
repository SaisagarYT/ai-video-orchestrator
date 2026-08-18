export interface BusinessData {
  id: string;
  name: string;
  industry: string;
  description?: string;
  website_url?: string;
  target_audience?: string;
  tone_of_voice?: string;
  brand_colors?: string;
  brand_guidelines?: string;
}

export interface CampaignData {
  id: string;
  business_id: string;
  name: string;
  goal: string;
  target_audience?: string;
  budget?: number;
  duration_seconds: number;
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:5' | string;
  status: 'draft' | 'strategy_generated' | 'storyboard_ready' | 'rendering' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface StrategyData {
  id: string;
  campaign_id: string;
  target_audience_breakdown?: Record<string, unknown> | string;
  value_propositions?: string[] | string;
  emotional_triggers?: string[] | string;
  messaging_pillars?: string[] | string;
}

export interface CreativeConceptData {
  id: string;
  campaign_id: string;
  title: string;
  angle_type: string;
  hook: string;
  visual_style: string;
  narrative_arc: string;
  target_emotion: string;
  is_selected: boolean;
}

export interface AssetData {
  id: string;
  scene_id?: string;
  asset_type: string;
  storage_url: string;
  version_number: number;
  status: string;
}

export interface SceneDetailData {
  id: string;
  storyboard_id: string;
  sequence_number: number;
  shot_type: string;
  camera_movement: string;
  visual_prompt: string;
  audio_narration: string;
  duration_seconds: number;
  lighting_atmosphere: string;
  assets: AssetData[];
  selected_asset?: AssetData;
}

export interface FinalVideoData {
  id: string;
  timeline_id: string;
  resolution: string;
  duration_seconds: number;
  video_url: string;
  aspect_ratio: string;
  status: string;
  created_at: string;
}

export interface CampaignProgressData {
  brief_completed: boolean;
  strategy_completed: boolean;
  concept_selected: boolean;
  storyboard_ready: boolean;
  scenes_generated: boolean;
  scenes_generated_count: number;
  scenes_total_count: number;
  quality_evaluated: boolean;
  final_rendered: boolean;
  current_stage: 'BRIEF' | 'STRATEGY' | 'CONCEPTS' | 'STORYBOARD' | 'GENERATION' | 'EVALUATION' | 'RENDER' | 'COMPLETED';
  progress_percentage: number;
}

export interface CampaignWorkspaceData {
  campaign: CampaignData;
  business?: BusinessData;
  strategy?: StrategyData;
  concepts: CreativeConceptData[];
  selected_concept?: CreativeConceptData;
  storyboard?: {
    id: string;
    campaign_id: string;
    creative_bible?: Record<string, unknown>;
  };
  scenes: SceneDetailData[];
  final_videos: FinalVideoData[];
  progress: CampaignProgressData;
}
