"use client";

import { useEffect, useRef } from "react";
import type {
  Map as MaplibreMap,
  Marker as MaplibreMarker,
  StyleSpecification,
} from "maplibre-gl";

import type { MapFeature, MapFeatureCollection, MapFeatureType } from "@/lib/api";

type MaplibreModule = typeof import("maplibre-gl");
type GeoJsonData = {
  type: "FeatureCollection";
  features: MapFeature[];
};
type SourceWithData = {
  setData: (data: GeoJsonData) => void;
};

type Props = {
  collection: MapFeatureCollection | null;
  isLoading?: boolean;
  error?: string;
};

const WROCLAW_CENTER: [number, number] = [17.0385, 51.1079];
const LISTINGS_SOURCE_ID = "domarion-listings";
const INVESTMENTS_SOURCE_ID = "domarion-planned-investments";
const EMPTY_COLLECTION: GeoJsonData = { type: "FeatureCollection", features: [] };

const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

export function PropertyMap({ collection, isLoading = false, error = "" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const maplibreRef = useRef<MaplibreModule | null>(null);
  const markersRef = useRef<MaplibreMarker[]>([]);
  const collectionRef = useRef<MapFeatureCollection | null>(collection);

  useEffect(() => {
    collectionRef.current = collection;
    if (mapRef.current && maplibreRef.current) {
      syncMapData(mapRef.current, maplibreRef.current, markersRef.current, collection);
    }
  }, [collection]);

  useEffect(() => {
    let disposed = false;
    const markers = markersRef.current;

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) return;

      const maplibre = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;

      maplibreRef.current = maplibre;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: OSM_RASTER_STYLE,
        center: WROCLAW_CENTER,
        zoom: 10.5,
        attributionControl: { compact: true },
      });

      map.addControl(new maplibre.NavigationControl({ visualizePitch: false }), "top-right");
      map.scrollZoom.disable();
      mapRef.current = map;

      map.on("load", () => {
        ensureMapLayers(map);
        syncMapData(map, maplibre, markersRef.current, collectionRef.current);
      });
    }

    void initializeMap();

    return () => {
      disposed = true;
      clearMarkers(markers);
      mapRef.current?.remove();
      mapRef.current = null;
      maplibreRef.current = null;
    };
  }, []);

  const listingCount = collection?.metadata.listing_count ?? 0;
  const plannedCount = collection?.metadata.planned_investment_count ?? 0;
  const infrastructureCount = collection?.metadata.infrastructure_count ?? 0;

  return (
    <div className="map-shell">
      <div ref={containerRef} className="maplibre-container" aria-label="Карта объектов" />
      <div className="map-summary">
        <span>{listingCount} объектов</span>
        <span>{plannedCount} planned investments</span>
        <span>{infrastructureCount} infrastructure</span>
      </div>
      <div className="map-legend" aria-label="Легенда карты">
        <span>
          <i className="legend-dot growth" /> growth
        </span>
        <span>
          <i className="legend-dot risk" /> risk
        </span>
        <span>
          <i className="legend-dot investment" /> план
        </span>
        <span>
          <i className="legend-dot infrastructure" /> инфраструктура
        </span>
      </div>
      {(isLoading || error) && (
        <div className={error ? "map-state error" : "map-state"}>
          {error || "Загрузка GIS-слоев..."}
        </div>
      )}
    </div>
  );
}

function ensureMapLayers(map: MaplibreMap) {
  if (!map.getSource(LISTINGS_SOURCE_ID)) {
    map.addSource(LISTINGS_SOURCE_ID, {
      type: "geojson",
      data: EMPTY_COLLECTION,
    });
  }

  if (!map.getSource(INVESTMENTS_SOURCE_ID)) {
    map.addSource(INVESTMENTS_SOURCE_ID, {
      type: "geojson",
      data: EMPTY_COLLECTION,
    });
  }

  if (!map.getLayer("listing-growth-halo")) {
    map.addLayer({
      id: "listing-growth-halo",
      type: "circle",
      source: LISTINGS_SOURCE_ID,
      paint: {
        "circle-color": "#0f766e",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "investment_score"],
          0,
          10,
          100,
          26,
        ],
        "circle-opacity": [
          "case",
          [">=", ["get", "investment_score"], 60],
          0.2,
          0.04,
        ],
        "circle-stroke-color": "#0f766e",
        "circle-stroke-opacity": 0.3,
        "circle-stroke-width": 1,
      },
    });
  }

  if (!map.getLayer("listing-risk-halo")) {
    map.addLayer({
      id: "listing-risk-halo",
      type: "circle",
      source: LISTINGS_SOURCE_ID,
      filter: [">=", ["get", "risk_score"], 35],
      paint: {
        "circle-color": "#b42318",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "risk_score"],
          35,
          14,
          100,
          32,
        ],
        "circle-opacity": 0.16,
        "circle-stroke-color": "#b42318",
        "circle-stroke-opacity": 0.3,
        "circle-stroke-width": 1,
      },
    });
  }

  if (!map.getLayer("planned-investment-halo")) {
    map.addLayer({
      id: "planned-investment-halo",
      type: "circle",
      source: INVESTMENTS_SOURCE_ID,
      paint: {
        "circle-color": "#2563eb",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "confidence_score"],
          0,
          10,
          100,
          21,
        ],
        "circle-opacity": 0.18,
        "circle-stroke-color": "#2563eb",
        "circle-stroke-opacity": 0.38,
        "circle-stroke-width": 1,
      },
    });
  }
}

function syncMapData(
  map: MaplibreMap,
  maplibre: MaplibreModule,
  markers: MaplibreMarker[],
  collection: MapFeatureCollection | null,
) {
  if (!map.isStyleLoaded()) return;

  ensureMapLayers(map);

  const listings = splitCollection(collection, "listing");
  const investments = splitCollection(collection, "planned_investment");
  const listingSource = map.getSource(LISTINGS_SOURCE_ID) as SourceWithData | undefined;
  const investmentSource = map.getSource(INVESTMENTS_SOURCE_ID) as SourceWithData | undefined;

  listingSource?.setData(listings);
  investmentSource?.setData(investments);
  syncMarkers(map, maplibre, markers, collection);
  fitToCollection(map, maplibre, collection);
}

function splitCollection(
  collection: MapFeatureCollection | null,
  featureType: MapFeatureType,
): GeoJsonData {
  return {
    type: "FeatureCollection",
    features: collection?.features.filter(
      (feature) => feature.properties.feature_type === featureType,
    ) ?? [],
  };
}

function syncMarkers(
  map: MaplibreMap,
  maplibre: MaplibreModule,
  markers: MaplibreMarker[],
  collection: MapFeatureCollection | null,
) {
  clearMarkers(markers);
  if (!collection) return;

  collection.features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const element = markerElement(feature, map, maplibre);

    const marker = new maplibre.Marker({
      element,
      anchor: feature.properties.feature_type === "listing" ? "bottom" : "center",
    })
      .setLngLat([lon, lat])
      .addTo(map);
    markers.push(marker);
  });
}

function createListingMarker(feature: MapFeature) {
  const element = document.createElement("button");
  const riskClass = feature.properties.risk_class === "high_risk" ? " high-risk" : "";
  const growthClass = feature.properties.growth_class === "high_growth" ? " high-growth" : "";
  element.className = `map-price-marker${riskClass}${growthClass}`;
  element.type = "button";
  element.textContent = String(feature.properties.price_label ?? "");
  element.title = `${feature.properties.title ?? "Listing"} · Investment ${
    feature.properties.investment_score ?? "-"
  } / Risk ${feature.properties.risk_score ?? "-"}`;
  element.addEventListener("click", () => {
    window.location.assign(`/listings/${feature.properties.listing_id}`);
  });
  return element;
}

function markerElement(
  feature: MapFeature,
  map: MaplibreMap,
  maplibre: MaplibreModule,
) {
  if (feature.properties.feature_type === "listing") {
    return createListingMarker(feature);
  }
  if (feature.properties.feature_type === "planned_investment") {
    return createInvestmentMarker(feature, map, maplibre);
  }
  return createInfrastructureMarker(feature, map, maplibre);
}

function createInvestmentMarker(
  feature: MapFeature,
  map: MaplibreMap,
  maplibre: MaplibreModule,
) {
  const element = document.createElement("button");
  element.className = "map-investment-marker";
  element.type = "button";
  element.textContent = investmentInitial(feature);
  element.title = String(feature.properties.name ?? "Planned investment");
  element.addEventListener("click", () => {
    const popupContent = buildInvestmentPopup(feature);
    new maplibre.Popup({ offset: 18 })
      .setLngLat(feature.geometry.coordinates)
      .setDOMContent(popupContent)
      .addTo(map);
  });
  return element;
}

function createInfrastructureMarker(
  feature: MapFeature,
  map: MaplibreMap,
  maplibre: MaplibreModule,
) {
  const element = document.createElement("button");
  const featureClass = String(feature.properties.feature_type).replaceAll("_", "-");
  element.className = `map-infrastructure-marker ${featureClass}`;
  element.type = "button";
  element.textContent = infrastructureInitial(feature);
  element.title = infrastructureTitle(feature);
  element.addEventListener("click", () => {
    const popupContent = buildInfrastructurePopup(feature);
    new maplibre.Popup({ offset: 16 })
      .setLngLat(feature.geometry.coordinates)
      .setDOMContent(popupContent)
      .addTo(map);
  });
  return element;
}

function buildInvestmentPopup(feature: MapFeature) {
  const container = document.createElement("div");
  container.className = "map-feature-popup";

  const title = document.createElement("strong");
  title.textContent = String(feature.properties.name ?? "Planned investment");
  container.appendChild(title);

  const meta = document.createElement("span");
  meta.textContent = [
    feature.properties.investment_type,
    feature.properties.status,
    feature.properties.expected_year,
  ]
    .filter(Boolean)
    .join(" · ");
  container.appendChild(meta);

  const note = document.createElement("p");
  note.textContent = String(feature.properties.notes ?? "Layer inwestycji planowanych.");
  container.appendChild(note);

  return container;
}

function buildInfrastructurePopup(feature: MapFeature) {
  const container = document.createElement("div");
  container.className = "map-feature-popup";

  const title = document.createElement("strong");
  title.textContent = String(feature.properties.name ?? infrastructureTitle(feature));
  container.appendChild(title);

  const meta = document.createElement("span");
  meta.textContent = infrastructureMeta(feature);
  container.appendChild(meta);

  const detail = document.createElement("p");
  detail.textContent = infrastructureDetail(feature);
  container.appendChild(detail);

  return container;
}

function investmentInitial(feature: MapFeature) {
  const type = String(feature.properties.investment_type ?? "P");
  if (type.includes("tram")) return "T";
  if (type.includes("school")) return "S";
  if (type.includes("park")) return "P";
  return "I";
}

function infrastructureInitial(feature: MapFeature) {
  switch (feature.properties.feature_type) {
    case "transport_stop":
      return "T";
    case "school":
      return "S";
    case "kindergarten":
      return "K";
    case "industrial_zone":
      return "!";
    case "amenity":
      return amenityInitial(feature);
    default:
      return "I";
  }
}

function amenityInitial(feature: MapFeature) {
  const type = String(feature.properties.amenity_type ?? "");
  if (type.includes("park")) return "P";
  if (type.includes("health")) return "H";
  if (type.includes("retail")) return "R";
  if (type.includes("office")) return "O";
  if (type.includes("university")) return "U";
  return "A";
}

function infrastructureTitle(feature: MapFeature) {
  const name = String(feature.properties.name ?? "Infrastructure");
  return `${infrastructureLabel(feature)} · ${name}`;
}

function infrastructureMeta(feature: MapFeature) {
  return [
    infrastructureLabel(feature),
    feature.properties.district,
    feature.properties.municipality,
  ]
    .filter(Boolean)
    .join(" · ");
}

function infrastructureDetail(feature: MapFeature) {
  if (feature.properties.feature_type === "transport_stop") {
    return [
      feature.properties.stop_type,
      feature.properties.lines_label ? `lines: ${feature.properties.lines_label}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (feature.properties.feature_type === "school") {
    return [feature.properties.school_type, feature.properties.operator_type]
      .filter(Boolean)
      .join(" · ");
  }
  if (feature.properties.feature_type === "kindergarten") {
    return [feature.properties.kindergarten_type, feature.properties.operator_type]
      .filter(Boolean)
      .join(" · ");
  }
  if (feature.properties.feature_type === "industrial_zone") {
    return [
      feature.properties.zone_type,
      `risk: ${feature.properties.risk_level ?? "unknown"}`,
      feature.properties.impact_radius_m
        ? `impact radius: ${feature.properties.impact_radius_m} m`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return String(feature.properties.amenity_type ?? "amenity");
}

function infrastructureLabel(feature: MapFeature) {
  switch (feature.properties.feature_type) {
    case "transport_stop":
      return "Transport";
    case "school":
      return "School";
    case "kindergarten":
      return "Kindergarten";
    case "amenity":
      return "Amenity";
    case "industrial_zone":
      return "Industrial zone";
    default:
      return "Infrastructure";
  }
}

function clearMarkers(markers: MaplibreMarker[]) {
  markers.splice(0).forEach((marker) => marker.remove());
}

function fitToCollection(
  map: MaplibreMap,
  maplibre: MaplibreModule,
  collection: MapFeatureCollection | null,
) {
  if (!collection?.bbox) {
    map.flyTo({ center: WROCLAW_CENTER, zoom: 10.5, duration: 450 });
    return;
  }

  const [minLon, minLat, maxLon, maxLat] = collection.bbox;
  if (minLon === maxLon || minLat === maxLat) {
    map.flyTo({ center: [minLon, minLat], zoom: 13, duration: 450 });
    return;
  }

  const bounds = new maplibre.LngLatBounds([minLon, minLat], [maxLon, maxLat]);
  map.fitBounds(bounds, { padding: 58, maxZoom: 13.5, duration: 450 });
}
