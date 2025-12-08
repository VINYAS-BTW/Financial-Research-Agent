# backend/app/services/stocks.py

import yfinance as yf
import pandas as pd
import re
import asyncio
from typing import Dict, Any, List, Tuple, Optional
from app.config import settings

"""
Note on Indian Stock Support:
- yfinance supports many Indian stocks but NOT all
- Only stocks available in Yahoo Finance database can be fetched
- Some stocks may be:
  * Delisted or suspended
  * Very small cap (not in Yahoo Finance)
  * Using different ticker formats
  * Not actively traded

To verify if a stock exists:
1. Check on Yahoo Finance: https://finance.yahoo.com/quote/SYMBOL.NS
2. Check NSE website: https://www.nseindia.com/
3. Check BSE website: https://www.bseindia.com/
"""



async def fetch_stock_data(symbol: str, time_period: str):
    try:
        # --- INPUT SANITIZATION ---
        symbol = symbol.strip().upper()
        # Remove all non-alphanumeric except dots
        symbol = re.sub(r'[^A-Z0-9.]', '', symbol)
        # Replace multiple consecutive dots with single dot
        symbol = re.sub(r'\.+', '.', symbol)
        # Remove leading/trailing dots
        symbol = symbol.strip('.')
        # Remove dots in the middle that don't make sense (like ETEA.N.NS -> ETEA.NS)
        if '.' in symbol:
            parts = symbol.split('.')
            # Keep only the base symbol and the exchange suffix
            if len(parts) > 2:
                # If we have something like ETEA.N.NS, take first and last part
                symbol = f"{parts[0]}.{parts[-1]}"

        if not symbol:
            return None, "Invalid symbol provided"

        # Ensure proper exchange suffix
        if not (symbol.endswith(".NS") or symbol.endswith(".BO")):
            symbol = f"{symbol}.NS"

        # Note: yfinance only supports stocks available in Yahoo Finance database
        # Not all Indian stocks are available, especially:
        # - Delisted/suspended stocks
        # - Very small cap stocks
        # - Stocks with different ticker formats

        def _download_stock():
            try:
                result = yf.download(
                    symbol,
                    period=time_period,
                    progress=False,
                    threads=False,
                    timeout=8,  # Reduced from 10 to 8 for faster response
                    auto_adjust=False  # Explicitly set to avoid deprecation warning
                )
                # Check if result is empty or has no data
                if result is None or (isinstance(result, pd.DataFrame) and result.empty):
                    return pd.DataFrame()
                return result
            except ValueError as e:
                # Handle "No objects to concatenate" error
                if "No objects to concatenate" in str(e):
                    return pd.DataFrame()
                raise
            except Exception:
                return pd.DataFrame()
        
        data = await asyncio.to_thread(_download_stock)

        # Fallback to BSE if NSE fails
        if (data.empty or data is None) and symbol.endswith(".NS"):
            alt_symbol = symbol.replace(".NS", ".BO")

            def _download_alt():
                try:
                    result = yf.download(
                        alt_symbol,
                        period=time_period,
                        progress=False,
                        threads=False,
                        timeout=8,  # Reduced from 10 to 8 for faster response
                        auto_adjust=False
                    )
                    if result is None or (isinstance(result, pd.DataFrame) and result.empty):
                        return pd.DataFrame()
                    return result
                except ValueError as e:
                    if "No objects to concatenate" in str(e):
                        return pd.DataFrame()
                    raise
                except Exception:
                    return pd.DataFrame()
            
            data = await asyncio.to_thread(_download_alt)

        # Final check for empty data
        if data is None or (isinstance(data, pd.DataFrame) and data.empty):
            clean_symbol = symbol.replace('.NS', '').replace('.BO', '')
            exchange = "NSE" if symbol.endswith(".NS") else "BSE"
            return None, (
                f"Stock '{clean_symbol}' not found on {exchange}. "
                f"This stock may be:\n"
                f"- Delisted or suspended\n"
                f"- Not available in Yahoo Finance database\n"
                f"- Using a different ticker symbol\n"
                f"Tip: Try searching for the stock on Yahoo Finance or NSE/BSE websites to find the correct ticker."
            )

        # Flatten MultiIndex
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        # Fix missing close
        if "Close" not in data.columns:
            if "Adj Close" in data.columns:
                data["Close"] = data["Adj Close"]
            else:
                return None, "No valid 'Close' column found"

        data = data.dropna(subset=["Close"])
        if data.empty:
            return None, f"No valid close data for {symbol}"

        # --- MA20 + RSI ---
        data["MA20"] = data["Close"].rolling(window=20).mean()

        delta = data["Close"].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(14).mean()
        avg_loss = loss.rolling(14).mean().replace(0, 1e-10)
        rs = avg_gain / avg_loss
        data["RSI"] = 100 - (100 / (1 + rs))

        # Format output
        data = data.reset_index()
        data = data[["Date", "Close", "MA20", "RSI"]].dropna()

        if data.empty:
            return None, f"No valid data points for {symbol}"

        # Metrics
        latest = data.iloc[-1]
        prev = data.iloc[-2] if len(data) > 1 else latest

        price_change = latest["Close"] - prev["Close"]
        pct_change = (price_change / prev["Close"] * 100) if prev["Close"] != 0 else 0

        period_return = (
            (latest["Close"] - data.iloc[0]["Close"]) /
            data.iloc[0]["Close"]
        ) * 100

        metrics = {
            "latest_price": round(latest["Close"], 2),
            "price_change": round(price_change, 2),
            "price_change_pct": round(pct_change, 2),
            "latest_rsi": round(latest["RSI"], 2),
            "data_points": len(data),
            "period_return": round(period_return, 2)
        }

        return {
            "data": data.to_dict(orient="records"),
            "metrics": metrics
        }, None

    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, f"Exception in fetch_stock_data: {str(e)}"


async def get_stock_data(ticker: str) -> Dict[str, Any]:
    """
    Async wrapper for fetching current stock data.
    """
    # DIRECT async call — no executor needed
    result, error = await fetch_stock_data(ticker, "1d")

    if error:
        return {"error": error}

    if not result:
        return {"error": "No data returned"}

    data = result.get("data", [])
    metrics = result.get("metrics", {})

    if data:
        latest = data[-1]
        return {
            "price": latest.get("Close", metrics.get("latest_price", 0)),
            "symbol": ticker,
            "metrics": metrics
        }

    return {
        "price": metrics.get("latest_price", 0),
        "symbol": ticker,
        "metrics": metrics
    }


async def get_historical_data(ticker: str, period: str = "3mo") -> List[Dict[str, Any]]:
    """
    Async wrapper for fetching historical data.
    """
    period_map = {
        "1mo": "1mo",
        "3mo": "3mo",
        "6mo": "6mo",
        "1y": "1y",
        "2y": "2y",
        "5y": "5y"
    }

    time_period = period_map.get(period, "3mo")

    result, error = await fetch_stock_data(ticker, time_period)

    if error:
        return []

    if not result:
        return []

    return result.get("data", []) or []
