export type OrderStatus =
  | "pendiente_pago"
  | "pagada"
  | "en_preparacion"
  | "despachada"
  | "finalizada"
  | "liquidada"
  | "cancelada";

export type PaymentStatus = "pendiente" | "aprobado" | "rechazado";

export type ShipmentStatus = "pending" | "in_transit" | "delivered";

export type Buyer = {
  clerk_user_id_comprador: string;
  email: string;
  nombre_comprador: string;
  DNI: string;
  telefono?: string;
  direccion_envio: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  preferencias?: BuyerPreference[];
};

export type BuyerPreference = {
  preferencia_id: string;
  clerk_user_id_comprador: string;
  talles_preferidos: string[];
  categorias_preferidas: string[];
  vendedores_preferidos: string[];
};

export type Product = {
  producto_id: string;
  vendedor_id: string;
  categoria_id: string;
  titulo: string;
  precio: number;
  estado_prenda: "nuevo" | "usado" | "vintage";
  talle: string;
  marca: string;
  genero: "hombre" | "mujer" | "ninos";
  estado_publicacion: "activa" | "inactiva";
  fecha_creacion: string;
};

export type Order = {
  orden_id: string;
  comprador_id: string;
  vendedor_id: string;
  items?: Array<{
    producto_id: string;
    precio_unitario: number;
    titulo?: string;
  }>;
  producto_ids: string[];
  total: number;
  estado_general: OrderStatus;
  estado_pago: PaymentStatus;
  estado_envio: "pendiente" | "en_preparacion" | "despachado" | "entregado" | "cancelado";
  fecha_creacion: string;
};

export type Payment = {
  pago_id: string;
  orden_id: string;
  comprador_id: string;
  vendedor_id: string;
  monto_producto: number;
  monto_envio: number;
  monto_total: number;
  estado: PaymentStatus;
  fecha_creacion: string;
};

export type Shipment = {
  envio_id: string;
  orden_id: string;
  codigo_seguimiento?: string;
  empresa_logistica: string;
  estado: ShipmentStatus;
  fecha_actualizacion: string;
};

export type Review = {
  review_id: string;
  orden_id: string;
  comprador_id: string;
  vendedor_id: string;
  calificacion: number;
  fecha_creacion: string;
};

export type TrendDirection = "up" | "down" | "flat";

export type TrendTone = "positive" | "negative" | "neutral";

export type TrendMetric = {
  current: number;
  previous: number;
  percentChange: number;
  direction: TrendDirection;
  tone: TrendTone;
};

export type TimeRangeId = "all" | "30d" | "90d" | "month" | "previous-month";

export type AnalyticsTimeRange = {
  id: TimeRangeId;
  label: string;
  startDate: string | null;
  endDate: string | null;
  previousStartDate: string | null;
  previousEndDate: string | null;
};

export type KpiTrendKey =
  | "activeProducts"
  | "activeUsers"
  | "averageOrderValue"
  | "averageRating"
  | "completedOrders"
  | "completionRate"
  | "createdOrders"
  | "integrationHealth"
  | "pendingPayments"
  | "pendingRevenue"
  | "revenue"
  | "totalShipments"
  | "totalTransactions";

export type AnalyticsSnapshot = {
  generatedAt: string;
  timeRange: AnalyticsTimeRange;
  kpis: {
    totalTransactions: number;
    activeUsers: number;
    completedOrders: number;
    revenue: number;
    averageRating: number;
    activeProducts: number;
    averageOrderValue: number;
    pendingRevenue: number;
    completionRate: number;
    integrationHealth: number;
  };
  trends: {
    kpis: Record<KpiTrendKey, TrendMetric>;
    shipmentsByStatus: Record<string, TrendMetric>;
  };
  revenueByMonth: Array<{ label: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ label: string; value: number }>;
  paymentsByStatus: Array<{ label: string; value: number }>;
  shipmentsByStatus: Array<{ label: string; value: number }>;
  buyerPreferencesByCategory: Array<{ label: string; value: number }>;
  buyerPreferencesBySize: Array<{ label: string; value: number }>;
  buyerPreferencesBySeller: Array<{ label: string; value: number }>;
  orderFunnel: Array<{ label: string; value: number; detail: string }>;
  operationalAlerts: Array<{
    id: string;
    title: string;
    detail: string;
    severity: "info" | "warning" | "critical";
    items: Array<{
      id: string;
      label: string;
      href: string;
      type: "pago" | "orden" | "envio";
    }>;
  }>;
  topProducts: Array<{ productId: string; title: string; units: number; revenue: number }>;
  topSellers: Array<{ sellerId: string; sales: number; revenue: number }>;
  recentOrders: Order[];
  dataSources: Array<{ name: string; status: "mock" | "connected" | "error"; detail: string }>;
};
