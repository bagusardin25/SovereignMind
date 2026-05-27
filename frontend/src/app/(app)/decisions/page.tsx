'use client';

// ============================================================
// Decisions Page — Full decision audit trail
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  Search,
  ScrollText,
  Brain,
  LineChart,
  Megaphone,
  Download,
} from 'lucide-react';
import { downloadCSV } from '@/lib/exportUtils';
import GlassCard from '@/components/ui/GlassCard';
import DecisionCard from '@/components/decisions/DecisionCard';
import Skeleton, { SkeletonCard, SkeletonDecision } from '@/components/ui/Skeleton';
import { mockDecisions } from '@/lib/mock-data';
import { AGENT_COLORS } from '@/lib/constants';
import type { AgentRole, DecisionType } from '@/lib/types';

type FilterRole = AgentRole | 'ALL';
type FilterType = DecisionType | 'all';

export default function DecisionsPage() {
  const [filterRole, setFilterRole] = useState<FilterRole>('ALL');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredDecisions = useMemo(() => {
    return mockDecisions.filter((d) => {
      if (filterRole !== 'ALL' && d.agentRole !== filterRole) return false;
      if (filterType !== 'all' && d.type !== filterType) return false;
      if (
        searchQuery &&
        !d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.rationale.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [filterRole, filterType, searchQuery]);

  const roleFilters: { value: FilterRole; label: string; icon?: React.ReactNode; color?: string }[] = [
    { value: 'ALL', label: 'All Agents' },
    { value: 'CEO', label: 'CEO', icon: <Brain size={14} />, color: AGENT_COLORS.CEO.primary },
    { value: 'CFO', label: 'CFO', icon: <LineChart size={14} />, color: AGENT_COLORS.CFO.primary },
    { value: 'CMO', label: 'CMO', icon: <Megaphone size={14} />, color: AGENT_COLORS.CMO.primary },
  ];

  const typeFilters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'rebalance', label: 'Rebalance' },
    { value: 'allocate', label: 'Allocate' },
    { value: 'hold', label: 'Hold' },
    { value: 'alert', label: 'Alert' },
    { value: 'market_signal', label: 'Market Signal' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Title Skeleton */}
        <div>
          <Skeleton width="200px" height="28px" className="mb-2" />
          <Skeleton width="360px" height="14px" />
        </div>

        {/* Stats Bar Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 space-y-2">
              <Skeleton width="80px" height="12px" />
              <Skeleton width="60px" height="24px" />
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Skeleton width="240px" height="36px" className="rounded-xl" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="72px" height="28px" className="rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Decision List Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonDecision key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">Decision Log</h1>
          <p className="text-sm text-[--color-muted-foreground] mt-1">
            Complete audit trail of all autonomous decisions — powered by Somnia Receipts API
          </p>
        </div>
        <button
          onClick={() => {
            const headers = ['ID', 'Role', 'Type', 'Title', 'Outcome', 'Confidence', 'Timestamp'];
            const data = filteredDecisions.map((d) => [
              d.id,
              d.agentRole,
              d.type,
              d.title,
              d.outcome,
              `${d.confidenceScore}%`,
              new Date(d.timestamp).toISOString(),
            ]);
            downloadCSV('decisions.csv', headers, data);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-[--color-border] hover:bg-white/10 text-[--color-foreground] transition-colors"
        >
          <Download size={16} className="text-[--color-muted]" />
          Export CSV
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Decisions', value: mockDecisions.length, color: '#3b82f6' },
          {
            label: 'Executed',
            value: mockDecisions.filter((d) => d.outcome === 'executed').length,
            color: '#10b981',
          },
          {
            label: 'Avg Confidence',
            value: `${Math.round(
              mockDecisions.reduce((sum, d) => sum + d.confidenceScore, 0) / mockDecisions.length
            )}%`,
            color: '#f59e0b',
          },
          {
            label: 'Agents Active',
            value: `${new Set(mockDecisions.map((d) => d.agentRole)).size}/3`,
            color: '#8b5cf6',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
          >
            <GlassCard padding="sm" animate={false}>
              <p className="text-xs text-[--color-muted] mb-1">{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <GlassCard padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-muted]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decisions..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[--color-border] text-sm text-[--color-foreground] placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-agent-ceo]/50 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-[--color-muted]" />
            {roleFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterRole(filter.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterRole === filter.value
                    ? 'bg-white/10 text-[--color-foreground] border border-[--color-border-hover]'
                    : 'text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5'
                }`}
                style={
                  filterRole === filter.value && filter.color
                    ? { borderColor: `${filter.color}40`, color: filter.color }
                    : undefined
                }
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {typeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === filter.value
                    ? 'bg-white/10 text-[--color-foreground] border border-[--color-border-hover]'
                    : 'text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Decision List */}
      <div className="space-y-3">
        {filteredDecisions.length > 0 ? (
          filteredDecisions.map((decision, index) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              delay={index * 0.05}
            />
          ))
        ) : (
          <GlassCard>
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <ScrollText size={48} className="text-[--color-muted]" />
              <p className="text-[--color-muted-foreground]">
                No decisions match your filters
              </p>
              <button
                onClick={() => {
                  setFilterRole('ALL');
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="text-sm text-[--color-agent-ceo] hover:text-[--color-agent-ceo-light] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
