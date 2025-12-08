import axios from "axios";

export const API_BASE = "http://localhost:8000/api";

// ✅ Search stocks from MongoDB
export async function searchStocks(query) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const res = await axios.get(`${API_BASE}/stocks/search`, {
      params: { q: query.trim() },
    });

    console.log("🔍 Search API Response:", res.data);

    if (res.data.success && Array.isArray(res.data.results)) {
      return res.data.results;
    } else {
      console.warn("⚠️ Invalid search response:", res.data);
      return [];
    }
  } catch (error) {
    console.error("❌ Search API Error:", error.message);
    return [];
  }
}

// ✅ Fetch stock data (GET request)
export async function fetchStockData(symbol, period = "3mo") {
  try {
    const res = await axios.get(`${API_BASE}/stock-data`, {
      params: { symbol, period },
    });

    console.log("📊 Stock API Response:", res.data);

    if (res.data.success && Array.isArray(res.data.data)) {
      return res.data.data; // only the list of stock points
    } else {
      console.warn("⚠️ Invalid stock API format or no data:", res.data);
      return [];
    }
  } catch (error) {
    console.error("❌ Stock API Error:", error.message);
    return [];
  }
}

// ✅ Fetch news data (GET request)
export async function fetchNewsData(symbol) {
  try {
    const res = await axios.get(`${API_BASE}/news`, { params: { symbol } });

    console.log("📰 News API Response:", res.data);

    if (res.data && res.data.success && Array.isArray(res.data.articles)) {
      return res.data.articles;
    } else {
      console.warn("⚠️ No valid articles:", res.data);
      return [];
    }
  } catch (error) {
    console.error("❌ News API Error:", error.message);
    return [];
  }
}

// ✅ Fetch watchlist
export async function fetchWatchlist(userId = "guest") {
  try {
    const res = await axios.get(`${API_BASE}/watchlist/${userId}`);
    return res.data.items || [];
  } catch (err) {
    console.error("⚠️ Fetch Watchlist Error:", err.message);
    return [];
  }
}

// ✅ Add to watchlist
export async function addToWatchlist(symbol, userId = "guest") {
  try {
    const res = await axios.post(`${API_BASE}/watchlist/${userId}/add`, {
      symbol,
    });
    return res.data;
  } catch (err) {
    console.error("❌ Add Watchlist Error:", err.message);
    return null;
  }
}

// ✅ Remove from watchlist
export async function removeFromWatchlist(symbol, userId = "guest") {
  try {
    const res = await axios.post(`${API_BASE}/watchlist/${userId}/remove`, {
      symbol,
    });
    return res.data;
  } catch (err) {
    console.error("❌ Remove Watchlist Error:", err.message);
    return null;
  }
}