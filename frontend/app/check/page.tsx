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
import { dateValue, money, numberValue } from "@/lib/format";
import { CHECK_PAGE_COPY, type CheckPageCopy } from "@/lib/i18n";
import { decisionTone, scoreLabel } from "@/lib/scoreLabels";
import { useLocalePreference } from "@/lib/useLocalePreference";

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
type RequiredReportField = keyof CheckPageCopy["requiredFieldLabels"];

export default function CheckListingPage() {
  const { locale } = useLocalePreference();
  const copy = CHECK_PAGE_COPY[locale];
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
  const [status, setStatus] = useState(copy.statuses.ready);
  const [referenceStatus, setReferenceStatus] = useState(copy.statuses.noLink);
  const [urlImportStatus, setUrlImportStatus] = useState(copy.statuses.importNotStarted);
  const [reportStatus, setReportStatus] = useState(copy.statuses.reportNotCreated);
  const [saveStatus, setSaveStatus] = useState(copy.statuses.notSaved);
  const [aiStatus, setAiStatus] = useState(copy.statuses.aiReadyAfterCheck);
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

  function resetAIAnswer(nextStatus = copy.statuses.aiReadyAfterCheck) {
    setAiAnswer(null);
    setAiError("");
    setAiStatus(nextStatus);
  }

  async function analyze(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setStatus(copy.statuses.calculating);
    try {
      const payload = await api.analyzeUserSubmittedListing(buildListingPayload(form));
      setResult(payload);
      setReportResult(null);
      setSavedReport(null);
      resetAIAnswer(payload.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
      setStatus(copy.statuses.checkReady);
      setReportStatus(copy.statuses.reportNotCreated);
      setSaveStatus(copy.statuses.notSaved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.checkError);
    }
  }

  async function previewReference() {
    await importFromUrl({ generateReport: true });
  }

  async function importFromUrl(options: { generateReport?: boolean } = {}) {
    setError("");
    resetAIAnswer(copy.statuses.aiReadyAfterCheck);
    setReferenceStatus(copy.statuses.loadingLink);
    setUrlImportStatus(copy.statuses.autoImporting);
    try {
      const payload = await api.importUserSubmittedListingFromUrl(form.source_url);
      const updatedForm = mergeImportedFields(form, payload.fields);
      setUrlImportResult(payload);
      setReferencePreview(payload.reference_preview);
      setForm(updatedForm);
      setReferenceStatus(`${payload.reference_preview.provider_label}: private reference`);
      setUrlImportStatus(urlImportStatusLabel(payload, copy));
      setReportStatus(copy.statuses.reportNotCreated);
      setSaveStatus(copy.statuses.notSaved);
      if (options.generateReport) {
        if (payload.status === "failed" || payload.status === "unsupported") {
          setStatus(copy.statuses.linkAcceptedNoParams);
          setReportStatus(copy.statuses.reportNoListingData);
          return;
        }
        const missingFields = missingRequiredReportFields(updatedForm);
        if (missingFields.length > 0) {
          setStatus(copy.statuses.linkAcceptedMissingFields);
          setReportStatus(copy.statuses.missingFields(missingFieldLabels(missingFields, copy)));
          return;
        }
        await createReportFromForm(updatedForm);
      } else {
        setStatus(copy.statuses.fieldsUpdated);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setReferenceStatus(copy.statuses.linkError);
      setUrlImportStatus(copy.statuses.importError);
    }
  }

  async function createReport() {
    await createReportFromForm(form);
  }

  async function createReportFromForm(targetForm: CheckFormState) {
    setError("");
    const missingFields = missingRequiredReportFields(targetForm);
    if (missingFields.length > 0) {
      setReportStatus(copy.statuses.missingFields(missingFieldLabels(missingFields, copy)));
      setStatus(copy.statuses.fillRequiredForReport);
      return;
    }
    setReportStatus(copy.statuses.reportGenerating);
    try {
      const payload = await api.createUserSubmittedListingReport({
        ...buildListingPayload(targetForm),
        audience: "buyer",
      });
      setResult(payload.analysis);
      setReportResult(payload);
      setSavedReport(null);
      resetAIAnswer(payload.analysis.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
      setStatus(copy.statuses.checkReady);
      setReportStatus(copy.statuses.reportReady);
      setSaveStatus(copy.statuses.notSaved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setReportStatus(copy.statuses.reportError);
    }
  }

  async function saveReportToHistory() {
    if (!result?.draft_id) return;
    setError("");
    setSaveStatus(copy.statuses.saving);
    try {
      const payload = await api.generateUserSubmittedDraftReport(result.draft_id, {
        audience: "buyer",
        report_format: "html",
      });
      setSavedReport(payload);
      setSaveStatus(copy.statuses.saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setSaveStatus(copy.statuses.saveError);
    }
  }

  async function generateAIAnswer() {
    if (!result?.draft_id) {
      setAiStatus(copy.statuses.aiDraftRequired);
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiStatus(copy.statuses.aiBuilding);
    try {
      const answer = await api.answerUserSubmittedDraftAIQuestion(result.draft_id, {
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

  function updateField<K extends keyof CheckFormState>(key: K, value: CheckFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const analysis = result?.analysis ?? null;
  const verdictTone = analysis ? decisionTone(analysis.scores) : "info";

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="button-row">
          <Link className="button" href="/check/drafts">
            <FileText size={16} /> {copy.actions.history}
          </Link>
          <button
            className="button"
            disabled={!form.confirm_private_analysis}
            type="button"
            onClick={() => void createReport()}
          >
            <FileText size={16} /> {copy.actions.getReport}
          </button>
          <button
            className="button primary"
            disabled={!form.confirm_private_analysis}
            type="button"
            onClick={() => void analyze()}
          >
            <ClipboardCheck size={16} /> {copy.actions.check}
          </button>
        </div>
      </header>

      {error ? <ErrorBlock message={error} prefix={copy.errorPrefix} /> : null}

      <section className="panel">
        <div className="panel-header">
          <h2>{copy.sections.sourceLink}</h2>
          <span className="status-line">{referenceStatus}</span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>Otodom / OLX URL</span>
              <input
                className="input"
                placeholder={copy.placeholders.sourceUrl}
                type="url"
                value={form.source_url}
                onChange={(event) => {
                  setForm((current) => clearObjectFieldsForNewUrl(current, event.target.value));
                  setReferencePreview(null);
                  setUrlImportResult(null);
                  setReferenceStatus(copy.statuses.linkNotChecked);
                  setUrlImportStatus(copy.statuses.importNotStarted);
                  resetAIAnswer(copy.statuses.aiReadyAfterCheck);
                }}
              />
            </label>
            <button
              className="button"
              disabled={!form.source_url.trim()}
              type="button"
              onClick={() => void previewReference()}
            >
              <Link2 size={16} /> {copy.actions.acceptAndReport}
            </button>
            <button
              className="button"
              disabled={!form.source_url.trim()}
              type="button"
              onClick={() => void importFromUrl()}
            >
              <RefreshCw size={16} /> {copy.actions.retryImport}
            </button>
            <button
              className="button primary"
              disabled={!form.confirm_private_analysis}
              type="button"
              onClick={() => void createReport()}
            >
              <FileText size={16} /> {copy.actions.linkAndParamsReport}
            </button>
          </div>
          <p className="status-line" style={{ marginTop: 12 }}>{urlImportStatus}</p>
          {referencePreview ? (
            <div className="metric-grid compact" style={{ marginTop: 12 }}>
              <div className="metric">
                <span>{copy.metrics.provider}</span>
                <strong>{referencePreview.provider_label}</strong>
              </div>
              <div className="metric">
                <span>{copy.metrics.domain}</span>
                <strong>{referencePreview.source_domain ?? copy.values.manual}</strong>
              </div>
              <div className="metric">
                <span>{copy.metrics.reference}</span>
                <strong>{referencePreview.listing_reference_id ?? copy.values.dash}</strong>
              </div>
              <div className="metric">
                <span>{copy.metrics.requiredFields}</span>
                <strong>{referencePreview.manual_fields_required.length}</strong>
              </div>
            </div>
          ) : null}
          {urlImportResult ? (
            <div className="metric-grid compact" style={{ marginTop: 12 }}>
              <div className="metric">
                <span>{copy.metrics.importStatus}</span>
                <strong>{urlImportResult.status}</strong>
              </div>
              <div className="metric">
                <span>{copy.metrics.extracted}</span>
                <strong>{urlImportResult.fields_extracted.length}</strong>
              </div>
              <div className="metric">
                <span>{copy.metrics.http}</span>
                <strong>{urlImportResult.fetch_status_code ?? copy.values.dash}</strong>
              </div>
              <div className="metric">
                <span>{copy.metrics.source}</span>
                <strong>{urlImportResult.extraction_source ?? copy.values.dash}</strong>
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
          <span>{copy.metrics.verdict}</span>
          <strong>
            {analysis ? scoreLabel(analysis.scores.decision_label, locale) : copy.values.dash}
          </strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.investmentScore}</span>
          <strong>{analysis ? analysis.scores.investment_score : copy.values.dash}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.riskScore}</span>
          <strong>{analysis ? analysis.scores.risk_score : copy.values.dash}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.fairPriceMid}</span>
          <strong>
            {analysis ? money(analysis.scores.fair_price_mid, locale) : copy.values.dash}
          </strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.confidence}</span>
          <strong>{result ? `${result.confidence_score}/100` : copy.values.dash}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.priceLabel}</span>
          <strong>
            {analysis ? scoreLabel(analysis.scores.price_label, locale) : copy.values.dash}
          </strong>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <form className="panel" onSubmit={(event) => void analyze(event)}>
          <div className="panel-header">
            <h2>{copy.sections.objectParams}</h2>
            <button
              className="button"
              disabled={!form.confirm_private_analysis}
              type="submit"
            >
              <RefreshCw size={16} /> {copy.actions.refresh}
            </button>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <label className="field">
                <span>{copy.fields.title}</span>
                <input
                  className="input"
                  placeholder={copy.placeholders.optional}
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{copy.fields.developer}</span>
                <input
                  className="input"
                  placeholder={copy.placeholders.optional}
                  value={form.developer_name}
                  onChange={(event) => updateField("developer_name", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{copy.fields.investment}</span>
                <input
                  className="input"
                  placeholder={copy.placeholders.optional}
                  value={form.investment_name}
                  onChange={(event) => updateField("investment_name", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{copy.fields.address}</span>
                <input
                  className="input"
                  required
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{copy.fields.city}</span>
                <input
                  className="input"
                  required
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{copy.fields.district}</span>
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
                <span>{copy.fields.market}</span>
                <select
                  className="select"
                  value={form.market_type}
                  onChange={(event) =>
                    updateField("market_type", event.target.value as CheckFormState["market_type"])
                  }
                >
                  <option value="secondary">{copy.values.secondary}</option>
                  <option value="primary">{copy.values.primary}</option>
                </select>
              </label>
              <NumberField
                label={copy.fields.price}
                value={form.price}
                onChange={(value) => updateField("price", value)}
              />
              <NumberField
                label={copy.fields.area}
                step="0.1"
                value={form.area_m2}
                onChange={(value) => updateField("area_m2", value)}
              />
              <NumberField
                label={copy.fields.rooms}
                value={form.rooms}
                onChange={(value) => updateField("rooms", value)}
              />
              <NumberField
                label={copy.fields.floor}
                value={form.floor}
                onChange={(value) => updateField("floor", value)}
              />
              <NumberField
                label={copy.fields.buildingFloors}
                value={form.building_floors}
                onChange={(value) => updateField("building_floors", value)}
              />
              <NumberField
                label={copy.fields.buildingYear}
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
              <span>{copy.fields.privateAnalysis}</span>
            </label>
            <p className="status-line">{status}</p>
            <p className="status-line">{reportStatus}</p>
            <p className="status-line">{saveStatus}</p>
          </div>
        </form>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.sections.result}</h2>
            {analysis ? (
              <span className={`status-pill ${verdictTone}`}>
                {scoreLabel(analysis.scores.decision_label, locale)}
              </span>
            ) : null}
          </div>
          <div className="panel-body">
            {analysis && result ? (
              <>
                <ul className="section-list compact">
                  <li>
                    <span>{copy.metrics.objectPrice}</span>
                    <strong>{money(analysis.listing.price, locale)}</strong>
                  </li>
                  <li>
                    <span>{copy.metrics.pricePerM2}</span>
                    <strong>{money(analysis.listing.price_per_m2, locale)}</strong>
                  </li>
                  <li>
                    <span>{copy.metrics.fairPriceRange}</span>
                    <strong>
                      {money(analysis.scores.fair_price_low, locale)} -{" "}
                      {money(analysis.scores.fair_price_high, locale)}
                    </strong>
                  </li>
                  <li>
                    <span>{copy.metrics.comparableListings}</span>
                    <strong>{analysis.comparables.length}</strong>
                  </li>
                  <li>
                    <span>{copy.metrics.sourceDomain}</span>
                    <strong>{result.source_domain ?? copy.values.manualInput}</strong>
                  </li>
                  <li>
                    <span>{copy.metrics.privateDraft}</span>
                    <strong>
                      {result.draft_id ? shortId(result.draft_id) : copy.values.notSaved}
                    </strong>
                  </li>
                  <li>
                    <span>{copy.metrics.expires}</span>
                    <strong>
                      {result.draft_expires_at
                        ? dateValue(result.draft_expires_at, locale)
                        : copy.values.dash}
                    </strong>
                  </li>
                </ul>
                {analysis.developer_reputation ? (
                  <DeveloperReputationBlock
                    copy={copy.developer}
                    reputation={analysis.developer_reputation}
                  />
                ) : null}
                <div className="button-row" style={{ marginTop: 12 }}>
                  <button
                    className="button primary"
                    disabled={!form.confirm_private_analysis}
                    type="button"
                    onClick={() => void createReport()}
                  >
                    <FileText size={16} /> {copy.actions.generateReport}
                  </button>
                  <button
                    className="button"
                    disabled={!result.draft_id}
                    type="button"
                    onClick={() => void saveReportToHistory()}
                  >
                    <Save size={16} /> {copy.actions.saveToHistory}
                  </button>
                </div>
                <ul className="section-list" style={{ marginTop: 12 }}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
                <p className="muted" style={{ marginTop: 12 }}>
                  {analysis.disclaimer}
                </p>
              </>
            ) : (
              <div className="empty-state">{copy.empty.noResult}</div>
            )}
          </div>
        </aside>
      </section>

      {analysis ? (
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
                disabled={aiLoading || !result?.draft_id}
                type="button"
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
                    <span className="status-pill">
                      {result?.draft_id ? shortId(result.draft_id) : copy.values.noDraft}
                    </span>
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
              <p className="empty-state">
                {result?.draft_id ? copy.empty.aiReady : copy.empty.aiNeedsSavedDraft}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {analysis ? (
        <section className="grid-2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <h2>{copy.sections.conclusions}</h2>
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
              <h2>{copy.sections.negotiation}</h2>
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
            <h2>{copy.sections.comparables}</h2>
            <span className="status-pill info">{result?.comparables_basis}</span>
          </div>
          <div className="panel-body">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.table.object}</th>
                    <th>{copy.table.district}</th>
                    <th>{copy.table.price}</th>
                    <th>{copy.table.area}</th>
                    <th>{copy.table.rooms}</th>
                    <th>{copy.table.pricePerM2}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.comparables.map((listing) => (
                    <tr key={listing.id}>
                      <td>{listing.title}</td>
                      <td>{listing.district}</td>
                      <td>{money(listing.price, locale)}</td>
                      <td>{numberValue(listing.area_m2, locale)}</td>
                      <td>{listing.rooms}</td>
                      <td>{money(listing.price_per_m2, locale)}</td>
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
            <h2>{copy.sections.buyerReport}</h2>
            <div className="button-row">
              {savedReport ? (
                <a
                  className="button"
                  href={reportContentUrl(savedReport.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} /> {copy.values.html}
                </a>
              ) : null}
              <button
                className="button"
                disabled={!result?.draft_id}
                type="button"
                onClick={() => void saveReportToHistory()}
              >
                <Save size={16} /> {copy.actions.save}
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
  copy: CheckPageCopy,
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

function DeveloperReputationBlock({
  copy,
  reputation,
}: {
  copy: CheckPageCopy["developer"];
  reputation: DeveloperReputation;
}) {
  return (
    <>
      <div className="panel-header inline" style={{ marginTop: 14 }}>
        <h3>{copy.title}</h3>
        <span className={`status-pill ${developerLabelTone(reputation.label)}`}>
          {copy.labels[reputation.label] ?? reputation.label}
        </span>
      </div>
      <ul className="section-list compact">
        <li>
          <Building2 size={16} /> {reputation.developer.name}
        </li>
        <li>
          <Link className="button" href={`/developers/${reputation.developer.id}`}>
            {copy.profile}
          </Link>
        </li>
        <li>{copy.ratingLine(reputation.reputation_score, reputation.confidence_score)}</li>
        <li>{copy.projectsLine(reputation.completed_projects_count, reputation.active_projects_count)}</li>
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

function missingRequiredReportFields(form: CheckFormState): RequiredReportField[] {
  const missing: RequiredReportField[] = [];
  if (!form.address.trim()) missing.push("address");
  if (!form.city.trim()) missing.push("city");
  if (!form.district.trim()) missing.push("district");
  if (!isPositiveNumber(form.price)) missing.push("price");
  if (!isPositiveNumber(form.area_m2)) missing.push("area_m2");
  if (!isPositiveNumber(form.rooms)) missing.push("rooms");
  return missing;
}

function missingFieldLabels(fields: RequiredReportField[], copy: CheckPageCopy) {
  return fields.map((field) => copy.requiredFieldLabels[field]).join(", ");
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

function urlImportStatusLabel(result: SourceUrlImportResult, copy: CheckPageCopy) {
  if (result.status === "extracted") {
    return copy.statuses.importExtracted(result.fields_extracted.length);
  }
  if (result.status === "partial") {
    return copy.statuses.importPartial(result.fields_extracted.length);
  }
  if (result.status === "unsupported") {
    return copy.statuses.importUnsupported;
  }
  return copy.statuses.importFailed;
}
