import { useState } from "react";
import StockAnalysis from "./components/StockAnalysis";
import NewsAnalysis from "./components/NewsAnalysis";
import "./App.css";

function App() {
  const [symbol1, setSymbol1] = useState("RELIANCE.NS");
  const [symbol2, setSymbol2] = useState("TCS.NS");
  const [period, setPeriod] = useState("3mo");
  const [activeTab, setActiveTab] = useState("technical");
  const [trigger, setTrigger] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize function (ensures clean symbols before fetch)
  const normalizeSymbol = (s) => {
    if (!s) return "";
    s = s.trim().toUpperCase();
    s = s.replace(/(\.\.)+/g, ".")
         .replace(/\.N\.NS/g, ".NS")
         .replace(/\.B\.BO/g, ".BO")
         .replace(/[^A-Z0-9.]/g, "");
    if (s.endsWith(".")) s = s.slice(0, -1);
    if (s && !s.endsWith(".NS") && !s.endsWith(".BO")) s += ".NS";
    return s;
  };

  // Trigger backend fetch manually
  const handleFetch = async () => {
    const s1 = normalizeSymbol(symbol1);
    const s2 = normalizeSymbol(symbol2);

    if (!s1) {
      alert("⚠️ Please enter at least one valid stock symbol!");
      return;
    }

    // ✅ Start loading indicator and prevent multiple fetches
    setIsLoading(true);
    setHasFetched(true);

    // ✅ Delay only to allow “Loading...” to render before data loads
    setTimeout(() => {
      setSymbol1(s1);
      setSymbol2(s2);
      setTrigger((prev) => prev + 1);
      setIsLoading(false); // ✅ Stop loading when trigger is set
    }, 300);
  };

  // Allow Enter key to start fetching
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleFetch();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📈 Financial Research AI Agent – Indian Stock Analyzer</h1>
        <p className="subtitle">
          Analyze Indian stock data with charts, indicators (MA, RSI), news, and sentiment.
        </p>
        <div className="info-banner">
          💡 Use <b>.NS</b> for NSE or <b>.BO</b> for BSE stocks (e.g., RELIANCE.NS, TCS.NS)
        </div>
      </header>

      {/* Input Controls */}
      <div className="controls">
        <div className="input-group">
          <label>1st Stock Symbol</label>
          <input
            type="text"
            value={symbol1}
            onChange={(e) => setSymbol1(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="RELIANCE.NS"
          />
        </div>

        <div className="input-group">
          <label>2nd Stock Symbol (optional)</label>
          <input
            type="text"
            value={symbol2}
            onChange={(e) => setSymbol2(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="TCS.NS"
          />
        </div>

        <div className="input-group">
          <label>Time Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            onKeyDown={handleKeyPress}
          >
            <option value="1mo">1 Month</option>
            <option value="3mo">3 Months</option>
            <option value="6mo">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="2y">2 Years</option>
          </select>
        </div>

        <button className="fetch-btn" onClick={handleFetch} disabled={isLoading}>
          {isLoading ? "⏳ Loading..." : "🔍 Fetch Data"}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "technical" ? "tab active" : "tab"}
          onClick={() => setActiveTab("technical")}
        >
          📊 Technical Analysis
        </button>
        <button
          className={activeTab === "news" ? "tab active" : "tab"}
          onClick={() => setActiveTab("news")}
        >
          📰 News & Sentiment
        </button>
      </div>

      {/* Conditional rendering */}
      <div className="tab-content">
        {!hasFetched ? (
          <div className="info-box">💡 Enter stock symbols and click “Fetch Data”</div>
        ) : isLoading ? (
          <div className="loading-box">⏳ Fetching data...</div>
        ) : activeTab === "technical" ? (
          <StockAnalysis
            symbol1={symbol1}
            symbol2={symbol2}
            period={period}
            trigger={trigger}
          />
        ) : (
          <NewsAnalysis
            symbol1={symbol1}
            symbol2={symbol2}
            trigger={trigger}
          />
        )}
      </div>

      <footer className="app-footer">
        <div className="footer-row">
          <span>Data: Yahoo Finance, NewsAPI</span>
          <span>Indicators: 20-Day MA, 14-Day RSI</span>
          <span>Sentiment: VADER</span>
        </div>
        <p className="disclaimer">
          ⚠️ For educational purposes only. Not financial advice.
        </p>
      </footer>
    </div>
  );
}

export default App;
