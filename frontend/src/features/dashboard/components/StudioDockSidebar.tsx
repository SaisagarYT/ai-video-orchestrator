import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Film,
  Compass,
  Layers,
  Clapperboard,
  Sliders,
  Cpu,
  FolderOpen,
  Settings,
  Plus,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export function StudioDockSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const dockItems = [
    { label: 'Studio Home', icon: <Compass className="h-5 w-5" />, path: '/campaigns' },
    { label: 'New Campaign', icon: <Plus className="h-5 w-5" />, path: '/campaigns/new', isAccent: true },
    { label: 'Asset Vault', icon: <FolderOpen className="h-5 w-5" />, path: '/assets' },
  ];

  return (
    <aside className="w-16 h-screen sticky top-0 shrink-0 border-r border-white/[0.06] bg-[#070908]/95 backdrop-blur-xl flex flex-col justify-between items-center py-4 z-40 select-none">
      {/* Top Logo */}
      <div className="space-y-6 flex flex-col items-center">
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#013F32] via-[#025745] to-[#01261E] border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_18px_rgba(1,63,50,0.6)] hover:border-emerald-400 transition-all cursor-pointer group"
          title="KANGGIRD AI Ad Studio"
        >
          <Film className="h-5 w-5 text-emerald-300 group-hover:scale-110 transition-transform" />
        </button>

        {/* Dock Icons */}
        <div className="space-y-2 flex flex-col items-center">
          {dockItems.map((item) => {
            const isActive = location.pathname === item.path;

            if (item.isAccent) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="h-10 w-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.35)] transition-all cursor-pointer group relative"
                  title={item.label}
                >
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                  {/* Tooltip */}
                  <span className="absolute left-14 px-2 py-1 rounded-md bg-[#161817] border border-white/10 text-[11px] font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-white/[0.08] text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                }`}
                title={item.label}
              >
                {item.icon}
                {/* Tooltip */}
                <span className="absolute left-14 px-2 py-1 rounded-md bg-[#161817] border border-white/10 text-[11px] font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Settings & Help */}
      <div className="space-y-2 flex flex-col items-center">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="h-10 w-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.04] flex items-center justify-center transition-colors cursor-pointer group relative"
          title="Studio Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="absolute left-14 px-2 py-1 rounded-md bg-[#161817] border border-white/10 text-[11px] font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
}
