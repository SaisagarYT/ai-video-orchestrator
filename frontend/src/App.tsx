import { HeroSection } from './components/HeroSection';
import { ShowcaseSection } from './components/ShowcaseSection';
import { FullVideoFeatureSection } from './components/FullVideoFeatureSection';
import { OrchestrationPipelineSection } from './components/OrchestrationPipelineSection';

export default function App() {
  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      <HeroSection />
      <ShowcaseSection />
      <FullVideoFeatureSection />
      <OrchestrationPipelineSection />
    </main>
  );
}
