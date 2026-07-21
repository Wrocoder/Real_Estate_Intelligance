"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  BookOpen,
  Building2,
  FileText,
  Heart,
  Newspaper,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { LineChart } from "@/components/Charts";
import { ScoreBars } from "@/components/ScoreBars";
import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  objectReportUrl,
  type AIListingAnswer,
  type AIQuestionCode,
  type AIQuestionDescriptor,
  type DeveloperReputation,
  type Listing,
  type ListingAnalysis,
  type NewsArticleListItem,
  type ReportAudience,
} from "@/lib/api";
import { dateValue, money, percent } from "@/lib/format";
import { LISTING_CARD_COPY, LISTING_DETAIL_COPY, type ListingDetailCopy } from "@/lib/i18n";
import { decisionTone, scoreLabel } from "@/lib/scoreLabels";
import { SEO_GUIDES } from "@/lib/seoGuides";
import { useLocalePreference } from "@/lib/useLocalePreference";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;
  const { locale } = useLocalePreference();
  const copy = LISTING_DETAIL_COPY[locale];
  const attributeLabels = LISTING_CARD_COPY[locale].attributes;
  const [analysis, setAnalysis] = useState<ListingAnalysis | null>(null);
  const [areaNews, setAreaNews] = useState<NewsArticleListItem[]>([]);
  const [aiQuestions, setAIQuestions] = useState<AIQuestionDescriptor[]>([]);
  const [aiAudience, setAiAudience] = useState<ReportAudience>("buyer");
  const [selectedAIQuestion, setSelectedAIQuestion] = useState<AIQuestionCode>("summary");
  const [customAIQuestion, setCustomAIQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AIListingAnswer | null>(null);
  const [aiStatus, setAiStatus] = useState(copy.statuses.aiReady);
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setStatus(copy.statuses.loadingObject);
    try {
      const data = await api.getAnalysis(listingId);
      setAnalysis(data);
      setStatus(copy.statuses.analyticsUpdated);
      try {
        const news = await api.listNews({ area_id: data.listing.area_id, limit: 3 });
        setAreaNews(news);
      } catch {
        setAreaNews([]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.backendUnavailable);
    }
  }, [copy, listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    async function loadAIQuestions() {
      try {
        const data = await api.listAIQuestions();
        setAIQuestions(data);
      } catch (caught) {
        setAiError(caught instanceof Error ? caught.message : "AI questions unavailable");
        setAiStatus(copy.statuses.aiQuestionsUnavailable);
      }
    }

    void loadAIQuestions();
  }, [copy.statuses.aiQuestionsUnavailable]);

  const availableAIQuestions = useMemo(
    () => questionsForAudience(aiQuestions, aiAudience, copy),
    [aiQuestions, aiAudience, copy],
  );

  useEffect(() => {
    if (
      availableAIQuestions.length > 0 &&
      !availableAIQuestions.some((question) => question.code === selectedAIQuestion)
    ) {
      setSelectedAIQuestion(availableAIQuestions[0].code);
    }
  }, [availableAIQuestions, selectedAIQuestion]);

  async function addFavorite() {
    await api.addFavorite(listingId, copy.favoriteNote);
    setStatus(copy.statuses.favoriteAdded);
  }

  async function generateReport() {
    const report = await api.generateReport(listingId);
    setStatus(copy.statuses.reportSaved(report.id));
  }

  async function generateAIAnswer() {
    setAiLoading(true);
    setAiError("");
    setAiStatus(copy.statuses.aiBuilding);
    try {
      const answer = await api.answerListingAIQuestion(listingId, {
        question_code: selectedAIQuestion,
        question: customAIQuestion.trim() || null,
        audience: aiAudience,
      });
      setAiAnswer(answer);
      setAiStatus(
        answer.refused
          ? copy.statuses.aiRefused
          : copy.statuses.aiSaved(answer.usage_log_id ?? answer.subject_id),
      );
    } catch (caught) {
      setAiAnswer(null);
      setAiError(caught instanceof Error ? caught.message : "unknown error");
      setAiStatus(copy.statuses.aiUnavailable);
    } finally {
      setAiLoading(false);
    }
  }

  if (error) return <ErrorBlock message={error} prefix={copy.errorPrefix} />;
  if (!analysis) return <LoadingBlock label={copy.empty.loadingAnalytics} />;

  const { listing, scores, area_statistics: areaStats } = analysis;
  const verdictTone = decisionTone(scores);
  const developer = analysis.developer_reputation;
  const priceHistoryPoints = analysis.price_history.map((point) => ({
    label: point.observed_at,
    value: point.price,
    helper: `${money(point.price_per_m2, locale)}/${copy.values.m2}`,
  }));

  return (
    <>
      <header className="page-header">
        <div>
          <Link href="/" className="button">
            <ArrowLeft size={16} /> {copy.actions.back}
          </Link>
          <h1 style={{ marginTop: 14 }}>{listing.title}</h1>
          <p>
            {listing.address}, {listing.district}, {listing.municipality} ·{" "}
            {listing.market_type}
          </p>
        </div>
        <div className="toolbar">
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
          <button className="button" type="button" onClick={() => void addFavorite()}>
            <Heart size={16} /> {copy.actions.favorite}
          </button>
          <button className="button primary" type="button" onClick={() => void generateReport()}>
            <FileText size={16} /> {copy.actions.saveReport}
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>{copy.metrics.verdict}</span>
          <strong>{scoreLabel(scores.decision_label, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.price}</span>
          <strong>{money(listing.price, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.pricePerM2}</span>
          <strong>
            {money(listing.price_per_m2, locale)}/{copy.values.m2}
          </strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.fairPriceMid}</span>
          <strong>{money(scores.fair_price_mid, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.fairPriceConfidence}</span>
          <strong>{scores.fair_price_confidence_score}/100</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.fairDeviation}</span>
          <strong>{percent(scores.price_delta_to_fair_mid_pct, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.priceLabel}</span>
          <strong>{scoreLabel(scores.price_label, locale)}</strong>
        </div>
        {listing.building_type ? (
          <div className="metric">
            <span>{copy.metrics.buildingType}</span>
            <strong>{formatAttribute(listing.building_type, attributeLabels)}</strong>
          </div>
        ) : null}
        {listing.renovation_state ? (
          <div className="metric">
            <span>{copy.metrics.renovationState}</span>
            <strong>{formatAttribute(listing.renovation_state, attributeLabels)}</strong>
          </div>
        ) : null}
        <div className="metric">
          <span>{copy.metrics.amenities}</span>
          <strong>{lifestyleSummary(listing, copy)}</strong>
        </div>
        {listing.parking_type ? (
          <div className="metric">
            <span>{copy.metrics.parking}</span>
            <strong>{formatAttribute(listing.parking_type, attributeLabels)}</strong>
          </div>
        ) : null}
        {listing.heating_type ? (
          <div className="metric">
            <span>{copy.metrics.heating}</span>
            <strong>{formatAttribute(listing.heating_type, attributeLabels)}</strong>
          </div>
        ) : null}
      </section>

      <p className="muted" style={{ marginTop: 12 }}>
        {analysis.disclaimer}
      </p>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2 className="icon-title">
            <Brain size={16} /> {copy.sections.aiAssistant}
          </h2>
          <span className="status-line">{aiStatus}</span>
        </div>
        <div className="panel-body ai-verdict-body">
          <div className="ai-verdict-controls listing-ai-controls">
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
              <span>{copy.fields.topic}</span>
              <select
                className="select"
                value={selectedAIQuestion}
                onChange={(event) => setSelectedAIQuestion(event.target.value as AIQuestionCode)}
              >
                {availableAIQuestions.map((question) => (
                  <option key={question.code} value={question.code}>
                    {question.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>{copy.fields.question}</span>
              <input
                className="input"
                value={customAIQuestion}
                onChange={(event) => setCustomAIQuestion(event.target.value)}
                placeholder={copy.placeholders.customQuestion}
              />
            </div>
            <button
              className="button primary"
              type="button"
              disabled={aiLoading}
              onClick={() => void generateAIAnswer()}
            >
              <Brain size={16} /> {copy.actions.answer}
            </button>
          </div>

          {aiError ? <ErrorBlock message={aiError} prefix={copy.errorPrefix} /> : null}

          {aiAnswer ? (
            <div className="ai-verdict-result">
              <div className="ai-verdict-summary">
                <div>
                  <span className={`status-pill ${aiAnswer.refused ? "warning" : "healthy"}`}>
                    {aiAnswer.refused ? copy.values.refused : copy.values.sourceGrounded}
                  </span>
                  <span className="status-pill info">{aiAnswer.question_code}</span>
                </div>
                <p>{aiAnswer.refusal_reason ?? aiAnswer.answer}</p>
              </div>

              <div className="ai-verdict-grid">
                <AssistantColumn
                  emptyLabel={copy.empty.noData}
                  items={aiAnswer.key_points}
                  title={copy.assistantColumn.keyPoints}
                />
                <div>
                  <h3 className="ai-verdict-heading">
                    <ShieldCheck size={15} /> {copy.assistantColumn.sources}
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
                </div>
                <div>
                  <h3 className="ai-verdict-heading">{copy.assistantColumn.guardrails}</h3>
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

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>{copy.sections.insights}</h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="panel-body">
            <ul className="section-list">
              {analysis.insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>{copy.sections.negotiation}</h2>
            <ul className="section-list">
              {analysis.negotiation_arguments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>{copy.sections.priceHistory}</h2>
            <LineChart
              ariaLabel={copy.chart.priceHistoryAria(listing.title)}
              points={priceHistoryPoints}
              valueFormatter={(value) => money(value, locale)}
            />
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.table.date}</th>
                    <th>{copy.table.price}</th>
                    <th>{copy.table.pricePerM2}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.price_history.map((point) => (
                    <tr key={point.observed_at}>
                      <td>{dateValue(point.observed_at, locale)}</td>
                      <td>{money(point.price, locale)}</td>
                      <td>
                        {money(point.price_per_m2, locale)}/{copy.values.m2}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>{copy.sections.comparables}</h2>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.table.object}</th>
                    <th>{copy.table.district}</th>
                    <th>{copy.table.price}</th>
                    <th>{copy.table.area}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.comparables.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/listings/${item.id}`}>{item.title}</Link>
                      </td>
                      <td>{item.district}</td>
                      <td>{money(item.price, locale)}</td>
                      <td>
                        {money(item.price_per_m2, locale)}/{copy.values.m2}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.sections.scoring}</h2>
            <div className="button-row">
              <span className={`status-pill ${verdictTone}`}>
                {scoreLabel(scores.decision_label, locale)}
              </span>
              <span className="score-pill">
                {copy.values.dataQualityPrefix} {listing.data_quality_score}
              </span>
            </div>
          </div>
          <div className="panel-body">
            <ScoreBars locale={locale} scores={scores} />
            {developer ? (
              <DeveloperReputationBlock copy={copy.developer} reputation={developer} />
            ) : null}
            <h2>{copy.sections.area}</h2>
            <ul className="section-list">
              <li>
                {copy.area.median(`${money(areaStats.median_price_per_m2, locale)}`)}
              </li>
              <li>{copy.area.activeListings(areaStats.active_listings)}</li>
              <li>{copy.area.averageExposure(areaStats.average_days_on_market)}</li>
              <li>{copy.area.supply90d(percent(areaStats.supply_change_90d_pct, locale))}</li>
            </ul>
            <h2>{copy.sections.areaNews}</h2>
            {areaNews.length > 0 ? (
              <ul className="section-list compact">
                {areaNews.map((article) => (
                  <li key={article.id}>
                    <Newspaper size={16} />{" "}
                    <Link href={`/news?area_id=${encodeURIComponent(listing.area_id)}`}>
                      {article.title}
                    </Link>
                    <small>
                      {article.category} · {article.impact_level}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">{copy.empty.noAreaNews}</p>
            )}
            <h2>{copy.sections.guides}</h2>
            <ul className="section-list compact">
              {SEO_GUIDES.slice(0, 3).map((guide) => (
                <li key={guide.slug}>
                  <BookOpen size={14} />{" "}
                  <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                </li>
              ))}
            </ul>
            <h2>{copy.sections.readyHtml}</h2>
            <a
              className="button primary"
              href={objectReportUrl(listing.id)}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={16} /> {copy.actions.openReport}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

function AssistantColumn({
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

function questionsForAudience(
  questions: AIQuestionDescriptor[],
  audience: ReportAudience,
  copy: ListingDetailCopy,
): AIQuestionDescriptor[] {
  if (questions.length === 0) {
    return [
      {
        code: "summary",
        label: copy.fallbackQuestion.label,
        description: copy.fallbackQuestion.description,
        supported_audiences: ["buyer", "realtor", "investor"],
      },
    ];
  }
  const supported = questions.filter((question) =>
    question.supported_audiences.includes(audience),
  );
  return supported.length > 0 ? supported : questions;
}

function formatAttribute(value: string, labels: Record<string, string>) {
  return labels[value] ?? value.replaceAll("_", " ");
}

function lifestyleSummary(listing: Listing, copy: ListingDetailCopy) {
  const items = [
    listing.has_balcony ? copy.lifestyle.balcony : "",
    listing.has_terrace ? copy.lifestyle.terrace : "",
    listing.has_garden ? copy.lifestyle.garden : "",
    listing.has_elevator ? copy.lifestyle.elevator : "",
  ].filter(Boolean);
  return items.length ? items.join(", ") : copy.empty.noConfirmedAmenities;
}

function DeveloperReputationBlock({
  copy,
  reputation,
}: {
  copy: ListingDetailCopy["developer"];
  reputation: DeveloperReputation;
}) {
  return (
    <>
      <h2>{copy.title}</h2>
      <ul className="section-list compact">
        <li>
          <Building2 size={16} /> {reputation.developer.name} ·{" "}
          <span className={`status-pill ${developerLabelTone(reputation.label)}`}>
            {copy.labels[reputation.label] ?? reputation.label}
          </span>
        </li>
        <li>
          <Link className="button" href={`/developers/${reputation.developer.id}`}>
            {copy.profile}
          </Link>
        </li>
        <li>{copy.ratingLine(reputation.reputation_score, reputation.confidence_score)}</li>
        <li>{copy.projectsLine(reputation.completed_projects_count, reputation.active_projects_count)}</li>
        {reputation.risk_signals[0] ? <li>{reputation.risk_signals[0]}</li> : null}
        {reputation.positive_signals[0] ? <li>{reputation.positive_signals[0]}</li> : null}
      </ul>
    </>
  );
}

function developerLabelTone(label: string) {
  if (label === "strong" || label === "good") return "healthy";
  if (label === "mixed" || label === "limited_data") return "warning";
  return "error";
}
