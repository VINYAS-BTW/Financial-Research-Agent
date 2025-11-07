import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { fetchStockData } from "../api";

function StockAnalysis({ symbol1, symbol2, period, trigger }) {
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!symbol1) return;
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
  }, [symbol1, symbol2, period, trigger]);

  const renderStockSection = (data, error, symbol) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Loading {symbol}...
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      );
    }
    if (!data || data.length === 0) {
      return (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-xl">
          No data available
        </div>
      );
    }

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const priceChange = previous ? latest.Close - previous.Close : 0;
    const priceChangePct = previous
      ? ((priceChange / previous.Close) * 100).toFixed(2)
      : 0;
    const latestRSI = latest.RSI ? latest.RSI.toFixed(2) : "N/A";

    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white mb-4">{symbol}</h3>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 hover:border-blue-500/30 transition">
            <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Latest Price
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ₹{latest.Close.toFixed(2)}
            </div>
            <div
              className={`text-sm font-semibold ${
                priceChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceChange >= 0 ? "↑" : "↓"} {Math.abs(priceChangePct)}%
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 hover:border-blue-500/30 transition">
            <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Data Points
            </div>
            <div className="text-2xl font-bold text-white">{data.length}</div>
          </div>

          <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-4 hover:border-blue-500/30 transition">
            <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Latest RSI
            </div>
            <div className="text-2xl font-bold text-white">{latestRSI}</div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-4xl p-4">
          <Plot
            data={[
              {
                x: data.map((d) => d.Date),
                y: data.map((d) => d.Close),
                type: "scatter",
                mode: "lines",
                name: `${symbol} Close`,
                line: { color: "#60a5fa", width: 2.5 },
              },
              {
                x: data.map((d) => d.Date),
                y: data.map((d) => d.MA20),
                type: "scatter",
                mode: "lines",
                name: "20-Day MA",
                line: { color: "#a78bfa", width: 2, dash: "dash" },
              },
            ]}
            layout={{
              title: {
                text: `${symbol} Stock Price`,
                font: { color: "#e5e7eb", size: 16 },
              },
              paper_bgcolor: "#0a0a0f",
              plot_bgcolor: "#0a0a0f",
              xaxis: {
                title: "Date",
                color: "#9ca3af",
                gridcolor: "#1f2937",
              },
              yaxis: {
                title: "Price (INR)",
                color: "#9ca3af",
                gridcolor: "#1f2937",
              },
              hovermode: "x unified",
              height: 400,
              margin: { t: 50, b: 50, l: 60, r: 20 },
              legend: {
                font: { color: "#9ca3af" },
                bgcolor: "rgba(0,0,0,0)",
              },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>

        {/* RSI Chart */}
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-4xl p-4">
          <Plot
            data={[
              {
                x: data.map((d) => d.Date),
                y: data.map((d) => d.RSI),
                type: "scatter",
                mode: "lines",
                name: "RSI",
                line: { color: "#34d399", width: 2.5 },
              },
            ]}
            layout={{
              title: {
                text: `${symbol} RSI`,
                font: { color: "#e5e7eb", size: 16 },
              },
              paper_bgcolor: "#0a0a0f",
              plot_bgcolor: "#0a0a0f",
              xaxis: {
                title: "Date",
                color: "#9ca3af",
                gridcolor: "#1f2937",
              },
              yaxis: {
                title: "RSI Value",
                range: [0, 100],
                color: "#9ca3af",
                gridcolor: "#1f2937",
              },
              shapes: [
                {
                  type: "line",
                  y0: 70,
                  y1: 70,
                  xref: "paper",
                  x0: 0,
                  x1: 1,
                  line: { color: "#ef4444", dash: "dot", width: 2 },
                },
                {
                  type: "line",
                  y0: 30,
                  y1: 30,
                  xref: "paper",
                  x0: 0,
                  x1: 1,
                  line: { color: "#3b82f6", dash: "dot", width: 2 },
                },
                {
                  type: "line",
                  y0: 50,
                  y1: 50,
                  xref: "paper",
                  x0: 0,
                  x1: 1,
                  line: { color: "#6b7280", dash: "dot", width: 1 },
                },
              ],
              height: 300,
              margin: { t: 50, b: 50, l: 60, r: 20 },
              legend: {
                font: { color: "#9ca3af" },
                bgcolor: "rgba(0,0,0,0)",
              },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!data1 || !data2) return null;
    return (
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="text-3xl font-bold text-white mb-6">
           Comparison Chart
        </h3>
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-4">
          <Plot
            data={[
              {
                x: data1.map((d) => d.Date),
                y: data1.map((d) => d.Close),
                type: "scatter",
                mode: "lines",
                name: symbol1,
                line: { color: "#60a5fa", width: 2.5 },
              },
              {
                x: data2.map((d) => d.Date),
                y: data2.map((d) => d.Close),
                type: "scatter",
                mode: "lines",
                name: symbol2,
                line: { color: "#f472b6", width: 2.5 },
              },
            ]}
            layout={{
              title: {
                text: `${symbol1} vs ${symbol2}`,
                font: { color: "#e5e7eb", size: 16 },
              },
              paper_bgcolor: "#0a0a0f",
              plot_bgcolor: "#0a0a0f",
              xaxis: {
                title: "Date",
                color: "#9ca3af",
                gridcolor: "#1f2937",
              },
              yaxis: {
                title: "Price (INR)",
                color: "#9ca3af",
                gridcolor: "#1f2937",
              },
              hovermode: "x unified",
              height: 450,
              margin: { t: 50, b: 50, l: 60, r: 20 },
              legend: {
                font: { color: "#9ca3af" },
                bgcolor: "rgba(0,0,0,0)",
              },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold bg-linear-to-r from-neutral-100 via-cyan-100 to-neutral-100 bg-clip-text text-transparent mb-6">
         Stock Price & Technical Indicators
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>{renderStockSection(data1, error1, symbol1)}</div>

        <div>
          {symbol2 && symbol2 !== symbol1 ? (
            renderStockSection(data2, error2, symbol2)
          ) : (
            <div className="flex items-center justify-center h-full bg-[#0a0a0f] border border-gray-800 rounded-xl text-gray-400">
              Enter a second stock symbol above for comparison
            </div>
          )}
        </div>
      </div>

      {renderComparison()}
    </div>
  );
}

export default StockAnalysis;