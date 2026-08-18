import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Play,
  Film,
  Flame,
  Zap,
} from 'lucide-react';
import type { PresetTemplate } from '../types';

export function PresetTemplateGallery() {
  const navigate = useNavigate();

  const presets: PresetTemplate[] = [
    {
      id: 'preset-sneaker',
      title: 'Kinetic Streetwear Sneaker',
      category: 'Footwear & Apparel',
      tagline: 'Fast-cut dynamic velocity commercial with neon particle trails and rain reflex.',
      aspectRatio: '9:16',
      gradient: 'from-[#0B2E24] via-[#041F18] to-[#070908]',
      accentColor: '#34D399',
      duration: '15s',
      suggestedPrompt: 'High-energy fast-paced streetwear sneaker commercial with explosive neon powder effects and slow-motion jump landing in Tokyo rain',
      tags: ['Fast-Cut', 'Urban', 'Dynamic Lighting'],
    },
    {
      id: 'preset-perfume',
      title: 'Sauvage Nocturne Fragrance',
      category: 'Luxury & Beauty',
      tagline: 'Atmospheric midnight cinematic with amber caustic refractions and liquid slow-motion.',
      aspectRatio: '16:9',
      gradient: 'from-[#1F2410] via-[#121609] to-[#070908]',
      accentColor: '#E7FE25',
      duration: '30s',
      suggestedPrompt: 'Cinematic luxury fragrance film with nocturnal amber lighting, macro glass refractions and liquid velvet waves',
      tags: ['Cinematic', 'Macro Optics', 'Luxury'],
    },
    {
      id: 'preset-audio',
      title: 'CyberPulse Wireless Audio',
      category: 'Consumer Tech',
      tagline: 'Exploded engineering view with neon sonic frequency rings and titanium finish.',
      aspectRatio: '1:1',
      gradient: 'from-[#0C2233] via-[#061421] to-[#070908]',
      accentColor: '#38BDF8',
      duration: '20s',
      suggestedPrompt: 'Sleek wireless cyberpunk earbuds unboxing with holographic exploded product view and titanium acoustic chambers',
      tags: ['3D Motion', 'Tech Spec', 'Holographic'],
    },
    {
      id: 'preset-beauty',
      title: 'Lumina Botanical Serum',
      category: 'Skincare & Cosmetics',
      tagline: 'Dewy sunrise radiance with macro water droplets, rose quartz tone and soft bokeh.',
      aspectRatio: '9:16',
      gradient: 'from-[#2B1724] via-[#1A0B15] to-[#070908]',
      accentColor: '#F472B6',
      duration: '15s',
      suggestedPrompt: 'Soft daylight organic skincare serum application with water ripple dynamics and dewy golden skin radiance',
      tags: ['Dewy Glow', 'Macro Droplets', 'Organic'],
    },
  ];

  const handleUsePreset = (preset: PresetTemplate) => {
    const params = new URLSearchParams({
      prompt: preset.suggestedPrompt,
      ratio: preset.aspectRatio,
      name: preset.title,
    });
    navigate(`/campaigns/new?${params.toString()}`);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Flame className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight font-app">
            Commercial Production Recipes
          </h2>
        </div>
        <span className="text-xs text-zinc-400 font-medium">
          Pre-tuned prompts, camera optics & timing
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((preset, idx) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            onClick={() => handleUsePreset(preset)}
            className="group relative rounded-2xl border border-white/[0.07] hover:border-white/20 bg-[#0E1110] p-5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-4 overflow-hidden"
          >
            {/* Background Gradient Mood */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${preset.gradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
            />

            {/* Top Aspect & Duration */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-white border border-white/10 backdrop-blur-md">
                {preset.aspectRatio}
              </span>
              <span className="text-[10px] font-mono text-zinc-300 bg-black/40 px-2 py-0.5 rounded backdrop-blur-md">
                {preset.duration}
              </span>
            </div>

            {/* Card Content */}
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                {preset.category}
              </span>
              <h3 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 font-app">
                {preset.title}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                {preset.tagline}
              </p>
            </div>

            {/* Tags & Action Button */}
            <div className="relative z-10 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-1">
                {preset.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <span className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                <span>Use</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
