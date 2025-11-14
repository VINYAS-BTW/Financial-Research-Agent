import { useState,useEffect } from "react";
import StockAnalysis from "../src/components/StockAnalysis";
import NewsAnalysis from "../src/components/NewsAnalysis";
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from "./api";


function App() {
  const [symbol1, setSymbol1] = useState("RELIANCE.NS");
  const [symbol2, setSymbol2] = useState("TCS.NS");
  const [period, setPeriod] = useState("3mo");
  const [activeTab, setActiveTab] = useState("technical");
  const [trigger, setTrigger] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);


useEffect(() => {
  async function loadWatchlist() {
    const wl = await fetchWatchlist("guest");
    setWatchlist(wl);
  }
  loadWatchlist();
}, []);

const handleAddToWatchlist = async () => {
  if (!symbol1) return;
  await addToWatchlist(symbol1, "guest");
  const wl = await fetchWatchlist("guest");
  setWatchlist(wl);
};
  // ✅ Sanitize and standardize stock symbols
  const normalizeSymbol = (s) => {
    if (!s) return "";
    s = s.trim().toUpperCase();
    s = s
      .replace(/(\.\.)+/g, ".")
      .replace(/\.N\.NS/g, ".NS")
      .replace(/\.B\.BO/g, ".BO")
      .replace(/[^A-Z0-9.]/g, "");
    if (s.endsWith(".")) s = s.slice(0, -1);
    if (s && !s.endsWith(".NS") && !s.endsWith(".BO")) s += ".NS";
    return s;
  };

  // ✅ Handle fetch click
  const handleFetch = async () => {
    const s1 = normalizeSymbol(symbol1);
    const s2 = normalizeSymbol(symbol2);

    if (!s1) {
      alert("⚠️ Please enter at least one valid stock symbol!");
      return;
    }

    setIsLoading(true);
    setHasFetched(true);

    // Small delay to simulate smoother loading transitions
    setTimeout(() => {
      setSymbol1(s1);
      setSymbol2(s2);
      setTrigger((prev) => prev + 1);
      setIsLoading(false);
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleFetch();
  };

  return (
    <div className="min-h-screen bg-[#010101] text-gray-100">
      {/* --- Background Glow Layers --- */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-196 h-96 bg-cyan-800/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/9 right-1/3 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1 left-1/3 w-196 h-96 bg-cyan-800/20 rounded-full blur-3xl"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(111,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-size-[50px_50px]"></div>

        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl px-2 md:text-6xl  bg-linear-to-r from-neutral-100 via-cyan-2 00 to-neutral-400 bg-clip-text text-transparent mb-8 mt-3 font-vi tracking-wider font-bold">
            Financial Research AI Agent
          </h1>
          <p className="text-gray-200 text-sm px-2 md:text-lg md:mt-0 mb-8 font-vi tracking-wide">
            Analyze Indian stock data with charts, indicators (MA, RSI), news,
            and sentiment
          </p>
          <div className="inline-block bg-lime-200/10 border border-lime-100 rounded-3xl px-4 py-2 text-sm font-vi2 text-blue-300">
            Use <span className="font-semibold">.NS</span> for NSE or{" "}
            <span className="font-semibold">.BO</span> for BSE stocks
          </div>
        </header>

        {/* Controls */}
        <div className="bg-[#] rounded-4xl p-6 mb-6 border border-gray-800 font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stock 1 Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-vi2">
                1st Stock Symbol
              </label>
              <input
                type="text"
                value={symbol1}
                onChange={(e) => setSymbol1(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="RELIANCE.NS"
                className="w-full bg-linear-to-r from-neutral-800 to-neutral-950 border border-gray-100 rounded-3xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-200 focus:border-transparent transition hover:scale-101 hover:ring-cyan-100 hover:ring-1"
              />
            </div>

            {/* Stock 2 Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-vi2">
                2nd Stock Symbol (optional)
              </label>
              <input
                type="text"
                value={symbol2}
                onChange={(e) => setSymbol2(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="TCS.NS"
                className="w-full bg-linear-to-r from-neutral-800 to-neutral-950 border border-gray-100 rounded-3xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-200 focus:border-transparent transition hover:scale-101 hover:ring-cyan-100 hover:ring-1"
              />
            </div>

            {/* Period Select */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-vi2">
                Time Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-[#111] border border-gray-100 rounded-3xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-200  focus:border-transparent transition cursor-pointer hover:scale-101"
              >
                <option value="1mo">1 Month</option>
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
              </select>
            </div>

            {/* Fetch Button */}
            <div className="flex items-end">
              <button
                onClick={handleFetch}
                disabled={isLoading}
                className="w-full bg-linear-to-r from-cyan-200 via-neutral-950 to-cyan-200 border border-gray-100 rounded-3xl hover:from-neutral-850 hover:via-cyan-800 hover:to-neutral-850 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 px-6 transition-all duration-200 shadow-cyan-300/20 hover:scale-101 cursor-pointer hover:shadow-[2px_4px_0_0_rgba(0,0,0,0.2)]"
              >
                {isLoading ? " Fetching..." : " Fetch Data"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            className={`md:text-lg flex-1 py-3 px-4 rounded-3xl font-bold transition-all duration-200 ${
              activeTab === "technical"
                ? "bg-linear-to-r from-cyan-800 via-neutral-950 to-cyan-950 border border-gray-700 text-white shadow-lg shadow-blue-500/20"
                : "bg-[#111] text-gray-400 hover:text-white border border-gray-800 hover:ring-1 hover:border-cyan-50 cursor-pointer hover:shadow-[2px_4px_0_0_rgba(0,0,0,0.2)]"
            }`}
            onClick={() => setActiveTab("technical")}
          >
            Technical Analysis
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-3xl font-bold transition-all font-vi2 md:text-lg duration-200 ${
              activeTab === "news"
                ? "bg-linear-to-r from-cyan-800 via-neutral-950 to-cyan-950 border border-gray-700 text-white shadow-lg shadow-blue-500/30"
                : "bg-linear-to-r from-neutral-800 to-neutral-950 border-gray-800 text-gray-400 hover:text-white border cursor-pointer hover:ring-1 hover:border-cyan-50 hover:shadow-[2px_4px_0_0_rgba(0,0,0,0.2)]"
            }`}
            onClick={() => setActiveTab("news")}
          >
            News & Sentiment
          </button>
        </div>
       {/* Watchlist Section */}
<div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 mb-6">
  <h2 className="text-xl font-bold text-white mb-3">📈 My Watchlist</h2>
  <div className="flex flex-wrap gap-2">
    {watchlist.length > 0 ? (
      watchlist.map((item, i) => (
        <div
          key={i}
          className="flex items-center bg-neutral-800 border border-gray-700 rounded-full px-3 py-1 text-sm text-gray-300 hover:border-cyan-500 transition"
        >
          <span
            className="cursor-pointer font-semibold"
            onClick={() => setSymbol1(item.symbol)}
          >
            {item.symbol}
          </span>
          <button
            onClick={async () => {
              await removeFromWatchlist(item.symbol, "guest");
              const wl = await fetchWatchlist("guest");
              setWatchlist(wl);
            }}
            className="ml-2 text-red-400 hover:text-red-300 font-bold"
            title="Remove from watchlist"
          >
            🗑️
          </button>
        </div>
      ))
    ) : (
      <span className="text-gray-400 text-sm">
        No stocks saved yet. Add one below!
      </span>
    )}
  </div>

  <button
    onClick={async () => {
      await addToWatchlist(symbol1, "guest");
      const wl = await fetchWatchlist("guest");
      setWatchlist(wl);
    }}
    className="mt-3 bg-cyan-900 text-white rounded-2xl px-4 py-2 hover:bg-cyan-700 transition"
  >
    ➕ Add {symbol1 || "Current"} to Watchlist
  </button>
</div>


        {/* Content */}
        <div className="bg-[#] rounded-2xl p-6 border border-gray-800 min-h-[400px]">
          {!hasFetched ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-lg font-vi2">
              Enter stock symbols and click "Fetch Data"
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64 text-lime-100 text-lg font-vi2">
              Fetching data...
            </div>
          ) : activeTab === "technical" ? (
            <StockAnalysis
              symbol1={symbol1}
              symbol2={symbol2}
              period={period}
              trigger={trigger}
            />
          ) : (
            <NewsAnalysis symbol1={symbol1} symbol2={symbol2} trigger={trigger} />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400 text-sm">
          <div className="flex flex-wrap justify-center gap-6 mb-3 font-vi2">
            <span>Data: Yahoo Finance, NewsAPI</span>
            <span>Indicators: 20-Day MA, 14-Day RSI</span>
            <span>Sentiment: VADER</span>
          </div>
          <p className="text-red-400 text-sm">
            For educational purposes only. Not financial advice.
            <br />
            <span className="font-bold text-cyan-50">-The Lit Coders</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
