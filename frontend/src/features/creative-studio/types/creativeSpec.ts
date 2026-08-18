export type ShotType =
  | 'extreme_macro'
  | 'close_up'
  | 'medium_shot'
  | 'wide_establishing'
  | 'low_angle_hero'
  | 'overhead_drone';

export type LensFocalLength =
  | '18mm_ultra_wide'
  | '24mm_wide_angle'
  | '35mm_anamorphic'
  | '50mm_standard_prime'
  | '85mm_portrait'
  | '135mm_telephoto';

export type CameraMovementType =
  | 'static_lockoff'
  | 'dolly_in'
  | 'dolly_zoom_vertigo'
  | 'orbit_arc_360'
  | 'steadicam_tracking'
  | 'crane_pedestal'
  | 'handheld_organic'
  | 'slow_motion_120fps';

export type LightingLutPreset =
  | 'kodak_vision3_5219'
  | 'arri_master_commercial'
  | 'golden_hour_sunset'
  | 'blade_runner_neon_amber'
  | 'studio_high_key'
  | 'moody_rembrandt_noir'
  | 'clean_tech_monochrome';

export interface ReferenceAsset {
  id: string;
  name: string;
  type: 'product_hero' | 'visual_style' | 'color_mood' | 'character_ref';
  url: string;
  weight: number; // 0.1 to 1.0
  fileSize?: string;
}

export interface CameraOpticsSpec {
  shotType: ShotType;
  focalLength: LensFocalLength;
  aperture: string; // e.g. "f/1.4" | "f/2.8" | "f/8"
  depthOfField: 'shallow_bokeh' | 'medium_cinematic' | 'deep_focus';
}

export interface CameraMotionSpec {
  movementType: CameraMovementType;
  speed: 'slow_pan' | 'smooth_cinematic' | 'high_speed_dynamic';
  frameRate: '24fps_cinema' | '30fps_broadcast' | '60fps_fluid' | '120fps_slowmo';
  motionBlur: boolean;
}

export interface LightingColorSpec {
  lutPreset: LightingLutPreset;
  keyLighting: 'natural_sunlight' | 'warm_hearth' | 'soft_diffused_box' | 'harsh_rim_light' | 'neon_accent';
  colorTemperature: number; // 2800K to 7500K
  filmGrain: 'none' | 'fine_35mm' | 'textured_16mm' | 'clean_digital';
}

export interface AudioPacingSpec {
  pacing: 'fast_punchy' | 'balanced_narrative' | 'cinematic_deliberate';
  voiceoverVoice: 'deep_cinematic_male' | 'energetic_female' | 'authoritative_neutral' | 'warm_conversational';
  audioDuckingDb: number; // e.g. -12 dB
  musicGenre: 'modern_ambient_electronic' | 'acoustic_warm' | 'high_energy_beats' | 'cinematic_orchestral';
}

export interface CreativeSpecification {
  campaignId: string;
  title: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  durationSeconds: number;
  camera: CameraOpticsSpec;
  motion: CameraMotionSpec;
  lighting: LightingColorSpec;
  audio: AudioPacingSpec;
  references: ReferenceAsset[];
  customPromptDirectives: string;
  negativePrompt: string;
}
