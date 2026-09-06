"use client";

import { RefreshCw } from "lucide-react";

import type { AreaPriceHistory, AreaTransactionPricePoint } from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

const COPY: Record<Locale, {
  title: string;
  subtitle: string;
  chartLabel: string;
  yearly: string;
  observations: string;
  unavailable: string;
  empty: string;
  retry: string;
}> = {
  pl: {
    title: "Zmiana cen transakcyjnych w czasie",
    subtitle: "Miesięczna mediana ceny za m² dla wszystkich dostępnych lat. Przerwa oznacza miesiąc bez obserwacji.",
    chartLabel: "Miesięczna mediana ceny transakcyjnej za metr kwadratowy",
    yearly: "Mediany roczne",
    observations: "transakcji",
    unavailable: "Nie udało się pobrać historii cen.",
    empty: "Brak wystarczających danych do pokazania historii cen.",
    retry: "Spróbuj ponownie",
  },
  en: {
    title: "Transaction prices over time",
    subtitle: "Monthly median price per m² across all available years. A gap means that no observation was recorded for that month.",
    chartLabel: "Monthly median transaction price per square meter",
    yearly: "Yearly medians",
    observations: "transactions",
    unavailable: "Price history could not be loaded.",
    empty: "There is not enough data to show price history.",
    retry: "Try again",
  },
  ru: {
    title: "Изменение цен сделок",
    subtitle: "Месячная медиана цены за м² за все доступные годы. Разрыв означает отсутствие наблюдений в этом месяце.",
    chartLabel: "Месячная медиана цены сделки за квадратный метр",
    yearly: "Медианы по годам",
    observations: "сделок",
    unavailable: "Не удалось загрузить историю цен.",
    empty: "Недостаточно данных для отображения истории цен.",
    retry: "Повторить",
  },
  uk: {
    title: "Зміна цін угод",
    subtitle: "Місячна медіана ціни за м² за всі доступні роки. Розрив означає відсутність спостережень у цьому місяці.",
    chartLabel: "Місячна медіана ціни угоди за квадратний метр",
    yearly: "Медіани за роками",
    observations: "угод",
    unavailable: "Не вдалося завантажити історію цін.",
    empty: "Недостатньо даних для відображення історії цін.",
    retry: "Повторити",
  },
};

const WIDTH = 760;
const HEIGHT = 300;
const PADDING = { top: 24, right: 24, bottom: 44, left: 72 };

export function AreaPriceHistoryChart({
  history,
  unavailable,
  locale,
  onRetry,
}: {
  history: AreaPriceHistory | null;
  unavailable: boolean;
  locale: Locale;
  onRetry: () => void;
}) {
  const copy = COPY[locale];

  if (unavailable) {
    return (
      <div className="area-price-history area-dynamic-status error" role="alert">
        <span>{copy.unavailable}</span>
        <button className="button" onClick={onRetry} type="button">
          <RefreshCw aria-hidden="true" size={14} /> {copy.retry}
        </button>
      </div>
    );
  }
  if (!history?.monthly.length) {
    return <div className="area-price-history empty-state">{copy.empty}</div>;
  }

  const chart = buildChart(history.monthly);
  const monthFormatter = new Intl.DateTimeFormat(localeCode(locale), {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const priceFormatter = new Intl.NumberFormat(localeCode(locale), {
    maximumFractionDigits: 0,
  });

  return (
    <section className="area-price-history" aria-labelledby="area-price-history-title">
      <div className="area-price-history-heading">
        <div>
          <h3 id="area-price-history-title">{copy.title}</h3>
          <p>{copy.subtitle}</p>
        </div>
        <span className="status-pill info">
          {numberValue(history.observation_count, locale)} {copy.observations}
        </span>
      </div>
      <div
        aria-label={copy.chartLabel}
        className="area-price-chart-scroll"
        role="region"
        tabIndex={0}
      >
        <svg
          aria-label={copy.chartLabel}
          className="area-price-chart"
          role="img"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        >
          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                className="area-price-chart-grid"
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={tick.y}
                y2={tick.y}
              />
              <text className="area-price-chart-axis" x={PADDING.left - 10} y={tick.y + 4}>
                {priceFormatter.format(tick.value)}
              </text>
            </g>
          ))}
          {chart.yearLabels.map((label) => (
            <text
              className="area-price-chart-year"
              key={label.year}
              x={label.x}
              y={HEIGHT - 14}
            >
              {label.year}
            </text>
          ))}
          {chart.segments.map((segment, index) => (
            <polyline
              className="area-price-chart-line"
              key={`${segment[0]?.period_start}-${index}`}
              points={segment.map((point) => `${point.x},${point.y}`).join(" ")}
            />
          ))}
          {chart.points.map((point) => (
            <circle
              className="area-price-chart-point"
              cx={point.x}
              cy={point.y}
              key={point.period_start}
              r="4"
            >
              <title>
                {monthFormatter.format(new Date(`${point.period_start}T00:00:00Z`))}: {money(point.median_price_per_m2, locale)}/m², {numberValue(point.observation_count, locale)} {copy.observations}
              </title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="area-yearly-history" aria-label={copy.yearly}>
        <strong>{copy.yearly}</strong>
        <div>
          {history.yearly.map((point) => (
            <span key={point.period_start}>
              <small>{new Date(`${point.period_start}T00:00:00Z`).getUTCFullYear()}</small>
              <b>{money(point.median_price_per_m2, locale)}/m²</b>
              <small>{numberValue(point.observation_count, locale)} {copy.observations}</small>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

type ChartPoint = AreaTransactionPricePoint & { x: number; y: number; serial: number };

function buildChart(points: AreaTransactionPricePoint[]) {
  const values = points.map((point) => point.median_price_per_m2);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.12, rawMax * 0.03, 1);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const start = monthSerial(points[0].period_start);
  const end = monthSerial(points[points.length - 1].period_start);
  const range = Math.max(end - start, 1);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const chartPoints: ChartPoint[] = points.map((point) => {
    const serial = monthSerial(point.period_start);
    return {
      ...point,
      serial,
      x: PADDING.left + ((serial - start) / range) * plotWidth,
      y: PADDING.top + ((max - point.median_price_per_m2) / (max - min)) * plotHeight,
    };
  });
  const segments: ChartPoint[][] = [];
  for (const point of chartPoints) {
    const segment = segments[segments.length - 1];
    if (!segment || point.serial - segment[segment.length - 1].serial > 1) {
      segments.push([point]);
    } else {
      segment.push(point);
    }
  }
  const ticks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const value = Math.round(max - ratio * (max - min));
    return { value, y: PADDING.top + ratio * plotHeight };
  });
  const firstPointByYear = new Map<number, ChartPoint>();
  for (const point of chartPoints) {
    const year = Number(point.period_start.slice(0, 4));
    if (!firstPointByYear.has(year)) firstPointByYear.set(year, point);
  }

  const yearLabels = [...firstPointByYear.entries()].map(([year, point]) => ({
    year,
    x: point.x,
  }));

  return {
    points: chartPoints,
    segments,
    ticks,
    yearLabels: yearLabels.filter(
      (label, index) =>
        index === yearLabels.length - 1 || yearLabels[index + 1].x - label.x >= 54,
    ),
  };
}

function monthSerial(value: string) {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}

function localeCode(locale: Locale) {
  if (locale === "pl") return "pl-PL";
  if (locale === "ru") return "ru-RU";
  if (locale === "uk") return "uk-UA";
  return "en-US";
}
