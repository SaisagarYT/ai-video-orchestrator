import { Button } from './Button';
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Unable to load workspace',
  description = 'An error occurred while loading this view. You can try refreshing or returning to your campaigns.',
  error,
  onRetry,
  onGoBack,
  onGoHome,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[var(--radius-xl)] border border-[var(--color-destructive)]/20 bg-[var(--bg-surface)] ${className}`}
    >
      <div className="h-12 w-12 rounded-[var(--radius-lg)] bg-[var(--color-destructive-bg)] border border-[var(--color-destructive)]/30 flex items-center justify-center text-[var(--color-destructive)] mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight font-app">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-md mt-1.5 leading-relaxed font-app">
        {description}
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)] font-mono-code text-[11px] text-[var(--color-destructive)] max-w-lg overflow-x-auto text-left">
          {typeof error === 'string' ? error : error.message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-6">
        {onGoBack && (
          <Button variant="outline" size="sm" onClick={onGoBack} leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Go Back
          </Button>
        )}

        {onGoHome && (
          <Button variant="outline" size="sm" onClick={onGoHome} leftIcon={<Home className="h-3.5 w-3.5" />}>
            Campaigns Overview
          </Button>
        )}

        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Retry Request
          </Button>
        )}
      </div>
    </div>
  );
}

export function NotFoundState({
  title = 'Page not found',
  description = 'The workspace or campaign you are trying to access does not exist or has been relocated.',
  onGoHome,
}: {
  title?: string;
  description?: string;
  onGoHome?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
      <span className="font-mono-code text-5xl font-black text-[var(--text-muted)] mb-3">404</span>
      <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1.5 leading-relaxed">{description}</p>
      {onGoHome && (
        <Button variant="primary" size="sm" className="mt-6" onClick={onGoHome} leftIcon={<Home className="h-4 w-4" />}>
          Back to Campaigns
        </Button>
      )}
    </div>
  );
}

export function AuthRequiredState({
  title = 'Authentication Required',
  description = 'Please sign in or create a free account to manage your campaigns, access creative studios, and generate AI videos.',
  onLogin,
}: {
  title?: string;
  description?: string;
  onLogin?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 sm:p-14 rounded-[var(--radius-xl)] border border-[var(--color-primary-subtle)]/30 bg-[var(--bg-surface)] max-w-xl mx-auto shadow-2xl">
      <div className="h-16 w-16 rounded-[var(--radius-xl)] bg-[var(--color-primary-subtle)]/20 border border-[var(--color-primary)]/30 flex items-center justify-center text-[var(--color-primary)] mb-5 shadow-inner">
        <AlertCircle className="h-8 w-8 text-cyan-400" />
      </div>

      <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight font-app">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-md mt-2 leading-relaxed font-app">
        {description}
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Button
          variant="primary"
          size="md"
          className="px-6 shadow-lg shadow-cyan-500/20"
          onClick={onLogin || (() => (window.location.href = '/login'))}
        >
          Sign In / Create Account
        </Button>
      </div>
    </div>
  );
}

