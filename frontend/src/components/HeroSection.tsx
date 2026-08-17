import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { HeroArcCarousel } from './HeroArcCarousel';

export const HeroSection: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(
        contentRef.current.querySelector('.hero-title'),
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      )
        .fromTo(
          contentRef.current.querySelector('.hero-subtitle'),
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          '-=0.6'
        )
        .fromTo(
          contentRef.current.querySelector('.hero-cta'),
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' },
          '-=0.4'
        )
        .fromTo(
          contentRef.current.querySelectorAll('.hero-feature-col'),
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out' },
          '-=0.3'
        );
    }
  }, []);

  return (
    <section className="relative min-h-screen w-full bg-[#FDFDFD] text-[#161616] overflow-hidden flex flex-col justify-between pt-10 pb-10 px-6 select-none">
      
      {/* Background Arc Carousel (Circle wheel rotating smoothly in background at z-10) */}
      <HeroArcCarousel />

      {/* Center Hero Content (Higher z-index z-30 with ambient radial clarity for maximum legibility) */}
      <div
        ref={contentRef}
        className="relative z-30 max-w-3xl mx-auto w-full text-center my-auto pt-24 sm:pt-28 md:pt-32"
      >
        {/* Soft clarity backdrop to guarantee zero text obstruction */}
        <div className="relative py-4 px-2 sm:px-6">
          <div className="absolute inset-0 -inset-x-8 bg-radial from-[#FDFDFD] via-[#FDFDFD]/90 to-transparent -z-10 rounded-full blur-xl pointer-events-none" />

          {/* Main Headline */}
          <h1 className="hero-title font-serif-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-normal tracking-tight text-[#161616] leading-[1.12]">
            Create High-Converting AI Video<br />
            Advertisements Instantly
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle font-sans-body text-sm sm:text-base md:text-[17px] text-[#161616]/75 mt-5 max-w-xl mx-auto font-normal leading-relaxed">
            Transform brand briefs into studio-grade video commercials with multi-model AI orchestration, automated storyboards, and ultra-fast rendering.
          </p>

          {/* CTA Button */}
          <div className="hero-cta mt-7 flex justify-center">
            <button className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#161616] hover:bg-[#013F32] text-[#FDFDFD] font-sans-body text-sm sm:text-base font-medium transition-all duration-300 shadow-xl hover:shadow-[#013F32]/25 hover:gap-3.5 active:scale-95 cursor-pointer">
              <span>Start Creating Ads Now</span>
              <ArrowRight className="w-4 h-4 text-[#E7FE25] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3 Feature Columns */}
      <div className="relative z-30 max-w-4xl mx-auto w-full pt-10 md:pt-14 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 items-start text-center">
          
          {/* Feature 1 */}
          <div className="hero-feature-col px-6 md:border-r md:border-[#161616]/10 space-y-1.5">
            <h3 className="font-serif-display text-xl sm:text-2xl font-normal text-[#161616]">
              Automated Storyboarding
            </h3>
            <p className="font-sans-body text-xs sm:text-[13px] text-[#161616]/60 leading-relaxed max-w-xs mx-auto">
              Generates multi-scene scripts, voiceover narration, and visual keyframes automatically.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="hero-feature-col px-6 md:border-r md:border-[#161616]/10 space-y-1.5">
            <h3 className="font-serif-display text-xl sm:text-2xl font-normal text-[#161616]">
              Distributed Rendering
            </h3>
            <p className="font-sans-body text-xs sm:text-[13px] text-[#161616]/60 leading-relaxed max-w-xs mx-auto">
              Celery & Redis async workers render broadcast-ready commercial ads in minutes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="hero-feature-col px-6 space-y-1.5">
            <h3 className="font-serif-display text-xl sm:text-2xl font-normal text-[#161616]">
              Multi-Platform Exports
            </h3>
            <p className="font-sans-body text-xs sm:text-[13px] text-[#161616]/60 leading-relaxed max-w-xs mx-auto">
              Export optimized aspect ratios tailored for TikTok, Reels, YouTube, and TV campaigns.
            </p>
          </div>

        </div>
      </div>

    </section>
  );
};
