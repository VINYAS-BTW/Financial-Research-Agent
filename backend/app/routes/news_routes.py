# backend/app/routes/news_routes.py
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..config import settings
from ..utils.cache import get_cached, set_cached
from ..models.news_model import NewsResponse, NewsArticle
import httpx
from datetime import datetime

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/{symbol}", response_model=NewsResponse)
async def get_news(symbol: str, limit: int = Query(10, ge=1, le=50)):
    """
    Fetch recent news for a ticker or keyword.
    Uses an external news API if NEWS_API_KEY provided.
    """
    cache_key = f"news:{symbol}:{limit}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    # If API key missing → return empty but in correct response format
    if not settings.NEWS_API_KEY:
        out = {"query": symbol, "articles": []}
        await set_cached(cache_key, out, expire=60)
        return out

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": symbol,
        "pageSize": limit,
        "apiKey": settings.NEWS_API_KEY,
        "sortBy": "publishedAt",
        "language": "en"
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="News provider error")
        j = resp.json()

    articles = []
    for a in j.get("articles", []):
        published_at = a.get("publishedAt", "")
        try:
            published_dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        except Exception:
            published_dt = datetime.utcnow()

        na = NewsArticle(
            title=a.get("title"),
            description=a.get("description"),
            url=a.get("url"),
            source=(a.get("source") or {}).get("name"),
            published_at=published_dt,
        )
        articles.append(na.dict())

    # ✔ FIX: Return format must match NewsResponse
    out = {"query": symbol, "articles": articles}

    await set_cached(cache_key, out, expire=120)
    return out
