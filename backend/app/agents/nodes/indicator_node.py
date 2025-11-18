"""
Indicator Node
"""

import logging
from app.services.indicators import (
    calculate_rsi, calculate_macd,
    calculate_bollinger_bands, calculate_moving_averages
)
from app.utils.error_utils import clear_error
from app.agents.state.agent_state import ResearchState, PortfolioState

logger = logging.getLogger(__name__)


async def calculate_research_indicators(state: ResearchState):
    clear_error(state)

    hist = state.get("stock_data", {}).get("historical") or []
    if not hist:
        state["indicators"] = {"error": "no historical data"}
        return state

    try:
        rsi = calculate_rsi(hist)
        macd = calculate_macd(hist)
        bb = calculate_bollinger_bands(hist)
        ma = calculate_moving_averages(hist)

        state["indicators"] = {
            "rsi": rsi,
            "macd": macd,
            "bollinger_bands": bb,
            "moving_averages": ma,
            "signals": {"overall_signal": "hold", "strength": 0}
        }

        clear_error(state)
        return state

    except Exception as e:
        state["error"] = str(e)
        return state


async def calculate_portfolio_indicators(state: PortfolioState) -> PortfolioState:
    """
    Calculate technical indicators for all tickers in a portfolio
    """
    clear_error(state)
    
    stocks_data = state.get("stocks_data") or {}
    if not stocks_data:
        state["technical_signals"] = {}
        return state
    
    try:
        technical_signals = {}
        
        for ticker, data in stocks_data.items():
            if "error" in data:
                technical_signals[ticker] = {"error": "no data"}
                continue
            
            hist = data.get("historical", [])
            if not hist:
                technical_signals[ticker] = {"error": "no historical data"}
                continue
            
            try:
                rsi = calculate_rsi(hist)
                macd = calculate_macd(hist)
                bb = calculate_bollinger_bands(hist)
                ma = calculate_moving_averages(hist)
                
                technical_signals[ticker] = {
                    "rsi": rsi,
                    "macd": macd,
                    "bollinger_bands": bb,
                    "moving_averages": ma,
                    "signals": {"overall_signal": "hold", "strength": 0}
                }
            except Exception as e:
                logger.error(f"Indicator error for {ticker}: {e}")
                technical_signals[ticker] = {"error": str(e)}
        
        state["technical_signals"] = technical_signals
        clear_error(state)
        return state
        
    except Exception as e:
        logger.error(f"Portfolio indicators error: {e}")
        state["error"] = str(e)
        return state
