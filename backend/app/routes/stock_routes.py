# backend/app/routes/stock_routes.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..services import indicators
from ..models.stock_model import IndicatorResult
from ..utils.cache import get_cached, set_cached
import httpx
from ..config import settings
from motor.motor_asyncio import AsyncIOMotorClient
import re

router = APIRouter(prefix="/stocks", tags=["stocks"])

# MongoDB connection
mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
db = mongo_client[settings.MONGO_DB_NAME]
stocks_collection = db["Stocks"]


@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1, max_length=50)):
    """
    Search stocks from MongoDB by symbol, name, or search terms.
    Returns matching stocks sorted by relevance.
    """
    try:
        # Sanitize search query
        search_query = q.strip().upper()
        search_query_lower = q.strip().lower()
        
        # Build MongoDB query with multiple search criteria
        query = {
            "$or": [
                {"symbol": {"$regex": f"^{re.escape(search_query)}", "$options": "i"}},
                {"name": {"$regex": re.escape(q.strip()), "$options": "i"}},
                {"displayName": {"$regex": re.escape(q.strip()), "$options": "i"}},
                {"searchTerms": {"$regex": re.escape(search_query_lower), "$options": "i"}}
            ]
        }
        
        # Execute search with limit
        cursor = stocks_collection.find(query).limit(10)
        results = await cursor.to_list(length=10)
        
        # Format results
        formatted_results = []
        for stock in results:
            formatted_results.append({
                "symbol": stock.get("symbol", ""),
                "name": stock.get("name", ""),
                "displayName": stock.get("displayName", stock.get("name", "")),
                "exchange": stock.get("exchange", ""),
                "sector": stock.get("sector", "")
            })
        
        return {
            "success": True,
            "query": q,
            "count": len(formatted_results),
            "results": formatted_results
        }
        
    except Exception as e:
        print(f"❌ Search Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/price_series/{symbol}")
async def price_series(symbol: str, period_days: int = Query(90, ge=1, le=365*5)):
    """
    Fetch historic price series for a symbol.
    Cached for 5 minutes.
    """
    cache_key = f"price_series:{symbol}:{period_days}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {"range": f"{period_days}d", "interval": "1d"}
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    await set_cached(cache_key, data, expire=300)
    return data


@router.get("/rsi/{symbol}", response_model=IndicatorResult)
async def rsi_endpoint(symbol: str, period: int = Query(14, ge=2, le=200)):
    """
    Computes RSI for a stock using Yahoo Finance chart endpoint.
    Cached for 3 minutes.
    """
    cache_key = f"indicator:rsi:{symbol}:{period}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    # Fetch prices from Yahoo Finance
    async with httpx.AsyncClient(timeout=15.0) as client:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {"range": "180d", "interval": "1d"}
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        j = resp.json()

    try:
        result = j["chart"]["result"][0]
        close_prices = result["indicators"]["quote"][0]["close"]
        close_prices = [c for c in close_prices if c is not None]
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to parse price source")

    # Compute RSI
    rsi_series = indicators.rsi(close_prices, period=period)

    # ✔ FIX: match IndicatorResult model (symbol, indicator, period, values)
    out = {
        "symbol": symbol,
        "indicator": "rsi",
        "period": period,
        "values": rsi_series
    }

    await set_cached(cache_key, out, expire=180)
    return out