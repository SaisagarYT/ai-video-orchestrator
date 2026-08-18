import { useEffect } from 'react';
import {
  Layers,
  LayoutDashboard,
  FolderOpen,
  Settings,
  X,
  Plus,
} from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useLocation, useNavigate } from 'react-router-dom';

const MOBILE_NAV_ITEMS = [
  { id: 'campaigns', label: 'Campaigns', href: '/campaigns', icon: <Layers className="h-4 w-4" /> },
  { id: 'projects', label: 'Projects', href: '/projects', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'assets', label: 'Assets', href: '/assets', icon: <FolderOpen className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
];

export function MobileDrawer() {
  const { mobileDrawerOpen, setMobileDrawerOpen } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Close on route change or ESC key
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname, setMobileDrawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen, setMobileDrawerOpen]);

  if (!mobileDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex font-app">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Card */}
      <aside
        aria-label="Mobile Navigation"
        className="relative w-64 max-w-[80vw] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] h-full flex flex-col justify-between p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand-lime)] flex items-center justify-center text-[#161616] font-black text-xs">
                K
              </div>
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                KANGGIRD
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close navigation"
              className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Action Button */}
          <button
            type="button"
            onClick={() => {
              navigate('/campaigns/new');
              setMobileDrawerOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-[var(--radius-md)] bg-[var(--brand-lime)] text-[#161616] text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            {MOBILE_NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.href);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.href);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[var(--brand-lime-muted)] text-[var(--text-primary)] border border-[var(--brand-lime)]/20 font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className={isActive ? 'text-[var(--brand-lime)]' : 'text-[var(--text-muted)]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
          KANGGIRD AI Video Studio
        </div>
      </aside>
    </div>
  );
}
