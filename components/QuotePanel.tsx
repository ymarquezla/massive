"use client";

interface Quote {
  price: number; change: number; changePct: number;
  open: number; high: number; low: number; prevClose: number; volume: number;
  postPrice: number | null; postChange: number | null; postChangePct: number | null;
  prePrice: number | null; preChange: number | null; preChangePct: number | null;
  marketState: string; name: string; marketCap: number; sharesOutstanding: number;
}

export default function QuotePanel({ quote, symbol }: { quote: Quote; symbol: string }) {
  const isUp = quote.change >= 0;
  const color = isUp ? "text-green-400" : "text-red-400";
  const bg = isUp ? "bg-green-400/10 border-green-400/20" : "bg-red-400/10 border-red-400/20";

  const extPrice = quote.marketState === "PRE" ? quote.prePrice : quote.postPrice;
  const extChange = quote.marketState === "PRE" ? quote.preChange : quote.postChange;
  const extChangePct = quote.marketState === "PRE" ? quote.preChangePct : quote.postChangePct;
  const extLabel = quote.marketState === "PRE" ? "Pre-Market" : "After Hours";
  const extColor = extChange != null ? (extChange >= 0 ? "text-green-400" : "text-red-400") : "text-gray-400";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{symbol}</div>
          <div className="text-white text-lg font-semibold mt-0.5 line-clamp-1">{quote.name}</div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-semibold ${bg} ${color}`}>
          {isUp ? "▲" : "▼"} {Math.abs(quote.changePct).toFixed(2)}%
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-4xl font-bold text-white">${quote.price.toFixed(2)}</span>
        <span className={`text-lg font-medium mb-0.5 ${color}`}>
          {isUp ? "+" : ""}{quote.change.toFixed(2)}
        </span>
      </div>

      {/* After-hours / pre-market */}
      {extPrice != null && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-gray-500">{extLabel}:</span>
          <span className={`font-semibold ${extColor}`}>${extPrice.toFixed(2)}</span>
          {extChangePct != null && (
            <span className={`text-xs ${extColor}`}>
              ({extChange! >= 0 ? "+" : ""}{extChangePct.toFixed(2)}%)
            </span>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          { label: "Open", value: `$${quote.open.toFixed(2)}` },
          { label: "High", value: `$${quote.high.toFixed(2)}` },
          { label: "Low", value: `$${quote.low.toFixed(2)}` },
          { label: "Prev Close", value: `$${quote.prevClose.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded-lg p-3">
            <div className="text-gray-500 text-xs">{label}</div>
            <div className="text-white font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-500 text-xs">Market Cap</div>
          <div className="text-white font-semibold mt-1">${(quote.marketCap / 1e9).toFixed(2)}B</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-500 text-xs">Volume</div>
          <div className="text-white font-semibold mt-1">{(quote.volume / 1e6).toFixed(2)}M</div>
        </div>
      </div>
    </div>
  );
}
