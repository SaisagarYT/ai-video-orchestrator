import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  Zap,
  Film,
  Layers,
  Cpu,
  ShieldCheck,
  Play,
  ChevronRight,
  Star,
  Globe,
  Clock,
} from 'lucide-react';

/* ─── Pill Badge ─────────────────────────────────────────── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border border-[#E7FE25]/30 text-[#E7FE25] bg-[#E7FE25]/8 select-none">
      {children}
    </span>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E]">
      <span className="text-3xl font-black text-[#E7FE25] tracking-tight">{value}</span>
      <span className="text-[11px] font-semibold text-[#666] uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ─── Feature Card ───────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-2xl bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#E7FE25]/30 transition-all duration-300 space-y-4">
      <div className="h-11 w-11 rounded-xl bg-[#E7FE25]/10 border border-[#E7FE25]/20 flex items-center justify-center text-[#E7FE25] group-hover:bg-[#E7FE25]/15 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-extrabold text-white mb-1.5">{title}</h3>
        <p className="text-xs text-[#666] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Pipeline Step ──────────────────────────────────────── */
function PipelineStep({
  number,
  label,
  description,
  isLast = false,
}: {
  number: string;
  label: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[#E7FE25] text-black text-xs font-black flex items-center justify-center">
          {number}
        </div>
        {!isLast && <div className="flex-1 w-px bg-[#1E1E1E] mt-2" />}
      </div>
      <div className={`pb-6 ${isLast ? '' : ''}`}>
        <p className="text-sm font-extrabold text-white">{label}</p>
        <p className="text-xs text-[#666] mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ──────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/campaigns');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white font-app overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[#141414] bg-[#060606]/90 backdrop-blur-md flex items-center px-6 justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#E7FE25] flex items-center justify-center">
            <Film className="h-4 w-4 text-black" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">KANGGIRD</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#888]">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-[#888] hover:text-white transition-colors px-3 py-2 cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={handleCTA}
            className="h-8 px-4 rounded-xl bg-[#E7FE25] text-black text-xs font-black hover:bg-[#D5EC1E] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            Get Started <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 text-center relative">
        {/* Radial glow behind hero text */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#E7FE25]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-8">
          <Pill>
            <Zap className="h-3 w-3" />
            AI-Powered Ad Film Orchestration
          </Pill>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            <span className="text-white">Produce</span>{' '}
            <span className="text-[#E7FE25]">video ads</span>
            <br />
            <span className="text-white">at machine speed.</span>
          </h1>

          <p className="text-base md:text-lg text-[#777] max-w-2xl mx-auto leading-relaxed">
            KANGGIRD is the production studio for AI-generated advertisement films. From brief to broadcast-ready video in 9 automated stages — strategy, storyboard, scene generation, and final render.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleCTA}
              className="h-12 px-8 rounded-2xl bg-[#E7FE25] text-black font-black text-sm hover:bg-[#D5EC1E] transition-all duration-200 hover:shadow-[0_0_32px_-4px_rgba(231,254,37,0.5)] cursor-pointer flex items-center gap-2"
            >
              Start Creating Free <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="h-12 px-8 rounded-2xl border border-[#2A2A2A] text-white font-bold text-sm hover:border-[#3A3A3A] hover:bg-[#0E0E0E] transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="h-4 w-4 text-[#E7FE25]" /> Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────── */}
      <section className="py-10 px-6 border-y border-[#111]">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="9" label="Pipeline Stages" />
          <StatCard value="5×" label="Faster than Manual" />
          <StatCard value="4K" label="Output Quality" />
          <StatCard value="3" label="Aspect Ratios" />
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <Pill><Star className="h-3 w-3" /> Capabilities</Pill>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Everything your production needs
            </h2>
            <p className="text-sm text-[#666] max-w-xl mx-auto">
              A full-stack AI creative suite — from brand brief to rendered video — running in a single orchestrated pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Film className="h-5 w-5" />}
              title="AI Strategy Synthesis"
              description="Gemini 2.5 Flash analyzes your brand brief and generates a structured creative strategy with audience targeting and tone profiles."
            />
            <FeatureCard
              icon={<Layers className="h-5 w-5" />}
              title="Multi-Concept Exploration"
              description="Generate 3 parallel creative concepts (A/B/C variants) with distinct visual identities, voice, and storyboard directions."
            />
            <FeatureCard
              icon={<Cpu className="h-5 w-5" />}
              title="Scene-by-Scene Generation"
              description="Each storyboard shot is independently generated using Seedance, Kling, or Higgsfield — the best model for each motion type."
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5" />}
              title="Multi-Track Timeline"
              description="Assemble, trim, and sequence all generated scenes in a non-destructive timeline editor with frame-accurate controls."
            />
            <FeatureCard
              icon={<Globe className="h-5 w-5" />}
              title="Multi-Format Export"
              description="Render the final film simultaneously in 16:9 (YouTube/Desktop), 9:16 (Reels/TikTok), and 1:1 (Social Feed) resolutions."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Consistency QA Engine"
              description="Automated evaluation checks brand colour fidelity, logo placement, motion consistency, and pacing before final render."
            />
          </div>
        </div>
      </section>

      {/* ── 9-Stage Pipeline ────────────────────────── */}
      <section id="pipeline" className="py-24 px-6 bg-[#080808]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <Pill><Zap className="h-3 w-3" /> Workflow</Pill>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              9-stage orchestration pipeline
            </h2>
            <p className="text-sm text-[#666] max-w-xl mx-auto">
              Each stage is a self-contained workspace. Work through them sequentially or jump to any stage with your team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
            <div>
              <PipelineStep number="01" label="Creative Brief & Brand Context" description="Upload brand guidelines, describe objectives, and set audience parameters." />
              <PipelineStep number="02" label="AI Strategy Synthesis" description="AI generates positioning, tone, platform mix, and messaging angles." />
              <PipelineStep number="03" label="Multi-Concept Exploration" description="3 parallel creative concepts generated for selection and refinement." />
              <PipelineStep number="04" label="Storyboard & Shot Decomposition" description="Each concept broken into scene-by-scene visual storyboard frames." />
              <PipelineStep number="05" label="Scene Asset Generation" description="Multi-modal AI renders each shot using the best model per motion type." isLast />
            </div>
            <div className="mt-0 md:mt-[72px]">
              <PipelineStep number="06" label="Consistency & QA Evaluation" description="Automated checks for brand integrity, motion continuity, and pacing." />
              <PipelineStep number="07" label="Multi-Track Timeline Editor" description="Assemble and sequence all scenes with frame-accurate editing tools." />
              <PipelineStep number="08" label="Master Compilation & Render" description="Full-resolution master render with concurrent multi-format output." />
              <PipelineStep number="09" label="Final Review & Version Export" description="Review, branch versions, and export to distribution platforms." isLast />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Ready to produce your first ad film?
          </h2>
          <p className="text-sm text-[#666]">
            Create an account and launch your first campaign in under 5 minutes.
          </p>
          <button
            type="button"
            onClick={handleCTA}
            className="h-14 px-10 rounded-2xl bg-[#E7FE25] text-black font-black text-base hover:bg-[#D5EC1E] transition-all duration-200 hover:shadow-[0_0_48px_-4px_rgba(231,254,37,0.5)] cursor-pointer inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-xs text-[#555]">No credit card required · Full access in seconds</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-[#111] py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-[#E7FE25] flex items-center justify-center">
            <Film className="h-3.5 w-3.5 text-black" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-[#888]">KANGGIRD</span>
        </div>
        <p className="text-[11px] text-[#555]">
          © {new Date().getFullYear()} KANGGIRD. AI Advertisement Orchestration Platform.
        </p>
        <div className="flex items-center gap-5 text-[11px] font-semibold text-[#666]">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
