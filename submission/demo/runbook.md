# Demo Runbook

## Before recording

- Use the deployed addresses recorded in `evidence/runtime/coston2-deployment.json`.
- Confirm the addresses and role-grant transaction in the Coston2 explorer; never expose the private key.
- Configure the adapter and guard public environment variables and rebuild.
- Fund the demo wallet with faucet C2FLR and FXRP.
- Confirm `npm run check:flare`, contract tests, lint, and build still pass.
- Open the public `/flare` URL in a clean browser profile.
- Ensure the wallet is already on Coston2 and no secret material is visible.

## Rehearsal data

1. Note the displayed FXRP balance and calculate a limit below its live USD value.
2. Create a `REDUCE` assessment and wait for confirmation.
3. Open its explorer receipt in a second tab.
4. Approve the assessment and wait for confirmation.
5. Verify the FXRP balance is unchanged before and after both transactions.

## Stop conditions

Stop and do not record a success claim if the RPC is stale, a source address does
not match the deployment output, a receipt is missing, the wallet balance changes,
the public page shows an old build, or any transaction fails.

## Capture checklist

- [ ] Live FTSOv2 value and timestamp
- [ ] Wallet FXRP balance
- [ ] Exposure limit and `REDUCE` signal
- [ ] Assessment receipt
- [ ] Separate approval receipt
- [ ] Same FXRP balance after approval
- [ ] Source contract explorer links
- [ ] Deterministic stop rules
- [ ] Prior baseline and new-work disclosure
