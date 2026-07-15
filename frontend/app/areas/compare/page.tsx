"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Brain, RefreshCw, ShieldCheck } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type AreaComparison,
  type AreaComparisonItem,
  type AreaImpactSummary,
} from "@/lib/api";
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
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [areaSummary, setAreaSummary] = useState<AreaImpactSummary | null>(null);
  const [status, setStatus] = useState("Загрузка сравнения...");
  const [aiStatus, setAiStatus] = useState("AI area summary не создан");
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

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
      setSelectedAreaId((current) => {
        if (current && payload.areas.some((area) => area.area_id === current)) {
          return current;
        }
        return payload.areas[0]?.area_id ?? "";
      });
      setAreaSummary(null);
      setAiError("");
      setAiStatus("AI area summary готов к генерации");
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

  async function generateAreaSummary() {
    if (!selectedAreaId) return;
    setAiLoading(true);
    setAiError("");
    setAiStatus("AI area summary строится...");
    try {
      const payload = await api.summarizeAreaImpact(selectedAreaId);
      setAreaSummary(payload);
      setAiStatus(`AI area summary сохранен: ${payload.usage_log_id ?? payload.area_id}`);
    } catch (caught) {
      setAreaSummary(null);
      setAiError(caught instanceof Error ? caught.message : "unknown area summary error");
      setAiStatus("AI area summary недоступен");
    } finally {
      setAiLoading(false);
    }
  }

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
          <h2 className="icon-title">
            <Brain size={16} /> AI area impact summary
          </h2>
          <span className="status-line">{aiStatus}</span>
        </div>
        <div className="panel-body ai-verdict-body">
          <div className="ai-verdict-controls">
            <div className="field">
              <span>Район</span>
              <select
                className="select"
                value={selectedAreaId}
                onChange={(event) => {
                  setSelectedAreaId(event.target.value);
                  setAreaSummary(null);
                  setAiError("");
                  setAiStatus("AI area summary готов к генерации");
                }}
              >
                {comparison.areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>Scope</span>
              <input
                className="input"
                readOnly
                value="market metrics, buyer/investor notes, planned investments"
              />
            </div>
            <button
              className="button primary"
              disabled={aiLoading || !selectedAreaId}
              type="button"
              onClick={() => void generateAreaSummary()}
            >
              <Brain size={16} /> Summary
            </button>
          </div>

          {aiError ? <ErrorBlock message={aiError} /> : null}

          {areaSummary ? (
            <div className="ai-verdict-result">
              <div className="ai-verdict-summary">
                <div>
                  <span className="status-pill healthy">Source-grounded</span>
                  <span className="status-pill info">{areaSummary.posture}</span>
                  <span className="status-pill">
                    V {areaSummary.value_index}/100 · G {areaSummary.growth_index}/100
                  </span>
                </div>
                <p>{areaSummary.summary}</p>
              </div>

              <div className="ai-verdict-grid">
                <SummaryColumn title="Positive signals" items={areaSummary.positive_signals} />
                <SummaryColumn title="Risk signals" items={areaSummary.risk_signals} />
                <div>
                  <h3 className="ai-verdict-heading">
                    <ShieldCheck size={15} /> Sources
                  </h3>
                  <div className="ai-citation-list">
                    {areaSummary.citations.map((citation, index) => (
                      <div className="ai-citation" key={`${citation.source_id}-${index}`}>
                        <strong>{citation.title}</strong>
                        <small>
                          {citation.source_type} · {citation.excerpt}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ai-verdict-grid">
                <SummaryColumn title="Buyer notes" items={areaSummary.buyer_notes} />
                <SummaryColumn title="Investor notes" items={areaSummary.investor_notes} />
                <div>
                  <h3 className="ai-verdict-heading">Guardrails</h3>
                  <div className="meta-row">
                    {areaSummary.guardrails.map((guardrail, index) => (
                      <span className="status-pill" key={`${guardrail.code}-${index}`}>
                        {guardrail.code}
                      </span>
                    ))}
                  </div>
                  <small className="muted">{areaSummary.disclaimer}</small>
                </div>
              </div>
            </div>
          ) : (
            <p className="empty-state">AI summary появится после генерации для выбранного района.</p>
          )}
        </div>
      </section>

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

function SummaryColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="ai-verdict-heading">{title}</h3>
      {items.length === 0 ? (
        <p className="muted">Нет данных.</p>
      ) : (
        <ul className="ai-verdict-list">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
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
