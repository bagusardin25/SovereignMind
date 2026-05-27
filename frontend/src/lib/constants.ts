// ============================================================
// SovereignMind — Constants & Configuration
// ============================================================

// Somnia Testnet Chain Configuration
export const SOMNIA_TESTNET = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://shannon.somnia.network',
    },
  },
  testnet: true,
} as const;

// Somnia Agent Runner Address (Testnet)
export const AGENT_RUNNER_ADDRESS = '0x0000000000000000000000000000000000000000'; // TBD

// Contract Addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  ceoAgent: '0x0000000000000000000000000000000000000001',
  cfoAgent: '0x0000000000000000000000000000000000000002',
  cmoAgent: '0x0000000000000000000000000000000000000003',
  treasuryVault: '0x0000000000000000000000000000000000000004',
  agentRegistry: '0x0000000000000000000000000000000000000005',
} as const;

// Somnia Receipts API
export const RECEIPTS_API_BASE = 'https://receipts.net.somnia.host';

// Agent Colors
export const AGENT_COLORS = {
  CEO: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.4)',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.2)',
  },
  CFO: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.4)',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.2)',
  },
  CMO: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.4)',
    gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    bg: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(6, 182, 212, 0.2)',
  },
} as const;

// Status Colors
export const STATUS_COLORS = {
  active: '#10b981',
  processing: '#f59e0b',
  idle: '#6b7280',
  error: '#ef4444',
} as const;

// Navigation Items
export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Agents', href: '/agents', icon: 'Bot' },
  { label: 'Treasury', href: '/treasury', icon: 'Landmark' },
  { label: 'Decisions', href: '/decisions', icon: 'ScrollText' },
] as const;

// Truncate address for display
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format timestamp to relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Format USD value
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format compact number
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}
