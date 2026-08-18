import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Film,
  Search,
  Bookmark,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { CampaignSummary } from '../types';

interface InspirationVideoGridProps {
  campaigns: CampaignSummary[];
}

export function InspirationVideoGrid({ campaigns }: InspirationVideoGridProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Recommended');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    'Recommended',
    'Streetwear (9:16)',
    'Cinematic Luxury (16:9)',
    'Tech Hardware (1:1)',
    'Beauty & Skincare',
  ];

  // Rich showcase video cards (Image 3 + Image 2 style)
  const showcaseItems = [
    {
      id: 'sc-1',
      title: 'Air Max Future Motion',
      brand: 'Nike Campaign',
      category: 'Streetwear (9:16)',
      aspectRatio: '9:16',
      duration: '15s',
      model: 'Seedance 2.5 Pro',
      stage: 'Stage 5: Scene Generation',
      gradient: 'from-[#03291E] via-[#011711] to-black',
      accentColor: '#34D399',
      logline: 'High-speed urban velocity commercial in neon Tokyo rain with macro sneaker landings.',
    },
    {
      id: 'sc-2',
      title: 'Sauvage Nocturne Noir',
      brand: 'Dior Commercial',
      category: 'Cinematic Luxury (16:9)',
      aspectRatio: '16:9',
      duration: '30s',
      model: 'Kling 3.0 HD',
      stage: 'Stage 9: Master Review',
      gradient: 'from-[#20290A] via-[#101504] to-black',
      accentColor: '#E7FE25',
      logline: 'Nocturnal golden caustics, slow-motion liquid perfume ripples and amber atmosphere.',
    },
    {
      id: 'sc-3',
      title: 'CyberPulse Pro Titanium',
      brand: 'AeroAudio Launch',
      category: 'Tech Hardware (1:1)',
      aspectRatio: '1:1',
      duration: '20s',
      model: 'Seedance 2.5 Pro',
      stage: 'Stage 3: Concepts A/B',
      gradient: 'from-[#0A2438] via-[#04121E] to-black',
      accentColor: '#38BDF8',
      logline: 'Exploded titanium engineering view with acoustic frequency waves and HUD graphics.',
    },
    {
      id: 'sc-4',
      title: 'Lumina Botanical Radiance',
      brand: 'Lumina Skincare',
      category: 'Beauty & Skincare',
      aspectRatio: '9:16',
      duration: '15s',
      model: 'Higgsfield Reframe',
      stage: 'Stage 5: Scene Generation',
      gradient: 'from-[#331127] via-[#1A0613] to-black',
      accentColor: '#F472B6',
      logline: 'Soft daylight organic facial serum application with morning dew droplets.',
    },
  ];

  const filteredItems = showcaseItems.filter((item) => {
    if (activeFilter !== 'Recommended' && item.category !== activeFilter) {
      return false;
    }
    if (searchQuery) {
      return (
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header (Image 3 Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-white tracking-tight font-app">
            Commercial Production Showcase
          </h2>

          {/* Sub-Filter Pills */}
          <div className="hidden lg:flex items-center gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search Field */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search commercial formats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-xl bg-[#0E1210] border border-white/[0.07] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Video Cards Grid (Image 3 / Apple TV+ Image 2 Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            onClick={() => navigate('/campaigns/new')}
            className="group relative rounded-2xl bg-[#0E1210] border border-white/[0.07] hover:border-emerald-500/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden"
          >
            {/* Video Poster Preview Slot with Background Gradient */}
            <div
              className={`relative w-full h-44 bg-gradient-to-br ${item.gradient} p-3.5 flex flex-col justify-between overflow-hidden`}
            >
              {/* Top Chips */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/15 backdrop-blur-md">
                  {item.model}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/60 text-emerald-400 border border-white/10 backdrop-blur-md">
                  {item.aspectRatio} • {item.duration}
                </span>
              </div>

              {/* Center Play Button on Hover */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-115 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-400 transition-all shadow-xl">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Stage Pill */}
              <div className="z-10">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/70 text-zinc-300 border border-white/10 backdrop-blur-md">
                  {item.stage}
                </span>
              </div>
            </div>

            {/* Video Info Section */}
            <div className="p-4 space-y-2 bg-[#0A0D0C]">
              <div>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  {item.brand}
                </span>
                <h3 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 font-app mt-0.5">
                  {item.title}
                </h3>
              </div>

              <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                {item.logline}
              </p>

              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                <span>Remix Formula</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
