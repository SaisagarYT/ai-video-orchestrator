import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/app-shell/AppShell';
import { AuthPage } from '../components/auth/AuthPage';
import { CampaignControlCenterView } from '../features/campaigns/views/CampaignControlCenterView';
import { CampaignCreationPage } from '../features/campaign-creation/views/CampaignCreationPage';
import { AdvancedCreativeStudioView } from '../features/creative-studio/views/AdvancedCreativeStudioView';
import {
  CampaignsListView,
  CampaignDetailWorkspaceView,
  ProjectsPlaceholderView,
  AssetsPlaceholderView,
  SettingsPlaceholderView,
} from '../features/campaigns/ShellPlaceholderView';
import { NotFoundState } from '../components/ui/ErrorState';

export function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Direct Auth Routes */}
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />

      {/* Root redirects to /campaigns */}
      <Route path="/" element={<Navigate to="/campaigns" replace />} />

      {/* Primary Application Shell Layout Route */}
      <Route element={<AppShell />}>
        {/* Global Dashboard / Campaigns List */}
        <Route path="/dashboard" element={<Navigate to="/campaigns" replace />} />
        <Route path="/campaigns" element={<CampaignsListView />} />

        {/* Milestone 04: Beginner AI Campaign Creation & Dynamic Interview */}
        <Route path="/campaigns/new" element={<CampaignCreationPage />} />

        {/* Milestone 03: Production Campaign Control Center */}
        <Route
          path="/campaigns/:campaignId"
          element={<Navigate to="overview" replace />}
        />
        <Route
          path="/campaigns/:campaignId/overview"
          element={<CampaignControlCenterView />}
        />

        {/* Milestone 05: Advanced Creative Studio */}
        <Route
          path="/campaigns/:campaignId/studio"
          element={<AdvancedCreativeStudioView />}
        />
        <Route
          path="/campaigns/:campaignId/brief"
          element={<AdvancedCreativeStudioView />}
        />

        {/* Dynamic Contextual Campaign Sub-Routes */}
        <Route
          path="/campaigns/:campaignId/:section"
          element={<CampaignDetailWorkspaceView />}
        />

        {/* Secondary Navigation */}
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
