import { useState, useEffect } from "react";
import StockAnalysis from "./StockAnalysis";
import NewsAnalysis from "./NewsAnalysis";
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from "../api.js";
import ResearchAgent from "./ResearchAgent.jsx";
import FloatingAgent from "./FloatingAgent.jsx";
import { TrendingUp, TrendingDown, Search, Plus, Bell, ChevronDown, Activity, Newspaper, BarChart3, Sparkles, Grid3x3 } from 'lucide-react';

function Dashboard() {
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
    <div className="min-h-screen bg-[#0a0b0e]">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
      
      <div className="relative flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-20 bg-[#0f1117]/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-6 z-50">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 flex flex-col items-center space-y-4">
            <button className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-lg shadow-emerald-500/10">
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <BarChart3 className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <Newspaper className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <Sparkles className="w-5 h-5" />
            </button>
          </nav>

          {/* Settings */}
          <button className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <Bell className="w-5 h-5" />
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-20">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-40 bg-[#0f1117]/80 backdrop-blur-xl border-b border-white/5">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Title & Breadcrumb */}
                <div className="flex items-center space-x-3">
                  <button className="text-gray-500 hover:text-white">
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <h1 className="text-2xl font-bold text-white">Overview</h1>
                </div>

                {/* Right: Wallet Info & Actions */}
                <div className="flex items-center space-x-4">
                  {/* Wallet Selector */}
                  <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                      <span className="text-sm text-gray-300">Main Portfolio</span>
                    </div>
                    <div className="flex items-center space-x-2 ml-6">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span className="text-sm text-gray-300">All Stocks (08)</span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search stocks..."
                      className="w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 backdrop-blur-sm"
                    />
                  </div>

                  {/* Action Button */}
                  <button className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl text-white font-medium shadow-lg shadow-emerald-500/20 transition-all">
                    Add Stock
                  </button>
                </div>
              </div>
            </div>

            {/* Sub Navigation - Stock Inputs & Tabs */}
            <div className="px-8 py-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                {/* Stock Input Pills */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium">Your Stocks</span>
                    <div className="w-1 h-1 bg-gray-700 rounded-full" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={symbol1}
                      onChange={(e) => setSymbol1(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="RELIANCE.NS"
                      className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 backdrop-blur-sm w-32"
                    />
                    <input
                      type="text"
                      value={symbol2}
                      onChange={(e) => setSymbol2(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="TCS.NS"
                      className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 backdrop-blur-sm w-32"
                    />
                  </div>
                </div>

                {/* Center Tabs */}
                <div className="flex items-center space-x-1 bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab("technical")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "technical"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Technical
                  </button>
                  <button
                    onClick={() => setActiveTab("news")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "news"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    News Sentiment
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("agent")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "agent"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    AI Insights
                  </button>
                </div>

                {/* Right: Period & Fetch */}
                <div className="flex items-center space-x-3">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 backdrop-blur-sm cursor-pointer"
                  >
                    <option value="1mo">1 Month</option>
                    <option value="3mo">3 Months</option>
                    <option value="6mo">6 Months</option>
                    <option value="1y">1 Year</option>
                  </select>

                  <button
                    onClick={handleFetch}
                    disabled={isLoading}
                    className="px-5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm text-white font-medium transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Fetch Data"}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Watchlist Bar */}
          {watchlist.length > 0 && (
            <div className="px-8 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center space-x-3 overflow-x-auto">
                <span className="text-xs text-gray-500 font-medium shrink-0">Quick Access:</span>
                {watchlist.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSymbol1(item.symbol)}
                    className="px-3 py-1 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-lg text-xs text-gray-300 hover:text-white transition-all whitespace-nowrap"
                  >
                    {item.symbol}
                  </button>
                ))}
                <button
                  onClick={async () => {
                    await addToWatchlist(symbol1, "guest");
                    const wl = await fetchWatchlist("guest");
                    setWatchlist(wl);
                  }}
                  className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 transition-all whitespace-nowrap flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Current
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="p-8">
            {activeTab === "agent" ? (
              <ResearchAgent />
            ) : !hasFetched ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <Activity className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                <p className="text-gray-500 mb-6">Enter stock symbols and click "Fetch Data" to begin</p>
                <button
                  onClick={handleFetch}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl text-white font-medium shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Start Analysis
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-emerald-400 font-medium">Fetching market data...</p>
                </div>
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
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 px-8 py-4 bg-[#0f1117]/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-6">
                <span>Data: Yahoo Finance • NewsAPI</span>
                <span>•</span>
                <span>Indicators: MA(20) • RSI(14)</span>
                <span>•</span>
                <span>Sentiment: VADER</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Educational purposes only</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">The Lit Coders</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
      
      <FloatingAgent />
    </div>
  );
}

export default Dashboard;