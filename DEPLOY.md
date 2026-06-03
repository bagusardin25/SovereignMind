# DEPLOY GUIDE — SovereignMind v4

> Step-by-step untuk deploy sistem Synthetic Portfolio (PriceOracle, SwapRouter, VaultShares, sBTC/sETH/sSOL) ke Somnia Testnet.

## Prerequisites

- Node.js >= 20
- Wallet deployer dengan minimal **5 STT** untuk gas (~10 transaksi deploy + role grant)
- `PRIVATE_KEY` wallet deployer di `contracts/.env`
- Semua test pass: `npx hardhat test`

## Step 1: Setup env

```bash
cd contracts
cp .env.example .env
# Edit .env: isi PRIVATE_KEY wallet deployer
```

Verifikasi:
```bash
npx hardhat console --network somnia
> await ethers.provider.getBalance("<YOUR_ADDRESS>")
# Harus > 5.0 (STT)
```

## Step 2: Konfirmasi Agent IDs

Di `scripts/deploy-v4.ts` baris 31-39, ada 3 agent ID:
- `JSON_API_AGENT_ID` (default: `13174292974160097713`)
- `LLM_INFERENCE_AGENT_ID` (default: `12847293847561029384`)
- `LLM_PARSE_WEBSITE_AGENT_ID` (default: `12875401142070969085`)

Jika Somnia Agent IDs resmi berbeda, override via env:
```bash
export JSON_API_AGENT_ID=...
export LLM_INFERENCE_AGENT_ID=...
export LLM_PARSE_WEBSITE_AGENT_ID=...
```

## Step 3: Dry-run via local hardhat (optional, recommended)

```bash
npx hardhat run scripts/deploy-v4.ts --network hardhat
```

Harus exit 0 dan print 10 alamat kontrak.

## Step 4: Deploy ke Somnia Testnet

```bash
npx hardhat run scripts/deploy-v4.ts --network somnia
```

Output yang diharapkan:
```
═══════════════════════════════════════════════
  SovereignMind v4 — Synthetic Portfolio System
═══════════════════════════════════════════════

1/10 Deploying AgentRegistry...
   ✅ AgentRegistry: 0x...
2/10 Deploying PriceOracle...
   ✅ PriceOracle: 0x...
3/10 Deploying SyntheticTokens...
   ✅ sBTC: 0x...
   ✅ sETH: 0x...
   ✅ sSOL: 0x...
4/10 Deploying SyntheticSwapRouter...
   ✅ SyntheticSwapRouter: 0x...
5/10 Deploying VaultShares...
   ✅ VaultShares: 0x...
6/10 Deploying TreasuryVault...
   ✅ TreasuryVault: 0x...
7/10 Deploying CFOAgent...
   ✅ CFOAgent: 0x...
8/10 Deploying CMOAgent...
   ✅ CMOAgent: 0x...
9/10 Deploying CEOAgent...
   ✅ CEOAgent: 0x...
10/10 Configuring roles...
   ✅ All roles granted

═══════════════════════════════════════════════
  DEPLOY COMPLETE
═══════════════════════════════════════════════
```

## Step 5: Update `deployed-addresses.json`

Script otomatis menulis ke `contracts/deployed-addresses.json` (10 kontrak: agentRegistry, priceOracle, sBTC, sETH, sSOL, syntheticSwapRouter, vaultShares, treasuryVault, ceoAgent, cfoAgent, cmoAgent).

**PENTING**: Copy file ini ke:
- `frontend/src/lib/somnia/deployed-addresses.json`
- `orchestrator/.deployed-addresses.json` (jika dipakai)

## Step 6: Fund agent wallets

```bash
npx hardhat run scripts/fund-agents.ts --network somnia
```

Kirim ~0.1 STT ke tiap agent untuk biaya `createRequest` deposit.

## Step 7: Verify portfolio page works

1. `cd ../frontend && npm run dev`
2. Buka http://localhost:3000/portfolio
3. Seharusnya tidak ada "Not Configured" — semua address populated
4. Coba deposit/withdraw kecil (0.01 STT)

## Step 8: Update orchestrator config

Edit `orchestrator/.env`:
```bash
VAULT_SHARES_ADDRESS=0x...
SWAP_ROUTER_ADDRESS=0x...
PRICE_ORACLE_ADDRESS=0x...
```

Restart orchestrator. Step `PORTFOLIO_REBALANCE` di log harus `isConfigured: true`.

## Rollback (kalau gagal)

Semua kontrak v4 baru, jadi tidak akan break v3. Untuk balik ke v3:
```bash
git checkout main -- contracts/deployed-addresses.json
git checkout main -- frontend/src/lib/somnia/deployed-addresses.json
```

v3 agents (CEO/CFO/CMO) tetap functional tanpa v4.

## Cost Estimate (per 2026-06-03)

| Step | Gas (est) | STT (est) |
|---|---|---|
| Deploy 9 contracts | ~12M | ~0.6 |
| Role grants (~6) | ~0.6M | ~0.03 |
| Fund agents (3) | ~0.15M | ~0.01 |
| **Total** | **~13M** | **~0.65** |

Buffer: **5 STT** sudah cukup.

## Troubleshooting

**"Insufficient funds"** → Wallet < 5 STT. Tambah di https://testnet.somnia.network/

**"Missing AGENT_RUNNER_ADDRESS"** → Set di `contracts/.env`

**"execution reverted: OwnableUnauthorizedAccount"** → Deployer bukan owner. Re-run dengan wallet yang sama dengan v3.

**Portfolio page masih "Not Configured"** → Frontend `lib/somnia/deployed-addresses.json` tidak ter-update. Re-copy dari `contracts/deployed-addresses.json`.

**Orchestrator skip PORTFOLIO_REBALANCE** → Check `VAULT_SHARES_ADDRESS` di `orchestrator/.env` non-empty.
