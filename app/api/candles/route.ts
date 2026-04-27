import { NextResponse } from "next/server";
import { getIntraday } from "@/lib/polygon";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "APLD";
  const multiplier = Number(searchParams.get("multiplier") || 5);
  const timespan = searchParams.get("timespan") || "minute";
  const data = await getIntraday(symbol, multiplier, timespan);
  return NextResponse.json(data);
}
