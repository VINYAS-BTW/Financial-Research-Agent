import { useState, useRef, useEffect } from "react";
//import ReactMarkdown from "react-markdown";
//import { runResearchAgent } from "../api/agentApi";
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

export default function ResearchAgent() {
  const [messages, setMessages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [finalAns, setFinalAns] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState("");
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
    if (!query.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setSteps([]);
    setFinalAns("");
    setLoading(true);

    try {
      const res = await runResearchAgent(query);

      // Expected backend shape:
      // {
      //   steps: [
      //     { type: "reasoning" | "tool" | "chart" | "step", content: "...", chartData?, xKey?, yKey? },
      //   ],
      //   final: "markdown answer..."
      // }

      if (res.data?.steps) setSteps(res.data.steps);

      if (res.data?.final) {
        setFinalAns(res.data.final);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "agent",
            content: res.data.final,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: "error",
          content: " Research Agent crashed. Try again.",
        },
      ]);
    }

    setLoading(false);
    setQuery("");
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

      {/* INPUT BAR */}
      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 bg-neutral-900/70 border border-cyan-700/40 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 placeholder:text-gray-500"
          placeholder="Ask the agent e.g. 'Compare MA & RSI for RELIANCE.NS over 6 months and suggest trend'"
          value={query}
          onKeyDown={(e) => e.key === "Enter" && runAgent()}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={runAgent}
          disabled={loading}
          className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-cyan-900/60 px-6 py-3 rounded-xl text-white font-semibold transition"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </div>

      {/* MAIN PANES */}
      <div
        ref={pdfRef}
        className="grid grid-cols-1 lg:grid-cols-10 gap-6"
      >
        {/* LEFT — CHAT / ANSWERS */}
        <div className="lg:col-span-6 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/60 max-h-[75vh] overflow-y-auto">
          {messages.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Ask a question to start a research session.
            </div>
          )}

          {messages.map((msg) => (
            <AgentMessage key={msg.id} {...msg} />
          ))}

          {loading && <TypingLoader />}

          <div ref={scrollRef} />
        </div>

        {/* RIGHT — REASONING TRACE + CHARTS */}
        <div className="lg:col-span-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/60 max-h-[75vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-cyan-300 mb-3">
             Agent Reasoning Trace
          </h2>

          {steps.length === 0 && !loading && (
            <p className="text-gray-400 text-sm">
              When the agent runs, you&apos;ll see reasoning steps, tools and charts here.
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

/* ------------ MESSAGE RENDER ------------ */

function AgentMessage({ type, content }) {
  if (type === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="px-4 py-2 bg-cyan-800 text-white rounded-xl max-w-[75%] shadow shadow-cyan-500/30 text-sm">
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

/* ------------ STEPS / TRACE ------------ */

function StepItem({ step, index, collapsed, onToggle }) {
  const isChart = step.type === "chart" && step.chartData;

  return (
    <div className="bg-neutral-800/50 p-3 rounded-xl mb-3 border border-neutral-600/80">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs text-gray-400">Step {index + 1}</p>
          <p className="font-semibold text-cyan-300 capitalize flex items-center gap-1">
            {step.type === "tool"
              ? "Tool Call"
              : step.type === "chart"
              ? "Chart Insight"
              : step.type || "step"}
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

          {step.chartImageUrl && !step.chartData && (
            <div className="mt-3">
              <img
                src={step.chartImageUrl}
                alt="Chart"
                className="w-full rounded-lg border border-neutral-600"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------ CHART RENDER ------------ */

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
        <Line
          type="monotone"
          dataKey={yKey}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------ LOADING UI ------------ */

function TypingLoader() {
  return (
    <div className="px-3 py-2 bg-neutral-800 rounded-lg text-cyan-400 w-fit mb-3 text-xs flex items-center gap-2">
      <span>Thinking</span>
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.3s]"></span>
      </span>
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
