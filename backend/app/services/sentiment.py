from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import List, Dict, Any

analyzer = SentimentIntensityAnalyzer()


def analyze_sentiment_batch(articles: List[Dict[str, Any]]):
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

        # create a new dict to avoid mutating original input
        updated_article = {**article}
        updated_article["sentiment"] = sentiment
        updated_article["score"] = score

        results.append(updated_article)

    return results
