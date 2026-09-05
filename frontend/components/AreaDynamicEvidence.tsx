"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import { api, type AreaStatistics, type CoverageMetadata, type PlannedInvestment } from "@/lib/api";
import { dateValue, money, numberValue, percent } from "@/lib/format";
import { useLocalePreference } from "@/lib/useLocalePreference";

type InfrastructureSummary = {
  transport: number;
  schools: number;
  kindergartens: number;
  amenities: number;
  industrialZones: number;
};

const COPY = {
  pl: {
    title: "Dane sprawdzalne dla tej dzielnicy",
    market: "Rynek mieszkaniowy",
    infrastructure: "Infrastruktura w bazie",
    investments: "Planowane inwestycje",
    source: "Źródło",
    checked: "Sprawdzono",
    scope: "Zakres",
    verified: "Źródło danych",
    days: "dni",
    listings: "aktywnych ogłoszeń",
    transport: "przystanki",
    schools: "szkoły",
    kindergartens: "przedszkola",
    amenities: "udogodnienia",
    industrialZones: "strefy przemysłowe",
    empty: "Brak zweryfikowanych rekordów dla tej dzielnicy.",
    unknown: "Brak danych",
    loading: "Pobieramy aktualne dane dzielnicy...",
    error: "Nie udało się pobrać danych dzielnicy.",
    retry: "Spróbuj ponownie",
    demo: "Rekord demonstracyjny, nie jest potwierdzeniem miejskiej inwestycji.",
    noSource: "Źródło niepodane",
    window: "zmiana w 90 dni",
    supply: "podaż w 90 dni",
  },
  en: {
    title: "Verifiable data for this district", market: "Housing market", infrastructure: "Infrastructure in dataset", investments: "Planned investments", source: "Source", checked: "Checked", scope: "Scope", verified: "Data source", days: "days", listings: "active listings", transport: "transit stops", schools: "schools", kindergartens: "kindergartens", amenities: "amenities", industrialZones: "industrial zones", empty: "No verified records for this district.", unknown: "No data", loading: "Fetching current district data...", error: "District data could not be loaded.", retry: "Try again", demo: "Demo record; not confirmation of a municipal investment.", noSource: "Source not provided", window: "change in 90 days", supply: "supply in 90 days",
  },
  ru: {
    title: "Проверяемые данные по району", market: "Рынок жилья", infrastructure: "Инфраструктура в базе", investments: "Планируемые инвестиции", source: "Источник", checked: "Проверено", scope: "Охват", verified: "Источник данных", days: "дн.", listings: "активных объявлений", transport: "остановок", schools: "школ", kindergartens: "детских садов", amenities: "объектов сервиса", industrialZones: "промышленных зон", empty: "Проверенных записей по району нет.", unknown: "Нет данных", loading: "Загружаем текущие данные района...", error: "Не удалось загрузить данные района.", retry: "Повторить", demo: "Демонстрационная запись, не подтверждение городской инвестиции.", noSource: "Источник не указан", window: "изменение за 90 дней", supply: "изменение предложения за 90 дней",
  },
  uk: {
    title: "Перевірені дані району", market: "Ринок житла", infrastructure: "Інфраструктура в базі", investments: "Заплановані інвестиції", source: "Джерело", checked: "Перевірено", scope: "Охоплення", verified: "Джерело даних", days: "днів", listings: "активних оголошень", transport: "зупинок", schools: "шкіл", kindergartens: "дитсадків", amenities: "об'єктів сервісу", industrialZones: "промислових зон", empty: "Перевірених записів для району немає.", unknown: "Немає даних", loading: "Завантажуємо поточні дані району...", error: "Не вдалося завантажити дані району.", retry: "Повторити", demo: "Демонстраційний запис, не підтвердження міської інвестиції.", noSource: "Джерело не вказано", window: "зміна за 90 днів", supply: "зміна пропозиції за 90 днів",
  },
} as const;

function EvidenceMeta({ coverage, area }: { coverage: CoverageMetadata | null; area: AreaStatistics | null }) {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  return (
    <div className="area-evidence-meta">
      <span><b>{copy.source}</b> {coverage?.source_name ?? copy.unknown}</span>
      <span><b>{copy.checked}</b> {coverage ? dateValue(coverage.checked_at, locale) : copy.unknown}</span>
      <span><b>{copy.scope}</b> {area ? `${area.city}: ${area.name}` : copy.unknown}</span>
    </div>
  );
}

export function AreaDynamicMetrics({ areaId, fallback }: { areaId: string; fallback: AreaStatistics }) {
  const [area, setArea] = useState<AreaStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setLoading(true); setFailed(false);
    void api.getAreaStatistics(areaId).then(setArea).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, [areaId]);
  useEffect(load, [load]);
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const current = area ?? fallback;
  if (loading) return <div className="area-dynamic-status" aria-live="polite">{copy.loading}</div>;
  if (failed) return <div className="area-dynamic-status error" role="alert">{copy.error} <button className="button" onClick={load}><RefreshCw size={14} /> {copy.retry}</button></div>;
  return <>
    <div className="area-metrics">
      <span><small>Mediana</small><strong>{money(current.median_price_per_m2)}/m2</strong></span>
      <span><small>{copy.listings}</small><strong>{numberValue(current.active_listings)}</strong></span>
      <span><small>{copy.window}</small><strong>{percent(current.price_change_90d_pct)}</strong></span>
      <span><small>{copy.supply}</small><strong>{percent(current.supply_change_90d_pct)}</strong></span>
    </div>
    <ProvenanceDetails
      locale={locale}
      provenance={{
        sourceType: current.data_provenance.source_type,
        sampleSize: current.active_listings,
        scope: `${current.city}: ${current.name}`,
        timeRange: "90 days",
        calculationType: "calculated",
        mode: current.data_provenance.mode,
      }}
    />
  </>;
}

export function AreaDynamicEvidence({ areaId, city, district }: { areaId: string; city: string; district: string }) {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const [area, setArea] = useState<AreaStatistics | null>(null);
  const [coverage, setCoverage] = useState<CoverageMetadata | null>(null);
  const [investments, setInvestments] = useState<PlannedInvestment[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setFailed(false);
    const results = await Promise.allSettled([
      api.getAreaStatistics(areaId), api.getCoverage(), api.listPlannedInvestments({ city, district }),
      api.listTransportStops({ district_id: areaId, limit: 500 }), api.listSchools({ district_id: areaId, limit: 500 }),
      api.listKindergartens({ district_id: areaId, limit: 500 }), api.listAmenities({ district_id: areaId, limit: 500 }),
      api.listIndustrialZones({ district_id: areaId, limit: 500 }),
    ]);
    if (results[0].status === "fulfilled") setArea(results[0].value);
    if (results[1].status === "fulfilled") setCoverage(results[1].value);
    if (results[2].status === "fulfilled") setInvestments(results[2].value);
    const values = results.slice(3).map((result) =>
      result.status === "fulfilled" && Array.isArray(result.value) ? result.value.length : 0,
    );
    setInfrastructure({ transport: values[0], schools: values[1], kindergartens: values[2], amenities: values[3], industrialZones: values[4] });
    setFailed(results[0].status === "rejected" && results[1].status === "rejected");
    setLoading(false);
  }, [areaId, city, district]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <section className="panel area-evidence" aria-live="polite"><div className="panel-body">{copy.loading}</div></section>;
  if (failed) return <section className="panel area-evidence" role="alert"><div className="panel-body area-dynamic-status error">{copy.error} <button className="button" onClick={() => void load()}><RefreshCw size={14} /> {copy.retry}</button></div></section>;
  return <section className="panel area-evidence">
    <div className="panel-header"><h2>{copy.title}</h2><span className="status-pill info">{area ? copy.verified : copy.unknown}</span></div>
    <div className="panel-body">
      <EvidenceMeta coverage={coverage} area={area} />
      <ProvenanceDetails
        locale={locale}
        provenance={{
          sourceName: coverage?.source_name,
          sourceType: area?.data_provenance.source_type,
          updatedAt: coverage?.checked_at,
          sampleSize: area?.active_listings,
          scope: area ? `${area.city}: ${area.name}` : null,
          timeRange: area ? "90 days" : null,
          calculationType: area ? "calculated" : null,
          mode: area?.data_provenance.mode,
        }}
      />
      {area && <div className="area-evidence-market"><h3>{copy.market}</h3><div className="metric-grid"><div className="metric"><span>Mediana ceny</span><strong>{money(area.median_price_per_m2)}/m2</strong></div><div className="metric"><span>{copy.listings}</span><strong>{numberValue(area.active_listings)}</strong></div><div className="metric"><span>{copy.window}</span><strong>{percent(area.price_change_90d_pct)}</strong></div><div className="metric"><span>{copy.supply}</span><strong>{percent(area.supply_change_90d_pct)}</strong></div><div className="metric"><span>Średni czas</span><strong>{numberValue(area.average_days_on_market)} {copy.days}</strong></div></div></div>}
      {infrastructure && <div className="area-evidence-section"><h3>{copy.infrastructure}</h3><div className="area-evidence-counts"><span>{infrastructure.transport} {copy.transport}</span><span>{infrastructure.schools} {copy.schools}</span><span>{infrastructure.kindergartens} {copy.kindergartens}</span><span>{infrastructure.amenities} {copy.amenities}</span><span>{infrastructure.industrialZones} {copy.industrialZones}</span></div><small>{copy.source}: rekordy referencyjne z zakresem dzielnicy; brak rekordu nie oznacza braku obiektu w rzeczywistości.</small></div>}
      <div className="area-evidence-section"><h3>{copy.investments}</h3>{investments.length ? <ul className="section-list compact">{investments.map((item) => <li key={item.id}><strong>{item.name}</strong>{item.expected_year ? ` · ${item.expected_year}` : ""}<small>{item.notes?.toLowerCase().includes("demo") ? copy.demo : <>{copy.source}: {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">{item.source_url} <ExternalLink size={12} /></a> : copy.noSource}</>}</small></li>)}</ul> : <p>{copy.empty}</p>}</div>
    </div>
  </section>;
}
