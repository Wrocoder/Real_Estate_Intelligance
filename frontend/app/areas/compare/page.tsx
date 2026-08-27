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
import { AREA_COMPARE_PAGE_COPY, type AreaComparePageCopy, type Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const SORT_OPTIONS = [
  "value",
  "growth",
  "buyer_market",
  "seller_market",
  "liquidity",
  "price_asc",
  "price_desc",
] as const;

export default function AreaComparisonPage() {
  const { locale } = useLocalePreference();
  const copy = AREA_COMPARE_PAGE_COPY[locale];
  const [city, setCity] = useState("Wrocław");
  const [sort, setSort] = useState("value");
  const [comparison, setComparison] = useState<AreaComparison | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [areaSummary, setAreaSummary] = useState<AreaImpactSummary | null>(null);
  const [status, setStatus] = useState(copy.statuses.loadingComparison);
  const [aiStatus, setAiStatus] = useState(copy.statuses.aiNotCreated);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function load() {
    setError("");
    setStatus(copy.statuses.loadingComparison);
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
      setAiStatus(copy.statuses.aiReady);
      setStatus(copy.statuses.ready);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.statuses.unknownComparisonError);
      setStatus(copy.statuses.backendUnavailable);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topAreas = useMemo(() => {
    if (!comparison) return [];
    return [
      topArea(comparison, comparison.top_value_area_id, copy.labels.topSignal.value),
      topArea(comparison, comparison.top_growth_area_id, copy.labels.topSignal.growth),
      topArea(
        comparison,
        comparison.top_buyer_market_area_id,
        copy.labels.topSignal.buyerMarket,
      ),
      topArea(comparison, comparison.top_liquidity_area_id, copy.labels.topSignal.liquidity),
    ].filter((item): item is { label: string; area: AreaComparisonItem } => item !== null);
  }, [comparison, copy]);

  async function generateAreaSummary() {
    if (!selectedAreaId) return;
    setAiLoading(true);
    setAiError("");
    setAiStatus(copy.statuses.aiBuilding);
    try {
      const payload = await api.summarizeAreaImpact(selectedAreaId);
      setAreaSummary(payload);
      setAiStatus(copy.statuses.aiSaved(payload.usage_log_id ?? payload.area_id));
    } catch (caught) {
      setAreaSummary(null);
      setAiError(caught instanceof Error ? caught.message : copy.statuses.unknownSummaryError);
      setAiStatus(copy.statuses.aiUnavailable);
    } finally {
      setAiLoading(false);
    }
  }

  if (error) return <ErrorBlock message={error} prefix={copy.errorPrefix} />;
  if (!comparison) return <LoadingBlock label={copy.statuses.loadingAreaComparison} />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas">
            <ArrowLeft size={16} /> {copy.actions.areas}
          </Link>
          <button className="button primary" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{copy.sections.parameters}</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>{copy.fields.city}</span>
              <input
                className="input"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{copy.fields.sort}</span>
              <select
                className="select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {copy.labels.sort[option] ?? option}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>{copy.fields.action}</span>
              <button className="button" type="button" onClick={() => void load()}>
                <BarChart3 size={16} /> {copy.actions.calculate}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid" style={{ marginTop: 16 }}>
        <Metric
          label={copy.metrics.cityMedianM2}
          value={formatNullableMoney(comparison.city_median_price_per_m2, locale, copy)}
        />
        <Metric
          label={copy.metrics.cityAvgDom}
          value={
            comparison.city_average_days_on_market === null
              ? copy.values.noValue
              : copy.values.days(comparison.city_average_days_on_market)
          }
        />
        <Metric
          label={copy.metrics.activeSupply}
          value={numberValue(comparison.city_active_listings, locale)}
        />
        <Metric label={copy.metrics.areas} value={numberValue(comparison.area_count, locale)} />
      </section>

      {topAreas.length ? (
        <section className="grid-2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <h2>{copy.sections.topSignals}</h2>
            </div>
            <div className="panel-body">
              <ul className="section-list compact">
                {topAreas.map(({ label, area }) => (
                  <li key={`${label}-${area.area_id}`}>
                    <span className="status-pill info">{label}</span>
                    <strong>{area.name}</strong>
                    <small>
                      {copy.values.topSignalDetails(
                        area.value_index,
                        area.growth_index,
                        money(area.median_price_per_m2, locale),
                      )}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <h2>{copy.sections.currentBaseline}</h2>
            </div>
            <div className="panel-body">
              <div className="bar-list">
                {comparison.areas.slice(0, 4).map((area) => (
                  <div className="bar-row" key={area.area_id}>
                    <span>{area.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${area.value_index}%` }} />
                    </div>
                    <strong>{numberValue(area.value_index, locale)}</strong>
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
            <Brain size={16} /> {copy.sections.aiSummary}
          </h2>
          <span className="status-line">{aiStatus}</span>
        </div>
        <div className="panel-body ai-verdict-body">
          <div className="ai-verdict-controls">
            <div className="field">
              <span>{copy.fields.area}</span>
              <select
                className="select"
                value={selectedAreaId}
                onChange={(event) => {
                  setSelectedAreaId(event.target.value);
                  setAreaSummary(null);
                  setAiError("");
                  setAiStatus(copy.statuses.aiReady);
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
              <span>{copy.fields.scope}</span>
              <input
                className="input"
                readOnly
                value={copy.values.scope}
              />
            </div>
            <button
              className="button primary"
              disabled={aiLoading || !selectedAreaId}
              type="button"
              onClick={() => void generateAreaSummary()}
            >
              <Brain size={16} /> {copy.actions.summary}
            </button>
          </div>

          {aiError ? <ErrorBlock message={aiError} prefix={copy.errorPrefix} /> : null}

          {areaSummary ? (
            <div className="ai-verdict-result">
              <div className="ai-verdict-summary">
                <div>
                  <span className="status-pill healthy">{copy.values.sourceGrounded}</span>
                  <span className="status-pill info">{areaSummary.posture}</span>
                  <span className="status-pill">
                    {copy.values.indexSummary(
                      areaSummary.value_index,
                      areaSummary.growth_index,
                    )}
                  </span>
                </div>
                <p>{areaSummary.summary}</p>
              </div>

              <div className="ai-verdict-grid">
                <SummaryColumn
                  emptyLabel={copy.values.noData}
                  title={copy.sections.positiveSignals}
                  items={areaSummary.positive_signals}
                />
                <SummaryColumn
                  emptyLabel={copy.values.noData}
                  title={copy.sections.riskSignals}
                  items={areaSummary.risk_signals}
                />
                <div>
                  <h3 className="ai-verdict-heading">
                    <ShieldCheck size={15} /> {copy.sections.sources}
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
                <SummaryColumn
                  emptyLabel={copy.values.noData}
                  title={copy.sections.buyerNotes}
                  items={areaSummary.buyer_notes}
                />
                <SummaryColumn
                  emptyLabel={copy.values.noData}
                  title={copy.sections.investorNotes}
                  items={areaSummary.investor_notes}
                />
                <div>
                  <h3 className="ai-verdict-heading">{copy.sections.guardrails}</h3>
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
            <p className="empty-state">{copy.empty.aiPrompt}</p>
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{copy.sections.areas}</h2>
          <span className="muted">{copy.values.rows(comparison.areas.length)}</span>
        </div>
        <div className="panel-body">
          {comparison.areas.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.table.area}</th>
                    <th>{copy.table.label}</th>
                    <th>{copy.table.medianM2}</th>
                    <th>{copy.table.vsCity}</th>
                    <th>{copy.table.dom}</th>
                    <th>{copy.table.domVsCity}</th>
                    <th>{copy.table.supply}</th>
                    <th>{copy.table.value}</th>
                    <th>{copy.table.growth}</th>
                    <th>{copy.table.liquidity}</th>
                    <th>{copy.table.buyer}</th>
                    <th>{copy.table.seller}</th>
                    <th>{copy.table.overheated}</th>
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
                          {labelText(area.market_label, copy)}
                        </span>
                      </td>
                      <td>{money(area.median_price_per_m2, locale)}</td>
                      <td>{formatNullablePercent(area.price_per_m2_vs_city_pct, locale, copy)}</td>
                      <td>{copy.values.days(area.average_days_on_market)}</td>
                      <td>{formatNullablePercent(area.days_on_market_vs_city_pct, locale, copy)}</td>
                      <td>
                        {numberValue(area.active_listings, locale)}
                        <small>{percent(area.active_share_pct, locale)}</small>
                      </td>
                      <td>{copy.values.score(area.value_index)}</td>
                      <td>{copy.values.score(area.growth_index)}</td>
                      <td>{copy.values.score(area.liquidity_index)}</td>
                      <td>{copy.values.score(area.buyer_market_index)}</td>
                      <td>{copy.values.score(area.seller_market_index)}</td>
                      <td>{copy.values.score(area.overheated_index)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">{copy.empty.noAreas}</div>
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

function SummaryColumn({
  emptyLabel,
  title,
  items,
}: {
  emptyLabel: string;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h3 className="ai-verdict-heading">{title}</h3>
      {items.length === 0 ? (
        <p className="muted">{emptyLabel}</p>
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

function labelText(label: string, copy: AreaComparePageCopy) {
  return copy.labels.market[label] ?? copy.labels.market.balanced;
}

function labelTone(label: string) {
  if (label === "buyer_market") return "info";
  if (label === "seller_market") return "healthy";
  if (label === "overheated") return "warning";
  return "queued";
}

function formatNullableMoney(
  value: number | null,
  locale: Locale,
  copy: AreaComparePageCopy,
) {
  return value === null ? copy.values.noValue : money(value, locale);
}

function formatNullablePercent(
  value: number | null,
  locale: Locale,
  copy: AreaComparePageCopy,
) {
  return value === null ? copy.values.noValue : percent(value, locale);
}
