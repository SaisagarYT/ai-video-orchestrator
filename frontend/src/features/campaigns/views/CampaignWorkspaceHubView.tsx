import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Film,
  Trash2,
  Monitor,
  Smartphone,
  Square,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { WorkspaceContainer } from '../../../components/layout/workspace/WorkspaceContainer';
import { WorkspaceLoadingSkeleton } from '../../../components/ui/LoadingState';
import { Button, Badge } from '../../../components/ui';

interface CampaignItem {
  id: string;
  name: string;
  product_name?: string;
  product_description?: string;
  status: string;
  objective?: string;
  target_platforms?: string;
  created_at?: string;
  updated_at?: string;
  current_stage?: number;
  stage_label?: string;
  next_action_label?: string;
  next_action_route?: string;
}

export function CampaignWorkspaceHubView() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/campaigns/');
      setCampaigns(res.data || []);
    } catch {
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/campaigns/${campaignToDelete.id}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      setCampaignToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to compute pipeline stage and next action
  const getPipelineMeta = (campaign: CampaignItem) => {
    const s = (campaign.status || 'draft').toLowerCase();

    if (s.includes('completed') || s.includes('rendered') || s.includes('final')) {
      return {
        stageNumber: 9,
        stageLabel: 'Stage 9: Final Review & Export',
        nextActionLabel: 'Review & Export Master Video',
        nextActionRoute: `/campaigns/${campaign.id}/review`,
        badgeVariant: 'success' as const,
      };
    }
    if (s.includes('render')) {
      return {
        stageNumber: 8,
        stageLabel: 'Stage 8: Master Compilation',
        nextActionLabel: 'View Render Status',
        nextActionRoute: `/campaigns/${campaign.id}/render`,
        badgeVariant: 'warning' as const,
      };
    }
    if (s.includes('timeline')) {
      return {
        stageNumber: 7,
        stageLabel: 'Stage 7: Multi-Track Timeline',
        nextActionLabel: 'Trigger 4K Master Render',
        nextActionRoute: `/campaigns/${campaign.id}/timeline`,
        badgeVariant: 'default' as const,
      };
    }
    if (s.includes('evaluat') || s.includes('qa') || s.includes('scene_ready')) {
      return {
        stageNumber: 6,
        stageLabel: 'Stage 6: Consistency & QA',
        nextActionLabel: 'Review QA & Assemble Timeline',
        nextActionRoute: `/campaigns/${campaign.id}/evaluation`,
        badgeVariant: 'default' as const,
      };
    }
    if (s.includes('scene') || s.includes('generation')) {
      return {
        stageNumber: 5,
        stageLabel: 'Stage 5: Scene Generation',
        nextActionLabel: 'Generate Scene Assets',
        nextActionRoute: `/campaigns/${campaign.id}/scenes`,
        badgeVariant: 'default' as const,
      };
    }
    if (s.includes('storyboard')) {
      return {
        stageNumber: 4,
        stageLabel: 'Stage 4: Storyboard Shots',
        nextActionLabel: 'Review Script & Generate Scenes',
        nextActionRoute: `/campaigns/${campaign.id}/storyboard`,
        badgeVariant: 'default' as const,
      };
    }
    if (s.includes('concept')) {
      return {
        stageNumber: 3,
        stageLabel: 'Stage 3: Concept Selection',
        nextActionLabel: 'Select Winning Concept',
        nextActionRoute: `/campaigns/${campaign.id}/concepts`,
        badgeVariant: 'default' as const,
      };
    }
    if (s.includes('strategy')) {
      return {
        stageNumber: 2,
        stageLabel: 'Stage 2: Strategy Synthesis',
        nextActionLabel: 'Explore Creative Concepts',
        nextActionRoute: `/campaigns/${campaign.id}/strategy`,
        badgeVariant: 'default' as const,
      };
    }

    // Default: Stage 1 Brief
    return {
      stageNumber: 1,
      stageLabel: 'Stage 1: Creative Brief',
      nextActionLabel: 'Generate AI Strategy',
      nextActionRoute: `/campaigns/${campaign.id}/brief`,
      badgeVariant: 'default' as const,
    };
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = filterFormat === 'all' || (c.target_platforms || '').includes(filterFormat);
    return matchesSearch && matchesFormat;
  });

  return (
    <WorkspaceContainer layoutMode="full-width">
      <div className="max-w-6xl mx-auto space-y-7 pb-12">
        {/* Workspace Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0E0E0E] border border-[#1C1C1C]">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
            <input
              type="text"
              placeholder="Search campaigns, products, or hooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#242424] text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#E7FE25]"
            />
          </div>

          {/* Format Filter Tabs & Create Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#222]">
              <button
                type="button"
                onClick={() => setFilterFormat('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterFormat === 'all' ? 'bg-white text-black' : 'text-[#888] hover:text-white'
                }`}
              >
                All Formats
              </button>
              <button
                type="button"
                onClick={() => setFilterFormat('16:9')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterFormat === '16:9' ? 'bg-white text-black' : 'text-[#888] hover:text-white'
                }`}
              >
                <Monitor className="h-3 w-3" />
                16:9
              </button>
              <button
                type="button"
                onClick={() => setFilterFormat('9:16')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterFormat === '9:16' ? 'bg-white text-black' : 'text-[#888] hover:text-white'
                }`}
              >
                <Smartphone className="h-3 w-3" />
                9:16
              </button>
              <button
                type="button"
                onClick={() => setFilterFormat('1:1')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterFormat === '1:1' ? 'bg-white text-black' : 'text-[#888] hover:text-white'
                }`}
              >
                <Square className="h-3 w-3" />
                1:1
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/campaigns/new')}
              leftIcon={<Plus className="h-4 w-4" />}
              className="font-bold shadow-md"
            >
              New Campaign
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && <WorkspaceLoadingSkeleton />}

        {/* ZERO-STATE WORKBENCH */}
        {!isLoading && campaigns.length === 0 && (
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#111111] to-[#0A0A0A] border border-[#222] text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#013F32] to-[#025745] border border-emerald-500/30 flex items-center justify-center text-[#E7FE25] shadow-lg">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Create Your First Advertisement
              </h3>
              <p className="text-sm text-[#888888] max-w-md mx-auto leading-relaxed">
                Launch an autonomous video production in minutes. Enter your product link or brief, and let KANGGIRD engineer your commercial from concept to timeline.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/campaigns/new')}
                className="font-bold text-sm px-8 shadow-xl"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Start Creative Brief
              </Button>
            </div>
          </div>
        )}

        {/* CONTINUATION HUB: ACTIVE PRODUCTION CAMPAIGNS */}
        {!isLoading && campaigns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E7FE25] animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#999999]">
                  Continue Where You Left Off ({filteredCampaigns.length})
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredCampaigns.map((campaign) => {
                const meta = getPipelineMeta(campaign);

                return (
                  <div
                    key={campaign.id}
                    className="p-5 sm:p-6 rounded-2xl bg-[#0E0E0E] hover:bg-[#121212] border border-[#1E1E1E] hover:border-[#2E2E2E] transition-all duration-200 shadow-md space-y-4 group"
                  >
                    {/* Top Row: Title, Product, Meta, Quick Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-lg font-bold text-white group-hover:text-[#E7FE25] transition-colors">
                            {campaign.name}
                          </h4>
                          {campaign.product_name && (
                            <span className="px-2 py-0.5 rounded-md bg-[#181818] border border-[#262626] text-[11px] text-[#AAA] font-medium">
                              {campaign.product_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#777]">
                          <span className="flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            {campaign.target_platforms || '16:9 Commercial'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Right Stage Badge & Delete */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Badge variant={meta.badgeVariant} size="sm" className="font-semibold">
                          {meta.stageLabel}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => setCampaignToDelete(campaign)}
                          className="p-2 rounded-lg text-[#666] hover:text-[#FA5252] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Visual 9-Stage Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#888] font-medium">Creative Pipeline Progress:</span>
                        <span className="text-[#E7FE25] font-bold">{meta.stageNumber} / 9 Stages</span>
                      </div>
                      <div className="h-2 w-full bg-[#181818] rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((stageNum) => {
                          const isDone = stageNum <= meta.stageNumber;
                          return (
                            <div
                              key={stageNum}
                              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                                isDone ? 'bg-[#E7FE25]' : 'bg-[#222222]'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action Row: Next Action Banner */}
                    <div className="pt-2 border-t border-[#181818] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#999]">
                        <Sparkles className="h-3.5 w-3.5 text-[#E7FE25]" />
                        <span>Recommended next milestone:</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/campaigns/${campaign.id}/overview`)}
                          className="text-xs text-[#888] hover:text-white"
                        >
                          Studio Overview
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(meta.nextActionRoute)}
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                          className="font-bold text-xs shadow-md"
                        >
                          {meta.nextActionLabel}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-[#121212] border border-[#282828] max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Delete Campaign</h4>
            <p className="text-xs text-[#888] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{campaignToDelete.name}</strong>? All generated storyboards, scenes, and media will be removed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceContainer>
  );
}
