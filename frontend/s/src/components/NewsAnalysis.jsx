import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { fetchNewsData } from "../api";

function NewsAnalysis({ symbol1, symbol2 ,trigger}) {
  const [news1, setNews1] = useState([]);
  const [news2, setNews2] = useState([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  useEffect(() => {
  async function loadNews() {
    if (!symbol1) return; // ✅ safety check
    const n1 = await fetchNewsData(symbol1);
    setNews1(n1);
    if (symbol2 && symbol2 !== symbol1) {
      const n2 = await fetchNewsData(symbol2);
      setNews2(n2);
    } else {
      setNews2([]);
    }
  }
  loadNews();
}, [symbol1, symbol2, trigger]); // ✅ include trigger



  const computeSummary = (articles = []) => {
    if (!Array.isArray(articles) || articles.length === 0) return null;
    const scores = articles.map((a) => a.score ?? 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const pos = scores.filter((s) => s >= 0.05).length;
    const neu = scores.filter((s) => s > -0.05 && s < 0.05).length;
    const neg = scores.filter((s) => s <= -0.05).length;
    const overall = avg >= 0.05 ? "Positive" : avg <= -0.05 ? "Negative" : "Neutral";
    return { avg, pos, neu, neg, overall };
  };

  const renderGauge = (avg = 0, symbol = "") => (
    <Plot
      data={[
        {
          type: "indicator",
          mode: "gauge+number",
          value: avg,
          title: { text: `${symbol}<br>Avg Sentiment`, font: { size: 18 } },
          gauge: {
            axis: { range: [-1, 1] },
            bar: { color: "darkblue" },
            steps: [
              { range: [-1, -0.05], color: "#ffcccc" },
              { range: [-0.05, 0.05], color: "#ffffcc" },
              { range: [0.05, 1], color: "#ccffcc" },
            ],
          },
        },
      ]}
      layout={{ height: 250, margin: { l: 20, r: 20, t: 40, b: 20 } }}
      config={{ responsive: true }}
      style={{ width: "100%" }}
    />
  );

  const renderNews = (news, loading, error, symbol) => {
    if (loading) return <div className="loading">Loading news for {symbol}...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!Array.isArray(news) || news.length === 0)
      return <div className="info-box">No news found for {symbol}</div>;

    const summary = computeSummary(news);

    return (
      <div className="news-section">
        <h3>📰 News & Sentiment: {symbol}</h3>

        {summary && (
          <>
            <div className="sentiment-summary">
              <div className="summary-row">
                <span>Avg: {summary.avg.toFixed(3)}</span>
                <span>🟢 {summary.pos}</span>
                <span>🟡 {summary.neu}</span>
                <span>🔴 {summary.neg}</span>
              </div>
            </div>

            {renderGauge(summary.avg, symbol)}

            <div
              className={`sentiment-interpretation ${summary.overall.toLowerCase()}`}
            >
              {summary.overall === "Positive" && (
                <p>✅ Positive - Favorable coverage</p>
              )}
              {summary.overall === "Negative" && (
                <p>⚠️ Negative - Concerning coverage</p>
              )}
              {summary.overall === "Neutral" && (
                <p>ℹ️ Neutral - Balanced coverage</p>
              )}
            </div>
          </>
        )}

        <div className="headlines">
          <h4>🗞️ Headlines</h4>
          {news.map((a, i) => (
            <details key={i} className="article-card">
              <summary>
                {(a.sentiment === "Positive"
                  ? "🟢"
                  : a.sentiment === "Negative"
                  ? "🔴"
                  : "🟡") + " "}
                <strong>{i + 1}. {a.title || "Untitled"}</strong>
              </summary>
              <div className="article-content">
                <p>{a.description || "No description available."}</p>
                <a href={a.url || "#"} target="_blank" rel="noreferrer">
                  🔗 Read Article
                </a>
                <p>
  Score: {(a?.score ?? 0).toFixed(3)} | {a?.publishedAt || "N/A"} | {a?.source?.name || "Unknown"}
</p>

              </div>
            </details>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="news-analysis">
      <h2>📰 News & Sentiment Analysis</h2>

      <div className="news-grid">
        {renderNews(news1, loading1, error1, symbol1)}

        {symbol2 && symbol2 !== symbol1 ? (
          <>
            <hr className="divider" />
            {renderNews(news2, loading2, error2, symbol2)}
          </>
        ) : (
          <div className="info-box">
            💡 Add a second stock symbol for comparison
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsAnalysis;
