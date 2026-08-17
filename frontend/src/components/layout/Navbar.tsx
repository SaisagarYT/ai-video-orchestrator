import { Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDesignSystem?: () => void;
}

export function Navbar({ onOpenAuth, onOpenDesignSystem }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[var(--radius-md)] bg-[var(--brand-lime)] flex items-center justify-center text-[#161616] font-extrabold text-base shadow-[var(--shadow-glow-lime)] select-none">
            K
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
              KANGGIRD
            </span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-medium">
              AI Video Studio
            </span>
          </div>
        </div>

        {/* Right Action Deck */}
        <div className="flex items-center gap-3">
          {onOpenDesignSystem && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs hidden sm:inline-flex"
              onClick={onOpenDesignSystem}
            >
              Design Spec
            </Button>
          )}

          {isAuthenticated && user ? (
            /* Logged In User Pill & Menu */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-active)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
                  <span className="text-xs font-semibold text-[var(--text-primary)] max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <div className="h-7 w-7 rounded-full bg-[var(--brand-forest)] text-white text-xs font-bold flex items-center justify-center">
                    {getInitials(user.full_name || user.email)}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-none">{user.full_name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] leading-none truncate">{user.email}</p>
                    <div className="pt-1">
                      <Badge variant="lime" size="sm">
                        {user.role || 'Creator'}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-[var(--color-destructive)] cursor-pointer">
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Logged Out Actions */
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<UserIcon className="h-3.5 w-3.5" />}
                onClick={() => onOpenAuth('login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                onClick={() => onOpenAuth('register')}
              >
                Launch Studio
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
