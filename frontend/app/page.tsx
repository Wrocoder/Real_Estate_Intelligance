"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, FileText, Heart, RefreshCw, Search } from "lucide-react";

import { ListingCard } from "@/components/ListingCard";
import { PropertyMap } from "@/components/PropertyMap";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type AreaStatistics,
  type ListingAnalysis,
  type MapFeatureCollection,
  type MapQuery,
} from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";

type Filters = {
  district: string;
  rooms: string;
  maxPrice: string;
  minInvestment: string;
  radiusKm: string;
};

const WROCLAW_CENTER = { lat: 51.1079, lon: 17.0385 };

export default function ExplorerPage() {
  const [analyses, setAnalyses] = useState<ListingAnalysis[]>([]);
  const [areas, setAreas] = useState<AreaStatistics[]>([]);
  const [mapData, setMapData] = useState<MapFeatureCollection | null>(null);
  const [filters, setFilters] = useState<Filters>({
    district: "",
    rooms: "",
    maxPrice: "",
    minInvestment: "",
    radiusKm: "",
  });
  const [status, setStatus] = useState("Загрузка аналитики...");
  const [mapStatus, setMapStatus] = useState("Загрузка GIS-слоев...");
  const [mapError, setMapError] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setStatus("Загрузка аналитики...");
    try {
      const [listings, areaStats] = await Promise.all([api.listListings(), api.listAreas()]);
      const listingAnalyses = await Promise.all(
        listings.map((listing) => api.getAnalysis(listing.id)),
      );
      setAnalyses(listingAnalyses);
      setAreas(areaStats);
      setStatus(`Загружено объектов: ${listingAnalyses.length}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "unknown error";
      setError(message);
      setStatus("Backend API недоступен");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const mapQuery = useMemo<MapQuery>(() => {
    const radiusKm = filters.radiusKm ? Number(filters.radiusKm) : undefined;
    return {
      city: "Wrocław",
      district: filters.district || undefined,
      rooms: filters.rooms ? Number(filters.rooms) : undefined,
      max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      min_investment_score: filters.minInvestment ? Number(filters.minInvestment) : undefined,
      lat: radiusKm ? WROCLAW_CENTER.lat : undefined,
      lon: radiusKm ? WROCLAW_CENTER.lon : undefined,
      radius_km: radiusKm,
    };
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      setMapError("");
      setMapStatus("Обновление GIS-слоев...");
      try {
        const data = await api.getMapFeatures(mapQuery);
        if (cancelled) return;
        setMapData(data);
        setMapStatus(
          `${data.metadata.listing_count ?? 0} объектов · ${
            data.metadata.planned_investment_count ?? 0
          } planned investments`,
        );
      } catch (caught) {
        if (cancelled) return;
        setMapError(caught instanceof Error ? caught.message : "unknown error");
        setMapStatus("GIS API недоступен");
      }
    }

    void loadMap();
    return () => {
      cancelled = true;
    };
  }, [mapQuery]);

  const filtered = useMemo(() => {
    return analyses.filter((item) => {
      const listing = item.listing;
      if (filters.district && listing.district !== filters.district) return false;
      if (filters.rooms && listing.rooms !== Number(filters.rooms)) return false;
      if (filters.maxPrice && listing.price > Number(filters.maxPrice)) return false;
      if (
        filters.radiusKm &&
        distanceKm(WROCLAW_CENTER.lat, WROCLAW_CENTER.lon, listing.lat, listing.lon) >
          Number(filters.radiusKm)
      ) {
        return false;
      }
      if (
        filters.minInvestment &&
        item.scores.investment_score < Number(filters.minInvestment)
      ) {
        return false;
      }
      return true;
    });
  }, [analyses, filters]);

  const districts = Array.from(new Set(analyses.map((item) => item.listing.district)));
  const best = filtered[0];
  const medianArea = areas[0];

  async function addFavorite(listingId: string) {
    await api.addFavorite(listingId, "Dodane z panelu wyszukiwania");
    setStatus("Добавлено в избранное");
  }

  async function generateReport(listingId: string) {
    const report = await api.generateReport(listingId);
    setStatus(`Отчет сохранен: ${report.id}`);
  }

  async function createAlert() {
    await api.createAlert({
      name: "Saved search from explorer",
      filters: {
        city: "Wrocław",
        district: filters.district || null,
        rooms: filters.rooms ? Number(filters.rooms) : null,
        max_price: filters.maxPrice ? Number(filters.maxPrice) : null,
        min_investment_score: filters.minInvestment ? Number(filters.minInvestment) : null,
      },
    });
    setStatus("Alert создан");
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Подбор недвижимости Wrocław</h1>
          <p>Поиск, карта, скоринг, история цены и быстрые действия для MVP-аналитики.</p>
        </div>
        <div className="toolbar">
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Обновить
          </button>
          <button className="button primary" type="button" onClick={() => void createAlert()}>
            <Bell size={16} /> Alert
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Объектов в подборе</span>
          <strong>{numberValue(filtered.length)}</strong>
        </div>
        <div className="metric">
          <span>Лучший Investment Score</span>
          <strong>{best ? `${best.scores.investment_score}/100` : "-"}</strong>
        </div>
        <div className="metric">
          <span>Медиана района</span>
          <strong>{medianArea ? `${money(medianArea.median_price_per_m2)}/m2` : "-"}</strong>
        </div>
        <div className="metric">
          <span>Динамика цены 90 дней</span>
          <strong>{medianArea ? percent(medianArea.price_change_90d_pct) : "-"}</strong>
        </div>
      </section>

      <div className="panel" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Фильтры</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <label className="field">
            <span>Район</span>
            <select
              className="select"
              value={filters.district}
              onChange={(event) => setFilters({ ...filters, district: event.target.value })}
            >
              <option value="">Все районы</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Комнаты</span>
            <select
              className="select"
              value={filters.rooms}
              onChange={(event) => setFilters({ ...filters, rooms: event.target.value })}
            >
              <option value="">Любое</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
          <label className="field">
            <span>Макс. цена</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxPrice}
              placeholder="700000"
              onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Investment</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minInvestment}
              placeholder="60"
              onChange={(event) => setFilters({ ...filters, minInvestment: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Радиус от центра</span>
            <select
              className="select"
              value={filters.radiusKm}
              onChange={(event) => setFilters({ ...filters, radiusKm: event.target.value })}
            >
              <option value="">Весь Wrocław MVP</option>
              <option value="5">5 км</option>
              <option value="8">8 км</option>
              <option value="10">10 км</option>
              <option value="15">15 км</option>
            </select>
          </label>
          <button
            className="button"
            type="button"
            onClick={() =>
              setFilters({
                district: "",
                rooms: "",
                maxPrice: "",
                minInvestment: "",
                radiusKm: "",
              })
            }
          >
            <Search size={16} /> Сброс
          </button>
        </div>
      </div>

      {error ? (
        <ErrorBlock message={error} />
      ) : analyses.length === 0 ? (
        <LoadingBlock />
      ) : (
        <div className="grid-2">
          <section className="listing-list">
            {filtered.length === 0 ? (
              <EmptyBlock label="Нет объектов под выбранные фильтры." />
            ) : (
              filtered.map((analysis) => (
                <ListingCard
                  key={analysis.listing.id}
                  analysis={analysis}
                  onFavorite={(listingId) => void addFavorite(listingId)}
                  onReport={(listingId) => void generateReport(listingId)}
                />
              ))
            )}
          </section>

          <aside className="panel">
            <div className="panel-header">
              <h2>Карта и GIS-слои</h2>
              <span className="muted">{mapStatus}</span>
            </div>
            <PropertyMap
              collection={mapData}
              isLoading={!mapData && !mapError}
              error={mapError}
            />
            <div className="panel-body">
              <div className="toolbar">
                <a className="button" href="/reports">
                  <FileText size={16} /> Отчеты
                </a>
                <a className="button" href="/alerts">
                  <Bell size={16} /> Alerts
                </a>
                <button className="button" type="button" onClick={() => void addFavorite("wr-001")}>
                  <Heart size={16} /> Favorite
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function distanceKm(latA: number, lonA: number, latB: number, lonB: number) {
  const radius = 6371;
  const deltaLat = toRadians(latB - latA);
  const deltaLon = toRadians(lonB - lonA);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
