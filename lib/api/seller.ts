import type { Order, Product } from "@/lib/types";

type SellerProductsResponse = {
  items?: unknown;
};

type SellerOrdersResponse = {
  items?: unknown;
};

export type DataSourceStatus = {
  name: string;
  status: "mock" | "connected" | "error";
  detail: string;
};

export type ProductsResult = {
  products: Product[];
  source: DataSourceStatus;
};

export type OrdersResult = {
  orders: Order[];
  source: DataSourceStatus;
};

function getSellerUrl(path: string) {
  const baseUrl = process.env.SELLER_API_BASE_URL ?? "https://proyecto-c-seller-lama.vercel.app";

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function getApiHeaders() {
  const apiKey = process.env.SELLER_API_KEY ?? process.env.ANALYTICS_API_KEY;
  const headerName = process.env.SELLER_API_KEY_HEADER ?? "x-api-key";
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

function normalizeProduct(value: unknown): Product | null {
  const product = asRecord(value);

  if (!product) {
    return null;
  }

  const productoId = asString(product.producto_id);

  if (!productoId) {
    return null;
  }

  return {
    producto_id: productoId,
    vendedor_id: asString(product.vendedor_id),
    categoria_id: asString(product.categoria_id),
    titulo: asString(product.titulo, "Producto sin titulo"),
    precio: asNumber(product.precio),
    estado_prenda: asString(product.estado_prenda, "usado") as Product["estado_prenda"],
    talle: asString(product.talle, "U"),
    marca: asString(product.marca, "Sin marca"),
    genero: asString(product.genero, "mujer") as Product["genero"],
    estado_publicacion: asString(product.estado_publicacion, "activa") as Product["estado_publicacion"],
    fecha_creacion: asString(product.fecha_creacion, new Date().toISOString())
  };
}

function normalizeProductIds(order: Record<string, unknown>) {
  if (Array.isArray(order.producto_ids)) {
    return order.producto_ids.filter((productId): productId is string => typeof productId === "string");
  }

  if (Array.isArray(order.items)) {
    return order.items
      .map((item) => asRecord(item)?.producto_id)
      .filter((productId): productId is string => typeof productId === "string");
  }

  return [];
}

function normalizeOrderItems(order: Record<string, unknown>) {
  if (!Array.isArray(order.items)) {
    return [];
  }

  return order.items
    .map((item) => {
      const orderItem = asRecord(item);
      const productId = asString(orderItem?.producto_id);

      if (!orderItem || !productId) {
        return null;
      }

      return {
        producto_id: productId,
        precio_unitario: asNumber(orderItem.precio_unitario),
        titulo: asString(orderItem.titulo)
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function normalizeOrder(value: unknown): Order | null {
  const order = asRecord(value);

  if (!order) {
    return null;
  }

  const ordenId = asString(order.orden_id);

  if (!ordenId) {
    return null;
  }

  return {
    orden_id: ordenId,
    comprador_id: asString(order.comprador_id),
    vendedor_id: asString(order.vendedor_id),
    items: normalizeOrderItems(order),
    producto_ids: normalizeProductIds(order),
    total: asNumber(order.total),
    estado_general: asString(order.estado_general, "pendiente_pago") as Order["estado_general"],
    estado_pago: asString(order.estado_pago, "pendiente") as Order["estado_pago"],
    estado_envio: asString(order.estado_envio, "pendiente") as Order["estado_envio"],
    fecha_creacion: asString(order.fecha_creacion, new Date().toISOString())
  };
}

function normalizeProductsResponse(payload: unknown) {
  const response = asRecord(payload) as SellerProductsResponse | null;
  const rawItems = Array.isArray(payload) ? payload : response?.items;
  const items = Array.isArray(rawItems) ? rawItems : [];

  return items.map(normalizeProduct).filter((product): product is Product => Boolean(product));
}

function normalizeOrdersResponse(payload: unknown) {
  const response = asRecord(payload) as SellerOrdersResponse | null;
  const rawItems = Array.isArray(payload) ? payload : response?.items;
  const items = Array.isArray(rawItems) ? rawItems : [];

  return items.map(normalizeOrder).filter((order): order is Order => Boolean(order));
}

export async function fetchSellerProducts(fallbackProducts: Product[]): Promise<ProductsResult> {
  const url = getSellerUrl("/api/productos");

  try {
    const response = await fetch(url, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        products: fallbackProducts,
        source: {
          name: "Seller App",
          status: "error",
          detail: `No se pudieron traer productos reales (${response.status}). Se usan mocks temporales.`
        }
      };
    }

    const payload = await response.json();
    const products = normalizeProductsResponse(payload);

    return {
      products: products.length > 0 ? products : fallbackProducts,
      source: {
        name: "Seller App",
        status: products.length > 0 ? "connected" : "mock",
        detail:
          products.length > 0
            ? `Productos reales obtenidos desde ${url}.`
            : "Seller respondio sin items; se usan mocks temporales."
      }
    };
  } catch {
    return {
      products: fallbackProducts,
      source: {
        name: "Seller App",
        status: "error",
        detail: "No se pudo conectar con Seller. Se usan mocks temporales."
      }
    };
  }
}

export async function fetchSellerOrders(fallbackOrders: Order[]): Promise<OrdersResult> {
  const url = getSellerUrl("/api/ordenes-ventas");

  try {
    const response = await fetch(url, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        orders: fallbackOrders,
        source: {
          name: "Seller Ordenes",
          status: "error",
          detail: `No se pudieron traer ordenes reales (${response.status}). Se usan mocks temporales.`
        }
      };
    }

    const payload = await response.json();
    const orders = normalizeOrdersResponse(payload);

    return {
      orders: orders.length > 0 ? orders : fallbackOrders,
      source: {
        name: "Seller Ordenes",
        status: orders.length > 0 ? "connected" : "mock",
        detail:
          orders.length > 0
            ? `Ordenes reales obtenidas desde ${url}.`
            : "Seller respondio sin ordenes; se usan mocks temporales."
      }
    };
  } catch {
    return {
      orders: fallbackOrders,
      source: {
        name: "Seller Ordenes",
        status: "error",
        detail: "No se pudo conectar con ordenes de Seller. Se usan mocks temporales."
      }
    };
  }
}
