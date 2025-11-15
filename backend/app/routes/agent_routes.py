"""
Agent Routes - FastAPI endpoints for LangGraph workflows
Place this in: backend/app/routes/agent_routes.py
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

# Correct imports (MATCH your actual graph functions)
from app.agents.graphs.research_graph import run_research_analysis
from app.agents.graphs.sentiment_graph import run_sentiment_analysis, analyze_ticker_sentiment
from app.agents.graphs.portfolio_graph import run_portfolio_analysis


router = APIRouter(prefix="/agents", tags=["AI Agents"])


# Request/Response Models
class ResearchRequest(BaseModel):
    ticker: str
    query: Optional[str] = None


class SentimentRequest(BaseModel):
    texts: List[str]
    sources: Optional[List[str]] = None


class PortfolioRequest(BaseModel):
    tickers: List[str]
    watchlist_id: Optional[int] = None


class TickerSentimentRequest(BaseModel):
    ticker: str
    articles: List[dict]


# ----------------------- Research Agent -----------------------
@router.post("/research")
async def research_agent(request: ResearchRequest):
    try:
        result = await run_research_analysis(
            ticker=request.ticker,
            query=request.query
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------- Sentiment Agent -----------------------
@router.post("/sentiment")
async def sentiment_agent(request: SentimentRequest):
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")

        result = await run_sentiment_analysis(
            texts=request.texts,
            sources=request.sources
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sentiment/ticker")
async def ticker_sentiment_agent(request: TickerSentimentRequest):
    try:
        if not request.articles:
            raise HTTPException(status_code=400, detail="No articles provided")

        texts = [
            (a.get("title", "") or "") + " " + (a.get("description", "") or "")
            for a in request.articles
        ]

        result = await run_sentiment_analysis(texts=texts)

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------- Portfolio Agent -----------------------
@router.post("/portfolio")
async def portfolio_agent(request: PortfolioRequest):
    try:
        if not request.tickers:
            raise HTTPException(status_code=400, detail="No tickers provided")

        if len(request.tickers) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 tickers allowed")

        result = await run_portfolio_analysis(
            tickers=request.tickers,
            watchlist_id=request.watchlist_id
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# GET Research
@router.get("/research/{ticker}")
async def get_research(
    ticker: str,
    query: Optional[str] = Query(None)
):
    try:
        result = await run_research_analysis(
            ticker=ticker,
            query=query
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# GET Portfolio
@router.get("/portfolio/analyze")
async def get_portfolio_analysis(
    tickers: str = Query(...),
    watchlist_id: Optional[int] = Query(None)
):
    try:
        ticker_list = [t.strip().upper() for t in tickers.split(",")]

        if len(ticker_list) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 tickers allowed")

        result = await run_portfolio_analysis(
            tickers=ticker_list,
            watchlist_id=watchlist_id
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def agent_health_check():
    return {
        "status": "healthy",
        "agents": {
            "research": "available",
            "sentiment": "available",
            "portfolio": "available"
        }
    }
