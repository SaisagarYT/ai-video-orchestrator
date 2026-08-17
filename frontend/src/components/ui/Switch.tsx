import React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '../../lib/utils';

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, label, description, ...props }, ref) => {
  const switchElement = (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--brand-lime)] data-[state=unchecked]:bg-[var(--border-strong)]',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-[#161616] data-[state=unchecked]:bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  );

  if (!label) return switchElement;

  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      {switchElement}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-[var(--text-primary)]">{label}</span>
        {description && (
          <span className="text-[10px] text-[var(--text-muted)]">{description}</span>
        )}
      </div>
    </label>
  );
});

Switch.displayName = SwitchPrimitives.Root.displayName;
