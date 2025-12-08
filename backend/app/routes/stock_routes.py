# backend/app/routes/stock_routes.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..services import indicators
from ..models.stock_model import IndicatorResult
from ..utils.cache import get_cached, set_cached
import httpx
from ..config import settings
from motor.motor_asyncio import AsyncIOMotorClient
import re
import yfinance as yf
import asyncio

router = APIRouter(prefix="/stocks", tags=["stocks"])

# MongoDB connection
mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
db = mongo_client[settings.MONGO_DB_NAME]
stocks_collection = db["Stocks"]


@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1, max_length=100)):
    """
    Search stocks from MongoDB and yfinance in parallel.
    Returns matching stocks sorted by relevance.
    """
    try:
        # Sanitize search query
        search_query_original = q.strip()
        if not search_query_original:
            return {"success": True, "query": q, "count": 0, "results": []}
        
        search_query_upper = search_query_original.upper()
        search_query_lower = search_query_original.lower()
        clean_query_upper = re.sub(r'[^A-Z0-9]', '', search_query_upper)
        
        # Build MongoDB query - simple: first letter or full name only
        query_conditions = []
        
        # Symbol matches - starts with
        if search_query_upper:
            query_conditions.append({"symbol": {"$regex": f"^{re.escape(search_query_upper)}", "$options": "i"}})
        
        # Name matches - starts with (first letter) or exact match
        if search_query_original:
            query_conditions.append({"name": {"$regex": f"^{re.escape(search_query_original)}", "$options": "i"}})
            query_conditions.append({"name": {"$regex": f"^{re.escape(search_query_original)}$", "$options": "i"}})
            query_conditions.append({"displayName": {"$regex": f"^{re.escape(search_query_original)}", "$options": "i"}})
            query_conditions.append({"displayName": {"$regex": f"^{re.escape(search_query_original)}$", "$options": "i"}})
        
        mongo_query = {"$or": query_conditions} if query_conditions else {}
        
        # MongoDB search
        mongo_results = []
        try:
            if query_conditions:
                cursor = stocks_collection.find(mongo_query).limit(20)
                raw_results = await cursor.to_list(length=20)
                
                for stock in raw_results:
                    symbol = stock.get("symbol", "")
                    name = stock.get("name", "")
                    display_name = stock.get("displayName", name or symbol)
                    
                    score = 0
                    name_lower = (name or "").lower()
                    
                    if symbol.upper() == search_query_upper:
                        score += 150
                    elif symbol.upper().startswith(search_query_upper):
                        score += 60
                    elif search_query_upper in symbol.upper():
                        score += 30
                    
                    if name_lower == search_query_lower:
                        score += 90
                    elif name_lower.startswith(search_query_lower):
                        score += 50
                    
                    mongo_results.append({
                        "symbol": symbol,
                        "name": name or symbol,
                        "displayName": display_name or name or symbol,
                        "exchange": stock.get("exchange", ""),
                        "sector": stock.get("sector", ""),
                        "_score": score
                    })
        except Exception as e:
            print(f"❌ MongoDB search error: {e}")
            mongo_results = []
        
        # yfinance search
        yfinance_results = []
        try:
            if len(clean_query_upper) >= 2:
                yfinance_results = await asyncio.wait_for(
                    search_yfinance_fallback(search_query_upper, search_query_original),
                    timeout=3.0
                )
        except asyncio.TimeoutError:
            yfinance_results = []
        except Exception as e:
            print(f"❌ yfinance search error: {e}")
            yfinance_results = []
        
        # Score yfinance results higher
        for r in yfinance_results:
            r["_score"] = 200
        
        # Combine results
        existing_symbols = {r.get("symbol", "") for r in yfinance_results if r.get("symbol")}
        all_results = list(yfinance_results)
        
        for r in mongo_results:
            sym = r.get("symbol", "")
            if sym and sym not in existing_symbols:
                all_results.append(r)
        
        # Sort and limit
        all_results.sort(key=lambda x: x.get("_score", 0), reverse=True)
        for r in all_results:
            r.pop("_score", None)
        
        final_results = all_results[:10]
        
        return {
            "success": True,
            "query": q,
            "count": len(final_results),
            "results": final_results
        }
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


async def search_yfinance_fallback(query_upper: str, query_original: str) -> List[Dict[str, Any]]:
    """
    Search using yfinance/Yahoo Finance API.
    Tries common symbol patterns for Indian stocks.
    """
    results = []
    
    # Clean the query - remove spaces, special chars, keep only alphanumeric
    clean_query = re.sub(r'[^A-Z0-9]', '', query_upper)
    
    if not clean_query or len(clean_query) < 2:
        return results
    
    # Try different symbol variations
    symbols_to_try = []
    
    # If query already has .NS or .BO, use it as-is
    if ".NS" in query_upper or ".BO" in query_upper:
        symbols_to_try.append(query_upper)
    else:
        # Try both NSE and BSE
        symbols_to_try.extend([
            f"{clean_query}.NS",  # NSE
            f"{clean_query}.BO",  # BSE
        ])
    
    async def verify_symbol_fast(symbol: str) -> Optional[Dict[str, Any]]:
        """Fast verification using Yahoo Finance API"""
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                # Try to fetch quote data - faster than full info
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
                params = {"range": "1d", "interval": "1d"}
                resp = await client.get(url, params=params)
                
                if resp.status_code == 200:
                    data = resp.json()
                    # Check if we got valid chart data
                    if data.get("chart") and data["chart"].get("result") and len(data["chart"]["result"]) > 0:
                        result = data["chart"]["result"][0]
                        meta = result.get("meta", {})
                        
                        # Use clean_query from outer scope
                        stock_name = meta.get("longName") or meta.get("shortName") or clean_query
                        
                        return {
                            "symbol": symbol,
                            "name": stock_name,
                            "displayName": stock_name,
                            "exchange": "NSE" if symbol.endswith(".NS") else "BSE" if symbol.endswith(".BO") else "Unknown",
                            "sector": meta.get("sector") or meta.get("industry") or "",
                        }
                return None
        except (httpx.TimeoutException, httpx.RequestError) as e:
            # Timeout or network error - stock might exist but API is slow
            return None
        except Exception as e:
            # Stock doesn't exist or error fetching
            return None
    
    async def verify_symbol_yfinance(symbol: str) -> Optional[Dict[str, Any]]:
        """Fallback verification using yfinance Ticker.info"""
        try:
            def _check_stock():
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    
                    # Check if we got valid info (not empty dict)
                    if info and len(info) > 5:  # Valid ticker info has many fields
                        return {
                            "symbol": symbol,
                            "name": info.get("longName") or info.get("shortName") or clean_query,
                            "displayName": info.get("longName") or info.get("shortName") or clean_query,
                            "exchange": "NSE" if symbol.endswith(".NS") else "BSE" if symbol.endswith(".BO") else "Unknown",
                            "sector": info.get("sector") or info.get("industry") or "",
                        }
                    return None
                except Exception as e:
                    return None
            
            result = await asyncio.to_thread(_check_stock)
            return result
            
        except Exception as e:
            return None
    
    # Try fast verification first (Yahoo Finance API) with timeout
    try:
        tasks = [verify_symbol_fast(symbol) for symbol in symbols_to_try]
        verified_results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=True),
            timeout=2.0
        )
        
        # Filter out None and exceptions
        for result in verified_results:
            if result and isinstance(result, dict):
                # Avoid duplicates
                if not any(r.get("symbol") == result.get("symbol") for r in results):
                    results.append(result)
    except (asyncio.TimeoutError, Exception):
        pass
    
    # Only try slow yfinance if we got no results and query is short
    if len(results) == 0 and len(clean_query) <= 6:
        for symbol in symbols_to_try:
            if not any(r["symbol"] == symbol for r in results):
                try:
                    result = await asyncio.wait_for(
                        verify_symbol_yfinance(symbol),
                        timeout=1.0  # Quick timeout for yfinance
                    )
                    if result:
                        results.append(result)
                        break  # Found one, that's enough
                except asyncio.TimeoutError:
                    break  # Skip remaining if timeout
                except Exception:
                    continue  # Try next symbol
    
    return results


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