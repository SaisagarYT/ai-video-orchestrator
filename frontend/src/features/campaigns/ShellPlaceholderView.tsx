import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WorkspaceContainer } from '../../components/layout/workspace/WorkspaceContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { WorkspaceLoadingSkeleton } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { CampaignHeader } from '../../components/layout/workspace/CampaignHeader';
import { CampaignNavTabs, type CampaignSection } from '../navigation/CampaignNavTabs';
import { ContextualPanel } from '../../components/layout/contextual-panel/ContextualPanel';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../lib/api';
import {
  Plus,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Search,
  Clock,
  Play,
  ArrowRight,
  Monitor,
  Smartphone,
  Square,
  Film,
  Maximize2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
} from '../../components/ui';

interface CampaignItem {
  id: string;
  name: string;
  category?: string;
  status: 'draft' | 'strategy_generated' | 'storyboard_ready' | 'rendering' | 'completed' | 'failed';
  aspect_ratio?: string;
  duration_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export function CampaignsListView() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/campaigns/');
      setCampaigns(res.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch campaigns.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = filterFormat === 'all' || c.aspect_ratio === filterFormat;
    return matchesSearch && matchesFormat;
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'completed':
        return <Badge variant="success" dot>Completed</Badge>;
      case 'rendering':
        return <Badge variant="lime" dot>Rendering</Badge>;
      case 'storyboard_ready':
        return <Badge variant="forest" dot>Storyboard Ready</Badge>;
      case 'strategy_generated':
        return <Badge variant="info" dot>Strategy Ready</Badge>;
      default:
        return <Badge variant="default">Draft</Badge>;
    }
  };

  const getFormatIcon = (format?: string) => {
    switch (format) {
      case '16:9':
        return <Monitor className="h-3 w-3" />;
      case '1:1':
        return <Square className="h-3 w-3" />;
      case '9:16':
      default:
        return <Smartphone className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Top Workspace Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-app">
              Campaigns
            </h1>
            {!isLoading && (
              <Badge variant="lime" size="sm">
                {campaigns.length} Total
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage your autonomous commercial video campaigns across all aspect ratios.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/campaigns/new')}
            leftIcon={<Plus className="h-4 w-4" />}
            className="font-semibold shadow-[var(--shadow-glow-lime)]"
          >
            New Campaign
          </Button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <WorkspaceContainer layoutMode="full-width" className="space-y-6 max-w-7xl mx-auto">
        {/* Loading State */}
        {isLoading && <WorkspaceLoadingSkeleton />}

        {/* Error State */}
        {!isLoading && error && (
          <ErrorState
            title="Failed to load campaigns"
            description="Unable to connect to the backend server to retrieve campaigns."
            error={error}
            onRetry={fetchCampaigns}
          />
        )}

        {/* Empty State (When 0 campaigns exist in database) */}
        {!isLoading && !error && campaigns.length === 0 && (
          <div className="py-12">
            <EmptyState
              title="No campaigns created yet"
              description="Create your first campaign to generate marketing angles, assemble scene storyboards, and render broadcast-grade video ads."
              icon={<Film className="h-6 w-6 text-[var(--brand-lime)]" />}
              primaryAction={{
                label: 'Create First Campaign',
                onClick: () => navigate('/campaigns/new'),
                icon: <Plus className="h-3.5 w-3.5" />,
              }}
            />
          </div>
        )}

        {/* Real Campaigns Grid (When campaigns exist) */}
        {!isLoading && !error && campaigns.length > 0 && (
          <>
            {/* Filter & Aspect Ratio Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-lime)] transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <span className="text-[11px] text-[var(--text-muted)] mr-1 hidden sm:inline">Format:</span>
                {[
                  { id: 'all', label: 'All Formats', icon: null },
                  { id: '16:9', label: '16:9 Desktop', icon: <Monitor className="h-3 w-3" /> },
                  { id: '9:16', label: '9:16 Mobile', icon: <Smartphone className="h-3 w-3" /> },
                  { id: '1:1', label: '1:1 Square', icon: <Square className="h-3 w-3" /> },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterFormat(f.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      filterFormat === f.id
                        ? 'bg-[var(--brand-lime)] text-[#161616] font-bold shadow-xs'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {f.icon}
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  onClick={() => navigate(`/campaigns/${camp.id}/overview`)}
                  className="group rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-lime)]/50 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  <div className="h-36 bg-gradient-to-br from-[#013F32] to-[#041410] p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono-code px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white border border-white/10 font-semibold">
                        {getFormatIcon(camp.aspect_ratio)}
                        <span>{camp.aspect_ratio || '16:9'}</span>
                      </span>
                      {getStatusBadge(camp.status)}
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[11px] font-medium text-white/90">
                        {camp.category || 'Commercial Video'}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-[var(--brand-lime)] group-hover:text-[#161616] transition-all shadow-md">
                        <Play className="h-3.5 w-3.5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--brand-lime)] transition-colors">
                        {camp.name}
                      </h3>
                      {camp.updated_at && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(camp.updated_at).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <span className="font-mono-code text-[11px] text-[var(--text-secondary)]">
                        {camp.duration_seconds ? `${camp.duration_seconds}s` : '60s Master'}
                      </span>
                      <span className="flex items-center gap-1 text-[var(--brand-lime)] font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                        <span>Open Control Center</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </WorkspaceContainer>
    </div>
  );
}

export function CampaignDetailWorkspaceView() {
  const { campaignId, section = 'overview' } = useParams<{ campaignId: string; section: CampaignSection }>();
  const navigate = useNavigate();
  const {
    contextualPanelOpen,
    setContextualPanelOpen,
    toggleContextualPanel,
  } = useAppStore();

  const currentSection = (section || 'overview') as CampaignSection;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
      <CampaignHeader
        campaignName={`Campaign: ${campaignId}`}
        status="draft"
        metadata={`Sub-section: ${currentSection}`}
        breadcrumbs={[
          { label: 'Campaigns', onClick: () => navigate('/campaigns') },
          { label: 'Control Center', onClick: () => navigate(`/campaigns/${campaignId}/overview`) },
          { label: currentSection.charAt(0).toUpperCase() + currentSection.slice(1), isCurrent: true },
        ]}
        onToggleContextualPanel={() => toggleContextualPanel('Parameters')}
        contextualPanelOpen={contextualPanelOpen}
      />

      <CampaignNavTabs
        activeSection={currentSection}
        onSelectSection={(sec) => navigate(`/campaigns/${campaignId}/${sec}`)}
      />

      <WorkspaceContainer
        layoutMode="dense-editor"
        contextualPanel={
          <ContextualPanel
            isOpen={contextualPanelOpen}
            onClose={() => setContextualPanelOpen(false)}
            title="Section Inspector"
          >
            <div className="text-xs text-[var(--text-muted)]">
              Parameters will be editable here.
            </div>
          </ContextualPanel>
        }
      >
        <div className="p-8 max-w-5xl mx-auto">
          <Card className="border-[var(--border-default)]">
            <CardHeader>
              <CardTitle className="text-base uppercase">{currentSection} Workspace</CardTitle>
              <CardDescription className="text-xs">
                Sub-workspace view for {currentSection}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title={`${currentSection.toUpperCase()} Workspace Section`}
                description="This feature module will be configured in subsequent milestones."
                icon={<Maximize2 className="h-6 w-6 text-[var(--brand-lime)]" />}
                primaryAction={{
                  label: 'Back to Campaign Control Center',
                  onClick: () => navigate(`/campaigns/${campaignId}/overview`),
                  icon: <ArrowRight className="h-4 w-4" />,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </WorkspaceContainer>
    </div>
  );
}

export function ProjectsPlaceholderView() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-app">
            Projects
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Organize commercial creative briefs into multi-brand workspaces.
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          New Project Folder
        </Button>
      </div>
      <WorkspaceContainer layoutMode="centered">
        <EmptyState
          title="No projects created yet"
          description="Projects help you group related marketing campaigns by client or brand domain."
          icon={<LayoutDashboard className="h-6 w-6" />}
          primaryAction={{
            label: 'Create Project Folder',
            onClick: () => alert('Project creation dialog...'),
            icon: <Plus className="h-3.5 w-3.5" />,
          }}
        />
      </WorkspaceContainer>
    </div>
  );
}

export function AssetsPlaceholderView() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-app">
            Asset Library
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Centralized brand assets, MinIO media objects, and exported video MP4s across all aspect ratios.
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Upload Brand Asset
        </Button>
      </div>
      <WorkspaceContainer layoutMode="centered">
        <EmptyState
          title="Asset library is empty"
          description="Uploaded brand assets, generated storyboard shots, and exported video files will appear here."
          icon={<FolderOpen className="h-6 w-6" />}
          primaryAction={{
            label: 'Upload Brand Asset',
            onClick: () => alert('Asset upload modal...'),
            icon: <Plus className="h-3.5 w-3.5" />,
          }}
        />
      </WorkspaceContainer>
    </div>
  );
}

export function SettingsPlaceholderView() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-app">
          Studio Preferences
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Configure API credentials, default camera parameters, and multi-aspect rendering pipelines.
        </p>
      </div>
      <WorkspaceContainer layoutMode="centered">
        <Card className="border-[var(--border-default)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-[var(--brand-lime)]" />
              <CardTitle className="text-sm">Multi-Format Video Rendering Engine</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Supports 16:9 Widescreen (1920x1080 / 4K), 9:16 Vertical (1080x1920), and 1:1 Square (1080x1080).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <Label>Supported Video Aspect Ratios</Label>
              <Input defaultValue="16:9 (Desktop/YouTube) • 9:16 (Mobile/Reels) • 1:1 (Social Feed)" disabled className="h-9 text-xs" />
            </div>
            <div>
              <Label>AI Strategy & Context Engine</Label>
              <Input defaultValue="Google Gemini 2.5 Flash" disabled className="h-9 text-xs" />
            </div>
            <div>
              <Label>Storage Backend</Label>
              <Input defaultValue="MinIO S3 Compatible Object Store" disabled className="h-9 text-xs" />
            </div>
          </CardContent>
        </Card>
      </WorkspaceContainer>
    </div>
  );
}
