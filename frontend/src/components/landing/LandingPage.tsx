import React from 'react';
import { HeroSection } from '../HeroSection';
import { FullVideoFeatureSection } from '../FullVideoFeatureSection';
import { ShowcaseSection } from '../ShowcaseSection';
import { OrchestrationPipelineSection } from '../OrchestrationPipelineSection';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#161616] overflow-x-hidden">
      <HeroSection />
      <FullVideoFeatureSection />
      <ShowcaseSection />
      <OrchestrationPipelineSection />
    </div>
  );
}
