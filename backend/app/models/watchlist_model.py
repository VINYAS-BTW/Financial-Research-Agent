from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class WatchlistItem(BaseModel):
    symbol: str
    added_at: Optional[datetime] = None


class Watchlist(BaseModel):
    user_id: str
    items: List[WatchlistItem]
