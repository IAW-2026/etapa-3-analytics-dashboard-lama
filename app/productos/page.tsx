import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, formatCurrency, MetricPanel, numberFormatter, TopProductsPanel } from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);

  return (
    <AppChrome
      active="productos"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero compact">
        <p className="eyebrow">Catalogo</p>
        <h1>Productos</h1>
        <p>Productos activos, ticket promedio y destacados calculados desde ordenes aprobadas.</p>
      </section>

      <section className="detail-grid">
        <MetricPanel
          detail="Publicaciones disponibles"
          label="Activos"
          trend={snapshot.trends.kpis.activeProducts}
          value={numberFormatter.format(snapshot.kpis.activeProducts)}
        />
        <MetricPanel
          detail="Sobre pagos aprobados"
          label="Ticket promedio"
          trend={snapshot.trends.kpis.averageOrderValue}
          value={formatCurrency(snapshot.kpis.averageOrderValue)}
        />
        <MetricPanel
          detail="Total consolidado"
          label="Ingresos aprobados"
          trend={snapshot.trends.kpis.revenue}
          value={formatCurrency(snapshot.kpis.revenue)}
        />
      </section>

      <TopProductsPanel products={snapshot.topProducts} />
    </AppChrome>
  );
}
