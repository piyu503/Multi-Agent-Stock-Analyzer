"""NSE India Microstructure & Corporate Disclosures Provider.

Leverages the 'stock-nse-india' engine via a Node bridge to extract:
1. Delivery Position & Delivery Percentage (securityWiseDP)
2. Market Microstructure & Order Book Depth (marketDeptOrderBook)
3. Official NSE Regulatory Announcements & Board Meetings
"""

import asyncio
import json
import logging
import os
import shutil
from typing import Any, Dict, Optional

logger = logging.getLogger("equiagentic.data.nse")

# Locate node executable
NODE_EXE = shutil.which("node") or "node"
SCRIPT_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "nse_service", "nse_bridge.cjs")
)


async def fetch_nse_market_microstructure(symbol: str, timeout_sec: float = 6.0) -> Dict[str, Any]:
    """Fetch real-time delivery position, order depth, and corporate actions for an NSE equity.
    
    Returns structured dict with:
    - delivery_position: delivery_pct, delivery_qty, traded_qty, date
    - microstructure: total_buy_qty, total_sell_qty, buy_sell_ratio
    - announcements: list of recent official exchange filings
    - board_meetings: upcoming financial result and board meetings
    - corporate_actions: recent dividends, splits, or bonuses
    """
    clean_sym = symbol.strip().upper().replace(".NS", "").replace(".BO", "")
    
    if not os.path.exists(SCRIPT_PATH):
        logger.warning(f"NSE bridge script not found at {SCRIPT_PATH}")
        return {"status": "unavailable", "symbol": clean_sym}

    try:
        proc = await asyncio.create_subprocess_exec(
            NODE_EXE,
            SCRIPT_PATH,
            clean_sym,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout_sec)
        
        if proc.returncode != 0:
            err_str = stderr.decode(errors="replace").strip()
            logger.warning(f"NSE bridge process exited with code {proc.returncode}: {err_str}")
            return {"status": "error", "symbol": clean_sym, "error": err_str}
            
        out_str = stdout.decode(errors="replace").strip()
        if not out_str:
            return {"status": "empty", "symbol": clean_sym}
            
        data = json.loads(out_str)
        return data

    except asyncio.TimeoutError:
        logger.warning(f"NSE bridge timed out after {timeout_sec}s for {clean_sym}")
        return {"status": "timeout", "symbol": clean_sym}
    except Exception as e:
        logger.warning(f"Error fetching NSE data for {clean_sym}: {e}")
        return {"status": "error", "symbol": clean_sym, "error": str(e)}
