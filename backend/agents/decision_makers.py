"""Specialized Decision, Debate, and Synthesis Agent Roles (9-13):
9. Bull Researcher
10. Bear Researcher
11. Trader
12. Risk Analyst
13. Portfolio Manager
"""

import logging
import time
from typing import Any, Dict, List, Optional
from agents.base import BaseAgent, AgentOutput
from agents.llm import LLMConfig, call_llm

logger = logging.getLogger("bharatequity.decision_makers")


class BullResearcherAgent(BaseAgent):
    """Formulates the thesis-driven bullish upside case, then defends it in rebuttals."""

    def __init__(self):
        super().__init__(name="Bull Researcher", role="Bull Researcher")

    def get_system_prompt(self) -> str:
        return (
            "You are the Bull Researcher at BharatEquity. "
            "Your objective is to identify asymmetric upside potential, competitive advantages (economic moats), "
            "operating leverage, and expansion catalysts. You argue rigorously based on fundamental evidence. "
            "Never fabricate numbers. Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        analyst_findings = evidence.get("analyst_findings") or {}
        findings_block = "\n".join([f"[{role}]: " + " | ".join(findings) for role, findings in analyst_findings.items()])
        metrics = evidence.get("calculated_metrics") or company_context.get("calculated_metrics") or {}
        mkt = company_context.get("market_data") or {}

        baseline_text = (
            f"Verified Financial & Valuation Baseline:\n"
            f"- CMP: INR {mkt.get('current_price', 'N/A')}, P/E: {mkt.get('pe_ratio', 'N/A')}, EV/EBITDA: {mkt.get('ev_ebitda', 'N/A')}\n"
            f"- D/E: {metrics.get('debt_to_equity', 'N/A')}, Interest Coverage: {metrics.get('interest_coverage', 'N/A')}\n"
            f"- ROE: {metrics.get('roe_pct', 'N/A')}%, ROCE: {metrics.get('roce_pct', 'N/A')}%, ROCE-WACC Spread: {metrics.get('roce_wacc_spread', 'N/A')}%\n"
            f"- 3-Year Rev CAGR: {metrics.get('revenue_cagr_3yr_pct', 'N/A')}%, 3-Year EPS CAGR: {metrics.get('eps_cagr_3yr_pct', 'N/A')}%, PEG Ratio: {metrics.get('peg_ratio', 'N/A')}\n"
            f"Specialist Evidence Pool:\n{findings_block}\n\n"
            "FACTUAL DISCIPLINE RULES:\n"
            "- If valuation multiples are elevated (P/E > 30), do not claim the stock is cheap on headline multiples; justify valuation through ROCE compounding, moat durability, and earnings visibility.\n"
            "- Never conflate ROCE with ROE.\n"
            "- Ground all upside claims strictly in the verified financial data."
        )

        bear_case = evidence.get("bear_thesis")
        if bear_case:
            return (
                f"REBUTTAL STAGE: Formulate counter-arguments for {company_context.get('company_name')} "
                f"({company_context.get('symbol')}) against this Bear Case:\n"
                f"{bear_case}\n\n"
                f"{baseline_text}\n\n"
                "Refute the Bear's specific risk points using the verified financial data and specialist findings above. "
                "Defend the long-term compounding thesis with empirical operational facts."
            )

        return (
            f"INITIAL THESIS: Formulate the independent Bull Thesis for {company_context.get('company_name')} "
            f"({company_context.get('symbol')}), sector: {company_context.get('sector')}.\n"
            f"{baseline_text}\n\n"
            "Build the maximum viable upside thesis: competitive moats, pricing power, margin expansion leverage, and earnings visibility. Ground every point in the data provided above."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sym = company_context.get("symbol", "STOCK")
        name = company_context.get("company_name", sym)
        sec = company_context.get("sector") or "its sector"
        is_rebuttal = bool(evidence.get("bear_thesis"))

        findings = [
            f"Competitive Moat: {name} benefits from strong brand recall and entrenched distribution across Indian tier-1/2/3 markets.",
            "Operating Leverage: Fixed asset turnover expansion expected as incremental demand scales without proportional capex.",
            "Structural Tailwinds: Well positioned to capture domestic demand growth in {sec}."
        ]
        if is_rebuttal:
            findings.append("Rebuttal to Bear: Downside risks from short-term margin compression are counteracted by pricing power.")

        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Bullish investment case synthesized for {name} ({sym}).",
            findings=findings,
            supporting_evidence=[
                f"Listed status on {company_context.get('exchange')}",
                "Historical resilience through Indian economic recovery cycles"
            ],
            assumptions=["Company sustains core market share without catastrophic regulatory shock."],
            missing_information=["Disaggregated export vs domestic margin differentials."],
            confidence_score=0.75,
            confidence_explanation="High conviction in long-term secular growth drivers in Indian economy.",
            questions_for_investigation=[
                "Can operating cash flow sustain projected dividend payouts while funding capacity expansion?",
                "What pricing power does the company maintain against regional unorganized competitors?"
            ],
            role_specific_data={"thesis_type": "Rebuttal" if is_rebuttal else "Initial Thesis", "target_bias": "Bullish"},
            execution_status="dev_stub"
        )


class BearResearcherAgent(BaseAgent):
    """Formulates the adversarial thesis-driven downside case, stress-testing vulnerabilities."""

    def __init__(self):
        super().__init__(name="Bear Researcher", role="Bear Researcher")

    def get_system_prompt(self) -> str:
        return (
            "You are the Bear Researcher at BharatEquity. "
            "Your objective is to stress-test vulnerabilities, uncover hidden debt, analyze margin compression risks, "
            "governance concerns, and valuation overextension. Argue rigorously based on risk factors. "
            "Never fabricate numbers. Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        analyst_findings = evidence.get("analyst_findings") or {}
        findings_block = "\n".join([f"[{role}]: " + " | ".join(findings) for role, findings in analyst_findings.items()])
        metrics = evidence.get("calculated_metrics") or company_context.get("calculated_metrics") or {}
        mkt = company_context.get("market_data") or {}

        baseline_text = (
            f"Verified Financial & Valuation Baseline:\n"
            f"- CMP: INR {mkt.get('current_price', 'N/A')}, P/E: {mkt.get('pe_ratio', 'N/A')}, EV/EBITDA: {mkt.get('ev_ebitda', 'N/A')}\n"
            f"- D/E: {metrics.get('debt_to_equity', 'N/A')}, Interest Coverage: {metrics.get('interest_coverage', 'N/A')}\n"
            f"- ROE: {metrics.get('roe_pct', 'N/A')}%, ROCE: {metrics.get('roce_pct', 'N/A')}%, ROCE-WACC Spread: {metrics.get('roce_wacc_spread', 'N/A')}%\n"
            f"- 3-Year Rev CAGR: {metrics.get('revenue_cagr_3yr_pct', 'N/A')}%, 3-Year EPS CAGR: {metrics.get('eps_cagr_3yr_pct', 'N/A')}%, PEG Ratio: {metrics.get('peg_ratio', 'N/A')}\n"
            f"Specialist Evidence Pool:\n{findings_block}\n\n"
            "FACTUAL DISCIPLINE RULES:\n"
            "- DEBT CONSISTENCY: If Debt-to-Equity is <= 0.8 (e.g. 0.44), it is MODERATE/LOW gearing. You are STRICTLY PROHIBITED from using headings like 'High Debt-to-Equity Ratio' or asserting solvency distress. Focus on cyclical demand, margin pressure, or capital allocation drag instead.\n"
            "- OFF-BALANCE-SHEET DEBT: Do NOT allege off-balance-sheet debt or contingent liabilities without citing a specific disclosed figure or auditor qualification from the input data.\n"
            "- PEER COMPARISON: If sector peers are missing, DO NOT claim the stock trades 'higher than sector norms'. Report multiples factually.\n"
            "- Never label high ROCE (> 25%) as unviable returns; challenge whether returns will mean-revert.\n"
            "- Never conflate ROCE with ROE."
        )

        bull_case = evidence.get("bull_thesis")
        if bull_case:
            return (
                f"REBUTTAL STAGE: Formulate counter-arguments for {company_context.get('company_name')} "
                f"({company_context.get('symbol')}) against this Bull Case:\n"
                f"{bull_case}\n\n"
                f"{baseline_text}\n\n"
                "Attack the Bull's growth and moat assumptions using the verified baseline metrics and specialist findings above. "
                "Highlight execution bottlenecks, valuation risks, and margin vulnerabilities."
            )

        return (
            f"INITIAL THESIS: Formulate the independent Bear Thesis for {company_context.get('company_name')} "
            f"({company_context.get('symbol')}), sector: {company_context.get('sector')}.\n"
            f"{baseline_text}\n\n"
            "Build the maximum viable downside thesis: leverage vulnerabilities (if debt is high), input-cost margin compression, rich multiples, and governance risks. Ground every point in the data provided above."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sym = company_context.get("symbol", "STOCK")
        name = company_context.get("company_name", sym)
        is_rebuttal = bool(evidence.get("bull_thesis"))

        findings = [
            f"Valuation Vulnerability: Premium multiples leave zero margin of safety against potential quarterly execution slips.",
            "Input Cost Exposure: Volatility in commodity inputs and wage inflation can compress operating margins unexpectedly.",
            "Disruptive Competition: Aggressive price discounting by new entrants poses market share erosion risks."
        ]
        if is_rebuttal:
            findings.append("Rebuttal to Bull: Moats are not permanent; capex cycles in Indian markets frequently experience execution delays.")

        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Bearish vulnerability audit completed for {name} ({sym}).",
            findings=findings,
            supporting_evidence=[
                "Cyclical nature of industrial margin cycles",
                "Historical sensitivity to global macroeconomic tightening"
            ],
            assumptions=["Operating margin guidance may prove optimistic if raw materials inflate >10%."],
            missing_information=["Granular customer concentration data (top 5 clients revenue share)."],
            confidence_score=0.70,
            confidence_explanation="Strong structural rationale for downside protection and margin scrutiny.",
            questions_for_investigation=[
                "What is the break-even capacity utilization level under adverse demand shocks?",
                "Are there contingent liabilities or tax disputes disclosed in notes to accounts?"
            ],
            role_specific_data={"thesis_type": "Rebuttal" if is_rebuttal else "Initial Thesis", "target_bias": "Bearish"},
            execution_status="dev_stub"
        )


class TraderAgent(BaseAgent):
    """Evaluates practical market execution, entry timing, liquidity buffers, and horizon."""

    def __init__(self):
        super().__init__(name="Execution Trader", role="Trader")

    def get_system_prompt(self) -> str:
        return (
            "You are the Execution Trader at BharatEquity. "
            "Analyze trade timing, liquidity constraints, order execution strategy (TWAP/VWAP), "
            "and portfolio accumulation pacing. Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        mkt = company_context.get("market_data") or {}
        cmp = mkt.get("current_price")
        dma_50 = mkt.get("dma_50")
        dma_200 = mkt.get("dma_200")
        vol = mkt.get("avg_volume_30d")
        beta = mkt.get("beta")
        atr_14 = mkt.get("atr_14", "N/A")
        swing_h = mkt.get("swing_high_20d", "N/A")
        swing_l = mkt.get("swing_low_20d", "N/A")
        vol_20d = mkt.get("realized_vol_20d_pct", "N/A")

        bull_points = evidence.get("bull_rebuttal_points") or evidence.get("bull_points") or []
        bear_points = evidence.get("bear_rebuttal_points") or evidence.get("bear_points") or []

        return (
            f"Formulate optimal execution structure and tactical accumulation strategy for {company_context.get('symbol')} on {company_context.get('exchange')}:\n"
            f"- Price & Technical Levels: CMP INR {cmp}, 50-DMA INR {dma_50}, 200-DMA INR {dma_200}\n"
            f"- 52-Week Range (Intraday Extrema): Low INR {mkt.get('year_low')} / High INR {mkt.get('year_high')}\n"
            f"- Volatility & Swing Bands: 14-Day ATR: INR {atr_14}, 20-Day Swing Range: [Low INR {swing_l} - High INR {swing_h}], 20-Day Realized Volatility: {vol_20d}%\n"
            f"- Liquidity: 30-Day Avg Volume: {vol} shares, Beta: {beta}\n"
            f"- Bull Key Catalyst: {bull_points[0] if bull_points else 'Secular earnings visibility'}\n"
            f"- Bear Downside Risk: {bear_points[0] if bear_points else 'Margin compression'}\n\n"
            "Define an institutional execution plan including:\n"
            "1. Recommended Entry Range / Accumulation Zone (explicit price band relative to CMP & 20-day swing low)\n"
            "2. Tactical Invalidation / Stop-Loss Level (anchored by ATR buffer below support / swing low)\n"
            "3. Staged Tranche Strategy (e.g. 40% initial, 30% on pullback, 30% on confirmed breakout)\n"
            "4. Impact Cost & Volatility Buffer (derived from 14-day ATR & 20-day realized volatility)\n\n"
            "MANDATORY: In your JSON response under 'role_specific_data', you MUST provide exact numerical fields:\n"
            '{\n'
            '  "entry_range_low": <float>,\n'
            '  "entry_range_high": <float>,\n'
            '  "invalidation_stop": <float>,\n'
            '  "atr_buffer": <float>,\n'
            '  "staged_tranches": ["Tranche 1 (40%): ...", "Tranche 2 (30%): ...", "Tranche 3 (30%): ..."]\n'
            '}'
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        exch = company_context.get("exchange", "NSE")
        sym = company_context.get("symbol")
        mkt = company_context.get("market_data") or {}
        cmp_val = mkt.get("current_price") or 1000.0
        atr_val = mkt.get("atr_14")
        if not isinstance(atr_val, (int, float)) or atr_val <= 0:
            atr_val = round(cmp_val * 0.02, 2)

        entry_low = round(cmp_val * 0.985, 2)
        entry_high = round(cmp_val * 1.015, 2)
        stop_level = round(cmp_val - (2.0 * atr_val), 2)

        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Execution plan formulated for {sym} on {exch} around CMP INR {cmp_val}.",
            findings=[
                f"Primary trading liquidity venue: {exch}. Order execution recommended via staged limit orders to minimize market impact.",
                f"Optimal accumulation band: INR {entry_low} to {entry_high} with invalidation stop at INR {stop_level}.",
                f"Volatility buffer: 14-day ATR of INR {atr_val} sets trailing risk boundaries."
            ],
            supporting_evidence=[f"Exchange series: {company_context.get('series', 'EQ')}"],
            assumptions=["Standard market hours order book depth is sufficient for institutional tranche entry."],
            missing_information=["Live tick-by-tick bid/ask spread and order book depth (Level 2)."],
            confidence_score=0.85,
            confidence_explanation="Execution rules established based on standard Indian equity microstructure.",
            questions_for_investigation=[
                "What is the average impact cost for executing a 0.5% portfolio allocation in this scrip?",
                "Is there substantial arbitrage spread between NSE and BSE order books?"
            ],
            role_specific_data={
                "entry_range_low": entry_low,
                "entry_range_high": entry_high,
                "invalidation_stop": stop_level,
                "atr_buffer": float(atr_val),
                "staged_tranches": [
                    f"Tranche 1 (40%): Establish initial baseline position at CMP INR {cmp_val}",
                    f"Tranche 2 (30%): Accumulate on mean reversion pullback towards INR {entry_low}",
                    f"Tranche 3 (30%): Final allocation upon technical confirmation above INR {entry_high}"
                ]
            },
            execution_status="dev_stub"
        )


class RiskAnalystAgent(BaseAgent):
    """Independent auditor of tail risks, regulatory exposure, and portfolio drawdown probability."""

    def __init__(self):
        super().__init__(
            name="Risk Analyst",
            role="Risk Analyst",
            model_tier="reasoner"
        )

    def get_system_prompt(self) -> str:
        return (
            "You are the Lead Risk & Adversarial Challenger at BharatEquity powered by DeepSeek-R1 reasoning. "
            "You operate with strict independence. Your primary objective is to aggressively stress-test the Bull's "
            "growth claims, uncover hidden balance-sheet fragility, analyze cyclical margin compression, and identify "
            "the precise mathematical trigger condition that invalidates the investment thesis. "
            "Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        metrics = evidence.get("calculated_metrics") or company_context.get("calculated_metrics") or {}
        fin = company_context.get("financials") or {}
        filings = company_context.get("corporate_filings") or []
        bear_points = evidence.get("bear_rebuttal_points") or evidence.get("bear_points") or []

        filing_snippets = [f"- {f.get('category')}: {f.get('headline')}" for f in filings[:3]]
        filings_text = "\n".join(filing_snippets) if filing_snippets else "No adverse regulatory disclosures in current window."

        return (
            f"Perform independent risk and stress-test assessment for {company_context.get('company_name')} ({company_context.get('symbol')}):\n"
            f"- Solvency & Leverage: Total Debt INR {fin.get('total_debt')}, Debt/Equity: {metrics.get('debt_to_equity')} [{metrics.get('debt_to_equity_rating')}], Interest Coverage: {metrics.get('interest_coverage')} [{metrics.get('interest_coverage_rating')}] (Solvent: {metrics.get('is_solvent')})\n"
            f"- Regulatory & Exchange Disclosures:\n{filings_text}\n"
            f"- Debate Downside Points to Stress-Test:\n" + "\n".join([f"- {p}" for p in bear_points[:3]]) + "\n\n"
            "CONSISTENCY & GROUNDING RULES:\n"
            "- Solvency Consistency: If Interest Coverage is >= 4.0x or rated ROBUST/ADEQUATE, DO NOT describe interest coverage as low or precarious. Frame debt risks around capex commitments, refinancing terms, or rate cycles rather than claiming immediate insolvency.\n"
            "- Leverage Consistency: If Debt/Equity is <= 0.6 or rated MINIMAL/MODERATE, DO NOT describe debt as an existential solvency crisis.\n"
            "- Off-Balance-Sheet & Contingent Liabilities: Every material liability claim MUST cite a specific rupee amount or audit disclosure from the data. If specific amounts or auditor qualification notes are missing, label it as 'Unverified contingent risk (unquantified)' and EXCLUDE it from the scored risk assessment.\n"
            "- Temporal Grounding: Do not treat historical filings or completed board meetings as pending tail risks.\n"
            "Evaluate realistic tail risks, cyclical margin sensitivity, regulatory exposure, and produce a ranked risk matrix with required downside mitigations."
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sym = company_context.get("symbol")
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Independent risk matrix evaluated for {sym}.",
            findings=[
                "Regulatory Risk: Scrutiny under SEBI disclosure norms and sectoral regulatory frameworks.",
                "Macro Sensitivities: Sensitivity to Indian interest rate trajectory and currency (USD/INR) fluctuations.",
                "Tail Risk: Extreme downside bounded by asset backing, balance-sheet leverage, and statutory debt covenants."
            ],
            supporting_evidence=["Capital market risk taxonomy for Indian listed corporate entities."],
            assumptions=["Standard statutory compliances are actively maintained."],
            missing_information=["Contingent liabilities schedule from recent notes to financial statements."],
            confidence_score=0.82,
            confidence_explanation="High confidence in systemic and regulatory risk classification.",
            questions_for_investigation=[
                "Are debt covenants tied to minimum EBITDA thresholds that could be breached in a downturn?",
                "What is the total value of ongoing tax or legal litigation under appeal?"
            ],
            role_specific_data={"risk_level": "Moderate", "surveillance_status": "Clean"},
            execution_status="dev_stub"
        )


class PortfolioManagerAgent(BaseAgent):
    """Synthesizes all findings, preserves unresolvable debate divergences, and determines asset conviction."""

    def __init__(self):
        super().__init__(
            name="Portfolio Manager",
            role="Portfolio Manager",
            model_tier="reasoner+analyst"
        )

    def get_system_prompt(self) -> str:
        return (
            "You are the Portfolio Manager at BharatEquity. "
            "Synthesize all agent inputs, balance the Bull vs Bear adversarial debate, preserve unresolvable "
            "conflicts when evidence is insufficient, and assign capital allocation conviction without resorting "
            "to a naive majority vote. Respond strictly in JSON matching AgentOutput."
        )

    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        metrics = company_context.get("calculated_metrics") or {}
        mkt = company_context.get("market_data") or {}
        return (
            f"Synthesize comprehensive investment decision for {company_context.get('company_name')} "
            f"({company_context.get('symbol')} on {company_context.get('exchange')}).\n"
            f"Financial Baseline: CMP: INR {mkt.get('current_price')}, P/E: {mkt.get('pe_ratio')}, D/E: {metrics.get('debt_to_equity')} [{metrics.get('debt_to_equity_rating')}], "
            f"Coverage: {metrics.get('interest_coverage')} [{metrics.get('interest_coverage_rating')}], ROCE: {metrics.get('roce_pct')}%, Spread: {metrics.get('roce_wacc_spread')}%\n\n"
            f"Sub-agent findings summary:\n{evidence.get('synthesis_inputs', {})}\n\n"
            "MANDATORY DECISION FRAMEWORK & CONVICTION RULES:\n"
            "1. You MUST evaluate 4 explicit score dimensions (0.0 to 10.0):\n"
            "   - business_quality_score: Moat durability, ROCE, balance-sheet strength\n"
            "   - valuation_attractiveness_score: Margin of safety, P/E vs growth runway\n"
            "   - catalyst_momentum_score: Near-term earnings growth, capex realization\n"
            "   - downside_risk_penalty: (0.0 to -5.0) Tail risks, cyclical vulnerability, debt burden\n"
            "2. CONVICTION ALIGNMENT:\n"
            "   - A company with strong business quality DOES NOT automatically justify an OVERWEIGHT rating if valuation attractiveness is low (e.g. fair/full pricing, narrow spread).\n"
            "   - If conviction is NEUTRAL, your narrative MUST explicitly state: 'High franchise quality offset by fair/full valuation, leaving insufficient margin of safety at CMP.'\n"
            "   - DO NOT claim 'strong case for investment' if the final conviction is NEUTRAL.\n"
            "3. In your JSON response under 'role_specific_data', you MUST provide:\n"
            '{\n'
            '  "conviction": "OVERWEIGHT" | "NEUTRAL" | "UNDERWEIGHT",\n'
            '  "target_allocation_pct": <float between 0.0 and 10.0>,\n'
            '  "investment_horizon": "1-Year",\n'
            '  "key_catalyst": "Primary thesis driver",\n'
            '  "decision_framework": {\n'
            '    "business_quality_score": <float 0-10>,\n'
            '    "valuation_attractiveness_score": <float 0-10>,\n'
            '    "catalyst_momentum_score": <float 0-10>,\n'
            '    "downside_risk_penalty": <float -5 to 0>,\n'
            '    "composite_conviction_score": <float 0-10>,\n'
            '    "conviction_rationale": "Clear 1-sentence reconciliation of quality vs valuation"\n'
            '  }\n'
            '}'
        )

    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        sym = company_context.get("symbol")
        name = company_context.get("company_name", sym)
        return AgentOutput(
            agent_name=self.name,
            role=self.role,
            summary=f"Final portfolio synthesis formulated for {name} ({sym}). Conviction: OVERWEIGHT (3.5% Target Weight).",
            findings=[
                "Strategic Franchise Evaluation: Durable fundamental positioning balanced against realistic cyclical downside risks.",
                "Divergence Preservation: Bull thesis highlights long-term compounding moat; Bear thesis underscores premium valuation vulnerability.",
                "Capital Allocation Recommendation: Accumulate cautiously in phased tranches on valuation pullbacks."
            ],
            supporting_evidence=[
                "Synthesis of 12 preceding multi-agent analytical evaluations",
                f"Official security master confirmation on {company_context.get('exchange')}"
            ],
            assumptions=["Investment horizon is oriented for 1-year earnings momentum and 3-5+ year compounding."],
            missing_information=["Granular quarterly filings and live transcript audio ingest."],
            confidence_score=0.85,
            confidence_explanation="Balanced multi-agent synthesis incorporating both upside moats and downside margin stress tests.",
            questions_for_investigation=[
                "Will management guidance in the upcoming financial quarter validate the margin expansion thesis?",
                "Are institutional mutual funds increasing or decreasing weight in this scrip?"
            ],
            role_specific_data={
                "conviction": "OVERWEIGHT",
                "target_allocation_pct": 3.5,
                "investment_horizon": "1-Year",
                "recommendation": "Constructive on Pullbacks",
                "conviction_tier": "Tier-2 Core Accumulation",
                "debate_status": "Disagreements preserved regarding valuation margin of safety",
                "committee_challenge": "DeepSeek-R1 cross-examination resolved in favor of moat durability"
            },
            model_tier="reasoner+analyst",
            execution_status="dev_stub"
        )

    async def run(
        self,
        company_context: Dict[str, Any],
        evidence: Optional[Dict[str, Any]] = None,
        timeout_sec: float = 60.0
    ) -> AgentOutput:
        """2-Stage PM Synthesis: DeepSeek-R1 challenges both sides -> Qwen finalizes allocation conviction."""
        start_time = time.time()
        evidence_dict = evidence or {}

        if not LLMConfig.is_configured():
            stub = self.get_development_stub(company_context, evidence_dict)
            stub.execution_duration_sec = 1.35
            stub.model_tier = "reasoner+analyst"
            return stub

        user_prompt = self.get_user_prompt(company_context, evidence_dict)

        try:
            # Stage 1: DeepSeek-R1 (Reasoner) conducts Adversarial Cross-Examination of Bull and Bear cases
            r1_system = (
                "You are the Senior Investment Committee Adversarial Challenger powered by DeepSeek-R1 reasoning. "
                "Aggressively interrogate both the Bull Thesis and the Bear Thesis presented below. "
                "Challenge false confidence, detect unverified leaps of logic, evaluate asymmetric payoff asymmetry, "
                "and identify which argument has stronger empirical evidence."
            )
            r1_user = (
                f"Conduct an adversarial cross-examination of these findings for {company_context.get('company_name')}:\n\n"
                f"{user_prompt}\n\n"
                "Provide an unvarnished audit: Expose flaws in the Bull's growth claims, flaws in the Bear's terminal risks, "
                "and state where the true balance of risk-adjusted probability lies."
            )

            r1_result = await call_llm(
                system_prompt=r1_system,
                user_prompt=r1_user,
                response_format="json",
                model_tier="reasoner",
                timeout_sec=max(25.0, timeout_sec * 0.5)
            )
            committee_challenge = r1_result.get("findings", [])

            # Stage 2: Qwen (Analyst) synthesizes final institutional capital allocation with R1 challenge factored in
            qwen_system = self.get_system_prompt()
            challenge_block = "\n".join([f"- {c}" for c in committee_challenge]) if committee_challenge else "Debate balanced."
            qwen_user = (
                f"{user_prompt}\n\n"
                f"INVESTMENT COMMITTEE ADVERSARIAL CROSS-EXAMINATION (DeepSeek-R1 Audit):\n{challenge_block}\n\n"
                "Synthesize the final institutional capital allocation decision factoring in this adversarial audit. "
                "Set definitive 'conviction' (OVERWEIGHT, NEUTRAL, or UNDERWEIGHT) and 'target_allocation_pct' (0.0 to 10.0) "
                "inside 'role_specific_data'."
            )

            qwen_result = await call_llm(
                system_prompt=qwen_system,
                user_prompt=qwen_user,
                response_format="json",
                model_tier="analyst",
                timeout_sec=max(25.0, timeout_sec * 0.5)
            )

            role_data = qwen_result.get("role_specific_data", {})
            if committee_challenge:
                role_data["committee_challenge_points"] = committee_challenge[:3]
                role_data["pipeline"] = "DeepSeek-R1 Cross-Examination -> Qwen Synthesis"

            duration = round(time.time() - start_time, 3)
            return AgentOutput(
                agent_name=self.name,
                role=self.role,
                summary=qwen_result.get("summary", "Portfolio Manager conviction synthesized."),
                findings=qwen_result.get("findings", []),
                supporting_evidence=qwen_result.get("supporting_evidence", []) + [f"DeepSeek-R1 Adversarial Critique: {len(committee_challenge)} points assessed"],
                assumptions=qwen_result.get("assumptions", []),
                missing_information=qwen_result.get("missing_information", []),
                confidence_score=float(qwen_result.get("confidence_score", 0.85)),
                confidence_explanation=qwen_result.get("confidence_explanation", "Two-stage DeepSeek-R1 adversarial critique + Qwen PM allocation"),
                questions_for_investigation=qwen_result.get("questions_for_investigation", []),
                role_specific_data=role_data,
                model_tier="reasoner+analyst",
                execution_status="success",
                execution_duration_sec=duration
            )

        except Exception as e:
            logger.warning(f"Live 2-stage PM synthesis failed: {e}. Falling back to analytical stub.")
            stub = self.get_development_stub(company_context, evidence_dict)
            stub.execution_duration_sec = round(time.time() - start_time, 3)
            stub.execution_status = "stub_fallback"
            stub.error_message = str(e)
            stub.model_tier = "reasoner+analyst"
            return stub
