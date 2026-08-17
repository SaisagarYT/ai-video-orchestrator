import { useState } from 'react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Textarea,
  Label,
  Switch,
  TooltipProvider,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  Sparkles,
  Sliders,
  Film,
  Maximize2,
  Layers,
  Palette,
  Type,
  Layout,
  ShieldCheck,
  Zap,
  Code2,
} from 'lucide-react';

export function DesignSystemShowcase({ onClose }: { onClose?: () => void }) {
  const { setTheme, isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<'overview' | 'typography' | 'colors' | 'components' | 'studio-shell'>('overview');
  const [proMode, setProMode] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const simulateAction = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 1200);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200 flex flex-col font-app">
        {/* Top Professional Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--brand-lime)] flex items-center justify-center text-[#161616] font-bold text-sm shadow-[var(--shadow-glow-lime)]">
                K
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                    KANGGIRD Production Design System
                  </span>
                  <Badge variant="lime" size="sm">
                    Design Spec v1.0
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Architectural tokens, component primitives, and information hierarchy
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Selector Toggle */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={isDark ? <Sun className="h-3.5 w-3.5 text-[var(--brand-lime)]" /> : <Moon className="h-3.5 w-3.5" />}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>

            {onClose && (
              <Button variant="primary" size="sm" onClick={onClose}>
                Exit to Website
              </Button>
            )}
          </div>
        </header>

        {/* 2-Column Professional Layout */}
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Left Sticky Sidebar Menu */}
          <aside className="w-64 border-r border-[var(--border-subtle)] p-4 space-y-1 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden md:block">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 py-2">
              Design Architecture
            </div>

            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer text-left ${
                activeSection === 'overview'
                  ? 'bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] border border-[var(--brand-lime)]/30 font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layout className="h-4 w-4 shrink-0" />
              <span>1. System Overview</span>
            </button>

            <button
              onClick={() => setActiveSection('typography')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer text-left ${
                activeSection === 'typography'
                  ? 'bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] border border-[var(--brand-lime)]/30 font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Type className="h-4 w-4 shrink-0" />
              <span>2. Typography Domain Split</span>
            </button>

            <button
              onClick={() => setActiveSection('colors')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer text-left ${
                activeSection === 'colors'
                  ? 'bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] border border-[var(--brand-lime)]/30 font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Palette className="h-4 w-4 shrink-0" />
              <span>3. Color Tokens & Palettes</span>
            </button>

            <button
              onClick={() => setActiveSection('components')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer text-left ${
                activeSection === 'components'
                  ? 'bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] border border-[var(--brand-lime)]/30 font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span>4. Atomic UI Components</span>
            </button>

            <button
              onClick={() => setActiveSection('studio-shell')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer text-left ${
                activeSection === 'studio-shell'
                  ? 'bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] border border-[var(--brand-lime)]/30 font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Film className="h-4 w-4 shrink-0" />
              <span>5. Studio Layout Shell</span>
            </button>

            <div className="pt-6 border-t border-[var(--border-subtle)] mt-6 space-y-3 px-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Studio Mode Toggle
              </div>
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)]">
                <Switch
                  checked={proMode}
                  onCheckedChange={setProMode}
                  label={proMode ? '⚡ Pro Creator Mode' : '🪄 Guided Director'}
                  description={proMode ? 'Direct granular control deck' : 'Step-by-step interview'}
                />
              </div>
            </div>
          </aside>

          {/* Right Main Detail Canvas */}
          <main className="flex-1 p-6 md:p-8 space-y-10 overflow-y-auto pb-32">
            {/* SECTION 1: SYSTEM OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    KANGGIRD Design System Architecture
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    A dual-domain design system built specifically for high-throughput AI Video Orchestration.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card className="border-[var(--brand-forest)]/40 bg-[var(--bg-surface)]">
                    <CardHeader className="pb-2">
                      <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--brand-forest)] flex items-center justify-center text-white mb-2">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm">Design Philosophy</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-[var(--text-secondary)] space-y-1.5">
                      <p>• Restrained, functional, workspace-oriented.</p>
                      <p>• High-density control decks with low visual fatigue.</p>
                      <p>• Zero fluff or fake generated animations.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[var(--brand-lime)]/30 bg-[var(--bg-surface)]">
                    <CardHeader className="pb-2">
                      <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--brand-lime-muted)] flex items-center justify-center text-[var(--brand-lime)] mb-2">
                        <Zap className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm">Dual-Domain Split</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-[var(--text-secondary)] space-y-1.5">
                      <p>• <strong>Public Web</strong>: Editorial Playfair Display.</p>
                      <p>• <strong>Studio App</strong>: Plus Jakarta Sans.</p>
                      <p>• <strong>Spec Data</strong>: JetBrains Mono code.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
                    <CardHeader className="pb-2">
                      <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--bg-surface-elevated)] flex items-center justify-center text-[var(--text-primary)] mb-2">
                        <Code2 className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm">Production Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-[var(--text-secondary)] space-y-1.5">
                      <p>• 100% Type-safe TypeScript props.</p>
                      <p>• Radix UI accessibility (ARIA + focus loops).</p>
                      <p>• 416ms instantaneous Vite build time.</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Interactive Demo Card */}
                <Card className="border-[var(--border-strong)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Interactive Studio Preview Deck</CardTitle>
                      <Badge variant="lime" dot>
                        Live Component Integration
                      </Badge>
                    </div>
                    <CardDescription>
                      Test the primary action triggers, loading spinners, and modal dialogs below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Sparkles className="h-4 w-4" />}
                        isLoading={buttonLoading}
                        onClick={simulateAction}
                      >
                        Test Action Spinner
                      </Button>
                      <Button variant="forest" size="md" leftIcon={<Film className="h-4 w-4" />}>
                        Forest Primary
                      </Button>
                      <Button variant="secondary" size="md" leftIcon={<Sliders className="h-4 w-4" />}>
                        Configure Deck
                      </Button>

                      {/* Modal Dialog */}
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="md" leftIcon={<Maximize2 className="h-4 w-4" />}>
                            Open Spec Dialog
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Scene Specification Inspector</DialogTitle>
                            <DialogDescription>
                              Structured prompt compiler output and multi-track audio configuration.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)] font-mono-code text-xs space-y-1 text-[var(--text-secondary)]">
                            <p className="text-[var(--brand-lime)]">// Resolution & Audio Ducking</p>
                            <p>"aspect_ratio": "9:16", "resolution": "1080x1920",</p>
                            <p>"voiceover_ducking": -12.0 dB, "transition": "crossfade"</p>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                              Close
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>
                              Apply Spec
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECTION 2: TYPOGRAPHY */}
            {activeSection === 'typography' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Domain-Separated Typography Architecture
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Clear separation between high-impact editorial public storytelling and information-dense workspace UI.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Public Editorial Display */}
                  <Card className="border-[var(--brand-forest)]/30">
                    <CardHeader>
                      <Badge variant="forest" className="w-fit mb-1">
                        Domain 1: Public Website (Editorial)
                      </Badge>
                      <CardTitle className="font-editorial text-2xl font-normal italic">
                        Playfair Display
                      </CardTitle>
                      <CardDescription>
                        Used for landing pages, narrative headlines, and public brand storytelling.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 font-editorial">
                      <div className="text-4xl text-[var(--text-primary)] font-normal leading-tight">
                        Autonomous Creative Video Direction
                      </div>
                      <div className="text-2xl italic text-[var(--text-secondary)]">
                        "From raw business brief to broadcast-grade commercial in minutes."
                      </div>
                      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] font-app text-xs text-[var(--text-muted)]">
                        Class: <code className="text-[var(--brand-lime)] font-mono-code">.font-editorial</code>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Studio Workspace App */}
                  <Card className="border-[var(--brand-lime)]/30">
                    <CardHeader>
                      <Badge variant="lime" className="w-fit mb-1">
                        Domain 2: Studio Application (Workspace)
                      </Badge>
                      <CardTitle className="font-app text-lg font-bold">
                        Plus Jakarta Sans
                      </CardTitle>
                      <CardDescription>
                        Used for control decks, storyboards, timelines, inspectors, and forms.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 font-app">
                      <div className="space-y-2">
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                          SCENE 01 / 05 • SIZZLING FIREWOOD CLAY POT
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          35mm Anamorphic optical pass with high-speed macro dolly-in. Saffron basmati steam bursts at 120 FPS.
                        </p>
                      </div>
                      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                        Class: <code className="text-[var(--brand-lime)] font-mono-code">.font-app</code>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* SECTION 3: COLOR PALETTE */}
            {activeSection === 'colors' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Color Token Matrix & Contrast Standards
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Curated high-contrast tokens engineered for pro studio workstations. Click any swatch to copy HEX.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Swatch: Acid Lime */}
                  <div
                    onClick={() => copyHex('#E7FE25')}
                    className="p-4 rounded-[var(--radius-lg)] bg-[#E7FE25] text-[#161616] cursor-pointer hover:scale-102 transition-transform shadow-sm"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">Primary Lime</div>
                    <div className="font-mono-code text-sm font-bold mt-4">#E7FE25</div>
                    <div className="text-[10px] opacity-80 mt-1">
                      {copiedColor === '#E7FE25' ? '✓ Copied!' : 'Action Accent & Focus'}
                    </div>
                  </div>

                  {/* Swatch: Brand Forest */}
                  <div
                    onClick={() => copyHex('#013F32')}
                    className="p-4 rounded-[var(--radius-lg)] bg-[#013F32] text-white cursor-pointer hover:scale-102 transition-transform shadow-sm"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">Brand Forest</div>
                    <div className="font-mono-code text-sm font-bold mt-4">#013F32</div>
                    <div className="text-[10px] opacity-80 mt-1">
                      {copiedColor === '#013F32' ? '✓ Copied!' : 'Luxury Brand Identity'}
                    </div>
                  </div>

                  {/* Swatch: Dark Canvas Base */}
                  <div
                    onClick={() => copyHex('#0A0A0A')}
                    className="p-4 rounded-[var(--radius-lg)] bg-[#0A0A0A] text-white border border-[#262626] cursor-pointer hover:scale-102 transition-transform shadow-sm"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">Studio Base</div>
                    <div className="font-mono-code text-sm font-bold mt-4">#0A0A0A</div>
                    <div className="text-[10px] text-[#868E96] mt-1">
                      {copiedColor === '#0A0A0A' ? '✓ Copied!' : 'Background Canvas'}
                    </div>
                  </div>

                  {/* Swatch: Elevated Card Surface */}
                  <div
                    onClick={() => copyHex('#141414')}
                    className="p-4 rounded-[var(--radius-lg)] bg-[#141414] text-white border border-[#262626] cursor-pointer hover:scale-102 transition-transform shadow-sm"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">Card Surface</div>
                    <div className="font-mono-code text-sm font-bold mt-4">#141414</div>
                    <div className="text-[10px] text-[#868E96] mt-1">
                      {copiedColor === '#141414' ? '✓ Copied!' : 'Elevated Studio Decks'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: ATOMIC COMPONENTS */}
            {activeSection === 'components' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Atomic Component Catalog
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Typed, accessible primitives built with Radix UI and Class Variance Authority.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Status Badges */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                        Status Indicators & Pills
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2.5">
                      <Badge variant="lime" dot>
                        Rendering (60% Progress)
                      </Badge>
                      <Badge variant="forest" dot>
                        Approved Master
                      </Badge>
                      <Badge variant="success" dot>
                        Quality Score: 9.2/10
                      </Badge>
                      <Badge variant="warning" dot>
                        Review Recommended
                      </Badge>
                      <Badge variant="destructive" dot>
                        Failed Token Pass
                      </Badge>
                      <Badge variant="info" dot>
                        Queued in Redis
                      </Badge>
                      <Badge variant="outline">
                        1080x1920 • 30 FPS
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Form Controls */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                        Input Fields & Textareas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label required>Visual Prompt Directive</Label>
                        <Input defaultValue="35mm macro shot of saffron basmati dum handi" />
                      </div>
                      <div>
                        <Label>Audio Script & Narration</Label>
                        <Input defaultValue="When ordinary food just won't do... taste the tradition." />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* SECTION 5: STUDIO SHELL */}
            {activeSection === 'studio-shell' && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Production Studio Layout Architecture
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    The 3-pane professional workstation layout that houses the creative video generation workflow.
                  </p>
                </div>

                <div className="border border-[var(--border-default)] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--bg-surface)] shadow-md">
                  {/* Mock Studio Header */}
                  <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-4 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">Campaign: Weekend Biryani Feast</span>
                      <Badge variant="lime" size="sm">
                        Version 001
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="xs">
                        Export Specs
                      </Button>
                      <Button variant="primary" size="xs" leftIcon={<Film className="h-3 w-3" />}>
                        Render Video
                      </Button>
                    </div>
                  </div>

                  {/* 3-Column Studio Grid */}
                  <div className="grid grid-cols-12 min-h-[360px] divide-x divide-[var(--border-subtle)]">
                    {/* Left: Shot Hierarchy (3 cols) */}
                    <div className="col-span-3 p-3 space-y-2 bg-[var(--bg-surface)]">
                      <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                        Shot Sequence (5 Total)
                      </div>
                      {[
                        { num: '01', title: 'Extreme Macro Hook', dur: '12s', active: true },
                        { num: '02', title: 'Firewood Dum Preparation', dur: '12s', active: false },
                        { num: '03', title: 'Clay Pot Seal Climax', dur: '14s', active: false },
                        { num: '04', title: 'Dining Feast Showcase', dur: '12s', active: false },
                        { num: '05', title: 'Brand Hero Lockup', dur: '10s', active: false },
                      ].map((s) => (
                        <div
                          key={s.num}
                          className={`p-2 rounded-[var(--radius-sm)] border text-xs cursor-pointer ${
                            s.active
                              ? 'bg-[var(--brand-lime-muted)] border-[var(--brand-lime)]/40 text-[var(--brand-lime)] font-semibold'
                              : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>Shot {s.num}: {s.title}</span>
                            <span className="font-mono-code text-[10px]">{s.dur}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Center: 9:16 Cinema Monitor (5 cols) */}
                    <div className="col-span-5 p-4 bg-[var(--bg-surface-sunken)] flex flex-col items-center justify-center">
                      <div className="w-[180px] h-[320px] rounded-[var(--radius-lg)] bg-[#121212] border-2 border-[var(--brand-lime)]/40 shadow-xl flex flex-col items-center justify-between p-3 relative overflow-hidden">
                        <div className="text-[9px] font-mono-code text-[var(--brand-lime)] self-start">
                          REC • 1080x1920 (9:16)
                        </div>
                        <div className="text-center space-y-1">
                          <div className="h-10 w-10 rounded-full bg-[var(--brand-lime)] text-[#161616] flex items-center justify-center mx-auto shadow-md">
                            <Film className="h-5 w-5" />
                          </div>
                          <div className="text-[10px] font-bold text-white">Shot 01: The Sizzle</div>
                        </div>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-[var(--brand-lime)]" />
                        </div>
                      </div>
                    </div>

                    {/* Right: Parameter Control Deck (4 cols) */}
                    <div className="col-span-4 p-3.5 space-y-3 bg-[var(--bg-surface)] text-xs">
                      <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                        Shot 01 Parameters
                      </div>
                      <div>
                        <Label className="text-[11px]">Camera Optics</Label>
                        <Input defaultValue="35mm Anamorphic High-Speed Dolly" className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[11px]">Lighting & Mood LUT</Label>
                        <Input defaultValue="Kodak 5219 Vision3 Golden Rim" className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[11px]">Voiceover Narration</Label>
                        <Textarea
                          defaultValue="When ordinary food just won't do... taste the tradition."
                          className="text-xs min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
