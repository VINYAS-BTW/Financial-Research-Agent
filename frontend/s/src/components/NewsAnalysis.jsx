import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { fetchNewsData } from "../api";

function NewsAnalysis({ symbol1, symbol2, trigger }) {
  const [news1, setNews1] = useState([]);
  const [news2, setNews2] = useState([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  useEffect(() => {
    async function loadNews() {
      if (!symbol1) return;
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
  }, [symbol1, symbol2, trigger]);

  const computeSummary = (articles = []) => {
    if (!Array.isArray(articles) || articles.length === 0) return null;
    const scores = articles.map((a) => a.score ?? 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const pos = scores.filter((s) => s >= 0.05).length;
    const neu = scores.filter((s) => s > -0.05 && s < 0.05).length;
    const neg = scores.filter((s) => s <= -0.05).length;
    const overall =
      avg >= 0.05 ? "Positive" : avg <= -0.05 ? "Negative" : "Neutral";
    return { avg, pos, neu, neg, overall };
  };

  const renderGauge = (avg = 0, symbol = "") => (
    <Plot
      data={[
        {
          type: "indicator",
          mode: "gauge+number",
          value: avg,
          title: {
            text: `${symbol}<br>Avg Sentiment`,
            font: { size: 16, color: "#e5e7eb" },
          },
          number: { font: { color: "#e5e7eb" } },
          gauge: {
            axis: { range: [-1, 1], tickcolor: "#4b5563" },
            bar: { color: "#60a5fa" },
            bgcolor: "#0a0a0f",
            borderwidth: 2,
            bordercolor: "#374151",
            steps: [
              { range: [-1, -0.05], color: "#7f1d1d" },
              { range: [-0.05, 0.05], color: "#713f12" },
              { range: [0.05, 1], color: "#14532d" },
            ],
          },
        },
      ]}
      layout={{
        height: 250,
        margin: { l: 20, r: 20, t: 40, b: 20 },
        paper_bgcolor: "#0a0a0f",
        plot_bgcolor: "#0a0a0f",
        font: { color: "#9ca3af" },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
    />
  );

  const renderNews = (news, loading, error, symbol) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Loading news for {symbol}...
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      );
    }
    if (!Array.isArray(news) || news.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-[#0a0a0f] border border-gray-800 rounded-xl text-gray-400">
          No news found for {symbol}
        </div>
      );
    }

    const summary = computeSummary(news);

    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-neutral-400">
          News & Sentiment: <span className="text-cyan-50">{symbol}</span>
        </h3>

        {summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 text-center hover:border-blue-500/30 transition">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Average
                </div>
                <div className="text-xl font-bold text-white">
                  {summary.avg.toFixed(3)}
                </div>
              </div>
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 text-center hover:border-cyan-500/30 transition">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Positive
                </div>
                <div className="text-xl font-bold text-green-400">
                  🟢 {summary.pos}
                </div>
              </div>
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 text-center hover:border-cyan-500/30 transition">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Neutral
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  🟡 {summary.neu}
                </div>
              </div>
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 text-center hover:border-red-500/30 transition">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Negative
                </div>
                <div className="text-xl font-bold text-red-400">
                  🔴 {summary.neg}
                </div>
              </div>
            </div>

            {/* Gauge Chart */}
            <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4">
              {renderGauge(summary.avg, symbol)}
            </div>

            {/* Sentiment Interpretation */}
            <div
              className={`rounded-3xl p-4 border ${
                summary.overall === "Positive"
                  ? "bg-green-500/10 border-green-500/30 text-green-200"
                  : summary.overall === "Negative"
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-300"
              }`}
            >
              {summary.overall === "Positive" && (
                <p className="font-semibold">
                   Positive - Favorable coverage
                </p>
              )}
              {summary.overall === "Negative" && (
                <p className="font-semibold">
                   Negative - Concerning coverage
                </p>
              )}
              {summary.overall === "Neutral" && (
                <p className="font-semibold">Neutral - Balanced coverage</p>
              )}
            </div>
          </>
        )}

        {/* Headlines */}
        <div>
          <h4 className="text-xl font-bold text-white mb-4"> Headlines</h4>
          <div className="space-y-3">
            {news.map((a, i) => (
              <details
                key={i}
                className="bg-[#111] border border-gray-800 rounded-4xl overflow-hidden hover:border-cyan-100 hover:scale-101 transition group"
              >
                <summary className="px-4 py-3 cursor-pointer flex items-start gap-3 hover:bg-cyan-500/10 transition">
                  <span className="text-lg shrink-0">
                    {a.sentiment === "Positive"
                      ? "🟢"
                      : a.sentiment === "Negative"
                      ? "🔴"
                      : "🟡"}
                  </span>
                  <span className="font-bold text-white flex-1 font-mono">
                    {i + 1}. {a.title || "Untitled"}
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-2 border-t border-gray-800 space-y-3">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {a.description || "No description available."}
                  </p>
                  <a
                    href={a.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition"
                  >
                     Read Article
                  </a>
                  <p className="text-xs text-gray-400">
                    Score: {(a?.score ?? 0).toFixed(3)} |{" "}
                    {a?.publishedAt || "N/A"} | {a?.source?.name || "Unknown"}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold bg-linear-to-r from-neutral-100 via-cyan-50 to-neutral-100 bg-clip-text text-transparent mb-6">
        News & Sentiment Analysis
      </h2>

      <div className="space-y-8">
        {renderNews(news1, loading1, error1, symbol1)}

        {symbol2 && symbol2 !== symbol1 ? (
          <>
            <hr className="border-gray-800" />
            {renderNews(news2, loading2, error2, symbol2)}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 bg-[#0a0a0f] border border-gray-800 rounded-xl text-gray-400">
            Add a second stock symbol for comparison
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsAnalysis;
