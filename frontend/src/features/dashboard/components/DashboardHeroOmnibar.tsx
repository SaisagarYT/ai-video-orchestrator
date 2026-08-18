import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Monitor,
  Smartphone,
  Square,
  Wand2,
  Layers,
} from 'lucide-react';

interface DashboardHeroOmnibarProps {
  onQuickStart?: (prompt: string, aspectRatio: string) => void;
}

export function DashboardHeroOmnibar({ onQuickStart }: DashboardHeroOmnibarProps) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<'16:9' | '9:16' | '1:1'>('9:16');
  const [isFocused, setIsFocused] = useState(false);

  const quickPrompts = [
    { label: 'Sneaker Drop Kinetic', prompt: 'High-energy fast-paced streetwear sneaker commercial with explosive neon powder effects', ratio: '9:16' as const },
    { label: 'Luxury Perfume Noir', prompt: 'Cinematic luxury fragrance film with nocturnal amber lighting, macro glass refractions and slow motion', ratio: '16:9' as const },
    { label: 'Cyberpunk Tech Gadget', prompt: 'Sleek wireless cyberpunk earbuds unboxing with holographic exploded product view', ratio: '1:1' as const },
    { label: 'Organic Beauty Glow', prompt: 'Soft daylight organic skincare serum application with water ripple dynamics and dewy finish', ratio: '9:16' as const },
  ];

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (onQuickStart) {
      onQuickStart(prompt, selectedRatio);
    } else {
      const searchParams = new URLSearchParams({
        prompt: prompt.trim(),
        ratio: selectedRatio,
      });
      navigate(`/campaigns/new?${searchParams.toString()}`);
    }
  };

  const handleQuickTagClick = (tagPrompt: string, ratio: '16:9' | '9:16' | '1:1') => {
    setPrompt(tagPrompt);
    setSelectedRatio(ratio);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#0E1311] via-[#0A0D0C] to-[#070908] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      {/* Background Aurora Mesh Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-gradient-to-r from-emerald-600/20 via-teal-500/15 to-[#013F32]/25 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Multi-Model AI Commercial Studio</span>
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-app">
            What commercial are we creating today?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Enter your product concept or ad brief. Our 9-stage AI engine will synthesize strategy, generate storyboard shots, and render a multi-aspect master film.
          </p>
        </div>

        {/* Omnibar Input Form */}
        <form onSubmit={handleLaunch} className="space-y-4">
          <div
            className={`relative rounded-2xl bg-[#121514] border transition-all duration-300 p-2 shadow-2xl ${
              isFocused
                ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                : 'border-white/[0.09] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 px-3">
              <Wand2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="e.g. 30-second high-end energy drink commercial with cybernetic athletes in Tokyo rain..."
                className="w-full h-12 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none font-medium"
              />
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="h-11 px-5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
              >
                <span>Generate</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Aspect Ratio Selector & Quick Format Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> Target Aspect Ratio:
              </span>
              <div className="flex items-center gap-1.5 bg-[#121514] p-1 rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setSelectedRatio('9:16')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedRatio === '9:16'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3 w-3" />
                  <span>9:16 Vertical (Reels)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRatio('16:9')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedRatio === '16:9'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                  <span>16:9 Cinematic (YouTube)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRatio('1:1')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedRatio === '1:1'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Square className="h-3 w-3" />
                  <span>1:1 Square (Feed)</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/campaigns/new')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Open Full Creative Brief Wizard →
            </button>
          </div>

          {/* Quick-Prompt Suggestions Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Ideas:
            </span>
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickTagClick(item.prompt, item.ratio)}
                className="px-3 py-1 rounded-full bg-[#121514] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[11px] font-medium text-zinc-300 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{item.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-white/[0.06] text-zinc-400 font-mono">
                  {item.ratio}
                </span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
