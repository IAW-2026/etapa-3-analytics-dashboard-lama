import { getAnalyticsSnapshot } from "@/lib/analytics";
import { AppChrome, HorizontalBars, numberFormatter } from "../ui";

export default async function ShipmentsPage() {
  const snapshot = await getAnalyticsSnapshot();
  const totalShipments = snapshot.shipmentsByStatus.reduce((total, item) => total + item.value, 0);

  return (
    <AppChrome active="envios" generatedAt={snapshot.generatedAt} integrationHealth={snapshot.kpis.integrationHealth}>
      <section className="page-hero compact">
        <p className="eyebrow">Logistica</p>
        <h1>Envios</h1>
        <p>Seguimiento agregado de estados logisticos reportados por la app de envios.</p>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <p className="eyebrow">Envios</p>
          <strong className="metric-large">{numberFormatter.format(totalShipments)}</strong>
          <span className="muted-text">Registros logisticos</span>
        </article>
        {snapshot.shipmentsByStatus.slice(0, 2).map((item) => (
          <article className="panel" key={item.label}>
            <p className="eyebrow">{item.label}</p>
            <strong className="metric-large">{numberFormatter.format(item.value)}</strong>
            <span className="muted-text">Estado reportado</span>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Estados</p>
            <h2>Estado de envios</h2>
          </div>
        </div>
        <HorizontalBars data={snapshot.shipmentsByStatus} valueLabel="envios" />
      </section>
    </AppChrome>
  );
}
