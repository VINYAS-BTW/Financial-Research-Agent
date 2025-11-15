"""
Sentiment Node - Analyzes sentiment from news and text data
"""
from typing import List, Dict, Any
from datetime import datetime
import logging

from app.services.sentiment import analyze_sentiment, aggregate_sentiments
from app.agents.state.agent_state import ResearchState, SentimentState, PortfolioState

logger = logging.getLogger(__name__)


async def analyze_research_sentiment(state: ResearchState) -> ResearchState:
    """
    Analyze sentiment for research workflow
    Processes news data and generates sentiment insights
    """
    news_data = state.get("news_data", [])
    
    if not news_data:
        logger.warning("No news data available for sentiment analysis")
        state["sentiment_score"] = 0.5  # Neutral
        state["sentiment_analysis"] = {"error": "No news data"}
        return state
    
    try:
        # Extract text content from news
        texts = []
        sources = []
        
        for article in news_data:
            title = article.get("title", "")
            description = article.get("description", "")
            combined_text = f"{title}. {description}"
            
            texts.append(combined_text)
            sources.append(article.get("source", "Unknown"))
        
        # Analyze individual sentiments
        individual_sentiments = []
        for text, source in zip(texts, sources):
            sentiment = await analyze_sentiment(text)
            individual_sentiments.append({
                "source": source,
                "sentiment": sentiment,
                "text_preview": text[:100]
            })
        
        # Aggregate sentiments
        aggregated = aggregate_sentiments([s["sentiment"] for s in individual_sentiments])
        
        state["sentiment_score"] = aggregated["score"]
        state["sentiment_analysis"] = {
            "overall": aggregated,
            "individual": individual_sentiments,
            "article_count": len(texts),
            "positive_count": sum(1 for s in individual_sentiments if s["sentiment"]["label"] == "positive"),
            "negative_count": sum(1 for s in individual_sentiments if s["sentiment"]["label"] == "negative"),
            "neutral_count": sum(1 for s in individual_sentiments if s["sentiment"]["label"] == "neutral")
        }
        
        logger.info(f"Sentiment analysis complete: {aggregated['label']} ({aggregated['score']:.2f})")
        return state
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        state["error"] = f"Sentiment analysis error: {str(e)}"
        state["sentiment_score"] = 0.5
        return state


async def analyze_pure_sentiment(state: SentimentState) -> SentimentState:
    """
    Pure sentiment analysis workflow
    Used in sentiment_graph
    """
    texts = state["texts"]
    sources = state.get("sources", ["Unknown"] * len(texts))
    
    try:
        # Analyze each text
        individual_sentiments = []
        
        for text, source in zip(texts, sources):
            sentiment = await analyze_sentiment(text)
            individual_sentiments.append({
                "source": source,
                "sentiment": sentiment,
                "text": text[:200]  # Store preview
            })
        
        # Aggregate
        aggregated = aggregate_sentiments([s["sentiment"] for s in individual_sentiments])
        
        # Extract key topics (simple keyword extraction)
        key_topics = extract_key_topics(texts)
        
        state["individual_sentiments"] = individual_sentiments
        state["aggregated_sentiment"] = aggregated
        state["confidence_score"] = aggregated["confidence"]
        state["key_topics"] = key_topics
        
        return state
        
    except Exception as e:
        logger.error(f"Error in pure sentiment analysis: {str(e)}")
        state["error"] = str(e)
        return state


async def analyze_portfolio_sentiment(state: PortfolioState) -> PortfolioState:
    """
    Analyze sentiment for each ticker in portfolio
    """
    stocks_data = state.get("stocks_data", {})
    sentiment_scores = {}
    
    try:
        for ticker, data in stocks_data.items():
            if "error" in data:
                sentiment_scores[ticker] = 0.5  # Neutral for errors
                continue
            
            news = data.get("news", [])
            if not news:
                sentiment_scores[ticker] = 0.5
                continue
            
            # Extract and analyze
            texts = [f"{n.get('title', '')}. {n.get('description', '')}" for n in news]
            sentiments = []
            
            for text in texts:
                sent = await analyze_sentiment(text)
                sentiments.append(sent)
            
            # Aggregate
            aggregated = aggregate_sentiments(sentiments)
            sentiment_scores[ticker] = aggregated["score"]
        
        state["sentiment_scores"] = sentiment_scores
        logger.info(f"Portfolio sentiment analysis complete for {len(sentiment_scores)} tickers")
        
        return state
        
    except Exception as e:
        logger.error(f"Error in portfolio sentiment: {str(e)}")
        state["error"] = f"Portfolio sentiment error: {str(e)}"
        return state


def extract_key_topics(texts: List[str], top_n: int = 5) -> List[str]:
    """
    Simple keyword extraction for topic identification
    """
    from collections import Counter
    import re
    
    # Combine all texts
    combined = " ".join(texts).lower()
    
    # Remove common words
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
    
    # Extract words
    words = re.findall(r'\b[a-z]{4,}\b', combined)
    words = [w for w in words if w not in stop_words]
    
    # Count and return top topics
    counter = Counter(words)
    return [word for word, _ in counter.most_common(top_n)]