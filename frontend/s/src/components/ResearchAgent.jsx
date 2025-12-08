import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { runUnifiedAgent } from "../api/agentApi";

export default function ResearchAgent() {
  const [messages, setMessages] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [query, setQuery] = useState("");
  const [ticker, setTicker] = useState("");

  const scrollRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analysisData]);

  const runAgent = async () => {
    if (!query.trim() || !ticker.trim()) {
      alert("Please enter both ticker and query");
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `Ticker: ${ticker}\nQuery: ${query}`,
    };

    setMessages((prev) => [...prev, userMessage]);
    setAnalysisData(null);
    setLoading(true);

    try {
      console.log("🚀 Calling unified agent with:", { ticker, query });
      
      const res = await runUnifiedAgent(ticker, query);
      
      console.log(" Response:", res);

      if (res.success && res.data) {
        const data = res.data;
        setAnalysisData(data);

        // Add unified analysis to chat
        if (data.analysis) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "agent",
              content: data.analysis,
              isComparison: data.is_comparison || false,
              comparisonTicker: data.comparison_ticker || null,
            },
          ]);
        } else {
          // Fallback if no analysis field
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "error",
              content: "Analysis completed but no summary available. Check reasoning trace.",
            },
          ]);
        }
      } else {
        throw new Error(res.message || "Analysis failed");
      }
    } catch (error) {
      console.error(" Agent error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: "error",
          content: `Error: ${error.message || "Unified Agent crashed. Try again."}`,
        },
      ]);
    }

    setLoading(false);
  };

  const handleExportPdf = async () => {
    if (!pdfRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("research-report.pdf");
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF");
    }
    setExporting(false);
  };

  return (
    <div className="w-full text-gray-200">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            AI Research Agent
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Deep analysis with multi-step reasoning and intelligent tools
          </p>
        </div>

       
      </div>

      {/* INPUT FIELDS */}
      <div className="flex flex-col gap-3 mb-6">
        <input
          className="bg-[#111] border border-gray-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-gray-100 "
          placeholder="Enter ticker e.g. RELIANCE.NS (or multiple: RELIANCE.NS TCS.NS)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />

        <input
          className="bg-[#111] border border-gray-700 rounded-3xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-gray-100"
          placeholder='Ask your research question... (e.g. "which is better to buy")'
          value={query}
          onKeyDown={(e) => e.key === "Enter" && runAgent()}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={runAgent}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-900 hover:from-emerald-600 hover:to-teal-900 px-6 py-3 rounded-2xl text-white font-semibold transition disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? "Runnin'..." : "Run Research Agent"}
          </button>
        </div>
      </div>

      {/* MAIN PANES */}
      <div ref={pdfRef} className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* LEFT – CHAT */}
        <div className="lg:col-span-6 bg-[#12141a] border border-gray-800 p-4 rounded-xl max-h-[70vh] overflow-y-auto">
          {messages.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center text-gray-200 text-sm">
              <div className="text-center">
                <p>Ask a question to start research session</p>
                <p className="text-xs mt-2 text-gray-600">
                   Tip: For comparison, enter multiple tickers separated by space
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <AgentMessage key={msg.id} {...msg} />
          ))}

          {loading && <TypingLoader />}

          <div ref={scrollRef} />
        </div>

        {/* RIGHT – REASONING TRACE */}
        <div className="lg:col-span-4 bg-[#12141a] border border-gray-800 p-4 rounded-xl max-h-[70vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-emerald-400 mb-3">
            Reasoning Trace
          </h2>

          {!analysisData && !loading && (
            <p className="text-gray-400 text-sm">
              Agent reasoning and tools will appear here
            </p>
          )}

          {analysisData && <ReasoningTrace data={analysisData} />}

          {loading && <StepSkeleton />}
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ type, content, isComparison, comparisonTicker }) {
  if (type === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl max-w-[75%] shadow text-sm">
          {content}
        </div>
      </div>
    );
  }

  if (type === "agent") {
    return (
      <div className="flex justify-start mb-3">
        <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl max-w-[85%] text-sm">
          {isComparison && (
            <div className="mb-2 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300 inline-block">
               Comparison Mode
            </div>
          )}
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="flex justify-center mb-3">
        <div className="px-4 py-3 bg-red-900/40 border border-red-600 text-red-200 rounded-xl max-w-[75%] text-sm">
          {content}
        </div>
      </div>
    );
  }

  return null;
}

function ReasoningTrace({ data }) {
  if (!data) return null;

  const sentiment1 = data.sentiment?.ticker_1;
  const sentiment2 = data.sentiment?.ticker_2;
  const technical1 = data.technical?.ticker_1;
  const technical2 = data.technical?.ticker_2;
  const recommendations = data.recommendations || [];

  return (
    <div className="space-y-3">
      {/* Step 1: Data Fetch */}
      <StepCard
        stepNumber={1}
        title="Data Fetch"
        status="completed"
        content={`Fetched stock data and news for ${data.ticker || 'stock'}${
          data.is_comparison ? ` and ${data.comparison_ticker || 'comparison'}` : ""
        }`}
      />

      {/* Step 2: Sentiment Analysis */}
      {sentiment1 !== undefined && (
        <StepCard
          stepNumber={2}
          title="Sentiment Analysis"
          status="completed"
        >
          <div className="space-y-2 mt-2">
            <SentimentBar
              label={data.ticker || 'Stock 1'}
              score={sentiment1}
              color="emerald"
            />
            {data.is_comparison && sentiment2 !== undefined && (
              <SentimentBar
                label={data.comparison_ticker || 'Stock 2'}
                score={sentiment2}
                color="pink"
              />
            )}
          </div>
        </StepCard>
      )}

      {/* Step 3: Technical Indicators */}
      {technical1 && (
        <StepCard
          stepNumber={3}
          title="Technical Indicators"
          status="completed"
        >
          <div className="space-y-2 mt-2">
            <SignalBadge
              ticker={data.ticker || 'Stock 1'}
              signal={technical1?.signals?.overall_signal}
              rsi={technical1?.rsi?.current}
            />
            {data.is_comparison && technical2 && (
              <SignalBadge
                ticker={data.comparison_ticker || 'Stock 2'}
                signal={technical2?.signals?.overall_signal}
                rsi={technical2?.rsi?.current}
              />
            )}
          </div>
        </StepCard>
      )}

      {/* Step 4: Synthesis */}
      {recommendations.length > 0 && (
        <StepCard
          stepNumber={4}
          title="AI Synthesis"
          status="completed"
        >
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-2">Key Recommendations:</p>
            <ul className="space-y-1">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="line-clamp-2">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </StepCard>
      )}

      {data.timestamp && (
        <div className="text-xs text-gray-500 text-center pt-2">
          {new Date(data.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function StepCard({ stepNumber, title, status, content, children }) {
  const statusColors = {
    completed: "text-emerald-400",
    pending: "text-yellow-400",
    failed: "text-red-400",
  };

  return (
    <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs text-gray-400">Step {stepNumber}</p>
          <p className={`font-semibold capitalize text-sm ${statusColors[status] || statusColors.completed}`}>
            {title}
          </p>
        </div>
        <div className={`text-lg ${statusColors[status] || statusColors.completed}`}>
          {status === "completed" ? "✓" : status === "failed" ? "✗" : "⋯"}
        </div>
      </div>

      {content && (
        <div className="mt-1 text-gray-300 text-xs whitespace-pre-wrap">
          {content}
        </div>
      )}

      {children}
    </div>
  );
}

function SentimentBar({ label, score, color }) {
  const percentage = ((score || 0.5) * 100).toFixed(0);
  const colorClasses = {
    emerald: "bg-emerald-500",
    pink: "bg-pink-500",
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-400">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color] || colorClasses.emerald} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SignalBadge({ ticker, signal, rsi }) {
  const signalColors = {
    strong_buy: "bg-green-500/20 text-green-300 border-green-500/30",
    buy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    hold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    sell: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    strong_sell: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const colorClass = signalColors[signal] || signalColors.hold;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-300 font-medium">{ticker}</span>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded border ${colorClass} uppercase text-[10px]`}>
          {(signal || 'hold').replace("_", " ")}
        </span>
        {rsi && (
          <span className="text-gray-400">
            RSI: {typeof rsi === "number" ? rsi.toFixed(1) : rsi}
          </span>
        )}
      </div>
    </div>
  );
}

function TypingLoader() {
  return (
    <div className="px-3 py-2 bg-gray-800 rounded-lg text-emerald-400 w-fit mb-3 text-xs flex items-center gap-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
      <span>Thinking...</span>
    </div>
  );
}

function StepSkeleton() {
  return (
    <div className="animate-pulse space-y-3 mt-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-16 bg-gray-800/40 rounded-xl border border-gray-700"
        />
      ))}
    </div>
  );
}