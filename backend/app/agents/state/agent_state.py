"""
Agent State Definitions for LangGraph Workflows
Defines the state schemas used across different agent graphs
"""
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime


class ResearchState(TypedDict):
    """State for research workflow"""
    ticker: str
    query: Optional[str]
    news_data: Optional[List[Dict[str, Any]]]
    stock_data: Optional[Dict[str, Any]]
    sentiment_score: Optional[float]
    sentiment_analysis: Optional[Dict[str, Any]]
    indicators: Optional[Dict[str, Any]]
    research_summary: Optional[str]
    recommendations: Optional[List[str]]
    error: Optional[str]
    timestamp: datetime


class SentimentState(TypedDict):
    """State for sentiment analysis workflow"""
    texts: List[str]
    sources: Optional[List[str]]
    individual_sentiments: Optional[List[Dict[str, Any]]]
    aggregated_sentiment: Optional[Dict[str, Any]]
    confidence_score: Optional[float]
    key_topics: Optional[List[str]]
    error: Optional[str]


class PortfolioState(TypedDict):
    """State for portfolio analysis workflow"""
    tickers: List[str]
    watchlist_id: Optional[int]
    stocks_data: Optional[Dict[str, Dict[str, Any]]]
    sentiment_scores: Optional[Dict[str, float]]
    technical_signals: Optional[Dict[str, Dict[str, Any]]]
    portfolio_summary: Optional[Dict[str, Any]]
    recommendations: Optional[List[Dict[str, Any]]]
    risk_metrics: Optional[Dict[str, Any]]
    error: Optional[str]
    timestamp: datetime


class AgentMessage(TypedDict):
    """Standard message format for inter-node communication"""
    node: str
    status: str  # "success", "error", "pending"
    data: Optional[Any]
    message: Optional[str]
    timestamp: datetime