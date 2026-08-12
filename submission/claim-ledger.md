# Submission Claim Ledger

| Claim | Evidence | Current boundary |
|---|---|---|
| Flare is causal to the flagship flow | Registry, deployed FTSOv2 adapter, FXRP token resolution, guard source and tests | Coston2 bytecode and wiring verified; wallet-backed flow pending |
| The assessment uses the caller's real FXRP balance | `fxrp.balanceOf(msg.sender)` and guard tests | Verified with mock token locally; live wallet receipt pending |
| Price is current and normalized | Adapter freshness checks, oracle updater role, FTSO tests, live read checker | Local contract behavior and public read verified |
| Human authority is separate | `approveAssessment` and `rejectAssessment` plus status events | Local tests verified; public receipts pending |
| The guard cannot custody or transfer FXRP | No token write methods; balance invariance test | Source and local test verified |
| Changed state fails closed | Superseded policy, price/timestamp, balance, and stale-price tests | Local tests verified |
| The `/flare` experience is public and buildable | Next production build, lint, local desktop rendered review, Vercel production record and unauthenticated HTTP smoke check | Public route verified; mobile visual review pending |
| Work is meaningfully new | Git diff and baseline/delta disclosure | Must preserve commit history and disclosure |

Never upgrade a pending boundary to “verified” without a direct explorer receipt,
public URL, or reproducible command output.
