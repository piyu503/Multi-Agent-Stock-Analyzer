"""Free Market and Financial Data Provider via Yahoo Finance (yfinance).

Supports Indian tickers on NSE (.NS) and BSE (.BO).
Fetches:
- Real-time quote and valuation statistics (P/E, P/B, EV/EBITDA, 52W High/Low, Beta)
- 1-Year historical OHLCV candles, 50-DMA, 200-DMA
- Financial statements (Balance Sheet, P&L, Cash Flow)
"""

import asyncio
import logging
from typing import Any, Dict, Optional
import pandas as pd
import yfinance as yf

logger = logging.getLogger("bharatequity.data.market")


def get_yfinance_symbol(symbol: str, exchange: str = "NSE") -> str:
    """Map Indian exchange ticker to yfinance ticker suffix."""
    clean_sym = symbol.strip().upper()
    exch_clean = exchange.strip().upper() if exchange else "NSE"
    if exch_clean == "BSE":
        return f"{clean_sym}.BO"
    return f"{clean_sym}.NS"


def _fetch_yfinance_data_sync(yf_ticker: str) -> Dict[str, Any]:
    """Synchronous fetcher wrapped in threadpool by caller."""
    try:
        ticker = yf.Ticker(yf_ticker)
        fast_info = getattr(ticker, "fast_info", None)
        info = {}
        try:
            info = ticker.info or {}
        except Exception as e:
            logger.debug(f"Could not load full ticker.info for {yf_ticker}: {e}")

        # Extract current price and basic stats
        cmp_price = None
        if fast_info:
            cmp_price = getattr(fast_info, "last_price", None) or getattr(fast_info, "previous_close", None)
        if not cmp_price and info:
            cmp_price = info.get("currentPrice") or info.get("regularMarketPrice")

        # 1-Year Historical Price OHLCV for Technical/Market Analyst
        hist_1y = ticker.history(period="1y")
        dma_50 = None
        dma_200 = None
        year_high = None
        year_low = None
        vol_avg_30d = None
        atr_14 = None
        swing_high_20d = None
        swing_low_20d = None
        realized_vol_20d = None

        if not hist_1y.empty and len(hist_1y) > 0:
            closes = hist_1y["Close"]
            highs = hist_1y["High"] if "High" in hist_1y.columns else closes
            lows = hist_1y["Low"] if "Low" in hist_1y.columns else closes

            if len(closes) >= 50:
                dma_50 = round(float(closes.tail(50).mean()), 2)
            if len(closes) >= 200:
                dma_200 = round(float(closes.tail(200).mean()), 2)

            # True 52-week High/Low from intraday price extremes
            year_high = round(float(highs.max()), 2)
            year_low = round(float(lows.min()), 2)

            if "Volume" in hist_1y.columns and len(hist_1y) >= 30:
                vol_avg_30d = int(hist_1y["Volume"].tail(30).mean())

            # 20-Day Swing High / Low and 20-Day Realized Volatility
            if len(hist_1y) >= 20:
                swing_high_20d = round(float(highs.tail(20).max()), 2)
                swing_low_20d = round(float(lows.tail(20).min()), 2)
                returns = closes.pct_change().dropna()
                if len(returns) >= 20:
                    realized_vol_20d = round(float(returns.tail(20).std() * (252 ** 0.5) * 100), 2)

            # 14-Day Average True Range (ATR)
            if len(hist_1y) >= 15:
                prev_close = closes.shift(1)
                tr1 = highs - lows
                tr2 = (highs - prev_close).abs()
                tr3 = (lows - prev_close).abs()
                tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
                atr_14 = round(float(tr.tail(14).mean()), 2)

        # Financial Statements Extraction (Most recent fiscal year and multi-year series)
        fin_dict = {}
        try:
            bs = ticker.balance_sheet
            inc = ticker.income_stmt
            cf = ticker.cashflow

            if not inc.empty and len(inc.columns) > 0:
                latest_col = inc.columns[0]
                # Extract key income items
                for k in ["Total Revenue", "Operating Revenue", "Revenue"]:
                    if k in inc.index:
                        fin_dict["revenue"] = float(inc.loc[k, latest_col])
                        break
                for k in ["EBITDA", "Normalized EBITDA"]:
                    if k in inc.index:
                        fin_dict["ebitda"] = float(inc.loc[k, latest_col])
                        break
                for k in ["EBIT", "Operating Income"]:
                    if k in inc.index:
                        fin_dict["ebit"] = float(inc.loc[k, latest_col])
                        break
                for k in ["Net Income", "Net Income Common Stockholders"]:
                    if k in inc.index:
                        fin_dict["pat"] = float(inc.loc[k, latest_col])
                        break
                for k in ["Interest Expense", "Interest Expense Non Operating"]:
                    if k in inc.index:
                        fin_dict["interest_expense"] = float(abs(inc.loc[k, latest_col]))
                        break

                # Extract multi-year EPS / PAT for CAGR calculation
                eps_series = []
                for k in ["Diluted EPS", "Basic EPS"]:
                    if k in inc.index:
                        row_vals = inc.loc[k].dropna()
                        eps_series = [float(v) for v in row_vals if v is not None]
                        break
                
                if len(eps_series) >= 4:
                    # 3-year CAGR: (eps[0] / eps[3])**(1/3) - 1
                    try:
                        latest_eps = eps_series[0]
                        past_eps = eps_series[3]
                        if past_eps > 0 and latest_eps > 0:
                            cagr = ((latest_eps / past_eps) ** (1.0 / 3.0) - 1.0) * 100.0
                            fin_dict["eps_cagr_3yr_pct"] = round(cagr, 2)
                    except Exception:
                        pass
                elif len(eps_series) >= 2:
                    try:
                        latest_eps = eps_series[0]
                        past_eps = eps_series[-1]
                        years = len(eps_series) - 1
                        if past_eps > 0 and latest_eps > 0 and years > 0:
                            cagr = ((latest_eps / past_eps) ** (1.0 / float(years)) - 1.0) * 100.0
                            fin_dict["eps_cagr_3yr_pct"] = round(cagr, 2)
                    except Exception:
                        pass

                # Multi-year revenue, EBITDA, and margin stability tracking
                rev_history = []
                ebitda_history = []
                margin_history = []
                for col in inc.columns[:4]:
                    r_val = None
                    e_val = None
                    for k in ["Total Revenue", "Operating Revenue", "Revenue"]:
                        if k in inc.index and pd.notna(inc.loc[k, col]):
                            r_val = float(inc.loc[k, col])
                            break
                    for k in ["EBITDA", "Normalized EBITDA"]:
                        if k in inc.index and pd.notna(inc.loc[k, col]):
                            e_val = float(inc.loc[k, col])
                            break
                    if r_val is not None:
                        rev_history.append(r_val)
                    if e_val is not None:
                        ebitda_history.append(e_val)
                    if r_val and e_val and r_val > 0:
                        margin_history.append(round((e_val / r_val) * 100.0, 2))

                fin_dict["revenue_history"] = rev_history
                fin_dict["ebitda_history"] = ebitda_history
                fin_dict["ebitda_margin_history"] = margin_history
                if len(margin_history) >= 2:
                    fin_dict["margin_stability_spread"] = round(max(margin_history) - min(margin_history), 2)

            if not bs.empty and len(bs.columns) > 0:
                latest_col = bs.columns[0]
                for k in ["Total Debt", "Long Term Debt And Capital Lease Obligation"]:
                    if k in bs.index:
                        fin_dict["total_debt"] = float(bs.loc[k, latest_col])
                        break
                for k in ["Stockholders Equity", "Total Equity Gross Minority Interest", "Common Stock Equity"]:
                    if k in bs.index:
                        fin_dict["total_equity"] = float(bs.loc[k, latest_col])
                        break

            if not cf.empty and len(cf.columns) > 0:
                latest_col = cf.columns[0]
                for k in ["Operating Cash Flow", "Cash Flowsfromusedin Operating Activities"]:
                    if k in cf.index:
                        fin_dict["cfo"] = float(cf.loc[k, latest_col])
                        break
                for k in ["Capital Expenditure", "Capital Expenditure Reported"]:
                    if k in cf.index:
                        fin_dict["capex"] = float(abs(cf.loc[k, latest_col]))
                        break

            # Calculate free cash flow if available
            if "cfo" in fin_dict and "capex" in fin_dict:
                fin_dict["free_cash_flow"] = round(fin_dict["cfo"] - fin_dict["capex"], 2)

            # Deterministic ROCE % = EBIT / (Total Debt + Total Equity)
            if "ebit" in fin_dict and "total_equity" in fin_dict:
                capital_employed = fin_dict["total_equity"] + fin_dict.get("total_debt", 0.0)
                if capital_employed > 0:
                    fin_dict["roce_pct"] = round((fin_dict["ebit"] / capital_employed) * 100.0, 2)

        except Exception as e:
            logger.debug(f"Could not load financial statements for {yf_ticker}: {e}")

        # Valuation Multiples & Ratios from Info
        pe_ratio = info.get("trailingPE") or info.get("forwardPE")
        pb_ratio = info.get("priceToBook")
        ev_ebitda = info.get("enterpriseToEbitda")
        market_cap = info.get("marketCap")
        beta = info.get("beta")
        dividend_yield = info.get("dividendYield")
        sector = info.get("sector")
        industry = info.get("industry")

        clean_pe = round(float(pe_ratio), 2) if pe_ratio else None
        if clean_pe is not None:
            fin_dict["pe_ratio"] = clean_pe

        return {
            "source": "Yahoo Finance (Free)",
            "yf_ticker": yf_ticker,
            "current_price": round(float(cmp_price), 2) if cmp_price else None,
            "currency": info.get("currency", "INR"),
            "market_cap": market_cap,
            "pe_ratio": round(float(pe_ratio), 2) if pe_ratio else None,
            "pb_ratio": round(float(pb_ratio), 2) if pb_ratio else None,
            "ev_ebitda": round(float(ev_ebitda), 2) if ev_ebitda else None,
            "beta": round(float(beta), 2) if beta else None,
            "dividend_yield_pct": round(float(dividend_yield) * 100, 2) if dividend_yield else None,
            "year_high": year_high,
            "year_low": year_low,
            "dma_50": dma_50,
            "dma_200": dma_200,
            "avg_volume_30d": vol_avg_30d,
            "atr_14": atr_14,
            "swing_high_20d": swing_high_20d,
            "swing_low_20d": swing_low_20d,
            "realized_vol_20d_pct": realized_vol_20d,
            "financials": fin_dict,
            "sector": sector,
            "industry": industry,
            "status": "success",
        }

    except Exception as err:
        logger.warning(f"Failed fetching yfinance data for {yf_ticker}: {err}")
        return {
            "source": "Yahoo Finance (Free)",
            "yf_ticker": yf_ticker,
            "status": "unavailable",
            "error": str(err),
            "financials": {}
        }


async def fetch_stock_market_and_financials(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    """Asynchronous wrapper to fetch yfinance data in background thread without blocking event loop."""
    yf_symbol = get_yfinance_symbol(symbol, exchange)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _fetch_yfinance_data_sync, yf_symbol)
