import { useState, useEffect, useRef } from "react";
import StockAnalysis from "./StockAnalysis";
import NewsAnalysis from "./NewsAnalysis";
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  searchStocks,
} from "../api.js";
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
  Star,
  X,
  TrendingUp,
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

  // 🔹 History state
  const [history, setHistory] = useState([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const [showWatchlistPanel, setShowWatchlistPanel] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchAbortControllerRef = useRef(null);

  useEffect(() => {
    async function loadWatchlist() {
      const wl = await fetchWatchlist("guest");
      setWatchlist(wl);
    }
    loadWatchlist();
  }, []);

  // 🔹 Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fin_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error loading history", err);
    }
  }, []);

  // 🔹 Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("fin_history", JSON.stringify(history));
    } catch (err) {
      console.error("Error saving history", err);
    }
  }, [history]);

  // Handle search with debouncing and request cancellation
  const handleSearch = async (query) => {
    const trimmedQuery = query.trim();
    setSearchQuery(query);

    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      // Cancel any pending request
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
        searchAbortControllerRef.current = null;
      }
      return;
    }

    // ✅ Cancel previous request if still pending
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    // Show dropdown immediately if query is long enough (for better UX)
    if (trimmedQuery.length >= 2) {
      setShowSearchDropdown(true);
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Show loading state immediately for better UX
    setIsSearching(true);

    // ✅ OPTIMIZED: Reduced debounce from 300ms to 200ms for faster response
    searchTimeoutRef.current = setTimeout(async () => {
      // Create new AbortController for this request
      const abortController = new AbortController();
      searchAbortControllerRef.current = abortController;

      try {
        const results = await searchStocks(trimmedQuery, abortController.signal);
        
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }
        
        const hasResults = (results || []).length > 0;
        setSearchResults(results || []);
        // Keep dropdown open if we have results or query is meaningful
        setShowSearchDropdown(hasResults || trimmedQuery.length >= 2);
      } catch (error) {
        // Ignore abort errors
        if (error.name === 'AbortError' || error.name === 'CanceledError' || abortController.signal.aborted) {
          return;
        }
        console.error("❌ Search error:", error);
        setSearchResults([]);
        // Still show dropdown to display error/empty state if query is meaningful
        setShowSearchDropdown(trimmedQuery.length >= 2);
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
        // Clear abort controller if this was the active request
        if (searchAbortControllerRef.current === abortController) {
          searchAbortControllerRef.current = null;
        }
      }
    }, 200);  // Reduced from 300ms to 200ms
  };

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

  // handleFetch now accepts optional overrides + logs history
  const handleFetch = async (overrideSymbol1, overrideSymbol2) => {
    const s1 = normalizeSymbol(overrideSymbol1 ?? symbol1);
    const s2 = normalizeSymbol(overrideSymbol2 ?? symbol2);

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

      // 🔹 Add to history (latest first)
      setHistory((prev) => [
        {
          id: Date.now(),
          symbol1: s1,
          symbol2: s2 || null,
          period,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      setIsLoading(false);
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleFetch();
  };

  // Enter key handler for the SEARCH input
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Clear any pending search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Check if Ctrl/Cmd is pressed to add to symbol2
      const addToSymbol2 = e.ctrlKey || e.metaKey;

      // If we have search results, use the first one
      if (searchResults.length > 0) {
        const stock = searchResults[0];
        handleSelectStock(stock, addToSymbol2); // will auto-fetch
      } else if (searchQuery.trim().length > 0) {
        // If no results but query exists, try to use it as a symbol
        // Wait a bit for search to complete if it's still running
        if (isSearching) {
          // Wait for search to complete
          setTimeout(() => {
            if (searchResults.length > 0) {
              handleSelectStock(searchResults[0], addToSymbol2);
            } else {
              const querySymbol = searchQuery.trim();
              setShowSearchDropdown(false);
              setSearchResults([]);
              setSearchQuery("");
              if (addToSymbol2) {
                handleFetch(symbol1, querySymbol);
              } else {
                handleFetch(querySymbol, symbol2);
              }
            }
          }, 100);
        } else {
          const querySymbol = searchQuery.trim();
          setShowSearchDropdown(false);
          setSearchResults([]);
          setSearchQuery("");
          if (addToSymbol2) {
            handleFetch(symbol1, querySymbol);
          } else {
            handleFetch(querySymbol, symbol2);
          }
        }
      }
    } else if (e.key === "Escape") {
      // Close dropdown on Escape
      setShowSearchDropdown(false);
    }
  };

  // selecting a result now triggers analysis
  const handleSelectStock = (stock, addToSymbol2 = false) => {
    if (!stock || !stock.symbol) {
      return;
    }
    
    setSearchQuery("");
    setShowSearchDropdown(false);
    setSearchResults([]);
    
    if (addToSymbol2) {
      // Add to symbol2 for comparison
      handleFetch(symbol1, stock.symbol);
    } else {
      // Set as symbol1 (default behavior)
      handleFetch(stock.symbol, symbol2);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // direct analyze from watchlist panel
  const handleWatchlistClick = async (symbol) => {
    setShowWatchlistPanel(false);
    handleFetch(symbol, symbol2);
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    await removeFromWatchlist(symbol, "guest");
    const wl = await fetchWatchlist("guest");
    setWatchlist(wl);
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
          box-shadow: 0 0 0 4px rgba(16,185,129,0.3), 0 0 20px rgba(16,185,129,0.4);
          border-color: rgba(16,185,129,0.8);
          transform: scale(1.03);
        }
        
        .input-glow:hover:not(:focus) {
          box-shadow: 0 0 15px rgba(16,185,129,0.2);
          transform: scale(1.01);
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
        
        .watchlist-panel {
          position: fixed;
          top: 0;
          left: 80px;
          height: 100vh;
          width: 320px;
          background: linear-gradient(135deg, rgba(10,11,14,0.98) 0%, rgba(15,20,25,0.98) 100%);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255,255,255,0.1);
          box-shadow: 8px 0 32px rgba(0,0,0,0.5);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 45;
          overflow-y: auto;
        }
        
        .watchlist-panel.open {
          transform: translateX(0);
        }
        
        .watchlist-stock-item {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
        }
        
        .watchlist-stock-item:hover {
          transform: translateX(4px);
          background: rgba(16, 185, 129, 0.1);
        }
        
        .watchlist-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 44;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .watchlist-overlay.open {
          opacity: 1;
          pointer-events: all;
        }
        
        .search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: linear-gradient(135deg, rgba(15,20,25,0.98) 0%, rgba(20,25,30,0.98) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.5);
          max-height: 400px;
          overflow-y: auto;
          z-index: 50;
          animation: fadeIn 0.2s ease-out;
        }
        
        .search-result-item {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .search-result-item:last-child {
          border-bottom: none;
        }
        
        .search-result-item:hover {
          background: rgba(16, 185, 129, 0.1);
          transform: translateX(4px);
        }
      `}</style>

      {/* Animated Background Gradients */}
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <div className="absolute bottom-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-[120px] animate-float" />
      </div>

      <div className="relative flex font-vi">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-20 glass-card flex flex-col items-center py-6 z-50">
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

          <nav className="flex-1 flex flex-col items-center space-y-4">
            <button className="w-12 h-12 rounded-3xl glass-card flex items-center justify-center text-emerald-400 relative overflow-hidden group icon-float bg-gradient-to-br from-emerald-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Grid3x3 className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
            </button>

            {/* 🔹 Graph icon now opens history panel */}
            <button
              onClick={() => setShowHistoryPanel(true)}
              className="w-12 h-12 rounded-3xl flex items-center justify-center text-gray-500 hover:text-white glass-card group icon-float"
            >
              <BarChart3 className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={() => setShowWatchlistPanel(!showWatchlistPanel)}
              className={`w-12 h-12 rounded-3xl flex items-center justify-center glass-card group icon-float relative overflow-hidden ${
                showWatchlistPanel
                  ? "text-emerald-400 bg-gradient-to-br from-emerald-500/20"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {showWatchlistPanel && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent opacity-100 transition-opacity duration-300" />
              )}
              <Star
                className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform"
                fill={showWatchlistPanel ? "currentColor" : "none"}
              />
              {/* 🔹 dot only, no 1/2/3 number */}
              {watchlist.length > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>
          </nav>

          <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-100 hover:text-white glass-card group icon-float relative">
            <Bell className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-scale-pulse" />
          </button>
        </aside>

        {/* Overlay for both panels */}
        <div
          className={`watchlist-overlay ${
            showWatchlistPanel || showHistoryPanel ? "open" : ""
          }`}
          onClick={() => {
            setShowWatchlistPanel(false);
            setShowHistoryPanel(false);
          }}
        />

        {/* Watchlist Panel */}
        <div className={`watchlist-panel ${showWatchlistPanel ? "open" : ""}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-emerald-400" fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-vi4">
                    Watchlist
                  </h2>
                  <p className="text-xs text-gray-500 font-vi">
                    {watchlist.length} stocks tracked
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWatchlistPanel(false)}
                className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {symbol1 && (
              <button
                onClick={async () => {
                  await addToWatchlist(symbol1, "guest");
                  const wl = await fetchWatchlist("guest");
                  setWatchlist(wl);
                }}
                className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl text-sm text-emerald-400 transition-all flex items-center justify-center gap-2 backdrop-blur-xl font-vi"
              >
                <Plus className="w-4 h-4" />
                Add {symbol1} to Watchlist
              </button>
            )}

            <div className="space-y-2">
              {watchlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-emerald-400/50" />
                  </div>
                  <p className="text-gray-500 text-sm font-vi">
                    Your watchlist is empty
                  </p>
                  <p className="text-gray-600 text-xs mt-1 font-vi">
                    Add stocks to track them
                  </p>
                </div>
              ) : (
                watchlist.map((item, i) => (
                  <div
                    key={i}
                    className="watchlist-stock-item glass-card rounded-xl p-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleWatchlistClick(item.symbol)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-400 font-vi">
                              {item.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-white font-vi3">
                              {item.symbol}
                            </h3>
                            <p className="text-xs text-gray-500 font-vi">
                              Click to analyze
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromWatchlist(item.symbol);
                        }}
                        className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {watchlist.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center font-vi">
                  Click any stock to start analysis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 🔹 History Panel (right side) */}
        <div
          className={`fixed top-0 right-0 h-screen w-80 bg-gradient-to-br from-[#0a0b0e]/95 to-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl shadow-black/60 transform transition-transform duration-300 z-[46] ${
            showHistoryPanel ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-vi4">
                    Analysis History
                  </h2>
                  <p className="text-xs text-gray-500 font-vi">
                    {history.length} runs logged
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm font-vi">
                  No history yet
                </p>
                <p className="text-gray-600 text-xs mt-1 font-vi">
                  Run an analysis to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowHistoryPanel(false);
                      handleFetch(item.symbol1, item.symbol2 || undefined);
                    }}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:bg-sky-500/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-semibold text-white font-vi3">
                          {item.symbol1}
                          {item.symbol2 ? ` · ${item.symbol2}` : ""}
                        </h3>
                        <p className="text-xs text-gray-500 font-vi mt-0.5">
                          Period: {item.period}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 font-vi">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-20">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-40 ">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-white animate-fadeIn font-vi4">
                    Dashboard
                  </h1>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 px-4 py-2 rounded-full  relative overflow-hidden">
                    <div className="flex items-center space-x-2 relative z-10">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-scale-pulse" />
                      <span className="text-sm text-gray-300 font-vi">
                        Main Portfolio
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 ml-6 relative z-10">
                      <div
                        className="w-2 h-2 bg-rose-400 rounded-full animate-scale-pulse"
                        style={{ animationDelay: "0.5s" }}
                      />
                      <span className="text-sm text-gray-300 font-vi">
                        All Stocks (08)
                      </span>
                    </div>
                  </div>

                  {/* Search with Dropdown */}
                  <div className="relative group" ref={searchInputRef}>
                    <Search
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                        isSearching
                          ? "text-emerald-400 animate-pulse"
                          : "text-gray-400"
                      } group-focus-within:text-emerald-400`}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowSearchDropdown(true);
                        }
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search by name or symbol..."
                      className="w-64 pl-10 pr-4 py-2 glass-card rounded-full text-sm text-white placeholder-gray-500 focus:outline-none input-glow transition-all"
                    />

                    {/* Search Dropdown */}
                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="search-dropdown">
                        {searchResults.map((stock, idx) => (
                          <div
                            key={stock.symbol || idx}
                            className="search-result-item group"
                          >
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => handleSelectStock(stock, false)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                handleSelectStock(stock, true);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white truncate">
                                  {stock.symbol || "N/A"}
                                </h4>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                  {stock.displayName || stock.name || "No name available"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <div className="text-right flex-shrink-0">
                                  {stock.exchange && (
                                    <span className="text-xs text-emerald-400 font-medium">
                                      {stock.exchange}
                                    </span>
                                  )}
                                  {stock.sector && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {stock.sector}
                                    </p>
                                  )}
                                </div>
                                {/* Action buttons */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectStock(stock, false);
                                    }}
                                    className="px-2 py-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-md transition-colors"
                                    title="Set as Stock 1"
                                  >
                                    1
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectStock(stock, true);
                                    }}
                                    className="px-2 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-md transition-colors"
                                    title="Add to Stock 2 (for comparison)"
                                  >
                                    2
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1 px-1 opacity-0 group-hover:opacity-70 transition-opacity">
                              Click = Stock 1 • Right-click or "2" = Stock 2 • Ctrl+Enter = Stock 2
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show message when searching */}
                    {isSearching && searchQuery.trim().length > 0 && !showSearchDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 p-3 glass-card rounded-xl text-center z-50">
                        <p className="text-sm text-gray-400">Searching...</p>
                      </div>
                    )}
                    
                    {/* Show message when no results */}
                    {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && showSearchDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 p-3 glass-card rounded-xl text-center z-50">
                        <p className="text-sm text-gray-400">No results found</p>
                        <p className="text-xs text-gray-500 mt-1">Try searching by symbol or company name</p>
                      </div>
                    )}
                  </div>

                  <button className="px-4 py-2 bg-gradient-to-r from-emerald-900 to-neutral-900 rounded-3xl text-white shadow-xl relative overflow-hidden group ">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Add Stock</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub Navigation - Enhanced Prominent Section */}
            <div className="px-8 py-6 border-t border-white/10 border-b bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent relative">
              {/* Glow effect behind the section */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent opacity-50 blur-xl pointer-events-none" />
              
              <div className="relative flex items-center justify-between gap-6">
                {/* Stock Input Pills - Larger */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium font-vi">Your Stocks</span>
                    <div className="w-1 h-1 bg-gray-700 rounded-full" />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={symbol1}
                      onChange={(e) => setSymbol1(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="RELIANCE.NS"
                      className="px-5 py-3 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border-2 border-emerald-500/40 hover:border-emerald-500/70 focus:border-emerald-500 rounded-xl text-base font-medium text-white placeholder-gray-400 focus:outline-none backdrop-blur-xl w-40 input-glow transition-all shadow-lg shadow-emerald-500/20"
                    />
                    <input
                      type="text"
                      value={symbol2}
                      onChange={(e) => setSymbol2(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="TCS.NS"
                      className="px-5 py-3 bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border-2 border-cyan-500/40 hover:border-cyan-500/70 focus:border-cyan-500 rounded-xl text-base font-medium text-white placeholder-gray-400 focus:outline-none backdrop-blur-xl w-40 input-glow transition-all shadow-lg shadow-cyan-500/20"
                    />
                  </div>
                </div>

                {/* Center Tabs - Larger and more prominent */}
                <div className="flex items-center space-x-2 glass-card rounded-2xl p-2 shadow-2xl border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5">
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
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-600 to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/50" />
                        )}
                        <Icon className={`w-4 h-4 relative z-10 ${isActive ? "animate-bounce-subtle" : ""}`} />
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Period & Fetch - Larger */}
                <div className="flex items-center space-x-4">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-5 py-3 glass-card rounded-xl text-base font-medium text-gray-200 focus:outline-none input-glow cursor-pointer hover:border-white/40 transition-all border-2 border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-lg"
                  >
                    <option value="1mo" className="bg-gray-900">
                      1 Month
                    </option>
                    <option value="3mo" className="bg-gray-900">
                      3 Months
                    </option>
                    <option value="6mo" className="bg-gray-900">
                      6 Months
                    </option>
                    <option value="1y" className="bg-gray-900">
                      1 Year
                    </option>
                  </select>

                  <button
                    onClick={() => handleFetch()}
                    disabled={isLoading}
                    className="px-8 py-3 glass-card hover:bg-white/20 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-xl text-base font-bold text-white transition-all disabled:opacity-50 relative overflow-hidden group shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 btn-glow"
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
                <span className="text-xs text-gray-500 font-medium shrink-0">
                  Quick Access:
                </span>
                {watchlist.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleFetch(item.symbol, symbol2)}
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
                <h3 className="text-xl font-semibold text-white mb-2 font-vi3">
                  Ready to Analyze?
                </h3>
                <p className="text-gray-500 mb-6 font-vi">
                  Enter stock symbols and click "Fetch Data" to begin
                </p>
                <button
                  onClick={() => handleFetch()}
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
                  <p className="text-emerald-400 font-medium animate-pulse">
                    Fetchin' market data...
                  </p>
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
                <span className="gradient-text font-semibold animate-pulse">
                  The Lit Coders
                </span>
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
