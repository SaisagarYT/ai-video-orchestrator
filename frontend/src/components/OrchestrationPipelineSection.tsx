import React, { useState, useEffect, useRef } from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Check, 
  Film, 
  Music, 
  Layers, 
  ChevronRight,
  Radio
} from 'lucide-react';
import { animate, stagger } from 'animejs';

interface StageInfo {
  id: string;
  number: string;
  stepName: string;
  title: string;
  tagline: string;
  description: string;
  keyOutputs: string[];
  specs: { label: string; val: string }[];
  accentGlow: string;
  badgeColor: string;
}

const STAGES: StageInfo[] = [
  {
    id: 'storyboard',
    number: '01',
    stepName: 'Story Architecture',
    title: 'Generative Storyboard & Scene Deconstruction',
    tagline: 'Translating creative intention into cinema continuity',
    description: 'The orchestrator breaks down your product narrative into a multi-beat cinematic script, generating character continuity tokens, camera choreography notes, and emotional pacing curves.',
    keyOutputs: ['Director Beat Sheet', 'Character Identity Anchor', 'Lighting Moodboard'],
    specs: [
      { label: 'Scene Generation', val: '0.8s' },
      { label: 'Continuity Index', val: '99.8%' },
      { label: 'Resolution', val: 'Native 4K' }
    ],
    accentGlow: 'from-[#E7FE25]/20 via-[#013F32]/40 to-transparent',
    badgeColor: 'text-[#E7FE25] bg-[#E7FE25]/10 border-[#E7FE25]/30'
  },
  {
    id: 'camera',
    number: '02',
    stepName: 'Spatial Cinema Rig',
    title: 'Virtual Lens Simulation & Multi-Model Diffusion',
    tagline: 'Physical optical properties powered by combined frontier models',
    description: 'Routes each shot to the optimal generative model (Sora 2, Gen-3, Luma Ray) while simulating anamorphic focal lengths, depth of field bokeh, and sub-pixel camera crane paths.',
    keyOutputs: ['35mm T1.5 Anamorphic', 'Multi-Model Synthesis', 'Volumetric Shutter'],
    specs: [
      { label: 'Camera Path', val: '6-DoF Spline' },
      { label: 'Lens Emulation', val: 'Panavision C-Series' },
      { label: 'Frame Rate', val: '60 FPS' }
    ],
    accentGlow: 'from-sky-400/20 via-[#013F32]/40 to-transparent',
    badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/30'
  },
  {
    id: 'audio',
    number: '03',
    stepName: 'Neural Soundstage',
    title: 'Spatial Foley, Voice Cloning & Orchestral Scoring',
    tagline: 'Studio-grade acoustics composed in lockstep with the visual edit',
    description: 'Generates synchronized multi-track audio stems: multilingual emotive voice acting with perfect phoneme lip-matching, spatial binaural sound effects, and adaptive orchestral music.',
    keyOutputs: ['Dolby Atmos Stem Mix', 'Phoneme Lip-Sync', 'Sub-Bass Cinema Impacts'],
    specs: [
      { label: 'Audio Engine', val: '96kHz / 24-bit' },
      { label: 'Acoustic Latency', val: '18ms' },
      { label: 'Stem Channels', val: '8 Stems' }
    ],
    accentGlow: 'from-purple-400/20 via-[#013F32]/40 to-transparent',
    badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/30'
  },
  {
    id: 'master',
    number: '04',
    stepName: 'Film Master & Grade',
    title: 'Neural Color Grading & Multi-Platform Delivery',
    tagline: 'Broadcast master with Kodak 35mm grain and instant aspect ratios',
    description: 'Applies AI temporal denoise, organic Kodak 5219 film stock grain, and automated HDR10 tone mapping before generating instant 16:9, 9:16, and 1:1 multi-channel exports.',
    keyOutputs: ['Kodak Vision3 LUT', 'Dolby Vision HDR', 'Omni-Channel Export'],
    specs: [
      { label: 'Master Format', val: 'ProRes 4444 XQ' },
      { label: 'Color Space', val: 'Rec.2020 / DCI-P3' },
      { label: 'Render Speed', val: '24x Real-Time' }
    ],
    accentGlow: 'from-emerald-400/20 via-[#013F32]/40 to-transparent',
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
  }
];

export const OrchestrationPipelineSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const audioBarsRef = useRef<HTMLDivElement>(null);
  const horizonLevelRef = useRef<HTMLDivElement>(null);
  const wiperLineRef = useRef<HTMLDivElement>(null);
  const filmReelRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeShot, setActiveShot] = useState(1);

  // Scroll listener for 380vh scroll track
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      const currentScroll = -rect.top;

      if (totalScrollable <= 0) return;

      const rawProgress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      setScrollProgress(rawProgress);

      const step = Math.min(STAGES.length - 1, Math.floor(rawProgress * STAGES.length));
      setActiveStepIndex(step);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Anime.js micro-animations for cards and internal elements
  useEffect(() => {
    // Animate the entire stack cards on step change
    if (stackContainerRef.current) {
      const stackedCards = stackContainerRef.current.querySelectorAll('.pipeline-stacked-card');
      if (stackedCards.length > 0) {
        animate(stackedCards, {
          duration: 600,
          ease: 'outBack(1.15)'
        });
      }
    }

    // Stage 2: Camera Viewfinder Horizon Level subtle breathing
    if (activeStepIndex === 1 && horizonLevelRef.current) {
      animate(horizonLevelRef.current, {
        rotate: [-1.5, 1.5, -0.8, 0],
        duration: 3200,
        loop: true,
        direction: 'alternate',
        ease: 'inOutSine'
      });
    }

    // Stage 3: Animate Soundstage Equalizer Bars
    if (activeStepIndex === 2 && audioBarsRef.current) {
      const bars = audioBarsRef.current.querySelectorAll('.acoustic-eq-bar');
      if (bars.length > 0) {
        animate(bars, {
          scaleY: () => [0.15 + Math.random() * 0.2, 0.75 + Math.random() * 0.25, 0.3 + Math.random() * 0.5],
          duration: 750,
          delay: stagger(20),
          loop: true,
          direction: 'alternate',
          ease: 'inOutQuad'
        });
      }
    }

    // Stage 4: Color Grade Laser Scanner Wipe & Reel
    if (activeStepIndex === 3) {
      if (wiperLineRef.current) {
        animate(wiperLineRef.current, {
          left: ['5%', '95%'],
          duration: 2600,
          loop: true,
          direction: 'alternate',
          ease: 'inOutSine'
        });
      }
      if (filmReelRef.current) {
        animate(filmReelRef.current, {
          rotate: [0, 360],
          duration: 5500,
          loop: true,
          ease: 'linear'
        });
      }
    }
  }, [activeStepIndex]);

  // Jump to step on click
  const jumpToStep = (index: number) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + (index / (STAGES.length - 1)) * totalScrollable;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  const currentStage = STAGES[activeStepIndex];

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[380vh] bg-[#FDFDFD] text-[#161616] select-none border-t border-[#161616]/10"
    >
      {/* Sticky 100vh Viewport Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-6 sm:px-12 lg:px-16 py-6 sm:py-8">
        
        {/* Soft Luxury Studio Ambient Lighting */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[45vh] bg-radial from-[#013F32]/8 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[45vw] h-[40vh] bg-radial from-[#E7FE25]/15 via-transparent to-transparent blur-3xl pointer-events-none transition-all duration-700"
          style={{ transform: `scale(${1 + scrollProgress * 0.3})` }}
        />

        {/* Studio Top Navigation Bar */}
        <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#161616]/10 font-sans-body">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#013F32] flex items-center justify-center text-[#E7FE25] shadow-md">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#013F32]">
                Director's Studio Engine
              </span>
              <div className="text-[11px] text-[#161616]/50">
                End-to-end autonomous production pipeline
              </div>
            </div>
          </div>

          {/* Interactive Progress Track */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#161616]/70">
              <Layers className="w-3.5 h-3.5 text-[#013F32]" />
              <span>Layered Stage Stack</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#013F32]" />
              <span className="font-mono text-[#013F32] font-semibold">{Math.round(scrollProgress * 100)}%</span>
            </div>

            {/* Step Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[#161616]/5 rounded-full border border-[#161616]/10">
              {STAGES.map((s, idx) => {
                const isActive = idx === activeStepIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => jumpToStep(idx)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-[#013F32] text-[#FDFDFD] shadow-sm' 
                        : 'text-[#161616]/60 hover:text-[#161616] hover:bg-black/5'
                    }`}
                  >
                    0{idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Central Two-Column Studio Layout */}
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto py-2">
          
          {/* Left Column: Editorial Stage Narrative (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#013F32]/10 border border-[#013F32]/20 text-[#013F32] text-xs font-semibold tracking-wide mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#013F32]" />
                <span>{currentStage.stepName}</span>
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl xl:text-4xl font-normal text-[#161616] leading-tight tracking-tight">
                {currentStage.title}
              </h2>
              <p className="font-serif-display italic text-sm sm:text-base text-[#013F32] mt-1.5">
                "{currentStage.tagline}"
              </p>
              <p className="font-sans-body text-xs sm:text-sm text-[#161616]/75 mt-2 leading-relaxed">
                {currentStage.description}
              </p>
            </div>

            {/* Key Deliverable Badges */}
            <div className="space-y-1.5 pt-1 font-sans-body">
              <div className="text-[11px] font-semibold text-[#161616]/50 uppercase tracking-wider">
                Stage Deliverables:
              </div>
              <div className="flex flex-wrap gap-2">
                {currentStage.keyOutputs.map((out, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#161616]/10 text-xs font-medium text-[#161616] shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-[#013F32]" />
                    {out}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Timeline Tabs */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {STAGES.map((st, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;
                return (
                  <button
                    key={st.id}
                    onClick={() => jumpToStep(idx)}
                    className={`p-2 sm:p-2.5 rounded-xl text-left border transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-[#013F32] border-[#013F32] text-[#FDFDFD] shadow-md shadow-[#013F32]/20 scale-[1.03]' 
                        : isPassed
                          ? 'bg-[#013F32]/5 border-[#013F32]/20 text-[#013F32]'
                          : 'bg-white border-[#161616]/10 text-[#161616]/50 hover:border-[#161616]/20'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold">
                      {st.number}
                    </div>
                    <div className="text-[11px] font-semibold truncate mt-0.5">
                      {st.stepName.split(' ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Ultra-Modern Frosted Glass 3D Stacked Cards Deck (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center items-center">
            
            {/* 3D Stack Container - Enlarged Height */}
            <div 
              ref={stackContainerRef}
              className="relative w-full h-[540px] sm:h-[600px] lg:h-[640px] flex items-start justify-center"
            >
              {STAGES.map((stage, idx) => {
                const delta = idx - activeStepIndex;
                const isCurrent = delta === 0;
                const isFuture = delta > 0;
                const isPast = delta < 0;

                // High-End 3D Stack Offsets
                let transformStyle = '';
                let zIndex = 10;
                let opacity = 1;
                let pointerEvents: 'auto' | 'none' = 'none';

                if (isCurrent) {
                  transformStyle = 'translateY(0px) scale(1) rotate(0deg)';
                  zIndex = 40;
                  opacity = 1;
                  pointerEvents = 'auto';
                } else if (isFuture) {
                  if (delta === 1) {
                    transformStyle = 'translateY(26px) scale(0.96) rotate(1deg)';
                    zIndex = 30;
                    opacity = 0.9;
                    pointerEvents = 'auto';
                  } else if (delta === 2) {
                    transformStyle = 'translateY(52px) scale(0.92) rotate(-1.2deg)';
                    zIndex = 20;
                    opacity = 0.7;
                    pointerEvents = 'auto';
                  } else {
                    transformStyle = 'translateY(76px) scale(0.88) rotate(1.8deg)';
                    zIndex = 10;
                    opacity = 0.45;
                    pointerEvents = 'auto';
                  }
                } else if (isPast) {
                  transformStyle = 'translateY(-70px) scale(0.94) rotate(-3deg)';
                  zIndex = 10;
                  opacity = 0;
                  pointerEvents = 'none';
                }

                return (
                  <div
                    key={stage.id}
                    onClick={() => !isCurrent && jumpToStep(idx)}
                    style={{
                      transform: transformStyle,
                      zIndex,
                      opacity,
                      pointerEvents
                    }}
                    className={`pipeline-stacked-card absolute inset-x-0 top-0 w-full rounded-3xl bg-[#0D1210]/95 backdrop-blur-2xl border border-white/12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-8 min-h-[490px] sm:min-h-[540px] lg:min-h-[570px] flex flex-col justify-between transition-all duration-500 ease-out text-[#FDFDFD] overflow-hidden ${
                      !isCurrent ? 'hover:brightness-110 cursor-pointer' : ''
                    }`}
                  >
                    {/* Top Rim Glass Glare & Colored Laser Edge */}
                    <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${stage.accentGlow}`} />

                    {/* Top Card Navigation Bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-sans-body">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${stage.badgeColor}`}>
                          STAGE {stage.number}
                        </span>
                        <span className="font-semibold text-white/90 tracking-wide text-sm sm:text-base">
                          {stage.stepName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        {isCurrent ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7FE25] text-[#161616] font-bold text-xs shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#161616] animate-ping" />
                            ACTIVE STUDIO
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors">
                            Inspect <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stage Centerpiece Visuals */}
                    <div className="py-5 my-auto">
                      
                      {/* CARD 01: Modern Storyboard Timeline Scrubber & Prompt Tokens */}
                      {stage.id === 'storyboard' && (
                        <div className="space-y-5">
                          {/* Shot Strip Timeline */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                              <span className="text-[#E7FE25] font-semibold flex items-center gap-2">
                                <Film className="w-4 h-4" /> SHOT SEQUENCE • TIMELINE (2.39:1)
                              </span>
                              <span className="text-white/40">Total: 00:15:00</span>
                            </div>

                            {/* 3 Interactive Filmstrip Thumbnails */}
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { num: '01', type: 'WIDE EST.', bg: 'from-[#013F32] to-[#12362C]', lens: '24mm T2.0', tag: 'Neon Skyline' },
                                { num: '02', type: 'HERO CLOSE', bg: 'from-[#1A2623] via-[#013F32] to-[#161616]', lens: '35mm T1.4', tag: 'Visor Rain' },
                                { num: '03', type: 'TRACKING', bg: 'from-[#0A1A16] to-[#013F32]', lens: '85mm T1.8', tag: 'Car Motion' },
                              ].map((shot, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => { e.stopPropagation(); setActiveShot(i + 1); }}
                                  className={`p-3.5 sm:p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden bg-gradient-to-br min-h-[110px] sm:min-h-[130px] flex flex-col justify-between ${shot.bg} ${
                                    activeShot === i + 1 
                                      ? 'border-[#E7FE25] shadow-xl shadow-[#013F32]/50 scale-[1.03]' 
                                      : 'border-white/10 hover:border-white/20 opacity-75 hover:opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
                                    <span className="text-white/90 font-bold">{shot.num}</span>
                                    <span className="text-[#E7FE25]">{shot.lens}</span>
                                  </div>
                                  <div className="text-xs sm:text-sm font-semibold text-white mt-2 leading-snug">
                                    {shot.tag}
                                  </div>
                                  <div className="text-[10px] text-white/50 font-mono mt-1">{shot.type}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Director Token Tag Pills */}
                          <div className="flex flex-wrap gap-2 font-mono text-xs">
                            <span className="px-3 py-1.5 rounded-xl bg-[#E7FE25]/10 text-[#E7FE25] border border-[#E7FE25]/30">
                              #AnamorphicFlare
                            </span>
                            <span className="px-3 py-1.5 rounded-xl bg-white/5 text-white/80 border border-white/10">
                              #BladeRunnerAesthetic
                            </span>
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                              #ActorLock: 99.8%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CARD 02: High-End ARRI/RED Cinema Viewfinder HUD */}
                      {stage.id === 'camera' && (
                        <div className="space-y-4">
                          {/* Cinema Viewfinder Screen - Taller Height */}
                          <div className="relative h-56 sm:h-64 lg:h-68 rounded-2xl bg-black/70 border border-sky-400/30 overflow-hidden p-4 flex flex-col justify-between">
                            {/* Viewfinder Rule of Thirds Crosshairs */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/20">
                              <div className="border-r border-b border-white/20" />
                              <div className="border-r border-b border-white/20" />
                              <div className="border-b border-white/20" />
                              <div className="border-r border-b border-white/20" />
                              <div className="border-r border-b border-white/20" />
                              <div className="border-b border-white/20" />
                            </div>

                            {/* Center Viewfinder Target Reticle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-sky-400/50 rounded-full flex items-center justify-center pointer-events-none">
                              <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                            </div>

                            {/* Horizon Level Line (Animated via Anime.js) */}
                            <div 
                              ref={horizonLevelRef}
                              className="absolute top-1/2 left-1/5 right-1/5 h-[1.5px] bg-sky-400/70 pointer-events-none"
                            />

                            {/* HUD Top Readouts */}
                            <div className="relative z-10 flex items-center justify-between text-xs font-mono text-sky-400">
                              <span className="flex items-center gap-2 font-semibold">
                                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                <span>REC • ARRI ALEXA 65</span>
                              </span>
                              <span className="text-white/90">35mm T1.5 PANAVISION</span>
                            </div>

                            {/* HUD Bottom Readouts */}
                            <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2.5 text-white/80">
                                <span className="bg-sky-500/20 px-2 py-0.5 rounded text-sky-300 font-semibold">ISO 250</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded">180° SHUTTER</span>
                              </div>
                              <span className="text-emerald-400 font-bold">60.00 FPS SYNC</span>
                            </div>
                          </div>

                          {/* Multi-Model Routing Status */}
                          <div className="flex items-center justify-between text-xs sm:text-sm font-mono px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                            <span className="text-white/60">Diffusion Architecture:</span>
                            <span className="text-sky-300 font-semibold">Sora 2 + Gen-3 Pipeline</span>
                          </div>
                        </div>
                      )}

                      {/* CARD 03: High-End Dolby Atmos Stem Mixing Soundstage */}
                      {stage.id === 'audio' && (
                        <div className="space-y-4">
                          <div className="p-5 rounded-2xl bg-black/60 border border-purple-400/30 space-y-4">
                            <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                              <span className="text-purple-300 font-semibold flex items-center gap-2">
                                <Music className="w-4 h-4 text-purple-400" /> DOLBY ATMOS 7.1.4
                              </span>
                              <span className="text-[#E7FE25] font-bold">96kHz / 24-bit</span>
                            </div>

                            {/* Equalizer Frequency Spectrum Waveform - Taller */}
                            <div 
                              ref={audioBarsRef}
                              className="h-24 sm:h-28 flex items-end justify-between gap-1.5 px-3 py-2 bg-black/70 rounded-xl border border-white/10 overflow-hidden"
                            >
                              {Array.from({ length: 32 }).map((_, i) => (
                                <div 
                                  key={i}
                                  className="acoustic-eq-bar w-full bg-gradient-to-t from-purple-600 via-[#E7FE25] to-white rounded-t-sm origin-bottom"
                                  style={{ 
                                    height: `${15 + Math.sin(i * 0.3) * 55 + Math.random() * 25}%`,
                                    opacity: 0.9 
                                  }}
                                />
                              ))}
                            </div>

                            {/* Interactive 3-Stem Channels */}
                            <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-white/40 text-[10px] flex items-center justify-between">
                                  <span>VOICE (AI)</span>
                                  <span className="text-emerald-400 font-semibold">0.0 dB</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                  <div className="w-[85%] h-full bg-purple-400 rounded-full" />
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-white/40 text-[10px] flex items-center justify-between">
                                  <span>FOLEY (3D)</span>
                                  <span className="text-[#E7FE25] font-semibold">-2.4 dB</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                  <div className="w-[70%] h-full bg-[#E7FE25] rounded-full" />
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-white/40 text-[10px] flex items-center justify-between">
                                  <span>ORCHESTRAL</span>
                                  <span className="text-emerald-400 font-semibold">-4.1 dB</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                  <div className="w-[90%] h-full bg-emerald-400 rounded-full" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CARD 04: Cinema Color Grading Split & Aspect Multi-Export */}
                      {stage.id === 'master' && (
                        <div className="space-y-4">
                          {/* Live Laser Scanner Before/After Split Preview - Taller */}
                          <div className="relative h-40 sm:h-48 rounded-2xl bg-black/60 border border-emerald-400/30 overflow-hidden flex items-center justify-between p-6">
                            {/* Scanning Laser Line (Animated via Anime.js) */}
                            <div 
                              ref={wiperLineRef}
                              className="absolute top-0 bottom-0 w-[2px] bg-[#E7FE25] shadow-[0_0_15px_#E7FE25] pointer-events-none z-20"
                            />

                            {/* Left Side: Log / Raw */}
                            <div className="relative z-10 text-left space-y-1">
                              <span className="text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded bg-white/10 text-white/60">RAW LOG-C</span>
                              <div className="text-xs sm:text-sm font-semibold text-white/70">Flat Cinema Sensor</div>
                            </div>

                            {/* Rotating Reel Icon */}
                            <div 
                              ref={filmReelRef}
                              className="relative z-10 w-16 h-16 rounded-full border-2 border-[#E7FE25] bg-[#013F32] flex items-center justify-center shadow-2xl"
                            >
                              <Film className="w-7 h-7 text-[#E7FE25]" />
                            </div>

                            {/* Right Side: Kodak 5219 LUT */}
                            <div className="relative z-10 text-right space-y-1">
                              <span className="text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-semibold">KODAK 5219</span>
                              <div className="text-xs sm:text-sm font-semibold text-[#E7FE25]">14.2 Stops HDR</div>
                            </div>
                          </div>

                          {/* Instant Aspect Ratio Exports */}
                          <div className="grid grid-cols-3 gap-2.5 text-center text-xs sm:text-sm font-mono">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-[#E7FE25]">
                              16:9 TV / YouTube
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-[#E7FE25]">
                              9:16 TikTok / Reels
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-[#E7FE25]">
                              2.39:1 Cinema
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Bottom Specs Bar */}
                    <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-4 font-sans-body">
                      {stage.specs.map((sp, idx2) => (
                        <div key={idx2} className="flex flex-col">
                          <span className="text-[10px] sm:text-[11px] uppercase font-semibold tracking-wider text-white/40">
                            {sp.label}
                          </span>
                          <span className="text-sm sm:text-base font-bold font-mono text-[#E7FE25] mt-0.5">
                            {sp.val}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Studio Bottom Bar */}
        <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-2 pt-2.5 border-t border-[#161616]/10 text-xs font-sans-body text-[#161616]/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#013F32]" />
            <span className="font-medium text-[#161616]">Dolby & Broadcast Master Spec</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>SCROLL OR CLICK STACK TO JUMP</span>
            <span>•</span>
            <span className="text-[#013F32] font-bold">AUTONOMOUS MULTI-AGENT</span>
          </div>
        </div>

      </div>
    </section>
  );
};
