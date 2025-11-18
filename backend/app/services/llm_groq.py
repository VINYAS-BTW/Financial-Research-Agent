# backend/app/services/llm_groq.py

import os
import aiohttp

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"   # free & fast model


async def query_groq(prompt: str) -> str:
    """
    Calls Groq Llama3 model.
    Returns the text output.
    """
    if not GROQ_API_KEY:
        return "Groq API key not found."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(GROQ_URL, json=payload, headers=headers) as res:
            data = await res.json()

            if "choices" in data:
                return data["choices"][0]["message"]["content"]

            return f"Groq API Error: {data}"
