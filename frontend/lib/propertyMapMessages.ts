import type { Locale } from "@/lib/i18n";

export type PropertyMapLayerLabel =
  | "listings"
  | "priceHeatmap"
  | "planned"
  | "administrative"
  | "districts"
  | "municipalities"
  | "voivodeshipBoundary"
  | "futureTransport"
  | "futureTramLines"
  | "futureBusRoutes"
  | "futureRoadCorridors"
  | "planning"
  | "mpzpZones"
  | "studiumZones"
  | "riskLayers"
  | "majorRoadNoise"
  | "industrialRisk"
  | "railAirportRisk"
  | "floodPollutionRisk"
  | "infrastructure"
  | "transportRoutes"
  | "transportStops"
  | "schools"
  | "kindergartens"
  | "amenities"
  | "amenityParks"
  | "amenityHealthcare"
  | "amenityRetail"
  | "amenityJobsEducation"
  | "amenityPublicServices"
  | "industrialZones";

export type PropertyMapCopy = {
  mapLabel: string;
  radiusLabel: string;
  layersLabel: string;
  legendLabel: string;
  loading: string;
  priceUnavailable: string;
  summary: {
    listings: (count: number) => string;
    planned: (count: number) => string;
    administrative: (count: number) => string;
    planning: (count: number) => string;
    futureTransport: (count: number) => string;
    risks: (count: number) => string;
    infrastructure: (count: number) => string;
  };
  radius: {
    listings: string;
    planned: string;
    infrastructure: string;
    investment: string;
    risk: string;
  };
  layers: Record<PropertyMapLayerLabel, string>;
  legend: {
    growth: string;
    risk: string;
    planned: string;
    boundaries: string;
    planning: string;
    futureTransport: string;
    riskZones: string;
    infrastructure: string;
    cluster: string;
    price: string;
  };
  popup: {
    listing: string;
    investment: string;
    risk: string;
    plannedInvestment: string;
    plannedLayer: string;
    infrastructure: string;
    transport: string;
    school: string;
    kindergarten: string;
    amenity: string;
    industrialZone: string;
    lines: string;
    unknown: string;
    impactRadius: string;
  };
};

export const PROPERTY_MAP_COPY: Record<Locale, PropertyMapCopy> = {
  pl: {
    mapLabel: "Mapa nieruchomości",
    radiusLabel: "Analiza odległości od środka mapy",
    layersLabel: "Warstwy mapy",
    legendLabel: "Legenda mapy",
    loading: "Ładowanie warstw mapy...",
    priceUnavailable: "cena niedostępna",
    summary: {
      listings: (count) => `${count} ofert`,
      planned: (count) => `${count} planowanych inwestycji`,
      administrative: (count) => `${count} obszarów administracyjnych`,
      planning: (count) => `${count} obszarów planistycznych`,
      futureTransport: (count) => `${count} przyszłych tras`,
      risks: (count) => `${count} stref ryzyka`,
      infrastructure: (count) => `${count} obiektów infrastruktury`,
    },
    radius: { listings: "of.", planned: "pl.", infrastructure: "inf.", investment: "I", risk: "R" },
    layers: {
      listings: "Oferty", priceHeatmap: "Cena/m²", planned: "Planowane inwestycje",
      administrative: "Granice administracyjne", districts: "Osiedla", municipalities: "Gminy",
      voivodeshipBoundary: "Województwo", futureTransport: "Planowane trasy",
      futureTramLines: "Linie tramwajowe", futureBusRoutes: "Trasy autobusowe",
      futureRoadCorridors: "Korytarze drogowe", planning: "MPZP / Studium", mpzpZones: "MPZP",
      studiumZones: "Studium", riskLayers: "Ryzyka", majorRoadNoise: "Drogi / hałas",
      industrialRisk: "Strefy przemysłowe", railAirportRisk: "Kolej / lotnisko",
      floodPollutionRisk: "Powódź / zanieczyszczenia", infrastructure: "Infrastruktura",
      transportRoutes: "Trasy", transportStops: "Przystanki", schools: "Szkoły",
      kindergartens: "Przedszkola", amenities: "Udogodnienia", amenityParks: "Parki",
      amenityHealthcare: "Opieka zdrowotna", amenityRetail: "Handel",
      amenityJobsEducation: "Praca / nauka", amenityPublicServices: "Usługi publiczne",
      industrialZones: "Strefy przemysłowe",
    },
    legend: { growth: "wzrost", risk: "ryzyko", planned: "plan", boundaries: "granice", planning: "MPZP", futureTransport: "przyszłe trasy", riskZones: "strefy ryzyka", infrastructure: "infrastruktura", cluster: "grupa", price: "cena/m²" },
    popup: { listing: "Oferta", investment: "Potencjał", risk: "Ryzyko", plannedInvestment: "Planowana inwestycja", plannedLayer: "Warstwa planowanych inwestycji.", infrastructure: "Infrastruktura", transport: "Transport", school: "Szkoła", kindergarten: "Przedszkole", amenity: "Udogodnienie", industrialZone: "Strefa przemysłowa", lines: "linie", unknown: "brak danych", impactRadius: "zasięg oddziaływania" },
  },
  en: {
    mapLabel: "Property map", radiusLabel: "Distance from map center", layersLabel: "Map layers",
    legendLabel: "Map legend", loading: "Loading map layers...", priceUnavailable: "price unavailable",
    summary: { listings: (count) => `${count} listings`, planned: (count) => `${count} planned investments`, administrative: (count) => `${count} administrative areas`, planning: (count) => `${count} planning areas`, futureTransport: (count) => `${count} future routes`, risks: (count) => `${count} risk zones`, infrastructure: (count) => `${count} infrastructure points` },
    radius: { listings: "list.", planned: "plan.", infrastructure: "infra.", investment: "I", risk: "R" },
    layers: {
      listings: "Listings", priceHeatmap: "Price/m²", planned: "Planned investments",
      administrative: "Administrative boundaries", districts: "Districts", municipalities: "Municipalities",
      voivodeshipBoundary: "Voivodeship", futureTransport: "Future routes", futureTramLines: "Tram lines",
      futureBusRoutes: "Bus routes", futureRoadCorridors: "Road corridors", planning: "MPZP / Studium",
      mpzpZones: "MPZP", studiumZones: "Studium", riskLayers: "Risks", majorRoadNoise: "Roads / noise",
      industrialRisk: "Industrial buffers", railAirportRisk: "Rail / airport",
      floodPollutionRisk: "Flood / pollution", infrastructure: "Infrastructure", transportRoutes: "Routes",
      transportStops: "Stops", schools: "Schools", kindergartens: "Kindergartens", amenities: "Amenities",
      amenityParks: "Parks", amenityHealthcare: "Healthcare", amenityRetail: "Retail",
      amenityJobsEducation: "Jobs / education", amenityPublicServices: "Public services",
      industrialZones: "Industrial zones",
    },
    legend: { growth: "growth", risk: "risk", planned: "planned", boundaries: "boundaries", planning: "MPZP", futureTransport: "future routes", riskZones: "risk zones", infrastructure: "infrastructure", cluster: "cluster", price: "price/m²" },
    popup: { listing: "Listing", investment: "Investment", risk: "Risk", plannedInvestment: "Planned investment", plannedLayer: "Planned investment layer.", infrastructure: "Infrastructure", transport: "Transport", school: "School", kindergarten: "Kindergarten", amenity: "Amenity", industrialZone: "Industrial zone", lines: "lines", unknown: "unknown", impactRadius: "impact radius" },
  },
  ru: {
    mapLabel: "Карта объектов", radiusLabel: "Анализ расстояния от центра карты", layersLabel: "Слои карты",
    legendLabel: "Легенда карты", loading: "Загрузка слоев карты...", priceUnavailable: "цена недоступна",
    summary: { listings: (count) => `${count} объектов`, planned: (count) => `${count} планируемых инвестиций`, administrative: (count) => `${count} административных зон`, planning: (count) => `${count} планировочных зон`, futureTransport: (count) => `${count} будущих маршрутов`, risks: (count) => `${count} зон риска`, infrastructure: (count) => `${count} объектов инфраструктуры` },
    radius: { listings: "об.", planned: "пл.", infrastructure: "инф.", investment: "И", risk: "Р" },
    layers: {
      listings: "Объекты", priceHeatmap: "Цена/м²", planned: "Планы", administrative: "Административные слои",
      districts: "Районы", municipalities: "Гмины", voivodeshipBoundary: "Воеводство",
      futureTransport: "Будущие маршруты", futureTramLines: "Трамвайные линии",
      futureBusRoutes: "Автобусные маршруты", futureRoadCorridors: "Будущие дороги",
      planning: "MPZP / Studium", mpzpZones: "MPZP", studiumZones: "Studium", riskLayers: "Риски",
      majorRoadNoise: "Дороги / шум", industrialRisk: "Промышленные зоны", railAirportRisk: "ЖД / аэропорт",
      floodPollutionRisk: "Наводнение / загрязнение", infrastructure: "Инфраструктура", transportRoutes: "Маршруты",
      transportStops: "Остановки", schools: "Школы", kindergartens: "Детские сады", amenities: "Удобства",
      amenityParks: "Парки", amenityHealthcare: "Медицина", amenityRetail: "Магазины",
      amenityJobsEducation: "Работа / учеба", amenityPublicServices: "Госуслуги", industrialZones: "Промзоны",
    },
    legend: { growth: "рост", risk: "риск", planned: "план", boundaries: "границы", planning: "MPZP", futureTransport: "будущие маршруты", riskZones: "зоны риска", infrastructure: "инфраструктура", cluster: "группа", price: "цена/м²" },
    popup: { listing: "Объект", investment: "Инвестиционный потенциал", risk: "Риск", plannedInvestment: "Планируемая инвестиция", plannedLayer: "Слой планируемых инвестиций.", infrastructure: "Инфраструктура", transport: "Транспорт", school: "Школа", kindergarten: "Детский сад", amenity: "Удобство", industrialZone: "Промышленная зона", lines: "линии", unknown: "нет данных", impactRadius: "радиус влияния" },
  },
  uk: {
    mapLabel: "Карта об'єктів", radiusLabel: "Аналіз відстані від центру карти", layersLabel: "Шари карти",
    legendLabel: "Легенда карти", loading: "Завантаження шарів карти...", priceUnavailable: "ціна недоступна",
    summary: { listings: (count) => `${count} об'єктів`, planned: (count) => `${count} запланованих інвестицій`, administrative: (count) => `${count} адміністративних зон`, planning: (count) => `${count} планувальних зон`, futureTransport: (count) => `${count} майбутніх маршрутів`, risks: (count) => `${count} зон ризику`, infrastructure: (count) => `${count} об'єктів інфраструктури` },
    radius: { listings: "об.", planned: "пл.", infrastructure: "інф.", investment: "І", risk: "Р" },
    layers: {
      listings: "Об'єкти", priceHeatmap: "Ціна/м²", planned: "Плани", administrative: "Адміністративні межі",
      districts: "Райони", municipalities: "Гміни", voivodeshipBoundary: "Воєводство",
      futureTransport: "Майбутні маршрути", futureTramLines: "Трамвайні лінії",
      futureBusRoutes: "Автобусні маршрути", futureRoadCorridors: "Майбутні дороги",
      planning: "MPZP / Studium", mpzpZones: "MPZP", studiumZones: "Studium", riskLayers: "Ризики",
      majorRoadNoise: "Дороги / шум", industrialRisk: "Промислові зони", railAirportRisk: "Залізниця / аеропорт",
      floodPollutionRisk: "Повінь / забруднення", infrastructure: "Інфраструктура", transportRoutes: "Маршрути",
      transportStops: "Зупинки", schools: "Школи", kindergartens: "Дитячі садки", amenities: "Зручності",
      amenityParks: "Парки", amenityHealthcare: "Медицина", amenityRetail: "Магазини",
      amenityJobsEducation: "Робота / навчання", amenityPublicServices: "Державні послуги",
      industrialZones: "Промислові зони",
    },
    legend: { growth: "зростання", risk: "ризик", planned: "план", boundaries: "межі", planning: "MPZP", futureTransport: "майбутні маршрути", riskZones: "зони ризику", infrastructure: "інфраструктура", cluster: "група", price: "ціна/м²" },
    popup: { listing: "Об'єкт", investment: "Інвестиційний потенціал", risk: "Ризик", plannedInvestment: "Запланована інвестиція", plannedLayer: "Шар запланованих інвестицій.", infrastructure: "Інфраструктура", transport: "Транспорт", school: "Школа", kindergarten: "Дитячий садок", amenity: "Зручність", industrialZone: "Промислова зона", lines: "лінії", unknown: "немає даних", impactRadius: "радіус впливу" },
  },
};
