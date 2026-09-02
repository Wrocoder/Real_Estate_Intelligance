"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Bell, FileText, RefreshCw, Trash2 } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type PropertyScores,
  type UserSubmittedListingDraft,
} from "@/lib/api";
import { dateValue, money, numberValue } from "@/lib/format";
import { CHECK_DRAFTS_COPY } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const MY_APARTMENTS_COPY = {
  en: {
    fairPrice: "Fair price",
    score: "Score",
    updated: "Updated",
    open: "Open",
    compare: "Compare",
    track: "Track",
    tracked: "Apartment tracking is enabled.",
  },
  pl: {
    fairPrice: "Cena rynkowa",
    score: "Ocena",
    updated: "Aktualizacja",
    open: "Otwórz",
    compare: "Porównaj",
    track: "Śledź",
    tracked: "Śledzenie mieszkania zostało włączone.",
  },
  ru: {
    fairPrice: "Рыночный диапазон",
    score: "Оценка",
    updated: "Обновлено",
    open: "Открыть",
    compare: "Сравнить",
    track: "Следить",
    tracked: "Отслеживание квартиры включено.",
  },
  uk: {
    fairPrice: "Ринковий діапазон",
    score: "Оцінка",
    updated: "Оновлено",
    open: "Відкрити",
    compare: "Порівняти",
    track: "Стежити",
    tracked: "Стеження за квартирою увімкнено.",
  },
} as const;

const NAV_TITLE = {
  en: "My apartments",
  pl: "Moje mieszkania",
  ru: "Мои квартиры",
  uk: "Мої квартири",
} as const;

const NAV_SUBTITLE = {
  en: "Saved checks, current estimates and next actions during your apartment search.",
  pl: "Zapisane sprawdzenia, aktualne szacunki i kolejne kroki w trakcie szukania mieszkania.",
  ru: "Сохраненные проверки, текущие оценки и следующие действия во время поиска квартиры.",
  uk: "Збережені перевірки, поточні оцінки та наступні дії під час пошуку квартири.",
} as const;

export default function CheckDraftsPage() {
  const { locale } = useLocalePreference();
  const copy = CHECK_DRAFTS_COPY[locale];
  const [drafts, setDrafts] = useState<UserSubmittedListingDraft[]>([]);
  const [status, setStatus] = useState(copy.statuses.loading);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setIsLoading(true);
    setStatus(copy.statuses.loading);
    try {
      const data = await api.listUserSubmittedListingDrafts({ limit: 100 });
      setDrafts(data);
      setStatus(copy.statuses.loaded(data.length));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.backendUnavailable);
    } finally {
      setIsLoading(false);
    }
  }, [copy]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deleteDraft(draftId: string) {
    setError("");
    setStatus(copy.statuses.deleting);
    const response = await api.deleteUserSubmittedListingDraft(draftId);
    if (!response.ok) {
      const body = await response.text();
      setError(`API ${response.status}: ${body}`);
      setStatus(copy.statuses.deleteError);
      return;
    }
    setDrafts((current) => current.filter((draft) => draft.id !== draftId));
    setStatus(copy.statuses.deleted);
  }

  async function trackDraft(draftId: string) {
    setError("");
    setStatus(MY_APARTMENTS_COPY[locale].track);
    try {
      await api.createUserSubmittedDraftObjectWatch(draftId, {});
      setStatus(MY_APARTMENTS_COPY[locale].tracked);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.reportError);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{NAV_TITLE[locale]}</h1>
          <p>{NAV_SUBTITLE[locale]}</p>
        </div>
        <div className="button-row">
          <Link className="button" href="/check">
            <FileText size={16} /> {copy.actions.newCheck}
          </Link>
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{NAV_TITLE[locale]}</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body">
          {error ? (
            <ErrorBlock message={error} prefix={copy.errorPrefix} />
          ) : drafts.length === 0 && isLoading ? (
            <LoadingBlock label={copy.empty.loading} />
          ) : drafts.length === 0 ? (
            <EmptyBlock label={copy.empty.noDrafts} />
          ) : (
            <div className="apartment-card-grid">
              {drafts.map((draft) => {
                const scores = draftScores(draft);
                return (
                  <article className="apartment-card" key={draft.id}>
                    <div>
                      <h3>{draft.address}</h3>
                      <p>
                        {draft.district}, {draft.city}
                      </p>
                    </div>
                    <div className="apartment-card-price">
                      <strong>{money(draft.price, locale)}</strong>
                      <span>
                        {numberValue(draft.area_m2, locale)} m2 · {copy.values.rooms(draft.rooms)}
                      </span>
                    </div>
                    <div className="area-metrics">
                      <span>
                        <small>{MY_APARTMENTS_COPY[locale].fairPrice}</small>
                        <strong>{fairRange(scores, locale)}</strong>
                      </span>
                      <span>
                        <small>{MY_APARTMENTS_COPY[locale].score}</small>
                        <strong>{scores ? `${scores.investment_score}/100` : `${draft.confidence_score}/100`}</strong>
                      </span>
                      <span>
                        <small>{MY_APARTMENTS_COPY[locale].updated}</small>
                        <strong>{dateValue(draft.updated_at, locale)}</strong>
                      </span>
                    </div>
                    <div className="button-row">
                      <Link className="button primary" href={`/check?draft=${encodeURIComponent(draft.id)}`}>
                        <FileText size={16} /> {MY_APARTMENTS_COPY[locale].open}
                      </Link>
                      <Link className="button" href={`/compare?ids=${encodeURIComponent(draft.listing_id)}`}>
                        <BarChart3 size={16} /> {MY_APARTMENTS_COPY[locale].compare}
                      </Link>
                      <button className="button" type="button" onClick={() => void trackDraft(draft.id)}>
                        <Bell size={16} /> {MY_APARTMENTS_COPY[locale].track}
                      </button>
                      <button className="button danger" type="button" onClick={() => void deleteDraft(draft.id)}>
                        <Trash2 size={16} /> {copy.actions.delete}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function draftScores(draft: UserSubmittedListingDraft): PropertyScores | null {
  const candidate = draft.analysis_payload?.scores;
  if (!candidate || typeof candidate !== "object") return null;
  return candidate as PropertyScores;
}

function fairRange(scores: PropertyScores | null, locale: Parameters<typeof money>[1]) {
  if (!scores) return "-";
  return `${money(scores.fair_price_low, locale)} - ${money(scores.fair_price_high, locale)}`;
}
