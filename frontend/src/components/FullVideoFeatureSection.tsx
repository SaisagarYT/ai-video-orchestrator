import React, { useState } from 'react';
import { Volume2, VolumeX, Film } from 'lucide-react';

export const FullVideoFeatureSection: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <section className="relative w-full min-h-screen h-screen bg-[#161616] text-[#FDFDFD] overflow-hidden flex flex-col justify-between p-6 sm:p-10 md:p-12 select-none border-t border-white/10">
      
      {/* Full-Page Background Video Canvas Slot (Autoplay & Loop ready) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#161616] via-[#013F32]/40 to-[#161616]">
        
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[65vh] bg-radial from-[#013F32]/80 via-[#013F32]/20 to-transparent blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vh] bg-radial from-[#E7FE25]/10 via-transparent to-transparent blur-2xl pointer-events-none" />

        {/* Cinematic Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(231, 254, 37, 0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* 
          Placeholder Video Container 
          (Autoplay ready: will host <video autoPlay loop muted playsInline className="w-full h-full object-cover" />)
        */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-full h-full border border-white/5 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        </div>
      </div>

      {/* Top HUD Row */}
      <div className="relative z-20 flex items-center justify-between w-full">
        {/* Left: Clean Studio Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#161616]/80 border border-[#013F32] backdrop-blur-md text-xs font-sans-body shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#E7FE25] animate-ping" />
          <span className="text-[#E7FE25] font-semibold uppercase tracking-wider text-[10px]">Commercial Showcase</span>
          <span className="text-white/20">•</span>
          <span className="text-white/80 font-mono text-[11px]">4K 60FPS</span>
        </div>

        {/* Right: Master Output Spec */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161616]/80 border border-white/10 backdrop-blur-md text-xs font-sans-body text-white/70">
          <span className="font-mono text-[11px] text-white/80">DOLBY VISION • MASTER REEL</span>
        </div>
      </div>

      {/* Center Area: Elegant Paragraph Statement */}
      <div className="relative z-20 my-auto text-center max-w-3xl mx-auto px-6">
        <p className="font-serif-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#FDFDFD] font-normal leading-snug tracking-tight drop-shadow-lg">
          From prompt brief to broadcast-grade commercial video in seconds with zero camera crew.
        </p>
      </div>

      {/* Bottom HUD Controls & Metadata */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-4 border-t border-white/10 font-sans-body">
        
        {/* Left: Active Scene Info */}
        <div className="flex items-center gap-3 text-xs text-white/70">
          <Film className="w-4 h-4 text-[#E7FE25]" />
          <span className="text-white/40 hidden sm:inline">Featured Reel:</span>
          <span className="text-white/90 font-medium font-mono truncate max-w-xs sm:max-w-md">
            "Nike Cybernetic Motion • Cinema 2.39:1"
          </span>
        </div>

        {/* Right: Video Media Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-[#161616]/80 hover:bg-[#013F32] text-white/80 hover:text-[#E7FE25] border border-white/10 transition-all cursor-pointer backdrop-blur-md"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

    </section>
  );
};

