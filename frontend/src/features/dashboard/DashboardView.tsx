import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { StudioSidebar } from './components/StudioSidebar';
import { ConversationalPromptBox } from './components/ConversationalPromptBox';
import { RecentCampaignsList } from './components/RecentCampaignsList';
import { Sparkles, Terminal, Shield, Command } from 'lucide-react';
import type { CampaignSummary } from './types';

const INITIAL_CAMPAIGNS: CampaignSummary[] = [
  {
    id: 'demo-1',
    name: 'Nike Air Velocity Drop',
    product_name: 'Air Max Runner 2026',
    product_description: 'High-energy fast-paced streetwear sneaker commercial with explosive neon smoke particles.',
    objective: 'Brand Awareness',
    call_to_action: 'Shop the Limited Drop',
    status: 'scenes_generating',
    aspect_ratio: '9:16',
    duration_seconds: 15,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: 'Sauvage Nocturne Noir',
    product_name: 'Eau de Parfum Intense',
    product_description: 'Midnight luxury fragrance film featuring amber caustic refractions and liquid slow motion.',
    objective: 'Luxury Commercial',
    call_to_action: 'Experience the Scent',
    status: 'completed',
    aspect_ratio: '16:9',
    duration_seconds: 30,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function DashboardView() {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<CampaignSummary[]>('/campaigns/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCampaigns(res.data);
      } else {
        setCampaigns(INITIAL_CAMPAIGNS);
      }
    } catch {
      setCampaigns(INITIAL_CAMPAIGNS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDeleteCampaign = async (id: string) => {
    try {
      if (!id.startsWith('demo-')) {
        await api.delete(`/campaigns/${id}`);
      }
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.full_name ? user.full_name.split(' ')[0] : 'Creator';

  return (
    <div className="flex h-screen w-screen bg-[#070908] text-white font-sans overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* 1. Left Sidebar Navigation (Claude Style) */}
      <StudioSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        recentCampaigns={campaigns}
      />

      {/* 2. Main Studio Canvas Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-gradient-to-b from-[#0A0D0C] via-[#070908] to-[#050706]">
        {/* Subtle Top Status Bar */}
        <header className="h-14 border-b border-white/[0.05] px-6 flex items-center justify-between shrink-0 bg-[#070908]/60 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Studio</span>
            <span>/</span>
            <span className="text-zinc-500">Conversational Orchestration</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>
        </header>

        {/* 3. Centered Conversational Studio Hero */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto px-4 sm:px-8 py-10 space-y-8">
          {/* Editorial Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-2"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-app">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              How can KANGGIRD assist your video advertisement production today?
            </p>
          </motion.div>

          {/* Prompt Super-Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ConversationalPromptBox />
          </motion.div>

          {/* Active Campaigns Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <RecentCampaignsList
              campaigns={campaigns}
              isLoading={isLoading}
              onDeleteCampaign={handleDeleteCampaign}
            />
          </motion.div>
        </div>

        {/* Minimal Footer */}
        <footer className="py-4 px-6 text-center text-[11px] text-zinc-600 font-mono">
          <span>KANGGIRD Studio • Autonomous AI Video Orchestrator</span>
        </footer>
      </div>
    </div>
  );
}
