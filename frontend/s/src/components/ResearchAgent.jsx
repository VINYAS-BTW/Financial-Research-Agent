import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  runResearchAgent,
  runGeminiLLM,
  runGroqLLM,
} from "../api/agentApi";

export default function ResearchAgent() {
  const [messages, setMessages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [finalAns, setFinalAns] = useState("");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [query, setQuery] = useState("");
  const [ticker, setTicker] = useState("");

  const [collapsedSteps, setCollapsedSteps] = useState({});

  const scrollRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, steps, finalAns]);

  const toggleStep = (index) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const runAgent = async () => {
    if (!query.trim() || !ticker.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `Ticker: ${ticker}\nQuery: ${query}`,
    };

    setMessages((prev) => [...prev, userMessage]);
    setSteps([]);
    setFinalAns("");
    setLoading(true);

    try {
      const res = await runResearchAgent(ticker, query);

      if (res.data?.steps) setSteps(res.data.steps);

      if (res.data?.ai_summary) {
        setFinalAns(res.data.ai_summary);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "agent",
            content: res.data.ai_summary,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: "error",
          content: "Research Agent crashed. Try again.",
        },
      ]);
    }

    setLoading(false);
  };

  const runGemini = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const res = await runGeminiLLM(query);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "agent", content: res.response },
    ]);

    setLoading(false);
  };

  const runGroq = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const res = await runGroqLLM(query);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "agent", content: res.response },
    ]);

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

        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="px-4 py-2 rounded-lg border border-gray-700 bg-[#12141a] hover:bg-[#1a1c24] text-emerald-400 text-sm font-medium transition disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export as PDF"}
        </button>
      </div>

      {/* INPUT FIELDS */}
      <div className="flex flex-col gap-3 mb-6">
        <input
          className="bg-[#12141a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
          placeholder="Enter ticker e.g. RELIANCE.NS"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />

        <input
          className="bg-[#12141a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
          placeholder="Ask your research question..."
          value={query}
          onKeyDown={(e) => e.key === "Enter" && runAgent()}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={runAgent}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-3 rounded-xl text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Research Agent"}
          </button>

          <button
            onClick={runGemini}
            disabled={loading}
            className="bg-[#12141a] border border-gray-700 hover:bg-[#1a1c24] px-4 py-3 rounded-xl text-white transition disabled:opacity-50"
          >
            Gemini
          </button>

          <button
            onClick={runGroq}
            disabled={loading}
            className="bg-[#12141a] border border-gray-700 hover:bg-[#1a1c24] px-4 py-3 rounded-xl text-white transition disabled:opacity-50"
          >
            Groq
          </button>
        </div>
      </div>

      {/* MAIN PANES */}
      <div ref={pdfRef} className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* LEFT – CHAT */}
        <div className="lg:col-span-6 bg-[#12141a] border border-gray-800 p-4 rounded-xl max-h-[70vh] overflow-y-auto">
          {messages.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Ask a question to start research session
            </div>
          )}

          {messages.map((msg) => (
            <AgentMessage key={msg.id} {...msg} />
          ))}

          {loading && <TypingLoader />}

          <div ref={scrollRef} />
        </div>

        {/* RIGHT – STEPS */}
        <div className="lg:col-span-4 bg-[#12141a] border border-gray-800 p-4 rounded-xl max-h-[70vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-emerald-400 mb-3">
            Reasoning Trace
          </h2>

          {steps.length === 0 && !loading && (
            <p className="text-gray-400 text-sm">
              Agent reasoning and tools will appear here
            </p>
          )}

          {steps.map((step, index) => (
            <StepItem
              key={index}
              step={step}
              index={index}
              collapsed={!!collapsedSteps[index]}
              onToggle={() => toggleStep(index)}
            />
          ))}

          {loading && <StepSkeleton />}
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ type, content }) {
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
          <ReactMarkdown>{content}</ReactMarkdown>
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

function StepItem({ step, index, collapsed, onToggle }) {
  const isChart = step.type === "chart" && step.chartData;

  return (
    <div className="bg-gray-800/50 p-3 rounded-xl mb-3 border border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs text-gray-400">Step {index + 1}</p>
          <p className="font-semibold text-emerald-400 capitalize text-sm">
            {step.type || "step"}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-gray-400 hover:text-emerald-400"
        >
          {collapsed ? "+" : "−"}
        </button>
      </div>

      {!collapsed && (
        <>
          {step.content && (
            <div className="mt-1 text-gray-300 text-xs whitespace-pre-wrap">
              <ReactMarkdown>{step.content}</ReactMarkdown>
            </div>
          )}

          {isChart && (
            <div className="mt-3 bg-gray-900/60 rounded-xl border border-gray-700 p-2 h-40">
              <ChartCard
                data={step.chartData}
                xKey={step.xKey || "x"}
                yKey={step.yKey || "y"}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChartCard({ data, xKey, yKey }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-xs">
        No chart data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TypingLoader() {
  return (
    <div className="px-3 py-2 bg-gray-800 rounded-lg text-emerald-400 w-fit mb-3 text-xs">
      Thinking...
    </div>
  );
}

function StepSkeleton() {
  return (
    <div className="animate-pulse space-y-3 mt-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 bg-gray-800/40 rounded-xl border border-gray-700"
        />
      ))}
    </div>
  );
}