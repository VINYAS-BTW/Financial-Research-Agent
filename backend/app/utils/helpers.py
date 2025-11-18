# backend/app/utils/helpers.py
from datetime import datetime, timezone
from typing import List, Any, Iterable
import itertools


def to_iso(dt: datetime) -> str:
    """
    Convert datetime to ISO 8601 string, ensuring UTC timezone.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def ensure_list(obj: Any) -> List[Any]:
    """
    Ensure the input is always returned as a list.
    """
    if obj is None:
        return []
    if isinstance(obj, list):
        return obj
    return [obj]


def chunked(iterable: Iterable[Any], size: int):
    """
    Yield lists of size `size` from the iterable.
    """
    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, size))
        if not chunk:
            break
        yield chunk
