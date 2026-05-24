'use client';

// ============================================================
// AllocationChart — Donut chart for treasury allocation
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TokenHolding } from '@/lib/types';
import { formatUSD } from '@/lib/constants';

interface AllocationChartProps {
  holdings: TokenHolding[];
  totalValue: number;
  size?: number;
}

export default function AllocationChart({
  holdings,
  totalValue,
  size = 220,
}: AllocationChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeWidth = 28;

  // Calculate segments
  let cumulativePercentage = 0;
  const segments = holdings.map((holding, index) => {
    const percentage = holding.allocation / 100;
    const dashLength = circumference * percentage;
    const gapLength = circumference - dashLength;
    const offset = circumference * cumulativePercentage;
    cumulativePercentage += percentage;

    return {
      holding,
      index,
      dashLength,
      gapLength,
      offset,
    };
  });

  const hoveredHolding = hoveredIndex !== null ? holdings[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(30, 41, 59, 0.5)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map(({ holding, index, dashLength, gapLength, offset }) => (
            <motion.circle
              key={holding.symbol}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={holding.color}
              strokeWidth={hoveredIndex === index ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="donut-segment transition-all duration-300"
              style={{
                filter: hoveredIndex === index ? `drop-shadow(0 0 8px ${holding.color}80)` : 'none',
                opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLength} ${gapLength}` }}
              transition={{ duration: 1, delay: index * 0.15, ease: 'easeOut' }}
            />
          ))}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={hoveredHolding?.symbol || 'total'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            {hoveredHolding ? (
              <>
                <p className="text-lg font-bold text-[--color-foreground]">
                  {hoveredHolding.symbol}
                </p>
                <p className="text-xs text-[--color-muted-foreground]">
                  {hoveredHolding.allocation.toFixed(1)}%
                </p>
                <p className="text-xs text-[--color-muted]">
                  {formatUSD(hoveredHolding.value)}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-[--color-muted-foreground]">Total Value</p>
                <p className="text-lg font-bold text-[--color-foreground]">
                  {formatUSD(totalValue)}
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
        {holdings.map((holding, index) => (
          <div
            key={holding.symbol}
            className={`flex items-center gap-2 py-1 px-2 rounded-lg transition-all duration-200 cursor-pointer ${
              hoveredIndex === index ? 'bg-white/5' : ''
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: holding.color }}
            />
            <span className="text-sm text-[--color-foreground] font-medium">
              {holding.symbol}
            </span>
            <span className="text-xs text-[--color-muted] ml-auto">
              {holding.allocation.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
