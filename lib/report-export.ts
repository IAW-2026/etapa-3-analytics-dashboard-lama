import type { AnalyticsSnapshot } from "./types";

type ReportRow = {
  section: string;
  label: string;
  value: string;
  secondary?: string;
  detail?: string;
};

const reportNumberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1
});

const reportCurrencyFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0
});

function formatCurrency(value: number) {
  return `$${reportCurrencyFormatter.format(value)}`;
}

function formatNumber(value: number) {
  return reportNumberFormatter.format(value);
}

function formatDurationDays(value: number) {
  if (value === 0) {
    return "0 dias";
  }

  if (value > 0 && value < 1) {
    return "<1 dia";
  }

  return `${formatNumber(value)} dias`;
}

function formatDurationHours(value: number) {
  if (value === 0) {
    return "0 h";
  }

  if (value > 0 && value < 1) {
    return "<1 h";
  }

  return `${formatNumber(value)} h`;
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");

  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function toPdfText(value: string | number | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfLine(value: string, maxLength = 92) {
  const words = value.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function pdfColor(hex: string) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;

  return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)}`;
}

function pdfRect(x: number, y: number, width: number, height: number, fill: string, stroke?: string) {
  if (!stroke) {
    return `q ${pdfColor(fill)} rg ${x} ${y} ${width} ${height} re f Q`;
  }

  return `q ${pdfColor(fill)} rg ${pdfColor(stroke)} RG ${x} ${y} ${width} ${height} re B Q`;
}

function pdfLine(x1: number, y1: number, x2: number, y2: number, color = "#d5cfbf", width = 0.8) {
  return `q ${pdfColor(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
}

function pdfText({
  color = "#37413d",
  font = "F1",
  size = 9,
  text,
  x,
  y
}: {
  color?: string;
  font?: "F1" | "F2";
  size?: number;
  text: string;
  x: number;
  y: number;
}) {
  return `BT /${font} ${size} Tf ${pdfColor(color)} rg ${x} ${y} Td (${toPdfText(text)}) Tj ET`;
}

function pdfTextRight({
  color = "#37413d",
  font = "F1",
  size = 9,
  text,
  x,
  y
}: {
  color?: string;
  font?: "F1" | "F2";
  size?: number;
  text: string;
  x: number;
  y: number;
}) {
  const approximateWidth = toPdfText(text).length * size * 0.48;

  return pdfText({ color, font, size, text, x: x - approximateWidth, y });
}

export function buildReportRows(snapshot: AnalyticsSnapshot): ReportRow[] {
  return [
    {
      section: "Periodo",
      label: "Rango",
      value: snapshot.timeRange.label,
      detail:
        snapshot.timeRange.startDate && snapshot.timeRange.endDate
          ? `${snapshot.timeRange.startDate} a ${snapshot.timeRange.endDate}`
          : "Todo el historico"
    },
    { section: "KPI", label: "Ingresos aprobados", value: formatCurrency(snapshot.kpis.revenue) },
    { section: "KPI", label: "Transacciones aprobadas", value: formatNumber(snapshot.kpis.totalTransactions) },
    { section: "KPI", label: "Compradores", value: formatNumber(snapshot.kpis.activeUsers) },
    { section: "KPI", label: "Vendedores activos", value: formatNumber(snapshot.kpis.activeSellers) },
    { section: "KPI", label: "Vendedores inactivos", value: formatNumber(snapshot.kpis.inactiveSellers) },
    { section: "KPI", label: "Pedidos completados", value: formatNumber(snapshot.kpis.completedOrders) },
    { section: "KPI", label: "Ticket promedio", value: formatCurrency(snapshot.kpis.averageOrderValue) },
    { section: "KPI", label: "Tasa de conversion", value: `${formatNumber(snapshot.kpis.completionRate)}%` },
    {
      section: "KPI",
      label: "Tiempo promedio de entrega",
      value: formatDurationDays(snapshot.kpis.averageDeliveryTimeDays)
    },
    {
      section: "KPI",
      label: "Tiempo procesamiento pago",
      value: formatDurationHours(snapshot.kpis.averagePaymentProcessingHours)
    },
    ...snapshot.temporalSeries.flatMap((item) => [
      {
        section: "Evolucion",
        label: item.label,
        value: formatCurrency(item.revenue),
        secondary: `${formatNumber(item.orders)} ordenes`,
        detail: item.date
      },
      {
        section: "Evolucion",
        label: item.label,
        value: `${formatNumber(item.shipments)} envios`,
        secondary: `${formatNumber(item.deliveredShipments)} entregados`,
        detail: item.date
      }
    ]),
    ...snapshot.orderFunnel.map((item) => ({
      section: "Embudo",
      label: item.label,
      value: `${formatNumber(item.value)} ordenes`,
      secondary: item.conversionFromPrevious === null ? "Base" : `${item.conversionFromPrevious}%`,
      detail: item.conversionLabel
    })),
    ...snapshot.topProducts.map((product, index) => ({
      section: "Top productos",
      label: `${index + 1}. ${product.title}`,
      value: `${formatNumber(product.units)} unidades`,
      secondary: formatCurrency(product.revenue),
      detail: product.productId
    })),
    ...snapshot.topSellers.map((seller, index) => ({
      section: "Top vendedores",
      label: `${index + 1}. ${seller.sellerId}`,
      value: `${formatNumber(seller.sales)} ventas`,
      secondary: formatCurrency(seller.revenue)
    })),
    ...snapshot.operationalAlerts.map((alert) => ({
      section: "Alertas",
      label: alert.title,
      value: alert.severity,
      secondary: `${formatNumber(alert.items.length)} eventos`,
      detail: alert.detail
    })),
    ...snapshot.dataSources.map((source) => ({
      section: "Fuentes",
      label: source.name,
      value: source.status,
      detail: source.detail
    }))
  ];
}

export function buildCsvReport(snapshot: AnalyticsSnapshot) {
  const header = ["seccion", "indicador", "valor", "secundario", "detalle"];
  const rows = buildReportRows(snapshot).map((row) => [
    row.section,
    row.label,
    row.value,
    row.secondary ?? "",
    row.detail ?? ""
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function buildPdfReport(snapshot: AnalyticsSnapshot) {
  const width = 612;
  const height = 792;
  const margin = 42;
  const contentWidth = width - margin * 2;
  const colors = {
    accent: "#6f7f6d",
    bg: "#f6f1e7",
    card: "#ede6d8",
    header: "#8fa18d",
    ink: "#37413d",
    line: "#d5cfbf",
    muted: "#6f776f",
    warning: "#9a5a50"
  };
  const pages: string[][] = [];
  let commands: string[] = [];
  let cursorY = 0;

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
      .format(date)
      .replace(",", "");
  };
  const truncate = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, Math.max(maxLength - 3, 1))}...` : value;
  const rangeDetail =
    snapshot.timeRange.startDate && snapshot.timeRange.endDate
      ? `${snapshot.timeRange.startDate} a ${snapshot.timeRange.endDate}`
      : "Historico completo";

  function startPage() {
    commands = [];
    pages.push(commands);
    commands.push(pdfRect(0, 0, width, height, colors.bg));
    commands.push(pdfRect(0, height - 82, width, 82, colors.header));
    commands.push(pdfText({ color: colors.bg, font: "F2", size: 23, text: "LAMA", x: margin, y: 750 }));
    commands.push(pdfText({ color: colors.bg, font: "F1", size: 10, text: "Analytics Reporte Ejecutivo", x: margin, y: 730 }));
    commands.push(
      pdfTextRight({ color: colors.bg, font: "F2", size: 10, text: snapshot.timeRange.label, x: width - margin, y: 750 })
    );
    commands.push(
      pdfTextRight({ color: colors.bg, size: 8, text: `Generado ${formatDate(snapshot.generatedAt)}`, x: width - margin, y: 730 })
    );
    cursorY = 682;
  }

  function ensureSpace(requiredHeight: number) {
    if (cursorY - requiredHeight < 52) {
      startPage();
    }
  }

  function sectionTitle(title: string, detail?: string) {
    ensureSpace(detail ? 54 : 42);
    commands.push(pdfText({ color: colors.header, font: "F2", size: 8, text: title.toUpperCase(), x: margin, y: cursorY }));
    commands.push(pdfLine(margin, cursorY - 7, margin + 42, cursorY - 7, colors.header, 1.2));
    if (detail) {
      commands.push(pdfText({ color: colors.muted, size: 8, text: detail, x: margin, y: cursorY - 20 }));
      cursorY -= 42;
      return;
    }
    cursorY -= 28;
  }

  function paragraph(lines: string[]) {
    lines.forEach((line) => {
      wrapPdfLine(line, 98).forEach((wrappedLine) => {
        ensureSpace(16);
        commands.push(pdfText({ color: colors.ink, size: 9, text: wrappedLine, x: margin, y: cursorY }));
        cursorY -= 14;
      });
    });
    cursorY -= 8;
  }

  function cardGrid(cards: Array<{ label: string; value: string; detail: string }>) {
    const gap = 12;
    const cardWidth = (contentWidth - gap * 3) / 4;
    const cardHeight = 76;
    const rows = Math.ceil(cards.length / 4);
    const startY = cursorY;

    ensureSpace(rows * cardHeight + Math.max(rows - 1, 0) * gap + 14);
    cards.forEach((card, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = margin + column * (cardWidth + gap);
      const y = startY - row * (cardHeight + gap) - cardHeight;

      commands.push(pdfRect(x, y, cardWidth, cardHeight, colors.card, colors.line));
      commands.push(pdfText({ color: colors.muted, font: "F2", size: 6.8, text: card.label.toUpperCase(), x: x + 12, y: y + 54 }));
      commands.push(pdfText({ color: colors.ink, font: "F2", size: 16, text: card.value, x: x + 12, y: y + 31 }));
      commands.push(pdfText({ color: colors.muted, size: 7.2, text: truncate(card.detail, 28), x: x + 12, y: y + 13 }));
    });
    cursorY = startY - rows * cardHeight - Math.max(rows - 1, 0) * gap - 18;
  }

  function table({
    headers,
    rows,
    title,
    widths: columnWidths
  }: {
    headers: string[];
    rows: string[][];
    title: string;
    widths: number[];
  }) {
    sectionTitle(title);
    ensureSpace(28);
    commands.push(pdfRect(margin, cursorY - 18, contentWidth, 22, colors.accent));
    headers.forEach((header, index) => {
      const x = margin + columnWidths.slice(0, index).reduce((total, value) => total + value, 0) + 8;
      commands.push(pdfText({ color: colors.bg, font: "F2", size: 7.2, text: header.toUpperCase(), x, y: cursorY - 9 }));
    });
    cursorY -= 28;

    rows.forEach((row, rowIndex) => {
      ensureSpace(24);
      if (rowIndex % 2 === 0) {
        commands.push(pdfRect(margin, cursorY - 13, contentWidth, 22, "#f1ebdf"));
      }
      row.forEach((cell, index) => {
        const x = margin + columnWidths.slice(0, index).reduce((total, value) => total + value, 0) + 8;
        commands.push(pdfText({ color: colors.ink, size: 7.5, text: truncate(cell, Math.floor(columnWidths[index] / 4.6)), x, y: cursorY - 4 }));
      });
      commands.push(pdfLine(margin, cursorY - 17, margin + contentWidth, cursorY - 17, colors.line, 0.45));
      cursorY -= 22;
    });
    cursorY -= 10;
  }

  function funnel() {
    sectionTitle("Embudo operativo", "Conversion entre etapas");
    const maxValue = Math.max(...snapshot.orderFunnel.map((item) => item.value), 1);

    snapshot.orderFunnel.forEach((item) => {
      ensureSpace(30);
      const conversion = item.conversionFromPrevious === null ? "Base" : `${item.conversionFromPrevious}%`;
      const barWidth = Math.max((item.value / maxValue) * 220, 18);

      commands.push(pdfText({ color: colors.ink, font: "F2", size: 9, text: item.label, x: margin, y: cursorY }));
      commands.push(pdfText({ color: colors.muted, size: 8, text: `${formatNumber(item.value)} ordenes`, x: margin + 118, y: cursorY }));
      commands.push(pdfRect(margin + 230, cursorY - 5, 220, 8, "#ddd7c9"));
      commands.push(pdfRect(margin + 230, cursorY - 5, barWidth, 8, colors.accent));
      commands.push(pdfTextRight({ color: colors.accent, font: "F2", size: 8, text: conversion, x: margin + contentWidth, y: cursorY }));
      cursorY -= 24;
    });
    cursorY -= 6;
  }

  function footer() {
    pages.forEach((page, index) => {
      page.push(pdfLine(margin, 34, width - margin, 34, colors.line, 0.6));
      page.push(pdfText({ color: colors.muted, size: 7, text: "LAMA Analytics", x: margin, y: 22 }));
      page.push(pdfTextRight({ color: colors.muted, size: 7, text: `Pagina ${index + 1} de ${pages.length}`, x: width - margin, y: 22 }));
    });
  }

  startPage();
  sectionTitle("Resumen ejecutivo", rangeDetail);
  paragraph([
    `Ingresos aprobados: ${formatCurrency(snapshot.kpis.revenue)}. Transacciones aprobadas: ${formatNumber(snapshot.kpis.totalTransactions)}. Tasa de conversion: ${formatNumber(snapshot.kpis.completionRate)}%.`,
    `Ticket promedio: ${formatCurrency(snapshot.kpis.averageOrderValue)}. Entrega promedio: ${formatDurationDays(snapshot.kpis.averageDeliveryTimeDays)}. Procesamiento de pago: ${formatDurationHours(snapshot.kpis.averagePaymentProcessingHours)}.`
  ]);
  cardGrid([
    { label: "Ingresos", value: formatCurrency(snapshot.kpis.revenue), detail: "Pagos aprobados" },
    { label: "Transacciones", value: formatNumber(snapshot.kpis.totalTransactions), detail: "Aprobadas" },
    { label: "Ticket promedio", value: formatCurrency(snapshot.kpis.averageOrderValue), detail: "Por pago aprobado" },
    { label: "Conversion", value: `${formatNumber(snapshot.kpis.completionRate)}%`, detail: "Completadas / creadas" },
    { label: "Compradores", value: formatNumber(snapshot.kpis.activeUsers), detail: "Registrados en Buyer" },
    { label: "Vendedores activos", value: formatNumber(snapshot.kpis.activeSellers), detail: "Habilitados en Seller" },
    { label: "Vendedores inactivos", value: formatNumber(snapshot.kpis.inactiveSellers), detail: "Inhabilitados en Seller" },
    { label: "Completadas", value: formatNumber(snapshot.kpis.completedOrders), detail: "Ordenes finalizadas" },
    { label: "Entrega", value: formatDurationDays(snapshot.kpis.averageDeliveryTimeDays), detail: "Promedio logistico" },
    { label: "Pago", value: formatDurationHours(snapshot.kpis.averagePaymentProcessingHours), detail: "Tiempo aprobacion" }
  ]);
  table({
    headers: ["Periodo", "Ingresos", "Ordenes", "Envios", "Entregados"],
    rows: snapshot.temporalSeries.map((item) => [
      item.label,
      formatCurrency(item.revenue),
      formatNumber(item.orders),
      formatNumber(item.shipments),
      formatNumber(item.deliveredShipments)
    ]),
    title: "Evolucion temporal",
    widths: [100, 120, 95, 95, 126]
  });
  funnel();
  table({
    headers: ["Producto", "Unidades", "Ingresos"],
    rows: snapshot.topProducts.map((product, index) => [
      `${index + 1}. ${product.title}`,
      formatNumber(product.units),
      formatCurrency(product.revenue)
    ]),
    title: "Top productos",
    widths: [320, 92, 124]
  });
  table({
    headers: ["Vendedor", "Ventas", "Ingresos"],
    rows: snapshot.topSellers.map((seller, index) => [
      `${index + 1}. ${seller.sellerId}`,
      formatNumber(seller.sales),
      formatCurrency(seller.revenue)
    ]),
    title: "Top vendedores",
    widths: [320, 92, 124]
  });
  table({
    headers: ["Alerta", "Severidad", "Eventos", "Detalle"],
    rows: snapshot.operationalAlerts.map((alert) => [
      alert.title,
      alert.severity,
      formatNumber(alert.items.length),
      alert.detail
    ]),
    title: "Alertas operativas",
    widths: [150, 80, 70, 236]
  });
  table({
    headers: ["Fuente", "Estado", "Detalle"],
    rows: snapshot.dataSources.map((source) => [source.name, source.status, source.detail]),
    title: "Fuentes de datos",
    widths: [150, 90, 296]
  });
  footer();

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  ];
  const pageIds: number[] = [];

  pages.forEach((page) => {
    const content = page.join("\n");
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1;
    pageIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((pageId) => `${pageId} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
