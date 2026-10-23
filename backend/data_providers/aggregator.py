"""Unified Free Data Provider Aggregator for BharatEquity.

Combines Yahoo Finance, BSE Public Announcements, and Google News RSS into a single
standardized context dictionary ready for ingestion by the 13 research agents.
"""

import asyncio
from typing import Any, Dict

from data_providers.bse_provider import fetch_bse_corporate_announcements
from data_providers.news_provider import fetch_social_sentiment_stream, fetch_stock_recent_news
from data_providers.peers_provider import format_peer_comparison_text, get_sector_peers_with_multiples
from data_providers.yfinance_provider import fetch_stock_market_and_financials


async def enrich_company_with_free_sources(company_context: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch live free data concurrently and enrich company context."""
    symbol = company_context.get("symbol", "")
    exchange = company_context.get("exchange", "NSE")
    company_name = company_context.get("company_name", symbol)
    scrip_code = str(company_context.get("scrip_code") or "")

    # Execute free fetches concurrently
    yf_task = fetch_stock_market_and_financials(symbol, exchange)
    news_task = fetch_stock_recent_news(company_name, symbol, max_items=6)
    sentiment_task = fetch_social_sentiment_stream(company_name, symbol, max_items=6)
    bse_task = fetch_bse_corporate_announcements(
        scrip_code=scrip_code,
        company_name=company_name,
        symbol=symbol,
        max_items=5
    )

    market_data, news_items, sentiment_data, bse_filings = await asyncio.gather(
        yf_task, news_task, sentiment_task, bse_task, return_exceptions=True
    )

    # Safe defaults if network issues occur
    safe_market = market_data if isinstance(market_data, dict) else {}
    safe_news = news_items if isinstance(news_items, list) else []
    safe_sentiment = sentiment_data if isinstance(sentiment_data, dict) else {}
    safe_bse = bse_filings if isinstance(bse_filings, list) else []

    # Merge into enriched context
    enriched = dict(company_context)
    enriched["market_data"] = safe_market
    enriched["recent_news"] = safe_news
    enriched["social_sentiment"] = safe_sentiment
    enriched["corporate_filings"] = safe_bse

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
