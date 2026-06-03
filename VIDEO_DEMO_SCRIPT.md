# VIDEO DEMO SCRIPT — SovereignMind

> **Target:** 90-120 detik (1.5-2 menit)
> **Format:** Loom recording (1080p, 16:9)
> **Audience:** Hackathon judges (Somnia Agentathon 2026)
> **Style:** Screen recording + voiceover. Tidak perlu B-roll atau face-cam.

---

## Setup Sebelum Rekam

1. Buka tab baru:
   - `https://sovereignmind-app.vercel.app` (landing page)
   - `https://sovereignmind-app.vercel.app/dashboard` (live console)
   - `https://sovereignmind-app.vercel.app/agents` (agent detail)
   - `https://shannon.somnia.network/address/0x...` (block explorer, paste CEO contract address)
2. Wallet connect dengan 1-2 STT di Somnia Testnet
3. Trigger 1 decision cycle via UI (atau `curl POST` ke orchestrator dengan AUTH_TOKEN)
4. Close semua tab lain, hide notification
5. Cursor: gunakan pointer highlight, gerak slow

---

## TIMELINE (detik 0 → 90)

### 0-5s | HOOK
**TAMPILAN:** Full landing page
**NARASI:**
> "SovereignMind: three AI agents running as Solidity contracts on Somnia — making treasury decisions, every step on-chain, every receipt verifiable."

**CATATAN:** Cursor hover hero CTA "Enter Dashboard" tapi JANGAN klik dulu.

---

### 5-25s | ARSITEKTUR (How It Works section)
**TAMPILAN:** Scroll slow ke section "How It Works"
**NARASI:**
> "The CEO, CFO, and CMO agents live in Solidity. They use Somnia's native primitives — LLM Inference, JSON API Request, LLM Parse Website — to fetch live market data, assess risk, and reach consensus."

> "The CEO then executes the decision: rebalance, allocate, or hold. All on-chain, no off-chain trust."

**CATATAN:** Highlight tiap card (CEO/CFO/CMO) saat menyebut. Perlihatkan stack LLM/JSON/Parse tags.

---

### 25-45s | LIVE DEMO (Dashboard)
**TAMPILAN:** Klik "Enter Dashboard" → land di /dashboard
**NARASI:**
> "Here's the live console. Every decision is fetched from on-chain CEO and Treasury events. No mock data."

> "You can see recent decisions here — every action, every rationale, every timestamp. Click any receipt to verify on the Somnia block explorer."

**AKSI:** Klik salah satu decision → buka receipt link di new tab → block explorer page. Highlight hash.

**CATATAN:** Tunjukkan 5-7 recent decisions. Kalau belum ada, trigger 1 cycle dulu sebelum rekam.

---

### 45-65s | AGENT DETAIL
**TAMPILAN:** Navigate ke /agents → klik CEO_Prime card
**NARASI:**
> "Each agent has its own detail page. CEO_Prime shows: current objective, decision count, cycle metrics, and the last 20 executive decisions."

> "CFO_Quant handles treasury risk — fetching live prices via JSON API, scoring risk, and triggering rebalance."

**AKSI:** Show "Current Objective" card (display on-chain value).

**CATATAN:** Show 2-3 agent detail screens cepat (15-20 detik total). Highlight the "Current Objective" field — it's set on-chain by operator.

---

### 65-85s | ON-CHAIN VERIFICATION
**TAMPILAN:** Switch ke block explorer tab (sudah dibuka)
**NARASI:**
> "And here's proof it really happened on-chain. The CEO agent emitted a DecisionMade event, then a DecisionExecuted event. The transaction hash is on the Somnia blockchain."

> "Anyone — any judge, any user — can verify this independently. No special access needed."

**AKSI:** Scroll through event log. Highlight DecisionMade + DecisionExecuted.

**CATATAN:** Tunjukkan tx hash, block number, timestamp. Ini the money shot.

---

### 85-90s | CLOSER
**TAMPILAN:** Kembali ke landing page
**NARASI:**
> "SovereignMind. On-chain AI governance for autonomous treasuries. Built for the Somnia Agentathon 2026."

**AKSI:** Fade out ke logo.

**TEXT ON SCREEN:**
> github.com/bagusardin25/SovereignMind

---

## Pacing Notes

| Section | Duration | Pace | Tone |
|---|---|---|---|
| Hook | 5s | Snappy | Exciting, confident |
| Architecture | 20s | Medium | Educational |
| Live demo | 20s | Slow, deliberate | "Look how it works" |
| Agent detail | 20s | Medium | Feature highlight |
| On-chain proof | 20s | Slow, emphasis | Authoritative |
| Closer | 5s | Snappy | Memorable |

**Total: 90s** — under 2 menit untuk hormati waktu juri.

---

## Post-Production Checklist

- [ ] Trim ke 90-120 detik
- [ ] Add Somnia Agentathon logo (small, bottom-right) di 0:00-0:05 dan 1:25-1:30
- [ ] No background music (atau royalty-free, very low volume)
- [ ] Captions/subtitles (Loom auto-generates, review untuk typo)
- [ ] Embed di README.md:
  ```markdown
  ## 📹 Live Demo
  [![SovereignMind Demo](https://cdn.loom.com/sessions/thumbnails/...-with-play.gif)](https://www.loom.com/share/...)
  ```

---

## Kalau Rekam Ulang (Common Mistakes)

1. **Jangan baca script terlalu cepat** — juri skip video yang terlalu cepet
2. **Jangan lompat-lompat** — continuity penting. Plan transisi: "let's go to..."
3. **Jangan lupa show block explorer** — ini the killer proof
4. **Jangan sebut "fully autonomous"** — setelah audit fix, marketing copy kita sudah jujur soal hybrid architecture. Use "on-chain agents with scheduled orchestrator"
5. **Jangan over-promise** — kalau ada bug, akui "still working on X" — judges respect honesty
