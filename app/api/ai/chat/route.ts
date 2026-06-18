import { NextResponse } from "next/server";

import { answerAnalyticsQuestion } from "@/lib/ai-chat";
import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeId } from "@/lib/time-range";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { question?: unknown; range?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question : "";
  const range = typeof body?.range === "string" ? getTimeRangeId(body.range) : getTimeRangeId(null);
  const snapshot = await getAnalyticsSnapshot(range);
  const answer = await answerAnalyticsQuestion(question, snapshot);

  return NextResponse.json({ answer });
}
