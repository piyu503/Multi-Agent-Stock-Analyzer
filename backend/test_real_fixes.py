"""Comprehensive unit and integration test suite for deterministic metrics,
data enrichers, ISIN validation, and multi-agent prompt grounding.
"""

import pytest
from agents.analysts import (
    EvidenceVerificationAnalyst,
    FundamentalsQualityAnalyst,
    GrowthIndustryAnalyst,
    MarketAnalyst,
    NewsCorporateEventsAnalyst,
    PeerValuationAnalyst,
    ResearchManagerAgent,
    SocialSentimentAnalyst,
    verify_isin_and_listing,
)
from agents.decision_makers import (
    BearResearcherAgent,
    BullResearcherAgent,
    PortfolioManagerAgent,
    RiskAnalystAgent,
    TraderAgent,
)
from agents.metrics import calculate_financial_metrics
from data_providers.peers_provider import format_peer_comparison_text, get_sector_peers
import database


def test_deterministic_isin_validation_checksum():
    """Verify standard Luhn mod-10 checksum on real Indian ISINs."""
    # Real Reliance ISIN
    v_rel = verify_isin_and_listing({"isin": "INE002A01018", "exchange": "NSE", "series": "EQ"})
    assert v_rel["is_valid_format"] is True
    assert v_rel["checksum_valid"] is True
    assert v_rel["is_standard_series"] is True
    assert v_rel["is_surveillance_series"] is False
    assert v_rel["integrity_status"] == "Verified Clean"

    # Real TCS ISIN
    v_tcs = verify_isin_and_listing({"isin": "INE467B01029", "exchange": "NSE", "series": "EQ"})
    assert v_tcs["is_valid_format"] is True
    assert v_tcs["checksum_valid"] is True

    # Bad Checksum ISIN (last digit corrupted)
    v_bad = verify_isin_and_listing({"isin": "INE002A01019", "exchange": "NSE", "series": "EQ"})
    assert v_bad["is_valid_format"] is True
    assert v_bad["checksum_valid"] is False
    assert v_bad["integrity_status"] == "Checksum Mismatch - Flagged Transcription Error"

    # Surveillance Series BE
    v_surv = verify_isin_and_listing({"isin": "INE002A01018", "exchange": "NSE", "series": "BE"})
    assert v_surv["is_surveillance_series"] is True


def test_deterministic_financial_metrics_roce_and_peg():
    """Test ROCE, WACC spread, PEG ratio, and multi-factor solvency."""
    financials = {
        "revenue": 1000000.0,
        "ebitda": 200000.0,
        "ebit": 150000.0,
        "pat": 100000.0,
        "interest_expense": 25000.0,
        "total_debt": 300000.0,
        "total_equity": 700000.0,
        "roce_pct": 15.0,
        "estimated_wacc_pct": 10.5,
        "eps_cagr_3yr_pct": 12.0,
        "pe_ratio": 24.0
    }
    mkt = {"pe_ratio": 24.0}
    metrics = calculate_financial_metrics(financials, mkt)

    assert metrics["debt_to_equity"] == 0.43  # 300,000 / 700,000
    assert metrics["interest_coverage"] == 6.0  # 150,000 / 25,000
    assert metrics["roce_pct"] == 15.0
    assert metrics["roce_wacc_spread"] == 4.5  # 15.0 - 10.5
    assert metrics["eps_cagr_3yr_pct"] == 12.0
    assert metrics["peg_ratio"] == 2.0  # 24.0 / 12.0
    assert metrics["net_margin_pct"] == 10.0  # (100k / 1M) * 100
    assert metrics["ebitda_margin_pct"] == 20.0
    assert metrics["is_solvent"] is True
    assert metrics["is_value_creating"] is True


def test_sector_peers_provider_benchmark():
    """Test sector peer lookup and table formatting."""
    database.init_db()
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO stocks (symbol, company_name, exchange, isin, industry, is_active) "
        "VALUES ('HDFCBANK', 'HDFC Bank Ltd', 'NSE', 'INE040A01034', 'Banks - Private Sector', 1)"
    )
    c.execute(
        "INSERT OR REPLACE INTO stocks (symbol, company_name, exchange, isin, industry, is_active) "
        "VALUES ('ICICIBANK', 'ICICI Bank Ltd', 'NSE', 'INE090A01021', 'Banks - Private Sector', 1)"
    )
    conn.commit()
    conn.close()

    peers = get_sector_peers("Banks - Private Sector", "HDFCBANK", max_peers=3)
    assert isinstance(peers, list)
    # Check that HDFCBANK was excluded from its own peers
    assert not any(p["symbol"] == "HDFCBANK" for p in peers)
    assert any(p["symbol"] == "ICICIBANK" for p in peers)

    formatted = format_peer_comparison_text(peers, {"pe_ratio": 18.5, "pb_ratio": 2.4})
    assert "SECTOR PEER BENCHMARK UNIVERSE" in formatted
    assert "Target P/E: 18.5" in formatted


def test_bull_and_bear_prompts_consume_evidence_pool():
    """Verify that Bull and Bear initial and rebuttal prompts receive the actual numbers and findings."""
    company_context = {
        "symbol": "RELIANCE",
        "company_name": "Reliance Industries Limited",
        "sector": "Energy",
        "market_data": {"current_price": 2750.0, "pe_ratio": 24.5, "ev_ebitda": 12.1}
    }
    evidence_pool = {
        "calculated_metrics": {
            "debt_to_equity": 0.44,
            "interest_coverage": 5.2,
            "roce_pct": 11.31,
            "roce_wacc_spread": 0.81,
            "eps_cagr_3yr_pct": 14.5,
            "peg_ratio": 1.69
        },
        "analyst_findings": {
            "Fundamentals & Business Quality Analyst": ["Resilient operating margin buffers."],
            "Growth & Industry Analyst": ["Beneficiary of domestic telecom expansion."]
        }
    }

    bull_agent = BullResearcherAgent()
    bear_agent = BearResearcherAgent()

    # Initial prompts
    bull_prompt = bull_agent.get_user_prompt(company_context, evidence_pool)
    bear_prompt = bear_agent.get_user_prompt(company_context, evidence_pool)

    # Both initial prompts must explicitly contain the numbers, correct labels, and findings
    assert "2750.0" in bull_prompt
    assert "0.44" in bull_prompt
    assert "11.31%" in bull_prompt
    assert "3-Year EPS CAGR: 14.5%" in bull_prompt
    assert "PEG Ratio: 1.69" in bull_prompt
    assert "Resilient operating margin buffers." in bull_prompt

    assert "2750.0" in bear_prompt
    assert "0.44" in bear_prompt
    assert "11.31%" in bear_prompt
    assert "3-Year EPS CAGR: 14.5%" in bear_prompt
    assert "PEG Ratio: 1.69" in bear_prompt
    assert "Beneficiary of domestic telecom expansion." in bear_prompt

    # Rebuttal prompts MUST retain baseline metrics and evidence pool alongside opponent thesis
    bull_rebuttal_prompt = bull_agent.get_user_prompt(
        company_context,
        {**evidence_pool, "bear_thesis": "Severe debt refinancing risk."}
    )
    assert "REBUTTAL STAGE" in bull_rebuttal_prompt
    assert "Severe debt refinancing risk." in bull_rebuttal_prompt
    assert "0.44" in bull_rebuttal_prompt
    assert "11.31%" in bull_rebuttal_prompt
    assert "Resilient operating margin buffers." in bull_rebuttal_prompt

    bear_rebuttal_prompt = bear_agent.get_user_prompt(
        company_context,
        {**evidence_pool, "bull_thesis": "Unmatched retail footprint expansion."}
    )
    assert "REBUTTAL STAGE" in bear_rebuttal_prompt
    assert "Unmatched retail footprint expansion." in bear_rebuttal_prompt
    assert "0.44" in bear_rebuttal_prompt
    assert "11.31%" in bear_rebuttal_prompt
    assert "Beneficiary of domestic telecom expansion." in bear_rebuttal_prompt


def test_trader_and_risk_prompts_consume_debate_and_technicals():
    """Verify that Trader and Risk Analyst prompts consume technical levels and debate vulnerabilities."""
    company_context = {
        "symbol": "TCS",
        "company_name": "Tata Consultancy Services Limited",
        "exchange": "NSE",
        "market_data": {
            "current_price": 3850.0,
            "dma_50": 3720.0,
            "dma_200": 3550.0,
            "avg_volume_30d": 1250000,
            "beta": 0.75,
            "atr_14": 65.4,
            "swing_high_20d": 3920.0,
            "swing_low_20d": 3740.0,
            "realized_vol_20d_pct": 16.8
        },
        "corporate_filings": [{"category": "Board Meeting", "headline": "Dividend Declaration"}],
        "financials": {"total_debt": 5000.0}
    }
    evidence = {
        "calculated_metrics": {"debt_to_equity": 0.05, "interest_coverage": 45.0, "is_solvent": True},
        "bull_rebuttal_points": ["Strong multi-billion dollar deal pipeline."],
        "bear_rebuttal_points": ["Slowdown in US BFSI discretionary spending."]
    }

    trader = TraderAgent()
    risk = RiskAnalystAgent()

    trader_prompt = trader.get_user_prompt(company_context, evidence)
    risk_prompt = risk.get_user_prompt(company_context, evidence)

    assert "3850.0" in trader_prompt
    assert "3720.0" in trader_prompt
    assert "14-Day ATR: INR 65.4" in trader_prompt
    assert "20-Day Swing Range: [Low INR 3740.0 - High INR 3920.0]" in trader_prompt
    assert "Slowdown in US BFSI discretionary spending." in trader_prompt

    assert "Dividend Declaration" in risk_prompt
    assert "Slowdown in US BFSI discretionary spending." in risk_prompt
    assert "45.0" in risk_prompt


def test_catalog_coverage_summary():
    """Verify that catalog coverage summary returns verified structural counts."""
    summary = database.get_catalog_coverage_summary()
    assert isinstance(summary, dict)
    assert "total" in summary
    assert "with_scrip_code" in summary
    assert "with_sector" in summary
    assert "with_listing_date" in summary
    assert summary["total"] > 0
    assert summary["with_scrip_code"] >= 0


@pytest.mark.asyncio
async def test_orchestrator_tactical_execution_plan_output():
    """Verify that orchestrator produces tactical execution plan and conviction fields in the report."""
    from agents.orchestrator import orchestrate_stock_research
    context = {
        "symbol": "RELIANCE",
        "company_name": "Reliance Industries Limited",
        "exchange": "NSE",
        "market_data": {"current_price": 2750.0},
        "financials": {},
        "isin": "INE002A01018"
    }
    report, agent_runs = await orchestrate_stock_research(context)
    assert report.conviction in ["OVERWEIGHT", "NEUTRAL", "UNDERWEIGHT"]
    assert isinstance(report.target_allocation_pct, float)
    assert report.execution_plan is not None
    assert isinstance(report.execution_plan.staged_tranches, list)
    assert len(agent_runs) >= 11


@pytest.mark.asyncio
async def test_nse_microstructure_bridge():
    """Verify that stock-nse-india bridge extracts delivery and microstructure data."""
    from data_providers.nse_provider import fetch_nse_market_microstructure
    data = await fetch_nse_market_microstructure("TCS")
    assert isinstance(data, dict)
    assert data.get("status") in ["success", "unavailable", "timeout"]
    if data.get("status") == "success":
        assert "delivery_position" in data
        assert "microstructure" in data
        assert "announcements" in data
        assert "board_meetings" in data


def test_multi_model_tier_routing():
    """Verify that heterogeneous model tiers (Qwen, Granite, DeepSeek-R1) resolve and agents configure properly."""
    from agents.llm import LLMConfig, sanitize_json_response
    from agents.analysts import EvidenceVerificationAnalyst, SocialSentimentAnalyst, NewsCorporateEventsAnalyst
    from agents.decision_makers import RiskAnalystAgent, PortfolioManagerAgent, BullResearcherAgent

    # 1. Tier resolution test
    analyst_model = LLMConfig.get_model("analyst")
    extractor_model = LLMConfig.get_model("extractor")
    reasoner_model = LLMConfig.get_model("reasoner")

    assert isinstance(analyst_model, str) and len(analyst_model) > 0
    assert isinstance(extractor_model, str) and len(extractor_model) > 0
    assert isinstance(reasoner_model, str) and len(reasoner_model) > 0

    # 2. Agent model tier assignments
    ev_agent = EvidenceVerificationAnalyst()
    assert ev_agent.model_tier == "extractor"

    sent_agent = SocialSentimentAnalyst()
    assert sent_agent.model_tier == "extractor"

    risk_agent = RiskAnalystAgent()
    assert risk_agent.model_tier == "reasoner"

    pm_agent = PortfolioManagerAgent()
    assert pm_agent.model_tier == "reasoner+analyst"

    bull_agent = BullResearcherAgent()
    assert bull_agent.model_tier == "analyst"

    # 3. DeepSeek-R1 <think> token stripping test
    r1_sample = "<think>Analyzing margin contraction risk under high input cost...</think>{\"summary\": \"High risk\", \"findings\": []}"
    sanitized = sanitize_json_response(r1_sample)
    assert "<think>" not in sanitized
    assert "Analyzing margin" not in sanitized
    assert "High risk" in sanitized



