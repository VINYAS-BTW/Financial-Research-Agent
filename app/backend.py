from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("NEWS_API_KEY", "655558496649450db82e67900acc199d")


class StockRequest(BaseModel):
    symbol: str
    period: str = "3mo"


class NewsRequest(BaseModel):
    symbol: str


@app.get("/")
def read_root():
    return {"message": "Financial Research API", "status": "active"}


@app.post("/api/stock-data")
def get_stock_data(request: StockRequest):
    """Fetch stock data with technical indicators."""
    try:
        symbol = request.symbol.upper().strip()
        period = request.period
        
        # Download data
        data = yf.download(symbol, period=period, progress=False)
        
        if data.empty:
            raise HTTPException(status_code=404, detail=f"No data for {symbol}")
        
        # Handle multi-index
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)
        
        if "Close" not in data.columns:
            raise HTTPException(status_code=404, detail=f"No Close price data for {symbol}")
        
        data = data.dropna(subset=["Close"])
        
        if len(data) < 20:
            raise HTTPException(status_code=400, detail=f"Insufficient data: {len(data)} days")
        
        # Calculate indicators
        data["MA20"] = data["Close"].rolling(window=20).mean()
        
        # RSI
        delta = data["Close"].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(14).mean()
        avg_loss = loss.rolling(14).mean()
        avg_loss = avg_loss.replace(0, 1e-10)
        rs = avg_gain / avg_loss
        data["RSI"] = 100 - (100 / (1 + rs))
        
        # Reset index and convert to JSON
        data = data.reset_index()
        data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
        
        # Calculate metrics
        latest_price = float(data['Close'].iloc[-1])
        price_change = float(data['Close'].iloc[-1] - data['Close'].iloc[-2]) if len(data) > 1 else 0
        price_change_pct = (price_change / float(data['Close'].iloc[-2]) * 100) if len(data) > 1 else 0
        period_return = ((float(data['Close'].iloc[-1]) - float(data['Close'].iloc[0])) / float(data['Close'].iloc[0]) * 100)
        
        # Prepare response
        result = {
            "symbol": symbol,
            "data": data[["Date", "Close", "MA20", "RSI"]].to_dict(orient="records"),
            "metrics": {
                "latest_price": latest_price,
                "price_change": price_change,
                "price_change_pct": price_change_pct,
                "period_return": period_return,
                "latest_rsi": float(data['RSI'].iloc[-1]) if not pd.isna(data['RSI'].iloc[-1]) else None,
                "data_points": len(data)
            }
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/news")
def get_news(request: NewsRequest):
    """Fetch news articles with sentiment analysis."""
    try:
        symbol = request.symbol.upper().strip()
        company_name = symbol.replace(".NS", "").replace(".BO", "")
        
        if not API_KEY or API_KEY.strip() == "":
            raise HTTPException(status_code=400, detail="API key not configured")
        
        # Fetch news
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": company_name,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 10,
            "apiKey": API_KEY.strip()
        }
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid API key")
        elif response.status_code == 429:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        elif response.status_code != 200:
            error_msg = response.json().get("message", f"HTTP {response.status_code}")
            raise HTTPException(status_code=response.status_code, detail=error_msg)
        
        result = response.json()
        articles = result.get("articles", [])
        
        if not articles:
            return {
                "symbol": symbol,
                "articles": [],
                "sentiment_summary": None,
                "message": f"No news found for {company_name}"
            }
        
        # Analyze sentiment
        analyzer = SentimentIntensityAnalyzer()
        sentiment_data = []
        sentiments = []
        
        for article in articles[:8]:
            title = article.get("title", "No title")
            description = article.get("description", "")
            
            full_text = f"{title}. {description}" if description else title
            scores = analyzer.polarity_scores(full_text)
            compound = scores['compound']
            sentiments.append(compound)
            
            if compound >= 0.05:
                sentiment = "Positive"
                color = "green"
            elif compound <= -0.05:
                sentiment = "Negative"
                color = "red"
            else:
                sentiment = "Neutral"
                color = "yellow"
            
            sentiment_data.append({
                "title": title,
                "description": description,
                "sentiment": sentiment,
                "color": color,
                "score": compound,
                "source": article.get("source", {}).get("name", "Unknown"),
                "date": article.get("publishedAt", "")[:10],
                "url": article.get("url", "#")
            })
        
        # Summary
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
        positive_count = sum(1 for s in sentiments if s >= 0.05)
        neutral_count = sum(1 for s in sentiments if -0.05 < s < 0.05)
        negative_count = sum(1 for s in sentiments if s <= -0.05)
        
        return {
            "symbol": symbol,
            "articles": sentiment_data,
            "sentiment_summary": {
                "avg_score": avg_sentiment,
                "positive_count": positive_count,
                "neutral_count": neutral_count,
                "negative_count": negative_count,
                "overall": "Positive" if avg_sentiment >= 0.05 else "Negative" if avg_sentiment <= -0.05 else "Neutral"
            }
        }
        
    except HTTPException:
        raise
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)