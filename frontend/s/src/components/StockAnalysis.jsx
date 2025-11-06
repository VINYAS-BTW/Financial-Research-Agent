import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { fetchStockData } from "../api";

function StockAnalysis({ symbol1, symbol2, period,trigger }) {
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  // ✅ Fetch both stock data from FastAPI
  useEffect(() => {
  async function loadData() {
    if (!symbol1) return; // ✅ prevent blank crash
    const d1 = await fetchStockData(symbol1, period);
    setData1(d1);
    if (symbol2 && symbol2 !== symbol1) {
      const d2 = await fetchStockData(symbol2, period);
      setData2(d2);
    } else {
      setData2(null);
    }
  }
  loadData();
}, [symbol1, symbol2, period, trigger]); // ✅ include trigger


  // ✅ Reusable section renderer
  const renderStockSection = (data, error, symbol) => {
    if (loading) return <div className="loading">Loading {symbol}...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!data || data.length === 0)
      return <div className="info">No data available</div>;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const priceChange = previous ? latest.Close - previous.Close : 0;
    const priceChangePct = previous
      ? ((priceChange / previous.Close) * 100).toFixed(2)
      : 0;
    const latestRSI = latest.RSI ? latest.RSI.toFixed(2) : "N/A";

    return (
      <div className="stock-section">
        <h3>{symbol}</h3>

        <div className="metrics">
          <div className="metric-card">
            <div className="metric-label">Latest Price</div>
            <div className="metric-value">₹{latest.Close.toFixed(2)}</div>
            <div
              className={`metric-change ${
                priceChange >= 0 ? "positive" : "negative"
              }`}
            >
              {priceChange >= 0 ? "↑" : "↓"} {Math.abs(priceChangePct)}%
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Data Points</div>
            <div className="metric-value">{data.length}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Latest RSI</div>
            <div className="metric-value">{latestRSI}</div>
          </div>
        </div>

        {/* Price Chart */}
        <Plot
          data={[
            {
              x: data.map((d) => d.Date),
              y: data.map((d) => d.Close),
              type: "scatter",
              mode: "lines",
              name: `${symbol} Close`,
              line: { color: "#1f77b4", width: 2.5 },
            },
            {
              x: data.map((d) => d.Date),
              y: data.map((d) => d.MA20),
              type: "scatter",
              mode: "lines",
              name: "20-Day MA",
              line: { color: "#ff7f0e", width: 2, dash: "dash" },
            },
          ]}
          layout={{
            title: `${symbol} Stock Price`,
            xaxis: { title: "Date" },
            yaxis: { title: "Price (INR)" },
            hovermode: "x unified",
            height: 400,
            margin: { t: 50, b: 50 },
          }}
          config={{ responsive: true }}
          style={{ width: "100%" }}
        />

        {/* RSI Chart */}
        <Plot
          data={[
            {
              x: data.map((d) => d.Date),
              y: data.map((d) => d.RSI),
              type: "scatter",
              mode: "lines",
              name: "RSI",
              line: { color: "#2ca02c", width: 2.5 },
            },
          ]}
          layout={{
            title: `${symbol} RSI`,
            xaxis: { title: "Date" },
            yaxis: { title: "RSI Value", range: [0, 100] },
            shapes: [
              {
                type: "line",
                y0: 70,
                y1: 70,
                xref: "paper",
                x0: 0,
                x1: 1,
                line: { color: "red", dash: "dot" },
              },
              {
                type: "line",
                y0: 30,
                y1: 30,
                xref: "paper",
                x0: 0,
                x1: 1,
                line: { color: "blue", dash: "dot" },
              },
              {
                type: "line",
                y0: 50,
                y1: 50,
                xref: "paper",
                x0: 0,
                x1: 1,
                line: { color: "gray", dash: "dot", width: 1 },
              },
            ],
            height: 300,
          }}
          config={{ responsive: true }}
          style={{ width: "100%" }}
        />
      </div>
    );
  };

  const renderComparison = () => {
    if (!data1 || !data2) return null;
    return (
      <div className="comparison-section">
        <h3>📊 Comparison Chart</h3>
        <Plot
          data={[
            {
              x: data1.map((d) => d.Date),
              y: data1.map((d) => d.Close),
              type: "scatter",
              mode: "lines",
              name: symbol1,
              line: { color: "#1f77b4", width: 2.5 },
            },
            {
              x: data2.map((d) => d.Date),
              y: data2.map((d) => d.Close),
              type: "scatter",
              mode: "lines",
              name: symbol2,
              line: { color: "#ff7f0e", width: 2.5 },
            },
          ]}
          layout={{
            title: `${symbol1} vs ${symbol2}`,
            xaxis: { title: "Date" },
            yaxis: { title: "Price (INR)" },
            hovermode: "x unified",
            height: 450,
          }}
          config={{ responsive: true }}
          style={{ width: "100%" }}
        />
      </div>
    );
  };

  return (
    <div className="stock-analysis">
      <h2>📈 Stock Price & Technical Indicators</h2>

      <div className="stocks-grid">
        <div className="stock-column">
          {renderStockSection(data1, error1, symbol1)}
        </div>

        <div className="stock-column">
          {symbol2 && symbol2 !== symbol1 ? (
            renderStockSection(data2, error2, symbol2)
          ) : (
            <div className="info-box">
              💡 Enter a second stock symbol above for comparison
            </div>
          )}
        </div>
      </div>

      {renderComparison()}
    </div>
  );
}

export default StockAnalysis;
