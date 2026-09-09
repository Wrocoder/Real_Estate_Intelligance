"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import { DistributionBarChart } from "@/components/Charts";
import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { api, type MarketDashboard, type MarketDistributionBucket } from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type MarketCopy = {
  loading: string;
  ready: string;
  unavailable: string;
  error: string;
  retry: string;
  title: string;
  intro: string;
  refresh: string;
  filter: string;
  city: string;
  district: string;
  allDistricts: string;
  action: string;
  calculate: string;
  offers: string;
  medianPrice: string;
  medianSqm: string;
  averageDays: string;
  new30: string;
  removed30: string;
  price90: string;
  supply90: string;
  apartmentPrice: string;
  sqmPrice: string;
  rooms: string;
  area: string;
  districtComparison: string;
  areas: string;
  active: string;
  liquidity: string;
  buyerMarket: string;
  sellerMarket: string;
  overheating: string;
  noAreas: string;
  noDistribution: string;
  distribution: string;
};

const COPY: Record<Locale, MarketCopy> = {
  pl: {
    loading: "Ładowanie danych rynku",
    ready: "Gotowe",
    unavailable: "Dane rynku są chwilowo niedostępne",
    error: "Błąd",
    retry: "Spróbuj ponownie",
    title: "Rynek nieruchomości",
    intro: "Ceny, czas ekspozycji, podaż i porównanie dzielnic w jednym widoku.",
    refresh: "Odśwież",
    filter: "Filtr rynku",
    city: "Miasto",
    district: "Dzielnica",
    allDistricts: "Wszystkie dzielnice",
    action: "Akcja",
    calculate: "Przelicz",
    offers: "Oferty",
    medianPrice: "Mediana ceny",
    medianSqm: "Mediana PLN/m2",
    averageDays: "Śr. dni na rynku",
    new30: "Nowe 30 dni",
    removed30: "Zdjęte 30 dni",
    price90: "Cena 90 dni",
    supply90: "Podaż 90 dni",
    apartmentPrice: "Cena mieszkania",
    sqmPrice: "Cena za m2",
    rooms: "Pokoje",
    area: "Powierzchnia",
    districtComparison: "Porównanie dzielnic",
    areas: "obsz.",
    active: "Aktywne",
    liquidity: "Płynność",
    buyerMarket: "Rynek kupującego",
    sellerMarket: "Rynek sprzedającego",
    overheating: "Ryzyko przegrzania",
    noAreas: "Brak statystyk dzielnic dla wybranego filtra.",
    noDistribution: "Brak danych dla tego rozkładu.",
    distribution: "rozkład",
  },
  en: {
    loading: "Loading market data",
    ready: "Ready",
    unavailable: "Market data is temporarily unavailable",
    error: "Error",
    retry: "Try again",
    title: "Property market",
    intro: "Prices, exposure time, supply and district comparison in one view.",
    refresh: "Refresh",
    filter: "Market filter",
    city: "City",
    district: "District",
    allDistricts: "All districts",
    action: "Action",
    calculate: "Calculate",
    offers: "Listings",
    medianPrice: "Median price",
    medianSqm: "Median PLN/m2",
    averageDays: "Avg. days on market",
    new30: "New in 30 days",
    removed30: "Removed in 30 days",
    price90: "Price over 90 days",
    supply90: "Supply over 90 days",
    apartmentPrice: "Apartment price",
    sqmPrice: "Price per m2",
    rooms: "Rooms",
    area: "Area",
    districtComparison: "District comparison",
    areas: "areas",
    active: "Active",
    liquidity: "Liquidity",
    buyerMarket: "Buyer market",
    sellerMarket: "Seller market",
    overheating: "Overheating risk",
    noAreas: "No district statistics for this filter.",
    noDistribution: "No data for this distribution.",
    distribution: "distribution",
  },
  ru: {
    loading: "Загрузка данных рынка",
    ready: "Готово",
    unavailable: "Данные рынка временно недоступны",
    error: "Ошибка",
    retry: "Повторить",
    title: "Рынок недвижимости",
    intro: "Цены, срок экспозиции, предложение и сравнение районов.",
    refresh: "Обновить",
    filter: "Фильтр рынка",
    city: "Город",
    district: "Район",
    allDistricts: "Все районы",
    action: "Действие",
    calculate: "Рассчитать",
    offers: "Объявления",
    medianPrice: "Медианная цена",
    medianSqm: "Медиана PLN/м2",
    averageDays: "Средний срок",
    new30: "Новые за 30 дней",
    removed30: "Снятые за 30 дней",
    price90: "Цена за 90 дней",
    supply90: "Предложение за 90 дней",
    apartmentPrice: "Цена квартиры",
    sqmPrice: "Цена за м2",
    rooms: "Комнаты",
    area: "Площадь",
    districtComparison: "Сравнение районов",
    areas: "районов",
    active: "Активные",
    liquidity: "Ликвидность",
    buyerMarket: "Рынок покупателя",
    sellerMarket: "Рынок продавца",
    overheating: "Риск перегрева",
    noAreas: "Для выбранного фильтра нет статистики районов.",
    noDistribution: "Для этого распределения нет данных.",
    distribution: "распределение",
  },
  uk: {
    loading: "Завантаження даних ринку",
    ready: "Готово",
    unavailable: "Дані ринку тимчасово недоступні",
    error: "Помилка",
    retry: "Повторити",
    title: "Ринок нерухомості",
    intro: "Ціни, строк експозиції, пропозиція та порівняння районів.",
    refresh: "Оновити",
    filter: "Фільтр ринку",
    city: "Місто",
    district: "Район",
    allDistricts: "Усі райони",
    action: "Дія",
    calculate: "Розрахувати",
    offers: "Оголошення",
    medianPrice: "Медіанна ціна",
    medianSqm: "Медіана PLN/м2",
    averageDays: "Середній строк",
    new30: "Нові за 30 днів",
    removed30: "Зняті за 30 днів",
    price90: "Ціна за 90 днів",
    supply90: "Пропозиція за 90 днів",
    apartmentPrice: "Ціна квартири",
    sqmPrice: "Ціна за м2",
    rooms: "Кімнати",
    area: "Площа",
    districtComparison: "Порівняння районів",
    areas: "районів",
    active: "Активні",
    liquidity: "Ліквідність",
    buyerMarket: "Ринок покупця",
    sellerMarket: "Ринок продавця",
    overheating: "Ризик перегріву",
    noAreas: "Для вибраного фільтра немає статистики районів.",
    noDistribution: "Для цього розподілу немає даних.",
    distribution: "розподіл",
  },
};

export default function MarketDashboardPage() {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const [city, setCity] = useState("Wrocław");
  const [district, setDistrict] = useState("");
  const [dashboard, setDashboard] = useState<MarketDashboard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setStatus("loading");
    try {
      const payload = await api.getMarketDashboard({
        city: city || undefined,
        district: district || undefined,
      });
      setDashboard(payload);
      setStatus("ready");
    } catch (caught) {
      setError(localizedError(caught, locale));
      setStatus("unavailable");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const districtOptions = useMemo(() => {
    const names = dashboard?.areas.map((area) => area.name) ?? [];
    if (district && !names.includes(district)) return [district, ...names];
    return names;
  }, [dashboard, district]);

  if (error)
    return <ErrorBlock message={error} prefix={copy.error} onRetry={() => void load()} retryLabel={copy.retry} />;
  if (!dashboard) return <LoadingBlock label={copy.loading} />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <button className="button primary" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> {copy.refresh}
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{copy.filter}</h2>
          <span className="status-line">{copy[status]}</span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>{copy.city}</span>
              <input className="input" value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
            <label className="field">
              <span>{copy.district}</span>
              <select className="select" value={district} onChange={(event) => setDistrict(event.target.value)}>
                <option value="">{copy.allDistricts}</option>
                {districtOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>{copy.action}</span>
              <button className="button" type="button" onClick={() => void load()}>
                <BarChart3 size={16} /> {copy.calculate}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid" style={{ marginTop: 16 }}>
        <Metric label={copy.offers} value={numberValue(dashboard.listings_count, locale)} />
        <Metric label={copy.medianPrice} value={formatNullableMoney(dashboard.median_price, locale)} />
        <Metric label={copy.medianSqm} value={formatNullableMoney(dashboard.median_price_per_m2, locale)} />
        <Metric label={copy.averageDays} value={`${dashboard.average_days_on_market} d`} />
        <Metric label={copy.new30} value={numberValue(dashboard.new_listings_30d, locale)} />
        <Metric label={copy.removed30} value={numberValue(dashboard.removed_listings_30d, locale)} />
        <Metric label={copy.price90} value={formatNullablePercent(dashboard.price_change_90d_pct, locale)} />
        <Metric label={copy.supply90} value={formatNullablePercent(dashboard.supply_change_90d_pct, locale)} />
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <DistributionPanel title={copy.apartmentPrice} buckets={dashboard.price_distribution} copy={copy} />
        <DistributionPanel title={copy.sqmPrice} buckets={dashboard.price_per_m2_distribution} copy={copy} />
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <DistributionPanel title={copy.rooms} buckets={dashboard.rooms_distribution} copy={copy} />
        <DistributionPanel title={copy.area} buckets={dashboard.area_distribution} copy={copy} />
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{copy.districtComparison}</h2>
          <span className="muted">
            {dashboard.areas.length} {copy.areas}
          </span>
        </div>
        <div className="panel-body">
          {dashboard.areas.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>{copy.district}</th>
                  <th>{copy.medianSqm}</th>
                  <th>{copy.active}</th>
                  <th>DOM</th>
                  <th>{copy.price90}</th>
                  <th>{copy.liquidity}</th>
                  <th>{copy.buyerMarket}</th>
                  <th>{copy.sellerMarket}</th>
                  <th>{copy.overheating}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.areas.map((area) => (
                  <tr key={area.area_id}>
                    <td>
                      <strong>{area.name}</strong>
                      <small>{area.city}</small>
                    </td>
                    <td>{money(area.median_price_per_m2, locale)}</td>
                    <td>{numberValue(area.active_listings, locale)}</td>
                    <td>{area.average_days_on_market} d</td>
                    <td>{percent(area.price_change_90d_pct, locale)}</td>
                    <td>{area.liquidity_index}/100</td>
                    <td>{area.buyer_market_index}/100</td>
                    <td>{area.seller_market_index}/100</td>
                    <td>{area.overheated_index}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">{copy.noAreas}</div>
          )}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DistributionPanel({
  title,
  buckets,
  copy,
}: {
  title: string;
  buckets: MarketDistributionBucket[];
  copy: MarketCopy;
}) {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="panel-body">
        {buckets.length > 0 ? (
          <div className="distribution-panel-body">
            <DistributionBarChart ariaLabel={`${title} ${copy.distribution}`} buckets={buckets} />
            <div className="bar-list compact">
              {buckets.map((bucket) => (
                <div className="bar-row" key={bucket.label}>
                  <span>{bucket.label}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.max((bucket.count / maxCount) * 100, 2)}%`,
                      }}
                    />
                  </div>
                  <strong>{bucket.count}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">{copy.noDistribution}</div>
        )}
      </div>
    </section>
  );
}

function formatNullableMoney(value: number | null, locale: Locale) {
  return value === null ? "—" : money(value, locale);
}

function formatNullablePercent(value: number | null, locale: Locale) {
  return value === null ? "—" : percent(value, locale);
}
