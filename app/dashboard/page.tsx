import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import {
  AppChrome,
  DetailCard,
  formatCurrency,
  formatDurationDays,
  formatDurationHours,
  Funnel,
  getMetric,
  Icon,
  KpiCard,
  numberFormatter,
  OperationalAlertsPanel,
  ReportExportActions,
  SystemFlowPanel,
  TemporalChart,
  TopProductsPanel,
  TopSellersPanel
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
      <section className="page-hero compact">
        <p className="eyebrow">Sistema LAMA</p>
        <h1>Dashboard operativo</h1>
        <p>Resumen visual de ordenes, usuarios, ingresos, productos, pagos y envios.</p>
      </section>

      <ReportExportActions timeRangeId={snapshot.timeRange.id} />

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
          label="Compradores"
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
          badge="Ticket"
          detail="Sobre pagos aprobados"
          icon="wallet"
          label="Ticket promedio"
          trend={snapshot.trends.kpis.averageOrderValue}
          value={formatCurrency(snapshot.kpis.averageOrderValue)}
        />
        <KpiCard
          badge="Conversion"
          detail="Completadas sobre ordenes creadas"
          icon="trending"
          label="Tasa de conversion"
          trend={snapshot.trends.kpis.completionRate}
          value={`${snapshot.kpis.completionRate}%`}
        />
        <KpiCard
          badge="Logistica"
          detail="Desde creacion hasta entrega"
          icon="truck"
          label="Tiempo promedio de entrega"
          trend={snapshot.trends.kpis.averageDeliveryTimeDays}
          value={formatDurationDays(snapshot.kpis.averageDeliveryTimeDays)}
        />
        <KpiCard
          badge="Payments"
          detail="Desde orden hasta aprobacion"
          icon="credit"
          label="Tiempo procesamiento pago"
          trend={snapshot.trends.kpis.averagePaymentProcessingHours}
          value={formatDurationHours(snapshot.kpis.averagePaymentProcessingHours)}
        />
      </section>

      <section className="dashboard-grid" aria-label="Graficos operativos">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ingresos</p>
              <h2>
                <Icon name="trending" />
                Evolucion de ingresos
              </h2>
              <span className="panel-subtitle">Pagos aprobados consolidados</span>
            </div>
            <strong className="panel-total">{formatCurrency(snapshot.kpis.revenue)} aprobados</strong>
          </div>
          <TemporalChart
            data={snapshot.temporalSeries}
            emptyText="No hay ingresos aprobados en el periodo seleccionado."
            format="currency"
            label="Evolucion de ingresos"
            valueKey="revenue"
            valueLabel="Ingresos aprobados"
          />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ordenes</p>
              <h2>
                <Icon name="bag" />
                Evolucion de ordenes
              </h2>
            </div>
          </div>
          <TemporalChart
            data={snapshot.temporalSeries}
            emptyText="No hay ordenes creadas en el periodo seleccionado."
            label="Evolucion de ordenes"
            valueKey="orders"
            valueLabel="Ordenes creadas"
          />
        </article>
      </section>

      <SystemFlowPanel flow={snapshot.systemFlow} />

      <section className="ranking-grid" aria-label="Rankings comerciales">
        <TopProductsPanel products={snapshot.topProducts} />
        <TopSellersPanel sellers={snapshot.topSellers} />
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

      <OperationalAlertsPanel alerts={snapshot.operationalAlerts} />

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
