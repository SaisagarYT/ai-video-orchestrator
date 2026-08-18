import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Film,
  Music,
  Mic,
  Tag,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { ContextualPropertyInspector } from '../../components/layout/contextual-panel/ContextualPropertyInspector';
import { Button } from '../../components/ui';

export function TimelineStageView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<any>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);

  const totalDuration = scenes.reduce((acc, sc) => acc + (sc.duration_seconds || 4), 0) || 30;

  const fetchTimeline = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const campRes = await api.get(`/campaigns/${campaignId}`);
      setCampaign(campRes.data);

      const wsRes = await api.get(`/campaigns/${campaignId}/workspace`);
      setScenes(wsRes.data?.scenes || []);
    } catch {
      setCampaign(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#060606]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060606] text-white">
      <CampaignHeader
        campaignName={campaign?.name || 'Campaign Studio'}
        status={campaign?.status || 'draft'}
        metadata="Stage 7: Multi-Track Timeline Sequencing"
        breadcrumbs={[
          { label: 'Workspace', onClick: () => navigate('/campaigns') },
          { label: campaign?.name || 'Campaign', onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
          { label: 'Timeline', isCurrent: true },
        ]}
        onToggleContextualPanel={() => setInspectorOpen(!inspectorOpen)}
        contextualPanelOpen={inspectorOpen}
      />

      <CampaignNavTabs
        activeSection="timeline"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A]">
          {/* Top Video Preview & Quick Controls */}
          <div className="flex-1 flex items-center justify-center p-4 bg-[#060606] relative">
            <div className="aspect-video w-full max-w-2xl rounded-2xl bg-[#121212] border border-[#222] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <Film className="h-12 w-12 text-[#333] mb-2" />
              <p className="text-xs text-[#777] font-medium">Timeline Assembly Preview</p>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/80 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
                <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                <span className="font-mono text-[11px] text-[#E7FE25]">1080p • 60 FPS</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Bar */}
          <div className="h-12 px-6 border-t border-b border-[#1C1C1C] bg-[#0E0E0E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 w-8 rounded-lg bg-[#E7FE25] hover:bg-[#D5EC1E] text-black flex items-center justify-center font-bold transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => setCurrentTime(0)}
                className="h-8 w-8 rounded-lg bg-[#181818] hover:bg-[#222] text-[#AAA] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-xs font-bold text-white pl-2">
                {formatTime(currentTime)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/campaigns/${campaignId}/render`)}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="font-bold shadow-md"
              >
                Render Master Video
              </Button>
            </div>
          </div>

          {/* Multi-Track Timeline Grid */}
          <div className="h-56 overflow-y-auto bg-[#0A0A0A] p-4 space-y-2 select-none">
            {/* Track 1: Video */}
            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-[#888]">
                <Film className="h-3.5 w-3.5 text-[#E7FE25]" />
                <span>Video Track</span>
              </div>
              <div className="flex-1 flex gap-1.5 h-10 p-1 bg-[#121212] rounded-lg border border-[#202020] overflow-x-auto">
                {scenes.map((sc, i) => (
                  <div
                    key={sc.id || i}
                    onClick={() => {
                      setSelectedClip({ ...sc, name: `Scene ${sc.sequence_number || i + 1}` });
                      setInspectorOpen(true);
                    }}
                    className="flex-1 min-w-[80px] h-full rounded bg-[#1C1C1C] hover:bg-[#262626] border border-[#333] flex items-center justify-center text-[10px] font-bold text-white cursor-pointer truncate px-1 transition-colors"
                  >
                    Sc {sc.sequence_number || i + 1} ({sc.duration_seconds || 4}s)
                  </div>
                ))}
              </div>
            </div>

            {/* Track 2: Voiceover */}
            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-[#888]">
                <Mic className="h-3.5 w-3.5 text-[#10B981]" />
                <span>Voiceover</span>
              </div>
              <div className="flex-1 flex gap-1.5 h-10 p-1 bg-[#121212] rounded-lg border border-[#202020] overflow-x-auto">
                <div className="flex-1 h-full rounded bg-[#013F32] border border-emerald-500/40 flex items-center px-3 text-[10px] font-semibold text-emerald-200">
                  AI Voiceover Narration Track (Synchronized)
                </div>
              </div>
            </div>

            {/* Track 3: BGM */}
            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-[#888]">
                <Music className="h-3.5 w-3.5 text-[#3B82F6]" />
                <span>Music / BGM</span>
              </div>
              <div className="flex-1 flex gap-1.5 h-10 p-1 bg-[#121212] rounded-lg border border-[#202020] overflow-x-auto">
                <div className="flex-1 h-full rounded bg-[#0A2540] border border-blue-500/40 flex items-center px-3 text-[10px] font-semibold text-blue-200">
                  Energetic Cinematic Commercial BGM (Ducking: -18dB)
                </div>
              </div>
            </div>

            {/* Track 4: Brand Overlays */}
            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-[#888]">
                <Tag className="h-3.5 w-3.5 text-[#F59E0B]" />
                <span>Brand CTA</span>
              </div>
              <div className="flex-1 flex gap-1.5 h-10 p-1 bg-[#121212] rounded-lg border border-[#202020] overflow-x-auto">
                <div className="w-1/3 ml-auto h-full rounded bg-[#332200] border border-amber-500/40 flex items-center justify-center text-[10px] font-semibold text-amber-200">
                  End Card & Logo Watermark
                </div>
              </div>
            </div>
          </div>
        </main>

        <ContextualPropertyInspector
          entityType={selectedClip ? 'timeline_clip' : 'campaign'}
          data={selectedClip || campaign}
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
        />
      </div>
    </div>
  );
}
