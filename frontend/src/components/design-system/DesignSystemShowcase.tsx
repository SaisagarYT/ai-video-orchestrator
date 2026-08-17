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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Skeleton,
} from '../ui';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  Sparkles,
  Sliders,
  Film,
  Wand2,
  MoreVertical,
  Maximize2,
  Copy,
} from 'lucide-react';

export function DesignSystemShowcase({ onClose }: { onClose?: () => void }) {
  const { setTheme, isDark } = useTheme();
  const [proMode, setProMode] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);

  const simulateAction = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 1200);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--brand-lime)] flex items-center justify-center text-[#161616] font-bold text-sm shadow-[var(--shadow-glow-lime)]">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                  KANGGIRD Production Design System
                </span>
                <Badge variant="lime" size="sm">
                  v1.0.0
                </Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Enterprise tokens, atomic primitives, and workspace architecture foundation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Selector Toggle */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? 'Light Theme' : 'Dark Theme'}
            </Button>

            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Back to Site
              </Button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-6xl mx-auto p-6 space-y-12 pb-24">
          {/* Section: Typography Separation Principle */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                1. Typography Scale & Domain Separation
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Editorial Display */}
              <Card className="border-[var(--brand-forest)]/20">
                <CardHeader>
                  <Badge variant="forest" className="w-fit mb-1">
                    Public Website Language
                  </Badge>
                  <CardTitle className="font-editorial text-2xl font-normal italic">
                    Editorial & Expressive Typography
                  </CardTitle>
                  <CardDescription>
                    Playfair Display • High-impact brand presence, expansive storytelling, hero titles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="font-editorial text-4xl text-[var(--text-primary)]">
                    Autonomous Video Direction for High-Growth Brands
                  </div>
                  <p className="font-editorial italic text-base text-[var(--text-secondary)]">
                    "Transforming static product specifications into cinematic commercial narratives."
                  </p>
                </CardContent>
              </Card>

              {/* Information-Dense Studio Application */}
              <Card className="border-[var(--brand-lime)]/30">
                <CardHeader>
                  <Badge variant="lime" className="w-fit mb-1">
                    Studio Application Language
                  </Badge>
                  <CardTitle className="font-app text-lg font-bold">
                    Information-Dense Pro Workspace
                  </CardTitle>
                  <CardDescription>
                    Plus Jakarta Sans • Structured, restrained, functional, high legibility in control decks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 font-app text-xs text-[var(--text-secondary)]">
                  <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex justify-between items-center text-[var(--text-primary)] font-medium">
                      <span>SCENE 01 / 05 • EXTREME MACRO HOOK</span>
                      <span className="font-mono-code text-[11px] text-[var(--brand-lime)]">00:00 - 00:12s</span>
                    </div>
                    <p className="text-[var(--text-muted)]">
                      Camera: 35mm High-Speed Dolly-In • Lighting: 5600K Key with Saffron Golden Rim
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Buttons & Interactive States */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                2. Button System & Interactive States
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-xs">Primary Brand</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Button variant="primary" size="md" className="w-full" leftIcon={<Sparkles className="h-4 w-4" />}>
                    Generate Commercial
                  </Button>
                  <Button variant="primary" size="sm" className="w-full">
                    Small Primary
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-xs">Forest Luxury</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Button variant="forest" size="md" className="w-full" leftIcon={<Film className="h-4 w-4" />}>
                    Render Master Ad
                  </Button>
                  <Button variant="forest" size="sm" className="w-full">
                    Small Forest
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-xs">Secondary & Outline</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Button variant="secondary" size="md" className="w-full" leftIcon={<Sliders className="h-4 w-4" />}>
                    Configure Camera
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Outline Action
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-xs">Dynamic Loading State</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={buttonLoading}
                    onClick={simulateAction}
                  >
                    Click to Test Spinner
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full">
                    Delete Scene
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Status Badges & Semantic Colors */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                3. Status Badges & Semantics
              </h2>
            </div>

            <div className="flex flex-wrap gap-3 items-center p-5 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <Badge variant="lime" dot>
                Acid Lime Active
              </Badge>
              <Badge variant="forest" dot>
                Brand Forest
              </Badge>
              <Badge variant="success" dot>
                Render Completed (100%)
              </Badge>
              <Badge variant="warning" dot>
                Evaluating Consistency (7.5/10)
              </Badge>
              <Badge variant="destructive" dot>
                Generation Failed
              </Badge>
              <Badge variant="info" dot>
                Processing 9:16 Video
              </Badge>
              <Badge variant="default">
                Draft Storyboard
              </Badge>
              <Badge variant="outline">
                Version 002
              </Badge>
            </div>
          </section>

          {/* Section: Form Controls & Inputs */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                4. Form Controls & Floating Labels
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Input & Tooltip Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label required>Campaign Brand Name</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-[var(--brand-lime)] cursor-pointer hover:underline">
                            What is this?
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Used to bind colors, typography, and brand lockups into Creative Bible.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input placeholder="e.g. Bawarchi Firewood Biryani" defaultValue="Lucid Air Motors" />
                  </div>

                  <div>
                    <Label>Visual Shot Prompt</Label>
                    <Textarea
                      placeholder="Describe camera movement, lighting, subject action..."
                      defaultValue="35mm Anamorphic close-up of steaming saffron basmati handi with clay pot seal crackling."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Toggles, Menus & Dialogs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    <Switch
                      checked={proMode}
                      onCheckedChange={setProMode}
                      label="Pro Creator Mode"
                      description="Toggle between direct timeline control deck and guided AI discovery interview"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Modal Dialog Trigger */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" leftIcon={<Maximize2 className="h-3.5 w-3.5" />}>
                          Open Scene Modal
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Scene 03 Specification</DialogTitle>
                          <DialogDescription>
                            Review the compiled prompt tokens, camera optics, and audio ducking levels.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-2 space-y-2 text-xs text-[var(--text-secondary)]">
                          <p>• Resolution: 1080x1920 (9:16 Vertical)</p>
                          <p>• Framerate: 30 FPS H.264</p>
                          <p>• Audio Ducking: -12dB when narration is active</p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>
                            Save Settings
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Context Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" rightIcon={<MoreVertical className="h-3.5 w-3.5" />}>
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Scene Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => alert('Regenerating Scene...')}>
                          <Wand2 className="h-3.5 w-3.5 mr-2 text-[var(--brand-lime)]" />
                          Regenerate (V2)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert('Copied Prompt!')}>
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          Copy Prompt Spec
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[var(--color-destructive)]">
                          Delete Shot
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Tabs & Shimmer Skeleton Loading */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                5. Workspace Tabs & Skeleton Loaders
              </h2>
            </div>

            <Tabs defaultValue="storyboard">
              <TabsList>
                <TabsTrigger value="brief">Brief & Strategy</TabsTrigger>
                <TabsTrigger value="storyboard">Storyboard (5 Shots)</TabsTrigger>
                <TabsTrigger value="timeline">Multi-Track Timeline</TabsTrigger>
                <TabsTrigger value="render">Master Export</TabsTrigger>
              </TabsList>

              <TabsContent value="storyboard" className="pt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((num) => (
                    <Card key={num} className="overflow-hidden">
                      <div className="h-32 bg-[var(--bg-surface-sunken)] border-b border-[var(--border-subtle)] relative flex items-center justify-center">
                        <span className="text-[11px] font-mono-code text-[var(--text-muted)]">
                          [ Shot {num} Asset Canvas ]
                        </span>
                        <Badge variant="lime" size="sm" className="absolute top-2 right-2">
                          V1 Approved
                        </Badge>
                      </div>
                      <CardContent className="p-3.5 space-y-1.5">
                        <div className="text-xs font-semibold text-[var(--text-primary)]">
                          Shot 0{num} • Camera Orbit & Steam Pour
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                          35mm macro shot with golden rim lighting and Kodachrome LUT grading.
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="brief" className="pt-3">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}
