import {
  Menu,
  Sparkles,
  Search,
  Tag,
} from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { UserProfileMenu } from './UserProfileMenu';
import { useNavigate, useLocation } from 'react-router-dom';

export function Topbar() {
  const { toggleCommandPalette, setMobileDrawerOpen } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const NAV_LINKS = [
    { label: 'Explore', href: '/campaigns' },
    { label: 'Image', href: '/assets' },
    { label: 'Video', href: '/campaigns', active: true },
    { label: 'Audio', href: '/assets' },
    { label: 'Edit', href: '/campaigns/new', badge: 'Layers' },
    { label: 'Cinema Studio', href: '/campaigns/new', badge: 'New' },
    { label: 'Marketing Studio', href: '/campaigns/new', badge: 'New' },
    { label: 'Viral Presets', href: '/campaigns' },
    { label: 'MCP & CLI', href: '/settings', badge: 'New' },
    { label: 'Supercomputer', href: '/campaigns' },
    { label: 'Academy', href: '/projects', badge: 'New' },
  ];

  return (
    <header className="h-12 border-b border-[#1C1C1C] bg-[#0A0A0A] px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 select-none font-app text-white">
      {/* Left: Brand Icon & Global Studio Nav Links */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open Navigation Drawer"
          className="h-7 w-7 rounded-lg flex items-center justify-center text-[#888] hover:text-white hover:bg-[#181818] md:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 cursor-pointer focus:outline-none shrink-0 pr-1"
        >
          <div className="h-6 w-6 rounded-lg bg-[#E7FE25] flex items-center justify-center text-black font-black text-xs shadow-sm">
            ⚡
          </div>
          <span className="font-extrabold text-xs tracking-wider text-white hidden xl:inline">
            KANGGIRD
          </span>
        </button>

        {/* Studio Top Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          {NAV_LINKS.map((link, idx) => {
            const isCurrent = link.active && location.pathname === link.href;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(link.href)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'text-[#E7FE25] bg-[#141414] font-bold'
                    : 'text-[#888888] hover:text-white hover:bg-[#121212]'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                      link.badge === 'New'
                        ? 'bg-[#E7FE25] text-black'
                        : 'bg-[#183B2B] text-[#10B981]'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Action Tools & Profile Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Pricing Badge (30% OFF) */}
        <button
          type="button"
          onClick={() => alert('Pricing & Pro Studio Plans: 30% OFF Promo Active')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#201018] border border-[#FF3366]/40 text-[#FF4D79] text-[11px] font-bold hover:bg-[#2D1220] transition-colors cursor-pointer"
        >
          <Tag className="h-3 w-3" />
          <span>Pricing</span>
          <span className="bg-[#FF3366] text-white text-[9px] px-1 py-0.2 rounded-full">30% OFF</span>
        </button>

        {/* Enterprise Link */}
        <button
          type="button"
          onClick={() => alert('KANGGIRD Enterprise Studio Custom API')}
          className="hidden lg:flex items-center gap-1 px-2 py-1 text-xs text-[#888] hover:text-white transition-colors cursor-pointer"
        >
          <Sparkles className="h-3 w-3 text-[#E7FE25]" />
          <span>Enterprise</span>
        </button>

        {/* Command Search Button */}
        <button
          type="button"
          onClick={() => toggleCommandPalette()}
          aria-label="Open Command Palette (Cmd + K)"
          className="h-7 w-7 sm:w-auto sm:px-2.5 rounded-lg bg-[#141414] border border-[#242424] hover:border-[#383838] text-xs text-[#888] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline text-[11px]">Search</span>
          <kbd className="hidden sm:inline text-[9px] font-mono px-1 rounded bg-[#202020] text-[#777]">⌘K</kbd>
        </button>

        {/* User Profile Menu */}
        <div className="pl-1 border-l border-[#1C1C1C] ml-1">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
