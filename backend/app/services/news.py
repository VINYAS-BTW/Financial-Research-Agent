import requests

def fetch_financial_news(symbol, api_key):
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
        res = requests.get(url, params=params, timeout=15)
        if res.status_code != 200:
            return None, res.json().get("message", "API error")
        data = res.json().get("articles", [])
        return data, None
    except Exception as e:
        return None, str(e)
