import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  ArrowRight,
  Clock,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { CampaignSummary } from '../types';

interface RecentCampaignsListProps {
  campaigns: CampaignSummary[];
  isLoading: boolean;
  onDeleteCampaign?: (id: string) => Promise<void>;
}

export function RecentCampaignsList({
  campaigns,
  isLoading,
  onDeleteCampaign,
}: RecentCampaignsListProps) {
  const navigate = useNavigate();

  const getStageInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: '9. Final Review', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', route: 'review' };
      case 'rendering':
        return { label: '8. Compilation', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', route: 'render' };
      case 'scenes_generating':
      case 'storyboard_ready':
        return { label: '5. Scene Generator', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', route: 'scenes' };
      case 'strategy_generated':
        return { label: '3. Concepts A/B', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', route: 'concepts' };
      case 'draft':
      default:
        return { label: '1. Creative Brief', color: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40', route: 'brief' };
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-2">
        <div className="h-12 bg-white/[0.03] rounded-xl animate-pulse" />
        <div className="h-12 bg-white/[0.03] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 pt-6 border-t border-white/[0.06]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Your Active Productions
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">
            {campaigns.length}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {campaigns.map((c) => {
          const stage = getStageInfo(c.status);

          return (
            <div
              key={c.id}
              onClick={() => navigate(`/campaigns/${c.id}/${stage.route}`)}
              className="group p-3 rounded-xl bg-[#0E1110] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 shrink-0 transition-colors">
                  <Film className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {c.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {c.product_name || c.objective}
                  </p>
                </div>
              </div>

              {/* Right Metadata & Action */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400">
                  {c.aspect_ratio || '9:16'}
                </span>

                <span
                  className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded border ${stage.color}`}
                >
                  {stage.label}
                </span>

                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
