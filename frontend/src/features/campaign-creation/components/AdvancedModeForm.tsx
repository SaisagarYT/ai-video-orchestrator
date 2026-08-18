import type { AdvancedFormData } from '../types';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';
import { Sliders, Sparkles, ArrowRight, Monitor, Smartphone, Square } from 'lucide-react';

interface AdvancedModeFormProps {
  data: AdvancedFormData;
  onChange: (field: keyof AdvancedFormData, value: unknown) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string | null;
}

export function AdvancedModeForm({
  data,
  onChange,
  onSubmit,
  isLoading,
  error,
}: AdvancedModeFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 font-app py-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[var(--brand-lime)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Advanced Studio Specification Mode
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Configure granular camera optics, lighting LUTs, and advertising directives manually.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core Campaign Directives */}
        <Card className="border-[var(--border-default)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              1. Campaign & Product Directives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div>
              <Label>Campaign Title</Label>
              <Input
                value={data.campaignName}
                onChange={(e) => onChange('campaignName', e.target.value)}
                required
                placeholder="e.g. Lucid Air Velocity Launch"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label>Product Name</Label>
              <Input
                value={data.productName}
                onChange={(e) => onChange('productName', e.target.value)}
                required
                placeholder="e.g. Lucid Air Sapphire"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label>Industry</Label>
              <Input
                value={data.industry}
                onChange={(e) => onChange('industry', e.target.value)}
                required
                placeholder="e.g. Automotive & Luxury Tech"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label>Product Description</Label>
              <textarea
                value={data.productDescription}
                onChange={(e) => onChange('productDescription', e.target.value)}
                rows={3}
                required
                placeholder="Describe key visual and sensory selling points"
                className="w-full mt-1 p-2.5 rounded-lg bg-[var(--bg-surface-sunken)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-lime)] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Marketing Objective & Call To Action */}
        <Card className="border-[var(--border-default)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              2. Strategy & Target Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div>
              <Label>Primary Campaign Objective</Label>
              <Input
                value={data.objective}
                onChange={(e) => onChange('objective', e.target.value)}
                required
                placeholder="e.g. Drive test drive bookings and pre-orders"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label>Target Audience Demographic</Label>
              <Input
                value={data.targetAudience}
                onChange={(e) => onChange('targetAudience', e.target.value)}
                required
                placeholder="e.g. Luxury EV buyers, tech enthusiasts, executives"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label>Call to Action (CTA)</Label>
              <Input
                value={data.callToAction}
                onChange={(e) => onChange('callToAction', e.target.value)}
                required
                placeholder="e.g. Book Your Test Drive Today"
                className="mt-1 h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cinematography & Rendering Specs */}
        <Card className="border-[var(--border-default)] md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              3. Cinematography, Lens & Camera Motion Directives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Aspect Ratio</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: '16:9', label: '16:9 Desktop', icon: <Monitor className="h-3 w-3" /> },
                    { id: '9:16', label: '9:16 Mobile', icon: <Smartphone className="h-3 w-3" /> },
                    { id: '1:1', label: '1:1 Square', icon: <Square className="h-3 w-3" /> },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => onChange('aspectRatio', fmt.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        data.aspectRatio === fmt.id
                          ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)] shadow-xs'
                          : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                      }`}
                    >
                      {fmt.icon}
                      <span>{fmt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Target Duration</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[15, 30, 60].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => onChange('durationSeconds', dur)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-colors cursor-pointer ${
                        data.durationSeconds === dur
                          ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)] shadow-xs'
                          : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                      }`}
                    >
                      {dur}s Commercial
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Visual Style & Color Grading LUT</Label>
                <Input
                  value={data.visualStyle}
                  onChange={(e) => onChange('visualStyle', e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label>Camera Movement & Lens Cues</Label>
                <Input
                  value={data.cameraMovement}
                  onChange={(e) => onChange('cameraMovement', e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          leftIcon={<Sparkles className="h-4 w-4" />}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="font-bold shadow-[0_0_20px_rgba(231,254,37,0.3)]"
        >
          Create Pro Campaign Workspace
        </Button>
      </div>
    </form>
  );
}
