"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "agent";
  content: string;
  symbol?: string;
}

export default function TradingAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function analyze(sym: string, question?: string) {
    const userMsg: Message = { role: "user", content: question || `Analyze ${sym} for day trading`, symbol: sym };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const agentMsg: Message = { role: "agent", content: "", symbol: sym };
    setMessages(prev => [...prev, agentMsg]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym, question }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const text = decoder.decode(value);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + text };
            return updated;
          });
        }
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${(e as Error).message}` };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Detect if input is a ticker symbol (1-5 uppercase/lowercase letters)
    const isTicker = /^[a-zA-Z]{1,5}$/.test(trimmed);
    const sym = isTicker ? trimmed.toUpperCase() : symbol;

    if (!sym) {
      setMessages(prev => [...prev, { role: "agent", content: "Please enter a stock symbol first (e.g. APLD, TSLA, NVDA)" }]);
      setInput("");
      return;
    }

    if (isTicker) setSymbol(trimmed.toUpperCase());
    analyze(sym, isTicker ? undefined : trimmed);
    setInput("");
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <h2 className="text-white font-semibold">Trading Agent</h2>
          {symbol && <span className="ml-1 px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full font-mono">{symbol}</span>}
        </div>
        <span className="text-gray-500 text-xs">7-day day trading analysis</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-16 space-y-3">
            <div className="text-4xl">📈</div>
            <p className="text-gray-400 font-medium">Enter a stock symbol to start</p>
            <p className="text-gray-600 text-sm">Try typing <span className="text-blue-400 font-mono">APLD</span> or <span className="text-blue-400 font-mono">TSLA</span></p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-200"
            }`}>
              {msg.role === "agent" && msg.symbol && (
                <div className="text-blue-400 font-mono text-xs mb-2 font-semibold">{msg.symbol} Analysis</div>
              )}
              {msg.content}
              {msg.role === "agent" && loading && i === messages.length - 1 && msg.content === "" && (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          placeholder={symbol ? `Ask about ${symbol} or type a new ticker...` : "Enter a ticker (e.g. APLD)..."}
          className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
