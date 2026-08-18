import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { StudioDockSidebar } from './components/StudioDockSidebar';
import { FloatingTopNav } from './components/FloatingTopNav';
import { CinematicHeroBanner } from './components/CinematicHeroBanner';
import { QuickToolsGrid } from './components/QuickToolsGrid';
import { InspirationVideoGrid } from './components/InspirationVideoGrid';
import type { CampaignSummary } from './types';

const SAMPLE_CAMPAIGNS: CampaignSummary[] = [
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
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<CampaignSummary[]>('/campaigns/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCampaigns(res.data);
      } else {
        setCampaigns(SAMPLE_CAMPAIGNS);
      }
    } catch {
      setCampaigns(SAMPLE_CAMPAIGNS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div className="flex h-screen w-screen bg-[#040605] text-white font-sans overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* 1. Left Slim Studio Dock (Image 3 Style) */}
      <StudioDockSidebar />

      {/* 2. Main Studio Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative no-scrollbar">
        {/* ========================================================================= */}
        {/* ABSTRACT EMERALD ARCH DOME GLOW (IMAGE 1 BACKGROUND IN OUR EMERALD THEME) */}
        {/* ========================================================================= */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          {/* Top subtle fade */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#040605] to-transparent z-10" />

          {/* Primary Arch Luminous Spotlight Beam (Image 1 Style) */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[920px] sm:w-[1200px] h-[520px] sm:h-[640px] rounded-[100%] bg-gradient-to-t from-transparent via-[#024032]/40 to-[#10b981]/25 blur-[90px] opacity-80" />

          {/* Secondary Concentric Inner Bright Arch Beam */}
          <div className="absolute top-36 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[340px] sm:h-[420px] rounded-[100%] bg-gradient-to-t from-transparent via-[#05604b]/50 to-[#34d399]/35 blur-[60px] opacity-90" />

          {/* Core Spotlight Horizon Glow */}
          <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[320px] sm:w-[480px] h-[160px] sm:h-[220px] rounded-[100%] bg-gradient-to-t from-transparent to-[#a7f3d0]/30 blur-[40px] opacity-75" />
        </div>

        {/* Floating Top Navigation Capsule (Apple TV+ Image 2 Style) */}
        <FloatingTopNav />

        {/* Main Content Area */}
        <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6 pb-16 space-y-10">
          {/* A. Cinematic Hero Showcase Banner (Image 2 + Image 3) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <CinematicHeroBanner />
          </motion.div>

          {/* B. 2x4 Quick Creation Tools Grid (Image 3 Style) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <QuickToolsGrid />
          </motion.div>

          {/* C. Inspiration & Video Showcase (Image 2 + Image 3) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <InspirationVideoGrid campaigns={campaigns} />
          </motion.div>
        </main>

        {/* Minimal Footer */}
        <footer className="relative z-10 border-t border-white/[0.05] py-6 px-8 text-center text-xs text-zinc-600 font-mono">
          <p>KANGGIRD • Autonomous Commercial Video Studio • Multi-Model Orchestration Engine</p>
        </footer>
      </div>
    </div>
  );
}
