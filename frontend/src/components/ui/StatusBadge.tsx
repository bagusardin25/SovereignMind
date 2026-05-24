'use client';

// ============================================================
// StatusBadge — Animated status indicator
// ============================================================

import type { AgentStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  active: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    label: 'Active',
  },
  processing: {
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    label: 'Processing',
  },
  idle: {
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    label: 'Idle',
  },
  error: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    label: 'Error',
  },
};

const sizeClasses = {
  sm: { dot: 'w-2 h-2', text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { dot: 'w-2.5 h-2.5', text: 'text-sm', padding: 'px-3 py-1' },
  lg: { dot: 'w-3 h-3', text: 'text-base', padding: 'px-4 py-1.5' },
};

export default function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full ${sizes.padding}`}
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <span
        className={`${sizes.dot} rounded-full ${
          status === 'active' || status === 'processing' ? 'status-dot-active' : ''
        }`}
        style={{ backgroundColor: config.color, color: config.color }}
      />
      {showLabel && (
        <span className={`${sizes.text} font-medium`} style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );
}
