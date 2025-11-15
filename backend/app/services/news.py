import requests

async def fetch_financial_news(symbol, api_key):
    if not api_key:
        return None, "API key missing"

    company = symbol.replace(".NS", "").replace(".BO", "")
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": company,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 10,
        "apiKey": api_key
    }

    try:
        # Run requests.get() in a thread so main loop stays async
        res = await asyncio.to_thread(requests.get, url, params=params, timeout=15)

        if res.status_code != 200:
            return None, res.json().get("message", "API error")

        data = res.json().get("articles", [])
        return data, None

    except Exception as e:
        return None, str(e)


async def get_news_for_ticker(ticker: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Async wrapper for fetching news for a ticker
    Used by agent nodes
    """
    api_key = settings.NEWS_API_KEY
    if not api_key:
        return []
    
    # Run the sync function in a thread pool to make it async
    loop = asyncio.get_event_loop()
    articles, error = await loop.run_in_executor(
        None, 
        fetch_financial_news, 
        ticker, 
        api_key
    )
    
    if error:
        return []
    
    # Limit the results
    if articles:
        articles = articles[:limit]
    
    return articles or []
