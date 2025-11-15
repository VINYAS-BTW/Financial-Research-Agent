# backend/app/tests/test_watchlist.py
import pytest
from datetime import datetime
from ..models.watchlist_model import WatchlistItem


def test_watchlist_item_model():
    item = WatchlistItem(
        user_id="u1",
        symbol="AAPL",
        created_at=datetime.utcnow()
    )

    assert item.user_id == "u1"
    assert item.symbol == "AAPL"
    assert isinstance(item.created_at, datetime)
