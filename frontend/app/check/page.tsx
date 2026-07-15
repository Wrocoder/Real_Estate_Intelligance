"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Link2,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";

import { ErrorBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type AIListingAnswer,
  type AIQuestionCode,
  type AIQuestionDescriptor,
  type DeveloperReputation,
  type GeneratedReport,
  type ReportAudience,
  type SourceReferencePreview,
  type SourceUrlImportFields,
  type SourceUrlImportResult,
  type UserSubmittedListingAnalysis,
  type UserSubmittedListingReport,
  type UserSubmittedListingRequest,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import { decisionTone, scoreLabel } from "@/lib/scoreLabels";

type CheckFormState = {
  title: string;
  source_url: string;
  developer_name: string;
  investment_name: string;
  address: string;
  city: string;
  district: string;
  market_type: "primary" | "secondary";
  price: string;
  area_m2: string;
  rooms: string;
  floor: string;
  building_floors: string;
  building_year: string;
  lat: string;
  lon: string;
  confirm_private_analysis: boolean;
};

const DEFAULT_FORM: CheckFormState = {
  title: "",
  source_url: "",
  developer_name: "",
  investment_name: "",
  address: "",
  city: "Wrocław",
  district: "Fabryczna",
  market_type: "secondary",
  price: "",
  area_m2: "",
  rooms: "",
  floor: "",
  building_floors: "",
  building_year: "",
  lat: "",
  lon: "",
  confirm_private_analysis: true,
};

const DISTRICTS = ["Fabryczna", "Krzyki", "Psie Pole"];

export default function CheckListingPage() {
  const [form, setForm] = useState<CheckFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<UserSubmittedListingAnalysis | null>(null);
  const [referencePreview, setReferencePreview] =
    useState<SourceReferencePreview | null>(null);
  const [urlImportResult, setUrlImportResult] =
    useState<SourceUrlImportResult | null>(null);
  const [reportResult, setReportResult] = useState<UserSubmittedListingReport | null>(null);
  const [savedReport, setSavedReport] = useState<GeneratedReport | null>(null);
  const [aiQuestions, setAIQuestions] = useState<AIQuestionDescriptor[]>([]);
  const [aiAudience, setAiAudience] = useState<ReportAudience>("buyer");
  const [selectedAIQuestion, setSelectedAIQuestion] = useState<AIQuestionCode>("summary");
  const [customAIQuestion, setCustomAIQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AIListingAnswer | null>(null);
  const [status, setStatus] = useState("Готово к проверке");
  const [referenceStatus, setReferenceStatus] = useState("Ссылка не добавлена");
  const [urlImportStatus, setUrlImportStatus] = useState("Автоимпорт не запускался");
  const [reportStatus, setReportStatus] = useState("Отчет не создан");
  const [saveStatus, setSaveStatus] = useState("Не сохранен");
  const [aiStatus, setAiStatus] = useState("AI assistant готов после проверки");
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function loadAIQuestions() {
      try {
        const payload = await api.listAIQuestions();
        setAIQuestions(payload);
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

  function resetAIAnswer(nextStatus = "AI assistant готов после проверки") {
    setAiAnswer(null);
    setAiError("");
    setAiStatus(nextStatus);
  }

  async function analyze(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setStatus("Расчет...");
    try {
      const payload = await api.analyzeUserSubmittedListing(buildListingPayload(form));
      setResult(payload);
      setReportResult(null);
      setSavedReport(null);
      resetAIAnswer(payload.draft_id ? "AI assistant готов" : "AI assistant требует saved draft");
      setStatus("Проверка готова");
      setReportStatus("Отчет не создан");
      setSaveStatus("Не сохранен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Ошибка проверки");
    }
  }

  async function previewReference() {
    await importFromUrl({ generateReport: true });
  }

  async function importFromUrl(options: { generateReport?: boolean } = {}) {
    setError("");
    resetAIAnswer("AI assistant готов после проверки");
    setReferenceStatus("Загрузка ссылки...");
    setUrlImportStatus("Автоимпорт...");
    try {
      const payload = await api.importUserSubmittedListingFromUrl(form.source_url);
      const updatedForm = mergeImportedFields(form, payload.fields);
      setUrlImportResult(payload);
      setReferencePreview(payload.reference_preview);
      setForm(updatedForm);
      setReferenceStatus(`${payload.reference_preview.provider_label}: private reference`);
      setUrlImportStatus(urlImportStatusLabel(payload));
      setReportStatus("Отчет не создан");
      setSaveStatus("Не сохранен");
      if (options.generateReport) {
        if (payload.status === "failed" || payload.status === "unsupported") {
          setStatus("Ссылка принята, но портал не отдал параметры");
          setReportStatus("Отчет не создан: нет данных объявления");
          return;
        }
        const missingFields = missingRequiredReportFields(updatedForm);
        if (missingFields.length > 0) {
          setStatus("Ссылка принята, но нужны обязательные поля");
          setReportStatus(`Не хватает: ${missingFields.join(", ")}`);
          return;
        }
        await createReportFromForm(updatedForm);
      } else {
        setStatus("Поля обновлены из ссылки");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setReferenceStatus("Ошибка ссылки");
      setUrlImportStatus("Ошибка автоимпорта");
    }
  }

  async function createReport() {
    await createReportFromForm(form);
  }

  async function createReportFromForm(targetForm: CheckFormState) {
    setError("");
    const missingFields = missingRequiredReportFields(targetForm);
    if (missingFields.length > 0) {
      setReportStatus(`Не хватает: ${missingFields.join(", ")}`);
      setStatus("Заполните обязательные поля для отчета");
      return;
    }
    setReportStatus("Генерация...");
    try {
      const payload = await api.createUserSubmittedListingReport({
        ...buildListingPayload(targetForm),
        audience: "buyer",
      });
      setResult(payload.analysis);
      setReportResult(payload);
      setSavedReport(null);
      resetAIAnswer(payload.analysis.draft_id ? "AI assistant готов" : "AI assistant требует saved draft");
      setStatus("Проверка готова");
      setReportStatus("Отчет готов");
      setSaveStatus("Не сохранен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setReportStatus("Ошибка отчета");
    }
  }

  async function saveReportToHistory() {
    if (!result?.draft_id) return;
    setError("");
    setSaveStatus("Сохранение...");
    try {
      const payload = await api.generateUserSubmittedDraftReport(result.draft_id, {
        audience: "buyer",
        report_format: "html",
      });
      setSavedReport(payload);
      setSaveStatus("Сохранен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setSaveStatus("Ошибка сохранения");
    }
  }

  async function generateAIAnswer() {
    if (!result?.draft_id) {
      setAiStatus("Сначала нужно получить проверку с saved draft");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiStatus("AI answer строится...");
    try {
      const answer = await api.answerUserSubmittedDraftAIQuestion(result.draft_id, {
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

  function updateField<K extends keyof CheckFormState>(key: K, value: CheckFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const analysis = result?.analysis ?? null;
  const verdictTone = analysis ? decisionTone(analysis.scores) : "info";

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Проверить квартиру</h1>
          <p>Адрес, параметры объекта, fair price, риски, торг и ближайшие аналоги.</p>
        </div>
        <div className="button-row">
          <Link className="button" href="/check/drafts">
            <FileText size={16} /> История
          </Link>
          <button
            className="button"
            disabled={!form.confirm_private_analysis}
            type="button"
            onClick={() => void createReport()}
          >
            <FileText size={16} /> Получить отчет
          </button>
          <button
            className="button primary"
            disabled={!form.confirm_private_analysis}
            type="button"
            onClick={() => void analyze()}
          >
            <ClipboardCheck size={16} /> Проверить
          </button>
        </div>
      </header>

      {error ? <ErrorBlock message={error} /> : null}

      <section className="panel">
        <div className="panel-header">
          <h2>Ссылка объявления</h2>
          <span className="status-line">{referenceStatus}</span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>Otodom / OLX URL</span>
              <input
                className="input"
                placeholder="https://www.otodom.pl/..."
                type="url"
                value={form.source_url}
                onChange={(event) => {
                  setForm((current) => clearObjectFieldsForNewUrl(current, event.target.value));
                  setReferencePreview(null);
                  setUrlImportResult(null);
                  setReferenceStatus("Ссылка не проверена");
                  setUrlImportStatus("Автоимпорт не запускался");
                  resetAIAnswer("AI assistant готов после проверки");
                }}
              />
            </label>
            <button
              className="button"
              disabled={!form.source_url.trim()}
              type="button"
              onClick={() => void previewReference()}
            >
              <Link2 size={16} /> Принять и получить отчет
            </button>
            <button
              className="button"
              disabled={!form.source_url.trim()}
              type="button"
              onClick={() => void importFromUrl()}
            >
              <RefreshCw size={16} /> Повторить импорт
            </button>
            <button
              className="button primary"
              disabled={!form.confirm_private_analysis}
              type="button"
              onClick={() => void createReport()}
            >
              <FileText size={16} /> Ссылка + параметры → отчет
            </button>
          </div>
          <p className="status-line" style={{ marginTop: 12 }}>{urlImportStatus}</p>
          {referencePreview ? (
            <div className="metric-grid compact" style={{ marginTop: 12 }}>
              <div className="metric">
                <span>Provider</span>
                <strong>{referencePreview.provider_label}</strong>
              </div>
              <div className="metric">
                <span>Domain</span>
                <strong>{referencePreview.source_domain ?? "manual"}</strong>
              </div>
              <div className="metric">
                <span>Reference</span>
                <strong>{referencePreview.listing_reference_id ?? "—"}</strong>
              </div>
              <div className="metric">
                <span>Required fields</span>
                <strong>{referencePreview.manual_fields_required.length}</strong>
              </div>
            </div>
          ) : null}
          {urlImportResult ? (
            <div className="metric-grid compact" style={{ marginTop: 12 }}>
              <div className="metric">
                <span>Import status</span>
                <strong>{urlImportResult.status}</strong>
              </div>
              <div className="metric">
                <span>Extracted</span>
                <strong>{urlImportResult.fields_extracted.length}</strong>
              </div>
              <div className="metric">
                <span>HTTP</span>
                <strong>{urlImportResult.fetch_status_code ?? "—"}</strong>
              </div>
              <div className="metric">
                <span>Source</span>
                <strong>{urlImportResult.extraction_source ?? "—"}</strong>
              </div>
            </div>
          ) : null}
          {referencePreview ? (
            <ul className="section-list compact" style={{ marginTop: 12 }}>
              {[...referencePreview.warnings, ...(urlImportResult?.warnings ?? [])].map(
                (warning, index) => (
                  <li key={`${index}-${warning}`}>{warning}</li>
                ),
              )}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric">
          <span>Вердикт</span>
          <strong>{analysis ? scoreLabel(analysis.scores.decision_label) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Investment Score</span>
          <strong>{analysis ? analysis.scores.investment_score : "—"}</strong>
        </div>
        <div className="metric">
          <span>Risk Score</span>
          <strong>{analysis ? analysis.scores.risk_score : "—"}</strong>
        </div>
        <div className="metric">
          <span>Fair price mid</span>
          <strong>{analysis ? money(analysis.scores.fair_price_mid) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Confidence</span>
          <strong>{result ? `${result.confidence_score}/100` : "—"}</strong>
        </div>
        <div className="metric">
          <span>Price label</span>
          <strong>{analysis ? scoreLabel(analysis.scores.price_label) : "—"}</strong>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <form className="panel" onSubmit={(event) => void analyze(event)}>
          <div className="panel-header">
            <h2>Параметры объекта</h2>
            <button
              className="button"
              disabled={!form.confirm_private_analysis}
              type="submit"
            >
              <RefreshCw size={16} /> Обновить
            </button>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <label className="field">
                <span>Название</span>
                <input
                  className="input"
                  placeholder="optional"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Застройщик</span>
                <input
                  className="input"
                  placeholder="optional"
                  value={form.developer_name}
                  onChange={(event) => updateField("developer_name", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Инвестиция / проект</span>
                <input
                  className="input"
                  placeholder="optional"
                  value={form.investment_name}
                  onChange={(event) => updateField("investment_name", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Адрес</span>
                <input
                  className="input"
                  required
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Город</span>
                <input
                  className="input"
                  required
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Район</span>
                <input
                  className="input"
                  list="district-options"
                  value={form.district}
                  onChange={(event) => updateField("district", event.target.value)}
                />
                <datalist id="district-options">
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                <span>Рынок</span>
                <select
                  className="select"
                  value={form.market_type}
                  onChange={(event) =>
                    updateField("market_type", event.target.value as CheckFormState["market_type"])
                  }
                >
                  <option value="secondary">secondary</option>
                  <option value="primary">primary</option>
                </select>
              </label>
              <NumberField
                label="Цена"
                value={form.price}
                onChange={(value) => updateField("price", value)}
              />
              <NumberField
                label="Площадь m2"
                step="0.1"
                value={form.area_m2}
                onChange={(value) => updateField("area_m2", value)}
              />
              <NumberField
                label="Комнаты"
                value={form.rooms}
                onChange={(value) => updateField("rooms", value)}
              />
              <NumberField
                label="Этаж"
                value={form.floor}
                onChange={(value) => updateField("floor", value)}
              />
              <NumberField
                label="Этажей в доме"
                value={form.building_floors}
                onChange={(value) => updateField("building_floors", value)}
              />
              <NumberField
                label="Год дома"
                value={form.building_year}
                onChange={(value) => updateField("building_year", value)}
              />
            </div>

            <label className="compare-toggle" style={{ marginTop: 12 }}>
              <input
                checked={form.confirm_private_analysis}
                type="checkbox"
                onChange={(event) =>
                  updateField("confirm_private_analysis", event.target.checked)
                }
              />
              <ShieldCheck size={16} />
              <span>private analysis</span>
            </label>
            <p className="status-line">{status}</p>
            <p className="status-line">{reportStatus}</p>
            <p className="status-line">{saveStatus}</p>
          </div>
        </form>

        <aside className="panel">
          <div className="panel-header">
            <h2>Итог проверки</h2>
            {analysis ? (
              <span className={`status-pill ${verdictTone}`}>
                {scoreLabel(analysis.scores.decision_label)}
              </span>
            ) : null}
          </div>
          <div className="panel-body">
            {analysis && result ? (
              <>
                <ul className="section-list compact">
                  <li>
                    <span>Цена объекта</span>
                    <strong>{money(analysis.listing.price)}</strong>
                  </li>
                  <li>
                    <span>Цена за m2</span>
                    <strong>{money(analysis.listing.price_per_m2)}</strong>
                  </li>
                  <li>
                    <span>Fair price range</span>
                    <strong>
                      {money(analysis.scores.fair_price_low)} -{" "}
                      {money(analysis.scores.fair_price_high)}
                    </strong>
                  </li>
                  <li>
                    <span>Comparable listings</span>
                    <strong>{analysis.comparables.length}</strong>
                  </li>
                  <li>
                    <span>Source domain</span>
                    <strong>{result.source_domain ?? "manual input"}</strong>
                  </li>
                  <li>
                    <span>Private draft</span>
                    <strong>{result.draft_id ? shortId(result.draft_id) : "not saved"}</strong>
                  </li>
                  <li>
                    <span>Expires</span>
                    <strong>{result.draft_expires_at ? dateLabel(result.draft_expires_at) : "—"}</strong>
                  </li>
                </ul>
                {analysis.developer_reputation ? (
                  <DeveloperReputationBlock reputation={analysis.developer_reputation} />
                ) : null}
                <div className="button-row" style={{ marginTop: 12 }}>
                  <button
                    className="button primary"
                    disabled={!form.confirm_private_analysis}
                    type="button"
                    onClick={() => void createReport()}
                  >
                    <FileText size={16} /> Сгенерировать отчет
                  </button>
                  <button
                    className="button"
                    disabled={!result.draft_id}
                    type="button"
                    onClick={() => void saveReportToHistory()}
                  >
                    <Save size={16} /> Сохранить в историю
                  </button>
                </div>
                <ul className="section-list" style={{ marginTop: 12 }}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="empty-state">Введите параметры и запустите проверку.</div>
            )}
          </div>
        </aside>
      </section>

      {analysis ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2 className="icon-title">
              <Brain size={16} /> AI assistant по private draft
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
                  placeholder="Например: какие риски проверить до zadatek?"
                />
              </div>
              <button
                className="button primary"
                disabled={aiLoading || !result?.draft_id}
                type="button"
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
                    <span className="status-pill">
                      {result?.draft_id ? shortId(result.draft_id) : "no draft"}
                    </span>
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
              <p className="empty-state">
                {result?.draft_id
                  ? "AI answer появится после запроса по сохраненному private draft."
                  : "Для AI assistant нужен saved draft: запусти проверку или отчет заново."}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {analysis ? (
        <section className="grid-2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <h2>Выводы</h2>
            </div>
            <div className="panel-body">
              <ul className="section-list">
                {analysis.insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="panel">
            <div className="panel-header">
              <h2>Торг</h2>
            </div>
            <div className="panel-body">
              <ul className="section-list">
                {analysis.negotiation_arguments.map((argument) => (
                  <li key={argument}>{argument}</li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      ) : null}

      {analysis ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>База сравнения</h2>
            <span className="status-pill info">{result?.comparables_basis}</span>
          </div>
          <div className="panel-body">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Объект</th>
                    <th>Район</th>
                    <th>Цена</th>
                    <th>m2</th>
                    <th>Комнаты</th>
                    <th>Цена/m2</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.comparables.map((listing) => (
                    <tr key={listing.id}>
                      <td>{listing.title}</td>
                      <td>{listing.district}</td>
                      <td>{money(listing.price)}</td>
                      <td>{numberValue(listing.area_m2)}</td>
                      <td>{listing.rooms}</td>
                      <td>{money(listing.price_per_m2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">{result?.retention_note}</p>
          </div>
        </section>
      ) : null}

      {reportResult ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>Buyer report</h2>
            <div className="button-row">
              {savedReport ? (
                <a
                  className="button"
                  href={reportContentUrl(savedReport.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} /> HTML
                </a>
              ) : null}
              <button
                className="button"
                disabled={!result?.draft_id}
                type="button"
                onClick={() => void saveReportToHistory()}
              >
                <Save size={16} /> Сохранить
              </button>
              <span className="status-pill info">{reportResult.report.template_name}</span>
            </div>
          </div>
          <div className="panel-body">
            <p className="empty-state">{reportResult.report.summary}</p>
            <div className="grid-2" style={{ marginTop: 12 }}>
              {reportResult.report.sections.map((section) => (
                <section key={section.title}>
                  <div className="panel-header inline">
                    <h3>{section.title}</h3>
                  </div>
                  <ul className="section-list">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <p className="muted">{reportResult.report.disclaimer}</p>
          </div>
        </section>
      ) : null}
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

function DeveloperReputationBlock({ reputation }: { reputation: DeveloperReputation }) {
  return (
    <>
      <div className="panel-header inline" style={{ marginTop: 14 }}>
        <h3>Застройщик</h3>
        <span className={`status-pill ${developerLabelTone(reputation.label)}`}>
          {developerLabelText(reputation.label)}
        </span>
      </div>
      <ul className="section-list compact">
        <li>
          <Building2 size={16} /> {reputation.developer.name}
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
        {(reputation.risk_signals[0] ?? reputation.positive_signals[0]) ? (
          <li>{reputation.risk_signals[0] ?? reputation.positive_signals[0]}</li>
        ) : null}
      </ul>
    </>
  );
}

function buildListingPayload(form: CheckFormState): UserSubmittedListingRequest {
  return {
    title: form.title.trim() || null,
    source_url: form.source_url.trim() || null,
    developer_name: form.developer_name.trim() || null,
    investment_name: form.investment_name.trim() || null,
    address: form.address.trim(),
    city: form.city.trim() || "Wrocław",
    district: form.district,
    market_type: form.market_type,
    price: toNumber(form.price),
    area_m2: toNumber(form.area_m2),
    rooms: toNumber(form.rooms),
    floor: toOptionalNumber(form.floor),
    building_floors: toOptionalNumber(form.building_floors),
    building_year: toOptionalNumber(form.building_year),
    lat: toOptionalNumber(form.lat),
    lon: toOptionalNumber(form.lon),
    confirm_private_analysis: form.confirm_private_analysis,
    save_private_draft: true,
    retention_days: 30,
  };
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

function mergeImportedFields(current: CheckFormState, fields: SourceUrlImportFields) {
  return {
    ...current,
    title: fields.title ?? current.title,
    developer_name: fields.developer_name ?? current.developer_name,
    investment_name: fields.investment_name ?? current.investment_name,
    address: normalizedImportedAddress(fields, current.address),
    city: normalizeCity(fields.city, fields.district, current.city),
    district: normalizeDistrict(fields.district) ?? current.district,
    market_type: fields.market_type ?? current.market_type,
    price: fields.price ? String(fields.price) : current.price,
    area_m2: fields.area_m2 ? String(fields.area_m2) : current.area_m2,
    rooms: fields.rooms ? String(fields.rooms) : current.rooms,
    floor: fields.floor !== null && fields.floor !== undefined ? String(fields.floor) : current.floor,
    building_floors: fields.building_floors ? String(fields.building_floors) : current.building_floors,
    building_year: fields.building_year ? String(fields.building_year) : current.building_year,
    lat: fields.lat !== null && fields.lat !== undefined ? String(fields.lat) : current.lat,
    lon: fields.lon !== null && fields.lon !== undefined ? String(fields.lon) : current.lon,
  };
}

function clearObjectFieldsForNewUrl(current: CheckFormState, sourceUrl: string) {
  return {
    ...DEFAULT_FORM,
    city: current.city || DEFAULT_FORM.city,
    district: current.district || DEFAULT_FORM.district,
    market_type: current.market_type,
    confirm_private_analysis: current.confirm_private_analysis,
    source_url: sourceUrl,
  };
}

function missingRequiredReportFields(form: CheckFormState) {
  const missing = [];
  if (!form.address.trim()) missing.push("address");
  if (!form.city.trim()) missing.push("city");
  if (!form.district.trim()) missing.push("district");
  if (!isPositiveNumber(form.price)) missing.push("price");
  if (!isPositiveNumber(form.area_m2)) missing.push("area_m2");
  if (!isPositiveNumber(form.rooms)) missing.push("rooms");
  return missing;
}

function isPositiveNumber(value: string) {
  return Number(value) > 0;
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        inputMode="decimal"
        min="0"
        step={step ?? "1"}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function toNumber(value: string) {
  return Number(value || 0);
}

function toOptionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function normalizeDistrict(value: string | null) {
  if (!value) return null;
  const cleaned = value.trim();
  const normalized = value.toLocaleLowerCase("pl-PL");
  return (
    DISTRICTS.find((district) => normalized.includes(district.toLocaleLowerCase("pl-PL"))) ??
    cleaned
  );
}

function normalizeCity(value: string | null, district: string | null, currentCity: string) {
  if (!value) return currentCity;
  const normalized = value.toLocaleLowerCase("pl-PL");
  if (normalized.includes("wrocław") || normalized.includes("wroclaw")) {
    return "Wrocław";
  }
  if (normalizeDistrict(district)) {
    return value.trim();
  }
  return value.trim() || currentCity;
}

function normalizedImportedAddress(fields: SourceUrlImportFields, currentAddress: string) {
  if (!fields.address) return currentAddress;
  if (!fields.city || fields.address.toLocaleLowerCase("pl-PL").includes(fields.city.toLocaleLowerCase("pl-PL"))) {
    return fields.address;
  }
  return `${fields.address}, ${fields.city}`;
}

function urlImportStatusLabel(result: SourceUrlImportResult) {
  if (result.status === "extracted") {
    return `Автоимпорт: заполнено ${result.fields_extracted.length} полей`;
  }
  if (result.status === "partial") {
    return `Автоимпорт частичный: заполнено ${result.fields_extracted.length} полей`;
  }
  if (result.status === "unsupported") {
    return "Автоимпорт доступен только для Otodom/OLX";
  }
  return "Автоимпорт не получил параметры, заполните поля вручную";
}
