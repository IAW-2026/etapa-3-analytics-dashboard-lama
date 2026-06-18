import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, MetricPanel, numberFormatter, TemporalChart } from "../ui";

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
              <p className="eyebrow">Evolucion</p>
              <h2>Altas de compradores</h2>
            </div>
          </div>
          <TemporalChart
            data={snapshot.temporalSeries}
            emptyText="No hay compradores nuevos en el periodo seleccionado."
            label="Evolucion de compradores"
            valueKey="buyers"
            valueLabel="Compradores nuevos"
          />
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operacion</p>
              <h2>Ordenes de compradores</h2>
            </div>
          </div>
          <TemporalChart
            data={snapshot.temporalSeries}
            emptyText="No hay ordenes de compradores en el periodo seleccionado."
            label="Evolucion de ordenes de compradores"
            valueKey="orders"
            valueLabel="Ordenes creadas"
          />
        </article>
      </section>
    </AppChrome>
  );
}
