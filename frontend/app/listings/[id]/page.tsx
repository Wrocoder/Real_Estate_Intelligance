"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
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
  type ListingAnalysis,
  type NewsArticleListItem,
  type ReportAudience,
} from "@/lib/api";
import { money, percent } from "@/lib/format";
import { decisionTone, scoreLabel } from "@/lib/scoreLabels";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;
  const [analysis, setAnalysis] = useState<ListingAnalysis | null>(null);
  const [areaNews, setAreaNews] = useState<NewsArticleListItem[]>([]);
  const [aiQuestions, setAIQuestions] = useState<AIQuestionDescriptor[]>([]);
  const [aiAudience, setAiAudience] = useState<ReportAudience>("buyer");
  const [selectedAIQuestion, setSelectedAIQuestion] = useState<AIQuestionCode>("summary");
  const [customAIQuestion, setCustomAIQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AIListingAnswer | null>(null);
  const [aiStatus, setAiStatus] = useState("AI assistant готов");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setStatus("Загрузка объекта...");
    try {
      const data = await api.getAnalysis(listingId);
      setAnalysis(data);
      setStatus("Аналитика обновлена");
      try {
        const news = await api.listNews({ area_id: data.listing.area_id, limit: 3 });
        setAreaNews(news);
      } catch {
        setAreaNews([]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }, [listingId]);

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
        setAiStatus("AI questions недоступны");
      }
    }

    void loadAIQuestions();
  }, []);

  const availableAIQuestions = useMemo(
    () => questionsForAudience(aiQuestions, aiAudience),
    [aiQuestions, aiAudience],
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
    await api.addFavorite(listingId, "Added from detail page");
    setStatus("Добавлено в избранное");
  }

  async function generateReport() {
    const report = await api.generateReport(listingId);
    setStatus(`Отчет сохранен: ${report.id}`);
  }

  async function generateAIAnswer() {
    setAiLoading(true);
    setAiError("");
    setAiStatus("AI answer строится...");
    try {
      const answer = await api.answerListingAIQuestion(listingId, {
        question_code: selectedAIQuestion,
        question: customAIQuestion.trim() || null,
        audience: aiAudience,
      });
      setAiAnswer(answer);
      setAiStatus(
        answer.refused
          ? "AI answer отклонен guardrail-правилом"
          : `AI answer сохранен: ${answer.usage_log_id ?? answer.subject_id}`,
      );
    } catch (caught) {
      setAiAnswer(null);
      setAiError(caught instanceof Error ? caught.message : "unknown error");
      setAiStatus("AI answer недоступен");
    } finally {
      setAiLoading(false);
    }
  }

  if (error) return <ErrorBlock message={error} />;
  if (!analysis) return <LoadingBlock label="Загрузка аналитики объекта" />;

  const { listing, scores, area_statistics: areaStats } = analysis;
  const verdictTone = decisionTone(scores);
  const developer = analysis.developer_reputation;
  const priceHistoryPoints = analysis.price_history.map((point) => ({
    label: point.observed_at,
    value: point.price,
    helper: `${money(point.price_per_m2)}/m2`,
  }));

  return (
    <>
      <header className="page-header">
        <div>
          <Link href="/" className="button">
            <ArrowLeft size={16} /> Назад
          </Link>
          <h1 style={{ marginTop: 14 }}>{listing.title}</h1>
          <p>
            {listing.address}, {listing.district}, {listing.municipality} ·{" "}
            {listing.market_type}
          </p>
        </div>
        <div className="toolbar">
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Обновить
          </button>
          <button className="button" type="button" onClick={() => void addFavorite()}>
            <Heart size={16} /> Favorite
          </button>
          <button className="button primary" type="button" onClick={() => void generateReport()}>
            <FileText size={16} /> Сохранить отчет
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Вердикт</span>
          <strong>{scoreLabel(scores.decision_label)}</strong>
        </div>
        <div className="metric">
          <span>Цена</span>
          <strong>{money(listing.price)}</strong>
        </div>
        <div className="metric">
          <span>Цена за m2</span>
          <strong>{money(listing.price_per_m2)}/m2</strong>
        </div>
        <div className="metric">
          <span>Fair price mid</span>
          <strong>{money(scores.fair_price_mid)}</strong>
        </div>
        <div className="metric">
          <span>Fair price confidence</span>
          <strong>{scores.fair_price_confidence_score}/100</strong>
        </div>
        <div className="metric">
          <span>Отклонение от fair mid</span>
          <strong>{percent(scores.price_delta_to_fair_mid_pct)}</strong>
        </div>
        <div className="metric">
          <span>Price label</span>
          <strong>{scoreLabel(scores.price_label)}</strong>
        </div>
        {listing.building_type ? (
          <div className="metric">
            <span>Тип здания</span>
            <strong>{formatAttribute(listing.building_type)}</strong>
          </div>
        ) : null}
        {listing.renovation_state ? (
          <div className="metric">
            <span>Состояние</span>
            <strong>{formatAttribute(listing.renovation_state)}</strong>
          </div>
        ) : null}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2 className="icon-title">
            <Brain size={16} /> AI assistant
          </h2>
          <span className="status-line">{aiStatus}</span>
        </div>
        <div className="panel-body ai-verdict-body">
          <div className="ai-verdict-controls listing-ai-controls">
            <div className="field">
              <span>Аудитория</span>
              <select
                className="select"
                value={aiAudience}
                onChange={(event) => setAiAudience(event.target.value as ReportAudience)}
              >
                <option value="buyer">Buyer</option>
                <option value="realtor">Realtor</option>
                <option value="investor">Investor</option>
              </select>
            </div>
            <div className="field">
              <span>Тема</span>
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
              <span>Вопрос</span>
              <input
                className="input"
                value={customAIQuestion}
                onChange={(event) => setCustomAIQuestion(event.target.value)}
                placeholder="Например: какие вопросы задать продавцу?"
              />
            </div>
            <button
              className="button primary"
              type="button"
              disabled={aiLoading}
              onClick={() => void generateAIAnswer()}
            >
              <Brain size={16} /> Ответить
            </button>
          </div>

          {aiError ? <ErrorBlock message={aiError} /> : null}

          {aiAnswer ? (
            <div className="ai-verdict-result">
              <div className="ai-verdict-summary">
                <div>
                  <span className={`status-pill ${aiAnswer.refused ? "warning" : "healthy"}`}>
                    {aiAnswer.refused ? "Refused" : "Source-grounded"}
                  </span>
                  <span className="status-pill info">{aiAnswer.question_code}</span>
                </div>
                <p>{aiAnswer.refusal_reason ?? aiAnswer.answer}</p>
              </div>

              <div className="ai-verdict-grid">
                <AssistantColumn title="Ключевые выводы" items={aiAnswer.key_points} />
                <div>
                  <h3 className="ai-verdict-heading">
                    <ShieldCheck size={15} /> Источники
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
                  <h3 className="ai-verdict-heading">Guardrails</h3>
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
            <p className="empty-state">AI answer появится после запроса.</p>
          )}
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Выводы по объекту</h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="panel-body">
            <ul className="section-list">
              {analysis.insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Аргументы для торга</h2>
            <ul className="section-list">
              {analysis.negotiation_arguments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>История цены</h2>
            <LineChart
              ariaLabel={`Price history for ${listing.title}`}
              points={priceHistoryPoints}
              valueFormatter={money}
            />
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Цена</th>
                  <th>Цена за m2</th>
                </tr>
              </thead>
              <tbody>
                {analysis.price_history.map((point) => (
                  <tr key={point.observed_at}>
                    <td>{point.observed_at}</td>
                    <td>{money(point.price)}</td>
                    <td>{money(point.price_per_m2)}/m2</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>Похожие объекты</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Объект</th>
                  <th>Район</th>
                  <th>Цена</th>
                  <th>m2</th>
                </tr>
              </thead>
              <tbody>
                {analysis.comparables.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/listings/${item.id}`}>{item.title}</Link>
                    </td>
                    <td>{item.district}</td>
                    <td>{money(item.price)}</td>
                    <td>{money(item.price_per_m2)}/m2</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Скоринг</h2>
            <div className="button-row">
              <span className={`status-pill ${verdictTone}`}>
                {scoreLabel(scores.decision_label)}
              </span>
              <span className="score-pill">DQ {listing.data_quality_score}</span>
            </div>
          </div>
          <div className="panel-body">
            <ScoreBars scores={scores} />
            {developer ? <DeveloperReputationBlock reputation={developer} /> : null}
            <h2>Район</h2>
            <ul className="section-list">
              <li>Медиана: {money(areaStats.median_price_per_m2)}/m2</li>
              <li>Активных объявлений: {areaStats.active_listings}</li>
              <li>Средняя экспозиция: {areaStats.average_days_on_market} дней</li>
              <li>Предложение 90 дней: {percent(areaStats.supply_change_90d_pct)}</li>
            </ul>
            <h2>Новости района</h2>
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
              <p className="empty-state">Для района пока нет привязанных новостей.</p>
            )}
            <h2>Готовый HTML</h2>
            <a
              className="button primary"
              href={objectReportUrl(listing.id)}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={16} /> Открыть отчет
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

function AssistantColumn({ title, items }: { title: string; items: string[] }) {
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

function questionsForAudience(
  questions: AIQuestionDescriptor[],
  audience: ReportAudience,
): AIQuestionDescriptor[] {
  if (questions.length === 0) {
    return [
      {
        code: "summary",
        label: "Object summary",
        description: "Short grounded decision summary.",
        supported_audiences: ["buyer", "realtor", "investor"],
      },
    ];
  }
  const supported = questions.filter((question) =>
    question.supported_audiences.includes(audience),
  );
  return supported.length > 0 ? supported : questions;
}

function formatAttribute(value: string) {
  return value.replaceAll("_", " ");
}

function DeveloperReputationBlock({ reputation }: { reputation: DeveloperReputation }) {
  return (
    <>
      <h2>Застройщик</h2>
      <ul className="section-list compact">
        <li>
          <Building2 size={16} /> {reputation.developer.name} ·{" "}
          <span className={`status-pill ${developerLabelTone(reputation.label)}`}>
            {developerLabelText(reputation.label)}
          </span>
        </li>
        <li>
          <Link className="button" href={`/developers/${reputation.developer.id}`}>
            Профиль застройщика
          </Link>
        </li>
        <li>
          Рейтинг {reputation.reputation_score}/100, уверенность{" "}
          {reputation.confidence_score}/100.
        </li>
        <li>
          Сдано проектов: {reputation.completed_projects_count}; активных:{" "}
          {reputation.active_projects_count}.
        </li>
        {reputation.risk_signals[0] ? <li>{reputation.risk_signals[0]}</li> : null}
        {reputation.positive_signals[0] ? <li>{reputation.positive_signals[0]}</li> : null}
      </ul>
    </>
  );
}

function developerLabelText(label: string) {
  return {
    strong: "сильный",
    good: "хороший",
    mixed: "смешанный",
    limited_data: "мало данных",
    risk_review: "проверить",
  }[label] ?? label;
}

function developerLabelTone(label: string) {
  if (label === "strong" || label === "good") return "healthy";
  if (label === "mixed" || label === "limited_data") return "warning";
  return "error";
}
