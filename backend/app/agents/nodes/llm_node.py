# backend/app/agents/nodes/llm_node.py

import logging
import asyncio
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Optional imports – we guard them so app doesn't crash if libs missing
try:
    from groq import Groq  # type: ignore
except ImportError:
    Groq = None  # type: ignore

try:
    import google.generativeai as genai  # type: ignore
except ImportError:
    genai = None  # type: ignore


def _get_groq_client():
    api_key = getattr(settings, "GROQ_API_KEY", "") or ""
    if not api_key or Groq is None:
        return None
    return Groq(api_key=api_key)


def _get_gemini_model(model_name: str = "gemini-2.5-flash"):
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key or genai is None:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


async def _call_groq_chat(prompt: str, model: str = "llama-3.3-70b-versatile") -> str:
    client = _get_groq_client()
    if client is None:
        raise RuntimeError("Groq client not available or GROQ_API_KEY missing")

    def _run():
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial research assistant. "
                               "Be precise, structured, and explain reasoning clearly.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,  # Reduced for concise responses
        )
        return resp.choices[0].message.content

    return await asyncio.to_thread(_run)


async def _call_gemini(prompt: str, model_name: str = "gemini-2.5-flash") -> str:
    model = _get_gemini_model(model_name)
    if model is None:
        raise RuntimeError("Gemini model not available or GEMINI_API_KEY missing")

    def _run():
        resp = model.generate_content(prompt)
        # generative-ai returns .text
        return getattr(resp, "text", "").strip()

    return await asyncio.to_thread(_run)


async def run_llm_node(
    model: str,
    prompt: str,
    ticker: Optional[str] = None,
) -> str:
    """
    Unified LLM node used by:
      - /api/agents/llm
      - agent_utils (research summary & recommendations)

    model:
      - "combo"       -> Groq (deep analysis) + Gemini (final summary)
      - "groq"        -> Groq default (llama-3.3-70b-versatile)
      - "gemini"      -> Gemini default (gemini-2.5-flash)
      - "auto"        -> prefer Groq, fallback Gemini
      - or a concrete model name like "llama-3.1-8b-instant", "gemini-1.5-pro", etc.
    """
    base_context = f"Ticker: {ticker}" if ticker else ""

    # Normalize model hint
    m = (model or "").lower().strip()

    try:
        # -------- COMBO MODE --------
        if m == "combo":
            groq_client = _get_groq_client()
            gemini_model = _get_gemini_model()

            if groq_client and gemini_model:
                try:
                    # 1) Groq: deep reasoning
                    analysis_prompt = (
                        f"{base_context}\n\n"
                        f"Do a deep, technical + sentiment-based analysis.\n\n"
                        f"USER DATA:\n{prompt}"
                    )
                    groq_text = await _call_groq_chat(analysis_prompt)

                    # 2) Gemini: compress into clean summary
                    gemini_prompt = (
                        "You are a financial writer.\n"
                        "Rewrite the following analysis into a very concise summary "
                        "for an intermediate retail investor. Keep it under 100 words, "
                        "with 2-3 key bullet points and a 1-line conclusion.\n\n"
                        f"RAW ANALYSIS:\n{groq_text}"
                    )
                    final_text = await _call_gemini(gemini_prompt)
                    return final_text or groq_text
                except Exception as e:
                    logger.warning(f"Combo mode failed, falling back to single LLM: {e}")
                    # Fall through to single LLM fallback

            # Fallback if only one is available (or combo failed)
            if groq_client:
                return await _call_groq_chat(prompt)
            if gemini_model:
                return await _call_gemini(prompt)

            # If neither is available, fall back to auto mode behavior
            logger.warning("Combo mode requested but no LLM APIs available, falling back to auto")
            # Don't raise error, let it fall through to auto mode

        # -------- GROQ-ONLY MODE --------
        if m == "groq" or m.startswith("groq-") or m.startswith("llama") or m.startswith("mixtral") or m.startswith("gemma"):
            # Check if Groq is available first
            if not _get_groq_client():
                return "[LLM_ERROR] Groq client not available or GROQ_API_KEY missing"
            
            # Handle groq- prefixed models (e.g., "groq-llama3" -> extract model name)
            if m.startswith("groq-"):
                # Extract model name after "groq-" prefix
                groq_model = model[5:] if len(model) > 5 else "llama-3.3-70b-versatile"
                # Map common variations to supported models
                if groq_model == "llama3" or groq_model == "llama3-70b" or groq_model == "llama3-70b-8192" or groq_model == "llama-3.1-70b":
                    groq_model = "llama-3.3-70b-versatile"
                elif groq_model == "llama3-8b" or groq_model == "llama3-8b-8192":
                    groq_model = "llama-3.1-8b-instant"
                return await _call_groq_chat(prompt, model=groq_model)
            return await _call_groq_chat(prompt, model=model or "llama-3.3-70b-versatile")

        # -------- GEMINI-ONLY MODE --------
        if m == "gemini" or m.startswith("gemini-"):
            # Check if Gemini is available first
            if not _get_gemini_model():
                return "[LLM_ERROR] Gemini model not available or GEMINI_API_KEY missing"
            # If just "gemini", use default model
            if m == "gemini":
                return await _call_gemini(prompt, model_name="gemini-2.5-flash")
            else:
                # Map common model name variations to actual available models
                gemini_model = model
                if gemini_model == "gemini-pro":
                    gemini_model = "gemini-2.5-pro"  # Use latest pro model
                elif gemini_model == "gemini-1.5-pro":
                    gemini_model = "gemini-2.5-pro"  # Upgrade to 2.5
                elif gemini_model == "gemini-1.5-flash":
                    gemini_model = "gemini-2.5-flash"  # Upgrade to 2.5
                elif gemini_model == "gemini-2.0-flash":
                    gemini_model = "gemini-2.5-flash"  # Use latest flash
                # Use the mapped model name
                return await _call_gemini(prompt, model_name=gemini_model)

        # -------- AUTO MODE --------
        if m == "auto" or not m:
            if _get_groq_client():
                return await _call_groq_chat(prompt)
            if _get_gemini_model():
                return await _call_gemini(prompt)
            # No API keys available - return error string without raising exception
            # This is expected behavior when LLM keys aren't configured
            return "[LLM_ERROR] No LLM API keys available (Groq/Gemini)"

        # Unknown hint -> try auto
        if _get_groq_client():
            return await _call_groq_chat(prompt, model="llama-3.3-70b-versatile")
        if _get_gemini_model():
            return await _call_gemini(prompt, model_name="gemini-2.5-flash")

        # Unsupported model and no backends - return error string
        return f"[LLM_ERROR] Unsupported model '{model}' and no LLM backends available"

    except Exception as e:
        # Only log actual errors (network issues, API failures, etc.)
        # Not the expected "no API keys" case
        error_msg = str(e)
        if "API keys" in error_msg or "not available" in error_msg:
            # This is expected - don't log as error
            return f"[LLM_ERROR] {error_msg}"
        else:
            # This is an actual error - log it
            logger.error(f"LLM node error (model={model}): {e}")
            return f"[LLM_ERROR] {error_msg}"
