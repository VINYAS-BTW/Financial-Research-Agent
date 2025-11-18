"""
Sentiment Node
"""

import logging
import asyncio
from typing import List, Dict, Any

from app.services.sentiment import analyze_sentiment, aggregate_sentiments
from app.utils.error_utils import clear_error
from app.agents.state.agent_state import ResearchState, SentimentState, PortfolioState

logger = logging.getLogger(__name__)


async def _analyze_many(texts, sources):
    sem = asyncio.Semaphore(5)

    async def worker(text, src):
        async with sem:
            try:
                s = await analyze_sentiment(text)
                return {
                    "source": src,
                    "sentiment": s,
                    "text_preview": text[:150]
                }
            except Exception as e:
                return {
                    "source": src,
                    "sentiment": {"label": "neutral", "score": 0.5, "confidence": 0},
                    "error": str(e)
                }

    return await asyncio.gather(*[worker(t, s) for t, s in zip(texts, sources)])


async def analyze_pure_sentiment(state: SentimentState) -> SentimentState:
    """
    Pure sentiment analysis node for SentimentState
    Used by the standalone sentiment graph
    """
    clear_error(state)
    
    texts = state.get("texts", [])
    sources = state.get("sources") or []
    
    if not texts:
        state["error"] = "No texts provided for sentiment analysis"
        return state
    
    try:
        # Use provided sources or default to "Unknown"
        if not sources or len(sources) != len(texts):
            sources = ["Unknown"] * len(texts)
        
        # Analyze all texts
        results = await _analyze_many(texts, sources)
        
        # Aggregate sentiments
        sentiments = [r["sentiment"] for r in results]
        aggregated = aggregate_sentiments(sentiments)
        
        # Calculate confidence (based on agreement)
        if len(sentiments) > 1:
            scores = [s.get("score", 0.5) for s in sentiments]
            avg_score = sum(scores) / len(scores)
            variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
            confidence = max(0, 1 - variance)  # Lower variance = higher confidence
        else:
            confidence = sentiments[0].get("confidence", 0.5) if sentiments else 0.5
        
        # Update state
        state["individual_sentiments"] = results
        state["aggregated_sentiment"] = aggregated
        state["confidence_score"] = confidence
        
        clear_error(state)
        return state
        
    except Exception as e:
        logger.error(f"Pure sentiment analysis error: {e}")
        state["error"] = str(e)
        return state


async def analyze_research_sentiment(state: ResearchState) -> ResearchState:
    clear_error(state)

    news = state.get("news_data") or []
    if not news:
        state["sentiment_score"] = 0.5
        state["sentiment_analysis"] = {"error": "no news"}
        return state

    try:
        texts, sources = [], []
        for a in news:
            title = a.get("title", "")
            desc = a.get("description", "")
            combined = f"{title}. {desc}".strip()
            if combined:
                texts.append(combined)
                src = a.get("source", "Unknown")
                if isinstance(src, dict):
                    src = src.get("name", "Unknown")
                sources.append(src)

        results = await _analyze_many(texts, sources)
        aggregated = aggregate_sentiments([r["sentiment"] for r in results])

        state["sentiment_score"] = aggregated["score"]
        state["sentiment_analysis"] = {
            "overall": aggregated,
            "individual": results,
            "article_count": len(results)
        }

        clear_error(state)
        return state

    except Exception as e:
        state["error"] = str(e)
        return state


async def analyze_portfolio_sentiment(state: PortfolioState) -> PortfolioState:
    """
    Analyze sentiment for all tickers in a portfolio
    """
    clear_error(state)
    
    stocks_data = state.get("stocks_data") or {}
    if not stocks_data:
        state["sentiment_scores"] = {}
        return state
    
    try:
        sentiment_scores = {}
        
        for ticker, data in stocks_data.items():
            if "error" in data:
                sentiment_scores[ticker] = 0.5  # Neutral if error
                continue
                
            news = data.get("news", [])
            if not news:
                sentiment_scores[ticker] = 0.5
                continue
            
            # Extract texts from news articles
            texts = []
            for article in news:
                title = article.get("title", "")
                desc = article.get("description", "")
                combined = f"{title}. {desc}".strip()
                if combined:
                    texts.append(combined)
            
            if texts:
                # Analyze sentiment for this ticker's news
                results = await _analyze_many(texts, [ticker] * len(texts))
                aggregated = aggregate_sentiments([r["sentiment"] for r in results])
                sentiment_scores[ticker] = aggregated["score"]
            else:
                sentiment_scores[ticker] = 0.5
        
        state["sentiment_scores"] = sentiment_scores
        clear_error(state)
        return state
        
    except Exception as e:
        logger.error(f"Portfolio sentiment error: {e}")
        state["error"] = str(e)
        return state
