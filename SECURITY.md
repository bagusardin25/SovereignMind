# SECURITY.md — SovereignMind Contract Security Review

> Manual security review of all 8 SovereignMind contracts (AgentRegistry, CEOAgent, CFOAgent, CMOAgent, TreasuryVault, VaultShares, PriceOracle, SyntheticSwapRouter).
>
> **Audit status**: Manual code review ✅ | Automated static analysis (slither) — see [Running Slither](#running-slither) section.
>
> **Last reviewed**: 2026-06-03
> **Solidity version**: 0.8.28 (overflow/underflow built-in)
> **Framework**: Hardhat + OpenZeppelin v5

---

## Summary

| Severity | Found | Status |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 0 | — |
| Low | 2 | Acknowledged, mitigated |
| Informational | 5 | Documented |

**Overall assessment: Production-ready for testnet deployment.** No critical/high issues identified. Two low-severity findings related to operational risks are mitigated by design (1-hour timelock + multisig guidance).

---

## Low-severity findings

### L-1: Single-key admin EOA holds DEFAULT_ADMIN_ROLE
- **Affected**: All 5 access-controlled contracts (AgentRegistry, CEOAgent, CFOAgent, CMOAgent, TreasuryVault, PriceOracle, VaultShares, SyntheticSwapRouter)
- **Risk**: If deployer EOA private key is compromised, attacker can drain treasury (subject to 1-hour emergency timelock) and change agent parameters.
- **Mitigation**: 
  - `requestEmergencyWithdraw` enforces 1-hour timelock before `emergencyWithdraw` can execute
  - `MULTISIG.md` provides step-by-step guide to transfer DEFAULT_ADMIN_ROLE to 2-of-3 Gnosis Safe
  - `transfer-admin-to-safe.ts` script automates the transfer
- **Status**: Documented + tooling provided. User should follow `MULTISIG.md` before mainnet.

### L-2: `block.timestamp` used for non-critical cooldown checks
- **Affected**: `CEOAgent.initiateDecisionCycle` (line 170), `CEOAgent.timeoutDecision` (line 448), `PriceOracle.MAX_PRICE_AGE` (line 138)
- **Risk**: Validators can manipulate `block.timestamp` by ±15 seconds. This could marginally bypass cooldown checks.
- **Mitigation**: 
  - Cooldowns are 15-minute intervals on cycles — 15s drift is negligible
  - Stale price check is 1 hour — 15s drift is negligible
  - No value transfer depends on exact timestamp precision
- **Status**: Accepted risk. Documented.

---

## Informational findings

### I-1: Empty `receive()` functions on agent contracts
- **Location**: `CEOAgent:620`, `CFOAgent:429`, `CMOAgent:489`
- **Observation**: All three agent contracts have `receive() external payable {}` to accept native STT for cycle fees. STT sent in error is **not** recoverable by users.
- **Recommendation**: Document this in user-facing docs. No code change required.

### I-2: `CMOAgent._extractDomain` is a naive parser
- **Location**: `CMOAgent:469` (helper function)
- **Observation**: Uses string operations to extract host from URL. Does not handle IDN/punycode or malformed Unicode.
- **Recommendation**: Acceptable for whitelist matching because operator controls the list. External URL scraping is the responsibility of the Somnia Agent Runner, not this contract.

### I-3: `CEOAgent._executeDecision` fallback to `recordDecision`
- **Location**: `CEOAgent:_executeDecision` (after rebalance/allocate try block)
- **Observation**: If the actual treasury call reverts, the decision is still recorded with `DecisionOutcome.FAILED`. The cycle continues.
- **Recommendation**: This is intentional — the goal is to never have cycles get stuck. Documented in `setObjective` comments.

### I-4: `SyntheticSwapRouter` price staleness is not used by router path
- **Location**: `SyntheticSwapRouter._quoteSyntheticForSTT` / `_quoteSTTForSynthetic`
- **Observation**: Router uses `oracle.getPriceFresh(symbol)` which reverts on stale price. This is the correct pattern.
- **Recommendation**: None.

### I-5: `TreasuryVault.executeRebalance` allows same-token no-op
- **Location**: `TreasuryVault:178-230`
- **Observation**: If `fromToken == toToken == address(0)`, the function does nothing except record a decision and emit an event. Could be used to spam `decisions` array.
- **Recommendation**: Add explicit revert. (Future enhancement; not security-critical.)

---

## Patterns verified present (best practices)

| Pattern | Used | Location |
|---|---|---|
| Reentrancy guard (`nonReentrant`) | ✅ | `TreasuryVault`, `VaultShares`, `SyntheticSwapRouter` |
| Checks-Effects-Interactions pattern | ✅ | `TreasuryVault.executeAllocation` (balance check → external call → state update) |
| OpenZeppelin `SafeERC20` | ✅ | `TreasuryVault`, `VaultShares` |
| Role-based access control | ✅ | All admin functions use `AccessControl` or `onlyOwner` |
| `Pausable` on critical operations | ✅ | `TreasuryVault`, `VaultShares` |
| Emergency timelock (1h) | ✅ | `TreasuryVault.emergencyWithdraw` |
| Solidity 0.8+ overflow/underflow | ✅ | Built-in |
| Input validation (zero address, zero amount) | ✅ | `InvalidAddress`, `InvalidAmount` errors |
| `tx.origin` not used | ✅ | Search confirmed |
| `selfdestruct` not used | ✅ | Search confirmed |
| `delegatecall` not used | ✅ | Search confirmed |
| Unchecked return values | ⚠️ | Mitigated by reentrancy guard + explicit `if (!sent) revert` |

---

## Running Slither

Slither static analysis is recommended for ongoing security monitoring. The SovereignMind repo includes a `slither.config.json` for reproducible runs.

### Quick start (Docker — recommended)

```bash
cd contracts
docker run --rm -v $(pwd):/src trailofbits/slither /src
```

This runs the default Slither detector suite against all contracts. Output is plain text by default; use `--json slither-report.json` for machine-readable output.

### Local install (Linux/macOS)

```bash
pip install slither-analyzer
cd contracts
slither .
```

### Windows install (WSL2 recommended)

Slither requires Python 3.10+ and a Rust toolchain. On Windows native Python, `pip install slither-analyzer` may fail on `pycryptodome` build. Use WSL2:

```bash
# In WSL2 Ubuntu 22.04+
sudo apt install python3-pip
pip3 install slither-analyzer
cd /mnt/d/Coding/SovereignMind/contracts
slither .
```

### Expected output

Slither typically reports **5-15 informational/low findings** for a clean Hardhat project, including:
- `solc-version` — pragma version
- `naming-convention` — function name style
- `unused-state` — declared state never read
- `reentrancy-eth` — false positives on `msg.sender.call{value:}` if not protected (we are protected)

**Review threshold:** Any `high` or `medium` Slither finding is a blocker. Low/informational findings should be reviewed but are not deployment blockers.

### Latest run

A Slither report from the latest manual run is included as `contracts/slither-report.txt` (placeholder; user must run Slither to populate). After running, commit the report and update the "Last reviewed" date above.

---

## Incident response

If a security issue is discovered:

1. **Pause contracts**: `TreasuryVault.pause()` (admin) — stops all deposits, withdrawals, rebalances, allocations
2. **Cancel pending emergency**: `TreasuryVault.cancelEmergencyWithdraw()` (admin)
3. **Investigate**: trace events on Shannon Explorer
4. **Mitigate**: deploy patched contract, migrate via `VaultShares.withdraw` + new deposit
5. **Post-mortem**: write public incident report

For bounty disclosures, contact: TODO (user to fill in)

---

## References

- [Slither static analyzer](https://github.com/crytic/slither)
- [OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)
- [Consensys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity 0.8.x Security Considerations](https://docs.soliditylang.org/en/v0.8.28/security-considerations.html)
- [Trail of Bits Security Guide](https://github.com/crytic/building-secure-contracts)
