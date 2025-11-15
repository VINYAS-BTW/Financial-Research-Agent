"""
Sentiment Graph - Specialized workflow for pure sentiment analysis
Can be used independently or as a sub-graph
"""
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END  # type: ignore
import logging

from app.agents.state.agent_state import SentimentState
from app.agents.nodes.sentiment_node import analyze_pure_sentiment

logger = logging.getLogger(__name__)


async def preprocess_node(state: SentimentState) -> SentimentState:
    """
    Preprocess input texts for sentiment analysis
    """
    texts = state.get("texts", [])
    
    if not texts:
        state["error"] = "No texts provided for analysis"
        return state
    
    # Clean and normalize texts
    cleaned_texts = []
    for text in texts:
        if text and isinstance(text, str):
            # Remove extra whitespace
            cleaned = " ".join(text.split())
            if cleaned:
                cleaned_texts.append(cleaned)
    
    state["texts"] = cleaned_texts
    logger.info(f"Preprocessed {len(cleaned_texts)} texts for sentiment analysis")
    
    return state


async def postprocess_node(state: SentimentState) -> SentimentState:
    """
    Postprocess sentiment results and add insights
    """
    aggregated = state.get("aggregated_sentiment", {})
    individual = state.get("individual_sentiments", [])
    
    if not aggregated:
        return state
    
    # Calculate additional metrics
    score = aggregated.get("score", 0.5)
    confidence = aggregated.get("confidence", 0)
    
    # Add interpretation
    if score >= 0.7:
        interpretation = "Strongly positive sentiment"
    elif score >= 0.55:
        interpretation = "Moderately positive sentiment"
    elif score >= 0.45:
        interpretation = "Neutral sentiment"
    elif score >= 0.3:
        interpretation = "Moderately negative sentiment"
    else:
        interpretation = "Strongly negative sentiment"
    
    # Add confidence level
    if confidence >= 0.8:
        confidence_level = "High confidence"
    elif confidence >= 0.6:
        confidence_level = "Moderate confidence"
    else:
        confidence_level = "Low confidence"
    
    # Update state with insights
    state["aggregated_sentiment"]["interpretation"] = interpretation
    state["aggregated_sentiment"]["confidence_level"] = confidence_level
    
    logger.info(f"Sentiment analysis: {interpretation} ({confidence_level})")
    
    return state


def should_continue_after_preprocess(state: SentimentState) -> str:
    """
    Check if we should continue after preprocessing
    """
    if state.get("error"):
        return END
    
    if not state.get("texts"):
        return END
    
    return "analyze"


def should_continue_after_analyze(state: SentimentState) -> str:
    """
    Check if we should continue after analysis
    """
    if state.get("error"):
        return "postprocess"  # Still do postprocessing even with errors
    
    return "postprocess"


# Build the sentiment graph
def create_sentiment_graph() -> Any:
    """
    Create the sentiment analysis workflow graph
    
    Flow:
    START -> preprocess -> analyze -> postprocess -> END
    """
    workflow = StateGraph(SentimentState)
    
    # Add nodes
    workflow.add_node("preprocess", preprocess_node)
    workflow.add_node("analyze", analyze_pure_sentiment)
    workflow.add_node("postprocess", postprocess_node)
    
    # Add edges
    workflow.set_entry_point("preprocess")
    
    workflow.add_conditional_edges(
        "preprocess",
        should_continue_after_preprocess,
        {
            "analyze": "analyze",
            END: END
        }
    )
    
    workflow.add_conditional_edges(
        "analyze",
        should_continue_after_analyze,
        {
            "postprocess": "postprocess"
        }
    )
    
    workflow.add_edge("postprocess", END)
    
    return workflow.compile()


# Initialize the compiled graph
sentiment_graph = create_sentiment_graph()


async def run_sentiment_analysis(
    texts: List[str],
    sources: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Execute standalone sentiment analysis
    
    Args:
        texts: List of text strings to analyze
        sources: Optional list of source identifiers
    
    Returns:
        Sentiment analysis results
    """
    logger.info(f"Starting sentiment analysis for {len(texts)} texts")
    
    # Initialize state
    initial_state: SentimentState = {
        "texts": texts,
        "sources": sources,
        "individual_sentiments": None,
        "aggregated_sentiment": None,
        "confidence_score": None,
        "key_topics": None,
        "error": None
    }
    
    try:
        # Run the graph
        final_state = await sentiment_graph.ainvoke(initial_state)
        
        logger.info("Sentiment analysis complete")
        
        # Format output
        return {
            "aggregated": final_state.get("aggregated_sentiment"),
            "individual": final_state.get("individual_sentiments"),
            "key_topics": final_state.get("key_topics"),
            "confidence": final_state.get("confidence_score"),
            "text_count": len(final_state.get("texts", [])),
            "error": final_state.get("error")
        }
        
    except Exception as e:
        logger.error(f"Error running sentiment graph: {str(e)}")
        return {
            "error": str(e),
            "text_count": len(texts)
        }


async def analyze_ticker_sentiment(ticker: str, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Convenience function to analyze sentiment for a ticker's news articles
    
    Args:
        ticker: Stock ticker symbol
        articles: List of news articles with 'title' and 'description' fields
    
    Returns:
        Sentiment analysis results
    """
    # Extract texts from articles
    texts = []
    sources = []
    
    for article in articles:
        title = article.get("title", "")
        description = article.get("description", "")
        combined = f"{title}. {description}"
        
        texts.append(combined)
        sources.append(article.get("source", "Unknown"))
    
    # Run analysis
    result = await run_sentiment_analysis(texts, sources)
    result["ticker"] = ticker
    
    return result