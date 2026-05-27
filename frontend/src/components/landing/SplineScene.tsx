'use client';

// ============================================================
// SplineScene — Wrapper for Spline 3D scene with error handling
// ============================================================

import { useState } from 'react';
import Spline from '@splinetool/react-spline';

interface SplineSceneProps {
  onLoad: () => void;
}

export default function SplineScene({ onLoad }: SplineSceneProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" y1="22" x2="12" y2="12" />
            </svg>
          </div>
          <p className="text-sm text-white/30 font-body-md max-w-[200px]">
            3D scene unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <Spline
      scene="https://prod.spline.design/E8nQAOG1DhoU-x4w/scene.splinecode"
      className="w-full h-full"
      onLoad={onLoad}
      onError={() => setHasError(true)}
    />
  );
}
