import type { Payment } from "@/lib/types";
import type { DataSourceStatus } from "./seller";

type PaymentsResult = {
  payments: Payment[];
  source: DataSourceStatus;
};

function getPaymentsUrl() {
  const baseUrl = process.env.PAYMENTS_API_BASE_URL ?? "https://proyecto-c-payments-lama.vercel.app";

  return `${baseUrl.replace(/\/$/, "")}/api/pagos`;
}

function getApiHeaders() {
  const apiKey = process.env.PAYMENTS_API_KEY ?? process.env.ANALYTICS_API_KEY;
  const headerName = process.env.PAYMENTS_API_KEY_HEADER ?? "x-api-key";
  const serviceName = process.env.ANALYTICS_SERVICE_NAME ?? "analytics";
  const serviceHeaderName = process.env.ANALYTICS_SERVICE_NAME_HEADER ?? "x-service-name";
  const headers: Record<string, string> = {
    [serviceHeaderName]: serviceName
  };

  if (!apiKey) {
    return headers;
  }

  if (headerName.toLowerCase() === "authorization") {
    return { ...headers, Authorization: `Bearer ${apiKey}` };
  }

  return { ...headers, [headerName]: apiKey };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePayment(value: unknown): Payment | null {
  const payment = asRecord(value);

  if (!payment) {
    return null;
  }

  const pagoId = asString(payment.pago_id);
  const ordenId = asString(payment.orden_id);

  if (!pagoId || !ordenId) {
    return null;
  }

  return {
    pago_id: pagoId,
    orden_id: ordenId,
    comprador_id: asString(payment.comprador_id),
    vendedor_id: asString(payment.vendedor_id),
    monto_producto: asNumber(payment.monto_producto),
    monto_envio: asNumber(payment.monto_envio),
    monto_total: asNumber(payment.monto_total),
    estado: asString(payment.estado, "pendiente") as Payment["estado"],
    fecha_creacion: asString(payment.fecha_creacion, new Date().toISOString()),
    fecha_actualizacion: asString(payment.fecha_actualizacion, asString(payment.fechaActualizacion)) || undefined,
    fecha_aprobacion:
      asString(payment.fecha_aprobacion, asString(payment.fechaAprobacion, asString(payment.approved_at))) || undefined
  };
}

function normalizePaymentsResponse(payload: unknown) {
  const rawItems = Array.isArray(payload) ? payload : [];

  return rawItems.map(normalizePayment).filter((payment): payment is Payment => Boolean(payment));
}

export async function fetchPayments(fallbackPayments: Payment[]): Promise<PaymentsResult> {
  const url = getPaymentsUrl();

  try {
    const response = await fetch(url, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        payments: fallbackPayments,
        source: {
          name: "Payments App",
          status: "error",
          detail: `No se pudieron traer pagos reales (${response.status}). Se usan mocks temporales.`
        }
      };
    }

    const payload = await response.json();
    const payments = normalizePaymentsResponse(payload);

    return {
      payments: payments.length > 0 ? payments : fallbackPayments,
      source: {
        name: "Payments App",
        status: payments.length > 0 ? "connected" : "mock",
        detail:
          payments.length > 0
            ? `Pagos reales obtenidos desde ${url}.`
            : "Payments respondio sin pagos; se usan mocks temporales."
      }
    };
  } catch {
    return {
      payments: fallbackPayments,
      source: {
        name: "Payments App",
        status: "error",
        detail: "No se pudo conectar con Payments. Se usan mocks temporales."
      }
    };
  }
}
