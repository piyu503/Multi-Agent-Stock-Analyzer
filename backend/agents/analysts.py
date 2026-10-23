"""Specialized Analyst Agent Roles (1-8):
1. Research Manager
2. Data & Evidence Verification Analyst
3. Fundamentals & Business Quality Analyst
4. Growth & Industry Analyst
5. News, Corporate Events & Earnings-Call Analyst
6. Social Sentiment Analyst
7. Market Analyst
8. Peer Benchmarking & Valuation Analyst
"""

from typing import Any, Dict, List
import re
from agents.base import BaseAgent, AgentOutput


def verify_isin_and_listing(company_context: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic validation of ISIN syntax, exchange series, and listing integrity."""
    isin = str(company_context.get("isin") or "").strip().upper()
    exchange = str(company_context.get("exchange") or "").strip().upper()
    series = str(company_context.get("series") or "EQ").strip().upper()
    scrip_code = str(company_context.get("scrip_code") or "").strip()

    is_valid_format = bool(re.match(r"^IN[A-Z0-9]{9}[0-9]$", isin))
    
    # Checksum validation (Luhn algorithm on alphanumeric converted characters)
    checksum_valid = False
    if is_valid_format:
        try:
            digits = []
            for char in isin:
                if char.isdigit():
                    digits.append(int(char))
                else:
                    val = ord(char) - 55  # A=10, B=11...
                    digits.extend([int(d) for d in str(val)])
            
            # Luhn double from right to left
            total = 0
            parity = len(digits) % 2
            for i, d in enumerate(digits):
                if i % 2 == parity:
                    d *= 2
                    if d > 9:
                        d -= 9
                total += d
            checksum_valid = (total % 10 == 0)
        except Exception:
            checksum_valid = False

    is_standard_series = series in ("EQ", "A", "B")
    is_surveillance = series in ("BE", "BZ", "ST", "SM", "Z")

    if not is_valid_format:
        integrity_status = "Invalid Format - Malformed ISIN String"
    elif not checksum_valid:
        integrity_status = "Checksum Mismatch - Flagged Transcription Error"
    elif is_surveillance:
        integrity_status = "Surveillance Series - Trade-for-Trade Restrictions"
    elif is_standard_series:
        integrity_status = "Verified Clean"
    else:
        integrity_status = "Non-Standard Series - Scrutiny Advised"

    return {
        "isin": isin,
        "is_valid_format": is_valid_format,
        "checksum_valid": checksum_valid,
        "exchange": exchange,
        "series": series,
        "scrip_code": scrip_code if scrip_code else None,
        "is_standard_series": is_standard_series,
        "is_surveillance_series": is_surveillance,
        "integrity_status": integrity_status
    }


class ResearchManagerAgent(BaseAgent):
    """Coordinates research, manages dependencies, and tracks overall analytical progress."""

    def __init__(self):
        super().__init__(name="Research Manager", role="Research Manager & Orchestrator")

    def get_system_prompt(self) -> str:
        return (
            "You are the Research Manager & Orchestrator for BharatEquity, an institutional Indian equity platform. "
            "Your job is to define the research scope, outline critical investigation hypotheses, "
            "and identify key analytical bottlenecks based on company profile and available exchange data. "
            "Respond strictly in JSON matching the AgentOutput schema."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        mkt = company_context.get("market_data") or {}
        metrics = company_context.get("calculated_metrics") or {}
        return (
            f"Set up the research agenda for {company_context.get('company_name')} "
            f"({company_context.get('symbol')} on {company_context.get('exchange')}).\n"
            f"Sector: {company_context.get('sector') or company_context.get('industry')}.\n"
            f"ISIN: {company_context.get('isin')}, BSE Scrip: {company_context.get('scrip_code') or 'N/A'}.\n"
            f"Market Baseline: CMP INR {mkt.get('current_price')}, Market Cap: INR {mkt.get('market_cap')}, PE: {mkt.get('pe_ratio')}.\n"
            f"Key Deterministic Ratios: D/E: {metrics.get('debt_to_equity')}, Interest Coverage: {metrics.get('interest_coverage')}, "
            f"ROCE: {metrics.get('roce_pct')}%, ROCE-WACC Spread: {metrics.get('roce_wacc_spread')}%.\n"
            "Identify 3 core investment hypotheses and define the data dependencies for specialized analysts."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sym = company_context.get("symbol", "EQUITY")
        exch = company_context.get("exchange", "NSE")
        name = company_context.get("company_name", sym)
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Coordinated initial research agenda for {name} ({sym} on {exch}).",
            findings=[
                f"Resolved primary security master listing: {sym} ({exch}) with ISIN {company_context.get('isin') or 'Unspecified'}.",
                "Initiated parallel factual verification, fundamental diagnostics, and growth modeling.",
                "Orchestrated two-stage independent Bull vs Bear thesis generation to prevent analytical cross-contamination."
            ],
            supporting_evidence=[f"Exchange Master Entry: {company_context.get('data_source', 'Database')}"],
            assumptions=["Target company operates as an ongoing entity under SEBI listing regulations."],
            missing_information=["Full live quarterly XBRL balance-sheet disclosures pending real-time data integration."],
            confidence_score=0.9,
            confidence_explanation="High confidence in catalog metadata resolution and research framework assignment.",
            questions_for_investigation=[
                f"What are the highest-priority capital allocation drivers for {sym} over the next 3 financial years?",
                "Are there pending litigation or regulatory filings impacting ongoing operations?"
            ],
            role_specific_data={"stage": "Orchestration & Agenda Formulation", "total_subagents_assigned": 13},
            execution_status="dev_stub"
        )


class EvidenceVerificationAnalyst(BaseAgent):
    """Distinguishes verified factual evidence from unverified claims, rumors, and gaps."""

    def __init__(self):
        super().__init__(name="Evidence Verification Analyst", role="Data & Evidence Verification Analyst")

    def get_system_prompt(self) -> str:
        return (
            "You are the Data & Evidence Verification Analyst at BharatEquity. "
            "You rigorously audit data integrity, distinguish official exchange disclosures from media claims, "
            "and explicitly flag data limitations, unverified assumptions, and missing filings. "
            "Never fabricate financial numbers. Respond strictly in JSON matching the AgentOutput schema."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        audit = verify_isin_and_listing(company_context)
        source = company_context.get("data_source", "Exchange Securities Master")
        return (
            f"Audit the official listing provenance and data integrity for {company_context.get('company_name')} ({company_context.get('symbol')}):\n"
            f"- Exchange: {audit['exchange']}, Trading Series: {audit['series']}\n"
            f"- Standard Active Trading Series: {audit['is_standard_series']} (Surveillance Flag: {audit['is_surveillance_series']})\n"
            f"- ISIN: {audit['isin']} (Format Valid: {audit['is_valid_format']}, Checksum Verified: {audit['checksum_valid']})\n"
            f"- BSE Scrip Code: {audit['scrip_code'] or 'Unassigned'}\n"
            f"- Master Data Provenance: {source}\n"
            f"- Preliminary Status: {audit['integrity_status']}\n\n"
            "Evaluate data cleanliness, confirm identity disambiguation, and explicitly list missing compliance or audited filings."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        audit = verify_isin_and_listing(company_context)
        source = company_context.get("data_source", "Catalog")
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Listing parameters and ISIN audit completed ({audit['integrity_status']}).",
            findings=[
                f"Exchange Venue: Verified on {audit['exchange']} under Series '{audit['series']}'.",
                f"ISIN Validation: {audit['isin']} - Format valid: {audit['is_valid_format']}, Checksum valid: {audit['checksum_valid']}.",
                f"Surveillance / Settlement Check: Standard settlement series (Surveillance alert: {audit['is_surveillance_series']}).",
                f"Source Provenance: Record verified from {source}."
            ],
            supporting_evidence=[f"Exchange Master: {source}", f"ISIN: {audit['isin']}"],
            assumptions=["Exchange master file reflects the latest active SEBI surveillance and listing status."],
            missing_information=[
                "Latest annual report (MCA-21 / SEBI XBRL filing) text index.",
                "Auditor notes on internal financial controls (IFCoFR)."
            ],
            confidence_score=0.95 if audit["checksum_valid"] else 0.70,
            confidence_explanation="High confidence in deterministic exchange master checks and ISIN checksum validation.",
            questions_for_investigation=[
                "Has exchange surveillance flagged any unusual volume movement or GSM/ASM stages?",
                "Are there pending qualification notes from statutory auditors?"
            ],
            role_specific_data=audit,
            execution_status="dev_stub"
        )


class FundamentalsQualityAnalyst(BaseAgent):
    """Examines balance-sheet durability, cash conversion, and business quality."""

    def __init__(self):
        super().__init__(name="Fundamentals Analyst", role="Fundamentals & Business Quality Analyst")

    def get_system_prompt(self) -> str:
        return (
            "You are the Fundamentals & Business Quality Analyst at BharatEquity. "
            "Analyze business durability, return on capital employed (ROCE), debt solvency, working capital cycles, "
            "and free cash flow conversion. State clearly when audited numbers are unavailable. "
            "Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        metrics = company_context.get("calculated_metrics") or {}
        fin = company_context.get("financials") or {}
        market = company_context.get("market_data") or {}
        fcf = fin.get("free_cash_flow")
        if fcf is None and fin.get("cfo") is not None and fin.get("capex") is not None:
            fcf = round(fin["cfo"] - fin["capex"], 2)
        margin_spread = fin.get("margin_stability_spread", "N/A")
        ebitda_hist = fin.get("ebitda_margin_history") or []
        margin_hist_str = ", ".join([f"{m}%" for m in ebitda_hist]) if ebitda_hist else "Single Period"

        return (
            f"Assess fundamental balance sheet durability and business quality for {company_context.get('company_name')} ({company_context.get('symbol')}).\n"
            f"Industry: {company_context.get('industry') or market.get('industry') or 'N/A'}.\n"
            f"Financial Metrics: Debt-to-Equity: {metrics.get('debt_to_equity')}, Interest Coverage: {metrics.get('interest_coverage')}, "
            f"ROCE vs WACC spread: {metrics.get('roce_wacc_spread')}%, EBITDA Margin: {metrics.get('ebitda_margin_pct')}%, "
            f"Multi-Year EBITDA Margin History: [{margin_hist_str}] (Max-Min Spread: {margin_spread}%).\n"
            f"Raw Statement Data: Total Debt: {fin.get('total_debt')}, Net Profit (PAT): {fin.get('pat')}, Operating Cash Flow (CFO): {fin.get('cfo')}, Capex: {fin.get('capex')}, Free Cash Flow: {fcf}.\n"
            "Evaluate solvency, cash flow durability, capital allocation efficiency, and margin stability based on these verified figures."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sec = company_context.get("sector") or company_context.get("industry") or "Equity"
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Fundamental framework established for {company_context.get('symbol')} in {sec}.",
            findings=[
                f"Business operates in the {sec} sector with standard capital cycle characteristics.",
                "Capital intensity benchmark: sector median ROCE typically guides economic moat sustainability.",
                "Working capital requirement depends on distributor terms and inventory velocity."
            ],
            supporting_evidence=[f"Sector Classification: {sec}"],
            assumptions=["Operating margin resilience is benchmarked against peers in the same industry classification."],
            missing_information=[
                "Latest 5-year audited financial statements (P&L, Balance Sheet, Cash Flows).",
                "Segment-level profitability and working capital days breakdown."
            ],
            confidence_score=0.6,
            confidence_explanation="Moderate confidence; conceptual fundamental framework ready, awaiting live financial feed.",
            questions_for_investigation=[
                "What is the historical 5-year average Return on Capital Employed (ROCE) versus WACC?",
                "Has operating cash flow persistently covered maintenance capital expenditures?"
            ],
            role_specific_data={"sector": sec, "metric_baseline": "Awaiting Audited XBRL Data"},
            execution_status="dev_stub"
        )


class GrowthIndustryAnalyst(BaseAgent):
    """Evaluates macro trends, TAM expansion, and industry competitive positioning."""

    def __init__(self):
        super().__init__(name="Growth & Industry Analyst", role="Growth & Industry Analyst")

    def get_system_prompt(self) -> str:
        return (
            "You are the Growth & Industry Analyst at BharatEquity. "
            "Analyze market tailwinds, total addressable market (TAM), regulatory tailwinds (e.g. PLI schemes, Make in India), "
            "and sectoral growth vectors. Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        fin = company_context.get("financials") or {}
        mkt = company_context.get("market_data") or {}
        rev_hist = fin.get("revenue_history") or []
        rev_hist_str = ", ".join([f"INR {r:,.0f}" for r in rev_hist]) if rev_hist else f"INR {fin.get('revenue', 'N/A')}"
        ebitda_hist = fin.get("ebitda_history") or []
        ebitda_hist_str = ", ".join([f"INR {e:,.0f}" for e in ebitda_hist]) if ebitda_hist else f"INR {fin.get('ebitda', 'N/A')}"

        return (
            f"Evaluate growth catalysts, TAM expansion, and industry competitive positioning for {company_context.get('company_name')} ({company_context.get('symbol')}):\n"
            f"- Sector / Industry: {company_context.get('sector') or mkt.get('sector')} / {company_context.get('industry') or mkt.get('industry')}\n"
            f"- Multi-Year Revenue Trajectory: [{rev_hist_str}]\n"
            f"- Multi-Year EBITDA Trajectory: [{ebitda_hist_str}]\n"
            f"- 3-Year EPS CAGR: {fin.get('eps_cagr_3yr_pct', 'N/A')}%\n"
            f"- Free Cash Flow: INR {fin.get('free_cash_flow', 'N/A')}\n"
            "Assess volume vs price expansion drivers, capital expenditure plans, and domestic Indian tailwinds (Make in India, formalization)."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sec = company_context.get("sector") or "Indian Economy"
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Assessed structural demand drivers and TAM opportunities in {sec}.",
            findings=[
                "Beneficiary of Indian domestic consumption expansion and formalization of supply chains.",
                "Capacity utilization trends in this sector dictate next round of greenfield capital expenditures.",
                "Policy tailwinds supported by domestic manufacturing initiatives and infrastructure capex."
            ],
            supporting_evidence=["Indian macroeconomic GDP growth rate and capex cycle indices."],
            assumptions=["Sector demand grows at least 1.2x to 1.5x real GDP growth."],
            missing_information=["Management forward revenue CAGR guidance and order-book backlog numbers."],
            confidence_score=0.7,
            confidence_explanation="Good visibility into sector-level macro drivers; firm-specific capacity ramp details pending.",
            questions_for_investigation=[
                "What is the company's estimated market share trajectory over the trailing 3 years?",
                "Are capacity bottlenecks emerging in key manufacturing or distribution hubs?"
            ],
            role_specific_data={"growth_drivers": ["Domestic TAM Expansion", "Digital Modernization", "Export Competitiveness"]},
            execution_status="dev_stub"
        )


class NewsCorporateEventsAnalyst(BaseAgent):
    """Scrutinizes exchange disclosures, block deals, and management commentary."""

    def __init__(self):
        super().__init__(name="News & Events Analyst", role="News, Corporate Events & Earnings-Call Analyst")

    def get_system_prompt(self) -> str:
        return (
            "You are the News, Corporate Events & Earnings-Call Analyst at BharatEquity. "
            "Analyze material disclosures, insider transactions (PIT regulations), board changes, and conference calls. "
            "Never fabricate news articles. If live feeds are absent, state the limitation clearly. "
            "Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        news_list = company_context.get("recent_news") or []
        bse_filings = company_context.get("corporate_filings") or []
        headlines = [f"- [{item.get('published', 'Recent')}] {item.get('title')} (Source: {item.get('source', 'Media')})" for item in news_list[:6]]
        filings = [f"- [{item.get('date', 'Recent')}] {item.get('category', 'Regulatory')}: {item.get('headline')} (Details: {item.get('details', 'Statutory Disclosure')})" for item in bse_filings[:5]]

        news_text = "\n".join(headlines) if headlines else "No recent Google News headlines retrieved."
        filings_text = "\n".join(filings) if filings else "No recent BSE regulatory filings retrieved."

        return (
            f"Review recent corporate disclosures and material events for {company_context.get('company_name')} ({company_context.get('symbol')}):\n"
            f"Recent Media Headlines:\n{news_text}\n\n"
            f"Official BSE Disclosures:\n{filings_text}\n\n"
            "Identify key corporate governance risks, management catalysts, or litigation items from these disclosures."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sym = company_context.get("symbol")
        exch = company_context.get("exchange")
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Event monitoring active for {sym} on {exch}.",
            findings=[
                f"Regulatory filings monitored under SEBI (LODR) Regulations on {exch}.",
                "Corporate governance tracking requires audit of promoter pledging and board independence.",
                "Upcoming key event catalyst: Next scheduled quarterly financial results announcement."
            ],
            supporting_evidence=[f"Exchange Listing: {exch}"],
            assumptions=["Company remains compliant with periodic disclosure mandates."],
            missing_information=["Real-time BSE/NSE corporate announcement RSS/API feed not yet connected."],
            confidence_score=0.65,
            confidence_explanation="Event baseline established; real-time feeds await phase 3 API integration.",
            questions_for_investigation=[
                "Have promoters pledged any portion of their shareholding?",
                "Were there significant senior management resignations or CFO changes in the last 12 months?"
            ],
            role_specific_data={"event_category": "Corporate Disclosures & Surveillance"},
            execution_status="dev_stub"
        )


class SocialSentimentAnalyst(BaseAgent):
    """Gauges retail sentiment, community buzz, and extreme sentiment divergence."""

    def __init__(self):
        super().__init__(name="Social Sentiment Analyst", role="Social Sentiment Analyst")

    def get_system_prompt(self) -> str:
        return (
            "You are the Social Sentiment Analyst at BharatEquity. "
            "Analyze retail vs institutional sentiment, retail hype indicators, and contrarian sentiment divergences. "
            "Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        social = company_context.get("social_sentiment") or {}
        items = social.get("discussion_items") or company_context.get("recent_news") or []
        headlines = [f"- {item.get('title')} ({item.get('source', 'Web')})" for item in items[:6]]
        return (
            f"Evaluate retail sentiment themes, community buzz, and market narrative for {company_context.get('symbol')}:\n"
            f"- Algorithmic Sentiment Baseline: {social.get('sentiment_label', 'Neutral')} (Bullish signal ratio: {social.get('bullish_signal_ratio', 0.50)})\n"
            f"- Keyword Triggers: Positive/Bullish triggers: {social.get('positive_triggers_count', 0)}, Caution/Risk triggers: {social.get('caution_triggers_count', 0)}\n"
            f"Recent Market & Retail Discussion Topics:\n" + "\n".join(headlines) + "\n\n"
            "Assess whether the prevailing stock narrative is driven by retail euphoria, panic, or institutional accumulation."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sym = company_context.get("symbol")
        social = company_context.get("social_sentiment") or {}
        label = social.get("sentiment_label", "Neutral")
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Sentiment indicators analyzed ({label}) for {sym}.",
            findings=[
                f"Multi-source sentiment reading: Classified as '{label}' based on retail discussion and headline analysis.",
                f"Signal Ratio: Bullish keyword density at {social.get('bullish_signal_ratio', 0.50)*100:.1f}%.",
                "Retail vs Institutional: Institutional ownership continuity acts as a stabilizing anchor against social volatility."
            ],
            supporting_evidence=[f"Discussion stream: {len(social.get('discussion_items', []))} news and community items parsed."],
            assumptions=["Public discussions reflect short-term retail narrative momentum."],
            missing_information=["Direct intraday social platform API (X/Twitter Firehose, TradingView Webhook)."],
            confidence_score=0.72,
            confidence_explanation="Quantitative keyword density coupled with Google News discussion streams.",
            questions_for_investigation=[
                "Is there high retail shareholder churn in recent quarterly shareholding patterns?",
                "Has search volume spiked abnormally for the ticker or core product brands?"
            ],
            role_specific_data=social,
            execution_status="dev_stub"
        )


class MarketAnalyst(BaseAgent):
    """Monitors market microstructure, liquidity, delivery percentage, and technical structure."""

    def __init__(self):
        super().__init__(name="Market Analyst", role="Market Analyst")

    def get_system_prompt(self) -> str:
        return (
            "You are the Market Analyst at BharatEquity. "
            "Analyze trading liquidity, delivery volume percentage, beta, institutional absorption, and market microstructure. "
            "Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        mkt = company_context.get("market_data") or {}
        cmp = mkt.get("current_price")
        dma_50 = mkt.get("dma_50")
        dma_200 = mkt.get("dma_200")
        cross_signal = "N/A"
        if dma_50 and dma_200:
            cross_signal = "Golden Cross (50-DMA > 200-DMA)" if dma_50 > dma_200 else "Death Cross (50-DMA < 200-DMA)"

        return (
            f"Evaluate liquidity profile, technical structure, and momentum for {company_context.get('symbol')} on {company_context.get('exchange')}:\n"
            f"- Current Market Price (CMP): INR {cmp}\n"
            f"- 52-Week Range: Low INR {mkt.get('year_low')} / High INR {mkt.get('year_high')}\n"
            f"- Moving Averages: 50-DMA INR {dma_50}, 200-DMA INR {dma_200} (Regime: {cross_signal})\n"
            f"- 30-Day Avg Volume: {mkt.get('avg_volume_30d')}\n"
            f"- Beta: {mkt.get('beta')}\n"
            "Assess trend strength, relative position vs 50/200 DMA, and institutional absorption capability."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        exch = company_context.get("exchange", "NSE")
        series = company_context.get("series", "EQ")
        mkt = company_context.get("market_data") or {}
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Market liquidity profile verified on {exch} (Series: {series}).",
            findings=[
                f"Listed under trading series '{series}' with continuous standard settlement on {exch}.",
                f"Price Structure: CMP INR {mkt.get('current_price')} with 50-DMA at INR {mkt.get('dma_50')} and 200-DMA at INR {mkt.get('dma_200')}.",
                f"30-day average liquidity: {mkt.get('avg_volume_30d', 'N/A')} shares with Beta of {mkt.get('beta', 'N/A')}."
            ],
            supporting_evidence=[f"Exchange Series: {series}", f"Venue: {exch}"],
            assumptions=["Order book spread remains within standard institutional tolerance during market hours."],
            missing_information=["Daily Bhavcopy historical OHLCV and delivery volume time-series."],
            confidence_score=0.85,
            confidence_explanation="Technical levels and moving averages calculated deterministically from 1-year OHLCV.",
            questions_for_investigation=[
                "What is the 30-day average daily delivery volume percentage?",
                "Does the stock trade at a premium/discount between NSE and BSE order books?"
            ],
            role_specific_data={"series": series, "dma_50": mkt.get("dma_50"), "dma_200": mkt.get("dma_200")},
            execution_status="dev_stub"
        )


class PeerValuationAnalyst(BaseAgent):
    """Evaluates peer multiples, DCF baselines, and historical valuation percentiles."""

    def __init__(self):
        super().__init__(name="Valuation Analyst", role="Peer Benchmarking & Valuation Analyst")

    def get_system_prompt(self) -> str:
        return (
            "You are the Peer Benchmarking & Valuation Analyst at BharatEquity. "
            "Analyze price-to-earnings (P/E), EV/EBITDA, price-to-book (P/B), and margin of safety against sector norms. "
            "Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        mkt = company_context.get("market_data") or {}
        metrics = company_context.get("calculated_metrics") or {}
        peer_benchmark = company_context.get("peers_benchmark_text") or "No listed peers found."
        return (
            f"Assess relative valuation multiples and peer positioning for {company_context.get('company_name')} ({company_context.get('symbol')}):\n"
            f"Sector: {company_context.get('sector') or mkt.get('sector')}, Industry: {company_context.get('industry') or mkt.get('industry')}\n"
            f"Valuation Multiples:\n"
            f"- Trailing/Forward P/E: {mkt.get('pe_ratio')}\n"
            f"- Price-to-Book (P/B): {mkt.get('pb_ratio')}\n"
            f"- EV/EBITDA: {mkt.get('ev_ebitda')}\n"
            f"- Dividend Yield: {mkt.get('dividend_yield_pct')}%\n"
            f"- PEG Ratio: {metrics.get('peg_ratio')}\n"
            f"- ROCE: {metrics.get('roce_pct')}%, ROCE-WACC Spread: {metrics.get('roce_wacc_spread')}%\n"
            f"- Market Cap: INR {mkt.get('market_cap')}\n\n"
            f"{peer_benchmark}\n\n"
            "State whether current valuation provides an adequate margin of safety relative to peers and capital efficiency."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sec = company_context.get("sector") or "Peer Group"
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Comparative valuation framework formulated for {company_context.get('symbol')} vs {sec} peers.",
            findings=[
                f"Valuation methodology balances relative peer multiples with discounted cash flow (DCF) assumptions.",
                "Indian 10-year sovereign bond yield serves as risk-free benchmark for equity risk premium (ERP).",
                "Sectoral premium/discount must be justified by return on invested capital (ROIC) spreads over WACC."
            ],
            supporting_evidence=[f"Peer Sector Baseline: {sec}"],
            assumptions=["Cost of Equity modeled with 10Y G-Sec yield baseline plus standard Indian ERP."],
            missing_information=["Audited consensus EPS estimates and live peer market capitalizations."],
            confidence_score=0.65,
            confidence_explanation="Valuation logic established; live consensus estimates awaiting market feed.",
            questions_for_investigation=[
                "Is the stock currently trading in the top or bottom decile of its 5-year historical P/E band?",
                "How does the forward PEG ratio compare against direct industry peers?"
            ],
            role_specific_data={"valuation_models": ["Relative P/E & EV/EBITDA", "Reverse DCF Implied Growth"]},
            execution_status="dev_stub"
        )
