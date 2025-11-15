"""
Indicator Node - Calculates technical indicators and generates trading signals
"""
from typing import Dict, Any
import logging

from app.services.indicators import (
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_moving_averages
)
from app.agents.state.agent_state import ResearchState, PortfolioState

logger = logging.getLogger(__name__)


async def calculate_research_indicators(state: ResearchState) -> ResearchState:
    """
    Calculate technical indicators for research workflow
    """
    stock_data = state.get("stock_data", {})
    historical_data = stock_data.get("historical", [])
    
    if not historical_data:
        logger.warning("No historical data available for indicator calculation")
        state["indicators"] = {"error": "No historical data"}
        return state
    
    try:
        # Calculate all indicators
        rsi = calculate_rsi(historical_data)
        macd = calculate_macd(historical_data)
        bollinger = calculate_bollinger_bands(historical_data)
        moving_avgs = calculate_moving_averages(historical_data)
        
        # Generate signals
        signals = generate_trading_signals(rsi, macd, bollinger, moving_avgs)
        
        state["indicators"] = {
            "rsi": rsi,
            "macd": macd,
            "bollinger_bands": bollinger,
            "moving_averages": moving_avgs,
            "signals": signals,
            "summary": summarize_indicators(signals)
        }
        
        logger.info(f"Technical indicators calculated: {signals['overall_signal']}")
        return state
        
    except Exception as e:
        logger.error(f"Error calculating indicators: {str(e)}")
        state["error"] = f"Indicator calculation error: {str(e)}"
        return state


async def calculate_portfolio_indicators(state: PortfolioState) -> PortfolioState:
    """
    Calculate technical indicators for all tickers in portfolio
    """
    stocks_data = state.get("stocks_data", {})
    technical_signals = {}
    
    try:
        for ticker, data in stocks_data.items():
            if "error" in data:
                technical_signals[ticker] = {"error": data["error"]}
                continue
            
            historical = data.get("historical", [])
            if not historical:
                technical_signals[ticker] = {"error": "No historical data"}
                continue
            
            # Calculate indicators
            rsi = calculate_rsi(historical)
            macd = calculate_macd(historical)
            bollinger = calculate_bollinger_bands(historical)
            moving_avgs = calculate_moving_averages(historical)
            
            # Generate signals
            signals = generate_trading_signals(rsi, macd, bollinger, moving_avgs)
            
            technical_signals[ticker] = {
                "rsi": rsi,
                "macd": macd,
                "signals": signals,
                "summary": summarize_indicators(signals)
            }
        
        state["technical_signals"] = technical_signals
        logger.info(f"Portfolio indicators calculated for {len(technical_signals)} tickers")
        
        return state
        
    except Exception as e:
        logger.error(f"Error in portfolio indicators: {str(e)}")
        state["error"] = f"Portfolio indicators error: {str(e)}"
        return state


def generate_trading_signals(
    rsi: Dict[str, Any],
    macd: Dict[str, Any],
    bollinger: Dict[str, Any],
    moving_avgs: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate trading signals based on technical indicators
    """
    signals = {
        "rsi_signal": None,
        "macd_signal": None,
        "bollinger_signal": None,
        "ma_signal": None,
        "overall_signal": None,
        "strength": 0
    }
    
    # RSI signals
    current_rsi = rsi.get("current", 50)
    if current_rsi < 30:
        signals["rsi_signal"] = "oversold_buy"
        signals["strength"] += 1
    elif current_rsi > 70:
        signals["rsi_signal"] = "overbought_sell"
        signals["strength"] -= 1
    else:
        signals["rsi_signal"] = "neutral"
    
    # MACD signals
    macd_line = macd.get("macd", 0)
    signal_line = macd.get("signal", 0)
    if macd_line > signal_line:
        signals["macd_signal"] = "bullish"
        signals["strength"] += 1
    elif macd_line < signal_line:
        signals["macd_signal"] = "bearish"
        signals["strength"] -= 1
    else:
        signals["macd_signal"] = "neutral"
    
    # Bollinger Bands signals
    current_price = bollinger.get("current_price", 0)
    lower_band = bollinger.get("lower_band", 0)
    upper_band = bollinger.get("upper_band", 0)
    
    if current_price < lower_band:
        signals["bollinger_signal"] = "oversold_buy"
        signals["strength"] += 1
    elif current_price > upper_band:
        signals["bollinger_signal"] = "overbought_sell"
        signals["strength"] -= 1
    else:
        signals["bollinger_signal"] = "neutral"
    
    # Moving Average signals
    sma_50 = moving_avgs.get("sma_50", 0)
    sma_200 = moving_avgs.get("sma_200", 0)
    
    if sma_50 > sma_200:
        signals["ma_signal"] = "golden_cross_buy"
        signals["strength"] += 1
    elif sma_50 < sma_200:
        signals["ma_signal"] = "death_cross_sell"
        signals["strength"] -= 1
    else:
        signals["ma_signal"] = "neutral"
    
    # Overall signal
    if signals["strength"] >= 2:
        signals["overall_signal"] = "strong_buy"
    elif signals["strength"] == 1:
        signals["overall_signal"] = "buy"
    elif signals["strength"] == -1:
        signals["overall_signal"] = "sell"
    elif signals["strength"] <= -2:
        signals["overall_signal"] = "strong_sell"
    else:
        signals["overall_signal"] = "hold"
    
    return signals


def summarize_indicators(signals: Dict[str, Any]) -> str:
    """
    Create human-readable summary of indicator signals
    """
    overall = signals["overall_signal"]
    strength = abs(signals["strength"])
    
    summaries = {
        "strong_buy": f"Strong buy signal with {strength} bullish indicators",
        "buy": f"Buy signal with {strength} bullish indicator(s)",
        "hold": "Neutral signal, hold position",
        "sell": f"Sell signal with {strength} bearish indicator(s)",
        "strong_sell": f"Strong sell signal with {strength} bearish indicators"
    }
    
    return summaries.get(overall, "Unable to determine signal")