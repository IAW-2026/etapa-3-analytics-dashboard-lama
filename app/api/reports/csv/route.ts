import { getAnalyticsSnapshot } from "@/lib/analytics";
import { buildCsvReport } from "@/lib/report-export";
import { getTimeRangeId } from "@/lib/time-range";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRangeId = getTimeRangeId(searchParams.get("range"));
  const snapshot = await getAnalyticsSnapshot(timeRangeId);
  const csv = buildCsvReport(snapshot);

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="lama-analytics-${snapshot.timeRange.id}.csv"`,
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
