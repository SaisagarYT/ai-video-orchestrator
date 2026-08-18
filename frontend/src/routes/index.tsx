import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/app-shell/AppShell';
import { AuthPage } from '../components/auth/AuthPage';
import { CampaignWorkspaceHubView } from '../features/campaigns/views/CampaignWorkspaceHubView';
import { CampaignCreationPage } from '../features/campaign-creation/views/CampaignCreationPage';
import { CampaignControlCenterView } from '../features/campaigns/views/CampaignControlCenterView';
import { AdvancedCreativeStudioView } from '../features/creative-studio/views/AdvancedCreativeStudioView';
import { StrategyStageView } from '../features/strategy/StrategyStageView';
import { ConceptsWorkspaceView } from '../features/concepts/ConceptsWorkspaceView';
import { StoryboardWorkspaceView } from '../features/storyboard/StoryboardWorkspaceView';
import { ScenesWorkspaceView } from '../features/scenes/ScenesWorkspaceView';
import { ConsistencyQAStageView } from '../features/evaluation/ConsistencyQAStageView';
import { TimelineStageView } from '../features/timeline/TimelineStageView';
import { MasterRenderStageView } from '../features/render/MasterRenderStageView';
import { FinalReviewStageView } from '../features/review/FinalReviewStageView';
import {
  ProjectsPlaceholderView,
  AssetsPlaceholderView,
  SettingsPlaceholderView,
} from '../features/campaigns/ShellPlaceholderView';
import { NotFoundState } from '../components/ui/ErrorState';
import { WorkspaceLoadingSkeleton } from '../components/ui/LoadingState';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-app)]">
        <WorkspaceLoadingSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />

      {/* Root redirects to /campaigns */}
      <Route path="/" element={<Navigate to="/campaigns" replace />} />

      {/* Protected App Shell Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Production Workspace: Continuation Hub (Non-Dashboard) */}
        <Route path="/dashboard" element={<Navigate to="/campaigns" replace />} />
        <Route path="/campaigns" element={<CampaignWorkspaceHubView />} />

        {/* Stage 1: Creative Brief & Brand Context Intake */}
        <Route path="/campaigns/new" element={<CampaignCreationPage />} />
        <Route path="/campaigns/:campaignId/brief" element={<AdvancedCreativeStudioView />} />

        {/* Studio Overview */}
        <Route path="/campaigns/:campaignId" element={<Navigate to="overview" replace />} />
        <Route path="/campaigns/:campaignId/overview" element={<CampaignControlCenterView />} />
        <Route path="/campaigns/:campaignId/studio" element={<AdvancedCreativeStudioView />} />

        {/* Stage 2: AI Strategy Synthesis */}
        <Route path="/campaigns/:campaignId/strategy" element={<StrategyStageView />} />

        {/* Stage 3: Multi-Concept Exploration (A, B, C) */}
        <Route path="/campaigns/:campaignId/concepts" element={<ConceptsWorkspaceView />} />

        {/* Stage 4: Storyboard & Shot Decomposition */}
        <Route path="/campaigns/:campaignId/storyboard" element={<StoryboardWorkspaceView />} />

        {/* Stage 5: Multi-Modal Scene Asset Generator */}
        <Route path="/campaigns/:campaignId/scenes" element={<ScenesWorkspaceView />} />

        {/* Stage 6: Consistency & QA Evaluation */}
        <Route path="/campaigns/:campaignId/evaluation" element={<ConsistencyQAStageView />} />
        <Route path="/campaigns/:campaignId/quality" element={<ConsistencyQAStageView />} />

        {/* Stage 7: Multi-Track Timeline Editor */}
        <Route path="/campaigns/:campaignId/timeline" element={<TimelineStageView />} />

        {/* Stage 8: Master Compilation & Render */}
        <Route path="/campaigns/:campaignId/render" element={<MasterRenderStageView />} />

        {/* Stage 9: Final Review, Version Branching & Export */}
        <Route path="/campaigns/:campaignId/review" element={<FinalReviewStageView />} />
        <Route path="/campaigns/:campaignId/final" element={<FinalReviewStageView />} />

        {/* Global Resource Views */}
        <Route path="/projects" element={<ProjectsPlaceholderView />} />
        <Route path="/assets" element={<AssetsPlaceholderView />} />
        <Route path="/settings" element={<SettingsPlaceholderView />} />
        <Route path="/settings/:sub" element={<SettingsPlaceholderView />} />

        {/* 404 Inside Shell */}
        <Route
          path="*"
          element={<NotFoundState onGoHome={() => navigate('/campaigns')} />}
        />
      </Route>
    </Routes>
  );
}
