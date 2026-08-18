import type { LightingColorSpec, LightingLutPreset } from '../types/creativeSpec';
import { Card, CardHeader, CardTitle, CardContent, Label } from '../../../components/ui';
import { Sun, Palette, Sparkles } from 'lucide-react';

interface LightingPaletteControlsProps {
  lighting: LightingColorSpec;
  onChange: (updates: Partial<LightingColorSpec>) => void;
}

const LUT_PRESETS: { id: LightingLutPreset; label: string; mood: string; color: string }[] = [
  { id: 'kodak_vision3_5219', label: 'Kodak 5219 Vision3', mood: 'Warm organic 35mm film tones with rich gold highlights', color: '#D4AF37' },
  { id: 'arri_master_commercial', label: 'Arri Master Commercial', mood: 'Clean, crisp, true-to-life studio product grade', color: '#4DABF7' },
  { id: 'golden_hour_sunset', label: 'Golden Hour Sunset', mood: 'Low-angle amber rim glow and warm lens flare', color: '#FFA94D' },
  { id: 'blade_runner_neon_amber', label: 'Cyberpunk Neon Amber', mood: 'Deep moody contrast with high-saturation neon rims', color: '#FF6B6B' },
  { id: 'studio_high_key', label: 'Studio High-Key Softbox', mood: 'Ultra-bright, shadowless, immaculate luxury look', color: '#F1F3F5' },
  { id: 'moody_rembrandt_noir', label: 'Rembrandt Moody Noir', mood: 'Dramatic single-source shadows and chiaroscuro depth', color: '#868E96' },
  { id: 'clean_tech_monochrome', label: 'Clean Tech Slate', mood: 'Cool desaturated metallic look for hardware & EV', color: '#748FFC' },
];

export function LightingPaletteControls({ lighting, onChange }: LightingPaletteControlsProps) {
  return (
    <Card className="border-[var(--border-default)] font-app">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-[var(--brand-lime)]" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            3. Lighting Atmosphere & Color Grading LUT
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* 7 Color LUT Presets */}
        <div>
          <Label className="text-[11px] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[var(--brand-lime)]" />
            <span>Cinematographic Color Grading LUT</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1.5">
            {LUT_PRESETS.map((lut) => (
              <button
                key={lut.id}
                type="button"
                onClick={() => onChange({ lutPreset: lut.id })}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  lighting.lutPreset === lut.id
                    ? 'bg-[var(--brand-lime-muted)] border-[var(--brand-lime)] text-[var(--text-primary)] font-bold shadow-xs'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0 border border-white/20 shadow-xs"
                    style={{ backgroundColor: lut.color }}
                  />
                  <div className="text-xs font-semibold">{lut.label}</div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-1">
                  {lut.mood}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Temp & Key Lighting Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
          <div>
            <Label className="text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sun className="h-3 w-3" />
                <span>Color Temperature</span>
              </span>
              <span className="font-mono-code text-[11px] text-[var(--brand-lime)]">
                {lighting.colorTemperature}K
              </span>
            </Label>
            <input
              type="range"
              min="2800"
              max="7500"
              step="100"
              value={lighting.colorTemperature}
              onChange={(e) => onChange({ colorTemperature: Number(e.target.value) })}
              className="w-full mt-2 accent-[var(--brand-lime)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono-code mt-1">
              <span>Warm 2800K</span>
              <span>Daylight 5600K</span>
              <span>Cool 7500K</span>
            </div>
          </div>

          <div>
            <Label className="text-[11px]">Key Lighting Setup</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {[
                { id: 'warm_hearth', label: 'Warm Hearth' },
                { id: 'natural_sunlight', label: 'Natural Sun' },
                { id: 'soft_diffused_box', label: 'Softbox Box' },
              ].map((key) => (
                <button
                  key={key.id}
                  type="button"
                  onClick={() => onChange({ keyLighting: key.id as LightingColorSpec['keyLighting'] })}
                  className={`py-1.5 px-1 rounded border text-center text-[10px] font-medium transition-colors cursor-pointer ${
                    lighting.keyLighting === key.id
                      ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)]'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {key.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
