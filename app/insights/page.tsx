import { getAiInsights } from "@/lib/ai-insights";
import { getAnalyticsSnapshot } from "@/lib/analytics";
import { getTimeRangeIdFromSearchParams, type TimeRangeSearchParams } from "@/lib/time-range";
import { AnalyticsChat } from "../analytics-chat";
import {
  AppChrome,
  DetailCard,
  formatCurrency,
  Icon,
  MetricPanel,
  numberFormatter
} from "../ui";

type PageProps = {
  searchParams?: Promise<TimeRangeSearchParams>;
};

function RecommendationCard({
  detail,
  title,
  tone
}: {
  detail: string;
  title: string;
  tone: "positive" | "warning" | "neutral";
}) {
  return (
    <article className={`recommendation-card recommendation-${tone}`}>
      <span>{tone === "positive" ? "Oportunidad" : tone === "warning" ? "Atencion" : "Insight"}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </article>
  );
}

function formatDayLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatHourLabel(value: string) {
  const [start, end] = value.split("-");

  if (!start || !end) {
    return value;
  }

  return `${start.replace(":00", "")} a ${end.replace(":00", "")} h`;
}

export default async function InsightsPage({ searchParams }: PageProps) {
  const timeRangeId = getTimeRangeIdFromSearchParams(await searchParams);
  const snapshot = await getAnalyticsSnapshot(timeRangeId);
  const insights = await getAiInsights(snapshot);

  return (
    <AppChrome
      active="insights"
      generatedAt={snapshot.generatedAt}
      integrationHealth={snapshot.kpis.integrationHealth}
      timeRangeId={snapshot.timeRange.id}
    >
      <section className="page-hero compact">
        <p className="eyebrow">Inteligencia</p>
        <h1>Insights IA</h1>
        <p>
          Lectura automatica del rendimiento comercial, patrones de venta y recomendaciones accionables.
        </p>
      </section>

      <section className="ai-summary-panel">
        <div className="ai-summary-heading">
          <div className="card-icon static">
            <Icon name="sparkles" />
          </div>
          <div>
            <p className="eyebrow">Resumen ejecutivo</p>
            <h2>{insights.source === "gemini" ? "Generado con IA" : "Analisis local"}</h2>
          </div>
          <span>{insights.source === "gemini" ? "Gemini" : "Fallback sin API key"}</span>
        </div>
        <p>{insights.summary}</p>
      </section>

      <section className="kpi-grid" aria-label="Patrones inteligentes">
        <MetricPanel
          detail={`${numberFormatter.format(insights.bestSalesDay.orders)} pagos aprobados`}
          label="Mejor dia de venta"
          value={insights.bestSalesDay.day}
        />
        <MetricPanel
          detail={`${numberFormatter.format(insights.bestSalesHour.orders)} pagos aprobados`}
          label="Mejor franja horaria"
          value={insights.bestSalesHour.label}
        />
        <MetricPanel
          detail="Ingresos estimados si se mantiene el ritmo"
          label="Proyeccion mensual"
          value={formatCurrency(insights.monthlyProjection.projectedRevenue)}
        />
        <MetricPanel
          detail="Promedio de ingresos aprobados por dia"
          label="Promedio diario"
          value={formatCurrency(insights.monthlyProjection.averageDailyRevenue)}
        />
      </section>

      <section className="detail-grid" aria-label="Promedios de venta">
        <DetailCard
          badge="Dias"
          icon="trending"
          rows={snapshot.salesByDay.slice(0, 5).map((item) => ({
            label: formatDayLabel(item.label),
            numericValue: item.orders,
            value: `${numberFormatter.format(item.orders)} ventas`
          }))}
          title="Dias que mas venden"
        />
        <DetailCard
          badge="Horarios"
          icon="activity"
          rows={snapshot.salesByHour.slice(0, 5).map((item) => ({
            label: formatHourLabel(item.label),
            numericValue: item.orders,
            value: `${numberFormatter.format(item.orders)} ventas`
          }))}
          title="Franjas con mas ventas"
        />
        <DetailCard
          badge="Demanda"
          icon="users"
          rows={snapshot.buyerPreferencesBySize.slice(0, 5).map((item) => ({
            label: `Talle ${item.label}`,
            numericValue: item.value,
            value: `${numberFormatter.format(item.value)} preferencias`
          }))}
          title="Preferencias detectadas"
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recomendaciones</p>
            <h2>
              <Icon name="sparkles" />
              Acciones sugeridas
            </h2>
            <span>Combinan pagos, ordenes, preferencias y logistica</span>
          </div>
        </div>
        <div className="recommendation-grid">
          {insights.recommendations.map((recommendation) => (
            <RecommendationCard
              detail={recommendation.detail}
              key={recommendation.title}
              title={recommendation.title}
              tone={recommendation.tone}
            />
          ))}
        </div>
      </section>

      <AnalyticsChat timeRangeId={snapshot.timeRange.id} />
    </AppChrome>
  );
}
