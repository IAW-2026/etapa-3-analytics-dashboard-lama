import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

import { getAnalyticsSnapshot } from "@/lib/analytics";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-AR");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function KpiCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="kpi-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function BarChart({
  data,
  valueKey,
  label
}: {
  data: Array<Record<string, number | string>>;
  valueKey: string;
  label: string;
}) {
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey])), 1);

  return (
    <div className="chart" aria-label={label}>
      {data.map((item) => {
        const value = Number(item[valueKey]);
        const height = Math.max((value / maxValue) * 100, 8);

        return (
          <div className="bar-column" key={String(item.label)}>
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${height}%` }}>
                <span>{valueKey === "revenue" ? formatCurrency(value) : value}</span>
              </div>
            </div>
            <small>{item.label}</small>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({
  data,
  valueLabel
}: {
  data: Array<{ label: string; value: number }>;
  valueLabel: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="horizontal-bars">
      {data.map((item) => (
        <div className="horizontal-row" key={item.label}>
          <div className="horizontal-label">
            <span>{formatStatus(item.label)}</span>
            <strong>
              {item.value} {valueLabel}
            </strong>
          </div>
          <div className="horizontal-track">
            <div style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Funnel({
  data
}: {
  data: Array<{ label: string; value: number; detail: string }>;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="funnel">
      {data.map((item, index) => (
        <article className="funnel-step" key={item.label}>
          <div>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.label}</strong>
          </div>
          <p>{item.detail}</p>
          <div className="funnel-meter">
            <div style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }} />
          </div>
          <b>{numberFormatter.format(item.value)}</b>
        </article>
      ))}
    </div>
  );
}

export default async function Home() {
  const user = await currentUser();
  const snapshot = await getAnalyticsSnapshot();

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <strong>LAMA</strong>
          <span>Analytics Dashboard</span>
        </div>
        <div className="user-area">
          <span>{user?.firstName ? `Hola, ${user.firstName}` : user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton />
        </div>
      </header>

      <section className="hero-section">
        <div>
          <p className="eyebrow">LAMA Analytics</p>
          <h1>Dashboard operativo del sistema completo</h1>
          <p className="hero-copy">
            Metricas consolidadas de ordenes, pagos, productos y envios. Esta primera version usa mocks
            preparados para reemplazarse por APIs protegidas con Clerk desde rutas internas de Next.
          </p>
        </div>
        <aside className="sync-panel">
          <span>Ultima actualizacion</span>
          <strong>{new Date(snapshot.generatedAt).toLocaleString("es-AR")}</strong>
          <p>{snapshot.kpis.integrationHealth}% de fuentes conectadas</p>
        </aside>
      </section>

      <section className="kpi-grid" aria-label="Indicadores clave del negocio">
        <KpiCard
          label="Ingresos aprobados"
          value={formatCurrency(snapshot.kpis.revenue)}
          detail={`${snapshot.kpis.totalTransactions} transacciones aprobadas`}
        />
        <KpiCard
          label="Usuarios activos"
          value={numberFormatter.format(snapshot.kpis.activeUsers)}
          detail="Compradores registrados en Buyer"
        />
        <KpiCard
          label="Pedidos completados"
          value={numberFormatter.format(snapshot.kpis.completedOrders)}
          detail="Ordenes finalizadas"
        />
        <KpiCard
          label="Calificacion promedio"
          value={snapshot.kpis.averageRating.toFixed(1)}
          detail="Sobre reviews disponibles"
        />
        <KpiCard
          label="Productos activos"
          value={numberFormatter.format(snapshot.kpis.activeProducts)}
          detail="Publicaciones disponibles"
        />
        <KpiCard
          label="Ticket promedio"
          value={formatCurrency(snapshot.kpis.averageOrderValue)}
          detail="Sobre pagos aprobados"
        />
        <KpiCard
          label="Ingresos pendientes"
          value={formatCurrency(snapshot.kpis.pendingRevenue)}
          detail="Pagos pendientes de aprobacion"
        />
        <KpiCard
          label="Tasa de finalizacion"
          value={`${snapshot.kpis.completionRate}%`}
          detail="Ordenes finalizadas sobre creadas"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ventas</p>
              <h2>Ingresos por mes</h2>
            </div>
            <span>Pagos aprobados</span>
          </div>
          <BarChart data={snapshot.revenueByMonth} valueKey="revenue" label="Ingresos por mes" />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ordenes</p>
              <h2>Estado general</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.ordersByStatus} valueLabel="ordenes" />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Pagos</p>
              <h2>Estado de pagos</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.paymentsByStatus} valueLabel="pagos" />
        </article>
      </section>

      <section className="insights-grid">
        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Conversion</p>
              <h2>Embudo operativo</h2>
            </div>
            <span>Ordenes de punta a punta</span>
          </div>
          <Funnel data={snapshot.orderFunnel} />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Logistica</p>
              <h2>Estado de envios</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.shipmentsByStatus} valueLabel="envios" />
        </article>
      </section>

      <section className="alerts-panel">
        <div>
          <p className="eyebrow">Atencion</p>
          <h2>Alertas operativas</h2>
        </div>
        <div className="alert-list">
          {snapshot.operationalAlerts.map((alert) => (
            <article className={`alert-card alert-${alert.severity}`} key={alert.id}>
              <span>{alert.severity}</span>
              <strong>{alert.title}</strong>
              <p>{alert.detail}</p>
              {alert.items.length > 0 ? (
                <div className="alert-actions">
                  <small className="alert-actions-title">
                    {alert.items.length} recurso{alert.items.length === 1 ? "" : "s"} afectado
                    {alert.items.length === 1 ? "" : "s"}
                  </small>
                  {alert.items.slice(0, 3).map((item) => (
                    <a href={item.href} key={item.id} rel="noreferrer" target="_blank">
                      <span>{item.type}</span>
                      {item.label}
                    </a>
                  ))}
                  {alert.items.length > 3 ? <small>+{alert.items.length - 3} recursos mas</small> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="table-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Catalogo</p>
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
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operacion</p>
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
                      <span className={`status-pill status-${order.estado_general}`}>
                        {formatStatus(order.estado_general)}
                      </span>
                    </td>
                    <td>{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="sources-panel">
        <div>
          <p className="eyebrow">Integraciones</p>
          <h2>Fuentes de datos</h2>
        </div>
        <div className="source-list">
          {snapshot.dataSources.map((source) => (
            <article key={source.name} className="source-card">
              <span className={`source-dot source-${source.status}`} />
              <div>
                <strong>{source.name}</strong>
                <p>{source.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
