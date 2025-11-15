# app/services/llm_gemini.py
import os
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-pro"


async def query_gemini(prompt: str):
    if not GEMINI_API_KEY:
        return "Gemini API key missing."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    params = {"key": GEMINI_API_KEY}

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, params=params, json=payload)
        data = r.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except:
        return str(data)
