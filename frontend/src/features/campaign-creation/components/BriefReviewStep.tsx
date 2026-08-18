import type { ContextSessionState } from '../types';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';
import {
  Sparkles,
  CheckCircle2,
  Building2,
  Target,
  Palette,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface BriefReviewStepProps {
  session: ContextSessionState;
  onApprove: () => void;
  onRestart: () => void;
  isLoading: boolean;
  error?: string | null;
}

export function BriefReviewStep({
  session,
  onApprove,
  onRestart,
  isLoading,
  error,
}: BriefReviewStepProps) {
  const extracted = session.extracted_data || {};

  const productName = (extracted.product_name as string) || 'Commercial Campaign';
  const industry = (extracted.industry as string) || 'General';
  const objective = (extracted.campaign_objective as string) || 'Drive Brand Awareness & Conversions';
  const targetAudience = (extracted.target_audience as string) || 'Target Consumers & Food Enthusiasts';
  const callToAction = (extracted.call_to_action as string) || 'Order Now & Learn More';
  const visualStyle = (extracted.visual_style_preferences as string) || '35mm Cinematic Film, Warm Lighting, Macro Camera Shots';
  const toneOfVoice = (extracted.tone_of_voice as string) || 'Sensory, Premium & Inviting';

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-app py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886] text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Information Complete • Ready for Production</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Review Your Autonomous Campaign Brief
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto">
          KANGGIRD has synthesized your responses into a structured creative brief. Approve to launch the autonomous video pipeline.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {/* Structured Brief Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Brand & Product Deck */}
        <Card className="border-[var(--border-default)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[var(--brand-lime)]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Brand & Product Profile
                </CardTitle>
              </div>
              <Badge variant="lime" size="sm">{industry}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Product Name</span>
              <div className="font-bold text-sm text-[var(--text-primary)] mt-0.5">{productName}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Tone of Voice</span>
              <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{toneOfVoice}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Original Vision</span>
              <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5 line-clamp-2">
                "{session.raw_input_prompt}"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Marketing Objective Deck */}
        <Card className="border-[var(--border-default)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[var(--brand-lime)]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Objective & Audience
                </CardTitle>
              </div>
              <Badge variant="forest" size="sm">Strategy Ready</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Primary Goal</span>
              <div className="font-bold text-xs text-[var(--text-primary)] mt-0.5">{objective}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Target Demographic</span>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">{targetAudience}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Call to Action (CTA)</span>
              <div className="font-bold text-xs text-[var(--brand-lime)] mt-0.5">{callToAction}</div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Cinematography & Specs */}
        <Card className="border-[var(--border-default)] md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[var(--brand-lime)]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Cinematography & Format Specifications
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">60s Full Commercial</Badge>
                <Badge variant="outline" size="sm">16:9 / 9:16 Multi-Format</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Visual Style Directives</span>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{visualStyle}</p>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Master Resolution</span>
                <span className="font-mono-code font-bold text-xs text-[var(--text-primary)]">1080p / 4K</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Audio Master</span>
                <span className="font-mono-code font-bold text-xs text-[var(--text-primary)]">Voiceover + Sfx</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Shot Breakdown</span>
                <span className="font-mono-code font-bold text-xs text-[var(--brand-lime)]">5 AI Scenes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRestart}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          Start New Interview
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onApprove}
          isLoading={isLoading}
          leftIcon={<Sparkles className="h-4 w-4" />}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="w-full sm:w-auto font-bold shadow-[0_0_25px_rgba(231,254,37,0.35)]"
        >
          Approve Brief & Launch Control Center
        </Button>
      </div>
    </div>
  );
}
