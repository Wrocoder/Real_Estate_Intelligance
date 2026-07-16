"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Bell, FileText, Gem, Heart, RefreshCw, Search } from "lucide-react";

import { ListingCard } from "@/components/ListingCard";
import { PropertyMap } from "@/components/PropertyMap";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type AreaStatistics,
  type HiddenGemItem,
  type HiddenGemQuery,
  type ListingAnalysis,
  type ListingSearchQuery,
  type ListingSort,
  type MapFeatureCollection,
  type MapQuery,
} from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";

type Filters = {
  mode: "standard" | "hidden_gems";
  query: string;
  voivodeship: string;
  municipality: string;
  district: string;
  buildingType: string;
  renovationState: string;
  hasBalcony: boolean;
  hasTerrace: boolean;
  hasGarden: boolean;
  hasElevator: boolean;
  parkingType: string;
  heatingType: string;
  rooms: string;
  maxPrice: string;
  minFloor: string;
  maxFloor: string;
  maxBuildingFloors: string;
  minBuildingYear: string;
  maxBuildingYear: string;
  maxFairDelta: string;
  minInvestment: string;
  maxRisk: string;
  minNegotiation: string;
  minLiquidity: string;
  minRental: string;
  minDataQuality: string;
  minDeveloperReputation: string;
  minDeveloperConfidence: string;
  minDeveloperCompleted: string;
  minDeveloperActive: string;
  requireDeveloper: boolean;
  excludeDeveloperRisk: boolean;
  maxCenterKm: string;
  maxStopM: string;
  maxSchoolM: string;
  minMajorRoadM: string;
  minIndustrialZoneM: string;
  radiusKm: string;
  sort: ListingSort;
  pageSize: string;
};

const WROCLAW_CENTER = { lat: 51.1079, lon: 17.0385 };
const VOIVODESHIP_OPTIONS = [{ value: "dolnoslaskie", label: "Dolnośląskie" }];
const BUILDING_TYPE_OPTIONS = [
  { value: "apartment_block", label: "Блок / многоквартирный" },
  { value: "low_rise_block", label: "Низкая застройка" },
  { value: "tenement", label: "Kamienica" },
  { value: "detached_house", label: "Дом" },
];
const RENOVATION_STATE_OPTIONS = [
  { value: "developer_standard", label: "Developer standard" },
  { value: "ready_to_move_in", label: "Готово к въезду" },
  { value: "needs_refresh", label: "Требует освежения" },
  { value: "needs_renovation", label: "Требует ремонта" },
];
const PARKING_TYPE_OPTIONS = [
  { value: "underground", label: "Подземный" },
  { value: "garage", label: "Гараж" },
  { value: "surface", label: "Наземный" },
  { value: "street", label: "Уличный" },
];
const HEATING_TYPE_OPTIONS = [
  { value: "municipal", label: "Городское" },
  { value: "gas", label: "Газовое" },
  { value: "electric", label: "Электрическое" },
  { value: "heat_pump", label: "Heat pump" },
];

const defaultFilters: Filters = {
  mode: "standard",
  query: "",
  voivodeship: "",
  municipality: "",
  district: "",
  buildingType: "",
  renovationState: "",
  hasBalcony: false,
  hasTerrace: false,
  hasGarden: false,
  hasElevator: false,
  parkingType: "",
  heatingType: "",
  rooms: "",
  maxPrice: "",
  minFloor: "",
  maxFloor: "",
  maxBuildingFloors: "",
  minBuildingYear: "",
  maxBuildingYear: "",
  maxFairDelta: "",
  minInvestment: "",
  maxRisk: "",
  minNegotiation: "",
  minLiquidity: "",
  minRental: "",
  minDataQuality: "",
  minDeveloperReputation: "",
  minDeveloperConfidence: "",
  minDeveloperCompleted: "",
  minDeveloperActive: "",
  requireDeveloper: false,
  excludeDeveloperRisk: false,
  maxCenterKm: "",
  maxStopM: "",
  maxSchoolM: "",
  minMajorRoadM: "",
  minIndustrialZoneM: "",
  radiusKm: "",
  sort: "investment_score_desc",
  pageSize: "10",
};

export default function ExplorerPage() {
  const [analyses, setAnalyses] = useState<ListingAnalysis[]>([]);
  const [hiddenGemItems, setHiddenGemItems] = useState<HiddenGemItem[]>([]);
  const [areas, setAreas] = useState<AreaStatistics[]>([]);
  const [mapData, setMapData] = useState<MapFeatureCollection | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [status, setStatus] = useState("Загрузка аналитики...");
  const [mapStatus, setMapStatus] = useState("Загрузка GIS-слоев...");
  const [mapError, setMapError] = useState("");
  const [error, setError] = useState("");
  const appliedUrlFiltersRef = useRef(false);

  const load = useCallback(async (nextPage: number) => {
    setError("");
    setStatus("Загрузка аналитики...");
    try {
      if (filters.mode === "hidden_gems") {
        const [search, areaStats] = await Promise.all([
          api.listHiddenGems(buildHiddenGemQuery(filters, nextPage)),
          api.listAreas(),
        ]);
        setAnalyses(search.items.map((item) => item.analysis));
        setHiddenGemItems(search.items);
        setAreas(areaStats);
        setPage(search.page);
        setTotal(search.total);
        setTotalPages(search.total_pages);
        setStatus(`Hidden gems ${search.total} · страница ${search.page} из ${search.total_pages || 1}`);
        return;
      }

      const [search, areaStats] = await Promise.all([
        api.listListings(buildSearchQuery(filters, nextPage)),
        api.listAreas(),
      ]);
      setAnalyses(search.items);
      setHiddenGemItems([]);
      setAreas(areaStats);
      setPage(search.page);
      setTotal(search.total);
      setTotalPages(search.total_pages);
      setStatus(`Найдено ${search.total} · страница ${search.page} из ${search.total_pages || 1}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "unknown error";
      setError(message);
      setStatus("Backend API недоступен");
    }
  }, [filters]);

  useEffect(() => {
    if (!appliedUrlFiltersRef.current) {
      appliedUrlFiltersRef.current = true;
      const params = new URLSearchParams(window.location.search);
      const municipality = params.get("municipality");
      const district = params.get("district");
      const query = params.get("q");
      if (
        (municipality && filters.municipality !== municipality) ||
        (district && filters.district !== district) ||
        (query && filters.query !== query)
      ) {
        setFilters((current) => ({
          ...current,
          municipality: municipality || current.municipality,
          district: district || current.district,
          query: query || current.query,
        }));
        return;
      }
    }
    void load(page);
  }, [filters.district, filters.municipality, filters.query, load, page]);

  const mapQuery = useMemo<MapQuery>(() => {
    const radiusKm = filters.radiusKm ? Number(filters.radiusKm) : undefined;
    return {
      voivodeship: filters.voivodeship || undefined,
      city: filters.municipality ? undefined : "Wrocław",
      district: filters.district || undefined,
      municipality: filters.municipality || undefined,
      rooms: filters.rooms ? Number(filters.rooms) : undefined,
      max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      building_type: filters.buildingType || undefined,
      renovation_state: filters.renovationState || undefined,
      has_balcony: filters.hasBalcony || undefined,
      has_terrace: filters.hasTerrace || undefined,
      has_garden: filters.hasGarden || undefined,
      has_elevator: filters.hasElevator || undefined,
      parking_type: filters.parkingType || undefined,
      heating_type: filters.heatingType || undefined,
      min_floor: filters.minFloor ? Number(filters.minFloor) : undefined,
      max_floor: filters.maxFloor ? Number(filters.maxFloor) : undefined,
      max_building_floors: filters.maxBuildingFloors
        ? Number(filters.maxBuildingFloors)
        : undefined,
      min_building_year: filters.minBuildingYear
        ? Number(filters.minBuildingYear)
        : undefined,
      max_building_year: filters.maxBuildingYear
        ? Number(filters.maxBuildingYear)
        : undefined,
      min_investment_score: filters.minInvestment ? Number(filters.minInvestment) : undefined,
      max_risk_score: filters.maxRisk ? Number(filters.maxRisk) : undefined,
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
          } planned investments · ${data.metadata.infrastructure_count ?? 0} infrastructure`,
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

  const municipalities = Array.from(new Set(areas.map((area) => area.city))).sort((left, right) => {
    if (left === "Wrocław") return -1;
    if (right === "Wrocław") return 1;
    return left.localeCompare(right);
  });
  const districts = areas
    .filter((area) =>
      filters.municipality ? area.city === filters.municipality : area.city === "Wrocław",
    )
    .map((area) => area.name);
  const best = analyses[0];
  const bestGem = hiddenGemItems[0] ?? null;
  const selectedArea =
    areas.find(
      (area) =>
        area.name === filters.district &&
        (filters.municipality ? area.city === filters.municipality : area.city === "Wrocław"),
    ) ??
    areas.find((area) => area.city === (filters.municipality || "Wrocław")) ??
    areas[0] ??
    null;
  const compareHref = `/compare?ids=${compareIds.join(",")}`;

  function updateFilters(next: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(defaultFilters);
    setPage(1);
    setCompareIds([]);
    setHiddenGemItems([]);
    setStatus("Фильтры сброшены");
  }

  function enableHiddenGems() {
    updateFilters({
      mode: "hidden_gems",
      maxFairDelta: filters.maxFairDelta || "5",
      minInvestment: filters.minInvestment || "55",
      maxRisk: filters.maxRisk || "60",
      minLiquidity: filters.minLiquidity || "40",
      minRental: filters.minRental || "40",
      minDataQuality: filters.minDataQuality || "60",
      sort: "investment_score_desc",
    });
  }

  function toggleCompare(listingId: string) {
    setCompareIds((current) => {
      if (current.includes(listingId)) {
        return current.filter((item) => item !== listingId);
      }
      if (current.length >= 5) {
        setStatus("Для сравнения можно выбрать максимум 5 объектов");
        return current;
      }
      return [...current, listingId];
    });
  }

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
        voivodeship: filters.voivodeship || null,
        city: filters.municipality ? null : "Wrocław",
        municipality: filters.municipality || null,
        query: filters.query || null,
        district: filters.district || null,
        rooms: filters.rooms ? Number(filters.rooms) : null,
        max_price: filters.maxPrice ? Number(filters.maxPrice) : null,
        building_type: filters.buildingType || null,
        renovation_state: filters.renovationState || null,
        has_balcony: filters.hasBalcony || null,
        has_terrace: filters.hasTerrace || null,
        has_garden: filters.hasGarden || null,
        has_elevator: filters.hasElevator || null,
        parking_type: filters.parkingType || null,
        heating_type: filters.heatingType || null,
        min_floor: filters.minFloor ? Number(filters.minFloor) : null,
        max_floor: filters.maxFloor ? Number(filters.maxFloor) : null,
        max_building_floors: filters.maxBuildingFloors
          ? Number(filters.maxBuildingFloors)
          : null,
        min_building_year: filters.minBuildingYear
          ? Number(filters.minBuildingYear)
          : null,
        max_building_year: filters.maxBuildingYear
          ? Number(filters.maxBuildingYear)
          : null,
        min_investment_score: filters.minInvestment
          ? Number(filters.minInvestment)
          : null,
        max_risk_score: filters.maxRisk ? Number(filters.maxRisk) : null,
        max_price_delta_to_fair_mid_pct: filters.maxFairDelta
          ? Number(filters.maxFairDelta)
          : null,
        min_negotiation_score: filters.minNegotiation
          ? Number(filters.minNegotiation)
          : null,
        min_liquidity_score: filters.minLiquidity ? Number(filters.minLiquidity) : null,
        min_rental_potential_score: filters.minRental ? Number(filters.minRental) : null,
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
          <button className="button" type="button" onClick={() => void load(page)}>
            <RefreshCw size={16} /> Обновить
          </button>
          <button
            className={filters.mode === "hidden_gems" ? "button primary" : "button"}
            type="button"
            onClick={enableHiddenGems}
          >
            <Gem size={16} /> Hidden gems
          </button>
          {compareIds.length >= 2 ? (
            <Link className="button" href={compareHref}>
              <BarChart3 size={16} /> Сравнить {compareIds.length}
            </Link>
          ) : (
            <button className="button" type="button" disabled>
              <BarChart3 size={16} /> Сравнить {compareIds.length}
            </button>
          )}
          <button className="button primary" type="button" onClick={() => void createAlert()}>
            <Bell size={16} /> Alert
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Объектов найдено</span>
          <strong>{numberValue(total)}</strong>
        </div>
        <div className="metric">
          <span>{filters.mode === "hidden_gems" ? "Лучший Gem Score" : "Лучший Investment"}</span>
          <strong>
            {filters.mode === "hidden_gems"
              ? bestGem
                ? `${bestGem.gem_score}/100`
                : "-"
              : best
                ? `${best.scores.investment_score}/100`
                : "-"}
          </strong>
        </div>
        <div className="metric">
          <span>Медиана района</span>
          <strong>
            {selectedArea ? `${money(selectedArea.median_price_per_m2)}/m2` : "-"}
          </strong>
        </div>
        <div className="metric">
          <span>Динамика цены 90 дней</span>
          <strong>{selectedArea ? percent(selectedArea.price_change_90d_pct) : "-"}</strong>
        </div>
      </section>

      <div className="panel" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Фильтры и сортировка</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body form-grid wide">
          <label className="field">
            <span>Поиск</span>
            <input
              className="input"
              value={filters.query}
              placeholder="адрес, район, улица"
              onChange={(event) => updateFilters({ query: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Gmina</span>
            <select
              className="select"
              value={filters.municipality}
              onChange={(event) =>
                updateFilters({ municipality: event.target.value, district: "" })
              }
            >
              <option value="">Wrocław city</option>
              {municipalities
                .filter((municipality) => municipality !== "Wrocław")
                .map((municipality) => (
                  <option key={municipality} value={municipality}>
                    {municipality}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Województwo</span>
            <select
              className="select"
              value={filters.voivodeship}
              onChange={(event) => updateFilters({ voivodeship: event.target.value })}
            >
              <option value="">Все</option>
              {VOIVODESHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Район</span>
            <select
              className="select"
              value={filters.district}
              onChange={(event) => updateFilters({ district: event.target.value })}
            >
              <option value="">Все районы/местности</option>
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
              onChange={(event) => updateFilters({ rooms: event.target.value })}
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
              onChange={(event) => updateFilters({ maxPrice: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Тип здания</span>
            <select
              className="select"
              value={filters.buildingType}
              onChange={(event) => updateFilters({ buildingType: event.target.value })}
            >
              <option value="">Любой</option>
              {BUILDING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Состояние</span>
            <select
              className="select"
              value={filters.renovationState}
              onChange={(event) => updateFilters({ renovationState: event.target.value })}
            >
              <option value="">Любое</option>
              {RENOVATION_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.hasBalcony}
              onChange={(event) => updateFilters({ hasBalcony: event.target.checked })}
            />
            <span>Балкон</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.hasTerrace}
              onChange={(event) => updateFilters({ hasTerrace: event.target.checked })}
            />
            <span>Терраса</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.hasGarden}
              onChange={(event) => updateFilters({ hasGarden: event.target.checked })}
            />
            <span>Сад</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.hasElevator}
              onChange={(event) => updateFilters({ hasElevator: event.target.checked })}
            />
            <span>Лифт</span>
          </label>
          <label className="field">
            <span>Parking</span>
            <select
              className="select"
              value={filters.parkingType}
              onChange={(event) => updateFilters({ parkingType: event.target.value })}
            >
              <option value="">Любой</option>
              {PARKING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Отопление</span>
            <select
              className="select"
              value={filters.heatingType}
              onChange={(event) => updateFilters({ heatingType: event.target.value })}
            >
              <option value="">Любое</option>
              {HEATING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Этаж от</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minFloor}
              placeholder="1"
              onChange={(event) => updateFilters({ minFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Этаж до</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxFloor}
              placeholder="5"
              onChange={(event) => updateFilters({ maxFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Этажность до</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxBuildingFloors}
              placeholder="8"
              onChange={(event) => updateFilters({ maxBuildingFloors: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Год дома от</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minBuildingYear}
              placeholder="2010"
              onChange={(event) => updateFilters({ minBuildingYear: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Год дома до</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxBuildingYear}
              placeholder="2026"
              onChange={(event) => updateFilters({ maxBuildingYear: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Макс. delta fair</span>
            <input
              className="input"
              inputMode="decimal"
              value={filters.maxFairDelta}
              placeholder="5"
              onChange={(event) => updateFilters({ maxFairDelta: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Investment</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minInvestment}
              placeholder="60"
              onChange={(event) => updateFilters({ minInvestment: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Макс. Risk</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxRisk}
              placeholder="55"
              onChange={(event) => updateFilters({ maxRisk: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Negotiation</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minNegotiation}
              placeholder="45"
              onChange={(event) => updateFilters({ minNegotiation: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Liquidity</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minLiquidity}
              placeholder="40"
              onChange={(event) => updateFilters({ minLiquidity: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Rental</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minRental}
              placeholder="40"
              onChange={(event) => updateFilters({ minRental: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Data quality</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minDataQuality}
              placeholder="60"
              onChange={(event) => updateFilters({ minDataQuality: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. рейтинг застройщика</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minDeveloperReputation}
              placeholder="60"
              onChange={(event) =>
                updateFilters({ minDeveloperReputation: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Мин. confidence застройщика</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minDeveloperConfidence}
              placeholder="60"
              onChange={(event) =>
                updateFilters({ minDeveloperConfidence: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Сданных проектов от</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minDeveloperCompleted}
              placeholder="2"
              onChange={(event) =>
                updateFilters({ minDeveloperCompleted: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Активных проектов от</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minDeveloperActive}
              placeholder="1"
              onChange={(event) =>
                updateFilters({ minDeveloperActive: event.target.value })
              }
            />
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.requireDeveloper}
              onChange={(event) => updateFilters({ requireDeveloper: event.target.checked })}
            />
            <span>Только с застройщиком</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.excludeDeveloperRisk}
              onChange={(event) =>
                updateFilters({ excludeDeveloperRisk: event.target.checked })
              }
            />
            <span>Без developer risk</span>
          </label>
          <label className="field">
            <span>Радиус от центра</span>
            <select
              className="select"
              value={filters.radiusKm}
              onChange={(event) => updateFilters({ radiusKm: event.target.value })}
            >
              <option value="">Весь Wrocław MVP</option>
              <option value="5">5 км</option>
              <option value="8">8 км</option>
              <option value="10">10 км</option>
              <option value="15">15 км</option>
            </select>
          </label>
          <label className="field">
            <span>Макс. до центра, км</span>
            <input
              className="input"
              inputMode="decimal"
              value={filters.maxCenterKm}
              placeholder="8"
              onChange={(event) => updateFilters({ maxCenterKm: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Макс. до остановки, м</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxStopM}
              placeholder="600"
              onChange={(event) => updateFilters({ maxStopM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Макс. до школы, м</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxSchoolM}
              placeholder="900"
              onChange={(event) => updateFilters({ maxSchoolM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. от дороги, м</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minMajorRoadM}
              placeholder="150"
              onChange={(event) => updateFilters({ minMajorRoadM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. от промзоны, м</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minIndustrialZoneM}
              placeholder="1000"
              onChange={(event) => updateFilters({ minIndustrialZoneM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Режим</span>
            <select
              className="select"
              value={filters.mode}
              onChange={(event) =>
                updateFilters({ mode: event.target.value as Filters["mode"] })
              }
            >
              <option value="standard">Обычный поиск</option>
              <option value="hidden_gems">Hidden gems</option>
            </select>
          </label>
          <label className="field">
            <span>Сортировка</span>
            <select
              className="select"
              value={filters.sort}
              onChange={(event) => updateFilters({ sort: event.target.value as ListingSort })}
            >
              <option value="investment_score_desc">Investment: выше</option>
              <option value="price_asc">Цена: ниже</option>
              <option value="price_desc">Цена: выше</option>
              <option value="price_per_m2_asc">Цена/m2: ниже</option>
              <option value="risk_score_asc">Risk: ниже</option>
              <option value="negotiation_score_desc">Negotiation: выше</option>
              <option value="developer_reputation_score_desc">Застройщик: рейтинг выше</option>
              <option value="developer_reputation_score_asc">Застройщик: рейтинг ниже</option>
              <option value="developer_confidence_score_desc">Застройщик: confidence выше</option>
              <option value="developer_confidence_score_asc">Застройщик: confidence ниже</option>
              <option value="days_on_market_desc">Дольше на рынке</option>
              <option value="newest">Новые</option>
            </select>
          </label>
          <label className="field">
            <span>На странице</span>
            <select
              className="select"
              value={filters.pageSize}
              onChange={(event) => updateFilters({ pageSize: event.target.value })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </label>
          <button className="button primary" type="button" onClick={() => setPage(1)}>
            <Search size={16} /> Применить
          </button>
          <button className="button" type="button" onClick={enableHiddenGems}>
            <Gem size={16} /> Hidden gems
          </button>
          <button className="button" type="button" onClick={resetFilters}>
            <Search size={16} /> Сброс
          </button>
        </div>
      </div>

      {error ? (
        <ErrorBlock message={error} />
      ) : analyses.length === 0 && status.startsWith("Загрузка") ? (
        <LoadingBlock />
      ) : (
        <div className="grid-2">
          <section className="listing-list">
            {filters.mode === "hidden_gems" && hiddenGemItems.length ? (
              <section className="panel">
                <div className="panel-header">
                  <h2>Hidden gems</h2>
                  <span className="muted">{hiddenGemItems.length} на странице</span>
                </div>
                <div className="panel-body">
                  <ul className="section-list compact">
                    {hiddenGemItems.slice(0, 5).map((item) => (
                      <li key={item.analysis.listing.id}>
                        <span className="status-pill info">{item.gem_score}/100</span>
                        <strong>{item.analysis.listing.title}</strong>
                        <small>{item.signals.join(" · ")}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
            {analyses.length === 0 ? (
              <EmptyBlock label="Нет объектов под выбранные фильтры." />
            ) : (
              analyses.map((analysis) => (
                <ListingCard
                  key={analysis.listing.id}
                  analysis={analysis}
                  isSelectedForCompare={compareIds.includes(analysis.listing.id)}
                  onToggleCompare={toggleCompare}
                  onFavorite={(listingId) => void addFavorite(listingId)}
                  onReport={(listingId) => void generateReport(listingId)}
                />
              ))
            )}
            <div className="pagination-row">
              <button
                className="button"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Назад
              </button>
              <span>
                Страница {page} из {totalPages || 1}
              </span>
              <button
                className="button"
                type="button"
                disabled={totalPages === 0 || page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Вперед
              </button>
            </div>
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

function buildSearchQuery(filters: Filters, page: number): ListingSearchQuery {
  const radiusKm = filters.radiusKm ? Number(filters.radiusKm) : undefined;
  return {
    voivodeship: filters.voivodeship || undefined,
    city: filters.municipality ? undefined : "Wrocław",
    query: filters.query || undefined,
    district: filters.district || undefined,
    municipality: filters.municipality || undefined,
    rooms: filters.rooms ? Number(filters.rooms) : undefined,
    max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    building_type: filters.buildingType || undefined,
    renovation_state: filters.renovationState || undefined,
    has_balcony: filters.hasBalcony || undefined,
    has_terrace: filters.hasTerrace || undefined,
    has_garden: filters.hasGarden || undefined,
    has_elevator: filters.hasElevator || undefined,
    parking_type: filters.parkingType || undefined,
    heating_type: filters.heatingType || undefined,
    min_floor: filters.minFloor ? Number(filters.minFloor) : undefined,
    max_floor: filters.maxFloor ? Number(filters.maxFloor) : undefined,
    max_building_floors: filters.maxBuildingFloors
      ? Number(filters.maxBuildingFloors)
      : undefined,
    min_building_year: filters.minBuildingYear
      ? Number(filters.minBuildingYear)
      : undefined,
    max_building_year: filters.maxBuildingYear
      ? Number(filters.maxBuildingYear)
      : undefined,
    min_investment_score: filters.minInvestment
      ? Number(filters.minInvestment)
      : undefined,
    max_risk_score: filters.maxRisk ? Number(filters.maxRisk) : undefined,
    min_negotiation_score: filters.minNegotiation
      ? Number(filters.minNegotiation)
      : undefined,
    min_liquidity_score: filters.minLiquidity ? Number(filters.minLiquidity) : undefined,
    min_rental_potential_score: filters.minRental ? Number(filters.minRental) : undefined,
    min_data_quality_score: filters.minDataQuality
      ? Number(filters.minDataQuality)
      : undefined,
    min_developer_reputation_score: filters.minDeveloperReputation
      ? Number(filters.minDeveloperReputation)
      : undefined,
    min_developer_confidence_score: filters.minDeveloperConfidence
      ? Number(filters.minDeveloperConfidence)
      : undefined,
    min_developer_completed_projects: filters.minDeveloperCompleted
      ? Number(filters.minDeveloperCompleted)
      : undefined,
    min_developer_active_projects: filters.minDeveloperActive
      ? Number(filters.minDeveloperActive)
      : undefined,
    require_developer_reputation: filters.requireDeveloper || undefined,
    exclude_developer_risk_signals: filters.excludeDeveloperRisk || undefined,
    max_distance_to_center_km: filters.maxCenterKm ? Number(filters.maxCenterKm) : undefined,
    max_nearest_stop_m: filters.maxStopM ? Number(filters.maxStopM) : undefined,
    max_nearest_school_m: filters.maxSchoolM ? Number(filters.maxSchoolM) : undefined,
    min_nearest_major_road_m: filters.minMajorRoadM
      ? Number(filters.minMajorRoadM)
      : undefined,
    min_nearest_industrial_zone_m: filters.minIndustrialZoneM
      ? Number(filters.minIndustrialZoneM)
      : undefined,
    lat: radiusKm ? WROCLAW_CENTER.lat : undefined,
    lon: radiusKm ? WROCLAW_CENTER.lon : undefined,
    radius_km: radiusKm,
    sort: filters.sort,
    page,
    page_size: Number(filters.pageSize),
  };
}

function buildHiddenGemQuery(filters: Filters, page: number): HiddenGemQuery {
  return {
    voivodeship: filters.voivodeship || undefined,
    city: filters.municipality ? undefined : "Wrocław",
    query: filters.query || undefined,
    district: filters.district || undefined,
    municipality: filters.municipality || undefined,
    rooms: filters.rooms ? Number(filters.rooms) : undefined,
    max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    building_type: filters.buildingType || undefined,
    renovation_state: filters.renovationState || undefined,
    has_balcony: filters.hasBalcony || undefined,
    has_terrace: filters.hasTerrace || undefined,
    has_garden: filters.hasGarden || undefined,
    has_elevator: filters.hasElevator || undefined,
    parking_type: filters.parkingType || undefined,
    heating_type: filters.heatingType || undefined,
    min_floor: filters.minFloor ? Number(filters.minFloor) : undefined,
    max_floor: filters.maxFloor ? Number(filters.maxFloor) : undefined,
    max_building_floors: filters.maxBuildingFloors
      ? Number(filters.maxBuildingFloors)
      : undefined,
    min_building_year: filters.minBuildingYear
      ? Number(filters.minBuildingYear)
      : undefined,
    max_building_year: filters.maxBuildingYear
      ? Number(filters.maxBuildingYear)
      : undefined,
    max_price_delta_to_fair_mid_pct: filters.maxFairDelta
      ? Number(filters.maxFairDelta)
      : undefined,
    min_investment_score: filters.minInvestment ? Number(filters.minInvestment) : undefined,
    max_risk_score: filters.maxRisk ? Number(filters.maxRisk) : undefined,
    min_liquidity_score: filters.minLiquidity ? Number(filters.minLiquidity) : undefined,
    min_rental_potential_score: filters.minRental ? Number(filters.minRental) : undefined,
    min_data_quality_score: filters.minDataQuality ? Number(filters.minDataQuality) : undefined,
    min_developer_reputation_score: filters.minDeveloperReputation
      ? Number(filters.minDeveloperReputation)
      : undefined,
    min_developer_confidence_score: filters.minDeveloperConfidence
      ? Number(filters.minDeveloperConfidence)
      : undefined,
    min_developer_completed_projects: filters.minDeveloperCompleted
      ? Number(filters.minDeveloperCompleted)
      : undefined,
    min_developer_active_projects: filters.minDeveloperActive
      ? Number(filters.minDeveloperActive)
      : undefined,
    require_developer_reputation: filters.requireDeveloper || undefined,
    exclude_developer_risk_signals: filters.excludeDeveloperRisk || undefined,
    max_distance_to_center_km: filters.maxCenterKm ? Number(filters.maxCenterKm) : undefined,
    max_nearest_stop_m: filters.maxStopM ? Number(filters.maxStopM) : undefined,
    max_nearest_school_m: filters.maxSchoolM ? Number(filters.maxSchoolM) : undefined,
    min_nearest_major_road_m: filters.minMajorRoadM
      ? Number(filters.minMajorRoadM)
      : undefined,
    min_nearest_industrial_zone_m: filters.minIndustrialZoneM
      ? Number(filters.minIndustrialZoneM)
      : undefined,
    page,
    page_size: Number(filters.pageSize),
  };
}
