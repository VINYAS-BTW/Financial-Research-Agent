"""
Unified Agent Graph - Single comprehensive analysis combining all insights
Handles both single stock analysis and comparative analysis (2 stocks)

Place this in: backend/app/agents/graphs/unified_agent_graph.py
"""

from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from datetime import datetime
import logging

from app.agents.state.agent_state import ResearchState
from app.agents.nodes.fetch_node import fetch_research_data
from app.agents.nodes.sentiment_node import analyze_research_sentiment
from app.agents.nodes.indicator_node import calculate_research_indicators
from app.agents.nodes.llm_node import run_llm_node
from app.services.indicators import calculate_all_indicators
from app.utils.error_utils import clear_error

logger = logging.getLogger(__name__)


class UnifiedAgentState(ResearchState):
    """Extended state for unified analysis"""
    # For comparison mode
    is_comparison: Optional[bool]
    ticker_2: Optional[str]
    news_data_2: Optional[List[Dict[str, Any]]]
    stock_data_2: Optional[Dict[str, Any]]
    sentiment_score_2: Optional[float]
    sentiment_analysis_2: Optional[Dict[str, Any]]
    indicators_2: Optional[Dict[str, Any]]
    
    # Unified output
    unified_analysis: Optional[str]
    action_plan: Optional[List[str]]


async def detect_comparison_node(state: UnifiedAgentState) -> UnifiedAgentState:
    """
    Detect if this is a comparison query (2 tickers)
    Parse tickers from query if needed
    """
    query = state.get("query", "")
    ticker = state.get("ticker", "")
    
    # FIX: Handle None or empty query
    if not query:
        query = ""
        state["is_comparison"] = False
        return state
    
    query_lower = query.lower()
    
    # Check if query contains comparison keywords
    comparison_keywords = ["compare", "vs", "versus", "against", "which is better"]
    is_comparison = any(kw in query_lower for kw in comparison_keywords)
    
    if is_comparison and query:
        # IMPROVED: Extract tickers from the input ticker field if it contains multiple tickers
        # Format: "AAPL MSFT" or "AAPL,MSFT" or "AAPL vs MSFT"
        if ticker:
            # Split by spaces, commas, or "vs"
            import re
            tickers = re.split(r'[,\s]+|vs', ticker.upper())
            tickers = [t.strip() for t in tickers if t.strip() and len(t.strip()) >= 2]
            
            # Filter out common words that aren't tickers
            common_words = ["AND", "OR", "VS", "THE", "TO", "FROM", "BOTH", "WHICH", "IS", "BETTER"]
            tickers = [t for t in tickers if t not in common_words]
            
            if len(tickers) >= 2:
                state["ticker"] = tickers[0]
                state["ticker_2"] = tickers[1]
                state["is_comparison"] = True
                logger.info(f"✅ Comparison mode: {tickers[0]} vs {tickers[1]}")
                return state
        
        # Fallback: Try to extract from query if ticker field didn't work
        # Look for patterns like "AAPL and MSFT" or "compare AAPL with GOOGL"
        words = query.upper().split()
        potential_tickers = []
        
        for word in words:
            # Clean the word
            clean_word = word.strip(".,!?;:()[]{}").strip()
            
            # Check if it looks like a ticker:
            # - 2-5 letters
            # - All alphabetic
            # - Not a common word
            if (clean_word.isalpha() and 
                2 <= len(clean_word) <= 5 and 
                clean_word not in common_words):
                potential_tickers.append(clean_word)
        
        # Need exactly 2 tickers for comparison
        if len(potential_tickers) >= 2:
            state["ticker"] = potential_tickers[0]
            state["ticker_2"] = potential_tickers[1]
            state["is_comparison"] = True
            logger.info(f"✅ Comparison mode detected: {potential_tickers[0]} vs {potential_tickers[1]}")
        else:
            state["is_comparison"] = False
            logger.info(f"⚠️ Comparison keywords found but couldn't extract 2 valid tickers")
    else:
        state["is_comparison"] = False
    
    return state

async def fetch_unified_data(state: UnifiedAgentState) -> UnifiedAgentState:
    """
    Fetch data for one or two tickers based on comparison mode
    """
    clear_error(state)
    
    # Fetch first ticker (always)
    state = await fetch_research_data(state)
    
    # If comparison mode, fetch second ticker
    if state.get("is_comparison") and state.get("ticker_2"):
        ticker_2 = state["ticker_2"]
        logger.info(f"Fetching comparison data for {ticker_2}")
        
        try:
            from app.services.news import get_news_for_ticker
            from app.services.stocks import get_stock_data, get_historical_data
            
            news_data_2 = await get_news_for_ticker(ticker_2, limit=20)
            current_2 = await get_stock_data(ticker_2)
            historical_2 = await get_historical_data(ticker_2, period="3mo")
            
            state["news_data_2"] = news_data_2
            state["stock_data_2"] = {"current": current_2, "historical": historical_2}
            
        except Exception as e:
            logger.error(f"Error fetching data for {ticker_2}: {e}")
            state["error"] = f"Error fetching comparison data: {e}"
    
    return state


async def analyze_unified_sentiment(state: UnifiedAgentState) -> UnifiedAgentState:
    """
    Analyze sentiment for one or two tickers
    """
    clear_error(state)
    
    # Analyze first ticker
    state = await analyze_research_sentiment(state)
    
    # If comparison mode, analyze second ticker
    if state.get("is_comparison") and state.get("news_data_2"):
        ticker_2 = state["ticker_2"]
        logger.info(f"Analyzing sentiment for {ticker_2}")
        
        try:
            from app.services.sentiment import analyze_articles_sentiment
            
            news_2 = state["news_data_2"]
            sentiment_result = await analyze_articles_sentiment(news_2)
            
            state["sentiment_score_2"] = sentiment_result.get("score", 0.5)
            state["sentiment_analysis_2"] = sentiment_result
            
        except Exception as e:
            logger.error(f"Sentiment analysis error for {ticker_2}: {e}")
    
    return state


async def calculate_unified_indicators(state: UnifiedAgentState) -> UnifiedAgentState:
    """
    Calculate technical indicators for one or two tickers
    """
    clear_error(state)
    
    # Calculate for first ticker
    state = await calculate_research_indicators(state)
    
    # If comparison mode, calculate for second ticker
    if state.get("is_comparison") and state.get("stock_data_2"):
        ticker_2 = state["ticker_2"]
        logger.info(f"Calculating indicators for {ticker_2}")
        
        try:
            from app.services.indicators import calculate_all_indicators
            
            historical_2 = state["stock_data_2"].get("historical", [])
            indicators_2 = calculate_all_indicators(historical_2)
            
            state["indicators_2"] = indicators_2
            
        except Exception as e:
            logger.error(f"Indicator calculation error for {ticker_2}: {e}")
    
    return state


async def unified_synthesis_node(state: UnifiedAgentState) -> UnifiedAgentState:
    """
    AGENTIC SYNTHESIS: Combine ALL data into ONE coherent response
    Uses LLM to intelligently synthesize sentiment + technical + fundamental data
    """
    ticker = state.get("ticker", "UNKNOWN")
    is_comparison = state.get("is_comparison", False)
    
    logger.info(f"Starting unified synthesis for {ticker} (comparison={is_comparison})")
    
    try:
        if is_comparison:
            # COMPARISON MODE: Analyze both stocks and compare
            analysis = await _generate_comparison_analysis(state)
        else:
            # SINGLE STOCK MODE: Deep analysis of one stock
            analysis = await _generate_single_stock_analysis(state)
        
        state["unified_analysis"] = analysis.get("summary")
        state["action_plan"] = analysis.get("recommendations", [])
        
        # Also populate old fields for backward compatibility
        state["research_summary"] = analysis.get("summary")
        state["recommendations"] = analysis.get("recommendations", [])
        
        logger.info(f"Unified synthesis complete for {ticker}")
        return state
        
    except Exception as e:
        logger.error(f"Error in unified synthesis: {e}")
        state["error"] = f"Synthesis error: {e}"
        return state


async def _generate_single_stock_analysis(state: UnifiedAgentState) -> Dict[str, Any]:
    """
    Generate comprehensive single-stock analysis using LLM
    """
    ticker = state.get("ticker", "UNKNOWN")
    
    # Gather all data with safe defaults
    sentiment_score = state.get("sentiment_score") or 0.5
    sentiment_analysis = state.get("sentiment_analysis") or {}
    indicators = state.get("indicators") or {}
    stock_data = state.get("stock_data") or {}
    news_data = state.get("news_data") or []
    
    # Extract key metrics safely
    current_price = stock_data.get("current", {}).get("price") or "N/A"
    signals = indicators.get("signals") or {}
    overall_signal = signals.get("overall_signal") or "hold"
    
    rsi_data = indicators.get("rsi") or {}
    rsi = rsi_data.get("current") or "N/A"
    
    macd = indicators.get("macd") or {}
    moving_avgs = indicators.get("moving_averages") or {}
    
    # Build context for LLM - with safe formatting
    context = f"""
STOCK ANALYSIS DATA FOR {ticker}

CURRENT PRICE: ₹{current_price}

SENTIMENT ANALYSIS:
- Overall Score: {sentiment_score:.2f} (0=bearish, 1=bullish)
- News Articles Analyzed: {len(news_data)}
- Sentiment Label: {sentiment_analysis.get('overall', {}).get('label', 'neutral')}
- Positive Articles: {sentiment_analysis.get('positive_count', 0)}
- Negative Articles: {sentiment_analysis.get('negative_count', 0)}

TECHNICAL INDICATORS:
- Overall Signal: {overall_signal.upper()}
- Signal Strength: {signals.get('strength', 0)}/5
- RSI (14): {rsi}
- MACD Histogram: {macd.get('histogram', 'N/A')}
- 50-day MA: {moving_avgs.get('sma_50', 'N/A')}
- 200-day MA: {moving_avgs.get('sma_200', 'N/A')}

KEY NEWS HEADLINES (Top 5):
"""
    
    # Add top news headlines
    for i, article in enumerate(news_data[:5], 1):
        title = article.get("title", "No title")
        context += f"{i}. {title}\n"
    
    # Create prompt for LLM
    prompt = f"""You are an expert financial analyst. Analyze the following data and provide a comprehensive investment analysis.

{context}

YOUR TASK:
1. Synthesize ALL the data above (sentiment + technical + news) into ONE coherent analysis
2. Explain what the data tells us about {ticker}'s current situation
3. Identify the key factors driving the stock (positive and negative)
4. Provide 3-4 specific, actionable recommendations

FORMAT YOUR RESPONSE AS:

**ANALYSIS:**
[2-3 paragraphs synthesizing sentiment, technicals, and news. Be specific about numbers and signals.]

**KEY DRIVERS:**
- [Positive factor 1]
- [Positive factor 2]
- [Negative factor/risk 1]

**RECOMMENDATIONS:**
1. [Specific action with reasoning]
2. [Specific action with reasoning]
3. [Specific action with reasoning]

Be concise but thorough. Focus on actionable insights based on the actual data provided."""
    
    try:
        # Use LLM to generate unified analysis
        llm_response = await run_llm_node("auto", prompt, ticker=ticker)
        
        if llm_response and not str(llm_response).startswith("[LLM_ERROR]"):
            # Parse response
            summary, recommendations = _parse_llm_response(llm_response)
            return {
                "summary": summary,
                "recommendations": recommendations
            }
        else:
            # Fallback to heuristic
            return _fallback_single_analysis(state)
            
    except Exception as e:
        logger.warning(f"LLM synthesis failed, using fallback: {e}")
        import traceback
        traceback.print_exc()
        return _fallback_single_analysis(state)

async def _generate_comparison_analysis(state: UnifiedAgentState) -> Dict[str, Any]:
    """
    Generate comparative analysis for two stocks using LLM
    """
    ticker_1 = state.get("ticker") or "STOCK1"
    ticker_2 = state.get("ticker_2") or "STOCK2"
    
    # Gather data for both stocks with safe defaults
    data_1 = {
        "sentiment": state.get("sentiment_score") or 0.5,
        "signal": (state.get("indicators") or {}).get("signals", {}).get("overall_signal") or "hold",
        "price": (state.get("stock_data") or {}).get("current", {}).get("price") or "N/A",
        "rsi": (state.get("indicators") or {}).get("rsi", {}).get("current") or "N/A"
    }
    
    data_2 = {
        "sentiment": state.get("sentiment_score_2") or 0.5,
        "signal": (state.get("indicators_2") or {}).get("signals", {}).get("overall_signal") or "hold",
        "price": (state.get("stock_data_2") or {}).get("current", {}).get("price") or "N/A",
        "rsi": (state.get("indicators_2") or {}).get("rsi", {}).get("current") or "N/A"
    }
    
    # Build comparison context
    context = f"""
COMPARATIVE ANALYSIS: {ticker_1} vs {ticker_2}

{ticker_1}:
- Current Price: ₹{data_1['price']}
- Sentiment Score: {data_1['sentiment']:.2f}
- Technical Signal: {data_1['signal'].upper()}
- RSI: {data_1['rsi']}

{ticker_2}:
- Current Price: ₹{data_2['price']}
- Sentiment Score: {data_2['sentiment']:.2f}
- Technical Signal: {data_2['signal'].upper()}
- RSI: {data_2['rsi']}
"""
    
    prompt = f"""You are an expert financial analyst. Compare these two stocks and provide a clear recommendation.

{context}

YOUR TASK:
1. Compare the sentiment, technical signals, and overall attractiveness
2. Identify which stock is better positioned for growth
3. Explain the key differences between them
4. Provide a clear recommendation: which one to invest in and why

FORMAT YOUR RESPONSE AS:

**COMPARATIVE ANALYSIS:**
[2-3 paragraphs comparing both stocks across sentiment, technicals, and value]

**WINNER: [TICKER]**
[1 paragraph explaining why this stock is the better choice]

**RECOMMENDATIONS:**
1. [Specific action for the winner stock]
2. [Specific action for the other stock]
3. [Portfolio allocation suggestion]

Be specific and data-driven. Base your recommendation on the actual metrics provided."""
    
    try:
        llm_response = await run_llm_node("auto", prompt, ticker=f"{ticker_1}_vs_{ticker_2}")
        
        if llm_response and not str(llm_response).startswith("[LLM_ERROR]"):
            summary, recommendations = _parse_llm_response(llm_response)
            return {
                "summary": summary,
                "recommendations": recommendations
            }
        else:
            return _fallback_comparison_analysis(state)
            
    except Exception as e:
        logger.warning(f"Comparison synthesis failed, using fallback: {e}")
        import traceback
        traceback.print_exc()
        return _fallback_comparison_analysis(state)

def _parse_llm_response(response: str) -> tuple:
    """
    Parse LLM response into summary and recommendations
    """
    # Split by recommendations section
    parts = response.split("**RECOMMENDATIONS:**")
    
    if len(parts) == 2:
        summary = parts[0].strip()
        reco_text = parts[1].strip()
        
        # Parse recommendations (lines starting with numbers or bullets)
        recommendations = []
        for line in reco_text.split("\n"):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith(("-", "•"))):
                # Remove numbering/bullets
                clean_line = line.lstrip("0123456789.-• ").strip()
                if clean_line:
                    recommendations.append(clean_line)
        
        return summary, recommendations
    
    # If parsing fails, return whole response as summary
    return response, ["Review the analysis above and consult with a financial advisor"]


def _fallback_single_analysis(state: UnifiedAgentState) -> Dict[str, Any]:
    """
    Fallback heuristic analysis for single stock (when LLM unavailable)
    """
    ticker = state.get("ticker") or "UNKNOWN"
    sentiment_score = state.get("sentiment_score")
    if sentiment_score is None:
        sentiment_score = 0.5
    
    indicators = state.get("indicators") or {}
    signals = indicators.get("signals") or {}
    overall_signal = signals.get("overall_signal") or "hold"
    signal_strength = signals.get("strength") or 0
    
    rsi_data = indicators.get("rsi") or {}
    rsi_current = rsi_data.get("current") or 50
    
    # Build simple analysis
    sentiment_label = "bullish" if sentiment_score >= 0.6 else "bearish" if sentiment_score <= 0.4 else "neutral"
    
    summary = f"""**ANALYSIS:**
{ticker} shows {sentiment_label} sentiment (score: {sentiment_score:.2f}) with a technical {overall_signal} signal (strength: {signal_strength}/5). 
The stock is currently positioned for {_signal_to_action(overall_signal)} based on indicator alignment.

Current RSI of {rsi_current:.1f} indicates the stock is {"overbought" if rsi_current > 70 else "oversold" if rsi_current < 30 else "in neutral territory"}.

**KEY FACTORS:**
- Sentiment analysis indicates {sentiment_label} market perception
- Technical indicators suggest {overall_signal} momentum with {signal_strength}/5 signal strength
- RSI at {rsi_current:.1f} suggests {"caution for pullback" if rsi_current > 70 else "potential buying opportunity" if rsi_current < 30 else "balanced conditions"}
- Risk level: {"High" if sentiment_score <= 0.3 or sentiment_score >= 0.7 else "Moderate"}"""
    
    # Generate recommendations
    recommendations = []
    if sentiment_score >= 0.6 and overall_signal in ["buy", "strong_buy"]:
        recommendations.append(f"Consider accumulating {ticker} on dips - bullish alignment across sentiment and technicals")
        recommendations.append("Set stop loss at recent support level to protect downside")
        recommendations.append(f"Target: 10-15% upside based on {overall_signal} momentum")
        recommendations.append("Monitor news flow for any negative catalysts")
    elif sentiment_score <= 0.4 and overall_signal in ["sell", "strong_sell"]:
        recommendations.append(f"Consider reducing exposure to {ticker} - bearish signals align")
        recommendations.append("Wait for sentiment reversal and technical confirmation before re-entering")
        recommendations.append("Monitor for capitulation signals or oversold RSI levels")
        recommendations.append("Preserve capital for better opportunities")
    else:
        recommendations.append(f"Hold current position in {ticker} - mixed signals suggest patience")
        recommendations.append("Wait for clearer directional signals before adding to position")
        recommendations.append("Monitor news flow for catalysts that could tip sentiment")
        recommendations.append(f"Set alerts for RSI crossing 30 (oversold) or 70 (overbought)")
    
    return {"summary": summary, "recommendations": recommendations}

def _fallback_comparison_analysis(state: UnifiedAgentState) -> Dict[str, Any]:
    """
    Fallback heuristic comparison (when LLM unavailable)
    """
    ticker_1 = state.get("ticker") or "STOCK1"
    ticker_2 = state.get("ticker_2") or "STOCK2"
    
    # Safely get scores with defaults
    score_1 = state.get("sentiment_score")
    if score_1 is None:
        score_1 = 0.5
    
    score_2 = state.get("sentiment_score_2")
    if score_2 is None:
        score_2 = 0.5
    
    # Safely get signals
    signal_1 = (state.get("indicators") or {}).get("signals", {}).get("overall_signal") or "hold"
    signal_2 = (state.get("indicators_2") or {}).get("signals", {}).get("overall_signal") or "hold"
    
    # Calculate composite scores
    signal_scores = {
        "strong_buy": 2.0,
        "buy": 1.0,
        "hold": 0.0,
        "sell": -1.0,
        "strong_sell": -2.0
    }
    
    composite_1 = score_1 + (signal_scores.get(signal_1, 0) * 0.2)
    composite_2 = score_2 + (signal_scores.get(signal_2, 0) * 0.2)
    
    # Determine winner
    if composite_1 > composite_2:
        winner = ticker_1
        winner_score = score_1
        winner_signal = signal_1
        loser = ticker_2
        loser_score = score_2
        loser_signal = signal_2
    else:
        winner = ticker_2
        winner_score = score_2
        winner_signal = signal_2
        loser = ticker_1
        loser_score = score_1
        loser_signal = signal_1
    
    summary = f"""**COMPARATIVE ANALYSIS:**
{ticker_1}: Sentiment {score_1:.2f}, Signal {signal_1.upper()}
{ticker_2}: Sentiment {score_2:.2f}, Signal {signal_2.upper()}

Based on current metrics, {winner} shows better positioning with a sentiment score of {winner_score:.2f} and {winner_signal} technical signal, compared to {loser}'s {loser_score:.2f} sentiment and {loser_signal} signal.

**WINNER: {winner}**
{winner} demonstrates {'stronger bullish sentiment' if winner_score > 0.5 else 'more stability'} and {'favorable' if winner_signal in ['buy', 'strong_buy'] else 'neutral'} technical indicators. The data suggests this stock has better near-term prospects."""
    
    recommendations = [
        f"Primary position: Consider accumulating {winner} ({winner_signal} signal)",
        f"Secondary consideration: Monitor {loser} for improvement in sentiment/technicals",
        f"Portfolio allocation: Favor {winner} with a 60-70% weight if diversifying between both",
        "Set stop losses at recent support levels and rebalance based on market conditions"
    ]
    
    return {"summary": summary, "recommendations": recommendations}


def _signal_to_action(signal: str) -> str:
    """Convert signal to human-readable action"""
    mapping = {
        "strong_buy": "aggressive accumulation",
        "buy": "gradual accumulation",
        "hold": "consolidation",
        "sell": "gradual reduction",
        "strong_sell": "aggressive reduction"
    }
    return mapping.get(signal, "monitoring")


# Build the unified graph
def create_unified_graph():
    """
    Create unified agent workflow
    
    Flow:
    START -> detect_comparison -> fetch -> sentiment -> indicators -> synthesis -> END
    """
    workflow = StateGraph(UnifiedAgentState)
    
    # Add nodes
    workflow.add_node("detect", detect_comparison_node)
    workflow.add_node("fetch", fetch_unified_data)
    workflow.add_node("sentiment", analyze_unified_sentiment)
    workflow.add_node("indicators", calculate_unified_indicators)
    workflow.add_node("synthesis", unified_synthesis_node)
    
    # Define flow
    workflow.set_entry_point("detect")
    workflow.add_edge("detect", "fetch")
    workflow.add_edge("fetch", "sentiment")
    workflow.add_edge("sentiment", "indicators")
    workflow.add_edge("indicators", "synthesis")
    workflow.add_edge("synthesis", END)
    
    return workflow.compile()


# Initialize compiled graph
unified_graph = create_unified_graph()


async def run_unified_analysis(
    ticker: str,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute unified analysis workflow
    
    Args:
        ticker: Primary stock ticker
        description: Optional query/description (can include "compare" for 2-stock analysis)
    
    Returns:
        Unified analysis combining all insights
    """
    logger.info(f"Starting unified analysis for {ticker}")
    
    initial_state: UnifiedAgentState = {
        "ticker": ticker,
        "query": description,
        "is_comparison": False,
        "ticker_2": None,
        # Data fields
        "news_data": None,
        "stock_data": None,
        "sentiment_score": None,
        "sentiment_analysis": None,
        "indicators": None,
        # Comparison fields
        "news_data_2": None,
        "stock_data_2": None,
        "sentiment_score_2": None,
        "sentiment_analysis_2": None,
        "indicators_2": None,
        # Output fields
        "unified_analysis": None,
        "action_plan": None,
        "research_summary": None,
        "recommendations": None,
        "error": None,
        "timestamp": datetime.now()
    }
    
    try:
        final_state = await unified_graph.ainvoke(initial_state)
        
        logger.info("Unified analysis complete")
        
        # Format response
        return {
            "ticker": final_state.get("ticker"),
            "is_comparison": final_state.get("is_comparison", False),
            "comparison_ticker": final_state.get("ticker_2"),
            "timestamp": final_state.get("timestamp").isoformat(),
            
            # UNIFIED OUTPUT (single response combining everything)
            "analysis": final_state.get("unified_analysis"),
            "recommendations": final_state.get("action_plan"),
            
            # Raw data (for debugging/transparency)
            "sentiment": {
                "ticker_1": final_state.get("sentiment_score"),
                "ticker_2": final_state.get("sentiment_score_2")
            },
            "technical": {
                "ticker_1": final_state.get("indicators"),
                "ticker_2": final_state.get("indicators_2")
            },
            
            "error": final_state.get("error")
        }
        
    except Exception as e:
        logger.error(f"Error in unified analysis: {e}")
        return {
            "ticker": ticker,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }