# backend/app/models/watchlist_model.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class WatchlistItem(BaseModel):
    symbol: str
    notes: Optional[str] = None
    added_at: Optional[datetime] = None


class Watchlist(BaseModel):
    user_id: str
    items: List[WatchlistItem]
