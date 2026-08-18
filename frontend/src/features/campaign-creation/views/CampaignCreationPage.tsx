import { useNavigate } from 'react-router-dom';
import { useCampaignInterview } from '../hooks/useCampaignInterview';
import { InitialPromptStep } from '../components/InitialPromptStep';
import { DynamicQuestionStep } from '../components/DynamicQuestionStep';
import { BriefReviewStep } from '../components/BriefReviewStep';
import { AdvancedModeForm } from '../components/AdvancedModeForm';
import { ArrowLeft, Sparkles, Sliders } from 'lucide-react';

export function CampaignCreationPage() {
  const navigate = useNavigate();
  const {
    mode,
    setMode,
    session,
    advancedData,
    setAdvancedData,
    isLoading,
    error,
    startInterview,
    submitAnswer,
    rewindToQuestion,
    finalizeCampaign,
    resetInterview,
  } = useCampaignInterview();

  const handleApproveBrief = async () => {
    try {
      const campaignId = await finalizeCampaign();
      navigate(`/campaigns/${campaignId}/overview`);
    } catch {
      // error handled in hook
    }
  };

  const handleAdvancedSubmit = async () => {
    try {
      const campaignId = await finalizeCampaign();
      navigate(`/campaigns/${campaignId}/overview`);
    } catch {
      // error handled in hook
    }
  };

  const handleAdvancedChange = (field: string, value: unknown) => {
    setAdvancedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--bg-app)] min-h-0 font-app">
      {/* Top Header Row */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit to Campaigns</span>
        </button>

        {/* Mode Switcher Pills */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 rounded-xl border border-[var(--border-subtle)] self-center sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('beginner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              mode === 'beginner'
                ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Director Interview (Beginner)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('advanced')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              mode === 'advanced'
                ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Pro Studio Mode (Advanced)</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {mode === 'advanced' ? (
          <AdvancedModeForm
            data={advancedData}
            onChange={handleAdvancedChange}
            onSubmit={handleAdvancedSubmit}
            isLoading={isLoading}
            error={error}
          />
        ) : !session ? (
          <InitialPromptStep
            onSubmit={startInterview}
            isLoading={isLoading}
            error={error}
          />
        ) : session.status === 'COMPLETED' ? (
          <BriefReviewStep
            session={session}
            onApprove={handleApproveBrief}
            onRestart={resetInterview}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <DynamicQuestionStep
            session={session}
            onSubmitAnswer={submitAnswer}
            onRewind={rewindToQuestion}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
