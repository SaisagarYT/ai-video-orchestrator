import React from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Sparkles,
  Cpu,
  HardDrive,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface StudioMetricsRowProps {
  activeCampaignsCount: number;
  totalScenesCount?: number;
}

export function StudioMetricsRow({
  activeCampaignsCount,
  totalScenesCount = 24,
}: StudioMetricsRowProps) {
  const metrics = [
    {
      label: 'Active Productions',
      value: activeCampaignsCount.toString(),
      sublabel: 'Campaigns in pipeline',
      badge: '+2 this week',
      isPositive: true,
      icon: <Film className="h-4 w-4 text-emerald-400" />,
      glowColor: 'from-emerald-500/10 to-teal-500/5',
    },
    {
      label: 'Generated Scene Shots',
      value: totalScenesCount.toString(),
      sublabel: 'Multi-model video clips',
      badge: '98.4% QA Pass',
      isPositive: true,
      icon: <Sparkles className="h-4 w-4 text-teal-400" />,
      glowColor: 'from-teal-500/10 to-emerald-500/5',
    },
    {
      label: 'GPU Generation Queue',
      value: 'Online',
      sublabel: 'Kling • Seedance • Higgsfield',
      badge: '0.4s Avg Latency',
      isPositive: true,
      icon: <Cpu className="h-4 w-4 text-emerald-300" />,
      glowColor: 'from-emerald-600/10 to-transparent',
    },
    {
      label: 'MinIO Media Vault',
      value: '1.8 GB',
      sublabel: 'Isolated S3 asset bucket',
      badge: '50 GB Quota',
      isPositive: false,
      icon: <HardDrive className="h-4 w-4 text-zinc-400" />,
      glowColor: 'from-zinc-500/5 to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="group relative rounded-2xl bg-[#0F1211] border border-white/[0.07] p-5 hover:border-emerald-500/30 transition-all duration-300 shadow-md overflow-hidden"
        >
          {/* Subtle Corner Glow */}
          <div
            className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${m.glowColor} blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60`}
          />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                {m.label}
              </span>
              <div className="h-8 w-8 rounded-xl bg-[#141816] border border-white/[0.06] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                {m.icon}
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-app tracking-tight">
                  {m.value}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{m.sublabel}</p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                <Activity className="h-3 w-3" />
                {m.badge}
              </span>
              <span className="text-[10px] text-zinc-500">Live Telemetry</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
