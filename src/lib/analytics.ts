import { fetchPayments } from "./api/payments";
import { fetchSellerOrders, fetchSellerProducts } from "./api/seller";
import { fetchShippingShipments } from "./api/shipping";
import {
  orders as mockOrders,
  payments as mockPayments,
  products as mockProducts,
  reviews,
  shipments as mockShipments
} from "./mock-data";
import type { AnalyticsSnapshot, Order, Payment, Shipment } from "./types";

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "short" });

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
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
  const parsedDate = new Date(`${date}T00:00:00`);
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

function sortRecentOrders(first: Order, second: Order) {
  return new Date(second.fecha_creacion).getTime() - new Date(first.fecha_creacion).getTime();
}

function percent(part: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function buildOrderFunnel(orders: Order[]) {
  const paidOrders = orders.filter((order) => order.estado_pago === "aprobado");
  const shippedOrders = orders.filter((order) => order.estado_envio === "despachado" || order.estado_envio === "entregado");
  const completedOrders = orders.filter(
    (order) => order.estado_general === "finalizada" || order.estado_general === "liquidada"
  );

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

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const [sellerProducts, sellerOrders] = await Promise.all([
    fetchSellerProducts(mockProducts),
    fetchSellerOrders(mockOrders)
  ]);
  const [shippingShipments, paymentsResult] = await Promise.all([
    fetchShippingShipments(mockShipments),
    fetchPayments(mockPayments)
  ]);
  const products = sellerProducts.products;
  const orders = sellerOrders.orders;
  const shipments = shippingShipments.shipments;
  const payments = paymentsResult.payments;
  const approvedPayments = payments.filter((payment) => payment.estado === "aprobado");
  const pendingPayments = payments.filter((payment) => payment.estado === "pendiente");
  const completedOrders = orders.filter(
    (order) => order.estado_general === "finalizada" || order.estado_general === "liquidada"
  );
  const activeUsers = new Set(orders.map((order) => order.comprador_id));
  const averageRating = reviews.length > 0 ? sum(reviews.map((review) => review.calificacion)) / reviews.length : 0;
  const orderStatusCounts = countBy(orders.map((order) => order.estado_general));
  const paymentStatusCounts = countBy(payments.map((payment) => payment.estado));
  const shipmentStatusCounts = countBy(shipments.map((shipment) => shipment.estado));
  const dataSources = [
    sellerProducts.source,
    sellerOrders.source,
    {
      name: "Buyer App",
      status: "mock" as const,
      detail: "Mock temporal para ordenes hasta contar con sesion/token de servicio."
    },
    {
      ...shippingShipments.source
    },
    paymentsResult.source
  ];
  const connectedSources = dataSources.filter((source) => source.status === "connected").length;

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      totalTransactions: approvedPayments.length,
      activeUsers: activeUsers.size,
      completedOrders: completedOrders.length,
      revenue: sum(approvedPayments.map((payment) => payment.monto_total)),
      averageRating,
      activeProducts: products.filter((product) => product.estado_publicacion === "activa").length,
      averageOrderValue:
        approvedPayments.length > 0 ? sum(approvedPayments.map((payment) => payment.monto_total)) / approvedPayments.length : 0,
      pendingRevenue: sum(pendingPayments.map((payment) => payment.monto_total)),
      completionRate: percent(completedOrders.length, orders.length),
      integrationHealth: percent(connectedSources, dataSources.length)
    },
    revenueByMonth: buildRevenueByMonth(payments),
    ordersByStatus: Object.entries(orderStatusCounts).map(([label, value]) => ({ label, value })),
    paymentsByStatus: Object.entries(paymentStatusCounts).map(([label, value]) => ({ label, value })),
    shipmentsByStatus: Object.entries(shipmentStatusCounts).map(([label, value]) => ({ label, value })),
    orderFunnel: buildOrderFunnel(orders),
    operationalAlerts: buildOperationalAlerts(orders, payments, shipments),
    topProducts: buildTopProducts(products, orders),
    recentOrders: [...orders].sort(sortRecentOrders).slice(0, 6),
    dataSources
  };
}
