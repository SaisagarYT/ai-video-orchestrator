import { useState } from 'react';
import type { SceneDetailData, FinalVideoData } from '../types/workspace';
import { Badge } from '../../../components/ui';
import {
  Play,
  Monitor,
  Smartphone,
  Square,
  Clock,
} from 'lucide-react';

interface SceneGridPreviewProps {
  scenes: SceneDetailData[];
  finalVideos: FinalVideoData[];
  campaignAspectRatio?: string;
}

export function SceneGridPreview({
  scenes,
  finalVideos,
  campaignAspectRatio = '16:9',
}: SceneGridPreviewProps) {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(
    campaignAspectRatio === '9:16' ? '9:16' : campaignAspectRatio === '1:1' ? '1:1' : '16:9'
  );

  const activeVideo = finalVideos.length > 0 ? finalVideos[0] : null;

  return (
    <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-5 font-app shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
            Commercial Video Stage & Scene Timeline
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Multi-track timeline with camera optics, voiceover audio ducking, and master render canvas.
          </p>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 rounded-lg border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              aspectRatio === '16:9'
                ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>16:9 Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              aspectRatio === '9:16'
                ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>9:16 Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('1:1')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              aspectRatio === '1:1'
                ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Square className="h-3.5 w-3.5" />
            <span>1:1 Feed</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Cinema Canvas + Scene List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Monitor Screen */}
        <div className="lg:col-span-5 p-5 rounded-[var(--radius-lg)] bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)] flex flex-col items-center justify-between min-h-[380px]">
          <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-[var(--border-subtle)]">
            <span className="font-mono-code text-[11px] text-[var(--brand-lime)]">
              REC • {aspectRatio === '16:9' ? '1920x1080' : aspectRatio === '9:16' ? '1080x1920' : '1080x1080'}
            </span>
            <Badge variant={activeVideo ? 'success' : 'lime'} size="sm">
              {activeVideo ? 'Master MP4 Ready' : 'Live Timeline'}
            </Badge>
          </div>

          {/* Dynamic Video Frame */}
          <div className="my-auto py-4 flex items-center justify-center w-full">
            <div
              className={`rounded-2xl bg-gradient-to-br from-[#013F32] via-[#022A22] to-[#041410] border-2 border-[var(--brand-lime)]/40 shadow-2xl flex flex-col justify-between p-4 relative overflow-hidden transition-all duration-300 ${
                aspectRatio === '16:9'
                  ? 'w-full max-w-[340px] h-[190px]'
                  : aspectRatio === '9:16'
                  ? 'w-[180px] h-[320px]'
                  : 'w-[230px] h-[230px]'
              }`}
            >
              <div className="flex justify-between items-center text-[9px] font-mono-code text-white/80">
                <span>30 FPS Cinema</span>
                <span>Ken Burns Motion</span>
              </div>

              <div className="text-center space-y-1 my-auto">
                <div className="h-10 w-10 rounded-full bg-[var(--brand-lime)] text-[#161616] flex items-center justify-center mx-auto shadow-md">
                  <Play className="h-4 w-4 ml-0.5 fill-current" />
                </div>
                <div className="text-xs font-bold text-white">Commercial Preview</div>
                <div className="text-[10px] text-white/70">
                  {scenes.length} Scenes Compiled
                </div>
              </div>

              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-[var(--brand-lime)] shadow-[0_0_8px_#E7FE25]" />
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
            <span>Audio: Synchronized Voiceover</span>
            <span className="font-mono-code text-[var(--brand-lime)]">
              {scenes.reduce((acc, s) => acc + (s.duration_seconds || 4), 0)}s Duration
            </span>
          </div>
        </div>

        {/* Right: Scene List Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Shot Breakdown ({scenes.length} Scenes)
            </h4>
            <span className="text-[11px] text-[var(--text-muted)] font-mono-code">
              Sequence Order
            </span>
          </div>

          {scenes.length === 0 ? (
            <div className="p-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] text-center space-y-2">
              <Clock className="h-6 w-6 text-[var(--text-muted)] mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">
                No scenes assembled yet. Generate or add scenes in the Storyboard workspace.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--brand-lime)]/40 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand-lime-muted)] text-[var(--brand-lime)] font-mono-code text-xs font-bold flex items-center justify-center shrink-0">
                      0{scene.sequence_number || 1}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[var(--text-primary)]">
                          {scene.shot_type || 'Medium Shot'}
                        </span>
                        <Badge variant="outline" size="sm">
                          {scene.camera_movement || 'Dolly-In'}
                        </Badge>
                        {scene.assets && scene.assets.length > 0 ? (
                          <Badge variant="success" size="sm">
                            Asset V{scene.assets[0].version_number} Ready
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Pending Render
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                        {scene.visual_prompt}
                      </p>

                      {scene.audio_narration && (
                        <p className="text-[11px] italic text-[var(--text-secondary)]">
                          VO: "{scene.audio_narration}"
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="font-mono-code text-xs font-semibold text-[var(--text-muted)] shrink-0">
                    {scene.duration_seconds}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
