import { getAnalyticsSnapshot } from "@/lib/analytics";
import { AppChrome, formatCurrency, getMetric, HorizontalBars, numberFormatter } from "../ui";

export default async function PaymentsPage() {
  const snapshot = await getAnalyticsSnapshot();
  const paymentAlerts = snapshot.operationalAlerts.filter(
    (alert) => alert.id.includes("payment") || alert.items.some((item) => item.type === "pago")
  );

  return (
    <AppChrome active="pagos" generatedAt={snapshot.generatedAt} integrationHealth={snapshot.kpis.integrationHealth}>
      <section className="page-hero compact">
        <p className="eyebrow">Finanzas</p>
        <h1>Pagos</h1>
        <p>Estado consolidado de pagos aprobados, pendientes y alertas operativas asociadas.</p>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <p className="eyebrow">Ingresos aprobados</p>
          <strong className="metric-large">{formatCurrency(snapshot.kpis.revenue)}</strong>
          <span className="muted-text">{numberFormatter.format(snapshot.kpis.totalTransactions)} transacciones aprobadas</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Pendientes</p>
          <strong className="metric-large">{numberFormatter.format(getMetric(snapshot.paymentsByStatus, "pendiente"))}</strong>
          <span className="muted-text">{formatCurrency(snapshot.kpis.pendingRevenue)} pendientes de aprobacion</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Ticket promedio</p>
          <strong className="metric-large">{formatCurrency(snapshot.kpis.averageOrderValue)}</strong>
          <span className="muted-text">Sobre pagos aprobados</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Estados</p>
              <h2>Estado de pagos</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.paymentsByStatus} valueLabel="pagos" />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Atencion</p>
              <h2>Alertas de pagos</h2>
            </div>
          </div>
          <div className="alert-list single">
            {paymentAlerts.length > 0 ? (
              paymentAlerts.map((alert) => (
                <article className={`alert-card alert-${alert.severity}`} key={alert.id}>
                  <span>{alert.severity}</span>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                </article>
              ))
            ) : (
              <article className="alert-card">
                <span>info</span>
                <strong>Sin alertas de pagos</strong>
                <p>No hay alertas asociadas a pagos con los datos disponibles.</p>
              </article>
            )}
          </div>
        </article>
      </section>
    </AppChrome>
  );
}
