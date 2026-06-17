import { getAnalyticsSnapshot } from "@/lib/analytics";
import { AppChrome, formatLabel } from "../ui";

export default async function SourcesPage() {
  const snapshot = await getAnalyticsSnapshot();

  return (
    <AppChrome active="fuentes" generatedAt={snapshot.generatedAt} integrationHealth={snapshot.kpis.integrationHealth}>
      <section className="page-hero compact">
        <p className="eyebrow">Integraciones</p>
        <h1>Fuentes</h1>
        <p>Estado de APIs conectadas, errores y fallbacks usados para consolidar metricas.</p>
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
