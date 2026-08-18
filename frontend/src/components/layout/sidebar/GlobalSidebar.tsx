import {
  Layers,
  LayoutDashboard,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'campaigns', label: 'Campaigns', href: '/campaigns', icon: <Layers className="h-4 w-4 shrink-0" /> },
  { id: 'projects', label: 'Projects', href: '/projects', icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { id: 'assets', label: 'Assets', href: '/assets', icon: <FolderOpen className="h-4 w-4 shrink-0" /> },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4 shrink-0" /> },
];

export function GlobalSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrentRoute = (href: string) => {
    if (href === '/campaigns') {
      return location.pathname === '/campaigns' || location.pathname.startsWith('/campaigns/');
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      aria-label="Global Workspace Navigation"
      className={`hidden md:flex flex-col justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-200 shrink-0 select-none z-10 font-app ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Top Primary Navigation Section */}
      <div className="p-3 space-y-2">
        <nav className="space-y-1">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = isCurrentRoute(item.href);

            const NavButton = (
              <button
                type="button"
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 py-2 px-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer select-none text-left ${
                  isActive
                    ? 'bg-[var(--brand-lime-muted)] text-[var(--text-primary)] border border-[var(--brand-lime)]/20 font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className={isActive ? 'text-[var(--brand-lime)]' : 'text-[var(--text-muted)]'}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{NavButton}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.id}>{NavButton}</div>;
          })}
        </nav>
      </div>

      {/* Bottom Section: Settings & Collapse Toggle */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
        {SECONDARY_NAV_ITEMS.map((item) => {
          const isActive = isCurrentRoute(item.href);

          const SettingsButton = (
            <button
              type="button"
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 py-2 px-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer select-none text-left ${
                isActive
                  ? 'bg-[var(--brand-lime-muted)] text-[var(--text-primary)] border border-[var(--brand-lime)]/20 font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={isActive ? 'text-[var(--brand-lime)]' : 'text-[var(--text-muted)]'}>
                {item.icon}
              </span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{SettingsButton}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.id}>{SettingsButton}</div>;
        })}

        {/* Sidebar Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="w-full flex items-center justify-between py-2 px-2.5 rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!sidebarCollapsed && <span className="text-[11px]">Collapse sidebar</span>}
          </div>
        </button>
      </div>
    </aside>
  );
}
