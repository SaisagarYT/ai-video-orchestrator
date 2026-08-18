import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Play,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { RecentRender } from '../types';

export function RecentRendersDrawer() {
  const [selectedVideo, setSelectedVideo] = useState<RecentRender | null>(null);

  const mockRenders: RecentRender[] = [
    {
      id: 'render-1',
      title: 'Final Cut: Kinetic Streetwear 1080p',
      campaignName: 'Nike Air Velocity',
      duration: '15s',
      aspectRatio: '9:16',
      resolution: '1080×1920 60fps',
      createdAt: '12m ago',
    },
    {
      id: 'render-2',
      title: 'Shot 03: Macro Bottle Liquid Splash',
      campaignName: 'Sauvage Nocturne',
      duration: '5s',
      aspectRatio: '16:9',
      resolution: '3840×2160 4K',
      createdAt: '1h ago',
    },
    {
      id: 'render-3',
      title: 'Shot 01: Titanium Exploded View',
      campaignName: 'CyberPulse Audio',
      duration: '6s',
      aspectRatio: '1:1',
      resolution: '1080×1080 ProRes',
      createdAt: '3h ago',
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0C0F0E] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Film className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight font-app">
            Recent Media Outputs
          </h3>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">MinIO Bucket #s3-renders</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {mockRenders.map((render, idx) => (
          <div
            key={render.id}
            onClick={() => setSelectedVideo(render)}
            className="group relative rounded-xl border border-white/[0.06] hover:border-emerald-500/30 bg-[#121514] p-3.5 transition-all cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-950 to-[#0A1A14] border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                <Play className="h-4 w-4 fill-emerald-400/20" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-semibold text-emerald-400 block">
                  {render.duration}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">{render.createdAt}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                {render.title}
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">{render.campaignName}</p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>{render.aspectRatio}</span>
              <span>{render.resolution}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
