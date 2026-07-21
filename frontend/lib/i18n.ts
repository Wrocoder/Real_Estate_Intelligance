export const SUPPORTED_LOCALES = ["en", "pl", "ru", "uk"] as const;
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_STORAGE_KEY = "domarion-locale";
export const LOCALE_COOKIE_NAME = "domarion_locale";
export const LOCALE_CHANGED_EVENT = "domarion:locale-changed";

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleOption = {
  code: Locale;
  nativeName: string;
  englishName: string;
  shortLabel: string;
};

export type NavigationLabelKey =
  | "beta"
  | "realtors"
  | "guides"
  | "explorer"
  | "check"
  | "reports"
  | "compare"
  | "areas"
  | "developers"
  | "news"
  | "market"
  | "mortgage"
  | "pricing"
  | "alerts"
  | "account"
  | "admin"
  | "api";

export type OptionLabelMap = Record<string, string>;

export type ExplorerCopy = {
  title: string;
  subtitle: string;
  actions: {
    refresh: string;
    hiddenGems: string;
    compare: (count: number) => string;
    alert: string;
    apply: string;
    reset: string;
    reports: string;
    favorite: string;
  };
  metrics: {
    found: string;
    bestGem: string;
    bestInvestment: string;
    medianArea: string;
    priceTrend90d: string;
  };
  filters: {
    title: string;
    search: string;
    searchPlaceholder: string;
    municipality: string;
    wroclawCity: string;
    voivodeship: string;
    all: string;
    district: string;
    allDistricts: string;
    rooms: string;
    any: string;
    anyMasculine: string;
    maxPrice: string;
    buildingType: string;
    renovationState: string;
    balcony: string;
    terrace: string;
    garden: string;
    elevator: string;
    parking: string;
    heating: string;
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
    requireDeveloper: string;
    excludeDeveloperRisk: string;
    radiusFromCenter: string;
    wholeWroclaw: string;
    maxCenterKm: string;
    maxStopM: string;
    maxSchoolM: string;
    minMajorRoadM: string;
    minIndustrialZoneM: string;
    mode: string;
    standardMode: string;
    sort: string;
    pageSize: string;
  };
  optionLabels: {
    buildingType: OptionLabelMap;
    renovationState: OptionLabelMap;
    parkingType: OptionLabelMap;
    heatingType: OptionLabelMap;
    sort: OptionLabelMap;
  };
  status: {
    loading: string;
    backendUnavailable: string;
    filtersReset: string;
    compareLimit: string;
    favoriteAdded: string;
    alertCreated: string;
    mapLoading: string;
    mapUnavailable: string;
    found: (total: number, page: number, totalPages: number) => string;
    hiddenGems: (total: number, page: number, totalPages: number) => string;
    reportSaved: (reportId: string) => string;
    mapLoaded: (listingCount: number, investmentCount: number, infrastructureCount: number) => string;
  };
  state: {
    loadingData: string;
    errorPrefix: string;
    emptyResults: string;
    hiddenGemsOnPage: (count: number) => string;
  };
  pagination: {
    previous: string;
    next: string;
    page: (page: number, totalPages: number) => string;
  };
  map: {
    title: string;
  };
  savedSearchName: string;
  favoriteNote: string;
};

export type ListingCardCopy = {
  compareTitle: string;
  compare: string;
  favoriteTitle: string;
  reportTitle: string;
  open: string;
  pricePerM2: string;
  rooms: (count: number) => string;
  days: (count: number) => string;
  scorePrefixes: {
    investment: string;
    risk: string;
    negotiation: string;
  };
  attributes: OptionLabelMap;
  parking: (value: string) => string;
  heating: (value: string) => string;
};

export type CheckPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    history: string;
    getReport: string;
    check: string;
    acceptAndReport: string;
    retryImport: string;
    linkAndParamsReport: string;
    refresh: string;
    generateReport: string;
    saveToHistory: string;
    save: string;
    answer: string;
  };
  sections: {
    sourceLink: string;
    objectParams: string;
    result: string;
    aiAssistant: string;
    conclusions: string;
    negotiation: string;
    comparables: string;
    buyerReport: string;
  };
  fields: {
    title: string;
    developer: string;
    investment: string;
    address: string;
    city: string;
    district: string;
    market: string;
    price: string;
    area: string;
    rooms: string;
    floor: string;
    buildingFloors: string;
    buildingYear: string;
    privateAnalysis: string;
    audience: string;
    topic: string;
    question: string;
  };
  placeholders: {
    sourceUrl: string;
    optional: string;
    customQuestion: string;
  };
  metrics: {
    verdict: string;
    investmentScore: string;
    riskScore: string;
    fairPriceMid: string;
    confidence: string;
    priceLabel: string;
    provider: string;
    domain: string;
    reference: string;
    requiredFields: string;
    importStatus: string;
    extracted: string;
    http: string;
    source: string;
    objectPrice: string;
    pricePerM2: string;
    fairPriceRange: string;
    comparableListings: string;
    sourceDomain: string;
    privateDraft: string;
    expires: string;
  };
  statuses: {
    ready: string;
    noLink: string;
    linkNotChecked: string;
    importNotStarted: string;
    reportNotCreated: string;
    notSaved: string;
    aiReadyAfterCheck: string;
    aiQuestionsUnavailable: string;
    calculating: string;
    checkReady: string;
    checkError: string;
    loadingLink: string;
    autoImporting: string;
    linkAcceptedNoParams: string;
    reportNoListingData: string;
    linkAcceptedMissingFields: string;
    missingFields: (fields: string) => string;
    fieldsUpdated: string;
    linkError: string;
    importError: string;
    fillRequiredForReport: string;
    reportGenerating: string;
    reportReady: string;
    reportError: string;
    saving: string;
    saved: string;
    saveError: string;
    aiReady: string;
    aiNeedsDraft: string;
    aiDraftRequired: string;
    aiBuilding: string;
    aiRefused: string;
    aiSaved: (id: string) => string;
    aiUnavailable: string;
    importExtracted: (count: number) => string;
    importPartial: (count: number) => string;
    importUnsupported: string;
    importFailed: string;
  };
  requiredFieldLabels: {
    address: string;
    city: string;
    district: string;
    price: string;
    area_m2: string;
    rooms: string;
  };
  values: {
    manual: string;
    manualInput: string;
    notSaved: string;
    noDraft: string;
    dash: string;
    primary: string;
    secondary: string;
    buyer: string;
    realtor: string;
    investor: string;
    refused: string;
    sourceGrounded: string;
    html: string;
  };
  table: {
    object: string;
    district: string;
    price: string;
    area: string;
    rooms: string;
    pricePerM2: string;
  };
  empty: {
    noResult: string;
    aiReady: string;
    aiNeedsSavedDraft: string;
    noData: string;
  };
  developer: {
    title: string;
    profile: string;
    ratingLine: (rating: number, confidence: number) => string;
    projectsLine: (completed: number, active: number) => string;
    labels: Record<string, string>;
  };
  assistantColumn: {
    keyPoints: string;
    sources: string;
    guardrails: string;
  };
  fallbackQuestion: {
    label: string;
    description: string;
  };
  errorPrefix: string;
};

export type CheckDraftsPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    newCheck: string;
    refresh: string;
    report: string;
    mockPay: string;
    delete: string;
    html: string;
  };
  sections: {
    history: string;
  };
  table: {
    object: string;
    parameters: string;
    score: string;
    privateRef: string;
    retention: string;
    actions: string;
  };
  statuses: {
    loading: string;
    loaded: (count: number) => string;
    backendUnavailable: string;
    deleting: string;
    deleteError: string;
    deleted: string;
    reportGenerating: string;
    reportSaved: (reportId: string) => string;
    reportError: string;
    orderCreating: string;
    mockPayment: (orderId: string) => string;
    paidReportReady: (orderId: string) => string;
    paymentError: string;
  };
  values: {
    manualInput: string;
    rooms: (count: number) => string;
    dataQualityPrefix: string;
  };
  retention: {
    expired: string;
    expiresToday: string;
    daysLeft: (days: number) => string;
  };
  empty: {
    noDrafts: string;
    loading: string;
  };
  errorPrefix: string;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en", nativeName: "English", englishName: "English", shortLabel: "EN" },
  { code: "pl", nativeName: "Polski", englishName: "Polish", shortLabel: "PL" },
  { code: "ru", nativeName: "Русский", englishName: "Russian", shortLabel: "RU" },
  { code: "uk", nativeName: "Українська", englishName: "Ukrainian", shortLabel: "UK" },
];

export const NAVIGATION_LABELS: Record<Locale, Record<NavigationLabelKey, string>> = {
  en: {
    beta: "Beta",
    realtors: "Realtors",
    guides: "Guides",
    explorer: "Search",
    check: "Check apartment",
    reports: "Reports",
    compare: "Compare",
    areas: "Areas",
    developers: "Developers",
    news: "News",
    market: "Market",
    mortgage: "Mortgage",
    pricing: "Pricing",
    alerts: "Alerts",
    account: "Account",
    admin: "Admin",
    api: "API",
  },
  pl: {
    beta: "Beta",
    realtors: "Pośrednicy",
    guides: "Poradniki",
    explorer: "Wyszukiwarka",
    check: "Sprawdź mieszkanie",
    reports: "Raporty",
    compare: "Porównanie",
    areas: "Dzielnice",
    developers: "Deweloperzy",
    news: "Aktualności",
    market: "Rynek",
    mortgage: "Kredyt",
    pricing: "Płatności",
    alerts: "Alerty",
    account: "Konto",
    admin: "Admin",
    api: "API",
  },
  ru: {
    beta: "Beta",
    realtors: "Риелторы",
    guides: "Гайды",
    explorer: "Подбор",
    check: "Проверка",
    reports: "Отчеты",
    compare: "Сравнение",
    areas: "Районы",
    developers: "Застройщики",
    news: "Новости",
    market: "Рынок",
    mortgage: "Ипотека",
    pricing: "Оплата",
    alerts: "Уведомления",
    account: "Аккаунт",
    admin: "Admin",
    api: "API",
  },
  uk: {
    beta: "Beta",
    realtors: "Рієлтори",
    guides: "Гайди",
    explorer: "Підбір",
    check: "Перевірка",
    reports: "Звіти",
    compare: "Порівняння",
    areas: "Райони",
    developers: "Забудовники",
    news: "Новини",
    market: "Ринок",
    mortgage: "Іпотека",
    pricing: "Оплата",
    alerts: "Сповіщення",
    account: "Акаунт",
    admin: "Admin",
    api: "API",
  },
};

export const LANGUAGE_SWITCHER_LABELS: Record<
  Locale,
  { label: string; ariaLabel: string; menuLabel: string }
> = {
  en: {
    label: "Language",
    ariaLabel: "Choose interface language",
    menuLabel: "Interface language",
  },
  pl: {
    label: "Język",
    ariaLabel: "Wybierz język interfejsu",
    menuLabel: "Język interfejsu",
  },
  ru: {
    label: "Язык",
    ariaLabel: "Выбрать язык интерфейса",
    menuLabel: "Язык интерфейса",
  },
  uk: {
    label: "Мова",
    ariaLabel: "Вибрати мову інтерфейсу",
    menuLabel: "Мова інтерфейсу",
  },
};

export const LISTING_CARD_COPY: Record<Locale, ListingCardCopy> = {
  en: {
    compareTitle: "Add to comparison",
    compare: "Compare",
    favoriteTitle: "Add to favorites",
    reportTitle: "Generate report",
    open: "Open",
    pricePerM2: "m2",
    rooms: (count) => `${count} room${count === 1 ? "" : "s"}`,
    days: (count) => `${count} day${count === 1 ? "" : "s"}`,
    scorePrefixes: { investment: "I", risk: "R", negotiation: "N" },
    attributes: {
      apartment_block: "Apartment block",
      low_rise_block: "Low-rise block",
      tenement: "Tenement",
      detached_house: "House",
      developer_standard: "Developer standard",
      ready_to_move_in: "Ready to move in",
      needs_refresh: "Needs refresh",
      needs_renovation: "Needs renovation",
      balcony: "Balcony",
      terrace: "Terrace",
      garden: "Garden",
      elevator: "Elevator",
      underground: "Underground",
      garage: "Garage",
      surface: "Surface",
      street: "Street",
      municipal: "District heating",
      gas: "Gas",
      electric: "Electric",
      heat_pump: "Heat pump",
    },
    parking: (value) => `Parking: ${value}`,
    heating: (value) => `Heating: ${value}`,
  },
  pl: {
    compareTitle: "Dodaj do porównania",
    compare: "Porównaj",
    favoriteTitle: "Dodaj do ulubionych",
    reportTitle: "Wygeneruj raport",
    open: "Otwórz",
    pricePerM2: "m2",
    rooms: (count) => `${count} pok.`,
    days: (count) => `${count} dni`,
    scorePrefixes: { investment: "I", risk: "R", negotiation: "N" },
    attributes: {
      apartment_block: "Blok",
      low_rise_block: "Niska zabudowa",
      tenement: "Kamienica",
      detached_house: "Dom",
      developer_standard: "Stan deweloperski",
      ready_to_move_in: "Gotowe do zamieszkania",
      needs_refresh: "Do odświeżenia",
      needs_renovation: "Do remontu",
      balcony: "Balkon",
      terrace: "Taras",
      garden: "Ogród",
      elevator: "Winda",
      underground: "Podziemny",
      garage: "Garaż",
      surface: "Naziemny",
      street: "Uliczny",
      municipal: "Miejskie",
      gas: "Gazowe",
      electric: "Elektryczne",
      heat_pump: "Pompa ciepła",
    },
    parking: (value) => `Parking: ${value}`,
    heating: (value) => `Ogrzewanie: ${value}`,
  },
  ru: {
    compareTitle: "Добавить в сравнение",
    compare: "Сравнить",
    favoriteTitle: "Добавить в избранное",
    reportTitle: "Сгенерировать отчет",
    open: "Открыть",
    pricePerM2: "m2",
    rooms: (count) => `${count} ${pluralRu(count, "комната", "комнаты", "комнат")}`,
    days: (count) => `${count} ${pluralRu(count, "день", "дня", "дней")}`,
    scorePrefixes: { investment: "I", risk: "R", negotiation: "N" },
    attributes: {
      apartment_block: "Блок / многоквартирный",
      low_rise_block: "Низкая застройка",
      tenement: "Каменица",
      detached_house: "Дом",
      developer_standard: "Стандарт застройщика",
      ready_to_move_in: "Готово к въезду",
      needs_refresh: "Требует освежения",
      needs_renovation: "Требует ремонта",
      balcony: "Балкон",
      terrace: "Терраса",
      garden: "Сад",
      elevator: "Лифт",
      underground: "Подземный",
      garage: "Гараж",
      surface: "Наземный",
      street: "Уличный",
      municipal: "Городское",
      gas: "Газовое",
      electric: "Электрическое",
      heat_pump: "Тепловой насос",
    },
    parking: (value) => `Парковка: ${value}`,
    heating: (value) => `Отопление: ${value}`,
  },
  uk: {
    compareTitle: "Додати до порівняння",
    compare: "Порівняти",
    favoriteTitle: "Додати в обране",
    reportTitle: "Згенерувати звіт",
    open: "Відкрити",
    pricePerM2: "m2",
    rooms: (count) => `${count} ${pluralUk(count, "кімната", "кімнати", "кімнат")}`,
    days: (count) => `${count} днів`,
    scorePrefixes: { investment: "I", risk: "R", negotiation: "N" },
    attributes: {
      apartment_block: "Блок / багатоквартирний",
      low_rise_block: "Низька забудова",
      tenement: "Кам'яниця",
      detached_house: "Будинок",
      developer_standard: "Стандарт забудовника",
      ready_to_move_in: "Готове до заселення",
      needs_refresh: "Потребує освіження",
      needs_renovation: "Потребує ремонту",
      balcony: "Балкон",
      terrace: "Тераса",
      garden: "Сад",
      elevator: "Ліфт",
      underground: "Підземний",
      garage: "Гараж",
      surface: "Наземний",
      street: "Вуличний",
      municipal: "Міське",
      gas: "Газове",
      electric: "Електричне",
      heat_pump: "Тепловий насос",
    },
    parking: (value) => `Паркування: ${value}`,
    heating: (value) => `Опалення: ${value}`,
  },
};

export const CHECK_PAGE_COPY: Record<Locale, CheckPageCopy> = {
  en: {
    title: "Check apartment",
    subtitle: "Address, listing parameters, fair price, risks, negotiation and nearest comparables.",
    actions: {
      history: "History",
      getReport: "Get report",
      check: "Check",
      acceptAndReport: "Accept and get report",
      retryImport: "Retry import",
      linkAndParamsReport: "Link + parameters -> report",
      refresh: "Refresh",
      generateReport: "Generate report",
      saveToHistory: "Save to history",
      save: "Save",
      answer: "Answer",
    },
    sections: {
      sourceLink: "Listing link",
      objectParams: "Object parameters",
      result: "Check result",
      aiAssistant: "AI assistant for private draft",
      conclusions: "Conclusions",
      negotiation: "Negotiation",
      comparables: "Comparison base",
      buyerReport: "Buyer report",
    },
    fields: {
      title: "Title",
      developer: "Developer",
      investment: "Investment / project",
      address: "Address",
      city: "City",
      district: "District",
      market: "Market",
      price: "Price",
      area: "Area m2",
      rooms: "Rooms",
      floor: "Floor",
      buildingFloors: "Building floors",
      buildingYear: "Building year",
      privateAnalysis: "private analysis",
      audience: "Audience",
      topic: "Topic",
      question: "Question",
    },
    placeholders: {
      sourceUrl: "https://www.otodom.pl/...",
      optional: "optional",
      customQuestion: "Example: what risks should I check before zadatek?",
    },
    metrics: {
      verdict: "Verdict",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      fairPriceMid: "Fair price mid",
      confidence: "Confidence",
      priceLabel: "Price label",
      provider: "Provider",
      domain: "Domain",
      reference: "Reference",
      requiredFields: "Required fields",
      importStatus: "Import status",
      extracted: "Extracted",
      http: "HTTP",
      source: "Source",
      objectPrice: "Object price",
      pricePerM2: "Price per m2",
      fairPriceRange: "Fair price range",
      comparableListings: "Comparable listings",
      sourceDomain: "Source domain",
      privateDraft: "Private draft",
      expires: "Expires",
    },
    statuses: {
      ready: "Ready to check",
      noLink: "No link added",
      linkNotChecked: "Link not checked",
      importNotStarted: "Auto-import has not run",
      reportNotCreated: "Report not created",
      notSaved: "Not saved",
      aiReadyAfterCheck: "AI assistant is ready after a check",
      aiQuestionsUnavailable: "AI questions unavailable",
      calculating: "Calculating...",
      checkReady: "Check ready",
      checkError: "Check error",
      loadingLink: "Loading link...",
      autoImporting: "Auto-import...",
      linkAcceptedNoParams: "Link accepted, but the portal did not return parameters",
      reportNoListingData: "Report not created: no listing data",
      linkAcceptedMissingFields: "Link accepted, but required fields are missing",
      missingFields: (fields) => `Missing: ${fields}`,
      fieldsUpdated: "Fields updated from link",
      linkError: "Link error",
      importError: "Auto-import error",
      fillRequiredForReport: "Fill required fields to create a report",
      reportGenerating: "Generating...",
      reportReady: "Report ready",
      reportError: "Report error",
      saving: "Saving...",
      saved: "Saved",
      saveError: "Save error",
      aiReady: "AI assistant ready",
      aiNeedsDraft: "AI assistant needs a saved draft",
      aiDraftRequired: "Get a check with saved draft first",
      aiBuilding: "AI answer is being built...",
      aiRefused: "AI answer refused by guardrail rules",
      aiSaved: (id) => `AI answer saved: ${id}`,
      aiUnavailable: "AI answer unavailable",
      importExtracted: (count) => `Auto-import: filled ${count} fields`,
      importPartial: (count) => `Partial auto-import: filled ${count} fields`,
      importUnsupported: "Auto-import is available only for Otodom/OLX",
      importFailed: "Auto-import did not extract parameters, fill fields manually",
    },
    requiredFieldLabels: {
      address: "address",
      city: "city",
      district: "district",
      price: "price",
      area_m2: "area",
      rooms: "rooms",
    },
    values: {
      manual: "manual",
      manualInput: "manual input",
      notSaved: "not saved",
      noDraft: "no draft",
      dash: "-",
      primary: "primary",
      secondary: "secondary",
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
      html: "HTML",
    },
    table: {
      object: "Object",
      district: "District",
      price: "Price",
      area: "m2",
      rooms: "Rooms",
      pricePerM2: "Price/m2",
    },
    empty: {
      noResult: "Enter parameters and run the check.",
      aiReady: "AI answer will appear after a question for the saved private draft.",
      aiNeedsSavedDraft: "AI assistant needs a saved draft: run the check or report again.",
      noData: "No data.",
    },
    developer: {
      title: "Developer",
      profile: "Developer profile",
      ratingLine: (rating, confidence) => `Rating ${rating}/100, confidence ${confidence}/100.`,
      projectsLine: (completed, active) =>
        `Completed projects: ${completed}; active: ${active}.`,
      labels: {
        strong: "strong",
        good: "good",
        mixed: "mixed",
        limited_data: "limited data",
        risk_review: "review",
      },
    },
    assistantColumn: {
      keyPoints: "Key points",
      sources: "Sources",
      guardrails: "Guardrails",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Sprawdź mieszkanie",
    subtitle: "Adres, parametry oferty, fair price, ryzyka, negocjacje i najbliższe porównania.",
    actions: {
      history: "Historia",
      getReport: "Pobierz raport",
      check: "Sprawdź",
      acceptAndReport: "Akceptuj i pobierz raport",
      retryImport: "Ponów import",
      linkAndParamsReport: "Link + parametry -> raport",
      refresh: "Odśwież",
      generateReport: "Wygeneruj raport",
      saveToHistory: "Zapisz w historii",
      save: "Zapisz",
      answer: "Odpowiedz",
    },
    sections: {
      sourceLink: "Link do ogłoszenia",
      objectParams: "Parametry obiektu",
      result: "Wynik sprawdzenia",
      aiAssistant: "AI assistant dla private draft",
      conclusions: "Wnioski",
      negotiation: "Negocjacje",
      comparables: "Baza porównań",
      buyerReport: "Raport kupującego",
    },
    fields: {
      title: "Tytuł",
      developer: "Deweloper",
      investment: "Inwestycja / projekt",
      address: "Adres",
      city: "Miasto",
      district: "Dzielnica",
      market: "Rynek",
      price: "Cena",
      area: "Powierzchnia m2",
      rooms: "Pokoje",
      floor: "Piętro",
      buildingFloors: "Pięter w budynku",
      buildingYear: "Rok budynku",
      privateAnalysis: "analiza prywatna",
      audience: "Odbiorca",
      topic: "Temat",
      question: "Pytanie",
    },
    placeholders: {
      sourceUrl: "https://www.otodom.pl/...",
      optional: "opcjonalnie",
      customQuestion: "Np.: jakie ryzyka sprawdzić przed zadatkiem?",
    },
    metrics: {
      verdict: "Werdykt",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      fairPriceMid: "Fair price mid",
      confidence: "Pewność",
      priceLabel: "Ocena ceny",
      provider: "Provider",
      domain: "Domena",
      reference: "Reference",
      requiredFields: "Wymagane pola",
      importStatus: "Status importu",
      extracted: "Wyciągnięto",
      http: "HTTP",
      source: "Źródło",
      objectPrice: "Cena obiektu",
      pricePerM2: "Cena za m2",
      fairPriceRange: "Fair price range",
      comparableListings: "Oferty porównawcze",
      sourceDomain: "Domena źródła",
      privateDraft: "Private draft",
      expires: "Wygasa",
    },
    statuses: {
      ready: "Gotowe do sprawdzenia",
      noLink: "Nie dodano linku",
      linkNotChecked: "Link niesprawdzony",
      importNotStarted: "Auto-import nie był uruchomiony",
      reportNotCreated: "Raport nieutworzony",
      notSaved: "Nie zapisano",
      aiReadyAfterCheck: "AI assistant będzie gotowy po sprawdzeniu",
      aiQuestionsUnavailable: "AI questions niedostępne",
      calculating: "Liczenie...",
      checkReady: "Sprawdzenie gotowe",
      checkError: "Błąd sprawdzenia",
      loadingLink: "Ładowanie linku...",
      autoImporting: "Auto-import...",
      linkAcceptedNoParams: "Link przyjęty, ale portal nie zwrócił parametrów",
      reportNoListingData: "Raport nieutworzony: brak danych ogłoszenia",
      linkAcceptedMissingFields: "Link przyjęty, ale brakuje wymaganych pól",
      missingFields: (fields) => `Brakuje: ${fields}`,
      fieldsUpdated: "Pola uzupełnione z linku",
      linkError: "Błąd linku",
      importError: "Błąd auto-importu",
      fillRequiredForReport: "Uzupełnij wymagane pola, aby stworzyć raport",
      reportGenerating: "Generowanie...",
      reportReady: "Raport gotowy",
      reportError: "Błąd raportu",
      saving: "Zapisywanie...",
      saved: "Zapisano",
      saveError: "Błąd zapisu",
      aiReady: "AI assistant gotowy",
      aiNeedsDraft: "AI assistant wymaga saved draft",
      aiDraftRequired: "Najpierw wykonaj sprawdzenie z saved draft",
      aiBuilding: "AI answer jest generowany...",
      aiRefused: "AI answer odrzucony przez guardrail rules",
      aiSaved: (id) => `AI answer zapisany: ${id}`,
      aiUnavailable: "AI answer niedostępny",
      importExtracted: (count) => `Auto-import: uzupełniono ${count} pól`,
      importPartial: (count) => `Częściowy auto-import: uzupełniono ${count} pól`,
      importUnsupported: "Auto-import jest dostępny tylko dla Otodom/OLX",
      importFailed: "Auto-import nie pobrał parametrów, uzupełnij pola ręcznie",
    },
    requiredFieldLabels: {
      address: "adres",
      city: "miasto",
      district: "dzielnica",
      price: "cena",
      area_m2: "powierzchnia",
      rooms: "pokoje",
    },
    values: {
      manual: "ręcznie",
      manualInput: "ręczne dane",
      notSaved: "nie zapisano",
      noDraft: "brak draftu",
      dash: "-",
      primary: "pierwotny",
      secondary: "wtórny",
      buyer: "Kupujący",
      realtor: "Pośrednik",
      investor: "Inwestor",
      refused: "Odrzucono",
      sourceGrounded: "Source-grounded",
      html: "HTML",
    },
    table: {
      object: "Obiekt",
      district: "Dzielnica",
      price: "Cena",
      area: "m2",
      rooms: "Pokoje",
      pricePerM2: "Cena/m2",
    },
    empty: {
      noResult: "Wprowadź parametry i uruchom sprawdzenie.",
      aiReady: "AI answer pojawi się po pytaniu do zapisanego private draft.",
      aiNeedsSavedDraft: "AI assistant wymaga saved draft: uruchom sprawdzenie lub raport ponownie.",
      noData: "Brak danych.",
    },
    developer: {
      title: "Deweloper",
      profile: "Profil dewelopera",
      ratingLine: (rating, confidence) => `Rating ${rating}/100, confidence ${confidence}/100.`,
      projectsLine: (completed, active) =>
        `Ukończone projekty: ${completed}; aktywne: ${active}.`,
      labels: {
        strong: "mocny",
        good: "dobry",
        mixed: "mieszany",
        limited_data: "mało danych",
        risk_review: "do sprawdzenia",
      },
    },
    assistantColumn: {
      keyPoints: "Kluczowe wnioski",
      sources: "Źródła",
      guardrails: "Guardrails",
    },
    fallbackQuestion: {
      label: "Podsumowanie obiektu",
      description: "Krótki source-grounded summary decyzji.",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Проверить квартиру",
    subtitle: "Адрес, параметры объекта, fair price, риски, торг и ближайшие аналоги.",
    actions: {
      history: "История",
      getReport: "Получить отчет",
      check: "Проверить",
      acceptAndReport: "Принять и получить отчет",
      retryImport: "Повторить импорт",
      linkAndParamsReport: "Ссылка + параметры -> отчет",
      refresh: "Обновить",
      generateReport: "Сгенерировать отчет",
      saveToHistory: "Сохранить в историю",
      save: "Сохранить",
      answer: "Ответить",
    },
    sections: {
      sourceLink: "Ссылка объявления",
      objectParams: "Параметры объекта",
      result: "Итог проверки",
      aiAssistant: "AI assistant по private draft",
      conclusions: "Выводы",
      negotiation: "Торг",
      comparables: "База сравнения",
      buyerReport: "Buyer report",
    },
    fields: {
      title: "Название",
      developer: "Застройщик",
      investment: "Инвестиция / проект",
      address: "Адрес",
      city: "Город",
      district: "Район",
      market: "Рынок",
      price: "Цена",
      area: "Площадь m2",
      rooms: "Комнаты",
      floor: "Этаж",
      buildingFloors: "Этажей в доме",
      buildingYear: "Год дома",
      privateAnalysis: "private analysis",
      audience: "Аудитория",
      topic: "Тема",
      question: "Вопрос",
    },
    placeholders: {
      sourceUrl: "https://www.otodom.pl/...",
      optional: "optional",
      customQuestion: "Например: какие риски проверить до zadatek?",
    },
    metrics: {
      verdict: "Вердикт",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      fairPriceMid: "Fair price mid",
      confidence: "Confidence",
      priceLabel: "Price label",
      provider: "Provider",
      domain: "Domain",
      reference: "Reference",
      requiredFields: "Required fields",
      importStatus: "Import status",
      extracted: "Extracted",
      http: "HTTP",
      source: "Source",
      objectPrice: "Цена объекта",
      pricePerM2: "Цена за m2",
      fairPriceRange: "Fair price range",
      comparableListings: "Comparable listings",
      sourceDomain: "Source domain",
      privateDraft: "Private draft",
      expires: "Expires",
    },
    statuses: {
      ready: "Готово к проверке",
      noLink: "Ссылка не добавлена",
      linkNotChecked: "Ссылка не проверена",
      importNotStarted: "Автоимпорт не запускался",
      reportNotCreated: "Отчет не создан",
      notSaved: "Не сохранен",
      aiReadyAfterCheck: "AI assistant готов после проверки",
      aiQuestionsUnavailable: "AI questions недоступны",
      calculating: "Расчет...",
      checkReady: "Проверка готова",
      checkError: "Ошибка проверки",
      loadingLink: "Загрузка ссылки...",
      autoImporting: "Автоимпорт...",
      linkAcceptedNoParams: "Ссылка принята, но портал не отдал параметры",
      reportNoListingData: "Отчет не создан: нет данных объявления",
      linkAcceptedMissingFields: "Ссылка принята, но нужны обязательные поля",
      missingFields: (fields) => `Не хватает: ${fields}`,
      fieldsUpdated: "Поля обновлены из ссылки",
      linkError: "Ошибка ссылки",
      importError: "Ошибка автоимпорта",
      fillRequiredForReport: "Заполните обязательные поля для отчета",
      reportGenerating: "Генерация...",
      reportReady: "Отчет готов",
      reportError: "Ошибка отчета",
      saving: "Сохранение...",
      saved: "Сохранен",
      saveError: "Ошибка сохранения",
      aiReady: "AI assistant готов",
      aiNeedsDraft: "AI assistant требует saved draft",
      aiDraftRequired: "Сначала нужно получить проверку с saved draft",
      aiBuilding: "AI answer строится...",
      aiRefused: "AI answer отклонен guardrail-правилом",
      aiSaved: (id) => `AI answer сохранен: ${id}`,
      aiUnavailable: "AI answer недоступен",
      importExtracted: (count) => `Автоимпорт: заполнено ${count} полей`,
      importPartial: (count) => `Автоимпорт частичный: заполнено ${count} полей`,
      importUnsupported: "Автоимпорт доступен только для Otodom/OLX",
      importFailed: "Автоимпорт не получил параметры, заполните поля вручную",
    },
    requiredFieldLabels: {
      address: "адрес",
      city: "город",
      district: "район",
      price: "цена",
      area_m2: "площадь",
      rooms: "комнаты",
    },
    values: {
      manual: "manual",
      manualInput: "manual input",
      notSaved: "not saved",
      noDraft: "no draft",
      dash: "-",
      primary: "primary",
      secondary: "secondary",
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
      html: "HTML",
    },
    table: {
      object: "Объект",
      district: "Район",
      price: "Цена",
      area: "m2",
      rooms: "Комнаты",
      pricePerM2: "Цена/m2",
    },
    empty: {
      noResult: "Введите параметры и запустите проверку.",
      aiReady: "AI answer появится после запроса по сохраненному private draft.",
      aiNeedsSavedDraft: "Для AI assistant нужен saved draft: запусти проверку или отчет заново.",
      noData: "Нет данных.",
    },
    developer: {
      title: "Застройщик",
      profile: "Профиль застройщика",
      ratingLine: (rating, confidence) =>
        `Рейтинг ${rating}/100, уверенность ${confidence}/100.`,
      projectsLine: (completed, active) =>
        `Сдано проектов: ${completed}; активных: ${active}.`,
      labels: {
        strong: "сильный",
        good: "хороший",
        mixed: "смешанный",
        limited_data: "мало данных",
        risk_review: "проверить",
      },
    },
    assistantColumn: {
      keyPoints: "Ключевые выводы",
      sources: "Источники",
      guardrails: "Guardrails",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Перевірити квартиру",
    subtitle: "Адреса, параметри об'єкта, fair price, ризики, торг і найближчі аналоги.",
    actions: {
      history: "Історія",
      getReport: "Отримати звіт",
      check: "Перевірити",
      acceptAndReport: "Прийняти й отримати звіт",
      retryImport: "Повторити імпорт",
      linkAndParamsReport: "Посилання + параметри -> звіт",
      refresh: "Оновити",
      generateReport: "Згенерувати звіт",
      saveToHistory: "Зберегти в історію",
      save: "Зберегти",
      answer: "Відповісти",
    },
    sections: {
      sourceLink: "Посилання оголошення",
      objectParams: "Параметри об'єкта",
      result: "Підсумок перевірки",
      aiAssistant: "AI assistant для private draft",
      conclusions: "Висновки",
      negotiation: "Торг",
      comparables: "База порівняння",
      buyerReport: "Buyer report",
    },
    fields: {
      title: "Назва",
      developer: "Забудовник",
      investment: "Інвестиція / проект",
      address: "Адреса",
      city: "Місто",
      district: "Район",
      market: "Ринок",
      price: "Ціна",
      area: "Площа m2",
      rooms: "Кімнати",
      floor: "Поверх",
      buildingFloors: "Поверхів у будинку",
      buildingYear: "Рік будинку",
      privateAnalysis: "private analysis",
      audience: "Аудиторія",
      topic: "Тема",
      question: "Питання",
    },
    placeholders: {
      sourceUrl: "https://www.otodom.pl/...",
      optional: "optional",
      customQuestion: "Наприклад: які ризики перевірити до zadatek?",
    },
    metrics: {
      verdict: "Вердикт",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      fairPriceMid: "Fair price mid",
      confidence: "Confidence",
      priceLabel: "Price label",
      provider: "Provider",
      domain: "Domain",
      reference: "Reference",
      requiredFields: "Required fields",
      importStatus: "Import status",
      extracted: "Extracted",
      http: "HTTP",
      source: "Source",
      objectPrice: "Ціна об'єкта",
      pricePerM2: "Ціна за m2",
      fairPriceRange: "Fair price range",
      comparableListings: "Comparable listings",
      sourceDomain: "Source domain",
      privateDraft: "Private draft",
      expires: "Expires",
    },
    statuses: {
      ready: "Готово до перевірки",
      noLink: "Посилання не додано",
      linkNotChecked: "Посилання не перевірено",
      importNotStarted: "Автоімпорт не запускався",
      reportNotCreated: "Звіт не створено",
      notSaved: "Не збережено",
      aiReadyAfterCheck: "AI assistant готовий після перевірки",
      aiQuestionsUnavailable: "AI questions недоступні",
      calculating: "Розрахунок...",
      checkReady: "Перевірка готова",
      checkError: "Помилка перевірки",
      loadingLink: "Завантаження посилання...",
      autoImporting: "Автоімпорт...",
      linkAcceptedNoParams: "Посилання прийнято, але портал не повернув параметри",
      reportNoListingData: "Звіт не створено: немає даних оголошення",
      linkAcceptedMissingFields: "Посилання прийнято, але потрібні обов'язкові поля",
      missingFields: (fields) => `Не вистачає: ${fields}`,
      fieldsUpdated: "Поля оновлено з посилання",
      linkError: "Помилка посилання",
      importError: "Помилка автоімпорту",
      fillRequiredForReport: "Заповніть обов'язкові поля для звіту",
      reportGenerating: "Генерація...",
      reportReady: "Звіт готовий",
      reportError: "Помилка звіту",
      saving: "Збереження...",
      saved: "Збережено",
      saveError: "Помилка збереження",
      aiReady: "AI assistant готовий",
      aiNeedsDraft: "AI assistant потребує saved draft",
      aiDraftRequired: "Спочатку потрібно отримати перевірку зі saved draft",
      aiBuilding: "AI answer будується...",
      aiRefused: "AI answer відхилено guardrail-правилом",
      aiSaved: (id) => `AI answer збережено: ${id}`,
      aiUnavailable: "AI answer недоступний",
      importExtracted: (count) => `Автоімпорт: заповнено ${count} полів`,
      importPartial: (count) => `Автоімпорт частковий: заповнено ${count} полів`,
      importUnsupported: "Автоімпорт доступний тільки для Otodom/OLX",
      importFailed: "Автоімпорт не отримав параметри, заповніть поля вручну",
    },
    requiredFieldLabels: {
      address: "адреса",
      city: "місто",
      district: "район",
      price: "ціна",
      area_m2: "площа",
      rooms: "кімнати",
    },
    values: {
      manual: "manual",
      manualInput: "manual input",
      notSaved: "not saved",
      noDraft: "no draft",
      dash: "-",
      primary: "primary",
      secondary: "secondary",
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
      html: "HTML",
    },
    table: {
      object: "Об'єкт",
      district: "Район",
      price: "Ціна",
      area: "m2",
      rooms: "Кімнати",
      pricePerM2: "Ціна/m2",
    },
    empty: {
      noResult: "Введіть параметри й запустіть перевірку.",
      aiReady: "AI answer з'явиться після запиту щодо збереженого private draft.",
      aiNeedsSavedDraft: "Для AI assistant потрібен saved draft: запустіть перевірку або звіт знову.",
      noData: "Немає даних.",
    },
    developer: {
      title: "Забудовник",
      profile: "Профіль забудовника",
      ratingLine: (rating, confidence) =>
        `Рейтинг ${rating}/100, впевненість ${confidence}/100.`,
      projectsLine: (completed, active) =>
        `Здано проектів: ${completed}; активних: ${active}.`,
      labels: {
        strong: "сильний",
        good: "хороший",
        mixed: "змішаний",
        limited_data: "мало даних",
        risk_review: "перевірити",
      },
    },
    assistantColumn: {
      keyPoints: "Ключові висновки",
      sources: "Джерела",
      guardrails: "Guardrails",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    errorPrefix: "Помилка",
  },
};

export const CHECK_DRAFTS_COPY: Record<Locale, CheckDraftsPageCopy> = {
  en: {
    title: "My checks",
    subtitle: "Private drafts for apartments checked through the address-first flow.",
    actions: {
      newCheck: "New check",
      refresh: "Refresh",
      report: "Report",
      mockPay: "Mock pay",
      delete: "Delete",
      html: "HTML",
    },
    sections: { history: "History" },
    table: {
      object: "Object",
      parameters: "Parameters",
      score: "Score",
      privateRef: "Private ref",
      retention: "Retention",
      actions: "Actions",
    },
    statuses: {
      loading: "Loading checks...",
      loaded: (count) => `Checks: ${count}`,
      backendUnavailable: "Backend API unavailable",
      deleting: "Deleting...",
      deleteError: "Delete error",
      deleted: "Check deleted",
      reportGenerating: "Generating report...",
      reportSaved: (reportId) => `Report saved: ${reportId}`,
      reportError: "Report generation error",
      orderCreating: "Creating order...",
      mockPayment: (orderId) => `Mock payment: ${orderId}`,
      paidReportReady: (orderId) => `Paid report ready: ${orderId}`,
      paymentError: "Payment error",
    },
    values: {
      manualInput: "manual input",
      rooms: (count) => `${count} room${count === 1 ? "" : "s"}`,
      dataQualityPrefix: "DQ",
    },
    retention: {
      expired: "expired",
      expiresToday: "expires today",
      daysLeft: (days) => `${days} day${days === 1 ? "" : "s"} left`,
    },
    empty: {
      noDrafts: "No saved checks yet.",
      loading: "Loading data",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Moje sprawdzenia",
    subtitle: "Private drafts mieszkań sprawdzonych przez address-first flow.",
    actions: {
      newCheck: "Nowe sprawdzenie",
      refresh: "Odśwież",
      report: "Raport",
      mockPay: "Mock pay",
      delete: "Usuń",
      html: "HTML",
    },
    sections: { history: "Historia" },
    table: {
      object: "Obiekt",
      parameters: "Parametry",
      score: "Score",
      privateRef: "Private ref",
      retention: "Retention",
      actions: "Działania",
    },
    statuses: {
      loading: "Ładowanie sprawdzeń...",
      loaded: (count) => `Sprawdzeń: ${count}`,
      backendUnavailable: "Backend API niedostępne",
      deleting: "Usuwanie...",
      deleteError: "Błąd usuwania",
      deleted: "Sprawdzenie usunięte",
      reportGenerating: "Generowanie raportu...",
      reportSaved: (reportId) => `Raport zapisany: ${reportId}`,
      reportError: "Błąd generowania raportu",
      orderCreating: "Tworzenie zamówienia...",
      mockPayment: (orderId) => `Mock payment: ${orderId}`,
      paidReportReady: (orderId) => `Płatny raport gotowy: ${orderId}`,
      paymentError: "Błąd płatności",
    },
    values: {
      manualInput: "ręczne dane",
      rooms: (count) => `${count} pok.`,
      dataQualityPrefix: "DQ",
    },
    retention: {
      expired: "wygasło",
      expiresToday: "wygasa dziś",
      daysLeft: (days) => `${days} dni`,
    },
    empty: {
      noDrafts: "Nie ma jeszcze zapisanych sprawdzeń.",
      loading: "Ładowanie danych",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Мои проверки",
    subtitle: "Private drafts по квартирам, которые были проверены через address-first flow.",
    actions: {
      newCheck: "Новая проверка",
      refresh: "Обновить",
      report: "Отчет",
      mockPay: "Mock pay",
      delete: "Удалить",
      html: "HTML",
    },
    sections: { history: "История" },
    table: {
      object: "Объект",
      parameters: "Параметры",
      score: "Score",
      privateRef: "Private ref",
      retention: "Retention",
      actions: "Действия",
    },
    statuses: {
      loading: "Загрузка проверок...",
      loaded: (count) => `Проверок: ${count}`,
      backendUnavailable: "Backend API недоступен",
      deleting: "Удаление...",
      deleteError: "Ошибка удаления",
      deleted: "Проверка удалена",
      reportGenerating: "Генерация отчета...",
      reportSaved: (reportId) => `Отчет сохранен: ${reportId}`,
      reportError: "Ошибка генерации отчета",
      orderCreating: "Создание заказа...",
      mockPayment: (orderId) => `Mock payment: ${orderId}`,
      paidReportReady: (orderId) => `Paid report ready: ${orderId}`,
      paymentError: "Ошибка оплаты",
    },
    values: {
      manualInput: "manual input",
      rooms: (count) => `${count} ${pluralRu(count, "комната", "комнаты", "комнат")}`,
      dataQualityPrefix: "DQ",
    },
    retention: {
      expired: "expired",
      expiresToday: "expires today",
      daysLeft: (days) => `${days} ${pluralRu(days, "день", "дня", "дней")} осталось`,
    },
    empty: {
      noDrafts: "Пока нет сохраненных проверок.",
      loading: "Загрузка данных",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Мої перевірки",
    subtitle: "Private drafts квартир, перевірених через address-first flow.",
    actions: {
      newCheck: "Нова перевірка",
      refresh: "Оновити",
      report: "Звіт",
      mockPay: "Mock pay",
      delete: "Видалити",
      html: "HTML",
    },
    sections: { history: "Історія" },
    table: {
      object: "Об'єкт",
      parameters: "Параметри",
      score: "Score",
      privateRef: "Private ref",
      retention: "Retention",
      actions: "Дії",
    },
    statuses: {
      loading: "Завантаження перевірок...",
      loaded: (count) => `Перевірок: ${count}`,
      backendUnavailable: "Backend API недоступний",
      deleting: "Видалення...",
      deleteError: "Помилка видалення",
      deleted: "Перевірку видалено",
      reportGenerating: "Генерація звіту...",
      reportSaved: (reportId) => `Звіт збережено: ${reportId}`,
      reportError: "Помилка генерації звіту",
      orderCreating: "Створення замовлення...",
      mockPayment: (orderId) => `Mock payment: ${orderId}`,
      paidReportReady: (orderId) => `Paid report ready: ${orderId}`,
      paymentError: "Помилка оплати",
    },
    values: {
      manualInput: "manual input",
      rooms: (count) => `${count} ${pluralUk(count, "кімната", "кімнати", "кімнат")}`,
      dataQualityPrefix: "DQ",
    },
    retention: {
      expired: "expired",
      expiresToday: "expires today",
      daysLeft: (days) => `${days} ${pluralUk(days, "день", "дні", "днів")} залишилось`,
    },
    empty: {
      noDrafts: "Поки немає збережених перевірок.",
      loading: "Завантаження даних",
    },
    errorPrefix: "Помилка",
  },
};

export const EXPLORER_COPY: Record<Locale, ExplorerCopy> = {
  en: buildExplorerCopy("en"),
  pl: buildExplorerCopy("pl"),
  ru: buildExplorerCopy("ru"),
  uk: buildExplorerCopy("uk"),
};

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.trim().toLowerCase().split("-")[0];
  return isSupportedLocale(normalized) ? normalized : DEFAULT_LOCALE;
}

function buildExplorerCopy(locale: Locale): ExplorerCopy {
  const content: Record<Locale, Omit<ExplorerCopy, "optionLabels">> = {
    en: {
      title: "Wrocław property search",
      subtitle: "Search, map, scoring, price history and fast actions for MVP analytics.",
      actions: {
        refresh: "Refresh",
        hiddenGems: "Hidden gems",
        compare: (count) => `Compare ${count}`,
        alert: "Alert",
        apply: "Apply",
        reset: "Reset",
        reports: "Reports",
        favorite: "Favorite",
      },
      metrics: {
        found: "Listings found",
        bestGem: "Best Gem Score",
        bestInvestment: "Best Investment",
        medianArea: "Area median",
        priceTrend90d: "90-day price trend",
      },
      filters: {
        title: "Filters and sorting",
        search: "Search",
        searchPlaceholder: "address, district, street",
        municipality: "Gmina",
        wroclawCity: "Wrocław city",
        voivodeship: "Voivodeship",
        all: "All",
        district: "District",
        allDistricts: "All districts/localities",
        rooms: "Rooms",
        any: "Any",
        anyMasculine: "Any",
        maxPrice: "Max price",
        buildingType: "Building type",
        renovationState: "Condition",
        balcony: "Balcony",
        terrace: "Terrace",
        garden: "Garden",
        elevator: "Elevator",
        parking: "Parking",
        heating: "Heating",
        minFloor: "Floor from",
        maxFloor: "Floor to",
        maxBuildingFloors: "Building floors up to",
        minBuildingYear: "Building year from",
        maxBuildingYear: "Building year to",
        maxFairDelta: "Max fair delta",
        minInvestment: "Min Investment",
        maxRisk: "Max Risk",
        minNegotiation: "Min Negotiation",
        minLiquidity: "Min Liquidity",
        minRental: "Min Rental",
        minDataQuality: "Min Data quality",
        minDeveloperReputation: "Min developer rating",
        minDeveloperConfidence: "Min developer confidence",
        minDeveloperCompleted: "Completed projects from",
        minDeveloperActive: "Active projects from",
        requireDeveloper: "Only with developer",
        excludeDeveloperRisk: "Without developer risk",
        radiusFromCenter: "Radius from center",
        wholeWroclaw: "Whole Wrocław MVP",
        maxCenterKm: "Max to center, km",
        maxStopM: "Max to stop, m",
        maxSchoolM: "Max to school, m",
        minMajorRoadM: "Min from road, m",
        minIndustrialZoneM: "Min from industrial zone, m",
        mode: "Mode",
        standardMode: "Standard search",
        sort: "Sort",
        pageSize: "Per page",
      },
      status: {
        loading: "Loading analytics...",
        backendUnavailable: "Backend API unavailable",
        filtersReset: "Filters reset",
        compareLimit: "You can compare up to 5 listings",
        favoriteAdded: "Added to favorites",
        alertCreated: "Alert created",
        mapLoading: "Updating GIS layers...",
        mapUnavailable: "GIS API unavailable",
        found: (total, page, totalPages) => `Found ${total} · page ${page} of ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Hidden gems ${total} · page ${page} of ${totalPages || 1}`,
        reportSaved: (reportId) => `Report saved: ${reportId}`,
        mapLoaded: (listingCount, investmentCount, infrastructureCount) =>
          `${listingCount} listings · ${investmentCount} planned investments · ${infrastructureCount} infrastructure`,
      },
      state: {
        loadingData: "Loading data",
        errorPrefix: "Error",
        emptyResults: "No listings match selected filters.",
        hiddenGemsOnPage: (count) => `${count} on this page`,
      },
      pagination: {
        previous: "Back",
        next: "Next",
        page: (page, totalPages) => `Page ${page} of ${totalPages || 1}`,
      },
      map: { title: "Map and GIS layers" },
      savedSearchName: "Saved search from explorer",
      favoriteNote: "Added from search panel",
    },
    pl: {
      title: "Wyszukiwarka nieruchomości Wrocław",
      subtitle: "Wyszukiwanie, mapa, scoring, historia cen i szybkie akcje dla analityki MVP.",
      actions: {
        refresh: "Odśwież",
        hiddenGems: "Hidden gems",
        compare: (count) => `Porównaj ${count}`,
        alert: "Alert",
        apply: "Zastosuj",
        reset: "Reset",
        reports: "Raporty",
        favorite: "Ulubione",
      },
      metrics: {
        found: "Znalezione oferty",
        bestGem: "Najlepszy Gem Score",
        bestInvestment: "Najlepszy Investment",
        medianArea: "Mediana dzielnicy",
        priceTrend90d: "Zmiana ceny 90 dni",
      },
      filters: {
        title: "Filtry i sortowanie",
        search: "Szukaj",
        searchPlaceholder: "adres, dzielnica, ulica",
        municipality: "Gmina",
        wroclawCity: "Miasto Wrocław",
        voivodeship: "Województwo",
        all: "Wszystkie",
        district: "Dzielnica",
        allDistricts: "Wszystkie dzielnice/miejscowości",
        rooms: "Pokoje",
        any: "Dowolne",
        anyMasculine: "Dowolny",
        maxPrice: "Cena maks.",
        buildingType: "Typ budynku",
        renovationState: "Stan",
        balcony: "Balkon",
        terrace: "Taras",
        garden: "Ogród",
        elevator: "Winda",
        parking: "Parking",
        heating: "Ogrzewanie",
        minFloor: "Piętro od",
        maxFloor: "Piętro do",
        maxBuildingFloors: "Liczba pięter do",
        minBuildingYear: "Rok budynku od",
        maxBuildingYear: "Rok budynku do",
        maxFairDelta: "Maks. delta fair",
        minInvestment: "Min. Investment",
        maxRisk: "Maks. Risk",
        minNegotiation: "Min. Negotiation",
        minLiquidity: "Min. Liquidity",
        minRental: "Min. Rental",
        minDataQuality: "Min. jakość danych",
        minDeveloperReputation: "Min. rating dewelopera",
        minDeveloperConfidence: "Min. confidence dewelopera",
        minDeveloperCompleted: "Ukończone projekty od",
        minDeveloperActive: "Aktywne projekty od",
        requireDeveloper: "Tylko z deweloperem",
        excludeDeveloperRisk: "Bez developer risk",
        radiusFromCenter: "Promień od centrum",
        wholeWroclaw: "Cały Wrocław MVP",
        maxCenterKm: "Maks. do centrum, km",
        maxStopM: "Maks. do przystanku, m",
        maxSchoolM: "Maks. do szkoły, m",
        minMajorRoadM: "Min. od drogi, m",
        minIndustrialZoneM: "Min. od strefy przemysłowej, m",
        mode: "Tryb",
        standardMode: "Zwykłe wyszukiwanie",
        sort: "Sortowanie",
        pageSize: "Na stronie",
      },
      status: {
        loading: "Ładowanie analityki...",
        backendUnavailable: "Backend API niedostępne",
        filtersReset: "Filtry zresetowane",
        compareLimit: "Można porównać maksymalnie 5 obiektów",
        favoriteAdded: "Dodano do ulubionych",
        alertCreated: "Alert utworzony",
        mapLoading: "Aktualizacja warstw GIS...",
        mapUnavailable: "GIS API niedostępne",
        found: (total, page, totalPages) =>
          `Znaleziono ${total} · strona ${page} z ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Hidden gems ${total} · strona ${page} z ${totalPages || 1}`,
        reportSaved: (reportId) => `Raport zapisany: ${reportId}`,
        mapLoaded: (listingCount, investmentCount, infrastructureCount) =>
          `${listingCount} obiektów · ${investmentCount} planowanych inwestycji · ${infrastructureCount} infrastruktura`,
      },
      state: {
        loadingData: "Ładowanie danych",
        errorPrefix: "Błąd",
        emptyResults: "Brak obiektów dla wybranych filtrów.",
        hiddenGemsOnPage: (count) => `${count} na stronie`,
      },
      pagination: {
        previous: "Wstecz",
        next: "Dalej",
        page: (page, totalPages) => `Strona ${page} z ${totalPages || 1}`,
      },
      map: { title: "Mapa i warstwy GIS" },
      savedSearchName: "Zapisane wyszukiwanie z panelu",
      favoriteNote: "Dodane z panelu wyszukiwania",
    },
    ru: {
      title: "Подбор недвижимости Wrocław",
      subtitle: "Поиск, карта, скоринг, история цены и быстрые действия для MVP-аналитики.",
      actions: {
        refresh: "Обновить",
        hiddenGems: "Hidden gems",
        compare: (count) => `Сравнить ${count}`,
        alert: "Уведомление",
        apply: "Применить",
        reset: "Сброс",
        reports: "Отчеты",
        favorite: "Избранное",
      },
      metrics: {
        found: "Объектов найдено",
        bestGem: "Лучший Gem Score",
        bestInvestment: "Лучший Investment",
        medianArea: "Медиана района",
        priceTrend90d: "Динамика цены 90 дней",
      },
      filters: {
        title: "Фильтры и сортировка",
        search: "Поиск",
        searchPlaceholder: "адрес, район, улица",
        municipality: "Gmina",
        wroclawCity: "Город Вроцлав",
        voivodeship: "Воеводство",
        all: "Все",
        district: "Район",
        allDistricts: "Все районы/местности",
        rooms: "Комнаты",
        any: "Любое",
        anyMasculine: "Любой",
        maxPrice: "Макс. цена",
        buildingType: "Тип здания",
        renovationState: "Состояние",
        balcony: "Балкон",
        terrace: "Терраса",
        garden: "Сад",
        elevator: "Лифт",
        parking: "Парковка",
        heating: "Отопление",
        minFloor: "Этаж от",
        maxFloor: "Этаж до",
        maxBuildingFloors: "Этажность до",
        minBuildingYear: "Год дома от",
        maxBuildingYear: "Год дома до",
        maxFairDelta: "Макс. delta fair",
        minInvestment: "Мин. Investment",
        maxRisk: "Макс. Risk",
        minNegotiation: "Мин. Negotiation",
        minLiquidity: "Мин. Liquidity",
        minRental: "Мин. Rental",
        minDataQuality: "Мин. качество данных",
        minDeveloperReputation: "Мин. рейтинг застройщика",
        minDeveloperConfidence: "Мин. уверенность по застройщику",
        minDeveloperCompleted: "Сданных проектов от",
        minDeveloperActive: "Активных проектов от",
        requireDeveloper: "Только с застройщиком",
        excludeDeveloperRisk: "Без риска застройщика",
        radiusFromCenter: "Радиус от центра",
        wholeWroclaw: "Весь Wrocław MVP",
        maxCenterKm: "Макс. до центра, км",
        maxStopM: "Макс. до остановки, м",
        maxSchoolM: "Макс. до школы, м",
        minMajorRoadM: "Мин. от дороги, м",
        minIndustrialZoneM: "Мин. от промзоны, м",
        mode: "Режим",
        standardMode: "Обычный поиск",
        sort: "Сортировка",
        pageSize: "На странице",
      },
      status: {
        loading: "Загрузка аналитики...",
        backendUnavailable: "Backend API недоступен",
        filtersReset: "Фильтры сброшены",
        compareLimit: "Для сравнения можно выбрать максимум 5 объектов",
        favoriteAdded: "Добавлено в избранное",
        alertCreated: "Уведомление создано",
        mapLoading: "Обновление GIS-слоев...",
        mapUnavailable: "GIS API недоступен",
        found: (total, page, totalPages) =>
          `Найдено ${total} · страница ${page} из ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Hidden gems ${total} · страница ${page} из ${totalPages || 1}`,
        reportSaved: (reportId) => `Отчет сохранен: ${reportId}`,
        mapLoaded: (listingCount, investmentCount, infrastructureCount) =>
          `${listingCount} объектов · ${investmentCount} плановых инвестиций · ${infrastructureCount} объектов инфраструктуры`,
      },
      state: {
        loadingData: "Загрузка данных",
        errorPrefix: "Ошибка",
        emptyResults: "Нет объектов под выбранные фильтры.",
        hiddenGemsOnPage: (count) => `${count} на странице`,
      },
      pagination: {
        previous: "Назад",
        next: "Вперед",
        page: (page, totalPages) => `Страница ${page} из ${totalPages || 1}`,
      },
      map: { title: "Карта и GIS-слои" },
      savedSearchName: "Сохраненный поиск из подбора",
      favoriteNote: "Добавлено из панели поиска",
    },
    uk: {
      title: "Підбір нерухомості Wrocław",
      subtitle: "Пошук, карта, скоринг, історія ціни та швидкі дії для MVP-аналітики.",
      actions: {
        refresh: "Оновити",
        hiddenGems: "Hidden gems",
        compare: (count) => `Порівняти ${count}`,
        alert: "Сповіщення",
        apply: "Застосувати",
        reset: "Скинути",
        reports: "Звіти",
        favorite: "Обране",
      },
      metrics: {
        found: "Об'єктів знайдено",
        bestGem: "Найкращий Gem Score",
        bestInvestment: "Найкращий Investment",
        medianArea: "Медіана району",
        priceTrend90d: "Динаміка ціни 90 днів",
      },
      filters: {
        title: "Фільтри та сортування",
        search: "Пошук",
        searchPlaceholder: "адреса, район, вулиця",
        municipality: "Gmina",
        wroclawCity: "Місто Вроцлав",
        voivodeship: "Воєводство",
        all: "Усі",
        district: "Район",
        allDistricts: "Усі райони/місцевості",
        rooms: "Кімнати",
        any: "Будь-яке",
        anyMasculine: "Будь-який",
        maxPrice: "Макс. ціна",
        buildingType: "Тип будівлі",
        renovationState: "Стан",
        balcony: "Балкон",
        terrace: "Тераса",
        garden: "Сад",
        elevator: "Ліфт",
        parking: "Паркування",
        heating: "Опалення",
        minFloor: "Поверх від",
        maxFloor: "Поверх до",
        maxBuildingFloors: "Поверховість до",
        minBuildingYear: "Рік будинку від",
        maxBuildingYear: "Рік будинку до",
        maxFairDelta: "Макс. delta fair",
        minInvestment: "Мін. Investment",
        maxRisk: "Макс. Risk",
        minNegotiation: "Мін. Negotiation",
        minLiquidity: "Мін. Liquidity",
        minRental: "Мін. Rental",
        minDataQuality: "Мін. якість даних",
        minDeveloperReputation: "Мін. рейтинг забудовника",
        minDeveloperConfidence: "Мін. впевненість щодо забудовника",
        minDeveloperCompleted: "Зданих проектів від",
        minDeveloperActive: "Активних проектів від",
        requireDeveloper: "Тільки із забудовником",
        excludeDeveloperRisk: "Без ризику забудовника",
        radiusFromCenter: "Радіус від центру",
        wholeWroclaw: "Увесь Wrocław MVP",
        maxCenterKm: "Макс. до центру, км",
        maxStopM: "Макс. до зупинки, м",
        maxSchoolM: "Макс. до школи, м",
        minMajorRoadM: "Мін. від дороги, м",
        minIndustrialZoneM: "Мін. від промзони, м",
        mode: "Режим",
        standardMode: "Звичайний пошук",
        sort: "Сортування",
        pageSize: "На сторінці",
      },
      status: {
        loading: "Завантаження аналітики...",
        backendUnavailable: "Backend API недоступний",
        filtersReset: "Фільтри скинуто",
        compareLimit: "Для порівняння можна вибрати максимум 5 об'єктів",
        favoriteAdded: "Додано в обране",
        alertCreated: "Сповіщення створено",
        mapLoading: "Оновлення GIS-шарів...",
        mapUnavailable: "GIS API недоступний",
        found: (total, page, totalPages) =>
          `Знайдено ${total} · сторінка ${page} з ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Hidden gems ${total} · сторінка ${page} з ${totalPages || 1}`,
        reportSaved: (reportId) => `Звіт збережено: ${reportId}`,
        mapLoaded: (listingCount, investmentCount, infrastructureCount) =>
          `${listingCount} об'єктів · ${investmentCount} планових інвестицій · ${infrastructureCount} об'єктів інфраструктури`,
      },
      state: {
        loadingData: "Завантаження даних",
        errorPrefix: "Помилка",
        emptyResults: "Немає об'єктів за вибраними фільтрами.",
        hiddenGemsOnPage: (count) => `${count} на сторінці`,
      },
      pagination: {
        previous: "Назад",
        next: "Вперед",
        page: (page, totalPages) => `Сторінка ${page} з ${totalPages || 1}`,
      },
      map: { title: "Карта і GIS-шари" },
      savedSearchName: "Збережений пошук з панелі",
      favoriteNote: "Додано з панелі пошуку",
    },
  };
  return {
    ...content[locale],
    optionLabels: optionLabels(locale),
  };
}

function optionLabels(locale: Locale): ExplorerCopy["optionLabels"] {
  const cardCopy = LISTING_CARD_COPY[locale];
  const sort: Record<Locale, OptionLabelMap> = {
    en: {
      investment_score_desc: "Investment: high to low",
      price_asc: "Price: low to high",
      price_desc: "Price: high to low",
      price_per_m2_asc: "Price/m2: low to high",
      risk_score_asc: "Risk: low to high",
      negotiation_score_desc: "Negotiation: high to low",
      developer_reputation_score_desc: "Developer: rating high to low",
      developer_reputation_score_asc: "Developer: rating low to high",
      developer_confidence_score_desc: "Developer: confidence high to low",
      developer_confidence_score_asc: "Developer: confidence low to high",
      days_on_market_desc: "Longest on market",
      newest: "Newest",
    },
    pl: {
      investment_score_desc: "Investment: najwyżej",
      price_asc: "Cena: najniżej",
      price_desc: "Cena: najwyżej",
      price_per_m2_asc: "Cena/m2: najniżej",
      risk_score_asc: "Risk: najniżej",
      negotiation_score_desc: "Negotiation: najwyżej",
      developer_reputation_score_desc: "Deweloper: rating najwyżej",
      developer_reputation_score_asc: "Deweloper: rating najniżej",
      developer_confidence_score_desc: "Deweloper: confidence najwyżej",
      developer_confidence_score_asc: "Deweloper: confidence najniżej",
      days_on_market_desc: "Najdłużej na rynku",
      newest: "Najnowsze",
    },
    ru: {
      investment_score_desc: "Investment: выше",
      price_asc: "Цена: ниже",
      price_desc: "Цена: выше",
      price_per_m2_asc: "Цена/m2: ниже",
      risk_score_asc: "Risk: ниже",
      negotiation_score_desc: "Negotiation: выше",
      developer_reputation_score_desc: "Застройщик: рейтинг выше",
      developer_reputation_score_asc: "Застройщик: рейтинг ниже",
      developer_confidence_score_desc: "Застройщик: уверенность выше",
      developer_confidence_score_asc: "Застройщик: уверенность ниже",
      days_on_market_desc: "Дольше на рынке",
      newest: "Новые",
    },
    uk: {
      investment_score_desc: "Investment: вище",
      price_asc: "Ціна: нижче",
      price_desc: "Ціна: вище",
      price_per_m2_asc: "Ціна/m2: нижче",
      risk_score_asc: "Risk: нижче",
      negotiation_score_desc: "Negotiation: вище",
      developer_reputation_score_desc: "Забудовник: рейтинг вище",
      developer_reputation_score_asc: "Забудовник: рейтинг нижче",
      developer_confidence_score_desc: "Забудовник: впевненість вище",
      developer_confidence_score_asc: "Забудовник: впевненість нижче",
      days_on_market_desc: "Довше на ринку",
      newest: "Нові",
    },
  };

  return {
    buildingType: {
      apartment_block: cardCopy.attributes.apartment_block,
      low_rise_block: cardCopy.attributes.low_rise_block,
      tenement: cardCopy.attributes.tenement,
      detached_house: cardCopy.attributes.detached_house,
    },
    renovationState: {
      developer_standard: cardCopy.attributes.developer_standard,
      ready_to_move_in: cardCopy.attributes.ready_to_move_in,
      needs_refresh: cardCopy.attributes.needs_refresh,
      needs_renovation: cardCopy.attributes.needs_renovation,
    },
    parkingType: {
      underground: cardCopy.attributes.underground,
      garage: cardCopy.attributes.garage,
      surface: cardCopy.attributes.surface,
      street: cardCopy.attributes.street,
    },
    heatingType: {
      municipal: cardCopy.attributes.municipal,
      gas: cardCopy.attributes.gas,
      electric: cardCopy.attributes.electric,
      heat_pump: cardCopy.attributes.heat_pump,
    },
    sort: sort[locale],
  };
}

function pluralRu(count: number, one: string, few: string, many: string) {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function pluralUk(count: number, one: string, few: string, many: string) {
  return pluralRu(count, one, few, many);
}
