# backend/app/routes/stock_routes.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..services import indicators
from ..models.stock_model import IndicatorResult
from ..utils.cache import get_cached, set_cached
import httpx
from ..config import settings

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/price_series/{symbol}")
async def price_series(symbol: str, period_days: int = Query(90, ge=1, le=365*5)):
    """
    Fetch historic price series for a symbol.
    For demo we use Yahoo Finance via a simple external/basic API call (or you can implement yfinance in services/stocks).
    This endpoint caches results for 5 minutes.
    """
    cache_key = f"price_series:{symbol}:{period_days}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    # Replace with your own data source in production.
    # Here we call a lightweight free endpoint as an example (user can replace).
    # If you already have services/stocks, prefer calling that.
    async with httpx.AsyncClient(timeout=15.0) as client:
        # This is a placeholder. In prod, call your own data provider.
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {"range": f"{period_days}d", "interval": "1d"}
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    await set_cached(cache_key, data, expire=300)
    return data


@router.get("/rsi/{symbol}", response_model=IndicatorResult)
async def rsi_endpoint(symbol: str, period: int = Query(14, ge=2, le=200)):
    cache_key = f"indicator:rsi:{symbol}:{period}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    # fetch series
    # For demo, rely on price_series endpoint logic programmatically:
    # (in practice call your internal service/stocks)
    # Here we'll pretend to pull close prices from Yahoo's chart endpoint:
    async with httpx.AsyncClient(timeout=15.0) as client:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {"range": "180d", "interval": "1d"}
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        j = resp.json()

    try:
        timestamp = j["chart"]["result"][0]["timestamp"]
        close_prices = j["chart"]["result"][0]["indicators"]["quote"][0]["close"]
        # filter None values
        close_prices = [c for c in close_prices if c is not None]
    except Exception as e:
        raise HTTPException(status_code=502, detail="Failed to parse price source") from e

    rsi_series = indicators.rsi(close_prices, period=period)
    out = {"symbol": symbol, "indicator": "rsi", "period": period, "values": rsi_series}
    await set_cached(cache_key, out, expire=180)
    return out
