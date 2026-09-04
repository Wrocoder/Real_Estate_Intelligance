"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Bell, FileText, RefreshCw, Trash2 } from "lucide-react";

import { AuthForm } from "@/components/AuthForm";
import { ListingProvenance } from "@/components/ListingProvenance";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { ApiError, api, type Favorite, type Listing, type PropertyScores, type UserSubmittedListingDraft } from "@/lib/api";
import { dateValue, money, numberValue } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import { CHECK_DRAFTS_COPY, type Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type Filter = "all" | "checked" | "favorites";
type SavedItem =
  | { kind: "checked"; draft: UserSubmittedListingDraft; favorite: Favorite | null }
  | { kind: "favorite"; listing: Listing; favorite: Favorite };

const LABELS = {
  en: { all: "All", checked: "Checked", favorites: "Favorites", checkedBadge: "Checked apartment", favoriteBadge: "Favorite apartment", fairPrice: "Fair price", score: "Score", updated: "Updated", open: "Open", compare: "Compare", track: "Track", tracked: "Apartment tracking is enabled.", remove: "Remove", noSaved: "No saved apartments yet. Save an apartment or check a listing to see it here.", savedCount: (count: number) => `${count} saved apartments` },
  pl: { all: "Wszystkie", checked: "Sprawdzone", favorites: "Ulubione", checkedBadge: "Sprawdzone mieszkanie", favoriteBadge: "Ulubione mieszkanie", fairPrice: "Cena rynkowa", score: "Ocena", updated: "Aktualizacja", open: "Otwórz", compare: "Porównaj", track: "Śledź", tracked: "Śledzenie mieszkania zostało włączone.", remove: "Usuń", noSaved: "Nie ma jeszcze zapisanych mieszkań. Zapisz ogłoszenie lub je sprawdź, aby zobaczyć je tutaj.", savedCount: (count: number) => `Zapisane mieszkania: ${count}` },
  ru: { all: "Все", checked: "Проверенные", favorites: "Избранные", checkedBadge: "Проверенная квартира", favoriteBadge: "Избранная квартира", fairPrice: "Рыночный диапазон", score: "Оценка", updated: "Обновлено", open: "Открыть", compare: "Сравнить", track: "Следить", tracked: "Отслеживание квартиры включено.", remove: "Удалить", noSaved: "Пока нет сохраненных квартир. Добавьте объявление в избранное или проверьте его, чтобы увидеть здесь.", savedCount: (count: number) => `Сохраненных квартир: ${count}` },
  uk: { all: "Усі", checked: "Перевірені", favorites: "Обрані", checkedBadge: "Перевірена квартира", favoriteBadge: "Обрана квартира", fairPrice: "Ринковий діапазон", score: "Оцінка", updated: "Оновлено", open: "Відкрити", compare: "Порівняти", track: "Стежити", tracked: "Стеження за квартирою увімкнено.", remove: "Видалити", noSaved: "Поки немає збережених квартир. Додайте оголошення в обране або перевірте його, щоб побачити тут.", savedCount: (count: number) => `Збережених квартир: ${count}` },
} as const;

const TITLE = { en: "My apartments", pl: "Moje mieszkania", ru: "Мои квартиры", uk: "Мої квартири" } as const;
const SUBTITLE = { en: "One place for saved listings, checks and the next action.", pl: "Jedno miejsce na zapisane ogłoszenia, sprawdzenia i kolejne działania.", ru: "Одно место для сохраненных объявлений, проверок и следующих действий.", uk: "Одне місце для збережених оголошень, перевірок і наступних дій." } as const;

export default function SavedApartmentsPage() {
  const { locale } = useLocalePreference();
  const copy = CHECK_DRAFTS_COPY[locale];
  const labels = LABELS[locale];
  const [drafts, setDrafts] = useState<UserSubmittedListingDraft[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
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
      const [nextDrafts, nextFavorites] = await Promise.all([api.listUserSubmittedListingDrafts({ limit: 100 }), api.listFavorites()]);
      if (requestId !== loadRequestRef.current) return;
      setDrafts(nextDrafts); setFavorites(nextFavorites); setStatus(labels.savedCount(countSaved(nextDrafts, nextFavorites)));
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
      if (item.kind === "checked") await api.createUserSubmittedDraftObjectWatch(item.draft.id, {});
      else await api.createListingObjectWatch(item.listing.id, {});
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
      {error ? <ErrorBlock message={error} prefix={copy.errorPrefix} /> : isLoading ? <LoadingBlock label={copy.empty.loading} /> : items.length === 0 ? <EmptyBlock label={labels.noSaved} /> : <div className="apartment-card-grid">{items.map((item) => <SavedApartmentCard key={item.kind === "checked" ? item.draft.id : item.favorite.id} item={item} locale={locale} copy={copy} labels={labels} onTrack={() => void track(item)} onRemove={() => void remove(item)} />)}</div>}
    </div></section>
  </>;
}

function SavedApartmentCard({ item, locale, copy, labels, onTrack, onRemove }: { item: SavedItem; locale: Locale; copy: (typeof CHECK_DRAFTS_COPY)[Locale]; labels: (typeof LABELS)[Locale]; onTrack: () => void; onRemove: () => void }) {
  const listing = item.kind === "checked" ? item.draft : item.listing;
  const scores = item.kind === "checked" ? draftScores(item.draft) : null;
  const listingId = item.kind === "checked" ? item.draft.listing_id : item.listing.id;
  const updated = item.kind === "checked" ? item.draft.updated_at : item.favorite.created_at;
  const title = item.kind === "checked" ? item.draft.address : item.listing.address || item.listing.title;
  return <article className="apartment-card"><div><span className="status-pill info">{item.kind === "checked" ? labels.checkedBadge : labels.favoriteBadge}</span><h3>{title}</h3><p>{listing.district}, {listing.city}</p></div>{item.kind === "favorite" ? <ListingProvenance listing={item.listing} locale={locale} /> : <div className="listing-provenance"><span><strong>{labels.updated}:</strong> {dateValue(updated, locale)}</span><span>{locale === "pl" ? "Źródło: prywatna analiza" : locale === "ru" ? "Источник: частный анализ" : locale === "uk" ? "Джерело: приватний аналіз" : "Source: private analysis"}</span><span>{locale === "pl" ? "Zdjęcia: brak danych ze źródła" : locale === "ru" ? "Фото: источник не сообщил статус" : locale === "uk" ? "Фото: джерело не повідомило статус" : "Photos: source status not supplied"}</span></div>}<div className="apartment-card-price"><strong>{money(listing.price, locale)}</strong><span>{numberValue(listing.area_m2, locale)} m2 · {copy.values.rooms(listing.rooms)}</span></div><div className="area-metrics"><span><small>{labels.fairPrice}</small><strong>{fairRange(scores, locale)}</strong></span><span><small>{labels.score}</small><strong>{scores ? `${scores.investment_score}/100` : "-"}</strong></span></div><div className="button-row"><Link className="button primary" href={item.kind === "checked" ? `/check?draft=${encodeURIComponent(item.draft.id)}` : `/listings/${encodeURIComponent(listingId)}`}><FileText size={16} /> {labels.open}</Link><Link className="button" href={`/compare?ids=${encodeURIComponent(listingId)}`}><BarChart3 size={16} /> {labels.compare}</Link><button className="button" type="button" onClick={onTrack}><Bell size={16} /> {labels.track}</button><button className="button danger" type="button" onClick={onRemove}><Trash2 size={16} /> {labels.remove}</button></div></article>;
}

function countSaved(drafts: UserSubmittedListingDraft[], favorites: Favorite[]) { return drafts.length + favorites.filter((favorite) => !drafts.some((draft) => draft.listing_id === favorite.listing_id)).length; }
function draftScores(draft: UserSubmittedListingDraft): PropertyScores | null { const candidate = draft.analysis_payload?.scores; return candidate && typeof candidate === "object" ? candidate as PropertyScores : null; }
function fairRange(scores: PropertyScores | null, locale: Locale) { return scores ? `${money(scores.fair_price_low, locale)} - ${money(scores.fair_price_high, locale)}` : "-"; }
