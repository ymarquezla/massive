"use client";

interface Quote { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; }
interface Profile { name: string; marketCapitalization: number; shareOutstanding: number; }

export default function QuotePanel({ quote, profile, symbol }: { quote: Quote; profile: Profile; symbol: string }) {
  const isUp = quote.d >= 0;
  const color = isUp ? "text-green-400" : "text-red-400";
  const bg = isUp ? "bg-green-400/10 border-green-400/20" : "bg-red-400/10 border-red-400/20";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{symbol}</div>
          <div className="text-white text-lg font-semibold mt-0.5">{profile.name}</div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-semibold ${bg} ${color}`}>
          {isUp ? "▲" : "▼"} {Math.abs(quote.dp).toFixed(2)}%
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-4xl font-bold text-white">${quote.c.toFixed(2)}</span>
        <span className={`text-lg font-medium mb-0.5 ${color}`}>
          {isUp ? "+" : ""}{quote.d.toFixed(2)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          { label: "Open", value: `$${quote.o.toFixed(2)}` },
          { label: "High", value: `$${quote.h.toFixed(2)}` },
          { label: "Low", value: `$${quote.l.toFixed(2)}` },
          { label: "Prev Close", value: `$${quote.pc.toFixed(2)}` },
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
          <div className="text-white font-semibold mt-1">${(profile.marketCapitalization / 1000).toFixed(2)}B</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-500 text-xs">Shares Out</div>
          <div className="text-white font-semibold mt-1">{profile.shareOutstanding.toFixed(1)}M</div>
        </div>
      </div>
    </div>
  );
}
