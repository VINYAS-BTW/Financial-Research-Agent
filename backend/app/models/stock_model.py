# backend/app/models/stock_model.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PricePoint(BaseModel):
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: Optional[int] = None


class StockSeries(BaseModel):
    symbol: str
    prices: List[PricePoint]


class IndicatorResult(BaseModel):
    symbol: str
    indicator: str
    period: int
    values: List[float]
