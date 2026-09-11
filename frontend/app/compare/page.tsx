"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, ChevronDown, FileText, RefreshCw, ShieldCheck } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { ListingProvenance } from "@/components/ListingProvenance";
import {
  api,
  type AICompareAnswer,
  type BuyerProfile,
  type CompareResponse,
  type ListingAnalysis,
  type PurchaseIntent,
  type ReportAudience,
  type RealtorClientShortlist,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import { COMPARE_PAGE_COPY } from "@/lib/i18n";
import { scoreLabel } from "@/lib/scoreLabels";
import { productIntent, trackProductEvent } from "@/lib/productAnalytics";
import { useLocalePreference } from "@/lib/useLocalePreference";
import {
  InsightColumn,
  Metric,
  RecommendationSummary,
  aiStatusText,
  compareStatusText,
  comparisonRows,
  developerLabel,
  developerTone,
  fairDetail,
  listingShort,
  paymentDetail,
  rentDetail,
  shortlistStatusText,
  syncCompareUrl,
  type AiStatusState,
  type CompareStatusState,
  type ShortlistStatusState,
} from "@/components/compare/ComparePresentation";

const COMPARE_PRODUCT_COPY = {
  en: {
    bestOverall: "Best overall option",
    why: "Why",
    tradeoffs: "Trade-offs",
    fairPrice: "fair price",
    lowerRisk: "lower risk",
    liquidity: "strong liquidity",
    unavailable: "unavailable",
    smaller: "smaller apartment",
    farther: "farther from the city center",
    loadingSteps: ["Loading selected apartments", "Calculating total purchase costs", "Preparing recommendation"],
    intentLabel: "Compare for",
    personalized: "Personalized recommendation from your buyer profile",
    noBudgetFit: "None of the selected apartments fits your saved maximum price; the general recommendation is shown.",
    editProfile: "Edit buyer profile",
    selectionHelp: "Choose 2 to 5 apartments. Only the selected IDs are compared and kept in the page link.",
    unavailableRemoved: (count: number) => `${count} unavailable apartment${count === 1 ? " was" : "s were"} removed. The remaining selection is still being compared.`,
    noMaterialTradeoffs: "No material trade-off was detected in the available comparison data.",
    fallbackSummary: "This option best matches the selected purpose and the available comparison evidence.",
  },
  pl: {
    bestOverall: "Najlepsza opcja ogólnie",
    why: "Dlaczego",
    tradeoffs: "Kompromisy",
    fairPrice: "względem ceny rynkowej",
    lowerRisk: "niższe ryzyko",
    liquidity: "dobra płynność",
    unavailable: "brak danych",
    smaller: "mniejsze mieszkanie",
    farther: "dalej od centrum",
    loadingSteps: ["Ładujemy wybrane mieszkania", "Liczymy całkowity koszt zakupu", "Przygotowujemy rekomendację"],
    intentLabel: "Porównaj dla",
    personalized: "Rekomendacja dopasowana do Twojego profilu kupującego",
    noBudgetFit: "Żadne z wybranych mieszkań nie mieści się w zapisanej cenie maksymalnej; pokazujemy rekomendację ogólną.",
    editProfile: "Edytuj profil kupującego",
    selectionHelp: "Wybierz od 2 do 5 mieszkań. Porównujemy wyłącznie wskazane ID i zachowujemy je w linku strony.",
    unavailableRemoved: (count: number) => `Usunięto ${count} niedostępne ${count === 1 ? "mieszkanie" : "mieszkania"}. Pozostałe wybrane oferty nadal są porównywane.`,
    noMaterialTradeoffs: "W dostępnych danych porównawczych nie wykryto istotnego kompromisu.",
    fallbackSummary: "Ta opcja najlepiej pasuje do wybranego celu i dostępnych danych porównawczych.",
  },
  ru: {
    bestOverall: "Лучший вариант в целом",
    why: "Почему",
    tradeoffs: "Компромиссы",
    fairPrice: "относительно рыночной цены",
    lowerRisk: "ниже риск",
    liquidity: "хорошая ликвидность",
    unavailable: "нет данных",
    smaller: "меньшая площадь",
    farther: "дальше от центра",
    loadingSteps: ["Загружаем выбранные квартиры", "Считаем полную стоимость покупки", "Готовим рекомендацию"],
    intentLabel: "Сравнить для",
    personalized: "Персональная рекомендация по вашему профилю покупателя",
    noBudgetFit: "Ни одна выбранная квартира не укладывается в сохраненную максимальную цену; показана общая рекомендация.",
    editProfile: "Изменить профиль покупателя",
    selectionHelp: "Выберите от 2 до 5 квартир. Сравниваются только выбранные ID, и они сохраняются в ссылке страницы.",
    unavailableRemoved: (count: number) => `Недоступные объекты удалены: ${count}. Остальные выбранные квартиры продолжают сравниваться.`,
    noMaterialTradeoffs: "По доступным данным существенный компромисс не выявлен.",
    fallbackSummary: "Этот вариант лучше соответствует выбранной цели и доступным данным сравнения.",
  },
  uk: {
    bestOverall: "Найкращий варіант загалом",
    why: "Чому",
    tradeoffs: "Компроміси",
    fairPrice: "відносно ринкової ціни",
    lowerRisk: "нижчий ризик",
    liquidity: "добра ліквідність",
    unavailable: "немає даних",
    smaller: "менша площа",
    farther: "далі від центру",
    loadingSteps: ["Завантажуємо вибрані квартири", "Рахуємо повну вартість купівлі", "Готуємо рекомендацію"],
    intentLabel: "Порівняти для",
    personalized: "Персональна рекомендація за вашим профілем покупця",
    noBudgetFit: "Жодна вибрана квартира не вкладається у збережену максимальну ціну; показано загальну рекомендацію.",
    editProfile: "Змінити профіль покупця",
    selectionHelp: "Виберіть від 2 до 5 квартир. Порівнюються лише вибрані ID, і вони зберігаються в посиланні сторінки.",
    unavailableRemoved: (count: number) => `Недоступні об'єкти видалено: ${count}. Решта вибраних квартир продовжує порівнюватися.`,
    noMaterialTradeoffs: "За доступними даними суттєвого компромісу не виявлено.",
    fallbackSummary: "Цей варіант найкраще відповідає вибраній меті та доступним даним порівняння.",
  },
} as const;

export default function ComparePage() {
  const { locale } = useLocalePreference();
  const copy = COMPARE_PAGE_COPY[locale];
  const [available, setAvailable] = useState<ListingAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [intent, setIntent] = useState<PurchaseIntent>("self");
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
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const items = comparison?.items ?? [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialIds = [
      ...new Set(
        (params.get("ids") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ].slice(0, 5);
    const initialIntent = params.get("intent") as PurchaseIntent | null;
    const hasInitialIntent = ["self", "family", "rental", "investment"].includes(initialIntent ?? "");
    if (hasInitialIntent) setIntent(initialIntent as PurchaseIntent);

    async function loadInitial() {
      setError("");
      setStatus({ key: "loadingListings" });
      try {
        const [search, account] = await Promise.all([
          api.listListings({
            city: "Wrocław",
            page_size: 100,
            sort: "investment_score_desc",
          }),
          api.getMe().catch(() => null),
        ]);
        setAvailable(search.items);
        setBuyerProfile(account?.buyer_profile ?? null);
        setUnavailableIds([]);
        if (!hasInitialIntent && account?.buyer_profile?.intent !== "unsure") {
          setIntent(account?.buyer_profile?.intent ?? "self");
        }
        setSelectedIds(initialIds);
        setStatus({ key: "listingsLoaded" });
      } catch (caught) {
        setError(localizedError(caught, locale, copy.statuses.backendUnavailable));
        setStatus({ key: "backendUnavailable" });
      }
    }

    void loadInitial();
  }, [copy.statuses.backendUnavailable, locale]);

  useEffect(() => {
    if (selectedIds.length < 2) {
      setComparison(null);
      return;
    }

    let cancelled = false;
    async function loadCompare() {
      setError("");
      setStatus({ key: "comparing" });
      trackProductEvent("comparison_started", locale, {
        surface: "compare",
        intent: productIntent(intent),
        comparison_size: Math.min(selectedIds.length, 4),
      });
      try {
        const response = await api.compareListings(selectedIds, intent);
        if (cancelled) return;
        setComparison(response);
        trackProductEvent("comparison_completed", locale, {
          surface: "compare",
          intent: productIntent(intent),
          comparison_size: Math.min(selectedIds.length, 4),
          result_state: response.unavailable_listing_ids.length ? "partial" : "success",
        });
        if (response.unavailable_listing_ids.length > 0) {
          setUnavailableIds(response.unavailable_listing_ids);
          const missing = new Set(response.unavailable_listing_ids);
          const remainingIds = selectedIds.filter((listingId) => !missing.has(listingId));
          setSelectedIds(remainingIds);
          syncCompareUrl(remainingIds, intent);
        }
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
        setError(localizedError(caught, locale, copy.statuses.compareUnavailable));
        setStatus({ key: "compareUnavailable" });
      }
    }

    void loadCompare();
    return () => {
      cancelled = true;
    };
  }, [copy.statuses.compareUnavailable, intent, locale, selectedIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const metricById = useMemo(
    () => new Map((comparison?.metrics ?? []).map((metric) => [metric.listing_id, metric])),
    [comparison],
  );
  function toggleListing(listingId: string) {
    setUnavailableIds([]);
    setSelectedIds((current) => {
      if (current.includes(listingId)) {
        const next = current.filter((item) => item !== listingId);
        syncCompareUrl(next, intent);
        return next;
      }
      if (current.length >= 5) {
        setStatus({ key: "compareLimit" });
        return current;
      }
      const next = [...current, listingId];
      syncCompareUrl(next, intent);
      return next;
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
      setAiError(localizedError(caught, locale, copy.statuses.aiUnavailable));
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
      setShortlistError(localizedError(caught, locale, copy.statuses.shortlistUnavailable));
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
          <p className="muted compare-selection-help">{COMPARE_PRODUCT_COPY[locale].selectionHelp}</p>
          <label className="field" style={{ maxWidth: 280 }}>
            <span>{COMPARE_PRODUCT_COPY[locale].intentLabel}</span>
            <select className="select" value={intent} onChange={(event) => { const nextIntent = event.target.value as PurchaseIntent; setIntent(nextIntent); syncCompareUrl(selectedIds, nextIntent); }}>
              <option value="self">{locale === "pl" ? "Do zamieszkania" : locale === "ru" ? "Для жизни" : locale === "uk" ? "Для життя" : "For living"}</option>
              <option value="family">{locale === "pl" ? "Dla rodziny" : locale === "ru" ? "Для семьи" : locale === "uk" ? "Для сім'ї" : "For family"}</option>
              <option value="rental">{locale === "pl" ? "Na wynajem" : locale === "ru" ? "Для аренды" : locale === "uk" ? "Для оренди" : "For rental"}</option>
              <option value="investment">{locale === "pl" ? "Inwestycyjnie" : locale === "ru" ? "Для инвестиции" : locale === "uk" ? "Для інвестиції" : "For investment"}</option>
            </select>
          </label>
          {buyerProfile ? (
            <p className="profile-context-note compare-profile-note">
              <strong>{COMPARE_PRODUCT_COPY[locale].personalized}.</strong>{" "}
              {comparison?.recommendation.all_over_budget ? COMPARE_PRODUCT_COPY[locale].noBudgetFit : null}{" "}
              <Link href="/account">{COMPARE_PRODUCT_COPY[locale].editProfile}</Link>
            </p>
          ) : null}
          {available.length === 0 && !error ? (
            <LoadingBlock label={compareStatusText(copy, status)} steps={COMPARE_PRODUCT_COPY[locale].loadingSteps} />
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
                    {analysis.listing.district} · {money(analysis.listing.price, locale)} ·{" "}
                    {numberValue(analysis.listing.area_m2, locale)} m2 ·{" "}
                    {copy.values.roomsShort(analysis.listing.rooms)}
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

      {unavailableIds.length > 0 ? (
        <div className="compare-unavailable-notice" role="status">
          <strong>{COMPARE_PRODUCT_COPY[locale].unavailableRemoved(unavailableIds.length)}</strong>
          <small>{unavailableIds.join(", ")}</small>
        </div>
      ) : null}

      {error ? (
        <ErrorBlock message={error} />
      ) : selectedIds.length < 2 ? (
        <EmptyBlock label={copy.empty.selectMin} />
      ) : comparison === null || items.length === 0 ? (
        <LoadingBlock label={compareStatusText(copy, status)} steps={COMPARE_PRODUCT_COPY[locale].loadingSteps} />
      ) : (
        <>
          <section className="compare-primary">
            <RecommendationSummary
              copy={COMPARE_PRODUCT_COPY[locale]}
              items={items}
              metrics={comparison.metrics}
              recommendation={comparison.recommendation}
              badgeLabel={comparison.recommendation.personalized ? COMPARE_PRODUCT_COPY[locale].personalized : undefined}
              locale={locale}
            />
          </section>

          <section className="metric-grid compare-highlight-strip summary-strip">
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
              detail={rentDetail(
                metricById.get(comparison.summary.strongest_rental_listing_id ?? ""),
                copy,
                locale,
              )}
            />
          </section>

          <section className="panel pro-only" style={{ marginBottom: 16 }}>
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
                      {aiAnswer.citations.slice(0, 5).map((citation) => (
                        <div className="ai-citation" key={`${citation.source_id}-${citation.title}`}>
                            <strong>{citation.title}</strong>
                            <small>{citation.excerpt}</small>
                          </div>
                        ))}
                      </div>
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
                <p className="empty-state">{copy.empty.noAiAnswer}</p>
              )}
            </div>
          </section>

          <section className="panel pro-only" style={{ marginBottom: 16 }}>
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
                            {item.estimated_gross_rental_yield_pct === null
                              ? copy.empty.noData
                              : `${numberValue(item.estimated_gross_rental_yield_pct, locale)}% ${copy.values.rent}`}
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

          <section className="grid-3 compare-ranking-list">
            {comparison.metrics.map((metric) => {
              const item = items.find((analysis) => analysis.listing.id === metric.listing_id);
              return (
                <article className="metric compare-ranking-item" key={metric.listing_id}>
                  <span>
                    {copy.values.rank(metric.rank)} ·{" "}
                    {item ? item.listing.district : metric.listing_id}
                  </span>
                  <strong>
                    {metric.decision_score}/100 · {scoreLabel(metric.decision_label, locale)}
                  </strong>
                  <div className="meta-row">
                    <span>
                      {copy.table.totalMoveInCost}: {money(metric.total_move_in_cost_pln, locale)}
                    </span>
                    <span>
                      {copy.table.renovationFurniture}:{" "}
                      {money(metric.renovation_estimate_pln + metric.furniture_estimate_pln, locale)}
                    </span>
                    <span>
                      {money(metric.estimated_monthly_payment_pln, locale)}/{copy.values.monthly}
                    </span>
                    <span>
                      {metric.liquidity_score === null
                        ? copy.empty.noData
                        : `${metric.liquidity_score}/100 ${copy.values.liquidity}`}
                    </span>
                    <span>
                      {metric.rental_potential_score === null
                        ? copy.empty.noData
                        : `${metric.rental_potential_score}/100 ${copy.values.rent}`}
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

          <details className="panel compare-details">
            <summary className="panel-header">
              <strong>{copy.sections.comparisonMatrix}</strong>
              <span className="compare-details-meta">
                <span className="muted">
                  {copy.statuses.compareCount(items.length)} ·{" "}
                  {copy.values.mortgageAssumptions(
                    comparison.mortgage_assumptions.down_payment_pct,
                    comparison.mortgage_assumptions.loan_years,
                    comparison.mortgage_assumptions.annual_interest_rate_pct,
                  )}
                </span>
                <ChevronDown aria-hidden="true" size={18} />
              </span>
            </summary>
            <div className="table-scroll compare-table-desktop">
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
            <div className="compare-mobile-cards">
              {items.map((item, index) => (
                <article className="compare-mobile-card" key={item.listing.id}>
                  <h3><Link href={`/listings/${item.listing.id}`}>{item.listing.title}</Link></h3>
                  <ListingProvenance listing={item.listing} locale={locale} />
                  {comparisonRows(items, metricById, copy, locale).slice(0, 12).map((row) => (
                    <div className="compare-mobile-row" key={`${item.listing.id}-${row.id}`}>
                      <span>{row.label}</span>
                      <strong>{row.values[index]}</strong>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </details>
        </>
      )}
    </>
  );
}
