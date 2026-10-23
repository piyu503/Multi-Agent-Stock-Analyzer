import os
import pytest
import sqlite3
import tempfile
from unittest.mock import AsyncMock, patch

from agents.analysts import (
    EvidenceVerificationAnalyst,
    FundamentalsQualityAnalyst,
    GrowthIndustryAnalyst,
    MarketAnalyst,
    NewsCorporateEventsAnalyst,
    PeerValuationAnalyst,
    ResearchManagerAgent,
    SocialSentimentAnalyst,
)
from agents.base import AgentOutput
from agents.decision_makers import (
    BearResearcherAgent,
    BullResearcherAgent,
    PortfolioManagerAgent,
    RiskAnalystAgent,
    TraderAgent,
)
from agents.llm import LLMConfig
from agents.orchestrator import orchestrate_stock_research
from fastapi.testclient import TestClient

import database
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    database.init_db()
    yield

MOCK_COMPANY = {
    "symbol": "RELIANCE",
    "company_name": "Reliance Industries Limited",
    "exchange": "NSE",
    "sector": "Energy & Petrochemicals",
    "industry": "Oil & Gas / Telecom / Retail",
    "isin": "INE002A01018",
    "series": "EQ",
    "data_source": "Official NSE Securities File (EQUITY_L.csv)"
}


def test_all_13_agents_instantiation_and_distinct_identities():
    """Verify all 13 agents have distinct names, roles, and dedicated system prompts."""
    agents = [
        ResearchManagerAgent(),
        EvidenceVerificationAnalyst(),
        FundamentalsQualityAnalyst(),
        GrowthIndustryAnalyst(),
        NewsCorporateEventsAnalyst(),
        SocialSentimentAnalyst(),
        MarketAnalyst(),
        PeerValuationAnalyst(),
        BullResearcherAgent(),
        BearResearcherAgent(),
        TraderAgent(),
        RiskAnalystAgent(),
        PortfolioManagerAgent(),
    ]

    assert len(agents) == 13

    names = [a.name for a in agents]
    roles = [a.role for a in agents]
    prompts = [a.get_system_prompt() for a in agents]

    # Check complete uniqueness of names, roles, and system instructions
    assert len(set(names)) == 13
    assert len(set(roles)) == 13
    assert len(set(prompts)) == 13


@pytest.mark.asyncio
async def test_unconfigured_llm_produces_explicit_dev_stubs():
    """When LLM_API_KEY is not configured, agents must return explicit dev_stub status without fabricating."""
    with patch.object(LLMConfig, "is_configured", return_value=False):
        agent = FundamentalsQualityAnalyst()
        res = await agent.run(MOCK_COMPANY)

        assert isinstance(res, AgentOutput)
        assert res.execution_status == "dev_stub"
        assert res.agent_name == "Fundamentals Analyst"
        assert len(res.findings) > 0
        assert len(res.missing_information) > 0


@pytest.mark.asyncio
async def test_live_llm_structured_output_validation():
    """Verify agent parses structured JSON from LLM into typed AgentOutput."""
    mock_llm_json = {
        "summary": "Verified company fundamentals successfully.",
        "findings": ["Operating margins are resilient.", "Capex cycle entering maturity."],
        "supporting_evidence": ["Historical EBITDA statements."],
        "assumptions": ["Stable oil demand."],
        "missing_information": ["Granular retail division breakdown."],
        "confidence_score": 0.88,
        "confidence_explanation": "Comprehensive financial metrics provided.",
        "questions_for_investigation": ["What is next quarter debt retirement target?"],
        "role_specific_data": {"ebitda_margin": "18.2%"}
    }

    with patch.object(LLMConfig, "is_configured", return_value=True), \
         patch("agents.base.call_llm", new=AsyncMock(return_value=mock_llm_json)):

        agent = FundamentalsQualityAnalyst()
        res = await agent.run(MOCK_COMPANY)

        assert res.execution_status == "success"
        assert res.confidence_score == 0.88
        assert "Operating margins are resilient." in res.findings
        assert res.role_specific_data["ebitda_margin"] == "18.2%"


@pytest.mark.asyncio
async def test_agent_error_and_exception_handling():
    """If LLM execution raises an exception, agent falls back gracefully to stub with error captured."""
    with patch.object(LLMConfig, "is_configured", return_value=True), \
         patch("agents.base.call_llm", side_effect=RuntimeError("Provider 500 internal failure")):

        agent = RiskAnalystAgent()
        res = await agent.run(MOCK_COMPANY)

        assert res.execution_status == "stub_fallback"
        assert "Provider 500 internal failure" in res.error_message
        assert len(res.findings) > 0


@pytest.mark.asyncio
async def test_bull_bear_independence_and_debate_sequencing():
    """Verify Bull and Bear researchers develop initial cases independently, then receive opposing cases for rebuttal."""
    initial_bull = BullResearcherAgent()
    initial_bear = BearResearcherAgent()

    # Initial prompt check - neither receives the other's thesis
    p_bull_init = initial_bull.get_user_prompt(MOCK_COMPANY, {})
    p_bear_init = initial_bear.get_user_prompt(MOCK_COMPANY, {})
    assert "INITIAL THESIS" in p_bull_init
    assert "INITIAL THESIS" in p_bear_init
    assert "REBUTTAL STAGE" not in p_bull_init
    assert "REBUTTAL STAGE" not in p_bear_init

    # Rebuttal prompt check - Bull receives Bear thesis and Bear receives Bull thesis
    p_bull_reb = initial_bull.get_user_prompt(MOCK_COMPANY, {"bear_thesis": "Margin compression risk."})
    p_bear_reb = initial_bear.get_user_prompt(MOCK_COMPANY, {"bull_thesis": "Strong competitive moat."})
    assert "REBUTTAL STAGE" in p_bull_reb
    assert "Margin compression risk." in p_bull_reb
    assert "REBUTTAL STAGE" in p_bear_reb
    assert "Strong competitive moat." in p_bear_reb


@pytest.mark.asyncio
async def test_orchestration_flow_all_13_agents_executed():
    """Verify complete orchestration coordinates all 13 roles and generates compatible report."""
    with patch.object(LLMConfig, "is_configured", return_value=False):
        report, agent_runs = await orchestrate_stock_research(MOCK_COMPANY)

        # 13 agent runs (plus rebuttal stages tagged)
        assert len(agent_runs) >= 13
        assert report.symbol == "RELIANCE"
        assert report.exchange == "NSE"
        assert report.business_overview is not None
        assert report.financial_analysis is not None
        assert report.growth_prospects is not None
        assert report.valuation is not None
        assert report.risks is not None
        assert len(report.bull_vs_bear.bull_case) > 0
        assert len(report.bull_vs_bear.bear_case) > 0
        assert report.final_assessment is not None


def test_create_report_endpoint_compatibility():
    """Test POST /api/reports/{symbol} integration with multi-agent report."""
    with patch.object(LLMConfig, "is_configured", return_value=False):
        res = client.post("/api/reports/RELIANCE?exchange=NSE")
        assert res.status_code == 200
        data = res.json()
        assert data["symbol"] == "RELIANCE"
        assert "business_overview" in data
        assert "financial_analysis" in data
        assert "bull_vs_bear" in data
        assert "agent_runs" in data
        assert len(data["agent_runs"]) >= 13
