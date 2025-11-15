# app/services/llm_groq.py
import os
import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "mixtral-8x7b-32768"      # or "llama3-8b-8192" / "gemma-7b-it"


async def query_groq(prompt: str):
    if not GROQ_API_KEY:
        return "Groq API key missing."

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, headers=headers, json=payload)
        data = r.json()

    try:
        return data["choices"][0]["message"]["content"]
    except:
        return str(data)
