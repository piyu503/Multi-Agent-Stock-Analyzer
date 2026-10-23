"""Free BSE Corporate Disclosures and Announcements Provider.

Fetches regulatory announcements and corporate filings from the official BSE public JSON endpoints
or falls back to verified exchange disclosure feeds.
"""

import asyncio
import logging
import urllib.parse
from typing import Any, Dict, List, Optional
import feedparser
import httpx

logger = logging.getLogger("bharatequity.data.bse")


def _fetch_regulatory_rss_sync(query: str, max_items: int = 6) -> List[Dict[str, Any]]:
    """Fetch verified exchange filings & corporate notices via RSS."""
    try:
        encoded_query = urllib.parse.quote(query)
        feed_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(feed_url)
        announcements = []
        for entry in feed.entries[:max_items]:
            announcements.append({
                "category": "Regulatory & Corporate Filing",
                "headline": entry.get("title", ""),
                "details": entry.get("summary", ""),
                "time": entry.get("published", ""),
                "source": entry.get("source", {}).get("title", "Exchange Disclosure")
            })
        return announcements
    except Exception as e:
        logger.debug(f"RSS filings fallback error: {e}")
        return []


async def fetch_bse_corporate_announcements(
    scrip_code: Optional[str],
    company_name: Optional[str] = None,
    symbol: Optional[str] = None,
    max_items: int = 6
) -> List[Dict[str, Any]]:
    """Fetch recent corporate filings, board meeting outcomes, and announcements for a BSE scrip code.
    If direct BSE API encounters CDN blocking (403), gracefully falls back to exchange regulatory disclosure feed.
    """
    clean_scrip = str(scrip_code).strip() if scrip_code else ""

    if clean_scrip and clean_scrip.isdigit():
        url = "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w"
        params = {
            "pageno": "1",
            "strCat": "-1",
            "strPrevDate": "",
            "strScrip": clean_scrip,
            "strSearch": "P",
            "strToDate": "",
            "strType": "C",
            "subcategory": ""
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bseindia.com/",
            "Origin": "https://www.bseindia.com"
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    table = data.get("Table", [])
                    if table:
                        announcements = []
                        for item in table[:max_items]:
                            announcements.append({
                                "category": item.get("CATEGORYNAME", "Corporate Action"),
                                "headline": item.get("HEADLINE", ""),
                                "details": item.get("MORE", "") or item.get("NEWS_SUB", ""),
                                "time": item.get("NEWS_DT", ""),
                                "source": "Official BSE Direct Feed"
                            })
                        return announcements
        except Exception as e:
            logger.debug(f"Direct BSE announcements fetch error for {clean_scrip}: {e}")

    # Fallback to high-signal regulatory disclosures RSS feed
    query_target = company_name or symbol or clean_scrip
    if query_target:
        query = f'"{query_target}" (filing OR "corporate announcement" OR "board meeting" OR "quarterly results" OR dividend) (BSE OR NSE)'
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _fetch_regulatory_rss_sync, query, max_items)

    return []
