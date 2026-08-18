export interface CampaignSummary {
  id: string;
  name: string;
  product_name: string;
  product_description: string;
  objective: string;
  target_platforms?: string | null;
  call_to_action: string;
  status: 'draft' | 'strategy_generated' | 'storyboard_ready' | 'scenes_generating' | 'rendering' | 'completed' | 'failed' | string;
  aspect_ratio?: string;
  duration_seconds?: number;
  created_at?: string;
  updated_at?: string;
  scene_count?: number;
  progress_percent?: number;
  current_stage?: string;
}

export interface PresetTemplate {
  id: string;
  title: string;
  category: string;
  tagline: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  gradient: string;
  accentColor: string;
  duration: string;
  suggestedPrompt: string;
  tags: string[];
}

export interface StudioMetric {
  label: string;
  value: string | number;
  sublabel: string;
  change?: string;
  isPositive?: boolean;
  iconName: 'Film' | 'Sparkles' | 'Cpu' | 'HardDrive';
}

export interface RecentRender {
  id: string;
  title: string;
  campaignName: string;
  duration: string;
  aspectRatio: string;
  resolution: string;
  thumbnailUrl?: string;
  createdAt: string;
}
