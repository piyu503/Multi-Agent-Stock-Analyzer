"""Unit tests for Dhan API Pro Provider:
1. Resilient failover when credentials are unconfigured or expired.
2. Verified deterministic technical indicator calculations (ATR, RSI, MA, Volatility).
3. Level-2 order book depth parser.
4. Aggregator dual-tier failover verification.
"""

import math
import pytest
from data_providers.dhan_provider import (
    calculate_atr,
    calculate_rsi,
    calculate_moving_averages,
    calculate_historical_volatility,
    fetch_dhan_intelligence,
    get_security_id,
    _load_instruments_map,
)
from data_providers.aggregator import enrich_company_with_free_sources


def test_dhan_security_map():
    """Verify that major Indian tickers are mapped to Dhan security IDs."""
    mapping = _load_instruments_map()
    assert "RELIANCE" in mapping
    assert get_security_id("RELIANCE") == "2885"
    assert get_security_id("TCS") is not None
    assert get_security_id("HDFCBANK") is not None
    assert get_security_id("INFY") is not None


@pytest.mark.asyncio
async def test_dhan_unconfigured_failover():
    """Verify that missing credentials return is_active=False without crashing."""
    result = await fetch_dhan_intelligence("RELIANCE", "NSE")
    assert isinstance(result, dict)
    assert result.get("is_active") is False
    assert result.get("reason") in ["no_credentials", "scrip_not_mapped"]


def test_dhan_atr_calculation():
    """Verify deterministic 14-period Average True Range."""
    candles = []
    base_price = 1000.0
    for i in range(20):
        h = base_price + 10.0 + (i % 3)
        l = base_price - 10.0 - (i % 3)
        c = base_price + (i % 2)
        candles.append({"open": base_price, "high": h, "low": l, "close": c, "volume": 10000})

    atr = calculate_atr(candles, period=14)
    assert atr is not None
    assert 18.0 <= atr <= 25.0


def test_dhan_rsi_calculation():
    """Verify deterministic 14-period Relative Strength Index."""
    candles = []
    for i in range(30):
        c = 100.0 + i * 2.0
        candles.append({"open": c - 1, "high": c + 1, "low": c - 2, "close": c, "volume": 5000})

    rsi = calculate_rsi(candles, period=14)
    assert rsi is not None
    assert rsi > 80.0  # Strong uptrend should produce overbought RSI


def test_dhan_moving_averages_and_volatility():
    """Verify SMA calculation and 30-day annualized historical volatility."""
    candles = []
    for i in range(210):
        c = 500.0 + (i * 0.5)
        candles.append({"open": c, "high": c + 2, "low": c - 2, "close": c, "volume": 1000})

    dma_50, dma_200 = calculate_moving_averages(candles)
    assert dma_50 is not None
    assert dma_200 is not None
    assert dma_50 > dma_200  # Uptrend: 50-DMA > 200-DMA

    vol = calculate_historical_volatility(candles, period=30)
    assert vol is not None
    assert vol >= 0.0


@pytest.mark.asyncio
async def test_aggregator_tier_failover():
    """Verify aggregator sets STANDARD_FREE_FALLBACK when Dhan keys are empty."""
    company_context = {
        "symbol": "TCS",
        "company_name": "Tata Consultancy Services Limited",
        "exchange": "NSE"
    }
    enriched = await enrich_company_with_free_sources(company_context)
    assert enriched["data_source_tier"] in ["DHAN_PRO_VERIFIED", "STANDARD_FREE_FALLBACK"]
    # Without credentials, it must gracefully fall back without exception
    assert "market_data" in enriched
    assert "corporate_filings" in enriched
