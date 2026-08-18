import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceContainer } from '../../components/layout/workspace/WorkspaceContainer';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { Button, Badge, Card, CardContent } from '../../components/ui';
import {
  Wand2,
  Clapperboard,
  ArrowRight,
  Play,
  RefreshCw,
  Image,
} from 'lucide-react';


interface AssetData {
  id: string;
  scene_id: string;
  asset_type: string;
  storage_url: string;
  version_number: number;
  status: string;
}

interface SceneItem {
  id: string;
  sequence_number: number;
  shot_type: string;
  camera_movement: string;
  visual_prompt: string;
  audio_narration: string;
  duration_seconds: number;
  assets: AssetData[];
  selected_asset?: AssetData;
}

export function ScenesWorkspaceView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [campaignName, setCampaignName] = useState('Scene Assets');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScenes = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/campaigns/${campaignId}/workspace`);
      if (res.data) {
        setCampaignName(res.data.campaign?.name || 'Scene Assets');
        setScenes(res.data.scenes || []);
      }
    } catch {
      setScenes([]);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  const handleGenerateScene = async (sceneId: string) => {
    setGeneratingSceneId(sceneId);
    setError(null);
    try {
      await api.post(`/scenes/${sceneId}/generate`, {
        provider: 'seedimages',
      });
      await fetchScenes();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to dispatch generation job.');
      }
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleGenerateAll = async () => {
    for (const s of scenes) {
      await handleGenerateScene(s.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-[var(--bg-app)]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  const allGenerated = scenes.length > 0 && scenes.every((s) => s.assets && s.assets.length > 0);

  const breadcrumbs = [
    { label: 'Campaigns', onClick: () => navigate('/campaigns') },
    { label: campaignName, onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
    { label: 'Scene Assets', isCurrent: true },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] font-app">
      {/* 1. Contextual Header */}
      <CampaignHeader
        campaignName={campaignName}
        status={allGenerated ? 'rendering' : 'storyboard_ready'}
        metadata={`${scenes.length} Scenes • Multi-Modal Media Generation`}
        breadcrumbs={breadcrumbs}
        primaryAction={{
          label: allGenerated ? 'Proceed to Quality Gate' : 'Generate All Scene Clips',
          onClick: allGenerated ? () => navigate(`/campaigns/${campaignId}/quality`) : handleGenerateAll,
          icon: <Wand2 className="h-4 w-4" />,
        }}
      />

      {/* 2. Contextual Nav Tabs */}
      <CampaignNavTabs
        activeSection="scenes"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* 3. Main Workspace Body */}
      <WorkspaceContainer layoutMode="full-width" className="space-y-6 max-w-7xl mx-auto pb-12">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        {scenes.length === 0 ? (
          <div className="py-12 max-w-xl mx-auto text-center space-y-4">
            <Clapperboard className="h-10 w-10 text-[var(--brand-lime)] mx-auto" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">No Scenes in Storyboard</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Compile your storyboard shots first before generating individual media assets.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/campaigns/${campaignId}/storyboard`)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Go to Storyboard Studio
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Multi-Modal Visual Assets Reel ({scenes.length} Scenes)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Render individual shot frames and video clips using SeedImages / ElevenLabs.
                </p>
              </div>

              {allGenerated && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/campaigns/${campaignId}/quality`)}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  className="font-bold"
                >
                  Evaluate Quality Gate
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scenes.map((scene) => {
                const isGeneratingThis = generatingSceneId === scene.id;
                const hasAsset = scene.assets && scene.assets.length > 0;
                const activeAsset = scene.selected_asset || (hasAsset ? scene.assets[0] : null);

                return (
                  <Card
                    key={scene.id}
                    className="border-[var(--border-default)] hover:border-[var(--brand-lime)]/40 transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Media Viewport */}
                    <div className="h-44 bg-[var(--bg-surface-sunken)] border-b border-[var(--border-subtle)] relative flex items-center justify-center overflow-hidden">
                      {activeAsset ? (
                        <div className="w-full h-full relative group">
                          <img
                            src={activeAsset.storage_url}
                            alt={`Scene ${scene.sequence_number}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="h-9 w-9 rounded-full bg-[var(--brand-lime)] text-[#161616] flex items-center justify-center shadow-lg">
                              <Play className="h-4 w-4 ml-0.5 fill-current" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4 space-y-2">
                          <Image className="h-8 w-8 text-[var(--text-muted)] mx-auto opacity-50" />
                          <span className="text-[11px] text-[var(--text-muted)] block font-mono-code">
                            Awaiting Render
                          </span>
                        </div>
                      )}

                      {/* Sequence Badge */}
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-mono-code border border-white/10 font-bold">
                        Shot 0{scene.sequence_number}
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[var(--brand-lime)] text-[10px] font-mono-code border border-white/10 font-bold">
                        {scene.duration_seconds}s
                      </div>
                    </div>

                    {/* Card Body */}
                    <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[var(--text-primary)]">
                            {scene.shot_type}
                          </span>
                          <Badge variant={hasAsset ? 'success' : 'default'} size="sm">
                            {hasAsset ? `V${activeAsset?.version_number || 1} Ready` : 'Pending'}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                          {scene.visual_prompt}
                        </p>

                        {scene.audio_narration && (
                          <p className="text-[11px] italic text-[var(--text-secondary)] line-clamp-1">
                            VO: "{scene.audio_narration}"
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <Button
                          variant={hasAsset ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleGenerateScene(scene.id)}
                          isLoading={isGeneratingThis}
                          leftIcon={isGeneratingThis ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                          className="w-full font-bold"
                        >
                          {hasAsset ? 'Regenerate Asset' : 'Generate Clip'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </WorkspaceContainer>
    </div>
  );
}
