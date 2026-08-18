import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../../components/ui';
import {
  FileText,
  BrainCircuit,
  Lightbulb,
  Layers,
  Clapperboard,
  FolderOpen,
  ShieldCheck,
  Film,
  ArrowRight,
} from 'lucide-react';

interface StageNavigationGridProps {
  campaignId: string;
}

export function StageNavigationGrid({ campaignId }: StageNavigationGridProps) {
  const navigate = useNavigate();

  const stages = [
    {
      title: 'Creative Brief',
      route: `/campaigns/${campaignId}/brief`,
      desc: 'Define business goals, target audience, brand color palette, and audio voice parameters.',
      icon: <FileText className="h-4 w-4 text-[var(--brand-lime)]" />,
      tag: 'Step 1',
    },
    {
      title: 'Market Strategy',
      route: `/campaigns/${campaignId}/strategy`,
      desc: 'Autonomous market analysis, consumer emotional triggers, and messaging pillars.',
      icon: <BrainCircuit className="h-4 w-4 text-[#339AF0]" />,
      tag: 'Step 2',
    },
    {
      title: 'Creative Concepts',
      route: `/campaigns/${campaignId}/concepts`,
      desc: 'Synthesize 4 distinctive narrative angles and choose the primary commercial hook.',
      icon: <Lightbulb className="h-4 w-4 text-[#FCC419]" />,
      tag: 'Step 3',
    },
    {
      title: 'Storyboard Studio',
      route: `/campaigns/${campaignId}/storyboard`,
      desc: 'Shot-by-shot visual prompts, 35mm camera motion cues, and synchronized script.',
      icon: <Layers className="h-4 w-4 text-[#51CF66]" />,
      tag: 'Step 4',
    },
    {
      title: 'Scene Generator',
      route: `/campaigns/${campaignId}/scenes`,
      desc: 'Multi-modal provider rendering, high-res visual assets, and voiceover speech audio.',
      icon: <Clapperboard className="h-4 w-4 text-[#FF922B]" />,
      tag: 'Step 5',
    },
    {
      title: 'Asset Library',
      route: `/campaigns/${campaignId}/assets`,
      desc: 'Centralized MinIO object storage for logos, raw video clips, and audio stems.',
      icon: <FolderOpen className="h-4 w-4 text-[#845EF7]" />,
      tag: 'Step 6',
    },
    {
      title: 'Quality Gate',
      route: `/campaigns/${campaignId}/quality`,
      desc: 'Multi-modal evaluation checking narrative flow, color grading, and audio ducking.',
      icon: <ShieldCheck className="h-4 w-4 text-[#20C997]" />,
      tag: 'Step 7',
    },
    {
      title: 'Final Master Video',
      route: `/campaigns/${campaignId}/final`,
      desc: 'Broadcast-grade H.264/AAC MP4 master rendering and high-speed delivery export.',
      icon: <Film className="h-4 w-4 text-[var(--brand-lime)]" />,
      tag: 'Step 8',
    },
  ];

  return (
    <div className="space-y-3 font-app">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
            Pipeline Sub-Workspaces
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Direct access to every stage of the autonomous commercial video production pipeline.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stg, i) => (
          <Card
            key={i}
            onClick={() => navigate(stg.route)}
            className="border-[var(--border-default)] hover:border-[var(--brand-lime)]/50 transition-all duration-150 cursor-pointer flex flex-col justify-between group"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                  {stg.icon}
                </div>
                <Badge variant="outline" size="sm">
                  {stg.tag}
                </Badge>
              </div>
              <CardTitle className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-lime)] transition-colors mt-2">
                {stg.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                {stg.desc}
              </p>
              <div className="flex items-center gap-1 text-[var(--brand-lime)] text-[11px] font-semibold group-hover:translate-x-1 transition-transform pt-1 border-t border-[var(--border-subtle)]">
                <span>Enter Workspace</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
