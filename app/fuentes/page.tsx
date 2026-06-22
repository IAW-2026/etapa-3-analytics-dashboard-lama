import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, formatLabel } from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function SourcesPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);

  return (
    <AppChrome
      active="fuentes"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero compact">
        <p className="eyebrow">Integraciones</p>
        <h1>Fuentes</h1>
        <p>Estado de APIs conectadas y errores detectados al consolidar metricas.</p>
      </section>

      <section className="sources-panel full">
        <div className="source-list">
          {snapshot.dataSources.map((source) => (
            <article key={source.name} className="source-card">
              <span className={`source-dot source-${source.status}`} />
              <div>
                <strong>{source.name}</strong>
                <p>{source.detail}</p>
                <b>{formatLabel(source.status)}</b>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppChrome>
  );
}
