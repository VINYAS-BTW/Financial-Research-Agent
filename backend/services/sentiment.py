from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment_batch(articles):
    results = []
    for article in articles:
        title = article.get("title", "")
        desc = article.get("description", "")
        text = f"{title}. {desc}"
        score = analyzer.polarity_scores(text)["compound"]
        sentiment = (
            "Positive" if score >= 0.05 else
            "Negative" if score <= -0.05 else
            "Neutral"
        )
        article["sentiment"] = sentiment
        article["score"] = score
        results.append(article)
    return results
