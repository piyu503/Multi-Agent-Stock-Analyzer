"""Unified Free Data Provider Aggregator for EquiAgentic.

Combines Yahoo Finance, BSE Public Announcements, and Google News RSS into a single
standardized context dictionary ready for ingestion by the 13 research agents.
"""

import asyncio
from typing import Any, Dict

from data_providers.bse_provider import fetch_bse_corporate_announcements
from data_providers.dhan_provider import fetch_dhan_intelligence
from data_providers.news_provider import fetch_social_sentiment_stream, fetch_stock_recent_news
from data_providers.nse_provider import fetch_nse_market_microstructure
from data_providers.peers_provider import format_peer_comparison_text, get_sector_peers_with_multiples
from data_providers.transcript_provider import fetch_transcript_insights
from data_providers.yfinance_provider import fetch_stock_market_and_financials


async def enrich_company_with_free_sources(company_context: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch live data concurrently, prioritizing Dhan API Pro with automatic fallback to secondary sources."""
    symbol = company_context.get("symbol", "")
    exchange = company_context.get("exchange", "NSE")
    company_name = company_context.get("company_name", symbol)
    scrip_code = str(company_context.get("scrip_code") or "")

    # Execute fetches concurrently: Dhan Pro, Yahoo Finance, Google News, BSE RSS/API, and Earnings Transcripts
    dhan_task = fetch_dhan_intelligence(symbol, exchange)
    yf_task = fetch_stock_market_and_financials(symbol, exchange)
    news_task = fetch_stock_recent_news(company_name, symbol, max_items=6)
    sentiment_task = fetch_social_sentiment_stream(company_name, symbol, max_items=6)
    bse_task = fetch_bse_corporate_announcements(
        scrip_code=scrip_code,
        company_name=company_name,
        symbol=symbol,
        max_items=5
    )
    transcript_task = fetch_transcript_insights(symbol)

    dhan_data, market_data, news_items, sentiment_data, bse_filings, transcript_data = await asyncio.gather(
        dhan_task, yf_task, news_task, sentiment_task, bse_task, transcript_task, return_exceptions=True
    )

    # Safe defaults if network issues occur
    safe_market = market_data if isinstance(market_data, dict) else {}
    safe_news = news_items if isinstance(news_items, list) else []
    safe_sentiment = sentiment_data if isinstance(sentiment_data, dict) else {}
    safe_bse = bse_filings if isinstance(bse_filings, list) else []
    safe_transcripts = transcript_data if isinstance(transcript_data, dict) else {"has_transcripts": False}
    safe_dhan = dhan_data if isinstance(dhan_data, dict) and dhan_data.get("is_active") else None

    # Only invoke slow NSE scraper bridge if Dhan Pro is not active
    safe_nse = {}
    if not safe_dhan:
        try:
            safe_nse = await fetch_nse_market_microstructure(symbol, timeout_sec=4.0)
        except Exception:
            safe_nse = {}

    # Dual-Tier Ingestion: Upgrade market data if Dhan API Pro returned active verified feed
    if safe_dhan:
        if safe_dhan.get("ltp"):
            safe_market["current_price"] = safe_dhan["ltp"]
        if safe_dhan.get("vwap"):
            safe_market["vwap"] = safe_dhan["vwap"]
        if safe_dhan.get("day_high"):
            safe_market["day_high"] = safe_dhan["day_high"]
        if safe_dhan.get("day_low"):
            safe_market["day_low"] = safe_dhan["day_low"]
        if safe_dhan.get("volume"):
            safe_market["volume"] = safe_dhan["volume"]
        if safe_dhan.get("delivery_pct") is not None:
            safe_market["delivery_pct"] = safe_dhan["delivery_pct"]
            safe_market["delivery_position"] = {
                "delivery_pct": safe_dhan["delivery_pct"],
                "source": "Dhan API Pro (Verified Official NSE Delivery)"
            }
        if safe_dhan.get("order_book_pressure"):
            safe_market["order_book_pressure"] = safe_dhan["order_book_pressure"]

        # Technical indicators computed from daily candles
        tech = safe_dhan.get("technicals") or {}
        if tech.get("atr_14") is not None:
            safe_market["atr_14"] = tech["atr_14"]
        if tech.get("rsi_14") is not None:
            safe_market["rsi_14"] = tech["rsi_14"]
        if tech.get("dma_50") is not None:
            safe_market["dma_50"] = tech["dma_50"]
        if tech.get("dma_200") is not None:
            safe_market["dma_200"] = tech["dma_200"]
        if tech.get("historical_volatility_pct") is not None:
            safe_market["historical_volatility_pct"] = tech["historical_volatility_pct"]
    else:
        # Fallback to NSE microstructure scraper if Dhan is absent or inactive
        deliv_pos = safe_nse.get("delivery_position") or {}
        microstructure = safe_nse.get("microstructure") or {}
        if deliv_pos.get("delivery_pct") is not None:
            safe_market["delivery_pct"] = deliv_pos["delivery_pct"]
        if deliv_pos.get("delivery_qty") is not None:
            safe_market["delivery_qty"] = deliv_pos["delivery_qty"]
        if microstructure.get("buy_sell_ratio") is not None:
            safe_market["order_book_buy_sell_ratio"] = microstructure["buy_sell_ratio"]
            safe_market["total_buy_qty"] = microstructure.get("total_buy_qty")
            safe_market["total_sell_qty"] = microstructure.get("total_sell_qty")

    # Combine official filings: NSE announcements + BSE filings
    nse_announcements = safe_nse.get("announcements") or []
    combined_filings = nse_announcements + safe_bse

    # Temporal context injection (Current execution date anchor)
    from datetime import datetime, timezone
    today_dt = datetime.now(timezone.utc)
    anchor_date_str = today_dt.strftime("%Y-%m-%d")

    def _tag_temporal_status(items_list):
        tagged = []
        for it in items_list:
            item_copy = dict(it)
            pub_str = str(item_copy.get("published") or item_copy.get("time") or item_copy.get("date") or "")
            text_str = (str(item_copy.get("headline") or "") + " " + str(item_copy.get("title") or "") + " " + str(item_copy.get("details") or "")).lower()

            # Milestone analysis for IPOs and corporate corporate transactions
            milestone = "GENERAL_NEWS"
            if "ipo" in text_str or "public issue" in text_str:
                if "listing" in text_str or "listed" in text_str:
                    milestone = "TRANSACTION_MILESTONE: Check if secondary listing date has arrived vs currently in bidding/allocation"
                elif "subscription" in text_str or "bid" in text_str or "subscribed" in text_str:
                    milestone = "TRANSACTION_MILESTONE: Subscription/Bidding Phase (DO NOT describe as officially listed until secondary trading begins)"
                else:
                    milestone = "TRANSACTION_MILESTONE: Draft Prospectus / Filing Phase"

            item_copy["temporal_reference"] = f"Report Generation Anchor: {anchor_date_str}. (Events prior to this are COMPLETED/HISTORICAL; verify milestones: {milestone})"
            tagged.append(item_copy)
        return tagged

    # Merge into enriched context
    enriched = dict(company_context)
    enriched["as_of_date"] = anchor_date_str
    enriched["data_source_tier"] = "DHAN_PRO_VERIFIED" if safe_dhan else "STANDARD_FREE_FALLBACK"
    enriched["dhan_technicals"] = safe_dhan.get("technicals", {}) if safe_dhan else {}
    enriched["fno_sentiment"] = safe_dhan.get("fno_sentiment", {}) if safe_dhan else {}
    enriched["market_data"] = safe_market
    enriched["recent_news"] = _tag_temporal_status(safe_news)
    enriched["social_sentiment"] = safe_sentiment
    enriched["corporate_filings"] = _tag_temporal_status(combined_filings)
    enriched["nse_microstructure"] = safe_nse
    enriched["transcripts"] = safe_transcripts

    # Fetch sector peers enriched with real comparative multiples
    sector_str = company_context.get("sector") or company_context.get("industry") or safe_market.get("sector") or safe_market.get("industry")
    peers = await asyncio.to_thread(get_sector_peers_with_multiples, sector_str, symbol, 3)
    enriched["sector_peers"] = peers
    enriched["peers_benchmark_text"] = format_peer_comparison_text(peers, safe_market)

    # Overlay financials if present
    if safe_market.get("financials"):
        enriched["financials"] = safe_market["financials"]
    elif "financials" not in enriched:
        enriched["financials"] = {}

    return enriched

