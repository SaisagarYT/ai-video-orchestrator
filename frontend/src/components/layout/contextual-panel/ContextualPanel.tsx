import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ContextualPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  width?: string;
}

export function ContextualPanel({
  isOpen,
  onClose,
  title = 'Contextual Inspector',
  description,
  children,
  width = 'w-80 sm:w-96',
}: ContextualPanelProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel Container */}
      <aside
        aria-label={title}
        className={`fixed top-14 bottom-0 right-0 z-30 lg:static lg:top-0 lg:bottom-auto ${width} shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col transition-all duration-200 shadow-xl lg:shadow-none font-app`}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              {title}
            </h2>
            {description && (
              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[240px]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Inspector Panel"
            className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-active)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {children}
        </div>
      </aside>
    </>
  );
}
