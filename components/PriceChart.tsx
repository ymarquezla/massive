"use client";

import { useEffect, useRef, useState } from "react";

interface Bar { t: number; o: number; h: number; l: number; c: number; v: number; }

export default function PriceChart({ symbol }: { symbol: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<"1" | "5" | "15">("5");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let chart: unknown;
    let cleanup = false;

    async function load() {
      if (!chartRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const [{ createChart, CandlestickSeries, HistogramSeries }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(`/api/candles?symbol=${symbol}&multiplier=${interval}&timespan=minute`),
        ]);

        const data = await res.json();
        if (cleanup) return;

        if (!data.results?.length) {
          setError("No intraday data yet — market may be closed.");
          setLoading(false);
          return;
        }

        const bars: Bar[] = data.results;

        if (chart) (chart as { remove: () => void }).remove();
        chartRef.current!.innerHTML = "";

        chart = createChart(chartRef.current!, {
          layout: { background: { color: "#111827" }, textColor: "#9ca3af" },
          grid: { vertLines: { color: "#1f2937" }, horzLines: { color: "#1f2937" } },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: "#374151" },
          timeScale: { borderColor: "#374151", timeVisible: true, secondsVisible: false },
          width: chartRef.current!.clientWidth,
          height: 340,
        });

        const candleSeries = (chart as { addSeries: (s: unknown, o: unknown) => unknown }).addSeries(CandlestickSeries, {
          upColor: "#22c55e", downColor: "#ef4444",
          borderUpColor: "#22c55e", borderDownColor: "#ef4444",
          wickUpColor: "#22c55e", wickDownColor: "#ef4444",
        });

        const volSeries = (chart as { addSeries: (s: unknown, o: unknown) => unknown }).addSeries(HistogramSeries, {
          color: "#3b82f6", priceFormat: { type: "volume" },
          priceScaleId: "volume",
        });

        (chart as { priceScale: (id: string) => { applyOptions: (o: unknown) => void } }).priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        (candleSeries as { setData: (d: unknown) => void }).setData(bars.map(b => ({ time: b.t / 1000 as unknown as string, open: b.o, high: b.h, low: b.l, close: b.c })));
        (volSeries as { setData: (d: unknown) => void }).setData(bars.map(b => ({ time: b.t / 1000 as unknown as string, value: b.v, color: b.c >= b.o ? "#22c55e40" : "#ef444440" })));

        (chart as { timeScale: () => { fitContent: () => void } }).timeScale().fitContent();
        setLoading(false);
      } catch (e) {
        if (!cleanup) setError((e as Error).message);
        setLoading(false);
      }
    }

    load();
    return () => { cleanup = true; };
  }, [symbol, interval]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Intraday Chart</h2>
        <div className="flex gap-1">
          {(["1", "5", "15"] as const).map(i => (
            <button key={i} onClick={() => setInterval(i)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${interval === i ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {i}m
            </button>
          ))}
        </div>
      </div>
      {loading && <div className="h-[340px] flex items-center justify-center text-gray-500">Loading chart...</div>}
      {error && <div className="h-[340px] flex items-center justify-center text-gray-500 text-sm">{error}</div>}
      <div ref={chartRef} className={loading || error ? "hidden" : ""} />
    </div>
  );
}
