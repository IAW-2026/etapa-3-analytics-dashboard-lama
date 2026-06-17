import { getAnalyticsSnapshot } from "@/lib/analytics";
import { AppChrome, formatCurrency, Funnel, HorizontalBars, numberFormatter, StatusPill } from "../ui";

export default async function OrdersPage() {
  const snapshot = await getAnalyticsSnapshot();

  return (
    <AppChrome active="ordenes" generatedAt={snapshot.generatedAt} integrationHealth={snapshot.kpis.integrationHealth}>
      <section className="page-hero compact">
        <p className="eyebrow">Operacion</p>
        <h1>Ordenes</h1>
        <p>Lectura de estados, conversion y ordenes recientes tomadas del sistema consolidado.</p>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <p className="eyebrow">Creadas</p>
          <strong className="metric-large">{numberFormatter.format(snapshot.orderFunnel[0]?.value ?? 0)}</strong>
          <span className="muted-text">Ordenes registradas</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Completadas</p>
          <strong className="metric-large">{numberFormatter.format(snapshot.kpis.completedOrders)}</strong>
          <span className="muted-text">Ordenes finalizadas</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Finalizacion</p>
          <strong className="metric-large">{snapshot.kpis.completionRate}%</strong>
          <span className="muted-text">Finalizadas sobre creadas</span>
        </article>
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
