import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Film,
  Download,
  Play,
  Pause,
  Monitor,
  Smartphone,
  Square,
  FolderArchive,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { Button, Badge } from '../../components/ui';

export function FinalReviewStageView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<any>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [selectedVersion, setSelectedVersion] = useState<string>('v1.0 (Master 4K)');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const campRes = await api.get(`/campaigns/${campaignId}`);
      setCampaign(campRes.data);
      if (campRes.data?.target_platforms?.includes('9:16')) {
        setAspectRatio('9:16');
      } else if (campRes.data?.target_platforms?.includes('1:1')) {
        setAspectRatio('1:1');
      }
    } catch {
      setCampaign(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#060606]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  const handleDownload = () => {
    alert(`Downloading Master MP4 (${aspectRatio} • ${selectedVersion})...`);
  };

  const handleDownloadStems = () => {
    alert(`Exporting Production Stems (Video, Voiceover, BGM, Overlays ZIP)...`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060606] text-white">
      <CampaignHeader
        campaignName={campaign?.name || 'Campaign Studio'}
        status="completed"
        metadata="Stage 9: Final Review & Multi-Format Export"
        breadcrumbs={[
          { label: 'Workspace', onClick: () => navigate('/campaigns') },
          { label: campaign?.name || 'Campaign', onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
          { label: 'Final Review & Export', isCurrent: true },
        ]}
      />

      <CampaignNavTabs
        activeSection="review"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Title & Version Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1C1C1C]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="success" size="sm">Stage 09: Approved</Badge>
                <span className="text-xs text-[#888]">Broadcast Ready Commercial</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {campaign?.name || 'Master Advertisement'}
              </h2>
            </div>

            {/* Version Branch Selector & Aspect Ratio Toolbar */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-[#222]">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    aspectRatio === '16:9' ? 'bg-white text-black' : 'text-[#888] hover:text-white'
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                  16:9
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    aspectRatio === '9:16' ? 'bg-white text-black' : 'text-[#888] hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3 w-3" />
                  9:16
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    aspectRatio === '1:1' ? 'bg-white text-black' : 'text-[#888] hover:text-white'
                  }`}
                >
                  <Square className="h-3 w-3" />
                  1:1
                </button>
              </div>

              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="h-8 px-3 rounded-xl bg-[#121212] border border-[#242424] text-xs font-semibold text-white focus:outline-none focus:border-[#E7FE25]"
              >
                <option value="v1.0 (Master 4K)">v1.0 (Master 4K)</option>
                <option value="v1.1 (Short Hook)">v1.1 (Short Hook)</option>
                <option value="v1.2 (Social Cut)">v1.2 (Social Cut)</option>
              </select>
            </div>
          </div>

          {/* Large Cinematic Player Box */}
          <div className="flex items-center justify-center p-6 bg-[#080808] rounded-3xl border border-[#1C1C1C] shadow-2xl">
            <div
              className={`rounded-2xl bg-[#121212] border border-[#282828] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-300 ${
                aspectRatio === '16:9'
                  ? 'aspect-video w-full max-w-3xl'
                  : aspectRatio === '9:16'
                  ? 'aspect-[9/16] h-[480px]'
                  : 'aspect-square h-[420px]'
              }`}
            >
              <Film className="h-14 w-14 text-[#333] mb-3" />
              <p className="text-xs text-[#777] font-semibold">Master Video Player ({aspectRatio})</p>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-[#E7FE25] hover:bg-[#D5EC1E] text-black flex items-center justify-center font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
              >
                {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
              </button>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/90 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                <span className="font-mono">00:30.00 / 00:30.00</span>
                <span className="font-mono text-[11px] text-[#E7FE25] font-semibold">4K UHD • ProRes 422 • 60 FPS</span>
              </div>
            </div>
          </div>

          {/* Export Actions Deck */}
          <div className="p-6 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">Commercial Export & Distribution</h4>
              <p className="text-xs text-[#888]">
                Download high-bitrate master files or raw multi-track stems for broadcast advertising.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/campaigns/${campaignId}/timeline`)}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Edit Timeline
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleDownloadStems}
                leftIcon={<FolderArchive className="h-4 w-4" />}
              >
                Export Stems (ZIP)
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleDownload}
                leftIcon={<Download className="h-4 w-4" />}
                className="font-bold shadow-lg"
              >
                Export Master MP4
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
