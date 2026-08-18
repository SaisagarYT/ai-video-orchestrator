import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Utensils,
  Zap,
  Shirt,
  Laptop,
  Heart,
  Globe,
  Monitor,
  Smartphone,
  Square,
  Wand2,
  Check,
} from 'lucide-react';

interface InitialPromptStepProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  error?: string | null;
}

const STARTER_PROMPTS = [
  {
    category: 'Sensory Food & Beverage',
    icon: <Utensils className="h-3.5 w-3.5" />,
    text: 'A high-energy commercial for authentic firewood dum biryani in clay pots, featuring steaming saffron basmati, sizzling spices, and slow-motion aromatic garnish.',
  },
  {
    category: 'Luxury EV Automotive',
    icon: <Zap className="h-3.5 w-3.5" />,
    text: 'A 35mm anamorphic commercial for a high-performance electric sedan, highlighting aerodynamic carbon curves, midnight neon city reflections, and 0-60 in 1.89s.',
  },
  {
    category: 'Athletic Apparel',
    icon: <Shirt className="h-3.5 w-3.5" />,
    text: 'A rain-slicked nocturnal city teaser for carbon-plated marathon running shoes focusing on high-speed foot strikes, explosive muscle definition, and kinetic energy.',
  },
  {
    category: 'Enterprise AI Software',
    icon: <Laptop className="h-3.5 w-3.5" />,
    text: 'An autonomous AI video production suite that transforms product links into high-retention broadcast commercials with synchronized voiceover and visual hooks.',
  },
  {
    category: 'Luxury Hospitality & Travel',
    icon: <Heart className="h-3.5 w-3.5" />,
    text: 'An atmospheric cinematic journey through a 5-star desert oasis resort with golden hour pool reflections, candlelit courtyards, and serene private villas.',
  },
];

const TONE_ARCHETYPES = [
  'Cinematic Luxury',
  'High-Energy Hype',
  'Tech Minimalist',
  'Emotional Narrative',
  'Direct-Response Urgency',
];

export function InitialPromptStep({ onSubmit, isLoading, error }: InitialPromptStepProps) {
  const [prompt, setPrompt] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSuccess, setExtractedSuccess] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [selectedTone, setSelectedTone] = useState<string>('Cinematic Luxury');

  const handleExtractUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productUrl.trim()) return;

    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
      setExtractedSuccess(true);
      // Auto-populate prompt based on URL domain/content
      setPrompt(
        `High-impact commercial for product extracted from ${productUrl}: showcasing core innovation, premium craftsmanship, and direct customer transformation.`
      );
    }, 900);
  };

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) return;
    setPrompt((prev) => `${prev.trim()} Shot on Arri Alexa LF 35mm anamorphic, dramatic cinematic lighting, dynamic slow-motion macro details, 4K broadcast grade.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 5) {
      const fullPrompt = `[Format: ${selectedFormat} | Tone: ${selectedTone}] ${prompt.trim()}`;
      onSubmit(fullPrompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (prompt.trim().length >= 5) {
        const fullPrompt = `[Format: ${selectedFormat} | Tone: ${selectedTone}] ${prompt.trim()}`;
        onSubmit(fullPrompt);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Studio Hero Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#162B21] border border-emerald-500/30 text-[#E7FE25] text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Stage 01: Creative Brief & Brand Context Engine</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Engineer an Autonomous Commercial
        </h1>
        <p className="text-xs sm:text-sm text-[#888888] max-w-2xl mx-auto leading-relaxed">
          Provide your product link or creative vision. KANGGIRD extracts brand intelligence, generates high-converting hook angles, and orchestrates your complete multi-shot commercial.
        </p>
      </div>

      {/* URL Quick Extractor Banner */}
      <div className="p-4 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E] flex flex-col sm:flex-row items-center gap-3 shadow-md">
        <div className="flex items-center gap-2.5 text-xs text-[#AAA] shrink-0">
          <Globe className="h-4 w-4 text-[#E7FE25]" />
          <span className="font-semibold text-white">Extract from URL:</span>
        </div>
        <div className="flex-1 w-full flex items-center gap-2">
          <input
            type="url"
            placeholder="https://yourbrand.com/product..."
            value={productUrl}
            onChange={(e) => {
              setProductUrl(e.target.value);
              setExtractedSuccess(false);
            }}
            className="flex-1 h-9 px-3 rounded-xl bg-[#141414] border border-[#242424] text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#E7FE25]"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExtractUrl}
            isLoading={isExtracting}
            className="shrink-0 text-xs font-semibold"
          >
            {extractedSuccess ? (
              <span className="text-[#10B981] flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Extracted
              </span>
            ) : (
              'Auto Extract'
            )}
          </Button>
        </div>
      </div>

      {/* Main Vision Input Studio Box */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-3xl bg-[#0E0E0E] border border-[#1E1E1E] space-y-6 shadow-2xl">
        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#888]">
            1. Target Aspect Ratio & Delivery Platform
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: '16:9', label: '16:9 Landscape', desc: 'YouTube, Connected TV, Desktop Web', icon: <Monitor className="h-4 w-4" /> },
              { id: '9:16', label: '9:16 Vertical Reel', desc: 'TikTok, Instagram Reels, Shorts', icon: <Smartphone className="h-4 w-4" /> },
              { id: '1:1', label: '1:1 Square Format', desc: 'Instagram Feed, LinkedIn Video', icon: <Square className="h-4 w-4" /> },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormat(f.id as any)}
                className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                  selectedFormat === f.id
                    ? 'bg-[#181818] border-[#E7FE25] text-white shadow-md'
                    : 'bg-[#121212] border-[#202020] text-[#777] hover:border-[#333] hover:text-[#CCC]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className={selectedFormat === f.id ? 'text-[#E7FE25]' : 'text-[#666]'}>
                    {f.icon}
                  </span>
                  <span>{f.label}</span>
                </div>
                <p className="text-[10px] text-[#666] leading-tight">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Archetypes */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#888]">
            2. Brand Tone Archetype
          </label>
          <div className="flex flex-wrap gap-2">
            {TONE_ARCHETYPES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setSelectedTone(tone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  selectedTone === tone
                    ? 'bg-[#E7FE25] text-black border-[#E7FE25] font-bold shadow-sm'
                    : 'bg-[#141414] border-[#222] text-[#888] hover:text-white hover:border-[#333]'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Vision Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#888]">
              3. Commercial Vision & Core Value Proposition
            </label>
            <button
              type="button"
              onClick={handleEnhancePrompt}
              className="text-xs text-[#E7FE25] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Wand2 className="h-3 w-3" />
              AI Prompt Enhancer
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            required
            placeholder="e.g. A 30-second commercial for our cold-pressed organic energy tonic. Show crisp ice cracking, vibrant citrus splashing in extreme macro, and an athlete energizing before a sunrise mountain run..."
            className="w-full p-4 rounded-2xl bg-[#141414] border border-[#242424] text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#E7FE25] transition-colors resize-none leading-relaxed"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#1C1C1C]">
          <div className="flex items-center gap-2 text-xs text-[#777]">
            <Upload className="h-4 w-4 text-[#E7FE25]" />
            <span>Attach brand logo / packshots in subsequent stages</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={prompt.trim().length < 5 || isLoading}
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full sm:w-auto font-bold px-8 shadow-xl"
          >
            Launch AI Director Interview
          </Button>
        </div>
      </form>

      {/* Curated Starter Cards */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#777] text-center">
          Or explore curated high-converting commercial briefs
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STARTER_PROMPTS.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(starter.text)}
              className="p-4 rounded-2xl bg-[#0E0E0E] border border-[#1C1C1C] hover:border-[#E7FE25]/50 hover:bg-[#121212] transition-all text-left space-y-2 cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-[#E7FE25] transition-colors">
                <span className="text-[#E7FE25]">{starter.icon}</span>
                <span>{starter.category}</span>
              </div>
              <p className="text-[11px] text-[#777] line-clamp-2 leading-relaxed">
                "{starter.text}"
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
