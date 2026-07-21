"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, FileText, RefreshCw, ShieldCheck } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type AICompareAnswer,
  type CompareItemMetrics,
  type CompareResponse,
  type DeveloperReputation,
  type ListingAnalysis,
  type ReportAudience,
  type RealtorClientShortlist,
} from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";
import { COMPARE_PAGE_COPY, type ComparePageCopy } from "@/lib/i18n";
import { scoreLabel } from "@/lib/scoreLabels";
import { useLocalePreference } from "@/lib/useLocalePreference";

type CompareStatusState =
  | { key: "loadingListings" }
  | { key: "listingsLoaded" }
  | { key: "backendUnavailable" }
  | { key: "comparing" }
  | { key: "compareCount"; count: number }
  | { key: "compareUnavailable" }
  | { key: "compareLimit" };

type AiStatusState =
  | { key: "aiNotCreated" }
  | { key: "aiReady" }
  | { key: "aiBuilding" }
  | { key: "aiRefused" }
  | { key: "aiSaved"; id: string }
  | { key: "aiUnavailable" };

type ShortlistStatusState =
  | { key: "shortlistNotCreated" }
  | { key: "shortlistReady" }
  | { key: "shortlistBuilding" }
  | { key: "shortlistCount"; count: number }
  | { key: "shortlistUnavailable" };

export default function ComparePage() {
  const { locale } = useLocalePreference();
  const copy = COMPARE_PAGE_COPY[locale];
  const [available, setAvailable] = useState<ListingAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [aiAudience, setAiAudience] = useState<ReportAudience>("buyer");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AICompareAnswer | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatusState>({ key: "aiNotCreated" });
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [shortlist, setShortlist] = useState<RealtorClientShortlist | null>(null);
  const [shortlistStatus, setShortlistStatus] = useState<ShortlistStatusState>({
    key: "shortlistNotCreated",
  });
  const [shortlistError, setShortlistError] = useState("");
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistForm, setShortlistForm] = useState({
    clientName: "",
    intro: "",
    includeSourceLinks: false,
  });
  const [status, setStatus] = useState<CompareStatusState>({ key: "loadingListings" });
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
      setStatus({ key: "loadingListings" });
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
        setStatus({ key: "listingsLoaded" });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "unknown error");
        setStatus({ key: "backendUnavailable" });
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
      setStatus({ key: "comparing" });
      try {
        const response = await api.compareListings(selectedIds);
        if (cancelled) return;
        setComparison(response);
        setAiAnswer(null);
        setAiError("");
        setAiStatus({ key: "aiReady" });
        setShortlist(null);
        setShortlistError("");
        setShortlistStatus({ key: "shortlistReady" });
        setStatus({ key: "compareCount", count: response.items.length });
      } catch (caught) {
        if (cancelled) return;
        setComparison(null);
        setAiAnswer(null);
        setAiStatus({ key: "aiUnavailable" });
        setShortlist(null);
        setShortlistStatus({ key: "shortlistUnavailable" });
        setError(caught instanceof Error ? caught.message : "unknown error");
        setStatus({ key: "compareUnavailable" });
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
        setStatus({ key: "compareLimit" });
        return current;
      }
      return [...current, listingId];
    });
  }

  async function generateAIVerdict() {
    if (!comparison || selectedIds.length < 2) return;

    setAiLoading(true);
    setAiError("");
    setAiStatus({ key: "aiBuilding" });
    try {
      const response = await api.answerCompareAIQuestion({
        listing_ids: selectedIds,
        audience: aiAudience,
        question: aiQuestion.trim() || null,
      });
      setAiAnswer(response);
      setAiStatus(
        response.refused
          ? { key: "aiRefused" }
          : { key: "aiSaved", id: response.usage_log_id ?? response.subject_id },
      );
    } catch (caught) {
      setAiAnswer(null);
      setAiError(caught instanceof Error ? caught.message : "unknown error");
      setAiStatus({ key: "aiUnavailable" });
    } finally {
      setAiLoading(false);
    }
  }

  async function generateClientShortlist() {
    if (!comparison || selectedIds.length < 2) return;

    setShortlistLoading(true);
    setShortlistError("");
    setShortlistStatus({ key: "shortlistBuilding" });
    try {
      const response = await api.buildRealtorClientShortlist({
        listing_ids: selectedIds,
        client_name: shortlistForm.clientName || null,
        intro: shortlistForm.intro || null,
        include_source_links: shortlistForm.includeSourceLinks,
      });
      setShortlist(response);
      setShortlistStatus({ key: "shortlistCount", count: response.items.length });
    } catch (caught) {
      setShortlist(null);
      setShortlistError(caught instanceof Error ? caught.message : "unknown error");
      setShortlistStatus({ key: "shortlistUnavailable" });
    } finally {
      setShortlistLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/">
            <BarChart3 size={16} /> {copy.actions.search}
          </Link>
          <button
            className="button"
            type="button"
            disabled={selectedIds.length < 2}
            onClick={() => setSelectedIds([...selectedIds])}
          >
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h2>{copy.sections.selector}</h2>
          <span className="status-line">{compareStatusText(copy, status)}</span>
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
                    {analysis.listing.district} · {money(analysis.listing.price, locale)} · I{" "}
                    {analysis.scores.investment_score} / R {analysis.scores.risk_score} ·{" "}
                    {scoreLabel(analysis.scores.decision_label, locale)}
                  </small>
                  {analysis.developer_reputation ? (
                    <small>
                      {copy.table.developer}:{" "}
                      <Link href={`/developers/${analysis.developer_reputation.developer.id}`}>
                        {analysis.developer_reputation.developer.name}
                      </Link>{" "}
                      · {analysis.developer_reputation.reputation_score}/100
                    </small>
                  ) : null}
                </span>
              </label>
            ))
          )}
        </div>
      </section>

      {error ? (
        <ErrorBlock message={error} />
      ) : selectedIds.length < 2 ? (
        <EmptyBlock label={copy.empty.selectMin} />
      ) : comparison === null || items.length === 0 ? (
        <LoadingBlock />
      ) : (
        <>
          <section className="metric-grid" style={{ marginBottom: 16 }}>
            <Metric
              label={copy.metrics.bestChoice}
              value={listingShort(items, comparison.summary.best_listing_id, copy)}
              detail={metricDetail(metricById.get(comparison.summary.best_listing_id), copy, locale)}
            />
            <Metric
              label={copy.metrics.belowFairPrice}
              value={listingShort(items, comparison.summary.best_value_listing_id, copy)}
              detail={fairDetail(metricById.get(comparison.summary.best_value_listing_id), copy, locale)}
            />
            <Metric
              label={copy.metrics.cheaperMonthly}
              value={listingShort(items, comparison.summary.lowest_monthly_payment_listing_id, copy)}
              detail={paymentDetail(
                metricById.get(comparison.summary.lowest_monthly_payment_listing_id),
                copy,
                locale,
              )}
            />
            <Metric
              label={copy.metrics.rentalSignal}
              value={listingShort(items, comparison.summary.strongest_rental_listing_id, copy)}
              detail={rentDetail(metricById.get(comparison.summary.strongest_rental_listing_id), copy, locale)}
            />
          </section>

          <section className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-header">
              <h2 className="icon-title">
                <Brain size={16} /> {copy.sections.aiVerdict}
              </h2>
              <span className="status-line">{aiStatusText(copy, aiStatus)}</span>
            </div>
            <div className="panel-body ai-verdict-body">
              <div className="ai-verdict-controls">
                <div className="field">
                  <span>{copy.fields.audience}</span>
                  <select
                    className="select"
                    value={aiAudience}
                    onChange={(event) => setAiAudience(event.target.value as ReportAudience)}
                  >
                    <option value="buyer">{copy.values.buyer}</option>
                    <option value="realtor">{copy.values.realtor}</option>
                    <option value="investor">{copy.values.investor}</option>
                  </select>
                </div>
                <div className="field">
                  <span>{copy.fields.question}</span>
                  <input
                    className="input"
                    value={aiQuestion}
                    onChange={(event) => setAiQuestion(event.target.value)}
                    placeholder={copy.placeholders.aiQuestion}
                  />
                </div>
                <button
                  className="button primary"
                  type="button"
                  disabled={aiLoading || selectedIds.length < 2}
                  onClick={() => void generateAIVerdict()}
                >
                  <Brain size={16} /> {copy.actions.getVerdict}
                </button>
              </div>

              {aiError ? <ErrorBlock message={aiError} /> : null}

              {aiAnswer ? (
                <div className="ai-verdict-result">
                  <div className="ai-verdict-summary">
                    <div>
                      <span className={`status-pill ${aiAnswer.refused ? "warning" : "healthy"}`}>
                        {aiAnswer.refused ? copy.values.refused : copy.values.sourceGrounded}
                      </span>
                      <span className="status-pill info">
                        {copy.values.winner}: {listingShort(items, aiAnswer.best_listing_id, copy)}
                      </span>
                    </div>
                    <p>{aiAnswer.refusal_reason ?? aiAnswer.answer}</p>
                  </div>

                  <div className="ai-verdict-grid">
                    <InsightColumn
                      title={copy.assistantColumn.keyPoints}
                      items={aiAnswer.key_points}
                      emptyLabel={copy.empty.noData}
                    />
                    <InsightColumn
                      title={copy.assistantColumn.tradeoffs}
                      items={aiAnswer.tradeoffs}
                      emptyLabel={copy.empty.noData}
                    />
                    <div>
                      <h3 className="ai-verdict-heading">
                        <ShieldCheck size={15} /> {copy.sections.sourcesAndLimits}
                      </h3>
                      <div className="ai-citation-list">
                        {aiAnswer.citations.slice(0, 5).map((citation, index) => (
                          <div className="ai-citation" key={`${citation.source_id}-${index}`}>
                            <strong>{citation.title}</strong>
                            <small>
                              {citation.source_type} · {citation.excerpt}
                            </small>
                          </div>
                        ))}
                      </div>
                      <div className="meta-row">
                        {aiAnswer.guardrails.map((guardrail, index) => (
                          <span className="status-pill" key={`${guardrail.code}-${index}`}>
                            {guardrail.code}
                          </span>
                        ))}
                      </div>
                      <small className="muted">{aiAnswer.disclaimer}</small>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="empty-state">{copy.empty.noAiAnswer}</p>
              )}
            </div>
          </section>

          <section className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-header">
              <h2 className="icon-title">
                <FileText size={16} /> {copy.sections.clientShortlist}
              </h2>
              <span className="status-line">{shortlistStatusText(copy, shortlistStatus)}</span>
            </div>
            <div className="panel-body ai-verdict-body">
              <div className="ai-verdict-controls client-shortlist-controls">
                <label className="field">
                  <span>{copy.fields.client}</span>
                  <input
                    className="input"
                    value={shortlistForm.clientName}
                    onChange={(event) =>
                      setShortlistForm({ ...shortlistForm, clientName: event.target.value })
                    }
                    placeholder={copy.placeholders.clientName}
                  />
                </label>
                <label className="field">
                  <span>{copy.fields.intro}</span>
                  <input
                    className="input"
                    value={shortlistForm.intro}
                    onChange={(event) =>
                      setShortlistForm({ ...shortlistForm, intro: event.target.value })
                    }
                    placeholder={copy.placeholders.intro}
                  />
                </label>
                <label className="field checkbox-field compact-checkbox-field">
                  <input
                    type="checkbox"
                    checked={shortlistForm.includeSourceLinks}
                    onChange={(event) =>
                      setShortlistForm({
                        ...shortlistForm,
                        includeSourceLinks: event.target.checked,
                      })
                    }
                  />
                  <span>{copy.values.sourceLinks}</span>
                </label>
                <button
                  className="button primary"
                  type="button"
                  disabled={shortlistLoading || selectedIds.length < 2}
                  onClick={() => void generateClientShortlist()}
                >
                  <FileText size={16} /> {copy.actions.buildShortlist}
                </button>
              </div>

              {shortlistError ? <ErrorBlock message={shortlistError} /> : null}

              {shortlist ? (
                <div className="digest-layout">
                  <div>
                    <h3>{shortlist.subject}</h3>
                    <p className="muted">{shortlist.summary}</p>
                    <textarea
                      className="input digest-message"
                      readOnly
                      value={shortlist.client_message}
                    />
                  </div>
                  <div className="grid-3">
                    {shortlist.items.map((item) => (
                      <article className="metric" key={item.listing_id}>
                        <span>
                          {copy.values.rank(item.rank)} · {item.district}
                        </span>
                        <strong>
                          {item.decision_score}/100 · {scoreLabel(item.decision_label, locale)}
                        </strong>
                        <small className="muted" style={{ display: "block", marginTop: 8 }}>
                          {item.client_pitch}
                        </small>
                        <div className="meta-row">
                          <span>{money(item.price, locale)}</span>
                          <span>
                            {money(item.estimated_monthly_payment_pln, locale)}/
                            {copy.values.monthly}
                          </span>
                          <span>
                            {numberValue(item.estimated_gross_rental_yield_pct, locale)}%{" "}
                            {copy.values.rent}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                  <p className="muted">{shortlist.disclaimer}</p>
                </div>
              ) : (
                <p className="empty-state">{copy.empty.noShortlist}</p>
              )}
            </div>
          </section>

          <section className="grid-3" style={{ marginBottom: 16 }}>
            {comparison.metrics.map((metric) => {
              const item = items.find((analysis) => analysis.listing.id === metric.listing_id);
              return (
                <article className="metric" key={metric.listing_id}>
                  <span>
                    {copy.values.rank(metric.rank)} ·{" "}
                    {item ? item.listing.district : metric.listing_id}
                  </span>
                  <strong>
                    {metric.decision_score}/100 · {scoreLabel(metric.decision_label, locale)}
                  </strong>
                  <small className="muted" style={{ display: "block", marginTop: 8 }}>
                    {metric.recommendation}
                  </small>
                  <div className="meta-row">
                    <span>
                      {money(metric.estimated_monthly_payment_pln, locale)}/{copy.values.monthly}
                    </span>
                    <span>
                      {metric.liquidity_score}/100 {copy.values.liquidity}
                    </span>
                    <span>
                      {metric.rental_potential_score}/100 {copy.values.rent}
                    </span>
                  </div>
                  {item?.developer_reputation ? (
                    <div className="meta-row">
                      <span className={`status-pill ${developerTone(item.developer_reputation)}`}>
                        {developerLabel(item.developer_reputation, copy)}
                      </span>
                      <Link href={`/developers/${item.developer_reputation.developer.id}`}>
                        {item.developer_reputation.developer.name}
                      </Link>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>{copy.sections.comparisonMatrix}</h2>
              <span className="muted">
                {copy.statuses.compareCount(items.length)} ·{" "}
                {copy.values.mortgageAssumptions(
                  comparison.mortgage_assumptions.down_payment_pct,
                  comparison.mortgage_assumptions.loan_years,
                  comparison.mortgage_assumptions.annual_interest_rate_pct,
                )}
              </span>
            </div>
            <div className="table-scroll">
              <table className="table compare-table">
                <thead>
                  <tr>
                    <th>{copy.table.metric}</th>
                    {items.map((item) => (
                      <th key={item.listing.id}>
                        <Link href={`/listings/${item.listing.id}`}>{item.listing.title}</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows(items, metricById, copy, locale).map((row) => (
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

function InsightColumn({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
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

function comparisonRows(
  items: ListingAnalysis[],
  metricById: Map<string, CompareItemMetrics>,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return [
    {
      id: "location",
      label: copy.table.location,
      values: items.map((item) => `${item.listing.district}, ${item.listing.address}`),
    },
    {
      id: "price",
      label: copy.table.price,
      values: items.map((item) => money(item.listing.price, locale)),
    },
    {
      id: "price-per-m2",
      label: copy.table.pricePerM2,
      values: items.map((item) => `${money(item.listing.price_per_m2, locale)}/m2`),
    },
    {
      id: "area-rooms",
      label: copy.table.areaRooms,
      values: items.map(
        (item) => `${numberValue(item.listing.area_m2, locale)} m2 · ${copy.values.roomsShort(item.listing.rooms)}`,
      ),
    },
    {
      id: "days-on-market",
      label: copy.table.daysOnMarket,
      values: items.map((item) => numberValue(item.listing.days_on_market, locale)),
    },
    {
      id: "decision-score",
      label: copy.table.decisionScore,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${copy.values.rank(metric.rank)} · ${metric.decision_score}/100 · ${scoreLabel(
              metric.decision_label,
              locale,
            )}`
          : "-";
      }),
    },
    {
      id: "decision-label",
      label: copy.table.verdict,
      values: items.map((item) => scoreLabel(item.scores.decision_label, locale)),
    },
    {
      id: "developer",
      label: copy.table.developer,
      values: items.map((item) => developerSummary(item.developer_reputation, copy)),
    },
    {
      id: "developer-risk",
      label: copy.table.developerRisk,
      values: items.map((item) => developerRiskSummary(item.developer_reputation, copy)),
    },
    {
      id: "developer-check",
      label: copy.table.developerCheck,
      values: items.map((item) => developerCheckSummary(item.developer_reputation, copy)),
    },
    {
      id: "mortgage-payment",
      label: copy.table.mortgagePayment,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${money(metric.estimated_monthly_payment_pln, locale)}/${copy.values.monthly} · ${
              copy.values.loan
            } ${money(metric.loan_amount_pln, locale)}`
          : "-";
      }),
    },
    {
      id: "cash-needed",
      label: copy.table.cashNeeded,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${money(metric.upfront_cash_needed_pln, locale)} · ${copy.values.cash} ${money(
              metric.down_payment_pln,
              locale,
            )}`
          : "-";
      }),
    },
    {
      id: "rental-estimate",
      label: copy.table.rentalEstimate,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${numberValue(metric.estimated_gross_rental_yield_pct, locale)}% ${
              copy.values.gross
            } · ${money(metric.estimated_monthly_rent_pln, locale)}/${copy.values.monthly}`
          : "-";
      }),
    },
    {
      id: "price-label",
      label: copy.table.priceLabel,
      values: items.map((item) => scoreLabel(item.scores.price_label, locale)),
    },
    {
      id: "investment-score",
      label: copy.table.investmentScore,
      values: items.map((item) => `${item.scores.investment_score}/100`),
    },
    {
      id: "risk-score",
      label: copy.table.riskScore,
      values: items.map(
        (item) =>
          `${item.scores.risk_score}/100 · ${scoreLabel(item.scores.risk_label, locale)}`,
      ),
    },
    {
      id: "negotiation-score",
      label: copy.table.negotiationScore,
      values: items.map(
        (item) =>
          `${item.scores.negotiation_score}/100 · ${scoreLabel(
            item.scores.negotiation_label,
            locale,
          )}`,
      ),
    },
    {
      id: "liquidity-score",
      label: copy.table.liquidity,
      values: items.map(
        (item) =>
          `${item.scores.liquidity_score}/100 · ${scoreLabel(
            item.scores.liquidity_label,
            locale,
          )}`,
      ),
    },
    {
      id: "rental-potential-score",
      label: copy.table.rentalPotential,
      values: items.map(
        (item) =>
          `${item.scores.rental_potential_score}/100 · ${scoreLabel(
            item.scores.rental_potential_label,
            locale,
          )}`,
      ),
    },
    {
      id: "fair-price-range",
      label: copy.table.fairPrice,
      values: items.map(
        (item) =>
          `${money(item.scores.fair_price_low, locale)} - ${money(
            item.scores.fair_price_high,
            locale,
          )}`,
      ),
    },
    {
      id: "fair-price-confidence",
      label: copy.table.fairPriceConfidence,
      values: items.map((item) => `${item.scores.fair_price_confidence_score}/100`),
    },
    {
      id: "fair-price-delta",
      label: copy.table.fairPriceDelta,
      values: items.map((item) => percent(item.scores.price_delta_to_fair_mid_pct, locale)),
    },
    {
      id: "discount-to-fair",
      label: copy.table.discountToFair,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric ? money(metric.estimated_discount_to_fair_mid_pln, locale) : "-";
      }),
    },
    {
      id: "transport",
      label: copy.table.transport,
      values: items.map((item) => copy.values.metersToStop(item.listing.nearest_stop_m)),
    },
    {
      id: "infrastructure",
      label: copy.table.infrastructure,
      values: items.map((item) =>
        copy.values.schoolsParks(item.listing.schools_within_1km, item.listing.parks_within_1km),
      ),
    },
    {
      id: "planned-investments",
      label: copy.table.plannedInvestments,
      values: items.map((item) =>
        copy.values.plannedInvestments(item.listing.planned_investments_within_2km),
      ),
    },
    {
      id: "negotiation-argument",
      label: copy.table.negotiationArgument,
      values: items.map((item) => item.negotiation_arguments[0] ?? "-"),
    },
    {
      id: "main-risk",
      label: copy.table.mainRisk,
      values: items.map((item) => item.scores.warnings[0] ?? copy.empty.noWarnings),
    },
    {
      id: "recommendation",
      label: copy.table.recommendation,
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

function compareStatusText(copy: ComparePageCopy, state: CompareStatusState) {
  switch (state.key) {
    case "compareCount":
      return copy.statuses.compareCount(state.count);
    default:
      return copy.statuses[state.key];
  }
}

function aiStatusText(copy: ComparePageCopy, state: AiStatusState) {
  switch (state.key) {
    case "aiSaved":
      return copy.statuses.aiSaved(state.id);
    default:
      return copy.statuses[state.key];
  }
}

function shortlistStatusText(copy: ComparePageCopy, state: ShortlistStatusState) {
  switch (state.key) {
    case "shortlistCount":
      return copy.statuses.shortlistCount(state.count);
    default:
      return copy.statuses[state.key];
  }
}

function developerSummary(reputation: DeveloperReputation | null, copy: ComparePageCopy) {
  if (!reputation) return copy.empty.noDeveloper;
  return `${reputation.developer.name} · ${reputation.reputation_score}/100 · confidence ${reputation.confidence_score}/100`;
}

function developerRiskSummary(reputation: DeveloperReputation | null, copy: ComparePageCopy) {
  if (!reputation) return copy.empty.noDeveloperRisk;
  return (
    reputation.risk_signals[0] ??
    reputation.positive_signals[0] ??
    `${reputation.completed_projects_count} completed · ${reputation.active_projects_count} active`
  );
}

function developerCheckSummary(reputation: DeveloperReputation | null, copy: ComparePageCopy) {
  if (!reputation) return copy.empty.manualDeveloperCheck;
  return reputation.due_diligence_questions[0] ?? copy.empty.developerDueDiligence;
}

function developerLabel(reputation: DeveloperReputation, copy: ComparePageCopy) {
  return copy.developerLabels[reputation.label] ?? reputation.label;
}

function developerTone(reputation: DeveloperReputation) {
  if (reputation.label === "strong" || reputation.label === "good") return "healthy";
  if (reputation.label === "mixed" || reputation.label === "limited_data") return "warning";
  return "error";
}

function listingShort(items: ListingAnalysis[], listingId: string, copy: ComparePageCopy) {
  const item = items.find((analysis) => analysis.listing.id === listingId);
  if (!item) return listingId;
  return `${item.listing.district}, ${copy.values.roomsShort(item.listing.rooms)}`;
}

function metricDetail(
  metric: CompareItemMetrics | undefined,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return metric
    ? `${metric.decision_score}/100 · ${money(metric.estimated_monthly_payment_pln, locale)}/${
        copy.values.monthly
      }`
    : "";
}

function fairDetail(
  metric: CompareItemMetrics | undefined,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return metric
    ? `${percent(metric.price_delta_to_fair_mid_pct, locale)} ${copy.values.fair} · ${money(
        metric.estimated_discount_to_fair_mid_pln,
        locale,
      )} ${copy.values.negotiation}`
    : "";
}

function paymentDetail(
  metric: CompareItemMetrics | undefined,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return metric
    ? `${money(metric.estimated_monthly_payment_pln, locale)}/${copy.values.monthly} · ${money(
        metric.upfront_cash_needed_pln,
        locale,
      )} ${copy.values.cash}`
    : "";
}

function rentDetail(
  metric: CompareItemMetrics | undefined,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return metric
    ? `${numberValue(metric.estimated_gross_rental_yield_pct, locale)}% · ${money(
        metric.estimated_monthly_rent_pln,
        locale,
      )}/${copy.values.monthly}`
    : "";
}
