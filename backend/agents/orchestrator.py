"""LangGraph StateGraph Multi-Agent Orchestrator for BharatEquity Platform.

Orchestrates all 13 specialized agents using LangGraph's StateGraph:
- Stage 0: Research Manager & Planning
- Stage 1: Parallel Evidence & Foundational Specialists
- Stage 2: Independent Thesis Generation (Bull & Bear concurrently without cross-contamination)
- Stage 3: Adversarial Rebuttal Debate (Bull responds to Bear, Bear responds to Bull)
- Stage 4: Risk & Execution Evaluation (Concurrent Trader & Risk Analyst)
- Stage 5: Portfolio Manager Conviction Synthesis

Uses Annotated[List[AgentOutput], operator.add] to guarantee safe parallel state updates.
"""

import asyncio
from datetime import datetime, timezone
import operator
from typing import Annotated, Any, Dict, List, Optional, Tuple, TypedDict

from langgraph.graph import END, START, StateGraph

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
from agents.metrics import calculate_financial_metrics
from schemas import BullBearDebate, ReportSection, ResearchReport, TacticalExecutionPlan


class AgentGraphState(TypedDict):
    """LangGraph execution state with safe reducer for concurrent node execution."""
    company_context: Dict[str, Any]
    deterministic_metrics: Dict[str, Any]
    manager_output: Optional[AgentOutput]
    evidence_pool: Dict[str, Any]
    bull_initial: Optional[AgentOutput]
    bear_initial: Optional[AgentOutput]
    bull_rebuttal: Optional[AgentOutput]
    bear_rebuttal: Optional[AgentOutput]
    risk_output: Optional[AgentOutput]
    trader_output: Optional[AgentOutput]
    pm_output: Optional[AgentOutput]
    # Reducer ensures parallel agent writes are safely concatenated without overwrites
    agent_runs: Annotated[List[AgentOutput], operator.add]


# Node 0: Research Manager & Planning Node
async def planning_node(state: AgentGraphState) -> Dict[str, Any]:
    company = state["company_context"]

    # Enrich with live free data sources (yfinance, Google News, BSE)
    try:
        from data_providers.aggregator import enrich_company_with_free_sources
        enriched_company = await enrich_company_with_free_sources(company)
    except Exception:
        enriched_company = dict(company)

    # Deterministic metrics calculation from enriched financials
    raw_fin = enriched_company.get("financials") or {}
    metrics = calculate_financial_metrics(raw_fin)
    enriched_company["calculated_metrics"] = metrics

    manager = ResearchManagerAgent()
    manager_output = await manager.run(enriched_company)
    return {
        "company_context": enriched_company,
        "deterministic_metrics": metrics,
        "manager_output": manager_output,
        "agent_runs": [manager_output],
    }


# Node 1: Evidence & Foundational Specialists
async def foundational_analysts_node(state: AgentGraphState) -> Dict[str, Any]:
    company = state["company_context"]
    analysts = [
        EvidenceVerificationAnalyst(),
        FundamentalsQualityAnalyst(),
        GrowthIndustryAnalyst(),
        NewsCorporateEventsAnalyst(),
        SocialSentimentAnalyst(),
        MarketAnalyst(),
        PeerValuationAnalyst(),
    ]
    tasks = [a.run(company) for a in analysts]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    
    evidence_pool = {
        "company": company,
        "calculated_metrics": state.get("deterministic_metrics", {}),
        "analyst_findings": {r.role: r.findings for r in results},
    }
    return {
        "evidence_pool": evidence_pool,
        "agent_runs": list(results),
    }


# Node 2A: Independent Bull Thesis (Reads only evidence pool, zero bear cross-contamination)
async def bull_thesis_node(state: AgentGraphState) -> Dict[str, Any]:
    bull_agent = BullResearcherAgent()
    bull_out = await bull_agent.run(state["company_context"], state["evidence_pool"])
    return {
        "bull_initial": bull_out,
        "agent_runs": [bull_out],
    }


# Node 2B: Independent Bear Thesis (Reads only evidence pool, zero bull cross-contamination)
async def bear_thesis_node(state: AgentGraphState) -> Dict[str, Any]:
    bear_agent = BearResearcherAgent()
    bear_out = await bear_agent.run(state["company_context"], state["evidence_pool"])
    return {
        "bear_initial": bear_out,
        "agent_runs": [bear_out],
    }


# Node 3: Adversarial Rebuttal Round (Exchanges theses for 1 single bounded debate round)
async def debate_rebuttal_node(state: AgentGraphState) -> Dict[str, Any]:
    bull_initial = state["bull_initial"]
    bear_initial = state["bear_initial"]
    evidence = state["evidence_pool"]

    bull_evidence = dict(evidence, bear_thesis="\n".join(bear_initial.findings if bear_initial else []))
    bear_evidence = dict(evidence, bull_thesis="\n".join(bull_initial.findings if bull_initial else []))

    bull_agent = BullResearcherAgent()
    bear_agent = BearResearcherAgent()

    bull_reb, bear_reb = await asyncio.gather(
        bull_agent.run(state["company_context"], bull_evidence),
        bear_agent.run(state["company_context"], bear_evidence),
        return_exceptions=False
    )
    bull_reb.role = "Bull Researcher (Rebuttal Round)"
    bear_reb.role = "Bear Researcher (Rebuttal Round)"

    return {
        "bull_rebuttal": bull_reb,
        "bear_rebuttal": bear_reb,
        "agent_runs": [bull_reb, bear_reb],
    }


# Node 4: Risk & Execution Evaluation
async def risk_and_execution_node(state: AgentGraphState) -> Dict[str, Any]:
    evidence = dict(state["evidence_pool"])
    bull_reb = state.get("bull_rebuttal")
    bear_reb = state.get("bear_rebuttal")
    bull_init = state.get("bull_initial")
    bear_init = state.get("bear_initial")

    evidence["bull_rebuttal_points"] = bull_reb.findings if bull_reb else (bull_init.findings if bull_init else [])
    evidence["bear_rebuttal_points"] = bear_reb.findings if bear_reb else (bear_init.findings if bear_init else [])

    trader_agent = TraderAgent()
    risk_agent = RiskAnalystAgent()

    trader_out, risk_out = await asyncio.gather(
        trader_agent.run(state["company_context"], evidence),
        risk_agent.run(state["company_context"], evidence),
        return_exceptions=False
    )
    return {
        "trader_output": trader_out,
        "risk_output": risk_out,
        "agent_runs": [trader_out, risk_out],
    }


# Node 5: Portfolio Manager Conviction Synthesis
async def pm_synthesis_node(state: AgentGraphState) -> Dict[str, Any]:
    pm_agent = PortfolioManagerAgent()
    manager_output = state["manager_output"]
    bull_initial = state.get("bull_initial")
    bear_initial = state.get("bear_initial")
    bull_reb = state.get("bull_rebuttal")
    bear_reb = state.get("bear_rebuttal")
    risk_output = state.get("risk_output")
    trader_output = state.get("trader_output")

    bull_findings = (bull_initial.findings if bull_initial else []) + (bull_reb.findings if bull_reb else [])
    bear_findings = (bear_initial.findings if bear_initial else []) + (bear_reb.findings if bear_reb else [])

    synthesis_inputs = {
        "manager_summary": manager_output.summary if manager_output else "",
        "bull_case": bull_findings,
        "bear_case": bear_findings,
        "risk_assessment": risk_output.findings if risk_output else [],
        "trader_plan": trader_output.findings if trader_output else [],
        "metrics": state.get("deterministic_metrics", {}),
    }
    pm_output = await pm_agent.run(state["company_context"], {"synthesis_inputs": synthesis_inputs})
    return {
        "pm_output": pm_output,
        "agent_runs": [pm_output],
    }


def build_research_graph() -> Any:
    """Build and compile the LangGraph StateGraph workflow for 13 agents."""
    builder = StateGraph(AgentGraphState)

    builder.add_node("planning", planning_node)
    builder.add_node("foundational_analysts", foundational_analysts_node)
    builder.add_node("bull_thesis", bull_thesis_node)
    builder.add_node("bear_thesis", bear_thesis_node)
    builder.add_node("debate_rebuttal", debate_rebuttal_node)
    builder.add_node("risk_and_execution", risk_and_execution_node)
    builder.add_node("pm_synthesis", pm_synthesis_node)

    # Workflow edges:
    # START -> planning -> foundational_analysts
    builder.add_edge(START, "planning")
    builder.add_edge("planning", "foundational_analysts")

    # From foundational_analysts, branch concurrently to bull_thesis and bear_thesis
    builder.add_edge("foundational_analysts", "bull_thesis")
    builder.add_edge("foundational_analysts", "bear_thesis")

    # Both independent theses feed into debate_rebuttal (1 bounded adversarial round)
    builder.add_edge("bull_thesis", "debate_rebuttal")
    builder.add_edge("bear_thesis", "debate_rebuttal")

    # From debate, progress to risk_and_execution, then to final pm_synthesis -> END
    builder.add_edge("debate_rebuttal", "risk_and_execution")
    builder.add_edge("risk_and_execution", "pm_synthesis")
    builder.add_edge("pm_synthesis", END)

    return builder.compile()


# Global compiled graph instance
research_graph = build_research_graph()


async def orchestrate_stock_research(company_context: Dict[str, Any]) -> Tuple[ResearchReport, List[AgentOutput]]:
    """Execute complete LangGraph research workflow across all 13 roles."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    symbol = company_context.get("symbol", "EQUITY")
    exchange = company_context.get("exchange", "NSE")
    company_name = company_context.get("company_name", symbol)

    initial_state: AgentGraphState = {
        "company_context": company_context,
        "deterministic_metrics": {},
        "manager_output": None,
        "evidence_pool": {},
        "bull_initial": None,
        "bear_initial": None,
        "bull_rebuttal": None,
        "bear_rebuttal": None,
        "risk_output": None,
        "trader_output": None,
        "pm_output": None,
        "agent_runs": [],
    }

    final_state = await research_graph.ainvoke(initial_state)

    all_agent_runs: List[AgentOutput] = final_state["agent_runs"]
    manager_output = final_state.get("manager_output")
    bull_initial = final_state.get("bull_initial")
    bear_initial = final_state.get("bear_initial")
    bull_reb = final_state.get("bull_rebuttal")
    bear_reb = final_state.get("bear_rebuttal")
    risk_out = final_state.get("risk_output")
    trader_out = final_state.get("trader_output")
    pm_output = final_state.get("pm_output")

    # Find specific analyst outputs by name
    find_agent = lambda name: next((r for r in all_agent_runs if r.agent_name == name), None)
    fundamentals_out = find_agent("Fundamentals Analyst")
    growth_out = find_agent("Growth & Industry Analyst")
    valuation_out = find_agent("Valuation Analyst")

    bull_case = (bull_initial.findings if bull_initial else []) + (bull_reb.findings if bull_reb else [])
    bear_case = (bear_initial.findings if bear_initial else []) + (bear_reb.findings if bear_reb else [])

    # Swing factors derived from specific debate rebuttals and risk audit
    swing_factors = []
    if bull_reb and bull_reb.findings:
        swing_factors.append(f"Bull Rebuttal Defense: {bull_reb.findings[0]}")
    if bear_reb and bear_reb.findings:
        swing_factors.append(f"Bear Rebuttal Challenge: {bear_reb.findings[0]}")
    if risk_out and risk_out.findings:
        swing_factors.append(f"Risk Invalidation Trigger: {risk_out.findings[0]}")

    debate = BullBearDebate(
        bull_case=bull_case,
        bear_case=bear_case,
        critical_swing_factors=swing_factors if swing_factors else (risk_out.findings if risk_out else [])
    )

    # Check both dev_stub and stub_fallback so failed LLM calls are transparently reported
    is_dev_mode = any(r.execution_status in ("dev_stub", "stub_fallback") for r in all_agent_runs)
    has_fallback = any(r.execution_status == "stub_fallback" for r in all_agent_runs)

    if has_fallback:
        report_status = "fallback_stub"
        disclaimer_text = (
            "FALLBACK AUDIT REPORT: Live LLM inference timed out or failed; analytical sections have fallen back "
            "to deterministic financial ratios and verified listing parameters."
        )
    elif is_dev_mode:
        report_status = "dev_stub"
        disclaimer_text = (
            "DEVELOPMENT STUB REPORT: Generated with explicitly labeled agent analytical stubs because live LLM "
            "is operating in local dev mode. Grounded in deterministic financial math."
        )
    else:
        report_status = "generated"
        disclaimer_text = (
            "MULTI-AGENT RESEARCH SYNTHESIS: Generated through an adversarial LangGraph 13-agent deliberation loop "
            "grounded in deterministic Python financial math, official BSE disclosures, and live price microstructure. "
            "Does not constitute personal investment advice."
        )

    pm_data = pm_output.role_specific_data if (pm_output and pm_output.role_specific_data) else {}
    trader_data = trader_out.role_specific_data if (trader_out and trader_out.role_specific_data) else {}

    conviction = pm_data.get("conviction") or "NEUTRAL"
    target_alloc = pm_data.get("target_allocation_pct") or 2.5
    execution_plan = TacticalExecutionPlan(
        entry_range_low=trader_data.get("entry_range_low"),
        entry_range_high=trader_data.get("entry_range_high"),
        invalidation_stop=trader_data.get("invalidation_stop"),
        atr_buffer=trader_data.get("atr_buffer"),
        staged_tranches=trader_data.get("staged_tranches", [])
    )

    report = ResearchReport(
        report_id=f"AGY-{symbol.upper()}-{int(datetime.now().timestamp())}",
        symbol=symbol.upper(),
        company_name=company_name,
        exchange=exchange,
        generated_at=now_iso,
        status=report_status,
        is_prototype_demo=is_dev_mode,
        disclaimer=disclaimer_text,
        conviction=conviction,
        target_allocation_pct=target_alloc,
        execution_plan=execution_plan,
        business_overview=ReportSection(
            title="Business Overview & Evidence Audit",
            status="generated" if not is_dev_mode else "stub",
            summary=manager_output.summary if manager_output else "",
            key_points=manager_output.findings if manager_output else []
        ),
        financial_analysis=ReportSection(
            title="Fundamentals & Balance Sheet Quality",
            status="generated",
            summary=fundamentals_out.summary if fundamentals_out else "Fundamentals analysis",
            key_points=fundamentals_out.findings if fundamentals_out else []
        ),
        growth_prospects=ReportSection(
            title="Growth Catalysts & Industry Position",
            status="generated",
            summary=growth_out.summary if growth_out else "Growth analysis",
            key_points=growth_out.findings if growth_out else []
        ),
        valuation=ReportSection(
            title="Peer Benchmarking & Valuation",
            status="generated",
            summary=valuation_out.summary if valuation_out else "Valuation analysis",
            key_points=valuation_out.findings if valuation_out else []
        ),
        risks=ReportSection(
            title="Systemic & Regulatory Risks",
            status="generated",
            summary=risk_out.summary if risk_out else "Risk analysis",
            key_points=risk_out.findings if risk_out else []
        ),
        bull_vs_bear=debate,
        final_assessment=ReportSection(
            title="Portfolio Manager Conviction Synthesis",
            status="generated",
            summary=pm_output.summary if pm_output else "",
            key_points=pm_output.findings if pm_output else []
        )
    )

    return report, all_agent_runs


async def stream_stock_research(company_context: Dict[str, Any]):
    """Async generator streaming step-by-step agent progress events and final report via SSE."""
    import json
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    symbol = company_context.get("symbol", "EQUITY")
    exchange = company_context.get("exchange", "NSE")
    company_name = company_context.get("company_name", symbol)

    # Initial state
    state: AgentGraphState = {
        "company_context": company_context,
        "deterministic_metrics": {},
        "manager_output": None,
        "evidence_pool": {},
        "bull_initial": None,
        "bear_initial": None,
        "bull_rebuttal": None,
        "bear_rebuttal": None,
        "risk_output": None,
        "trader_output": None,
        "pm_output": None,
        "agent_runs": [],
    }

    # Yield step 0: Started
    yield {
        "event": "started",
        "data": {
            "symbol": symbol,
            "exchange": exchange,
            "company_name": company_name,
            "total_agents": 13,
            "message": "Initializing 13-agent deliberation loop..."
        }
    }

    # Stage 0: Planning & Live Data Ingestion
    yield {"event": "agent_start", "data": {"role": "Research Manager & Orchestrator", "agent_name": "Research Manager", "stage": 0}}
    plan_res = await planning_node(state)
    state["company_context"] = plan_res["company_context"]
    state["deterministic_metrics"] = plan_res["deterministic_metrics"]
    state["manager_output"] = plan_res["manager_output"]
    state["agent_runs"].extend(plan_res["agent_runs"])
    yield {
        "event": "agent_complete",
        "data": {
            "role": "Research Manager & Orchestrator",
            "agent_name": "Research Manager",
            "stage": 0,
            "summary": plan_res["manager_output"].summary,
            "confidence": plan_res["manager_output"].confidence_score,
            "duration": plan_res["manager_output"].execution_duration_sec
        }
    }

    # Stage 1: Parallel Evidence & Foundational Specialists
    specialists = [
        ("Evidence Verification Analyst", "Evidence Verification Analyst"),
        ("Fundamentals Analyst", "Fundamentals & Business Quality Analyst"),
        ("Growth & Industry Analyst", "Growth & Industry Analyst"),
        ("News & Events Analyst", "News, Corporate Events & Earnings-Call Analyst"),
        ("Social Sentiment Analyst", "Social Sentiment Analyst"),
        ("Market Analyst", "Market Analyst"),
        ("Valuation Analyst", "Peer Benchmarking & Valuation Analyst")
    ]
    for agent_name, role_name in specialists:
        yield {"event": "agent_start", "data": {"role": role_name, "agent_name": agent_name, "stage": 1}}

    foundational_res = await foundational_analysts_node(state)
    state["evidence_pool"] = foundational_res["evidence_pool"]
    state["agent_runs"].extend(foundational_res["agent_runs"])

    for agent_out in foundational_res["agent_runs"]:
        yield {
            "event": "agent_complete",
            "data": {
                "role": agent_out.role,
                "agent_name": agent_out.agent_name,
                "stage": 1,
                "summary": agent_out.summary,
                "confidence": agent_out.confidence_score,
                "duration": agent_out.execution_duration_sec
            }
        }

    # Stage 2: Independent Theses & Stage 3: Adversarial Rebuttal (Bull & Bear)
    yield {"event": "agent_start", "data": {"role": "Bull Researcher", "agent_name": "Bull Researcher", "stage": 2}}
    yield {"event": "agent_start", "data": {"role": "Bear Researcher", "agent_name": "Bear Researcher", "stage": 2}}

    bull_res, bear_res = await asyncio.gather(
        bull_thesis_node(state),
        bear_thesis_node(state)
    )
    state["bull_initial"] = bull_res["bull_initial"]
    state["bear_initial"] = bear_res["bear_initial"]
    state["agent_runs"].extend(bull_res["agent_runs"] + bear_res["agent_runs"])

    # Stage 3: Adversarial Rebuttal Round
    rebuttal_res = await debate_rebuttal_node(state)
    state["bull_rebuttal"] = rebuttal_res["bull_rebuttal"]
    state["bear_rebuttal"] = rebuttal_res["bear_rebuttal"]
    state["agent_runs"].extend(rebuttal_res["agent_runs"])

    bull_total_dur = round(bull_res["bull_initial"].execution_duration_sec + rebuttal_res["bull_rebuttal"].execution_duration_sec, 2)
    bear_total_dur = round(bear_res["bear_initial"].execution_duration_sec + rebuttal_res["bear_rebuttal"].execution_duration_sec, 2)

    yield {
        "event": "agent_complete",
        "data": {
            "role": "Bull Researcher",
            "agent_name": "Bull Researcher",
            "stage": 3,
            "summary": f"Formulated bull case & defended in adversarial rebuttal: {bull_res['bull_initial'].summary}",
            "confidence": bull_res["bull_initial"].confidence_score,
            "duration": bull_total_dur
        }
    }
    yield {
        "event": "agent_complete",
        "data": {
            "role": "Bear Researcher",
            "agent_name": "Bear Researcher",
            "stage": 3,
            "summary": f"Formulated bear case & challenged thesis in rebuttal: {bear_res['bear_initial'].summary}",
            "confidence": bear_res["bear_initial"].confidence_score,
            "duration": bear_total_dur
        }
    }

    # Stage 4: Risk & Execution
    yield {"event": "agent_start", "data": {"role": "Risk Analyst", "agent_name": "Risk Analyst", "stage": 4}}
    yield {"event": "agent_start", "data": {"role": "Trader", "agent_name": "Execution Trader", "stage": 4}}

    risk_exec_res = await risk_and_execution_node(state)
    state["trader_output"] = risk_exec_res["trader_output"]
    state["risk_output"] = risk_exec_res["risk_output"]
    state["agent_runs"].extend(risk_exec_res["agent_runs"])

    yield {
        "event": "agent_complete",
        "data": {
            "role": "Risk Analyst",
            "agent_name": "Risk Analyst",
            "stage": 4,
            "summary": risk_exec_res["risk_output"].summary,
            "confidence": risk_exec_res["risk_output"].confidence_score,
            "duration": risk_exec_res["risk_output"].execution_duration_sec
        }
    }
    yield {
        "event": "agent_complete",
        "data": {
            "role": "Trader",
            "agent_name": "Execution Trader",
            "stage": 4,
            "summary": risk_exec_res["trader_output"].summary,
            "confidence": risk_exec_res["trader_output"].confidence_score,
            "duration": risk_exec_res["trader_output"].execution_duration_sec
        }
    }

    # Stage 5: Portfolio Manager Synthesis
    yield {"event": "agent_start", "data": {"role": "Portfolio Manager", "agent_name": "Portfolio Manager", "stage": 5}}
    pm_res = await pm_synthesis_node(state)
    state["pm_output"] = pm_res["pm_output"]
    state["agent_runs"].extend(pm_res["agent_runs"])

    yield {
        "event": "agent_complete",
        "data": {
            "role": "Portfolio Manager",
            "agent_name": "Portfolio Manager",
            "stage": 5,
            "summary": pm_res["pm_output"].summary,
            "confidence": pm_res["pm_output"].confidence_score,
            "duration": pm_res["pm_output"].execution_duration_sec
        }
    }

    # Assemble final report
    all_agent_runs = state["agent_runs"]
    manager_output = state["manager_output"]
    bull_initial = state["bull_initial"]
    bear_initial = state["bear_initial"]
    bull_reb = state["bull_rebuttal"]
    bear_reb = state["bear_rebuttal"]
    risk_out = state["risk_output"]
    pm_output = state["pm_output"]

    find_agent = lambda name: next((r for r in all_agent_runs if r.agent_name == name), None)
    fundamentals_out = find_agent("Fundamentals Analyst")
    growth_out = find_agent("Growth & Industry Analyst")
    valuation_out = find_agent("Valuation Analyst")

    bull_case = (bull_initial.findings if bull_initial else []) + (bull_reb.findings if bull_reb else [])
    bear_case = (bear_initial.findings if bear_initial else []) + (bear_reb.findings if bear_reb else [])

    debate = BullBearDebate(
        bull_case=bull_case,
        bear_case=bear_case,
        critical_swing_factors=risk_out.findings if risk_out else []
    )

    is_dev_mode = any(r.execution_status == "dev_stub" for r in all_agent_runs)

    final_report = ResearchReport(
        report_id=f"AGY-{symbol.upper()}-{int(datetime.now().timestamp())}",
        symbol=symbol.upper(),
        company_name=company_name,
        exchange=exchange,
        generated_at=now_iso,
        status="generated" if not is_dev_mode else "dev_stub",
        is_prototype_demo=is_dev_mode,
        disclaimer=(
            "MULTI-AGENT RESEARCH SYNTHESIS: Generated through a LangGraph 13-agent deliberation loop "
            "powered by Qwen 2.5 Coder 7B reasoning engine (Orchestration, Evidence Verification, Fundamentals, Growth, "
            "Valuation, Independent Bull vs Bear Debate, Risk Audit, Execution Trader, and Portfolio Manager). "
            "Does not constitute personal investment advice."
            if not is_dev_mode else
            "DEVELOPMENT STUB REPORT: Generated with explicitly labeled agent analytical stubs because live LLM_API_KEY "
            "is not configured in backend/.env. Connect Ollama or an API key to activate live reasoning."
        ),
        business_overview=ReportSection(
            title="Business Overview & Evidence Audit",
            status="generated",
            summary=manager_output.summary if manager_output else "",
            key_points=manager_output.findings if manager_output else []
        ),
        financial_analysis=ReportSection(
            title="Fundamentals & Balance Sheet Quality",
            status="generated",
            summary=fundamentals_out.summary if fundamentals_out else "Fundamentals analysis",
            key_points=fundamentals_out.findings if fundamentals_out else []
        ),
        growth_prospects=ReportSection(
            title="Growth Catalysts & Industry Position",
            status="generated",
            summary=growth_out.summary if growth_out else "Growth analysis",
            key_points=growth_out.findings if growth_out else []
        ),
        valuation=ReportSection(
            title="Peer Benchmarking & Valuation",
            status="generated",
            summary=valuation_out.summary if valuation_out else "Valuation analysis",
            key_points=valuation_out.findings if valuation_out else []
        ),
        risks=ReportSection(
            title="Systemic & Regulatory Risks",
            status="generated",
            summary=risk_out.summary if risk_out else "Risk analysis",
            key_points=risk_out.findings if risk_out else []
        ),
        bull_vs_bear=debate,
        final_assessment=ReportSection(
            title="Portfolio Manager Conviction Synthesis",
            status="generated",
            summary=pm_output.summary if pm_output else "",
            key_points=pm_output.findings if pm_output else []
        ),
        agent_runs=[r.model_dump() for r in all_agent_runs]
    )

    yield {
        "event": "report_ready",
        "data": final_report.model_dump()
    }

