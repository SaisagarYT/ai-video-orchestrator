import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../lib/api';
import type {
  CreativeSpecification,
  ReferenceAsset,
  CameraOpticsSpec,
  CameraMotionSpec,
  LightingColorSpec,
  AudioPacingSpec,
} from '../types/creativeSpec';

const defaultSpec: CreativeSpecification = {
  campaignId: '',
  title: 'Cinematographic Creative Direction',
  aspectRatio: '16:9',
  durationSeconds: 60,
  camera: {
    shotType: 'close_up',
    focalLength: '35mm_anamorphic',
    aperture: 'f/2.0',
    depthOfField: 'shallow_bokeh',
  },
  motion: {
    movementType: 'dolly_in',
    speed: 'smooth_cinematic',
    frameRate: '24fps_cinema',
    motionBlur: true,
  },
  lighting: {
    lutPreset: 'kodak_vision3_5219',
    keyLighting: 'warm_hearth',
    colorTemperature: 3200,
    filmGrain: 'fine_35mm',
  },
  audio: {
    pacing: 'balanced_narrative',
    voiceoverVoice: 'deep_cinematic_male',
    audioDuckingDb: -12,
    musicGenre: 'modern_ambient_electronic',
  },
  references: [],
  customPromptDirectives: 'Steaming clay pot dum biryani with glowing firewood embers, saffron basmati grains and crispy fried onions in 8k cinema detail.',
  negativePrompt: 'blurry, low quality, oversaturated, deformed hands, cartoonish, static, flat lighting, artifacts',
};

export function useCreativeStudio(campaignId: string) {
  const [spec, setSpec] = useState<CreativeSpecification>({
    ...defaultSpec,
    campaignId,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load from backend
  const loadSpecification = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/campaigns/${campaignId}/workspace`);
      const data = res.data;
      if (data && data.campaign) {
        setSpec((prev) => ({
          ...prev,
          campaignId,
          title: `${data.campaign.name} • Creative Studio`,
          aspectRatio: data.campaign.aspect_ratio || '16:9',
          durationSeconds: data.campaign.duration_seconds || 60,
          customPromptDirectives: data.campaign.product_description || prev.customPromptDirectives,
        }));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load campaign specifications.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadSpecification();
  }, [loadSpecification]);

  // Real-Time Visual Prompt Compiler Engine
  const compiledPrompt = useMemo(() => {
    const parts: string[] = [];

    // 1. Core Subject Directives
    if (spec.customPromptDirectives) {
      parts.push(spec.customPromptDirectives);
    }

    // 2. Camera Optics & Framing
    const shotTypeLabel = spec.camera.shotType.replace(/_/g, ' ');
    const lensLabel = spec.camera.focalLength.replace(/_/g, ' ');
    parts.push(`${shotTypeLabel}, shot on ${lensLabel}, ${spec.camera.aperture} aperture with ${spec.camera.depthOfField.replace(/_/g, ' ')}`);

    // 3. Camera Motion & Frame Rate
    const motionLabel = spec.motion.movementType.replace(/_/g, ' ');
    const frameRateLabel = spec.motion.frameRate.replace(/_/g, ' ');
    parts.push(`camera motion: ${motionLabel} (${spec.motion.speed.replace(/_/g, ' ')}), captured at ${frameRateLabel}`);

    // 4. Lighting & Color LUT
    const lutLabel = spec.lighting.lutPreset.replace(/_/g, ' ');
    const keyLabel = spec.lighting.keyLighting.replace(/_/g, ' ');
    parts.push(`lighting: ${keyLabel}, color grade: ${lutLabel} palette (${spec.lighting.colorTemperature}K), ${spec.lighting.filmGrain.replace(/_/g, ' ')} aesthetic`);

    // 5. Reference weighting cues
    if (spec.references.length > 0) {
      const refCues = spec.references
        .map((r) => `${r.name} (${r.type.replace(/_/g, ' ')}, weight: ${r.weight.toFixed(2)})`)
        .join(', ');
      parts.push(`visual reference anchors: [${refCues}]`);
    }

    // 6. Master Cinema Quality Tags
    parts.push('master 35mm cinematographic production, broadcast commercial quality, ultra-sharp focus, photorealistic 8k render');

    return parts.join(' | ');
  }, [spec]);

  // Mutators
  const updateCamera = (updates: Partial<CameraOpticsSpec>) => {
    setSpec((prev) => ({
      ...prev,
      camera: { ...prev.camera, ...updates },
    }));
  };

  const updateMotion = (updates: Partial<CameraMotionSpec>) => {
    setSpec((prev) => ({
      ...prev,
      motion: { ...prev.motion, ...updates },
    }));
  };

  const updateLighting = (updates: Partial<LightingColorSpec>) => {
    setSpec((prev) => ({
      ...prev,
      lighting: { ...prev.lighting, ...updates },
    }));
  };

  const updateAudio = (updates: Partial<AudioPacingSpec>) => {
    setSpec((prev) => ({
      ...prev,
      audio: { ...prev.audio, ...updates },
    }));
  };

  const updateAspectRatio = (aspectRatio: '16:9' | '9:16' | '1:1' | '4:5') => {
    setSpec((prev) => ({ ...prev, aspectRatio }));
  };

  const updateCustomDirectives = (customPromptDirectives: string) => {
    setSpec((prev) => ({ ...prev, customPromptDirectives }));
  };

  const updateNegativePrompt = (negativePrompt: string) => {
    setSpec((prev) => ({ ...prev, negativePrompt }));
  };

  // References Management
  const addReference = (ref: Omit<ReferenceAsset, 'id'>) => {
    const newRef: ReferenceAsset = {
      ...ref,
      id: `ref-${Date.now()}`,
    };
    setSpec((prev) => ({
      ...prev,
      references: [...prev.references, newRef],
    }));
  };

  const removeReference = (id: string) => {
    setSpec((prev) => ({
      ...prev,
      references: prev.references.filter((r) => r.id !== id),
    }));
  };

  const updateReferenceWeight = (id: string, weight: number) => {
    setSpec((prev) => ({
      ...prev,
      references: prev.references.map((r) => (r.id === id ? { ...r, weight } : r)),
    }));
  };

  // Reset to AI Recommendation
  const resetToAIRecommendation = () => {
    setSpec({
      ...defaultSpec,
      campaignId,
    });
  };

  // Save to Backend
  const saveSpecification = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await api.patch(`/campaigns/${campaignId}`, {
        product_description: spec.customPromptDirectives,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save creative specification to backend.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Simulate Frame Preview Generation
  const generateFramePreview = async () => {
    setIsGeneratingPreview(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPreviewUrl('https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1080&q=80');
    } catch {
      setError('Frame preview generation failed.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  return {
    spec,
    compiledPrompt,
    isLoading,
    isSaving,
    isGeneratingPreview,
    error,
    saveSuccess,
    previewUrl,
    updateCamera,
    updateMotion,
    updateLighting,
    updateAudio,
    updateAspectRatio,
    updateCustomDirectives,
    updateNegativePrompt,
    addReference,
    removeReference,
    updateReferenceWeight,
    resetToAIRecommendation,
    saveSpecification,
    generateFramePreview,
  };
}
