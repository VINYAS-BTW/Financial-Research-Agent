import { useState, useEffect } from "react";
import StockAnalysis from "./StockAnalysis";
import NewsAnalysis from "./NewsAnalysis";
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from "../api.js";
import ResearchAgent from "./ResearchAgent.jsx";
import FloatingAgent from "./FloatingAgent.jsx";
import {
  Search,
  Plus,
  Bell,
  Activity,
  Newspaper,
  BarChart3,
  Sparkles,
  Grid3x3,
} from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0b0e] relative overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes scale-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 8s ease-in-out infinite 2s; }
        .animate-float-slow { animation: float 10s ease-in-out infinite 4s; }
        .animate-rotate-slow { animation: rotate 20s linear infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .animate-scale-pulse { animation: scale-pulse 2s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        
        .glass-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          transition: all 0.3s ease;
        }
        
        .glass-card:hover {
          border-color: rgba(255,255,255,0.2);
          box-shadow: 0 12px 48px 0 rgba(16,185,129,0.2);
          transform: translateY(-1px);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .btn-glow {
          box-shadow: 0 0 20px rgba(16,185,129,0.3);
          transition: all 0.3s ease;
        }
        
        .btn-glow:hover:not(:disabled) {
          box-shadow: 0 0 30px rgba(16,185,129,0.5), 0 0 60px rgba(6,182,212,0.3);
          transform: translateY(-2px) scale(1.02);
        }
        
        .btn-glow:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        
        .icon-float {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .icon-float:hover {
          transform: translateY(-1px) scale(1.1);
        }
        
        .icon-float:active {
          transform: translateY(0) scale(0.95);
        }
        
        .input-glow:focus {
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
          border-color: rgba(16,185,129,0.6);
          transform: scale(1.02);
        }
        
        .tab-item {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .tab-item:hover {
          transform: translateY(-1px);
        }
        
        .watchlist-item {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .watchlist-item:hover {
          transform: translateY(-2px) scale(1.05);
        }
      `}</style>

      {/* Animated Background Gradients */}
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <div className="absolute bottom-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-[120px] animate-float" />
        
        
      </div>

      <div className="relative flex font-vi">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-20 border-r-2 flex flex-col items-center py-6 z-50 shadow-2xl bg-black">
          {/* Logo */}
          <div className="mb-8 icon-float cursor-pointer">
            <div className="w-9 h-9 rounded-2xl  flex items-center justify-center  overflow-hidden">
              <img
                src="../src/assets/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col items-center space-y-4">
            <button className="w-12 h-12 rounded-3xl glass-card flex items-center justify-center text-emerald-400 relative overflow-hidden group icon-float bg-gradient-to-br from-emerald-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Grid3x3 className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
            </button>

            <button className="w-12 h-12 rounded-3xl flex items-center justify-center text-gray-500 hover:text-white glass-card group icon-float">
              <BarChart3 className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
            </button>
          </nav>

          {/* Settings */}
          <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-100 hover:text-white glass-card group icon-float relative">
            <Bell className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-scale-pulse" />
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-20">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-40 ">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Title */}
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-white animate-fadeIn font-vi4">
                    Dashboard
                  </h1>
                </div>

                {/* Right: Wallet Info & Actions */}
                <div className="flex items-center space-x-4">
                  {/* Wallet Selector */}
                  <div className="flex items-center space-x-3 px-4 py-2 rounded-full  relative overflow-hidden">
                    
                    <div className="flex items-center space-x-2 relative z-10">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-scale-pulse" />
                      <span className="text-sm text-gray-300 font-vi">Main Portfolio</span>
                    </div>
                    <div className="flex items-center space-x-2 ml-6 relative z-10">
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-scale-pulse" style={{ animationDelay: "0.5s" }} />
                      <span className="text-sm text-gray-300 font-vi">All Stocks (08)</span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search stocks..."
                      className="w-64 pl-10 pr-4 py-2 glass-card rounded-full text-sm text-white placeholder-gray-500 focus:outline-none input-glow transition-all"
                    />
                  </div>

                  {/* Action Button */}
                  <button className="px-4 py-2 bg-gradient-to-r from-emerald-900 to-neutral-900 rounded-3xl text-white shadow-xl relative overflow-hidden group ">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Add Stock</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub Navigation */}
            <div className="px-8 py-3 border-t border-white/10 border-b">
              <div className="flex items-center justify-between">
                {/* Stock Input Pills */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium font-vi">Your Stocks</span>
                    <div className="w-1 h-1 bg-gray-700 rounded-full" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={symbol1}
                      onChange={(e) => setSymbol1(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="RELIANCE.NS"
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500/50 focus:border-emerald-500/70 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none backdrop-blur-xl w-32 input-glow transition-all"
                    />
                    <input
                      type="text"
                      value={symbol2}
                      onChange={(e) => setSymbol2(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="TCS.NS"
                      className="px-4 py-1.5 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30 hover:border-cyan-500/50 focus:border-cyan-500/70 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none backdrop-blur-xl w-32 input-glow transition-all"
                    />
                  </div>
                </div>

                {/* Center Tabs */}
                <div className="flex items-center space-x-1 glass-card rounded-full p-1">
                  {[
                    { id: "technical", label: "Technical", icon: Activity },
                    { id: "news", label: "News Sentiment", icon: Newspaper },
                    { id: "agent", label: "AI Insights", icon: Sparkles },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-item px-4 py-1.5 rounded-full text-sm font-medium transition-all relative overflow-hidden flex items-center gap-2 ${
                          isActive ? "text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-stone-900 rounded-full" />
                        )}
                        <Icon className={`w-4 h-4 relative z-10 ${isActive ? "animate-bounce-subtle" : ""}`} />
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Period & Fetch */}
                <div className="flex items-center space-x-3">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-1.5 glass-card rounded-full text-sm text-gray-300 focus:outline-none input-glow cursor-pointer hover:border-white/30 transition-all"
                  >
                    <option value="1mo" className="bg-gray-900">1 Month</option>
                    <option value="3mo" className="bg-gray-900">3 Months</option>
                    <option value="6mo" className="bg-gray-900">6 Months</option>
                    <option value="1y" className="bg-gray-900">1 Year</option>
                  </select>

                  <button
                    onClick={handleFetch}
                    disabled={isLoading}
                    className="px-5 py-1.5 glass-card hover:bg-white/15  bg-gradient-to-br from-emerald-600 hover:border-white/50 rounded-full text-sm text-white font-medium transition-all disabled:opacity-50  relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">{isLoading ? "Gettin' it..." : "Fetch Data"}</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Watchlist Bar */}
          {watchlist.length > 0 && (
            <div className="px-8 py-3 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
              <div className="flex items-center space-x-3 overflow-x-auto">
                <span className="text-xs text-gray-500 font-medium shrink-0">Quick Access:</span>
                {watchlist.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSymbol1(item.symbol)}
                    className="watchlist-item px-3 py-1 glass-card hover:bg-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-xs text-gray-300 hover:text-white transition-all whitespace-nowrap"
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
                  className="watchlist-item px-3 py-1 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-xs text-emerald-400 transition-all whitespace-nowrap flex items-center gap-1 backdrop-blur-xl"
                >
                  <Plus className="w-4 h-4 animate-pulse" />
                  Add Current
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="p-8 font-vi3">
            {activeTab === "agent" ? (
              <ResearchAgent />
            ) : !hasFetched ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] animate-fadeIn">
                <div className="animate-bounce-subtle mb-6">
                  <div className="relative">
                    <Activity className="w-16 h-16 text-emerald-500" />
                    <div className="absolute inset-0 animate-rotate-slow opacity-50">
                      <Activity className="w-16 h-16 text-cyan-500" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 font-vi3">Ready to Analyze?</h3>
                <p className="text-gray-500 mb-6 font-vi">Enter stock symbols and click "Fetch Data" to begin</p>
                <button
                  onClick={handleFetch}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-900 to-emerald-900 rounded-full text-white font-medium shadow-sm shadow-emerald-300/40 relative overflow-hidden group btn-glow"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Start Analysis</span>
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-[spin_1s_linear_infinite]" />
                  <p className="text-emerald-400 font-medium animate-pulse">Fetchin' market data...</p>
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
          <footer className="border-t border-white/10 px-8 py-4 font-vi4">
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
                <span className="gradient-text font-semibold animate-pulse">The Lit Coders</span>
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