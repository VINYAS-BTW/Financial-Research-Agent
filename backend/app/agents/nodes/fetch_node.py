"""
Fetch Node - Retrieves financial data (news, stock prices, market data)
"""
from typing import Dict, Any
from datetime import datetime
import logging

from app.services.news import get_news_for_ticker
from app.services.stocks import get_stock_data, get_historical_data
from app.agents.state.agent_state import ResearchState, PortfolioState

logger = logging.getLogger(__name__)


async def fetch_research_data(state: ResearchState) -> ResearchState:
    """
    Fetch news and stock data for a single ticker
    Used in research_graph workflow
    """
    ticker = state["ticker"]
    logger.info(f"Fetching data for ticker: {ticker}")
    
    try:
        # Fetch news data
        news_data = await get_news_for_ticker(ticker, limit=20)
        
        # Fetch current stock data
        stock_data = await get_stock_data(ticker)
        
        # Fetch historical data for technical analysis
        historical_data = await get_historical_data(ticker, period="3mo")
        
        # Update state
        state["news_data"] = news_data
        state["stock_data"] = {
            "current": stock_data,
            "historical": historical_data
        }
        state["timestamp"] = datetime.now()
        
        logger.info(f"Successfully fetched data for {ticker}")
        return state
        
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {str(e)}")
        state["error"] = f"Data fetch error: {str(e)}"
        return state


async def fetch_portfolio_data(state: PortfolioState) -> PortfolioState:
    """
    Fetch data for multiple tickers in a portfolio
    Used in portfolio_graph workflow
    """
    tickers = state["tickers"]
    logger.info(f"Fetching portfolio data for {len(tickers)} tickers")
    
    stocks_data = {}
    
    try:
        for ticker in tickers:
            try:
                # Fetch news
                news = await get_news_for_ticker(ticker, limit=10)
                
                # Fetch stock data
                stock = await get_stock_data(ticker)
                
                # Fetch historical data
                historical = await get_historical_data(ticker, period="1mo")
                
                stocks_data[ticker] = {
                    "news": news,
                    "current": stock,
                    "historical": historical
                }
                
                logger.info(f"Fetched data for {ticker}")
                
            except Exception as e:
                logger.error(f"Error fetching data for {ticker}: {str(e)}")
                stocks_data[ticker] = {"error": str(e)}
        
        state["stocks_data"] = stocks_data
        state["timestamp"] = datetime.now()
        
        return state
        
    except Exception as e:
        logger.error(f"Error in portfolio fetch: {str(e)}")
        state["error"] = f"Portfolio fetch error: {str(e)}"
        return state


async def fetch_news_only(state: ResearchState) -> ResearchState:
    """
    Fetch only news data (lightweight option)
    """
    ticker = state["ticker"]
    
    try:
        news_data = await get_news_for_ticker(ticker, limit=15)
        state["news_data"] = news_data
        state["timestamp"] = datetime.now()
        
        return state
        
    except Exception as e:
        logger.error(f"Error fetching news for {ticker}: {str(e)}")
        state["error"] = f"News fetch error: {str(e)}"
        return state