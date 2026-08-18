import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUp,
  Sparkles,
  Paperclip,
  Smartphone,
  Monitor,
  Square,
  Globe,
  Sliders,
  ChevronDown,
  Clock,
  Layers,
} from 'lucide-react';

interface ConversationalPromptBoxProps {
  onLaunch?: (prompt: string, aspectRatio: string, duration: number) => void;
}

export function ConversationalPromptBox({ onLaunch }: ConversationalPromptBoxProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [promptText, setPromptText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [isFocused, setIsFocused] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [promptText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;

    if (onLaunch) {
      onLaunch(cleanPrompt, aspectRatio, duration);
    } else {
      const params = new URLSearchParams({
        prompt: cleanPrompt,
        ratio: aspectRatio,
        duration: duration.toString(),
      });
      navigate(`/campaigns/new?${params.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickStarters = [
    {
      title: '👟 Sneaker Drop',
      subtitle: 'Fast-cut velocity commercial with neon rain reflection',
      prompt: 'High-energy 15-second streetwear sneaker commercial featuring explosive neon smoke particles, urban night run, and macro shoe texture landing.',
      ratio: '9:16' as const,
      duration: 15 as const,
    },
    {
      title: '✨ Luxury Fragrance',
      subtitle: 'Nocturnal golden caustics and liquid velvet dynamics',
      prompt: 'Cinematic 30-second luxury fragrance commercial with moody amber lighting, slow-motion perfume bottle water ripples, and gold dust refractions.',
      ratio: '16:9' as const,
      duration: 30 as const,
    },
    {
      title: '⚡ Cyber Tech Reveal',
      subtitle: 'Exploded titanium engineering view with holographic HUD',
      prompt: 'Futuristic 20-second wireless earbuds reveal showing exploded titanium drivers, glowing acoustic frequency waves, and cyberpunk Tokyo background.',
      ratio: '1:1' as const,
      duration: 15 as const,
    },
    {
      title: '🌿 Botanical Skincare',
      subtitle: 'Dewy sunrise radiance with macro morning droplets',
      prompt: 'Organic skincare facial serum commercial in warm sunrise daylight with slow-motion honey droplet textures and luminous dewy skin.',
      ratio: '9:16' as const,
      duration: 30 as const,
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Central Prompt Deck (Claude/Linear Style) */}
      <div
        className={`relative rounded-2xl bg-[#0E1110] border transition-all duration-200 shadow-2xl flex flex-col justify-between ${
          isFocused
            ? 'border-emerald-500/50 shadow-[0_0_35px_rgba(1,63,50,0.35)] ring-1 ring-emerald-500/20'
            : 'border-white/[0.08] hover:border-white/15'
        }`}
      >
        {/* Text Input Area */}
        <div className="p-4 sm:p-5">
          <textarea
            ref={textareaRef}
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the video commercial you want to generate (e.g. product features, visual mood, target audience, brand aesthetic)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Bottom Toolbar & Action Bar */}
        <div className="px-3 py-2.5 bg-[#0A0D0C]/80 border-t border-white/[0.05] rounded-b-2xl flex items-center justify-between gap-2 flex-wrap">
          {/* Left Controls: Aspect Ratio & Duration Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Format Toggle Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                className="h-8 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {aspectRatio === '9:16' && <Smartphone className="h-3.5 w-3.5 text-emerald-400" />}
                {aspectRatio === '16:9' && <Monitor className="h-3.5 w-3.5 text-emerald-400" />}
                {aspectRatio === '1:1' && <Square className="h-3.5 w-3.5 text-emerald-400" />}
                <span>
                  {aspectRatio === '9:16'
                    ? '9:16 Vertical'
                    : aspectRatio === '16:9'
                    ? '16:9 Cinematic'
                    : '1:1 Square'}
                </span>
                <ChevronDown className="h-3 w-3 text-zinc-500" />
              </button>

              {isFormatDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFormatDropdownOpen(false)}
                  />
                  <div className="absolute left-0 bottom-10 w-48 rounded-xl bg-[#121514] border border-white/10 shadow-2xl p-1 z-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAspectRatio('9:16');
                        setIsFormatDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                      <span>9:16 Vertical (Reels/TikTok)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAspectRatio('16:9');
                        setIsFormatDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                    >
                      <Monitor className="h-3.5 w-3.5 text-emerald-400" />
                      <span>16:9 Widescreen (YouTube)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAspectRatio('1:1');
                        setIsFormatDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                    >
                      <Square className="h-3.5 w-3.5 text-emerald-400" />
                      <span>1:1 Square (Feed Ads)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Duration Selector */}
            <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08] text-xs">
              {([15, 30, 60] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDuration(sec)}
                  className={`px-2 py-0.5 rounded-md font-mono font-medium transition-all cursor-pointer ${
                    duration === sec
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* AI Engine Model Tag */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 bg-white/[0.02]">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>

          {/* Right Action: Send / Generate Button */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-mono text-zinc-500">⌘ + ↵</span>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!promptText.trim()}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all flex items-center justify-center cursor-pointer shadow-md shrink-0"
              title="Kickoff Campaign Orchestration"
            >
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Clean Quick Starters Grid (Intentional & Professional) */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1">
          Recommended Production Starters
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {quickStarters.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                setPromptText(item.prompt);
                setAspectRatio(item.ratio);
                setDuration(item.duration);
              }}
              className="group text-left p-3.5 rounded-xl bg-[#0E1110] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all cursor-pointer flex flex-col justify-between space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400">
                  {item.ratio} • {item.duration}s
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1 leading-normal">
                {item.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
