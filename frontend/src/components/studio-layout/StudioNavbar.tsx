import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Film,
  Plus,
  Search,
  LogOut,
  User,
  Shield,
  Bell,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export function StudioNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Studio Dashboard', path: '/campaigns' },
    { label: 'Campaigns', path: '/campaigns' },
    { label: 'Asset Library', path: '/assets' },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/[0.07] bg-[#070908]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between transition-colors">
      {/* Left: Brand & Engine Health Badge */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#013F32] to-[#025745] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_16px_rgba(1,63,50,0.5)] group-hover:border-emerald-400/50 transition-all">
            <Film className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-white tracking-wider uppercase font-app">
                KANGGIRD
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                STUDIO
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium -mt-0.5">AI Ad Film Orchestration</p>
          </div>
        </button>

        {/* Live Engine Status Chip */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111413] border border-white/[0.06] text-[11px] text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-zinc-300">GPU Cluster: Ready</span>
          <span className="text-zinc-600">•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Gemini 2.5 Flash
          </span>
        </div>
      </div>

      {/* Center: Quick Nav Links */}
      <nav className="hidden md:flex items-center gap-1 bg-[#111413]/80 p-1 rounded-xl border border-white/[0.06]">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.label}
              type="button"
              onClick={() => navigate(link.path)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <button
          type="button"
          onClick={() => {}}
          className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl bg-[#111413] border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:border-white/10 transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <span>Search studio...</span>
          <kbd className="text-[10px] font-mono bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded border border-white/[0.06]">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="h-9 w-9 rounded-xl bg-[#111413] border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/10 flex items-center justify-center transition-colors relative cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
        </button>

        {/* Create Campaign CTA */}
        <button
          type="button"
          onClick={() => navigate('/campaigns/new')}
          className="h-9 px-4 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all duration-150 flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New Campaign</span>
        </button>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-[#111413] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xs font-bold text-black shadow-inner">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 pr-0.5" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F1211] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.full_name || 'Studio Producer'}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {user?.email || 'user@kanggird.ai'}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                    <Shield className="h-3 w-3" />
                    <span>Protected Argon2id Session</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Studio Settings</span>
                </button>

                <div className="border-t border-white/[0.06] my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
