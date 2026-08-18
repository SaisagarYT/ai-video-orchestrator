import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import type { CampaignWorkspaceData } from '../types/workspace';
import { CampaignHeader } from '../../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs, type CampaignSection } from '../../navigation/CampaignNavTabs';
import { WorkspaceContainer } from '../../../components/layout/workspace/WorkspaceContainer';
import { ContextualPanel } from '../../../components/layout/contextual-panel/ContextualPanel';
import { WorkspaceLoadingSkeleton } from '../../../components/ui/LoadingState';
import { ErrorState, NotFoundState } from '../../../components/ui/ErrorState';
import { PipelineProgressStepper } from '../components/PipelineProgressStepper';
import { NextActionBanner } from '../components/NextActionBanner';
import { CreativeBibleSummaryDeck } from '../components/CreativeBibleSummaryDeck';
import { SceneGridPreview } from '../components/SceneGridPreview';
import { StageNavigationGrid } from '../components/StageNavigationGrid';
import { useAppStore } from '../../../store/useAppStore';
import { Button, Input, Label } from '../../../components/ui';
import { Trash2 } from 'lucide-react';

// UUID validation helper
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id?: string): boolean {
  return !!id && UUID_REGEX.test(id);
}

export function CampaignControlCenterView() {
  const { campaignId, section = 'overview' } = useParams<{ campaignId: string; section: CampaignSection }>();
  const navigate = useNavigate();
  const {
    contextualPanelOpen,
    setContextualPanelOpen,
    toggleContextualPanel,
  } = useAppStore();

  const [workspaceData, setWorkspaceData] = useState<CampaignWorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvalidId, setIsInvalidId] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchWorkspace = useCallback(async () => {
    if (!campaignId) return;

    // Check if campaignId is a valid UUID
    if (!isValidUUID(campaignId)) {
      setIsInvalidId(true);
      setIsLoading(false);
      return;
    }

    setIsInvalidId(false);
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<CampaignWorkspaceData>(`/campaigns/${campaignId}/workspace`);
      setWorkspaceData(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to load campaign workspace data from backend.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleDelete = async () => {
    if (!campaignId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/campaigns/${campaignId}`);
      navigate('/campaigns', { replace: true });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete campaign');
      setIsDeleting(false);
    }
  };

  const currentSection = (section || 'overview') as CampaignSection;

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[var(--bg-app)]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  if (isInvalidId || !campaignId) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-[var(--bg-app)]">
        <NotFoundState
          title="Campaign Not Found"
          description="The campaign identifier in the URL is not valid. Please select an active campaign from your workspace overview."
          onGoHome={() => navigate('/campaigns')}
        />
      </div>
    );
  }

  if (error || !workspaceData) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-[var(--bg-app)]">
        {error ? (
          <ErrorState
            title="Failed to Load Campaign Workspace"
            description="Could not connect to the campaign orchestration service."
            error={error}
            onRetry={fetchWorkspace}
            onGoHome={() => navigate('/campaigns')}
          />
        ) : (
          <NotFoundState
            title="Campaign Not Found"
            description="The requested campaign workspace does not exist or has been deleted."
            onGoHome={() => navigate('/campaigns')}
          />
        )}
      </div>
    );
  }

  const { campaign, business, selected_concept, scenes, final_videos, progress } = workspaceData;

  const breadcrumbs = [
    { label: 'Campaigns', onClick: () => navigate('/campaigns') },
    { label: campaign.name, onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
    { label: currentSection.charAt(0).toUpperCase() + currentSection.slice(1), isCurrent: true },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* 1. Contextual Campaign Header */}
      <CampaignHeader
        campaignName={campaign.name}
        status={campaign.status}
        metadata={`${scenes.length} Scenes • ${campaign.duration_seconds || 60}s Duration • ${campaign.aspect_ratio || '16:9'} Format`}
        breadcrumbs={breadcrumbs}
        secondaryAction={{
          label: 'Delete',
          onClick: () => setShowDeleteModal(true),
          icon: <Trash2 className="h-3.5 w-3.5 text-red-400" />,
        }}
        primaryAction={{
          label: progress.final_rendered ? 'Download Master Video' : 'Run Pipeline Step',
          onClick: () => navigate(`/campaigns/${campaignId}/final`),
        }}
        onToggleContextualPanel={() => toggleContextualPanel('Campaign Parameters')}
        contextualPanelOpen={contextualPanelOpen}
      />

      {/* 2. Contextual Campaign Navigation Tabs */}
      <CampaignNavTabs
        activeSection={currentSection}
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* 3. Main Production Workspace Canvas */}
      <WorkspaceContainer
        layoutMode="full-width"
        contextualPanel={
          <ContextualPanel
            isOpen={contextualPanelOpen}
            onClose={() => setContextualPanelOpen(false)}
            title="Campaign Inspector"
            description="Live execution parameters and model settings."
          >
            <div className="space-y-4 font-app">
              <div>
                <Label className="text-[11px]">Campaign Name</Label>
                <Input value={campaign.name} readOnly className="h-8 text-xs bg-[var(--bg-surface-elevated)]" />
              </div>
              <div>
                <Label className="text-[11px]">Primary Aspect Ratio</Label>
                <Input value={campaign.aspect_ratio || '16:9'} readOnly className="h-8 text-xs font-mono-code bg-[var(--bg-surface-elevated)]" />
              </div>
              <div>
                <Label className="text-[11px]">Target Duration</Label>
                <Input value={`${campaign.duration_seconds || 60} seconds`} readOnly className="h-8 text-xs font-mono-code bg-[var(--bg-surface-elevated)]" />
              </div>
              <div>
                <Label className="text-[11px]">Current Stage</Label>
                <Input value={progress.current_stage} readOnly className="h-8 text-xs font-bold text-[var(--brand-lime)] bg-[var(--bg-surface-elevated)]" />
              </div>
              <div>
                <Label className="text-[11px]">Total Scenes</Label>
                <Input value={`${scenes.length} Shots Compiled`} readOnly className="h-8 text-xs font-mono-code bg-[var(--bg-surface-elevated)]" />
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowDeleteModal(true)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Delete Campaign
                </Button>
              </div>
            </div>
          </ContextualPanel>
        }
      >
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-500">
                <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Delete Campaign</h3>
                  <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Are you sure you want to delete <strong className="text-[var(--text-primary)] font-semibold">"{campaign.name}"</strong>? All associated scenes, assets, and rendered videos will be permanently removed.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Delete Campaign
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6 max-w-7xl mx-auto pb-8">
          {/* A. Visual 9-Stage Pipeline Progress Stepper */}
          <PipelineProgressStepper campaignId={campaignId || ''} progress={progress} />

          {/* B. Dynamic "What to Do Next?" Hero Action Banner */}
          <NextActionBanner campaign={campaign} progress={progress} />

          {/* C. Creative Bible & Brand Strategy Summary Deck */}
          <CreativeBibleSummaryDeck
            campaign={campaign}
            business={business}
            selectedConcept={selected_concept}
          />

          {/* D. Cinema Monitor & Shot Breakdown */}
          <SceneGridPreview
            scenes={scenes}
            finalVideos={final_videos}
            campaignAspectRatio={campaign.aspect_ratio}
          />

          {/* E. Fast Navigation to Sub-Workspaces */}
          <StageNavigationGrid campaignId={campaignId || ''} />
        </div>
      </WorkspaceContainer>
    </div>
  );
}
