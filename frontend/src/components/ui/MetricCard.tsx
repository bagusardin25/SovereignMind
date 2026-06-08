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
  changeLabel?: string; // e.g. "24h", "since inception"
  icon: React.ReactNode;
  accentColor?: string;
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  change,
  changeLabel = '24h',
  icon,
  accentColor = '#3b82f6',
  delay = 0,
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <div className="h-full p-5 rounded-2xl bg-white/[0.02] border border-transparent transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-between group">
        <div className="flex-1">
          <p className="text-xs font-medium text-[--color-muted-foreground] mb-1 group-hover:text-white/70 transition-colors">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp size={14} className="text-[--color-success]" />}
              {isNegative && <TrendingDown size={14} className="text-[--color-error]" />}
              {isNeutral && <Minus size={14} className="text-[--color-muted]" />}
              <span
                className={`text-xs font-medium ${
                  isPositive
                    ? 'text-[--color-success]'
                    : isNegative
                    ? 'text-[--color-error]'
                    : 'text-[--color-muted]'
                }`}
              >
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[--color-muted]">{changeLabel}</span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-xl ml-4 transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundColor: `${accentColor}10`,
            color: accentColor,
            boxShadow: `inset 0 0 0 1px ${accentColor}20`
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
