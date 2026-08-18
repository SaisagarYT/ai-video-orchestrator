import type { ReactNode } from 'react';
import { Badge, Button } from '../../ui';
import { Breadcrumbs, type BreadcrumbItem } from '../breadcrumbs/Breadcrumbs';
import { SlidersHorizontal, Sparkles } from 'lucide-react';

export interface CampaignHeaderProps {
  campaignName: string;
  status: 'draft' | 'strategy_generated' | 'storyboard_ready' | 'rendering' | 'completed' | 'failed';
  breadcrumbs: BreadcrumbItem[];
  metadata?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    isLoading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  onToggleContextualPanel?: () => void;
  contextualPanelOpen?: boolean;
}

export function CampaignHeader({
  campaignName,
  status,
  breadcrumbs,
  metadata,
  primaryAction,
  secondaryAction,
  onToggleContextualPanel,
  contextualPanelOpen,
}: CampaignHeaderProps) {
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'completed':
        return <Badge variant="success" dot>Completed</Badge>;
      case 'rendering':
        return <Badge variant="lime" dot>Rendering</Badge>;
      case 'storyboard_ready':
        return <Badge variant="forest" dot>Storyboard Ready</Badge>;
      case 'strategy_generated':
        return <Badge variant="info" dot>Strategy Ready</Badge>;
      case 'failed':
        return <Badge variant="destructive" dot>Failed</Badge>;
      case 'draft':
      default:
        return <Badge variant="default">Draft</Badge>;
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 sm:px-6 py-4 space-y-3">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Main Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] font-app">
              {campaignName}
            </h1>
            {getStatusBadge(status)}
          </div>
          {metadata && (
            <p className="text-xs text-[var(--text-muted)] font-mono-code">
              {metadata}
            </p>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {secondaryAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}

          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
              isLoading={primaryAction.isLoading}
              leftIcon={primaryAction.icon || <Sparkles className="h-3.5 w-3.5" />}
            >
              {primaryAction.label}
            </Button>
          )}

          {onToggleContextualPanel && (
            <Button
              variant={contextualPanelOpen ? 'secondary' : 'outline'}
              size="sm"
              onClick={onToggleContextualPanel}
              leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              aria-label="Toggle Contextual Inspector"
            >
              <span className="hidden md:inline">Inspector</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
