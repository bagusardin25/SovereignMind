// ============================================================
// Not Found — Root 404 page
// ============================================================

import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[var(--color-background)] overflow-hidden">
      {/* Decorative background removed per user request */}

      <div className="relative z-10 glass-dark rounded-2xl p-12 max-w-lg w-full mx-6 text-center space-y-8">
        {/* 404 Display */}
        <div className="space-y-2">
          <p className="text-8xl font-extrabold tracking-tighter text-[var(--color-primary)] glow-text select-none">
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
            The page you&apos;re looking for doesn&apos;t exist or has been moved to a new location.
          </p>
        </div>

        {/* Home Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
