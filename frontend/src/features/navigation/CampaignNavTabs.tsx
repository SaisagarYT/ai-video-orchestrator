import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Layers,
  Clapperboard,
  FolderOpen,
  CheckCircle2,
  Film,
} from 'lucide-react';

export type CampaignSection =
  | 'overview'
  | 'brief'
  | 'concepts'
  | 'storyboard'
  | 'scenes'
  | 'assets'
  | 'quality'
  | 'final';

export interface CampaignNavTabItem {
  id: CampaignSection;
  label: string;
  icon: ReactNode;
}

export const CAMPAIGN_NAV_ITEMS: CampaignNavTabItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'brief', label: 'Brief', icon: <FileText className="h-4 w-4" /> },
  { id: 'concepts', label: 'Concepts', icon: <Lightbulb className="h-4 w-4" /> },
  { id: 'storyboard', label: 'Storyboard', icon: <Layers className="h-4 w-4" /> },
  { id: 'scenes', label: 'Scenes', icon: <Clapperboard className="h-4 w-4" /> },
  { id: 'assets', label: 'Assets', icon: <FolderOpen className="h-4 w-4" /> },
  { id: 'quality', label: 'Quality', icon: <CheckCircle2 className="h-4 w-4" /> },
  { id: 'final', label: 'Final', icon: <Film className="h-4 w-4" /> },
];

export interface CampaignNavTabsProps {
  activeSection: CampaignSection;
  onSelectSection: (section: CampaignSection) => void;
  className?: string;
}

export function CampaignNavTabs({
  activeSection,
  onSelectSection,
  className = '',
}: CampaignNavTabsProps) {
  return (
    <nav
      aria-label="Campaign Sections"
      className={`border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 overflow-x-auto no-scrollbar ${className}`}
    >
      <div className="flex items-center space-x-1 min-w-max">
        {CAMPAIGN_NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? 'border-[var(--brand-lime)] text-[var(--text-primary)] font-semibold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
              }`}
            >
              <span className={isActive ? 'text-[var(--brand-lime)]' : 'text-[var(--text-muted)]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
