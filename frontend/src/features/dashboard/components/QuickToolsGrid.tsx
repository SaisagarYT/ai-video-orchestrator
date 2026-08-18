import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Link2,
  Film,
  Sparkles,
  Clapperboard,
  ShieldCheck,
  Sliders,
  Cpu,
  Copy,
  ArrowUpRight,
} from 'lucide-react';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'create' | 'story' | 'render';
  actionPath: string;
}

export function QuickToolsGrid() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'create' | 'story' | 'render'>('all');

  const tools: ToolItem[] = [
    {
      id: 'url-video',
      title: 'URL to Video Ad',
      description: 'Turn any product URL, assets, or brief into high-converting video ads',
      icon: <Link2 className="h-5 w-5 text-emerald-400" />,
      category: 'create',
      actionPath: '/campaigns/new',
    },
    {
      id: 'scene-generator',
      title: 'Multi-Model Scene Studio',
      description: 'Generate cinematic shots across Kling 3.0, Seedance 2.5 & Higgsfield',
      icon: <Film className="h-5 w-5 text-teal-400" />,
      category: 'create',
      actionPath: '/campaigns/new',
    },
    {
      id: 'strategy-concepts',
      title: 'AI Strategy & Concepts',
      description: 'Synthesize 3 distinct creative concepts (A/B/C) with audience positioning',
      icon: <Sparkles className="h-5 w-5 text-[#E7FE25]" />,
      category: 'story',
      actionPath: '/campaigns/new',
    },
    {
      id: 'storyboard-shots',
      title: 'Storyboard & Shotlist',
      description: 'Decompose briefs into shot-by-shot camera paths, lighting & pacing',
      icon: <Clapperboard className="h-5 w-5 text-emerald-300" />,
      category: 'story',
      actionPath: '/campaigns/new',
    },
    {
      id: 'consistency-qa',
      title: 'Consistency & QA Engine',
      description: 'Automated frame evaluation for brand guidelines and motion fidelity',
      icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
      category: 'render',
      actionPath: '/campaigns',
    },
    {
      id: 'timeline-editor',
      title: 'Multi-Track Timeline',
      description: 'Assemble and sequence all rendered scenes with frame-accurate control',
      icon: <Sliders className="h-5 w-5 text-teal-300" />,
      category: 'story',
      actionPath: '/campaigns',
    },
    {
      id: 'master-render',
      title: 'Multi-Format Render Engine',
      description: 'Export broadcast-ready 16:9, 9:16 & 1:1 master video files simultaneously',
      icon: <Cpu className="h-5 w-5 text-emerald-300" />,
      category: 'render',
      actionPath: '/campaigns',
    },
    {
      id: 'ad-remix',
      title: 'Commercial Ad Cloner',
      description: 'Recreate top-performing commercial frameworks adapted to your brand',
      icon: <Copy className="h-5 w-5 text-teal-400" />,
      category: 'create',
      actionPath: '/campaigns/new',
    },
  ];

  const filteredTools = tools.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  return (
    <div className="space-y-4">
      {/* Category Tabs (Image 3 Style) */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `All Tools (${tools.length})` },
            { id: 'create', label: 'Ad Creation' },
            { id: 'story', label: 'Story & Concepts' },
            { id: 'render', label: 'Render & QA' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/campaigns/new')}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors hidden sm:block cursor-pointer"
        >
          View Pipeline Map →
        </button>
      </div>

      {/* 2x4 Tool Grid (Image 3 Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredTools.map((tool, idx) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
            onClick={() => navigate(tool.actionPath)}
            className="group relative rounded-2xl bg-[#0E1210] border border-white/[0.07] hover:border-emerald-500/40 p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-start gap-3.5 overflow-hidden"
          >
            {/* Tool Icon Box */}
            <div className="h-10 w-10 rounded-xl bg-[#141A17] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-emerald-500/30 transition-all">
              {tool.icon}
            </div>

            {/* Tool Text */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                  {tool.title}
                </h3>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1" />
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                {tool.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
