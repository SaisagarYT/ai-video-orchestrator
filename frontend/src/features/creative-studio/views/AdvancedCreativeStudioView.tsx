import { useParams, useNavigate } from 'react-router-dom';
import { useCreativeStudio } from '../hooks/useCreativeStudio';
import { CameraOpticsControls } from '../components/CameraOpticsControls';
import { MotionDynamicsControls } from '../components/MotionDynamicsControls';
import { LightingPaletteControls } from '../components/LightingPaletteControls';
import { ReferenceAssetDeck } from '../components/ReferenceAssetDeck';
import { LivePromptCompilerPreview } from '../components/LivePromptCompilerPreview';
import { WorkspaceContainer } from '../../../components/layout/workspace/WorkspaceContainer';
import { CampaignHeader } from '../../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../../navigation/CampaignNavTabs';
import { WorkspaceLoadingSkeleton } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Sparkles,
  Monitor,
  Smartphone,
  Square,
  ArrowLeft,
} from 'lucide-react';

export function AdvancedCreativeStudioView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const {
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
    updateAspectRatio,
    updateCustomDirectives,
    updateNegativePrompt,
    addReference,
    removeReference,
    updateReferenceWeight,
    resetToAIRecommendation,
    saveSpecification,
    generateFramePreview,
  } = useCreativeStudio(campaignId);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-[var(--bg-app)]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  if (error && !spec.campaignId) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-[var(--bg-app)]">
        <ErrorState
          title="Failed to Load Creative Studio"
          description="Could not connect to the campaign specification service."
          error={error}
          onRetry={() => window.location.reload()}
          onGoHome={() => navigate('/campaigns')}
        />
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Campaigns', onClick: () => navigate('/campaigns') },
    { label: spec.title, onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
    { label: 'Creative Studio', isCurrent: true },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] font-app">
      {/* 1. Contextual Header */}
      <CampaignHeader
        campaignName={spec.title}
        status="strategy_generated"
        metadata={`35mm Cinematography Studio • ${spec.aspectRatio} Format • Master 60s Commercial`}
        breadcrumbs={breadcrumbs}
        secondaryAction={{
          label: 'Reset to AI Recommendation',
          onClick: resetToAIRecommendation,
          icon: <RotateCcw className="h-3.5 w-3.5" />,
        }}
        primaryAction={{
          label: isSaving ? 'Saving...' : 'Save Creative Specification',
          onClick: saveSpecification,
          isLoading: isSaving,
          icon: <Save className="h-3.5 w-3.5" />,
        }}
      />

      {/* 2. Mode Switcher & Aspect Ratio Bar */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/campaigns/${campaignId}/overview`)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-white mr-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Control Center</span>
          </button>

          <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => navigate(`/campaigns/new`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Beginner AI Mode</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs cursor-default"
            >
              <Sliders className="h-3 w-3" />
              <span>Advanced Studio (Pro)</span>
            </button>
          </div>
        </div>

        {/* Aspect Ratio Fast Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">Aspect Ratio:</span>
          {[
            { id: '16:9', label: '16:9 Desktop', icon: <Monitor className="h-3 w-3" /> },
            { id: '9:16', label: '9:16 Mobile', icon: <Smartphone className="h-3 w-3" /> },
            { id: '1:1', label: '1:1 Square', icon: <Square className="h-3 w-3" /> },
          ].map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => updateAspectRatio(fmt.id as '16:9' | '9:16' | '1:1')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                spec.aspectRatio === fmt.id
                  ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                  : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {fmt.icon}
              <span>{fmt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Success Notification Toast */}
      {saveSuccess && (
        <div className="bg-[#12B886] text-black px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-all">
          <CheckCircle2 className="h-4 w-4" />
          <span>Creative specification successfully saved and synced with backend orchestration pipeline!</span>
        </div>
      )}

      {/* 4. Contextual Campaign Navigation Tabs */}
      <CampaignNavTabs
        activeSection="concepts"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* 5. Main Studio Grid */}
      <WorkspaceContainer layoutMode="full-width" className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Cinematography & Optical Parameters (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <CameraOpticsControls
              camera={spec.camera}
              onChange={updateCamera}
            />

            <MotionDynamicsControls
              motion={spec.motion}
              onChange={updateMotion}
            />

            <LightingPaletteControls
              lighting={spec.lighting}
              onChange={updateLighting}
            />

            <ReferenceAssetDeck
              references={spec.references}
              onAddReference={addReference}
              onRemoveReference={removeReference}
              onUpdateWeight={updateReferenceWeight}
            />
          </div>

          {/* Right Column: Live Prompt Compiler & Frame Simulation (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
            <LivePromptCompilerPreview
              compiledPrompt={compiledPrompt}
              customDirectives={spec.customPromptDirectives}
              negativePrompt={spec.negativePrompt}
              previewUrl={previewUrl}
              isGeneratingPreview={isGeneratingPreview}
              onUpdateCustomDirectives={updateCustomDirectives}
              onUpdateNegativePrompt={updateNegativePrompt}
              onGeneratePreview={generateFramePreview}
            />
          </div>
        </div>
      </WorkspaceContainer>
    </div>
  );
}
