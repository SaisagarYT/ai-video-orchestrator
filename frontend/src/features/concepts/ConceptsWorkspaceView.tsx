import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceContainer } from '../../components/layout/workspace/WorkspaceContainer';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Target,
  Layers,
} from 'lucide-react';

interface CreativeConcept {
  id: string;
  campaign_id: string;
  title: string;
  angle_type: string;
  hook: string;
  visual_style: string;
  narrative_arc: string;
  target_emotion: string;
  is_selected: boolean;
}

interface StrategyData {
  id: string;
  campaign_id: string;
  target_audience_breakdown?: Record<string, unknown> | string;
  value_propositions?: string[] | string;
  emotional_triggers?: string[] | string;
  messaging_pillars?: string[] | string;
}

interface StrategyResponse {
  strategy: StrategyData;
  concepts: CreativeConcept[];
}

export function ConceptsWorkspaceView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [strategyData, setStrategyData] = useState<StrategyResponse | null>(null);
  const [campaignName, setCampaignName] = useState<string>('Campaign Concepts');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConcepts = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Get campaign name
      const campRes = await api.get(`/campaigns/${campaignId}`);
      if (campRes.data) setCampaignName(campRes.data.name);

      // Get strategy & concepts
      const res = await api.get<StrategyResponse>(`/campaigns/${campaignId}/strategy`);
      setStrategyData(res.data);
    } catch (err: unknown) {
      // If 404, strategy has not been generated yet
      setStrategyData(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.post<StrategyResponse>(`/campaigns/${campaignId}/strategy`);
      setStrategyData(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate creative concepts with Gemini.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectConcept = async (conceptId: string) => {
    setIsSelecting(conceptId);
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/concepts/${conceptId}/select`);
      // Update local selection state
      if (strategyData) {
        setStrategyData({
          ...strategyData,
          concepts: strategyData.concepts.map((c) => ({
            ...c,
            is_selected: c.id === conceptId,
          })),
        });
      }
      // Navigate to Storyboard after brief delay
      setTimeout(() => {
        navigate(`/campaigns/${campaignId}/storyboard`);
      }, 600);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to select creative concept.');
      }
    } finally {
      setIsSelecting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-[var(--bg-app)]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  const selectedConcept = strategyData?.concepts?.find((c) => c.is_selected);

  const breadcrumbs = [
    { label: 'Campaigns', onClick: () => navigate('/campaigns') },
    { label: campaignName, onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
    { label: 'Creative Concepts', isCurrent: true },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] font-app">
      {/* 1. Contextual Header */}
      <CampaignHeader
        campaignName={campaignName}
        status={selectedConcept ? 'strategy_generated' : 'draft'}
        metadata="AI Market Strategy & Creative Angles • 4 Distinctive Hooks"
        breadcrumbs={breadcrumbs}
        primaryAction={{
          label: isGenerating
            ? 'Generating Angles...'
            : strategyData
            ? 'Regenerate Strategy'
            : 'Generate AI Creative Concepts',
          onClick: handleGenerateStrategy,
          isLoading: isGenerating,
          icon: <Sparkles className="h-4 w-4" />,
        }}
      />

      {/* 2. Contextual Nav Tabs */}
      <CampaignNavTabs
        activeSection="concepts"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* 3. Main Workspace Body */}
      <WorkspaceContainer layoutMode="full-width" className="space-y-6 max-w-7xl mx-auto pb-12">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        {/* Empty State: No Strategy Generated Yet */}
        {!strategyData && (
          <div className="py-12 max-w-2xl mx-auto text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-[var(--brand-lime-muted)] border border-[var(--brand-lime)]/30 flex items-center justify-center text-[var(--brand-lime)] mx-auto shadow-lg">
              <Lightbulb className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Synthesize 4 Creative Angles with Gemini
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The Context Engine will analyze your brand guidelines and generate 4 distinctive narrative angles: <em>Emotional Transformation</em>, <em>Problem-Agitation</em>, <em>Sensory Product Showcase</em>, and <em>Lifestyle Narrative</em>.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateStrategy}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="h-4 w-4" />}
              className="font-bold shadow-[0_0_20px_rgba(231,254,37,0.3)]"
            >
              Generate AI Marketing Strategy & Angles
            </Button>
          </div>
        )}

        {/* Real Generated Concepts Grid */}
        {strategyData && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Choose Your Creative Commercial Angle
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Select 1 angle to compile into the shot-by-shot 35mm storyboard.
                </p>
              </div>

              {selectedConcept && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/campaigns/${campaignId}/storyboard`)}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  className="font-bold"
                >
                  Proceed to Storyboard Studio
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {strategyData.concepts.map((concept) => {
                const isSelected = concept.is_selected;
                const isPendingSelection = isSelecting === concept.id;

                return (
                  <div
                    key={concept.id}
                    className={`rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-[var(--bg-surface)] border-[var(--brand-lime)] shadow-[0_0_20px_rgba(231,254,37,0.15)] ring-1 ring-[var(--brand-lime)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--brand-lime)]/40 hover:bg-[var(--bg-surface-elevated)]'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={isSelected ? 'lime' : 'outline'}
                          size="sm"
                          className="uppercase font-bold tracking-wider text-[10px]"
                        >
                          {concept.angle_type}
                        </Badge>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[#12B886] font-bold text-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Active Selection</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-bold text-[var(--text-primary)]">
                        {concept.title}
                      </h4>

                      {/* The Hook */}
                      <div className="p-3 rounded-xl bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)] space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-lime)]">
                          <MessageSquare className="h-3 w-3" />
                          <span>The Opening Hook (0–5s)</span>
                        </div>
                        <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                          "{concept.hook}"
                        </p>
                      </div>

                      {/* Narrative Arc */}
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Narrative Arc
                        </span>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                          {concept.narrative_arc}
                        </p>
                      </div>

                      {/* Style & Target Emotion Tags */}
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span className="truncate max-w-[200px]">
                          <strong>Style:</strong> {concept.visual_style}
                        </span>
                        <Badge variant="forest" size="sm">
                          {concept.target_emotion}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        variant={isSelected ? 'secondary' : 'primary'}
                        size="md"
                        onClick={() => handleSelectConcept(concept.id)}
                        isLoading={isPendingSelection}
                        leftIcon={isSelected ? <CheckCircle2 className="h-4 w-4 text-[#12B886]" /> : <Target className="h-4 w-4" />}
                        className="w-full font-bold"
                      >
                        {isSelected ? 'Selected for Production' : 'Select This Concept'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </WorkspaceContainer>
    </div>
  );
}
