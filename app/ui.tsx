import type { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { buildTimeRangeHref } from "@/lib/time-range";
import type { TimeRangeId, TrendMetric } from "@/lib/types";

import { ThemeToggle } from "./theme-toggle";
import { TimeRangeSelector } from "./time-range-selector";

export const moneyFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0
});

export const numberFormatter = new Intl.NumberFormat("es-AR");

export type IconName =
  | "activity"
  | "arrowDown"
  | "arrowUp"
  | "bag"
  | "check"
  | "credit"
  | "database"
  | "home"
  | "minus"
  | "package"
  | "refresh"
  | "sparkles"
  | "star"
  | "truck"
  | "trending"
  | "users"
  | "wallet";

type NavItem = {
  href: string;
  icon: IconName;
  id: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", icon: "home", id: "inicio", label: "Inicio" },
  { href: "/dashboard", icon: "activity", id: "dashboard", label: "Dashboard" },
  { href: "/insights", icon: "sparkles", id: "insights", label: "Insights IA" },
  { href: "/ordenes", icon: "bag", id: "ordenes", label: "Ordenes" },
  { href: "/pagos", icon: "credit", id: "pagos", label: "Pagos" },
  { href: "/productos", icon: "package", id: "productos", label: "Productos" },
  { href: "/envios", icon: "truck", id: "envios", label: "Envios" },
  { href: "/usuarios", icon: "users", id: "usuarios", label: "Usuarios" },
  { href: "/fuentes", icon: "database", id: "fuentes", label: "Fuentes" }
];

export function formatCurrency(value: number) {
  return `$${moneyFormatter.format(value)}`;
}

export function formatTrendPercent(value: number) {
  const absoluteValue = Math.abs(value);
  const formattedValue = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: absoluteValue > 0 && absoluteValue < 10 ? 1 : 0
  }).format(absoluteValue);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";

  return `${sign}${formattedValue}%`;
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
    .format(date)
    .replace(",", "");
}

export function formatLabel(label: string) {
  const labels: Record<string, string> = {
    aprobado: "Aprobados",
    cancelada: "Canceladas",
    connected: "Conectada",
    delivered: "Delivered",
    despachada: "Despachadas",
    en_preparacion: "En preparacion",
    error: "Error",
    finalizada: "Finalizadas",
    in_transit: "In Transit",
    liquidada: "Liquidadas",
    mock: "Mock",
    pagada: "Pagadas",
    pendiente: "Pendientes",
    pendiente_pago: "Pendiente pago",
    pending: "Pending",
    rechazado: "Rechazados"
  };

  if (labels[label]) {
    return labels[label];
  }

  return label
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getMetric(data: Array<{ label: string; value: number }>, label: string) {
  return data.find((item) => item.label === label)?.value ?? 0;
}

export function getConnectionLabel(value: number) {
  if (value >= 80) {
    return "Conexion estable";
  }

  if (value >= 50) {
    return "Conexion parcial";
  }

  return "Revisar fuentes";
}

export function Icon({ name }: { name: IconName }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24"
  };

  return (
    <span className="line-icon" aria-hidden="true">
      <svg {...commonProps}>
        {name === "activity" ? <path d="M3 12h4l2-6 4 12 2-6h6" /> : null}
        {name === "arrowDown" ? (
          <>
            <path d="M12 5v14" />
            <path d="m18 13-6 6-6-6" />
          </>
        ) : null}
        {name === "arrowUp" ? (
          <>
            <path d="M12 19V5" />
            <path d="m6 11 6-6 6 6" />
          </>
        ) : null}
        {name === "bag" ? (
          <>
            <path d="M6 8h12l-1 12H7L6 8Z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
          </>
        ) : null}
        {name === "check" ? (
          <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="m8.5 12.2 2.2 2.2 4.8-5" />
          </>
        ) : null}
        {name === "credit" ? (
          <>
            <rect x="4" y="6" width="16" height="12" rx="2.5" />
            <path d="M4 10h16M8 15h3" />
          </>
        ) : null}
        {name === "database" ? (
          <>
            <ellipse cx="12" cy="6" rx="7" ry="3" />
            <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
            <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
          </>
        ) : null}
        {name === "home" ? (
          <>
            <path d="m4 11 8-7 8 7" />
            <path d="M6.5 10v9h11v-9" />
            <path d="M10 19v-5h4v5" />
          </>
        ) : null}
        {name === "minus" ? <path d="M5 12h14" /> : null}
        {name === "package" ? (
          <>
            <path d="m4.5 8 7.5-4 7.5 4-7.5 4-7.5-4Z" />
            <path d="M4.5 8v8l7.5 4 7.5-4V8M12 12v8" />
          </>
        ) : null}
        {name === "refresh" ? (
          <>
            <path d="M19 8a7 7 0 0 0-12-2l-2 2" />
            <path d="M5 4v4h4" />
            <path d="M5 16a7 7 0 0 0 12 2l2-2" />
            <path d="M19 20v-4h-4" />
          </>
        ) : null}
        {name === "star" ? (
          <path d="m12 4 2.2 4.7 5.1.7-3.8 3.6.9 5.1-4.4-2.5-4.4 2.5.9-5.1-3.8-3.6 5.1-.7L12 4Z" />
        ) : null}
        {name === "sparkles" ? (
          <>
            <path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
            <path d="M19 15 19.8 17.2 22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
            <path d="M5 14 5.6 15.4 7 16l-1.4.6L5 18l-.6-1.4L3 16l1.4-.6L5 14Z" />
          </>
        ) : null}
        {name === "truck" ? (
          <>
            <path d="M4 7h10v9H4z" />
            <path d="M14 10h3.2l2.8 3v3h-6" />
            <circle cx="8" cy="18" r="1.7" />
            <circle cx="17" cy="18" r="1.7" />
          </>
        ) : null}
        {name === "trending" ? (
          <>
            <path d="m4 16 5-5 4 4 7-7" />
            <path d="M15 8h5v5" />
          </>
        ) : null}
        {name === "users" ? (
          <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
            <path d="M15 10.5a2.7 2.7 0 0 1 0-5" />
            <path d="M17 15a4.6 4.6 0 0 1 3.5 4" />
          </>
        ) : null}
        {name === "wallet" ? (
          <>
            <path d="M5 7h13a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10" />
            <path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

export function TrendBadge({ trend }: { trend?: TrendMetric }) {
  if (!trend) {
    return null;
  }

  const icon = trend.direction === "up" ? "arrowUp" : trend.direction === "down" ? "arrowDown" : "minus";
  const value = formatTrendPercent(trend.percentChange);

  return (
    <span className={`trend-badge trend-${trend.tone}`} aria-label={`${value} vs periodo anterior`}>
      <Icon name={icon} />
      <strong>{value}</strong>
      <small>vs periodo anterior</small>
    </span>
  );
}

export function AppChrome({
  active,
  children,
  generatedAt,
  integrationHealth,
  timeRangeId
}: {
  active: string;
  children: ReactNode;
  generatedAt: string;
  integrationHealth: number;
  timeRangeId: TimeRangeId;
}) {
  const refreshHref = buildTimeRangeHref(active === "inicio" ? "/" : `/${active}`, timeRangeId);

  return (
    <main className="app-page">
      <header className="topbar">
        <div className="brand-lockup">
          <strong>LAMA</strong>
          <span>Analytics</span>
        </div>
        <div className="topbar-center">Analytics</div>
        <div className="topbar-actions">
          <TimeRangeSelector activeRange={timeRangeId} />
          <ThemeToggle />
          <a className="refresh-button" href={refreshHref} aria-label="Actualizar datos">
            <Icon name="refresh" />
          </a>
          <UserButton />
        </div>
      </header>

      <nav className="section-nav" aria-label="Secciones de analytics">
        {navItems.map((item) => (
          <Link className={active === item.id ? "active" : ""} href={buildTimeRangeHref(item.href, timeRangeId)} key={item.id}>
            <Icon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="dashboard-shell">
        {children}
        <StateStrip generatedAt={generatedAt} integrationHealth={integrationHealth} />
      </div>
    </main>
  );
}

export function StateStrip({
  generatedAt,
  integrationHealth
}: {
  generatedAt: string;
  integrationHealth: number;
}) {
  return (
    <aside className="state-strip" aria-label="Estado de datos">
      <div>
        <span>Ultima actualizacion</span>
        <strong>{formatDate(generatedAt)}</strong>
      </div>
      <div>
        <span>Fuentes conectadas</span>
        <strong>{integrationHealth}%</strong>
      </div>
      <div className="state-progress">
        <div style={{ width: `${integrationHealth}%` }} />
      </div>
    </aside>
  );
}

export function ModuleCard({
  detail,
  href,
  icon,
  label,
  trend,
  value
}: {
  detail: string;
  href: string;
  icon: IconName;
  label: string;
  trend?: TrendMetric;
  value: string;
}) {
  return (
    <Link className="module-card" href={href}>
      <div className="card-icon">
        <Icon name={icon} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
      <TrendBadge trend={trend} />
    </Link>
  );
}

export function KpiCard({
  badge,
  detail,
  icon,
  label,
  trend,
  value
}: {
  badge: string;
  detail: string;
  icon: IconName;
  label: string;
  trend?: TrendMetric;
  value: string;
}) {
  return (
    <article className="kpi-card">
      <div className="card-icon">
        <Icon name={icon} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
      <b>{badge}</b>
      <TrendBadge trend={trend} />
    </article>
  );
}

export function MetricPanel({
  detail,
  label,
  trend,
  value
}: {
  detail: string;
  label: string;
  trend?: TrendMetric;
  value: string;
}) {
  return (
    <article className="panel metric-panel">
      <p className="eyebrow">{label}</p>
      <strong className="metric-large">{value}</strong>
      <span className="muted-text">{detail}</span>
      <TrendBadge trend={trend} />
    </article>
  );
}

export function BarChart({
  data,
  label,
  valueKey
}: {
  data: Array<Record<string, number | string>>;
  label: string;
  valueKey: string;
}) {
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey])), 1);

  return (
    <div className="chart" aria-label={label}>
      {data.map((item) => {
        const value = Number(item[valueKey]);
        const height = Math.max((value / maxValue) * 100, 12);

        return (
          <div className="bar-column" key={String(item.label)}>
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${height}%` }}>
                <span>{formatCurrency(value)}</span>
              </div>
            </div>
            <small>{String(item.label)}</small>
          </div>
        );
      })}
    </div>
  );
}

export function HorizontalBars({
  data,
  valueLabel
}: {
  data: Array<{ label: string; value: number }>;
  valueLabel: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="horizontal-bars">
      {data.map((item) => (
        <div className="horizontal-row" key={item.label}>
          <div className="horizontal-label">
            <span>{formatLabel(item.label)}</span>
            <strong>
              {numberFormatter.format(item.value)} {valueLabel}
            </strong>
          </div>
          <div className="horizontal-track">
            <div style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Funnel({
  data
}: {
  data: Array<{ label: string; value: number; detail: string }>;
}) {
  const icons: IconName[] = ["bag", "credit", "truck", "check"];
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="funnel">
      {data.map((item, index) => (
        <article className="funnel-step" key={item.label}>
          <div className="funnel-topline">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <Icon name={icons[index] ?? "activity"} />
          </div>
          <strong>{item.label}</strong>
          <p>{index === 0 ? `${numberFormatter.format(item.value)} ordenes` : item.detail}</p>
          <div className="funnel-meter">
            <div style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function DetailCard({
  badge,
  icon,
  rows,
  title
}: {
  badge: string;
  icon: IconName;
  rows: Array<{ label: string; numericValue: number; value: string }>;
  title: string;
}) {
  const maxValue = Math.max(...rows.map((row) => row.numericValue), 1);

  return (
    <article className="detail-card">
      <div className="detail-heading">
        <div>
          <Icon name={icon} />
          <h3>{title}</h3>
        </div>
        <span>{badge}</span>
      </div>
      <div className="detail-rows">
        {rows.map((row) => (
          <div className="detail-row" key={row.label}>
            <div>
              <span>{row.label}</span>
              <div className="mini-track">
                <div style={{ width: `${Math.max((row.numericValue / maxValue) * 100, 8)}%` }} />
              </div>
            </div>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

export function TopProductsPanel({
  detail = "Ordenados por unidades vendidas",
  products,
  title = "Top productos mas vendidos"
}: {
  detail?: string;
  products: Array<{ productId: string; title: string; units: number; revenue: number }>;
  title?: string;
}) {
  const maxUnits = Math.max(...products.map((product) => product.units), 1);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Productos</p>
          <h2>
            <Icon name="package" />
            {title}
          </h2>
          <span className="panel-subtitle">{detail}</span>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="ranked-list">
          {products.map((product, index) => (
            <article className="ranked-row" key={product.productId}>
              <span className="ranked-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="ranked-main">
                <div className="ranked-copy">
                  <strong>{product.title}</strong>
                  <span>{numberFormatter.format(product.units)} unidades vendidas</span>
                </div>
                <div className="ranked-track">
                  <div style={{ width: `${Math.max((product.units / maxUnits) * 100, 8)}%` }} />
                </div>
              </div>
              <strong className="ranked-value">{formatCurrency(product.revenue)}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">Sin productos vendidos en el periodo seleccionado.</p>
      )}
    </section>
  );
}

export function TopSellersPanel({
  detail = "Ordenados por ingresos y ventas aprobadas",
  sellers,
  title = "Top vendedores"
}: {
  detail?: string;
  sellers: Array<{ sellerId: string; sales: number; revenue: number }>;
  title?: string;
}) {
  const maxRevenue = Math.max(...sellers.map((seller) => seller.revenue), 1);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Vendedores</p>
          <h2>
            <Icon name="users" />
            {title}
          </h2>
          <span className="panel-subtitle">{detail}</span>
        </div>
      </div>

      {sellers.length > 0 ? (
        <div className="ranked-list">
          {sellers.map((seller, index) => (
            <article className="ranked-row" key={seller.sellerId}>
              <span className="ranked-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="ranked-main">
                <div className="ranked-copy">
                  <strong>{formatLabel(seller.sellerId)}</strong>
                  <span>{numberFormatter.format(seller.sales)} ventas aprobadas</span>
                </div>
                <div className="ranked-track">
                  <div style={{ width: `${Math.max((seller.revenue / maxRevenue) * 100, 8)}%` }} />
                </div>
              </div>
              <strong className="ranked-value">{formatCurrency(seller.revenue)}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">Sin ventas de vendedores en el periodo seleccionado.</p>
      )}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}>{formatLabel(status)}</span>;
}

