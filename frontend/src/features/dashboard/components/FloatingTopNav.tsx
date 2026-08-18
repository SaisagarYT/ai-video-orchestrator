import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Film,
  Search,
  LogOut,
  User,
  Shield,
  Sparkles,
  Sliders,
} from 'lucide-react';

export function FloatingTopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navTabs = [
    { id: 'studio', label: '★ KANGGIRD Studio', path: '/campaigns' },
    { id: 'briefs', label: 'Creative Intake', path: '/campaigns/new' },
    { id: 'vault', label: 'Asset Vault', path: '/assets' },
  ];

  return (
    <div className="sticky top-4 z-40 w-full flex items-center justify-between px-6 sm:px-10 pointer-events-none select-none">
      {/* Left: Studio Mode Indicator */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C100E]/80 border border-white/[0.08] backdrop-blur-md shadow-lg text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold tracking-wide">KANGGIRD</span>
          <span className="text-zinc-500">•</span>
          <span className="text-emerald-400 font-mono text-[11px]">v2.5 Pro</span>
        </div>
      </div>

      {/* Center: Apple TV+ Style Floating Frosted Capsule (Image 2 Style) */}
      <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-full bg-[#121614]/80 border border-white/[0.1] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {navTabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Search button */}
        <button
          type="button"
          onClick={() => {}}
          className="h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer ml-1"
          title="Search studio (⌘K)"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: User Profile Menu */}
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#0C100E]/80 border border-white/[0.08] backdrop-blur-md hover:border-emerald-500/30 transition-all cursor-pointer shadow-lg"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-[10px] font-bold text-black shadow-inner">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-xs font-semibold text-white truncate max-w-[90px]">
            {user?.full_name ? user.full_name.split(' ')[0] : 'Studio'}
          </span>
        </button>

        {showProfileMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0F1311] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-xs font-bold text-white truncate">
                  {user?.full_name || 'Studio Producer'}
                </p>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {user?.email || 'user@kanggird.ai'}
                </p>
              </div>

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
  );
}
