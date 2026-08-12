# SovereignMind on Flare Coston2

This is the event-period Flare extension of the existing SovereignMind project.
It targets Flare Summer Signal Bounty 1, Interoperable Asset Products. It does not
claim that the pre-existing Somnia treasury stack was rebuilt on Flare.

## Flagship state change

An FXRP holder enters a maximum USD exposure and sends one Coston2 transaction.
The transaction refreshes the official XRP/USD FTSOv2 feed, reads the caller's
actual FXRP balance, calculates exposure, and records a pending `HOLD` or `REDUCE`
assessment. The same wallet then approves or rejects the unchanged assessment in
a separate transaction. Neither path transfers or takes custody of FXRP.

## Causal Flare architecture

```text
Flare Contract Registry
  +-> FtsoV2 -> fee-paid XRP/USD feed
  |             -> FlareFtsoPriceAdapter
  |             -> PriceOracle["xrp"] in USD e8
  |
  +-> AssetManagerFXRP -> canonical FXRP token
                         + caller balance
                         + explicit exposure limit
                         -> FXRPTreasuryGuard
                         -> pending HOLD / REDUCE assessment
                         -> wallet APPROVE / REJECT receipt
```

Removing Flare breaks the product's core state change: there is no registry-backed
FXRP identity, no FTSOv2 price, and no Coston2 assessment or approval receipt.

## Contracts

### `FlareFtsoPriceAdapter`

- reads the XRP/USD feed from the registry-resolved FTSOv2 implementation;
- forwards the exact current feed fee;
- rejects zero, stale, or future-dated feed values;
- normalizes the feed into the eight decimals used by `PriceOracle`;
- can update the oracle only after receiving `UPDATER_ROLE`.

### `FXRPTreasuryGuard`

- uses the FXRP ERC-20 returned by `AssetManagerFXRP`;
- requires a non-zero wallet balance and exposure limit;
- refreshes FTSOv2 and creates the assessment atomically;
- uses full-precision `mulDiv` valuation;
- allows only the assessed wallet to approve or reject;
- invalidates approval after a newer policy, changed balance, changed price,
  changed oracle timestamp, or stale oracle state;
- contains no token transfer, approval, custody, or automated trading function.

## Frontend

The `/flare` page displays the live Coston2 block, XRP/USD value and timestamp,
wallet FXRP balance, exposure, policy limit, signal, status, relevant contract
addresses, and transaction receipts. Missing deployment configuration is shown as
`Not deployed`; the UI does not fabricate a successful state.

Required public-build variables after deployment:

```dotenv
NEXT_PUBLIC_FLARE_FTSO_ADAPTER_ADDRESS=0x28162b1fA606BaC60c0B82075e878fb0C981634C
NEXT_PUBLIC_FXRP_TREASURY_GUARD_ADDRESS=0x269B22DFF373Bb3aC9c564141edbfe9De3903a40
```

The production route is available at
[`https://sovereignmind-app.vercel.app/flare`](https://sovereignmind-app.vercel.app/flare).
Its unauthenticated smoke check returned HTTP 200 and contained both configured
contract addresses. Deployment metadata is retained in
`evidence/runtime/vercel-production-deployment.json`.

## Verification

From `contracts/`:

```powershell
npm test -- --grep Flare
npm test
```

From `frontend/`:

```powershell
npm run check:flare
npm run lint
npm run build
```

`check:flare` fails if the RPC is not Coston2 chain ID 114, a registry result is
zero, the AssetManager cannot return the FXRP token, or the FTSOv2 read fails.
Live output naturally changes between runs.

## Coston2 deployment

The candidate was deployed on 2026-08-12 and its bytecode and wiring were read
back at Coston2 block `33974221`:

| Contract | Address |
|---|---|
| `PriceOracle` | [`0x92a23E036639f77D34F12624fA0bADb251Ed3725`](https://coston2-explorer.flare.network/address/0x92a23E036639f77D34F12624fA0bADb251Ed3725) |
| `FlareFtsoPriceAdapter` | [`0x28162b1fA606BaC60c0B82075e878fb0C981634C`](https://coston2-explorer.flare.network/address/0x28162b1fA606BaC60c0B82075e878fb0C981634C) |
| `FXRPTreasuryGuard` | [`0x269B22DFF373Bb3aC9c564141edbfe9De3903a40`](https://coston2-explorer.flare.network/address/0x269B22DFF373Bb3aC9c564141edbfe9De3903a40) |

The deployment and role-grant transaction hashes are retained in
`evidence/runtime/coston2-deployment.json`.

## Reproduction procedure

1. Fund the deployment wallet with faucet C2FLR only.
2. Set `PRIVATE_KEY` in `contracts/.env`; never commit it.
3. Run `npm run deploy:flare` from `contracts/`.
4. Record and verify the emitted `PriceOracle`, adapter, FXRP, and guard addresses.
5. Set both public frontend variables above and rebuild.
6. Obtain test FXRP from the official faucet.
7. Record one assessment and one approve or reject receipt from the same wallet.

The deployment script refuses networks other than Coston2 and resolves mutable
Flare dependencies at deployment time.

## Proof boundary

As of 2026-08-12, the contract tests, frontend production build, live Coston2
resolution, deployed contract bytecode, wiring, updater role, and local desktop
dashboard have been verified. The public `/flare` route is live and passed an
unauthenticated content smoke check. Mobile visual QA is still pending. No
wallet-backed FXRP assessment or approval, competition video, or DoraHacks
submission is claimed yet.

## Official references

- [Flare network overview](https://dev.flare.network/network/overview)
- [Flare for React developers](https://dev.flare.network/network/guides/flare-for-react-developers)
- [Build your first FTSO app](https://dev.flare.network/ftso/guides/build-first-app)
- [Read FAssets settings with Node](https://dev.flare.network/fassets/developer-guides/fassets-settings-node)
- [Resolve the FXRP Asset Manager through the registry](https://dev.flare.network/fassets/developer-guides/fassets-asset-manager-address-contracts-registry)
