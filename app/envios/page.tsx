import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AppChrome, MetricPanel, numberFormatter, TemporalChart } from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);
  const totalShipments = snapshot.shipmentsByStatus.reduce((total, item) => total + item.value, 0);

  return (
    <AppChrome
      active="envios"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero compact">
        <p className="eyebrow">Logistica</p>
        <h1>Envios</h1>
        <p>Seguimiento agregado de estados logisticos reportados por la app de envios.</p>
      </section>

      <section className="detail-grid">
        <MetricPanel
          detail="Registros logisticos"
          label="Envios"
          trend={snapshot.trends.kpis.totalShipments}
          value={numberFormatter.format(totalShipments)}
        />
        {snapshot.shipmentsByStatus.map((item) => (
          <MetricPanel
            detail="Estado reportado"
            key={item.label}
            label={item.label}
            trend={snapshot.trends.shipmentsByStatus[item.label]}
            value={numberFormatter.format(item.value)}
          />
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Evolucion</p>
            <h2>Envios registrados</h2>
          </div>
        </div>
        <TemporalChart
          data={snapshot.temporalSeries}
          emptyText="No hay envios registrados en el periodo seleccionado."
          label="Evolucion de envios"
          valueKey="shipments"
          valueLabel="Envios registrados"
        />
      </section>
    </AppChrome>
  );
}
