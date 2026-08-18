import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Check, ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
  onClose?: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthPage({ onClose, initialMode = 'login' }: AuthPageProps) {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const navigate = useNavigate();

  // Form Fields
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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

  // Password Strength Evaluation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-zinc-700', checks: { length: false, mixed: false, numberOrSymbol: false, notCommon: true } };

    const hasMinLength = password.length >= 8;
    const hasGreatLength = password.length >= 12;
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasDigitOrSymbol = /[\d\W]/.test(password);
    const commonBreached = ['password', 'password123', '12345678', 'qwerty123', 'admin123', 'kanggird123'];
    const isNotCommon = !commonBreached.includes(password.toLowerCase().trim());

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasGreatLength) score += 1;
    if (hasMixedCase) score += 1;
    if (hasDigitOrSymbol) score += 1;
    if (!isNotCommon) score = 1;

    let label = 'Weak';
    let color = 'bg-rose-500';

    if (score >= 4) {
      label = 'Very Strong';
      color = 'bg-emerald-400';
    } else if (score === 3) {
      label = 'Strong';
      color = 'bg-teal-400';
    } else if (score === 2) {
      label = 'Fair';
      color = 'bg-amber-400';
    }

    return {
      score,
      label,
      color,
      checks: {
        length: hasMinLength,
        mixed: hasMixedCase,
        numberOrSymbol: hasDigitOrSymbol,
        notCommon: isNotCommon,
      }
    };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (fullName.length < 2) {
        setError('Full name must be at least 2 characters.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await register(fullName, trimmedEmail, password);
      }
      if (onClose) onClose();
      navigate('/campaigns', { replace: true });
    } catch (err: unknown) {
      if (
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
      } else if (err instanceof Error) {
        setError(err.message);
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
        {/* LEFT PANEL: Ambient Forest Gradient & Stepper Cards */}
        <div className="lg:col-span-5 relative p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#013F32] via-[#01261E] to-[#04120E]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#025745]/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-[#E7FE25]/10 blur-3xl pointer-events-none" />

          {/* Brand Heading Section */}
          <div className="relative z-10 my-auto py-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>OWASP Enterprise Security</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              KANGGIRD
              <br />
              <span className="text-white/80 font-normal">Ad Studio</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-sm leading-relaxed">
              Log in to access your secure AI video workspace, creative strategies, and multi-modal scene generations.
            </p>
          </div>

          {/* Bottom Step Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-4">
            <div className="p-4 rounded-xl bg-white text-[#161616] shadow-xl flex flex-col justify-between min-h-[110px]">
              <div className="h-6 w-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                1
              </div>
              <div className="text-xs font-bold leading-tight mt-3">
                Secure Session
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-white flex flex-col justify-between min-h-[110px]">
              <div className="h-6 w-6 rounded-full bg-white/20 text-white/80 text-xs font-bold flex items-center justify-center">
                2
              </div>
              <div className="text-xs font-medium leading-tight mt-3 text-white/70">
                Argon2id Shield
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-white flex flex-col justify-between min-h-[110px]">
              <div className="h-6 w-6 rounded-full bg-white/20 text-white/80 text-xs font-bold flex items-center justify-center">
                3
              </div>
              <div className="text-xs font-medium leading-tight mt-3 text-white/70">
                Isolated Assets
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Form Deck */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-[#0C0C0C] overflow-y-auto">
          <div className="max-w-[480px] w-full mx-auto space-y-6 my-auto">
            {/* Header */}
            <div className="space-y-1.5 text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {mode === 'register' ? 'Create Secure Account' : 'Welcome Back'}
              </h3>
              <p className="text-sm text-[#868E96]">
                {mode === 'register'
                  ? 'Register with your name, email, and a secure passphrase.'
                  : 'Enter your credentials to access your protected workspace.'}
              </p>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-[#A0A0A0]">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-emerald-500/60 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-[#A0A0A0]">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-emerald-500/60 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-[#A0A0A0]">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="jane.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-[#A0A0A0]">Password</label>
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
                    className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-[#141414] border border-[#242424] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-emerald-500/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Meter on Registration */}
                {mode === 'register' && password && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#888]">Password Strength:</span>
                      <span className={`font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#202020] rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'} w-1/4`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'} w-1/4`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'} w-1/4`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'} w-1/4`} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-[#777] pt-0.5">
                      <span className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-emerald-400' : ''}`}>
                        <Check className="h-2.5 w-2.5" /> 8+ Characters
                      </span>
                      <span className={`flex items-center gap-1 ${passwordStrength.checks.mixed ? 'text-emerald-400' : ''}`}>
                        <Check className="h-2.5 w-2.5" /> Mixed Case
                      </span>
                      <span className={`flex items-center gap-1 ${passwordStrength.checks.numberOrSymbol ? 'text-emerald-400' : ''}`}>
                        <Check className="h-2.5 w-2.5" /> Numbers or Symbols
                      </span>
                      <span className={`flex items-center gap-1 ${passwordStrength.checks.notCommon ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <Check className="h-2.5 w-2.5" /> Not Common
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field on Registration */}
              {mode === 'register' && (
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-[#A0A0A0]">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className={`w-full h-11 pl-3.5 pr-11 rounded-xl bg-[#141414] border ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-rose-500/70 focus:border-rose-500'
                          : confirmPassword && confirmPassword === password
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : 'border-[#242424] focus:border-emerald-500/60'
                      } text-sm text-white placeholder:text-[#555555] focus:outline-none transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[11px] text-rose-400 text-left">Passwords do not match.</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (mode === 'register' && (password.length < 8 || password !== confirmPassword))}
                className="w-full h-11 mt-3 rounded-xl bg-white hover:bg-[#EAEAEA] text-[#161616] font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : mode === 'register' ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center text-xs text-[#868E96] pt-1">
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
                    Sign In
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
                    Create One
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
