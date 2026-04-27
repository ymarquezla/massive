const API_KEY = process.env.POLYGON_API_KEY!;
const BASE = "https://api.polygon.io";

export async function getIntraday(symbol: string, multiplier = 5, timespan = "minute") {
  const today = new Date().toISOString().split("T")[0];
  const from = today;
  const to = today;
  const url = `${BASE}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Polygon ${res.status}`);
  return res.json();
}

export async function getPrevClose(symbol: string) {
  const url = `${BASE}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Polygon ${res.status}`);
  return res.json();
}
