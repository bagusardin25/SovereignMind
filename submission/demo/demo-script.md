# FXRP Treasury Guard Demo Script

Target length: 2 minutes 30 seconds. Record the public `/flare` route with a
Coston2 wallet funded only by faucet assets.

## 0:00–0:20 — Problem and promise

“Treasury software should calculate exposure without taking authority over the
asset. SovereignMind uses Flare to turn my real FXRP balance and the live FTSOv2
price into a policy assessment, while my wallet keeps custody and final control.”

Show the hero, `NO ASSET CUSTODY`, current Coston2 block, and source addresses.

## 0:20–0:50 — Causal Flare evidence

Show the live XRP/USD price and timestamp, wallet FXRP balance, and the Contract
Registry, AssetManagerFXRP, FXRP, and FtsoV2 explorer links. Explain that removing
FTSOv2 or FXRP resolution makes the exposure calculation impossible.

## 0:50–1:25 — Create the decision

Enter a USD limit that produces a visible `REDUCE` signal. Submit `Refresh FTSO &
assess`, confirm the C2FLR feed fee, and open the confirmed transaction receipt.
Point to exposure, limit, feed timestamp, and `Pending approval`.

## 1:25–1:55 — Prove human authority

Approve the unchanged assessment in a separate wallet transaction. Open its
receipt and show the status becoming `Approved`. State clearly that approval
records authority but transfers no FXRP.

## 1:55–2:15 — Fail-closed behavior

Show the stop-rule card. Explain that a changed balance, changed price/timestamp,
new policy, or stale oracle invalidates approval; the automated tests cover these
paths.

## 2:15–2:30 — Provenance and future

Show the prior-work disclosure: the Somnia copilot is the baseline, while the
adapter, guard, FXRP flow, tests, and `/flare` experience are event-period work.
Close with multi-feed and multisig policy support as the next step.
