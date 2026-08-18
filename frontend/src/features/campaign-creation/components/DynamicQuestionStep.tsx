import { useState, useEffect } from 'react';
import type { ContextSessionState } from '../types';
import { Button, Badge } from '../../../components/ui';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Upload,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface DynamicQuestionStepProps {
  session: ContextSessionState;
  onSubmitAnswer: (fieldOrId: string, answer: string) => void;
  onRewind: (index: number) => void;
  isLoading: boolean;
  error?: string | null;
}

export function DynamicQuestionStep({
  session,
  onSubmitAnswer,
  onRewind,
  isLoading,
  error,
}: DynamicQuestionStepProps) {
  const currentQIndex = session.current_question_index;
  const currentQuestion = session.clarification_questions[currentQIndex];

  const [answerText, setAnswerText] = useState('');
  const [selectedPill, setSelectedPill] = useState<string | null>(null);

  // Sync answerText if user had already answered this question previously
  useEffect(() => {
    if (currentQuestion) {
      const existing = session.user_answers[currentQuestion.field] || session.user_answers[currentQuestion.id] || '';
      setAnswerText(existing);
      setSelectedPill(existing ? existing : null);
    }
  }, [currentQuestion, session.user_answers]);

  if (!currentQuestion) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerText.trim()) {
      onSubmitAnswer(currentQuestion.field || currentQuestion.id, answerText.trim());
      setAnswerText('');
      setSelectedPill(null);
    }
  };

  const handleSelectPill = (pill: string) => {
    setSelectedPill(pill);
    setAnswerText(pill);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-app py-2">
      {/* Top Conversation History & Rewind Timeline */}
      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[var(--brand-lime)]" />
            <span>Interview Timeline</span>
          </div>
          <span className="font-mono-code text-[11px] text-[var(--brand-lime)]">
            Question {currentQIndex + 1} of {session.clarification_questions.length}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {session.clarification_questions.map((q, idx) => {
            const isAnswered = !!(session.user_answers[q.field] || session.user_answers[q.id]);
            const isCurrent = idx === currentQIndex;

            return (
              <button
                key={q.id || idx}
                type="button"
                onClick={() => onRewind(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                    : isAnswered
                    ? 'bg-[var(--bg-surface-elevated)] border border-[#12B886]/40 text-[#12B886] hover:bg-[var(--bg-surface-active)]'
                    : 'bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {isAnswered && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="font-mono-code text-[10px]">0{idx + 1}</span>
                )}
                <span className="capitalize">{q.field?.replace(/_/g, ' ') || `Step ${idx + 1}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dynamic Question Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="lime" size="sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Dynamic Question
            </Badge>
            {currentQuestion.required && (
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                Required for Brief
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {currentQuestion.question}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            KANGGIRD is refining the camera style, narrative pacing, and audience targeting.
          </p>
        </div>

        {/* Quick Suggestion Pills */}
        {currentQuestion.suggested_options && currentQuestion.suggested_options.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              <span>Suggested Options (Click to select)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.suggested_options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPill(opt)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left ${
                    selectedPill === opt
                      ? 'bg-[var(--brand-lime-muted)] border-[var(--brand-lime)] text-[var(--text-primary)] font-bold shadow-xs'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Answer Text Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Your Answer
            </label>
            <textarea
              value={answerText}
              onChange={(e) => {
                setAnswerText(e.target.value);
                setSelectedPill(null);
              }}
              rows={3}
              required
              placeholder="Type your response or refine the selected option..."
              className="w-full p-4 rounded-xl bg-[var(--bg-surface-sunken)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-lime)] transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Optional Asset Upload Mock/Dropzone */}
          <div className="p-3.5 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-sunken)]/50 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-[var(--brand-lime)]" />
              <span>Attach reference image / brand logo (Optional)</span>
            </div>
            <label className="px-3 py-1 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-active)] cursor-pointer">
              Choose File
              <input type="file" className="hidden" />
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {currentQIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRewind(currentQIndex - 1)}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Previous Question
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!answerText.trim() || isLoading}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="font-bold shadow-[0_0_15px_rgba(231,254,37,0.3)]"
            >
              {currentQIndex === session.clarification_questions.length - 1
                ? 'Synthesize Campaign Brief'
                : 'Next Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
