"use client";

interface Metrics { metric: Record<string, number> }

function Signal({ label, value, bull, bear }: { label: string; value: string; bull: boolean | null; bear?: boolean }) {
  const color = bull === null ? "text-gray-400" : bull ? "text-green-400" : "text-red-400";
  const dot = bull === null ? "bg-gray-600" : bull ? "bg-green-400" : "bg-red-400";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export default function SignalPanel({ metrics, quote }: { metrics: Metrics; quote: { price: number; prevClose: number } }) {
  const m = metrics?.metric || {};

  const w52High = m["52WeekHigh"];
  const w52Low = m["52WeekLow"];
  const beta = m["beta"];
  const price = quote.price;
  const pctFrom52High = w52High ? ((price - w52High) / w52High) * 100 : null;
  const pctFrom52Low = w52Low ? ((price - w52Low) / w52Low) * 100 : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-white font-semibold mb-3">Key Levels & Signals</h2>
      <Signal label="52W High" value={w52High ? `$${w52High.toFixed(2)}` : "—"} bull={null} />
      <Signal label="52W Low" value={w52Low ? `$${w52Low.toFixed(2)}` : "—"} bull={null} />
      <Signal
        label="vs 52W High"
        value={pctFrom52High !== null ? `${pctFrom52High.toFixed(1)}%` : "—"}
        bull={pctFrom52High !== null ? pctFrom52High > -10 : null}
      />
      <Signal
        label="vs 52W Low"
        value={pctFrom52Low !== null ? `+${pctFrom52Low.toFixed(1)}%` : "—"}
        bull={pctFrom52Low !== null ? pctFrom52Low > 20 : null}
      />
      <Signal
        label="Beta"
        value={beta ? beta.toFixed(2) : "—"}
        bull={beta ? beta > 1 : null}
      />
      <Signal
        label="Day Change"
        value={`${quote.price > quote.prevClose ? "+" : ""}${(((quote.price - quote.prevClose) / quote.prevClose) * 100).toFixed(2)}%`}
        bull={quote.price >= quote.prevClose}
      />
    </div>
  );
}
