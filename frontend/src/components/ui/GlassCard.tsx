'use client';

// ============================================================
// GlassCard — Reusable glassmorphism card wrapper
// ============================================================

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'blue' | 'violet' | 'cyan' | 'green' | 'primary' | 'none';
  padding?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  onClick?: () => void;
}

const glowClasses = {
  blue: 'glow-blue',
  violet: 'glow-violet',
  cyan: 'glow-cyan',
  green: 'glow-green',
  primary: 'glow-primary',
  none: '',
};

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = 'none',
  padding = 'md',
  animate = true,
  onClick,
}: GlassCardProps) {
  const baseClasses = `glass rounded-2xl ${paddingClasses[padding]} ${glowClasses[glow]} ${
    hover ? 'glass-hover transition-all duration-300' : ''
  } ${onClick ? 'cursor-pointer' : ''} ${className}`;

  if (!animate) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.01 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
