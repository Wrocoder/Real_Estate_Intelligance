"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, MapPinned, RefreshCw, Search } from "lucide-react";

import { CoverageNotice } from "@/components/CoverageNotice";
import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import { api, type AreaStatistics } from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type Copy = {
  title: string;
  subtitle: string;
  compare: string;
  check: string;
  sectionTitle: string;
  sectionNote: string;
  searchLabel: string;
  searchPlaceholder: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  median: string;
  observations: string;
  period: string;
  noPeriod: string;
  transactionBasis: string;
  limitedSample: string;
  yearly: string;
  transactionCount: string;
  details: string;
  resultCount: (visible: number, total: number) => string;
};

const DIRECTORY_COPY = {
  pl: { title: "Miasta i dzielnice", city: "Miejscowość", noCities: "Brak dostępnych miejscowości", more: "Pokaż więcej", note: "Mediana obejmuje ostatnie 12 miesięcy. Sprawdź liczbę transakcji i okres obserwacji dla wybranej lokalizacji." },
  en: { title: "Cities and neighborhoods", city: "Location", noCities: "No locations available", more: "Show more", note: "The median covers the last 12 months. Check the transaction count and observation period for your chosen location." },
  ru: { title: "Города и районы", city: "Населённый пункт", noCities: "Нет доступных населённых пунктов", more: "Показать ещё", note: "Медиана охватывает последние 12 месяцев. Проверьте число сделок и период наблюдений для выбранной локации." },
  uk: { title: "Міста та райони", city: "Населений пункт", noCities: "Немає доступних населених пунктів", more: "Показати ще", note: "Медіана охоплює останні 12 місяців. Перевірте кількість угод і період спостережень для вибраної локації." },
};

const COPY: Record<Locale, Copy> = {
  pl: {
    title: "Osiedla Wrocławia",
    subtitle: "Porównaj ceny z zarejestrowanych transakcji przed oceną konkretnego mieszkania.",
    compare: "Porównaj",
    check: "Sprawdź mieszkanie",
    sectionTitle: "Dane transakcyjne według osiedli",
    sectionNote: "Bieżąca mediana obejmuje ostatnie 12 miesięcy. Mediany roczne pokazują pełny dostępny okres dla transakcji przypisanych do oficjalnej granicy osiedla.",
    searchLabel: "Znajdź osiedle",
    searchPlaceholder: "Np. Borek lub Ołbin",
    loading: "Pobieramy aktualne statystyki transakcji...",
    error: "Nie udało się pobrać statystyk osiedli.",
    retry: "Spróbuj ponownie",
    empty: "Brak osiedli pasujących do wyszukiwania.",
    median: "Mediana - ostatnie 12 miesięcy",
    observations: "Transakcje - ostatnie 12 miesięcy",
    period: "Zakres bieżącej mediany",
    noPeriod: "Nie podano",
    transactionBasis: "Dane transakcyjne RCN",
    limitedSample: "Mała próba - interpretuj ostrożnie",
    yearly: "Mediany według lat",
    transactionCount: "transakcji",
    details: "Zobacz dane osiedla",
    resultCount: (visible, total) => `${visible} z ${total} osiedli`,
  },
  en: {
    title: "Wrocław neighborhoods",
    subtitle: "Compare prices from registered transactions before evaluating a specific apartment.",
    compare: "Compare",
    check: "Check an apartment",
    sectionTitle: "Transaction data by neighborhood",
    sectionNote: "The current median covers the last 12 months. Yearly medians show the full available period for transactions assigned to the neighborhood's official boundary.",
    searchLabel: "Find a neighborhood",
    searchPlaceholder: "For example Borek or Ołbin",
    loading: "Fetching current transaction statistics...",
    error: "Neighborhood statistics could not be loaded.",
    retry: "Try again",
    empty: "No neighborhoods match your search.",
    median: "Median - last 12 months",
    observations: "Transactions - last 12 months",
    period: "Current median period",
    noPeriod: "Not supplied",
    transactionBasis: "RCN transaction data",
    limitedSample: "Small sample - interpret cautiously",
    yearly: "Medians by year",
    transactionCount: "transactions",
    details: "View neighborhood data",
    resultCount: (visible, total) => `${visible} of ${total} neighborhoods`,
  },
  ru: {
    title: "Районы Вроцлава",
    subtitle: "Сравните цены зарегистрированных сделок перед оценкой конкретной квартиры.",
    compare: "Сравнить",
    check: "Проверить квартиру",
    sectionTitle: "Данные о сделках по районам",
    sectionNote: "Текущая медиана охватывает последние 12 месяцев. Годовые медианы показывают весь доступный период по сделкам внутри официальной границы района.",
    searchLabel: "Найти район",
    searchPlaceholder: "Например, Borek или Ołbin",
    loading: "Загружаем актуальную статистику сделок...",
    error: "Не удалось загрузить статистику районов.",
    retry: "Повторить",
    empty: "Районы по этому запросу не найдены.",
    median: "Медиана - последние 12 месяцев",
    observations: "Сделки - последние 12 месяцев",
    period: "Период текущей медианы",
    noPeriod: "Не указан",
    transactionBasis: "Данные сделок RCN",
    limitedSample: "Малая выборка - интерпретируйте осторожно",
    yearly: "Медианы по годам",
    transactionCount: "сделок",
    details: "Данные района",
    resultCount: (visible, total) => `${visible} из ${total} районов`,
  },
  uk: {
    title: "Райони Вроцлава",
    subtitle: "Порівняйте ціни зареєстрованих угод перед оцінкою конкретної квартири.",
    compare: "Порівняти",
    check: "Перевірити квартиру",
    sectionTitle: "Дані про угоди за районами",
    sectionNote: "Поточна медіана охоплює останні 12 місяців. Річні медіани показують увесь доступний період за угодами в офіційній межі району.",
    searchLabel: "Знайти район",
    searchPlaceholder: "Наприклад, Borek або Ołbin",
    loading: "Завантажуємо актуальну статистику угод...",
    error: "Не вдалося завантажити статистику районів.",
    retry: "Повторити",
    empty: "Районів за цим запитом не знайдено.",
    median: "Медіана - останні 12 місяців",
    observations: "Угоди - останні 12 місяців",
    period: "Період поточної медіани",
    noPeriod: "Не вказано",
    transactionBasis: "Дані угод RCN",
    limitedSample: "Мала вибірка - інтерпретуйте обережно",
    yearly: "Медіани за роками",
    transactionCount: "угод",
    details: "Дані району",
    resultCount: (visible, total) => `${visible} із ${total} районів`,
  },
};

export function AreasDirectory({ initialAreas }: { initialAreas: AreaStatistics[] | null }) {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const [areas, setAreas] = useState<AreaStatistics[]>(initialAreas ?? []);
  const [query, setQuery] = useState("");
  const initialCity = initialAreas?.some((area) => area.city === "Wrocław")
    ? "Wrocław"
    : initialAreas?.[0]?.city ?? "";
  const [city, setCity] = useState(initialCity);
  const [limit, setLimit] = useState(48);
  const directoryCopy = DIRECTORY_COPY[locale];
  const [loading, setLoading] = useState(initialAreas === null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setAreas(await api.listAreas());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialAreas === null) void load();
  }, [initialAreas, load]);

  const supportedAreas = useMemo(
    () => areas
      .filter((area) => area.city === city)
      .sort((left, right) => left.name.localeCompare(right.name, "pl")),
    [areas, city],
  );
  const cities = useMemo(() => [...new Set(areas.map((area) => area.city))].sort((a, b) => a.localeCompare(b, "pl")), [areas]);

  useEffect(() => {
    if (!cities.length || cities.includes(city)) return;
    const nextCity = cities.includes("Wrocław") ? "Wrocław" : cities[0];
    setCity(nextCity);
  }, [cities, city]);

  function selectCity(value: string) {
    setCity(value);
    setQuery("");
    setLimit(48);
  }
  const normalizedQuery = query.trim().toLocaleLowerCase("pl-PL");
  const visibleAreas = supportedAreas.filter((area) =>
    area.name.toLocaleLowerCase("pl-PL").includes(normalizedQuery),
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{directoryCopy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas/compare">
            <BarChart3 size={16} /> {copy.compare}
          </Link>
          <Link className="button primary" href="/check">
            <MapPinned size={16} /> {copy.check}
          </Link>
        </div>
      </header>

      <CoverageNotice />

      <section className="areas-directory" aria-labelledby="areas-directory-title">
        <div className="areas-directory-heading">
          <div>
            <h2 id="areas-directory-title">{city}</h2>
            <p>{directoryCopy.note}</p>
          </div>
          <label className="field areas-directory-search">
            <span>{directoryCopy.city}</span>
            <span className="input-with-icon">
              <MapPinned aria-hidden="true" size={16} />
              <select
                className="input"
                disabled={!cities.length}
                onChange={(event) => selectCity(event.target.value)}
                value={city}
              >
                {cities.length
                  ? cities.map((name) => <option key={name} value={name}>{name}</option>)
                  : <option value="">{directoryCopy.noCities}</option>}
              </select>
            </span>
          </label>
          <label className="field areas-directory-search">
            <span>{copy.searchLabel}</span>
            <span className="input-with-icon">
              <Search aria-hidden="true" size={16} />
              <input
                className="input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                type="search"
                value={query}
              />
            </span>
          </label>
        </div>

        {loading ? <div className="empty-state" role="status">{copy.loading}</div> : null}
        {failed ? (
          <div className="empty-state state-block error" role="alert">
            <strong>{copy.error}</strong>
            <div className="state-block-actions">
              <button className="button" onClick={() => void load()} type="button">
                <RefreshCw aria-hidden="true" size={15} /> {copy.retry}
              </button>
            </div>
          </div>
        ) : null}
        {!loading && !failed ? (
          <>
            <p className="areas-directory-count" aria-live="polite">
              {copy.resultCount(visibleAreas.length, supportedAreas.length)}
            </p>
            {visibleAreas.length ? (
              <div className="seo-area-grid">
                {visibleAreas.slice(0, limit).map((area) => (
                  <AreaCard area={area} copy={copy} locale={locale} key={area.area_id} />
                ))}
              </div>
            ) : <div className="empty-state">{copy.empty}</div>}
            {visibleAreas.length > limit ? <button className="button" type="button" onClick={() => setLimit(limit + 48)}>{directoryCopy.more}</button> : null}
          </>
        ) : null}
      </section>
    </>
  );
}

function AreaCard({ area, copy, locale }: { area: AreaStatistics; copy: Copy; locale: Locale }) {
  const sampleSize = area.transaction_observation_count || area.data_provenance.sample_size || 0;
  const timeRange = area.data_provenance.time_range
    ?? observationPeriod(area.transaction_observed_from, area.transaction_observed_to, locale)
    ?? copy.noPeriod;

  return (
    <article className="seo-area-card live-area-card">
      <div className="live-area-card-heading">
        <div>
          <span className="status-pill info">{copy.transactionBasis}</span>
          <h2>{area.name}</h2>
        </div>
        {sampleSize < 20 ? <span className="status-pill warning">{copy.limitedSample}</span> : null}
      </div>
      <div className="area-metrics transaction-area-metrics">
        <span>
          <small>{copy.median}</small>
          <strong>{money(area.median_price_per_m2, locale)}/m²</strong>
        </span>
        <span>
          <small>{copy.observations}</small>
          <strong>{numberValue(sampleSize, locale)}</strong>
        </span>
        <span>
          <small>{copy.period}</small>
          <strong>{timeRange}</strong>
        </span>
      </div>
      {area.transaction_yearly_history.length ? (
        <div className="area-card-yearly-history">
          <h3>{copy.yearly}</h3>
          <dl>
            {area.transaction_yearly_history.map((point) => (
              <div key={point.period_start}>
                <dt>{new Date(`${point.period_start}T00:00:00Z`).getUTCFullYear()}</dt>
                <dd>
                  <strong>{money(point.median_price_per_m2, locale)}/m²</strong>
                  <small>{numberValue(point.observation_count, locale)} {copy.transactionCount}</small>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <ProvenanceDetails
        locale={locale}
        provenance={{
          sourceName: area.data_provenance.source_name ?? area.data_sources[0],
          sourceType: area.data_provenance.source_type,
          updatedAt: area.data_provenance.updated_at,
          sampleSize,
          scope: area.data_provenance.geographic_scope ?? `${area.city}: ${area.name}`,
          timeRange,
          calculationType: area.data_provenance.calculation_type,
          mode: area.data_provenance.mode,
        }}
      />
      <Link className="button" href={`/areas/${encodeURIComponent(area.area_id)}`}>
        {copy.details} <ArrowRight size={16} />
      </Link>
    </article>
  );
}

function observationPeriod(from: string | null, to: string | null, locale: Locale) {
  if (!from || !to) return null;
  const formatter = new Intl.DateTimeFormat(
    locale === "pl" ? "pl-PL" : locale === "ru" ? "ru-RU" : locale === "uk" ? "uk-UA" : "en-US",
    { year: "numeric", month: "short" },
  );
  return `${formatter.format(new Date(from))} - ${formatter.format(new Date(to))}`;
}
