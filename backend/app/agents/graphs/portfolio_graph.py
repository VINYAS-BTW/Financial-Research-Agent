"""
Portfolio Graph - Analyzes multiple stocks in a portfolio/watchlist
Orchestrates parallel analysis and portfolio-level insights
"""
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END  # type: ignore
from datetime import datetime
import logging

from app.agents.state.agent_state import PortfolioState
from app.agents.nodes.fetch_node import fetch_portfolio_data
from app.agents.nodes.sentiment_node import analyze_portfolio_sentiment
from app.agents.nodes.indicator_node import calculate_portfolio_indicators
from app.utils.agent_utils import (
    format_portfolio_summary,
    calculate_ticker_score,
    log_state_transition
)

logger = logging.getLogger(__name__)


async def portfolio_analysis_node(state: PortfolioState) -> PortfolioState:
    """
    Perform portfolio-level analysis and generate recommendations
    """
    logger.info("Performing portfolio-level analysis")
    
    try:
        sentiment_scores = state.get("sentiment_scores", {})
        technical_signals = state.get("technical_signals", {})
        
        if not sentiment_scores and not technical_signals:
            state["error"] = "No analysis data available"
            return state
        
        # Generate portfolio summary
        portfolio_summary = format_portfolio_summary(state)
        state["portfolio_summary"] = portfolio_summary
        
        # Generate recommendations for each ticker
        recommendations = []
        
        for ticker in sentiment_scores.keys():
            sentiment = sentiment_scores.get(ticker, 0.5)
            signals = technical_signals.get(ticker, {}).get("signals", {})
            
            score = calculate_ticker_score(sentiment, signals)
            
            recommendation = {
                "ticker": ticker,
                "action": determine_action(sentiment, signals),
                "score": score,
                "sentiment": sentiment,
                "signal": signals.get("overall_signal", "hold"),
                "priority": determine_priority(score, sentiment, signals)
            }
            
            recommendations.append(recommendation)
        
        # Sort by priority and score
        recommendations.sort(key=lambda x: (x["priority"], x["score"]), reverse=True)
        state["recommendations"] = recommendations
        
        # Calculate portfolio risk metrics
        risk_metrics = calculate_portfolio_risk(state)
        state["risk_metrics"] = risk_metrics
        
        logger.info(f"Portfolio analysis complete for {len(recommendations)} tickers")
        return state
        
    except Exception as e:
        logger.error(f"Error in portfolio analysis: {str(e)}")
        state["error"] = f"Portfolio analysis error: {str(e)}"
        return state


def determine_action(sentiment: float, signals: Dict[str, Any]) -> str:
    """
    Determine recommended action based on sentiment and signals
    """
    overall_signal = signals.get("overall_signal", "hold")
    
    # Strong buy conditions
    if sentiment >= 0.7 and overall_signal in ["strong_buy", "buy"]:
        return "Strong Buy"
    
    # Buy conditions
    if (sentiment >= 0.6 and overall_signal == "buy") or \
       (sentiment >= 0.7 and overall_signal == "hold"):
        return "Buy"
    
    # Strong sell conditions
    if sentiment <= 0.3 and overall_signal in ["strong_sell", "sell"]:
        return "Strong Sell"
    
    # Sell conditions
    if (sentiment <= 0.4 and overall_signal == "sell") or \
       (sentiment <= 0.3 and overall_signal == "hold"):
        return "Sell"
    
    # Hold with monitoring
    if (sentiment >= 0.6 and overall_signal in ["sell", "strong_sell"]) or \
       (sentiment <= 0.4 and overall_signal in ["buy", "strong_buy"]):
        return "Hold - Monitor Closely"
    
    return "Hold"


def determine_priority(score: float, sentiment: float, signals: Dict[str, Any]) -> int:
    """
    Determine priority level (1=highest, 5=lowest)
    """
    overall_signal = signals.get("overall_signal", "hold")
    
    # High priority: Strong aligned signals
    if (score >= 0.8 and sentiment >= 0.7 and overall_signal == "strong_buy") or \
       (score <= 0.2 and sentiment <= 0.3 and overall_signal == "strong_sell"):
        return 1
    
    # Medium-high priority: Good aligned signals
    if (score >= 0.7 and overall_signal in ["buy", "strong_buy"]) or \
       (score <= 0.3 and overall_signal in ["sell", "strong_sell"]):
        return 2
    
    # Medium priority: Moderate signals or mixed
    if 0.4 <= score <= 0.6 or \
       (sentiment >= 0.6 and overall_signal in ["sell", "strong_sell"]) or \
       (sentiment <= 0.4 and overall_signal in ["buy", "strong_buy"]):
        return 3
    
    # Low priority: Weak signals
    if overall_signal == "hold":
        return 4
    
    return 5


def calculate_portfolio_risk(state: PortfolioState) -> Dict[str, Any]:
    """
    Calculate portfolio-level risk metrics
    """
    sentiment_scores = state.get("sentiment_scores", {})
    technical_signals = state.get("technical_signals", {})
    
    if not sentiment_scores:
        return {"error": "No data for risk calculation"}
    
    # Calculate metrics
    sentiments = list(sentiment_scores.values())
    avg_sentiment = sum(sentiments) / len(sentiments)
    
    # Sentiment volatility (standard deviation)
    sentiment_variance = sum((s - avg_sentiment) ** 2 for s in sentiments) / len(sentiments)
    sentiment_volatility = sentiment_variance ** 0.5
    
    # Count extreme positions
    high_risk_count = sum(1 for s in sentiments if s <= 0.3 or s >= 0.7)
    
    # Count bearish signals
    bearish_count = sum(
        1 for ticker, signals in technical_signals.items()
        if signals.get("signals", {}).get("overall_signal") in ["sell", "strong_sell"]
    )
    
    # Overall risk score (0-1, higher = more risk)
    risk_factors = [
        sentiment_volatility,  # High volatility = risk
        bearish_count / len(sentiments) if sentiments else 0,  # More bearish = risk
        high_risk_count / len(sentiments) if sentiments else 0  # Extreme positions = risk
    ]
    
    overall_risk = sum(risk_factors) / len(risk_factors)
    
    return {
        "overall_risk_score": round(overall_risk, 2),
        "average_sentiment": round(avg_sentiment, 2),
        "sentiment_volatility": round(sentiment_volatility, 2),
        "high_risk_positions": high_risk_count,
        "bearish_signals": bearish_count,
        "risk_level": "High" if overall_risk >= 0.7 else "Medium" if overall_risk >= 0.4 else "Low"
    }


def should_continue_after_fetch(state: PortfolioState) -> str:
    """
    Conditional edge after fetch
    """
    if state.get("error"):
        return "analysis"  # Continue anyway to analyze what we have
    
    stocks_data = state.get("stocks_data", {})
    if not stocks_data:
        return END
    
    return "sentiment"


def should_continue_after_sentiment(state: PortfolioState) -> str:
    """
    Conditional edge after sentiment
    """
    return "indicators"


def should_continue_after_indicators(state: PortfolioState) -> str:
    """
    Conditional edge after indicators
    """
    return "analysis"


# Build the portfolio graph
def create_portfolio_graph() -> Any:
    """
    Create the portfolio analysis workflow graph
    
    Flow:
    START -> fetch -> sentiment -> indicators -> analysis -> END
    """
    workflow = StateGraph(PortfolioState)
    
    # Add nodes
    workflow.add_node("fetch", fetch_portfolio_data)
    workflow.add_node("sentiment", analyze_portfolio_sentiment)
    workflow.add_node("indicators", calculate_portfolio_indicators)
    workflow.add_node("analysis", portfolio_analysis_node)
    
    # Add edges
    workflow.set_entry_point("fetch")
    
    workflow.add_conditional_edges(
        "fetch",
        should_continue_after_fetch,
        {
            "sentiment": "sentiment",
            "analysis": "analysis",
            END: END
        }
    )
    
    workflow.add_conditional_edges(
        "sentiment",
        should_continue_after_sentiment,
        {
            "indicators": "indicators"
        }
    )
    
    workflow.add_conditional_edges(
        "indicators",
        should_continue_after_indicators,
        {
            "analysis": "analysis"
        }
    )
    
    workflow.add_edge("analysis", END)
    
    return workflow.compile()


# Initialize the compiled graph
portfolio_graph = create_portfolio_graph()


async def run_portfolio_analysis(
    tickers: List[str],
    watchlist_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Execute portfolio analysis for a list of tickers
    
    Args:
        tickers: List of stock ticker symbols
        watchlist_id: Optional watchlist ID for tracking
    
    Returns:
        Complete portfolio analysis results
    """
    logger.info(f"Starting portfolio analysis for {len(tickers)} tickers")
    
    # Initialize state
    initial_state: PortfolioState = {
        "tickers": tickers,
        "watchlist_id": watchlist_id,
        "stocks_data": None,
        "sentiment_scores": None,
        "technical_signals": None,
        "portfolio_summary": None,
        "recommendations": None,
        "risk_metrics": None,
        "error": None,
        "timestamp": datetime.now()
    }
    
    try:
        # Run the graph
        final_state = await portfolio_graph.ainvoke(initial_state)
        
        logger.info("Portfolio analysis complete")
        
        # Format output
        return {
            "tickers": final_state["tickers"],
            "watchlist_id": final_state.get("watchlist_id"),
            "timestamp": final_state["timestamp"].isoformat(),
            "portfolio_summary": final_state.get("portfolio_summary"),
            "recommendations": final_state.get("recommendations"),
            "risk_metrics": final_state.get("risk_metrics"),
            "sentiment_scores": final_state.get("sentiment_scores"),
            "technical_signals": final_state.get("technical_signals"),
            "error": final_state.get("error")
        }
        
    except Exception as e:
        logger.error(f"Error running portfolio graph: {str(e)}")
        return {
            "tickers": tickers,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }