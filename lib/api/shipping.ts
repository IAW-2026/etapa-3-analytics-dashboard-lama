import type { Shipment } from "@/lib/types";
import type { DataSourceStatus } from "./seller";

type ShippingResponse = {
  envios?: unknown;
  items?: unknown;
};

export type ShipmentsResult = {
  shipments: Shipment[];
  source: DataSourceStatus;
};

function getShippingUrl() {
  const baseUrl = process.env.SHIPPING_API_BASE_URL ?? "https://proyecto-c-shipping-lama.vercel.app";

  return `${baseUrl.replace(/\/$/, "")}/api/envios`;
}

function getApiHeaders() {
  const apiKey = process.env.SHIPPING_API_KEY ?? process.env.ANALYTICS_API_KEY;
  const headerName = process.env.SHIPPING_API_KEY_HEADER ?? "x-api-key";
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

function mapShippingStatus(status: string): Shipment["estado"] {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "entregado" || normalizedStatus === "delivered") {
    return "delivered";
  }

  if (
    normalizedStatus === "despachado" ||
    normalizedStatus === "en_transito" ||
    normalizedStatus === "in_transit"
  ) {
    return "in_transit";
  }

  return "pending";
}

function normalizeShipment(value: unknown): Shipment | null {
  const shipment = asRecord(value);

  if (!shipment) {
    return null;
  }

  const envioId = asString(shipment.envio_id);
  const ordenId = asString(shipment.orden_id);

  if (!envioId || !ordenId) {
    return null;
  }

  const logistic = asRecord(shipment.logistico);

  return {
    envio_id: envioId,
    orden_id: ordenId,
    codigo_seguimiento: asString(shipment.codigo_seguimiento),
    empresa_logistica: asString(logistic?.nombre, asString(shipment.logistico_id, "Sin operador")),
    estado: mapShippingStatus(asString(shipment.estado_actual, "pending")),
    fecha_actualizacion: asString(shipment.fecha_actualizacion, asString(shipment.fecha_creacion))
  };
}

function normalizeShipmentsResponse(payload: unknown) {
  const response = asRecord(payload) as ShippingResponse | null;
  const rawItems = Array.isArray(payload) ? payload : response?.envios ?? response?.items;
  const items = Array.isArray(rawItems) ? rawItems : [];

  return items.map(normalizeShipment).filter((shipment): shipment is Shipment => Boolean(shipment));
}

export async function fetchShippingShipments(fallbackShipments: Shipment[]): Promise<ShipmentsResult> {
  const url = getShippingUrl();

  try {
    const response = await fetch(url, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        shipments: fallbackShipments,
        source: {
          name: "Shipping App",
          status: "error",
          detail: `No se pudieron traer envios reales (${response.status}). Se usan mocks temporales.`
        }
      };
    }

    const payload = await response.json();
    const shipments = normalizeShipmentsResponse(payload);

    return {
      shipments: shipments.length > 0 ? shipments : fallbackShipments,
      source: {
        name: "Shipping App",
        status: shipments.length > 0 ? "connected" : "mock",
        detail:
          shipments.length > 0
            ? `Envios reales obtenidos desde ${url}.`
            : "Shipping respondio sin envios; se usan mocks temporales."
      }
    };
  } catch {
    return {
      shipments: fallbackShipments,
      source: {
        name: "Shipping App",
        status: "error",
        detail: "No se pudo conectar con Shipping. Se usan mocks temporales."
      }
    };
  }
}
