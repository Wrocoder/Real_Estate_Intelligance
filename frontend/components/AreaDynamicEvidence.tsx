"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import { AreaPriceHistoryChart } from "@/components/AreaPriceHistoryChart";
import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import { api, type AreaPriceHistory, type AreaStatistics, type CoverageMetadata, type PlannedInvestment } from "@/lib/api";
import { dateValue, money, numberValue, percent } from "@/lib/format";
import { useLocalePreference } from "@/lib/useLocalePreference";

type InfrastructureSummary = {
  transport: number | null;
  schools: number | null;
  kindergartens: number | null;
  amenities: number | null;
  industrialZones: number | null;
};

const COPY = {
  pl: {
    title: "Dane sprawdzalne dla tego osiedla",
    market: "Rynek mieszkaniowy",
    infrastructure: "Infrastruktura w bazie",
    investments: "Planowane inwestycje",
    source: "Źródło",
    checked: "Aktualizacja",
    scope: "Zakres",
    verified: "Dane źródłowe",
    days: "dni",
    listings: "Aktywne ogłoszenia",
    transport: "przystanki",
    schools: "szkoły",
    kindergartens: "przedszkola",
    amenities: "udogodnienia",
    industrialZones: "strefy przemysłowe",
    empty: "Brak zweryfikowanych rekordów dla tego osiedla.",
    unknown: "Brak danych",
    loading: "Pobieramy aktualne dane osiedla...",
    error: "Nie udało się pobrać danych osiedla.",
    retry: "Spróbuj ponownie",
    demo: "Rekord demonstracyjny, nie jest potwierdzeniem miejskiej inwestycji.",
    noSource: "Źródło niepodane",
    window: "Zmiana ceny w 90 dni",
    supply: "Zmiana podaży w 90 dni",
    median: "Mediana ceny - ostatnie 12 miesięcy",
    average: "Średnia cena transakcyjna",
    transactions: "Transakcje - ostatnie 12 miesięcy",
    period: "Zakres bieżącej mediany",
    averageTime: "Średni czas na rynku",
    listingUnavailable: "Dynamika ofert i czas ekspozycji nie są dostępne w rejestrze transakcji.",
    referenceNote: "Liczby obejmują wyłącznie rekordy referencyjne przypisane do osiedla; brak rekordu nie oznacza braku obiektu w rzeczywistości.",
  },
  en: {
    title: "Verifiable neighborhood data",
    market: "Housing market",
    infrastructure: "Infrastructure in dataset",
    investments: "Planned investments",
    source: "Source",
    checked: "Updated",
    scope: "Scope",
    verified: "Source data",
    days: "days",
    listings: "Active listings",
    transport: "transit stops",
    schools: "schools",
    kindergartens: "kindergartens",
    amenities: "amenities",
    industrialZones: "industrial zones",
    empty: "No verified records for this neighborhood.",
    unknown: "No data",
    loading: "Fetching current neighborhood data...",
    error: "Neighborhood data could not be loaded.",
    retry: "Try again",
    demo: "Demo record; not confirmation of a municipal investment.",
    noSource: "Source not provided",
    window: "90-day price change",
    supply: "90-day supply change",
    median: "Median price - last 12 months",
    average: "Average transaction price",
    transactions: "Transactions - last 12 months",
    period: "Current median period",
    averageTime: "Average time on market",
    listingUnavailable: "Listing trends and time on market are not available from the transaction register.",
    referenceNote: "Counts include only reference records assigned to the neighborhood; no record does not prove the real-world absence of an amenity.",
  },
  ru: {
    title: "Проверяемые данные по району",
    market: "Рынок жилья",
    infrastructure: "Инфраструктура в базе",
    investments: "Планируемые инвестиции",
    source: "Источник",
    checked: "Обновлено",
    scope: "Охват",
    verified: "Исходные данные",
    days: "дн.",
    listings: "Активные объявления",
    transport: "остановок",
    schools: "школ",
    kindergartens: "детских садов",
    amenities: "объектов сервиса",
    industrialZones: "промышленных зон",
    empty: "Проверенных записей по району нет.",
    unknown: "Нет данных",
    loading: "Загружаем текущие данные района...",
    error: "Не удалось загрузить данные района.",
    retry: "Повторить",
    demo: "Демонстрационная запись, не подтверждение городской инвестиции.",
    noSource: "Источник не указан",
    window: "Изменение цены за 90 дней",
    supply: "Изменение предложения за 90 дней",
    median: "Медиана цены - последние 12 месяцев",
    average: "Средняя цена сделки",
    transactions: "Сделки - последние 12 месяцев",
    period: "Период текущей медианы",
    averageTime: "Средний срок экспозиции",
    listingUnavailable: "Динамика объявлений и срок экспозиции недоступны в реестре сделок.",
    referenceNote: "Количество отражает только справочные записи, привязанные к району; отсутствие записи не означает отсутствие объекта в реальности.",
  },
  uk: {
    title: "Перевірені дані району",
    market: "Ринок житла",
    infrastructure: "Інфраструктура в базі",
    investments: "Заплановані інвестиції",
    source: "Джерело",
    checked: "Оновлено",
    scope: "Охоплення",
    verified: "Вихідні дані",
    days: "днів",
    listings: "Активні оголошення",
    transport: "зупинок",
    schools: "шкіл",
    kindergartens: "дитсадків",
    amenities: "об'єктів сервісу",
    industrialZones: "промислових зон",
    empty: "Перевірених записів для району немає.",
    unknown: "Немає даних",
    loading: "Завантажуємо поточні дані району...",
    error: "Не вдалося завантажити дані району.",
    retry: "Повторити",
    demo: "Демонстраційний запис, не підтвердження міської інвестиції.",
    noSource: "Джерело не вказано",
    window: "Зміна ціни за 90 днів",
    supply: "Зміна пропозиції за 90 днів",
    median: "Медіана ціни - останні 12 місяців",
    average: "Середня ціна угоди",
    transactions: "Угоди - останні 12 місяців",
    period: "Період поточної медіани",
    averageTime: "Середній строк експозиції",
    listingUnavailable: "Динаміка оголошень і строк експозиції недоступні в реєстрі угод.",
    referenceNote: "Кількість охоплює лише довідкові записи, прив'язані до району; відсутність запису не означає відсутність об'єкта в реальності.",
  },
} as const;

function EvidenceMeta({ coverage, area }: { coverage: CoverageMetadata | null; area: AreaStatistics | null }) {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  return (
    <div className="area-evidence-meta">
      <span><b>{copy.source}</b> {area?.data_provenance.source_name ?? coverage?.source_name ?? copy.unknown}</span>
      <span><b>{copy.checked}</b> {area?.data_provenance.updated_at ? dateValue(area.data_provenance.updated_at, locale) : coverage ? dateValue(coverage.checked_at, locale) : copy.unknown}</span>
      <span><b>{copy.scope}</b> {area ? `${area.city}: ${area.name}` : copy.unknown}</span>
    </div>
  );
}

export function AreaDynamicEvidence({ areaId, city, district }: { areaId: string; city: string; district: string }) {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const [area, setArea] = useState<AreaStatistics | null>(null);
  const [priceHistory, setPriceHistory] = useState<AreaPriceHistory | null>(null);
  const [coverage, setCoverage] = useState<CoverageMetadata | null>(null);
  const [investments, setInvestments] = useState<PlannedInvestment[] | null>(null);
  const [infrastructure, setInfrastructure] = useState<InfrastructureSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    setHistoryFailed(false);
    const results = await Promise.allSettled([
      api.getAreaStatistics(areaId),
      api.getAreaPriceHistory(areaId),
      api.getCoverage(),
      api.listPlannedInvestments({ city, district }),
      api.listTransportStops({ district_id: areaId, limit: 500 }),
      api.listSchools({ district_id: areaId, limit: 500 }),
      api.listKindergartens({ district_id: areaId, limit: 500 }),
      api.listAmenities({ district_id: areaId, limit: 500 }),
      api.listIndustrialZones({ district_id: areaId, limit: 500 }),
    ]);
    setArea(results[0].status === "fulfilled" ? results[0].value : null);
    setPriceHistory(results[1].status === "fulfilled" ? results[1].value : null);
    setCoverage(results[2].status === "fulfilled" ? results[2].value : null);
    setInvestments(results[3].status === "fulfilled" ? results[3].value : null);
    const counts = results.slice(4).map((result) =>
      result.status === "fulfilled" && Array.isArray(result.value) ? result.value.length : null,
    );
    setInfrastructure({
      transport: counts[0],
      schools: counts[1],
      kindergartens: counts[2],
      amenities: counts[3],
      industrialZones: counts[4],
    });
    setFailed(results[0].status === "rejected");
    setHistoryFailed(results[1].status === "rejected");
    setLoading(false);
  }, [areaId, city, district]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <section className="panel area-evidence" aria-live="polite"><div className="panel-body">{copy.loading}</div></section>;
  if (failed) return <section className="panel area-evidence" role="alert"><div className="panel-body area-dynamic-status error">{copy.error} <button className="button" onClick={() => void load()}><RefreshCw size={14} /> {copy.retry}</button></div></section>;

  const sampleSize = area
    ? area.data_provenance.sample_size ?? (area.transaction_observation_count || area.active_listings)
    : null;

  return <section className="panel area-evidence">
    <div className="panel-header"><h2>{copy.title}</h2><span className="status-pill info">{area ? copy.verified : copy.unknown}</span></div>
    <div className="panel-body">
      <EvidenceMeta coverage={coverage} area={area} />
      <ProvenanceDetails
        locale={locale}
        provenance={{
          sourceName: area?.data_provenance.source_name ?? coverage?.source_name,
          sourceType: area?.data_provenance.source_type,
          updatedAt: area?.data_provenance.updated_at ?? coverage?.checked_at,
          sampleSize,
          scope: area?.data_provenance.geographic_scope ?? (area ? `${area.city}: ${area.name}` : null),
          timeRange: area?.data_provenance.time_range,
          calculationType: area?.data_provenance.calculation_type,
          mode: area?.data_provenance.mode,
        }}
      />
      {area ? <MarketEvidence area={area} locale={locale} /> : null}
      {area?.price_basis === "transaction_observed" ? (
        <AreaPriceHistoryChart
          history={priceHistory}
          locale={locale}
          onRetry={() => void load()}
          unavailable={historyFailed}
        />
      ) : null}
      {infrastructure ? (
        <div className="area-evidence-section">
          <h3>{copy.infrastructure}</h3>
          <div className="area-evidence-counts">
            <span>{infrastructure.transport ?? copy.unknown} {copy.transport}</span>
            <span>{infrastructure.schools ?? copy.unknown} {copy.schools}</span>
            <span>{infrastructure.kindergartens ?? copy.unknown} {copy.kindergartens}</span>
            <span>{infrastructure.amenities ?? copy.unknown} {copy.amenities}</span>
            <span>{infrastructure.industrialZones ?? copy.unknown} {copy.industrialZones}</span>
          </div>
          <small>{copy.referenceNote}</small>
        </div>
      ) : null}
      <div className="area-evidence-section">
        <h3>{copy.investments}</h3>
        {investments === null ? <p>{copy.unknown}</p> : investments.length ? (
          <ul className="section-list compact">
            {investments.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>{item.expected_year ? ` · ${item.expected_year}` : ""}
                <small>{item.notes?.toLowerCase().includes("demo") ? copy.demo : <>{copy.source}: {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">{item.source_url} <ExternalLink size={12} /></a> : copy.noSource}</>}</small>
              </li>
            ))}
          </ul>
        ) : <p>{copy.empty}</p>}
      </div>
    </div>
  </section>;
}

function MarketEvidence({ area, locale }: { area: AreaStatistics; locale: keyof typeof COPY }) {
  const copy = COPY[locale];
  if (area.price_basis === "transaction_observed") {
    return (
      <div className="area-evidence-market">
        <h3>{copy.market}</h3>
        <div className="metric-grid">
          <div className="metric"><span>{copy.median}</span><strong>{money(area.median_price_per_m2, locale)}/m²</strong></div>
          <div className="metric"><span>{copy.average}</span><strong>{money(area.average_price_per_m2, locale)}/m²</strong></div>
          <div className="metric"><span>{copy.transactions}</span><strong>{numberValue(area.transaction_observation_count, locale)}</strong></div>
          <div className="metric"><span>{copy.period}</span><strong>{area.data_provenance.time_range ?? copy.unknown}</strong></div>
        </div>
        <p className="muted">{copy.listingUnavailable}</p>
      </div>
    );
  }
  return (
    <div className="area-evidence-market">
      <h3>{copy.market}</h3>
      <div className="metric-grid">
        <div className="metric"><span>{copy.median}</span><strong>{money(area.median_price_per_m2, locale)}/m²</strong></div>
        <div className="metric"><span>{copy.listings}</span><strong>{numberValue(area.active_listings, locale)}</strong></div>
        <div className="metric"><span>{copy.window}</span><strong>{percent(area.price_change_90d_pct, locale)}</strong></div>
        <div className="metric"><span>{copy.supply}</span><strong>{percent(area.supply_change_90d_pct, locale)}</strong></div>
        <div className="metric"><span>{copy.averageTime}</span><strong>{numberValue(area.average_days_on_market, locale)} {copy.days}</strong></div>
      </div>
    </div>
  );
}
