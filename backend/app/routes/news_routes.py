# backend/app/routes/news_routes.py
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..config import settings
from ..utils.cache import get_cached, set_cached
from ..models.news_model import NewsResponse, NewsArticle
from ..services.news import get_news_for_ticker
from datetime import datetime

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/{symbol}", response_model=NewsResponse)
async def get_news(symbol: str, limit: int = Query(10, ge=1, le=50)):
    """
    Fetch recent news for a ticker.
    Uses filtered news service that only returns stock-related articles.
    """
    cache_key = f"news:{symbol}:{limit}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    # Use the improved news service with filtering
    raw_articles = await get_news_for_ticker(symbol, limit=limit)
    
    # Convert to NewsArticle format
    articles = []
    for a in raw_articles:
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

    out = {"query": symbol, "articles": articles}
    await set_cached(cache_key, out, expire=120)
    return out
