"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, ExternalLink, Newspaper, RefreshCw, ShieldCheck } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type NewsArticle,
  type NewsArticleAISummary,
  type NewsArticleListItem,
  type NewsCategory,
} from "@/lib/api";
import { dateValue } from "@/lib/format";
import { NEWS_PAGE_COPY } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const CATEGORY_OPTIONS: Array<NewsCategory | ""> = [
  "",
  "market",
  "mortgage",
  "tax",
  "legal",
  "developer",
  "city_investment",
  "transport",
  "mpzp",
];

export default function NewsPage() {
  const { locale } = useLocalePreference();
  const copy = NEWS_PAGE_COPY[locale];
  const [category, setCategory] = useState<NewsCategory | "">("");
  const [areaId, setAreaId] = useState("");
  const [articles, setArticles] = useState<NewsArticleListItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [aiSummary, setAiSummary] = useState<NewsArticleAISummary | null>(null);
  const [status, setStatus] = useState(copy.statuses.loading);
  const [aiStatus, setAiStatus] = useState(copy.statuses.aiNotCreated);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function loadArticles(nextCategory = category, nextAreaId = areaId) {
    setError("");
    setIsLoading(true);
    setStatus(copy.statuses.loading);
    try {
      const payload = await api.listNews({
        category: nextCategory || undefined,
        area_id: nextAreaId.trim() || undefined,
        limit: 50,
      });
      setArticles(payload);
      const nextSelectedId =
        payload.find((article) => article.id === selectedId)?.id ?? payload[0]?.id ?? "";
      setSelectedId(nextSelectedId);
      setStatus(copy.statuses.loaded(payload.length));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.statuses.unknownNewsError);
      setStatus(copy.statuses.backendUnavailable);
    } finally {
      setIsLoading(false);
    }
  }

  const loadArticle = useCallback(async (articleId: string) => {
    if (!articleId) {
      setSelectedArticle(null);
      return;
    }
    setError("");
    try {
      const payload = await api.getNewsArticle(articleId);
      setSelectedArticle(payload);
      setAiSummary(null);
      setAiError("");
      setAiStatus(copy.statuses.aiReady);
    } catch (caught) {
      setSelectedArticle(null);
      setError(caught instanceof Error ? caught.message : copy.statuses.unknownDetailError);
    }
  }, [copy]);

  async function generateSummary() {
    if (!selectedArticle) return;
    setAiLoading(true);
    setAiError("");
    setAiStatus(copy.statuses.aiBuilding);
    try {
      const payload = await api.summarizeNewsArticle(selectedArticle.id);
      setAiSummary(payload);
      setAiStatus(copy.statuses.aiSaved(payload.usage_log_id ?? payload.article_id));
    } catch (caught) {
      setAiSummary(null);
      setAiError(caught instanceof Error ? caught.message : copy.statuses.unknownAiError);
      setAiStatus(copy.statuses.aiUnavailable);
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialAreaId = params.get("area_id") ?? "";
    setAreaId(initialAreaId);
    void loadArticles(category, initialAreaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadArticle(selectedId);
  }, [loadArticle, selectedId]);

  const selectedListItem = useMemo(
    () => articles.find((article) => article.id === selectedId) ?? null,
    [articles, selectedId],
  );

  if (error && articles.length === 0) return <ErrorBlock message={error} prefix={copy.errorPrefix} />;
  if (articles.length === 0 && isLoading) {
    return <LoadingBlock label={copy.statuses.loadingNews} />;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="toolbar">
          <input
            className="input"
            placeholder={copy.placeholders.areaId}
            value={areaId}
            onChange={(event) => setAreaId(event.target.value)}
          />
          <select
            className="select"
            value={category}
            onChange={(event) => {
              const nextCategory = event.target.value as NewsCategory | "";
              setCategory(nextCategory);
              void loadArticles(nextCategory, areaId);
            }}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {copy.labels.category[option || "all"] ?? option}
              </option>
            ))}
          </select>
          <button className="button primary" type="button" onClick={() => void loadArticles()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      {error ? <ErrorBlock message={error} prefix={copy.errorPrefix} /> : null}

      <section className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Newspaper size={16} /> {copy.sections.articles}
            </h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="panel-body listing-list">
            {articles.length === 0 ? (
              <div className="empty-state">{copy.empty.noNews}</div>
            ) : (
              articles.map((article) => (
                <button
                  className="compare-option"
                  key={article.id}
                  type="button"
                  onClick={() => setSelectedId(article.id)}
                >
                  <span className={`status-pill ${impactTone(article.impact_level)}`}>
                    {copy.labels.category[article.category] ?? article.category}
                  </span>
                  <span>
                    <strong>{article.title}</strong>
                    <small>{article.summary}</small>
                    <small>
                      {dateValue(article.published_at, locale)} ·{" "}
                      {article.affected_districts.join(", ") || copy.values.allAreas}
                    </small>
                    {article.affected_area_ids.length > 0 ? (
                      <small>{copy.values.areaIds(article.affected_area_ids.join(", "))}</small>
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.sections.articleDetail}</h2>
            {selectedListItem ? (
              <span className={`status-pill ${impactTone(selectedListItem.impact_level)}`}>
                {copy.labels.impact[selectedListItem.impact_level] ?? selectedListItem.impact_level}
              </span>
            ) : null}
          </div>
          <div className="panel-body">
            {selectedArticle ? (
              <>
                <h2>{selectedArticle.title}</h2>
                <p className="muted">{selectedArticle.summary}</p>
                <p>{selectedArticle.body}</p>
                <div className="meta-row">
                  <span className="status-pill info">
                    {copy.labels.category[selectedArticle.category] ?? selectedArticle.category}
                  </span>
                  {selectedArticle.affected_districts.map((district) => (
                    <span className="status-pill" key={district}>
                      {district}
                    </span>
                  ))}
                </div>
                {selectedArticle.price_impact_hypothesis ? (
                  <p className="empty-state" style={{ marginTop: 12 }}>
                    {selectedArticle.price_impact_hypothesis}
                  </p>
                ) : null}
                {selectedArticle.source_url ? (
                  <a
                    className="button"
                    href={selectedArticle.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} /> {copy.actions.source}
                  </a>
                ) : null}
              </>
            ) : (
              <div className="empty-state">{copy.empty.chooseNews}</div>
            )}
          </div>
        </aside>
      </section>

      {selectedArticle ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2 className="icon-title">
              <Brain size={16} /> {copy.sections.aiSummary}
            </h2>
            <span className="status-line">{aiStatus}</span>
          </div>
          <div className="panel-body ai-verdict-body">
            <div className="toolbar">
              <button
                className="button primary"
                disabled={aiLoading}
                type="button"
                onClick={() => void generateSummary()}
              >
                <Brain size={16} /> {copy.actions.summary}
              </button>
            </div>

            {aiError ? <ErrorBlock message={aiError} prefix={copy.errorPrefix} /> : null}

            {aiSummary ? (
              <div className="ai-verdict-result">
                <div className="ai-verdict-summary">
                  <div>
                    <span className="status-pill healthy">{copy.values.sourceGrounded}</span>
                    <span className="status-pill info">
                      {copy.labels.category[aiSummary.category] ?? aiSummary.category}
                    </span>
                  </div>
                  <p>{aiSummary.summary}</p>
                </div>
                <div className="ai-verdict-grid">
                  <SummaryColumn
                    emptyLabel={copy.values.noData}
                    title={copy.sections.keyPoints}
                    items={aiSummary.key_points}
                  />
                  <SummaryColumn
                    emptyLabel={copy.values.noData}
                    title={copy.sections.areaImpact}
                    items={aiSummary.area_impact}
                  />
                  <div>
                    <h3 className="ai-verdict-heading">
                      <ShieldCheck size={15} /> {copy.sections.sources}
                    </h3>
                    <div className="ai-citation-list">
                      {aiSummary.citations.map((citation, index) => (
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
                    items={aiSummary.buyer_notes}
                  />
                  <SummaryColumn
                    emptyLabel={copy.values.noData}
                    title={copy.sections.investorNotes}
                    items={aiSummary.investor_notes}
                  />
                  <div>
                    <h3 className="ai-verdict-heading">{copy.sections.guardrails}</h3>
                    <div className="meta-row">
                      {aiSummary.guardrails.map((guardrail, index) => (
                        <span className="status-pill" key={`${guardrail.code}-${index}`}>
                          {guardrail.code}
                        </span>
                      ))}
                    </div>
                    <small className="muted">{aiSummary.disclaimer}</small>
                  </div>
                </div>
              </div>
            ) : (
              <p className="empty-state">{copy.empty.aiPrompt}</p>
            )}
          </div>
        </section>
      ) : null}
    </>
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

function impactTone(impactLevel: string) {
  if (impactLevel === "positive") return "healthy";
  if (impactLevel === "negative") return "error";
  if (impactLevel === "mixed") return "warning";
  return "info";
}
