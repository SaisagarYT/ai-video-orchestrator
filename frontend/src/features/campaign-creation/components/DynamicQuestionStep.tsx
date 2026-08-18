import React, { useState, useEffect } from 'react';
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
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Top Question Stepper Navigation */}
      <div className="p-4 rounded-2xl bg-[#0E0E0E] border border-[#1C1C1C] space-y-2.5 shadow-md">
        <div className="flex items-center justify-between text-xs text-[#888] font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#E7FE25]" />
            <span>AI Director Interview</span>
          </div>
          <span className="font-mono text-[11px] text-[#E7FE25] font-bold">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-[#E7FE25] text-black shadow-sm font-bold'
                    : isAnswered
                    ? 'bg-[#141414] border border-[#10B981]/50 text-[#10B981]'
                    : 'bg-[#121212] border border-[#202020] text-[#666]'
                }`}
              >
                {isAnswered && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="font-mono text-[10px]">0{idx + 1}</span>
                )}
                <span className="capitalize">{q.field?.replace(/_/g, ' ') || `Step ${idx + 1}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dynamic Question Studio Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E0E0E] border border-[#1E1E1E] space-y-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="lime" size="sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Dynamic Interview
            </Badge>
            {currentQuestion.required && (
              <span className="text-[10px] text-[#777] font-semibold uppercase tracking-wider">
                Required for Creative Bible
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {currentQuestion.question}
          </h2>
          <p className="text-xs text-[#888]">
            KANGGIRD is refining camera trajectory, audience psychology, and storyboard duration.
          </p>
        </div>

        {/* Suggestion Pills */}
        {currentQuestion.suggested_options && currentQuestion.suggested_options.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888] flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              <span>Recommended Directives (Click to apply)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.suggested_options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPill(opt)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left ${
                    selectedPill === opt
                      ? 'bg-[#E7FE25] text-black border-[#E7FE25] font-bold shadow-sm'
                      : 'bg-[#141414] border-[#242424] text-[#CCC] hover:text-white hover:border-[#383838]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#888]">
              Your Response
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
              className="w-full p-4 rounded-2xl bg-[#141414] border border-[#242424] text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#E7FE25] transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Optional File Attachment Cue */}
          <div className="p-3.5 rounded-2xl border border-dashed border-[#242424] bg-[#121212] flex items-center justify-between text-xs text-[#777]">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-[#E7FE25]" />
              <span>Attach reference image or logo asset (Optional)</span>
            </div>
            <label className="px-3 py-1 rounded-lg bg-[#181818] border border-[#2A2A2A] text-[11px] font-semibold text-white hover:bg-[#222] cursor-pointer">
              Browse File
              <input type="file" className="hidden" />
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#1C1C1C]">
            {currentQIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRewind(currentQIndex - 1)}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Previous Step
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
              className="font-bold px-6 shadow-lg"
            >
              {currentQIndex === session.clarification_questions.length - 1
                ? 'Synthesize Creative Brief'
                : 'Next Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
