import { generateGeminiText } from "@/lib/gemini";
import type { AnalyticsSnapshot } from "@/lib/types";

const allowedTerms = [
  "analytics",
  "dashboard",
  "lama",
  "venta",
  "ventas",
  "ingreso",
  "ingresos",
  "pago",
  "pagos",
  "orden",
  "ordenes",
  "pedido",
  "pedidos",
  "producto",
  "productos",
  "usuario",
  "usuarios",
  "comprador",
  "compradores",
  "envio",
  "envios",
  "logistica",
  "fuente",
  "fuentes",
  "api",
  "apis",
  "metricas",
  "kpi",
  "conversion",
  "embudo",
  "horario",
  "dia",
  "dias",
  "franja",
  "talle",
  "categoria",
  "categorias",
  "vendedor",
  "vendedores",
  "campania",
  "campana",
  "recomendacion",
  "recomendaciones",
  "proyeccion",
  "promedio",
  "tendencia",
  "periodo"
];

const outOfScopeMessage =
  "Solo puedo responder preguntas sobre el Analytics Dashboard de LAMA: ventas, pagos, ordenes, productos, usuarios, envios, fuentes, tendencias e insights del sistema.";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanGeneratedText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isInScope(question: string) {
  const normalizedQuestion = normalizeText(question);

  return allowedTerms.some((term) => normalizedQuestion.includes(normalizeText(term)));
}

function buildSnapshotContext(snapshot: AnalyticsSnapshot) {
  return {
    timeRange: snapshot.timeRange,
    kpis: snapshot.kpis,
    trends: snapshot.trends.kpis,
    revenueByMonth: snapshot.revenueByMonth,
    orderFunnel: snapshot.orderFunnel,
    ordersByStatus: snapshot.ordersByStatus,
    paymentsByStatus: snapshot.paymentsByStatus,
    shipmentsByStatus: snapshot.shipmentsByStatus,
    salesByDay: snapshot.salesByDay,
    salesByHour: snapshot.salesByHour,
    topProducts: snapshot.topProducts,
    buyerPreferencesByCategory: snapshot.buyerPreferencesByCategory,
    buyerPreferencesBySize: snapshot.buyerPreferencesBySize,
    buyerPreferencesBySeller: snapshot.buyerPreferencesBySeller,
    operationalAlerts: snapshot.operationalAlerts.map((alert) => ({
      title: alert.title,
      detail: alert.detail,
      severity: alert.severity
    })),
    dataSources: snapshot.dataSources
  };
}

function buildLocalAnswer(question: string, snapshot: AnalyticsSnapshot) {
  const normalizedQuestion = normalizeText(question);

  if (normalizedQuestion.includes("dia") || normalizedQuestion.includes("horario") || normalizedQuestion.includes("franja")) {
    const bestDay = snapshot.salesByDay[0];
    const bestHour = snapshot.salesByHour[0];

    return `Segun los datos disponibles, el dia con mejor desempeno es ${bestDay?.label ?? "sin datos"} con ${
      bestDay?.orders ?? 0
    } ventas aprobadas. La franja mas fuerte es ${bestHour?.label ?? "sin datos"} con ${bestHour?.orders ?? 0} ventas.`;
  }

  if (normalizedQuestion.includes("producto")) {
    const topProduct = snapshot.topProducts[0];

    return topProduct
      ? `El producto con mejor desempeno es ${topProduct.title}, con ${topProduct.units} unidades vendidas y $${topProduct.revenue} de ingresos.`
      : "No hay productos vendidos en el periodo seleccionado.";
  }

  if (normalizedQuestion.includes("pago")) {
    const approved = snapshot.paymentsByStatus.find((item) => item.label === "aprobado")?.value ?? 0;
    const pending = snapshot.paymentsByStatus.find((item) => item.label === "pendiente")?.value ?? 0;

    return `Hay ${approved} pagos aprobados y ${pending} pagos pendientes. Los ingresos pendientes suman $${snapshot.kpis.pendingRevenue}.`;
  }

  return `En el periodo seleccionado hay $${snapshot.kpis.revenue} de ingresos aprobados, ${snapshot.kpis.totalTransactions} transacciones aprobadas y una tasa de finalizacion de ${snapshot.kpis.completionRate}%.`;
}

function buildPrompt(question: string, snapshot: AnalyticsSnapshot) {
  return `
Sos el copiloto del Analytics Dashboard de LAMA.
Tu alcance es estrictamente: ventas, pagos, ordenes, productos, usuarios, envios, fuentes, KPIs, tendencias e insights del marketplace LAMA.
Si la pregunta esta fuera de ese alcance, responde exactamente: "${outOfScopeMessage}"
No inventes datos. Responde usando solo el JSON provisto. No uses Markdown, asteriscos ni listas largas.
Se breve, claro y accionable.

Pregunta del usuario:
${question}

Datos disponibles:
${JSON.stringify(buildSnapshotContext(snapshot), null, 2)}
`;
}

export async function answerAnalyticsQuestion(question: string, snapshot: AnalyticsSnapshot) {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    return "Escribime una pregunta sobre ventas, pagos, ordenes, productos, usuarios, envios o fuentes del dashboard.";
  }

  if (!isInScope(trimmedQuestion)) {
    return outOfScopeMessage;
  }

  const localAnswer = buildLocalAnswer(trimmedQuestion, snapshot);
  const generatedAnswer = await generateGeminiText({
    prompt: buildPrompt(trimmedQuestion, snapshot),
    temperature: 0.1
  });

  return generatedAnswer ? cleanGeneratedText(generatedAnswer) : localAnswer;
}
