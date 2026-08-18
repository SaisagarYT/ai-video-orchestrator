import type { ReactNode } from 'react';
import {
  FileText,
  Compass,
  Lightbulb,
  Layers,
  Clapperboard,
  ShieldCheck,
  Sliders,
  Cpu,
  Film,
  LayoutDashboard,
} from 'lucide-react';

export type CampaignSection =
  | 'overview'
  | 'brief'
  | 'strategy'
  | 'concepts'
  | 'storyboard'
  | 'scenes'
  | 'evaluation'
  | 'timeline'
  | 'render'
  | 'review';

export interface CampaignNavTabItem {
  id: CampaignSection;
  stageNumber?: number;
  label: string;
  icon: ReactNode;
}

export const CAMPAIGN_NAV_ITEMS: CampaignNavTabItem[] = [
  { id: 'overview', label: 'Studio Overview', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { id: 'brief', stageNumber: 1, label: '1. Brief', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'strategy', stageNumber: 2, label: '2. Strategy', icon: <Compass className="h-3.5 w-3.5" /> },
  { id: 'concepts', stageNumber: 3, label: '3. Concepts', icon: <Lightbulb className="h-3.5 w-3.5" /> },
  { id: 'storyboard', stageNumber: 4, label: '4. Storyboard', icon: <Layers className="h-3.5 w-3.5" /> },
  { id: 'scenes', stageNumber: 5, label: '5. Scenes', icon: <Clapperboard className="h-3.5 w-3.5" /> },
  { id: 'evaluation', stageNumber: 6, label: '6. Consistency', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: 'timeline', stageNumber: 7, label: '7. Timeline', icon: <Sliders className="h-3.5 w-3.5" /> },
  { id: 'render', stageNumber: 8, label: '8. Render', icon: <Cpu className="h-3.5 w-3.5" /> },
  { id: 'review', stageNumber: 9, label: '9. Review', icon: <Film className="h-3.5 w-3.5" /> },
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
      aria-label="Campaign Pipeline Stages"
      className={`border-b border-[#1E1E1E] bg-[#0A0A0A] px-3 sm:px-6 overflow-x-auto no-scrollbar select-none ${className}`}
    >
      <div className="flex items-center space-x-1 min-w-max py-1">
        {CAMPAIGN_NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs transition-all duration-150 cursor-pointer font-medium ${
                isActive
                  ? 'bg-[#181818] text-white border border-[#2E2E2E] shadow-sm font-semibold'
                  : 'text-[#888888] hover:text-white hover:bg-[#141414] border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-[#E7FE25]' : 'text-[#666666]'}>
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
