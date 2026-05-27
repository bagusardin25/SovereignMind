'use client';

// ============================================================
// ErrorBoundary — Catches rendering errors and shows fallback UI
// ============================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-error-container)] flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[var(--color-error)]" />
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)]">
                Something went wrong
              </h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                An unexpected error occurred while rendering this section.
              </p>
            </div>

            {/* Error Message */}
            {this.state.error && (
              <div className="rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] p-4 text-left">
                <p className="text-xs font-mono text-[var(--color-error)] break-words">
                  {this.state.error.message}
                </p>
                {process.env.NODE_ENV !== 'production' && this.state.error.stack && (
                  <pre className="mt-3 text-[10px] font-mono text-[var(--color-on-surface-variant)] whitespace-pre-wrap break-words max-h-32 overflow-y-auto opacity-60">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Retry Button */}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm hover:opacity-90 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
