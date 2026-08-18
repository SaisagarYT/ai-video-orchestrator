import type { ReactNode } from 'react';

export type WorkspaceLayoutMode = 'full-width' | 'centered' | 'dense-editor' | 'split';

export interface WorkspaceContainerProps {
  children: ReactNode;
  layoutMode?: WorkspaceLayoutMode;
  contextualPanel?: ReactNode;
  className?: string;
}

export function WorkspaceContainer({
  children,
  layoutMode = 'full-width',
  contextualPanel,
  className = '',
}: WorkspaceContainerProps) {
  const getLayoutClasses = () => {
    switch (layoutMode) {
      case 'centered':
        return 'max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8';
      case 'dense-editor':
        return 'w-full p-3 sm:p-4 space-y-3';
      case 'split':
        return 'w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6';
      case 'full-width':
      default:
        return 'w-full p-4 sm:p-6 lg:p-8';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 relative">
      {/* Primary Workspace Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <main className={`${getLayoutClasses()} ${className}`}>
          {children}
        </main>
      </div>

      {/* Optional Contextual Right Panel */}
      {contextualPanel}
    </div>
  );
}
