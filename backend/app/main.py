# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .services.stocks import fetch_stock_data
from .services.news import fetch_financial_news
from .services.sentiment import analyze_sentiment_batch
from .routes import stock_routes, news_routes, watchlist_routes, agent_routes
from .db import init_db
from .utils.cache import close_redis

import os

load_dotenv()

app = FastAPI(title="Financial Research AI API", version="1.0")

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# ⭐ Added LLM API keys (Gemini + Groq)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


# ---------------- STOCK ROUTE ----------------
@app.get("/api/stock-data")
async def get_stock_data(symbol: str, period: str = "3mo"):
    data, error = await fetch_stock_data(symbol, period)   # ✅ FIX: added await
    if error:
        return {"success": False, "error": error}

    return {
        "success": True,
        "data": data["data"],
        "metrics": data.get("metrics", {})
    }


# ---------------- NEWS ROUTE ----------------
@app.get("/api/news")
async def get_news(symbol: str):
    articles, error = await fetch_financial_news(symbol, NEWS_API_KEY)   # ✅ FIX
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

    scores = [a.get("score", 0) for a in analyzed]

    avg = sum(scores) / len(scores)
    positive = len([s for s in scores if s >= 0.05])
    neutral = len([s for s in scores if -0.05 < s < 0.05])
    negative = len([s for s in scores if s <= -0.05])
    overall = "Positive" if avg >= 0.05 else "Negative" if avg <= -0.05 else "Neutral"

    return {
        "success": True,
        "articles": analyzed,
        "sentiment_summary": {
            "avg_score": round(avg, 3),
            "positive_count": positive,
            "neutral_count": neutral,
            "negative_count": negative,
            "overall": overall,
        },
    }


# ---------------- BACKEND ROUTES REGISTRATION ----------------
app.include_router(stock_routes.router, prefix="/api")
app.include_router(news_routes.router, prefix="/api")
app.include_router(watchlist_routes.router, prefix="/api")
app.include_router(agent_routes.router, prefix="/api")  # AI Agent routes


# ---------------- STARTUP & SHUTDOWN ----------------
@app.on_event("startup")
async def startup_event():
    await init_db()
    print("✅ MongoDB connection initialized")


@app.on_event("shutdown")
async def shutdown_event():
    await close_redis()
    print("🧹 Redis connection closed")
