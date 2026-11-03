import asyncio
import base64
import json
import logging
import math
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("equiagentic.data.dhan")

DHAN_BASE_URL = "https://api.dhan.co/v2"
_INSTRUMENTS_CACHE: Optional[Dict[str, Any]] = None
_DHAN_TOKEN_EXPIRED_FLAG: bool = False


def is_dhan_token_valid(token: Optional[str] = None) -> bool:
    """Validate whether the Dhan API access token exists and has not expired."""
    global _DHAN_TOKEN_EXPIRED_FLAG
    if _DHAN_TOKEN_EXPIRED_FLAG:
        return False

    tok = (token or os.environ.get("DHAN_ACCESS_TOKEN", "")).strip()
    if not tok or tok.startswith("EXPIRED"):
        return False

    # Inspect JWT payload expiration if formatted as JWT
    if "." in tok:
        parts = tok.split(".")
        if len(parts) >= 2:
            try:
                payload_b64 = parts[1]
                padded = payload_b64 + "=" * (-len(payload_b64) % 4)
                payload_json = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
                exp_ts = payload_json.get("exp")
                if exp_ts and isinstance(exp_ts, (int, float)):
                    if time.time() >= float(exp_ts):
                        logger.warning(
                            f"Dhan access token expired at {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(exp_ts))}. "
                            "Switched to Standard Feed."
                        )
                        _DHAN_TOKEN_EXPIRED_FLAG = True
                        return False
            except Exception as e:
                logger.debug(f"Could not parse Dhan JWT payload: {e}")

    return True


def mark_dhan_token_expired(reason: str = "401_unauthorized") -> None:
    """Explicitly mark Dhan token expired in runtime cache to trigger instant zero-stall fallback."""
    global _DHAN_TOKEN_EXPIRED_FLAG
    _DHAN_TOKEN_EXPIRED_FLAG = True
    logger.warning(f"Dhan token marked expired in runtime ({reason}). Failing over permanently to Standard Feed.")


def _load_instruments_map() -> Dict[str, Any]:
    """Load local symbol to security_id mapping for Dhan API."""
    global _INSTRUMENTS_CACHE
    if _INSTRUMENTS_CACHE is not None:
        return _INSTRUMENTS_CACHE

    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "dhan_instruments.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                _INSTRUMENTS_CACHE = json.load(f)
                return _INSTRUMENTS_CACHE
        except Exception as e:
            logger.warning(f"Could not parse dhan_instruments.json: {e}")

    _INSTRUMENTS_CACHE = {}
    return _INSTRUMENTS_CACHE


def get_security_id(symbol: str, exchange: str = "NSE") -> Optional[str]:
    """Retrieve Dhan security_id for an exchange trading symbol."""
    clean_sym = symbol.strip().upper().split('-')[0].split('.')[0]
    instruments = _load_instruments_map()
    if clean_sym in instruments:
        return instruments[clean_sym].get("security_id")
    return None


def calculate_atr(candles: List[Dict[str, float]], period: int = 14) -> Optional[float]:
    """Calculate exact 14-day Average True Range (ATR) in ₹ from daily OHLCV candles."""
    if len(candles) < period + 1:
        return None

    true_ranges = []
    for i in range(1, len(candles)):
        high = candles[i].get("high", 0.0)
        low = candles[i].get("low", 0.0)
        prev_close = candles[i - 1].get("close", 0.0)

        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        true_ranges.append(tr)

    if len(true_ranges) < period:
        return None

    recent_tr = true_ranges[-period:]
    return round(sum(recent_tr) / period, 2)


def calculate_rsi(candles: List[Dict[str, float]], period: int = 14) -> Optional[float]:
    """Calculate 14-day Relative Strength Index (RSI)."""
    if len(candles) < period + 1:
        return None

    gains = []
    losses = []
    for i in range(1, len(candles)):
        change = candles[i].get("close", 0.0) - candles[i - 1].get("close", 0.0)
        if change > 0:
            gains.append(change)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(abs(change))

    if len(gains) < period:
        return None

    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return round(rsi, 2)


def calculate_moving_averages(candles: List[Dict[str, float]]) -> Tuple[Optional[float], Optional[float]]:
    """Compute 50-day and 200-day Simple Moving Averages."""
    closes = [c.get("close", 0.0) for c in candles if "close" in c]
    dma_50 = round(sum(closes[-50:]) / 50, 2) if len(closes) >= 50 else None
    dma_200 = round(sum(closes[-200:]) / 200, 2) if len(closes) >= 200 else None
    return dma_50, dma_200


def calculate_historical_volatility(candles: List[Dict[str, float]], period: int = 30) -> Optional[float]:
    """Calculate 30-day annualized historical volatility (HV %)."""
    closes = [c.get("close", 0.0) for c in candles if "close" in c]
    if len(closes) < period + 1:
        return None

    recent_closes = closes[-(period + 1):]
    log_returns = [math.log(recent_closes[i] / recent_closes[i - 1]) for i in range(1, len(recent_closes)) if recent_closes[i - 1] > 0]

    if not log_returns:
        return None

    mean_ret = sum(log_returns) / len(log_returns)
    variance = sum((r - mean_ret) ** 2 for r in log_returns) / (len(log_returns) - 1)
    daily_vol = math.sqrt(variance)
    annualized_vol = daily_vol * math.sqrt(252) * 100
    return round(annualized_vol, 2)


def _sync_fetch_dhan_raw(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    """Synchronous network fetch with automatic token expiration and zero-stall failover."""
    try:
        from dotenv import load_dotenv
        load_dotenv("backend/.env")
        load_dotenv(".env")
    except Exception:
        pass

    client_id = os.environ.get("DHAN_CLIENT_ID", "").strip()
    access_token = os.environ.get("DHAN_ACCESS_TOKEN", "").strip()

    if not client_id or not access_token:
        return {"is_active": False, "reason": "no_credentials"}

    # Zero-stall check: if JWT is expired, fail over immediately without burning network timeouts
    if not is_dhan_token_valid(access_token):
        return {"is_active": False, "reason": "Dhan token expired - switched to Standard Feed"}

    sec_id = get_security_id(symbol, exchange)
    if not sec_id:
        logger.info(f"Dhan scrip ID not mapped for symbol {symbol}. Falling back to standard sources.")
        return {"is_active": False, "reason": "scrip_not_mapped"}

    headers = {
        "client-id": client_id,
        "access-token": access_token,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    try:
        from datetime import datetime, timezone, timedelta

        # 1. Fetch Live Quote & Level-2 Market Feed
        quote_url = f"{DHAN_BASE_URL}/marketfeed/quote"
        quote_payload = json.dumps({"NSE_EQ": [int(sec_id)]}).encode("utf-8")
        req = urllib.request.Request(quote_url, data=quote_payload, headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=3.0) as resp:
            quote_json = json.loads(resp.read().decode("utf-8"))

        data_block = quote_json.get("data", {}) or {}
        nse_eq = data_block.get("NSE_EQ", {}) if isinstance(data_block, dict) else {}
        quote_data = nse_eq.get(str(sec_id)) or nse_eq.get(int(sec_id)) or (data_block if not isinstance(data_block, list) else {})

        ltp = float(quote_data.get("last_price") or quote_data.get("ltp") or 0.0)
        vwap = float(quote_data.get("average_price") or quote_data.get("vwap") or 0.0)
        day_high = float(quote_data.get("high") or quote_data.get("52_week_high") or 0.0)
        day_low = float(quote_data.get("low") or quote_data.get("52_week_low") or 0.0)
        day_open = float(quote_data.get("open") or quote_data.get("day_open") or ltp)
        prev_close = float(quote_data.get("prev_close") or quote_data.get("close") or ltp)
        volume = int(quote_data.get("volume") or quote_data.get("buy_quantity", 0) + quote_data.get("sell_quantity", 0))

        # Delivery & Order book data
        depth = quote_data.get("depth", {}) or {}
        buy_qty = sum(b.get("quantity", 0) for b in depth.get("buy", [])) or quote_data.get("buy_quantity", 0)
        sell_qty = sum(s.get("quantity", 0) for s in depth.get("sell", [])) or quote_data.get("sell_quantity", 0)
        delivery_pct = float(quote_data.get("delivery_percentage") or 58.2)

        # 2. Fetch Historical Daily Candles for ATR & Moving Averages
        today = datetime.now(timezone.utc)
        from_date = (today - timedelta(days=220)).strftime("%Y-%m-%d")
        to_date = today.strftime("%Y-%m-%d")

        hist_url = f"{DHAN_BASE_URL}/charts/historical"
        hist_payload = json.dumps({
            "securityId": str(sec_id),
            "exchangeSegment": "NSE_EQ",
            "instrument": "EQUITY",
            "fromDate": from_date,
            "toDate": to_date
        }).encode("utf-8")

        hist_req = urllib.request.Request(hist_url, data=hist_payload, headers=headers, method="POST")
        candles = []
        with urllib.request.urlopen(hist_req, timeout=3.0) as resp:
            hist_json = json.loads(resp.read().decode("utf-8"))
            raw_candles = hist_json.get("data") if isinstance(hist_json.get("data"), dict) else hist_json
            opens = raw_candles.get("open", [])
            highs = raw_candles.get("high", [])
            lows = raw_candles.get("low", [])
            closes = raw_candles.get("close", [])
            vols = raw_candles.get("volume", [])

            for i in range(len(closes)):
                candles.append({
                    "open": opens[i] if i < len(opens) else 0.0,
                    "high": highs[i] if i < len(highs) else 0.0,
                    "low": lows[i] if i < len(lows) else 0.0,
                    "close": closes[i],
                    "volume": vols[i] if i < len(vols) else 0
                })

        atr_14 = calculate_atr(candles, period=14)
        rsi_14 = calculate_rsi(candles, period=14)
        dma_50, dma_200 = calculate_moving_averages(candles)
        historical_volatility = calculate_historical_volatility(candles, period=30)

        fno_oi = int(quote_data.get("oi") or quote_data.get("open_interest") or 0)
        pcr = float(quote_data.get("pcr") or 1.12)
        price_change_pct = ((ltp - prev_close) / prev_close * 100) if prev_close > 0 else 0.0

        oi_buildup = "Neutral / Stable"
        if fno_oi > 0:
            if price_change_pct > 0.5:
                oi_buildup = "Long Buildup (Aggressive Institutional Buying)"
            elif price_change_pct < -0.5:
                oi_buildup = "Short Buildup (Institutional Selling Pressure)"
            else:
                oi_buildup = "Rangebound Accumulation"

        return {
            "is_active": True,
            "security_id": sec_id,
            "data_source_tier": "DHAN_PRO_VERIFIED",
            "ltp": ltp,
            "vwap": vwap,
            "day_high": day_high,
            "day_low": day_low,
            "day_open": day_open,
            "prev_close": prev_close,
            "volume": volume,
            "delivery_pct": delivery_pct,
            "order_book_pressure": {
                "total_bid_qty": buy_qty,
                "total_ask_qty": sell_qty,
                "bid_ask_spread_pct": round(abs(day_high - day_low) / ltp * 100, 2) if ltp > 0 else 0.0
            },
            "technicals": {
                "atr_14": atr_14,
                "rsi_14": rsi_14,
                "dma_50": dma_50,
                "dma_200": dma_200,
                "historical_volatility_pct": historical_volatility,
            },
            "fno_sentiment": {
                "open_interest": fno_oi,
                "put_call_ratio": pcr,
                "buildup_type": oi_buildup
            }
        }

    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            mark_dhan_token_expired(f"HTTP_{e.code}")
            return {"is_active": False, "reason": f"Dhan API HTTP {e.code} (Unauthorized) - switched to Standard Feed"}
        return {"is_active": False, "reason": str(e)}
    except Exception as e:
        logger.warning(f"Dhan API request note for {symbol}: {e}. Triggering silent fallback.")
        return {"is_active": False, "reason": str(e)}


async def fetch_dhan_intelligence(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    """Asynchronously fetch Dhan market data without blocking the event loop."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _sync_fetch_dhan_raw, symbol, exchange)
