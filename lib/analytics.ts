import { fetchBuyerCustomers } from "./api/buyer";
import { fetchPayments } from "./api/payments";
import { fetchSellerOrders, fetchSellerProducts, fetchSellerVendors } from "./api/seller";
import { fetchShippingShipments } from "./api/shipping";
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
  TrendMetric,
  Vendor
} from "./types";

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "short" });
const dayMonthFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });
const dayInMilliseconds = 24 * 60 * 60 * 1000;
const hourInMilliseconds = 60 * 60 * 1000;
const orderDelayDays = 5;
const shipmentDelayDays = 3;
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", { weekday: "long" });

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

function getWeekdayLabel(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "sin fecha";
  }

  return weekdayFormatter.format(parsedDate);
}

function getHourBucket(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "sin horario";
  }

  const start = Math.floor(parsedDate.getHours() / 3) * 3;
  const end = start + 3;

  return `${String(start).padStart(2, "0")}:00-${String(end).padStart(2, "0")}:00`;
}

function buildSalesPattern(payments: Payment[], getLabel: (date: string) => string) {
  const pattern = payments
    .filter((payment) => payment.estado === "aprobado")
    .reduce<Record<string, { label: string; orders: number; revenue: number }>>((accumulator, payment) => {
      const label = getLabel(payment.fecha_creacion);
      const current = accumulator[label] ?? { label, orders: 0, revenue: 0 };

      return {
        ...accumulator,
        [label]: {
          label,
          orders: current.orders + 1,
          revenue: current.revenue + payment.monto_total
        }
      };
    }, {});

  return Object.values(pattern).sort(
    (first, second) => second.orders - first.orders || second.revenue - first.revenue
  );
}

function buildRevenueByMonth(payments: Payment[]) {
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

function buildTopProducts(products: Product[], orders: Order[]) {
  const productStats = new Map<string, { productId: string; title: string; units: number; revenue: number; price: number }>();

  orders
    .filter((order) => order.estado_pago === "aprobado")
    .forEach((order) => {
      order.producto_ids.forEach((productId) => {
        const product = products.find((item) => item.producto_id === productId);
        const orderItem = order.items?.find((item) => item.producto_id === productId);
        const price = product?.precio ?? orderItem?.precio_unitario ?? 0;
        const current = productStats.get(productId) ?? {
          productId,
          title: product?.titulo ?? orderItem?.titulo ?? `Producto ${productId.slice(0, 8)}`,
          units: 0,
          revenue: 0,
          price
        };

        productStats.set(productId, {
          ...current,
          units: current.units + 1,
          revenue: current.revenue + price,
          price
        });
      });
    });

  return Array.from(productStats.values())
    .sort((first, second) => second.price - first.price)
    .slice(0, 5);
}

function buildTopSellers(orders: Order[]) {
  const sellerStats = new Map<string, { sellerId: string; sales: number; revenue: number }>();

  orders
    .filter((order) => order.estado_pago === "aprobado")
    .forEach((order) => {
      const current = sellerStats.get(order.vendedor_id) ?? {
        sellerId: order.vendedor_id,
        sales: 0,
        revenue: 0
      };

      sellerStats.set(order.vendedor_id, {
        ...current,
        sales: current.sales + 1,
        revenue: current.revenue + order.total
      });
    });

  return Array.from(sellerStats.values())
    .sort((first, second) => second.revenue - first.revenue || second.sales - first.sales)
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

function buildSellerStatusCounts(vendors: Vendor[]) {
  const activeSellers = vendors.filter((vendor) => vendor.activo).length;
  const inactiveSellers = vendors.length - activeSellers;

  return [
    { label: "activo", value: activeSellers },
    { label: "inactivo", value: inactiveSellers }
  ].filter((item) => item.value > 0 || vendors.length === 0);
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

function isCancelledOrder(order: Order) {
  return (
    order.estado_general === "cancelada" ||
    order.estado_pago === "rechazado" ||
    order.estado_envio === "cancelado"
  );
}

function getDaysSince(value: string, now: Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / dayInMilliseconds));
}

function getDuration(startValue: string | undefined, endValue: string | undefined, unitInMilliseconds: number) {
  if (!startValue || !endValue) {
    return null;
  }

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return null;
  }

  return (end.getTime() - start.getTime()) / unitInMilliseconds;
}

function getAverageDeliveryTimeDays(orders: Order[], shipments: Shipment[]) {
  const ordersById = new Map(orders.map((order) => [order.orden_id, order]));
  const durations = shipments
    .filter((shipment) => shipment.estado === "delivered")
    .map((shipment) => {
      const order = ordersById.get(shipment.orden_id);

      return getDuration(order?.fecha_creacion, shipment.fecha_entrega ?? shipment.fecha_actualizacion, dayInMilliseconds);
    })
    .filter((duration): duration is number => duration !== null);

  return average(durations);
}

function getAveragePaymentProcessingHours(orders: Order[], payments: Payment[]) {
  const ordersById = new Map(orders.map((order) => [order.orden_id, order]));
  const durations = payments
    .filter((payment) => payment.estado === "aprobado")
    .map((payment) => {
      const order = ordersById.get(payment.orden_id);

      return getDuration(
        order?.fecha_creacion,
        payment.fecha_aprobacion ?? payment.fecha_actualizacion ?? payment.fecha_creacion,
        hourInMilliseconds
      );
    })
    .filter((duration): duration is number => duration !== null);

  return average(durations);
}

function getTemporalBucket(value: string, timeRange: AnalyticsTimeRange) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (timeRange.id === "all" || timeRange.id === "90d") {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    return {
      key,
      date: `${key}-01`,
      label: monthFormatter.format(date).replace(".", "")
    };
  }

  const key = date.toISOString().slice(0, 10);

  return {
    key,
    date: key,
    label: dayMonthFormatter.format(date).replace(".", "")
  };
}

function buildTemporalSeries({
  buyers,
  orders,
  payments,
  shipments,
  timeRange
}: {
  buyers: Buyer[];
  orders: Order[];
  payments: Payment[];
  shipments: Shipment[];
  timeRange: AnalyticsTimeRange;
}): AnalyticsSnapshot["temporalSeries"] {
  const buckets = new Map<string, AnalyticsSnapshot["temporalSeries"][number]>();
  const ensureBucket = (value: string) => {
    const bucket = getTemporalBucket(value, timeRange);

    if (!bucket) {
      return null;
    }

    const current = buckets.get(bucket.key) ?? {
      label: bucket.label,
      date: bucket.date,
      buyers: 0,
      orders: 0,
      completedOrders: 0,
      payments: 0,
      revenue: 0,
      shipments: 0,
      deliveredShipments: 0
    };

    buckets.set(bucket.key, current);

    return current;
  };

  buyers.forEach((buyer) => {
    const bucket = ensureBucket(buyer.fecha_creacion);

    if (bucket) {
      bucket.buyers += 1;
    }
  });

  orders.forEach((order) => {
    const bucket = ensureBucket(order.fecha_creacion);

    if (bucket) {
      bucket.orders += 1;
      bucket.completedOrders += isCompletedOrder(order) ? 1 : 0;
    }
  });

  payments
    .filter((payment) => payment.estado === "aprobado")
    .forEach((payment) => {
      const bucket = ensureBucket(payment.fecha_creacion);

      if (bucket) {
        bucket.payments += 1;
        bucket.revenue += payment.monto_total;
      }
    });

  shipments.forEach((shipment) => {
    const bucket = ensureBucket(shipment.fecha_actualizacion);

    if (bucket) {
      bucket.shipments += 1;
      bucket.deliveredShipments += shipment.estado === "delivered" ? 1 : 0;
    }
  });

  return Array.from(buckets.values()).sort((first, second) => first.date.localeCompare(second.date));
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
  timeRange,
  vendors
}: {
  buyers: Buyer[];
  integrationHealth: number;
  orders: Order[];
  payments: Payment[];
  products: Product[];
  shipments: Shipment[];
  timeRange: AnalyticsTimeRange;
  vendors: Vendor[];
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
  const currentShipments = filterByRange(shipments, (shipment) => shipment.fecha_actualizacion, timeRange);
  const previousShipments = filterByPreviousRange(shipments, (shipment) => shipment.fecha_actualizacion, timeRange);
  const currentProducts = filterByRange(products, (product) => product.fecha_creacion, timeRange);
  const previousProducts = filterByPreviousRange(products, (product) => product.fecha_creacion, timeRange);
  const currentActiveProducts = currentProducts.filter((product) => product.estado_publicacion === "activa");
  const previousActiveProducts = previousProducts.filter((product) => product.estado_publicacion === "activa");
  const activeSellers = vendors.filter((vendor) => vendor.activo).length;
  const inactiveSellers = vendors.length - activeSellers;
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
      activeSellers: buildTrend(activeSellers, 0),
      activeProducts: buildTrend(currentActiveProducts.length, previousActiveProducts.length),
      activeUsers: buildTrend(currentBuyers.length, previousBuyers.length),
      averageDeliveryTimeDays: buildTrend(
        getAverageDeliveryTimeDays(currentOrders, currentShipments),
        getAverageDeliveryTimeDays(previousOrders, previousShipments),
        "lower"
      ),
      averageOrderValue: buildTrend(
        average(currentApprovedPayments.map((payment) => payment.monto_total)),
        average(previousApprovedPayments.map((payment) => payment.monto_total))
      ),
      averagePaymentProcessingHours: buildTrend(
        getAveragePaymentProcessingHours(currentOrders, currentPayments),
        getAveragePaymentProcessingHours(previousOrders, previousPayments),
        "lower"
      ),
      averageRating: buildTrend(0, 0),
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
      inactiveSellers: buildTrend(inactiveSellers, 0, "lower"),
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
  const dispatchedOrders = paidOrders.filter(
    (order) => order.estado_envio === "despachado" || order.estado_envio === "entregado"
  );
  const deliveredOrders = dispatchedOrders.filter((order) => order.estado_envio === "entregado");
  const completedOrders = deliveredOrders.filter(isCompletedOrder);
  const stages = [
    { label: "Creadas", value: orders.length },
    { label: "Pagadas", value: paidOrders.length },
    { label: "Despachadas", value: dispatchedOrders.length },
    { label: "Entregadas", value: deliveredOrders.length },
    { label: "Completadas", value: completedOrders.length }
  ];

  return stages.map((stage, index) => {
    const previousStage = stages[index - 1];
    const conversionFromPrevious = previousStage ? percent(stage.value, previousStage.value) : null;

    return {
      ...stage,
      detail: previousStage
        ? `${conversionFromPrevious}% desde ${previousStage.label}`
        : "Base del periodo seleccionado",
      conversionFromPrevious,
      conversionLabel: previousStage ? `vs ${previousStage.label}` : "Base"
    };
  });
}

function buildSystemFlow({
  buyers,
  orders,
  payments,
  products,
  shipments,
  vendors
}: {
  buyers: Buyer[];
  orders: Order[];
  payments: Payment[];
  products: Product[];
  shipments: Shipment[];
  vendors: Vendor[];
}): AnalyticsSnapshot["systemFlow"] {
  const buyerIds = new Set(buyers.map((buyer) => buyer.clerk_user_id_comprador));
  const orderIds = new Set(orders.map((order) => order.orden_id));
  const buyerIdsWithOrders = new Set(orders.map((order) => order.comprador_id).filter((buyerId) => buyerIds.has(buyerId)));
  const sellerIdsWithOrders = new Set(orders.map((order) => order.vendedor_id));
  const activeProducts = products.filter((product) => product.estado_publicacion === "activa");
  const activeVendors = vendors.filter((vendor) => vendor.activo);
  const approvedPayments = payments.filter((payment) => payment.estado === "aprobado");
  const rejectedPayments = payments.filter((payment) => payment.estado === "rechazado");
  const paymentOrderIds = new Set(payments.map((payment) => payment.orden_id).filter((orderId) => orderIds.has(orderId)));
  const approvedPaymentOrderIds = new Set(
    approvedPayments.map((payment) => payment.orden_id).filter((orderId) => orderIds.has(orderId))
  );
  const shipmentOrderIds = new Set(shipments.map((shipment) => shipment.orden_id).filter((orderId) => orderIds.has(orderId)));
  const shippedPaidOrderIds = new Set(
    shipments.map((shipment) => shipment.orden_id).filter((orderId) => approvedPaymentOrderIds.has(orderId))
  );
  const deliveredShipments = shipments.filter((shipment) => shipment.estado === "delivered");
  const inTransitShipments = shipments.filter((shipment) => shipment.estado === "in_transit");

  return [
    {
      id: "buyer",
      label: "Buyer",
      value: buyers.length,
      valueLabel: "compradores",
      detail: "Demanda activa del periodo",
      conversionToNext: percent(buyerIdsWithOrders.size, buyers.length),
      conversionLabel: "compradores con orden",
      metrics: [
        { label: "Ordenes creadas", value: orders.length, format: "number" },
        { label: "Compradores con orden", value: buyerIdsWithOrders.size, format: "number" }
      ]
    },
    {
      id: "seller",
      label: "Seller",
      value: sellerIdsWithOrders.size,
      valueLabel: "vendedores",
      detail: "Oferta conectada a ventas",
      conversionToNext: percent(paymentOrderIds.size, orders.length),
      conversionLabel: "ordenes con pago",
      metrics: [
        { label: "Vendedores activos", value: activeVendors.length, format: "number" },
        { label: "Productos activos", value: activeProducts.length, format: "number" },
        { label: "Ordenes recibidas", value: orders.length, format: "number" }
      ]
    },
    {
      id: "payments",
      label: "Payments",
      value: approvedPaymentOrderIds.size,
      valueLabel: "ordenes pagadas",
      detail: "Cobros vinculados a ordenes",
      conversionToNext: percent(shippedPaidOrderIds.size, approvedPaymentOrderIds.size),
      conversionLabel: "pagadas con envio",
      metrics: [
        { label: "Ingresos", value: sum(approvedPayments.map((payment) => payment.monto_total)), format: "currency" },
        { label: "Pagos aprobados", value: approvedPayments.length, format: "number" },
        { label: "Rechazados", value: rejectedPayments.length, format: "number" }
      ]
    },
    {
      id: "shipping",
      label: "Shipping",
      value: shipmentOrderIds.size,
      valueLabel: "ordenes con envio",
      detail: "Entrega y seguimiento",
      conversionToNext: null,
      conversionLabel: null,
      metrics: [
        { label: "Envios registrados", value: shipments.length, format: "number" },
        { label: "Entregados", value: deliveredShipments.length, format: "number" },
        { label: "En transito", value: inTransitShipments.length, format: "number" }
      ]
    }
  ];
}

function buildOperationalAlerts(orders: Order[], payments: Payment[], shipments: Shipment[], products: Product[]) {
  const now = new Date();
  const ordersById = new Map(orders.map((order) => [order.orden_id, order]));
  const delayedOrders = orders.filter(
    (order) =>
      !isCompletedOrder(order) &&
      !isCancelledOrder(order) &&
      getDaysSince(order.fecha_creacion, now) >= orderDelayDays
  );
  const rejectedPayments = payments.filter((payment) => payment.estado === "rechazado");
  const delayedShipments = shipments.filter((shipment) => {
    const order = ordersById.get(shipment.orden_id);

    return (
      shipment.estado !== "delivered" &&
      (!order || !isCancelledOrder(order)) &&
      getDaysSince(shipment.fecha_actualizacion, now) >= shipmentDelayDays
    );
  });
  const outOfStockProducts = products.filter(
    (product) => product.estado_publicacion === "activa" && typeof product.stock === "number" && product.stock <= 0
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

  if (delayedOrders.length > 0) {
    alerts.push({
      id: "delayed-orders",
      title: "Ordenes demoradas",
      detail: `${delayedOrders.length} ordenes superan ${orderDelayDays} dias sin completarse.`,
      severity: "warning",
      items: delayedOrders.map((order) => ({
        id: order.orden_id,
        label: `${order.orden_id} - ${order.estado_general}`,
        href: `${sellerBaseUrl}/api/ordenes-ventas/${encodeURIComponent(order.orden_id)}`,
        type: "orden"
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
        label: `${payment.pago_id} - orden ${payment.orden_id}`,
        href: `${paymentsBaseUrl}/api/pagos?orden_id=${encodeURIComponent(payment.orden_id)}`,
        type: "pago"
      }))
    });
  }

  if (delayedShipments.length > 0) {
    alerts.push({
      id: "delayed-shipments",
      title: "Envios demorados",
      detail: `${delayedShipments.length} envios llevan mas de ${shipmentDelayDays} dias sin entrega.`,
      severity: "warning",
      items: delayedShipments.map((shipment) => ({
        id: shipment.envio_id,
        label: `${shipment.envio_id} - orden ${shipment.orden_id}`,
        href: `${shippingBaseUrl}/api/envios?orden_id=${encodeURIComponent(shipment.orden_id)}`,
        type: "envio"
      }))
    });
  }

  if (outOfStockProducts.length > 0) {
    alerts.push({
      id: "out-of-stock-products",
      title: "Productos sin stock",
      detail: `${outOfStockProducts.length} productos activos figuran sin stock disponible.`,
      severity: "warning",
      items: outOfStockProducts.map((product) => ({
        id: product.producto_id,
        label: product.titulo,
        href: `${sellerBaseUrl}/api/productos?producto_id=${encodeURIComponent(product.producto_id)}`,
        type: "producto"
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
  const [sellerProducts, sellerOrders, sellerVendors, buyerCustomers] = await Promise.all([
    fetchSellerProducts(),
    fetchSellerOrders(),
    fetchSellerVendors(),
    fetchBuyerCustomers()
  ]);
  const [shippingShipments, paymentsResult] = await Promise.all([
    fetchShippingShipments(),
    fetchPayments()
  ]);
  const products = sellerProducts.products;
  const orders = sellerOrders.orders;
  const vendors = sellerVendors.vendors;
  const buyerPreferences = buyerCustomers.preferences;
  const shipments = shippingShipments.shipments;
  const payments = paymentsResult.payments;
  const timeRange = resolveTimeRange(timeRangeId, [
    ...buyerCustomers.buyers.map((buyer) => buyer.fecha_creacion),
    ...orders.map((order) => order.fecha_creacion),
    ...payments.map((payment) => payment.fecha_creacion),
    ...products.map((product) => product.fecha_creacion),
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
  const approvedPayments = filteredPayments.filter((payment) => payment.estado === "aprobado");
  const pendingPayments = filteredPayments.filter((payment) => payment.estado === "pendiente");
  const completedOrders = filteredOrders.filter(isCompletedOrder);
  const activeUsers = filteredBuyers.length;
  const activeSellers = vendors.filter((vendor) => vendor.activo).length;
  const inactiveSellers = vendors.length - activeSellers;
  const averageRating = 0;
  const orderStatusCounts = countBy(filteredOrders.map((order) => order.estado_general));
  const paymentStatusCounts = countBy(filteredPayments.map((payment) => payment.estado));
  const shipmentStatusCounts = countBy(filteredShipments.map((shipment) => shipment.estado));
  const dataSources = [
    sellerProducts.source,
    sellerOrders.source,
    sellerVendors.source,
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
    timeRange,
    vendors
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
      averageDeliveryTimeDays: getAverageDeliveryTimeDays(filteredOrders, filteredShipments),
      averagePaymentProcessingHours: getAveragePaymentProcessingHours(filteredOrders, filteredPayments),
      pendingRevenue: sum(pendingPayments.map((payment) => payment.monto_total)),
      completionRate: percent(completedOrders.length, filteredOrders.length),
      integrationHealth,
      activeSellers,
      inactiveSellers,
      totalSellers: vendors.length
    },
    trends,
    revenueByMonth: buildRevenueByMonth(filteredPayments),
    temporalSeries: buildTemporalSeries({
      buyers: filteredBuyers,
      orders: filteredOrders,
      payments: filteredPayments,
      shipments: filteredShipments,
      timeRange
    }),
    ordersByStatus: Object.entries(orderStatusCounts).map(([label, value]) => ({ label, value })),
    paymentsByStatus: Object.entries(paymentStatusCounts).map(([label, value]) => ({ label, value })),
    shipmentsByStatus: Object.entries(shipmentStatusCounts).map(([label, value]) => ({ label, value })),
    sellersByStatus: buildSellerStatusCounts(vendors),
    buyerPreferencesByCategory: buildPreferenceCounts(
      filteredBuyerPreferences,
      (preference) => preference.categorias_preferidas
    ),
    buyerPreferencesBySize: buildPreferenceCounts(filteredBuyerPreferences, (preference) => preference.talles_preferidos),
    buyerPreferencesBySeller: buildPreferenceCounts(
      filteredBuyerPreferences,
      (preference) => preference.vendedores_preferidos
    ),
    salesByDay: buildSalesPattern(filteredPayments, getWeekdayLabel),
    salesByHour: buildSalesPattern(filteredPayments, getHourBucket),
    systemFlow: buildSystemFlow({
      buyers: filteredBuyers,
      orders: filteredOrders,
      payments: filteredPayments,
      products: filteredProducts,
      shipments: filteredShipments,
      vendors
    }),
    orderFunnel: buildOrderFunnel(filteredOrders),
    operationalAlerts: buildOperationalAlerts(filteredOrders, filteredPayments, filteredShipments, filteredProducts),
    topProducts: buildTopProducts(products, filteredOrders),
    topSellers: buildTopSellers(filteredOrders),
    recentOrders: [...filteredOrders].sort(sortRecentOrders).slice(0, 6),
    dataSources
  };
}
