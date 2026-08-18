import type { BusinessData, CampaignData, CreativeConceptData } from '../types/workspace';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../../components/ui';
import { Building2, Target, Sparkles, Palette, MessageSquare } from 'lucide-react';

interface CreativeBibleSummaryDeckProps {
  campaign: CampaignData;
  business?: BusinessData;
  selectedConcept?: CreativeConceptData;
}

export function CreativeBibleSummaryDeck({
  campaign,
  business,
  selectedConcept,
}: CreativeBibleSummaryDeckProps) {
  const brandColors = business?.brand_colors
    ? business.brand_colors.split(',').map((c) => c.trim())
    : ['#013F32', '#E7FE25', '#161616'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-app">
      {/* 1. Brand Identity & Colors Card */}
      <Card className="border-[var(--border-default)] flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--brand-lime)]" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Brand & Style Identity
              </CardTitle>
            </div>
            {business?.industry && (
              <Badge variant="forest" size="sm">
                {business.industry}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 text-xs">
          <div>
            <div className="font-bold text-sm text-[var(--text-primary)]">
              {business?.name || 'Unnamed Brand'}
            </div>
            {business?.description && (
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                {business.description}
              </p>
            )}
          </div>

          {/* Tone of Voice */}
          {business?.tone_of_voice && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
                Tone of Voice
              </span>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                {business.tone_of_voice}
              </p>
            </div>
          )}

          {/* Brand Colors Swatches */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
              <Palette className="h-3 w-3" />
              <span>Palette Guidelines</span>
            </div>
            <div className="flex items-center gap-2">
              {brandColors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div
                    className="h-4 w-4 rounded-full border border-white/20 shadow-xs shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono-code text-[10px] text-[var(--text-muted)]">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Target Audience & Campaign Goal Card */}
      <Card className="border-[var(--border-default)] flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--brand-lime)]" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Target Audience & Objective
              </CardTitle>
            </div>
            <Badge variant="outline" size="sm">
              {campaign.duration_seconds || 60}s Duration
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
              Primary Campaign Goal
            </span>
            <p className="font-semibold text-xs text-[var(--text-primary)] mt-0.5">
              {campaign.goal || 'Drive customer acquisition and brand awareness.'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
              Target Demographic
            </span>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {campaign.target_audience || business?.target_audience || 'Commercial consumers, tech enthusiasts, and food lovers.'}
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Aspect Ratio</span>
            <span className="font-mono-code font-bold text-[var(--brand-lime)]">
              {campaign.aspect_ratio || '16:9'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Selected Creative Concept Angle Card */}
      <Card className="border-[var(--border-default)] md:col-span-2 lg:col-span-1 flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--brand-lime)]" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Active Creative Concept
              </CardTitle>
            </div>
            <Badge variant="lime" size="sm">
              Approved Angle
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {selectedConcept ? (
            <>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--brand-lime)] tracking-wider">
                  {selectedConcept.angle_type}
                </div>
                <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5">
                  {selectedConcept.title}
                </h4>
              </div>

              <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                  <MessageSquare className="h-3 w-3 text-[var(--brand-lime)]" />
                  <span>The Hook (0-5s)</span>
                </div>
                <p className="text-[11px] italic text-[var(--text-secondary)]">
                  "{selectedConcept.hook}"
                </p>
              </div>

              <div className="pt-1 text-[11px] text-[var(--text-muted)] line-clamp-2">
                <strong>Style:</strong> {selectedConcept.visual_style}
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-xs text-[var(--text-muted)]">
              No creative concept selected yet. Head to Concepts to generate and select an angle.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
