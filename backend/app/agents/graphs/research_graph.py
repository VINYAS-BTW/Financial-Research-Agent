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
from app.agents.utils.agent_utils import (
    create_research_summary,
    generate_recommendations,
    calculate_risk_score,
    log_state_transition
)
# ⭐ Added: LLM node (Gemini/Groq)
from app.agents.nodes.llm_node import run_llm_node

logger = logging.getLogger(__name__)


async def synthesis_node(state: ResearchState) -> ResearchState:
    """
    Final synthesis node - combines all analysis into actionable insights
    """
    logger.info(f"Synthesizing research for {state['ticker']}")
    
    try:
        # Generate comprehensive summary
        state["research_summary"] = create_research_summary(state)
        
        # ⭐ Added: AI-powered summary via Gemini/Groq LLM
        try:
            question = state.get("query") or f"Provide a detailed research summary and insights for {state['ticker']}."
            llm_result = await run_llm_node(state["ticker"], question)
            state["ai_summary"] = llm_result
        except Exception as e:
            logger.error(f"Error in LLM synthesis: {str(e)}")
            state["ai_summary"] = f"LLM error: {str(e)}"
        
        # Generate recommendations
        state["recommendations"] = generate_recommendations(state)
        
        # Calculate risk score
        risk_score = calculate_risk_score(state)
        
        # Add metadata
        if "indicators" not in state:
            state["indicators"] = {}
        state["indicators"]["risk_score"] = risk_score
        
        logger.info(f"Research synthesis complete for {state['ticker']}")
        return state
        
    except Exception as e:
        logger.error(f"Error in synthesis: {str(e)}")
        state["error"] = f"Synthesis error: {str(e)}"
        return state


def should_continue_after_fetch(state: ResearchState) -> str:
    """
    Conditional edge after fetch node
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
    Conditional edge after sentiment node
    """
    if state.get("error"):
        # Continue anyway, we can still do technical analysis
        logger.warning("Error in sentiment, continuing to indicators")
    
    return "indicators"


def should_continue_after_indicators(state: ResearchState) -> str:
    """
    Conditional edge after indicators node
    """
    # Always continue to synthesis
    return "synthesis"


# Build the research graph
def create_research_graph() -> Any:
    """
    Create the research workflow graph
    
    Flow:
    START -> fetch_data -> sentiment_analysis -> technical_indicators -> synthesis -> END
    """
    workflow = StateGraph(ResearchState)
    
    # Add nodes
    workflow.add_node("fetch", fetch_research_data)
    workflow.add_node("sentiment", analyze_research_sentiment)
    workflow.add_node("indicators", calculate_research_indicators)
    workflow.add_node("synthesis", synthesis_node)
    
    # Add edges
    workflow.set_entry_point("fetch")
    
    # Conditional routing after each node
    workflow.add_conditional_edges(
        "fetch",
        should_continue_after_fetch,
        {
            "sentiment": "sentiment",
            "synthesis": "synthesis",
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
            "synthesis": "synthesis"
        }
    )
    
    workflow.add_edge("synthesis", END)
    
    return workflow.compile()


# Initialize the compiled graph
research_graph = create_research_graph()


async def run_research_analysis(ticker: str, query: Optional[str] = None) -> Dict[str, Any]:
    """
    Execute the research workflow for a given ticker
    
    Args:
        ticker: Stock ticker symbol
        query: Optional specific research query
    
    Returns:
        Complete research analysis results
    """
    logger.info(f"Starting research analysis for {ticker}")
    
    # Initialize state
    initial_state: ResearchState = {
        "ticker": ticker,
        "query": query,
        "news_data": None,
        "stock_data": None,
        "sentiment_score": None,
        "sentiment_analysis": None,
        "indicators": None,
        "research_summary": None,
        "ai_summary": None,   # ⭐ Added: LLM result field in state
        "recommendations": None,
        "error": None,
        "timestamp": datetime.now()
    }
    
    try:
        # Run the graph
        final_state = await research_graph.ainvoke(initial_state)
        
        logger.info(f"Research analysis complete for {ticker}")
        
        # Format output
        return {
            "ticker": final_state["ticker"],
            "timestamp": final_state["timestamp"].isoformat(),
            "sentiment": {
                "score": final_state.get("sentiment_score"),
                "analysis": final_state.get("sentiment_analysis")
            },
            "technical": final_state.get("indicators"),
            "summary": final_state.get("research_summary"),
            "ai_summary": final_state.get("ai_summary"),  # ⭐ Added: expose LLM summary
            "recommendations": final_state.get("recommendations"),
            "risk_score": final_state.get("indicators", {}).get("risk_score"),
            "error": final_state.get("error")
        }
        
    except Exception as e:
        logger.error(f"Error running research graph: {str(e)}")
        return {
            "ticker": ticker,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
