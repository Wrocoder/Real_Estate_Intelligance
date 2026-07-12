"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { api, type ListingAnalysis } from "@/lib/api";
import { money, percent } from "@/lib/format";
import { scoreLabel } from "@/lib/scoreLabels";

export default function ComparePage() {
  const [available, setAvailable] = useState<ListingAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<ListingAnalysis[]>([]);
  const [status, setStatus] = useState("Загрузка объектов...");
  const [error, setError] = useState("");

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
      setItems([]);
      return;
    }

    let cancelled = false;
    async function loadCompare() {
      setError("");
      setStatus("Сравнение объектов...");
      try {
        const response = await api.compareListings(selectedIds);
        if (cancelled) return;
        setItems(response.items);
        setStatus(`Сравнивается объектов: ${response.items.length}`);
      } catch (caught) {
        if (cancelled) return;
        setItems([]);
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
      ) : items.length === 0 ? (
        <LoadingBlock />
      ) : (
        <section className="panel">
          <div className="panel-header">
            <h2>Матрица сравнения</h2>
            <span className="muted">{items.length} объекта</span>
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
                {comparisonRows(items).map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${items[index].listing.id}`}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function comparisonRows(items: ListingAnalysis[]) {
  return [
    {
      label: "Локация",
      values: items.map((item) => `${item.listing.district}, ${item.listing.address}`),
    },
    {
      label: "Цена",
      values: items.map((item) => money(item.listing.price)),
    },
    {
      label: "Цена/m2",
      values: items.map((item) => `${money(item.listing.price_per_m2)}/m2`),
    },
    {
      label: "Площадь и комнаты",
      values: items.map((item) => `${item.listing.area_m2.toFixed(1)} m2 · ${item.listing.rooms}`),
    },
    {
      label: "Дней на рынке",
      values: items.map((item) => `${item.listing.days_on_market}`),
    },
    {
      label: "Вердикт",
      values: items.map((item) => scoreLabel(item.scores.decision_label)),
    },
    {
      label: "Цена",
      values: items.map((item) => scoreLabel(item.scores.price_label)),
    },
    {
      label: "Investment Score",
      values: items.map((item) => `${item.scores.investment_score}/100`),
    },
    {
      label: "Risk Score",
      values: items.map(
        (item) => `${item.scores.risk_score}/100 · ${scoreLabel(item.scores.risk_label)}`,
      ),
    },
    {
      label: "Negotiation Score",
      values: items.map(
        (item) =>
          `${item.scores.negotiation_score}/100 · ${scoreLabel(item.scores.negotiation_label)}`,
      ),
    },
    {
      label: "Liquidity",
      values: items.map(
        (item) => `${item.scores.liquidity_score}/100 · ${scoreLabel(item.scores.liquidity_label)}`,
      ),
    },
    {
      label: "Rental Potential",
      values: items.map(
        (item) =>
          `${item.scores.rental_potential_score}/100 · ${scoreLabel(
            item.scores.rental_potential_label,
          )}`,
      ),
    },
    {
      label: "Fair price",
      values: items.map(
        (item) =>
          `${money(item.scores.fair_price_low)} - ${money(item.scores.fair_price_high)}`,
      ),
    },
    {
      label: "Fair price confidence",
      values: items.map((item) => `${item.scores.fair_price_confidence_score}/100`),
    },
    {
      label: "Delta до fair mid",
      values: items.map((item) => percent(item.scores.price_delta_to_fair_mid_pct)),
    },
    {
      label: "Транспорт",
      values: items.map((item) => `${item.listing.nearest_stop_m} м до остановки`),
    },
    {
      label: "Инфраструктура",
      values: items.map(
        (item) =>
          `${item.listing.schools_within_1km} школ · ${item.listing.parks_within_1km} парков`,
      ),
    },
    {
      label: "Planned investments",
      values: items.map((item) => `${item.listing.planned_investments_within_2km} в радиусе 2 км`),
    },
    {
      label: "Аргумент для торга",
      values: items.map((item) => item.negotiation_arguments[0] ?? "-"),
    },
    {
      label: "Главный риск",
      values: items.map((item) => item.scores.warnings[0] ?? "Критичных предупреждений нет"),
    },
  ];
}
