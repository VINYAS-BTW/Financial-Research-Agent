# backend/app/services/news.py

from typing import List, Dict, Any, Tuple
import requests
import asyncio

from app.config import settings


def fetch_financial_news(symbol: str, api_key: str) -> Tuple[List[Dict[str, Any]] | None, str | None]:
    """
    SYNC function that calls NewsAPI.
    Safe to run inside run_in_executor.
    """

    if not api_key:
        return None, "API key missing"

    # --- Build a much stronger search query ---
    base = symbol.replace(".NS", "").replace(".BO", "")
    query = f"{base} OR {base} stock OR {base} company OR {base} shares"

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 20,
        "apiKey": api_key,
    }

    try:
        res = requests.get(url, params=params, timeout=15)

        if res.status_code != 200:
            try:
                return None, res.json().get("message", "API error")
            except Exception:
                return None, "API error"

        # Extract articles
        data = res.json().get("articles", [])

        return data, None

    except Exception as e:
        return None, str(e)


async def get_news_for_ticker(ticker: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Async wrapper for fetching news for a ticker.
    Used by agent nodes + research graph.

    Always returns [] on error (agent-safe).
    """

    api_key = settings.NEWS_API_KEY
    if not api_key:
        return []

    # Strong symbol normalization
    base_ticker = ticker.upper().replace(".NS", "").replace(".BO", "")

    loop = asyncio.get_event_loop()

    # Run sync function in threadpool
    articles, error = await loop.run_in_executor(
        None,
        fetch_financial_news,
        base_ticker,
        api_key,
    )

    if error or not articles:
        return []

    # Trim list
    if limit:
        articles = articles[:limit]

    return articles
