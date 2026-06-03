# BLOG_POST.md — SovereignMind for Somnia Agentathon 2026

> Target: 1000-1500 words. Audience: Web3 developers, DeFi protocol designers, autonomous agents researchers.

---

## On-Chain AI Executives: Why "Autonomous Agents" Need a New Architecture

*Building SovereignMind for the Somnia Agentathon 2026 — and what we learned pushing AI logic into the consensus layer.*

---

The phrase "autonomous agent" has lost most of its meaning. In 2024, it became a marketing label applied to any bot that could call a smart contract. Most "autonomous" agents in crypto today have this architecture:

```
   ┌──────────────┐
   │  Off-chain   │ ← AI logic lives here
   │  Server      │
   └──────────────┘
         │ signed tx
         ▼
   ┌──────────────┐
   │  On-chain    │ ← Just treasury + role management
   │  Contract    │
   └──────────────┘
```

The "autonomy" is a marketing claim. The reality is a centralized cron job with a wallet attached. The off-chain server:
- Holds the AI model weights
- Runs the inference
- Constructs the rationale
- Signs the transaction
- Sends it to the contract

If the server goes down, the agent stops. If the server is compromised, the agent is compromised. If the operator decides to change the model, the agent silently changes. The on-chain receipt proves only that *something* executed — not that the declared rationale came from the declared model with the declared inputs.

This is a real problem. The promise of autonomous agents is **trustless automation**: you should be able to verify what an agent did, why, and whether it followed its declared logic — without trusting the operator.

### The Somnia unlock

Somnia's Agentic L1 introduces three native primitives that change the architecture:

1. **LLM Inference Agent** — calls an LLM on-chain, returns a verifiable response
2. **JSON API Request Agent** — fetches external data with on-chain verification
3. **LLM Parse Website Agent** — scrapes URLs and returns extracted content on-chain

These aren't libraries — they're consensus-level primitives. The result of an LLM call is part of the block. The hash of the fetched JSON is part of the state transition. You can replay the call and get the same answer.

This means you can build an agent whose *reasoning* is verifiable, not just its *execution*.

### What we built

SovereignMind is a three-agent virtual executive suite running on Somnia Testnet:

- **CEO Agent** — strategic orchestration, calls LLM Inference to get a decision
- **CFO Agent** — risk analysis, calls JSON API for price feeds + LLM Inference for risk scoring
- **CMO Agent** — market intelligence, calls LLM Parse Website to scrape news + LLM Inference for sentiment

The contracts themselves request these primitive agents. They don't trust any off-chain model — the on-chain consensus is the source of truth.

Every 15 minutes, a minimal off-chain orchestrator triggers a decision cycle. The orchestrator does almost no AI work — it just calls `initiateDecisionCycle()` on the CEO contract and funds the agents with enough STT to pay for the primitive calls.

Then the magic happens on-chain:

```
CEO.requestLLMDecision(objective)
   └─ AgentRunner.llmInference(prompt, model)
      └─ returns: (decision_action, rationale, confidence)
CEO.executeDecision(decision)
   └─ if REBALANCE → Treasury.executeRebalance(...)
   └─ if ALLOCATE → Treasury.executeAllocation(...)
   └─ if HOLD      → emit DecisionMade event only
```

The decision is the consensus-validated output of an LLM call. The rationale is a string that can be parsed, quoted, even used as legal evidence. The execution is the on-chain state change.

### Why this is different

**Autonolas** (the most prominent "autonomous agents" protocol) runs agents in off-chain containers. The on-chain contract just holds the bond and rewards. The agent logic is in a Docker image. This is a reasonable design for a marketplace, but it's not "autonomous" in the trustless sense — you trust the container.

**Morpheus** runs an off-chain LLM and posts hashes on-chain. The hash proves consistency, not correctness. You still need to trust the off-chain runner.

**SovereignMind** has no off-chain LLM. The model is a parameter; the prompt is on-chain; the response is in the transaction receipt. Anyone can re-execute the same call and verify the output.

This is a meaningful difference, not a marketing one. It's the difference between *trust the operator* and *verify the chain*.

### The trade-offs we accepted

We won't pretend this is a free upgrade. There are real costs to on-chain AI:

1. **Latency**: A 15-minute cycle is fine for treasury management, bad for HFT.
2. **Primitive cost**: Each LLM call costs STT. We limit cycles to keep spend predictable.
3. **Primitive failure**: If the Agent Runner is down, cycles pause. We have a fallback that records `DecisionOutcome.FAILED` rather than getting stuck.
4. **Limited model choice**: You're constrained to whatever Somnia's Agent Runner supports.

For our use case (autonomous treasury with verifiable decisions), these trade-offs are worth it. For yours, maybe not.

### What's on-chain vs off-chain

Honest accounting, since "autonomous on-chain" gets thrown around a lot:

**On-chain:**
- All contract state (treasury balances, decision logs, agent configs)
- All agent intelligence (LLM calls, JSON fetches, URL parses via Somnia primitives)
- Decision rationale (string stored in event + state)
- All admin authority (multisig-ready)

**Off-chain (intentionally):**
- Cycle scheduling (cron job — could be anyone, even a public script)
- Transaction signing (hot key, restricted to cycle trigger)
- Frontend hosting (Vercel)

The off-chain components are **minimally privileged**. The orchestrator can trigger cycles and fund agents. It cannot:
- Drain treasury
- Change agent parameters
- Disable URL whitelist
- Pause contracts

All of those are gated behind `onlyOwner` and intended for multisig custody.

### What this enables

A sovereign agent has new properties that off-chain agents don't:

- **Replay**: anyone can call the same primitive with the same input and verify the output
- **Audit**: every decision is a queryable event with full context
- **Composability**: other contracts can read the decision log and react
- **Dispute resolution**: if you disagree with a decision, you can re-execute the inference and see whether the chain matches

This last one is underrated. Off-chain agents have no native dispute mechanism — you have to trust logs, social consensus, oracles. On-chain AI has a definitive replay path.

### What we'd build next

If we keep going past the hackathon:

1. **MEV-resistant decision submission**: encrypt the prompt, reveal after cycle completes
2. **Cross-chain agent federation**: CEO on Somnia, CFO on Base, CMO on Inco (FHE) — each with different specialty
3. **Agent reputation market**: weight decisions by historical accuracy (oracle via prediction market)
4. **Constitutional governance**: hard-code rules the agent cannot violate (e.g., "never allocate more than 5% of treasury to a single asset")

### Try it

SovereignMind is live on Somnia Testnet. No signup, no API key — just connect a wallet and watch cycles run.

**Demo**: [sovereignmind-app.vercel.app](https://sovereignmind-app.vercel.app)
**Metrics**: [sovereignmind-app.vercel.app/metrics](https://sovereignmind-app.vercel.app/metrics)
**Code**: [github.com/bagusardin25/SovereignMind](https://github.com/bagusardin25/SovereignMind)

Built for Somnia Agentathon 2026 by Team SovereignMind. Open to feedback, contributions, and questions.
