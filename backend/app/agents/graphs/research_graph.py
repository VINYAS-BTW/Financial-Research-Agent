# backend/app/agents/graphs/research_graph.py

"""
Research Graph - Multi-step AI workflow for comprehensive stock research
Orchestrates: data fetching -> sentiment analysis -> technical indicators -> research summary
"""

from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END  # type: ignore
from datetime import datetime
import logging

from app.agents.state.agent_state import ResearchState
from app.agents.nodes.fetch_node import fetch_research_data
from app.agents.nodes.sentiment_node import analyze_research_sentiment
from app.agents.nodes.indicator_node import calculate_research_indicators
from app.utils.agent_utils import (
    create_research_summary,
    generate_recommendations,
    calculate_risk_score,
    log_state_transition,
)

logger = logging.getLogger(__name__)


async def synthesis_node(state: ResearchState) -> ResearchState:
    """
    Final synthesis node - combines all analysis into actionable insights.
    Uses LLM combo mode for summary and recommendations.
    """
    ticker = state.get("ticker", "UNKNOWN")
    logger.info(f"Synthesizing research for {ticker}")

    try:
        summary = await create_research_summary(state)
        recos = await generate_recommendations(state)
        risk_score = calculate_risk_score(state)

        state["research_summary"] = summary
        state["recommendations"] = recos
        if state.get("indicators") is None:
            state["indicators"] = {}
        state["indicators"]["risk_score"] = risk_score

        logger.info(f"Research synthesis complete for {ticker} (risk_score={risk_score})")
        return state

    except Exception as e:
        logger.error(f"Error in synthesis: {str(e)}")
        state["error"] = f"Synthesis error: {str(e)}"
        return state


def should_continue_after_fetch(state: ResearchState) -> str:
    """
    Conditional edge after fetch node.
    """
    if state.get("error"):
        logger.warning("Error in fetch, skipping to synthesis")
        return "synthesis"

    if not state.get("news_data") and not state.get("stock_data"):
        logger.warning("No data fetched, ending early")
        return END

    return "sentiment"


def should_continue_after_sentiment(state: ResearchState) -> str:
    """
    Conditional edge after sentiment node.
    """
    err = state.get("error")
    if err is None:
            state.pop("error", None)  # remove phantom error
    return "indicators"



def should_continue_after_indicators(state: ResearchState) -> str:
    """
    Conditional edge after indicators node.
    """
    return "synthesis"


def create_research_graph() -> Any:
    """
    Create the research workflow graph.

    Flow:
    START -> fetch_data -> sentiment_analysis -> technical_indicators -> synthesis -> END
    """
    workflow = StateGraph(ResearchState)

    workflow.add_node("fetch", fetch_research_data)
    workflow.add_node("sentiment", analyze_research_sentiment)
    workflow.add_node("indicators", calculate_research_indicators)
    workflow.add_node("synthesis", synthesis_node)

    workflow.set_entry_point("fetch")

    workflow.add_conditional_edges(
        "fetch",
        should_continue_after_fetch,
        {
            "sentiment": "sentiment",
            "synthesis": "synthesis",
            END: END,
        },
    )

    workflow.add_conditional_edges(
        "sentiment",
        should_continue_after_sentiment,
        {
            "indicators": "indicators",
        },
    )

    workflow.add_conditional_edges(
        "indicators",
        should_continue_after_indicators,
        {
            "synthesis": "synthesis",
        },
    )

    workflow.add_edge("synthesis", END)

    return workflow.compile()


research_graph = create_research_graph()


async def run_research_analysis(ticker: str, query: Optional[str] = None) -> Dict[str, Any]:
    """
    Execute the research workflow for a given ticker.
    """
    logger.info(f"Starting research analysis for {ticker}")

    initial_state: ResearchState = {
        "ticker": ticker,
        "query": query,
        "news_data": None,
        "stock_data": None,
        "sentiment_score": None,
        "sentiment_analysis": None,
        "indicators": None,
        "research_summary": None,
        "recommendations": None,
        "error": None,
        "timestamp": datetime.now(),
    }

    try:
        final_state = await research_graph.ainvoke(initial_state)

        if final_state.get("error"):
            logger.error(f"Error in state for {ticker}: {final_state['error']}")
        else:
            logger.info(f"Research analysis complete for {ticker}")

        # Format response to match frontend expectations
        return {
            "ticker": final_state.get("ticker", ticker),
            "timestamp": final_state.get("timestamp", datetime.now()).isoformat(),
            "sentiment": {
                "score": final_state.get("sentiment_score"),
                "analysis": final_state.get("sentiment_analysis"),
            },
            "technical": final_state.get("indicators"),
            "summary": final_state.get("research_summary"),
            "ai_summary": final_state.get("research_summary"),  # Frontend expects this
            "recommendations": final_state.get("recommendations"),
            "risk_score": (final_state.get("indicators") or {}).get("risk_score"),
            "error": final_state.get("error"),
            # Add steps for frontend visualization
            "steps": [
                {
                    "type": "fetch",
                    "content": f"Fetched stock data and news for {ticker}",
                    "status": "completed" if final_state.get("stock_data") else "failed"
                },
                {
                    "type": "sentiment",
                    "content": f"Sentiment analysis: {final_state.get('sentiment_score', 0.5):.2f}",
                    "status": "completed" if final_state.get("sentiment_analysis") else "failed"
                },
                {
                    "type": "indicators",
                    "content": "Calculated technical indicators",
                    "status": "completed" if final_state.get("indicators") else "failed"
                },
                {
                    "type": "synthesis",
                    "content": "Generated research summary and recommendations",
                    "status": "completed" if final_state.get("research_summary") else "failed"
                }
            ]
        }

    except Exception as e:
        logger.error(f"Error running research graph for {ticker}: {str(e)}")
        return {
            "ticker": ticker,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }
