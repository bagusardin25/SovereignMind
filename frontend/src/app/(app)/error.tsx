'use client';

// ============================================================
// Error Page — Next.js error boundary for the (app) route group
// ============================================================

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
      <div className="glass rounded-2xl p-10 max-w-lg w-full text-center space-y-8">
        {/* Decorative glow behind icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-[var(--color-error)]/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-[var(--color-error-container)] flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-[var(--color-error)]" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">
            Something went wrong
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
            An unexpected error occurred. You can try again or return to the dashboard.
          </p>
        </div>

        {/* Error Details */}
        <div className="rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] p-4">
          <p className="text-xs font-mono text-[var(--color-error)] break-words">
            {error.message || 'An unknown error occurred'}
          </p>
          {error.digest && (
            <p className="mt-2 text-[10px] font-mono text-[var(--color-on-surface-variant)] opacity-50">
              Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm hover:opacity-90 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] font-semibold text-sm hover:bg-[var(--color-surface-container-high)] transition-all duration-200"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
