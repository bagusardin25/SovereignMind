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
