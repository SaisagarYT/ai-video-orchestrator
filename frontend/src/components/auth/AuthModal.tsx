import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Badge,
} from '../ui';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }
        await register(fullName, email, password);
      }
      // Close modal on success
      onOpenChange(false);
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response: { data?: { detail?: string } } }).response?.data?.detail === 'string'
      ) {
        setError((err as { response: { data: { detail: string } } }).response.data.detail);
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-[var(--bg-surface)] border-[var(--border-default)]">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--brand-lime)] flex items-center justify-center text-[#161616] font-bold text-xs shadow-[var(--shadow-glow-lime)]">
              K
            </div>
            <Badge variant="lime" size="sm">
              Studio Access
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {mode === 'login' ? 'Sign in to KANGGIRD' : 'Create your Studio Account'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--text-muted)]">
            {mode === 'login'
              ? 'Enter your credentials to access your autonomous video studio.'
              : 'Start orchestrating broadcast-grade AI video campaigns in minutes.'}
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 flex items-center gap-2 text-xs text-[var(--color-destructive)] animate-in fade-in-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {mode === 'register' && (
            <div>
              <Label required>Full Name</Label>
              <Input
                type="text"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <Label required>Work Email Address</Label>
            <Input
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label required>Password</Label>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 font-semibold"
            isLoading={isLoading}
            leftIcon={!isLoading ? <Sparkles className="h-4 w-4" /> : undefined}
          >
            {mode === 'login' ? 'Sign In to Workspace' : 'Create Free Account'}
          </Button>

          <div className="pt-2 text-center text-xs text-[var(--text-muted)]">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[var(--brand-lime)] hover:underline font-medium cursor-pointer ml-1"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[var(--brand-lime)] hover:underline font-medium cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
