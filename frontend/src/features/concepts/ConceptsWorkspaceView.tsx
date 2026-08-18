import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { MediaPickerModal } from '../../components/ui/MediaPickerModal';
import { Button } from '../../components/ui';
import {
  Upload,
  Film,
  Play,
  Pause,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CreativeConcept {
  id: string;
  campaign_id: string;
  title: string;
  angle_type: string;
  hook: string;
  visual_style: string;
  narrative_arc: string;
  target_emotion: string;
  is_selected: boolean;
}

interface StrategyResponse {
  strategy: any;
  concepts: CreativeConcept[];
}

const PRESET_OPTIONS = [
  { id: 'tracking', name: 'TRACKING SHOT', style: 'Dynamic Camera Pan', model: 'Seedance 2.5' },
  { id: 'minimalism', name: 'MINIMALISM CORPORATE', style: 'Crisp Studio Lighting', model: 'Seedance 2.5' },
  { id: 'neon', name: 'NEON CYBERPUNK', style: 'Volumetric Midnight Glow', model: 'Kling 3.0 Ultra' },
  { id: 'macro', name: 'MACRO SENSORY', style: '100mm Extreme Detail', model: 'Gemini Omni Flash' },
];

export function ConceptsWorkspaceView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaignName, setCampaignName] = useState<string>('Creative Concepts');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'motion'>('create');
  const [selectedPreset, setSelectedPreset] = useState<string>('tracking');
  const [promptText, setPromptText] = useState<string>('Describe the commercial angle and visual transformation you want to achieve...');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState<boolean>(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const [isLocking, setIsLocking] = useState<boolean>(false);

  const fetchConcepts = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const campRes = await api.get(`/campaigns/${campaignId}`);
      if (campRes.data) setCampaignName(campRes.data.name);

      const res = await api.get<StrategyResponse>(`/campaigns/${campaignId}/strategy`);
      if (res.data?.concepts && res.data.concepts.length > 0) {
        setPromptText(res.data.concepts[0].hook || res.data.concepts[0].title);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  const handleLockConcept = async () => {
    setIsLocking(true);
    try {
      navigate(`/campaigns/${campaignId}/storyboard`);
    } catch {
      // Handle error
    } finally {
      setIsLocking(false);
    }
  };

  const activePresetObj = PRESET_OPTIONS.find((p) => p.id === selectedPreset) || PRESET_OPTIONS[0];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#060606]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060606] font-app text-white select-none">
      {/* Studio Header */}
      <CampaignHeader
        campaignName={campaignName}
        status="strategy_generated"
        metadata="Stage 3: 1-Click Creative Concept & Preset Studio"
        breadcrumbs={[
          { label: 'Workspace', onClick: () => navigate('/campaigns') },
          { label: campaignName, onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
          { label: 'Concepts & Presets', isCurrent: true },
        ]}
      />

      <CampaignNavTabs
        activeSection="concepts"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* Main Studio Body (Matches Screenshot 5) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Creation Inspector (from Screenshot 5) */}
        <aside className="w-80 sm:w-88 shrink-0 border-r border-[#1C1C1C] bg-[#0A0A0A] flex flex-col justify-between overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            {/* Top Sub-tabs (Create Video / Edit Video / Motion Control) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-[#222222]">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'create' ? 'bg-[#1C1C1C] text-white shadow-sm' : 'text-[#777] hover:text-white'
                }`}
              >
                Create Video
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'edit' ? 'bg-[#1C1C1C] text-white shadow-sm' : 'text-[#777] hover:text-white'
                }`}
              >
                Edit Video
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('motion')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'motion' ? 'bg-[#1C1C1C] text-white shadow-sm' : 'text-[#777] hover:text-white'
                }`}
              >
                Motion Control
              </button>
            </div>

            {/* Active Preset Banner */}
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#242424] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#E7FE25] uppercase tracking-wider block">
                  GENERAL
                </span>
                <span className="text-xs font-bold text-white">{activePresetObj.name}</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Preset selector active')}
                className="px-2.5 py-1 rounded-lg bg-[#202020] text-[11px] font-semibold text-white hover:bg-[#2A2A2A] cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Mode Switcher (References vs Extend Video) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-1.5 rounded-xl bg-[#1C1C1C] border border-[#333] text-xs font-bold text-white text-center"
              >
                References
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 rounded-xl bg-[#121212] border border-[#202020] text-xs font-semibold text-[#777] hover:text-white text-center"
              >
                Extend Video
              </button>
            </div>

            {/* Reference Upload Box (triggers MediaPickerModal) */}
            <div
              onClick={() => setMediaPickerOpen(true)}
              className="p-5 rounded-2xl border-2 border-dashed border-[#262626] hover:border-[#E7FE25]/50 bg-[#121212] flex flex-col items-center justify-center text-center space-y-1.5 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 text-[#E7FE25]" />
              <span className="text-xs font-bold text-white">Add references</span>
              <span className="text-[10px] text-[#666]">Image, Video or Audio</span>
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#777]">
                Prompt
              </label>
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe the visual change you want..."
                className="w-full p-3 rounded-xl bg-[#141414] border border-[#242424] text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#E7FE25] resize-none"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setPromptText((prev) => `${prev} @Elements[ProductFocus]`)}
                  className="px-2 py-0.5 rounded-md bg-[#1C1C1C] text-[11px] font-semibold text-[#AAA] hover:text-white cursor-pointer"
                >
                  @ Elements
                </button>
                <button
                  type="button"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="flex items-center gap-1 text-[11px] text-[#888] hover:text-white cursor-pointer"
                >
                  {audioEnabled ? <Volume2 className="h-3 w-3 text-[#E7FE25]" /> : <VolumeX className="h-3 w-3" />}
                  <span>Audio {audioEnabled ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>

            {/* Model & Parameter Badges */}
            <div className="space-y-2 pt-1 border-t border-[#1C1C1C]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#141414] border border-[#222]">
                <span className="text-xs text-[#888]">Model</span>
                <span className="text-xs font-bold text-white">{activePresetObj.model} ⚡</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#141414] border border-[#222] font-semibold">5s</div>
                <div className="p-2 rounded-lg bg-[#141414] border border-[#222] font-semibold">16:9</div>
                <div className="p-2 rounded-lg bg-[#141414] border border-[#222] font-semibold">1080p</div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Generate Button (from Screenshot 5) */}
          <div className="pt-3 border-t border-[#1C1C1C]">
            <Button
              variant="primary"
              size="lg"
              onClick={handleLockConcept}
              isLoading={isLocking}
              className="w-full font-black text-sm py-3 bg-[#E7FE25] hover:bg-[#D5EC1E] text-black shadow-xl"
            >
              Generate ⚡
            </Button>
          </div>
        </aside>

        {/* Center Canvas: "MAKE VIDEOS IN ONE CLICK" (from Screenshot 5) */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-[#060606]">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
                MAKE VIDEOS IN ONE CLICK
              </h2>
              <p className="text-xs sm:text-sm text-[#888] max-w-xl">
                250+ presets for camera control, framing, and high-quality VFX — or use the general preset for manual control.
              </p>
            </div>

            {/* 3 Interactive Cards (from Screenshot 5) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* Card 1: ADD IMAGE */}
              <div className="p-6 rounded-3xl bg-[#0E0E0E] border border-[#202020] space-y-4 flex flex-col justify-between shadow-xl">
                <div className="space-y-3">
                  <div
                    onClick={() => setMediaPickerOpen(true)}
                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#2A2A2A] hover:border-[#E7FE25]/50 bg-[#141414] flex flex-col items-center justify-center text-center p-4 space-y-2 cursor-pointer transition-colors"
                  >
                    <Upload className="h-8 w-8 text-[#E7FE25]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">UPLOAD IMAGE</span>
                    <span className="text-[10px] text-[#666]">or Paste from Clipboard</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">ADD IMAGE</h4>
                    <p className="text-xs text-[#888] mt-1">
                      Upload or generate an image to start your animation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: CHOOSE PRESET (Yellow Border highlight from Screenshot 5) */}
              <div className="p-6 rounded-3xl bg-[#0E0E0E] border-2 border-[#E7FE25] space-y-4 flex flex-col justify-between shadow-2xl relative">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#E7FE25] text-black text-[10px] font-black uppercase tracking-wider">
                  Active
                </div>

                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-2xl bg-[#141414] border border-[#2A2A2A] p-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-[#E7FE25] uppercase">
                      Preset: {activePresetObj.name}
                    </span>
                    <div className="text-center py-4">
                      <Film className="h-8 w-8 text-white/50 mx-auto mb-1" />
                      <span className="text-xs font-bold text-white">{activePresetObj.style}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">CHOOSE PRESET</h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_OPTIONS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPreset(p.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            selectedPreset === p.id ? 'bg-[#E7FE25] text-black' : 'bg-[#181818] text-[#888] hover:text-white'
                          }`}
                        >
                          {p.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: GET VIDEO */}
              <div className="p-6 rounded-3xl bg-[#0E0E0E] border border-[#202020] space-y-4 flex flex-col justify-between shadow-xl">
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-[#025745] to-[#013F32] border border-emerald-500/30 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                      className="h-12 w-12 rounded-full bg-[#E7FE25] hover:bg-[#D5EC1E] text-black flex items-center justify-center shadow-xl cursor-pointer transition-transform hover:scale-105"
                    >
                      {isPlayingDemo ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                    </button>
                    <span className="absolute bottom-2 text-[10px] text-emerald-200 font-mono">
                      4K • 60 FPS Result
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">GET VIDEO</h4>
                    <p className="text-xs text-[#888] mt-1">
                      Click generate to create your final animated video!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lock & Advance Button */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E]">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Approved Concept: {activePresetObj.name}</h4>
                <p className="text-[11px] text-[#777]">
                  Advance with the selected preset into multi-shot scene storyboard decomposition.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleLockConcept}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="font-bold px-6 shadow-md"
              >
                Proceed to Storyboard
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelectMedia={() => {
          setPromptText((prev) => `${prev} [Attached Reference Image]`);
        }}
      />
    </div>
  );
}
