import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { Button, Badge } from '../../components/ui';

export function MasterRenderStageView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<any>(null);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStatus, setRenderStatus] = useState<string>('Compiling multi-track stems...');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRenderState = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const campRes = await api.get(`/campaigns/${campaignId}`);
      setCampaign(campRes.data);

      let progress = 15;
      setRenderProgress(progress);

      const interval = setInterval(() => {
        progress += 25;
        if (progress >= 100) {
          setRenderProgress(100);
          setRenderStatus('4K Master Compilation Completed');
          setIsCompleted(true);
          clearInterval(interval);
        } else if (progress >= 70) {
          setRenderProgress(progress);
          setRenderStatus('Encoding H.264 & ProRes broadcast assets...');
        } else if (progress >= 40) {
          setRenderProgress(progress);
          setRenderStatus('Applying color grade & audio ducking normalization...');
        } else {
          setRenderProgress(progress);
        }
      }, 700);
    } catch {
      setCampaign(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchRenderState();
  }, [fetchRenderState]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#060606]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060606] text-white">
      <CampaignHeader
        campaignName={campaign?.name || 'Campaign Studio'}
        status={campaign?.status || 'draft'}
        metadata="Stage 8: Master Compilation & Render"
        breadcrumbs={[
          { label: 'Workspace', onClick: () => navigate('/campaigns') },
          { label: campaign?.name || 'Campaign', onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
          { label: 'Render', isCurrent: true },
        ]}
      />

      <CampaignNavTabs
        activeSection="render"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      <main className="flex-1 flex items-center justify-center p-6 bg-[#080808]">
        <div className="max-w-xl w-full p-8 rounded-3xl bg-[#0E0E0E] border border-[#1E1E1E] space-y-6 shadow-2xl text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#013F32] to-[#025745] border border-emerald-500/30 flex items-center justify-center text-[#E7FE25]">
            <Cpu className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <Badge variant={isCompleted ? 'success' : 'warning'} size="sm" className="font-semibold">
              {isCompleted ? 'Render Complete' : 'Rendering in Progress'}
            </Badge>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {isCompleted ? 'Master Video Compiled' : 'Compiling Master Commercial'}
            </h3>
            <p className="text-xs text-[#888] max-w-sm mx-auto leading-relaxed">
              {renderStatus}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#666]">Encoding 4K (60 FPS)</span>
              <span className="text-[#E7FE25] font-bold">{renderProgress}%</span>
            </div>
            <div className="h-2 w-full bg-[#181818] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-[#E7FE25] rounded-full transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-center gap-3">
            {isCompleted ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/campaigns/${campaignId}/review`)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="font-bold shadow-lg"
              >
                Proceed to Final Review & Export
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#888]">
                <div className="h-3 w-3 border-2 border-[#E7FE25] border-t-transparent rounded-full animate-spin" />
                <span>GPU Render Pipeline Active...</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
