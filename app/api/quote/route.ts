import { NextResponse } from "next/server";
import { getYahooQuote } from "@/lib/yahoo";

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol") || "APLD";
  const quote = await getYahooQuote(symbol);
  return NextResponse.json(quote);
}
