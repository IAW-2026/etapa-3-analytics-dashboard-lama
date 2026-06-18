import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, formatCurrency, MetricPanel, numberFormatter } from "../ui";

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

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Ranking</p>
            <h2>Productos destacados</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Unidades</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.topProducts.map((product) => (
                <tr key={product.productId}>
                  <td>{product.title}</td>
                  <td>{product.units}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppChrome>
  );
}
