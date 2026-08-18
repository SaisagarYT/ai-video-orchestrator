import { Topbar } from '../topbar/Topbar';
import { GlobalSidebar } from '../sidebar/GlobalSidebar';
import { MobileDrawer } from '../sidebar/MobileDrawer';
import { CommandPalette } from '../topbar/CommandPalette';
import { TooltipProvider } from '../../ui/Tooltip';
import { useAppStore } from '../../../store/useAppStore';
import { Outlet } from 'react-router-dom';

export function AppShell() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] font-app transition-colors duration-150">
        {/* Persistent Global Top Navigation */}
        <Topbar />

        {/* Main App Body */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Global Persistent Collapsible Sidebar */}
          <GlobalSidebar />

          {/* Dynamic Route Workspace Body */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg-app)]">
            <Outlet />
          </div>
        </div>

        {/* Mobile Drawer (When Open) */}
        <MobileDrawer />

        {/* Global Command Palette (Cmd + K) */}
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
        />
      </div>
    </TooltipProvider>
  );
}
