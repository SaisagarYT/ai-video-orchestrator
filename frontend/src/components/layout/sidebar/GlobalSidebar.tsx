import { useState } from 'react';
import {
  Plus,
  Search,
  FolderOpen,
  Sparkles,
  ChevronDown,
  Tag,
  PlaySquare,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function GlobalSidebar() {
  const { sidebarCollapsed, toggleSidebar, toggleCommandPalette } = useAppStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [workspaceName] = useState('Supercomputer');

  return (
    <aside
      aria-label="Studio Workspace Navigation"
      className={`hidden md:flex flex-col justify-between border-r border-[#1C1C1C] bg-[#0A0A0A] transition-all duration-200 shrink-0 select-none z-20 font-app text-white ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Workspace & Primary Actions */}
      <div className="p-3 space-y-3">
        {/* Workspace Switcher */}
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#121212] border border-[#222222]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#E7FE25] flex items-center justify-center text-black font-extrabold text-xs">
                ⚡
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[110px]">
                {workspaceName}
              </span>
              <ChevronDown className="h-3 w-3 text-[#777]" />
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1 text-[#666] hover:text-white hover:bg-[#1C1C1C] rounded-md transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] text-[#E7FE25] transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            ⚡
          </button>
        )}

        {/* New Campaign / Chat Action */}
        <button
          type="button"
          onClick={() => navigate('/campaigns/new')}
          className={`w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#161616] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#E7FE25]/50 text-xs font-bold text-white transition-all cursor-pointer shadow-sm group ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="h-5 w-5 rounded-md bg-[#242424] group-hover:bg-[#E7FE25] group-hover:text-black flex items-center justify-center transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </div>
          {!sidebarCollapsed && <span>New campaign</span>}
        </button>

        {/* Search Action */}
        <button
          type="button"
          onClick={() => toggleCommandPalette()}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#101010] hover:bg-[#181818] border border-[#1E1E1E] text-xs text-[#888] hover:text-white transition-colors cursor-pointer ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          {!sidebarCollapsed && <span>Search</span>}
        </button>

        {/* Products Section */}
        {!sidebarCollapsed && (
          <div className="pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#666] px-1">
              Products
            </span>
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-transparent hover:bg-[#141414] text-xs font-semibold text-[#AAA] hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <PlaySquare className="h-3.5 w-3.5 text-[#E7FE25]" />
                <span>Faceless channel</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#E7FE25] text-black">
                New
              </span>
            </button>
          </div>
        )}

        {/* Tasks / History Section */}
        {!sidebarCollapsed && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#666] px-1">
              <span>Chats & Campaigns</span>
              <button
                type="button"
                onClick={() => navigate('/campaigns/new')}
                className="text-[#888] hover:text-white cursor-pointer"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Empty Folder Card (from Screenshot 1) */}
            <div className="p-4 rounded-2xl bg-[#0E0E0E] border border-[#1C1C1C] flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#777]">
                <FolderOpen className="h-5 w-5 text-[#888]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">No tasks yet</p>
                <p className="text-[10px] text-[#666]">Create one to get started</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Promo Card & User Footer */}
      <div className="p-3 space-y-2 border-t border-[#1C1C1C]">
        {/* Learn to make movies Promo Card (from Screenshot 1) */}
        {!sidebarCollapsed && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#141414] to-[#0D0D0D] border border-[#222222] space-y-2.5 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between text-[10px] text-[#777]">
              <span>Learn to make movies</span>
              <Sparkles className="h-3 w-3 text-[#E7FE25]" />
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              Practical workflows from working AI filmmakers
            </p>
            <div className="flex items-center gap-1">
              <div className="h-7 flex-1 rounded-md bg-[#1E1E1E] border border-[#333] overflow-hidden flex items-center justify-center text-[9px] text-[#888]">
                🎥 Cinematic
              </div>
              <div className="h-7 flex-1 rounded-md bg-[#1E1E1E] border border-[#333] overflow-hidden flex items-center justify-center text-[9px] text-[#888]">
                ⚡ Prompts
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Accessing KANGGIRD Filmmaker Masterclass...')}
              className="w-full py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Learn more
            </button>
          </div>
        )}

        {/* Pricing (30% OFF) Pill */}
        <button
          type="button"
          onClick={() => alert('Pricing & Pro Studio Plans: 30% OFF')}
          className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-[#FF4D79] hover:bg-[#1E0E16] transition-colors cursor-pointer ${
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-[#FF3366]" />
            {!sidebarCollapsed && <span>Pricing</span>}
          </div>
          {!sidebarCollapsed && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF3366] text-white">
              30% OFF
            </span>
          )}
        </button>

        {/* User Account / Logout */}
        {user && !sidebarCollapsed && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#121212] border border-[#1E1E1E]">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6 w-6 rounded-full bg-[#013F32] border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-white truncate">
                {user.full_name || user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-[#777] hover:text-red-400 p-1 cursor-pointer"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
