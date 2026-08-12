# Flare Summer Signal Submission Draft

## Project

**Name:** SovereignMind — FXRP Treasury Guard

**Bounty:** Bounty 1 — Interoperable Asset Products

**One-liner:** A non-custodial Coston2 policy guard that turns a wallet's real FXRP balance and the live FTSOv2 XRP/USD price into an auditable HOLD or REDUCE assessment requiring explicit human approval.

## Problem

Treasury operators holding interoperable assets need a current exposure decision,
but two shortcuts are unsafe: trusting an opaque off-chain price or giving an
automation layer authority over the assets. FXRP Treasury Guard separates the
calculation from authority. Flare supplies the asset identity, price, and public
receipt; the wallet retains custody and the final decision.

## Product flow

1. Connect an FXRP-holding wallet on Coston2.
2. Enter the maximum accepted USD exposure.
3. Submit one transaction that refreshes FTSOv2 and values the actual FXRP balance.
4. Inspect the recorded `HOLD` or `REDUCE` signal, inputs, source addresses, and receipt.
5. Approve or reject the unchanged assessment in a separate wallet transaction.
6. If the price, balance, policy, or freshness changes, approval fails closed.

The guard has no transfer or custody function.

## Why Flare is essential

- Flare Contract Registry resolves current protocol contracts rather than relying on a mutable implementation address.
- `AssetManagerFXRP` identifies the canonical FXRP ERC-20 used for balance valuation.
- FTSOv2 supplies the fee-paid XRP/USD value and timestamp used in the assessment.
- Coston2 records both the pending assessment and human response as inspectable receipts.

Without these Flare components the flagship state change does not work.

## What existed before the event

SovereignMind already existed as a Somnia-based AI treasury copilot with CEO, CFO,
and CMO agent contracts, a dashboard, an orchestrator, a public Somnia demo, and an
earlier video. Those components are baseline context and are not presented as new
Flare Summer Signal work.

## What was built for Flare Summer Signal

- Coston2 Hardhat and wagmi configuration;
- registry-based FTSOv2 and AssetManagerFXRP resolution;
- `FlareFtsoPriceAdapter` with fee, freshness, normalization, and role checks;
- `FXRPTreasuryGuard` with real-balance valuation, policy signals, human authority,
  supersession checks, and zero custody;
- deployment script for oracle, adapter, updater role, and guard;
- `/flare` wallet workflow and source-integrity dashboard;
- targeted contract tests, full regression tests, live Coston2 read check, build,
  lint, responsive review, claim ledger, and demo runbook.

## Technical proof

| Proof | Status |
|---|---|
| Targeted Flare contract suite | Verified locally |
| Full contract regression suite | Verified locally |
| Live Coston2 registry, FTSOv2, and FXRP read | Verified locally |
| Frontend lint and production build | Verified locally |
| Desktop rendered `/flare` review | Verified locally; mobile visual review pending |
| Coston2 deployment and verified addresses | Pending |
| Assessment and approval transaction receipts | Pending |
| Public `/flare` build and competition video | Pending |

Deployment addresses and final URLs must be copied from
`submission/submission-manifest.json` only after verification.

## Repository and architecture

- Repository: add final public repository URL before submission.
- Technical guide: [`FLARE_INTEGRATION.md`](./FLARE_INTEGRATION.md)
- Contract: `contracts/contracts/flare/FXRPTreasuryGuard.sol`
- Frontend: `frontend/src/app/(app)/flare/page.tsx`
- Test suite: `contracts/test/FXRPTreasuryGuard.test.ts`

## Roadmap

1. Add time-weighted exposure policies and multi-feed portfolio limits.
2. Use FAssets lifecycle signals to explain collateral and redemption risk.
3. Introduce multisig approval policies while preserving fail-closed state checks.
4. Produce portable signed assessment reports for treasury governance systems.

## Final submission warning

Do not submit this draft until the guard is deployed on Coston2, at least one real
assessment and human-response receipt are recorded, `/flare` is public, the new
demo video is available, and every pending field in the manifest is replaced with
verified evidence.
