# backend/app/utils/cache.py
import asyncio
import json
from typing import Optional
import redis.asyncio as redis
from ..config import settings

_redis: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    """
    Returns a globally reused Redis async client.
    Safe for FastAPI.
    """
    global _redis
    if _redis is None:
        _redis = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
    return _redis


async def get_cached(key: str) -> Optional[dict]:
    r = get_redis()
    v = await r.get(key)
    if not v:
        return None

    try:
        return json.loads(v)
    except Exception:
        return None


async def set_cached(key: str, value: dict, expire: int = 300):
    r = get_redis()
    await r.set(key, json.dumps(value, default=str), ex=expire)


async def close_redis():
    """
    Closes Redis gracefully.
    (Avoids crash if Redis not initialized)
    """
    global _redis
    if _redis is not None:
        try:
            await _redis.close()
        except Exception:
            pass
        _redis = None
