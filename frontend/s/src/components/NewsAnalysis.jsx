import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { fetchNewsData } from "../api"; // ✅ Import real API

function NewsAnalysis({ symbol1 = "AAPL", symbol2 = "", trigger = 0 }) {
  const [news1, setNews1] = useState([]);
  const [news2, setNews2] = useState([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  useEffect(() => {
    console.log(" NewsAnalysis useEffect triggered", { symbol1, symbol2, trigger });
    
    async function loadNews() {
      try {
        if (!symbol1) {
          console.log(" No symbol1 provided");
          return;
        }

        setLoading1(true);
        setError1(null);
        console.log("📥 Loading news for symbol1:", symbol1);

        const n1 = await fetchNewsData(symbol1);
        console.log("✅ News1 loaded:", n1, "articles");
        
        // Handle different response formats
        const articles1 = Array.isArray(n1) ? n1 : (n1?.articles || n1?.data || []);
        console.log("📰 Processed articles1:", articles1.length, "items");
        setNews1(articles1);
      } catch (err) {
        console.error("❌ Error fetching news1:", err);
        setError1("Failed to load news for " + symbol1);
      } finally {
        setLoading1(false);
      }

      if (symbol2 && symbol2 !== symbol1) {
        try {
          setLoading2(true);
          setError2(null);
          console.log("📥 Loading news for symbol2:", symbol2);

          const n2 = await fetchNewsData(symbol2);
          console.log("✅ News2 loaded:", n2, "articles");
          
          // Handle different response formats
          const articles2 = Array.isArray(n2) ? n2 : (n2?.articles || n2?.data || []);
          console.log("📰 Processed articles2:", articles2.length, "items");
          setNews2(articles2);
        } catch (err) {
          console.error("❌ Error fetching news2:", err);
          setError2("Failed to load news for " + symbol2);
        } finally {
          setLoading2(false);
        }
      } else {
        setNews2([]);
      }
    }

    loadNews();
  }, [symbol1, symbol2, trigger]);

  const computeSummary = (articles = []) => {
    if (!Array.isArray(articles) || articles.length === 0) return null;
    
    // Calculate scores - handle both pre-calculated and raw articles
    const scores = articles.map((a) => {
      // If score exists, use it
      if (typeof a.score === 'number') return a.score;
      
      // Otherwise try to infer from sentiment label
      if (a.sentiment === "Positive" || a.sentiment === "positive") return 0.6;
      if (a.sentiment === "Negative" || a.sentiment === "negative") return -0.6;
      return 0; // Neutral
    });
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const pos = scores.filter((s) => s >= 0.05).length;
    const neu = scores.filter((s) => s > -0.05 && s < 0.05).length;
    const neg = scores.filter((s) => s <= -0.05).length;
    const overall = avg >= 0.05 ? "Positive" : avg <= -0.05 ? "Negative" : "Neutral";
    return { avg, pos, neu, neg, overall };
  };

 const renderGauge = (avg = 0, symbol = "") => (
  <div className="rounded-4xl overflow-hidden bg-[#12141a] p-2 shadow-md">
    <Plot
      data={[
        {
          type: "indicator",
          mode: "gauge+number",
          value: avg,
          title: {
            text: `${symbol}<br>Avg Sentiment`,
            font: { size: 14, color: "#cbd5e1" },
          },
          number: { font: { color: "#e2e8f0" } },
          gauge: {
            axis: { range: [-1, 1], tickcolor: "#4b5563" },
            bar: { color: "#10b981" },
            bgcolor: "#12141a",
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
        height: 220,
        margin: { l: 20, r: 20, t: 40, b: 20 },
        paper_bgcolor: "#12141a",
        plot_bgcolor: "#12141a",
        font: { color: "#9ca3af" },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
    />
  </div>
);


  const renderNews = (news, loading, error, symbol) => {
    console.log(`🎨 Rendering news for ${symbol}:`, { loading, error, newsCount: news.length });
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p>Loading news for {symbol}...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
          ⚠️ {error}
        </div>
      );
    }
    
    if (!Array.isArray(news) || news.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-900 border border-gray-700 rounded-4xl text-gray-400">
          No news found for {symbol}
        </div>
      );
    }

    const summary = computeSummary(news);
    const displayNews = news.slice(0, 8); // ✅ Only show top 8 articles

    return (
      <div className="space-y-6 ">
        <h3 className="text-2xl font-semibold text-white">
          News & Sentiment: <span className="text-emerald-400">{symbol}</span>
        </h3>

        {summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-950 border border-gray-700 rounded-4xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Average
                </div>
                <div className="text-xl font-bold text-white">
                  {summary.avg.toFixed(3)}
                </div>
              </div>
              <div className="bg-gray-950 border border-gray-700 rounded-4xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Positive
                </div>
                <div className="text-xl font-bold text-emerald-400">
                  🟢 {summary.pos}
                </div>
              </div>
              <div className="bg-gray-950 border border-gray-700 rounded-4xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Neutral
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  🟡 {summary.neu}
                </div>
              </div>
              <div className="bg-gray-950 border border-gray-700 rounded-4xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Negative
                </div>
                <div className="text-xl font-bold text-red-400">
                  🔴 {summary.neg}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-4xl p-4">
              {renderGauge(summary.avg, symbol)}
            </div>

            <div
              className={`rounded-4xl p-4 border ${
                summary.overall === "Positive"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : summary.overall === "Negative"
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              }`}
            >
              {summary.overall === "Positive" && (
                <p className="font-semibold">✓ Positive - Favorable market coverage</p>
              )}
              {summary.overall === "Negative" && (
                <p className="font-semibold">⚠ Negative - Concerning market coverage</p>
              )}
              {summary.overall === "Neutral" && (
                <p className="font-semibold">— Neutral - Balanced market coverage</p>
              )}
            </div>
          </>
        )}

        <div>
          <h4 className="text-4xl font-semibold text-white mb-4">
            Latest Headlines <span className="text-sm text-gray-500">(Top 8)</span>
          </h4>
          <div className="space-y-3">
            {displayNews.map((a, i) => {
              // Determine sentiment icon
              const sentiment = a.sentiment || a.Sentiment || "Neutral";
              const sentimentIcon = 
                sentiment === "Positive" || sentiment === "positive" ? "🟢" :
                sentiment === "Negative" || sentiment === "negative" ? "🔴" : "🟡";
              
              // Get score safely
              const score = typeof a.score === 'number' ? a.score : 
                           typeof a.Score === 'number' ? a.Score : 0;
              
              return (
              <details
                key={i}
                className="bg-gray-900 border border-gray-700 rounded-4xl overflow-hidden hover:border-emerald-500/50 transition group font-vi2"
              >
                <summary className="px-4 py-3 cursor-pointer flex items-start gap-3 hover:bg-gray-800/50 transition">
                  <span className="text-lg shrink-0">{sentimentIcon}</span>
                  <span className="font-semibold text-white flex-1">
                    {i + 1}. {a.title || "Untitled"}
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-2 border-t border-gray-700 space-y-3">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {a.description || "No description available."}
                  </p>
                  <a
                    href={a.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition"
                  >
                    Read Full Article →
                  </a>
                  <p className="text-xs text-gray-400">
                    Score: {score.toFixed(3)} |{" "}
                    {a.publishedAt || a.published_at || "N/A"} | {a.source?.name || a.source || "Unknown"}
                  </p>
                </div>
              </details>
            )})}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h2 className="text-3xl font-bold text-white mb-8">
        News & Sentiment Analysis
      </h2>

      <div className="space-y-12">
        {renderNews(news1, loading1, error1, symbol1)}

        {symbol2 && symbol2 !== symbol1 ? (
          <>
            <hr className="border-gray-700" />
            {renderNews(news2, loading2, error2, symbol2)}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-900 border border-gray-700 rounded-4xl text-gray-400">
            Add a second stock symbol for comparison
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsAnalysis;