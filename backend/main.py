from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.stocks import fetch_stock_data
from services.news import fetch_financial_news
from services.sentiment import analyze_sentiment_batch
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Financial Research AI API", version="1.0")

# ✅ Allow React frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to ["http://localhost:5173"] for stricter use
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# ---------------- STOCK ROUTE ----------------
@app.get("/api/stock-data")
async def get_stock_data(symbol: str, period: str = "3mo"):
    """
    Returns flat list of stock records and metrics (for React frontend)
    """
    data, error = fetch_stock_data(symbol, period)
    if error:
        return {"success": False, "error": error}

    # Flatten structure so React gets "data" directly as a list
    response = {
        "success": True,
        "data": data["data"],   # list of daily stock info
        "metrics": data["metrics"],  # summary values (optional use)
    }
    return response


# ---------------- NEWS ROUTE ----------------
@app.get("/api/news")
async def get_news(symbol: str):
    """
    Fetch financial news + sentiment for a given stock
    """
    articles, error = fetch_financial_news(symbol, NEWS_API_KEY)
    if error:
        return {"success": False, "error": error}

    analyzed = analyze_sentiment_batch(articles or [])

    if not analyzed:
        return {
            "success": True,
            "articles": [],
            "sentiment_summary": {
                "avg_score": 0,
                "positive_count": 0,
                "neutral_count": 0,
                "negative_count": 0,
                "overall": "Neutral",
            },
        }

    # Calculate overall sentiment summary
    scores = [a.get("score", 0) for a in analyzed]
    avg = sum(scores) / len(scores)
    positive = len([s for s in scores if s >= 0.05])
    neutral = len([s for s in scores if -0.05 < s < 0.05])
    negative = len([s for s in scores if s <= -0.05])
    overall = "Positive" if avg >= 0.05 else "Negative" if avg <= -0.05 else "Neutral"

    sentiment_summary = {
        "avg_score": round(avg, 3),
        "positive_count": positive,
        "neutral_count": neutral,
        "negative_count": negative,
        "overall": overall,
    }

    return {"success": True, "articles": analyzed, "sentiment_summary": sentiment_summary}
