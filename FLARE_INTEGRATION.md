# SovereignMind on Flare Coston2

This integration preserves the pre-existing Somnia application and adds a narrow,
verifiable Flare path for Flare Summer Signal 2026. It does not claim that the full
treasury stack has moved to Flare.

## What is implemented

- Coston2 is available in the Hardhat and wagmi network configurations (chain ID
  `114`, native token `C2FLR`).
- The frontend `/flare` page resolves `AssetManagerFXRP` and `FtsoV2` through the
  official Flare Contract Registry and displays current XRP/USD and FXRP lot data.
- `FlareFtsoPriceAdapter` reads the official XRP/USD FTSOv2 feed, validates its
  fee and timestamp, normalizes the value to the eight decimals expected by
  SovereignMind, and writes it to `PriceOracle` as `xrp`.
- The adapter can update the oracle only after it is explicitly granted
  `PriceOracle.UPDATER_ROLE`.
- The deployment script refuses networks other than Coston2 and resolves `FtsoV2`
  at deployment time instead of hardcoding a changeable implementation address.

## Data path

```text
Flare Contract Registry
  -> current FtsoV2 address
  -> XRP/USD feed (bytes21 feed ID)
  -> FlareFtsoPriceAdapter
  -> normalize to USD e8
  -> SovereignMind PriceOracle["xrp"]
```

The read-only UI also follows this separate evidence path:

```text
Flare Contract Registry
  -> AssetManagerFXRP.getSettings()
  -> current FXRP lot size
  + FTSOv2 XRP/USD
  -> current USD value of one FXRP lot
```

## Local verification

From `frontend/`:

```powershell
npm run check:flare
npm run lint
npm run build
```

`check:flare` fails if the RPC is not chain 114, either registry lookup returns a
zero address, or the FAssets/FTSO calls fail. Its output is live data and will
change between runs.

From `contracts/`:

```powershell
npm test -- --grep FlareFtsoPriceAdapter
npm test
```

The adapter tests cover dependency validation, exact FTSO fee forwarding, access
through the oracle updater role, decimal normalization, and invalid feed data.

## Deployment (not executed)

1. Add a funded Coston2 private key to `contracts/.env` as `PRIVATE_KEY`.
2. Run `npm run deploy:flare` from `contracts/`.
3. Verify both contracts in the Coston2 explorer.
4. Set the emitted adapter address as
   `NEXT_PUBLIC_FLARE_FTSO_ADAPTER_ADDRESS` in the frontend environment.
5. Rebuild the frontend and exercise one wallet-backed price synchronization.

The deployment script creates a dedicated `PriceOracle` and adapter, then grants
the adapter its updater role. It does not deploy the older Somnia Agent Runner
contracts on Coston2.

## Honest proof boundary

As of 2026-08-12, local tests, the production frontend build, and a public Coston2
read have been verified. No Coston2 contract deployment, wallet transaction,
public frontend deployment, or hackathon submission has been performed by this
setup. The `/flare` UI shows `Deployment pending` until a valid adapter address is
provided.

## Official references

- [Flare network overview](https://dev.flare.network/network/overview)
- [Flare for React developers](https://dev.flare.network/network/guides/flare-for-react-developers)
- [Build your first FTSO app](https://dev.flare.network/ftso/guides/build-first-app)
- [Read FAssets settings with Node](https://dev.flare.network/fassets/developer-guides/fassets-settings-node)
- [Resolve the FXRP Asset Manager through the registry](https://dev.flare.network/fassets/developer-guides/fassets-asset-manager-address-contracts-registry)
