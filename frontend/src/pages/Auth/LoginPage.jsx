import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// ─── Star / Asterisk Logo ────────────────────────────────────────────────────
// Used in both the gradient panel and the form side
const StarIcon = ({ color = '#FFFFFF', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2 L13.2 9.8 L20 7 L15.5 12.8 L22 14.5 L14.8 14.5 L15.5 22 L12 16.5 L8.5 22 L9.2 14.5 L2 14.5 L8.5 12.8 L4 7 L10.8 9.8 Z" />
  </svg>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
const OrDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
      or continue with
    </span>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
  </div>
);

// ─── Social Button ────────────────────────────────────────────────────────────
const SocialButton = ({ icon, label }) => (
  <button
    type="button"
    aria-label={`Continue with ${label}`}
    style={{
      flex: 1,
      height: '42px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-surface-alt)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--text-heading)',
      transition: 'border-color 0.15s ease, background 0.15s ease',
      fontFamily: 'inherit',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--primary)';
      e.currentTarget.style.background = 'var(--primary-light)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.background = 'var(--bg-surface-alt)';
    }}
  >
    {icon}
  </button>
);

// ─── Social icons (inline SVG — no icon library needed) ──────────────────────
const BeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1769FF">
    <path d="M7.803 5.731c.589 0 1.119.051 1.605.155.483.103.895.273 1.243.508.343.235.611.547.804.938.188.387.286.861.286 1.411 0 .603-.145 1.109-.424 1.514-.284.406-.7.741-1.254 1.009.75.231 1.311.639 1.688 1.225.374.586.564 1.293.564 2.119 0 .613-.12 1.147-.359 1.592-.235.447-.568.815-.987 1.107-.422.29-.906.504-1.459.646-.552.141-1.135.212-1.742.212H1V5.731h6.803zm-.351 4.967c.48 0 .878-.114 1.186-.337.311-.226.461-.576.461-1.057 0-.27-.047-.494-.145-.675-.094-.18-.224-.327-.392-.438-.163-.11-.357-.187-.576-.237-.221-.048-.457-.072-.705-.072H3.421v2.816h4.031zm.186 5.174c.267 0 .521-.026.762-.079.242-.054.457-.14.641-.261.187-.12.336-.283.447-.489.11-.207.163-.469.163-.784 0-.614-.172-1.049-.521-1.311-.349-.262-.807-.394-1.369-.394H3.421v3.318h4.217zm8.645.redemption 9.4 9.4 0 0 0 0-13.29 9.4 9.4 0 0 0 13.29 0" />
    <path d="M16.5 8.5h5v1.5h-5z" />
    <path d="M21.5 13.5c-.165 1.966-1.784 3-3.5 3s-3.5-1.5-3.5-3.5 1.5-3.5 3.5-3.5c1.716 0 3.165.8 3.5 2h-1.7c-.25-.7-.95-1-1.8-1-1.1 0-1.9.9-1.9 2s.8 2 1.9 2c.85 0 1.55-.4 1.8-1H21.5z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ─── Main LoginPage ───────────────────────────────────────────────────────────
const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  // Mock submit — replace with real API call later
  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic client-side validation
    const newErrors = {};
    if (!email)    newErrors.email    = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    // Simulate API delay (mock)
    setTimeout(() => {
      setLoading(false);
      alert(`Mock login: ${email}`);
    }, 1500);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>

        {/* ── LEFT PANEL — gradient with tagline ── */}
        <div style={leftPanelStyle}>
          {/* Star logo — top left */}
          <div style={{ position: 'absolute', top: '28px', left: '28px' }}>
            <StarIcon color="#FFFFFF" size={26} />
          </div>

          {/* Bottom tagline */}
          <div style={{ position: 'absolute', bottom: '36px', left: '32px', right: '32px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>
              You can easily
            </p>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#FFFFFF',
              lineHeight: '1.35',
              letterSpacing: '-0.3px',
            }}>
              Get access to your AI video<br />studio for clarity and<br />productivity
            </h2>
          </div>
        </div>

        {/* ── RIGHT PANEL — login form ── */}
        <div style={rightPanelStyle}>
          {/* Star accent icon */}
          <div style={{ marginBottom: '10px' }}>
            <StarIcon color="var(--primary)" size={22} />
          </div>

          <h1 style={headingStyle}>Create an account</h1>
          <p style={subTextStyle}>
            Access your campaigns, assets, and videos anytime —<br />
            and keep everything flowing in one place.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ marginTop: '28px' }}>
            <Input
              id="email"
              label="Your email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              style={{ marginBottom: '20px' }}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              style={{ marginBottom: '24px' }}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              {loading ? 'Signing in…' : 'Get Started'}
            </Button>
          </form>

          {/* Divider */}
          <div style={{ margin: '20px 0' }}>
            <OrDivider />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <SocialButton icon={<BeIcon />}       label="Behance" />
            <SocialButton icon={<GoogleIcon />}   label="Google" />
            <SocialButton icon={<FacebookIcon />} label="Facebook" />
          </div>

          {/* Sign up link */}
          <p style={footerTextStyle}>
            Don't have an account?{' '}
            <a href="/register" style={linkStyle}>Sign up</a>
          </p>
        </div>

      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100vh',
  background: 'var(--bg-page)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const cardStyle = {
  display: 'flex',
  width: '100%',
  maxWidth: '860px',
  minHeight: '520px',
  background: 'var(--bg-surface)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-card)',
  overflow: 'hidden',
};

const leftPanelStyle = {
  position: 'relative',
  width: '42%',
  flexShrink: 0,
  // Gradient extracted from reference: cyan top-left → blue center → deep violet bottom-right
  background: 'radial-gradient(ellipse at 20% 18%, #89D4F5 0%, #4B70E8 45%, #6B2FD9 85%)',
  borderRadius: 'var(--radius-xl)',   // matches card but panel rounds its own corners too
};

const rightPanelStyle = {
  flex: 1,
  padding: '48px 44px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const headingStyle = {
  fontSize: '28px',
  fontWeight: '800',
  color: 'var(--text-heading)',
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
  marginBottom: '10px',
};

const subTextStyle = {
  fontSize: '14px',
  color: 'var(--text-body)',
  lineHeight: '1.6',
};

const footerTextStyle = {
  marginTop: '20px',
  fontSize: '14px',
  color: 'var(--text-body)',
  textAlign: 'center',
};

const linkStyle = {
  color: 'var(--primary)',
  fontWeight: '600',
  textDecoration: 'none',
};

export default LoginPage;
