import { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { HeroSection } from './components/HeroSection';
import { ShowcaseSection } from './components/ShowcaseSection';
import { FullVideoFeatureSection } from './components/FullVideoFeatureSection';
import { OrchestrationPipelineSection } from './components/OrchestrationPipelineSection';
import { DesignSystemShowcase } from './components/design-system/DesignSystemShowcase';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Layers } from 'lucide-react';

export default function App() {
  const [showDesignSystem, setShowDesignSystem] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        {showDesignSystem ? (
          <DesignSystemShowcase onClose={() => setShowDesignSystem(false)} />
        ) : (
          <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] relative flex flex-col">
            <Navbar
              onOpenAuth={handleOpenAuth}
              onOpenDesignSystem={() => setShowDesignSystem(true)}
            />
            <main className="flex-1">
              <HeroSection />
              <ShowcaseSection />
              <FullVideoFeatureSection />
              <OrchestrationPipelineSection />
            </main>

            {/* Dedicated High-End Authentication Page Modal */}
            {showAuth && (
              <AuthPage
                initialMode={authMode}
                onClose={() => setShowAuth(false)}
              />
            )}

            {/* Ambient Design System Inspector Switcher */}
            <div className="fixed bottom-6 right-6 z-40">
              <button
                onClick={() => setShowDesignSystem(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#161616] text-[#E7FE25] font-semibold text-xs shadow-xl border border-[#E7FE25]/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <Layers className="h-4 w-4" />
                <span>Design System Spec</span>
              </button>
            </div>
          </div>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
