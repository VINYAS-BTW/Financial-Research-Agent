# backend/app/services/llm_gemini.py

import os
import aiohttp

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"


async def query_gemini(prompt: str) -> str:
    """
    Calls Gemini Pro LLM.
    """
    if not GEMINI_API_KEY:
        return "Gemini API key not found."

    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(GEMINI_URL, json=payload, headers=headers) as res:
            data = await res.json()

            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except:
                return f"Gemini API Error: {data}"
