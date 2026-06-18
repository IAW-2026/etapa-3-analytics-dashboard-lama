import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, HorizontalBars, MetricPanel, numberFormatter } from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);

  return (
    <AppChrome
      active="usuarios"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero compact">
        <p className="eyebrow">Buyer</p>
        <h1>Usuarios</h1>
        <p>Compradores activos y preferencias disponibles desde Buyer.</p>
      </section>

      <section className="detail-grid">
        <MetricPanel
          detail="Compradores registrados"
          label="Activos"
          trend={snapshot.trends.kpis.activeUsers}
          value={numberFormatter.format(snapshot.kpis.activeUsers)}
        />
        <MetricPanel
          detail="Promedio de reviews"
          label="Calificacion"
          trend={snapshot.trends.kpis.averageRating}
          value={snapshot.kpis.averageRating.toFixed(1)}
        />
        <MetricPanel
          detail="Salud de integraciones"
          label="Fuentes"
          trend={snapshot.trends.kpis.integrationHealth}
          value={`${snapshot.kpis.integrationHealth}%`}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preferencias</p>
              <h2>Categorias</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.buyerPreferencesByCategory} valueLabel="preferencias" />
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preferencias</p>
              <h2>Talles</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.buyerPreferencesBySize} valueLabel="preferencias" />
        </article>
      </section>
    </AppChrome>
  );
}
