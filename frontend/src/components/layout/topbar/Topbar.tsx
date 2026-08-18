import {
  Menu,
  Search,
  HelpCircle,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useTheme } from '../../../context/ThemeContext';
import { UserProfileMenu } from './UserProfileMenu';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { toggleCommandPalette, setMobileDrawerOpen, activeCampaign } = useAppStore();
  const { isDark, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none font-app">
      {/* Left: Mobile Menu & Workspace Indicator */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open Navigation Drawer"
          className="h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] md:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Workspace Brand / Context Badge */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
          >
            <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand-lime)] flex items-center justify-center text-[#161616] font-black text-xs shadow-xs">
              K
            </div>
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] hidden sm:inline">
              KANGGIRD
            </span>
          </button>

          {activeCampaign && (
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <span>/</span>
              <span className="font-medium text-[var(--text-secondary)] truncate max-w-[180px]">
                {activeCampaign.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Command Launcher */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-4">
        <button
          type="button"
          onClick={() => toggleCommandPalette()}
          aria-label="Open Command Palette (Cmd + K)"
          className="w-full h-8.5 px-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-xs text-[var(--text-muted)] flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Search commands & campaigns...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[10px] font-mono-code text-[var(--text-muted)]">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-2">
        {/* Quick Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label="Toggle Theme Mode"
              className="h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Toggle {isDark ? 'Light' : 'Dark'} Mode
          </TooltipContent>
        </Tooltip>

        {/* Notifications (Visually Quiet) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => alert('No unread notifications.')}
              className="h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer relative"
            >
              <Bell className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Help */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Help & Documentation"
              onClick={() => alert('KANGGIRD Documentation & Studio Support.')}
              className="h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Help & Shortcuts</TooltipContent>
        </Tooltip>

        {/* User Profile Menu */}
        <div className="pl-1 border-l border-[var(--border-subtle)] ml-1">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
