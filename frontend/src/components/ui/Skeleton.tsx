'use client';

// ============================================================
// Skeleton — Loading skeleton placeholder
// ============================================================

export default function Skeleton({
  className = '',
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width="120px" height="14px" />
        <Skeleton width="40px" height="40px" className="rounded-xl" />
      </div>
      <Skeleton width="180px" height="28px" />
      <Skeleton width="100px" height="14px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton width="40px" height="40px" className="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="14px" />
            <Skeleton width="40%" height="12px" />
          </div>
          <Skeleton width="80px" height="14px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <Skeleton width="100px" height="12px" />
        <Skeleton width="44px" height="44px" className="rounded-xl" />
      </div>
      <Skeleton width="140px" height="28px" className="mb-2" />
      <Skeleton width="80px" height="14px" />
    </div>
  );
}

export function SkeletonDecision() {
  return (
    <div className="glass rounded-xl p-5" style={{ borderLeft: '3px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <Skeleton width="28px" height="28px" className="rounded-lg" />
            <Skeleton width="48px" height="20px" className="rounded-full" />
            <Skeleton width="72px" height="20px" className="rounded-full" />
          </div>
          {/* Title */}
          <Skeleton width="75%" height="16px" />
          {/* Action */}
          <Skeleton width="50%" height="12px" />
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Outcome badge */}
          <Skeleton width="80px" height="24px" className="rounded-full" />
          {/* Confidence bar */}
          <Skeleton width="64px" height="6px" className="rounded-full" />
          {/* Chevron */}
          <Skeleton width="16px" height="16px" className="rounded" />
        </div>
      </div>
    </div>
  );
}
