import { NextResponse } from "next/server";

import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeId } from "@/lib/time-range";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const snapshot = await getAnalyticsSnapshot(getTimeRangeId(searchParams.get("range")));

  return NextResponse.json(snapshot);
}
