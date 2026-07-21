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
import { EXPLORER_COPY } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

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
  "apartment_block",
  "low_rise_block",
  "tenement",
  "detached_house",
] as const;
const RENOVATION_STATE_OPTIONS = [
  "developer_standard",
  "ready_to_move_in",
  "needs_refresh",
  "needs_renovation",
] as const;
const PARKING_TYPE_OPTIONS = ["underground", "garage", "surface", "street"] as const;
const HEATING_TYPE_OPTIONS = ["municipal", "gas", "electric", "heat_pump"] as const;

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
  const { locale } = useLocalePreference();
  const copy = EXPLORER_COPY[locale];
  const [analyses, setAnalyses] = useState<ListingAnalysis[]>([]);
  const [hiddenGemItems, setHiddenGemItems] = useState<HiddenGemItem[]>([]);
  const [areas, setAreas] = useState<AreaStatistics[]>([]);
  const [mapData, setMapData] = useState<MapFeatureCollection | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [status, setStatus] = useState(EXPLORER_COPY.ru.status.loading);
  const [mapStatus, setMapStatus] = useState(EXPLORER_COPY.ru.status.mapLoading);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [error, setError] = useState("");
  const appliedUrlFiltersRef = useRef(false);

  const load = useCallback(async (nextPage: number) => {
    setError("");
    setIsLoading(true);
    setStatus(copy.status.loading);
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
        setStatus(copy.status.hiddenGems(search.total, search.page, search.total_pages));
        setIsLoading(false);
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
      setStatus(copy.status.found(search.total, search.page, search.total_pages));
      setIsLoading(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "unknown error";
      setError(message);
      setStatus(copy.status.backendUnavailable);
      setIsLoading(false);
    }
  }, [copy, filters]);

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
      setMapStatus(copy.status.mapLoading);
      try {
        const data = await api.getMapFeatures(mapQuery);
        if (cancelled) return;
        setMapData(data);
        setMapStatus(
          copy.status.mapLoaded(
            data.metadata.listing_count ?? 0,
            data.metadata.planned_investment_count ?? 0,
            data.metadata.infrastructure_count ?? 0,
          ),
        );
      } catch (caught) {
        if (cancelled) return;
        setMapError(caught instanceof Error ? caught.message : "unknown error");
        setMapStatus(copy.status.mapUnavailable);
      }
    }

    void loadMap();
    return () => {
      cancelled = true;
    };
  }, [copy, mapQuery]);

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
    setStatus(copy.status.filtersReset);
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
        setStatus(copy.status.compareLimit);
        return current;
      }
      return [...current, listingId];
    });
  }

  async function addFavorite(listingId: string) {
    await api.addFavorite(listingId, copy.favoriteNote);
    setStatus(copy.status.favoriteAdded);
  }

  async function generateReport(listingId: string) {
    const report = await api.generateReport(listingId);
    setStatus(copy.status.reportSaved(report.id));
  }

  async function createAlert() {
    await api.createAlert({
      name: copy.savedSearchName,
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
    setStatus(copy.status.alertCreated);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="toolbar">
          <button className="button" type="button" onClick={() => void load(page)}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
          <button
            className={filters.mode === "hidden_gems" ? "button primary" : "button"}
            type="button"
            onClick={enableHiddenGems}
          >
            <Gem size={16} /> {copy.actions.hiddenGems}
          </button>
          {compareIds.length >= 2 ? (
            <Link className="button" href={compareHref}>
              <BarChart3 size={16} /> {copy.actions.compare(compareIds.length)}
            </Link>
          ) : (
            <button className="button" type="button" disabled>
              <BarChart3 size={16} /> {copy.actions.compare(compareIds.length)}
            </button>
          )}
          <button className="button primary" type="button" onClick={() => void createAlert()}>
            <Bell size={16} /> {copy.actions.alert}
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>{copy.metrics.found}</span>
          <strong>{numberValue(total, locale)}</strong>
        </div>
        <div className="metric">
          <span>
            {filters.mode === "hidden_gems"
              ? copy.metrics.bestGem
              : copy.metrics.bestInvestment}
          </span>
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
          <span>{copy.metrics.medianArea}</span>
          <strong>
            {selectedArea ? `${money(selectedArea.median_price_per_m2, locale)}/m2` : "-"}
          </strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.priceTrend90d}</span>
          <strong>
            {selectedArea ? percent(selectedArea.price_change_90d_pct, locale) : "-"}
          </strong>
        </div>
      </section>

      <div className="panel" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="panel-header">
          <h2>{copy.filters.title}</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body form-grid wide">
          <label className="field">
            <span>{copy.filters.search}</span>
            <input
              className="input"
              value={filters.query}
              placeholder={copy.filters.searchPlaceholder}
              onChange={(event) => updateFilters({ query: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.municipality}</span>
            <select
              className="select"
              value={filters.municipality}
              onChange={(event) =>
                updateFilters({ municipality: event.target.value, district: "" })
              }
            >
              <option value="">{copy.filters.wroclawCity}</option>
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
            <span>{copy.filters.voivodeship}</span>
            <select
              className="select"
              value={filters.voivodeship}
              onChange={(event) => updateFilters({ voivodeship: event.target.value })}
            >
              <option value="">{copy.filters.all}</option>
              {VOIVODESHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.district}</span>
            <select
              className="select"
              value={filters.district}
              onChange={(event) => updateFilters({ district: event.target.value })}
            >
              <option value="">{copy.filters.allDistricts}</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.rooms}</span>
            <select
              className="select"
              value={filters.rooms}
              onChange={(event) => updateFilters({ rooms: event.target.value })}
            >
              <option value="">{copy.filters.any}</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.maxPrice}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxPrice}
              placeholder="700000"
              onChange={(event) => updateFilters({ maxPrice: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.buildingType}</span>
            <select
              className="select"
              value={filters.buildingType}
              onChange={(event) => updateFilters({ buildingType: event.target.value })}
            >
              <option value="">{copy.filters.anyMasculine}</option>
              {BUILDING_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.optionLabels.buildingType[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.renovationState}</span>
            <select
              className="select"
              value={filters.renovationState}
              onChange={(event) => updateFilters({ renovationState: event.target.value })}
            >
              <option value="">{copy.filters.any}</option>
              {RENOVATION_STATE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.optionLabels.renovationState[option]}
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
            <span>{copy.filters.balcony}</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.hasTerrace}
              onChange={(event) => updateFilters({ hasTerrace: event.target.checked })}
            />
            <span>{copy.filters.terrace}</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.hasGarden}
              onChange={(event) => updateFilters({ hasGarden: event.target.checked })}
            />
            <span>{copy.filters.garden}</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.hasElevator}
              onChange={(event) => updateFilters({ hasElevator: event.target.checked })}
            />
            <span>{copy.filters.elevator}</span>
          </label>
          <label className="field">
            <span>{copy.filters.parking}</span>
            <select
              className="select"
              value={filters.parkingType}
              onChange={(event) => updateFilters({ parkingType: event.target.value })}
            >
              <option value="">{copy.filters.anyMasculine}</option>
              {PARKING_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.optionLabels.parkingType[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.heating}</span>
            <select
              className="select"
              value={filters.heatingType}
              onChange={(event) => updateFilters({ heatingType: event.target.value })}
            >
              <option value="">{copy.filters.any}</option>
              {HEATING_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.optionLabels.heatingType[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.minFloor}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minFloor}
              placeholder="1"
              onChange={(event) => updateFilters({ minFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.maxFloor}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxFloor}
              placeholder="5"
              onChange={(event) => updateFilters({ maxFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.maxBuildingFloors}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxBuildingFloors}
              placeholder="8"
              onChange={(event) => updateFilters({ maxBuildingFloors: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minBuildingYear}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minBuildingYear}
              placeholder="2010"
              onChange={(event) => updateFilters({ minBuildingYear: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.maxBuildingYear}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxBuildingYear}
              placeholder="2026"
              onChange={(event) => updateFilters({ maxBuildingYear: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.maxFairDelta}</span>
            <input
              className="input"
              inputMode="decimal"
              value={filters.maxFairDelta}
              placeholder="5"
              onChange={(event) => updateFilters({ maxFairDelta: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minInvestment}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minInvestment}
              placeholder="60"
              onChange={(event) => updateFilters({ minInvestment: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.maxRisk}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxRisk}
              placeholder="55"
              onChange={(event) => updateFilters({ maxRisk: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minNegotiation}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minNegotiation}
              placeholder="45"
              onChange={(event) => updateFilters({ minNegotiation: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minLiquidity}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minLiquidity}
              placeholder="40"
              onChange={(event) => updateFilters({ minLiquidity: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minRental}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minRental}
              placeholder="40"
              onChange={(event) => updateFilters({ minRental: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minDataQuality}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minDataQuality}
              placeholder="60"
              onChange={(event) => updateFilters({ minDataQuality: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minDeveloperReputation}</span>
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
            <span>{copy.filters.minDeveloperConfidence}</span>
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
            <span>{copy.filters.minDeveloperCompleted}</span>
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
            <span>{copy.filters.minDeveloperActive}</span>
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
            <span>{copy.filters.requireDeveloper}</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={filters.excludeDeveloperRisk}
              onChange={(event) =>
                updateFilters({ excludeDeveloperRisk: event.target.checked })
              }
            />
            <span>{copy.filters.excludeDeveloperRisk}</span>
          </label>
          <label className="field">
            <span>{copy.filters.radiusFromCenter}</span>
            <select
              className="select"
              value={filters.radiusKm}
              onChange={(event) => updateFilters({ radiusKm: event.target.value })}
            >
              <option value="">{copy.filters.wholeWroclaw}</option>
              <option value="5">5 км</option>
              <option value="8">8 км</option>
              <option value="10">10 км</option>
              <option value="15">15 км</option>
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.maxCenterKm}</span>
            <input
              className="input"
              inputMode="decimal"
              value={filters.maxCenterKm}
              placeholder="8"
              onChange={(event) => updateFilters({ maxCenterKm: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.maxStopM}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxStopM}
              placeholder="600"
              onChange={(event) => updateFilters({ maxStopM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.maxSchoolM}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.maxSchoolM}
              placeholder="900"
              onChange={(event) => updateFilters({ maxSchoolM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minMajorRoadM}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minMajorRoadM}
              placeholder="150"
              onChange={(event) => updateFilters({ minMajorRoadM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.minIndustrialZoneM}</span>
            <input
              className="input"
              inputMode="numeric"
              value={filters.minIndustrialZoneM}
              placeholder="1000"
              onChange={(event) => updateFilters({ minIndustrialZoneM: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.filters.mode}</span>
            <select
              className="select"
              value={filters.mode}
              onChange={(event) =>
                updateFilters({ mode: event.target.value as Filters["mode"] })
              }
            >
              <option value="standard">{copy.filters.standardMode}</option>
              <option value="hidden_gems">{copy.actions.hiddenGems}</option>
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.sort}</span>
            <select
              className="select"
              value={filters.sort}
              onChange={(event) => updateFilters({ sort: event.target.value as ListingSort })}
            >
              <option value="investment_score_desc">
                {copy.optionLabels.sort.investment_score_desc}
              </option>
              <option value="price_asc">{copy.optionLabels.sort.price_asc}</option>
              <option value="price_desc">{copy.optionLabels.sort.price_desc}</option>
              <option value="price_per_m2_asc">
                {copy.optionLabels.sort.price_per_m2_asc}
              </option>
              <option value="risk_score_asc">{copy.optionLabels.sort.risk_score_asc}</option>
              <option value="negotiation_score_desc">
                {copy.optionLabels.sort.negotiation_score_desc}
              </option>
              <option value="developer_reputation_score_desc">
                {copy.optionLabels.sort.developer_reputation_score_desc}
              </option>
              <option value="developer_reputation_score_asc">
                {copy.optionLabels.sort.developer_reputation_score_asc}
              </option>
              <option value="developer_confidence_score_desc">
                {copy.optionLabels.sort.developer_confidence_score_desc}
              </option>
              <option value="developer_confidence_score_asc">
                {copy.optionLabels.sort.developer_confidence_score_asc}
              </option>
              <option value="days_on_market_desc">
                {copy.optionLabels.sort.days_on_market_desc}
              </option>
              <option value="newest">{copy.optionLabels.sort.newest}</option>
            </select>
          </label>
          <label className="field">
            <span>{copy.filters.pageSize}</span>
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
            <Search size={16} /> {copy.actions.apply}
          </button>
          <button className="button" type="button" onClick={enableHiddenGems}>
            <Gem size={16} /> {copy.actions.hiddenGems}
          </button>
          <button className="button" type="button" onClick={resetFilters}>
            <Search size={16} /> {copy.actions.reset}
          </button>
        </div>
      </div>

      {error ? (
        <ErrorBlock message={error} prefix={copy.state.errorPrefix} />
      ) : analyses.length === 0 && isLoading ? (
        <LoadingBlock label={copy.state.loadingData} />
      ) : (
        <div className="grid-2">
          <section className="listing-list">
            {filters.mode === "hidden_gems" && hiddenGemItems.length ? (
              <section className="panel">
                <div className="panel-header">
                  <h2>{copy.actions.hiddenGems}</h2>
                  <span className="muted">
                    {copy.state.hiddenGemsOnPage(hiddenGemItems.length)}
                  </span>
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
              <EmptyBlock label={copy.state.emptyResults} />
            ) : (
              analyses.map((analysis) => (
                <ListingCard
                  key={analysis.listing.id}
                  analysis={analysis}
                  locale={locale}
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
                {copy.pagination.previous}
              </button>
              <span>{copy.pagination.page(page, totalPages)}</span>
              <button
                className="button"
                type="button"
                disabled={totalPages === 0 || page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {copy.pagination.next}
              </button>
            </div>
          </section>

          <aside className="panel">
            <div className="panel-header">
              <h2>{copy.map.title}</h2>
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
                  <FileText size={16} /> {copy.actions.reports}
                </a>
                <a className="button" href="/alerts">
                  <Bell size={16} /> {copy.actions.alert}
                </a>
                <button className="button" type="button" onClick={() => void addFavorite("wr-001")}>
                  <Heart size={16} /> {copy.actions.favorite}
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
