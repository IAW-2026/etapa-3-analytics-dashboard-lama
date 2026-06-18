import { NextResponse } from "next/server";

import { getAiInsights } from "@/lib/ai-insights";
import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeId } from "@/lib/time-range";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const snapshot = await getAnalyticsSnapshot(getTimeRangeId(searchParams.get("range")));
  const insights = await getAiInsights(snapshot);

  return NextResponse.json(insights);
}
