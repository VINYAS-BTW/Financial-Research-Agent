# backend/app/utils/helpers.py
from datetime import datetime, timezone
from typing import List
import itertools


def to_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def ensure_list(obj):
    if obj is None:
        return []
    if isinstance(obj, list):
        return obj
    return [obj]


def chunked(iterable, size):
    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, size))
        if not chunk:
            break
        yield chunk
