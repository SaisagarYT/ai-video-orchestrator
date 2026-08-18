import type { CameraOpticsSpec, ShotType, LensFocalLength } from '../types/creativeSpec';
import { Card, CardHeader, CardTitle, CardContent, Label } from '../../../components/ui';
import { Camera, Eye, Focus } from 'lucide-react';

interface CameraOpticsControlsProps {
  camera: CameraOpticsSpec;
  onChange: (updates: Partial<CameraOpticsSpec>) => void;
}

const SHOT_TYPES: { id: ShotType; label: string; desc: string }[] = [
  { id: 'extreme_macro', label: 'Extreme Macro', desc: 'Microscopic texture, sizzling bubbles & fine details' },
  { id: 'close_up', label: 'Cinematic Close-Up', desc: 'Hero product focus with blurred background' },
  { id: 'medium_shot', label: 'Medium Studio Shot', desc: 'Balanced subject & environmental framing' },
  { id: 'wide_establishing', label: 'Wide Establishing', desc: 'Grand scale & spatial context' },
  { id: 'low_angle_hero', label: 'Low-Angle Hero', desc: 'Powerful, imposing & premium perspective' },
  { id: 'overhead_drone', label: 'Overhead Flat-Lay', desc: 'Top-down geometric table composition' },
];

const LENS_FOCAL_LENGTHS: { id: LensFocalLength; label: string; mm: string }[] = [
  { id: '18mm_ultra_wide', label: '18mm Ultra-Wide', mm: '18mm' },
  { id: '24mm_wide_angle', label: '24mm Wide Angle', mm: '24mm' },
  { id: '35mm_anamorphic', label: '35mm Anamorphic Prime', mm: '35mm' },
  { id: '50mm_standard_prime', label: '50mm Standard Prime', mm: '50mm' },
  { id: '85mm_portrait', label: '85mm Cinema Portrait', mm: '85mm' },
  { id: '135mm_telephoto', label: '135mm Telephoto Compression', mm: '135mm' },
];

export function CameraOpticsControls({ camera, onChange }: CameraOpticsControlsProps) {
  return (
    <Card className="border-[var(--border-default)] font-app">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-[var(--brand-lime)]" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            1. Camera Optics & Lens Framing
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Shot Framing Grid */}
        <div>
          <Label className="text-[11px]">Shot Framing & Composition</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
            {SHOT_TYPES.map((shot) => (
              <button
                key={shot.id}
                type="button"
                onClick={() => onChange({ shotType: shot.id })}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  camera.shotType === shot.id
                    ? 'bg-[var(--brand-lime-muted)] border-[var(--brand-lime)] text-[var(--text-primary)] font-bold shadow-xs'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <div className="text-xs font-semibold">{shot.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                  {shot.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lens Focal Length */}
        <div>
          <Label className="text-[11px] flex items-center gap-1">
            <Focus className="h-3 w-3 text-[var(--brand-lime)]" />
            <span>Cinema Lens Focal Length</span>
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1.5">
            {LENS_FOCAL_LENGTHS.map((lens) => (
              <button
                key={lens.id}
                type="button"
                onClick={() => onChange({ focalLength: lens.id })}
                className={`py-2 px-1 rounded-lg border text-center transition-colors cursor-pointer ${
                  camera.focalLength === lens.id
                    ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)] shadow-xs'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <div className="font-mono-code font-bold text-xs">{lens.mm}</div>
                <div className="text-[9px] truncate">{lens.label.split(' ')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Aperture & Depth of Field */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[var(--border-subtle)]">
          <div>
            <Label className="text-[11px] flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Aperture</span>
            </Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {['f/1.2', 'f/2.0', 'f/4.0', 'f/8.0'].map((ap) => (
                <button
                  key={ap}
                  type="button"
                  onClick={() => onChange({ aperture: ap })}
                  className={`py-1.5 rounded border text-center font-mono-code text-xs transition-colors cursor-pointer ${
                    camera.aperture === ap
                      ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)]'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {ap}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[11px]">Depth of Field</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {[
                { id: 'shallow_bokeh', label: 'Shallow Bokeh' },
                { id: 'medium_cinematic', label: 'Medium Cinema' },
                { id: 'deep_focus', label: 'Deep Focus' },
              ].map((dof) => (
                <button
                  key={dof.id}
                  type="button"
                  onClick={() => onChange({ depthOfField: dof.id as CameraOpticsSpec['depthOfField'] })}
                  className={`py-1.5 px-1 rounded border text-center text-[10px] font-medium transition-colors cursor-pointer ${
                    camera.depthOfField === dof.id
                      ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)]'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {dof.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
