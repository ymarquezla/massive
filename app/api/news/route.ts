import { NextResponse } from "next/server";
import { getNews } from "@/lib/finnhub";

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol") || "APLD";
  const news = await getNews(symbol);
  return NextResponse.json(news.slice(0, 10));
}
