import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs } from '../navigation/CampaignNavTabs';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { MediaPickerModal } from '../../components/ui/MediaPickerModal';
import { Button } from '../../components/ui';
import {
  Search,
  Upload,
  Play,
  Pause,
  Download,
  RotateCcw,
  Bookmark,
  Trash2,
  ChevronDown,
  ArrowRight,
  Video,
  Image as ImageIcon,
  User,
  Zap,
} from 'lucide-react';

interface AssetData {
  id: string;
  scene_id: string;
  asset_type: string;
  storage_url: string;
  version_number: number;
  status: string;
}

interface SceneItem {
  id: string;
  sequence_number: number;
  shot_type: string;
  camera_movement: string;
  visual_prompt: string;
  audio_narration: string;
  duration_seconds: number;
  assets: AssetData[];
}

const AVAILABLE_AI_MODELS = [
  { id: 'gemini-omni', name: 'Gemini Omni Flash', badge: 'New', desc: 'Edit videos with images and prompts' },
  { id: 'seedance-2.5', name: 'Seedance 2.5', badge: 'EXCLUSIVE ACCESS', desc: '1080p 4s-30s high fidelity' },
  { id: 'seedance-2.5-edit', name: 'Seedance 2.5 Edit', badge: 'New', desc: 'Edit existing video with prompt' },
  { id: 'seedance-2.0', name: 'Seedance 2.0', badge: '4K', desc: '4K • 4s-15s Cinematic' },
  { id: 'seedance-mini', name: 'Seedance 2.0 Mini', badge: '720p', desc: '720p • 4s-15s Fast preview' },
  { id: 'seedance-fast', name: 'Seedance 2.0 Fast', badge: 'Fast', desc: '720p • 4s-15s Low latency' },
  { id: 'higgsfield-reframe', name: 'Higgsfield Reframe', badge: 'Smart', desc: 'Reframe and resize videos to any aspect ratio' },
  { id: 'kling-3.0-omni', name: 'Kling 3.0 Omni Edit', badge: 'Exclusive', desc: 'Edit videos with text prompts' },
  { id: 'kling-01', name: 'Kling 01 Video Edit', badge: 'Pro', desc: 'Generate with elements and references' },
  { id: 'kling-motion', name: 'Kling Motion Control', badge: 'Control', desc: 'Control motion with video references' },
];

export function ScenesWorkspaceView() {
  const { campaignId = '' } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [campaignName, setCampaignName] = useState<string>('Scene Generation Studio');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'motion'>('motion');
  const [selectedModel, setSelectedModel] = useState<string>('Kling 3.0 Motion Control');
  const [modelModalOpen, setModelModalOpen] = useState<boolean>(false);
  const [modelSearch, setModelSearch] = useState<string>('');
  const [mediaPickerOpen, setMediaPickerOpen] = useState<boolean>(false);
  const [sceneMode, setSceneMode] = useState<'video' | 'image'>('video');
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchScenes = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/campaigns/${campaignId}/workspace`);
      if (res.data) {
        setCampaignName(res.data.campaign?.name || 'Scene Generation Studio');
        setScenes(res.data.scenes || []);
      }
    } catch {
      setScenes([]);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  const handleGenerateScene = async (sceneId: string) => {
    setIsGenerating(true);
    try {
      await api.post(`/scenes/${sceneId}/generate`, {
        provider: selectedModel.toLowerCase(),
      });
      await fetchScenes();
    } catch {
      // Simulation or fallback
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredModels = AVAILABLE_AI_MODELS.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.desc.toLowerCase().includes(modelSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#060606]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060606] font-app text-white select-none">
      {/* Top Studio Header */}
      <CampaignHeader
        campaignName={campaignName}
        status="storyboard_ready"
        metadata="Stage 5: Multi-Modal Scene Video Generation Studio"
        breadcrumbs={[
          { label: 'Workspace', onClick: () => navigate('/campaigns') },
          { label: campaignName, onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
          { label: 'Scene Generation', isCurrent: true },
        ]}
      />

      <CampaignNavTabs
        activeSection="scenes"
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      {/* Main Studio View (Matches Screenshots 2 & 3) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Motion Control & Generation Panel (from Screenshots 2 & 3) */}
        <aside className="w-80 sm:w-88 shrink-0 border-r border-[#1C1C1C] bg-[#0A0A0A] flex flex-col justify-between overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            {/* Top Sub-tabs */}
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

            {/* Motion Control Preset Banner (from Screenshot 2) */}
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#242424] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#E7FE25] tracking-wider uppercase">
                  MOTION CONTROL
                </span>
                <span className="text-[10px] text-[#888]">How it works</span>
              </div>
              <p className="text-[11px] text-[#AAA]">Control motion with video references</p>
            </div>

            {/* 2 Reference Boxes (Motion & Character) */}
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setMediaPickerOpen(true)}
                className="p-3 rounded-2xl bg-[#121212] border border-[#222] hover:border-[#E7FE25]/50 flex flex-col items-center justify-center text-center space-y-1 cursor-pointer transition-colors"
              >
                <Video className="h-4 w-4 text-[#E7FE25]" />
                <span className="text-[11px] font-bold text-white leading-tight">Add motion</span>
                <span className="text-[9px] text-[#666]">3~30s Video</span>
              </div>

              <div
                onClick={() => setMediaPickerOpen(true)}
                className="p-3 rounded-2xl bg-[#121212] border border-[#222] hover:border-[#E7FE25]/50 flex flex-col items-center justify-center text-center space-y-1 cursor-pointer transition-colors"
              >
                <User className="h-4 w-4 text-[#E7FE25]" />
                <span className="text-[11px] font-bold text-white leading-tight">Add character</span>
                <span className="text-[9px] text-[#666]">Face & body</span>
              </div>
            </div>

            {/* Model Selector Trigger (opens Model Picker Modal from Screenshot 2) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#777]">
                Model Engine
              </label>
              <button
                type="button"
                onClick={() => setModelModalOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-[#E7FE25]" />
                  <span>{selectedModel}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#777]" />
              </button>
            </div>

            {/* Quality & Resolution */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] border border-[#242424] text-xs">
              <span className="text-[#888]">Quality</span>
              <span className="font-bold text-white">1080p Full HD</span>
            </div>

            {/* Scene Control Mode Toggle */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777]">
                Scene control mode
              </span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-[#222]">
                <button
                  type="button"
                  onClick={() => setSceneMode('video')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sceneMode === 'video' ? 'bg-[#1C1C1C] text-white shadow-sm' : 'text-[#777]'
                  }`}
                >
                  <Video className="h-3 w-3" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSceneMode('image')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sceneMode === 'image' ? 'bg-[#1C1C1C] text-white shadow-sm' : 'text-[#777]'
                  }`}
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>Image</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Generate Button (from Screenshot 2 & 3) */}
          <div className="pt-3 border-t border-[#1C1C1C]">
            <Button
              variant="primary"
              size="lg"
              onClick={() => scenes[0] && handleGenerateScene(scenes[0].id)}
              isLoading={isGenerating}
              className="w-full font-black text-sm py-3 bg-[#E7FE25] hover:bg-[#D5EC1E] text-black shadow-xl"
            >
              Generate ⚡ 7
            </Button>
          </div>
        </aside>

        {/* Center Canvas: "FROM CONCEPT TO FINAL CUT IN SECONDS" (from Screenshots 2 & 3) */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-[#060606]">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
                FROM CONCEPT TO FINAL CUT IN SECONDS
              </h2>
              <p className="text-xs text-[#888]">
                Multi-shot automated generation pipeline powered by high-speed neural models.
              </p>
            </div>

            {/* 3 Step Interactive Process Cards (from Screenshots 2 & 3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* Step 1: INPUT ANYTHING */}
              <div className="p-6 rounded-3xl bg-[#0E0E0E] border border-[#202020] space-y-4 flex flex-col justify-between shadow-xl">
                <div className="space-y-3">
                  <div
                    onClick={() => setMediaPickerOpen(true)}
                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#282828] hover:border-[#E7FE25]/50 bg-[#141414] flex flex-col items-center justify-center text-center p-4 space-y-2 cursor-pointer transition-colors"
                  >
                    <Upload className="h-7 w-7 text-[#E7FE25]" />
                    <span className="text-xs font-bold text-white uppercase">Upload Video / Image</span>
                    <span className="text-[10px] text-[#666]">Up to 4 references</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#777] uppercase tracking-wider">Step 1</span>
                    <h4 className="text-sm font-bold text-white uppercase">INPUT ANYTHING</h4>
                    <p className="text-xs text-[#888] mt-1">
                      Upload reference images (up to 7), a video clip, or simply start with a text idea.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: WRITE THE PROMPT */}
              <div className="p-6 rounded-3xl bg-[#0E0E0E] border border-[#202020] space-y-4 flex flex-col justify-between shadow-xl">
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-2xl bg-[#141414] border border-[#282828] p-4 text-left overflow-hidden flex flex-col justify-between">
                    <p className="text-xs text-[#EEE] italic leading-relaxed font-serif">
                      "A woman kneeling in darkness, illuminated by warm radiant beam of light emerging from her raised hand."
                    </p>
                    <span className="text-[10px] text-[#E7FE25] font-mono font-bold">Prompt Ready</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#777] uppercase tracking-wider">Step 2</span>
                    <h4 className="text-sm font-bold text-white uppercase">WRITE THE PROMPT</h4>
                    <p className="text-xs text-[#888] mt-1">
                      Use natural language to direct the scene and describe desired commercial scenario.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: GENERATE WITH KLING / SEEDANCE */}
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

                    {/* Toolbar Icons at bottom of video result (Download, Retry, Bookmark, Delete from Screenshot 2) */}
                    <div className="absolute bottom-2.5 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white">
                      <button type="button" className="hover:text-[#E7FE25] cursor-pointer" title="Download">
                        <Download className="h-3 w-3" />
                      </button>
                      <button type="button" className="hover:text-[#E7FE25] cursor-pointer" title="Regenerate">
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button type="button" className="hover:text-[#E7FE25] cursor-pointer" title="Bookmark">
                        <Bookmark className="h-3 w-3" />
                      </button>
                      <button type="button" className="hover:text-red-400 cursor-pointer" title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#777] uppercase tracking-wider">Step 3</span>
                    <h4 className="text-sm font-bold text-white uppercase">GENERATE WITH KLING</h4>
                    <p className="text-xs text-[#888] mt-1">
                      Receive high-fidelity video in seconds. Iterate and edit seamlessly to perfect your shot.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advance to Stage 6 Consistency QA */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E]">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">All Scene Shots Generated</h4>
                <p className="text-[11px] text-[#777]">
                  Verify facial lock, lighting continuity, and character identity in Stage 6 Consistency QA.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/campaigns/${campaignId}/evaluation`)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="font-bold px-6 shadow-md"
              >
                Consistency QA Pass
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Model Selector Popup Modal (from Screenshot 2) */}
      {modelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="max-w-lg w-full rounded-3xl bg-[#121212] border border-[#282828] p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
              <input
                type="text"
                placeholder="Search models..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#181818] border border-[#262626] text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#E7FE25]"
                autoFocus
              />
            </div>

            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider px-1">
              All models
            </div>

            {/* Model List */}
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedModel(m.name);
                    setModelModalOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedModel === m.name
                      ? 'bg-[#1C1C1C] border-[#E7FE25] text-white shadow-sm'
                      : 'bg-[#141414] border-[#222222] text-[#CCC] hover:border-[#333] hover:text-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{m.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#E7FE25] text-black font-extrabold">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#777]">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#202020]">
              <Button variant="ghost" size="sm" onClick={() => setModelModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
      />
    </div>
  );
}
