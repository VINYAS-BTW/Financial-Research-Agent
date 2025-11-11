# backend/app/tests/test_watchlist.py
import pytest
from ..models.watchlist_model import Watchlist, WatchlistItem
from datetime import datetime

def test_watchlist_model():
    w = Watchlist(user_id="u1", items=[WatchlistItem(symbol="AAPL", notes="test", added_at=datetime.utcnow())])
    assert w.user_id == "u1"
    assert len(w.items) == 1
