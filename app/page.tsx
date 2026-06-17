import { getAnalyticsSnapshot } from "@/lib/analytics";
import {
  AppChrome,
  formatCurrency,
  formatDate,
  getConnectionLabel,
  ModuleCard,
  numberFormatter
} from "./ui";

export default async function Home() {
  const snapshot = await getAnalyticsSnapshot();
  const integrationHealth = snapshot.kpis.integrationHealth;

  return (
    <AppChrome active="inicio" generatedAt={snapshot.generatedAt} integrationHealth={integrationHealth}>
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
          href="/dashboard"
          icon="activity"
          label="Dashboard"
          value={formatCurrency(snapshot.kpis.revenue)}
        />
        <ModuleCard
          detail="Estados y ordenes recientes"
          href="/ordenes"
          icon="bag"
          label="Ordenes"
          value={numberFormatter.format(snapshot.orderFunnel[0]?.value ?? 0)}
        />
        <ModuleCard
          detail="Aprobados, pendientes y alertas"
          href="/pagos"
          icon="credit"
          label="Pagos"
          value={numberFormatter.format(snapshot.kpis.totalTransactions)}
        />
        <ModuleCard
          detail="Catalogo activo y destacados"
          href="/productos"
          icon="package"
          label="Productos"
          value={numberFormatter.format(snapshot.kpis.activeProducts)}
        />
        <ModuleCard
          detail="Estados logisticos"
          href="/envios"
          icon="truck"
          label="Envios"
          value={numberFormatter.format(snapshot.shipmentsByStatus.reduce((total, item) => total + item.value, 0))}
        />
        <ModuleCard
          detail="Compradores y preferencias"
          href="/usuarios"
          icon="users"
          label="Usuarios"
          value={numberFormatter.format(snapshot.kpis.activeUsers)}
        />
        <ModuleCard
          detail="APIs conectadas y fallback"
          href="/fuentes"
          icon="database"
          label="Fuentes"
          value={`${integrationHealth}%`}
        />
      </section>
    </AppChrome>
  );
}
