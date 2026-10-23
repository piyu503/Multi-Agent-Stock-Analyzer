"""Free News and Corporate Developments Provider via Google News RSS.

Fetches recent news items and press releases for Indian equities without API keys.
"""

import asyncio
import logging
from typing import Any, Dict, List
import urllib.parse
import feedparser

logger = logging.getLogger("bharatequity.data.news")


def _fetch_google_news_rss_sync(query: str, max_items: int = 10) -> List[Dict[str, Any]]:
    """Parse Google News RSS feed for given search query."""
    try:
        encoded_query = urllib.parse.quote(query)
        feed_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(feed_url)

        articles = []
        for entry in feed.entries[:max_items]:
            articles.append({
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "published": entry.get("published", ""),
                "source": entry.get("source", {}).get("title", "News Source"),
                "summary": entry.get("summary", "")
            })
        return articles
    except Exception as err:
        logger.warning(f"Error fetching Google News RSS for query '{query}': {err}")
        return []


async def fetch_stock_recent_news(company_name: str, symbol: str, max_items: int = 8) -> List[Dict[str, Any]]:
    """Fetch recent news articles for a company using async background thread."""
    # Query prioritizing financial and exchange context in India
    query = f"{company_name} share stock NSE"
    loop = asyncio.get_running_loop()
    articles = await loop.run_in_executor(None, _fetch_google_news_rss_sync, query, max_items)
    
    # If company name query returns 0 items, fallback to symbol query
    if not articles:
        query_sym = f"{symbol} stock price NSE"
        articles = await loop.run_in_executor(None, _fetch_google_news_rss_sync, query_sym, max_items)

    return articles


async def fetch_social_sentiment_stream(company_name: str, symbol: str, max_items: int = 8) -> Dict[str, Any]:
    """Fetch retail sentiment indicators from public discussion and news feeds."""
    query = f'"{symbol}" OR "{company_name}" (target OR recommendation OR "retail discussion" OR multibagger OR outlook OR "brokerage view")'
    loop = asyncio.get_running_loop()
    items = await loop.run_in_executor(None, _fetch_google_news_rss_sync, query, max_items)

    # Deterministic keyword tone frequency
    positive_words = {"surge", "gain", "buy", "target", "bullish", "growth", "high", "upgrade", "outperform", "profit"}
    caution_words = {"fall", "drop", "sell", "bearish", "loss", "risk", "debt", "probe", "down", "downgrade", "pressure"}

    pos_count = 0
    neg_count = 0
    for it in items:
        text = (it.get("title", "") + " " + it.get("summary", "")).lower()
        pos_count += sum(1 for w in positive_words if w in text)
        neg_count += sum(1 for w in caution_words if w in text)

    total_signals = pos_count + neg_count
    if total_signals > 0:
        bullish_ratio = round(pos_count / total_signals, 2)
    else:
        bullish_ratio = 0.50

    sentiment_label = "Bullish" if bullish_ratio > 0.60 else ("Cautious / Bearish" if bullish_ratio < 0.40 else "Neutral")

    return {
        "sentiment_label": sentiment_label,
        "bullish_signal_ratio": bullish_ratio,
        "positive_triggers_count": pos_count,
        "caution_triggers_count": neg_count,
        "discussion_items": items
    }
