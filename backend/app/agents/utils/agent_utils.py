"""
Agent Utilities - Shared logic across LangGraph workflows
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def create_research_summary(state: Dict[str, Any]) -> str:
    """
    Generate comprehensive research summary from state
    """
    ticker = state.get("ticker", "Unknown")
    sentiment_analysis = state.get("sentiment_analysis", {})
    indicators = state.get("indicators", {})
    stock_data = state.get("stock_data", {})
    
    # Extract key metrics
    sentiment_score = state.get("sentiment_score", 0.5)
    sentiment_label = sentiment_analysis.get("overall", {}).get("label", "neutral")
    
    signals = indicators.get("signals", {})
    overall_signal = signals.get("overall_signal", "hold")
    
    current_price = stock_data.get("current", {}).get("price", "N/A")
    
    # Build summary
    summary_parts = [
        f"Research Summary for {ticker}",
        f"Current Price: ${current_price}",
        "",
        f"Market Sentiment: {sentiment_label.upper()} (Score: {sentiment_score:.2f})",
        f"Technical Signal: {overall_signal.upper().replace('_', ' ')}",
        "",
    ]
    
    # Add sentiment details
    if sentiment_analysis:
        article_count = sentiment_analysis.get("article_count", 0)
        positive_count = sentiment_analysis.get("positive_count", 0)
        negative_count = sentiment_analysis.get("negative_count", 0)
        
        summary_parts.append(f"Sentiment Analysis ({article_count} articles):")
        summary_parts.append(f"  Positive: {positive_count}")
        summary_parts.append(f"  Negative: {negative_count}")
        summary_parts.append("")
    
    # Add technical details
    if indicators:
        summary_parts.append("Technical Indicators:")
        summary_parts.append(f"  {indicators.get('summary', 'No summary available')}")
        summary_parts.append("")
    
    return "\n".join(summary_parts)


def generate_recommendations(state: Dict[str, Any]) -> List[str]:
    """
    Generate actionable recommendations based on analysis
    """
    recommendations = []
    
    sentiment_score = state.get("sentiment_score", 0.5)
    indicators = state.get("indicators", {})
    signals = indicators.get("signals", {})
    overall_signal = signals.get("overall_signal", "hold")
    
    # Sentiment-based recommendations
    if sentiment_score >= 0.7:
        recommendations.append("Positive market sentiment detected - consider increasing position")
    elif sentiment_score <= 0.3:
        recommendations.append("Negative market sentiment detected - exercise caution")
    
    # Technical signal recommendations
    if overall_signal == "strong_buy":
        recommendations.append("Strong technical buy signal - potential entry point")
    elif overall_signal == "buy":
        recommendations.append("Moderate buy signal - consider scaling in")
    elif overall_signal == "strong_sell":
        recommendations.append("Strong sell signal - consider reducing exposure")
    elif overall_signal == "sell":
        recommendations.append("Moderate sell signal - monitor closely")
    
    # Combined analysis
    if sentiment_score >= 0.6 and overall_signal in ["buy", "strong_buy"]:
        recommendations.append("Both sentiment and technicals align positively - high confidence opportunity")
    elif sentiment_score <= 0.4 and overall_signal in ["sell", "strong_sell"]:
        recommendations.append("Both sentiment and technicals align negatively - consider risk management")
    elif (sentiment_score >= 0.6 and overall_signal in ["sell", "strong_sell"]) or \
         (sentiment_score <= 0.4 and overall_signal in ["buy", "strong_buy"]):
        recommendations.append("Mixed signals - proceed with caution and do additional research")
    
    # Default recommendation
    if not recommendations:
        recommendations.append("Hold current position and monitor for changes")
    
    return recommendations


def calculate_risk_score(state: Dict[str, Any]) -> float:
    """
    Calculate risk score from 0 (low risk) to 1 (high risk)
    """
    risk_factors = []
    
    # Sentiment volatility
    sentiment_analysis = state.get("sentiment_analysis", {})
    if sentiment_analysis:
        positive = sentiment_analysis.get("positive_count", 0)
        negative = sentiment_analysis.get("negative_count", 0)
        total = sentiment_analysis.get("article_count", 1)
        
        if total > 0:
            sentiment_variance = abs(positive - negative) / total
            risk_factors.append(1 - sentiment_variance)  # High variance = low risk
    
    # Technical indicator alignment
    indicators = state.get("indicators", {})
    signals = indicators.get("signals", {})
    strength = abs(signals.get("strength", 0))
    
    if strength >= 3:
        risk_factors.append(0.2)  # Strong alignment = low risk
    elif strength >= 2:
        risk_factors.append(0.4)
    elif strength == 1:
        risk_factors.append(0.6)
    else:
        risk_factors.append(0.8)  # No alignment = high risk
    
    # Calculate average risk
    if risk_factors:
        return sum(risk_factors) / len(risk_factors)
    return 0.5  # Default moderate risk


def format_portfolio_summary(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format portfolio analysis into structured summary
    """
    sentiment_scores = state.get("sentiment_scores", {})
    technical_signals = state.get("technical_signals", {})
    
    summary = {
        "total_tickers": len(sentiment_scores),
        "overall_sentiment": 0,
        "bullish_count": 0,
        "bearish_count": 0,
        "neutral_count": 0,
        "top_opportunities": [],
        "risk_alerts": []
    }
    
    # Calculate overall sentiment
    if sentiment_scores:
        summary["overall_sentiment"] = sum(sentiment_scores.values()) / len(sentiment_scores)
    
    # Analyze each ticker
    ticker_analysis = []
    
    for ticker in sentiment_scores.keys():
        sentiment = sentiment_scores.get(ticker, 0.5)
        signals = technical_signals.get(ticker, {}).get("signals", {})
        overall_signal = signals.get("overall_signal", "hold")
        
        analysis = {
            "ticker": ticker,
            "sentiment": sentiment,
            "signal": overall_signal,
            "score": calculate_ticker_score(sentiment, signals)
        }
        ticker_analysis.append(analysis)
        
        # Count signals
        if overall_signal in ["buy", "strong_buy"]:
            summary["bullish_count"] += 1
        elif overall_signal in ["sell", "strong_sell"]:
            summary["bearish_count"] += 1
        else:
            summary["neutral_count"] += 1
    
    # Sort by score
    ticker_analysis.sort(key=lambda x: x["score"], reverse=True)
    
    # Top opportunities (high score)
    summary["top_opportunities"] = [
        t["ticker"] for t in ticker_analysis[:3] if t["score"] > 0.6
    ]
    
    # Risk alerts (low score or bearish)
    summary["risk_alerts"] = [
        t["ticker"] for t in ticker_analysis if t["score"] < 0.4 or t["signal"] in ["sell", "strong_sell"]
    ]
    
    return summary


def calculate_ticker_score(sentiment: float, signals: Dict[str, Any]) -> float:
    """
    Calculate overall score for a ticker (0-1)
    Combines sentiment and technical signals
    """
    # Weight sentiment (60%) and technicals (40%)
    sentiment_weight = 0.6
    technical_weight = 0.4
    
    # Normalize technical signal to 0-1 scale
    signal_map = {
        "strong_buy": 1.0,
        "buy": 0.75,
        "hold": 0.5,
        "sell": 0.25,
        "strong_sell": 0.0
    }
    
    overall_signal = signals.get("overall_signal", "hold")
    technical_score = signal_map.get(overall_signal, 0.5)
    
    # Calculate weighted score
    total_score = (sentiment * sentiment_weight) + (technical_score * technical_weight)
    
    return round(total_score, 2)


def should_retry_node(state: Dict[str, Any], node_name: str, max_retries: int = 3) -> bool:
    """
    Determine if a node should be retried based on error state
    """
    error = state.get("error")
    if not error:
        return False
    
    # Check retry count
    retry_key = f"{node_name}_retry_count"
    retry_count = state.get(retry_key, 0)
    
    if retry_count >= max_retries:
        logger.warning(f"Max retries reached for {node_name}")
        return False
    
    # Check if error is retryable
    retryable_errors = ["timeout", "rate limit", "connection", "temporary"]
    is_retryable = any(err in error.lower() for err in retryable_errors)
    
    if is_retryable:
        state[retry_key] = retry_count + 1
        logger.info(f"Retrying {node_name} (attempt {retry_count + 1}/{max_retries})")
        return True
    
    return False


def log_state_transition(from_node: str, to_node: str, state: Dict[str, Any]):
    """
    Log state transitions for debugging
    """
    logger.info(f"Transition: {from_node} -> {to_node}")
    logger.debug(f"State keys: {list(state.keys())}")
    
    if "error" in state:
        logger.error(f"Error in state: {state['error']}")