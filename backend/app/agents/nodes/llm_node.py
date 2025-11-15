# backend/app/agents/nodes/llm_node.py

"""
LLM Node - Unified interface for AI reasoning
This node routes prompts to Groq or Gemini (whichever API key is available)
"""

import os
from app.services.llm_groq import query_groq
from app.services.llm_gemini import query_gemini


async def run_llm_node(symbol: str, question: str):
    """
    Executes LLM reasoning using Groq → Gemini fallback.
    Inputs:
        symbol  : stock ticker (str)
        question: query or research question (str)
    Output:
        text response from Groq or Gemini
    """

    prompt = f"""
You are a financial research assistant.
Analyze the stock: {symbol}

User question:
{question}

Provide a clear, expert financial explanation.
"""

    # Priority: Groq first (free & fast)
    if os.getenv("GROQ_API_KEY"):
        try:
            return await query_groq(prompt)
        except Exception as e:
            return f"Groq error: {str(e)}"

    # Fallback: Gemini
    if os.getenv("GEMINI_API_KEY"):
        try:
            return await query_gemini(prompt)
        except Exception as e:
            return f"Gemini error: {str(e)}"

    # If no LLM provider available
    return "No LLM provider available. Add GROQ_API_KEY or GEMINI_API_KEY in .env"
