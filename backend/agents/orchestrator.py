"""LangGraph StateGraph Multi-Agent Orchestrator for EquiAgentic Platform.

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
import logging
import operator
import os
from typing import Annotated, Any, Dict, List, Optional, Tuple, TypedDict

logger = logging.getLogger("equiagentic.orchestrator")

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
from agents.llm import LLMConfig
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

    report = build_final_research_report(
        symbol=symbol,
        company_name=company_name,
        exchange=exchange,
        now_iso=now_iso,
        all_agent_runs=all_agent_runs,
        manager_output=manager_output,
        fundamentals_out=fundamentals_out,
        growth_out=growth_out,
        valuation_out=valuation_out,
        risk_out=risk_out,
        debate=debate,
        pm_output=pm_output,
        trader_out=trader_out,
        data_source_tier=company_context.get("data_source_tier", "STANDARD_FREE_FALLBACK")
    )

    return report, all_agent_runs


def build_final_research_report(
    symbol: str,
    company_name: str,
    exchange: str,
    now_iso: str,
    all_agent_runs: List[AgentOutput],
    manager_output: Optional[AgentOutput],
    fundamentals_out: Optional[AgentOutput],
    growth_out: Optional[AgentOutput],
    valuation_out: Optional[AgentOutput],
    risk_out: Optional[AgentOutput],
    debate: BullBearDebate,
    pm_output: Optional[AgentOutput],
    trader_out: Optional[AgentOutput],
    data_source_tier: str = "STANDARD_FREE_FALLBACK"
) -> ResearchReport:
    """Shared single report-assembly function for both streaming and non-streaming orchestrator paths."""
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

    raw_conviction = str(pm_data.get("conviction") or "").upper()
    pm_summary = (pm_output.summary if pm_output else "").upper()
    recommendation = str(pm_data.get("recommendation") or "").upper()
    combined_conviction_text = f"{raw_conviction} {pm_summary} {recommendation}"

    bullish_keywords = ["OVERWEIGHT", "BUY", "ACCUMULATE", "OUTPERFORM", "CONSTRUCTIVE"]
    bearish_keywords = ["UNDERWEIGHT", "SELL", "REDUCE", "UNDERPERFORM", "AVOID"]

    if any(k in raw_conviction for k in bullish_keywords) or any(k in combined_conviction_text for k in ["OVERWEIGHT", "STRONG BUY", "ACCUMULATE"]):
        conviction = "OVERWEIGHT"
    elif any(k in raw_conviction for k in bearish_keywords) or any(k in combined_conviction_text for k in ["UNDERWEIGHT", "STRONG SELL", "REDUCE"]):
        conviction = "UNDERWEIGHT"
    elif "NEUTRAL" in raw_conviction or "HOLD" in raw_conviction:
        conviction = "NEUTRAL"
    elif any(k in pm_summary for k in bullish_keywords):
        conviction = "OVERWEIGHT"
    elif any(k in pm_summary for k in bearish_keywords):
        conviction = "UNDERWEIGHT"
    else:
        conviction = "NEUTRAL"

    try:
        target_alloc = float(pm_data.get("target_allocation_pct") or 2.5)
        target_alloc = max(0.0, min(10.0, target_alloc))
    except (ValueError, TypeError):
        target_alloc = 2.5

    execution_plan = TacticalExecutionPlan(
        entry_range_low=trader_data.get("entry_range_low"),
        entry_range_high=trader_data.get("entry_range_high"),
        invalidation_stop=trader_data.get("invalidation_stop"),
        atr_buffer=trader_data.get("atr_buffer"),
        staged_tranches=trader_data.get("staged_tranches", [])
    )

    section_status = "generated" if not is_dev_mode else ("fallback_stub" if has_fallback else "stub")

    return ResearchReport(
        report_id=f"AGY-{symbol.upper()}-{int(datetime.now().timestamp())}",
        symbol=symbol.upper(),
        company_name=company_name,
        exchange=exchange,
        generated_at=now_iso,
        status=report_status,
        is_prototype_demo=is_dev_mode,
        data_source_tier=data_source_tier,
        disclaimer=disclaimer_text,
        conviction=conviction,
        target_allocation_pct=target_alloc,
        execution_plan=execution_plan,
        business_overview=ReportSection(
            title="Business Overview & Evidence Audit",
            status=section_status,
            summary=manager_output.summary if manager_output else "",
            key_points=manager_output.findings if manager_output else []
        ),
        financial_analysis=ReportSection(
            title="Fundamentals & Balance Sheet Quality",
            status=section_status,
            summary=fundamentals_out.summary if fundamentals_out else "Fundamentals analysis",
            key_points=fundamentals_out.findings if fundamentals_out else []
        ),
        growth_prospects=ReportSection(
            title="Growth Catalysts & Industry Position",
            status=section_status,
            summary=growth_out.summary if growth_out else "Growth analysis",
            key_points=growth_out.findings if growth_out else []
        ),
        valuation=ReportSection(
            title="Peer Benchmarking & Valuation",
            status=section_status,
            summary=valuation_out.summary if valuation_out else "Valuation analysis",
            key_points=valuation_out.findings if valuation_out else []
        ),
        risks=ReportSection(
            title="Systemic & Regulatory Risks",
            status=section_status,
            summary=risk_out.summary if risk_out else "Risk analysis",
            key_points=risk_out.findings if risk_out else []
        ),
        bull_vs_bear=debate,
        final_assessment=ReportSection(
            title="Portfolio Manager Conviction Synthesis",
            status=section_status,
            summary=pm_output.summary if pm_output else "",
            key_points=pm_output.findings if pm_output else []
        ),
        agent_runs=[r.model_dump() for r in all_agent_runs]
    )


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

    # Initial state tier defaults to standard fallback until data ingestion verifies it
    tier_init = "STANDARD_FREE_FALLBACK"

    # Yield step 0: Started
    yield {
        "event": "started",
        "data": {
            "symbol": symbol,
            "exchange": exchange,
            "company_name": company_name,
            "total_agents": 13,
            "data_source_tier": tier_init,
            "message": "Initializing 13-agent deliberation loop..."
        }
    }

    # Stage 0: Planning & Live Data Ingestion
    yield {
        "event": "agent_start",
        "data": {
            "role": "Research Manager & Orchestrator",
            "agent_name": "Research Manager",
            "stage": 0,
            "data_source_tier": tier_init
        }
    }
    plan_res = await planning_node(state)
    state["company_context"] = plan_res["company_context"]
    state["deterministic_metrics"] = plan_res["deterministic_metrics"]
    state["manager_output"] = plan_res["manager_output"]
    state["agent_runs"].extend(plan_res["agent_runs"])
    live_tier = state["company_context"].get("data_source_tier", tier_init)
    fallback_msg = state["company_context"].get("dhan_fallback_reason")

    if live_tier != "DHAN_PRO_VERIFIED" and fallback_msg:
        yield {
            "event": "data_feed_notice",
            "data": {
                "tier": "STANDARD_FREE_FALLBACK",
                "message": fallback_msg
            }
        }

    yield {
        "event": "agent_complete",
        "data": {
            "role": "Research Manager & Orchestrator",
            "agent_name": "Research Manager",
            "stage": 0,
            "summary": plan_res["manager_output"].summary,
            "confidence": plan_res["manager_output"].confidence_score,
            "duration": plan_res["manager_output"].execution_duration_sec,
            "data_source_tier": live_tier
        }
    }

    # Stage 1: Foundational Specialists (Real-time Stream Ticking per Agent)
    specialist_instances = [
        EvidenceVerificationAnalyst(),
        FundamentalsQualityAnalyst(),
        GrowthIndustryAnalyst(),
        NewsCorporateEventsAnalyst(),
        SocialSentimentAnalyst(),
        MarketAnalyst(),
        PeerValuationAnalyst()
    ]

    # Stage 1: Parallel Evidence & Foundational Specialists (True Concurrent Dispatch + Live Individual Ticks)
    for agent in specialist_instances:
        yield {"event": "agent_start", "data": {"role": agent.role, "agent_name": agent.name, "stage": 1}}

    async def _run_foundational_agent(ag):
        logger.info(f"[STAGE 1 DISPATCH] Running '{ag.name}' ({ag.role}) | Tier: {ag.model_tier}")
        t_start = asyncio.get_event_loop().time()
        res = await ag.run(state["company_context"], timeout_sec=60.0)
        dur = round(asyncio.get_event_loop().time() - t_start, 2)
        logger.info(f"[STAGE 1 DONE] '{ag.name}' completed in {dur}s | Status: {res.execution_status}")
        return res

    tasks = [asyncio.create_task(_run_foundational_agent(ag)) for ag in specialist_instances]
    foundational_runs = []

    for finished in asyncio.as_completed(tasks):
        agent_out = await finished
        foundational_runs.append(agent_out)
        state["agent_runs"].append(agent_out)
        logger.info(f"[STAGE 1 SSE TICK] Emitting agent_complete for '{agent_out.agent_name}' ({agent_out.execution_duration_sec}s)")

        # Immediately yield this individual agent's completion tick to SSE
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

    state["evidence_pool"] = {
        "company": state["company_context"],
        "calculated_metrics": state.get("deterministic_metrics", {}),
        "analyst_findings": {r.role: r.findings for r in foundational_runs},
    }

    # Stage 2: Independent Theses in Parallel (Bull & Bear with Live Ticking)
    yield {"event": "agent_start", "data": {"role": "Bull Researcher", "agent_name": "Bull Researcher", "stage": 2}}
    yield {"event": "agent_start", "data": {"role": "Bear Researcher", "agent_name": "Bear Researcher", "stage": 2}}

    stage2_tasks = [
        asyncio.create_task(bull_thesis_node(state)),
        asyncio.create_task(bear_thesis_node(state))
    ]
    for finished in asyncio.as_completed(stage2_tasks):
        node_res = await finished
        if "bull_initial" in node_res:
            state["bull_initial"] = node_res["bull_initial"]
            state["agent_runs"].extend(node_res["agent_runs"])
            yield {
                "event": "agent_complete",
                "data": {
                    "role": "Bull Researcher",
                    "agent_name": "Bull Researcher",
                    "stage": 2,
                    "summary": node_res["bull_initial"].summary,
                    "confidence": node_res["bull_initial"].confidence_score,
                    "duration": node_res["bull_initial"].execution_duration_sec
                }
            }
        elif "bear_initial" in node_res:
            state["bear_initial"] = node_res["bear_initial"]
            state["agent_runs"].extend(node_res["agent_runs"])
            yield {
                "event": "agent_complete",
                "data": {
                    "role": "Bear Researcher",
                    "agent_name": "Bear Researcher",
                    "stage": 2,
                    "summary": node_res["bear_initial"].summary,
                    "confidence": node_res["bear_initial"].confidence_score,
                    "duration": node_res["bear_initial"].execution_duration_sec
                }
            }

    # Stage 3: Adversarial Rebuttal Round between Bull & Bear
    logger.info("[STAGE 3 DISPATCH] Adversarial Rebuttal: Bull & Bear cross-examining opposing theses...")
    yield {
        "event": "rebuttal_start",
        "data": {
            "stage": 3,
            "message": "Adversarial Rebuttal in progress: Bull and Bear researchers cross-examining opposing theses..."
        }
    }
    t_reb_start = asyncio.get_event_loop().time()
    rebuttal_res = await debate_rebuttal_node(state)
    reb_dur = round(asyncio.get_event_loop().time() - t_reb_start, 2)

    state["bull_rebuttal"] = rebuttal_res["bull_rebuttal"]
    state["bear_rebuttal"] = rebuttal_res["bear_rebuttal"]
    state["agent_runs"].extend(rebuttal_res["agent_runs"])

    bull_total_dur = round(state["bull_initial"].execution_duration_sec + rebuttal_res["bull_rebuttal"].execution_duration_sec, 2)
    bear_total_dur = round(state["bear_initial"].execution_duration_sec + rebuttal_res["bear_rebuttal"].execution_duration_sec, 2)

    logger.info(f"[STAGE 3 DONE] Adversarial Rebuttal complete in {reb_dur}s. Updating Bull & Bear syntheses.")
    yield {
        "event": "agent_complete",
        "data": {
            "role": "Bull Researcher",
            "agent_name": "Bull Researcher",
            "stage": 3,
            "summary": f"Rebuttal Complete: Defended upside against Bear critique & reinforced valuation moat ({rebuttal_res['bull_rebuttal'].summary})",
            "confidence": rebuttal_res["bull_rebuttal"].confidence_score,
            "duration": bull_total_dur
        }
    }
    yield {
        "event": "agent_complete",
        "data": {
            "role": "Bear Researcher",
            "agent_name": "Bear Researcher",
            "stage": 3,
            "summary": f"Rebuttal Complete: Defended downside risks against Bull claims & reinforced margin threats ({rebuttal_res['bear_rebuttal'].summary})",
            "confidence": rebuttal_res["bear_rebuttal"].confidence_score,
            "duration": bear_total_dur
        }
    }

    # Stage 4: Risk Evaluation (Must complete before Trader to anchor stop-loss & invalidation)
    logger.info("[STAGE 4 DISPATCH] Starting Risk Analyst evaluation...")
    yield {"event": "agent_start", "data": {"role": "Risk Analyst", "agent_name": "Risk Analyst", "stage": 4}}

    evidence_for_s4 = dict(state["evidence_pool"])
    bull_reb = state.get("bull_rebuttal")
    bear_reb = state.get("bear_rebuttal")
    bull_init = state.get("bull_initial")
    bear_init = state.get("bear_initial")

    evidence_for_s4["bull_rebuttal_points"] = bull_reb.findings if bull_reb else (bull_init.findings if bull_init else [])
    evidence_for_s4["bear_rebuttal_points"] = bear_reb.findings if bear_reb else (bear_init.findings if bear_init else [])

    risk_agent = RiskAnalystAgent()
    risk_out = await risk_agent.run(state["company_context"], evidence_for_s4)
    state["risk_output"] = risk_out
    state["agent_runs"].append(risk_out)
    logger.info(f"[STAGE 4 DONE] 'Risk Analyst' completed in {risk_out.execution_duration_sec}s")

    yield {
        "event": "agent_complete",
        "data": {
            "role": "Risk Analyst",
            "agent_name": "Risk Analyst",
            "stage": 4,
            "summary": risk_out.summary,
            "confidence": risk_out.confidence_score,
            "duration": risk_out.execution_duration_sec
        }
    }

    # Stage 4B: Execution Trader (Directly consumes Risk Analyst downside boundaries)
    logger.info("[STAGE 4B DISPATCH] Starting Execution Trader (anchored by Risk Analyst findings)...")
    yield {"event": "agent_start", "data": {"role": "Trader", "agent_name": "Execution Trader", "stage": 4}}

    evidence_for_trader = dict(evidence_for_s4)
    evidence_for_trader["risk_findings"] = risk_out.findings

    trader_agent = TraderAgent()
    trader_out = await trader_agent.run(state["company_context"], evidence_for_trader)
    state["trader_output"] = trader_out
    state["agent_runs"].append(trader_out)
    logger.info(f"[STAGE 4B DONE] 'Execution Trader' completed in {trader_out.execution_duration_sec}s")

    yield {
        "event": "agent_complete",
        "data": {
            "role": "Trader",
            "agent_name": "Execution Trader",
            "stage": 4,
            "summary": trader_out.summary,
            "confidence": trader_out.confidence_score,
            "duration": trader_out.execution_duration_sec
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
    trader_out = find_agent("Trader") or find_agent("Execution Trader")

    bull_case = (bull_initial.findings if bull_initial else []) + (bull_reb.findings if bull_reb else [])
    bear_case = (bear_initial.findings if bear_initial else []) + (bear_reb.findings if bear_reb else [])

    debate = BullBearDebate(
        bull_case=bull_case,
        bear_case=bear_case,
        critical_swing_factors=risk_out.findings if risk_out else []
    )

    final_report = build_final_research_report(
        symbol=symbol,
        company_name=company_name,
        exchange=exchange,
        now_iso=now_iso,
        all_agent_runs=all_agent_runs,
        manager_output=manager_output,
        fundamentals_out=fundamentals_out,
        growth_out=growth_out,
        valuation_out=valuation_out,
        risk_out=risk_out,
        debate=debate,
        pm_output=pm_output,
        trader_out=trader_out,
        data_source_tier=state["company_context"].get("data_source_tier", "STANDARD_FREE_FALLBACK")
    )

    yield {
        "event": "report_ready",
        "data": final_report.model_dump()
    }

