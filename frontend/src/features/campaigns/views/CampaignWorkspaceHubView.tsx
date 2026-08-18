import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowUp,
  Zap,
  ChevronDown,
  Wand2,
  Film,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { WorkspaceContainer } from '../../../components/layout/workspace/WorkspaceContainer';
import { MediaPickerModal } from '../../../components/ui/MediaPickerModal';
import { Button } from '../../../components/ui';

interface CampaignItem {
  id: string;
  name: string;
  product_name?: string;
  product_description?: string;
  status: string;
  objective?: string;
  target_platforms?: string;
  created_at?: string;
  updated_at?: string;
}

const SHOWCASE_PRESETS = [
  {
    id: 'p1',
    title: 'LOW-ANGLE RUNNER',
    category: 'Marketing',
    tag: 'LOW-ANGLE',
    model: 'Seedance 2.5',
    prompt: 'High-speed dynamic low-angle tracking shot of carbon running shoes hitting wet asphalt with water droplets splashing in macro slow-motion.',
    aspectRatio: '16:9',
    bgColor: 'from-[#0E281E] to-[#05110C]',
    accentColor: '#10B981',
  },
  {
    id: 'p2',
    title: 'CROWD PERSPECTIVE',
    category: 'Explainer videos',
    tag: 'CROWD CONTROL',
    model: 'Kling 3.0 Omni',
    prompt: 'Surreal cinematic gallery with golden picture frame floating over a synchronized monochrome crowd under ambient overhead lighting.',
    aspectRatio: '16:9',
    bgColor: 'from-[#2A2315] to-[#120F08]',
    accentColor: '#F59E0B',
  },
  {
    id: 'p3',
    title: 'ANIME TRANSFORMATION',
    category: 'Apps',
    tag: 'DYNAMIC ANIME',
    model: 'Gemini Omni Flash',
    prompt: 'Stylized high-contrast anime protagonist illuminated by radiant neon reflections as blue lightning energy surges around glasses.',
    aspectRatio: '16:9',
    bgColor: 'from-[#0F2236] to-[#060D17]',
    accentColor: '#3B82F6',
  },
];

const AI_MODELS = [
  { id: 'v4-flash', name: '⚡ V4 Flash Manual', badge: 'Fastest' },
  { id: 'seedance-2.5', name: 'Seedance 2.5 Pro', badge: 'Exclusive' },
  { id: 'kling-3.0', name: 'Kling 3.0 Omni Edit', badge: 'Ultra Quality' },
  { id: 'gemini-omni', name: 'Gemini Omni Flash', badge: 'New' },
];

export function CampaignWorkspaceHubView() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [promptInput, setPromptInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedModel, setSelectedModel] = useState<string>('⚡ V4 Flash Manual');
  const [modelDropdownOpen, setModelDropdownOpen] = useState<boolean>(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState<boolean>(false);
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns/');
      setCampaigns(res.data || []);
    } catch {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleLaunchPrompt = () => {
    if (!promptInput.trim()) return;
    navigate('/campaigns/new');
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/campaigns/${campaignToDelete.id}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      setCampaignToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPresets = SHOWCASE_PRESETS.filter(
    (p) => selectedCategory === 'All' || p.category.toLowerCase().includes(selectedCategory.toLowerCase())
  );

  return (
    <WorkspaceContainer layoutMode="full-width" className="p-4 sm:p-6 lg:p-10 space-y-10 max-w-6xl mx-auto select-none font-app text-white">
      {/* 1. HERO HEADER: "WHAT ARE WE CREATING TODAY?" (from Screenshot 1) */}
      <div className="text-center space-y-6 pt-2">
        <div className="inline-flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#E7FE25] flex items-center justify-center text-black font-black text-lg shadow-lg">
            ⚡
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
            WHAT ARE WE CREATING TODAY?
          </h1>
        </div>

        {/* 2. CENTRAL OMNIBAR / PROMPT BOX (from Screenshot 1) */}
        <div className="max-w-2xl mx-auto rounded-3xl bg-[#121212] border border-[#242424] hover:border-[#383838] transition-all shadow-2xl p-4 sm:p-5 space-y-3 relative text-left">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider block">
            Create
          </span>

          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleLaunchPrompt();
              }
            }}
            placeholder="Describe what you want to create, paste a product URL, or select skills..."
            className="w-full bg-transparent text-sm text-white placeholder:text-[#555] focus:outline-none resize-none leading-relaxed"
          />

          {/* Omnibar Inner Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1C1C1C]">
            <div className="flex items-center gap-2">
              {/* Media Plus Button */}
              <button
                type="button"
                onClick={() => setMediaPickerOpen(true)}
                className="h-8 w-8 rounded-full bg-[#1C1C1C] hover:bg-[#282828] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Add Media / Reference"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* Model Selector Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#282828] text-xs font-semibold text-[#DDD] transition-colors cursor-pointer"
                >
                  <span>{selectedModel}</span>
                  <ChevronDown className="h-3 w-3 text-[#777]" />
                </button>

                {modelDropdownOpen && (
                  <div className="absolute left-0 bottom-10 z-40 w-56 rounded-2xl bg-[#161616] border border-[#2E2E2E] p-2 space-y-1 shadow-2xl animate-in fade-in zoom-in-95">
                    {AI_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.name);
                          setModelDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs text-white hover:bg-[#222] transition-colors cursor-pointer"
                      >
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#E7FE25] text-black font-bold">
                          {m.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Circular Green Submit Arrow Button */}
            <button
              type="button"
              onClick={handleLaunchPrompt}
              className="h-9 w-9 rounded-full bg-[#E7FE25] hover:bg-[#D5EC1E] text-black flex items-center justify-center font-extrabold transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              title="Launch Campaign"
            >
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Omnibar Sub-Links (Skills, Connectors, MCP) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[#888]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPromptInput('High-converting e-commerce commercial script with sensory 3-second hook')}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-[#E7FE25]" />
                <span>Skills</span>
              </button>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#181818] border border-[#242424] text-[11px] text-[#AAA]">
                <span>TikTok</span>
                <span>•</span>
                <span>YouTube</span>
                <span className="text-[#666]">Connectors</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Opening MCP & Workflow Automations Studio...')}
              className="flex items-center gap-1 text-[#AAA] hover:text-white transition-colors cursor-pointer"
            >
              <Wand2 className="h-3.5 w-3.5 text-[#E7FE25]" />
              <span>Try MCP</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. SUB-HEADLINE & CATEGORY FILTER TABS (from Screenshot 1) */}
      <div className="text-center space-y-4">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#777] max-w-xl mx-auto">
          BUILD, GENERATE, AND MARKET ANYTHING WITH SKILLS, CONNECTORS, AND AUTOMATION
        </h2>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2">
          {['All', 'Marketing', 'Explainer videos', 'Apps', 'Games'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#141414] border border-[#242424] text-[#888] hover:text-white hover:border-[#383838]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. DYNAMIC PRESET GALLERY SHOWCASE (from Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => {
              setPromptInput(preset.prompt);
              window.scrollTo({ top: 100, behavior: 'smooth' });
            }}
            className={`rounded-3xl bg-gradient-to-b ${preset.bgColor} border border-[#222222] hover:border-[#E7FE25]/50 transition-all duration-300 p-5 space-y-4 cursor-pointer group shadow-xl flex flex-col justify-between`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full text-black font-mono tracking-wider shadow-sm"
                  style={{ backgroundColor: preset.accentColor }}
                >
                  {preset.tag}
                </span>
                <span className="text-[10px] font-mono text-[#AAA] bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-md">
                  {preset.model}
                </span>
              </div>

              <div className="h-32 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                <Film className="h-8 w-8 text-white/30 group-hover:text-[#E7FE25] transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white group-hover:text-[#E7FE25] transition-colors">
                    {preset.title}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#AAA] line-clamp-2 leading-relaxed">
                "{preset.prompt}"
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-[#E7FE25]">
              <span>Use This Preset</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* 5. ACTIVE PRODUCTION CAMPAIGNS */}
      {campaigns.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#1C1C1C]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E7FE25] animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#888]">
                Active Campaigns ({campaigns.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                onClick={() => navigate(`/campaigns/${camp.id}/overview`)}
                className="p-5 rounded-2xl bg-[#0E0E0E] hover:bg-[#141414] border border-[#1E1E1E] hover:border-[#2E2E2E] transition-all cursor-pointer space-y-3 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-base font-bold text-white group-hover:text-[#E7FE25] transition-colors">
                      {camp.name}
                    </h4>
                    <span className="text-xs text-[#777]">
                      {camp.product_name || 'Commercial Video'} • {camp.target_platforms || '16:9'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCampaignToDelete(camp);
                    }}
                    className="p-1.5 text-[#666] hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-[#181818] flex items-center justify-between text-xs">
                  <span className="text-[#888] font-medium">Status: {camp.status}</span>
                  <span className="text-[#E7FE25] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open Studio <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelectMedia={() => {
          setPromptInput((prev) => `${prev} [Attached Media Reference]`);
        }}
      />

      {/* Delete Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="p-6 rounded-2xl bg-[#121212] border border-[#282828] max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Delete Campaign</h4>
            <p className="text-xs text-[#888]">
              Are you sure you want to delete <strong className="text-white">{campaignToDelete.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setCampaignToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} isLoading={isDeleting}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceContainer>
  );
}
