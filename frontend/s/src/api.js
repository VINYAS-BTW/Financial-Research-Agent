import axios from "axios";

export const API_BASE = "http://localhost:8000/api";

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
