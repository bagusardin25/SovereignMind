'use client';

// ============================================================
// ReceiptModal — Full execution receipt detail view
// ============================================================
// Glassmorphism modal that shows the full on-chain execution
// receipt when a user clicks "View Receipt" on a DecisionCard.

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Clock,
  Hash,
  Cpu,
  Activity,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { AGENT_COLORS, SOMNIA_TESTNET } from '@/lib/constants';
import type { Decision } from '@/lib/types';
import { getVerificationStatus, type VerificationStatus } from '@/lib/somnia/receipts';

interface ReceiptModalProps {
  decision: Decision;
  receiptUrl: string | null;
  txHash: string | null;
  requestId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig: Record<VerificationStatus, { label: string; color: string; icon: typeof ShieldCheck }> = {
  verified: { label: 'BFT Consensus Verified', color: '#10b981', icon: ShieldCheck },
  pending: { label: 'Awaiting Consensus', color: '#f59e0b', icon: Clock },
  failed: { label: 'Execution Failed', color: '#ef4444', icon: X },
  unknown: { label: 'No On-Chain Record', color: '#6b7280', icon: Activity },
};

function CopyButton({
  text,
  field,
  copiedField,
  onCopy,
}: {
  text: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCopy(text, field);
      }}
      className="p-1 rounded hover:bg-white/10 transition-colors"
      title="Copy to clipboard"
    >
      {copiedField === field ? (
        <Check size={12} className="text-emerald-400" />
      ) : (
        <Copy size={12} className="text-[--color-muted]" />
      )}
    </button>
  );
}

export default function ReceiptModal({
  decision,
  receiptUrl,
  txHash,
  requestId,
  isOpen,
  onClose,
}: ReceiptModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const colors = AGENT_COLORS[decision.agentRole];
  const verificationStatus = getVerificationStatus(decision.outcome, txHash);
  const statusCfg = statusConfig[verificationStatus];
  const StatusIcon = statusCfg.icon;

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[85vh] overflow-y-auto"
          >
            <div
              className="glass rounded-2xl overflow-hidden border"
              style={{
                borderColor: colors.border,
                boxShadow: `0 0 60px ${colors.glow}, 0 25px 50px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Header gradient bar */}
              <div className="h-1" style={{ background: colors.gradient }} />

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.primary,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {decision.agentRole}
                      </span>
                      <h2 className="text-lg font-bold text-[--color-foreground]">
                        Execution Receipt
                      </h2>
                    </div>
                    <p className="text-sm text-[--color-muted-foreground]">
                      {decision.title}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[--color-muted] hover:text-[--color-foreground]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Verification Status */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{
                    backgroundColor: `${statusCfg.color}08`,
                    borderColor: `${statusCfg.color}25`,
                  }}
                >
                  <StatusIcon size={20} style={{ color: statusCfg.color }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: statusCfg.color }}>
                      {statusCfg.label}
                    </p>
                    <p className="text-[10px] text-[--color-muted]">
                      Somnia BFT validator consensus on deterministic LLM output
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Request ID */}
                  {requestId && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[--color-border]">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-[--color-muted]" />
                        <span className="text-xs text-[--color-muted]">Request ID</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono text-[--color-foreground]">
                          {requestId.length > 20
                            ? `${requestId.slice(0, 10)}...${requestId.slice(-8)}`
                            : requestId}
                        </code>
                        <CopyButton text={requestId} field="requestId" copiedField={copiedField} onCopy={copyToClipboard} />
                      </div>
                    </div>
                  )}

                  {/* Transaction Hash */}
                  {txHash && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[--color-border]">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[--color-muted]" />
                        <span className="text-xs text-[--color-muted]">Tx Hash</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono text-[--color-foreground]">
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        </code>
                        <CopyButton text={txHash} field="txHash" copiedField={copiedField} onCopy={copyToClipboard} />
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[--color-border]">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[--color-muted]" />
                      <span className="text-xs text-[--color-muted]">Timestamp</span>
                    </div>
                    <span className="text-xs text-[--color-foreground]">
                      {new Date(decision.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Agent Type */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[--color-border]">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-[--color-muted]" />
                      <span className="text-xs text-[--color-muted]">Agent Type</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: colors.primary }}>
                      {decision.agentRole === 'CEO'
                        ? 'LLM Inference (Qwen3-30B)'
                        : decision.agentRole === 'CFO'
                        ? 'JSON API + LLM Inference'
                        : 'LLM Parse Website + LLM Inference'}
                    </span>
                  </div>
                </div>

                {/* Input/Output */}
                {decision.rationale && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[--color-muted] mb-2">
                      Agent Output
                    </p>
                    <div className="p-3 rounded-xl bg-[#0a0a0a] border border-white/5">
                      <p className="text-xs text-[--color-foreground] leading-relaxed font-mono">
                        {decision.rationale}
                      </p>
                    </div>
                  </div>
                )}

                {decision.inputData && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[--color-muted] mb-2">
                      Input Payload
                    </p>
                    <div className="p-3 rounded-xl bg-[#0a0a0a] border border-white/5 overflow-x-auto">
                      <code
                        className="block text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-words"
                        style={{ color: colors.secondary }}
                      >
                        {decision.inputData}
                      </code>
                    </div>
                  </div>
                )}

                {/* Action Links */}
                <div className="flex items-center gap-3 pt-2">
                  {txHash && (
                    <a
                      href={`${SOMNIA_TESTNET.blockExplorers.default.url}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-[--color-border] hover:bg-white/10 text-[--color-foreground] transition-colors"
                    >
                      <ExternalLink size={12} />
                      View on Explorer
                    </a>
                  )}
                  {receiptUrl && (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors"
                      style={{
                        backgroundColor: `${colors.primary}10`,
                        borderColor: `${colors.primary}30`,
                        color: colors.primary,
                      }}
                    >
                      <ShieldCheck size={12} />
                      View Full Receipt
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
