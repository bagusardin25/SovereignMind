# SovereignMind

## Autonomous On-Chain Agentic Venture Guild

**Product Requirements Document | v2.0 | May 2026**

**Revised: Somnia Native Architecture (post-workshop)**

---

| **Hackathon** | Somnia Agentathon 2026 |
|---------------|------------------------|
| **Track** | Novel & High-Impact Agent-Driven Applications |
| **Version** | v2.0 — Updated post "How to Build on Somnia" Workshop |
| **Key Checkpoint** | May 27, 2026 — Project Registration + Team CV Upload |
| **Next Workshop** | May 29, 2026 — How to Win a Hackathon (Encode Club CEO) |

---

## Changelog: v1.0 → v2.0

> ⚠️ **Perubahan Arsitektur Mayor**
>
> Setelah workshop "How to Build on Somnia" (Zoom, May 2026), ditemukan bahwa Somnia Agentic L1 menyediakan native agent compute on-chain. Seluruh agent logic tidak perlu dijalankan di server off-chain (Railway/Python). PRD ini merevisi arsitektur secara fundamental.

| **Komponen** | **v1.0 (Lama)** | **v2.0 (Revised)** | **Alasan Perubahan** |
|--------------|-----------------|--------------------|----------------------|
| Agent Orchestration | CrewAI framework (Python, Railway) | Somnia native `createRequest()` on-chain | Somnia sudah handle orchestration via validator nodes |
| LLM Inference | Anthropic API dari Python backend | Somnia LLM Inference Agent (on-chain, deterministic) | Deterministic byte-identical output — lebih cocok untuk consensus |
| Price Feed / Data | CoinGecko API dari Python | Somnia JSON API Request Agent (on-chain) | Native on-chain data fetching tanpa middleware |
| Market Intel | Web scraping dari Python | Somnia LLM Parse Website Agent (on-chain) | Native website parsing dengan confidence threshold |
| Backend Server | FastAPI di Railway (core logic) | Minimal read-only API (opsional) | Logic pindah ke contract — backend hanya untuk frontend data |
| Agent Memory | Redis Upstash | On-chain state + Somnia execution receipts | Receipts API sudah menyediakan audit trail publik |
| Deployment complexity | Tinggi (Python + Docker + Railway) | Rendah (Solidity + Vercel frontend) | Stack jauh lebih sederhana dan sesuai Somnia primitives |

---

## 1. Executive Summary

**SovereignMind** adalah platform agent-native pertama yang mendeploy jaringan kolaboratif agen AI otonom sebagai "virtual executive suite" on-chain, dibangun sepenuhnya di atas **Somnia Agentic L1 native primitives**. Berbeda dari solusi DeFi automation yang bergantung pada off-chain servers, SovereignMind menjalankan seluruh agent logic — reasoning, data fetching, dan eksekusi — secara on-chain melalui mekanisme consensus Somnia.

Tiga agen spesialis (CEO, CFO, CMO) diimplementasikan sebagai Solidity contracts yang memanggil Somnia's 3 native base agents: LLM Inference Agent, JSON API Request Agent, dan LLM Parse Website Agent. Setiap keputusan menghasilkan public execution receipt yang dapat diverifikasi siapapun — menjadikan SovereignMind sebagai autonomous treasury manager yang sepenuhnya transparan dan tidak bergantung pada single point of failure.

---

## 2. Somnia Agentic L1 — Primer Teknis

### 2.1 Cara Kerja Somnia Native Agents

Somnia Agentic L1 mengatasi keterbatasan EVM tradisional dengan menyediakan decentralized sandbox compute containers yang dijalankan oleh subcommittee validator nodes. Alur kerjanya:

1. **Request:** Smart contract memanggil `createRequest()` atau `advancedRequest()` ke Somnia Agent Runner, melampirkan deposit (agent fee + gas) dan callback function selector.
2. **Compute:** Subcommittee validator nodes menjalankan job (LLM inference, API fetch, website parse) secara off-chain tetapi dalam consensus framework.
3. **Consensus:** Nodes mencapai Byzantine Fault Tolerant (BFT) consensus pada output sebelum hasilnya di-post ke L1 contract.
4. **Callback:** Hasil dikembalikan ke contract pemohon via `handleResponse(bytes32 requestId, bytes[] responses, uint8 status)` callback.
5. **Receipt:** Setiap eksekusi menghasilkan public execution receipt (JSON) yang dapat diakses via Receipts API.

### 2.2 Tiga Native Base Agents Somnia

| **Agent** | **Fungsi** | **Penggunaan di SovereignMind** |
|-----------|------------|-------------------------------|
| **JSON API Request Agent** | Fetch structured data dari public API dengan custom selectors dan decimal padding | CFO Agent: ambil harga token, TVL, volume dari price feed APIs |
| **LLM Inference Agent** | Deterministic AI reasoning: classification, number inference, chat threads, function/tool calling | CEO Agent: strategic decision making; CFO Agent: risk scoring; CMO Agent: signal classification |
| **LLM Parse Website Agent** | Scrape unstructured website → clean markdown → LLM extraction dengan confidence threshold | CMO Agent: ambil market sentiment dari berita/blog DeFi tanpa official API |

### 2.3 Deterministic LLM — Keunggulan Kritis

Berbeda dengan OpenAI/Anthropic yang mengoptimalkan throughput (menghasilkan output non-deterministic), Somnia menggunakan pinned model weights, identical runtimes, dan synchronized seeds di semua node GPU. Hasilnya: **byte-identical outputs** yang memungkinkan distributed nodes mencapai consensus valid — ini yang membuat SovereignMind dapat dipercaya untuk keputusan finansial on-chain.

---

## 3. Problem Statement

### 3.1 Latar Belakang

Pengelolaan treasury DAO dan enterprise on-chain menghadapi tiga masalah struktural:

- **Human bottleneck:** keputusan treasury memerlukan proposal, voting, dan eksekusi manual — rata-rata 5–14 hari per keputusan di saat pasar bergerak dalam hitungan menit.
- **Reactivity gap:** pasar crypto beroperasi 24/7 tetapi tim manusia tidak. Peluang dan risiko kritis sering terlewat di luar jam kerja.
- **Trust & transparency deficit:** solusi otomasi yang ada (cron jobs, off-chain bots) menciptakan single point of failure dan tidak dapat diaudit secara on-chain.

### 3.2 Mengapa Solusi Lama Tidak Cukup

| **Solusi Lama** | **Keterbatasan** |
|-----------------|------------------|
| Oracle networks (Chainlink dll) | Friction tinggi: token management, whitelist, latency; tidak support LLM reasoning |
| Off-chain bots / cron jobs | Single point of failure; tidak transparan; bergantung pada server yang bisa mati |
| DAO governance voting | Terlalu lambat untuk kondisi market real-time; voter apathy; tidak autonomous |
| Traditional DeFi automation | IF-THEN rules saja — tidak ada reasoning, tidak adaptif terhadap kondisi kompleks |

### 3.3 Solusi: Somnia-Native Autonomous C-Suite

SovereignMind menggantikan semua solusi di atas dengan agent loop yang berjalan sepenuhnya on-chain via Somnia — transparan, consensus-verified, tidak bergantung pada server manapun, dan mampu melakukan LLM reasoning untuk keputusan kompleks.

---

## 4. Goals & Non-Goals

### 4.1 Goals (dalam scope hackathon 3 minggu)

- [ ] Deploy minimal 1 agen fungsional (CFO Agent via Solidity + Somnia `createRequest()`) yang mengeksekusi on-chain decision di Somnia Testnet secara otonom.
- [ ] Demonstrasikan full autonomous loop: trigger → Somnia Agent compute → `handleResponse` → on-chain execution → receipt log.
- [ ] Implementasikan minimal 2 dari 3 Somnia native base agents (JSON API + LLM Inference).
- [ ] Frontend dashboard (Next.js) yang menampilkan agent status, decision log via Receipts API, dan treasury state.
- [ ] Demo video 2–5 menit yang merekam full autonomous cycle tanpa human intervention.
- [ ] Public GitHub repository dengan dokumentasi cara replikasi di Somnia Testnet.

### 4.2 Non-Goals

- Tidak membangun off-chain agent server (CrewAI, FastAPI, Railway) — semua logic on-chain via Somnia native.
- Tidak menggunakan Anthropic/OpenAI API secara langsung — LLM inference melalui Somnia deterministic nodes.
- Tidak deploy ke Somnia Mainnet dalam periode hackathon — Testnet cukup untuk evaluasi.
- Tidak membangun sistem governance voting — fokus pada autonomous execution, bukan decentralized decision-making dengan token holder.

---

## 5. System Architecture (Revised)

### 5.1 High-Level Architecture

| **Layer** | **Komponen** | **Teknologi** | **Catatan** |
|-----------|--------------|---------------|-------------|
| Presentation | Dashboard & Monitoring | Next.js 14 + TypeScript + Tailwind + wagmi | Deploy ke Vercel; read-only view via Receipts API & contract events |
| Interaction | Wallet & Contract Interface | ethers.js v6 + RainbowKit | Owner set objective, trigger initial request, manual override/pause |
| Orchestration | CEOAgent.sol | Solidity 0.8.x + Somnia `createRequest()` | Menerima objective, delegasi ke CFO & CMO via sequential `createRequest` calls |
| Finance Agent | CFOAgent.sol | Solidity + JSON API Agent + LLM Inference | Fetch price data, hitung risk metrics, eksekusi rebalancing jika threshold terlampaui |
| Market Agent | CMOAgent.sol | Solidity + LLM Parse Website + LLM Inference | Ambil market intel, generate buy/sell/hold signal, kirim ke CEO |
| Treasury | TreasuryVault.sol | Solidity + OpenZeppelin | Menyimpan aset; hanya menerima perintah dari authorized agent addresses |
| Audit | DecisionLog (on-chain) | Solidity events + Somnia Receipts API | Setiap keputusan tercatat; dapat diakses publik via `receipts.net.somnia.host` |
| Compute | Somnia Agent Runner | Somnia Agentic L1 (validator nodes) | BFT consensus pada LLM output & API data sebelum dikirim ke contract |

### 5.2 Request-Response Flow (Solidity Pattern)

Setiap agent interaction mengikuti async pattern bawaan Somnia:

1. **Step 1 — Request:** Contract memanggil `createRequest()` dengan deposit kalkulasi (agent fee + gas), payload data (endpoint/prompt), dan callback selector.
2. **Step 2 — Compute:** Somnia validator subcommittee menjalankan job (fetch API / run LLM / parse website) dan mencapai BFT consensus pada output.
3. **Step 3 — Callback:** Agent Runner memanggil `handleResponse(requestId, responses, status)` di contract pemohon dengan data hasil consensus.
4. **Step 4 — Execution:** Contract memproses response, membuat keputusan, dan mengeksekusi aksi (transfer, rebalance, log decision).
5. **Step 5 — Receipt:** Public execution receipt (JSON) tersedia via Receipts API untuk audit dan frontend display.
6. **Step 6 — Rebate:** Contract menerima gas/budget rebate otomatis via `receive()` function jika ada sisa deposit.

### 5.3 Security Requirements

Sesuai best practice dari workshop Somnia:

- Setiap `handleResponse()` harus memvalidasi bahwa `msg.sender` adalah official Somnia Agent Runner address — bukan arbitrary caller.
- Setiap `requestId` yang masuk harus dicocokkan dengan mapping internal `requestId` yang aktif — mencegah replay attacks.
- `TreasuryVault.sol` hanya menerima perintah dari `AgentRegistry` — tidak ada direct external calls.
- Semua agent address terdaftar di `AgentRegistry.sol` yang hanya owner bisa update.

---

## 6. Smart Contract Specification

### 6.1 CEOAgent.sol

Kontrak utama yang menjadi entry point sistem. Bertanggung jawab atas orchestrasi keseluruhan.

- **Fungsi `setObjective(string objective)`:** dipanggil owner untuk menetapkan tujuan strategis baru.
- **Fungsi `runCycle()`:** memulai satu siklus autonomous — memanggil `requestMarketIntel()` dan `requestRiskAssessment()` secara sequential via `createRequest()`.
- **`handleResponse()`:** menerima hasil dari Somnia Agent Runner, mensintesis output CFO + CMO, membuat final decision.
- **Fungsi `executeFinalDecision()`:** setelah synthesis, memanggil TreasuryVault jika keputusan adalah rebalance/allocate.
- **Emit event `DecisionMade(timestamp, rationale, action, txHash)`** untuk setiap keputusan.

### 6.2 CFOAgent.sol

Kontrak spesialis keuangan. Dipanggil oleh CEO Agent untuk risk assessment.

- Menggunakan **JSON API Request Agent** untuk fetch harga token dan TVL dari price feed API.
- Menggunakan **LLM Inference Agent** (`infer number`) untuk menghitung composite risk score berdasarkan data yang difetch.
- Mengembalikan risk report terstruktur ke CEO Agent via on-chain state setelah `handleResponse()` selesai.
- Jika diberi otorisasi execute oleh CEO, langsung memanggil `TreasuryVault.rebalance()`.

### 6.3 CMOAgent.sol

Kontrak spesialis market intelligence. Dipanggil oleh CEO Agent untuk market signals.

- Menggunakan **LLM Parse Website Agent** untuk scrape sentiment dari sumber berita DeFi tanpa official API.
- Menggunakan **LLM Inference Agent** (string classification: 'bullish' / 'bearish' / 'neutral') untuk mengklasifikasikan signal.
- Mengembalikan market brief terstruktur ke CEO Agent.

### 6.4 TreasuryVault.sol

Contract yang menyimpan dan mengelola aset treasury.

- **Fungsi `deposit()`:** owner dapat menyetor aset ke vault.
- **Fungsi `rebalance(address token, uint256 amount, address target)`:** hanya dapat dipanggil oleh authorized agent (CFO) setelah CEO approval.
- **Modifier `onlyAuthorizedAgent`:** validasi via AgentRegistry.
- **Emit event `Rebalanced(timestamp, token, amount, reason)`** untuk setiap eksekusi.

### 6.5 AgentRegistry.sol

Registry yang mendaftarkan dan mengotorisasi agent addresses.

- Mapping `agentAddress => AgentRole` (CEO / CFO / CMO).
- Hanya owner yang dapat add/remove agent addresses.
- Digunakan oleh TreasuryVault sebagai source of truth otorisasi.

---

## 7. Technology Stack (Revised v2.0)

| **Layer** | **Teknologi** | **Justifikasi** |
|-----------|---------------|-----------------|
| Smart Contracts | Solidity 0.8.x | Bahasa utama — semua agent logic ada di sini, bukan di Python |
| Contract Development | Hardhat + TypeScript | Best tooling untuk pemula; test, deploy, verify di Somnia Testnet |
| Somnia Integration | Somnia Agent Runner SDK / `createRequest()` | Native primitive — ini inti dari keseluruhan sistem |
| Contract Interaction (Frontend) | ethers.js v6 + wagmi v2 + viem | Standard EVM wallet connect; Somnia EVM-compatible |
| Wallet UI | RainbowKit | Zero-config wallet modal; support MetaMask + WalletConnect |
| Frontend Framework | Next.js 14 + TypeScript + Tailwind CSS | Familiar, server components untuk real-time data polling |
| Receipts Display | Somnia Receipts API (`receipts.net.somnia.host`) | Fetch dan tampilkan public execution receipts di dashboard |
| Frontend Deploy | Vercel (Hobby — gratis) | Zero-config Next.js deploy, HTTPS otomatis, CI/CD dari GitHub |
| Contract Deploy | Somnia Testnet via Hardhat scripts | Sesuai dokumentasi resmi `docs.somnia.network` |
| Version Control & CI | GitHub (public repo) | Wajib untuk submission; GitHub Actions untuk test otomatis |
| Backend Server | **TIDAK DIPERLUKAN** | Seluruh agent logic on-chain via Somnia — tidak ada Railway/FastAPI |
| External LLM API | **TIDAK DIPERLUKAN** | LLM inference via Somnia deterministic nodes — tidak ada Anthropic/OpenAI API call |

> 💡 **Stack Jauh Lebih Sederhana dari v1.0**
>
> Dengan Somnia native architecture, kita menghilangkan: Python backend, CrewAI, FastAPI, Railway, Redis, PostgreSQL, dan Anthropic API. Stack final hanya: Solidity + Hardhat + Next.js + Vercel. Ini mengurangi kompleksitas setup ~60% dan menghilangkan semua single points of failure.

---

## 8. Deployment Platform (Revised)

| **Komponen** | **Platform** | **Tier** | **Catatan** |
|--------------|--------------|----------|-------------|
| Smart Contracts | Somnia Testnet | Gratis | Deploy via Hardhat; verify di Somnia block explorer; RPC dari `docs.somnia.network` |
| Frontend (Next.js) | Vercel | Hobby (gratis) | Connect GitHub repo → auto deploy on push; custom domain opsional |
| Contract ABIs & Addresses | GitHub repo | Gratis | Di-commit ke repo sebagai JSON; frontend import langsung |
| Receipts & Audit Log | Somnia Receipts API (`receipts.net.somnia.host`) | Gratis (publik) | Tidak perlu database sendiri |
| Backend Server | Tidak ada | — | Dihilangkan dari arsitektur — tidak diperlukan |

**Total biaya operasional selama 3 minggu hackathon: $0 USD.** Seluruh infrastruktur berjalan pada free tier atau Somnia native services.

---

## 9. Development Milestones (Revised)

| **Fase** | **Timeline** | **Deliverable** | **Kriteria Sukses** |
|----------|-------------|-----------------|---------------------|
| **Pre-Checkpoint** (sebelum 27 Mei) | Days 1–3 | Setup Hardhat project; Connect ke Somnia Testnet; Deploy contract HelloWorld sederhana; Register project di Somnia platform; Upload team CV | Contract berhasil di-deploy dan verified di Somnia Testnet; project terdaftar sebelum deadline 27 Mei |
| **Minggu 1** (Days 4–7) | 27–31 Mei | `AgentRegistry.sol` + `TreasuryVault.sol`; `CFOAgent.sol` dengan 1 `createRequest()` ke JSON API Agent; `handleResponse()` pertama berfungsi; Ikuti workshop 29 Mei | CFO Agent berhasil fetch 1 data price dari API melalui Somnia Agent Runner dan menyimpan hasilnya on-chain |
| **Minggu 2** (Days 8–14) | 1–7 Juni | `CEOAgent.sol` orchestration; `CMOAgent.sol` dengan LLM Inference; Full autonomous loop: CEO → CFO → CMO → Decision; `TreasuryVault.rebalance()` dieksekusi oleh agent | Full loop berjalan tanpa human trigger; minimal 1 rebalancing TX dieksekusi autonomously di Somnia Testnet |
| **Minggu 3** (Days 15–21) | 8–14 Juni | Frontend dashboard live di Vercel; Receipts API terintegrasi di UI; End-to-end testing 48 jam; Demo video 2–5 menit; README & dokumentasi lengkap | Dashboard live; demo video merekam full autonomous cycle; semua submission requirements terpenuhi |

---

## 10. Kesesuaian dengan Judging Criteria

| **Kriteria Juri** | **Skor Target** | **Bukti Konkret di SovereignMind** |
|-------------------|-----------------|--------------------------------------|
| **Functionality** | 5/5 | Full autonomous loop end-to-end di Somnia Testnet. Semua TX dapat diverifikasi di block explorer. Dashboard live. Tidak ada critical failure selama demo period 3 minggu. |
| **Agent-First Design** | 5/5 | Sistem dibangun 100% di atas Somnia native agent primitives (`createRequest`, `handleResponse`, 3 base agents). Tidak ada off-chain server. Agent benar-benar discover data dan invoke contract secara mandiri via Somnia consensus. |
| **Innovation & Technical Creativity** | 5/5 | Pertama di ekosistem Somnia yang mengabstraksikan native agent primitives menjadi virtual C-suite metaphor. Penggunaan kombinasi ketiga base agents (JSON API + LLM Inference + LLM Parse Website) dalam satu sistem koordinatif. |
| **Autonomous Performance** | 5/5 | Tidak ada human trigger setelah initial objective di-set. Agent loop berjalan via Somnia validator nodes — tidak ada SPOF. Setiap siklus menghasilkan verifiable on-chain receipt. Demo menunjukkan minimum 3 consecutive autonomous cycles. |

---

## 11. Risiko & Mitigasi (Revised)

| **Risiko** | **Prob.** | **Dampak** | **Mitigasi** |
|------------|-----------|------------|--------------|
| Somnia Testnet RPC tidak stabil | Medium | Tinggi | Rekam successful TX sebelumnya sebagai fallback demo. Pantau status di Somnia Discord. Gunakan retry logic di Hardhat scripts. |
| `createRequest()` deposit calculation salah — TX reverted | Tinggi | Tinggi | Baca kalkulator deposit di `docs.somnia.network`. Test dengan nilai deposit lebih tinggi dulu, optimasi belakangan. Implementasikan `receive()` untuk rebate. |
| `handleResponse()` tidak pernah dipanggil (job stuck) | Medium | Tinggi | Implementasikan timeout fallback di contract. Gunakan `agents.somnia.network` untuk monitor job status. Bergabung Somnia Discord untuk support cepat. |
| Scope terlalu luas — 3 contract sekaligus | Tinggi | Tinggi | Priority: `CFOAgent.sol` dulu (paling simple: JSON API fetch + threshold check). CEO dan CMO menyusul. Demo dengan 1 agent fully working lebih baik dari 3 agent setengah jadi. |
| Kurang pengalaman Solidity — bug di contract | Tinggi | Medium | Gunakan OpenZeppelin contracts sebagai base. Tulis unit tests di Hardhat untuk setiap fungsi. Minta review di Somnia Discord developer channel. |
| Somnia LLM output unexpected format | Medium | Medium | Gunakan `allowed_values` parameter di LLM Inference Agent untuk constrain output. Test dengan simple classification dulu (bullish/bearish/neutral) sebelum complex reasoning. |

---

## 12. Open Questions untuk Somnia Team

Pertanyaan-pertanyaan ini perlu dikonfirmasi di Somnia Discord atau workshop 29 Mei:

- Berapa rata-rata latency antara `createRequest()` dipanggil dan `handleResponse()` diterima di Somnia Testnet?
- Apakah ada limit jumlah pending requests per contract address di Somnia Agent Runner?
- Apakah `advancedRequest()` tersedia di Testnet, atau hanya `createRequest()`?
- Bagaimana format exact untuk deposit calculation — apakah ada helper function atau formula di SDK?
- Apakah Receipts API (`receipts.net.somnia.host`) memerlukan API key atau fully public?
- Apakah ada contoh contract Solidity yang menggunakan ketiga base agents sekaligus yang bisa dijadikan referensi?
- Apakah juri mengevaluasi berdasarkan Testnet deployment atau ada requirement khusus lainnya?

---

## 13. Definisi Sukses

- [ ] `CEOAgent.sol` berhasil mendelegasikan ke `CFOAgent.sol` dan `CMOAgent.sol` via Somnia `createRequest()` di Testnet.
- [ ] Minimal 3 consecutive autonomous decision cycles berjalan tanpa human trigger setelah initial objective di-set.
- [ ] Minimal 1 `TreasuryVault.rebalance()` dieksekusi secara otonom oleh CFO Agent.
- [ ] Semua execution receipts dapat diakses publik via Somnia Receipts API.
- [ ] Dashboard live di Vercel URL publik, menampilkan real-time agent status dan decision history.
- [ ] Demo video 2–5 menit diunggah dan tercantum di GitHub README.
- [ ] GitHub repository publik dengan README berisi: arsitektur diagram, setup instructions, Testnet contract addresses, dan link demo.

---

*SovereignMind — PRD v2.0 | Somnia Native Architecture | Somnia Agentathon 2026*
