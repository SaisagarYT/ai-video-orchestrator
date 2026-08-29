import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Input from '../../components/ui/Input';

// ─── Modern AI Brand Logo ───────────────────────────────────────────────────
const LogoMark = () => (
  <div style={{
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    flexShrink: 0,
  }}>
    <Icon icon="solar:stars-minimalistic-bold-duotone" width="22" height="22" />
  </div>
);

// ─── Sleek Animated Mode Toggle (Sign In / Sign Up) ──────────────────────────
const AuthModeToggle = ({ mode, setMode }) => {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      background: '#F1F5F9',
      padding: '4px',
      borderRadius: '14px',
      border: '1px solid #E2E8F0',
      width: '100%',
      marginBottom: '18px',
      userSelect: 'none',
    }}>
      {/* Smooth Sliding Background Pill */}
      <div style={{
        position: 'absolute',
        top: '4px',
        bottom: '4px',
        left: mode === 'signin' ? '4px' : 'calc(50% + 2px)',
        width: 'calc(50% - 6px)',
        background: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        transition: 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 0,
      }} />

      {/* Sign In Tab */}
      <button
        type="button"
        onClick={() => setMode('signin')}
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          border: 'none',
          background: 'transparent',
          padding: '8px 0',
          fontSize: '14px',
          fontWeight: mode === 'signin' ? '700' : '500',
          color: mode === 'signin' ? '#0F172A' : '#64748B',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'color 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <Icon icon="solar:login-2-linear" width="16" height="16" />
        <span>Sign In</span>
      </button>

      {/* Sign Up Tab */}
      <button
        type="button"
        onClick={() => setMode('signup')}
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          border: 'none',
          background: 'transparent',
          padding: '8px 0',
          fontSize: '14px',
          fontWeight: mode === 'signup' ? '700' : '500',
          color: mode === 'signup' ? '#0F172A' : '#64748B',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'color 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <Icon icon="solar:user-plus-linear" width="16" height="16" />
        <span>Sign Up</span>
      </button>
    </div>
  );
};

// ─── Sleek Gradient Divider ───────────────────────────────────────────────────
const OrDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '4px 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #E2E8F0)' }} />
    <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      or
    </span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #E2E8F0, transparent)' }} />
  </div>
);

// ─── Tactile Social Button with Iconify ───────────────────────────────────────
const SocialAuthButton = ({ iconName, label, color }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        background: hovered ? '#F8FAFC' : '#FFFFFF',
        border: `1px solid ${hovered ? '#CBD5E1' : '#E2E8F0'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '13.5px',
        fontWeight: '500',
        color: '#1E293B',
        fontFamily: 'inherit',
        boxShadow: hovered 
          ? '0 3px 8px rgba(0, 0, 0, 0.05)' 
          : '0 1px 2px rgba(0, 0, 0, 0.03)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Icon icon={iconName} width="18" height="18" style={{ color }} />
      <span>{label}</span>
    </button>
  );
};

// ─── Social Proof & Trust Strip (Conversion Multiplier) ──────────────────────
const SocialProofTrustStrip = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '16px',
      paddingTop: '14px',
      borderTop: '1px dashed #E2E8F0',
    }}>
      {/* Overlapping User Avatars */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {[
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
        ].map((avatar, idx) => (
          <img
            key={idx}
            src={avatar}
            alt="User avatar"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              border: '2px solid #FFFFFF',
              marginLeft: idx === 0 ? 0 : '-7px',
              objectFit: 'cover',
            }}
          />
        ))}
      </div>

      {/* Stars & Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', color: '#F59E0B' }}>
          {[...Array(5)].map((_, i) => (
            <Icon key={i} icon="solar:star-bold" width="12" height="12" />
          ))}
        </div>
        <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748B' }}>
          4.9/5 · 10k+ video creators & brands
        </span>
      </div>
    </div>
  );
};

// ─── Main Unified Auth Page ───────────────────────────────────────────────────
const LoginPage = () => {
  const [mode, setMode]                 = useState('signin'); // 'signin' | 'signup'
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});
  const [btnHover, setBtnHover]         = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (mode === 'signup' && !fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (mode === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setLoading(true);
    setErrors({});
    setTimeout(() => setLoading(false), 1200);
  };

  const isSignUp = mode === 'signup';

  return (
    <div style={pageStyle}>
      {/* Ambient background glow orbs */}
      <div style={ambientGlowTopLeft} />
      <div style={ambientGlowBottomRight} />

      {/* ── Unified Ultra-SaaS Card ─────────────────────────────────────────── */}
      <div style={combinedCardStyle}>

        {/* ── LEFT — Form Side ──────────────────────────────────────────────── */}
        <div style={formPanelStyle}>

          {/* Very Top: Mode Switcher Toggle */}
          <AuthModeToggle mode={mode} setMode={setMode} />

          {/* Logo & Header Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <LogoMark />
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: '700',
              color: '#0F172A',
              letterSpacing: '-0.01em',
            }}>
              Orchestrator Studio
            </span>
          </div>

          {/* Dynamic Headline with Smooth Transition */}
          <div style={{ minHeight: '58px', transition: 'all 0.3s ease' }}>
            <h1 style={headingStyle}>
              {isSignUp ? (
                <>
                  Create your{' '}
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontWeight: '400',
                    fontSize: '32px',
                    color: '#4F46E5',
                  }}>
                    Account
                  </span>
                </>
              ) : (
                <>
                  Sign in to your{' '}
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontWeight: '400',
                    fontSize: '32px',
                    color: '#4F46E5',
                  }}>
                    Studio
                  </span>
                </>
              )}
            </h1>
            <p style={subtitleStyle}>
              {isSignUp 
                ? 'Generate high-converting AI video commercials in seconds.' 
                : 'Welcome back! Please enter your credentials to continue.'}
            </p>
          </div>

          {/* Social Auth with Iconify */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0 12px 0' }}>
            <SocialAuthButton 
              iconName="logos:google-icon" 
              label={isSignUp ? 'Sign up with Google' : 'Continue with Google'} 
            />
            <SocialAuthButton 
              iconName="simple-icons:apple" 
              label={isSignUp ? 'Sign up with Apple' : 'Continue with Apple'} 
              color="#0F172A"
            />
          </div>

          <OrDivider />

          {/* Animated Auth Form */}
          <form onSubmit={handleSubmit} style={{ marginTop: '10px' }}>
            
            {/* Full Name field (Sign Up only) */}
            <div style={{
              maxHeight: isSignUp ? '76px' : '0px',
              opacity: isSignUp ? 1 : 0,
              transform: isSignUp ? 'translateY(0)' : 'translateY(-8px)',
              overflow: 'hidden',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              marginBottom: isSignUp ? '10px' : '0px',
            }}>
              <Input
                id="fullName"
                label="Full Name"
                icon="solar:user-bold-duotone"
                type="text"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
              />
            </div>

            {/* Email Field */}
            <Input
              id="email"
              label="Work Email"
              icon="solar:letter-bold-duotone"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              style={{ marginBottom: '10px' }}
            />

            {/* Password header with aligned link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label htmlFor="password" style={labelStyle}>Password</label>
              {!isSignUp && (
                <a href="/forgot-password" style={forgotLinkStyle}>Forgot password?</a>
              )}
            </div>

            <Input
              id="password"
              icon="solar:lock-password-bold-duotone"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              style={{ marginBottom: isSignUp ? '10px' : '16px' }}
            />

            {/* Confirm Password (Sign Up only) */}
            <div style={{
              maxHeight: isSignUp ? '76px' : '0px',
              opacity: isSignUp ? 1 : 0,
              transform: isSignUp ? 'translateY(0)' : 'translateY(-8px)',
              overflow: 'hidden',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              marginBottom: isSignUp ? '16px' : '0px',
            }}>
              <Input
                id="confirmPassword"
                label="Confirm Password"
                icon="solar:shield-check-bold-duotone"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
              />
            </div>

            {/* Premium SaaS CTA Button with Shimmer */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: '100%',
                height: '46px',
                background: btnHover 
                  ? 'linear-gradient(180deg, #6366F1 0%, #4338CA 100%)' 
                  : 'linear-gradient(180deg, #4F46E5 0%, #3730A3 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                boxShadow: btnHover 
                  ? '0 8px 22px rgba(79, 70, 229, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                  : '0 4px 14px rgba(79, 70, 229, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
                transform: btnHover && !loading ? 'translateY(-1px)' : 'translateY(0)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <Icon icon="lucide:loader-2" width="16" height="16" className="animate-spin" />
                  <span>{isSignUp ? 'Setting up workspace...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Studio Workspace' : 'Sign in to Workspace'}</span>
                  <Icon icon="lucide:arrow-right" width="16" height="16" />
                </>
              )}
            </button>
          </form>

          {/* Social Proof & Trust Strip */}
          <SocialProofTrustStrip />

        </div>

        {/* ── RIGHT — Artistic Canvas Panel with Floating Feature Badges ─────── */}
        <div style={imagePanelStyle}>
          {/* Base Artwork Image */}
          <img
            src="/images/creative-ecstasy.png"
            alt="Creative Ecstasy AI Poster"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
            }}
          />

          {/* Vignette & Ambient Glow Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(15,15,26,0.3) 0%, rgba(15,15,26,0.7) 100%)',
          }} />

          {/* 🌟 Hook Badge 1: Top Floating Engine Status Badge */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '30px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}>
            {/* Pulsating Emerald Dot */}
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 10px #10B981',
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#FFFFFF',
              letterSpacing: '0.02em',
            }}>
              12-Stage AI Engine Active
            </span>
          </div>

          {/* 🌟 Hook Badge 2: Bottom Floating Feature Pill */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '20px',
            right: '20px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(79, 70, 229, 0.25)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818CF8',
              }}>
                <Icon icon="solar:videocamera-record-bold-duotone" width="18" height="18" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF', lineHeight: 1.2 }}>
                  Cinema-Quality Ad Assembly
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  4K 60FPS · Ken Burns · Neural Audio
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#A5B4FC',
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.04em',
            }}>
              4K PRO
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  background: 'radial-gradient(1200px circle at 50% 10%, #F5F5FE 0%, #EDEDFC 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const ambientGlowTopLeft = {
  position: 'absolute',
  top: '8%',
  left: '20%',
  width: '450px',
  height: '450px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(129, 140, 248, 0.22) 0%, rgba(237, 237, 252, 0) 70%)',
  pointerEvents: 'none',
  filter: 'blur(50px)',
};

const ambientGlowBottomRight = {
  position: 'absolute',
  bottom: '5%',
  right: '22%',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(192, 132, 252, 0.18) 0%, rgba(237, 237, 252, 0) 70%)',
  pointerEvents: 'none',
  filter: 'blur(50px)',
};

const combinedCardStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  width: '100%',
  maxWidth: '960px',
  maxHeight: '94vh',
  background: '#FFFFFF',
  borderRadius: '24px',
  boxShadow: '0 25px 60px -15px rgba(50, 45, 120, 0.16), 0 0 0 1px rgba(226, 232, 240, 0.8), 0 2px 6px rgba(0, 0, 0, 0.02)',
  overflow: 'hidden',
};

const formPanelStyle = {
  width: '460px',
  flexShrink: 0,
  padding: '28px 36px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  background: '#FFFFFF',
  overflowY: 'auto',
};

const imagePanelStyle = {
  flex: 1,
  position: 'relative',
  background: '#12131A',
  overflow: 'hidden',
  display: 'flex',
};

const headingStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '25px',
  fontWeight: '700',
  color: '#0F172A',
  letterSpacing: '-0.025em',
  lineHeight: '1.2',
  margin: 0,
};

const subtitleStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: '#64748B',
  marginTop: '4px',
  lineHeight: '1.45',
};

const labelStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  fontWeight: '600',
  color: '#334155',
};

const forgotLinkStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '12.5px',
  color: '#4F46E5',
  fontWeight: '600',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'color 0.15s',
};

export default LoginPage;
