import type { Buyer, BuyerPreference } from "@/lib/types";
import type { DataSourceStatus } from "./seller";

type BuyerResponse = {
  buyers?: unknown;
  compradores?: unknown;
  data?: unknown;
  items?: unknown;
  preferences?: unknown;
  preferencias?: unknown;
  page?: unknown;
  pageSize?: unknown;
  total?: unknown;
};

export type BuyersResult = {
  buyers: Buyer[];
  preferences: BuyerPreference[];
  totalBuyers: number;
  page: number;
  pageSize: number;
  source: DataSourceStatus;
};

function getBuyerUrl(path: string) {
  const baseUrl = process.env.BUYER_API_BASE_URL ?? "https://proyecto-c-buyer2-lama.vercel.app";

  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function getCustomersPath() {
  return process.env.BUYER_CUSTOMERS_PATH ?? "/api/compradores";
}

function getCustomersUrl() {
  const url = new URL(getBuyerUrl(getCustomersPath()));
  const optionalParams = {
    estado: process.env.BUYER_STATUS,
    page: process.env.BUYER_PAGE,
    pageSize: process.env.BUYER_PAGE_SIZE,
    search: process.env.BUYER_SEARCH
  };

  Object.entries(optionalParams).forEach(([key, value]) => {
    if (value?.trim()) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getApiHeaders() {
  const apiKey = process.env.BUYER_API_KEY ?? process.env.ANALYTICS_API_KEY;
  const headerName = process.env.BUYER_API_KEY_HEADER ?? "x-api-key";
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
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getItems(payload: unknown, keys: Array<keyof BuyerResponse>) {
  if (Array.isArray(payload)) {
    return { found: true, items: payload };
  }

  const response = asRecord(payload) as BuyerResponse | null;

  if (!response) {
    return { found: false, items: [] };
  }

  for (const key of keys) {
    const value = response[key];

    if (Array.isArray(value)) {
      return { found: true, items: value };
    }
  }

  if (Array.isArray(response.data)) {
    return { found: true, items: response.data };
  }

  const data = asRecord(response.data);

  if (data) {
    for (const key of keys) {
      const value = data[key];

      if (Array.isArray(value)) {
        return { found: true, items: value };
      }
    }
  }

  return { found: false, items: [] };
}

function normalizePreference(value: unknown, fallbackClerkUserId = ""): BuyerPreference | null {
  const preference = asRecord(value);

  if (!preference) {
    return null;
  }

  const preferenceId = asString(preference.preferencia_id, asString(preference.preferenciaId, asString(preference.id)));
  const clerkUserId = asString(
    preference.clerk_user_id_comprador,
    asString(preference.clerkUserIdComprador, asString(preference.clerk_user_id, fallbackClerkUserId))
  );

  if (!preferenceId || !clerkUserId) {
    return null;
  }

  return {
    clerk_user_id_comprador: clerkUserId,
    preferencia_id: preferenceId,
    talles_preferidos: asStringArray(preference.talles_preferidos ?? preference.tallesPreferidos),
    categorias_preferidas: asStringArray(preference.categorias_preferidas ?? preference.categoriasPreferidas),
    vendedores_preferidos: asStringArray(preference.vendedores_preferidos ?? preference.vendedoresPreferidos)
  };
}

function normalizeEmbeddedPreferences(buyer: Record<string, unknown>, clerkUserId: string) {
  const rawPreferences = Array.isArray(buyer.preferencias)
    ? buyer.preferencias
    : Array.isArray(buyer.preferences)
      ? buyer.preferences
      : [];

  return rawPreferences
    .map((preference) => normalizePreference(preference, clerkUserId))
    .filter((preference): preference is BuyerPreference => Boolean(preference));
}

function normalizeBuyer(value: unknown): Buyer | null {
  const buyer = asRecord(value);

  if (!buyer) {
    return null;
  }

  const clerkUserId = asString(
    buyer.clerk_user_id_comprador,
    asString(buyer.clerkUserIdComprador, asString(buyer.clerk_user_id, asString(buyer.id)))
  );

  if (!clerkUserId) {
    return null;
  }

  return {
    clerk_user_id_comprador: clerkUserId,
    email: asString(buyer.email),
    nombre_comprador: asString(buyer.nombre_comprador, asString(buyer.nombreComprador, "Comprador sin nombre")),
    DNI: asString(buyer.DNI, asString(buyer.dni)),
    telefono: asString(buyer.telefono) || undefined,
    direccion_envio: asString(buyer.direccion_envio, asString(buyer.direccionEnvio)),
    fecha_creacion: asString(buyer.fecha_creacion, asString(buyer.fechaCreacion, new Date().toISOString())),
    fecha_actualizacion: asString(
      buyer.fecha_actualizacion,
      asString(buyer.fechaActualizacion, asString(buyer.fecha_creacion, new Date().toISOString()))
    ),
    preferencias: normalizeEmbeddedPreferences(buyer, clerkUserId)
  };
}

function normalizeBuyersResponse(payload: unknown) {
  const response = asRecord(payload) as BuyerResponse | null;
  const data = asRecord(response?.data);
  const { found, items } = getItems(payload, ["items", "compradores", "buyers"]);
  const buyers = items
    .map(normalizeBuyer)
    .filter((buyer): buyer is Buyer => Boolean(buyer));

  return {
    buyers,
    found,
    page: asNumber(response?.page, asNumber(data?.page, 1)),
    pageSize: asNumber(response?.pageSize, asNumber(data?.pageSize, items.length)),
    preferences: buyers.flatMap((buyer) => buyer.preferencias ?? []),
    rawCount: items.length,
    total: asNumber(response?.total, asNumber(data?.total, buyers.length))
  };
}

export async function fetchBuyerCustomers(
  fallbackBuyers: Buyer[],
  fallbackPreferences: BuyerPreference[]
): Promise<BuyersResult> {
  const customersUrl = getCustomersUrl();

  try {
    const response = await fetch(customersUrl, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        buyers: fallbackBuyers,
        preferences: fallbackPreferences,
        totalBuyers: fallbackBuyers.length,
        page: 1,
        pageSize: fallbackBuyers.length,
        source: {
          name: "Buyer App",
          status: "error",
          detail: `No se pudieron traer compradores reales (${response.status}). Se usan mocks temporales.`
        }
      };
    }

    const payload = await response.json();
    const buyerResponse = normalizeBuyersResponse(payload);
    const hasUsableBuyerData =
      buyerResponse.found && (buyerResponse.rawCount === 0 || buyerResponse.buyers.length > 0);

    if (!hasUsableBuyerData) {
      return {
        buyers: fallbackBuyers,
        preferences: fallbackPreferences,
        totalBuyers: fallbackBuyers.length,
        page: 1,
        pageSize: fallbackBuyers.length,
        source: {
          name: "Buyer App",
          status: "mock",
          detail: "Buyer respondio sin compradores validos; se usan mocks temporales."
        }
      };
    }

    return {
      buyers: buyerResponse.buyers,
      preferences: buyerResponse.preferences,
      totalBuyers: buyerResponse.total,
      page: buyerResponse.page,
      pageSize: buyerResponse.pageSize,
      source: {
        name: "Buyer App",
        status: "connected",
        detail: `Compradores reales obtenidos desde ${customersUrl}. Total: ${buyerResponse.total}. Preferencias incluidas en items.`
      }
    };
  } catch {
    return {
      buyers: fallbackBuyers,
      preferences: fallbackPreferences,
      totalBuyers: fallbackBuyers.length,
      page: 1,
      pageSize: fallbackBuyers.length,
      source: {
        name: "Buyer App",
        status: "error",
        detail: "No se pudo conectar con Buyer. Se usan mocks temporales."
      }
    };
  }
}
