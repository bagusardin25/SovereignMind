# TWITTER_THREAD.md — SovereignMind Launch Thread

> 10 tweets, ~270 chars each. Numbers denote tweet order. Copy/paste directly to Twitter/X.

---

**1/10**
Most "autonomous agents" in crypto have this architecture:

❌ Off-chain server runs the AI
❌ On-chain contract just stores the receipt

The "autonomy" is marketing. The server is the real agent.

We built something different for @SomniaNetwork Agentathon 2026.

🧵👇

---

**2/10**
SovereignMind is a 3-agent executive suite (CEO, CFO, CMO) where the **AI logic itself** runs on-chain via Somnia's native Agent Runner primitives:

🔵 CEO → LLM Inference (decisions)
🟣 CFO → JSON API (prices) + LLM (risk)
🔷 CMO → LLM Parse Website (news) + LLM (sentiment)

---

**3/10**
What "on-chain AI" actually means:

When CEO makes a decision, the LLM call is part of the block. The response is in the transaction receipt. Anyone can re-execute the call and get the same answer.

You don't trust the operator. You verify the chain.

---

**4/10**
The architecture:

```
Cycle trigger (off-chain cron)
  → CEO.requestLLMDecision(objective)
    → AgentRunner.llmInference(prompt, model)
  → CEO.executeDecision(decision)
    → Treasury.executeRebalance(...)
    → OR executeAllocation(...)
    → OR HOLD (event only)
```

15-min cycles. Fully transparent.

---

**5/10**
vs. existing "autonomous agents":

**Autonolas**: AI in Docker containers. On-chain is just a bond.
**Morpheus**: Off-chain LLM + on-chain hash. Hash proves consistency, not correctness.
**SovereignMind**: No off-chain LLM. Prompt is on-chain. Response is in the receipt.

That's a meaningful difference.

---

**6/10**
What's on-chain vs off-chain (honest accounting):

✅ On-chain: All contracts, all AI calls, all decisions, all admin
⚙️ Off-chain: Cycle cron (15 min) + tx signing (hot key)

The off-chain parts are **minimally privileged**:
❌ Can't drain treasury
❌ Can't change parameters
❌ Can't disable URL whitelist
❌ Can't pause contracts

---

**7/10**
Trade-offs (no vaporware):

⏱ Latency: 15-min cycles. Fine for treasury, bad for HFT.
💰 Cost: Each LLM call costs STT. We budget it.
🔌 Uptime: If Agent Runner is down, cycles pause (we record FAILED, don't get stuck).
🎛 Model choice: Constrained to what @SomniaNetwork supports.

For our use case, worth it.

---

**8/10**
New properties this unlocks:

🔁 **Replay** — anyone can verify the same call
📜 **Audit** — every decision is a queryable event
🧩 **Compose** — other contracts can read the decision log
⚖️ **Dispute** — re-execute inference, compare to chain

Off-chain agents have no native dispute path. On-chain AI has a definitive one.

---

**9/10**
Try it now on Somnia Testnet:

🌐 Live demo: sovereignmind-app.vercel.app
📊 Public metrics: sovereignmind-app.vercel.app/metrics
💻 Code (MIT): github.com/bagusardin25/SovereignMind

No signup, no API key. Just connect a wallet.

Built for @SomniaNetwork Agentathon 2026.

---

**10/10**
What's next:

1. MEV-resistant decision submission (encrypted prompts)
2. Cross-chain agent federation (CEO on Somnia, CFO on Base, CMO on FVM)
3. Agent reputation market (prediction-market weighted)
4. Constitutional governance (hard rules agents can't violate)

Feedback welcome. Onwards. 🚀

---

## Posting tips

- **Best time to post**: Tue/Wed 9-10am PT or 1-2pm ET
- **Tag**: @SomniaNetwork (verify handle first), @SomniaLab, $SOMI
- **Add visual**: First tweet should have the hero orb screenshot from the demo
- **Pinned**: Pin the thread to your profile for 1 week
- **Reply strategy**: Reply to each tweet with the architecture diagram or contract addresses within 1 hour of posting
