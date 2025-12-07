# backend/app/services/news.py

from typing import List, Dict, Any, Tuple
import requests
import asyncio
import logging

from app.config import settings

logger = logging.getLogger(__name__)


def fetch_financial_news(symbol: str, api_key: str) -> Tuple[List[Dict[str, Any]] | None, str | None]:
    """
    SYNC function that calls NewsAPI.
    Safe to run inside run_in_executor.
    """

    if not api_key:
        logger.error("❌ NewsAPI key is missing!")
        return None, "API key missing"

    base = symbol.replace(".NS", "").replace(".BO", "")
    
    # ✅ Better search query with quotes for exact match
    query = f'"{base}" OR "{base} stock" OR "{base} company"'
    
    # ✅ Add alternative search for Indian stocks
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        # For Indian stocks, add NSE/BSE context
        query = f'("{base}" OR "{base} stock") AND (India OR NSE OR BSE OR Mumbai)'
    
    logger.info(f"🔍 Searching NewsAPI for: {query}")

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 50,
        "apiKey": api_key,
    }

    try:
        res = requests.get(url, params=params, timeout=15)
        
        logger.info(f"📡 NewsAPI Status: {res.status_code}")

        if res.status_code != 200:
            try:
                error_msg = res.json().get("message", "API error")
                logger.error(f"❌ NewsAPI Error: {error_msg}")
                return None, error_msg
            except Exception:
                return None, "API error"

        data = res.json().get("articles", [])
        logger.info(f"✅ Found {len(data)} articles for {symbol}")
        
        # ✅ Log first few headlines for debugging
        if data:
            for i, article in enumerate(data[:3]):
                logger.info(f"   📰 {i+1}. {article.get('title', 'No title')}")
        else:
            logger.warning(f"⚠️ No articles found for {symbol} with query: {query}")
        
        return data, None

    except Exception as e:
        logger.error(f"❌ Exception fetching news: {str(e)}")
        return None, str(e)


async def get_news_for_ticker(ticker: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Async wrapper for fetching news for a ticker.
    Used by agent nodes + research graph.

    Always returns [] on error (agent-safe).
    """

    api_key = settings.NEWS_API_KEY
    if not api_key:
        logger.error("❌ NEWS_API_KEY not configured")
        return []

    # Strong symbol normalization
    base_ticker = ticker.upper().replace(".NS", "").replace(".BO", "")
    
    logger.info(f"📥 Fetching news for {ticker} (base: {base_ticker})")

    loop = asyncio.get_event_loop()

    # Run sync function in threadpool
    articles, error = await loop.run_in_executor(
        None,
        fetch_financial_news,
        ticker,  # ✅ Pass full ticker with .NS/.BO so the function knows it's Indian
        api_key,
    )

    if error:
        logger.error(f"❌ Error fetching news: {error}")
        return []
    
    if not articles:
        logger.warning(f"⚠️ No articles returned for {ticker}")
        return []

    # Trim list
    if limit:
        articles = articles[:limit]

    logger.info(f"✅ Returning {len(articles)} articles for {ticker}")
    return articles

