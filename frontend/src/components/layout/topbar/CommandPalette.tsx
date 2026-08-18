import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '../../ui';
import {
  Search,
  LayoutDashboard,
  Layers,
  FolderOpen,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard listener for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Command items registry
  const commands = useMemo(() => [
    // Navigation
    {
      id: 'nav-campaigns',
      title: 'Go to Campaigns',
      category: 'Navigation',
      icon: <Layers className="h-4 w-4" />,
      perform: () => {
        navigate('/campaigns');
        onOpenChange(false);
      },
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      category: 'Navigation',
      icon: <LayoutDashboard className="h-4 w-4" />,
      perform: () => {
        navigate('/projects');
        onOpenChange(false);
      },
    },
    {
      id: 'nav-assets',
      title: 'Go to Asset Library',
      category: 'Navigation',
      icon: <FolderOpen className="h-4 w-4" />,
      perform: () => {
        navigate('/assets');
        onOpenChange(false);
      },
    },
    {
      id: 'nav-settings',
      title: 'Open Settings',
      category: 'Navigation',
      icon: <Settings className="h-4 w-4" />,
      perform: () => {
        navigate('/settings');
        onOpenChange(false);
      },
    },

    // Actions
    {
      id: 'action-new-campaign',
      title: 'Create New Campaign',
      category: 'Actions',
      shortcut: 'N',
      icon: <Sparkles className="h-4 w-4 text-[var(--brand-lime)]" />,
      perform: () => {
        navigate('/campaigns/new');
        onOpenChange(false);
      },
    },

    // Theme Controls
    {
      id: 'theme-light',
      title: 'Set Theme: Light',
      category: 'System',
      icon: <Sun className="h-4 w-4" />,
      perform: () => {
        setTheme('light');
        onOpenChange(false);
      },
    },
    {
      id: 'theme-dark',
      title: 'Set Theme: Dark',
      category: 'System',
      icon: <Moon className="h-4 w-4" />,
      perform: () => {
        setTheme('dark');
        onOpenChange(false);
      },
    },
    {
      id: 'theme-system',
      title: 'Set Theme: System',
      category: 'System',
      icon: <Laptop className="h-4 w-4" />,
      perform: () => {
        setTheme('system');
        onOpenChange(false);
      },
    },
  ], [navigate, onOpenChange, setTheme]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter((cmd) =>
      cmd.title.toLowerCase().includes(lower) || cmd.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  // Keyboard navigation for arrow keys and enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) {
        current.perform();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-[var(--bg-surface)] border-[var(--border-default)] shadow-2xl font-app">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40">
          <Search className="h-4 w-4 text-[var(--text-muted)] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search workspace..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[10px] font-mono-code text-[var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No matching commands found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.perform}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer select-none text-left ${
                    isSelected
                      ? 'bg-[var(--brand-lime-muted)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isSelected ? 'text-[var(--brand-lime)]' : 'text-[var(--text-muted)]'}>
                      {cmd.icon}
                    </span>
                    <span>{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-[10px] font-mono-code text-[var(--text-muted)]">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
