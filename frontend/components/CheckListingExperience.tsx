"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Brain,
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileUp,
  FileText,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { BuyerDecisionPanel } from "@/components/BuyerDecisionPanel";
import { AuthForm } from "@/components/AuthForm";
import { CHECK_ENTRY_COPY } from "@/lib/checkEntryMessages";
import { confidenceMessages, valuationConfidenceLevel } from "@/lib/confidenceMessages";
import { DECISION_OVERVIEW_COPY } from "@/lib/decisionOverviewMessages";
import { CoverageNotice } from "@/components/CoverageNotice";
import { ComparableEvidencePanel } from "@/components/ComparableEvidencePanel";
import { DecisionSummary, decisionSummaryFromScores } from "@/components/DecisionSummary";
import { safeHttpsUrl } from "@/components/ListingProvenance";
import { FutureImpactNarrativePanel } from "@/components/FutureImpactNarrativePanel";
import { PostViewingVerdictRecalculator } from "@/components/PostViewingVerdictRecalculator";
import { RentalEvidencePanel } from "@/components/RentalEvidencePanel";
import { ScoreDataGap } from "@/components/ScoreBars";
import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  ApiError,
  reportContentUrl,
  type AIListingAnswer,
  type AIQuestionCode,
  type AIQuestionDescriptor,
  type BuyerProfile,
  type DeveloperReputation,
  type DocumentAnalysisDocumentType,
  type DocumentCheck,
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
import { dateValue, money } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import { CHECK_PAGE_COPY, type CheckPageCopy, type Locale } from "@/lib/i18n";
import { decisionTone, scoreExplanationReasons, scoreLabel } from "@/lib/scoreLabels";
import { useLocalePreference } from "@/lib/useLocalePreference";
import {
  productConfidence,
  productIntent,
  productVerdict,
  trackProductEvent,
} from "@/lib/productAnalytics";

type CheckFormState = {
  title: string;
  source_url: string;
  developer_name: string;
  investment_name: string;
  address: string;
  city: string;
  district: string;
  market_type: "" | "primary" | "secondary";
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
  city: "",
  district: "",
  market_type: "",
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

function shouldOpenManualEntry(caught: unknown) {
  return caught instanceof ApiError && caught.status === 400;
}

const PRODUCT_COPY = {
  en: {
    heroTitle: "Check an apartment before buying",
    heroText:
      "Paste an Otodom or OLX link. WartoMetr estimates a fair price, risks, total purchase cost and negotiation range.",
    urlLabel: "Otodom or OLX link",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Check apartment",
    search: "Or search for an apartment with WartoMetr",
    manualSummary: "Enter apartment details manually",
    manualHint: "No link? Address, price, size and rooms are enough to start.",
    advancedSummary: "Additional details (optional)",
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
    consent:
      "I understand that WartoMetr will fetch this public listing, keep a private reference for the analysis, and let me delete the draft.",
    privacy: "Privacy details",
    consentRequired: "Confirm the data-use notice before importing the link.",
    importPartialTitle: "Some listing details were found",
    importPartialText:
      "We do not fill in unknown values. Check the imported fields and complete anything missing before creating the report.",
    importFailedTitle: "The listing could not be read",
    importFailedText:
      "No reliable listing details were extracted. Try again or enter the address, price, size and rooms manually.",
    importUnsupportedTitle: "This listing source is not supported",
    importUnsupportedText: "We can import Otodom and OLX listings. You can still enter the apartment details manually.",
  },
  pl: {
    heroTitle: "Sprawdź mieszkanie przed zakupem",
    heroText:
      "Wklej link z Otodom lub OLX. WartoMetr oszacuje cenę rynkową, ryzyka, całkowity koszt zakupu i zakres negocjacji.",
    urlLabel: "Link Otodom lub OLX",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Sprawdź mieszkanie",
    search: "Albo wyszukaj mieszkanie w WartoMetr",
    manualSummary: "Wpisz dane mieszkania ręcznie",
    manualHint: "Nie masz linku? Na początek wystarczą adres, cena, metraż i liczba pokoi.",
    advancedSummary: "Dane dodatkowe (opcjonalne)",
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
    consent:
      "Rozumiem, że WartoMetr pobierze to publiczne ogłoszenie, zachowa prywatne odniesienie do analizy i umożliwi usunięcie szkicu.",
    privacy: "Szczegóły prywatności",
    consentRequired: "Potwierdź zasady wykorzystania danych przed importem linku.",
    importPartialTitle: "Znaleźliśmy część danych ogłoszenia",
    importPartialText:
      "Nie uzupełniamy nieznanych wartości. Sprawdź zaimportowane pola i wpisz brakujące dane przed utworzeniem raportu.",
    importFailedTitle: "Nie udało się odczytać ogłoszenia",
    importFailedText:
      "Nie udało się pobrać wiarygodnych danych ogłoszenia. Spróbuj ponownie albo wpisz ręcznie adres, cenę, metraż i liczbę pokoi.",
    importUnsupportedTitle: "To źródło ogłoszenia nie jest obsługiwane",
    importUnsupportedText: "Importujemy ogłoszenia z Otodom i OLX. Dane mieszkania możesz nadal wpisać ręcznie.",
  },
  ru: {
    heroTitle: "Проверьте квартиру перед покупкой",
    heroText:
      "Вставьте ссылку Otodom или OLX. WartoMetr оценит рыночный диапазон, риски, полную стоимость покупки и диапазон торга.",
    urlLabel: "Ссылка Otodom или OLX",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Проверить квартиру",
    search: "Или найти квартиру в WartoMetr",
    manualSummary: "Ввести параметры квартиры вручную",
    manualHint: "Нет ссылки? Для начала достаточно адреса, цены, площади и числа комнат.",
    advancedSummary: "Дополнительные данные (необязательно)",
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
    consent:
      "Я понимаю, что WartoMetr получит это публичное объявление, сохранит приватную ссылку для анализа и позволит удалить черновик.",
    privacy: "Подробнее о приватности",
    consentRequired: "Подтвердите правила использования данных перед импортом ссылки.",
    importPartialTitle: "Найдена только часть данных объявления",
    importPartialText:
      "Мы не подставляем неизвестные значения. Проверьте импортированные поля и заполните недостающие данные перед созданием отчета.",
    importFailedTitle: "Не удалось прочитать объявление",
    importFailedText:
      "Надежные данные объявления не извлечены. Повторите попытку или введите вручную адрес, цену, площадь и число комнат.",
    importUnsupportedTitle: "Источник объявления не поддерживается",
    importUnsupportedText: "Мы импортируем объявления с Otodom и OLX. Параметры квартиры можно ввести вручную.",
  },
  uk: {
    heroTitle: "Перевірте квартиру перед купівлею",
    heroText:
      "Вставте посилання Otodom або OLX. WartoMetr оцінить ринковий діапазон, ризики, повну вартість купівлі та діапазон торгу.",
    urlLabel: "Посилання Otodom або OLX",
    urlPlaceholder: "https://www.otodom.pl/...",
    check: "Перевірити квартиру",
    search: "Або знайти квартиру в WartoMetr",
    manualSummary: "Ввести параметри квартири вручну",
    manualHint: "Немає посилання? Для початку достатньо адреси, ціни, площі та кількості кімнат.",
    advancedSummary: "Додаткові дані (необов'язково)",
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
    consent:
      "Я розумію, що WartoMetr отримає це публічне оголошення, збереже приватне посилання для аналізу та дозволить видалити чернетку.",
    privacy: "Деталі приватності",
    consentRequired: "Підтвердьте правила використання даних перед імпортом посилання.",
    importPartialTitle: "Знайдено лише частину даних оголошення",
    importPartialText:
      "Ми не підставляємо невідомі значення. Перевірте імпортовані поля та заповніть відсутні дані перед створенням звіту.",
    importFailedTitle: "Не вдалося прочитати оголошення",
    importFailedText:
      "Надійні дані оголошення не вилучено. Спробуйте ще раз або введіть вручну адресу, ціну, площу та кількість кімнат.",
    importUnsupportedTitle: "Джерело оголошення не підтримується",
    importUnsupportedText: "Ми імпортуємо оголошення з Otodom і OLX. Параметри квартири можна ввести вручну.",
  },
} as const;

type ProductCopy = (typeof PRODUCT_COPY)[Locale];
type CoreOperation = "draft" | "import" | "check" | "report" | "save" | "track" | "document";
const PROFILE_NOTICE_COPY: Record<Locale, { applied: string; budget: string; edit: string }> = {
  en: { applied: "Using your saved buying purpose", budget: "Saved maximum price", edit: "Edit profile" },
  pl: { applied: "Używamy zapisanego celu zakupu", budget: "Zapisana maksymalna cena", edit: "Edytuj profil" },
  ru: { applied: "Используем сохраненную цель покупки", budget: "Сохраненная максимальная цена", edit: "Изменить профиль" },
  uk: { applied: "Використовуємо збережену мету купівлі", budget: "Збережена максимальна ціна", edit: "Змінити профіль" },
};

const DOCUMENT_CHECK_COPY = {
  en: {
    title: "Document check",
    intro: "Attach a document or paste a short note. WartoMetr extracts only checklist signals and keeps unknowns visible.",
    type: "Document type",
    file: "File",
    note: "Document notes or copied text",
    notePlaceholder: "Paste a short excerpt, KW section note, area statement or fee/debt information.",
    consent: "I have the right to use this document for private analysis.",
    submit: "Analyze document",
    loading: "Checking document...",
    empty: "No documents checked for this apartment yet.",
    disabled: "Save this private draft before checking documents.",
    expert: "Ask legal/expert review before zadatek",
    provenance: "Source",
    unknowns: "Still unknown",
    conflicts: "Needs manual review",
    retained: "Original file is not stored by default.",
    restrictions: "PDF, PNG, JPG and UTF-8 TXT up to 10 MB. OCR is not enabled in this first slice.",
    deleted: "Document check removed.",
    status: { analyzed: "Analyzed", needs_review: "Needs review", not_supported: "Not supported" },
    signal: { evidence_found: "Found", needs_review: "Needs review", conflict: "Conflict", missing: "Missing", not_supported: "Not supported" },
    types: {
      kw_extract: "Land and mortgage register",
      floor_plan: "Floor plan / usable area",
      community_statement: "Wspólnota fees or debt",
      energy_certificate: "Energy certificate",
      developer_prospectus: "Developer prospectus",
      building_permit: "Permit / handover document",
      agreement_draft: "Agreement draft",
      other: "Other document",
    },
  },
  pl: {
    title: "Sprawdzenie dokumentu",
    intro: "Dodaj dokument albo krótką notatkę. WartoMetr wyciąga tylko sygnały do checklisty i pokazuje, co nadal jest niepewne.",
    type: "Typ dokumentu",
    file: "Plik",
    note: "Notatka lub krótki tekst z dokumentu",
    notePlaceholder: "Wklej krótki fragment, informację z KW, metraż, czynsz lub zadłużenie.",
    consent: "Mam prawo użyć tego dokumentu do prywatnej analizy.",
    submit: "Sprawdź dokument",
    loading: "Sprawdzamy dokument...",
    empty: "Brak sprawdzonych dokumentów dla tego mieszkania.",
    disabled: "Zapisz prywatny szkic, aby sprawdzać dokumenty.",
    expert: "Poproś o przegląd prawny/ekspercki przed zadatkiem",
    provenance: "Źródło",
    unknowns: "Nadal nieznane",
    conflicts: "Wymaga ręcznej kontroli",
    retained: "Oryginalny plik domyślnie nie jest przechowywany.",
    restrictions: "PDF, PNG, JPG i UTF-8 TXT do 10 MB. OCR nie działa w tym pierwszym etapie.",
    deleted: "Sprawdzenie dokumentu usunięte.",
    status: { analyzed: "Przeanalizowano", needs_review: "Do sprawdzenia", not_supported: "Nieobsługiwany" },
    signal: { evidence_found: "Znaleziono", needs_review: "Do sprawdzenia", conflict: "Konflikt", missing: "Brak", not_supported: "Nieobsługiwane" },
    types: {
      kw_extract: "Księga wieczysta",
      floor_plan: "Rzut / powierzchnia użytkowa",
      community_statement: "Opłaty lub zadłużenie wspólnoty",
      energy_certificate: "Świadectwo energetyczne",
      developer_prospectus: "Prospekt dewelopera",
      building_permit: "Pozwolenie / odbiór",
      agreement_draft: "Projekt umowy",
      other: "Inny dokument",
    },
  },
  ru: {
    title: "Проверка документа",
    intro: "Добавьте документ или короткую заметку. WartoMetr извлекает только сигналы для чеклиста и честно показывает неизвестное.",
    type: "Тип документа",
    file: "Файл",
    note: "Заметка или короткий текст из документа",
    notePlaceholder: "Вставьте короткий фрагмент, заметку из KW, площадь, платежи или задолженность.",
    consent: "У меня есть право использовать этот документ для приватного анализа.",
    submit: "Проверить документ",
    loading: "Проверяем документ...",
    empty: "Для этой квартиры документы еще не проверялись.",
    disabled: "Сохраните приватный черновик, чтобы проверять документы.",
    expert: "Запросить юридическую/экспертную проверку до zadatek",
    provenance: "Источник",
    unknowns: "Все еще неизвестно",
    conflicts: "Нужна ручная проверка",
    retained: "Оригинальный файл по умолчанию не сохраняется.",
    restrictions: "PDF, PNG, JPG и UTF-8 TXT до 10 MB. OCR на этом первом этапе не включен.",
    deleted: "Проверка документа удалена.",
    status: { analyzed: "Проанализировано", needs_review: "Нужна проверка", not_supported: "Не поддерживается" },
    signal: { evidence_found: "Найдено", needs_review: "Нужна проверка", conflict: "Конфликт", missing: "Нет данных", not_supported: "Не поддерживается" },
    types: {
      kw_extract: "Księga wieczysta / реестр",
      floor_plan: "План / полезная площадь",
      community_statement: "Платежи или долги wspólnota",
      energy_certificate: "Энергетический сертификат",
      developer_prospectus: "Проспект застройщика",
      building_permit: "Разрешение / приемка",
      agreement_draft: "Проект договора",
      other: "Другой документ",
    },
  },
  uk: {
    title: "Перевірка документа",
    intro: "Додайте документ або коротку нотатку. WartoMetr витягує лише сигнали для чеклиста і чесно показує невідоме.",
    type: "Тип документа",
    file: "Файл",
    note: "Нотатка або короткий текст з документа",
    notePlaceholder: "Вставте короткий фрагмент, нотатку з KW, площу, платежі або борг.",
    consent: "Я маю право використати цей документ для приватного аналізу.",
    submit: "Перевірити документ",
    loading: "Перевіряємо документ...",
    empty: "Для цієї квартири документи ще не перевірялися.",
    disabled: "Збережіть приватну чернетку, щоб перевіряти документи.",
    expert: "Запросити юридичну/експертну перевірку до zadatek",
    provenance: "Джерело",
    unknowns: "Все ще невідомо",
    conflicts: "Потрібна ручна перевірка",
    retained: "Оригінальний файл за замовчуванням не зберігається.",
    restrictions: "PDF, PNG, JPG і UTF-8 TXT до 10 MB. OCR на цьому першому етапі не увімкнено.",
    deleted: "Перевірку документа видалено.",
    status: { analyzed: "Проаналізовано", needs_review: "Потрібна перевірка", not_supported: "Не підтримується" },
    signal: { evidence_found: "Знайдено", needs_review: "Потрібна перевірка", conflict: "Конфлікт", missing: "Немає даних", not_supported: "Не підтримується" },
    types: {
      kw_extract: "Księga wieczysta / реєстр",
      floor_plan: "План / корисна площа",
      community_statement: "Платежі або борги wspólnota",
      energy_certificate: "Енергетичний сертифікат",
      developer_prospectus: "Проспект забудовника",
      building_permit: "Дозвіл / приймання",
      agreement_draft: "Проект договору",
      other: "Інший документ",
    },
  },
} as const;

export default function CheckListingExperience() {
  const { locale } = useLocalePreference();
  const copy = CHECK_PAGE_COPY[locale];
  const product = PRODUCT_COPY[locale];
  const entry = CHECK_ENTRY_COPY[locale];
  const [form, setForm] = useState<CheckFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<UserSubmittedListingAnalysis | null>(null);
  const [referencePreview, setReferencePreview] = useState<SourceReferencePreview | null>(null);
  const [urlImportResult, setUrlImportResult] = useState<SourceUrlImportResult | null>(null);
  const [reportResult, setReportResult] = useState<UserSubmittedListingReport | null>(null);
  const [savedReport, setSavedReport] = useState<GeneratedReport | null>(null);
  const [postViewingResult, setPostViewingResult] = useState<PostViewingVerdictRecalculation | null>(null);
  const [documentChecks, setDocumentChecks] = useState<DocumentCheck[]>([]);
  const [documentType, setDocumentType] = useState<DocumentAnalysisDocumentType>("kw_extract");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState("");
  const [documentConsent, setDocumentConsent] = useState(false);
  const [documentStatus, setDocumentStatus] = useState("");
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
  const [activeOperation, setActiveOperation] = useState<CoreOperation | null>(null);
  const [retryAction, setRetryAction] = useState<CoreOperation | null>(null);
  const [lastReportForm, setLastReportForm] = useState<CheckFormState | null>(null);
  const [draftRetryToken, setDraftRetryToken] = useState(0);
  const [manualEntryRequested, setManualEntryRequested] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [editedFields, setEditedFields] = useState<string[]>([]);
  const [areaContext, setAreaContext] = useState("");
  const [entryExpanded, setEntryExpanded] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const requestEpoch = useRef(0);
  const mutationBusy = useRef(false);
  const confirmationRef = useRef<HTMLDetailsElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const district = params.get("district") ?? "";
    setAreaContext(district);
    if (!params.has("draft")) {
      setForm((current) => ({ ...current, district, city: params.get("city") ?? "" }));
      try {
        const stored = sessionStorage.getItem("wartometr-check-entry-v1");
        const recovery = stored ? JSON.parse(stored) : null;
        if (recovery?.query === window.location.search && Date.now() - recovery.savedAt < 30 * 60_000) {
          const restored = { ...DEFAULT_FORM };
          for (const key of Object.keys(DEFAULT_FORM) as (keyof CheckFormState)[]) {
            if (typeof recovery.form?.[key] === typeof DEFAULT_FORM[key]) {
              Object.assign(restored, { [key]: recovery.form[key] });
            }
          }
          setForm(restored);
          setAwaitingConfirmation(Boolean(recovery.awaitingConfirmation));
          setConfirmed(Boolean(recovery.confirmed));
          setEditedFields(Array.isArray(recovery.editedFields) ? recovery.editedFields : []);
          setUrlImportResult(recovery.importResult ?? null);
          setManualEntryRequested(Boolean(recovery.manualEntryRequested));
        }
      } catch {
        // In-place sign-in still preserves state when browser storage is unavailable.
      }
    }
    setRecoveryReady(true);
    return () => { requestEpoch.current += 1; };
  }, []);

  useEffect(() => {
    if (!recoveryReady) return;
    try {
        sessionStorage.setItem("wartometr-check-entry-v1", JSON.stringify({
          savedAt: Date.now(), query: window.location.search, form,
          awaitingConfirmation, confirmed, editedFields, importResult: urlImportResult, manualEntryRequested,
        }));
    } catch {
      // Storage is best effort; the mounted form remains the source of truth.
    }
  }, [recoveryReady, form, awaitingConfirmation, confirmed, editedFields, urlImportResult, manualEntryRequested, result]);

  useEffect(() => {
    if (awaitingConfirmation) confirmationRef.current?.scrollIntoView({ block: "start" });
  }, [awaitingConfirmation]);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ block: "start" });
  }, [result]);

  useEffect(() => {
    const draftId = result?.draft_id;
    if (!draftId) {
      setDocumentChecks([]);
      setDocumentStatus(DOCUMENT_CHECK_COPY[locale].disabled);
      return;
    }
    let cancelled = false;
    api.listUserSubmittedDraftDocuments(draftId)
      .then((payload) => {
        if (cancelled) return;
        setDocumentChecks(payload);
        setDocumentStatus(payload.length ? DOCUMENT_CHECK_COPY[locale].retained : DOCUMENT_CHECK_COPY[locale].empty);
      })
      .catch((caught) => {
        if (cancelled) return;
        setDocumentStatus(localizedError(caught, locale, copy.statuses.checkError));
      });
    return () => {
      cancelled = true;
    };
  }, [copy.statuses.checkError, locale, result?.draft_id]);

  const resetAIAnswer = useCallback(
    (nextStatus = copy.statuses.aiReadyAfterCheck) => {
      setAiAnswer(null);
      setAiError("");
      setAiStatus(nextStatus);
    },
    [copy.statuses.aiReadyAfterCheck],
  );

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("draft")) return;
    let cancelled = false;
    api.getSession().then(() => api.getMe()).then((account) => {
      if (cancelled || !account.buyer_profile) return;
      setBuyerProfile(account.buyer_profile);
      setForm((current) => current.purchase_intent === "unsure"
        ? { ...current, purchase_intent: account.buyer_profile?.intent ?? "unsure" }
        : current);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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
      setRetryAction(null);
      setActiveOperation("draft");
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
        setConfirmed(true);
        setAwaitingConfirmation(false);
        resetAIAnswer(restored.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
        setStatus(copy.statuses.checkReady);
        setUrlImportStatus(copy.statuses.fieldsUpdated);
        setReportStatus(copy.statuses.reportNotCreated);
        setSaveStatus(copy.statuses.saved);
        setRetryAction(null);
      } catch (caught) {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) setAuthRequired(true);
        setError(localizedError(caught, locale, copy.statuses.checkError));
        setStatus(copy.statuses.checkError);
        setRetryAction("draft");
      } finally {
        if (!cancelled) setActiveOperation(null);
      }
    }

    void loadDraft();
    return () => {
      cancelled = true;
    };
  }, [copy, draftRetryToken, locale, resetAIAnswer]);

  const availableAIQuestions = useMemo(
    () => questionsForAudience(aiQuestions, aiAudience, copy),
    [aiQuestions, aiAudience, copy],
  );
  const selectedAIQuestionLabel =
    availableAIQuestions.find((question) => question.code === selectedAIQuestion)?.label ?? copy.fallbackQuestion.label;

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
    if (mutationBusy.current || !form.confirm_private_analysis) return;
    if (missingRequiredReportFields(form).length || !form.market_type) {
      setError(entry.required);
      return;
    }
    mutationBusy.current = true;
    const epoch = ++requestEpoch.current;
    setConfirmed(true);
    setAuthRequired(false);
    setError("");
    setRetryAction(null);
    setActiveOperation("check");
    setResult(null);
    setReportResult(null);
    setSavedReport(null);
    setPostViewingResult(null);
    setStatus(copy.statuses.calculating);
    trackProductEvent("check_started", locale, {
      surface: "check",
      intent: productIntent(form.purchase_intent),
      market_type: form.market_type,
      entry_mode: form.source_url ? "url" : "manual",
    });
    try {
      const payload = await api.analyzeUserSubmittedListing(buildListingPayload(form));
      if (epoch !== requestEpoch.current) return;
      setResult(payload);
      setAwaitingConfirmation(false);
      setEntryExpanded(false);
      trackCompletedAnalysis(payload);
      setReportResult(null);
      setSavedReport(null);
      setPostViewingResult(null);
      resetAIAnswer(payload.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
      setStatus(copy.statuses.checkReady);
      setReportStatus(copy.statuses.reportNotCreated);
      setSaveStatus(copy.statuses.notSaved);
      setRetryAction(null);
      setManualEntryRequested(false);
    } catch (caught) {
      if (epoch !== requestEpoch.current) return;
      if (caught instanceof ApiError && caught.status === 401) setAuthRequired(true);
      if (shouldOpenManualEntry(caught)) setManualEntryRequested(true);
      setError(localizedError(caught, locale, copy.statuses.checkError));
      setStatus(copy.statuses.checkError);
      setRetryAction("check");
    } finally {
      if (epoch === requestEpoch.current) {
        setActiveOperation(null);
        mutationBusy.current = false;
      }
    }
  }

  async function previewReference() {
    if (!form.confirm_private_analysis) {
      setError(product.consentRequired);
      return;
    }
    await importFromUrl();
  }

  async function importFromUrl() {
    if (mutationBusy.current || !form.confirm_private_analysis) return;
    mutationBusy.current = true;
    const epoch = ++requestEpoch.current;
    setAuthRequired(false);
    setAwaitingConfirmation(false);
    setConfirmed(false);
    setEditedFields([]);
    setResult(null);
    setReportResult(null);
    setSavedReport(null);
    setPostViewingResult(null);
    setError("");
    setRetryAction(null);
    setActiveOperation("import");
    setUrlImportResult(null);
    setReferencePreview(null);
    resetAIAnswer(copy.statuses.aiReadyAfterCheck);
    setUrlImportStatus(entry.importing);
    try {
      const payload = await api.importUserSubmittedListingFromUrl(form.source_url, true);
      if (epoch !== requestEpoch.current) return;
      const updatedForm = mergeImportedFields(form, payload.fields);
      setUrlImportResult(payload);
      setReferencePreview(payload.reference_preview);
      setForm(updatedForm);
      setUrlImportStatus(urlImportStatusLabel(payload, copy));
      setReportStatus(copy.statuses.reportNotCreated);
      setSaveStatus(copy.statuses.notSaved);
      setAwaitingConfirmation(true);
      setManualEntryRequested(true);
      setStatus(entry.confirmHint);
      setRetryAction(null);
    } catch (caught) {
      if (epoch !== requestEpoch.current) return;
      if (caught instanceof ApiError && caught.status === 401) setAuthRequired(true);
      if (shouldOpenManualEntry(caught)) setManualEntryRequested(true);
      setError(localizedError(caught, locale, copy.statuses.importError));
      setUrlImportStatus(copy.statuses.importError);
      setRetryAction("import");
    } finally {
      if (epoch === requestEpoch.current) {
        setActiveOperation(null);
        mutationBusy.current = false;
      }
    }
  }

  async function createReport() {
    await createReportFromForm(form);
  }

  async function createReportFromForm(targetForm: CheckFormState) {
    if (mutationBusy.current || awaitingConfirmation || !confirmed) return;
    if (!targetForm.market_type) { setError(entry.required); return; }
    setError("");
    setRetryAction(null);
    const missingFields = missingRequiredReportFields(targetForm);
    if (missingFields.length > 0) {
      setReportStatus(copy.statuses.missingFields(missingFieldLabels(missingFields, copy)));
      setStatus(copy.statuses.fillRequiredForReport);
      return;
    }
    mutationBusy.current = true;
    const epoch = ++requestEpoch.current;
    setReportResult(null);
    setSavedReport(null);
    setPostViewingResult(null);
    setLastReportForm(targetForm);
    setActiveOperation("report");
    setReportStatus(copy.statuses.reportGenerating);
    try {
      const payload = await api.createUserSubmittedListingReport({
        ...buildListingPayload(targetForm),
        audience: "buyer",
      });
      if (epoch !== requestEpoch.current) return;
      setResult(payload.analysis);
      setReportResult(payload);
      setSavedReport(null);
      setPostViewingResult(null);
      resetAIAnswer(payload.analysis.draft_id ? copy.statuses.aiReady : copy.statuses.aiNeedsDraft);
      setStatus(copy.statuses.checkReady);
      setReportStatus(copy.statuses.reportReady);
      setSaveStatus(copy.statuses.notSaved);
      setRetryAction(null);
      setManualEntryRequested(false);
    } catch (caught) {
      if (epoch !== requestEpoch.current) return;
      if (caught instanceof ApiError && caught.status === 401) setAuthRequired(true);
      if (shouldOpenManualEntry(caught)) setManualEntryRequested(true);
      setError(localizedError(caught, locale, copy.statuses.reportError));
      setReportStatus(copy.statuses.reportError);
      setRetryAction("report");
    } finally {
      if (epoch === requestEpoch.current) {
        setActiveOperation(null);
        mutationBusy.current = false;
      }
    }
  }

  async function saveReportToHistory() {
    if (!result?.draft_id) return;
    setError("");
    setRetryAction(null);
    setActiveOperation("save");
    setSaveStatus(copy.statuses.saving);
    try {
      const payload = await api.generateUserSubmittedDraftReport(result.draft_id, {
        audience: "buyer",
        report_format: "html",
      });
      setSavedReport(payload);
      setSaveStatus(copy.statuses.saved);
      setRetryAction(null);
    } catch (caught) {
      setError(localizedError(caught, locale, copy.statuses.saveError));
      setSaveStatus(copy.statuses.saveError);
      setRetryAction("save");
    } finally {
      setActiveOperation(null);
    }
  }

  async function trackApartment() {
    if (!result?.draft_id) return;
    setError("");
    setRetryAction(null);
    setActiveOperation("track");
    setSaveStatus(copy.statuses.saving);
    try {
      await api.createUserSubmittedDraftObjectWatch(result.draft_id, {});
      setSaveStatus(product.track);
      setRetryAction(null);
    } catch (caught) {
      setError(localizedError(caught, locale, copy.statuses.saveError));
      setSaveStatus(copy.statuses.saveError);
      setRetryAction("track");
    } finally {
      setActiveOperation(null);
    }
  }

  async function analyzeDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result?.draft_id || !documentConsent || activeOperation !== null) return;
    setError("");
    setActiveOperation("document");
    setDocumentStatus(DOCUMENT_CHECK_COPY[locale].loading);
    try {
      const payload = await api.analyzeUserSubmittedDraftDocument({
        draftId: result.draft_id,
        documentType,
        metadataText: documentText,
        file: documentFile,
        confirmPrivateDocumentAnalysis: documentConsent,
      });
      setDocumentChecks((current) => [payload, ...current.filter((item) => item.id !== payload.id)]);
      setDocumentFile(null);
      setDocumentText("");
      setDocumentConsent(false);
      setDocumentStatus(DOCUMENT_CHECK_COPY[locale].retained);
    } catch (caught) {
      setDocumentStatus(localizedError(caught, locale, copy.statuses.checkError));
    } finally {
      setActiveOperation(null);
    }
  }

  async function deleteDocumentCheck(documentCheckId: string) {
    if (!result?.draft_id || activeOperation !== null) return;
    setError("");
    setActiveOperation("document");
    try {
      await api.deleteUserSubmittedDraftDocument(result.draft_id, documentCheckId);
      setDocumentChecks((current) => current.filter((item) => item.id !== documentCheckId));
      setDocumentStatus(DOCUMENT_CHECK_COPY[locale].deleted);
    } catch (caught) {
      setDocumentStatus(localizedError(caught, locale, copy.statuses.checkError));
    } finally {
      setActiveOperation(null);
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
      if (selectedAIQuestion === "negotiation" && !answer.refused) {
        trackProductEvent("negotiation_message_generated", locale, {
          surface: "check",
          result_state: "success",
        });
      }
      setAiStatus(
        answer.refused ? copy.statuses.aiRefused : copy.statuses.aiSaved(answer.usage_log_id ?? answer.subject_id),
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
    const payload = await api.recalculateUserSubmittedDraftPostViewingVerdict(result.draft_id, answers);
    setPostViewingResult(payload);
    return payload;
  }

  function updateField<K extends keyof CheckFormState>(key: K, value: CheckFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setEditedFields((current) => current.includes(key) ? current : [...current, key]);
    setConfirmed(false);
  }

  function trackCompletedAnalysis(payload: UserSubmittedListingAnalysis) {
    const confidence = productConfidence(payload.confidence_score);
    trackProductEvent("check_completed", locale, {
      surface: "check",
      intent: productIntent(payload.analysis.buyer_decision?.selected_intent),
      market_type: payload.analysis.listing.market_type,
      result_state: payload.analysis.buyer_decision ? "success" : "partial",
      confidence_level: confidence,
    });
    trackProductEvent("verdict_viewed", locale, {
      surface: "check",
      verdict: productVerdict(payload.analysis.buyer_decision?.verdict.status),
      confidence_level: confidence,
    });
    trackProductEvent("risk_opened", locale, {
      surface: "check",
      evidence_state: payload.analysis.buyer_decision?.verdict.top_risks.length
        ? "available"
        : "insufficient",
    });
    trackProductEvent("comparables_opened", locale, {
      surface: "check",
      evidence_state: payload.analysis.comparables.length ? "available" : "insufficient",
    });
  }

  const analysis = result?.analysis ?? null;
  const displayedDecision = postViewingResult?.updated_decision ?? analysis?.buyer_decision ?? null;
  const verdictTone = analysis ? decisionTone(analysis.scores) : "info";
  const manualEntryOpen = Boolean(
    manualEntryRequested ||
      awaitingConfirmation,
  );

  function fieldStatus(key: keyof CheckFormState) {
    if (!awaitingConfirmation) return null;
    const label = !String(form[key]).trim() ? entry.missing
      : confirmed ? entry.confirmed : editedFields.includes(key) ? entry.entered : entry.extracted;
    return <small className="check-field-origin">{label}</small>;
  }

  function retryFailedOperation() {
    switch (retryAction) {
      case "draft":
        setError("");
        setDraftRetryToken((current) => current + 1);
        return;
      case "import":
        void importFromUrl();
        return;
      case "check":
        void analyze();
        return;
      case "report":
        void createReportFromForm(lastReportForm ?? form);
        return;
      case "save":
        void saveReportToHistory();
        return;
      case "track":
        void trackApartment();
        return;
      default:
        return;
    }
  }

  return (
    <>
      {analysis && !entryExpanded ? (
        <header className="check-result-entry">
          <h1>{analysis.listing.address || analysis.listing.title}</h1>
          <button className="button" disabled={activeOperation !== null} type="button" onClick={() => {
            setEntryExpanded(true); setManualEntryRequested(true);
          }}>{entry.edit}</button>
          <button className="button" disabled={activeOperation !== null} type="button" onClick={() => {
            requestEpoch.current += 1;
            setForm(DEFAULT_FORM); setResult(null); setReportResult(null); setSavedReport(null);
            setPostViewingResult(null); setUrlImportResult(null); setReferencePreview(null);
            setConfirmed(false); setAwaitingConfirmation(false); setManualEntryRequested(false);
            setError(""); setRetryAction(null); setAreaContext("");
            window.history.replaceState(null, "", window.location.pathname);
          }}>{entry.newCheck}</button>
        </header>
      ) : (
      <section aria-busy={activeOperation !== null} className={analysis ? "check-hero compact" : "check-hero"}>
        <div className="check-hero-copy">
          <span className="landing-eyebrow">WartoMetr</span>
          <h1>{product.heroTitle}</h1>
          <p>{entry.heroText}</p>
          <p className="check-benefits">{entry.benefits}</p>
        </div>
        <div className="check-entry">
          <label className="field">
            <span>{product.urlLabel}</span>
            <input
              className="input check-url-input"
              disabled={activeOperation !== null}
              placeholder={product.urlPlaceholder}
              type="url"
              value={form.source_url}
              onChange={(event) => {
                requestEpoch.current += 1;
                setAwaitingConfirmation(false);
                setConfirmed(false);
                setEditedFields([]);
                setForm((current) => clearObjectFieldsForNewUrl(current, event.target.value));
                setManualEntryRequested(false);
                setResult(null);
                setReportResult(null);
                setSavedReport(null);
                setPostViewingResult(null);
                setError("");
                setRetryAction(null);
                setStatus(copy.statuses.ready);
                setReportStatus(copy.statuses.reportNotCreated);
                setSaveStatus(copy.statuses.notSaved);
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
              disabled={activeOperation !== null}
              type="button"
              onClick={() => updateField("purchase_intent", "self")}
            >
              {product.living}
            </button>
            <button
              className={form.purchase_intent === "investment" ? "selected" : ""}
              disabled={activeOperation !== null}
              type="button"
              onClick={() => updateField("purchase_intent", "investment")}
            >
              {product.investment}
            </button>
          </div>
          {buyerProfile ? (
            <p className="profile-context-note">
              <strong>{PROFILE_NOTICE_COPY[locale].applied}.</strong>{" "}
              {buyerProfile.budget_pln
                ? `${PROFILE_NOTICE_COPY[locale].budget}: ${money(buyerProfile.budget_pln, locale)}. `
                : null}
              <Link href="/account">{PROFILE_NOTICE_COPY[locale].edit}</Link>
            </p>
          ) : null}
          <button
            className="button primary check-submit"
            disabled={activeOperation !== null || !form.source_url.trim() || !form.confirm_private_analysis}
            type="button"
            onClick={() => void previewReference()}
          >
            <ClipboardCheck size={18} /> {product.check}
          </button>
          <label className="consent-row">
            <input
              type="checkbox"
              checked={form.confirm_private_analysis}
              disabled={activeOperation !== null}
              onChange={(event) => updateField("confirm_private_analysis", event.target.checked)}
            />
            <span>
              {product.consent} <Link href="/privacy">{product.privacy}</Link>
            </span>
          </label>
          <Link className="check-secondary-link" href="/search">
            <Search size={16} /> {product.search}
          </Link>
          <p className="status-line">{urlImportStatus}</p>
        </div>
      </section>
      )}

      {!analysis ? <CoverageNotice /> : null}

      {authRequired ? <div className="check-auth-recovery">
        <p role="status">{entry.signIn}</p>
        <AuthForm onAuthenticated={() => {
          setAuthRequired(false);
          setError("");
          setStatus(entry.resume);
          if (retryAction === "draft") setDraftRetryToken((current) => current + 1);
        }} />
      </div> : null}

      {activeOperation ? <LoadingBlock label={operationLabel(activeOperation, copy)} /> : null}

      {error ? (
        <ErrorBlock
          message={error}
          onRetry={retryAction ? retryFailedOperation : undefined}
          prefix={copy.errorPrefix}
          retryLabel={copy.actions.retry}
        />
      ) : null}

      {analysis ? (
        <div ref={resultRef} className="check-result-anchor">
        {displayedDecision ? (
        <BuyerDecisionPanel
          confidenceScore={analysis?.scores.fair_price_confidence_score ?? null}
          comparableCount={analysis?.comparables.length}
          valuationConfidence={analysis?.scores.fair_price_confidence}
          decision={displayedDecision}
          locale={locale}
          onNegotiationOpened={() =>
            trackProductEvent("negotiation_opened", locale, {
              surface: "check",
              evidence_state: displayedDecision.negotiation.scenario_status === "available"
                ? "available"
                : "insufficient",
            })
          }
        />
        ) : (
          <section className="buyer-decision">
            <DecisionSummary primary fallback={decisionSummaryFromScores(analysis.scores, analysis.listing.price)}
              fallbackLabel={DECISION_OVERVIEW_COPY[locale].noVerdict} locale={locale} />
          </section>
        )}
        </div>
      ) : null}

      {analysis && result ? (
        <div className="check-result-actions">
          <div className="button-row">
            <button className="button" disabled={activeOperation !== null || !result.draft_id}
              type="button" onClick={() => void saveReportToHistory()}>
              <Save size={16} /> {product.save}
            </button>
            <Link className="button" href={`/compare?ids=${encodeURIComponent(analysis.listing.id)}`}>
              <BarChart3 size={16} /> {product.compare}
            </Link>
            <button className="button" disabled={activeOperation !== null || !result.draft_id}
              type="button" onClick={() => void trackApartment()}>
              <Bell size={16} /> {product.track}
            </button>
            <button className="button" disabled={activeOperation !== null || !form.confirm_private_analysis || awaitingConfirmation || !confirmed}
              type="button" onClick={() => void createReport()}>
              <FileText size={16} /> {product.report}
            </button>
          </div>
          <p className="status-line" role="status">{saveStatus}</p>
        </div>
      ) : null}

      {analysis && result ? (
        <details className="listing-section-disclosure document-check-disclosure">
          <summary>{DOCUMENT_CHECK_COPY[locale].title}</summary>
          <DocumentCheckPanel
            busy={activeOperation !== null}
            checks={documentChecks}
            consent={documentConsent}
            disabled={!result.draft_id}
            file={documentFile}
            locale={locale}
            metadataText={documentText}
            onConsentChange={setDocumentConsent}
            onDelete={(documentCheckId) => void deleteDocumentCheck(documentCheckId)}
            onFileChange={setDocumentFile}
            onMetadataTextChange={setDocumentText}
            onSubmit={(event) => void analyzeDocument(event)}
            onTypeChange={setDocumentType}
            status={documentStatus}
            type={documentType}
          />
        </details>
      ) : null}

      {analysis?.buyer_decision ? (
        <details className="listing-section-disclosure">
          <summary>{DECISION_OVERVIEW_COPY[locale].afterViewing}</summary>
          <PostViewingVerdictRecalculator
            disabled={activeOperation !== null || !result?.draft_id}
            locale={locale}
            onRecalculate={recalculatePostViewing}
            onRestore={setPostViewingResult}
            result={postViewingResult}
            storageKey={
              result?.draft_id && analysis.buyer_decision
                ? `wartometr-post-viewing-draft-${result.draft_id}-${analysis.buyer_decision.decision_model_version}`
                : undefined
            }
          />
        </details>
      ) : null}

      {analysis && (urlImportResult || referencePreview) ? (
        <details className="listing-section-disclosure">
          <summary>{product.source}</summary>
        <section className="trust-strip">
          <div>
            <span>{product.source}</span>
            <strong>
              {safeHttpsUrl(form.source_url) ? (
                <a href={safeHttpsUrl(form.source_url) ?? undefined} target="_blank" rel="noreferrer">
                  {referencePreview?.provider_label ?? result?.source_domain ?? copy.values.manual}
                </a>
              ) : (
                (referencePreview?.provider_label ?? result?.source_domain ?? copy.values.manual)
              )}
            </strong>
          </div>
          <div>
            <span>{product.observations}</span>
            <strong>{analysis ? analysis.comparables.length : (urlImportResult?.fields_extracted.length ?? 0)}</strong>
          </div>
          <div>
            <span>{product.updated}</span>
            <strong>{dateValue(urlImportResult?.fetched_at ?? new Date(), locale)}</strong>
          </div>
          <div>
            <span>{product.confidence}</span>
            <strong>{analysis.scores.fair_price_confidence ? confidenceMessages[locale].levels[valuationConfidenceLevel(analysis.scores.fair_price_confidence)!] : confidenceLabel(analysis.scores.fair_price_confidence_score, locale)}</strong>
          </div>
          <div>
            <span>{locale === "pl" ? "Zdjęcia" : locale === "ru" ? "Фото" : locale === "uk" ? "Фото" : "Photos"}</span>
            <strong>
              {locale === "pl"
                ? "Brak danych ze źródła"
                : locale === "ru"
                  ? "Источник не сообщил статус"
                  : locale === "uk"
                    ? "Джерело не повідомило статус"
                    : "Source status not supplied"}
            </strong>
          </div>
          <div>
            <span>
              {locale === "pl"
                ? "Ograniczenia"
                : locale === "ru"
                  ? "Ограничения"
                  : locale === "uk"
                    ? "Обмеження"
                    : "Limitations"}
            </span>
            <strong>
              {urlImportResult?.status === "partial"
                ? locale === "pl"
                  ? "Część pól wymaga potwierdzenia"
                  : locale === "ru"
                    ? "Часть полей требует проверки"
                    : locale === "uk"
                      ? "Частина полів потребує перевірки"
                      : "Some fields need confirmation"
                : urlImportResult?.status === "unsupported"
                  ? locale === "pl"
                    ? "Źródło nieobsługiwane"
                    : locale === "ru"
                      ? "Источник не поддерживается"
                      : locale === "uk"
                        ? "Джерело не підтримується"
                        : "Source not supported"
                  : locale === "pl"
                    ? "Status zdjęć nieznany"
                    : locale === "ru"
                      ? "Статус фото неизвестен"
                      : locale === "uk"
                        ? "Статус фото невідомий"
                        : "Photo status is unknown"}
            </strong>
          </div>
        </section>
        </details>
      ) : null}

      {urlImportResult && !analysis ? (
        <ImportOutcomeNotice
          onRetry={urlImportResult.status === "failed" ? () => void previewReference() : undefined}
          product={product}
          result={urlImportResult}
          retryLabel={copy.actions.retryImport}
        />
      ) : null}

      {analysis ? (
        <details className="listing-section-disclosure decision-support-panel">
          <summary>{product.supporting}</summary>
          <div className="panel-header">
            <h2>{product.supporting}</h2>
            <span className={`status-pill ${verdictTone}`}>{scoreLabel(analysis.scores.decision_label, locale)}</span>
          </div>
          <div className="panel-body score-explainer-grid">
            <ScoreExplainer
              label={copy.metrics.investmentScore}
              value={analysis.scores.investment_score}
              tone="healthy"
              locale={locale}
              reasons={scoreExplanationReasons(analysis.scores, "investment", locale)}
            />
            <ScoreExplainer
              label={copy.metrics.riskScore}
              value={analysis.scores.risk_score}
              tone="warning"
              locale={locale}
              reasons={scoreExplanationReasons(analysis.scores, "risk", locale)}
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
              valueText={confidenceLabel(
                result?.confidence_score ?? analysis.scores.fair_price_confidence_score,
                locale,
              )}
              tone="info"
              locale={locale}
              reasons={[
                `${analysis.comparables.length} ${product.observations.toLocaleLowerCase(locale)}`,
                result?.comparables_basis ?? "",
              ].filter(Boolean)}
            />
            <ScoreDataGap locale={locale} missingDataCodes={analysis.scores.explainability?.missing_data_codes ?? []} />
          </div>
        </details>
      ) : null}

      {analysis?.future_area_impact ? (
        <details className="listing-section-disclosure">
          <summary>{copy.futureImpact.title}</summary>
          <FutureImpactNarrativePanel copy={copy.futureImpact} impact={analysis.future_area_impact} locale={locale} />
        </details>
      ) : null}

      <section className="manual-entry-only" hidden={Boolean(analysis) && !entryExpanded} style={{ marginTop: 16 }}>
        <details ref={confirmationRef} className="panel manual-entry-panel" open={manualEntryOpen}
          onToggle={(event) => setManualEntryRequested(event.currentTarget.open)}>
          <summary>
            <span>{awaitingConfirmation ? entry.confirmTitle : product.manualSummary}</span>
            {confirmed ? <span className="status-line">{entry.confirmed}</span> : null}
          </summary>
          <p className="manual-entry-hint">{awaitingConfirmation ? entry.confirmHint : product.manualHint}</p>
          {areaContext ? <p className="manual-entry-hint"><strong>{entry.context}: {areaContext}.</strong> {entry.contextHint}</p> : null}
          <form
            aria-busy={activeOperation === "check"}
            className="panel-body"
            onSubmit={(event) => void analyze(event)}
          >
            <fieldset className="check-form-fields" disabled={activeOperation !== null}>
              <div className="form-grid essential-fields">
                <label className="field">
                  <span>{copy.fields.address}</span>
                  <input
                    aria-label={copy.fields.address}
                    className="input"
                    required
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                  />
                  {fieldStatus("address")}
                </label>
                <label className="field">
                  <span>{copy.fields.city}</span>
                  <input
                    aria-label={copy.fields.city}
                    className="input"
                    required
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                  />
                  {fieldStatus("city")}
                </label>
                <label className="field">
                  <span>{copy.fields.district}</span>
                  <input
                    aria-label={copy.fields.district}
                    className="input"
                    required
                    list="district-options"
                    value={form.district}
                    onChange={(event) => updateField("district", event.target.value)}
                  />
                  {fieldStatus("district")}
                  <datalist id="district-options">
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district} />
                    ))}
                  </datalist>
                </label>
                <NumberField
                  label={copy.fields.price}
                  origin={fieldStatus("price")}
                  required
                  value={form.price}
                  onChange={(value) => updateField("price", value)}
                />
                <NumberField
                  label={copy.fields.area}
                  origin={fieldStatus("area_m2")}
                  required
                  step="0.1"
                  value={form.area_m2}
                  onChange={(value) => updateField("area_m2", value)}
                />
                <NumberField
                  label={copy.fields.rooms}
                  origin={fieldStatus("rooms")}
                  required
                  value={form.rooms}
                  onChange={(value) => updateField("rooms", value)}
                />
                <label className="field">
                  <span>{copy.fields.market}</span>
                  <select className="select" aria-label={copy.fields.market} required value={form.market_type}
                    onChange={(event) => updateField("market_type", event.target.value as CheckFormState["market_type"])}>
                    <option value="">{entry.selectMarket}</option>
                    <option value="secondary">{copy.values.secondary}</option>
                    <option value="primary">{copy.values.primary}</option>
                  </select>
                  {fieldStatus("market_type")}
                </label>
              </div>

              <details className="advanced-fields">
                <summary>{product.advancedSummary}</summary>
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
                    <span>{copy.fields.purchaseIntent}</span>
                    <select
                      className="select"
                      value={form.purchase_intent}
                      onChange={(event) =>
                        updateField("purchase_intent", event.target.value as CheckFormState["purchase_intent"])
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
                    label={copy.fields.floor}
                    origin={fieldStatus("floor")}
                    value={form.floor}
                    onChange={(value) => updateField("floor", value)}
                  />
                  <NumberField
                    label={copy.fields.buildingFloors}
                    origin={fieldStatus("building_floors")}
                    value={form.building_floors}
                    onChange={(value) => updateField("building_floors", value)}
                  />
                  <NumberField
                    label={copy.fields.buildingYear}
                    origin={fieldStatus("building_year")}
                    value={form.building_year}
                    onChange={(value) => updateField("building_year", value)}
                  />
                </div>
              </details>

              <p className="status-line">{status}</p>
              <p className="status-line">{reportStatus}</p>
              {!analysis ? <p className="status-line">{saveStatus}</p> : null}
              <div className="button-row" style={{ marginTop: 12 }}>
                <button
                  className="button primary"
                  disabled={activeOperation !== null || !form.confirm_private_analysis}
                  type="submit"
                >
                  <ClipboardCheck size={16} /> {awaitingConfirmation ? entry.confirmAction : product.check}
                </button>
              </div>
            </fieldset>
          </form>
        </details>

      </section>

      {analysis && result ? (
        <details className="listing-section-disclosure">
          <summary>{DECISION_OVERVIEW_COPY[locale].details}</summary>
          <div className="listing-section-disclosure-body">
            <p>{analysis.listing.address}, {analysis.listing.city} · {analysis.listing.area_m2} m2 · {copy.fields.rooms}: {analysis.listing.rooms}</p>
            {analysis.developer_reputation ? <DeveloperReputationBlock copy={copy.developer} reputation={analysis.developer_reputation} /> : null}
            <ul className="section-list">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            <p className="muted">{analysis.disclaimer}</p>
          </div>
        </details>
      ) : null}

      {analysis ? (
        <details className="listing-section-disclosure">
          <summary>{product.assistant}</summary>
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
                disabled={aiLoading || activeOperation !== null || !result?.draft_id}
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
              <p className="empty-state">{result?.draft_id ? copy.empty.aiReady : copy.empty.aiNeedsSavedDraft}</p>
            )}
          </div>
        </details>
      ) : null}

      {analysis ? (
        <details className="listing-section-disclosure">
          <summary>{copy.sections.conclusions}</summary>
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

        </details>
      ) : null}

      {analysis ? (
        <details className="listing-section-disclosure check-evidence-disclosure">
          <summary>{product.evidence}</summary>
          <div className="panel-body">
            <ComparableEvidencePanel analysis={analysis} locale={locale} />
            <RentalEvidencePanel estimate={analysis.rental_estimate} locale={locale} />
            <p className="muted">{result?.retention_note}</p>
          </div>
        </details>
      ) : null}

      {reportResult ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>{copy.sections.buyerReport}</h2>
            <div className="button-row">
              {savedReport ? (
                <a className="button" href={reportContentUrl(savedReport.id)} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} /> {copy.values.html}
                </a>
              ) : null}
              <button
                className="button"
                disabled={activeOperation !== null || !result?.draft_id}
                type="button"
                onClick={() => void saveReportToHistory()}
              >
                <Save size={16} /> {copy.actions.save}
              </button>
              <span className="status-pill info">{product.report}</span>
            </div>
          </div>
          <div className="panel-body">
            <DecisionSummary
              confidenceScore={reportResult.analysis.analysis.scores.fair_price_confidence_score}
              confidenceLevel={valuationConfidenceLevel(reportResult.analysis.analysis.scores.fair_price_confidence)}
              decision={reportResult.report.buyer_decision ?? reportResult.analysis.analysis.buyer_decision}
              fallback={decisionSummaryFromScores(
                reportResult.analysis.analysis.scores,
                reportResult.analysis.analysis.listing.price,
              )}
              locale={locale}
            />
            <p className="empty-state">{copy.statuses.reportReady}</p>
          </div>
        </section>
      ) : null}
    </>
  );
}

function operationLabel(operation: CoreOperation, copy: CheckPageCopy) {
  switch (operation) {
    case "import":
      return copy.statuses.autoImporting;
    case "report":
      return copy.statuses.reportGenerating;
    case "save":
    case "track":
      return copy.statuses.saving;
    case "document":
      return copy.statuses.calculating;
    case "draft":
    case "check":
      return copy.statuses.calculating;
  }
}

const DOCUMENT_TYPE_OPTIONS: DocumentAnalysisDocumentType[] = [
  "kw_extract",
  "floor_plan",
  "community_statement",
  "energy_certificate",
  "developer_prospectus",
  "building_permit",
  "agreement_draft",
  "other",
];

function DocumentCheckPanel({
  busy,
  checks,
  consent,
  disabled,
  file,
  locale,
  metadataText,
  onConsentChange,
  onDelete,
  onFileChange,
  onMetadataTextChange,
  onSubmit,
  onTypeChange,
  status,
  type,
}: {
  busy: boolean;
  checks: DocumentCheck[];
  consent: boolean;
  disabled: boolean;
  file: File | null;
  locale: Locale;
  metadataText: string;
  onConsentChange: (value: boolean) => void;
  onDelete: (documentCheckId: string) => void;
  onFileChange: (value: File | null) => void;
  onMetadataTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTypeChange: (value: DocumentAnalysisDocumentType) => void;
  status: string;
  type: DocumentAnalysisDocumentType;
}) {
  const copy = DOCUMENT_CHECK_COPY[locale];
  const formDisabled = disabled || busy;
  const canSubmit = !formDisabled && consent && (Boolean(file) || metadataText.trim().length > 0);
  return (
    <section className="document-check-panel">
      <div className="document-check-intro">
        <div>
          <h3><FileUp size={18} /> {copy.title}</h3>
          <p>{copy.intro}</p>
        </div>
        <span className="status-pill warning">{copy.expert}</span>
      </div>
      <form className="document-check-form" onSubmit={onSubmit}>
        <label className="field">
          <span>{copy.type}</span>
          <select
            disabled={formDisabled}
            value={type}
            onChange={(event) => onTypeChange(event.target.value as DocumentAnalysisDocumentType)}
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>{copy.types[option]}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{copy.file}</span>
          <input
            accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain"
            disabled={formDisabled}
            type="file"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="field document-check-notes">
          <span>{copy.note}</span>
          <textarea
            disabled={formDisabled}
            placeholder={copy.notePlaceholder}
            rows={4}
            value={metadataText}
            onChange={(event) => onMetadataTextChange(event.target.value)}
          />
        </label>
        <label className="checkbox-row document-check-consent">
          <input
            checked={consent}
            disabled={formDisabled}
            type="checkbox"
            onChange={(event) => onConsentChange(event.target.checked)}
          />
          <span>{copy.consent}</span>
        </label>
        <div className="document-check-actions">
          <button className="button primary" disabled={!canSubmit} type="submit">
            <FileUp size={16} /> {copy.submit}
          </button>
          <p className="status-line" role="status">{disabled ? copy.disabled : status || copy.empty}</p>
        </div>
        <p className="document-check-limits">{copy.retained} {copy.restrictions}</p>
      </form>
      {checks.length ? (
        <div className="document-check-results">
          {checks.map((check) => (
            <article className="document-check-card" key={check.id}>
              <div className="document-check-card-header">
                <div>
                  <span className={`status-pill ${documentStatusTone(check.status)}`}>{copy.status[check.status]}</span>
                  <h4>{copy.types[check.document_type]}</h4>
                </div>
                <button className="button icon-button" type="button" onClick={() => onDelete(check.id)} aria-label={copy.deleted}>
                  <Trash2 size={16} />
                </button>
              </div>
              <dl className="document-check-meta">
                <div><dt>{copy.provenance}</dt><dd>{check.filename ?? copy.types[check.document_type]}</dd></div>
                <div><dt>{PRODUCT_COPY[locale].confidence}</dt><dd>{check.confidence}/100</dd></div>
              </dl>
              {check.signals.length ? (
                <div className="document-check-signal-list">
                  {check.signals.map((signal) => (
                    <div className="document-check-signal" key={`${check.id}-${signal.checklist_code}-${signal.status}`}>
                      <span className={`status-pill ${documentSignalTone(signal.status)}`}>{copy.signal[signal.status]}</span>
                      <strong>{signal.checklist_code}</strong>
                      <p>{signal.rationale}</p>
                      <small>{signal.evidence}</small>
                      <small>{copy.provenance}: {signal.provenance.source_document}{signal.provenance.page ? `, p. ${signal.provenance.page}` : ""}, {signal.provenance.field}</small>
                    </div>
                  ))}
                </div>
              ) : null}
              {check.unknowns.length ? (
                <div className="document-check-followup">
                  <h5>{copy.unknowns}</h5>
                  <ul>
                    {check.unknowns.map((unknown) => (
                      <li key={`${check.id}-${unknown.checklist_code}`}>
                        <strong>{unknown.checklist_code}</strong>: {unknown.recommended_next_action}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {check.conflicts.length ? (
                <div className="document-check-followup risk">
                  <h5>{copy.conflicts}</h5>
                  <ul>
                    {check.conflicts.map((conflict) => (
                      <li key={`${check.id}-${conflict.field}`}>{conflict.manual_review_note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">{copy.empty}</p>
      )}
    </section>
  );
}

function documentStatusTone(status: DocumentCheck["status"]) {
  if (status === "analyzed") return "healthy";
  if (status === "not_supported") return "neutral";
  return "warning";
}

function documentSignalTone(status: DocumentCheck["signals"][number]["status"]) {
  if (status === "evidence_found") return "healthy";
  if (status === "conflict") return "danger";
  if (status === "not_supported" || status === "missing") return "neutral";
  return "warning";
}

function ImportOutcomeNotice({
  onRetry,
  product,
  result,
  retryLabel,
}: {
  onRetry?: () => void;
  product: ProductCopy;
  result: SourceUrlImportResult;
  retryLabel: string;
}) {
  if (result.status === "extracted") return null;

  const partial = result.status === "partial";
  const content = partial
    ? { title: product.importPartialTitle, text: product.importPartialText }
    : result.status === "failed"
      ? { title: product.importFailedTitle, text: product.importFailedText }
      : {
          title: product.importUnsupportedTitle,
          text: product.importUnsupportedText,
        };

  return (
    <section
      aria-label={content.title}
      className={`import-outcome-notice ${partial ? "partial" : "error"}`}
      role={partial ? "status" : "alert"}
    >
      <strong>{content.title}</strong>
      <p>{content.text}</p>
      {onRetry ? (
        <div className="state-block-actions">
          <button className="button" type="button" onClick={onRetry}>
            <RefreshCw size={15} /> {retryLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AssistantColumn({ emptyLabel, title, items }: { emptyLabel: string; title: string; items: string[] }) {
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
        {value !== undefined ? <span className={`status-pill ${tone}`}>{scoreLevel(value, locale)}</span> : null}
        <h3>{label}</h3>
        <strong>{valueText ?? `${value ?? 0}/100`}</strong>
      </div>
      <div className="score-explainer-bar" aria-hidden="true">
        <span
          style={{
            width: `${Math.max(0, Math.min(100, value ?? 70))}%`,
          }}
        />
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
  if (typeof score !== "number" || !Number.isFinite(score)) return CHECK_PAGE_COPY[locale].values.dash;
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
  const supported = questions.filter((question) => question.supported_audiences.includes(audience));
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
  if (!form.market_type || missingRequiredReportFields(form).length) throw new Error("Incomplete apartment details");
  return {
    title: form.title.trim() || null,
    source_url: form.source_url.trim() || null,
    developer_name: form.developer_name.trim() || null,
    investment_name: form.investment_name.trim() || null,
    address: form.address.trim(),
    city: form.city.trim(),
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
      payload.building_floors === null || payload.building_floors === undefined ? "" : String(payload.building_floors),
    building_year:
      payload.building_year === null || payload.building_year === undefined ? "" : String(payload.building_year),
    lat: payload.lat === null || payload.lat === undefined ? "" : String(payload.lat),
    lon: payload.lon === null || payload.lon === undefined ? "" : String(payload.lon),
  };
}

function developerLabelTone(label: string) {
  if (label === "strong" || label === "good") return "healthy";
  if (label === "mixed" || label === "limited_data") return "warning";
  return "error";
}

function mergeImportedFields(current: CheckFormState, fields: SourceUrlImportFields): CheckFormState {
  return {
    ...clearObjectFieldsForNewUrl(current, current.source_url),
    title: fields.title ?? "",
    developer_name: fields.developer_name ?? "",
    investment_name: fields.investment_name ?? "",
    address: fields.address ?? "",
    city: fields.city ?? "",
    district: fields.district ?? "",
    market_type: fields.market_type ?? "",
    price: fields.price == null ? "" : String(fields.price),
    area_m2: fields.area_m2 == null ? "" : String(fields.area_m2),
    rooms: fields.rooms == null ? "" : String(fields.rooms),
    floor: fields.floor == null ? "" : String(fields.floor),
    building_floors: fields.building_floors == null ? "" : String(fields.building_floors),
    building_year: fields.building_year == null ? "" : String(fields.building_year),
    lat: fields.lat == null ? "" : String(fields.lat),
    lon: fields.lon == null ? "" : String(fields.lon),
  };
}

function clearObjectFieldsForNewUrl(current: CheckFormState, sourceUrl: string) {
  return {
    ...DEFAULT_FORM,
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
  required = false,
  value,
  step,
  origin,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  step?: string;
  origin?: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        aria-label={label}
        className="input"
        inputMode="decimal"
        min="0"
        required={required}
        step={step ?? "1"}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {origin}
    </label>
  );
}

function toNumber(value: string) {
  return Number(value || 0);
}

function toOptionalNumber(value: string) {
  return value === "" ? null : Number(value);
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
