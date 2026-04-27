import { NextResponse } from "next/server";
import { getQuote, getProfile } from "@/lib/finnhub";

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol") || "APLD";
  const [quote, profile] = await Promise.all([getQuote(symbol), getProfile(symbol)]);
  return NextResponse.json({ quote, profile });
}
