import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Badge,
} from '../../ui';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  User,
  Sliders,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UserProfileMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const getInitials = (name?: string) => {
    if (!name) return 'CR';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated || !user) {
    return (
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--brand-lime)] text-[#161616] text-xs font-bold shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User Profile Menu"
          className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
        >
          <div className="h-7 w-7 rounded-full bg-[var(--brand-forest)] text-white text-xs font-bold flex items-center justify-center shadow-xs">
            {getInitials(user.full_name || user.email)}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 font-app">
        {/* User Identity Header */}
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate">
              {user.full_name}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight truncate">
              {user.email}
            </p>
            <div className="pt-1">
              <Badge variant="lime" size="sm">
                {user.role || 'Creator'}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Profile & Preferences */}
        <DropdownMenuItem onClick={() => navigate('/settings/profile')} className="cursor-pointer">
          <User className="h-3.5 w-3.5 mr-2 text-[var(--text-muted)]" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
          <Sliders className="h-3.5 w-3.5 mr-2 text-[var(--text-muted)]" />
          <span>Preferences</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme Sub-Options */}
        <div className="px-2 py-1.5 text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
          Theme
        </div>
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`cursor-pointer ${theme === 'light' ? 'font-bold text-[var(--brand-lime)]' : ''}`}
        >
          <Sun className="h-3.5 w-3.5 mr-2" />
          <span>Light Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`cursor-pointer ${theme === 'dark' ? 'font-bold text-[var(--brand-lime)]' : ''}`}
        >
          <Moon className="h-3.5 w-3.5 mr-2" />
          <span>Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`cursor-pointer ${theme === 'system' ? 'font-bold text-[var(--brand-lime)]' : ''}`}
        >
          <Laptop className="h-3.5 w-3.5 mr-2" />
          <span>System Default</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem onClick={logout} className="text-[var(--color-destructive)] cursor-pointer">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
