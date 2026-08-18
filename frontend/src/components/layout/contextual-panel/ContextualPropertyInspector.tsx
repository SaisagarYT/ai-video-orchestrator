import {
  X,
  Sliders,
  Sparkles,
  Clock,
  Film,
  Compass,
} from 'lucide-react';
import { Button, Badge } from '../../ui';

export type InspectorEntityType = 'campaign' | 'concept' | 'scene' | 'asset' | 'timeline_clip' | null;

export interface ContextualPropertyInspectorProps {
  entityType: InspectorEntityType;
  data: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProperty?: (key: string, value: any) => void;
  onExecuteAction?: (actionName: string, payload?: any) => void;
  className?: string;
}

export function ContextualPropertyInspector({
  entityType,
  data,
  isOpen,
  onClose,
  onUpdateProperty,
  onExecuteAction,
  className = '',
}: ContextualPropertyInspectorProps) {
  if (!isOpen || !entityType || !data) {
    return null;
  }

  return (
    <aside
      className={`w-80 sm:w-88 shrink-0 border-l border-[#1C1C1C] bg-[#0A0A0A] flex flex-col h-full z-20 select-none overflow-hidden ${className}`}
    >
      {/* Inspector Top Header */}
      <div className="h-13 px-4 border-b border-[#1C1C1C] flex items-center justify-between bg-[#0E0E0E]">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#E7FE25]" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Inspector: {entityType.replace('_', ' ')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[#777] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-[#CCCCCC]">
        {/* ENTITY: CAMPAIGN */}
        {entityType === 'campaign' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Campaign Name</label>
              <input
                type="text"
                value={data.name || ''}
                onChange={(e) => onUpdateProperty?.('name', e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg bg-[#141414] border border-[#242424] text-xs text-white focus:outline-none focus:border-[#E7FE25]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Target Product</label>
              <p className="p-2 rounded bg-[#121212] border border-[#202020] text-white font-medium">
                {data.product_name || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Objective</label>
              <Badge variant="outline" size="sm" className="bg-[#141414] text-[#E7FE25] border-[#2A2A2A]">
                {data.objective || 'Conversions'}
              </Badge>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Target Aspect Ratio</label>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#161616] text-white text-[11px]">
                <Film className="h-3 w-3 text-[#888]" />
                {data.target_platforms || '16:9 Landscape'}
              </span>
            </div>
          </div>
        )}

        {/* ENTITY: CONCEPT */}
        {entityType === 'concept' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#888]">Concept Name</label>
                <Badge variant="lime" size="sm">
                  Hook Score: {data.hook_score ? `${data.hook_score}/10` : '9.2/10'}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-white">{data.title || data.concept_name || 'Concept'}</h4>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Core Angle & Hook</label>
              <p className="p-2.5 rounded-lg bg-[#121212] border border-[#202020] text-xs text-[#DDD] leading-relaxed">
                {data.hook_angle || data.core_hook || 'High-velocity transformation with sensory focus.'}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Target Emotion</label>
              <div className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-[#E7FE25]" />
                <span className="text-white font-medium">{data.emotional_arc || 'Aspiration & Desire'}</span>
              </div>
            </div>

            {onExecuteAction && (
              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold mt-2"
                onClick={() => onExecuteAction('select_concept', data)}
              >
                Lock This Concept
              </Button>
            )}
          </div>
        )}

        {/* ENTITY: STORYBOARD SCENE */}
        {entityType === 'scene' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Scene {data.sequence_number || 1}</span>
              <Badge variant="outline" size="sm" className="text-[#E7FE25] border-[#333]">
                <Clock className="h-3 w-3 mr-1" />
                {data.duration_seconds || 4.0}s
              </Badge>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Shot Type & Camera</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-[#141414] border border-[#222]">
                  <span className="text-[10px] text-[#666] block">Shot</span>
                  <span className="text-xs font-semibold text-white">{data.shot_type || 'Close-up'}</span>
                </div>
                <div className="p-2 rounded bg-[#141414] border border-[#222]">
                  <span className="text-[10px] text-[#666] block">Motion</span>
                  <span className="text-xs font-semibold text-white">{data.camera_movement || 'Dynamic Orbit'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Visual Prompt</label>
              <textarea
                rows={3}
                value={data.visual_prompt || ''}
                onChange={(e) => onUpdateProperty?.('visual_prompt', e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#141414] border border-[#242424] text-xs text-white focus:outline-none focus:border-[#E7FE25] leading-relaxed resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Audio Narration</label>
              <textarea
                rows={2}
                value={data.audio_narration || ''}
                onChange={(e) => onUpdateProperty?.('audio_narration', e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#141414] border border-[#242424] text-xs text-white focus:outline-none focus:border-[#E7FE25] leading-relaxed resize-none"
              />
            </div>

            {onExecuteAction && (
              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold mt-2"
                onClick={() => onExecuteAction('generate_scene', data)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate Scene
              </Button>
            )}
          </div>
        )}

        {/* ENTITY: ASSET */}
        {entityType === 'asset' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Asset ID</label>
              <p className="font-mono text-[10px] text-[#777] truncate">{data.id}</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Status</label>
              <Badge variant={data.status === 'completed' ? 'success' : 'warning'} size="sm">
                {data.status || 'Ready'}
              </Badge>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Resolution & Codec</label>
              <p className="p-2 rounded bg-[#121212] border border-[#202020] text-white">
                1920x1080 (ProRes 422 HQ / H.264)
              </p>
            </div>
          </div>
        )}

        {/* ENTITY: TIMELINE CLIP */}
        {entityType === 'timeline_clip' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#888] mb-1">Track & Clip</label>
              <p className="font-semibold text-white text-xs">{data.name || 'Video Track Clip'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#888] mb-1">Start Trim</label>
                <input
                  type="text"
                  value={data.start_time || '00:00.00'}
                  className="w-full h-8 px-2 rounded bg-[#141414] border border-[#242424] text-xs text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#888] mb-1">End Trim</label>
                <input
                  type="text"
                  value={data.end_time || '00:04.50'}
                  className="w-full h-8 px-2 rounded bg-[#141414] border border-[#242424] text-xs text-white"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-[#888] mb-1">Volume Ducking</label>
              <input type="range" min="0" max="100" defaultValue="85" className="w-full accent-[#E7FE25]" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
