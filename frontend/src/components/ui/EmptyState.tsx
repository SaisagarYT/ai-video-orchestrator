import type { ReactNode } from 'react';
import { Button } from './Button';
import { Layers } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[var(--radius-xl)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)]/50 ${className}`}
    >
      <div className="h-12 w-12 rounded-[var(--radius-lg)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-4 shadow-sm">
        {icon || <Layers className="h-6 w-6" />}
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight font-app">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1.5 leading-relaxed font-app">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
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
              leftIcon={primaryAction.icon}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
