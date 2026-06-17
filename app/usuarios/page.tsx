import { getAnalyticsSnapshot } from "@/lib/analytics";
import { AppChrome, HorizontalBars, numberFormatter } from "../ui";

export default async function UsersPage() {
  const snapshot = await getAnalyticsSnapshot();

  return (
    <AppChrome active="usuarios" generatedAt={snapshot.generatedAt} integrationHealth={snapshot.kpis.integrationHealth}>
      <section className="page-hero compact">
        <p className="eyebrow">Buyer</p>
        <h1>Usuarios</h1>
        <p>Compradores activos y preferencias disponibles desde Buyer.</p>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <p className="eyebrow">Activos</p>
          <strong className="metric-large">{numberFormatter.format(snapshot.kpis.activeUsers)}</strong>
          <span className="muted-text">Compradores registrados</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Calificacion</p>
          <strong className="metric-large">{snapshot.kpis.averageRating.toFixed(1)}</strong>
          <span className="muted-text">Promedio de reviews</span>
        </article>
        <article className="panel">
          <p className="eyebrow">Fuentes</p>
          <strong className="metric-large">{snapshot.kpis.integrationHealth}%</strong>
          <span className="muted-text">Salud de integraciones</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preferencias</p>
              <h2>Categorias</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.buyerPreferencesByCategory} valueLabel="preferencias" />
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preferencias</p>
              <h2>Talles</h2>
            </div>
          </div>
          <HorizontalBars data={snapshot.buyerPreferencesBySize} valueLabel="preferencias" />
        </article>
      </section>
    </AppChrome>
  );
}
