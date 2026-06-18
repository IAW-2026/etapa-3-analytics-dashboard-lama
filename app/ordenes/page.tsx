import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, formatCurrency, Funnel, HorizontalBars, MetricPanel, numberFormatter, StatusPill } from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);

  return (
    <AppChrome
      active="ordenes"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero compact">
        <p className="eyebrow">Operacion</p>
        <h1>Ordenes</h1>
        <p>Lectura de estados, conversion y ordenes recientes tomadas del sistema consolidado.</p>
      </section>

      <section className="detail-grid">
        <MetricPanel
          detail="Ordenes registradas"
          label="Creadas"
          trend={snapshot.trends.kpis.createdOrders}
          value={numberFormatter.format(snapshot.orderFunnel[0]?.value ?? 0)}
        />
        <MetricPanel
          detail="Ordenes finalizadas"
          label="Completadas"
          trend={snapshot.trends.kpis.completedOrders}
          value={numberFormatter.format(snapshot.kpis.completedOrders)}
        />
        <MetricPanel
          detail="Finalizadas sobre creadas"
          label="Finalizacion"
          trend={snapshot.trends.kpis.completionRate}
          value={`${snapshot.kpis.completionRate}%`}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Estados</p>
              <h2>Estado de ordenes</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.ordersByStatus} valueLabel="ordenes" />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Conversion</p>
              <h2>Embudo operativo</h2>
            </div>
          </div>
          <Funnel data={snapshot.orderFunnel} />
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recientes</p>
            <h2>Ordenes recientes</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.recentOrders.map((order) => (
                <tr key={order.orden_id}>
                  <td>{order.orden_id}</td>
                  <td>
                    <StatusPill status={order.estado_general} />
                  </td>
                  <td>{formatCurrency(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppChrome>
  );
}
