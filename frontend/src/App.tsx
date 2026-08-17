import { useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { ShowcaseSection } from './components/ShowcaseSection';
import { FullVideoFeatureSection } from './components/FullVideoFeatureSection';
import { OrchestrationPipelineSection } from './components/OrchestrationPipelineSection';
import { DesignSystemShowcase } from './components/design-system/DesignSystemShowcase';
import { ThemeProvider } from './context/ThemeContext';
import { Layers } from 'lucide-react';

export default function App() {
  const [showDesignSystem, setShowDesignSystem] = useState<boolean>(false);

  return (
    <ThemeProvider defaultTheme="dark">
      {showDesignSystem ? (
        <DesignSystemShowcase onClose={() => setShowDesignSystem(false)} />
      ) : (
        <main className="min-h-screen bg-[#FDFDFD] relative">
          <HeroSection />
          <ShowcaseSection />
          <FullVideoFeatureSection />
          <OrchestrationPipelineSection />

          {/* Ambient Design System Inspector Switcher */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setShowDesignSystem(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#161616] text-[#E7FE25] font-semibold text-xs shadow-xl border border-[#E7FE25]/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>Design System Preview</span>
            </button>
          </div>
        </main>
      )}
    </ThemeProvider>
  );
}
