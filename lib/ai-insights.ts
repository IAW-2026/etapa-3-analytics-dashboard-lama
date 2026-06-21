import { generateGeminiText } from "@/lib/gemini";
import type { AiInsights, AnalyticsSnapshot, IntelligentInsight } from "@/lib/types";

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}`;
}

function getMonthlyProjection(snapshot: AnalyticsSnapshot) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsedDays = Math.max(now.getDate(), 1);
  const averageDailyRevenue = snapshot.kpis.revenue / elapsedDays;

  return {
    projectedRevenue: Math.round(averageDailyRevenue * daysInMonth),
    averageDailyRevenue: Math.round(averageDailyRevenue)
  };
}

function buildLocalRecommendations(snapshot: AnalyticsSnapshot, projection: AiInsights["monthlyProjection"]) {
  const recommendations: IntelligentInsight[] = [];
  const pendingPayments = snapshot.paymentsByStatus.find((item) => item.label === "pendiente")?.value ?? 0;
  const rejectedPayments = snapshot.paymentsByStatus.find((item) => item.label === "rechazado")?.value ?? 0;
  const pendingShipments = snapshot.shipmentsByStatus.find((item) => item.label === "pending")?.value ?? 0;

  if (pendingPayments > 0) {
    recommendations.push({
      title: "Priorizar pagos pendientes",
      detail: `Hay ${pendingPayments} pagos pendientes. Resolverlos puede destrabar ingresos por ${formatCurrency(
        snapshot.kpis.pendingRevenue
      )}.`,
      tone: "warning"
    });
  }

  if (rejectedPayments > 0) {
    recommendations.push({
      title: "Revisar rechazos de pago",
      detail: `${rejectedPayments} pagos fueron rechazados. Conviene contactar a compradores o revisar el flujo de checkout.`,
      tone: "warning"
    });
  }

  if (pendingShipments > 0) {
    recommendations.push({
      title: "Reducir demora logistica",
      detail: `${pendingShipments} envios siguen pendientes. Es un punto sensible para mejorar experiencia y finalizacion.`,
      tone: "warning"
    });
  }

  if (snapshot.buyerPreferencesBySize.length > 0) {
    const topSize = snapshot.buyerPreferencesBySize[0];

    recommendations.push({
      title: `Aprovechar demanda de talle ${topSize.label}`,
      detail: `Es el talle mas repetido en preferencias. Puede orientar publicaciones, destacados o campanias.`,
      tone: "positive"
    });
  }

  recommendations.push({
    title: "Proyeccion mensual",
    detail: `Al ritmo actual, los ingresos aprobados proyectan ${formatCurrency(
      projection.projectedRevenue
    )} este mes.`,
    tone: "neutral"
  });

  return recommendations.slice(0, 5);
}

function buildLocalSummary(snapshot: AnalyticsSnapshot, insights: Omit<AiInsights, "source" | "summary">) {
  return [
    `El mejor dia de venta es ${insights.bestSalesDay.day}, con ${insights.bestSalesDay.orders} pagos aprobados y ${formatCurrency(
      insights.bestSalesDay.revenue
    )} en ingresos.`,
    `La franja mas fuerte es ${insights.bestSalesHour.label}.`,
    `La tasa de finalizacion esta en ${snapshot.kpis.completionRate}% y la salud de integraciones en ${snapshot.kpis.integrationHealth}%.`,
    `La proyeccion mensual estimada es ${formatCurrency(insights.monthlyProjection.projectedRevenue)}.`
  ].join(" ");
}

function cleanGeneratedText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildAiPrompt(snapshot: AnalyticsSnapshot, localInsights: Omit<AiInsights, "source" | "summary">) {
  return `
Sos analista de negocio del marketplace LAMA. Redacta un resumen ejecutivo breve en espanol rioplatense.
No inventes datos. Usa solo este JSON. Menciona oportunidades, riesgos y una recomendacion prioritaria.
No uses Markdown, asteriscos, bullets ni titulos. Escribi un solo parrafo claro y elegante de 3 a 5 oraciones.

Datos:
${JSON.stringify(
  {
    kpis: snapshot.kpis,
    trends: snapshot.trends.kpis,
    bestSalesDay: localInsights.bestSalesDay,
    bestSalesHour: localInsights.bestSalesHour,
    monthlyProjection: localInsights.monthlyProjection,
    recommendations: localInsights.recommendations,
    paymentsByStatus: snapshot.paymentsByStatus,
    shipmentsByStatus: snapshot.shipmentsByStatus,
    topProducts: snapshot.topProducts.slice(0, 3),
    buyerPreferencesBySize: snapshot.buyerPreferencesBySize.slice(0, 3),
    buyerPreferencesByCategory: snapshot.buyerPreferencesByCategory.slice(0, 3)
  },
  null,
  2
)}
`;
}

export async function getAiInsights(snapshot: AnalyticsSnapshot): Promise<AiInsights> {
  const bestDay = snapshot.salesByDay[0] ?? { label: "sin datos", orders: 0, revenue: 0 };
  const bestHour = snapshot.salesByHour[0] ?? { label: "sin datos", orders: 0, revenue: 0 };
  const monthlyProjection = getMonthlyProjection(snapshot);
  const localInsights = {
    bestSalesDay: {
      day: bestDay.label,
      orders: bestDay.orders,
      revenue: bestDay.revenue
    },
    bestSalesHour: {
      label: bestHour.label,
      orders: bestHour.orders,
      revenue: bestHour.revenue
    },
    monthlyProjection,
    recommendations: buildLocalRecommendations(snapshot, monthlyProjection)
  };
  const localSummary = buildLocalSummary(snapshot, localInsights);

  const generatedSummary = await generateGeminiText({
    prompt: buildAiPrompt(snapshot, localInsights),
    temperature: 0.2
  });

  if (generatedSummary) {
    return {
      source: "gemini",
      summary: cleanGeneratedText(generatedSummary),
      ...localInsights
    };
  }

  return {
    source: "local",
    summary: localSummary,
    ...localInsights
  };
}
