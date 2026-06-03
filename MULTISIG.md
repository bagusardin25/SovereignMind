# MULTISIG GUIDE — SovereignMind Admin Governance

> Setup a 2-of-3 Gnosis Safe as the admin of all SovereignMind contracts. Hot key (orchestrator EOA) remains for cycle automation only.

## Why Multisig?

Currently, the deployer EOA holds `DEFAULT_ADMIN_ROLE` on all contracts. If the EOA is compromised:
- Treasury can be drained via `emergencyWithdraw` (after 1-hour timelock)
- Agent parameters can be changed
- URL whitelist can be disabled
- Critical admin functions are exposed

With a 2-of-3 multisig:
- No single point of failure
- Admin actions require 2 of 3 signers
- Time-locked via Safe queue if needed
- Public on-chain record of every admin action

## Architecture

```
   ┌─────────────────┐
   │  2-of-3 Safe    │  ← admin of all contracts
   │  (multisig)     │
   └─────────────────┘
         │ DEFAULT_ADMIN_ROLE
         │ onlyOwner
         │ grantRole/renounceRole
         ▼
   ┌─────────────────┐
   │   Contracts     │
   │  - CEOAgent     │
   │  - CFOAgent     │
   │  - CMOAgent     │
   │  - TreasuryVault│
   │  - PriceOracle  │
   │  - VaultShares  │
   │  - AgentRegistry│
   └─────────────────┘
         ▲
         │ scheduled cycle (every 15 min)
         │ triggers decisions, funds agents
         │
   ┌─────────────────┐
   │  Orchestrator   │  ← HOT KEY, NOT admin
   │  EOA            │
   └─────────────────┘
```

**Key principle:** The orchestrator EOA is a HOT KEY for cycle automation. It can only:
- Trigger `initiateDecisionCycle()` (open to anyone, cooldown-enforced)
- Fund agent wallets with small amounts of STT

It CANNOT:
- Drain treasury
- Change agent parameters
- Disable URL whitelist
- Pause contracts

All of those are gated behind the Safe.

## Setup Steps

### Step 1: Create the Safe

1. Go to https://safe.global/
2. Connect with the deployer wallet
3. Click "Create new Safe"
4. Select **Somnia Testnet** (chain ID 50312)
5. Add signers:
   - Signer 1: **Deployer EOA** (you)
   - Signer 2: **Hardware wallet** (e.g., Ledger)
   - Signer 3: **Trusted co-signer** (e.g., team member, advisor)
6. Set threshold: **2 of 3**
7. Deploy Safe (gas: ~0.05 STT)
8. Copy the Safe address (e.g., `0x1234...5678`)

### Step 2: Verify signers can access the Safe

Have all 3 signers visit the Safe URL and confirm they can see it.
Test a small transaction: transfer 0.001 STT between signers to confirm quorum works.

### Step 3: Transfer admin role from EOA to Safe

```bash
cd contracts
export SAFE_ADDRESS=0x1234...5678
npx hardhat run scripts/transfer-admin-to-safe.ts --network somnia
```

This script will:
1. Grant `DEFAULT_ADMIN_ROLE` to the Safe on all 5 (+up to 3 optional) contracts
2. Renounce `DEFAULT_ADMIN_ROLE` from the current EOA
3. Print transaction hashes for verification

⚠️ **CRITICAL:** The script grants first, then renounces. If anything fails mid-way, the EOA still has admin and you can retry safely.

### Step 4: Verify on block explorer

Visit each contract on Shannon Explorer (`https://shannon.somnia.network/address/<CONTRACT>#readContract`):
- Query `getRoleMember(DEFAULT_ADMIN_ROLE, 0)` 
- Should return the Safe address, not your EOA

### Step 5: Test admin action via Safe

1. Try calling a `setRebalanceBps(200)` (CEO agent) via Safe UI
2. Confirm the EOA can no longer call it directly (will revert with `OnlyOwner`)

## Ongoing Operations

### Routine admin actions (via Safe)

| Action | Contract | Function | Approvers needed |
|---|---|---|---|
| Change CEO objective | CEOAgent | `setObjective(string)` | 2/3 |
| Adjust cycle interval | CEOAgent | `setCycleInterval(uint256)` | 2/3 |
| Update agent IDs | CFOAgent/CMOAgent | `updateAgentIds(...)` | 2/3 |
| Change rebalance/allocation size | CEOAgent | `setRebalanceBps(uint256)` | 2/3 |
| Add whitelisted domain | CMOAgent | `addWhitelistedDomain(string)` | 2/3 |
| Toggle whitelist enforcement | CMOAgent | `setWhitelistEnabled(bool)` | 2/3 |
| Pause contracts (emergency) | TreasuryVault | `pause()` | 2/3 |
| Emergency withdraw (after 1h timelock) | TreasuryVault | `requestEmergencyWithdraw(address)` | 2/3 |
| Set STT price | PriceOracle | `setSTTPrice(uint256)` | 2/3 |

### Cycle automation (via EOA, no Safe needed)

| Action | Contract | Function | Trigger |
|---|---|---|---|
| Trigger decision cycle | CEOAgent | `initiateDecisionCycle()` | node-cron every 15 min |
| Fund agent wallet | (direct transfer) | `cfoAgent.sendTransaction()` | if balance < MIN_AGENT_BALANCE |

## Recovery Procedures

### Lost signer key (1 of 3 compromised)

The Safe can recover if threshold still met (2/3). Remaining 2 signers can:
1. Use Safe UI to remove the compromised signer
2. Add a new signer
3. The Safe is back to 2/3

### Lost signer key (2 of 3 compromised)

⚠️ **CRITICAL FAILURE.** Safe is stuck. Recovery options:
1. Use the remaining signer to call `SafeNonceIncrease` (if supported)
2. Migrate all contracts to a new Safe: deploy new contracts with the new Safe as admin, accept loss of historical data
3. Last resort: contact Somnia team for hard-fork recovery (likely won't happen on testnet)

**Mitigation:** Distribute signers across 3 different physical locations, hardware, and trusted individuals. Never store all signer mnemonics in one place.

### Orchestrator EOA compromised (not admin anymore)

Since the orchestrator EOA no longer holds admin, the worst case is:
- Attacker can trigger unwanted decision cycles (consuming STT for agent fees)
- Attacker can fund agents with attacker's STT
- Attacker CANNOT drain treasury or change parameters

Mitigation:
- Move orchestrator to a fresh EOA (regenerate `PRIVATE_KEY` in `.env`)
- Restart with new key
- The compromised EOA's old key has no value

## Cost

| Action | Gas (est) | STT (est) |
|---|---|---|
| Deploy Safe (2/3) | ~0.5M | ~0.025 |
| Grant + Renounce × 5 contracts | ~2M | ~0.1 |
| Verify via read call (free) | 0 | 0 |
| **Total one-time** | | **~0.13** |

## References

- [Gnosis Safe docs](https://docs.safe.global/)
- [Somnia Safe support](https://safe.global/SupportedNetworks) (verify Somnia Testnet is supported)
- [OZ AccessControl](https://docs.openzeppelin.com/contracts/5.x/access-control)
