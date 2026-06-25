import { getAnalyticsSnapshot } from "@/lib/analytics";
import {
  buildTimeRangeHref,
  getTimeRangeIdFromSearchParams,
  type TimeRangeSearchParams
} from "@/lib/time-range";
import {
  AppChrome,
  formatCurrency,
  formatDate,
  getConnectionLabel,
  ModuleCard,
  numberFormatter
} from "./ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function Home({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);
  const integrationHealth = snapshot.kpis.integrationHealth;

  return (
    <AppChrome
      active="inicio"
      generatedAt={snapshot.generatedAt}
      integrationHealth={integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="home-hero">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Bienvenido al panel de LAMA</h1>
          <p>
            Un punto de entrada limpio para leer el estado operativo del marketplace y entrar a cada area de analisis.
          </p>
        </div>
        <aside className="home-status-card">
          <span>Ultima actualizacion</span>
          <strong>{formatDate(snapshot.generatedAt)}</strong>
          <p>{integrationHealth}% de fuentes conectadas</p>
          <div className="state-progress">
            <div style={{ width: `${integrationHealth}%` }} />
          </div>
          <b>{getConnectionLabel(integrationHealth)}</b>
        </aside>
      </section>

      <section className="module-grid" aria-label="Accesos del analytics">
        <ModuleCard
          detail="Resumen visual del sistema"
          href={buildTimeRangeHref("/dashboard", snapshot.timeRange.id)}
          icon="activity"
          label="Dashboard"
          trend={snapshot.trends.kpis.revenue}
          value={formatCurrency(snapshot.kpis.revenue)}
        />
        <ModuleCard
          detail="Estados y ordenes recientes"
          href={buildTimeRangeHref("/ordenes", snapshot.timeRange.id)}
          icon="bag"
          label="Ordenes"
          trend={snapshot.trends.kpis.createdOrders}
          value={numberFormatter.format(snapshot.orderFunnel[0]?.value ?? 0)}
        />
        <ModuleCard
          detail="Aprobados, pendientes y alertas"
          href={buildTimeRangeHref("/pagos", snapshot.timeRange.id)}
          icon="credit"
          label="Pagos"
          trend={snapshot.trends.kpis.totalTransactions}
          value={numberFormatter.format(snapshot.kpis.totalTransactions)}
        />
        <ModuleCard
          detail="Catalogo activo y destacados"
          href={buildTimeRangeHref("/productos", snapshot.timeRange.id)}
          icon="package"
          label="Productos"
          trend={snapshot.trends.kpis.activeProducts}
          value={numberFormatter.format(snapshot.kpis.activeProducts)}
        />
        <ModuleCard
          detail="Estados logisticos"
          href={buildTimeRangeHref("/envios", snapshot.timeRange.id)}
          icon="truck"
          label="Envios"
          trend={snapshot.trends.kpis.totalShipments}
          value={numberFormatter.format(snapshot.shipmentsByStatus.reduce((total, item) => total + item.value, 0))}
        />
        <ModuleCard
          detail="Compradores y vendedores"
          href={buildTimeRangeHref("/usuarios", snapshot.timeRange.id)}
          icon="users"
          label="Usuarios"
          value={numberFormatter.format(snapshot.kpis.activeUsers + snapshot.kpis.activeSellers)}
        />
        <ModuleCard
          detail="APIs conectadas"
          href={buildTimeRangeHref("/fuentes", snapshot.timeRange.id)}
          icon="database"
          label="Fuentes"
          trend={snapshot.trends.kpis.integrationHealth}
          value={`${integrationHealth}%`}
        />
      </section>
    </AppChrome>
  );
}
