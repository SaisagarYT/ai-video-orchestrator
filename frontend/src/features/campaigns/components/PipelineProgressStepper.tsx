import { useNavigate } from 'react-router-dom';
import type { CampaignProgressData } from '../types/workspace';
import {
  CheckCircle2,
  FileText,
  Building2,
  BrainCircuit,
  Lightbulb,
  Layers,
  Clapperboard,
  Wand2,
  ShieldCheck,
  Film,
} from 'lucide-react';

interface PipelineProgressStepperProps {
  campaignId: string;
  progress: CampaignProgressData;
}

interface PipelineStep {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isActive: boolean;
}

export function PipelineProgressStepper({ campaignId, progress }: PipelineProgressStepperProps) {
  const navigate = useNavigate();

  const steps: PipelineStep[] = [
    {
      id: 'brief',
      label: '1. Brief',
      route: `/campaigns/${campaignId}/brief`,
      icon: <FileText className="h-3.5 w-3.5" />,
      isCompleted: progress.brief_completed,
      isActive: progress.current_stage === 'BRIEF',
    },
    {
      id: 'context',
      label: '2. Context',
      route: `/campaigns/${campaignId}/brief`,
      icon: <Building2 className="h-3.5 w-3.5" />,
      isCompleted: progress.brief_completed,
      isActive: false,
    },
    {
      id: 'strategy',
      label: '3. Strategy',
      route: `/campaigns/${campaignId}/strategy`,
      icon: <BrainCircuit className="h-3.5 w-3.5" />,
      isCompleted: progress.strategy_completed,
      isActive: progress.current_stage === 'STRATEGY',
    },
    {
      id: 'concept',
      label: '4. Concept',
      route: `/campaigns/${campaignId}/concepts`,
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      isCompleted: progress.concept_selected,
      isActive: progress.current_stage === 'CONCEPTS',
    },
    {
      id: 'storyboard',
      label: '5. Storyboard',
      route: `/campaigns/${campaignId}/storyboard`,
      icon: <Layers className="h-3.5 w-3.5" />,
      isCompleted: progress.storyboard_ready,
      isActive: progress.current_stage === 'STORYBOARD',
    },
    {
      id: 'scenes',
      label: '6. Scenes',
      route: `/campaigns/${campaignId}/scenes`,
      icon: <Clapperboard className="h-3.5 w-3.5" />,
      isCompleted: progress.scenes_total_count > 0,
      isActive: progress.current_stage === 'GENERATION' && !progress.scenes_generated,
    },
    {
      id: 'generation',
      label: '7. Generation',
      route: `/campaigns/${campaignId}/scenes`,
      icon: <Wand2 className="h-3.5 w-3.5" />,
      isCompleted: progress.scenes_generated,
      isActive: progress.current_stage === 'GENERATION',
    },
    {
      id: 'quality',
      label: '8. Quality',
      route: `/campaigns/${campaignId}/quality`,
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      isCompleted: progress.quality_evaluated,
      isActive: progress.current_stage === 'EVALUATION',
    },
    {
      id: 'final',
      label: '9. Final Ad',
      route: `/campaigns/${campaignId}/final`,
      icon: <Film className="h-3.5 w-3.5" />,
      isCompleted: progress.final_rendered,
      isActive: progress.current_stage === 'RENDER' || progress.current_stage === 'COMPLETED',
    },
  ];

  return (
    <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-4 shadow-sm font-app">
      {/* Top Header Row with Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
            Production Pipeline Status
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            End-to-end commercial generation from creative brief to final 4K/1080p master render.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-mono-code font-bold text-[var(--brand-lime)]">
              {progress.progress_percentage}%
            </span>
            <span className="text-[11px] text-[var(--text-muted)] ml-1">Complete</span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full h-1.5 bg-[var(--bg-surface-sunken)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#013F32] via-[var(--brand-lime)] to-[#12B886] transition-all duration-500 rounded-full"
          style={{ width: `${Math.max(5, progress.progress_percentage)}%` }}
        />
      </div>

      {/* 9-Stage Stepper Grid / Horizontal Scroll */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 pt-1">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => navigate(step.route)}
            className={`p-2.5 rounded-[var(--radius-lg)] border flex flex-col items-center justify-between text-center gap-1.5 transition-all cursor-pointer group ${
              step.isCompleted
                ? 'bg-[var(--bg-surface-elevated)] border-[#12B886]/40 text-[#12B886]'
                : step.isActive
                ? 'bg-[var(--brand-lime-muted)] border-[var(--brand-lime)]/60 text-[var(--brand-lime)] font-bold shadow-xs'
                : 'bg-[var(--bg-surface-sunken)]/50 border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
            }`}
          >
            <div className="flex items-center justify-center">
              {step.isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-[#12B886]" />
              ) : (
                step.icon
              )}
            </div>
            <span className="text-[11px] font-medium leading-tight truncate w-full">
              {step.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
