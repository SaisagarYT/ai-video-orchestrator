import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
  onClose?: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthPage({ onClose, initialMode = 'login' }: AuthPageProps) {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const navigate = useNavigate();

  // Form Fields matching Backend Schemas
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (onClose) onClose();
      navigate('/campaigns', { replace: true });
    }
  }, [isAuthenticated, navigate, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations matching backend constraints
    if (mode === 'register') {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (fullName.length < 2) {
        setError('Full name must be at least 2 characters.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await register(fullName, email.trim(), password);
      }
      if (onClose) onClose();
      // Automatically redirect logged-in user to the workspace dashboard
      navigate('/campaigns', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response: { data?: { detail?: string | Array<{ msg?: string }> } } }).response?.data?.detail !== 'undefined'
      ) {
        const detail = (err as { response: { data: { detail: string | Array<{ msg?: string }> } } }).response.data.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
          setError(detail[0].msg);
        } else {
          setError('Validation error occurred.');
        }
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/campaigns');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060606] p-3 sm:p-4 flex items-center justify-center font-app overflow-hidden box-border select-none">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414]/90 hover:bg-[#202020] text-xs text-[#868E96] hover:text-white border border-[#2A2A2A] transition-all cursor-pointer backdrop-blur-md shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Workspace</span>
      </button>

      {/* Main Full-Size Card */}
      <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#1C1C1C] bg-[#0A0A0A] shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT PANEL: Ambient Forest Gradient & Stepper Cards (5.5 cols) */}
        <div className="lg:col-span-5 relative p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#013F32] via-[#01261E] to-[#04120E]">
          {/* Ambient Lighting Mesh */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#025745]/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-[#E7FE25]/10 blur-3xl pointer-events-none" />

          {/* Center Heading Section */}
          <div className="relative z-10 my-auto py-8 space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              Get Started
              <br />
              with Us
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-sm leading-relaxed">
              Complete these easy steps to register your account and launch autonomous video campaigns.
            </p>
          </div>

          {/* Bottom 3 Sequential Step Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-4">
            {/* Step 1: Active White Card */}
            <div className="p-4 rounded-xl bg-white text-[#161616] shadow-xl flex flex-col justify-between min-h-[110px] transition-transform">
              <div className="h-6 w-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                1
              </div>
              <div className="text-xs font-bold leading-tight mt-3">
                Sign up your account
              </div>
            </div>

            {/* Step 2: Translucent Emerald Card */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-white flex flex-col justify-between min-h-[110px]">
              <div className="h-6 w-6 rounded-full bg-white/20 text-white/80 text-xs font-bold flex items-center justify-center">
                2
              </div>
              <div className="text-xs font-medium leading-tight mt-3 text-white/70">
                Set up your workspace
              </div>
            </div>

            {/* Step 3: Translucent Emerald Card */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-white flex flex-col justify-between min-h-[110px]">
              <div className="h-6 w-6 rounded-full bg-white/20 text-white/80 text-xs font-bold flex items-center justify-center">
                3
              </div>
              <div className="text-xs font-medium leading-tight mt-3 text-white/70">
                Set up your profile
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Wide & Tall Form Deck (6.5 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#0C0C0C] overflow-y-auto">
          <div className="max-w-[480px] w-full mx-auto space-y-7 my-auto">
            {/* Header */}
            <div className="space-y-1.5 text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {mode === 'register' ? 'Sign Up Account' : 'Sign In to Account'}
              </h3>
              <p className="text-sm text-[#868E96]">
                {mode === 'register'
                  ? 'Enter your personal data to create your account.'
                  : 'Enter your credentials to access your account.'}
              </p>
            </div>

            {/* Social Auth Buttons */}
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <button
                type="button"
                className="flex items-center justify-center gap-2.5 h-12 px-4 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-[#242424] text-sm font-medium text-white transition-all cursor-pointer shadow-sm"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-1.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2.5 h-12 px-4 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-[#242424] text-sm font-medium text-white transition-all cursor-pointer shadow-sm"
              >
                <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Github</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-[#222222]" />
              <span className="absolute bg-[#0C0C0C] px-3.5 text-xs text-[#666666]">
                Or
              </span>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3.5 rounded-xl bg-[#FA5252]/10 border border-[#FA5252]/30 flex items-center gap-2.5 text-xs text-[#FA5252]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4.5">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-medium text-[#D8D8D8]">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      placeholder="eg. John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full h-12 px-4 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#555555] transition-colors"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-medium text-[#D8D8D8]">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      placeholder="eg. Francisco"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full h-12 px-4 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#555555] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 text-left">
                <label className="block text-sm font-medium text-[#D8D8D8]">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="eg. johnfrans@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full h-12 px-4 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#555555] transition-colors"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-sm font-medium text-[#D8D8D8]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    disabled={isLoading}
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#555555] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="text-xs text-[#666666] pt-0.5">
                    Must be at least 8 characters.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-4 rounded-xl bg-white hover:bg-[#EAEAEA] text-[#161616] font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : mode === 'register' ? (
                  'Sign Up'
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Toggle Link */}
            <div className="text-center text-sm text-[#868E96] pt-1">
              {mode === 'register' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                    }}
                    className="text-white hover:underline font-semibold cursor-pointer ml-1"
                  >
                    Log in
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('register');
                    }}
                    className="text-white hover:underline font-semibold cursor-pointer ml-1"
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
