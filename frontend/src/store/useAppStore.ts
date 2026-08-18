import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActiveCampaignContext {
  id: string;
  name: string;
  status: 'draft' | 'strategy_generated' | 'storyboard_ready' | 'rendering' | 'completed' | 'failed';
  updatedAt?: string;
}

interface AppUIState {
  // Sidebar State (Desktop)
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Mobile Drawer State
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;

  // Command Palette State
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Right Contextual Panel State
  contextualPanelOpen: boolean;
  contextualPanelTitle: string;
  setContextualPanelOpen: (open: boolean, title?: string) => void;
  toggleContextualPanel: (title?: string) => void;

  // Active Campaign Context
  activeCampaign: ActiveCampaignContext | null;
  setActiveCampaign: (campaign: ActiveCampaignContext | null) => void;
}

export const useAppStore = create<AppUIState>()(
  persist(
    (set) => ({
      // Sidebar State
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Mobile Drawer State
      mobileDrawerOpen: false,
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

      // Command Palette State
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      // Contextual Panel State
      contextualPanelOpen: false,
      contextualPanelTitle: 'Scene Settings',
      setContextualPanelOpen: (open, title) =>
        set((state) => ({
          contextualPanelOpen: open,
          contextualPanelTitle: title || state.contextualPanelTitle,
        })),
      toggleContextualPanel: (title) =>
        set((state) => ({
          contextualPanelOpen: !state.contextualPanelOpen,
          contextualPanelTitle: title || state.contextualPanelTitle,
        })),

      // Active Campaign Context
      activeCampaign: null,
      setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),
    }),
    {
      name: 'kanggird_app_ui_state',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
