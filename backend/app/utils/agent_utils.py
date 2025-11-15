# backend/app/agents/utils/agent_utils.py

"""
Agent Utilities - Shared logic across LangGraph workflows
- LLM-powered + heuristic combo summary & recommendations
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
import asyncio

from app.agents.nodes.llm_node import run_llm_node

logger = logging.getLogger(__name__)


# ============================================================
#  HEURISTIC (NON-LLM) HELPERS
# ============================================================

def _build_heuristic_summary(state: Dict[str, Any]) -> str:
    """
    Old rule-based summary, used as:
    - Standalone when no LLM available
    - Fallback if LLM fails / times out
    """
    ticker = state.get("ticker", "Unknown")
    sentiment_analysis = state.get("sentiment_analysis") or {}
    indicators = state.get("indicators") or {}
    stock_data = state.get("stock_data") or {}

    sentiment_score = state.get("sentiment_score", 0.5)
    overall_sentiment = (sentiment_analysis.get("overall") or {})
    sentiment_label = overall_sentiment.get("label", "neutral")

    signals = indicators.get("signals") or {}
    overall_signal = signals.get("overall_signal", "hold")

    current_price = (
        stock_data.get("current") or {}
    ).get("price", "N/A")

    # Concise summary format
    parts: List[str] = [
        f"{ticker} @ ₹{current_price}",
        f"Sentiment: {sentiment_label.upper()} ({sentiment_score:.2f}) | Signal: {str(overall_signal).upper().replace('_', ' ')}",
    ]

    # Brief sentiment details
    if sentiment_analysis:
        article_count = sentiment_analysis.get("article_count", 0)
        parts.append(f"News: {article_count} articles analyzed")

    # Brief technical details
    if indicators:
        rsi = indicators.get("rsi", {}).get("current", "N/A")
        parts.append(f"RSI: {rsi}")

    return " | ".join(parts)


def _build_heuristic_recommendations(state: Dict[str, Any]) -> List[str]:
    """
    Old rule-based recommendation engine.
    Used as:
    - Standalone when no LLM available
    - Fallback if LLM fails / times out
    """
    recos: List[str] = []

    sentiment_score = state.get("sentiment_score", 0.5)
    indicators = state.get("indicators") or {}
    signals = indicators.get("signals") or {}
    overall_signal = signals.get("overall_signal", "hold")

    # Combined signal (most important first, concise)
    if sentiment_score >= 0.6 and overall_signal in ["buy", "strong_buy"]:
        recos.append("Bullish: Buy on dips")
    elif sentiment_score <= 0.4 and overall_signal in ["sell", "strong_sell"]:
        recos.append("Bearish: Reduce exposure")
    elif sentiment_score >= 0.6:
        recos.append("Positive sentiment: Consider buying")
    elif sentiment_score <= 0.4:
        recos.append("Negative sentiment: Monitor closely")
    elif overall_signal in ["buy", "strong_buy"]:
        recos.append("Technical buy signal")
    elif overall_signal in ["sell", "strong_sell"]:
        recos.append("Technical sell signal")
    else:
        recos.append("Hold and monitor")

    return recos[:3]  # Limit to max 3 recommendations


# ============================================================
#  LLM-ENHANCED SUMMARY & RECOMMENDATIONS (COMBO)
# ============================================================

async def create_research_summary(state: Dict[str, Any]) -> str:
    """
    Async summary builder used by research_graph.synthesis_node.

    Logic:
      1. Build a short, structured HEURISTIC summary.
      2. Try to refine it with LLM combo (Groq + Gemini) via run_llm_node("combo", ...).
      3. If combo fails / no keys / timeout -> return heuristic summary.
    """
    heuristic = _build_heuristic_summary(state)
    ticker = state.get("ticker", "UNKNOWN")

    # If you don't want LLM at all, just return heuristic:
    # return heuristic

    prompt = (
        f"You are an expert financial research assistant.\n"
        f"Ticker: {ticker}\n\n"
        f"Below is a structured, rule-based analysis. Rewrite it into a concise 80–120 word "
        f"research note for an intermediate Indian retail investor. Be brief and direct:\n"
        f"- 1-2 sentence intro\n"
        f"- 2-3 key bullet points (sentiment, technicals, risk)\n"
        f"- 1 line conclusion with stance (Bullish/Bearish/Neutral)\n\n"
        f"RAW ANALYSIS:\n{heuristic}"
    )

    try:
        # 5-second timeout so it NEVER hangs your graph
        # Use "auto" instead of "combo" to gracefully fall back if only one LLM is available
        llm_text = await asyncio.wait_for(
            run_llm_node("auto", prompt, ticker=ticker),
            timeout=5.0,
        )

        if not llm_text or str(llm_text).startswith("[LLM_ERROR]"):
            # Log at debug level since this is expected when no API keys are configured
            error_msg = str(llm_text) if llm_text else "No response"
            if "API keys" in error_msg or "not available" in error_msg:
                logger.debug(f"LLM summary unavailable for {ticker} (no API keys), using heuristic.")
            else:
                logger.warning(f"LLM summary failed for {ticker}, using heuristic.")
            return heuristic

        return llm_text.strip()

    except Exception as e:
        logger.warning(f"LLM summary error for {ticker}: {e}, using heuristic.")
        return heuristic


async def generate_recommendations(state: Dict[str, Any]) -> List[str]:
    """
    Async recommendation generator used by research_graph.synthesis_node.

    Logic:
      1. Build heuristic recommendation list.
      2. Ask LLM combo to polish them into cleaner bullets.
      3. On any failure, return heuristic list as-is.
    """
    heuristic_recos = _build_heuristic_recommendations(state)
    ticker = state.get("ticker", "UNKNOWN")

    if not heuristic_recos:
        return ["Hold current position and monitor for new data."]

    prompt = (
        f"You are an expert equity analyst.\n"
        f"Ticker: {ticker}\n\n"
        f"Here are some raw rule-based recommendations:\n"
        f"{chr(10).join('- ' + r for r in heuristic_recos)}\n\n"
        f"Rewrite and organize them into 2–3 concise, non-repetitive bullet points for a "
        f"retail investor. Keep each bullet under 15 words. Be direct and actionable."
    )

    try:
        # Use "auto" instead of "combo" to gracefully fall back if only one LLM is available
        llm_text = await asyncio.wait_for(
            run_llm_node("auto", prompt, ticker=ticker),
            timeout=5.0,
        )

        if not llm_text or str(llm_text).startswith("[LLM_ERROR]"):
            # Log at debug level since this is expected when no API keys are configured
            error_msg = str(llm_text) if llm_text else "No response"
            if "API keys" in error_msg or "not available" in error_msg:
                logger.debug(f"LLM recommendations unavailable for {ticker} (no API keys), using heuristic.")
            else:
                logger.warning(f"LLM recommendations failed for {ticker}, using heuristic.")
            return heuristic_recos

        # Simple bullet parsing – split by lines starting with "-" or "•"
        recos: List[str] = []
        for line in str(llm_text).splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith(("-", "•")):
                line = line.lstrip("-• ").strip()
            recos.append(line)

        return recos or heuristic_recos

    except Exception as e:
        logger.warning(f"LLM recommendation error for {ticker}: {e}, using heuristic.")
        return heuristic_recos


# ============================================================
#  RISK & PORTFOLIO HELPERS (same as your version)
# ============================================================

def calculate_risk_score(state: Dict[str, Any]) -> float:
    """
    Calculate risk score from 0 (low risk) to 1 (high risk)
    """
    risk_factors: List[float] = []

    # Sentiment volatility
    sentiment_analysis = state.get("sentiment_analysis") or {}
    if sentiment_analysis:
        positive = sentiment_analysis.get("positive_count", 0)
        negative = sentiment_analysis.get("negative_count", 0)
        total = sentiment_analysis.get("article_count", 1)

        if total > 0:
            sentiment_variance = abs(positive - negative) / total
            # High variance => one side dominates => lower perceived risk
            risk_factors.append(1 - sentiment_variance)

    # Technical indicator alignment
    indicators = state.get("indicators") or {}
    signals = indicators.get("signals") or {}
    strength = abs(signals.get("strength", 0))

    if strength >= 3:
        risk_factors.append(0.2)
    elif strength >= 2:
        risk_factors.append(0.4)
    elif strength == 1:
        risk_factors.append(0.6)
    else:
        risk_factors.append(0.8)

    if risk_factors:
        return sum(risk_factors) / len(risk_factors)

    return 0.5  # default moderate risk


def format_portfolio_summary(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format portfolio analysis into structured summary
    """
    sentiment_scores = state.get("sentiment_scores") or {}
    technical_signals = state.get("technical_signals") or {}

    summary: Dict[str, Any] = {
        "total_tickers": len(sentiment_scores),
        "overall_sentiment": 0.0,
        "bullish_count": 0,
        "bearish_count": 0,
        "neutral_count": 0,
        "top_opportunities": [],
        "risk_alerts": [],
    }

    if sentiment_scores:
        summary["overall_sentiment"] = (
            sum(sentiment_scores.values()) / len(sentiment_scores)
        )

    ticker_analysis: List[Dict[str, Any]] = []

    for ticker in sentiment_scores.keys():
        sentiment = sentiment_scores.get(ticker, 0.5)
        signals = (technical_signals.get(ticker) or {}).get("signals") or {}
        overall_signal = signals.get("overall_signal", "hold")

        analysis = {
            "ticker": ticker,
            "sentiment": sentiment,
            "signal": overall_signal,
            "score": calculate_ticker_score(sentiment, signals),
        }
        ticker_analysis.append(analysis)

        if overall_signal in ["buy", "strong_buy"]:
            summary["bullish_count"] += 1
        elif overall_signal in ["sell", "strong_sell"]:
            summary["bearish_count"] += 1
        else:
            summary["neutral_count"] += 1

    ticker_analysis.sort(key=lambda x: x["score"], reverse=True)

    summary["top_opportunities"] = [
        t["ticker"] for t in ticker_analysis[:3] if t["score"] > 0.6
    ]

    summary["risk_alerts"] = [
        t["ticker"]
        for t in ticker_analysis
        if t["score"] < 0.4 or t["signal"] in ["sell", "strong_sell"]
    ]

    return summary


def calculate_ticker_score(sentiment: float, signals: Dict[str, Any]) -> float:
    """
    Calculate overall score for a ticker (0–1)
    Combines sentiment (60%) and technicals (40%)
    """
    sentiment_weight = 0.6
    technical_weight = 0.4

    signal_map = {
        "strong_buy": 1.0,
        "buy": 0.75,
        "hold": 0.5,
        "sell": 0.25,
        "strong_sell": 0.0,
    }

    overall_signal = signals.get("overall_signal", "hold")
    technical_score = signal_map.get(overall_signal, 0.5)

    total_score = (sentiment * sentiment_weight) + (technical_score * technical_weight)
    return round(total_score, 2)


def should_retry_node(state: Dict[str, Any], node_name: str, max_retries: int = 3) -> bool:
    """
    Determine if a node should be retried based on error state
    """
    error = state.get("error")
    if not error:
        return False

    retry_key = f"{node_name}_retry_count"
    retry_count = state.get(retry_key, 0)

    if retry_count >= max_retries:
        logger.warning(f"Max retries reached for {node_name}")
        return False

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

    # Avoid noisy "Error in state: None"
    err = state.get("error")
    if err:
        logger.error(f"Error in state: {err}")
def clear_error(state: Dict[str, Any]):
    if "error" in state and state["error"] is None:
        state.pop("error", None)
