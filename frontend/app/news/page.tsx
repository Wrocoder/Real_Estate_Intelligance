"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, ExternalLink, Newspaper, RefreshCw, ShieldCheck } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type NewsArticle,
  type NewsArticleAISummary,
  type NewsArticleListItem,
  type NewsCategory,
} from "@/lib/api";

const CATEGORY_OPTIONS: Array<{ value: NewsCategory | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "market", label: "Market" },
  { value: "mortgage", label: "Mortgage" },
  { value: "tax", label: "Tax" },
  { value: "legal", label: "Legal" },
  { value: "developer", label: "Developer" },
  { value: "city_investment", label: "City investment" },
  { value: "transport", label: "Transport" },
  { value: "mpzp", label: "MPZP" },
];

export default function NewsPage() {
  const [category, setCategory] = useState<NewsCategory | "">("");
  const [articles, setArticles] = useState<NewsArticleListItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [aiSummary, setAiSummary] = useState<NewsArticleAISummary | null>(null);
  const [status, setStatus] = useState("Загрузка новостей...");
  const [aiStatus, setAiStatus] = useState("AI summary не создан");
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function loadArticles(nextCategory = category) {
    setError("");
    setStatus("Загрузка новостей...");
    try {
      const payload = await api.listNews({
        category: nextCategory || undefined,
        limit: 50,
      });
      setArticles(payload);
      const nextSelectedId =
        payload.find((article) => article.id === selectedId)?.id ?? payload[0]?.id ?? "";
      setSelectedId(nextSelectedId);
      setStatus(`Новостей: ${payload.length}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown news error");
      setStatus("Backend API недоступен");
    }
  }

  async function loadArticle(articleId: string) {
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
      setAiStatus("AI summary готов к генерации");
    } catch (caught) {
      setSelectedArticle(null);
      setError(caught instanceof Error ? caught.message : "unknown news detail error");
    }
  }

  async function generateSummary() {
    if (!selectedArticle) return;
    setAiLoading(true);
    setAiError("");
    setAiStatus("AI summary строится...");
    try {
      const payload = await api.summarizeNewsArticle(selectedArticle.id);
      setAiSummary(payload);
      setAiStatus(`AI summary сохранен: ${payload.usage_log_id ?? payload.article_id}`);
    } catch (caught) {
      setAiSummary(null);
      setAiError(caught instanceof Error ? caught.message : "unknown AI summary error");
      setAiStatus("AI summary недоступен");
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    void loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadArticle(selectedId);
  }, [selectedId]);

  const selectedListItem = useMemo(
    () => articles.find((article) => article.id === selectedId) ?? null,
    [articles, selectedId],
  );

  if (error && articles.length === 0) return <ErrorBlock message={error} />;
  if (articles.length === 0 && status.startsWith("Загрузка")) {
    return <LoadingBlock label="Загрузка новостей" />;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>News intelligence</h1>
          <p>Новости рынка, ипотеки, транспорта, MPZP и их влияние на районы.</p>
        </div>
        <div className="toolbar">
          <select
            className="select"
            value={category}
            onChange={(event) => {
              const nextCategory = event.target.value as NewsCategory | "";
              setCategory(nextCategory);
              void loadArticles(nextCategory);
            }}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="button primary" type="button" onClick={() => void loadArticles()}>
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </header>

      {error ? <ErrorBlock message={error} /> : null}

      <section className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Newspaper size={16} /> Articles
            </h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="panel-body listing-list">
            {articles.length === 0 ? (
              <div className="empty-state">Нет новостей для выбранного фильтра.</div>
            ) : (
              articles.map((article) => (
                <button
                  className="compare-option"
                  key={article.id}
                  type="button"
                  onClick={() => setSelectedId(article.id)}
                >
                  <span className={`status-pill ${impactTone(article.impact_level)}`}>
                    {article.category}
                  </span>
                  <span>
                    <strong>{article.title}</strong>
                    <small>{article.summary}</small>
                    <small>
                      {new Date(article.published_at).toLocaleDateString("pl-PL")} ·{" "}
                      {article.affected_districts.join(", ") || "all areas"}
                    </small>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h2>Article detail</h2>
            {selectedListItem ? (
              <span className={`status-pill ${impactTone(selectedListItem.impact_level)}`}>
                {selectedListItem.impact_level}
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
                  <span className="status-pill info">{selectedArticle.category}</span>
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
                    <ExternalLink size={16} /> Source
                  </a>
                ) : null}
              </>
            ) : (
              <div className="empty-state">Выбери новость.</div>
            )}
          </div>
        </aside>
      </section>

      {selectedArticle ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2 className="icon-title">
              <Brain size={16} /> AI news summary
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
                <Brain size={16} /> Summary
              </button>
            </div>

            {aiError ? <ErrorBlock message={aiError} /> : null}

            {aiSummary ? (
              <div className="ai-verdict-result">
                <div className="ai-verdict-summary">
                  <div>
                    <span className="status-pill healthy">Source-grounded</span>
                    <span className="status-pill info">{aiSummary.category}</span>
                  </div>
                  <p>{aiSummary.summary}</p>
                </div>
                <div className="ai-verdict-grid">
                  <SummaryColumn title="Key points" items={aiSummary.key_points} />
                  <SummaryColumn title="Area impact" items={aiSummary.area_impact} />
                  <div>
                    <h3 className="ai-verdict-heading">
                      <ShieldCheck size={15} /> Sources
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
                  <SummaryColumn title="Buyer notes" items={aiSummary.buyer_notes} />
                  <SummaryColumn title="Investor notes" items={aiSummary.investor_notes} />
                  <div>
                    <h3 className="ai-verdict-heading">Guardrails</h3>
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
              <p className="empty-state">AI summary появится после генерации.</p>
            )}
          </div>
        </section>
      ) : null}
    </>
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

function impactTone(impactLevel: string) {
  if (impactLevel === "positive") return "healthy";
  if (impactLevel === "negative") return "error";
  if (impactLevel === "mixed") return "warning";
  return "info";
}
