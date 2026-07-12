"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { api, type AreaComparison, type AreaComparisonItem } from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";

const SORT_OPTIONS = [
  { value: "value", label: "Value" },
  { value: "growth", label: "Growth" },
  { value: "buyer_market", label: "Buyer market" },
  { value: "seller_market", label: "Seller market" },
  { value: "liquidity", label: "Liquidity" },
  { value: "price_asc", label: "Price asc" },
  { value: "price_desc", label: "Price desc" },
];

export default function AreaComparisonPage() {
  const [city, setCity] = useState("Wrocław");
  const [sort, setSort] = useState("value");
  const [comparison, setComparison] = useState<AreaComparison | null>(null);
  const [status, setStatus] = useState("Загрузка сравнения...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setStatus("Загрузка сравнения...");
    try {
      const payload = await api.compareAreas({
        city: city || undefined,
        sort,
        limit: 50,
      });
      setComparison(payload);
      setStatus("Готово");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown area comparison error");
      setStatus("Backend API недоступен");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topAreas = useMemo(() => {
    if (!comparison) return [];
    return [
      topArea(comparison, comparison.top_value_area_id, "Value"),
      topArea(comparison, comparison.top_growth_area_id, "Growth"),
      topArea(comparison, comparison.top_buyer_market_area_id, "Buyer market"),
      topArea(comparison, comparison.top_liquidity_area_id, "Liquidity"),
    ].filter((item): item is { label: string; area: AreaComparisonItem } => item !== null);
  }, [comparison]);

  if (error) return <ErrorBlock message={error} />;
  if (!comparison) return <LoadingBlock label="Загрузка сравнения районов" />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Сравнение районов</h1>
          <p>Цены, экспозиция, ликвидность и рыночное давление по city baseline.</p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas">
            <ArrowLeft size={16} /> Районы
          </Link>
          <button className="button primary" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Параметры</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>City</span>
              <input
                className="input"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Sort</span>
              <select
                className="select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Action</span>
              <button className="button" type="button" onClick={() => void load()}>
                <BarChart3 size={16} /> Рассчитать
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid" style={{ marginTop: 16 }}>
        <Metric
          label="City median m2"
          value={formatNullableMoney(comparison.city_median_price_per_m2)}
        />
        <Metric
          label="City avg DOM"
          value={
            comparison.city_average_days_on_market === null
              ? "-"
              : `${comparison.city_average_days_on_market} d`
          }
        />
        <Metric label="Active supply" value={numberValue(comparison.city_active_listings)} />
        <Metric label="Areas" value={numberValue(comparison.area_count)} />
      </section>

      {topAreas.length ? (
        <section className="grid-2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <h2>Top signals</h2>
            </div>
            <div className="panel-body">
              <ul className="section-list compact">
                {topAreas.map(({ label, area }) => (
                  <li key={`${label}-${area.area_id}`}>
                    <span className="status-pill info">{label}</span>
                    <strong>{area.name}</strong>
                    <small>
                      V {area.value_index}/100 · G {area.growth_index}/100 ·{" "}
                      {money(area.median_price_per_m2)}/m2
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <h2>Current baseline</h2>
            </div>
            <div className="panel-body">
              <div className="bar-list">
                {comparison.areas.slice(0, 4).map((area) => (
                  <div className="bar-row" key={area.area_id}>
                    <span>{area.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${area.value_index}%` }} />
                    </div>
                    <strong>{area.value_index}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Районы</h2>
          <span className="muted">{comparison.areas.length} rows</span>
        </div>
        <div className="panel-body">
          {comparison.areas.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Район</th>
                    <th>Label</th>
                    <th>Median m2</th>
                    <th>vs city</th>
                    <th>DOM</th>
                    <th>DOM vs city</th>
                    <th>Supply</th>
                    <th>Value</th>
                    <th>Growth</th>
                    <th>Liquidity</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Overheated</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.areas.map((area) => (
                    <tr key={area.area_id}>
                      <td>
                        <strong>{area.name}</strong>
                        <small>{area.summary}</small>
                      </td>
                      <td>
                        <span className={`status-pill ${labelTone(area.market_label)}`}>
                          {labelText(area.market_label)}
                        </span>
                      </td>
                      <td>{money(area.median_price_per_m2)}</td>
                      <td>{formatNullablePercent(area.price_per_m2_vs_city_pct)}</td>
                      <td>{area.average_days_on_market} d</td>
                      <td>{formatNullablePercent(area.days_on_market_vs_city_pct)}</td>
                      <td>
                        {numberValue(area.active_listings)}
                        <small>{percent(area.active_share_pct)}</small>
                      </td>
                      <td>{area.value_index}/100</td>
                      <td>{area.growth_index}/100</td>
                      <td>{area.liquidity_index}/100</td>
                      <td>{area.buyer_market_index}/100</td>
                      <td>{area.seller_market_index}/100</td>
                      <td>{area.overheated_index}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Нет районов для выбранного города.</div>
          )}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function topArea(comparison: AreaComparison, areaId: string | null, label: string) {
  if (!areaId) return null;
  const area = comparison.areas.find((item) => item.area_id === areaId);
  return area ? { label, area } : null;
}

function labelText(label: string) {
  if (label === "buyer_market") return "buyer";
  if (label === "seller_market") return "seller";
  if (label === "overheated") return "overheated";
  return "balanced";
}

function labelTone(label: string) {
  if (label === "buyer_market") return "info";
  if (label === "seller_market") return "healthy";
  if (label === "overheated") return "warning";
  return "queued";
}

function formatNullableMoney(value: number | null) {
  return value === null ? "-" : money(value);
}

function formatNullablePercent(value: number | null) {
  return value === null ? "-" : percent(value);
}
