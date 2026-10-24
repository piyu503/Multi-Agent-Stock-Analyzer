# EquiAgentic - Multi-Agent Architecture & Deliberation Workflow

This document explains in comprehensive detail how the **13 specialized agents** in EquiAgentic (BharatEquity) operate: **where their data originates**, **what each agent receives as input**, **how they process and refine the data**, **which specific models they run on in the heterogeneous multi-model architecture**, and **what analytical decisions and structured execution plans they produce**.

---

## 1. The Raw Data Foundation (100% Free, Zero-API-Key Architecture)

Before any agent begins execution, the platform aggregates verified raw data concurrently from zero-API-key data providers via [`aggregator.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/aggregator.py):

| Source | File / Provider | What is Extracted & Verified |
| :--- | :--- | :--- |
| **Official SQLite DB** | [`database.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/database.py) | Symbol, Exchange (NSE/BSE), ISIN, Series (EQ/BE/SM), 6-digit Scrip Code (cross-exchange ISIN linked with dual-ISIN resolution), Market Cap category, official company name, and full catalog coverage audit. |
| **Yahoo Finance (`yfinance`)** | [`yfinance_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/yfinance_provider.py) | Real-time CMP, 50 & 200 DMA, true 52W High/Low, 14-day Average True Range (ATR), 14-day RSI, 20-day Swing Extremes (Low/High), 20-day Realized Volatility (Annualized %), P/E, P/B, EV/EBITDA, Beta, 30-day average volume, Multi-year Income Statements & Balance Sheets (Revenue, EBITDA, EBIT, PAT, Debt, Equity, Interest Expense, CFO, Capex), Multi-year Margin Stability Spread, true 3-Year Revenue CAGR, and multi-year EPS CAGR. |
| **NSE Microstructure (`stock-nse-india`)** | [`nse_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/nse_provider.py) & [`nse_bridge.cjs`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/nse_service/nse_bridge.cjs) | Real-time security-wise **Delivery Position %** (`deliveryToTradedQuantity`), Delivery Volume, Order Book Depth (total buy bids vs total sell asks, **Bid/Ask Ratio**), and official NSE Corporate Announcements and Board Meetings. |
| **Google News RSS** | [`news_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/news_provider.py) | Live financial press articles, publication dates, publisher sources, and targeted retail discussion streams scored with positive/caution keyword density ratios. |
| **Official BSE Public Notices** | [`bse_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/bse_provider.py) | Official BSE corporate announcements, board meeting outcomes, and regulatory filings (using 6-digit Scrip Code with dual-ISIN resolution and RSS failover). |
| **Sector Peer Benchmarking** | [`peers_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/peers_provider.py) | Comparative peer valuation table (P/E, P/B, Market Cap) queried dynamically from the catalog with live multiple enrichment and 10-minute in-memory caching. |
| **Deterministic Math Engine** | [`metrics.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/metrics.py) | Python-computed Return on Equity (ROE: 45.89%), ROCE (56.29%), Debt-to-Equity, multi-factor Solvency (`equity > 0`, `interest_coverage > 2.0`, `debt_to_equity < 2.5`), ROCE-WACC spread, 3-Year Revenue CAGR, 3-Year EPS CAGR, and PEG Ratio. Eliminates LLM math hallucinations. |

---

## 2. High-Level Multi-Agent Workflow Pipeline

```text
[ Raw Catalogs + yfinance + stock-nse-india + Google News + BSE Notices + Sector Peers ]
                                 │
                                 ▼
                     Stage 0: Research Manager (Qwen 2.5)
                                 │
                                 ▼
         Stage 1: 7 Foundational Analysts (Parallel - Granite & Qwen)
                                 │
                                 ▼ (Aggregated Evidence Pool)
             Stage 2: Bull & Bear (Independent - Qwen 2.5)
                                 │
                                 ▼ (Exchange Theses)
                 Stage 3: Adversarial Rebuttal (Qwen 2.5)
                                 │
                                 ▼
      Stage 4: Risk Analyst (DeepSeek-R1) & Trader Agent (Qwen 2.5)
                                 │
                                 ▼
       Stage 5: Portfolio Manager (DeepSeek-R1 Challenge -> Qwen Verdict)
```

---

## 3. Heterogeneous Multi-Model Architecture & Agent Mapping

Unlike single-model systems that suffer from sycophancy or factual hallucination, EquiAgentic uses a **tier-dispatched multi-model architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EQUIAGENTIC MULTI-MODEL STACK                         │
├────────────────────────────────┬────────────────────────────────────────────┤
│ IBM Granite 3.0 (2B / 8B)      │ Zero-hallucination factual extraction,     │
│ [Extractors & Classifiers]     │ strict constraint adherence, sentiment.    │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Qwen 2.5 / 3.5 (7B / 14B)      │ Domain analysis, structured JSON outputs,  │
│ [Core Analytical Workhorses]   │ financial reasoning, trade desk pacing.    │
├────────────────────────────────┼────────────────────────────────────────────┤
│ DeepSeek-R1 (7B / 8B / 14B)    │ High-order adversarial debate challenge,   │
│ [Adversarial Stress-Testers]   │ stress-testing vulnerabilities, PM critique│
├────────────────────────────────┼────────────────────────────────────────────┤
│ Deterministic Python Engine    │ Mathematical truth: ROCE, ROE, 3Y CAGR,   │
│ [Unbreakable Numerical Anchor] │ RSI-14, ATR, ISIN checksums, Delivery %.   │
└────────────────────────────────┴────────────────────────────────────────────┘
```

### The 13 Specialized Agent Roles & Model Mapping

| # | Agent Role | Model Tier | Default Model | Core Function & Advantage |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Research Manager** | `analyst` | **Qwen 2.5** | Scopes investment hypotheses, sets analysis parameters, and coordinates LangGraph state dependencies. |
| **2** | **Evidence Verification Analyst** | `extractor` | **IBM Granite 3.0** | Audits listing provenance, trading series (`EQ` vs `BE`/`SM`), and ISIN checksums without hallucinating missing records. |
| **3** | **Fundamentals Analyst** | `analyst` | **Qwen 2.5** + Python | Evaluates business durability using deterministic ROE (45.89%), ROCE (56.29%), and solvency guards. |
| **4** | **Growth & Industry Analyst** | `analyst` | **Qwen 2.5** | Assesses macro tailwinds (Make in India, PLI schemes, supply-chain formalization) and secular TAM expansion. |
| **5** | **News & Corporate Events Analyst** | `extractor` $\rightarrow$ `analyst` *(2-Stage)* | **Granite** $\rightarrow$ **Qwen** | **Stage 1 (Granite)** extracts verified facts from official filings $\rightarrow$ **Stage 2 (Qwen)** interprets governance risks and catalysts. |
| **6** | **Social Sentiment Analyst** | `extractor` | **IBM Granite 3.0** | Calibrated sentiment classification (-1.0 to +1.0) of retail discussion headlines without bias. |
| **7** | **Market Analyst** | `analyst` | **Qwen 2.5** + Python | Evaluates 14-day RSI, ATR buffer, and live **NSE Delivery %** + order book depth (`stock-nse-india`). |
| **8** | **Peer & Valuation Analyst** | `analyst` | **Qwen 2.5** + Python | Benchmarks multiples (P/E, P/B, EV/EBITDA, PEG) against peer medians from the SQLite securities master. |
| **9** | **Bull Researcher** | `analyst` | **Qwen 2.5** | Formulates thesis-driven asymmetric upside case under strict factual rules (e.g. cannot label high multiples as cheap). |
| **10** | **Bear Researcher** | `analyst` | **Qwen 2.5** | Adversarial downside stress-test attacking multiple compression and deceleration; prohibited from fabricating debt when D/E < 0.3. |
| **11** | **Trader / Tactical Execution Desk** | `analyst` | **Qwen 2.5** + Python | Formulates concrete institutional execution parameters (`entry_range_low`, `entry_range_high`, `invalidation_stop`, staged tranches). |
| **12** | **Risk Analyst** | `reasoner` | **DeepSeek-R1** | Uses `<think>` chain-of-thought to attack Bull assumptions, uncover balance-sheet fragility, and define invalidation thresholds. |
| **13** | **Portfolio Manager** | `reasoner` $\rightarrow$ `analyst` *(2-Stage)* | **DeepSeek-R1** $\rightarrow$ **Qwen** | **Stage 1 (DeepSeek-R1)** conducts an Investment Committee Cross-Examination $\rightarrow$ **Stage 2 (Qwen)** assigns capital conviction (`OVERWEIGHT`, `NEUTRAL`, `UNDERWEIGHT`) and target allocation (0.0% to 10.0%). |

---

## 4. Detailed Stage-by-Stage Agent Breakdown

---

### STAGE 0: Planning & Hypothesis Formulation

#### 1. Research Manager Agent
- **Assigned Model**: Qwen 2.5 (`analyst`)
- **Inputs**:
  - Raw catalog profile (ISIN, Exchange, Symbol, Company Name, Scrip Code).
  - Enriched live market snapshot (CMP, 52W range, P/E ratio, market cap category).
  - Deterministically calculated financial ratios (`debt_to_equity`, `interest_coverage`, `is_solvent`, `roce_wacc_spread`, `eps_cagr_3yr_pct`, `peg_ratio`).
- **How It Refines & Processes**:
  - Scopes the core analytical narrative: identifies the primary questions the research committee must answer (e.g., capital allocation sustainability, margin compression risks, competitive moat durability).
  - Initializes the LangGraph orchestration state and allocates specialist roles.
- **Output Produced**: Agenda summary, core analytical hypotheses, key questions for investigation, and initial agenda status.

---

### STAGE 1: Foundational Evidence & Specialized Research (Executed Concurrently)

#### 2. Evidence Verification Analyst
- **Assigned Model**: IBM Granite 3.0 (`extractor`)
- **Inputs**: Exchange master records, 12-digit ISIN, trading series, surveillance lists, and BSE scrip metadata.
- **How It Refines & Processes**:
  - Deterministically audits listing parameters: validates ISIN syntax and Luhn algorithm checksum.
  - Verifies whether trading is under standard continuous settlement (`EQ`) or surveillance/caution series (`BE`, `BZ`, `SM`, `ST`).
  - Identifies missing audited statements (e.g., unfiled annual XBRL statements or auditor qualifications).
- **Output Produced**: Data integrity score (0.0–1.0), listing provenance findings, and surveillance warnings.

#### 3. Fundamentals & Business Quality Analyst
- **Assigned Model**: Qwen 2.5 (`analyst`) + Python Math
- **Inputs**: Multi-year income statements, balance sheets, cash flows, free cash flow, Debt/Equity, Interest Coverage, separate ROE and ROCE, and EBITDA margin spread.
- **How It Refines & Processes**:
  - Evaluates balance-sheet durability, working capital cycles, and capital efficiency.
  - Cross-references ROCE vs cost of capital (WACC) to establish economic moat persistence.
  - Solvency check: flags financial distress if total equity $\le 0$.
- **Output Produced**: Core business quality rating, solvency assessment, and cash conversion durability findings.

#### 4. Growth & Industry Analyst
- **Assigned Model**: Qwen 2.5 (`analyst`)
- **Inputs**: Multi-year revenue trajectory, EBITDA trajectory, sector/industry classification, and market cap categorization.
- **How It Refines & Processes**:
  - Evaluates secular vs cyclical industry tailwinds (PLI schemes, domestic capex, formalization).
  - Analyzes volume growth vs pricing power and assesses market share defensibility.
- **Output Produced**: Secular growth vector identification, TAM expansion runway, and capital expenditure catalysts.

#### 5. News, Corporate Events & Earnings-Call Analyst
- **Assigned Model**: Two-Stage: IBM Granite 3.0 (`extractor`) $\rightarrow$ Qwen 2.5 (`analyst`)
- **Inputs**: Real-time Google News RSS articles, official BSE regulatory announcements, NSE disclosures, and scheduled board/earnings meetings.
- **How It Refines & Processes**:
  - **Stage 1 (Granite)**: Extracts strictly verified factual disclosures (board meeting outcomes, dividend announcements, plant approvals) without media spin.
  - **Stage 2 (Qwen)**: Analyzes management changes, capital return policies, pending litigation, and governance catalysts grounded in Granite's audited facts.
- **Output Produced**: Audited corporate event log, upcoming board meeting catalyst warnings, and governance risk flags.

#### 6. Social Sentiment Analyst
- **Assigned Model**: IBM Granite 3.0 (`extractor`)
- **Inputs**: Retail discussion streams, market buzz items, and algorithmic sentiment baseline.
- **How It Refines & Processes**:
  - Classifies retail sentiment without overriding hard fundamental metrics.
  - Detects sentiment divergence: flags retail euphoria during institutional distribution, or retail panic during institutional accumulation.
- **Output Produced**: Sentiment label (`Bullish`, `Neutral`, `Cautious`), signal confidence ratio, and narrative risk flags.

#### 7. Market & Microstructure Analyst
- **Assigned Model**: Qwen 2.5 (`analyst`) + Python Math
- **Inputs**: CMP, 50 & 200 DMA, 52W range, 14-day RSI, 14-day ATR, 20-day realized volatility, 30-day average volume, Beta, and live **NSE Security-wise Delivery Position %** + Order Book Bid/Ask Ratio (`stock-nse-india`).
- **How It Refines & Processes**:
  - Evaluates institutional delivery accumulation vs speculative day-trade turnover.
  - Analyzes trend regime: Golden Cross (50 > 200 DMA) vs Death Cross (50 < 200 DMA) and volatility contraction.
- **Output Produced**: Microstructure liquidity profile, delivery absorption metrics, and technical momentum findings.

#### 8. Peer Benchmarking & Valuation Analyst
- **Assigned Model**: Qwen 2.5 (`analyst`) + Python Math
- **Inputs**: Target stock multiples (P/E, P/B, EV/EBITDA, PEG), dynamic sector peer comparison table, and peer median metrics.
- **How It Refines & Processes**:
  - Benchmarks target stock valuation against industry peer group.
  - Calculates relative premium/discount and establishes margin of safety.
- **Output Produced**: Relative valuation rating, peer multiple dispersion table, and margin of safety findings.

---

### STAGE 2: Independent Thesis Formulation (Zero Cross-Contamination)

#### 9. Bull Researcher Agent
- **Assigned Model**: Qwen 2.5 (`analyst`)
- **Inputs**: Entire aggregated Stage 1 evidence pool.
- **How It Refines & Processes**:
  - Constructs the maximum viable upside thesis: moat durability, pricing power, operating leverage, and margin expansion.
  - Strict institutional rule: cannot label elevated valuation multiples (P/E > 30) as "cheap"; must justify valuation through ROCE compounding and earnings visibility.
- **Output Produced**: Primary Bull Thesis (3–5 points), growth catalysts, and long-term compounding arguments.

#### 10. Bear Researcher Agent
- **Assigned Model**: Qwen 2.5 (`analyst`)
- **Inputs**: Entire aggregated Stage 1 evidence pool.
- **How It Refines & Processes**:
  - Constructs the maximum viable downside thesis: input cost inflation, competitive threats, deceleration, and multiples derating.
  - Strict institutional rule: if Debt-to-Equity is low (< 0.3) or the company is net-debt free, prohibited from fabricating insolvency; must focus on valuation, margin, or operational risks.
- **Output Produced**: Primary Bear Thesis (3–5 points), downside vulnerability catalysts, and derating risks.

---

### STAGE 3: Adversarial Rebuttal & Cross-Examination

#### Bull & Bear Rebuttal Round
- The Bull receives the full Bear Thesis; the Bear receives the full Bull Thesis.
- Both agents execute a single bounded adversarial round:
  - **Bull Rebuttal**: Defends against the Bear's specific risk points using verified operational data.
  - **Bear Rebuttal**: Attacks the Bull's growth and moat assumptions using verified financial metrics.
- **Output Produced**: Refined debate points and **Critical Swing Variables** (the exact triggers that tip the thesis).

---

### STAGE 4: Risk Audit & Tactical Execution Desk

#### 11. Risk Analyst Agent
- **Assigned Model**: DeepSeek-R1 (`reasoner`)
- **Inputs**: Rebuttal debate findings, Bear thesis, debt ratios, interest coverage, and corporate disclosures.
- **How It Refines & Processes**:
  - DeepSeek-R1 `<think>` reasoning conducts an adversarial attack on the Bull's assumptions.
  - Evaluates worst-case scenarios: debt covenant breach, promoter pledging, regulatory penalties, and tail-risk drawdowns.
- **Output Produced**: Ranked downside risk matrix, systemic risk score, and required invalidation triggers.

#### 12. Trader Agent (Tactical Execution Desk)
- **Assigned Model**: Qwen 2.5 (`analyst`) + Python Math
- **Inputs**: CMP, 50/200 DMA, 52W range, 14-day ATR, 20-day swing extremes, realized volatility, 30-day volume, and Bull/Bear debate swing factors.
- **How It Refines & Processes**:
  - Formulates tactical execution: optimal entry bands (`entry_range_low`, `entry_range_high`), invalidation stop-loss (`invalidation_stop`), ATR volatility buffer (`atr_buffer`), and a 3-tranche staged accumulation schedule (`staged_tranches`).
- **Output Produced**: Structured `TacticalExecutionPlan` with concrete rupee levels and tranche allocations.

---

### STAGE 5: Final Conviction Synthesis & Capital Sizing

#### 13. Portfolio Manager Agent
- **Assigned Model**: Two-Stage: DeepSeek-R1 (`reasoner`) $\rightarrow$ Qwen 2.5 (`analyst`)
- **Inputs**: Complete synthesis packet (hypotheses, Bull/Bear debate, Risk audit, Trader plan, deterministic metrics).
- **How It Refines & Processes**:
  - **Stage 1 (DeepSeek-R1)**: Conducts an Investment Committee Cross-Examination, interrogating both sides to detect false confidence and weigh empirical evidence.
  - **Stage 2 (Qwen)**: Synthesizes final capital allocation conviction without naive majority voting.
- **Output Produced**:
  - **Conviction Rating**: Schema-enforced `"OVERWEIGHT"`, `"NEUTRAL"`, or `"UNDERWEIGHT"`.
  - **Target Portfolio Allocation**: Float percentage (0.0% to 10.0%).
  - **Executive Investment Synthesis**: Clear, decisive institutional thesis.
  - **Tactical Execution Plan**: Entry ranges, stop loss, and staged tranches attached directly to the research report.

---

## 5. Local Setup & Model Pull Commands

To run the complete heterogeneous multi-model stack locally in Ollama:

```bash
# 1. Pull the Core Analytical Workhorse:
ollama pull qwen2.5:7b

# 2. Pull the Factual Extractor & Classifier:
ollama pull granite3-dense:2b

# 3. Pull the Adversarial Reasoner:
ollama pull deepseek-r1:7b
```

Configure in `backend/.env`:
```dotenv
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_TEMPERATURE=0.2

# Specialized Model Tier Dispatching:
LLM_MODEL_ANALYST=qwen2.5:7b
LLM_MODEL_EXTRACTOR=granite3-dense:2b
LLM_MODEL_REASONER=deepseek-r1:7b

# Fallback primary model:
LLM_MODEL=qwen2.5:7b
```

> **Zero-Crash Resilience**: If any specialized model is not installed, EquiAgentic's internal model router automatically redirects requests to `LLM_MODEL` with a logged warning, ensuring zero downtime.
