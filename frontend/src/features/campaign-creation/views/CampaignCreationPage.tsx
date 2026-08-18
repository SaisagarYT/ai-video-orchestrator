import { useNavigate } from 'react-router-dom';
import { useCampaignInterview } from '../hooks/useCampaignInterview';
import { InitialPromptStep } from '../components/InitialPromptStep';
import { DynamicQuestionStep } from '../components/DynamicQuestionStep';
import { BriefReviewStep } from '../components/BriefReviewStep';
import { AdvancedModeForm } from '../components/AdvancedModeForm';
import { ArrowLeft, Sparkles, Sliders, Layers } from 'lucide-react';

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
      navigate(`/campaigns/${campaignId}/strategy`);
    } catch {
      // error handled in hook
    }
  };

  const handleAdvancedSubmit = async () => {
    try {
      const campaignId = await finalizeCampaign();
      navigate(`/campaigns/${campaignId}/strategy`);
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
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#060606] min-h-0 text-white select-none">
      {/* Studio Header Bar */}
      <div className="bg-[#0A0A0A] border-b border-[#1C1C1C] px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Workspace</span>
          </button>
          <span className="text-[#333]">•</span>
          <div className="flex items-center gap-1.5 text-xs text-[#AAA]">
            <Layers className="h-3.5 w-3.5 text-[#E7FE25]" />
            <span className="font-semibold text-white">New Commercial Studio</span>
          </div>
        </div>

        {/* Studio Mode Selector */}
        <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#222222] self-center sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMode('beginner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'beginner'
                ? 'bg-[#E7FE25] text-black shadow-sm'
                : 'text-[#777777] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Director Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('advanced')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'advanced'
                ? 'bg-[#E7FE25] text-black shadow-sm'
                : 'text-[#777777] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Pro Manual Mode</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
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
