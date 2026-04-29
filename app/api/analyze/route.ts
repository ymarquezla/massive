import Anthropic from "@anthropic-ai/sdk";
import { getNews, getMetrics } from "@/lib/finnhub";
import { getYahooQuote, getYahooHistory } from "@/lib/yahoo";
import { getIntraday } from "@/lib/polygon";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "placeholder" });

function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(4);
}

function avgVolume(volumes: number[], period: number): number {
  const slice = volumes.slice(-period);
  return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
}

export async function POST(req: Request) {
  const { symbol, question } = await req.json();
  if (!symbol) return new Response("symbol required", { status: 400 });

  const sym = symbol.toUpperCase();

  const [quoteRes, newsRes, metricsRes, historyRes, intradayRes] = await Promise.allSettled([
    getYahooQuote(sym),
    getNews(sym),
    getMetrics(sym),
    getYahooHistory(sym, "3mo"),
    getIntraday(sym, 5, "minute"),
  ]);

  const q = quoteRes.status === "fulfilled" ? quoteRes.value : null;
  const n = newsRes.status === "fulfilled" ? newsRes.value.slice(0, 5) : [];
  const m = metricsRes.status === "fulfilled" ? metricsRes.value?.metric || {} : {};
  const history = historyRes.status === "fulfilled" ? historyRes.value : [];
  const intraday = intradayRes.status === "fulfilled" ? (intradayRes.value?.results || []).slice(-50) : [];

  // Compute technicals from history
  const closes = history.map((b) => b.close);
  const volumes = history.map((b) => b.volume);
  const sma10 = sma(closes, 10);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const avgVol10 = avgVolume(volumes, 10);
  const avgVol30 = avgVolume(volumes, 30);
  const last30 = history.slice(-30);
  const rangeHigh = Math.max(...last30.map((b) => b.high));
  const rangeLow = Math.min(...last30.map((b) => b.low));

  const context = `
STOCK: ${sym}
DATE: ${new Date().toLocaleDateString()}

=== CURRENT QUOTE ===
Price: $${q?.price ?? "N/A"} | Change: ${(q?.change ?? 0) >= 0 ? "+" : ""}${q?.change} (${q?.changePct?.toFixed(2)}%)
Open: $${q?.open} | High: $${q?.high} | Low: $${q?.low} | Prev Close: $${q?.prevClose}
Volume: ${q ? (q.volume / 1e6).toFixed(2) + "M" : "N/A"} | Market State: ${q?.marketState ?? "UNKNOWN"}
${q?.postPrice ? `After-Hours: $${q.postPrice} (${q.postChange! >= 0 ? "+" : ""}${q.postChange}, ${q.postChangePct?.toFixed(2)}%)` : ""}
${q?.prePrice ? `Pre-Market: $${q.prePrice} (${q.preChange! >= 0 ? "+" : ""}${q.preChange}, ${q.preChangePct?.toFixed(2)}%)` : ""}

=== HISTORICAL DAILY BARS (last 30 days) ===
${last30.map((b) =>
  `${b.date} O:${b.open} H:${b.high} L:${b.low} C:${b.close} V:${(b.volume / 1e6).toFixed(2)}M`
).join("\n") || "No history available"}

=== TECHNICAL INDICATORS ===
SMA10: ${sma10 ?? "N/A"} | SMA20: ${sma20 ?? "N/A"} | SMA50: ${sma50 ?? "N/A"}
10D Avg Volume: ${(avgVol10 / 1e6).toFixed(2)}M | 30D Avg Volume: ${(avgVol30 / 1e6).toFixed(2)}M
30D Range High: $${rangeHigh.toFixed(2)} | 30D Range Low: $${rangeLow.toFixed(2)}
Price vs SMA10: ${sma10 && q ? ((q.price - sma10) / sma10 * 100).toFixed(2) + "%" : "N/A"}
Price vs SMA20: ${sma20 && q ? ((q.price - sma20) / sma20 * 100).toFixed(2) + "%" : "N/A"}
52W High: $${m["52WeekHigh"] ?? "N/A"} | 52W Low: $${m["52WeekLow"] ?? "N/A"}
Beta: ${m["beta"] ?? "N/A"}

=== TODAY'S 5-MIN BARS (last 50) ===
${intraday.map((b: {t:number;o:number;h:number;l:number;c:number;v:number}) =>
  `${new Date(b.t).toLocaleTimeString()} O:${b.o} H:${b.h} L:${b.l} C:${b.c} V:${b.v}`
).join("\n") || "No intraday data (market closed)"}

=== RECENT NEWS (last 7 days) ===
${n.map((a: {headline:string;datetime:number;source:string}) =>
  `[${new Date(a.datetime * 1000).toLocaleDateString()}] ${a.headline} (${a.source})`
).join("\n") || "No recent news"}
`;

  const userQuestion = question || `Analyze ${sym} for day trading tomorrow.`;

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      `⚠️ No Anthropic API key configured — showing raw market data instead:\n\n${context}`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const stream = await client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: `You are an expert day trader and technical analyst. You analyze stocks purely for intraday and short-term trading opportunities.

Focus on:
- Price action and momentum from historical daily bars
- Volume vs average volume (high relative volume = conviction)
- Moving averages (SMA10/20/50) as dynamic support/resistance
- Key support/resistance levels from the 30-day range
- After-hours/pre-market price signals
- News catalysts
- Clear entry price, target, and stop-loss levels

Be direct and actionable. Use bullet points. Always include a BIAS (Bullish/Bearish/Neutral) and a concrete trade setup. Do NOT discuss long-term fundamentals.`,
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
