"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import {
  AreaDecisionGuide,
  type AreaInfrastructureCounts,
} from "@/components/AreaDecisionGuide";
import { AreaPriceHistoryChart } from "@/components/AreaPriceHistoryChart";
import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import { api, type AreaPriceHistory, type AreaStatistics, type CoverageMetadata, type PlannedInvestment } from "@/lib/api";
import { dateValue, money, numberValue, percent } from "@/lib/format";
import { useLocalePreference } from "@/lib/useLocalePreference";

type InfrastructureSummary = AreaInfrastructureCounts & {
  sourceNames: string[];
  sourceUrls: string[];
  updatedAt: string | null;
};

type InfrastructureReference = {
  source_url: string | null;
  metadata: Record<string, unknown>;
};

type PlannedImpactCategory = "improvement" | "mixed" | "supply" | "unclear";

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
    noRecords: "brak rekordów",
    unavailable: "źródło niedostępne",
    recordLimit: (count: number) => `${count}+ rekordów`,
    infrastructureScope: "Zakres: rekordy źródłowe przypisane do tego osiedla.",
    infrastructureSources: "Źródła infrastruktury",
    infrastructureUpdated: "Aktualizacja źródła",
    infrastructureUpdateUnknown: "Data aktualizacji źródła niepodana",
    investmentScope: "Przypisanie do osiedla nie potwierdza odległości projektu od konkretnego adresu.",
    investmentConfidence: "Pewność źródła",
    investmentImpact: {
      improvement: "Możliwa poprawa użyteczności osiedla",
      mixed: "Możliwa poprawa i utrudnienia w czasie budowy",
      supply: "Możliwa presja nowej podaży",
      unclear: "Wpływ wymaga osobnej weryfikacji",
    },
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
    noRecords: "no records",
    unavailable: "source unavailable",
    recordLimit: (count: number) => `${count}+ records`,
    infrastructureScope: "Scope: source records assigned to this neighborhood.",
    infrastructureSources: "Infrastructure sources",
    infrastructureUpdated: "Source updated",
    infrastructureUpdateUnknown: "Source update date not supplied",
    investmentScope: "Neighborhood assignment does not prove a project's distance from a specific address.",
    investmentConfidence: "Source confidence",
    investmentImpact: {
      improvement: "Potential improvement to neighborhood utility",
      mixed: "Potential improvement and construction disruption",
      supply: "Possible new-supply pressure",
      unclear: "Impact requires separate verification",
    },
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
    noRecords: "нет записей",
    unavailable: "источник недоступен",
    recordLimit: (count: number) => `${count}+ записей`,
    infrastructureScope: "Охват: исходные записи, привязанные к этому району.",
    infrastructureSources: "Источники инфраструктуры",
    infrastructureUpdated: "Обновление источника",
    infrastructureUpdateUnknown: "Дата обновления источника не указана",
    investmentScope: "Привязка к району не подтверждает расстояние от проекта до конкретного адреса.",
    investmentConfidence: "Надёжность источника",
    investmentImpact: {
      improvement: "Возможное улучшение инфраструктуры района",
      mixed: "Возможное улучшение и неудобства во время строительства",
      supply: "Возможное давление нового предложения",
      unclear: "Влияние требует отдельной проверки",
    },
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
    noRecords: "немає записів",
    unavailable: "джерело недоступне",
    recordLimit: (count: number) => `${count}+ записів`,
    infrastructureScope: "Охоплення: вихідні записи, прив'язані до цього району.",
    infrastructureSources: "Джерела інфраструктури",
    infrastructureUpdated: "Оновлення джерела",
    infrastructureUpdateUnknown: "Дату оновлення джерела не вказано",
    investmentScope: "Прив'язка до району не підтверджує відстань від проєкту до конкретної адреси.",
    investmentConfidence: "Надійність джерела",
    investmentImpact: {
      improvement: "Можливе покращення інфраструктури району",
      mixed: "Можливе покращення і незручності під час будівництва",
      supply: "Можливий тиск нової пропозиції",
      unclear: "Вплив потребує окремої перевірки",
    },
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
  const [alternatives, setAlternatives] = useState<AreaStatistics[] | null>(null);
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
      api.listAreas(),
    ]);
    setArea(results[0].status === "fulfilled" ? results[0].value : null);
    setPriceHistory(results[1].status === "fulfilled" ? results[1].value : null);
    setCoverage(results[2].status === "fulfilled" ? results[2].value : null);
    setInvestments(results[3].status === "fulfilled" ? results[3].value : null);
    const infrastructureResults = results.slice(4, 9);
    const counts = infrastructureResults.map((result) =>
      result.status === "fulfilled" && Array.isArray(result.value) ? result.value.length : null,
    );
    const references = infrastructureResults.flatMap((result) =>
      result.status === "fulfilled" && Array.isArray(result.value)
        ? (result.value as InfrastructureReference[])
        : [],
    );
    const sourceNames = references
      .map((item) => item.metadata.source_name)
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    const sourceUrls = references
      .map((item) => item.source_url)
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    const updateDates = references
      .map((item) => item.metadata.source_updated_at)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .sort();
    setInfrastructure({
      transport: counts[0],
      schools: counts[1],
      kindergartens: counts[2],
      amenities: counts[3],
      industrialZones: counts[4],
      sourceNames: [...new Set(sourceNames)],
      sourceUrls: [...new Set(sourceUrls)],
      updatedAt: updateDates.at(-1) ?? null,
    });
    setAlternatives(
      results[9].status === "fulfilled" && Array.isArray(results[9].value)
        ? results[9].value
        : null,
    );
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

  return <>
    {area && infrastructure ? (
      <AreaDecisionGuide
        alternatives={alternatives}
        area={area}
        infrastructure={infrastructure}
        investments={investments}
        locale={locale}
      />
    ) : null}
    <section className="panel area-evidence">
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
              <InfrastructureCount copy={copy} label={copy.transport} value={infrastructure.transport} />
              <InfrastructureCount copy={copy} label={copy.schools} value={infrastructure.schools} />
              <InfrastructureCount copy={copy} label={copy.kindergartens} value={infrastructure.kindergartens} />
              <InfrastructureCount copy={copy} label={copy.amenities} value={infrastructure.amenities} />
              <InfrastructureCount copy={copy} label={copy.industrialZones} value={infrastructure.industrialZones} />
            </div>
            <small>{copy.referenceNote}</small>
            <small>{copy.infrastructureScope}</small>
            <div className="area-infrastructure-provenance">
              <strong>{copy.infrastructureSources}</strong>
              {infrastructure.sourceNames.length ? <span>{infrastructure.sourceNames.join(", ")}</span> : null}
              {infrastructure.sourceUrls.length ? (
                <span>
                  {uniqueSourceUrls(infrastructure.sourceUrls).slice(0, 3).map((url) => (
                    <a href={url} key={url} rel="noreferrer" target="_blank">
                      {sourceHost(url)} <ExternalLink size={12} />
                    </a>
                  ))}
                </span>
              ) : <span>{copy.noSource}</span>}
              <span>
                {infrastructure.updatedAt
                  ? `${copy.infrastructureUpdated}: ${dateValue(infrastructure.updatedAt, locale)}`
                  : copy.infrastructureUpdateUnknown}
              </span>
            </div>
          </div>
        ) : null}
        <div className="area-evidence-section">
          <h3>{copy.investments}</h3>
          <small>{copy.investmentScope}</small>
          {investments === null ? <p>{copy.unknown}</p> : investments.length ? (
            <ul className="section-list compact area-investment-list">
              {investments.map((item) => {
                const category = plannedImpactCategory(item);
                return (
                  <li key={item.id}>
                    <div className="area-investment-heading">
                      <strong>{item.name}</strong>
                      <span className={`status-pill ${plannedImpactTone(category)}`}>
                        {copy.investmentImpact[category]}
                      </span>
                    </div>
                    <span>{item.status}{item.expected_year ? ` · ${item.expected_year}` : ""}</span>
                    <small>{copy.investmentConfidence}: {item.confidence_score}/100</small>
                    <small>{item.notes?.toLowerCase().includes("demo") ? copy.demo : <>{copy.source}: {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">{sourceHost(item.source_url)} <ExternalLink size={12} /></a> : copy.noSource}</>}</small>
                  </li>
                );
              })}
            </ul>
          ) : <p>{copy.empty}</p>}
        </div>
      </div>
    </section>
  </>;
}

function InfrastructureCount({
  copy,
  label,
  value,
}: {
  copy: typeof COPY[keyof typeof COPY];
  label: string;
  value: number | null;
}) {
  const count = value === null
    ? copy.unavailable
    : value === 0
      ? copy.noRecords
      : value >= 500
        ? copy.recordLimit(value)
        : String(value);
  return <span><b>{label}</b>{count}</span>;
}

function plannedImpactCategory(item: PlannedInvestment): PlannedImpactCategory {
  const text = `${item.name} ${item.investment_type}`.toLocaleLowerCase("pl-PL");
  const supply = ["housing", "residential", "apartment", "estate", "mieszkan"].some(
    (token) => text.includes(token),
  );
  if (supply) return "supply";
  const improvement = [
    "tram",
    "bus",
    "transport",
    "tat",
    "school",
    "kindergarten",
    "park",
    "green",
    "healthcare",
    "road",
  ].some((token) => text.includes(token));
  if (!improvement) return "unclear";
  const completed = ["completed", "complete", "finished", "zakończ"].some((token) =>
    item.status.toLocaleLowerCase("pl-PL").includes(token),
  );
  return completed ? "improvement" : "mixed";
}

function plannedImpactTone(category: PlannedImpactCategory) {
  if (category === "improvement") return "healthy";
  if (category === "mixed") return "warning";
  if (category === "supply") return "failed";
  return "info";
}

function sourceHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function uniqueSourceUrls(urls: string[]) {
  return urls.filter(
    (url, index) => urls.findIndex((candidate) => sourceHost(candidate) === sourceHost(url)) === index,
  );
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
