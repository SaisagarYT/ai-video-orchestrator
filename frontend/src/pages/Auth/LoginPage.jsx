import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Input from '../../components/ui/Input';
import './LoginPage.css';

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
    <div className="auth-mode-toggle">
      {/* Smooth Sliding Background Pill */}
      <div 
        className="auth-mode-pill"
        style={{
          left: mode === 'signin' ? '4px' : 'calc(50% + 2px)',
        }} 
      />

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
  <div className="auth-or-divider">
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #E2E8F0)' }} />
    <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      or
    </span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #E2E8F0, transparent)' }} />
  </div>
);

// ─── Tactile Social Button with Iconify ───────────────────────────────────────
const SocialAuthButton = ({ iconName, label, color }) => {
  return (
    <button
      type="button"
      className="auth-social-btn"
    >
      <Icon icon={iconName} width="18" height="18" style={{ color }} />
      <span>{label}</span>
    </button>
  );
};

// ─── Social Proof & Trust Strip (Conversion Multiplier) ──────────────────────
const SocialProofTrustStrip = () => {
  return (
    <div className="auth-trust-strip">
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
  const [mode, setMode]                         = useState('signin'); // 'signin' | 'signup'
  const [fullName, setFullName]                 = useState('');
  const [email, setEmail]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [loading, setLoading]                   = useState(false);
  const [errors, setErrors]                     = useState({});
  const [btnHover, setBtnHover]                 = useState(false);

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
    <div className="auth-page-container">
      {/* Ambient background glow orbs */}
      <div className="auth-ambient-top-left" />
      <div className="auth-ambient-bottom-right" />

      {/* ── Unified Ultra-SaaS Card ─────────────────────────────────────────── */}
      <div className="auth-card">

        {/* ── LEFT — Form Side ──────────────────────────────────────────────── */}
        <div className="auth-form-panel">

          {/* Very Top: Mode Switcher Toggle */}
          <AuthModeToggle mode={mode} setMode={setMode} />

          {/* Logo & Header Title */}
          <div className="auth-header-logo">
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
          <div className="auth-headline-block">
            <h1 className="auth-headline-title">
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
            <p className="auth-headline-subtitle">
              {isSignUp 
                ? 'Generate high-converting AI video commercials in seconds.' 
                : 'Welcome back! Please enter your credentials to continue.'}
            </p>
          </div>

          {/* Social Auth with Iconify */}
          <div className="auth-social-group">
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
          <form onSubmit={handleSubmit} className="auth-form-wrapper">
            
            {/* Full Name field (Sign Up only) */}
            <div 
              className="auth-input-item"
              style={{
                maxHeight: isSignUp ? '86px' : '0px',
                opacity: isSignUp ? 1 : 0,
                transform: isSignUp ? 'translateY(0)' : 'translateY(-6px)',
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, transform 0.25s ease, margin-bottom 0.25s ease',
                marginBottom: isSignUp ? '8px' : '0px',
              }}
            >
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
            <div className="auth-input-item">
              <Input
                id="email"
                label="Work Email"
                icon="solar:letter-bold-duotone"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
            </div>

            {/* Password header with aligned link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor="password" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                Password
              </label>
              {!isSignUp && (
                <a href="/forgot-password" style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: '#4F46E5', fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}>
                  Forgot password?
                </a>
              )}
            </div>

            <div className="auth-input-item" style={{ marginBottom: isSignUp ? '8px' : '14px' }}>
              <Input
                id="password"
                icon="solar:lock-password-bold-duotone"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
            </div>

            {/* Confirm Password (Sign Up only) */}
            <div 
              className="auth-input-item"
              style={{
                maxHeight: isSignUp ? '86px' : '0px',
                opacity: isSignUp ? 1 : 0,
                transform: isSignUp ? 'translateY(0)' : 'translateY(-6px)',
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, transform 0.25s ease, margin-bottom 0.25s ease',
                marginBottom: isSignUp ? '12px' : '0px',
              }}
            >
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
              className="auth-cta-btn"
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
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
        <div className="auth-image-panel">
          {/* Base Artwork Image */}
          <img
            src="/images/creative-ecstasy.png"
            alt="Creative Ecstasy AI Poster"
            className="auth-image"
          />

          {/* Vignette & Ambient Glow Overlay */}
          <div className="auth-image-overlay" />

          {/* 🌟 Hook Badge 1: Top Floating Engine Status Badge */}
          <div className="auth-status-badge">
            {/* Pulsating Emerald Dot */}
            <span className="auth-status-dot" />
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
          <div className="auth-feature-pill">
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

export default LoginPage;
