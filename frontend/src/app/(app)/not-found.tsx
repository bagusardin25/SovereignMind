// ============================================================
// Not Found — 404 page for the (app) route group
// ============================================================

import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function AppNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
      <div className="glass rounded-2xl p-10 max-w-lg w-full text-center space-y-8">
        {/* 404 Display */}
        <div className="space-y-2">
          <p className="text-7xl font-extrabold tracking-tighter text-[var(--color-primary)] select-none">
            404
          </p>
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center">
            <Search className="w-6 h-6 text-[var(--color-on-surface-variant)]" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">
            Page not found
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed max-w-xs mx-auto">
            This page doesn&apos;t exist within the app. It may have been removed or the URL is incorrect.
          </p>
        </div>

        {/* Dashboard Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
