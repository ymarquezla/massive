import { request } from "https";

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (c: string) => (data += c));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.end();
  });
}

export async function getYahooQuote(symbol: string) {
  const [regularRaw, extRaw] = await Promise.all([
    httpsGet(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`),
    httpsGet(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&includePrePost=true`),
  ]);

  const regularResult = JSON.parse(regularRaw)?.chart?.result?.[0];
  const meta = regularResult?.meta;
  if (!meta) throw new Error("No data from Yahoo Finance");
  const regularOpen: number = +(regularResult?.indicators?.quote?.[0]?.open?.[0] ?? 0).toFixed(4);

  const extResult = JSON.parse(extRaw)?.chart?.result?.[0];
  const extTimestamps: number[] = extResult?.timestamp ?? [];
  const extClose: number[] = extResult?.indicators?.quote?.[0]?.close ?? [];

  // Determine market state from trading periods
  const now = Math.floor(Date.now() / 1000);
  const periods = meta.currentTradingPeriod;
  let marketState = "CLOSED";
  if (now >= periods.pre.start && now < periods.pre.end) marketState = "PRE";
  else if (now >= periods.regular.start && now < periods.regular.end) marketState = "REGULAR";
  else if (now >= periods.post.start && now < periods.post.end) marketState = "POST";

  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? 0;

  // Get extended hours price from last bar outside regular session
  let extPrice: number | null = null;
  let extTime: number | null = null;
  for (let i = extTimestamps.length - 1; i >= 0; i--) {
    const t = extTimestamps[i];
    const c = extClose[i];
    if (c != null && (t < periods.regular.start || t >= periods.regular.end)) {
      extPrice = c;
      extTime = t;
      break;
    }
  }

  const extChange = extPrice != null ? +(extPrice - price).toFixed(4) : null;
  const extChangePct = extPrice != null && price ? +((extPrice - price) / price * 100).toFixed(4) : null;
  const isPost = extTime != null && extTime >= periods.post.start;

  return {
    price,
    change: +(price - prevClose).toFixed(4),
    changePct: prevClose ? +((price - prevClose) / prevClose * 100).toFixed(4) : 0,
    open: regularOpen,
    high: meta.regularMarketDayHigh ?? 0,
    low: meta.regularMarketDayLow ?? 0,
    prevClose,
    volume: meta.regularMarketVolume ?? 0,
    postPrice: isPost ? extPrice : null,
    postChange: isPost ? extChange : null,
    postChangePct: isPost ? extChangePct : null,
    prePrice: !isPost ? extPrice : null,
    preChange: !isPost ? extChange : null,
    preChangePct: !isPost ? extChangePct : null,
    marketState,
    name: meta.longName ?? meta.shortName ?? symbol,
    exchange: meta.fullExchangeName ?? "",
    marketCap: 0,
    sharesOutstanding: 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
  };
}

export interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getYahooHistory(symbol: string, range = "3mo"): Promise<DailyBar[]> {
  const raw = await httpsGet(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`
  );
  const result = JSON.parse(raw)?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[] = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  return timestamps
    .map((t, i) => ({
      date: new Date(t * 1000).toISOString().split("T")[0],
      open: +( q.open?.[i] ?? 0).toFixed(4),
      high: +(q.high?.[i] ?? 0).toFixed(4),
      low:  +(q.low?.[i]  ?? 0).toFixed(4),
      close: +(q.close?.[i] ?? 0).toFixed(4),
      volume: q.volume?.[i] ?? 0,
    }))
    .filter((b) => b.close > 0);
}
