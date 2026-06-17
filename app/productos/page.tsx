import { getAnalyticsSnapshot } from "@/lib/analytics";
import { AppChrome, formatCurrency, numberFormatter } from "../ui";

export default async function ProductsPage() {
  const snapshot = await getAnalyticsSnapshot();

  return (
    <AppChrome active="productos" generatedAt={snapshot.generatedAt} integrationHealth={snapshot.kpis.integrationHealth}>
      <section className="page-hero compact">
        <p className="eyebrow">Catalogo</p>
        <h1>Productos</h1>
        <p>Productos activos, ticket promedio y destacados calculados desde ordenes aprobadas.</p>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <p className="eyebrow">Activos</p>
          <strong className="metric-large">{numberFormatter.format(snapshot.kpis.activeProducts)}</strong>
          <span className="muted-text">Publicaciones disponibles</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Ticket promedio</p>
          <strong className="metric-large">{formatCurrency(snapshot.kpis.averageOrderValue)}</strong>
          <span className="muted-text">Sobre pagos aprobados</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Ingresos aprobados</p>
          <strong className="metric-large">{formatCurrency(snapshot.kpis.revenue)}</strong>
          <span className="muted-text">Total consolidado</span>
        </article>
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
