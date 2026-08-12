'use client';

import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Flame,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { formatEther, zeroAddress } from 'viem';
import GlassCard from '@/components/ui/GlassCard';
import { useFlareSnapshot } from '@/hooks/useFlareSnapshot';
import {
  COSTON2_EXPLORER_URL,
  FLARE_CONTRACT_REGISTRY,
  flareAdapterAddress,
  flareFtsoAdapterAbi,
} from '@/lib/flare/constants';
import { flareTestnet } from '@/lib/wagmi-config';

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Unavailable';
}

function contractUrl(address: string) {
  return `${COSTON2_EXPLORER_URL}/address/${address}`;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <GlassCard padding="sm" hover={false}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[--color-muted-foreground]">{detail}</p>
    </GlassCard>
  );
}

export default function FlarePage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const snapshot = useFlareSnapshot();
  const adapterConfigured = Boolean(flareAdapterAddress);

  const fee = useReadContract({
    address: flareAdapterAddress ?? zeroAddress,
    abi: flareFtsoAdapterAbi,
    functionName: 'requiredFee',
    chainId: flareTestnet.id,
    query: { enabled: adapterConfigured },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: flareTestnet.id,
  });

  const onCoston2 = chainId === flareTestnet.id;
  const syncPending = write.isPending || receipt.isLoading;

  function syncPrice() {
    if (!flareAdapterAddress || fee.data == null || !onCoston2) return;
    write.writeContract({
      address: flareAdapterAddress,
      abi: flareFtsoAdapterAbi,
      functionName: 'syncXrpUsd',
      value: fee.data,
      chainId: flareTestnet.id,
    });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-rose-300/15 bg-gradient-to-br from-[#291421] via-[#171821] to-[#10151c] p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-300" />
              LIVE COSTON2 READ
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white sm:text-4xl">
              <Flame className="text-rose-300" /> Flare Intelligence Bridge
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              SovereignMind reads FTSOv2 XRP/USD data and current FXRP system settings directly
              from Flare. The on-chain adapter can promote that verified signal into the treasury
              oracle once its Coston2 deployment is configured.
            </p>
          </div>
          <button
            type="button"
            onClick={() => snapshot.refetch()}
            disabled={snapshot.isFetching}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 lg:self-auto"
          >
            <RefreshCw size={16} className={snapshot.isFetching ? 'animate-spin' : ''} />
            Refresh proof
          </button>
        </div>
      </section>

      {snapshot.isError && (
        <GlassCard hover={false} className="border border-red-400/30 bg-red-500/5">
          <p className="font-semibold text-red-300">Coston2 live read failed</p>
          <p className="mt-2 break-words text-sm text-red-200/70">
            {snapshot.error instanceof Error ? snapshot.error.message : 'Unknown RPC error'}
          </p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="FTSO XRP / USD"
          value={snapshot.data ? `$${snapshot.data.xrpUsdPrice.toFixed(4)}` : '—'}
          detail={
            snapshot.data
              ? `Feed time ${new Date(snapshot.data.feedTimestamp * 1000).toLocaleTimeString()}`
              : 'Waiting for FTSOv2'
          }
        />
        <StatCard
          label="FXRP lot size"
          value={snapshot.data ? `${snapshot.data.lotSizeFxrp.toLocaleString()} XRP` : '—'}
          detail="Current AssetManager setting"
        />
        <StatCard
          label="One lot value"
          value={
            snapshot.data
              ? `$${snapshot.data.lotValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : '—'
          }
          detail="FTSO price × current lot size"
        />
        <StatCard
          label="Coston2 block"
          value={snapshot.data ? `#${Number(snapshot.data.blockNumber).toLocaleString()}` : '—'}
          detail="Chain ID 114"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-300">
                Source integrity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Resolved on every live read</h2>
            </div>
            <ShieldCheck className="text-emerald-300" />
          </div>

          <div className="mt-6 divide-y divide-white/5 rounded-2xl border border-white/5 bg-black/10 px-4">
            {[
              ['Flare Contract Registry', FLARE_CONTRACT_REGISTRY],
              ['AssetManagerFXRP', snapshot.data?.assetManagerAddress],
              ['FtsoV2', snapshot.data?.ftsoV2Address],
            ].map(([label, address]) => (
              <div key={label} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-white/55">{label}</span>
                {address ? (
                  <a
                    href={contractUrl(address)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-rose-200 hover:text-white"
                  >
                    {shortAddress(address)} <ArrowUpRight size={13} />
                  </a>
                ) : (
                  <span className="text-sm text-white/30">Resolving…</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
            <Database className="mt-0.5 shrink-0 text-emerald-300" size={18} />
            <p className="text-sm leading-6 text-white/60">
              Contract addresses are obtained from Flare&apos;s registry, so upgrades do not leave the
              dashboard pinned to an obsolete FTSO or FXRP manager implementation.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                Oracle adapter
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {adapterConfigured ? 'Ready for wallet sync' : 'Deployment pending'}
              </h2>
            </div>
            {adapterConfigured ? (
              <CheckCircle2 className="text-emerald-300" />
            ) : (
              <Activity className="text-amber-300" />
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-white/55">
            {adapterConfigured
              ? 'The configured adapter reads FTSOv2, normalizes XRP/USD to eight decimals, and updates SovereignMind PriceOracle through a restricted updater role.'
              : 'No adapter address is published in this build. Live data above is real and read-only; no transaction or deployment is being implied.'}
          </p>

          <div className="mt-6 space-y-3">
            {adapterConfigured && !isConnected && (
              <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-sm text-white/60">
                <Wallet size={16} /> Connect a wallet to sync the oracle.
              </div>
            )}

            {adapterConfigured && isConnected && !onCoston2 && (
              <button
                type="button"
                onClick={() => switchChain({ chainId: flareTestnet.id })}
                disabled={isSwitching}
                className="w-full rounded-xl bg-rose-300 px-4 py-3 text-sm font-bold text-[#28121d] transition hover:bg-rose-200 disabled:opacity-50"
              >
                {isSwitching ? 'Switching…' : 'Switch wallet to Coston2'}
              </button>
            )}

            {adapterConfigured && isConnected && onCoston2 && (
              <button
                type="button"
                onClick={syncPrice}
                disabled={fee.data == null || syncPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-300 px-4 py-3 text-sm font-bold text-[#28121d] transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncPending && <Loader2 size={16} className="animate-spin" />}
                {syncPending ? 'Synchronizing…' : 'Sync XRP/USD to oracle'}
              </button>
            )}

            {fee.data != null && adapterConfigured && (
              <p className="text-center text-xs text-white/35">
                FTSO fee: {formatEther(fee.data)} C2FLR
              </p>
            )}

            {receipt.isSuccess && write.data && (
              <a
                href={`${COSTON2_EXPLORER_URL}/tx/${write.data}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm font-semibold text-emerald-300"
              >
                Sync confirmed <ArrowUpRight size={14} />
              </a>
            )}

            {(write.error || receipt.error) && (
              <p className="break-words rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">
                {(write.error ?? receipt.error)?.message}
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard hover={false}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Signal path</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ['01', 'Flare registry', 'Resolve current contracts'],
            ['02', 'FTSOv2', 'Read XRP/USD signal'],
            ['03', 'Price adapter', 'Normalize to 8 decimals'],
            ['04', 'Treasury oracle', 'Expose policy-ready price'],
          ].map(([index, title, detail]) => (
            <div key={index} className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
              <span className="font-mono text-xs text-rose-300">{index}</span>
              <p className="mt-2 text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs text-white/40">{detail}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
