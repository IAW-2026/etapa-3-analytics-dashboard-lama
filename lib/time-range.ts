import type { AnalyticsTimeRange, TimeRangeId } from "./types";

export type TimeRangeSearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_TIME_RANGE_ID: TimeRangeId = "all";

export const TIME_RANGE_OPTIONS: Array<{ id: TimeRangeId; label: string }> = [
  { id: "all", label: "Todo" },
  { id: "30d", label: "Ultimos 30 dias" },
  { id: "90d", label: "Ultimos 90 dias" },
  { id: "month", label: "Mes actual" },
  { id: "previous-month", label: "Mes anterior" }
];

const dayInMilliseconds = 24 * 60 * 60 * 1000;

function isTimeRangeId(value: unknown): value is TimeRangeId {
  return TIME_RANGE_OPTIONS.some((option) => option.id === value);
}

export function getTimeRangeId(value: string | string[] | null | undefined): TimeRangeId {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return isTimeRangeId(rawValue) ? rawValue : DEFAULT_TIME_RANGE_ID;
}

export function getTimeRangeIdFromSearchParams(searchParams?: TimeRangeSearchParams) {
  return getTimeRangeId(searchParams?.range);
}

export function getTimeRangeLabel(id: TimeRangeId) {
  return TIME_RANGE_OPTIONS.find((option) => option.id === id)?.label ?? TIME_RANGE_OPTIONS[0].label;
}

export function buildTimeRangeHref(href: string, id: TimeRangeId) {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  if (id === DEFAULT_TIME_RANGE_ID) {
    params.delete("range");
  } else {
    params.set("range", id);
  }

  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function endOfDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * dayInMilliseconds);
}

function addMonths(value: Date, months: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1));
}

function startOfMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function endOfMonth(value: Date) {
  return endOfDay(new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)));
}

function getValidDates(dates: string[]) {
  return dates
    .map(parseDate)
    .filter((date): date is Date => Boolean(date))
    .sort((first, second) => first.getTime() - second.getTime());
}

function buildRange(id: TimeRangeId, label: string, startDate: Date | null, endDate: Date | null): AnalyticsTimeRange {
  if (!startDate || !endDate) {
    return {
      id,
      label,
      startDate: null,
      endDate: null,
      previousStartDate: null,
      previousEndDate: null
    };
  }

  const durationDays = Math.max(Math.round((startOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / dayInMilliseconds) + 1, 1);
  const previousEndDate = addDays(startOfDay(startDate), -1);
  const previousStartDate = addDays(previousEndDate, -(durationDays - 1));

  return {
    id,
    label,
    startDate: getDateOnly(startDate),
    endDate: getDateOnly(endDate),
    previousStartDate: getDateOnly(previousStartDate),
    previousEndDate: getDateOnly(previousEndDate)
  };
}

export function resolveTimeRange(id: TimeRangeId, dates: string[]): AnalyticsTimeRange {
  const validDates = getValidDates(dates);
  const earliestDate = validDates[0] ? startOfDay(validDates[0]) : null;
  const latestDate = validDates[validDates.length - 1] ? endOfDay(validDates[validDates.length - 1]) : endOfDay(new Date());
  const label = getTimeRangeLabel(id);

  if (id === "all") {
    return buildRange(id, label, earliestDate, latestDate);
  }

  if (id === "30d") {
    return buildRange(id, label, addDays(startOfDay(latestDate), -29), latestDate);
  }

  if (id === "90d") {
    return buildRange(id, label, addDays(startOfDay(latestDate), -89), latestDate);
  }

  if (id === "month") {
    return buildRange(id, label, startOfMonth(latestDate), latestDate);
  }

  const previousMonth = addMonths(latestDate, -1);

  return buildRange(id, label, startOfMonth(previousMonth), endOfMonth(previousMonth));
}
