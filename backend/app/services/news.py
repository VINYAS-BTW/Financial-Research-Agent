# backend/app/services/news.py

from typing import List, Dict, Any, Tuple
import requests
import asyncio
import logging
import re

from app.config import settings

logger = logging.getLogger(__name__)


def filter_relevant_articles(articles: List[Dict[str, Any]], base_ticker: str, full_symbol: str) -> List[Dict[str, Any]]:
    """
    Filter articles to keep only those actually related to the stock.
    
    Checks if the ticker/company name appears in title or description,
    and ensures financial/stock-related keywords are present.
    """
    if not articles:
        return []
    
    base_upper = base_ticker.upper()
    relevant_keywords = [
        "stock", "share", "equity", "trading", "price", "earnings", 
        "revenue", "profit", "investor", "market", "NSE", "BSE",
        "dividend", "IPO", "quarterly", "results", "financial"
    ]
    
    filtered = []
    
    for article in articles:
        title = (article.get("title") or "").upper()
        description = (article.get("description") or "").upper()
        content = f"{title} {description}"
        
        # Must contain the ticker symbol
        if base_upper not in content:
            continue
        
        # Must contain at least one financial/stock-related keyword
        has_financial_keyword = any(keyword.upper() in content for keyword in relevant_keywords)
        if not has_financial_keyword:
            continue
        
        # Exclude articles that are clearly not about the stock
        # (e.g., if ticker appears but in unrelated context)
        exclude_keywords = ["weather", "sports", "entertainment", "recipe", "travel"]
        if any(exclude in content.lower() for exclude in exclude_keywords):
            continue
        
        filtered.append(article)
    
    return filtered


def fetch_financial_news(symbol: str, api_key: str) -> Tuple[List[Dict[str, Any]] | None, str | None]:
    """
    SYNC function that calls NewsAPI.
    Safe to run inside run_in_executor.
    Fetches only stock-related news by using specific financial keywords.
    """

    if not api_key:
        logger.error("❌ NewsAPI key is missing!")
        return None, "API key missing"

    base = symbol.replace(".NS", "").replace(".BO", "").strip()
    
    # ✅ More specific query focused on stock/financial news
    # Use exact phrase matching and financial keywords
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        # For Indian stocks: focus on stock ticker + financial terms + Indian market context
        query = f'"{base}" AND (stock OR shares OR equity OR NSE OR BSE OR "stock price" OR "share price" OR earnings OR revenue OR profit OR "market cap" OR "trading" OR "investor") AND (India OR Indian OR Mumbai)'
    else:
        # For other stocks: focus on stock ticker + financial terms
        query = f'"{base}" AND (stock OR shares OR equity OR "stock price" OR "share price" OR earnings OR revenue OR profit OR "market cap" OR "trading" OR "investor")'
    
    logger.info(f"🔍 Searching NewsAPI for: {query}")

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 100,  # Get more to filter later
        "apiKey": api_key,
        "domains": "economictimes.indiatimes.com,livemint.com,moneycontrol.com,business-standard.com,financialexpress.com,bloombergquint.com,reuters.com,bloomberg.com,cnbc.com",  # Focus on financial news sources
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
        logger.info(f"✅ Found {len(data)} raw articles for {symbol}")
        
        # ✅ Filter articles to ensure they're actually about the stock
        filtered_articles = filter_relevant_articles(data, base, symbol)
        logger.info(f"✅ Filtered to {len(filtered_articles)} relevant articles for {symbol}")
        
        # ✅ Log first few headlines for debugging
        if filtered_articles:
            for i, article in enumerate(filtered_articles[:3]):
                logger.info(f"   📰 {i+1}. {article.get('title', 'No title')}")
        else:
            logger.warning(f"⚠️ No relevant articles found for {symbol} with query: {query}")
        
        return filtered_articles, None

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

