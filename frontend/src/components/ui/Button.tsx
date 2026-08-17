import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        // High-Energy Primary Brand Button (Acid Lime)
        primary:
          'bg-[var(--brand-lime)] text-[#161616] font-semibold hover:bg-[var(--brand-lime-hover)] active:scale-[0.98] shadow-sm hover:shadow-[var(--shadow-glow-lime)]',
        // Luxury Deep Forest Brand Button
        forest:
          'bg-[var(--brand-forest)] text-white hover:bg-[var(--brand-forest-light)] active:scale-[0.98] shadow-sm',
        // Secondary Surface Button
        secondary:
          'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface-active)] active:scale-[0.98]',
        // Outline Button
        outline:
          'border border-[var(--border-strong)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-surface-elevated)] active:scale-[0.98]',
        // Ghost / Minimal Button
        ghost:
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] active:scale-[0.98]',
        // Subtle Brand Accent Button
        subtle:
          'bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] hover:bg-[var(--brand-lime)] hover:text-[#161616]',
        // Destructive / Danger Button
        destructive:
          'bg-[var(--color-destructive)] text-white hover:opacity-90 active:scale-[0.98]',
        // Link Style Button
        link:
          'text-[var(--brand-lime)] underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-[var(--radius-xs)] gap-1.5',
        sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)] gap-1.5',
        md: 'h-10 px-4 text-sm rounded-[var(--radius-md)] gap-2',
        lg: 'h-12 px-6 text-base rounded-[var(--radius-lg)] gap-2.5',
        icon: 'h-9 w-9 p-0 rounded-[var(--radius-md)] justify-center',
        'icon-sm': 'h-7 w-7 p-0 rounded-[var(--radius-sm)] justify-center',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
