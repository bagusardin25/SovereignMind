'use client';

// ============================================================
// MetricCard — Key metric display with change indicator
// ============================================================

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GlassCard from './GlassCard';

interface MetricCardProps {
  label: string;
  value: string;
  change?: number; // percentage
  icon: React.ReactNode;
  accentColor?: string;
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  change,
  icon,
  accentColor = '#3b82f6',
  delay = 0,
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  const colorToGlowMap: Record<string, 'blue' | 'violet' | 'cyan' | 'green' | 'none'> = {
    '#3b82f6': 'blue',
    '#8b5cf6': 'violet',
    '#06b6d4': 'cyan',
    '#10b981': 'green',
  };
  const glowType = colorToGlowMap[accentColor] || 'none';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <GlassCard padding="md" animate={false} glow={glowType} hover={true} className="h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[--color-muted-foreground] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[--color-foreground] tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive && <TrendingUp size={14} className="text-[--color-success]" />}
                {isNegative && <TrendingDown size={14} className="text-[--color-error]" />}
                {isNeutral && <Minus size={14} className="text-[--color-muted]" />}
                <span
                  className={`text-sm font-medium ${
                    isPositive
                      ? 'text-[--color-success]'
                      : isNegative
                      ? 'text-[--color-error]'
                      : 'text-[--color-muted]'
                  }`}
                >
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </span>
                <span className="text-xs text-[--color-muted]">24h</span>
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
