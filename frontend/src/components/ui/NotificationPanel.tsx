'use client';

// ============================================================
// NotificationPanel — Dropdown notification list
// ============================================================

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Inbox } from 'lucide-react';
import { mockActivity } from '@/lib/mock-data';
import { AGENT_COLORS, formatRelativeTime } from '@/lib/constants';
import type { AgentRole } from '@/lib/types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      // Delay attaching to avoid the toggle click from immediately closing
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleMarkAllRead = () => {
    setReadIds(new Set(mockActivity.map((a) => a.id)));
  };

  const unreadCount = mockActivity.filter((a) => !readIds.has(a.id)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute top-full right-0 mt-2 w-96 max-h-[480px] rounded-2xl border border-[--color-border] overflow-hidden shadow-2xl z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 16px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[--color-border]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[--color-foreground]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[--color-agent-ceo] text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-[--color-muted-foreground] hover:text-[--color-foreground] transition-colors"
            >
              <Check size={12} />
              Mark all as read
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-[--color-border]/50">
            {mockActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[--color-muted]">
                <Inbox size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              mockActivity.map((event) => {
                const agentColor =
                  AGENT_COLORS[event.agentRole as AgentRole]?.primary || '#6b7280';
                const isRead = readIds.has(event.id);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`px-5 py-3.5 hover:bg-white/[0.03] transition-colors cursor-default ${
                      isRead ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Agent Badge */}
                      <span
                        className="flex-shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider text-white"
                        style={{ backgroundColor: agentColor }}
                      >
                        {event.agentRole}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* Action */}
                        <p className="text-sm font-medium text-[--color-foreground] truncate">
                          {event.action}
                        </p>
                        {/* Description */}
                        <p className="text-xs text-[--color-muted-foreground] mt-0.5 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="flex-shrink-0 text-[10px] text-[--color-muted] whitespace-nowrap mt-0.5">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
