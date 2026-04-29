import QuotePanel from "@/components/QuotePanel";
import PriceChart from "@/components/PriceChart";
import SignalPanel from "@/components/SignalPanel";
import NewsPanel from "@/components/NewsPanel";
import TradingAgent from "@/components/TradingAgent";
import { getYahooQuote } from "@/lib/yahoo";
import { getNews, getMetrics } from "@/lib/finnhub";

const SYMBOL = process.env.NEXT_PUBLIC_SYMBOL || "APLD";

async function getData() {
  const [quote, news, metrics] = await Promise.all([
    getYahooQuote(SYMBOL),
    getNews(SYMBOL),
    getMetrics(SYMBOL),
  ]);
  return { quote, news: news.slice(0, 10), metrics };
}

export default async function Home() {
  const { quote, news, metrics } = await getData();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            MASSIVE
          </span>
          <span className="text-gray-600 text-sm">Day Trader</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${quote.marketState === "REGULAR" ? "bg-green-400" : "bg-yellow-400"}`} />
          <span className="text-gray-400 text-sm">
            {quote.marketState === "REGULAR" ? "Market Open" : quote.marketState === "POST" ? "After Hours" : quote.marketState === "PRE" ? "Pre-Market" : "Market Closed"}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <QuotePanel quote={quote} symbol={SYMBOL} />
          <div className="lg:col-span-2">
            <SignalPanel metrics={metrics} quote={quote} />
          </div>
        </div>
        <PriceChart symbol={SYMBOL} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <NewsPanel news={news} />
          <TradingAgent />
        </div>
      </div>
    </main>
  );
}
