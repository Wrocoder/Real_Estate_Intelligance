"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import { DistributionBarChart } from "@/components/Charts";
import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { api, type MarketDashboard, type MarketDistributionBucket } from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";

export default function MarketDashboardPage() {
  const [city, setCity] = useState("Wrocław");
  const [district, setDistrict] = useState("");
  const [dashboard, setDashboard] = useState<MarketDashboard | null>(null);
  const [status, setStatus] = useState("Ładowanie danych rynku...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setStatus("Ładowanie danych rynku...");
    try {
      const payload = await api.getMarketDashboard({
        city: city || undefined,
        district: district || undefined,
      });
      setDashboard(payload);
      setStatus("Gotowe");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się pobrać danych rynku");
      setStatus("Dane rynku są chwilowo niedostępne");
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

  if (error) return <ErrorBlock message={error} />;
  if (!dashboard) return <LoadingBlock label="Ładowanie danych rynku" />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Rynek nieruchomości</h1>
          <p>Ceny, czas ekspozycji, podaż i porównanie dzielnic w jednym widoku.</p>
        </div>
        <button className="button primary" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> Odśwież
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Filtr rynku</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>Miasto</span>
              <input className="input" value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
            <label className="field">
              <span>Dzielnica</span>
              <select
                className="select"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
              >
                <option value="">Wszystkie dzielnice</option>
                {districtOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Akcja</span>
              <button className="button" type="button" onClick={() => void load()}>
                <BarChart3 size={16} /> Przelicz
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid" style={{ marginTop: 16 }}>
        <Metric label="Oferty" value={numberValue(dashboard.listings_count)} />
        <Metric label="Mediana ceny" value={formatNullableMoney(dashboard.median_price)} />
        <Metric label="Mediana PLN/m2" value={formatNullableMoney(dashboard.median_price_per_m2)} />
        <Metric label="Śr. dni na rynku" value={`${dashboard.average_days_on_market} d`} />
        <Metric label="Nowe 30 dni" value={numberValue(dashboard.new_listings_30d)} />
        <Metric label="Zdjęte 30 dni" value={numberValue(dashboard.removed_listings_30d)} />
        <Metric label="Cena 90 dni" value={formatNullablePercent(dashboard.price_change_90d_pct)} />
        <Metric label="Podaż 90 dni" value={formatNullablePercent(dashboard.supply_change_90d_pct)} />
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <DistributionPanel title="Cena mieszkania" buckets={dashboard.price_distribution} />
        <DistributionPanel title="Cena za m2" buckets={dashboard.price_per_m2_distribution} />
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <DistributionPanel title="Pokoje" buckets={dashboard.rooms_distribution} />
        <DistributionPanel title="Powierzchnia" buckets={dashboard.area_distribution} />
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Porównanie dzielnic</h2>
          <span className="muted">{dashboard.areas.length} obsz.</span>
        </div>
        <div className="panel-body">
          {dashboard.areas.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Dzielnica</th>
                  <th>Mediana m2</th>
                  <th>Aktywne</th>
                  <th>DOM</th>
                  <th>Cena 90 dni</th>
                  <th>Płynność</th>
                  <th>Rynek kupującego</th>
                  <th>Rynek sprzedającego</th>
                  <th>Ryzyko przegrzania</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.areas.map((area) => (
                  <tr key={area.area_id}>
                    <td>
                      <strong>{area.name}</strong>
                      <small>{area.city}</small>
                    </td>
                    <td>{money(area.median_price_per_m2)}</td>
                    <td>{numberValue(area.active_listings)}</td>
                    <td>{area.average_days_on_market} d</td>
                    <td>{percent(area.price_change_90d_pct)}</td>
                    <td>{area.liquidity_index}/100</td>
                    <td>{area.buyer_market_index}/100</td>
                    <td>{area.seller_market_index}/100</td>
                    <td>{area.overheated_index}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">Brak statystyk dzielnic dla wybranego filtra.</div>
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
}: {
  title: string;
  buckets: MarketDistributionBucket[];
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
            <DistributionBarChart ariaLabel={`${title} distribution`} buckets={buckets} />
            <div className="bar-list compact">
              {buckets.map((bucket) => (
                <div className="bar-row" key={bucket.label}>
                  <span>{bucket.label}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max((bucket.count / maxCount) * 100, 2)}%` }}
                    />
                  </div>
                  <strong>{bucket.count}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">Brak danych dla tego rozkładu.</div>
        )}
      </div>
    </section>
  );
}

function formatNullableMoney(value: number | null) {
  return value === null ? "—" : money(value);
}

function formatNullablePercent(value: number | null) {
  return value === null ? "—" : percent(value);
}
