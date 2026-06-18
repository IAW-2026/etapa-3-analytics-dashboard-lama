import { fetchBuyerCustomers } from "./api/buyer";
import { fetchPayments } from "./api/payments";
import { fetchSellerOrders, fetchSellerProducts } from "./api/seller";
import { fetchShippingShipments } from "./api/shipping";
import {
  buyerPreferences as mockBuyerPreferences,
  buyers as mockBuyers,
  orders as mockOrders,
  payments as mockPayments,
  products as mockProducts,
  reviews,
  shipments as mockShipments
} from "./mock-data";
import { DEFAULT_TIME_RANGE_ID, resolveTimeRange } from "./time-range";
import type {
  AnalyticsSnapshot,
  AnalyticsTimeRange,
  Buyer,
  BuyerPreference,
  Order,
  Payment,
  Product,
  Shipment,
  TimeRangeId,
  TrendMetric
} from "./types";

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "short" });

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  return values.length > 0 ? sum(values) / values.length : 0;
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>(
    (accumulator, item) => ({
      ...accumulator,
      [item]: (accumulator[item] ?? 0) + 1
    }),
    {} as Record<T, number>
  );
}

function getMonthLabel(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "sin fecha";
  }

  return monthFormatter.format(parsedDate).replace(".", "");
}

function buildRevenueByMonth(payments: typeof mockPayments) {
  const monthly = payments
    .filter((payment) => payment.estado === "aprobado")
    .reduce<Record<string, { label: string; revenue: number; orders: number }>>((accumulator, payment) => {
      const label = getMonthLabel(payment.fecha_creacion);
      const current = accumulator[label] ?? { label, revenue: 0, orders: 0 };

      return {
        ...accumulator,
        [label]: {
          label,
          revenue: current.revenue + payment.monto_total,
          orders: current.orders + 1
        }
      };
    }, {});

  return Object.values(monthly);
}

function buildTopProducts(products: typeof mockProducts, orders: Order[]) {
  const productStats = new Map<string, { productId: string; title: string; units: number; revenue: number }>();

  orders
    .filter((order) => order.estado_pago === "aprobado")
    .forEach((order) => {
      order.producto_ids.forEach((productId) => {
        const product = products.find((item) => item.producto_id === productId);
        const orderItem = order.items?.find((item) => item.producto_id === productId);
        const current = productStats.get(productId) ?? {
          productId,
          title: product?.titulo ?? orderItem?.titulo ?? `Producto ${productId.slice(0, 8)}`,
          units: 0,
          revenue: 0
        };

        productStats.set(productId, {
          ...current,
          units: current.units + 1,
          revenue: current.revenue + (product?.precio ?? orderItem?.precio_unitario ?? 0)
        });
      });
    });

  return Array.from(productStats.values())
    .sort((first, second) => second.revenue - first.revenue)
    .slice(0, 5);
}

function buildPreferenceCounts(
  preferences: BuyerPreference[],
  getValues: (preference: BuyerPreference) => string[]
) {
  const counts = countBy(preferences.flatMap(getValues).filter(Boolean));

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value)
    .slice(0, 5);
}

function sortRecentOrders(first: Order, second: Order) {
  return new Date(second.fecha_creacion).getTime() - new Date(first.fecha_creacion).getTime();
}

function percent(part: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function parseRangeDate(value: string | null, boundary: "start" | "end") {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (boundary === "end") {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}

function isDateInBounds(value: string, startDate: string | null, endDate: string | null) {
  const date = new Date(value);
  const start = parseRangeDate(startDate, "start");
  const end = parseRangeDate(endDate, "end");

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (start && date < start) {
    return false;
  }

  if (end && date > end) {
    return false;
  }

  return true;
}

function filterByBounds<T>(
  items: T[],
  getDate: (item: T) => string,
  startDate: string | null,
  endDate: string | null
) {
  return items.filter((item) => isDateInBounds(getDate(item), startDate, endDate));
}

function filterByRange<T>(items: T[], getDate: (item: T) => string, timeRange: AnalyticsTimeRange) {
  return filterByBounds(items, getDate, timeRange.startDate, timeRange.endDate);
}

function filterByPreviousRange<T>(items: T[], getDate: (item: T) => string, timeRange: AnalyticsTimeRange) {
  return filterByBounds(items, getDate, timeRange.previousStartDate, timeRange.previousEndDate);
}

function isCompletedOrder(order: Order) {
  return order.estado_general === "finalizada" || order.estado_general === "liquidada";
}

function getPercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

type TrendPolarity = "higher" | "lower" | "neutral";

function buildTrend(current: number, previous: number, polarity: TrendPolarity = "higher"): TrendMetric {
  const percentChange = getPercentChange(current, previous);
  const direction: TrendMetric["direction"] = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "flat";
  let tone: TrendMetric["tone"] = "neutral";

  if (polarity !== "neutral" && direction !== "flat") {
    const improved = polarity === "higher" ? current > previous : current < previous;
    tone = improved ? "positive" : "negative";
  }

  return {
    current,
    previous,
    percentChange,
    direction,
    tone
  };
}

function buildTrends({
  buyers,
  integrationHealth,
  orders,
  payments,
  products,
  shipments,
  timeRange
}: {
  buyers: Buyer[];
  integrationHealth: number;
  orders: Order[];
  payments: Payment[];
  products: Product[];
  shipments: Shipment[];
  timeRange: AnalyticsTimeRange;
}): AnalyticsSnapshot["trends"] {
  const currentBuyers = filterByRange(buyers, (buyer) => buyer.fecha_creacion, timeRange);
  const previousBuyers = filterByPreviousRange(buyers, (buyer) => buyer.fecha_creacion, timeRange);
  const currentOrders = filterByRange(orders, (order) => order.fecha_creacion, timeRange);
  const previousOrders = filterByPreviousRange(orders, (order) => order.fecha_creacion, timeRange);
  const currentPayments = filterByRange(payments, (payment) => payment.fecha_creacion, timeRange);
  const previousPayments = filterByPreviousRange(payments, (payment) => payment.fecha_creacion, timeRange);
  const currentApprovedPayments = currentPayments.filter((payment) => payment.estado === "aprobado");
  const previousApprovedPayments = previousPayments.filter((payment) => payment.estado === "aprobado");
  const currentPendingPayments = currentPayments.filter((payment) => payment.estado === "pendiente");
  const previousPendingPayments = previousPayments.filter((payment) => payment.estado === "pendiente");
  const currentReviews = filterByRange(reviews, (review) => review.fecha_creacion, timeRange);
  const previousReviews = filterByPreviousRange(reviews, (review) => review.fecha_creacion, timeRange);
  const currentShipments = filterByRange(shipments, (shipment) => shipment.fecha_actualizacion, timeRange);
  const previousShipments = filterByPreviousRange(shipments, (shipment) => shipment.fecha_actualizacion, timeRange);
  const currentProducts = filterByRange(products, (product) => product.fecha_creacion, timeRange);
  const previousProducts = filterByPreviousRange(products, (product) => product.fecha_creacion, timeRange);
  const currentActiveProducts = currentProducts.filter((product) => product.estado_publicacion === "activa");
  const previousActiveProducts = previousProducts.filter((product) => product.estado_publicacion === "activa");
  const shipmentStatuses = Array.from(new Set(shipments.map((shipment) => shipment.estado)));
  const shipmentsByStatus = Object.fromEntries(
    shipmentStatuses.map((status) => [
      status,
      buildTrend(
        currentShipments.filter((shipment) => shipment.estado === status).length,
        previousShipments.filter((shipment) => shipment.estado === status).length,
        status === "pending" ? "lower" : "higher"
      )
    ])
  );

  return {
    kpis: {
      activeProducts: buildTrend(currentActiveProducts.length, previousActiveProducts.length),
      activeUsers: buildTrend(currentBuyers.length, previousBuyers.length),
      averageOrderValue: buildTrend(
        average(currentApprovedPayments.map((payment) => payment.monto_total)),
        average(previousApprovedPayments.map((payment) => payment.monto_total))
      ),
      averageRating: buildTrend(
        average(currentReviews.map((review) => review.calificacion)),
        average(previousReviews.map((review) => review.calificacion))
      ),
      completedOrders: buildTrend(
        currentOrders.filter(isCompletedOrder).length,
        previousOrders.filter(isCompletedOrder).length
      ),
      completionRate: buildTrend(
        percent(currentOrders.filter(isCompletedOrder).length, currentOrders.length),
        percent(previousOrders.filter(isCompletedOrder).length, previousOrders.length)
      ),
      createdOrders: buildTrend(currentOrders.length, previousOrders.length),
      integrationHealth: buildTrend(integrationHealth, integrationHealth, "neutral"),
      pendingPayments: buildTrend(currentPendingPayments.length, previousPendingPayments.length, "lower"),
      pendingRevenue: buildTrend(
        sum(currentPendingPayments.map((payment) => payment.monto_total)),
        sum(previousPendingPayments.map((payment) => payment.monto_total)),
        "lower"
      ),
      revenue: buildTrend(
        sum(currentApprovedPayments.map((payment) => payment.monto_total)),
        sum(previousApprovedPayments.map((payment) => payment.monto_total))
      ),
      totalShipments: buildTrend(currentShipments.length, previousShipments.length),
      totalTransactions: buildTrend(currentApprovedPayments.length, previousApprovedPayments.length)
    },
    shipmentsByStatus
  };
}

function buildOrderFunnel(orders: Order[]) {
  const paidOrders = orders.filter((order) => order.estado_pago === "aprobado");
  const shippedOrders = orders.filter((order) => order.estado_envio === "despachado" || order.estado_envio === "entregado");
  const completedOrders = orders.filter(isCompletedOrder);

  return [
    {
      label: "Creadas",
      value: orders.length,
      detail: "Ordenes registradas"
    },
    {
      label: "Pagadas",
      value: paidOrders.length,
      detail: `${percent(paidOrders.length, orders.length)}% de ordenes creadas`
    },
    {
      label: "Enviadas",
      value: shippedOrders.length,
      detail: `${percent(shippedOrders.length, orders.length)}% con envio iniciado`
    },
    {
      label: "Finalizadas",
      value: completedOrders.length,
      detail: `${percent(completedOrders.length, orders.length)}% completadas`
    }
  ];
}

function buildOperationalAlerts(orders: Order[], payments: Payment[], shipments: Shipment[]) {
  const pendingPayments = payments.filter((payment) => payment.estado === "pendiente");
  const rejectedPayments = payments.filter((payment) => payment.estado === "rechazado");
  const stalledOrders = orders.filter(
    (order) => order.estado_pago === "aprobado" && order.estado_envio === "pendiente"
  );
  const alerts: AnalyticsSnapshot["operationalAlerts"] = [];
  const sellerBaseUrl = (process.env.SELLER_API_BASE_URL ?? "https://proyecto-c-seller-lama.vercel.app").replace(
    /\/$/,
    ""
  );
  const paymentsBaseUrl = (process.env.PAYMENTS_API_BASE_URL ?? "https://proyecto-c-payments-lama.vercel.app").replace(
    /\/$/,
    ""
  );
  const shippingBaseUrl = (
    process.env.SHIPPING_API_BASE_URL ?? "https://proyecto-c-shipping-lama.vercel.app"
  ).replace(/\/$/, "");

  if (pendingPayments.length > 0) {
    alerts.push({
      id: "pending-payments",
      title: "Pagos pendientes",
      detail: `${pendingPayments.length} pagos todavia no fueron aprobados.`,
      severity: "warning",
      items: pendingPayments.map((payment) => ({
        id: payment.pago_id,
        label: `${payment.pago_id} · orden ${payment.orden_id}`,
        href: `${paymentsBaseUrl}/api/pagos?orden_id=${encodeURIComponent(payment.orden_id)}`,
        type: "pago"
      }))
    });
  }

  if (rejectedPayments.length > 0) {
    alerts.push({
      id: "rejected-payments",
      title: "Pagos rechazados",
      detail: `${rejectedPayments.length} pagos requieren revision o nueva orden.`,
      severity: "critical",
      items: rejectedPayments.map((payment) => ({
        id: payment.pago_id,
        label: `${payment.pago_id} · orden ${payment.orden_id}`,
        href: `${paymentsBaseUrl}/api/pagos?orden_id=${encodeURIComponent(payment.orden_id)}`,
        type: "pago"
      }))
    });
  }

  if (stalledOrders.length > 0) {
    alerts.push({
      id: "stalled-orders",
      title: "Ordenes pagadas sin envio",
      detail: `${stalledOrders.length} ordenes aprobadas siguen con envio pendiente.`,
      severity: "warning",
      items: stalledOrders.map((order) => ({
        id: order.orden_id,
        label: `${order.orden_id} · ${order.vendedor_id}`,
        href: `${sellerBaseUrl}/api/ordenes-ventas/${encodeURIComponent(order.orden_id)}`,
        type: "orden"
      }))
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "healthy-operation",
      title: "Operacion estable",
      detail: "No hay alertas criticas con los datos disponibles.",
      severity: "info",
      items: []
    });
  }

  return alerts;
}

export async function getAnalyticsSnapshot(timeRangeId: TimeRangeId = DEFAULT_TIME_RANGE_ID): Promise<AnalyticsSnapshot> {
  const [sellerProducts, sellerOrders, buyerCustomers] = await Promise.all([
    fetchSellerProducts(mockProducts),
    fetchSellerOrders(mockOrders),
    fetchBuyerCustomers(mockBuyers, mockBuyerPreferences)
  ]);
  const [shippingShipments, paymentsResult] = await Promise.all([
    fetchShippingShipments(mockShipments),
    fetchPayments(mockPayments)
  ]);
  const products = sellerProducts.products;
  const orders = sellerOrders.orders;
  const buyerPreferences = buyerCustomers.preferences;
  const shipments = shippingShipments.shipments;
  const payments = paymentsResult.payments;
  const timeRange = resolveTimeRange(timeRangeId, [
    ...buyerCustomers.buyers.map((buyer) => buyer.fecha_creacion),
    ...orders.map((order) => order.fecha_creacion),
    ...payments.map((payment) => payment.fecha_creacion),
    ...products.map((product) => product.fecha_creacion),
    ...reviews.map((review) => review.fecha_creacion),
    ...shipments.map((shipment) => shipment.fecha_actualizacion)
  ]);
  const filteredBuyers = filterByRange(buyerCustomers.buyers, (buyer) => buyer.fecha_creacion, timeRange);
  const filteredBuyerIds = new Set(filteredBuyers.map((buyer) => buyer.clerk_user_id_comprador));
  const filteredBuyerPreferences = buyerPreferences.filter((preference) =>
    filteredBuyerIds.has(preference.clerk_user_id_comprador)
  );
  const filteredProducts = filterByRange(products, (product) => product.fecha_creacion, timeRange);
  const filteredOrders = filterByRange(orders, (order) => order.fecha_creacion, timeRange);
  const filteredPayments = filterByRange(payments, (payment) => payment.fecha_creacion, timeRange);
  const filteredShipments = filterByRange(shipments, (shipment) => shipment.fecha_actualizacion, timeRange);
  const filteredReviews = filterByRange(reviews, (review) => review.fecha_creacion, timeRange);
  const approvedPayments = filteredPayments.filter((payment) => payment.estado === "aprobado");
  const pendingPayments = filteredPayments.filter((payment) => payment.estado === "pendiente");
  const completedOrders = filteredOrders.filter(isCompletedOrder);
  const activeUsers = filteredBuyers.length;
  const averageRating =
    filteredReviews.length > 0 ? sum(filteredReviews.map((review) => review.calificacion)) / filteredReviews.length : 0;
  const orderStatusCounts = countBy(filteredOrders.map((order) => order.estado_general));
  const paymentStatusCounts = countBy(filteredPayments.map((payment) => payment.estado));
  const shipmentStatusCounts = countBy(filteredShipments.map((shipment) => shipment.estado));
  const dataSources = [
    sellerProducts.source,
    sellerOrders.source,
    buyerCustomers.source,
    {
      ...shippingShipments.source
    },
    paymentsResult.source
  ];
  const connectedSources = dataSources.filter((source) => source.status === "connected").length;
  const integrationHealth = percent(connectedSources, dataSources.length);
  const trends = buildTrends({
    buyers: buyerCustomers.buyers,
    integrationHealth,
    orders,
    payments,
    products,
    shipments,
    timeRange
  });

  return {
    generatedAt: new Date().toISOString(),
    timeRange,
    kpis: {
      totalTransactions: approvedPayments.length,
      activeUsers,
      completedOrders: completedOrders.length,
      revenue: sum(approvedPayments.map((payment) => payment.monto_total)),
      averageRating,
      activeProducts: filteredProducts.filter((product) => product.estado_publicacion === "activa").length,
      averageOrderValue:
        approvedPayments.length > 0 ? sum(approvedPayments.map((payment) => payment.monto_total)) / approvedPayments.length : 0,
      pendingRevenue: sum(pendingPayments.map((payment) => payment.monto_total)),
      completionRate: percent(completedOrders.length, filteredOrders.length),
      integrationHealth
    },
    trends,
    revenueByMonth: buildRevenueByMonth(filteredPayments),
    ordersByStatus: Object.entries(orderStatusCounts).map(([label, value]) => ({ label, value })),
    paymentsByStatus: Object.entries(paymentStatusCounts).map(([label, value]) => ({ label, value })),
    shipmentsByStatus: Object.entries(shipmentStatusCounts).map(([label, value]) => ({ label, value })),
    buyerPreferencesByCategory: buildPreferenceCounts(
      filteredBuyerPreferences,
      (preference) => preference.categorias_preferidas
    ),
    buyerPreferencesBySize: buildPreferenceCounts(filteredBuyerPreferences, (preference) => preference.talles_preferidos),
    buyerPreferencesBySeller: buildPreferenceCounts(
      filteredBuyerPreferences,
      (preference) => preference.vendedores_preferidos
    ),
    orderFunnel: buildOrderFunnel(filteredOrders),
    operationalAlerts: buildOperationalAlerts(filteredOrders, filteredPayments, filteredShipments),
    topProducts: buildTopProducts(products, filteredOrders),
    recentOrders: [...filteredOrders].sort(sortRecentOrders).slice(0, 6),
    dataSources
  };
}
