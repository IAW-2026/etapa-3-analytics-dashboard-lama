import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, HorizontalBars, MetricPanel, numberFormatter, TemporalChart } from "../ui";

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
        <p className="eyebrow">Buyer / Seller</p>
        <h1>Usuarios</h1>
        <p>Compradores disponibles desde Buyer y vendedores activos e inactivos desde Seller.</p>
      </section>

      <section className="detail-grid">
        <MetricPanel
          detail="Compradores registrados"
          label="Compradores"
          trend={snapshot.trends.kpis.activeUsers}
          value={numberFormatter.format(snapshot.kpis.activeUsers)}
        />
        <MetricPanel
          detail="Habilitados en Seller"
          label="Vendedores activos"
          trend={snapshot.trends.kpis.activeSellers}
          value={numberFormatter.format(snapshot.kpis.activeSellers)}
        />
        <MetricPanel
          detail="Inhabilitados en Seller"
          label="Vendedores inactivos"
          trend={snapshot.trends.kpis.inactiveSellers}
          value={numberFormatter.format(snapshot.kpis.inactiveSellers)}
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

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Seller</p>
              <h2>Estado de vendedores</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.sellersByStatus} valueLabel="vendedores" />
        </article>
      </section>
    </AppChrome>
  );
}
