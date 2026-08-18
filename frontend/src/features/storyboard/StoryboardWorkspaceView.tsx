import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceContainer } from '../../components/layout/workspace/WorkspaceContainer';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { Button, Badge, Label } from '../../components/ui';
import {
  Sparkles,
  Layers,
  ArrowRight,
  MessageSquare,
  Edit2,
  Check,
} from 'lucide-react';


interface SceneItem {
  id: string;
  storyboard_id: string;
  sequence_number: number;
  shot_type: string;
  camera_movement: string;
  visual_prompt: string;
  audio_narration: string;
  duration_seconds: number;
  lighting_atmosphere: string;
}

interface StoryboardData {
  id: string;
  campaign_id: string;
  concept_id: string;
  title: string;
  aspect_ratio: string;
  target_duration: number;
  status: string;
  scenes: SceneItem[];
}

export function StoryboardWorkspaceView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [campaignName, setCampaignName] = useState('Campaign Storyboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editNarration, setEditNarration] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchStoryboard = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const campRes = await api.get(`/campaigns/${campaignId}`);
      if (campRes.data) setCampaignName(campRes.data.name);

      const res = await api.get<StoryboardData>(`/campaigns/${campaignId}/storyboard`);
      setStoryboard(res.data);
    } catch {
      setStoryboard(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchStoryboard();
  }, [fetchStoryboard]);

  const handleGenerateStoryboard = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.post<StoryboardData>(`/campaigns/${campaignId}/storyboard`, {
        aspect_ratio: '16:9',
      });
      setStoryboard(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate storyboard. Please ensure a creative concept is selected.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSceneEdit = async (sceneId: string) => {
    if (!storyboard) return;
    try {
      await api.patch(`/storyboards/${storyboard.id}/scenes/${sceneId}`, {
        visual_prompt: editPrompt,
        audio_narration: editNarration,
      });
      setStoryboard({
        ...storyboard,
        scenes: storyboard.scenes.map((s) =>
          s.id === sceneId
            ? { ...s, visual_prompt: editPrompt, audio_narration: editNarration }
            : s
        ),
      });
      setEditingSceneId(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update scene.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-[var(--bg-app)]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Campaigns', onClick: () => navigate('/campaigns') },
    { label: campaignName, onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
    { label: 'Storyboard Studio', isCurrent: true },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] font-app">
      {/* 1. Contextual Header */}
      <CampaignHeader
        campaignName={campaignName}
        status={storyboard ? 'storyboard_ready' : 'draft'}
        metadata={`${storyboard?.scenes?.length || 0} Shots • ${storyboard?.target_duration || 60}s Master • 35mm Cinematography`}
        breadcrumbs={breadcrumbs}
        primaryAction={{
          label: isGenerating
            ? 'Compiling Shots...'
            : storyboard
            ? 'Re-generate Storyboard'
            : 'Generate 5-Shot Storyboard',
          onClick: handleGenerateStoryboard,
          isLoading: isGenerating,
          icon: <Sparkles className="h-4 w-4" />,
        }}
      />

      {/* 2. Contextual Nav Tabs */}
      <CampaignNavTabs
        activeSection="storyboard"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* 3. Main Workspace */}
      <WorkspaceContainer layoutMode="full-width" className="space-y-6 max-w-7xl mx-auto pb-12">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!storyboard && (
          <div className="py-12 max-w-2xl mx-auto text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-[var(--brand-lime-muted)] border border-[var(--brand-lime)]/30 flex items-center justify-center text-[var(--brand-lime)] mx-auto shadow-lg">
              <Layers className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Compile 5-Shot Commercial Storyboard
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The Storyboard Engine breaks down your approved creative angle into a 5-scene 35mm visual shot list with synchronized voiceover narration and camera motion cues.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateStoryboard}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="h-4 w-4" />}
              className="font-bold shadow-[0_0_20px_rgba(231,254,37,0.3)]"
            >
              Generate AI Storyboard
            </Button>
          </div>
        )}

        {/* Active Storyboard Scenes Reel */}
        {storyboard && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Shot Sequence & Narrative Breakdown ({storyboard.scenes.length} Scenes)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Fine-tune individual scene prompts, camera motion, and voiceover pacing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/campaigns/${campaignId}/scenes`)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="font-bold shadow-[0_0_15px_rgba(231,254,37,0.3)]"
                >
                  Generate Visual Media
                </Button>
              </div>
            </div>

            {/* Scenes Timeline */}
            <div className="space-y-4">
              {storyboard.scenes.map((scene) => {
                const isEditing = editingSceneId === scene.id;

                return (
                  <div
                    key={scene.id}
                    className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-lime)]/40 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-[var(--brand-lime)] text-[#161616] font-mono-code text-xs font-bold flex items-center justify-center">
                          0{scene.sequence_number}
                        </div>
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          {scene.shot_type}
                        </span>
                        <Badge variant="outline" size="sm">
                          {scene.camera_movement}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono-code text-xs text-[var(--brand-lime)] font-bold">
                          {scene.duration_seconds}s Duration
                        </span>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSceneId(scene.id);
                              setEditPrompt(scene.visual_prompt);
                              setEditNarration(scene.audio_narration);
                            }}
                            className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-white cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-[11px]">Visual Prompt</Label>
                          <textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-lg bg-[var(--bg-surface-sunken)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-lime)]"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">Voiceover Script</Label>
                          <input
                            type="text"
                            value={editNarration}
                            onChange={(e) => setEditNarration(e.target.value)}
                            className="w-full h-8 px-3 rounded-lg bg-[var(--bg-surface-sunken)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSceneId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveSceneEdit(scene.id)}
                            leftIcon={<Check className="h-3.5 w-3.5" />}
                          >
                            Save Scene
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                        <div className="md:col-span-8 space-y-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Visual Prompt Directives
                          </span>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            {scene.visual_prompt}
                          </p>
                        </div>

                        <div className="md:col-span-4 space-y-1.5 p-3 rounded-xl bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)]">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-lime)]">
                            <MessageSquare className="h-3 w-3" />
                            <span>Voiceover Narration</span>
                          </div>
                          <p className="text-xs italic text-[var(--text-secondary)]">
                            "{scene.audio_narration}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </WorkspaceContainer>
    </div>
  );
}
