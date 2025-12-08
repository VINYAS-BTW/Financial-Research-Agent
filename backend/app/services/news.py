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
    
    Balanced filtering: Since NewsAPI already filters by query, we use
    a more lenient approach that still ensures relevance.
    """
    if not articles:
        return []
    
    base_upper = base_ticker.upper()
    relevant_keywords = [
        "stock", "share", "equity", "trading", "price", "earnings", 
        "revenue", "profit", "investor", "market", "NSE", "BSE",
        "dividend", "IPO", "quarterly", "results", "financial", "shares",
        "market cap", "valuation", "analyst", "forecast", "outlook",
        "quarter", "Q1", "Q2", "Q3", "Q4", "FY", "fiscal", "company",
        "corporate", "business", "sector", "industry"
    ]
    
    # Expanded exclusion keywords for non-stock news
    exclude_keywords = [
        "weather", "sports", "entertainment", "recipe", "travel", "movie",
        "music", "celebrity", "gossip", "fashion", "food", "restaurant",
        "hotel", "tourism", "game", "match", "tournament", "league"
    ]
    
    filtered = []
    
    for article in articles:
        title = (article.get("title") or "").upper()
        description = (article.get("description") or "").upper()
        content = f"{title} {description}"
        
        # Check if ticker appears in title or description
        ticker_in_title = base_upper in title
        ticker_in_desc = base_upper in description
        ticker_present = ticker_in_title or ticker_in_desc
        
        # Since NewsAPI already filtered by query with ticker + financial terms,
        # we trust the results more but still do basic filtering
        has_financial_keyword = any(keyword.upper() in content for keyword in relevant_keywords)
        
        # Exclude articles that are clearly not about the stock (non-financial content)
        if any(exclude in content.lower() for exclude in exclude_keywords):
            continue
        
        # Stricter filtering: Require ticker OR strong financial context
        # If ticker is present, definitely include
        if ticker_present:
            filtered.append(article)
        # If no ticker, require at least 2 financial keywords to ensure relevance
        elif has_financial_keyword:
            # Count financial keywords to ensure strong relevance
            financial_count = sum(1 for keyword in relevant_keywords if keyword.upper() in content)
            if financial_count >= 2:
                filtered.append(article)
        # Otherwise skip - not relevant enough
    
    # Sort by relevance: articles with ticker in title come first
    filtered.sort(key=lambda a: (
        base_upper not in (a.get("title") or "").upper(),  # False (0) if in title = higher priority
        -len(a.get("title") or "")  # Shorter titles = more focused = higher priority
    ))
    
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
    
    # ✅ Balanced query: Ticker with financial context
    # This ensures we get relevant stock news, not random articles
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        # For Indian stocks: ticker + financial terms
        query = f'"{base}" AND (stock OR shares OR equity OR earnings OR revenue OR profit OR trading OR investor OR NSE OR BSE OR company OR corporate OR "stock price" OR "share price")'
    else:
        # For other stocks: ticker + financial terms
        query = f'"{base}" AND (stock OR shares OR equity OR earnings OR revenue OR profit OR trading OR investor OR company OR corporate OR "stock price" OR "share price")'
    
    logger.info(f"🔍 Searching NewsAPI for: {query} (with financial domain filter)")

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 100,  # Get more to filter later
        "apiKey": api_key,
        "domains": "economictimes.indiatimes.com,livemint.com,moneycontrol.com,business-standard.com,financialexpress.com,bloombergquint.com,reuters.com,bloomberg.com,cnbc.com,financialexpress.com",  # Focus on financial news sources
    }
    
    # If no results with domains filter, try without domain restriction (fallback)
    # But we'll start with domains for better quality

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

