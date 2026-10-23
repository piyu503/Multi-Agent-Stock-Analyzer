# EquiAgentic - Multi-Agent Architecture & Deliberation Workflow

This document explains in comprehensive detail how the **13 specialized agents** in EquiAgentic (BharatEquity) operate: **where their data originates**, **what each agent receives as input**, **how they process and refine the data**, and **what specific outputs, analytical decisions, and structured execution plans they produce**.

---

## 1. The Raw Data Foundation (100% Free, Zero-API-Key Architecture)

Before any agent begins execution, the platform aggregates verified raw data concurrently from five zero-API-key data providers via [`aggregator.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/aggregator.py):

| Source | File / Provider | What is Extracted & Verified |
| :--- | :--- | :--- |
| **Official SQLite DB** | [`database.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/database.py) | Symbol, Exchange (NSE/BSE), ISIN, Series (EQ/BE/SM), 6-digit Scrip Code (cross-exchange ISIN linked with dual-ISIN resolution), Market Cap category, official company name, and full catalog coverage audit. |
| **Yahoo Finance (`yfinance`)** | [`yfinance_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/yfinance_provider.py) | Real-time CMP, 50 & 200 DMA, true 52W High/Low computed deterministically from daily `High.max()` and `Low.min()`, 14-day Average True Range (ATR), 20-day Swing Extremes (Low/High), 20-day Realized Volatility (Annualized %), P/E, P/B, EV/EBITDA, Beta, 30-day average volume, Multi-year Income Statements & Balance Sheets (Revenue, EBITDA, EBIT, PAT, Debt, Equity, Interest Expense, CFO, Capex), Multi-year Margin Stability Spread (`Max EBITDA Margin - Min EBITDA Margin`), and 3-Year EPS CAGR. |
| **Google News RSS** | [`news_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/news_provider.py) | Live financial press articles, publication dates, publisher sources, and targeted retail discussion streams scored with positive/caution keyword density ratios. |
| **Official BSE Public Notices** | [`bse_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/bse_provider.py) | Official corporate announcements, board meeting outcomes, and regulatory filings (using 6-digit Scrip Code with dual-ISIN resolution and resilient RSS failover for Akamai-blocked environments). |
| **Sector Peer Benchmarking** | [`peers_provider.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/data_providers/peers_provider.py) | Comparative peer valuation table (P/E, P/B, Market Cap) queried dynamically from the catalog with live multiple enrichment and 10-minute in-memory caching. |
| **Deterministic Math Engine** | [`metrics.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/metrics.py) | Python-computed Debt-to-Equity, multi-factor Solvency (`interest_coverage > 2.0` and `debt_to_equity < 2.5`), ROCE-WACC economic spread, 3-Year EPS CAGR, and PEG Ratio (`pe_ratio / eps_cagr_3yr_pct`). Eliminates LLM math hallucinations. |

---

## 2. High-Level Multi-Agent Workflow Pipeline

```text
[ Raw Catalogs + yfinance + Google News + BSE Notices + Sector Peers ]
                                 │
                                 ▼
                     Stage 0: Research Manager
                                 │
                                 ▼
             Stage 1: 7 Foundational Analysts (Parallel)
                                 │
                                 ▼ (Aggregated Evidence Pool)
                 Stage 2: Bull & Bear (Independent)
                                 │
                                 ▼ (Exchange Theses)
                     Stage 3: Adversarial Rebuttal
                                 │
                                 ▼
                Stage 4: Risk Analyst & Trader Agent
                                 │
                                 ▼
                  Stage 5: Portfolio Manager (Verdict)
```

---

## 3. Detailed Stage-by-Stage Agent Breakdown

---

### STAGE 0: Planning & Hypothesis Formulation

#### 1. Research Manager Agent
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L32-L113)
- **Inputs**:
  - Raw catalog profile (ISIN, Exchange, Symbol, Company Name, Scrip Code).
  - Enriched live market snapshot (CMP, 52W range, P/E ratio, market cap category).
  - Deterministically calculated financial ratios (`debt_to_equity`, `interest_coverage`, `is_solvent`, `roce_wacc_spread`, `eps_cagr_3yr_pct`, `peg_ratio`).
- **How It Refines & Processes**:
  - Assesses whether the listing has sufficient corporate data to support institutional research.
  - Formulates core investment hypotheses (e.g., whether the primary driver is growth, value re-rating, or debt deleveraging).
  - Scopes priorities and potential blindspots for downstream specialist analysts.
- **Output Produced**:
  - Research scope summary, initial hypotheses, list of specific areas for specialists to investigate, and baseline confidence score.

---

### STAGE 1: Parallel Evidence & Foundational Analysts

*All 7 specialist agents in this stage run concurrently, each consuming only the data relevant to its domain.*

#### 2. Evidence Verification Analyst
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L115-L200)
- **Inputs**: Exchange master data (Symbol, Exchange, ISIN format, Series, Listing Date, Scrip Code, Active Status).
- **How It Refines & Processes**:
  - Runs **Luhn Mod-10 Checksum Algorithm** on the 12-character ISIN code. If the checksum fails (e.g., transcription error `INE002A01019`), flags as `"Checksum Mismatch - Flagged Transcription Error"`. Only valid checksums receive `"Verified Clean"`.
  - Verifies exchange series (e.g., NSE `EQ` regular trading vs illiquid/surveillance series `BE`/`SM`/`ST`).
  - Audits cross-exchange linking (NSE ticker to BSE 6-digit Scrip Code).
- **Output Produced**: Data integrity verification, audit flags on listing parameters, and mathematical checksum validation.

#### 3. Fundamentals & Business Quality Analyst
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L202-L287)
- **Inputs**:
  - Multi-year financial statements (Revenue, EBITDA, PAT, Total Debt, Stockholders Equity, Operating Cash Flow, Capex).
  - Multi-year EBITDA Margin stability spread (`max_margin - min_margin`).
  - Deterministic metrics (`debt_to_equity`, `interest_coverage`, `is_solvent`, `roce_pct`, `net_margin_pct`, `ebitda_margin_pct`).
- **How It Refines & Processes**:
  - Evaluates solvency, balance sheet durability, debt service capability, and free cash flow generation (`CFO - Capex`).
  - Analyzes operating margin trends and return on capital employed (`ROCE`) against cost of capital.
- **Output Produced**: Solvency assessment, operational margin durability, free cash flow profile, and identified balance sheet vulnerabilities.

#### 4. Growth & Industry Analyst
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L289-L373)
- **Inputs**: Sector, industry category, multi-year revenue history, EBITDA trajectory, 3-year EPS CAGR, and Free Cash Flow.
- **How It Refines & Processes**:
  - Contextualizes company revenue against broader Indian macroeconomic catalysts (e.g., Make in India, PLI schemes, domestic consumption, formalization).
  - Evaluates whether revenue expansion is pricing-driven or volume-driven.
- **Output Produced**: 3-to-5 year growth runway evaluation, domestic structural tailwinds, and addressable market expansion capacity.

#### 5. News & Corporate Events Analyst
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L375-L459)
- **Inputs**: Live BSE regulatory disclosures, Board meeting notices, and Google News RSS articles with publication timestamps and publisher metadata.
- **How It Refines & Processes**:
  - Filters out sensationalist clickbait and extracts material events: dividend declarations, capacity expansions, litigation, senior executive exits, or credit rating actions.
- **Output Produced**: Material corporate event timeline, regulatory disclosure review, and event risk score.

#### 6. Social Sentiment Analyst
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L461-L545)
- **Inputs**: Targeted retail discussion stream, headline tone, and deterministic `bullish_signal_ratio`.
- **How It Refines & Processes**:
  - Evaluates tone and retail perception of the stock without allowing hype or sentiment to override hard financial facts.
  - Detects sentiment divergences (e.g. retail euphoria during deteriorating fundamentals).
- **Output Produced**: Retail sentiment classification (Bullish / Neutral / Bearish), signal ratio, and sentiment momentum.

#### 7. Market Analyst
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L547-L633)
- **Inputs**: Current price (CMP), 50-day DMA, 200-day DMA, true 52-week High/Low (from daily `High.max()` and `Low.min()`), 14-day ATR, 20-day swing extremes, 20-day annualized realized volatility, 30-day average trading volume, Beta.
- **How It Refines & Processes**:
  - Compares current price against the 50 DMA and 200 DMA (Golden Cross / Death Cross detection).
  - Measures price distance from 52-week extremes and identifies volatility compression / expansion regimes.
  - Assesses institutional liquidity based on 30-day trading volume.
- **Output Produced**: Trend regime (Bullish / Bearish / Consolidating), volatility regime, price relative to 52W range, and institutional liquidity evaluation.

#### 8. Peer Benchmarking & Valuation Analyst
- **File Reference**: [`analysts.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/analysts.py#L635-L724)
- **Inputs**: Trailing/Forward P/E, P/B, EV/EBITDA, deterministic PEG ratio, ROCE-WACC spread, and Sector Peer Benchmark Table enriched with live peer metrics.
- **How It Refines & Processes**:
  - Assesses whether the valuation multiple is justified by the economic value creation spread (`ROCE - WACC > 0`).
  - Benchmarks the stock against listed sector peers (relative discount or premium).
- **Output Produced**: Valuation summary (Overvalued / Undervalued / Fairly Valued), PEG assessment, and margin of safety score.

---

### STAGE 2: Independent Theses Generation (Zero Cross-Contamination)

*Both researchers receive the complete aggregated `evidence_pool` from Stage 1, but are strictly isolated from seeing each other's work at this stage.*

#### 9. Bull Researcher Agent
- **File Reference**: [`decision_makers.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/decision_makers.py#L22-L106)
- **Inputs**: The collective `evidence_pool` (deterministic metrics, verified financials, 3-year EPS CAGR, PEG ratio, growth catalysts, market position, news).
- **How It Refines & Processes**:
  - Actively builds the **maximum viable upside thesis**: competitive moats, pricing power, margin expansion leverage, and earnings visibility.
- **Output Produced**: Structured 3–4 point Bull Case, positive price drivers, and institutional accumulation rationale.

#### 10. Bear Researcher Agent
- **File Reference**: [`decision_makers.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/decision_makers.py#L108-L191)
- **Inputs**: The collective `evidence_pool` (same evidence as the Bull).
- **How It Refines & Processes**:
  - Actively builds the **maximum viable downside thesis**: debt vulnerabilities, input-cost margin compression, aggressive competitor pricing, and execution risks.
- **Output Produced**: Structured 3–4 point Bear Case, downside catalysts, and margin-of-safety deficits.

---

### STAGE 3: Adversarial Rebuttal Round

- **File Reference**: [`orchestrator.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/orchestrator.py#L137-L191)
- **Inputs Grounding**: Both agents retain the complete baseline financial metrics and specialist evidence pool alongside the opponent's thesis.
- **How It Works**:
  - **Bull Researcher receives the Bear's thesis**: Must answer each downside vulnerability with empirical operational counterpoints.
  - **Bear Researcher receives the Bull's thesis**: Must stress-test the Bull's assumptions (e.g., challenging whether expected growth is already priced in).
- **Output Produced**: Defended Bull Thesis, Stress-Tested Bear Thesis, and identification of the **Critical Swing Factors** deciding which side is correct.

---

### STAGE 4: Risk Audit & Execution Strategy

#### 11. Risk Analyst Agent
- **File Reference**: [`decision_makers.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/decision_makers.py#L273-L354)
- **Inputs**: Rebuttal debate findings, Bear thesis, debt ratios, interest coverage, and corporate disclosures.
- **How It Refines & Processes**:
  - Stress-tests worst-case scenarios: debt maturity schedule, promoter pledging/share dilution, regulatory intervention, and macroeconomic sensitivity (USD/INR, interest rates).
- **Output Produced**: Ranked downside risk matrix, systemic risk score, and required contingency hedges.

#### 12. Trader Agent
- **File Reference**: [`decision_makers.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/decision_makers.py#L193-L271)
- **Inputs**: CMP, 50/200 DMA, true 52W range, 14-day ATR, 20-day swing extremes, 20-day realized volatility, 30-day volume, and Bull/Bear debate swing factors.
- **How It Refines & Processes**:
  - Formulates tactical institutional execution: optimal entry bands (`entry_range_low`, `entry_range_high`), invalidation stop-loss (`invalidation_stop`), ATR volatility buffer (`atr_buffer`), and a 3-tranche staged accumulation schedule (`staged_tranches`).
- **Output Produced**: Structured `TacticalExecutionPlan` with concrete prices and tranche allocations.

---

### STAGE 5: Final Conviction Synthesis

#### 13. Portfolio Manager Agent
- **File Reference**: [`decision_makers.py`](file:///c:/Users/Piyush/Desktop/Multi%20Agent%20Stock%20Analyzer/backend/agents/decision_makers.py#L356-L435)
- **Inputs**: Complete synthesis packet:
  - Research Manager's original hypotheses.
  - Defended Bull Case & Stress-Tested Bear Case.
  - Risk Analyst's downside vulnerability matrix.
  - Trader's tactical entry parameters & staged tranches.
  - Deterministic metrics (`debt_to_equity`, `roce_wacc_spread`, `interest_coverage`, `peg_ratio`).
- **How It Refines & Processes**:
  - Acts as the Investment Committee Chair: weighs Bull upside against Bear downside, adjusts for tail-risk warnings, and evaluates whether the risk-to-reward ratio warrants deploying institutional capital.
- **Output Produced**:
  - **Conviction Rating**: Schema-enforced `"OVERWEIGHT"`, `"NEUTRAL"`, or `"UNDERWEIGHT"`.
  - **Target Portfolio Allocation**: Float percentage (e.g., 2.5% to 5.0%).
  - **Executive Investment Synthesis**: Clear, decisive institutional thesis.
  - **Tactical Execution Plan**: Entry ranges, stop loss, and staged tranches attached directly to the research report.
