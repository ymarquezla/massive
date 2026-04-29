import Anthropic from "@anthropic-ai/sdk";
import { getQuote, getNews, getMetrics } from "@/lib/finnhub";
import { getIntraday } from "@/lib/polygon";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "placeholder" });

export async function POST(req: Request) {
  const { symbol, question } = await req.json();
  if (!symbol) return new Response("symbol required", { status: 400 });

  const sym = symbol.toUpperCase();

  const [quote, news, metrics, candles1d, candles5d] = await Promise.allSettled([
    getQuote(sym),
    getNews(sym),
    getMetrics(sym),
    getIntraday(sym, 1, "day"),
    getIntraday(sym, 5, "minute"),
  ]);

  const q = quote.status === "fulfilled" ? quote.value : {};
  const n = news.status === "fulfilled" ? news.value.slice(0, 5) : [];
  const m = metrics.status === "fulfilled" ? metrics.value?.metric || {} : {};
  const daily = candles1d.status === "fulfilled" ? (candles1d.value?.results || []).slice(-7) : [];
  const intraday = candles5d.status === "fulfilled" ? (candles5d.value?.results || []).slice(-50) : [];

  const context = `
STOCK: ${sym}
DATE: ${new Date().toLocaleDateString()}

=== CURRENT QUOTE ===
Price: $${q.c} | Change: ${q.d > 0 ? "+" : ""}${q.d} (${q.dp?.toFixed(2)}%)
Open: $${q.o} | High: $${q.h} | Low: $${q.l} | Prev Close: $${q.pc}

=== LAST 7 DAILY BARS ===
${daily.map((b: {t:number;o:number;h:number;l:number;c:number;v:number}) =>
  `${new Date(b.t).toLocaleDateString()} O:${b.o} H:${b.h} L:${b.l} C:${b.c} V:${(b.v/1e6).toFixed(2)}M`
).join("\n") || "No daily data available"}

=== TODAY'S 5-MIN BARS (last 50) ===
${intraday.map((b: {t:number;o:number;h:number;l:number;c:number;v:number}) =>
  `${new Date(b.t).toLocaleTimeString()} O:${b.o} H:${b.h} L:${b.l} C:${b.c} V:${b.v}`
).join("\n") || "No intraday data (market may be closed)"}

=== KEY METRICS ===
52W High: $${m["52WeekHigh"] ?? "N/A"} | 52W Low: $${m["52WeekLow"] ?? "N/A"}
Beta: ${m["beta"] ?? "N/A"} | 10D Avg Volume: ${m["10DayAverageTradingVolume"] ? (m["10DayAverageTradingVolume"]*1e6).toFixed(0) : "N/A"}

=== RECENT NEWS (last 7 days) ===
${n.map((a: {headline:string;datetime:number;source:string}) =>
  `[${new Date(a.datetime * 1000).toLocaleDateString()}] ${a.headline} (${a.source})`
).join("\n") || "No recent news"}
`;

  const userQuestion = question || `Analyze ${sym} for day trading today.`;

  // Test mode: return raw context if no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      `⚠️ No Anthropic API key configured — showing raw market data instead:\n\n${context}`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const stream = await client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: `You are an expert day trader and technical analyst. You analyze stocks purely for intraday and short-term (7-day) trading opportunities.

Focus only on:
- Price action and momentum from the last 7 days
- Today's intraday price action
- Volume patterns (high volume = conviction)
- Key support/resistance levels from recent bars
- News catalysts from the last 7 days
- Clear entry, target, and stop-loss levels

Be direct, concise, and actionable. Use bullet points. Always include a clear BIAS (Bullish/Bearish/Neutral) and a suggested trade setup if warranted. Do NOT discuss long-term fundamentals or valuation.`,
    messages: [{ role: "user", content: `${context}\n\nQuestion: ${userQuestion}` }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
  });
}
