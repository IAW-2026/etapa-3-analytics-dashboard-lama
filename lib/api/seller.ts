import type { Order, Product, Vendor } from "@/lib/types";

type SellerProductsResponse = {
  items?: unknown;
};

type SellerOrdersResponse = {
  items?: unknown;
};

type SellerVendorsResponse = {
  items?: unknown;
  vendedores?: unknown;
  data?: unknown;
  total?: unknown;
  page?: unknown;
  pageSize?: unknown;
};

export type DataSourceStatus = {
  name: string;
  status: "connected" | "error";
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

export type VendorsResult = {
  vendors: Vendor[];
  totalVendors: number;
  page: number;
  pageSize: number;
  source: DataSourceStatus;
};

function getSellerUrl(path: string) {
  const baseUrl = process.env.SELLER_API_BASE_URL ?? "https://proyecto-c-seller-lama.vercel.app";

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function getSellerVendorsPath() {
  return process.env.SELLER_VENDORS_PATH ?? "/api/vendedores";
}

function getSellerVendorsUrl() {
  const path = getSellerVendorsPath();
  const url = new URL(getSellerUrl(path.startsWith("/") ? path : `/${path}`));
  const optionalParams = {
    search: process.env.SELLER_VENDORS_SEARCH,
    page: process.env.SELLER_VENDORS_PAGE,
    pageSize: process.env.SELLER_VENDORS_PAGE_SIZE
  };

  Object.entries(optionalParams).forEach(([key, value]) => {
    if (value?.trim()) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getApiHeaders() {
  const apiKey = process.env.ANALYTICS_API_KEY;
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

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["1", "activo", "active", "habilitado", "true", "si"].includes(normalizedValue)) {
      return true;
    }

    if (["0", "inactivo", "inactive", "inhabilitado", "false", "no"].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
}

function asOptionalNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return undefined;
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
    stock: asOptionalNumber(
      product.stock,
      product.stock_disponible,
      product.cantidad_disponible,
      product.cantidad
    ),
    estado_prenda: asString(product.estado_prenda, "usado") as Product["estado_prenda"],
    talle: asString(product.talle, "U"),
    marca: asString(product.marca, "Sin marca"),
    genero: asString(product.genero, "mujer") as Product["genero"],
    estado_publicacion: asString(product.estado_publicacion, "activa") as Product["estado_publicacion"],
    fecha_creacion: asString(product.fecha_creacion, new Date().toISOString())
  };
}

function normalizeVendor(value: unknown): Vendor | null {
  const vendor = asRecord(value);

  if (!vendor) {
    return null;
  }

  const clerkUserId = asString(
    vendor.clerk_user_id,
    asString(vendor.clerkUserId, asString(vendor.id))
  );

  if (!clerkUserId) {
    return null;
  }

  return {
    clerk_user_id: clerkUserId,
    nombre_vendedor: asString(
      vendor.nombre_vendedor,
      asString(vendor.nombreVendedor, "Vendedor sin nombre")
    ),
    dni: asString(vendor.dni, asString(vendor.DNI)),
    email: asString(vendor.email),
    telefono: asString(vendor.telefono) || undefined,
    activo: asBoolean(vendor.activo)
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

function getVendorsItems(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const response = asRecord(payload) as SellerVendorsResponse | null;

  if (!response) {
    return [];
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.vendedores)) {
    return response.vendedores;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  const data = asRecord(response.data);

  if (data && Array.isArray(data.items)) {
    return data.items;
  }

  if (data && Array.isArray(data.vendedores)) {
    return data.vendedores;
  }

  return [];
}

function normalizeVendorsResponse(payload: unknown) {
  const response = asRecord(payload) as SellerVendorsResponse | null;
  const data = asRecord(response?.data);
  const items = getVendorsItems(payload);
  const vendors = items.map(normalizeVendor).filter((vendor): vendor is Vendor => Boolean(vendor));

  return {
    vendors,
    total: asOptionalNumber(response?.total, data?.total) ?? vendors.length,
    page: asOptionalNumber(response?.page, data?.page) ?? 1,
    pageSize: asOptionalNumber(response?.pageSize, data?.pageSize) ?? items.length
  };
}

export async function fetchSellerProducts(): Promise<ProductsResult> {
  const url = getSellerUrl("/api/productos");

  try {
    const response = await fetch(url, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        products: [],
        source: {
          name: "Seller App",
          status: "error",
          detail: `No se pudieron traer productos reales (${response.status}).`
        }
      };
    }

    const payload = await response.json();
    const products = normalizeProductsResponse(payload);

    return {
      products,
      source: {
        name: "Seller App",
        status: "connected",
        detail:
          products.length > 0
            ? `Productos reales obtenidos desde ${url}.`
            : `Seller respondio sin items desde ${url}.`
      }
    };
  } catch {
    return {
      products: [],
      source: {
        name: "Seller App",
        status: "error",
        detail: "No se pudo conectar con Seller."
      }
    };
  }
}

export async function fetchSellerOrders(): Promise<OrdersResult> {
  const url = getSellerUrl("/api/ordenes-ventas");

  try {
    const response = await fetch(url, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        orders: [],
        source: {
          name: "Seller Ordenes",
          status: "error",
          detail: `No se pudieron traer ordenes reales (${response.status}).`
        }
      };
    }

    const payload = await response.json();
    const orders = normalizeOrdersResponse(payload);

    return {
      orders,
      source: {
        name: "Seller Ordenes",
        status: "connected",
        detail:
          orders.length > 0
            ? `Ordenes reales obtenidas desde ${url}.`
            : `Seller respondio sin ordenes desde ${url}.`
      }
    };
  } catch {
    return {
      orders: [],
      source: {
        name: "Seller Ordenes",
        status: "error",
        detail: "No se pudo conectar con ordenes de Seller."
      }
    };
  }
}

export async function fetchSellerVendors(): Promise<VendorsResult> {
  const url = getSellerVendorsUrl();

  try {
    const response = await fetch(url, {
      headers: getApiHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        vendors: [],
        totalVendors: 0,
        page: 1,
        pageSize: 0,
        source: {
          name: "Seller Vendedores",
          status: "error",
          detail: `No se pudieron traer vendedores reales (${response.status}).`
        }
      };
    }

    const payload = await response.json();
    const vendorResponse = normalizeVendorsResponse(payload);

    return {
      vendors: vendorResponse.vendors,
      totalVendors: vendorResponse.total,
      page: vendorResponse.page,
      pageSize: vendorResponse.pageSize,
      source: {
        name: "Seller Vendedores",
        status: "connected",
        detail:
          vendorResponse.vendors.length > 0
            ? `Vendedores reales obtenidos desde ${url}. Total: ${vendorResponse.total}.`
            : `Seller respondio sin vendedores desde ${url}.`
      }
    };
  } catch {
    return {
      vendors: [],
      totalVendors: 0,
      page: 1,
      pageSize: 0,
      source: {
        name: "Seller Vendedores",
        status: "error",
        detail: "No se pudo conectar con vendedores de Seller."
      }
    };
  }
}
