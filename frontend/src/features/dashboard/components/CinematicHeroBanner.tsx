import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Play,
  Film,
  Zap,
  Wand2,
  Layers,
  Smartphone,
  Monitor,
} from 'lucide-react';

export function CinematicHeroBanner() {
  const navigate = useNavigate();
  const [quickPrompt, setQuickPrompt] = useState('');

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) {
      navigate('/campaigns/new');
      return;
    }
    navigate(`/campaigns/new?prompt=${encodeURIComponent(quickPrompt.trim())}`);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.09] bg-gradient-to-r from-[#031D16] via-[#05291F] to-[#01140F] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
      {/* Subtle Grid & Mesh Highlights */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Grid Content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-10 lg:p-12">
        {/* Left: Headline & Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Video Orchestration</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] font-app uppercase">
              AI Commercial Film Studio
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/70 max-w-xl leading-relaxed">
              Transform product briefs and URLs into high-converting video advertisements. Multi-model scene rendering across Kling & Seedance with frame-accurate consistency.
            </p>
          </div>

          {/* Quick Input Omnibar Inside Banner */}
          <form onSubmit={handleLaunch} className="space-y-3 max-w-lg">
            <div className="relative rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md p-1.5 flex items-center gap-2 shadow-xl focus-within:border-emerald-400/60 focus-within:ring-1 focus-within:ring-emerald-400/30 transition-all">
              <Wand2 className="h-4 w-4 text-emerald-400 ml-3 shrink-0" />
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Enter product URL or prompt (e.g. Nike Sneaker Drop)..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-400 focus:outline-none font-medium px-1"
              />
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                <span>Launch</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-emerald-200/60 pl-1">
              <span className="flex items-center gap-1"><Smartphone className="h-3 w-3 text-emerald-400" /> 9:16 Vertical</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Monitor className="h-3 w-3 text-emerald-400" /> 16:9 Cinematic</span>
              <span>•</span>
              <span>⚡ 9-Stage Automated Pipeline</span>
            </div>
          </form>
        </div>

        {/* Right: Diagonal Showcase Keyframes (Image 3 Style) */}
        <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-[340px] h-[220px] sm:h-[260px]">
            {/* Card 1: Sneaker Kinetic */}
            <motion.div
              initial={{ rotate: -8, y: 10 }}
              animate={{ rotate: -6, y: 0 }}
              className="absolute left-0 top-4 w-44 sm:w-52 h-44 sm:h-52 rounded-2xl bg-gradient-to-br from-[#063326] via-[#021A13] to-black border border-emerald-500/30 p-3 shadow-2xl overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-emerald-300 font-bold">
                  9:16 Kinetic
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white leading-tight">Nike Air Velocity</p>
                <p className="text-[10px] text-zinc-400 line-clamp-1">Streetwear Fast-Cut</p>
              </div>
            </motion.div>

            {/* Card 2: Luxury Perfume (Diagonal Overlap) */}
            <motion.div
              initial={{ rotate: 8, x: 20 }}
              animate={{ rotate: 6, x: 0 }}
              className="absolute right-0 bottom-2 w-48 sm:w-56 h-48 sm:h-56 rounded-2xl bg-gradient-to-br from-[#1B2909] via-[#0D1505] to-black border border-[#E7FE25]/30 p-3.5 shadow-2xl overflow-hidden flex flex-col justify-between backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-[#E7FE25] font-bold">
                  16:9 Cinema
                </span>
                <div className="h-5 w-5 rounded-full bg-[#E7FE25]/20 flex items-center justify-center text-[#E7FE25]">
                  <Play className="h-2.5 w-2.5 fill-current" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white leading-tight">Sauvage Nocturne</p>
                <p className="text-[10px] text-zinc-400">Amber Caustic Reflections</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
