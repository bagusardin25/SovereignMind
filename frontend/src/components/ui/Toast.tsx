'use client';

// ============================================================
// Toast — Self-contained toast notification system
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

// ── Module-level event system ───────────────────────────────
type ToastListener = (toast: ToastItem) => void;
const listeners: Set<ToastListener> = new Set();

let toastCounter = 0;

/** Call from anywhere to show a toast notification */
export function toast(message: string, type: ToastType = 'info') {
  const item: ToastItem = {
    id: `toast-${++toastCounter}-${Date.now()}`,
    message,
    type,
    createdAt: Date.now(),
  };
  listeners.forEach((fn) => fn(item));
}

// ── Config ──────────────────────────────────────────────────
const TOAST_DURATION = 3000;

const iconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastType, { icon: string; border: string; bg: string }> = {
  success: {
    icon: 'var(--color-success, #10b981)',
    border: 'rgba(16, 185, 129, 0.3)',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
  error: {
    icon: 'var(--color-error, #ef4444)',
    border: 'rgba(239, 68, 68, 0.3)',
    bg: 'rgba(239, 68, 68, 0.08)',
  },
  warning: {
    icon: 'var(--color-warning, #f59e0b)',
    border: 'rgba(245, 158, 11, 0.3)',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  info: {
    icon: 'var(--color-agent-ceo, #3b82f6)',
    border: 'rgba(59, 130, 246, 0.3)',
    bg: 'rgba(59, 130, 246, 0.08)',
  },
};

// ── Single Toast ────────────────────────────────────────────
function ToastMessage({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = iconMap[item.type];
  const colors = colorMap[item.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="pointer-events-auto flex items-start gap-3 max-w-sm w-full px-4 py-3 rounded-xl backdrop-blur-xl border shadow-2xl"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
        borderColor: colors.border,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div
        className="flex-shrink-0 mt-0.5 p-1 rounded-lg"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon size={16} style={{ color: colors.icon }} />
      </div>
      <p className="flex-1 text-sm text-[--color-foreground] leading-snug">
        {item.message}
      </p>
      <button
        onClick={() => onDismiss(item.id)}
        className="flex-shrink-0 p-0.5 rounded-md text-[--color-muted] hover:text-[--color-foreground] hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Toast Container (render once, e.g. in Header) ───────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev, item]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastMessage key={item.id} item={item} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
