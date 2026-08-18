import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Film,
  Plus,
  Compass,
  FolderOpen,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  Layers,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { CampaignSummary } from '../types';

interface StudioSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  recentCampaigns: CampaignSummary[];
}

export function StudioSidebar({
  isCollapsed,
  onToggleCollapse,
  recentCampaigns,
}: StudioSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'New Campaign', icon: <Plus className="h-4 w-4" />, path: '/campaigns/new', isPrimary: true },
    { label: 'Studio Hub', icon: <Compass className="h-4 w-4" />, path: '/campaigns' },
    { label: 'Asset Vault', icon: <FolderOpen className="h-4 w-4" />, path: '/assets' },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 shrink-0 border-r border-white/[0.06] bg-[#0A0C0B] flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="p-3 space-y-4">
        {/* Workspace Brand & Collapse Toggle */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#013F32] to-[#025745] border border-emerald-500/30 flex items-center justify-center shadow-md">
                <Film className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  KANGGIRD
                </span>
                <p className="text-[10px] text-zinc-500 font-mono -mt-0.5">Ad Studio</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="h-7 w-7 mx-auto rounded-lg bg-gradient-to-br from-[#013F32] to-[#025745] border border-emerald-500/30 flex items-center justify-center">
              <Film className="h-3.5 w-3.5 text-emerald-300" />
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer hidden sm:flex"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Primary Action & Navigation */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path && !item.isPrimary;

            if (item.isPrimary) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`w-full h-9 rounded-xl flex items-center gap-2 font-bold text-xs transition-all cursor-pointer shadow-sm ${
                    isCollapsed
                      ? 'justify-center bg-white text-black hover:bg-zinc-200'
                      : 'px-3 bg-white text-black hover:bg-zinc-200 justify-start'
                  }`}
                  title={item.label}
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full h-9 rounded-xl flex items-center gap-2.5 text-xs font-medium transition-all cursor-pointer ${
                  isCollapsed ? 'justify-center' : 'px-3 justify-start'
                } ${
                  isActive
                    ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title={item.label}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Recent Workspaces / Projects (Claude Style) */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <span>Recent Campaigns</span>
              <span className="font-mono text-zinc-600">{recentCampaigns.length}</span>
            </div>

            <div className="space-y-0.5 max-h-[calc(100vh-380px)] overflow-y-auto no-scrollbar">
              {recentCampaigns.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/campaigns/${c.id}/overview`)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{c.name}</span>
                  <span className="text-[9px] font-mono text-zinc-500 group-hover:text-emerald-400 shrink-0">
                    {c.aspect_ratio || '9:16'}
                  </span>
                </button>
              ))}

              {recentCampaigns.length === 0 && (
                <p className="px-2 py-3 text-[11px] text-zinc-600 italic">No recent campaigns</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: User Session & Settings */}
      <div className="p-3 border-t border-white/[0.05] space-y-1">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-black font-bold text-xs flex items-center justify-center shrink-0">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.full_name || 'Studio Producer'}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email || 'user@kanggird.ai'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
