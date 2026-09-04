"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Brain,
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";

import { BuyerDecisionPanel } from "@/components/BuyerDecisionPanel";
import { CoverageNotice } from "@/components/CoverageNotice";
import { safeHttpsUrl } from "@/components/ListingProvenance";
import { FutureImpactNarrativePanel } from "@/components/FutureImpactNarrativePanel";
import { PostViewingVerdictRecalculator } from "@/components/PostViewingVerdictRecalculator";
import { ErrorBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type AIListingAnswer,
  type AIQuestionCode,
  type AIQuestionDescriptor,
  type DeveloperReputation,
  type GeneratedReport,
  type PostViewingChecklistAnswers,
  type PostViewingVerdictRecalculation,
  type PurchaseIntent,
  type RenovationCondition,
  type ReportAudience,
  type SourceReferencePreview,
  type SourceUrlImportFields,
  type SourceUrlImportResult,
  type UserSubmittedListingAnalysis,
  type UserSubmittedListingDraft,
  type UserSubmittedListingReport,
  type UserSubmittedListingRequest,
} from "@/lib/api";
import { dateValue, money, numberValue } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import { CHECK_PAGE_COPY, type CheckPageCopy, type Locale } from "@/lib/i18n";
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
  purchase_intent: PurchaseIntent;
  renovation_condition: "" | RenovationCondition;
  custom_renovation_budget_pln: string;
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
  purchase_intent: "unsure",
  renovation_condition: "",
  custom_renovation_budget_pln: "",
  price: "",
  area_m2: "",
  rooms: "",
  floor: "",
  building_floors: "",
  building_year: "",
  lat: "",
  lon: "",
  confirm_private_analysis: false,
};

const DISTRICTS = ["Fabryczna", "Krzyki", "Psie Pole"];
const PURCHASE_INTENTS: PurchaseIntent[] = ["self", "family", "rental", "investment", "unsure"];
const RENOVATION_CONDITIONS: RenovationCondition[] = [
  "move_in_ready",
  "refresh",
  "light_renovation",
  "full_renovation",
  "shell_developer_standard",
  "custom_budget",
];
type RequiredReportField = keyof CheckPageCopy["requiredFieldLabels"];

const PRODUCT_COPY = {
  en: {
    heroTitle: "Check an apartment before buying",
    heroText: "Paste an Otodom or OLX link. WartoMetr estimates a fair price, risks, total purchase cost and negotiation range.",
    urlLabel: "Otodom or OLX link",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Check apartment",
    search: "Or search for an apartment with WartoMetr",
    manualSummary: "Enter apartment details manually",
    purpose: "Buying purpose",
    living: "For living",
    investment: "For investment",
    importStatus: "Reading listing, comparing local market and preparing verdict.",
    dataUsed: "Data used",
    observations: "Comparable properties",
    source: "Listing source",
    updated: "Updated",
    confidence: "Confidence",
    supporting: "Supporting analytics",
    save: "Save apartment",
    compare: "Compare",
    track: "Track this apartment",
    evidence: "View comparable properties",
    details: "Apartment details",
    report: "Full property report",
    assistant: "Ask about this apartment",
    consent: "I understand that WartoMetr will fetch this public listing, keep a private reference for the analysis, and let me delete the draft.",
    privacy: "Privacy details",
    consentRequired: "Confirm the data-use notice before importing the link.",
  },
  pl: {
    heroTitle: "Sprawdź mieszkanie przed zakupem",
    heroText: "Wklej link z Otodom lub OLX. WartoMetr oszacuje cenę rynkową, ryzyka, całkowity koszt zakupu i zakres negocjacji.",
    urlLabel: "Link Otodom lub OLX",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Sprawdź mieszkanie",
    search: "Albo wyszukaj mieszkanie w WartoMetr",
    manualSummary: "Wpisz dane mieszkania ręcznie",
    purpose: "Cel zakupu",
    living: "Do zamieszkania",
    investment: "Na inwestycję",
    importStatus: "Czytamy ogłoszenie, porównujemy lokalny rynek i przygotowujemy werdykt.",
    dataUsed: "Dane użyte w analizie",
    observations: "Podobne ogłoszenia",
    source: "Źródło ogłoszenia",
    updated: "Aktualizacja",
    confidence: "Pewność",
    supporting: "Analiza szczegółowa",
    save: "Zapisz mieszkanie",
    compare: "Porównaj",
    track: "Śledź to mieszkanie",
    evidence: "Zobacz podobne nieruchomości",
    details: "Dane mieszkania",
    report: "Pełny raport mieszkania",
    assistant: "Zapytaj o to mieszkanie",
    consent: "Rozumiem, że WartoMetr pobierze to publiczne ogłoszenie, zachowa prywatne odniesienie do analizy i umożliwi usunięcie szkicu.",
    privacy: "Szczegóły prywatności",
    consentRequired: "Potwierdź zasady wykorzystania danych przed importem linku.",
  },
  ru: {
    heroTitle: "Проверьте квартиру перед покупкой",
    heroText: "Вставьте ссылку Otodom или OLX. WartoMetr оценит рыночный диапазон, риски, полную стоимость покупки и диапазон торга.",
    urlLabel: "Ссылка Otodom или OLX",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Проверить квартиру",
    search: "Или найти квартиру в WartoMetr",
    manualSummary: "Ввести параметры квартиры вручную",
    purpose: "Цель покупки",
    living: "Для жизни",
    investment: "Для инвестиции",
    importStatus: "Читаем объявление, сравниваем локальный рынок и готовим вердикт.",
    dataUsed: "Данные в анализе",
    observations: "Похожие объявления",
    source: "Источник объявления",
    updated: "Обновлено",
    confidence: "Уверенность",
    supporting: "Детальная аналитика",
    save: "Сохранить квартиру",
    compare: "Сравнить",
    track: "Следить за квартирой",
    evidence: "Посмотреть похожие объекты",
    details: "Параметры квартиры",
    report: "Полный отчет по квартире",
    assistant: "Задать вопрос по квартире",
    consent: "Я понимаю, что WartoMetr получит это публичное объявление, сохранит приватную ссылку для анализа и позволит удалить черновик.",
    privacy: "Подробнее о приватности",
    consentRequired: "Подтвердите правила использования данных перед импортом ссылки.",
  },
  uk: {
    heroTitle: "Перевірте квартиру перед купівлею",
    heroText: "Вставте посилання Otodom або OLX. WartoMetr оцінить ринковий діапазон, ризики, повну вартість купівлі та діапазон торгу.",
    urlLabel: "Посилання Otodom або OLX",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Перевірити квартиру",
    search: "Або знайти квартиру в WartoMetr",
    manualSummary: "Ввести параметри квартири вручну",
    purpose: "Ціль купівлі",
    living: "Для життя",
    investment: "Для інвестиції",
    importStatus: "Читаємо оголошення, порівнюємо локальний ринок і готуємо вердикт.",
    dataUsed: "Дані в аналізі",
    observations: "Схожі оголошення",
    source: "Джерело оголошення",
    updated: "Оновлено",
    confidence: "Впевненість",
    supporting: "Детальна аналітика",
    save: "Зберегти квартиру",
    compare: "Порівняти",
    track: "Стежити за квартирою",
    evidence: "Переглянути схожі об'єкти",
    details: "Параметри квартири",
    report: "Повний звіт по квартирі",
    assistant: "Поставити питання по квартирі",
    consent: "Я розумію, що WartoMetr отримає це публічне оголошення, збереже приватне посилання для аналізу та дозволить видалити чернетку.",
    privacy: "Деталі приватності",
    consentRequired: "Підтвердьте правила використання даних перед імпортом посилання.",
  },
} as const;

export default function CheckListingPage() {
  const { locale } = useLocalePreference();
  const copy = CHECK_PAGE_COPY[locale];
  const product = PRODUCT_COPY[locale];
  const [form, setForm] = useState<CheckFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<UserSubmittedListingAnalysis | null>(null);
  const [referencePreview, setReferencePreview] =
    useState<SourceReferencePreview | null>(null);
  const [urlImportResult, setUrlImportResult] =
    useState<SourceUrlImportResult | null>(null);
  const [reportResult, setReportResult] = useState<UserSubmittedListingReport | null>(null);
  const [savedReport, setSavedReport] = useState<GeneratedReport | null>(null);
  const [postViewingResult, setPostViewingResult] =
    useState<PostViewingVerdictRecalculation | null>(null);
  const [aiQuestions, setAIQuestions] = useState<AIQuestionDescriptor[]>([]);
  const [aiAudience] = useState<ReportAudience>("buyer");
  const [selectedAIQuestion, setSelectedAIQuestion] = useState<AIQuestionCode>("summary");
  const [customAIQuestion, setCustomAIQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AIListingAnswer | null>(null);
  const [status, setStatus] = useState(copy.statuses.ready);
  const [urlImportStatus, setUrlImportStatus] = useState(copy.statuses.importNotStarted);
  const [reportStatus, setReportStatus] = useState(copy.statuses.reportNotCreated);
  const [saveStatus, setSaveStatus] = useState(copy.statuses.notSaved);
  const [aiStatus, setAiStatus] = useState(copy.statuses.aiReadyAfterCheck);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const resetAIAnswer = useCallback((nextStatus = copy.statuses.aiReadyAfterCheck) => {
    setAiAnswer(null);
    setAiError("");
    setAiStatus(nextStatus);
  }, [copy.statuses.aiReadyAfterCheck]);

  useEffect(() => {
    async function loadAIQuestions() {
      try {
        const payload = await api.listAIQuestions();
        setAIQuestions(payload);
      } catch (caught) {
        setAiError(localizedError(caught, locale, copy.statuses.aiQuestionsUnavailable));
        setAiStatus(copy.statuses.aiQuestionsUnavailable);
      }
    }

    void loadAIQuestions();
  }, [copy.statuses.aiQuestionsUnavailable, locale]);

  useEffect(() => {
    const draftId = new URLSearchParams(window.location.search).get("draft");
    if (!draftId) return;
    const stableDraftId = draftId;

    let cancelled = false;
    async function loadDraft() {
      setError("");
      setStatus(copy.statuses.calculating);
      try {
        const draft = await api.getUserSubmittedListingDraft(stableDraftId);
        if (cancelled) return;
        const restored = analysisFromDraft(draft);
        setResult(restored);
        setReportResult(null);
        setSavedReport(null);
        setPostViewingResult(null);
        setReferencePreview(null);
        setUrlImportResult(null);
        setForm(formFromDraft(draft));
        resetAIAnswer(restored.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
        setStatus(copy.statuses.checkReady);
        setUrlImportStatus(copy.statuses.fieldsUpdated);
        setReportStatus(copy.statuses.reportNotCreated);
        setSaveStatus(copy.statuses.saved);
      } catch (caught) {
        if (cancelled) return;
        setError(localizedError(caught, locale, copy.statuses.checkError));
        setStatus(copy.statuses.checkError);
      }
    }

    void loadDraft();
    return () => {
      cancelled = true;
    };
  }, [copy, locale, resetAIAnswer]);

  const availableAIQuestions = useMemo(
    () => questionsForAudience(aiQuestions, aiAudience, copy),
    [aiQuestions, aiAudience, copy],
  );
  const selectedAIQuestionLabel =
    availableAIQuestions.find((question) => question.code === selectedAIQuestion)?.label ??
    copy.fallbackQuestion.label;

  useEffect(() => {
    if (
      availableAIQuestions.length > 0 &&
      !availableAIQuestions.some((question) => question.code === selectedAIQuestion)
    ) {
      setSelectedAIQuestion(availableAIQuestions[0].code);
    }
  }, [availableAIQuestions, selectedAIQuestion]);

  async function analyze(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setStatus(copy.statuses.calculating);
    try {
      const payload = await api.analyzeUserSubmittedListing(buildListingPayload(form));
      setResult(payload);
      setReportResult(null);
      setSavedReport(null);
      setPostViewingResult(null);
      resetAIAnswer(payload.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
      setStatus(copy.statuses.checkReady);
      setReportStatus(copy.statuses.reportNotCreated);
      setSaveStatus(copy.statuses.notSaved);
    } catch (caught) {
      setError(localizedError(caught, locale, copy.statuses.checkError));
      setStatus(copy.statuses.checkError);
    }
  }

  async function previewReference() {
    if (!form.confirm_private_analysis) {
      setError(product.consentRequired);
      return;
    }
    await importFromUrl({ generateReport: true });
  }

  async function importFromUrl(options: { generateReport?: boolean } = {}) {
    setError("");
    resetAIAnswer(copy.statuses.aiReadyAfterCheck);
    setUrlImportStatus(product.importStatus);
    try {
      const payload = await api.importUserSubmittedListingFromUrl(form.source_url, true);
      const updatedForm = mergeImportedFields(form, payload.fields);
      setUrlImportResult(payload);
      setReferencePreview(payload.reference_preview);
      setForm(updatedForm);
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
      setError(localizedError(caught, locale, copy.statuses.importError));
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
      setPostViewingResult(null);
      resetAIAnswer(payload.analysis.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
      setStatus(copy.statuses.checkReady);
      setReportStatus(copy.statuses.reportReady);
      setSaveStatus(copy.statuses.notSaved);
    } catch (caught) {
      setError(localizedError(caught, locale, copy.statuses.reportError));
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
      setError(localizedError(caught, locale, copy.statuses.saveError));
      setSaveStatus(copy.statuses.saveError);
    }
  }

  async function trackApartment() {
    if (!result?.draft_id) return;
    setError("");
    setSaveStatus(copy.statuses.saving);
    try {
      await api.createUserSubmittedDraftObjectWatch(result.draft_id, {});
      setSaveStatus(product.track);
    } catch (caught) {
      setError(localizedError(caught, locale, copy.statuses.saveError));
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
      setAiError(localizedError(caught, locale, copy.statuses.aiQuestionsUnavailable));
      setAiStatus(copy.statuses.aiUnavailable);
    } finally {
      setAiLoading(false);
    }
  }

  async function recalculatePostViewing(answers: PostViewingChecklistAnswers) {
    if (!result?.draft_id) {
      throw new Error(copy.statuses.aiNeedsDraft);
    }
    const payload = await api.recalculateUserSubmittedDraftPostViewingVerdict(
      result.draft_id,
      answers,
    );
    setPostViewingResult(payload);
    return payload;
  }

  function updateField<K extends keyof CheckFormState>(key: K, value: CheckFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const analysis = result?.analysis ?? null;
  const displayedDecision = postViewingResult?.updated_decision ?? analysis?.buyer_decision ?? null;
  const verdictTone = analysis ? decisionTone(analysis.scores) : "info";

  return (
    <>
      <section className={analysis ? "check-hero compact" : "check-hero"}>
        <div className="check-hero-copy">
          <span className="landing-eyebrow">WartoMetr</span>
          <h1>{product.heroTitle}</h1>
          <p>{product.heroText}</p>
        </div>
        <div className="check-entry">
          <label className="field">
            <span>{product.urlLabel}</span>
            <input
              className="input check-url-input"
              placeholder={product.urlPlaceholder}
              type="url"
              value={form.source_url}
              onChange={(event) => {
                setForm((current) => clearObjectFieldsForNewUrl(current, event.target.value));
                setReferencePreview(null);
                setUrlImportResult(null);
                setUrlImportStatus(copy.statuses.importNotStarted);
                resetAIAnswer(copy.statuses.aiReadyAfterCheck);
              }}
            />
          </label>
          <div className="intent-toggle" aria-label={product.purpose}>
            <button
              className={form.purchase_intent !== "investment" ? "selected" : ""}
              type="button"
              onClick={() => updateField("purchase_intent", "self")}
            >
              {product.living}
            </button>
            <button
              className={form.purchase_intent === "investment" ? "selected" : ""}
              type="button"
              onClick={() => updateField("purchase_intent", "investment")}
            >
              {product.investment}
            </button>
          </div>
          <button
            className="button primary check-submit"
            disabled={!form.source_url.trim() || !form.confirm_private_analysis}
            type="button"
            onClick={() => void previewReference()}
          >
            <ClipboardCheck size={18} /> {product.check}
          </button>
          <label className="consent-row">
            <input
              type="checkbox"
              checked={form.confirm_private_analysis}
              onChange={(event) => updateField("confirm_private_analysis", event.target.checked)}
            />
            <span>{product.consent} <Link href="/privacy">{product.privacy}</Link></span>
          </label>
          <Link className="check-secondary-link" href="/">
            <Search size={16} /> {product.search}
          </Link>
          <p className="status-line">{urlImportStatus}</p>
        </div>
      </section>

      <CoverageNotice />

      {error ? <ErrorBlock message={error} prefix={copy.errorPrefix} /> : null}

      {displayedDecision ? (
        <BuyerDecisionPanel decision={displayedDecision} locale={locale} />
      ) : null}

      {analysis?.buyer_decision ? (
        <div style={{ marginTop: 16 }}>
          <PostViewingVerdictRecalculator
            disabled={!result?.draft_id}
            locale={locale}
            onRecalculate={recalculatePostViewing}
            result={postViewingResult}
          />
        </div>
      ) : null}

      {urlImportResult || referencePreview ? (
        <section className="trust-strip">
          <div>
            <span>{product.source}</span>
            <strong>
              {safeHttpsUrl(form.source_url) ? (
                <a href={safeHttpsUrl(form.source_url) ?? undefined} target="_blank" rel="noreferrer">
                  {referencePreview?.provider_label ?? result?.source_domain ?? copy.values.manual}
                </a>
              ) : referencePreview?.provider_label ?? result?.source_domain ?? copy.values.manual}
            </strong>
          </div>
          <div>
            <span>{product.observations}</span>
            <strong>{analysis ? analysis.comparables.length : urlImportResult?.fields_extracted.length ?? 0}</strong>
          </div>
          <div>
            <span>{product.updated}</span>
            <strong>{dateValue(urlImportResult?.fetched_at ?? new Date(), locale)}</strong>
          </div>
          <div>
            <span>{product.confidence}</span>
            <strong>{result ? confidenceLabel(result.confidence_score, locale) : copy.values.dash}</strong>
          </div>
          <div>
            <span>{locale === "pl" ? "Zdjęcia" : locale === "ru" ? "Фото" : locale === "uk" ? "Фото" : "Photos"}</span>
            <strong>{locale === "pl" ? "Brak danych ze źródła" : locale === "ru" ? "Источник не сообщил статус" : locale === "uk" ? "Джерело не повідомило статус" : "Source status not supplied"}</strong>
          </div>
          <div>
            <span>{locale === "pl" ? "Ograniczenia" : locale === "ru" ? "Ограничения" : locale === "uk" ? "Обмеження" : "Limitations"}</span>
            <strong>{urlImportResult?.status === "partial" ? (locale === "pl" ? "Część pól wymaga potwierdzenia" : locale === "ru" ? "Часть полей требует проверки" : locale === "uk" ? "Частина полів потребує перевірки" : "Some fields need confirmation") : urlImportResult?.status === "unsupported" ? (locale === "pl" ? "Źródło nieobsługiwane" : locale === "ru" ? "Источник не поддерживается" : locale === "uk" ? "Джерело не підтримується" : "Source not supported") : (locale === "pl" ? "Status zdjęć nieznany" : locale === "ru" ? "Статус фото неизвестен" : locale === "uk" ? "Статус фото невідомий" : "Photo status is unknown")}</strong>
          </div>
        </section>
      ) : null}

      {analysis ? (
        <section className="panel decision-support-panel">
          <div className="panel-header">
            <h2>{product.supporting}</h2>
            <span className={`status-pill ${verdictTone}`}>
              {scoreLabel(analysis.scores.decision_label, locale)}
            </span>
          </div>
          <div className="panel-body score-explainer-grid">
            <ScoreExplainer
              label={copy.metrics.investmentScore}
              value={analysis.scores.investment_score}
              tone="healthy"
              locale={locale}
              reasons={analysis.scores.reasons.slice(0, 3)}
            />
            <ScoreExplainer
              label={copy.metrics.riskScore}
              value={analysis.scores.risk_score}
              tone="warning"
              locale={locale}
              reasons={analysis.scores.warnings.slice(0, 3)}
            />
            <ScoreExplainer
              label={copy.metrics.fairPriceRange}
              valueText={`${money(analysis.scores.fair_price_low, locale)} - ${money(
                analysis.scores.fair_price_high,
                locale,
              )}`}
              tone="info"
              locale={locale}
              reasons={analysis.insights.slice(0, 3)}
            />
            <ScoreExplainer
              label={copy.metrics.confidence}
              valueText={confidenceLabel(result?.confidence_score ?? analysis.scores.fair_price_confidence_score, locale)}
              tone="info"
              locale={locale}
              reasons={[
                `${analysis.comparables.length} ${product.observations.toLocaleLowerCase(locale)}`,
                result?.comparables_basis ?? "",
              ].filter(Boolean)}
            />
          </div>
        </section>
      ) : null}

      {analysis?.future_area_impact ? (
        <div style={{ marginTop: 16 }}>
          <FutureImpactNarrativePanel
            copy={copy.futureImpact}
            impact={analysis.future_area_impact}
            locale={locale}
          />
        </div>
      ) : null}

      <section className={analysis ? "grid-2" : "manual-entry-only"} style={{ marginTop: 16 }}>
        <details className="panel manual-entry-panel" open={Boolean(analysis && !form.source_url)}>
          <summary>
            <span>{product.manualSummary}</span>
            <span className="status-line">{status}</span>
          </summary>
          <form className="panel-body" onSubmit={(event) => void analyze(event)}>
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
              <label className="field">
                <span>{copy.fields.purchaseIntent}</span>
                <select
                  className="select"
                  value={form.purchase_intent}
                  onChange={(event) =>
                    updateField(
                      "purchase_intent",
                      event.target.value as CheckFormState["purchase_intent"],
                    )
                  }
                >
                  {PURCHASE_INTENTS.map((intent) => (
                    <option key={intent} value={intent}>
                      {copy.values.purchaseIntents[intent] ?? intent}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{copy.fields.renovationCondition}</span>
                <select
                  className="select"
                  value={form.renovation_condition}
                  onChange={(event) =>
                    updateField(
                      "renovation_condition",
                      event.target.value as CheckFormState["renovation_condition"],
                    )
                  }
                >
                  <option value="">{copy.values.renovationConditionUnknown}</option>
                  {RENOVATION_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {copy.values.renovationConditions[condition] ?? condition}
                    </option>
                  ))}
                </select>
              </label>
              <NumberField
                label={copy.fields.renovationBudget}
                value={form.custom_renovation_budget_pln}
                onChange={(value) => updateField("custom_renovation_budget_pln", value)}
              />
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

            <p className="status-line">{status}</p>
            <p className="status-line">{reportStatus}</p>
            <p className="status-line">{saveStatus}</p>
            <div className="button-row" style={{ marginTop: 12 }}>
              <button
                className="button primary"
                disabled={!form.confirm_private_analysis}
                type="submit"
              >
                <ClipboardCheck size={16} /> {product.check}
              </button>
            </div>
          </form>
        </details>

        {analysis && result ? (
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
                    <span>{product.save}</span>
                    <strong>
                      {result.draft_id ? copy.statuses.saved : copy.values.notSaved}
                    </strong>
                  </li>
                  <li>
                    <span>{product.updated}</span>
                    <strong>
                      {dateValue(new Date(), locale)}
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
                    <FileText size={16} /> {product.report}
                  </button>
                  <button
                    className="button"
                    disabled={!result.draft_id}
                    type="button"
                    onClick={() => void saveReportToHistory()}
                  >
                    <Save size={16} /> {product.save}
                  </button>
                  <Link
                    className="button"
                    href={`/compare?ids=${encodeURIComponent(analysis.listing.id)}`}
                  >
                    <BarChart3 size={16} /> {product.compare}
                  </Link>
                  <button
                    className="button"
                    disabled={!result.draft_id}
                    type="button"
                    onClick={() => void trackApartment()}
                  >
                    <Bell size={16} /> {product.track}
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
            ) : null}
          </div>
        </aside>
        ) : null}
      </section>

      {analysis ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2 className="icon-title">
              <Brain size={16} /> {product.assistant}
            </h2>
            <span className="status-line">{aiStatus}</span>
          </div>
          <div className="panel-body ai-verdict-body">
            <div className="ai-verdict-controls listing-ai-controls">
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
                    <span className="status-pill info">{selectedAIQuestionLabel}</span>
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
                      {aiAnswer.citations.slice(0, 5).map((citation) => (
                        <div className="ai-citation" key={`${citation.source_id}-${citation.title}`}>
                          <strong>{citation.title}</strong>
                          <small>{citation.excerpt}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="ai-verdict-heading">{copy.assistantColumn.guardrails}</h3>
                    <div className="meta-row">
                      {aiAnswer.guardrails.map((guardrail) => (
                        <span className="status-pill" key={`${guardrail.code}-${guardrail.message}`}>
                          {guardrail.message}
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
              <span className="status-pill info">{product.report}</span>
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
          {[...new Set(items)].map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScoreExplainer({
  label,
  value,
  valueText,
  tone,
  locale,
  reasons,
}: {
  label: string;
  value?: number;
  valueText?: string;
  tone: "healthy" | "warning" | "error" | "info";
  locale: Locale;
  reasons: string[];
}) {
  return (
    <article className="score-explainer">
      <div>
        {value !== undefined ? (
          <span className={`status-pill ${tone}`}>{scoreLevel(value, locale)}</span>
        ) : null}
        <h3>{label}</h3>
        <strong>{valueText ?? `${value ?? 0}/100`}</strong>
      </div>
      <div className="score-explainer-bar" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, value ?? 70))}%` }} />
      </div>
      <ul className="section-list compact">
        {reasons.length > 0 ? reasons.map((reason) => <li key={reason}>{reason}</li>) : <li>-</li>}
      </ul>
    </article>
  );
}

function scoreLevel(value: number, locale: Locale) {
  const labels = {
    en: ["Low", "Medium", "High"],
    pl: ["Niska", "Średnia", "Wysoka"],
    ru: ["Низкая", "Средняя", "Высокая"],
    uk: ["Низька", "Середня", "Висока"],
  }[locale];
  if (value >= 75) return labels[2];
  if (value >= 50) return labels[1];
  return labels[0];
}

function confidenceLabel(score: number, locale: Locale) {
  if (locale === "pl") {
    if (score >= 75) return "Wysoka";
    if (score >= 50) return "Średnia";
    return "Niska";
  }
  if (locale === "ru") {
    if (score >= 75) return "Высокая";
    if (score >= 50) return "Средняя";
    return "Низкая";
  }
  if (locale === "uk") {
    if (score >= 75) return "Висока";
    if (score >= 50) return "Середня";
    return "Низька";
  }
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
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
    purchase_intent: form.purchase_intent,
    renovation_condition: form.renovation_condition || null,
    custom_renovation_budget_pln: toOptionalNumber(form.custom_renovation_budget_pln),
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

function analysisFromDraft(draft: UserSubmittedListingDraft): UserSubmittedListingAnalysis {
  const restored = draft.analysis_payload as Partial<UserSubmittedListingAnalysis>;
  return {
    analysis: restored.analysis!,
    confidence_score: restored.confidence_score ?? draft.confidence_score,
    source_url_private: restored.source_url_private ?? draft.source_url_private,
    source_domain: restored.source_domain ?? draft.source_domain,
    warnings: restored.warnings ?? [],
    comparables_basis: restored.comparables_basis ?? "",
    retention_note: restored.retention_note ?? "",
    draft_id: restored.draft_id ?? draft.id,
    draft_expires_at: restored.draft_expires_at ?? draft.expires_at,
  };
}

function formFromDraft(draft: UserSubmittedListingDraft): CheckFormState {
  const payload = draft.request_payload as Partial<UserSubmittedListingRequest>;
  return {
    ...DEFAULT_FORM,
    title: typeof payload.title === "string" ? payload.title : "",
    source_url: draft.source_url_private ?? "",
    developer_name: draft.developer_name ?? "",
    investment_name: draft.investment_name ?? "",
    address: draft.address,
    city: draft.city,
    district: draft.district,
    market_type: draft.market_type,
    purchase_intent: payload.purchase_intent ?? "unsure",
    renovation_condition: payload.renovation_condition ?? "",
    custom_renovation_budget_pln:
      payload.custom_renovation_budget_pln === null || payload.custom_renovation_budget_pln === undefined
        ? ""
        : String(payload.custom_renovation_budget_pln),
    price: String(draft.price),
    area_m2: String(draft.area_m2),
    rooms: String(draft.rooms),
    floor: payload.floor === null || payload.floor === undefined ? "" : String(payload.floor),
    building_floors:
      payload.building_floors === null || payload.building_floors === undefined
        ? ""
        : String(payload.building_floors),
    building_year:
      payload.building_year === null || payload.building_year === undefined
        ? ""
        : String(payload.building_year),
    lat: payload.lat === null || payload.lat === undefined ? "" : String(payload.lat),
    lon: payload.lon === null || payload.lon === undefined ? "" : String(payload.lon),
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
    purchase_intent: current.purchase_intent,
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
