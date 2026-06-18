import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import {
  AppChrome,
  BarChart,
  DetailCard,
  formatCurrency,
  Funnel,
  getMetric,
  HorizontalBars,
  Icon,
  KpiCard,
  numberFormatter
} from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);
  const paymentRows = [
    {
      label: "Aprobados",
      numericValue: getMetric(snapshot.paymentsByStatus, "aprobado"),
      value: numberFormatter.format(getMetric(snapshot.paymentsByStatus, "aprobado"))
    },
    {
      label: "Pendientes",
      numericValue: getMetric(snapshot.paymentsByStatus, "pendiente"),
      value: numberFormatter.format(getMetric(snapshot.paymentsByStatus, "pendiente"))
    }
  ];
  const shippingRows = snapshot.shipmentsByStatus.map((item) => ({
    label: item.label,
    numericValue: item.value,
    value: numberFormatter.format(item.value)
  }));

  return (
    <AppChrome
      active="dashboard"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero">
        <p className="eyebrow">Sistema LAMA</p>
        <h1>Dashboard operativo</h1>
        <p>Resumen visual de ordenes, usuarios, ingresos, productos, pagos, envios y calificaciones.</p>
      </section>

      <section className="kpi-grid" aria-label="Indicadores principales">
        <KpiCard
          badge="Aprobado"
          detail={`${numberFormatter.format(snapshot.kpis.totalTransactions)} transacciones aprobadas`}
          icon="wallet"
          label="Ingresos aprobados"
          trend={snapshot.trends.kpis.revenue}
          value={formatCurrency(snapshot.kpis.revenue)}
        />
        <KpiCard
          badge="Buyer"
          detail="Compradores registrados en Buyer"
          icon="users"
          label="Usuarios activos"
          trend={snapshot.trends.kpis.activeUsers}
          value={numberFormatter.format(snapshot.kpis.activeUsers)}
        />
        <KpiCard
          badge="Finalizadas"
          detail="Ordenes finalizadas"
          icon="bag"
          label="Pedidos completados"
          trend={snapshot.trends.kpis.completedOrders}
          value={numberFormatter.format(snapshot.kpis.completedOrders)}
        />
        <KpiCard
          badge="Reviews"
          detail="Sobre reviews disponibles"
          icon="star"
          label="Calificacion promedio"
          trend={snapshot.trends.kpis.averageRating}
          value={snapshot.kpis.averageRating.toFixed(1)}
        />
      </section>

      <section className="dashboard-grid" aria-label="Graficos operativos">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ingresos</p>
              <h2>
                <Icon name="trending" />
                Ingresos por mes
              </h2>
              <span>Pagos aprobados consolidados</span>
            </div>
            <strong className="panel-total">{formatCurrency(snapshot.kpis.revenue)} aprobados</strong>
          </div>
          <BarChart data={snapshot.revenueByMonth} valueKey="revenue" label="Ingresos por mes" />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ordenes</p>
              <h2>
                <Icon name="bag" />
                Estado de ordenes
              </h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.orderFunnel.map(({ label, value }) => ({ label, value }))} valueLabel="ordenes" />
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Conversion</p>
            <h2>Embudo operativo</h2>
          </div>
          <span>Ordenes de punta a punta</span>
        </div>
        <Funnel data={snapshot.orderFunnel} />
      </section>

      <section className="detail-grid" aria-label="Detalle operativo">
        <DetailCard badge="Pagos" icon="credit" rows={paymentRows} title="Pagos" />
        <DetailCard badge="Envios" icon="truck" rows={shippingRows} title="Logistica" />
        <DetailCard
          badge="Catalogo"
          icon="package"
          rows={[
            {
              label: "Activos",
              numericValue: snapshot.kpis.activeProducts,
              value: numberFormatter.format(snapshot.kpis.activeProducts)
            },
            {
              label: "Ticket promedio",
              numericValue: snapshot.kpis.averageOrderValue,
              value: formatCurrency(snapshot.kpis.averageOrderValue)
            }
          ]}
          title="Productos"
        />
      </section>
    </AppChrome>
  );
}
