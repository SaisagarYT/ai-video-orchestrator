import { useState } from 'react';
import { Button } from '../../../components/ui';
import { Sparkles, ArrowRight, Upload, Utensils, Zap, Shirt, Laptop, Heart } from 'lucide-react';

interface InitialPromptStepProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  error?: string | null;
}

const STARTER_PROMPTS = [
  {
    category: 'Restaurant / Food',
    icon: <Utensils className="h-3.5 w-3.5" />,
    text: 'A high-energy commercial for authentic Bawarchi firewood dum biryani in clay pots, featuring steaming saffron basmati and sizzling lamb.',
  },
  {
    category: 'Luxury EV Automotive',
    icon: <Zap className="h-3.5 w-3.5" />,
    text: 'A 35mm cinematic commercial for the Lucid Air Sapphire electric sedan, highlighting aerodynamic carbon curves and 0-60 in 1.89s.',
  },
  {
    category: 'Athletic Apparel',
    icon: <Shirt className="h-3.5 w-3.5" />,
    text: 'A neon-lit rain-slicked city night teaser for Nike Air Velocity carbon running shoes focusing on high-speed foot strikes.',
  },
  {
    category: 'SaaS Platform',
    icon: <Laptop className="h-3.5 w-3.5" />,
    text: 'An AI video creation suite that turns simple product links into broadcast-ready television and TikTok commercials.',
  },
  {
    category: 'Wedding & Events',
    icon: <Heart className="h-3.5 w-3.5" />,
    text: 'An emotional cinematic teaser for a luxury destination wedding in Udaipur with golden hour palace reflections and candlelit mandap.',
  },
];

export function InitialPromptStep({ onSubmit, isLoading, error }: InitialPromptStepProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 5) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (prompt.trim().length >= 5) {
        onSubmit(prompt.trim());
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-app py-4">
      {/* Title & Vision Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-lime-muted)] border border-[var(--brand-lime)]/30 text-[var(--brand-lime)] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>AI Director Mode</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] font-app">
          Tell KANGGIRD what you want to advertise
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          Describe your product, restaurant, event, or vision in plain language. KANGGIRD will analyze missing details and ask targeted questions to build your commercial brief.
        </p>
      </div>

      {/* Main Vision Input Card */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-4 shadow-xl">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Your Advertising Vision & Product Concept
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            required
            placeholder="e.g. I want a 60-second cinematic commercial for our artisanal sourdough bakery. Show crispy golden crusts crackling in extreme macro and morning sunlight streaming through the kitchen..."
            className="w-full p-4 rounded-xl bg-[var(--bg-surface-sunken)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-lime)] transition-colors resize-none leading-relaxed"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Optional Asset Upload Cue */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Upload className="h-4 w-4" />
            <span>You can add logos or reference clips in the next steps</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={prompt.trim().length < 5 || isLoading}
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full sm:w-auto font-bold shadow-[0_0_20px_rgba(231,254,37,0.3)]"
          >
            Start Dynamic Interview
          </Button>
        </div>
      </form>

      {/* Quick Example Starter Chips */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">
          Or start with a curated creative angle
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STARTER_PROMPTS.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(starter.text)}
              className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-lime)]/50 hover:bg-[var(--bg-surface-elevated)] transition-all text-left space-y-1.5 cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-lime)] transition-colors">
                <span className="text-[var(--brand-lime)]">{starter.icon}</span>
                <span>{starter.category}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                "{starter.text}"
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
