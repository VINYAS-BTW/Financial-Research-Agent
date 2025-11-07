import { useState } from "react";
import StockAnalysis from "../src/components/StockAnalysis";
import NewsAnalysis from "../src/components/NewsAnalysis";

function App() {
  const [symbol1, setSymbol1] = useState("RELIANCE.NS");
  const [symbol2, setSymbol2] = useState("TCS.NS");
  const [period, setPeriod] = useState("3mo");
  const [activeTab, setActiveTab] = useState("technical");
  const [trigger, setTrigger] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleFetch = async () => {
    const s1 = normalizeSymbol(symbol1);
    const s2 = normalizeSymbol(symbol2);

    if (!s1) {
      alert("⚠️ Please enter at least one valid stock symbol!");
      return;
    }

    setIsLoading(true);
    setHasFetched(true);

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
      
      <div className="fixed inset-0 z-0">
       
        <div className="absolute top-0 left-1/4 w-196 h-96 bg-cyan-800/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/9 right-1/3 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl " style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1 left-1/3 w-196 h-96 bg-cyan-800/20 rounded-full blur-3xl " style={{animationDelay: '2s'}}></div>
        
       
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-size-[50px_50px]"></div>
       
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-6xl font-bold bg-linear-to-r from-neutral-100 via-cyan-200 to-neutral-400 bg-clip-text text-transparent mb-8">
            Financial Research AI Agent
          </h1>
          <p className="text-gray-200 text-sm md:text-lg mb-4 font-sans">
            Analyze Indian stock data with charts, indicators (MA, RSI), news,
            and sentiment
          </p>
          <div className="inline-block bg-lime-200/10 border border-lime-100 rounded-3xl px-4 py-2 text-sm text-blue-300">
            Use <span className="font-semibold">.NS</span> for NSE or{" "}
            <span className="font-semibold">.BO</span> for BSE stocks
          </div>
        </header>

        {/* Controls */}
        <div className="bg-[#] rounded-4xl p-6 mb-6 border border-gray-800 font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Time Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-linear-to-r from-neutral-800 to-neutral-950 border border-gray-100 rounded-3xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-200  focus:border-transparent transition cursor-pointer hover:scale-101"
              >
                <option value="1mo">1 Month</option>
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFetch}
                disabled={isLoading}
                className="w-full bg-linear-to-r from-cyan-200 via-neutral-950 to-cyan-200 border border-gray-100 rounded-3xl hover:from-neutral-850 hover:via-cyan-800 hover:to-neutral-850 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 px-6  transition-all duration-200 shadow-lg shadow-cyan-200/10 hover:scale-101 cursor-pointer"
              >
                {isLoading ? " Gettin' u..." : " Fetch Data"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            className={`md:text-lg flex-1 py-3 px-4 rounded-3xl  font-bold transition-all duration-200 ${
              activeTab === "technical"
                ? "bg-linear-to-r from-cyan-800 via-neutral-950 to-cyan-950 border border-gray-700 text-white shadow-lg shadow-blue-500/20"
                : "bg-[#111] text-gray-400 hover:text-white border border-gray-800 hover:ring-1 hover:border-cyan-50 cursor-pointer"
            }`}
            onClick={() => setActiveTab("technical")}
          >
            Technical Analysis
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-3xl font-bold transition-all duration-200 ${
              activeTab === "news"
                ? "bg-linear-to-r  from-cyan-800 via-neutral-950 to-cyan-950 border border-gray-700 text-white shadow-lg shadow-blue-500/30"
                : "bg-linear-to-r from-neutral-800 to-neutral-950  border-gray-800 text-gray-400 hover:text-white border cursor-pointer hover:ring-1 hover:border-cyan-50"
            }`}
            onClick={() => setActiveTab("news")}
          >
            News & Sentiment
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#] rounded-2xl p-6 border border-gray-800 min-h-[400px]">
          {!hasFetched ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
              Enter stock symbols and click "Fetch Data"
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64 text-lime-100 text-lg">
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
            <NewsAnalysis
              symbol1={symbol1}
              symbol2={symbol2}
              trigger={trigger}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400 text-sm">
          <div className="flex flex-wrap justify-center gap-6 mb-3">
            <span>Data: Yahoo Finance, NewsAPI</span>
            <span>Indicators: 20-Day MA, 14-Day RSI</span>
            <span>Sentiment: VADER</span>
          </div>
          <p className="text-red-400 text-xs">
            For educational purposes only. Not financial advice.<br></br>
            <span className="font-bold text-cyan-50">-The Lit Coders</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App