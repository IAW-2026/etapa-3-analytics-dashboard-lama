import { getAnalyticsSnapshot } from "@/lib/analytics";
import { buildPdfReport } from "@/lib/report-export";
import { getTimeRangeId } from "@/lib/time-range";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRangeId = getTimeRangeId(searchParams.get("range"));
  const snapshot = await getAnalyticsSnapshot(timeRangeId);
  const pdf = buildPdfReport(snapshot);

  return new Response(pdf, {
    headers: {
      "Content-Disposition": `attachment; filename="lama-analytics-${snapshot.timeRange.id}.pdf"`,
      "Content-Type": "application/pdf"
    }
  });
}
