import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, formatCurrency, getMetric, MetricPanel, numberFormatter, TemporalChart } from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function PaymentsPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);
  const paymentAlerts = snapshot.operationalAlerts.filter(
    (alert) => alert.id.includes("payment") || alert.items.some((item) => item.type === "pago")
  );

  return (
    <AppChrome
      active="pagos"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero compact">
        <p className="eyebrow">Finanzas</p>
        <h1>Pagos</h1>
        <p>Estado consolidado de pagos aprobados, pendientes y alertas operativas asociadas.</p>
      </section>

      <section className="detail-grid">
        <MetricPanel
          detail={`${numberFormatter.format(snapshot.kpis.totalTransactions)} transacciones aprobadas`}
          label="Ingresos aprobados"
          trend={snapshot.trends.kpis.revenue}
          value={formatCurrency(snapshot.kpis.revenue)}
        />
        <MetricPanel
          detail={`${formatCurrency(snapshot.kpis.pendingRevenue)} pendientes de aprobacion`}
          label="Pendientes"
          trend={snapshot.trends.kpis.pendingPayments}
          value={numberFormatter.format(getMetric(snapshot.paymentsByStatus, "pendiente"))}
        />
        <MetricPanel
          detail="Sobre pagos aprobados"
          label="Ticket promedio"
          trend={snapshot.trends.kpis.averageOrderValue}
          value={formatCurrency(snapshot.kpis.averageOrderValue)}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Evolucion</p>
              <h2>Ingresos aprobados</h2>
            </div>
          </div>
          <TemporalChart
            data={snapshot.temporalSeries}
            emptyText="No hay pagos aprobados en el periodo seleccionado."
            format="currency"
            label="Evolucion de ingresos aprobados"
            valueKey="revenue"
            valueLabel="Ingresos aprobados"
          />
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
