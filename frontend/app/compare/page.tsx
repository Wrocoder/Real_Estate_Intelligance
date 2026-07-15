"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type CompareItemMetrics,
  type CompareResponse,
  type ListingAnalysis,
} from "@/lib/api";
import { money, percent } from "@/lib/format";
import { scoreLabel } from "@/lib/scoreLabels";

export default function ComparePage() {
  const [available, setAvailable] = useState<ListingAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [status, setStatus] = useState("Загрузка объектов...");
  const [error, setError] = useState("");
  const items = comparison?.items ?? [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialIds = (params.get("ids") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);

    async function loadInitial() {
      setError("");
      setStatus("Загрузка объектов...");
      try {
        const search = await api.listListings({
          city: "Wrocław",
          page_size: 100,
          sort: "investment_score_desc",
        });
        const fallbackIds = search.items.slice(0, 2).map((item) => item.listing.id);
        const nextIds = initialIds.length >= 2 ? initialIds : fallbackIds;
        setAvailable(search.items);
        setSelectedIds(nextIds);
        setStatus("Объекты загружены");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "unknown error");
        setStatus("Backend API недоступен");
      }
    }

    void loadInitial();
  }, []);

  useEffect(() => {
    if (selectedIds.length < 2) {
      setComparison(null);
      return;
    }

    let cancelled = false;
    async function loadCompare() {
      setError("");
      setStatus("Сравнение объектов...");
      try {
        const response = await api.compareListings(selectedIds);
        if (cancelled) return;
        setComparison(response);
        setStatus(`Сравнивается объектов: ${response.items.length}`);
      } catch (caught) {
        if (cancelled) return;
        setComparison(null);
        setError(caught instanceof Error ? caught.message : "unknown error");
        setStatus("Сравнение недоступно для текущего набора");
      }
    }

    void loadCompare();
    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const metricById = useMemo(
    () => new Map((comparison?.metrics ?? []).map((metric) => [metric.listing_id, metric])),
    [comparison],
  );

  function toggleListing(listingId: string) {
    setSelectedIds((current) => {
      if (current.includes(listingId)) {
        return current.filter((item) => item !== listingId);
      }
      if (current.length >= 5) {
        setStatus("Максимум 5 объектов в сравнении");
        return current;
      }
      return [...current, listingId];
    });
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Сравнение объектов</h1>
          <p>Сравнение цены, ликвидности, рисков, торга и инвестиционного потенциала.</p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/">
            <BarChart3 size={16} /> Подбор
          </Link>
          <button
            className="button"
            type="button"
            disabled={selectedIds.length < 2}
            onClick={() => setSelectedIds([...selectedIds])}
          >
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </header>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Выбор объектов</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body compare-selector">
          {available.length === 0 && !error ? (
            <LoadingBlock />
          ) : (
            available.map((analysis) => (
              <label key={analysis.listing.id} className="compare-option">
                <input
                  type="checkbox"
                  checked={selectedSet.has(analysis.listing.id)}
                  onChange={() => toggleListing(analysis.listing.id)}
                />
                <span>
                  <strong>{analysis.listing.title}</strong>
                  <small>
                    {analysis.listing.district} · {money(analysis.listing.price)} · I{" "}
                    {analysis.scores.investment_score} / R {analysis.scores.risk_score} ·{" "}
                    {scoreLabel(analysis.scores.decision_label)}
                  </small>
                </span>
              </label>
            ))
          )}
        </div>
      </section>

      {error ? (
        <ErrorBlock message={error} />
      ) : selectedIds.length < 2 ? (
        <EmptyBlock label="Выбери минимум 2 объекта для сравнения." />
      ) : comparison === null || items.length === 0 ? (
        <LoadingBlock />
      ) : (
        <>
          <section className="metric-grid" style={{ marginBottom: 16 }}>
            <Metric
              label="Лучший выбор"
              value={listingShort(items, comparison.summary.best_listing_id)}
              detail={metricDetail(metricById.get(comparison.summary.best_listing_id))}
            />
            <Metric
              label="Ниже fair price"
              value={listingShort(items, comparison.summary.best_value_listing_id)}
              detail={fairDetail(metricById.get(comparison.summary.best_value_listing_id))}
            />
            <Metric
              label="Дешевле в месяц"
              value={listingShort(items, comparison.summary.lowest_monthly_payment_listing_id)}
              detail={paymentDetail(
                metricById.get(comparison.summary.lowest_monthly_payment_listing_id),
              )}
            />
            <Metric
              label="Арендный сигнал"
              value={listingShort(items, comparison.summary.strongest_rental_listing_id)}
              detail={rentDetail(metricById.get(comparison.summary.strongest_rental_listing_id))}
            />
          </section>

          <section className="grid-3" style={{ marginBottom: 16 }}>
            {comparison.metrics.map((metric) => {
              const item = items.find((analysis) => analysis.listing.id === metric.listing_id);
              return (
                <article className="metric" key={metric.listing_id}>
                  <span>
                    #{metric.rank} · {item ? item.listing.district : metric.listing_id}
                  </span>
                  <strong>
                    {metric.decision_score}/100 · {scoreLabel(metric.decision_label)}
                  </strong>
                  <small className="muted" style={{ display: "block", marginTop: 8 }}>
                    {metric.recommendation}
                  </small>
                  <div className="meta-row">
                    <span>{money(metric.estimated_monthly_payment_pln)}/мес</span>
                    <span>{metric.liquidity_score}/100 liquidity</span>
                    <span>{metric.rental_potential_score}/100 rent</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Матрица сравнения</h2>
              <span className="muted">
                {items.length} объекта · ипотека{" "}
                {comparison.mortgage_assumptions.down_payment_pct.toFixed(0)}% /{" "}
                {comparison.mortgage_assumptions.loan_years} лет /{" "}
                {comparison.mortgage_assumptions.annual_interest_rate_pct.toFixed(1)}%
              </span>
            </div>
            <div className="table-scroll">
              <table className="table compare-table">
                <thead>
                  <tr>
                    <th>Метрика</th>
                    {items.map((item) => (
                      <th key={item.listing.id}>
                        <Link href={`/listings/${item.listing.id}`}>{item.listing.title}</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows(items, metricById).map((row) => (
                    <tr key={row.id}>
                      <th>{row.label}</th>
                      {row.values.map((value, index) => (
                        <td key={`${row.id}-${items[index].listing.id}`}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function comparisonRows(items: ListingAnalysis[], metricById: Map<string, CompareItemMetrics>) {
  return [
    {
      id: "location",
      label: "Локация",
      values: items.map((item) => `${item.listing.district}, ${item.listing.address}`),
    },
    {
      id: "price",
      label: "Цена",
      values: items.map((item) => money(item.listing.price)),
    },
    {
      id: "price-per-m2",
      label: "Цена/m2",
      values: items.map((item) => `${money(item.listing.price_per_m2)}/m2`),
    },
    {
      id: "area-rooms",
      label: "Площадь и комнаты",
      values: items.map((item) => `${item.listing.area_m2.toFixed(1)} m2 · ${item.listing.rooms}`),
    },
    {
      id: "days-on-market",
      label: "Дней на рынке",
      values: items.map((item) => `${item.listing.days_on_market}`),
    },
    {
      id: "decision-score",
      label: "Decision Score",
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `#${metric.rank} · ${metric.decision_score}/100 · ${scoreLabel(metric.decision_label)}`
          : "-";
      }),
    },
    {
      id: "decision-label",
      label: "Вердикт",
      values: items.map((item) => scoreLabel(item.scores.decision_label)),
    },
    {
      id: "mortgage-payment",
      label: "Ипотека baseline",
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${money(metric.estimated_monthly_payment_pln)}/мес · loan ${money(
              metric.loan_amount_pln,
            )}`
          : "-";
      }),
    },
    {
      id: "cash-needed",
      label: "Cash needed",
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${money(metric.upfront_cash_needed_pln)} · wkład ${money(metric.down_payment_pln)}`
          : "-";
      }),
    },
    {
      id: "rental-estimate",
      label: "Rental estimate",
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${metric.estimated_gross_rental_yield_pct.toFixed(2)}% gross · ${money(
              metric.estimated_monthly_rent_pln,
            )}/мес`
          : "-";
      }),
    },
    {
      id: "price-label",
      label: "Оценка цены",
      values: items.map((item) => scoreLabel(item.scores.price_label)),
    },
    {
      id: "investment-score",
      label: "Investment Score",
      values: items.map((item) => `${item.scores.investment_score}/100`),
    },
    {
      id: "risk-score",
      label: "Risk Score",
      values: items.map(
        (item) => `${item.scores.risk_score}/100 · ${scoreLabel(item.scores.risk_label)}`,
      ),
    },
    {
      id: "negotiation-score",
      label: "Negotiation Score",
      values: items.map(
        (item) =>
          `${item.scores.negotiation_score}/100 · ${scoreLabel(item.scores.negotiation_label)}`,
      ),
    },
    {
      id: "liquidity-score",
      label: "Liquidity",
      values: items.map(
        (item) => `${item.scores.liquidity_score}/100 · ${scoreLabel(item.scores.liquidity_label)}`,
      ),
    },
    {
      id: "rental-potential-score",
      label: "Rental Potential",
      values: items.map(
        (item) =>
          `${item.scores.rental_potential_score}/100 · ${scoreLabel(
            item.scores.rental_potential_label,
          )}`,
      ),
    },
    {
      id: "fair-price-range",
      label: "Fair price",
      values: items.map(
        (item) =>
          `${money(item.scores.fair_price_low)} - ${money(item.scores.fair_price_high)}`,
      ),
    },
    {
      id: "fair-price-confidence",
      label: "Fair price confidence",
      values: items.map((item) => `${item.scores.fair_price_confidence_score}/100`),
    },
    {
      id: "fair-price-delta",
      label: "Delta до fair mid",
      values: items.map((item) => percent(item.scores.price_delta_to_fair_mid_pct)),
    },
    {
      id: "discount-to-fair",
      label: "Скидка до fair",
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric ? money(metric.estimated_discount_to_fair_mid_pln) : "-";
      }),
    },
    {
      id: "transport",
      label: "Транспорт",
      values: items.map((item) => `${item.listing.nearest_stop_m} м до остановки`),
    },
    {
      id: "infrastructure",
      label: "Инфраструктура",
      values: items.map(
        (item) =>
          `${item.listing.schools_within_1km} школ · ${item.listing.parks_within_1km} парков`,
      ),
    },
    {
      id: "planned-investments",
      label: "Planned investments",
      values: items.map((item) => `${item.listing.planned_investments_within_2km} в радиусе 2 км`),
    },
    {
      id: "negotiation-argument",
      label: "Аргумент для торга",
      values: items.map((item) => item.negotiation_arguments[0] ?? "-"),
    },
    {
      id: "main-risk",
      label: "Главный риск",
      values: items.map((item) => item.scores.warnings[0] ?? "Критичных предупреждений нет"),
    },
    {
      id: "recommendation",
      label: "Рекомендация",
      values: items.map((item) => metricById.get(item.listing.id)?.recommendation ?? "-"),
    },
  ];
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? (
        <small className="muted" style={{ display: "block", marginTop: 6, lineHeight: 1.35 }}>
          {detail}
        </small>
      ) : null}
    </div>
  );
}

function listingShort(items: ListingAnalysis[], listingId: string) {
  const item = items.find((analysis) => analysis.listing.id === listingId);
  if (!item) return listingId;
  return `${item.listing.district}, ${item.listing.rooms} pok.`;
}

function metricDetail(metric: CompareItemMetrics | undefined) {
  return metric
    ? `${metric.decision_score}/100 · ${money(metric.estimated_monthly_payment_pln)}/мес`
    : "";
}

function fairDetail(metric: CompareItemMetrics | undefined) {
  return metric
    ? `${percent(metric.price_delta_to_fair_mid_pct)} к fair · ${money(
        metric.estimated_discount_to_fair_mid_pln,
      )} торг`
    : "";
}

function paymentDetail(metric: CompareItemMetrics | undefined) {
  return metric
    ? `${money(metric.estimated_monthly_payment_pln)}/мес · ${money(
        metric.upfront_cash_needed_pln,
      )} cash`
    : "";
}

function rentDetail(metric: CompareItemMetrics | undefined) {
  return metric
    ? `${metric.estimated_gross_rental_yield_pct.toFixed(2)}% · ${money(
        metric.estimated_monthly_rent_pln,
      )}/мес`
    : "";
}
