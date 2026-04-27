import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/finnhub";

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol") || "APLD";
  const data = await getMetrics(symbol);
  return NextResponse.json(data);
}
