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

// ⭐ Import your backend agents
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

  // -------------------------------
  // ⭐ MAIN RESEARCH AGENT CALL
  // -------------------------------
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
      // CORRECT request to backend: expects (ticker, query)
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

  // -------------------------------
  // ⭐ GEMINI LLM CALL
  // -------------------------------
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

  // -------------------------------
  // ⭐ GROQ LLM CALL
  // -------------------------------
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

  // -------------------------------
  // PDF EXPORT
  // -------------------------------
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
    <div className="w-full min-h-screen text-gray-200">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-200 to-cyan-500 bg-clip-text text-transparent">
            Research Agent Workspace
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Deep analysis with multi-step reasoning, tools & charts.
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="px-4 py-2 rounded-xl border border-cyan-500/60 bg-neutral-900/70 hover:bg-neutral-800 text-cyan-200 text-sm font-semibold transition disabled:opacity-60"
        >
          {exporting ? "Exporting..." : "Export as PDF"}
        </button>
      </div>

      {/* INPUT FIELDS */}
      <div className="flex flex-col gap-3 mb-6">
        <input
          className="bg-neutral-900/70 border border-cyan-700/40 rounded-2xl px-4 py-3 text-white focus:outline-none"
          placeholder="Enter ticker e.g. RELIANCE.NS"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />

        <input
          className="bg-neutral-900/70 border border-cyan-700/40 rounded-2xl px-4 py-3 text-white focus:outline-none"
          placeholder="Ask your research question..."
          value={query}
          onKeyDown={(e) => e.key === "Enter" && runAgent()}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={runAgent}
            disabled={loading}
            className="bg-cyan-700 hover:bg-cyan-600 px-6 py-3 rounded-xl text-white font-semibold transition"
          >
            {loading ? "Running..." : "Run Research Agent"}
          </button>

          <button
            onClick={runGemini}
            className="bg-indigo-700 hover:bg-indigo-600 px-4 py-3 rounded-xl text-white"
          >
            Gemini Answer
          </button>

          <button
            onClick={runGroq}
            className="bg-rose-700 hover:bg-rose-600 px-4 py-3 rounded-xl text-white"
          >
            Groq Answer
          </button>
        </div>
      </div>

      {/* MAIN PANES */}
      <div ref={pdfRef} className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* LEFT – CHAT */}
        <div className="lg:col-span-6 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/60 max-h-[75vh] overflow-y-auto">
          {messages.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Ask something to start a research session.
            </div>
          )}

          {messages.map((msg) => (
            <AgentMessage key={msg.id} {...msg} />
          ))}

          {loading && <TypingLoader />}

          <div ref={scrollRef} />
        </div>

        {/* RIGHT – STEPS */}
        <div className="lg:col-span-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/60 max-h-[75vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-cyan-300 mb-3">
            Agent Reasoning Trace
          </h2>

          {steps.length === 0 && !loading && (
            <p className="text-gray-400 text-sm">
              Reasoning, tools and charts will appear here.
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

/* ---------------- MESSAGE RENDER ---------------- */
function AgentMessage({ type, content }) {
  if (type === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="px-4 py-2 bg-cyan-800 text-white rounded-xl max-w-[75%] shadow text-sm">
          {content}
        </div>
      </div>
    );
  }

  if (type === "agent") {
    return (
      <div className="flex justify-start mb-3">
        <div className="px-4 py-3 bg-neutral-800 border border-cyan-700/40 rounded-xl max-w-[85%] text-sm">
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

/* ---------------- STEPS (Right Pane) ---------------- */
function StepItem({ step, index, collapsed, onToggle }) {
  const isChart = step.type === "chart" && step.chartData;

  return (
    <div className="bg-neutral-800/50 p-3 rounded-xl mb-3 border border-neutral-600/80">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs text-gray-400">Step {index + 1}</p>
          <p className="font-semibold text-cyan-300 capitalize">
            {step.type || "step"}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-gray-400 hover:text-cyan-200"
        >
          {collapsed ? "Expand" : "Collapse"}
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
            <div className="mt-3 bg-neutral-900/60 rounded-xl border border-cyan-700/40 p-2 h-40">
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

/* ---------------- CHART RENDER ---------------- */
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
        <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------- LOADING UI ---------------- */
function TypingLoader() {
  return (
    <div className="px-3 py-2 bg-neutral-800 rounded-lg text-cyan-400 w-fit mb-3 text-xs">
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
          className="h-16 bg-neutral-700/40 rounded-xl border border-neutral-600"
        />
      ))}
    </div>
  );
}
