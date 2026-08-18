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
  const industry = (extracted.industry as string) || 'General Commercial';
  const objective = (extracted.campaign_objective as string) || 'Drive Brand Awareness & Conversions';
  const targetAudience = (extracted.target_audience as string) || 'Target Consumers & High-Intent Buyers';
  const callToAction = (extracted.call_to_action as string) || 'Shop Now & Experience Innovation';
  const visualStyle = (extracted.visual_style_preferences as string) || '35mm Anamorphic Film, Dramatic Lighting, Dynamic Macro Cues';
  const toneOfVoice = (extracted.tone_of_voice as string) || 'Cinematic Luxury & High Impact';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#162B21] border border-emerald-500/30 text-[#10B981] text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Brand Intelligence Synthesized • Ready for Strategy</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Review Autonomous Commercial Brief
        </h1>
        <p className="text-xs sm:text-sm text-[#888888] max-w-xl mx-auto">
          KANGGIRD has synthesized your brand directives into a verified creative blueprint. Approve to launch the AI strategy engine.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Structured Brief Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand & Product Deck */}
        <Card className="bg-[#0E0E0E] border-[#1C1C1C]">
          <CardHeader className="pb-3 border-b border-[#181818]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#E7FE25]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  Brand & Product Profile
                </CardTitle>
              </div>
              <Badge variant="lime" size="sm">{industry}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs pt-4">
            <div>
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">Product Name</span>
              <div className="font-bold text-sm text-white mt-0.5">{productName}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">Tone of Voice</span>
              <div className="text-xs text-[#CCC] font-medium mt-0.5">{toneOfVoice}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">Original Creative Vision</span>
              <p className="text-[11px] text-[#888] italic mt-0.5 line-clamp-2">
                "{session.raw_input_prompt}"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Marketing Objective Deck */}
        <Card className="bg-[#0E0E0E] border-[#1C1C1C]">
          <CardHeader className="pb-3 border-b border-[#181818]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#10B981]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  Objective & Audience
                </CardTitle>
              </div>
              <Badge variant="success" size="sm">Strategy Ready</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs pt-4">
            <div>
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">Primary Goal</span>
              <div className="font-bold text-xs text-white mt-0.5">{objective}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">Target Demographic</span>
              <div className="text-xs text-[#CCC] mt-0.5">{targetAudience}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">Call to Action (CTA)</span>
              <div className="font-bold text-xs text-[#E7FE25] mt-0.5">{callToAction}</div>
            </div>
          </CardContent>
        </Card>

        {/* Cinematography & Rendering Specs */}
        <Card className="bg-[#0E0E0E] border-[#1C1C1C] md:col-span-2">
          <CardHeader className="pb-3 border-b border-[#181818]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#3B82F6]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  Cinematography & Format Specifications
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm" className="border-[#333] text-white">16:9 / 9:16 Multi-Format</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs pt-4">
            <div>
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">Visual Style Directives</span>
              <p className="text-xs text-[#CCC] mt-0.5 leading-relaxed">{visualStyle}</p>
            </div>

            <div className="pt-2 border-t border-[#181818] grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#121212] border border-[#202020]">
                <span className="text-[10px] text-[#666] block">Master Resolution</span>
                <span className="font-mono font-bold text-xs text-white">4K UHD (60 FPS)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#202020]">
                <span className="text-[10px] text-[#666] block">Audio Master</span>
                <span className="font-mono font-bold text-xs text-white">Voiceover + BGM + SFX</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#202020]">
                <span className="text-[10px] text-[#666] block">Pipeline Sequence</span>
                <span className="font-mono font-bold text-xs text-[#E7FE25]">9 Studio Stages</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E] shadow-xl">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRestart}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          Start New Brief
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onApprove}
          isLoading={isLoading}
          leftIcon={<Sparkles className="h-4 w-4" />}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="w-full sm:w-auto font-bold px-8 shadow-xl"
        >
          Approve Brief & Launch Strategy Studio
        </Button>
      </div>
    </div>
  );
}
