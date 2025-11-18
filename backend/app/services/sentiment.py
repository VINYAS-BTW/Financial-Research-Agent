# backend/app/services/sentiment.py

from typing import List, Dict, Any
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import asyncio

analyzer = SentimentIntensityAnalyzer()


def analyze_sentiment_batch(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyze sentiment for each article using VADER.
    Does NOT modify the original list.
    """
    results = []

    for article in articles:
        if not isinstance(article, dict):
            continue  # safety fallback

        title = article.get("title", "") or ""
        desc = article.get("description", "") or ""

        text = f"{title}. {desc}".strip()

        score = analyzer.polarity_scores(text)["compound"]

        sentiment = (
            "Positive" if score >= 0.05 else
            "Negative" if score <= -0.05 else
            "Neutral"
        )

        updated_article = {**article}
        updated_article["sentiment"] = sentiment
        updated_article["score"] = score

        results.append(updated_article)

    return results


async def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Async function to analyze sentiment of a single text.
    Used by agent nodes (LangGraph).
    Returns a dict with score, label, and confidence.
    """
    loop = asyncio.get_event_loop()
    scores = await loop.run_in_executor(
        None,
        analyzer.polarity_scores,
        text
    )

    compound_score = scores["compound"]

    # Normalize -1..1 to 0..1
    normalized_score = (compound_score + 1) / 2

    if compound_score >= 0.05:
        label = "positive"
    elif compound_score <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    confidence = abs(compound_score)

    return {
        "score": round(normalized_score, 3),
        "compound": round(compound_score, 3),
        "label": label,
        "confidence": round(confidence, 3),
        "positive": round(scores["pos"], 3),
        "neutral": round(scores["neu"], 3),
        "negative": round(scores["neg"], 3),
    }


def aggregate_sentiments(sentiment_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate multiple sentiment analysis results into a single summary.
    Used by agent nodes.
    """
    if not sentiment_results:
        return {
            "score": 0.5,
            "label": "neutral",
            "confidence": 0.0,
            "count": 0,
        }

    scores = [s.get("score", 0.5) for s in sentiment_results if isinstance(s, dict)]

    if not scores:
        scores = []
        for s in sentiment_results:
            if isinstance(s, dict):
                compound = s.get("compound", 0)
                normalized = (compound + 1) / 2
                scores.append(normalized)

    if not scores:
        return {
            "score": 0.5,
            "label": "neutral",
            "confidence": 0.0,
            "count": len(sentiment_results),
        }

    avg_score = sum(scores) / len(scores)

    labels = [s.get("label", "neutral") for s in sentiment_results if isinstance(s, dict)]
    positive_count = sum(1 for l in labels if l == "positive")
    negative_count = sum(1 for l in labels if l == "negative")
    neutral_count = sum(1 for l in labels if l == "neutral")

    if avg_score >= 0.6:
        overall_label = "positive"
    elif avg_score <= 0.4:
        overall_label = "negative"
    else:
        overall_label = "neutral"

    confidences = [s.get("confidence", 0) for s in sentiment_results if isinstance(s, dict)]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    return {
        "score": round(avg_score, 3),
        "label": overall_label,
        "confidence": round(avg_confidence, 3),
        "count": len(sentiment_results),
        "positive_count": positive_count,
        "negative_count": negative_count,
        "neutral_count": neutral_count,
    }
