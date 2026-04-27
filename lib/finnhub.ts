const API_KEY = process.env.FINNHUB_API_KEY!;
const BASE = "https://finnhub.io/api/v1";

async function get(path: string) {
  const res = await fetch(`${BASE}${path}&token=${API_KEY}`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  return res.json();
}

export async function getQuote(symbol: string) {
  return get(`/quote?symbol=${symbol}`);
}

export async function getProfile(symbol: string) {
  return get(`/stock/profile2?symbol=${symbol}`);
}

export async function getNews(symbol: string) {
  const today = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  return get(`/company-news?symbol=${symbol}&from=${from}&to=${today}`);
}

export async function getMetrics(symbol: string) {
  return get(`/stock/metric?symbol=${symbol}&metric=all`);
}
