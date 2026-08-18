import React, { useEffect, useRef } from 'react';
import { Play, Video, Sparkles } from 'lucide-react';
import gsap from 'gsap';

interface CardItem {
  id: number;
  label: string;
  category: string;
  themeStyle: string;
  accentColor: string;
}

const cardsData: CardItem[] = [
  { id: 1, label: 'Nike Sneaker Commercial', category: 'Brand Ad', themeStyle: 'from-[#013F32] via-[#09221C] to-[#161616]', accentColor: '#E7FE25' },
  { id: 2, label: 'Luxury Hotel Showcase', category: 'Hospitality', themeStyle: 'from-[#161616] via-[#013F32]/60 to-[#161616]', accentColor: '#FDFDFD' },
  { id: 3, label: 'E-Commerce Apparel Reel', category: 'Fashion', themeStyle: 'from-[#013F32]/90 via-[#161616] to-[#013F32]', accentColor: '#E7FE25' },
  { id: 4, label: 'Cyberpunk Energy Drink', category: 'Beverage', themeStyle: 'from-[#161616] via-[#202020] to-[#013F32]', accentColor: '#E7FE25' },
  { id: 5, label: 'SaaS Platform Launch', category: 'Tech Promo', themeStyle: 'from-[#013F32] via-[#161616] to-[#013F32]', accentColor: '#FDFDFD' },
  { id: 6, label: 'Gourmet Restaurant Reel', category: 'Food & Dining', themeStyle: 'from-[#161616] via-[#013F32]/70 to-[#161616]', accentColor: '#E7FE25' },
  { id: 7, label: 'Electric Supercar Teaser', category: 'Automotive', themeStyle: 'from-[#013F32] via-[#0b2821] to-[#161616]', accentColor: '#E7FE25' },
  { id: 8, label: 'Skincare Glow Routine', category: 'Cosmetics', themeStyle: 'from-[#161616] via-[#1d1d1d] to-[#013F32]', accentColor: '#FDFDFD' },
  { id: 9, label: 'Modern Architectural Villa', category: 'Real Estate', themeStyle: 'from-[#013F32]/90 via-[#161616] to-[#013F32]/80', accentColor: '#E7FE25' },
  { id: 10, label: 'Fitness & Gym Wear Ad', category: 'Athletics', themeStyle: 'from-[#161616] via-[#013F32]/50 to-[#161616]', accentColor: '#E7FE25' },
  { id: 11, label: 'Next-Gen Wireless Audio', category: 'Consumer Tech', themeStyle: 'from-[#013F32] via-[#161616] to-[#013F32]', accentColor: '#FDFDFD' },
  { id: 12, label: 'Smart Home Automation', category: 'Smart Tech', themeStyle: 'from-[#161616] via-[#013F32]/80 to-[#161616]', accentColor: '#E7FE25' },
  { id: 13, label: 'Eco Travel Gear', category: 'Outdoor', themeStyle: 'from-[#013F32] via-[#09221C] to-[#161616]', accentColor: '#E7FE25' },
  { id: 14, label: 'Fintech Mobile App', category: 'Finance', themeStyle: 'from-[#161616] via-[#202020] to-[#013F32]', accentColor: '#FDFDFD' },
];

export const HeroArcCarousel: React.FC = () => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!wheelRef.current) return;

    // Smooth, glitch-free continuous hardware-accelerated rotation
    tweenRef.current = gsap.to(wheelRef.current, {
      rotation: 360,
      duration: 60,
      repeat: -1,
      ease: 'none',
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 0.2, duration: 0.8 });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.8 });
    }
  };

  const totalCards = cardsData.length;
  const angleStep = 360 / totalCards;
  // Radius of the circle wheel
  const radius = 640; // in px

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-10"
      style={{
        // Mask bottom half so only the upper arch is prominently visible and fades naturally toward bottom
        maskImage: 'radial-gradient(ellipse 130% 90% at 50% 30%, black 60%, transparent 95%)',
        WebkitMaskImage: 'radial-gradient(ellipse 130% 90% at 50% 30%, black 60%, transparent 95%)',
      }}
    >
      {/* 
        Full Circular Wheel:
        Positioned such that its center is shifted below the hero content.
        The top arc forms the arch around the hero title with ample clearance.
      */}
      <div
        ref={wheelRef}
        className="relative w-0 h-0 will-change-transform"
        style={{
          transform: 'translateY(360px)',
        }}
      >
        {cardsData.map((card, index) => {
          const angle = index * angleStep;

          return (
            <div
              key={card.id}
              className="absolute pointer-events-auto cursor-pointer select-none"
              style={{
                // Place each card around the circular perimeter, rotated radially
                transform: `rotate(${angle}deg) translateY(-${radius}px) translate(-50%, -50%)`,
                transformOrigin: '0 0',
                left: 0,
                top: 0,
              }}
            >
              {/* Blank Video Placeholder Card Component */}
              <div
                className={`group relative w-[170px] sm:w-[195px] md:w-[210px] aspect-[4/5] rounded-[24px] p-1 bg-gradient-to-b ${card.themeStyle} border border-[#013F32]/50 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#E7FE25] hover:shadow-[#013F32]/40`}
                style={{
                  boxShadow: '0 15px 35px -10px rgba(1, 63, 50, 0.3)',
                }}
              >
                {/* Inner Canvas for Video Slot */}
                <div className="relative w-full h-full rounded-[20px] bg-[#161616]/95 overflow-hidden flex flex-col justify-between p-4 border border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#013F32]/40 via-transparent to-[#E7FE25]/10 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Header Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full bg-[#013F32] text-[#E7FE25] border border-[#E7FE25]/20 font-sans-body">
                      {card.category}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center text-white/50 group-hover:text-[#E7FE25] transition-colors">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Center Placeholder */}
                  <div className="relative z-10 my-auto flex flex-col items-center justify-center gap-1.5 text-center px-1">
                    <div className="w-11 h-11 rounded-2xl bg-[#013F32]/70 border border-[#E7FE25]/40 flex items-center justify-center text-[#E7FE25] shadow-lg group-hover:scale-110 group-hover:bg-[#E7FE25] group-hover:text-[#161616] transition-all duration-300">
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    </div>
                    <span className="text-[11px] font-medium text-white/90 group-hover:text-white transition-colors line-clamp-1 font-sans-body">
                      {card.label}
                    </span>
                    <span className="text-[9px] text-white/50 font-sans-body flex items-center gap-1">
                      <Video className="w-2.5 h-2.5 text-[#E7FE25]" />
                      Video Ad Slot
                    </span>
                  </div>

                  {/* Footer Status */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] text-white/40 pt-2 border-t border-white/10 font-sans-body">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E7FE25] animate-ping" />
                      AI Ready
                    </span>
                    <span className="font-mono text-[9px] text-white/60">4K • 60fps</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
