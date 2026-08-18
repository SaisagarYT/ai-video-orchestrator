import type { CameraMotionSpec, CameraMovementType } from '../types/creativeSpec';
import { Card, CardHeader, CardTitle, CardContent, Label } from '../../../components/ui';
import { Activity, Play, Gauge } from 'lucide-react';

interface MotionDynamicsControlsProps {
  motion: CameraMotionSpec;
  onChange: (updates: Partial<CameraMotionSpec>) => void;
}

const MOVEMENTS: { id: CameraMovementType; label: string; desc: string }[] = [
  { id: 'dolly_in', label: 'Push-In Dolly', desc: 'Smooth forward zoom driving emotional intimacy' },
  { id: 'orbit_arc_360', label: '360° Orbit Arc', desc: 'Curved rotation showcasing 3D product silhouette' },
  { id: 'steadicam_tracking', label: 'Steadicam Tracking', desc: 'Dynamic following shot with fluid organic stabilization' },
  { id: 'crane_pedestal', label: 'Vertical Crane Rise', desc: 'Cinematic upward boom revealing scale and atmosphere' },
  { id: 'dolly_zoom_vertigo', label: 'Vertigo Dolly Zoom', desc: 'Background distortion creating dramatic perceptual shift' },
  { id: 'slow_motion_120fps', label: '120 FPS High-Speed', desc: 'Ultra-slow motion freezing droplets, steam and motion' },
  { id: 'handheld_organic', label: 'Organic Handheld', desc: 'Subtle realistic camera shake adding authentic urgency' },
  { id: 'static_lockoff', label: 'Locked-Off Tripod', desc: 'Rock-solid stillness letting subject motion take focus' },
];

export function MotionDynamicsControls({ motion, onChange }: MotionDynamicsControlsProps) {
  return (
    <Card className="border-[var(--border-default)] font-app">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--brand-lime)]" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            2. Camera Motion & Dynamic Speed
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Movement Type Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MOVEMENTS.map((mov) => (
            <button
              key={mov.id}
              type="button"
              onClick={() => onChange({ movementType: mov.id })}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                motion.movementType === mov.id
                  ? 'bg-[var(--brand-lime-muted)] border-[var(--brand-lime)] text-[var(--text-primary)] font-bold shadow-xs'
                  : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <div className="text-xs font-semibold">{mov.label}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                {mov.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Speed & Frame Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
          <div>
            <Label className="text-[11px] flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              <span>Camera Speed</span>
            </Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {[
                { id: 'slow_pan', label: 'Slow & Deliberate' },
                { id: 'smooth_cinematic', label: 'Smooth Cinematic' },
                { id: 'high_speed_dynamic', label: 'High-Speed Punchy' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange({ speed: s.id as CameraMotionSpec['speed'] })}
                  className={`py-1.5 px-1 rounded border text-center text-[10px] font-medium transition-colors cursor-pointer ${
                    motion.speed === s.id
                      ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)]'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[11px] flex items-center gap-1">
              <Play className="h-3 w-3" />
              <span>Master Frame Rate</span>
            </Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {[
                { id: '24fps_cinema', label: '24 FPS' },
                { id: '30fps_broadcast', label: '30 FPS' },
                { id: '60fps_fluid', label: '60 FPS' },
                { id: '120fps_slowmo', label: '120 FPS' },
              ].map((fps) => (
                <button
                  key={fps.id}
                  type="button"
                  onClick={() => onChange({ frameRate: fps.id as CameraMotionSpec['frameRate'] })}
                  className={`py-1.5 rounded border text-center font-mono-code text-[11px] font-medium transition-colors cursor-pointer ${
                    motion.frameRate === fps.id
                      ? 'bg-[var(--brand-lime)] text-[#161616] font-bold border-[var(--brand-lime)]'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {fps.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
