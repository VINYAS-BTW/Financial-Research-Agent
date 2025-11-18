"""
Fetch Node - Retrieves financial data (news, stock prices)
"""

from datetime import datetime
import logging
from typing import TYPE_CHECKING

from app.services.news import get_news_for_ticker
from app.services.stocks import get_stock_data, get_historical_data
from app.utils.error_utils import clear_error

if TYPE_CHECKING:
    from app.agents.state.agent_state import ResearchState, PortfolioState

logger = logging.getLogger(__name__)


async def fetch_research_data(state: "ResearchState") -> "ResearchState":
    clear_error(state)

    ticker = state["ticker"]
    logger.info(f"Fetching data for ticker: {ticker}")

    try:
        news_data = await get_news_for_ticker(ticker, limit=20)
        current = await get_stock_data(ticker)
        historical = await get_historical_data(ticker, period="3mo")

        state["news_data"] = news_data
        state["stock_data"] = {"current": current, "historical": historical}
        state["timestamp"] = datetime.now()

        clear_error(state)
        return state

    except Exception as e:
        logger.error(f"Fetch error: {e}")
        state["error"] = str(e)
        return state


async def fetch_portfolio_data(state: "PortfolioState") -> "PortfolioState":
    clear_error(state)

    tickers = state["tickers"]
    results = {}

    try:
        for t in tickers:
            try:
                news = await get_news_for_ticker(t, limit=10)
                current = await get_stock_data(t)
                historical = await get_historical_data(t, "1mo")

                results[t] = {
                    "news": news,
                    "current": current,
                    "historical": historical
                }

            except Exception as e:
                results[t] = {"error": str(e)}

        state["stocks_data"] = results
        state["timestamp"] = datetime.now()

        clear_error(state)
        return state

    except Exception as e:
        state["error"] = str(e)
        return state
