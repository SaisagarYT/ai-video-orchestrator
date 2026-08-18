import { useNavigate } from 'react-router-dom';
import type { CampaignProgressData, CampaignData } from '../types/workspace';
import { Button } from '../../../components/ui';
import {
  ArrowRight,
  BrainCircuit,
  Lightbulb,
  Layers,
  Wand2,
  ShieldCheck,
  Film,
  CheckCircle2,
} from 'lucide-react';

interface NextActionBannerProps {
  campaign: CampaignData;
  progress: CampaignProgressData;
}

export function NextActionBanner({ campaign, progress }: NextActionBannerProps) {
  const navigate = useNavigate();

  const getNextActionConfig = () => {
    switch (progress.current_stage) {
      case 'BRIEF':
        return {
          badge: 'Next Required Action: Creative Brief',
          title: 'Complete Business Brief & Brand Guidelines',
          description:
            'Provide product specifications, brand color guidelines, and target audience to feed the autonomous marketing strategy engine.',
          ctaLabel: 'Configure Creative Brief',
          ctaRoute: `/campaigns/${campaign.id}/brief`,
          icon: <BrainCircuit className="h-5 w-5 text-[var(--brand-lime)]" />,
        };
      case 'STRATEGY':
        return {
          badge: 'Next Required Action: Marketing Strategy',
          title: 'Synthesize Market Strategy with Gemini Flash',
          description:
            'Trigger the Context Engine to extract customer emotional triggers, competitive positioning, and messaging pillars.',
          ctaLabel: 'Generate AI Marketing Strategy',
          ctaRoute: `/campaigns/${campaign.id}/concepts`,
          icon: <BrainCircuit className="h-5 w-5 text-[var(--brand-lime)]" />,
        };
      case 'CONCEPTS':
        return {
          badge: 'Next Required Action: Creative Angle Selection',
          title: 'Review and Select from 4 AI Creative Concepts',
          description:
            'Choose between Emotional Transformation, Problem-Agitation, Product Showcase, or Lifestyle Narrative concepts.',
          ctaLabel: 'Select Creative Angle',
          ctaRoute: `/campaigns/${campaign.id}/concepts`,
          icon: <Lightbulb className="h-5 w-5 text-[var(--brand-lime)]" />,
        };
      case 'STORYBOARD':
        return {
          badge: 'Next Required Action: Storyboard Assembly',
          title: 'Compile 35mm Visual Storyboard & Shot List',
          description:
            'Generate shot-by-shot visual prompts, camera motion optics, and synchronized voiceover narration for 5 scenes.',
          ctaLabel: 'Open Storyboard Studio',
          ctaRoute: `/campaigns/${campaign.id}/storyboard`,
          icon: <Layers className="h-5 w-5 text-[var(--brand-lime)]" />,
        };
      case 'GENERATION':
        return {
          badge: 'Next Required Action: Multi-Modal Media Generation',
          title: `Generate Video Clips (${progress.scenes_generated_count}/${progress.scenes_total_count} Scenes Ready)`,
          description:
            'Render pixel-perfect video scenes using multi-modal visual providers and generate natural voiceover audio tracks.',
          ctaLabel: 'Generate Scene Assets',
          ctaRoute: `/campaigns/${campaign.id}/scenes`,
          icon: <Wand2 className="h-5 w-5 text-[var(--brand-lime)]" />,
        };
      case 'EVALUATION':
        return {
          badge: 'Next Required Action: Quality Evaluation',
          title: 'Run AI Quality Gate & Consistency Scoring',
          description:
            'Evaluate narrative pacing, color grading consistency, audio ducking, and visual appeal before master assembly.',
          ctaLabel: 'Run Quality Gate Check',
          ctaRoute: `/campaigns/${campaign.id}/quality`,
          icon: <ShieldCheck className="h-5 w-5 text-[var(--brand-lime)]" />,
        };
      case 'RENDER':
        return {
          badge: 'Next Required Action: Master Video Assembly',
          title: 'Render Master Multi-Track Video Commercial',
          description:
            `Assemble all approved scene clips with Ken Burns camera zoom, voiceover narration, and ${campaign.aspect_ratio || '16:9'} layout.`,
          ctaLabel: 'Render Final Commercial MP4',
          ctaRoute: `/campaigns/${campaign.id}/final`,
          icon: <Film className="h-5 w-5 text-[var(--brand-lime)]" />,
        };
      case 'COMPLETED':
      default:
        return {
          badge: 'Pipeline Status: Master Render Ready',
          title: 'Broadcast-Grade Commercial Ready for Export',
          description:
            `Your ${campaign.duration_seconds || 60}s commercial video has been compiled, evaluated (100% Quality Pass), and rendered in H.264 MP4.`,
          ctaLabel: 'Download & View Master Ad',
          ctaRoute: `/campaigns/${campaign.id}/final`,
          icon: <CheckCircle2 className="h-5 w-5 text-[#12B886]" />,
        };
    }
  };

  const action = getNextActionConfig();

  return (
    <div className="p-6 rounded-[var(--radius-xl)] bg-gradient-to-br from-[#013F32] via-[#022A22] to-[#041410] border border-[#025745]/60 text-white relative overflow-hidden shadow-lg font-app">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--brand-lime)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-lime)] text-[#161616] text-[10px] font-bold tracking-wider uppercase shadow-xs">
              Recommended Next Step
            </span>
            <span className="text-xs text-white/70 font-mono-code">
              Stage: {progress.current_stage}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            {action.icon}
            <span>{action.title}</span>
          </h3>

          <p className="text-xs text-white/80 leading-relaxed">
            {action.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(action.ctaRoute)}
            rightIcon={<ArrowRight className="h-4 w-4 text-[#161616]" />}
            className="w-full sm:w-auto font-bold text-xs sm:text-sm h-11 px-6 shadow-[0_0_20px_rgba(231,254,37,0.35)]"
          >
            {action.ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
