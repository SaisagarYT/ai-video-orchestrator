import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Film,
  Plus,
  Play,
  ArrowRight,
  Clock,
  Trash2,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { CampaignSummary } from '../types';

interface CampaignsGridProps {
  campaigns: CampaignSummary[];
  isLoading: boolean;
  onDeleteCampaign?: (id: string) => Promise<void>;
}

export function CampaignsGrid({
  campaigns,
  isLoading,
  onDeleteCampaign,
}: CampaignsGridProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Helper to map status to human stage & route
  const getStageInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { stageNumber: 9, stageName: 'Review & Export', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', route: 'review', progress: 100 };
      case 'rendering':
        return { stageNumber: 8, stageName: 'Master Compilation', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', route: 'render', progress: 88 };
      case 'scenes_generating':
      case 'storyboard_ready':
        return { stageNumber: 5, stageName: 'Scene Generation', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', route: 'scenes', progress: 55 };
      case 'strategy_generated':
        return { stageNumber: 3, stageName: 'Concepts Exploration', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', route: 'concepts', progress: 33 };
      case 'draft':
      default:
        return { stageNumber: 1, stageName: 'Creative Brief', color: 'text-zinc-400', bg: 'bg-zinc-800/40', border: 'border-zinc-700/40', route: 'brief', progress: 12 };
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.objective.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'active') return c.status !== 'completed' && c.status !== 'draft';
    if (filterTab === 'completed') return c.status === 'completed';
    if (filterTab === 'draft') return c.status === 'draft';
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    setDeletingId(id);
    try {
      if (onDeleteCampaign) {
        await onDeleteCampaign(id);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight font-app">
              Production Campaigns
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-mono font-semibold text-zinc-300">
              {campaigns.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Active commercial film projects across all 9 orchestration stages
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Filter */}
          <div className="flex items-center bg-[#111413] p-1 rounded-xl border border-white/[0.06] text-xs">
            {(['all', 'active', 'completed', 'draft'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  filterTab === tab
                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-xl bg-[#111413] border border-white/[0.06] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 w-40 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 rounded-2xl bg-[#0E1110] border border-white/[0.06] p-5 animate-pulse space-y-4"
            >
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-6 bg-white/10 rounded w-3/4" />
              <div className="h-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-white/[0.1] bg-[#0A0D0C] p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-[#121614] border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <Film className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-white">No campaigns found</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {searchQuery
                ? `No campaign matches "${searchQuery}". Try adjusting your search or filter.`
                : 'Start your first commercial video orchestration workflow now.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/campaigns/new')}
            className="h-10 px-5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create New Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign, idx) => {
            const stage = getStageInfo(campaign.status);

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onClick={() => navigate(`/campaigns/${campaign.id}/${stage.route}`)}
                className="group relative rounded-2xl bg-[#0F1211] border border-white/[0.07] hover:border-emerald-500/40 p-5 transition-all duration-300 cursor-pointer shadow-md hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-4 overflow-hidden"
              >
                {/* Subtle Hover Gradient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/5 via-teal-500/5 to-transparent blur-2xl pointer-events-none group-hover:from-emerald-500/15 transition-all duration-500" />

                {/* Top Row: Format & Stage Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.06]">
                      {campaign.aspect_ratio || '16:9'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400">
                      {campaign.duration_seconds || 30}s
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${stage.bg} ${stage.color} ${stage.border} flex items-center gap-1`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                    Stage {stage.stageNumber}: {stage.stageName}
                  </span>
                </div>

                {/* Middle: Title & Product Details */}
                <div className="relative z-10 space-y-1.5">
                  <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 font-app">
                    {campaign.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium line-clamp-1">
                    {campaign.product_name || 'Commercial Video'}
                  </p>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {campaign.product_description || campaign.objective || 'Automated AI commercial workflow.'}
                  </p>
                </div>

                {/* Bottom Progress Bar & Actions */}
                <div className="relative z-10 pt-3 border-t border-white/[0.05] space-y-3">
                  {/* Visual 9-Stage Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Pipeline Progress</span>
                      <span className="text-zinc-400 font-semibold">{stage.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {campaign.created_at
                        ? new Date(campaign.created_at).toLocaleDateString()
                        : 'Recent'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, campaign.id)}
                        disabled={deletingId === campaign.id}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/campaigns/${campaign.id}/${stage.route}`);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Resume</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
