import { useState, useRef, useEffect } from "react";
import { runResearchAgent, runLLM } from "../api/agentApi";
import ReactMarkdown from "react-markdown";

export default function FloatingAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    const userInput = input.trim();
    setInput("");
    setIsThinking(true);

    try {
      // Try to parse ticker from input (e.g., "RELIANCE.NS description" or "analyze RELIANCE")
      // If it looks like a research query, use research agent, otherwise use LLM
      const tickerMatch = userInput.match(/([A-Z]+\.(NS|BO))/i) || 
                         userInput.match(/analyze\s+([A-Z]+)/i);
      
      if (tickerMatch) {
        // Extract ticker and query
        const ticker = tickerMatch[1]?.toUpperCase() || tickerMatch[1];
        const query = userInput.replace(tickerMatch[0], "").trim() || "Provide a comprehensive analysis";
        
        // Use research agent
        const res = await runResearchAgent(ticker, query);

        // Show steps
        if (res.data?.steps) {
          res.data.steps.forEach((s) =>
            setMessages((prev) => [...prev, { type: s.type || "step", content: s.content }])
          );
        }

        // Final answer - use ai_summary or summary
        const summary = res.data?.ai_summary || res.data?.summary;
        if (summary) {
          setMessages((prev) => [...prev, { type: "agent", content: summary }]);
        } else if (res.data?.recommendations) {
          setMessages((prev) => [...prev, { 
            type: "agent", 
            content: "**Recommendations:**\n" + res.data.recommendations.join("\n") 
          }]);
        }
      } else {
        // Use generic LLM for general questions
        const res = await runLLM("auto", userInput);
        
        if (res.success && res.response) {
          setMessages((prev) => [...prev, { type: "agent", content: res.response }]);
        } else {
          setMessages((prev) => [...prev, { 
            type: "error", 
            content: res.error || "Failed to get response" 
          }]);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "error", content: `⚠️ Error: ${err.message || "Agent failed. Try again."}` },
      ]);
    }

    setIsThinking(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-full shadow-lg shadow-cyan-500/40 transition-all border border-cyan-300 hover:scale-110 z-[2000] cursor-pointer"
      >
        AGENT
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-6 w-80 h-[420px] bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-cyan-600/40 shadow-2xl shadow-cyan-900/40 overflow-hidden transition-all z-[2000]
        ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="p-3 bg-neutral-950/60 border-b border-cyan-800/40 flex justify-between items-center">
          <span className="font-semibold text-cyan-200">AI Research Agent</span>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            ✖
          </button>
        </div>

        {/* Messages */}
        <div className="p-3 space-y-2 overflow-y-auto h-[310px]">
          {messages.map((m, i) => (
            <MessageBubble key={i} {...m} />
          ))}

          {isThinking && (
            <div className="text-cyan-300 text-sm animate-pulse">Thinking...</div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-2 border-t border-cyan-800/40 bg-neutral-950/50 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask something..."
            className="flex-1 bg-neutral-800 text-white px-3 py-2 rounded-xl border border-cyan-700/30 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl transition"
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ type, content }) {
  const base = "px-3 py-2 rounded-lg text-sm whitespace-pre-wrap max-w-[75%]";

  if (type === "user") {
    return (
      <div className="flex justify-end">
        <div className={`${base} bg-cyan-700 text-white`}>{content}</div>
      </div>
    );
  }

  if (type === "agent") {
    return (
      <div className="flex justify-start">
        <div className={`${base} bg-neutral-800 border border-cyan-700`}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="flex justify-start">
        <div className={`${base} bg-red-900 text-red-200 border border-red-600`}>
          {content}
        </div>
      </div>
    );
  }

  // Agent steps
  return (
    <div className="flex justify-start">
      <div className={`${base} bg-yellow-700/30 border border-yellow-500/40 text-yellow-200`}>
        <strong className="block capitalize">{type}</strong>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
