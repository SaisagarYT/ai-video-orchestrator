import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium rounded-full text-xs transition-colors px-2.5 py-0.5 select-none',
  {
    variants: {
      variant: {
        default: 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]',
        lime: 'bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] border border-[var(--brand-lime)]/30',
        forest: 'bg-[var(--brand-forest)] text-white border border-[var(--brand-forest-light)]',
        success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30',
        warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/30',
        destructive: 'bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] border border-[var(--color-destructive)]/30',
        info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info)]/30',
        outline: 'text-[var(--text-secondary)] border border-[var(--border-default)] bg-transparent',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', {
            'bg-[var(--brand-lime)]': variant === 'lime',
            'bg-[var(--color-success)]': variant === 'success',
            'bg-[var(--color-warning)]': variant === 'warning',
            'bg-[var(--color-destructive)]': variant === 'destructive',
            'bg-[var(--color-info)]': variant === 'info',
            'bg-[var(--text-muted)]': variant === 'default' || variant === 'outline',
            'bg-white': variant === 'forest',
          })}
        />
      )}
      {children}
    </div>
  );
}
