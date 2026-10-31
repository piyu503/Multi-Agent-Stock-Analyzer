"""Deterministic Financial Calculations Module for EquiAgentic.

Ensures LLMs (e.g. Qwen3 4B) receive verified ratios and metrics rather
than computing multi-step arithmetic prone to hallucination.
"""

from typing import Any, Dict, Optional


def safe_div(numerator: Optional[float], denominator: Optional[float], default: Optional[float] = None) -> Optional[float]:
    """Safe division avoiding ZeroDivisionError or None inputs."""
    if numerator is None or denominator is None:
        return default
    if abs(denominator) < 1e-9:
        return default
    return numerator / denominator


def calculate_financial_metrics(financials: Dict[str, Any], market_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Computes key financial ratios deterministically:
    - Debt-to-Equity
    - Interest Coverage Ratio (EBIT / Interest Expense)
    - ROCE vs Estimated WACC spread
    - PEG Ratio (P/E / EPS Growth Rate)
    - Valuation metrics & margins
    - Multi-factor Solvency Check
    """
    fin = financials or {}
    mkt = market_data or {}

    total_debt = fin.get("total_debt")
    equity = fin.get("total_equity") or fin.get("shareholders_equity")
    ebit = fin.get("ebit") or fin.get("operating_profit")
    interest_expense = fin.get("interest_expense") or fin.get("finance_costs")
    roce = fin.get("roce_pct")  # as percentage, e.g. 18.5
    estimated_wacc = fin.get("estimated_wacc_pct", 10.5)  # default Indian equity cost of capital ~10.5%
    
    # Check P/E in financials first, fallback to market_data
    pe_ratio = fin.get("pe_ratio") if fin.get("pe_ratio") is not None else mkt.get("pe_ratio")
    eps_growth_3yr = fin.get("eps_cagr_3yr_pct")
    revenue = fin.get("revenue")
    pat = fin.get("pat") or fin.get("net_profit")
    ebitda = fin.get("ebitda")

    # Deterministic ROE
    roe = fin.get("roe_pct")
    if roe is None and pat is not None and equity is not None and equity > 0:
        roe = round((pat / equity) * 100.0, 2)

    revenue_cagr_3yr = fin.get("revenue_cagr_3yr_pct")
    revenue_growth_yoy = fin.get("revenue_growth_yoy_pct")

    debt_to_equity = safe_div(total_debt, equity) if (equity is not None and equity > 0) else None
    interest_coverage = safe_div(ebit, interest_expense)
    
    roce_wacc_spread = None
    if roce is not None and estimated_wacc is not None:
        roce_wacc_spread = round(roce - estimated_wacc, 2)

    peg_ratio = None
    if pe_ratio is not None and eps_growth_3yr is not None and eps_growth_3yr > 0:
        peg_ratio = safe_div(pe_ratio, eps_growth_3yr)

    net_margin_pct = None
    if pat is not None and revenue:
        net_margin_pct = round((pat / revenue) * 100.0, 2)

    ebitda_margin_pct = None
    if ebitda is not None and revenue:
        ebitda_margin_pct = round((ebitda / revenue) * 100.0, 2)

    # Deterministic Semantic Interpretations to prevent contradictory agent claims
    coverage_interpretation = None
    if interest_coverage is not None:
        if interest_coverage >= 5.0:
            coverage_interpretation = "ROBUST_SOLVENCY (Strong debt-service capability; comfortably above distress thresholds)"
        elif interest_coverage >= 2.5:
            coverage_interpretation = "ADEQUATE_SOLVENCY (Manageable interest burden; standard operational volatility buffer)"
        elif interest_coverage >= 1.5:
            coverage_interpretation = "TIGHT_COVERAGE (Constrained debt-service buffer; monitor in rising interest rate environment)"
        else:
            coverage_interpretation = "HIGH_STRESS (Vulnerable debt-service capability; potential covenant breach risk)"

    leverage_interpretation = None
    if debt_to_equity is not None:
        if debt_to_equity <= 0.3:
            leverage_interpretation = "MINIMAL_LEVERAGE (Conservatively geared balance sheet; low structural solvency risk)"
        elif debt_to_equity <= 0.8:
            leverage_interpretation = "MODERATE_LEVERAGE (Healthy gearing within typical industry operating ranges)"
        elif debt_to_equity <= 1.8:
            leverage_interpretation = "ELEVATED_LEVERAGE (Higher debt load requiring consistent operating cash flow)"
        else:
            leverage_interpretation = "HIGH_LEVERAGE (Aggressive financial gearing; heightened balance-sheet vulnerability)"

    spread_interpretation = None
    if roce_wacc_spread is not None:
        if roce_wacc_spread >= 5.0:
            spread_interpretation = "SUBSTANTIAL_VALUE_ADD (ROCE significantly exceeds WACC; strong economic profit compounding)"
        elif roce_wacc_spread >= 1.5:
            spread_interpretation = "MODERATE_VALUE_ADD (Healthy spread above cost of capital)"
        elif roce_wacc_spread > 0.0:
            spread_interpretation = "MARGINAL_VALUE_ADD (Spread is narrow/near cost of capital; tight economic profit buffer)"
        else:
            spread_interpretation = "VALUE_DESTRUCTIVE (ROCE trails cost of capital; returns below WACC hurdle rate)"

    # Multi-factor solvency assessment
    # Negative equity is an immediate distress flag. Otherwise require coverage > 2.0 and D/E < 2.5
    is_solvent = None
    if equity is not None and equity <= 0:
        is_solvent = False
    elif interest_coverage is not None and debt_to_equity is not None:
        is_solvent = bool(interest_coverage > 2.0 and debt_to_equity < 2.5)
    elif interest_coverage is not None:
        is_solvent = bool(interest_coverage > 2.0)
    elif debt_to_equity is not None:
        is_solvent = bool(debt_to_equity < 1.0)

    return {
        "debt_to_equity": round(debt_to_equity, 2) if debt_to_equity is not None else None,
        "debt_to_equity_rating": leverage_interpretation,
        "interest_coverage": round(interest_coverage, 2) if interest_coverage is not None else None,
        "interest_coverage_rating": coverage_interpretation,
        "roce_pct": roce,
        "roe_pct": roe,
        "estimated_wacc_pct": estimated_wacc,
        "roce_wacc_spread": roce_wacc_spread,
        "roce_wacc_spread_rating": spread_interpretation,
        "revenue_cagr_3yr_pct": revenue_cagr_3yr,
        "revenue_growth_yoy_pct": revenue_growth_yoy,
        "eps_cagr_3yr_pct": round(eps_growth_3yr, 2) if eps_growth_3yr is not None else None,
        "peg_ratio": round(peg_ratio, 2) if peg_ratio is not None else None,
        "net_margin_pct": net_margin_pct,
        "ebitda_margin_pct": ebitda_margin_pct,
        "is_solvent": is_solvent,
        "is_value_creating": roce_wacc_spread > 0 if roce_wacc_spread is not None else None,
    }
