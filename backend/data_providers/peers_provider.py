import time
from typing import Any, Dict, List, Optional
import database

_PEER_CACHE: Dict[str, Any] = {}


def fetch_single_peer_multiples(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    """Retrieve lightweight P/E, P/B and Market Cap for a peer symbol via yfinance."""
    cache_key = f"{symbol.upper()}:{exchange.upper()}"
    now = time.time()
    if cache_key in _PEER_CACHE:
        entry, ts = _PEER_CACHE[cache_key]
        if now - ts < 600:  # 10 min cache
            return entry

    suffix = ".BO" if exchange.upper() == "BSE" else ".NS"
    yf_sym = f"{symbol.strip().upper()}{suffix}"
    result = {"pe": None, "pb": None, "market_cap_cr": None}
    try:
        import yfinance as yf
        t = yf.Ticker(yf_sym)
        fi = getattr(t, "fast_info", None)
        inf = getattr(t, "info", None) or {}

        pe = inf.get("trailingPE") or inf.get("forwardPE")
        pb = inf.get("priceToBook")
        mcap = getattr(fi, "market_cap", None) or inf.get("marketCap")

        if pe:
            result["pe"] = round(float(pe), 2)
        if pb:
            result["pb"] = round(float(pb), 2)
        if mcap:
            result["market_cap_cr"] = round(float(mcap) / 10000000.0, 1)  # in Crores
    except Exception:
        pass

    _PEER_CACHE[cache_key] = (result, now)
    return result


def get_sector_peers(
    sector: Optional[str],
    current_symbol: str,
    max_peers: int = 4
) -> List[Dict[str, Any]]:
    """Retrieve top sector peers from local database catalog."""
    if not sector or not sector.strip():
        return []

    clean_sec = sector.strip()
    primary_token = clean_sec.split()[0].rstrip(",-&")

    conn = database.get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT symbol, company_name, exchange, sector, industry, isin, market_cap_category
    FROM stocks
    WHERE is_active = 1
      AND UPPER(symbol) != UPPER(?)
      AND (
          UPPER(sector) = UPPER(?)
          OR UPPER(industry) = UPPER(?)
          OR sector LIKE ?
          OR industry LIKE ?
      )
    GROUP BY isin, company_name
    ORDER BY 
        CASE WHEN market_cap_category = 'Large Cap' THEN 1 WHEN market_cap_category = 'Mid Cap' THEN 2 ELSE 3 END,
        symbol ASC
    LIMIT ?
    """, (
        current_symbol.strip(),
        clean_sec,
        clean_sec,
        f"%{primary_token}%",
        f"%{primary_token}%",
        max_peers
    ))

    rows = cursor.fetchall()
    conn.close()

    peers = []
    for r in rows:
        peers.append({
            "symbol": r["symbol"],
            "company_name": r["company_name"],
            "exchange": r["exchange"],
            "sector": r["sector"],
            "industry": r["industry"],
            "market_cap_category": r["market_cap_category"]
        })

    return peers


def get_sector_peers_with_multiples(
    sector: Optional[str],
    current_symbol: str,
    max_peers: int = 3
) -> List[Dict[str, Any]]:
    """Retrieve top sector peers and enrich with real valuation multiples."""
    peers = get_sector_peers(sector, current_symbol, max_peers)
    for p in peers:
        mults = fetch_single_peer_multiples(p["symbol"], p.get("exchange", "NSE"))
        p["pe"] = mults.get("pe")
        p["pb"] = mults.get("pb")
        p["market_cap_cr"] = mults.get("market_cap_cr")
    return peers


def format_peer_comparison_text(peers: List[Dict[str, Any]], current_multiples: Dict[str, Any]) -> str:
    """Format structured peer benchmarking table for inclusion in analyst prompt."""
    if not peers:
        return (
            "SECTOR PEER BENCHMARK STATUS: PEER_BENCHMARK_UNAVAILABLE.\n"
            "No direct listed peers found in database for this company/conglomerate. "
            "Report headline valuation multiples neutrally. PROHIBITION: DO NOT declare stock 'overvalued' "
            "or 'above sector norms' without verified peer numbers."
        )

    target_pe = current_multiples.get("pe_ratio", "N/A")
    target_pb = current_multiples.get("pb_ratio", "N/A")
    target_mcap = current_multiples.get("market_cap")
    target_mcap_cr = f"INR {round(target_mcap / 10000000.0, 1):,} Cr" if target_mcap else "N/A"

    lines = [
        "SECTOR PEER BENCHMARK UNIVERSE (Comparative Valuation Multiples):",
        "| Symbol | Company Name | Exchange | Market Cap (Cr) | P/E | P/B |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |",
        f"| TARGET | Current Stock Under Analysis | - | {target_mcap_cr} | {target_pe} | {target_pb} |"
    ]
    for p in peers:
        mcap_str = f"INR {p['market_cap_cr']:,} Cr" if p.get("market_cap_cr") else (p.get("market_cap_category") or "Mid/Large")
        pe_str = str(p.get("pe")) if p.get("pe") is not None else "N/A"
        pb_str = str(p.get("pb")) if p.get("pb") is not None else "N/A"
        lines.append(f"| {p['symbol']} | {p['company_name']} | {p['exchange']} | {mcap_str} | {pe_str} | {pb_str} |")

    lines.append("\nTARGET VALUATION RELATIVE POSITION:")
    lines.append(f"- Target P/E: {target_pe}")
    lines.append(f"- Target P/B: {target_pb}")
    lines.append(f"- Target EV/EBITDA: {current_multiples.get('ev_ebitda', 'N/A')}")
    lines.append(f"- Target Dividend Yield: {current_multiples.get('dividend_yield_pct', 'N/A')}%")
    return "\n".join(lines)
