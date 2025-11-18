from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NewsArticle(BaseModel):
    title: str
    description: Optional[str]
    url: str
    source: Optional[str]
    published_at: datetime
    sentiment: Optional[str] = None
    score: Optional[float] = None


class NewsResponse(BaseModel):
    query: str                   # ✔ must match what news_routes returns
    articles: List[NewsArticle]
