import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { ContextualPropertyInspector } from '../../components/layout/contextual-panel/ContextualPropertyInspector';
import { Button, Badge } from '../../components/ui';

export function StrategyStageView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);

  const fetchStrategy = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const campRes = await api.get(`/campaigns/${campaignId}`);
      setCampaign(campRes.data);

      try {
        const stratRes = await api.get(`/campaigns/${campaignId}/strategy`);
        setStrategy(stratRes.data);
      } catch {
        // Strategy not yet generated
        setStrategy(null);
      }
    } catch {
      setCampaign(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post(`/campaigns/${campaignId}/strategy/generate`);
      setStrategy(res.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Strategy generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#060606]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060606] text-white">
      {/* Studio Header */}
      <CampaignHeader
        campaignName={campaign?.name || 'Campaign Studio'}
        status={campaign?.status || 'draft'}
        metadata="Stage 2: AI Strategy Synthesis"
        breadcrumbs={[
          { label: 'Workspace', onClick: () => navigate('/campaigns') },
          { label: campaign?.name || 'Campaign', onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
          { label: 'Strategy', isCurrent: true },
        ]}
        onToggleContextualPanel={() => setInspectorOpen(!inspectorOpen)}
        contextualPanelOpen={inspectorOpen}
      />

      {/* 9-Stage Pipeline Navigation Tabs */}
      <CampaignNavTabs
        activeSection="strategy"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* Main Stage Canvas with Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stage Title & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1C1C1C]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="lime" size="sm">
                    Stage 02
                  </Badge>
                  <span className="text-xs text-[#888]">Brand & Marketing Intelligence</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Creative Strategy & Hook Matrix
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateStrategy}
                  isLoading={isGenerating}
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  {strategy ? 'Regenerate Strategy' : 'Synthesize Strategy'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/campaigns/${campaignId}/concepts`)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="font-bold shadow-md"
                >
                  Explore Concepts
                </Button>
              </div>
            </div>

            {/* If no strategy synthesized yet */}
            {!strategy && !isGenerating && (
              <div className="p-10 rounded-2xl bg-[#0E0E0E] border border-[#202020] text-center space-y-4">
                <Compass className="h-10 w-10 text-[#E7FE25] mx-auto" />
                <h4 className="text-lg font-bold text-white">Synthesize Marketing Strategy</h4>
                <p className="text-xs text-[#888] max-w-md mx-auto leading-relaxed">
                  Analyze your product brief, target audience pain points, and commercial hook angles to construct the campaign blueprint.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerateStrategy}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  className="font-bold"
                >
                  Generate AI Strategy
                </Button>
              </div>
            )}

            {/* Strategy Display Cards */}
            {strategy && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pillar 1: Hook Angles */}
                <div className="p-5 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E] space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-[#E7FE25]">
                    <Zap className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Hook Angles</h4>
                  </div>
                  <p className="text-xs text-[#CCC] leading-relaxed">
                    {strategy.core_hook || strategy.hook_angle || 'Sensory transformation highlighting instant product efficacy in the first 3 seconds.'}
                  </p>
                  <div className="pt-2 border-t border-[#1C1C1C]">
                    <span className="text-[10px] text-[#777] block uppercase font-semibold">Retention Target</span>
                    <span className="text-xs font-bold text-[#E7FE25]">85%+ at 3s Mark</span>
                  </div>
                </div>

                {/* Pillar 2: Audience Archetype */}
                <div className="p-5 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E] space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-[#10B981]">
                    <Target className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Target Persona</h4>
                  </div>
                  <p className="text-xs text-[#CCC] leading-relaxed">
                    {strategy.target_audience || 'Modern professionals seeking premium, frictionless performance.'}
                  </p>
                  <div className="pt-2 border-t border-[#1C1C1C]">
                    <span className="text-[10px] text-[#777] block uppercase font-semibold">Core Pain Point</span>
                    <span className="text-xs font-semibold text-white">Complex, slow alternatives</span>
                  </div>
                </div>

                {/* Pillar 3: Emotional Arc */}
                <div className="p-5 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E] space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-[#3B82F6]">
                    <Heart className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Emotional Arc</h4>
                  </div>
                  <p className="text-xs text-[#CCC] leading-relaxed">
                    {strategy.emotional_arc || 'From frustration & limitation to effortless mastery and empowerment.'}
                  </p>
                  <div className="pt-2 border-t border-[#1C1C1C]">
                    <span className="text-[10px] text-[#777] block uppercase font-semibold">Tone Resonance</span>
                    <span className="text-xs font-semibold text-white">Cinematic & Authoritative</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Persistent Contextual Inspector */}
        <ContextualPropertyInspector
          entityType="campaign"
          data={campaign}
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
        />
      </div>
    </div>
  );
}
