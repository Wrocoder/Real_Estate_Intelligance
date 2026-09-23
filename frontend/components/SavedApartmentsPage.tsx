"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Bell, FileText, RefreshCw, Trash2 } from "lucide-react";

import { AuthForm } from "@/components/AuthForm";
import { DecisionSummary, decisionSummaryFromScores } from "@/components/DecisionSummary";
import { ListingProvenance } from "@/components/ListingProvenance";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  ApiError,
  api,
  type Alert,
  type AlertPreview,
  type BuyerDecisionPackage,
  type Favorite,
  type Listing,
  type ObjectWatchEvent,
  type PropertyScores,
  type UserSubmittedListingDraft,
} from "@/lib/api";
import { dateValue, numberValue } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import { CHECK_DRAFTS_COPY, type Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type Filter = "all" | "checked" | "favorites";
type SavedItem =
  | { kind: "checked"; draft: UserSubmittedListingDraft; favorite: Favorite | null }
  | { kind: "favorite"; listing: Listing; favorite: Favorite };
type SavedWatchState = { alert: Alert; preview: AlertPreview | null; previewUnavailable: boolean };
type SavedWatchMap = Record<string, SavedWatchState>;

const LABELS = {
  en: { all: "All", checked: "Checked", favorites: "Favorites", checkedBadge: "Checked apartment", favoriteBadge: "Favorite apartment", updated: "Updated", open: "Open", compare: "Compare", track: "Track", tracked: "Apartment tracking is enabled.", remove: "Remove", noSaved: "No saved apartments yet. Save an apartment or check a listing to see it here.", verdictUnavailable: "Buyer verdict unavailable", openToCheck: "Open the apartment to prepare a current buyer verdict.", monitoring: "Monitoring", active: "Active", paused: "Paused", notTracking: "Not tracking", notTracked: "Tracking is not enabled for this apartment yet.", noChanges: "No meaningful changes detected since tracking started.", unavailable: "Monitoring could not be checked right now.", changedFromTo: (from: string, to: string) => `${from} -> ${to}`, savedCount: (count: number) => `${count} saved apartments` },
  pl: { all: "Wszystkie", checked: "Sprawdzone", favorites: "Ulubione", checkedBadge: "Sprawdzone mieszkanie", favoriteBadge: "Ulubione mieszkanie", updated: "Aktualizacja", open: "Otwórz", compare: "Porównaj", track: "Śledź", tracked: "Śledzenie mieszkania zostało włączone.", remove: "Usuń", noSaved: "Nie ma jeszcze zapisanych mieszkań. Zapisz ogłoszenie lub je sprawdź, aby zobaczyć je tutaj.", verdictUnavailable: "Brak werdyktu dla kupującego", openToCheck: "Otwórz mieszkanie, aby przygotować aktualny werdykt dla kupującego.", monitoring: "Monitoring", active: "Aktywne", paused: "Wstrzymane", notTracking: "Bez śledzenia", notTracked: "Śledzenie nie jest jeszcze włączone dla tego mieszkania.", noChanges: "Nie wykryto ważnych zmian od włączenia śledzenia.", unavailable: "Nie udało się teraz sprawdzić monitoringu.", changedFromTo: (from: string, to: string) => `${from} -> ${to}`, savedCount: (count: number) => `Zapisane mieszkania: ${count}` },
  ru: { all: "Все", checked: "Проверенные", favorites: "Избранные", checkedBadge: "Проверенная квартира", favoriteBadge: "Избранная квартира", updated: "Обновлено", open: "Открыть", compare: "Сравнить", track: "Следить", tracked: "Отслеживание квартиры включено.", remove: "Удалить", noSaved: "Пока нет сохраненных квартир. Добавьте объявление в избранное или проверьте его, чтобы увидеть здесь.", verdictUnavailable: "Вывод для покупателя недоступен", openToCheck: "Откройте квартиру, чтобы подготовить актуальный вывод для покупателя.", monitoring: "Мониторинг", active: "Активен", paused: "Пауза", notTracking: "Не отслеживается", notTracked: "Для этой квартиры отслеживание еще не включено.", noChanges: "С момента включения отслеживания важных изменений не найдено.", unavailable: "Сейчас не удалось проверить мониторинг.", changedFromTo: (from: string, to: string) => `${from} -> ${to}`, savedCount: (count: number) => `Сохраненных квартир: ${count}` },
  uk: { all: "Усі", checked: "Перевірені", favorites: "Обрані", checkedBadge: "Перевірена квартира", favoriteBadge: "Обрана квартира", updated: "Оновлено", open: "Відкрити", compare: "Порівняти", track: "Стежити", tracked: "Стеження за квартирою увімкнено.", remove: "Видалити", noSaved: "Поки немає збережених квартир. Додайте оголошення в обране або перевірте його, щоб побачити тут.", verdictUnavailable: "Висновок для покупця недоступний", openToCheck: "Відкрийте квартиру, щоб підготувати актуальний висновок для покупця.", monitoring: "Моніторинг", active: "Активне", paused: "Пауза", notTracking: "Не відстежується", notTracked: "Для цієї квартири стеження ще не увімкнено.", noChanges: "З моменту ввімкнення стеження важливих змін не знайдено.", unavailable: "Зараз не вдалося перевірити моніторинг.", changedFromTo: (from: string, to: string) => `${from} -> ${to}`, savedCount: (count: number) => `Збережених квартир: ${count}` },
} as const;

const TITLE = { en: "My apartments", pl: "Moje mieszkania", ru: "Мои квартиры", uk: "Мої квартири" } as const;
const SUBTITLE = { en: "Saved checks, favorites and monitored changes that can affect the buying decision.", pl: "Zapisane sprawdzenia, ulubione ogłoszenia i monitorowane zmiany ważne dla decyzji.", ru: "Сохраненные проверки, избранные объявления и отслеживаемые изменения для решения о покупке.", uk: "Збережені перевірки, обрані оголошення й відстежувані зміни для рішення про купівлю." } as const;

export default function SavedApartmentsPage() {
  const { locale } = useLocalePreference();
  const copy = CHECK_DRAFTS_COPY[locale];
  const labels = LABELS[locale];
  const [drafts, setDrafts] = useState<UserSubmittedListingDraft[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [watchByTarget, setWatchByTarget] = useState<SavedWatchMap>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const loadRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setError(""); setAuthRequired(false); setIsLoading(true); setStatus(copy.statuses.loading);
    try {
      const [draftsResult, favoritesResult, alertsResult] = await Promise.allSettled([api.listUserSubmittedListingDrafts({ limit: 100 }), api.listFavorites(), api.listAlerts()]);
      if (requestId !== loadRequestRef.current) return;
      if (draftsResult.status === "rejected") throw draftsResult.reason;
      if (favoritesResult.status === "rejected") throw favoritesResult.reason;
      const nextDrafts = draftsResult.value;
      const nextFavorites = favoritesResult.value;
      setDrafts(nextDrafts); setFavorites(nextFavorites); setStatus(labels.savedCount(countSaved(nextDrafts, nextFavorites)));
      if (alertsResult.status === "fulfilled") {
        const nextWatchByTarget = await loadWatchPreviews(alertsResult.value);
        if (requestId === loadRequestRef.current) setWatchByTarget(nextWatchByTarget);
      } else if (alertsResult.reason instanceof ApiError && alertsResult.reason.status === 401) {
        throw alertsResult.reason;
      } else {
        setWatchByTarget({});
      }
    } catch (caught) {
      if (requestId !== loadRequestRef.current) return;
      if (caught instanceof ApiError && caught.status === 401) { setAuthRequired(true); setStatus(""); }
      else { setError(localizedError(caught, locale, copy.statuses.backendUnavailable)); setStatus(copy.statuses.backendUnavailable); }
    } finally { if (requestId === loadRequestRef.current) setIsLoading(false); }
  }, [copy, labels, locale]);

  useEffect(() => { void load(); }, [load]);

  const items = useMemo<SavedItem[]>(() => {
    const favoriteByListing = new Map(favorites.map((favorite) => [favorite.listing_id, favorite]));
    const checked: SavedItem[] = drafts.map((draft) => ({ kind: "checked", draft, favorite: favoriteByListing.get(draft.listing_id) ?? null }));
    const checkedIds = new Set(drafts.map((draft) => draft.listing_id));
    const plainFavorites: SavedItem[] = favorites.filter((favorite) => !checkedIds.has(favorite.listing_id) && favorite.listing).map((favorite) => ({ kind: "favorite", listing: favorite.listing as Listing, favorite }));
    return [...checked, ...plainFavorites].filter(
      (item) => filter === "all" || (filter === "checked" && item.kind === "checked") || (filter === "favorites" && item.kind === "favorite"),
    );
  }, [drafts, favorites, filter]);

  async function remove(item: SavedItem) {
    setError("");
    try {
      if (item.kind === "checked") {
        const response = await api.deleteUserSubmittedListingDraft(item.draft.id);
        if (!response.ok) { setError(copy.statuses.deleteError); return; }
        if (item.favorite) await api.deleteFavorite(item.favorite.id);
        setDrafts((current) => current.filter((draft) => draft.id !== item.draft.id));
        if (item.favorite) setFavorites((current) => current.filter((favorite) => favorite.id !== item.favorite?.id));
      } else {
        await api.deleteFavorite(item.favorite.id);
        setFavorites((current) => current.filter((favorite) => favorite.id !== item.favorite.id));
      }
    } catch {
      setError(copy.statuses.deleteError);
      return;
    }
    setStatus(copy.statuses.deleted);
  }

  async function track(item: SavedItem) {
    setError("");
    try {
      const alert = item.kind === "checked" ? await api.createUserSubmittedDraftObjectWatch(item.draft.id, {}) : await api.createListingObjectWatch(item.listing.id, {});
      const key = alertWatchKey(alert);
      if (key) {
        let preview: AlertPreview | null = null;
        let previewUnavailable = false;
        try {
          preview = await api.previewAlert(alert.id);
        } catch {
          previewUnavailable = true;
        }
        setWatchByTarget((current) => ({ ...current, [key]: { alert, preview, previewUnavailable } }));
      }
      setStatus(labels.tracked);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) setAuthRequired(true);
      else setError(localizedError(caught, locale, copy.statuses.reportError));
    }
  }

  if (authRequired) return <AuthForm onAuthenticated={load} />;
  return <>
    <header className="page-header"><div><h1>{TITLE[locale]}</h1><p>{SUBTITLE[locale]}</p></div><div className="button-row"><Link className="button" href="/check"><FileText size={16} /> {copy.actions.newCheck}</Link><button className="button" type="button" onClick={() => void load()}><RefreshCw size={16} /> {copy.actions.refresh}</button></div></header>
    <section className="panel"><div className="panel-header"><h2>{labels.savedCount(countSaved(drafts, favorites))}</h2><span className="status-line">{status}</span></div><div className="panel-body">
      <div className="segmented-control" role="tablist" aria-label={TITLE[locale]}>{(["all", "checked", "favorites"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{labels[value]}</button>)}</div>
      {error ? <ErrorBlock message={error} prefix={copy.errorPrefix} /> : isLoading ? <LoadingBlock label={copy.empty.loading} /> : items.length === 0 ? <EmptyBlock label={labels.noSaved} /> : <div className="apartment-card-grid">{items.map((item) => <SavedApartmentCard key={item.kind === "checked" ? item.draft.id : item.favorite.id} item={item} locale={locale} copy={copy} labels={labels} watch={watchForItem(item, watchByTarget)} onTrack={() => void track(item)} onRemove={() => void remove(item)} />)}</div>}
    </div></section>
  </>;
}

function SavedApartmentCard({ item, locale, copy, labels, watch, onTrack, onRemove }: { item: SavedItem; locale: Locale; copy: (typeof CHECK_DRAFTS_COPY)[Locale]; labels: (typeof LABELS)[Locale]; watch: SavedWatchState | null; onTrack: () => void; onRemove: () => void }) {
  const listing = item.kind === "checked" ? item.draft : item.listing;
  const scores = item.kind === "checked" ? draftScores(item.draft) : null;
  const decision = item.kind === "checked" ? draftDecision(item.draft) : null;
  const listingId = item.kind === "checked" ? item.draft.listing_id : item.listing.id;
  const updated = item.kind === "checked" ? item.draft.updated_at : item.favorite.created_at;
  const title = item.kind === "checked" ? item.draft.address : item.listing.address || item.listing.title;
  const fallback = scores
    ? decisionSummaryFromScores(scores, listing.price)
    : { seller_price_pln: listing.price };
  const confidenceScore = item.kind === "checked" ? item.draft.confidence_score : null;
  return <article className="apartment-card"><div><span className="status-pill info">{item.kind === "checked" ? labels.checkedBadge : labels.favoriteBadge}</span><h3>{title}</h3><p>{listing.district}, {listing.city}</p></div>{item.kind === "favorite" ? <ListingProvenance listing={item.listing} locale={locale} /> : <div className="listing-provenance"><span><strong>{labels.updated}:</strong> {dateValue(updated, locale)}</span><span>{locale === "pl" ? "Źródło: prywatna analiza" : locale === "ru" ? "Источник: частный анализ" : locale === "uk" ? "Джерело: приватний аналіз" : "Source: private analysis"}</span><span>{locale === "pl" ? "Zdjęcia: brak danych ze źródła" : locale === "ru" ? "Фото: источник не сообщил статус" : locale === "uk" ? "Фото: джерело не повідомило статус" : "Photos: source status not supplied"}</span></div>}<p className="apartment-card-specs">{numberValue(listing.area_m2, locale)} m2 · {copy.values.rooms(listing.rooms)}</p><DecisionSummary compact confidenceScore={confidenceScore} decision={decision} fallback={fallback} fallbackLabel={labels.verdictUnavailable} fallbackSummary={labels.openToCheck} locale={locale} /><SavedMonitoringPanel labels={labels} locale={locale} watch={watch} /><div className="button-row"><Link className="button primary" href={item.kind === "checked" ? `/check?draft=${encodeURIComponent(item.draft.id)}` : `/listings/${encodeURIComponent(listingId)}`}><FileText size={16} /> {labels.open}</Link><Link className="button" href={`/compare?ids=${encodeURIComponent(listingId)}`}><BarChart3 size={16} /> {labels.compare}</Link><button className="button" type="button" onClick={onTrack}><Bell size={16} /> {labels.track}</button><button className="button danger" type="button" onClick={onRemove}><Trash2 size={16} /> {labels.remove}</button></div></article>;
}

function SavedMonitoringPanel({ labels, locale, watch }: { labels: (typeof LABELS)[Locale]; locale: Locale; watch: SavedWatchState | null }) {
  const meaningfulEvents = watch?.preview?.watch_events.filter((event) => !isNoChangeEvent(event)) ?? [];
  const statusTone = watch ? watch.alert.is_active ? "healthy" : "warning" : "info";
  const status = watch ? watch.alert.is_active ? labels.active : labels.paused : labels.notTracking;
  const body = !watch ? labels.notTracked : watch.previewUnavailable ? labels.unavailable : meaningfulEvents.length === 0 ? labels.noChanges : "";

  return <div className="saved-monitoring"><div className="saved-monitoring-heading"><span>{labels.monitoring}</span><span className={`status-pill ${statusTone}`}>{status}</span></div>{body ? <p>{body}</p> : <div className="saved-monitoring-events">{meaningfulEvents.slice(0, 2).map((event) => <div className="saved-monitoring-event" key={`${event.trigger_type}-${event.title}-${event.current_value ?? ""}`}><span className={`status-pill ${eventSeverityTone(event.severity)}`}>{watchEventLabel(event.trigger_type, locale)}</span><strong>{event.title}</strong><p>{event.summary}</p>{event.baseline_value || event.current_value ? <small>{labels.changedFromTo(event.baseline_value ?? "?", event.current_value ?? "?")}</small> : null}</div>)}</div>}</div>;
}

async function loadWatchPreviews(alerts: Alert[]): Promise<SavedWatchMap> {
  const objectWatchAlerts = alerts.filter((alert) => alert.filters.alert_kind === "object_watch" || alert.filters.target_listing_id || alert.filters.target_draft_id);
  const previews = await Promise.allSettled(objectWatchAlerts.map((alert) => api.previewAlert(alert.id)));
  return objectWatchAlerts.reduce<SavedWatchMap>((accumulator, alert, index) => {
    const key = alertWatchKey(alert);
    if (!key) return accumulator;
    const previewResult = previews[index];
    accumulator[key] = previewResult.status === "fulfilled"
      ? { alert, preview: previewResult.value, previewUnavailable: false }
      : { alert, preview: null, previewUnavailable: true };
    return accumulator;
  }, {});
}

function watchForItem(item: SavedItem, watchByTarget: SavedWatchMap): SavedWatchState | null {
  if (item.kind === "checked") {
    return watchByTarget[`draft:${item.draft.id}`] ?? watchByTarget[`listing:${item.draft.listing_id}`] ?? null;
  }
  return watchByTarget[`listing:${item.listing.id}`] ?? null;
}

function alertWatchKey(alert: Alert): string | null {
  if (alert.filters.target_draft_id) return `draft:${alert.filters.target_draft_id}`;
  if (alert.filters.target_listing_id) return `listing:${alert.filters.target_listing_id}`;
  return null;
}

function isNoChangeEvent(event: ObjectWatchEvent) {
  return event.severity === "info" && event.title === "No object-watch trigger fired";
}

function watchEventLabel(trigger: string, locale: Locale) {
  const labels: Record<Locale, Record<string, string>> = {
    en: { price_change: "Price changed", cheaper_comparable: "Cheaper comparable", days_on_market_threshold: "Still on market", planned_investment_status: "Area plans changed", developer_signal: "Developer signal", negotiation_opportunity: "Negotiation opportunity" },
    pl: { price_change: "Cena się zmieniła", cheaper_comparable: "Tańsza podobna oferta", days_on_market_threshold: "Nadal na rynku", planned_investment_status: "Zmiana planów w okolicy", developer_signal: "Sygnał dewelopera", negotiation_opportunity: "Szansa na negocjacje" },
    ru: { price_change: "Цена изменилась", cheaper_comparable: "Более дешевый аналог", days_on_market_threshold: "Все еще на рынке", planned_investment_status: "Планы района изменились", developer_signal: "Сигнал застройщика", negotiation_opportunity: "Возможность торга" },
    uk: { price_change: "Ціна змінилася", cheaper_comparable: "Дешевший схожий варіант", days_on_market_threshold: "Досі на ринку", planned_investment_status: "Плани району змінилися", developer_signal: "Сигнал забудовника", negotiation_opportunity: "Можливість торгу" },
  };
  return labels[locale][trigger] ?? trigger;
}

function eventSeverityTone(severity: string) {
  if (severity === "opportunity") return "healthy";
  if (severity === "risk") return "rejected";
  if (severity === "watch") return "warning";
  return "info";
}

function countSaved(drafts: UserSubmittedListingDraft[], favorites: Favorite[]) { return drafts.length + favorites.filter((favorite) => !drafts.some((draft) => draft.listing_id === favorite.listing_id)).length; }
function draftAnalysis(draft: UserSubmittedListingDraft): Record<string, unknown> {
  const candidate = draft.analysis_payload?.analysis;
  return candidate && typeof candidate === "object" ? candidate as Record<string, unknown> : draft.analysis_payload;
}
function draftScores(draft: UserSubmittedListingDraft): PropertyScores | null { const candidate = draftAnalysis(draft).scores; return candidate && typeof candidate === "object" ? candidate as PropertyScores : null; }
function draftDecision(draft: UserSubmittedListingDraft): BuyerDecisionPackage | null {
  const candidate = draftAnalysis(draft).buyer_decision;
  if (!candidate || typeof candidate !== "object") return null;
  const verdict = (candidate as { verdict?: unknown }).verdict;
  return verdict && typeof verdict === "object" ? candidate as BuyerDecisionPackage : null;
}
