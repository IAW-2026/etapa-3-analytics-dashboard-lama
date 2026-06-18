import type { Buyer, BuyerPreference, Order, Payment, Product, Review, Shipment } from "./types";

export const buyers: Buyer[] = [
  {
    clerk_user_id_comprador: "buyer_01",
    email: "buyer01@lama.test",
    nombre_comprador: "Comprador Uno",
    DNI: "30111222",
    telefono: "1123456789",
    direccion_envio: "Av. Siempre Viva 742",
    fecha_creacion: "2026-01-10",
    fecha_actualizacion: "2026-05-25"
  },
  {
    clerk_user_id_comprador: "buyer_02",
    email: "buyer02@lama.test",
    nombre_comprador: "Comprador Dos",
    DNI: "30222333",
    telefono: "1134567890",
    direccion_envio: "Calle Lima 120",
    fecha_creacion: "2026-02-02",
    fecha_actualizacion: "2026-02-07"
  },
  {
    clerk_user_id_comprador: "buyer_03",
    email: "buyer03@lama.test",
    nombre_comprador: "Comprador Tres",
    DNI: "30333444",
    telefono: "1145678901",
    direccion_envio: "Pasaje Norte 55",
    fecha_creacion: "2026-03-01",
    fecha_actualizacion: "2026-03-18"
  },
  {
    clerk_user_id_comprador: "buyer_04",
    email: "buyer04@lama.test",
    nombre_comprador: "Comprador Cuatro",
    DNI: "30444555",
    telefono: "1156789012",
    direccion_envio: "San Martin 980",
    fecha_creacion: "2026-04-28",
    fecha_actualizacion: "2026-05-27"
  },
  {
    clerk_user_id_comprador: "buyer_05",
    email: "buyer05@lama.test",
    nombre_comprador: "Comprador Cinco",
    DNI: "30555666",
    telefono: "1167890123",
    direccion_envio: "Rivadavia 1500",
    fecha_creacion: "2026-05-12",
    fecha_actualizacion: "2026-06-02"
  },
  {
    clerk_user_id_comprador: "buyer_06",
    email: "buyer06@lama.test",
    nombre_comprador: "Comprador Seis",
    DNI: "30666777",
    telefono: "1178901234",
    direccion_envio: "Belgrano 350",
    fecha_creacion: "2026-06-04",
    fecha_actualizacion: "2026-06-09"
  }
];

export const buyerPreferences: BuyerPreference[] = [
  {
    preferencia_id: "pref_001",
    clerk_user_id_comprador: "buyer_01",
    talles_preferidos: ["M", "U"],
    categorias_preferidas: ["cat_abrigos", "cat_bolsos"],
    vendedores_preferidos: ["seller_01", "seller_04"]
  },
  {
    preferencia_id: "pref_002",
    clerk_user_id_comprador: "buyer_02",
    talles_preferidos: ["40"],
    categorias_preferidas: ["cat_calzado"],
    vendedores_preferidos: ["seller_02"]
  },
  {
    preferencia_id: "pref_003",
    clerk_user_id_comprador: "buyer_03",
    talles_preferidos: ["S", "42"],
    categorias_preferidas: ["cat_camisas", "cat_pantalones"],
    vendedores_preferidos: ["seller_03"]
  }
];

export const products: Product[] = [
  {
    producto_id: "prod_001",
    vendedor_id: "seller_01",
    categoria_id: "cat_abrigos",
    titulo: "Campera vintage denim",
    precio: 46500,
    stock: 2,
    estado_prenda: "vintage",
    talle: "M",
    marca: "Levi's",
    genero: "mujer",
    estado_publicacion: "activa",
    fecha_creacion: "2026-02-12"
  },
  {
    producto_id: "prod_002",
    vendedor_id: "seller_02",
    categoria_id: "cat_calzado",
    titulo: "Zapatillas urbanas blancas",
    precio: 72000,
    stock: 0,
    estado_prenda: "usado",
    talle: "40",
    marca: "Adidas",
    genero: "hombre",
    estado_publicacion: "activa",
    fecha_creacion: "2026-03-04"
  },
  {
    producto_id: "prod_003",
    vendedor_id: "seller_03",
    categoria_id: "cat_camisas",
    titulo: "Camisa lino natural",
    precio: 31800,
    stock: 4,
    estado_prenda: "nuevo",
    talle: "S",
    marca: "LAMA",
    genero: "mujer",
    estado_publicacion: "activa",
    fecha_creacion: "2026-03-17"
  },
  {
    producto_id: "prod_004",
    vendedor_id: "seller_01",
    categoria_id: "cat_bolsos",
    titulo: "Bolso cuero recuperado",
    precio: 58900,
    stock: 1,
    estado_prenda: "usado",
    talle: "U",
    marca: "Prune",
    genero: "mujer",
    estado_publicacion: "activa",
    fecha_creacion: "2026-04-02"
  },
  {
    producto_id: "prod_005",
    vendedor_id: "seller_04",
    categoria_id: "cat_pantalones",
    titulo: "Jean recto azul",
    precio: 39400,
    stock: 0,
    estado_prenda: "usado",
    talle: "42",
    marca: "Wrangler",
    genero: "hombre",
    estado_publicacion: "activa",
    fecha_creacion: "2026-04-20"
  }
];

export const orders: Order[] = [
  {
    orden_id: "ord_1001",
    comprador_id: "buyer_01",
    vendedor_id: "seller_01",
    producto_ids: ["prod_001"],
    total: 50500,
    estado_general: "finalizada",
    estado_pago: "aprobado",
    estado_envio: "entregado",
    fecha_creacion: "2026-01-18"
  },
  {
    orden_id: "ord_1002",
    comprador_id: "buyer_02",
    vendedor_id: "seller_02",
    producto_ids: ["prod_002"],
    total: 77200,
    estado_general: "despachada",
    estado_pago: "aprobado",
    estado_envio: "despachado",
    fecha_creacion: "2026-02-07"
  },
  {
    orden_id: "ord_1003",
    comprador_id: "buyer_03",
    vendedor_id: "seller_03",
    producto_ids: ["prod_003", "prod_005"],
    total: 76200,
    estado_general: "finalizada",
    estado_pago: "aprobado",
    estado_envio: "entregado",
    fecha_creacion: "2026-03-12"
  },
  {
    orden_id: "ord_1004",
    comprador_id: "buyer_01",
    vendedor_id: "seller_04",
    producto_ids: ["prod_004"],
    total: 63100,
    estado_general: "pagada",
    estado_pago: "aprobado",
    estado_envio: "en_preparacion",
    fecha_creacion: "2026-04-11"
  },
  {
    orden_id: "ord_1005",
    comprador_id: "buyer_04",
    vendedor_id: "seller_01",
    producto_ids: ["prod_001", "prod_004"],
    total: 109600,
    estado_general: "finalizada",
    estado_pago: "aprobado",
    estado_envio: "entregado",
    fecha_creacion: "2026-05-22"
  },
  {
    orden_id: "ord_1006",
    comprador_id: "buyer_05",
    vendedor_id: "seller_02",
    producto_ids: ["prod_002"],
    total: 77200,
    estado_general: "cancelada",
    estado_pago: "rechazado",
    estado_envio: "cancelado",
    fecha_creacion: "2026-06-02"
  },
  {
    orden_id: "ord_1007",
    comprador_id: "buyer_06",
    vendedor_id: "seller_03",
    producto_ids: ["prod_003"],
    total: 35800,
    estado_general: "pendiente_pago",
    estado_pago: "pendiente",
    estado_envio: "pendiente",
    fecha_creacion: "2026-06-09"
  }
];

export const payments: Payment[] = orders.map((order, index) => ({
  pago_id: `pay_${String(index + 1).padStart(3, "0")}`,
  orden_id: order.orden_id,
  comprador_id: order.comprador_id,
  vendedor_id: order.vendedor_id,
  monto_producto: Math.round(order.total * 0.92),
  monto_envio: Math.round(order.total * 0.08),
  monto_total: order.total,
  estado: order.estado_pago,
  fecha_creacion: order.fecha_creacion
}));

export const shipments: Shipment[] = [
  {
    envio_id: "ship_001",
    orden_id: "ord_1001",
    empresa_logistica: "Correo Sur",
    estado: "delivered",
    fecha_actualizacion: "2026-01-23"
  },
  {
    envio_id: "ship_002",
    orden_id: "ord_1002",
    empresa_logistica: "LAMA Express",
    estado: "in_transit",
    fecha_actualizacion: "2026-02-09"
  },
  {
    envio_id: "ship_003",
    orden_id: "ord_1003",
    empresa_logistica: "Correo Sur",
    estado: "delivered",
    fecha_actualizacion: "2026-03-16"
  },
  {
    envio_id: "ship_004",
    orden_id: "ord_1004",
    empresa_logistica: "LAMA Express",
    estado: "pending",
    fecha_actualizacion: "2026-04-12"
  },
  {
    envio_id: "ship_005",
    orden_id: "ord_1005",
    empresa_logistica: "Urbano",
    estado: "delivered",
    fecha_actualizacion: "2026-05-26"
  },
  {
    envio_id: "ship_006",
    orden_id: "ord_1006",
    empresa_logistica: "Urbano",
    estado: "pending",
    fecha_actualizacion: "2026-06-04"
  }
];

export const reviews: Review[] = [
  {
    review_id: "rev_001",
    orden_id: "ord_1001",
    comprador_id: "buyer_01",
    vendedor_id: "seller_01",
    calificacion: 5,
    fecha_creacion: "2026-01-24"
  },
  {
    review_id: "rev_002",
    orden_id: "ord_1003",
    comprador_id: "buyer_03",
    vendedor_id: "seller_03",
    calificacion: 4,
    fecha_creacion: "2026-03-18"
  },
  {
    review_id: "rev_003",
    orden_id: "ord_1005",
    comprador_id: "buyer_04",
    vendedor_id: "seller_01",
    calificacion: 5,
    fecha_creacion: "2026-05-27"
  }
];
