'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Flame,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { erc20Abi, formatEther, formatUnits, parseUnits, zeroAddress } from 'viem';
import GlassCard from '@/components/ui/GlassCard';
import { useFlareSnapshot } from '@/hooks/useFlareSnapshot';
import {
  COSTON2_EXPLORER_URL,
  FLARE_CONTRACT_REGISTRY,
  flareAdapterAddress,
  fxrpTreasuryGuardAbi,
  fxrpTreasuryGuardAddress,
} from '@/lib/flare/constants';
import { flareTestnet } from '@/lib/wagmi-config';

const COSTON2_FAUCET_URL = 'https://faucet.flare.network/coston2';

function shortAddress(address?: string | null) {
  return address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Unavailable';
}

function contractUrl(address: string) {
  return `${COSTON2_EXPLORER_URL}/address/${address}`;
}

function transactionUrl(hash: string) {
  return `${COSTON2_EXPLORER_URL}/tx/${hash}`;
}

function formatUsdE8(value: bigint) {
  return Number(formatUnits(value, 8)).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
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

function ReceiptLink({ hash, label }: { hash?: `0x${string}`; label: string }) {
  if (!hash) return null;
  return (
    <a
      href={transactionUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white"
    >
      {label} <ArrowUpRight size={13} />
    </a>
  );
}

export default function FlarePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const snapshot = useFlareSnapshot();
  const [limitUsd, setLimitUsd] = useState('1000');
  const [formError, setFormError] = useState<string | null>(null);

  const guardConfigured = Boolean(fxrpTreasuryGuardAddress);
  const onCoston2 = chainId === flareTestnet.id;

  const fee = useReadContract({
    address: fxrpTreasuryGuardAddress ?? zeroAddress,
    abi: fxrpTreasuryGuardAbi,
    functionName: 'requiredFee',
    chainId: flareTestnet.id,
    query: { enabled: guardConfigured },
  });

  const fxrpBalance = useReadContract({
    address: snapshot.data?.fxrpAddress ?? zeroAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address ?? zeroAddress],
    chainId: flareTestnet.id,
    query: { enabled: Boolean(address && snapshot.data?.fxrpAddress) },
  });

  const latestAssessment = useReadContract({
    address: fxrpTreasuryGuardAddress ?? zeroAddress,
    abi: fxrpTreasuryGuardAbi,
    functionName: 'getLatestAssessment',
    args: [address ?? zeroAddress],
    chainId: flareTestnet.id,
    query: { enabled: Boolean(address && guardConfigured) },
  });
  const refetchLatestAssessment = latestAssessment.refetch;
  const refetchFxrpBalance = fxrpBalance.refetch;
  const refetchSnapshot = snapshot.refetch;

  const assessment = useMemo(() => {
    const data = latestAssessment.data;
    if (!data || data[0] === BigInt(0)) return null;
    return {
      id: data[0],
      fxrpBalance: data[1],
      priceE8: data[2],
      exposureUsdE8: data[3],
      limitUsdE8: data[4],
      feedTimestamp: Number(data[5]),
      oracleUpdatedAt: Number(data[6]),
      signal: Number(data[7]),
      status: Number(data[8]),
    };
  }, [latestAssessment.data]);

  const assessWrite = useWriteContract();
  const assessReceipt = useWaitForTransactionReceipt({
    hash: assessWrite.data,
    chainId: flareTestnet.id,
  });
  const approveWrite = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveWrite.data,
    chainId: flareTestnet.id,
  });
  const rejectWrite = useWriteContract();
  const rejectReceipt = useWaitForTransactionReceipt({
    hash: rejectWrite.data,
    chainId: flareTestnet.id,
  });

  useEffect(() => {
    if (assessReceipt.isSuccess || approveReceipt.isSuccess || rejectReceipt.isSuccess) {
      void refetchLatestAssessment();
      void refetchFxrpBalance();
      void refetchSnapshot();
    }
  }, [
    approveReceipt.isSuccess,
    assessReceipt.isSuccess,
    rejectReceipt.isSuccess,
    refetchLatestAssessment,
    refetchFxrpBalance,
    refetchSnapshot,
  ]);

  const walletBalance = fxrpBalance.data ?? BigInt(0);
  const liveExposureUsdE8 = useMemo(() => {
    if (!snapshot.data || walletBalance === BigInt(0)) return BigInt(0);
    const priceE8 = BigInt(Math.round(snapshot.data.xrpUsdPrice * 1e8));
    return (
      (walletBalance * priceE8) /
      BigInt(10) ** BigInt(snapshot.data.fxrpDecimals)
    );
  }, [snapshot.data, walletBalance]);

  const transactionPending =
    assessWrite.isPending ||
    assessReceipt.isLoading ||
    approveWrite.isPending ||
    approveReceipt.isLoading ||
    rejectWrite.isPending ||
    rejectReceipt.isLoading;

  function createAssessment() {
    setFormError(null);
    if (!fxrpTreasuryGuardAddress || fee.data == null || !onCoston2) return;
    try {
      const limitUsdE8 = parseUnits(limitUsd.trim(), 8);
      if (limitUsdE8 <= BigInt(0)) throw new Error('Enter a limit greater than zero.');
      assessWrite.writeContract({
        address: fxrpTreasuryGuardAddress,
        abi: fxrpTreasuryGuardAbi,
        functionName: 'refreshAndAssess',
        args: [limitUsdE8],
        value: fee.data,
        chainId: flareTestnet.id,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Enter a valid USD limit.');
    }
  }

  function approveAssessment() {
    if (!fxrpTreasuryGuardAddress || !assessment || !onCoston2) return;
    approveWrite.writeContract({
      address: fxrpTreasuryGuardAddress,
      abi: fxrpTreasuryGuardAbi,
      functionName: 'approveAssessment',
      args: [assessment.id],
      chainId: flareTestnet.id,
    });
  }

  function rejectAssessment() {
    if (!fxrpTreasuryGuardAddress || !assessment || !onCoston2) return;
    rejectWrite.writeContract({
      address: fxrpTreasuryGuardAddress,
      abi: fxrpTreasuryGuardAbi,
      functionName: 'rejectAssessment',
      args: [assessment.id],
      chainId: flareTestnet.id,
    });
  }

  const writeError =
    assessWrite.error ??
    assessReceipt.error ??
    approveWrite.error ??
    approveReceipt.error ??
    rejectWrite.error ??
    rejectReceipt.error;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-rose-300/15 bg-gradient-to-br from-[#291421] via-[#171821] to-[#10151c] p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-300" />
              LIVE COSTON2 · NO ASSET CUSTODY
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white sm:text-4xl">
              <Flame className="shrink-0 text-rose-300" /> FXRP Treasury Guard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Turn a live FTSOv2 XRP/USD price and your real FXRP balance into a policy-bounded
              HOLD or REDUCE assessment. The contract records the recommendation; your wallet
              remains the only authority that can approve it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => snapshot.refetch()}
            disabled={snapshot.isFetching}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 lg:self-auto"
          >
            <RefreshCw size={16} className={snapshot.isFetching ? 'animate-spin' : ''} />
            Refresh network proof
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
          label="Wallet FXRP"
          value={
            snapshot.data && address
              ? Number(formatUnits(walletBalance, snapshot.data.fxrpDecimals)).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 4 }
                )
              : '—'
          }
          detail={address ? shortAddress(address) : 'Connect a wallet'}
        />
        <StatCard
          label="Live exposure"
          value={snapshot.data && address ? formatUsdE8(liveExposureUsdE8) : '—'}
          detail="Wallet balance × live FTSO price"
        />
        <StatCard
          label="Coston2 block"
          value={snapshot.data ? `#${Number(snapshot.data.blockNumber).toLocaleString()}` : '—'}
          detail="Chain ID 114"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <GlassCard className="xl:col-span-3" hover={false}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-300">
                Policy assessment
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Set the maximum FXRP exposure you accept
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                One transaction refreshes FTSOv2, reads your FXRP balance, calculates USD exposure,
                and records a pending signal. It cannot transfer tokens.
              </p>
            </div>
            <Gauge className="shrink-0 text-rose-300" />
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/10 p-4 sm:p-5">
            <label htmlFor="fxrp-exposure-limit" className="text-sm font-medium text-white/75">
              Maximum exposure (USD)
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <CircleDollarSign
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  id="fxrp-exposure-limit"
                  inputMode="decimal"
                  value={limitUsd}
                  onChange={(event) => setLimitUsd(event.target.value)}
                  disabled={!guardConfigured || transactionPending}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-white outline-none transition placeholder:text-white/25 focus:border-rose-300/60 focus:ring-2 focus:ring-rose-300/20 disabled:opacity-50"
                  placeholder="1000"
                />
              </div>

              {!isConnected ? (
                <div className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/55">
                  <Wallet size={16} /> Connect wallet in the header
                </div>
              ) : !onCoston2 ? (
                <button
                  type="button"
                  onClick={() => switchChain({ chainId: flareTestnet.id })}
                  disabled={isSwitching}
                  className="min-h-12 rounded-xl bg-rose-300 px-5 text-sm font-bold text-[#28121d] transition hover:bg-rose-200 disabled:opacity-50"
                >
                  {isSwitching ? 'Switching…' : 'Switch to Coston2'}
                </button>
              ) : walletBalance === BigInt(0) ? (
                <a
                  href={COSTON2_FAUCET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-bold text-[#241b08] transition hover:bg-amber-200"
                >
                  Get test FXRP <ArrowUpRight size={15} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={createAssessment}
                  disabled={!guardConfigured || fee.data == null || transactionPending}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-300 px-5 text-sm font-bold text-[#28121d] transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {(assessWrite.isPending || assessReceipt.isLoading) && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {assessWrite.isPending || assessReceipt.isLoading
                    ? 'Assessing…'
                    : 'Refresh FTSO & assess'}
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {guardConfigured
                  ? fee.data != null
                    ? `FTSO fee: ${formatEther(fee.data)} C2FLR`
                    : 'Reading the current FTSO fee…'
                  : 'Coston2 guard deployment has not been published in this build.'}
              </span>
              {assessReceipt.isSuccess && (
                <ReceiptLink hash={assessWrite.data} label="Assessment receipt" />
              )}
            </div>

            {formError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">
                {formError}
              </p>
            )}
            {writeError && (
              <p role="alert" className="mt-3 break-words rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">
                {writeError.message}
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="xl:col-span-2" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                Human authority
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {assessment ? `Assessment #${assessment.id}` : 'No assessment yet'}
              </h2>
            </div>
            {assessment?.status === 1 ? (
              <CheckCircle2 className="text-emerald-300" />
            ) : assessment?.status === 2 ? (
              <XCircle className="text-red-300" />
            ) : (
              <ShieldCheck className="text-cyan-300" />
            )}
          </div>

          {assessment ? (
            <>
              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  assessment.signal === 1
                    ? 'border-amber-300/20 bg-amber-300/5'
                    : 'border-emerald-300/20 bg-emerald-300/5'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">Signal</p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    assessment.signal === 1 ? 'text-amber-200' : 'text-emerald-200'
                  }`}
                >
                  {assessment.signal === 1 ? 'REDUCE' : 'HOLD'}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  {formatUsdE8(assessment.exposureUsdE8)} exposure against a{' '}
                  {formatUsdE8(assessment.limitUsdE8)} policy limit.
                </p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/[0.035] p-3">
                  <dt className="text-xs text-white/40">Status</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {['Pending approval', 'Approved', 'Rejected'][assessment.status]}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/[0.035] p-3">
                  <dt className="text-xs text-white/40">FTSO price</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {formatUsdE8(assessment.priceE8)}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/[0.035] p-3">
                  <dt className="text-xs text-white/40">FXRP snapshot</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {snapshot.data
                      ? Number(
                          formatUnits(assessment.fxrpBalance, snapshot.data.fxrpDecimals)
                        ).toLocaleString(undefined, { maximumFractionDigits: 4 })
                      : '—'}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/[0.035] p-3">
                  <dt className="text-xs text-white/40">Feed timestamp</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {new Date(assessment.feedTimestamp * 1000).toLocaleTimeString()}
                  </dd>
                </div>
              </dl>

              {assessment.status === 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={rejectAssessment}
                    disabled={!onCoston2 || transactionPending}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={approveAssessment}
                    disabled={!onCoston2 || transactionPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-[#092019] transition hover:bg-emerald-200 disabled:opacity-50"
                  >
                    {(approveWrite.isPending || approveReceipt.isLoading) && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    Approve unchanged state
                  </button>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-3">
                {approveReceipt.isSuccess && (
                  <ReceiptLink hash={approveWrite.data} label="Approval receipt" />
                )}
                {rejectReceipt.isSuccess && (
                  <ReceiptLink hash={rejectWrite.data} label="Rejection receipt" />
                )}
              </div>
            </>
          ) : (
            <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
              <Activity className="text-white/30" />
              <p className="mt-3 font-semibold text-white/70">Create the first assessment</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/40">
                The approval controls appear only after Coston2 confirms a real policy assessment.
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-300">
                Source integrity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Inspectable Flare boundaries</h2>
            </div>
            <Database className="text-emerald-300" />
          </div>

          <div className="mt-6 divide-y divide-white/5 rounded-2xl border border-white/5 bg-black/10 px-4">
            {[
              ['Flare Contract Registry', FLARE_CONTRACT_REGISTRY],
              ['AssetManagerFXRP', snapshot.data?.assetManagerAddress],
              ['FXRP token', snapshot.data?.fxrpAddress],
              ['FtsoV2', snapshot.data?.ftsoV2Address],
              ['Price adapter', flareAdapterAddress],
              ['FXRP Treasury Guard', fxrpTreasuryGuardAddress],
            ].map(([label, contractAddress]) => (
              <div
                key={label}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-white/55">{label}</span>
                {contractAddress ? (
                  <a
                    href={contractUrl(contractAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-rose-200 hover:text-white"
                  >
                    {shortAddress(contractAddress)} <ArrowUpRight size={13} />
                  </a>
                ) : (
                  <span className="text-sm text-white/30">Not deployed</span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
                Deterministic stop rules
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Fail closed, keep custody</h2>
            </div>
            <ShieldAlert className="text-amber-300" />
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-white/55">
            <li className="rounded-xl bg-white/[0.035] p-3">No FXRP balance means no assessment.</li>
            <li className="rounded-xl bg-white/[0.035] p-3">Stale FTSO-derived prices block approval.</li>
            <li className="rounded-xl bg-white/[0.035] p-3">A changed FXRP balance invalidates approval.</li>
            <li className="rounded-xl bg-white/[0.035] p-3">A newer policy supersedes the older assessment.</li>
            <li className="rounded-xl bg-white/[0.035] p-3">The guard never transfers or custodies FXRP.</li>
          </ul>
        </GlassCard>
      </div>

      <GlassCard hover={false}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
          Causal Flare path
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['01', 'Flare registry', 'Resolve current FTSO and FXRP contracts'],
            ['02', 'FTSOv2', 'Return fee-paid XRP/USD data'],
            ['03', 'Price adapter', 'Validate freshness and normalize to e8'],
            ['04', 'Treasury Guard', 'Value the real wallet balance against policy'],
            ['05', 'Human wallet', 'Approve or reject without surrendering custody'],
          ].map(([index, title, detail]) => (
            <div key={index} className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
              <span className="font-mono text-xs text-rose-300">{index}</span>
              <p className="mt-2 text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs leading-5 text-white/40">{detail}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
