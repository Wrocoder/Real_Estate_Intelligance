export const SUPPORTED_LOCALES = ["en", "pl", "ru", "uk"] as const;
export const DEFAULT_LOCALE: Locale = "pl";
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
  | "api"
  | "myApartments";

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
    advancedFilters: string;
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
  demoData: string;
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

export type FutureImpactNarrativeCopy = {
  title: string;
  sections: {
    narrative: string;
    catalysts: string;
    checks: string;
  };
  metrics: {
    score: string;
    within2km: string;
    nearest: string;
    confidence: string;
  };
  labels: {
    status: string;
    expected: string;
    distance: string;
    effects: string;
    risks: string;
  };
  values: {
    noData: string;
    noYear: string;
    projects: (count: number) => string;
    meters: (meters: string) => string;
    expectedYear: (year: number) => string;
    categories: Record<string, string>;
  };
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
  futureImpact: FutureImpactNarrativeCopy;
  fields: {
    title: string;
    developer: string;
    investment: string;
    address: string;
    city: string;
    district: string;
    market: string;
    purchaseIntent: string;
    renovationCondition: string;
    renovationBudget: string;
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
    purchaseIntents: Record<string, string>;
    renovationConditionUnknown: string;
    renovationConditions: Record<string, string>;
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

export type ReportsPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    refresh: string;
    generate: string;
    open: string;
    email: string;
    csv: string;
    json: string;
    pdf: string;
  };
  sections: {
    create: string;
    history: string;
  };
  fields: {
    listingId: string;
    audience: string;
    agency: string;
    agent: string;
    email: string;
    phone: string;
    website: string;
    note: string;
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    footer: string;
    disclaimer: string;
    whiteLabel: string;
  };
  table: {
    report: string;
    object: string;
    audience: string;
    insight: string;
    date: string;
    content: string;
    pdf: string;
  };
  statuses: {
    loading: string;
    loaded: (count: number) => string;
    backendUnavailable: string;
    generating: string;
    reportSaved: (reportId: string) => string;
  };
  values: {
    exportUnavailable: string;
    whiteLabelHint: string;
    items: (count: number) => string;
    noInsight: string;
    unknownError: string;
    audienceLabels: Record<string, string>;
    insightLabels: Record<string, string>;
  };
  empty: {
    loading: string;
    noReports: string;
  };
  errorPrefix: string;
};

export type PricingPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    refresh: string;
    buyReport: string;
    open: string;
    events: string;
    checkApartment: string;
    chooseArea: string;
  };
  metrics: {
    currentPlan: string;
    subscriptionReports: string;
    oneTimeOrders: string;
    status: string;
  };
  sections: {
    oneTimeReport: string;
    invoice: string;
    orderHistory: string;
    subscriptions: string;
    auditTrail: string;
  };
  hints: {
    reportContext: string;
    contextMissing: string;
    apartmentContext: string;
    areaContext: string;
    bundleContext: string;
  };
  fields: {
    b2bInvoice: string;
    company: string;
    vat: string;
    email: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  };
  table: {
    order: string;
    object: string;
    status: string;
    invoice: string;
    report: string;
    audit: string;
  };
  statuses: {
    loading: string;
    ready: string;
    backendUnavailable: string;
    creatingOrder: (title: string) => string;
    checkout: (provider: string, reference: string) => string;
    paid: (orderId: string) => string;
    reportReady: (reportId: string | null | undefined) => string;
    auditEvents: (orderId: string) => string;
    contextNeeded: string;
  };
  values: {
    unknownError: string;
    noValue: string;
    eventFallback: string;
    orders: (count: number) => string;
    events: (count: number) => string;
    auditEmpty: string;
    whiteLabel: string;
    standard: string;
    planSummary: (monthlyReports: string, maxAlerts: string, branding: string) => string;
  };
  empty: {
    loading: string;
  };
  errorPrefix: string;
};

export type AlertsPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    refresh: string;
    create: string;
    preview: string;
    dryRun: string;
    checkSend: string;
    clientDigest: string;
    delete: string;
  };
  sections: {
    newAlert: string;
    alerts: string;
    preview: string;
    realtorDigest: string;
    deliveryHistory: string;
  };
  fields: {
    name: string;
    municipality: string;
    voivodeship: string;
    district: string;
    search: string;
    maxPrice: string;
    rooms: string;
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
    minInvestment: string;
    maxFairDelta: string;
    minNegotiation: string;
    minLiquidity: string;
    minRental: string;
    minPriceReductions: string;
    maxDaysOnMarket: string;
    channel: string;
    frequency: string;
    deliveryTarget: string;
    active: string;
    client: string;
    intro: string;
    maxMatches: string;
    includeSourceLinks: string;
  };
  placeholders: {
    municipality: string;
    voivodeship: string;
    search: string;
    telegramTarget: string;
    emailTarget: string;
    clientName: string;
    digestIntro: string;
  };
  options: {
    any: string;
    anyFeminine: string;
    buildingType: OptionLabelMap;
    renovationState: OptionLabelMap;
    parkingType: OptionLabelMap;
    heatingType: OptionLabelMap;
    channel: OptionLabelMap;
    frequency: OptionLabelMap;
  };
  statuses: {
    loading: string;
    loaded: (count: number) => string;
    backendUnavailable: string;
    creating: string;
    created: (alertId: string) => string;
    previewLoaded: (count: number) => string;
    deliveryPrepared: (status: string, message: string) => string;
    updated: (name: string) => string;
    updateError: string;
    deleteConfirm: (name: string) => string;
    deleted: (name: string) => string;
    deleteError: string;
    saving: string;
    digestReady: (items: number, total: number) => string;
    digestError: string;
  };
  values: {
    unknownError: string;
    unknownAlertUpdateError: string;
    unknownAlertDeleteError: string;
    unknownDigestError: string;
    items: (count: number) => string;
    matches: (count: number) => string;
    digestMatches: (items: number, total: number) => string;
    notGenerated: string;
    defaultTarget: string;
    active: string;
    paused: string;
    yes: string;
    no: string;
    alertNameDefault: string;
    rooms: (count: number) => string;
    priceDrops: (count: number) => string;
    scoreLabels: {
      investment: string;
      risk: string;
      fairDelta: string;
      negotiation: string;
      liquidity: string;
      rental: string;
    };
    filterLabels: OptionLabelMap;
  };
  empty: {
    loading: string;
    noAlerts: string;
    previewPrompt: string;
    digestPrompt: string;
    noDeliveryJobs: string;
  };
  table: {
    channel: string;
    status: string;
    matches: string;
    message: string;
  };
  errorPrefix: string;
};

export type AccountPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    refresh: string;
    refreshCrm: string;
    create: string;
    add: string;
    delete: string;
    select: string;
    choose: string;
    current: string;
    createClient: string;
    addNote: string;
    build: string;
    enableShare: string;
    disableShare: string;
    preview: string;
    publicLink: string;
    open: string;
  };
  sections: {
    plans: string;
    profile: string;
    usage: string;
    capabilities: string;
    agencyWorkspace: string;
    agencyCrm: string;
    notes: string;
    shortlist: string;
    sharePreview: string;
    oneTimePurchases: string;
  };
  metrics: {
    plan: string;
    role: string;
    reports: string;
    credits: string;
    alerts: string;
    owner: string;
    city: string;
    members: string;
    status: string;
    budget: string;
    rooms: string;
    location: string;
    consent: string;
  };
  fields: {
    name: string;
    billingEmail: string;
    website: string;
    city: string;
    action: string;
    plan: string;
    userId: string;
    email: string;
    displayName: string;
    role: string;
    status: string;
    client: string;
    phone: string;
    district: string;
    budgetMin: string;
    budgetMax: string;
    rooms: string;
    tags: string;
    profileNotes: string;
    consent: string;
    note: string;
    visibility: string;
    pinned: string;
    title: string;
    listingIds: string;
    reportIds: string;
    clientMessage: string;
    shareLink: string;
    id: string;
    planId: string;
  };
  placeholders: {
    agencyName: string;
    billingEmail: string;
    website: string;
    userId: string;
    memberEmail: string;
    memberName: string;
    clientName: string;
    clientEmail: string;
    phone: string;
    district: string;
    budgetMin: string;
    budgetMax: string;
    rooms: string;
    tags: string;
    profileNotes: string;
    note: string;
    shortlistTitle: string;
    listingIds: string;
    reportIds: string;
    clientMessage: string;
  };
  labels: {
    plan: OptionLabelMap;
    userRole: OptionLabelMap;
    subscriptionStatus: OptionLabelMap;
    agencyRole: OptionLabelMap;
    agencyStatus: OptionLabelMap;
    crmClientStatus: OptionLabelMap;
    noteVisibility: OptionLabelMap;
    shortlistStatus: OptionLabelMap;
    reportOrderStatus: OptionLabelMap;
    capability: OptionLabelMap;
  };
  tables: {
    member: string;
    email: string;
    role: string;
    status: string;
    action: string;
    product: string;
    object: string;
    report: string;
    price: string;
    score: string;
    fairDelta: string;
    developer: string;
  };
  statuses: {
    loadingAccount: string;
    loadingAccountAndLimits: string;
    accountUpdated: string;
    backendUnavailable: string;
    unknownError: string;
    loadingCrmError: string;
    switchingPlan: (plan: string) => string;
    planChanged: (plan: string) => string;
    loadingWorkspace: string;
    workspaceSelected: string;
    loadingWorkspaceError: string;
    agencyNameRequired: string;
    creatingAgency: string;
    agencyCreated: string;
    agencyCreateError: string;
    memberUserIdRequired: string;
    addingMember: string;
    memberAdded: string;
    addMemberError: string;
    updatingRole: string;
    roleUpdated: string;
    roleUpdateError: string;
    updatingStatus: string;
    statusUpdated: string;
    statusUpdateError: string;
    removingMember: string;
    memberRemoved: string;
    removeMemberError: string;
    loadingCrmClient: string;
    crmClientSelected: string;
    crmClientLoadError: string;
    crmClientNameRequired: string;
    creatingCrmClient: string;
    crmClientCreated: string;
    crmClientCreateError: string;
    updatingCrmClientStatus: string;
    crmClientStatusUpdated: string;
    crmClientUpdateError: string;
    noteBodyRequired: string;
    addingNote: string;
    noteAdded: string;
    noteAddError: string;
    shortlistRequired: string;
    buildingShortlist: string;
    shortlistCreated: string;
    shortlistCreateError: string;
    enablingShare: string;
    disablingShare: string;
    shareEnabled: string;
    shareDisabled: string;
    shareUpdateError: string;
    generatingSharePreview: string;
    sharePreviewReady: string;
    sharePreviewError: string;
  };
  values: {
    activeBadge: string;
    favorites: (count: string) => string;
    alerts: (count: string) => string;
    monthlyReports: (count: string) => string;
    whiteLabelReports: string;
    noWhiteLabel: string;
    workspaces: (count: number) => string;
    clients: (count: number, agencyName: string) => string;
    orders: (count: number) => string;
    reportCredits: (count: string) => string;
    agencyEnabled: string;
    agencyPlanRequired: string;
    yes: string;
    no: string;
    noValue: string;
    pinnedPrefix: string;
    listingsUpdated: (count: number, updatedAt: string) => string;
    fairMid: (value: string) => string;
    scoreDetails: (risk: number, liquidity: number) => string;
    developerReputation: (score: number, label: string | null) => string;
    noReputationData: string;
    budgetTo: (value: string) => string;
    budgetFrom: (value: string) => string;
  };
  empty: {
    crmClients: string;
    shortlists: string;
    crmClientPrompt: string;
    shortlistItems: string;
  };
  errorPrefix: string;
};

export type AreaComparePageCopy = {
  title: string;
  subtitle: string;
  actions: {
    areas: string;
    refresh: string;
    calculate: string;
    summary: string;
  };
  sections: {
    parameters: string;
    topSignals: string;
    currentBaseline: string;
    aiSummary: string;
    positiveSignals: string;
    riskSignals: string;
    sources: string;
    buyerNotes: string;
    investorNotes: string;
    guardrails: string;
    areas: string;
  };
  fields: {
    city: string;
    sort: string;
    action: string;
    area: string;
    scope: string;
  };
  metrics: {
    cityMedianM2: string;
    cityAvgDom: string;
    activeSupply: string;
    areas: string;
  };
  labels: {
    sort: OptionLabelMap;
    topSignal: {
      value: string;
      growth: string;
      buyerMarket: string;
      liquidity: string;
    };
    market: OptionLabelMap;
  };
  table: {
    area: string;
    label: string;
    medianM2: string;
    vsCity: string;
    dom: string;
    domVsCity: string;
    supply: string;
    value: string;
    growth: string;
    liquidity: string;
    buyer: string;
    seller: string;
    overheated: string;
  };
  statuses: {
    loadingComparison: string;
    loadingAreaComparison: string;
    ready: string;
    backendUnavailable: string;
    aiNotCreated: string;
    aiReady: string;
    aiBuilding: string;
    aiSaved: (id: string) => string;
    aiUnavailable: string;
    unknownComparisonError: string;
    unknownSummaryError: string;
  };
  values: {
    noValue: string;
    days: (count: number) => string;
    rows: (count: number) => string;
    score: (value: number) => string;
    scope: string;
    sourceGrounded: string;
    indexSummary: (value: number, growth: number) => string;
    topSignalDetails: (value: number, growth: number, price: string) => string;
    noData: string;
  };
  empty: {
    aiPrompt: string;
    noAreas: string;
  };
  errorPrefix: string;
};

export type NewsPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    refresh: string;
    source: string;
    summary: string;
  };
  sections: {
    articles: string;
    articleDetail: string;
    aiSummary: string;
    keyPoints: string;
    areaImpact: string;
    sources: string;
    buyerNotes: string;
    investorNotes: string;
    guardrails: string;
  };
  placeholders: {
    area: string;
  };
  labels: {
    category: OptionLabelMap;
    impact: OptionLabelMap;
  };
  statuses: {
    loading: string;
    loadingNews: string;
    loaded: (count: number) => string;
    backendUnavailable: string;
    aiNotCreated: string;
    aiReady: string;
    aiBuilding: string;
    aiSaved: (id: string) => string;
    aiUnavailable: string;
    unknownNewsError: string;
    unknownDetailError: string;
    unknownAiError: string;
  };
  values: {
    allAreas: string;
    relatedAreas: (count: number) => string;
    sourceGrounded: string;
    noData: string;
  };
  empty: {
    noNews: string;
    chooseNews: string;
    aiPrompt: string;
  };
  errorPrefix: string;
};

export type DevelopersPageCopy = {
  title: string;
  subtitle: string;
  actions: {
    refresh: string;
    apply: string;
    open: string;
    openProfile: string;
    ranking: string;
    source: string;
  };
  sections: {
    filters: string;
    developers: string;
    profile: string;
    factors: string;
    projects: string;
    qualitySignals: string;
    dueDiligence: string;
    company: string;
    check: string;
    sources: string;
  };
  fields: {
    city: string;
    minRating: string;
    minConfidence: string;
  };
  metrics: {
    inSample: string;
    averageRating: string;
    strongGood: string;
    needsReview: string;
    rating: string;
    technicalQuality: string;
    legalScope: string;
    transparency: string;
    reputationScore: string;
    confidence: string;
    completedProjects: string;
    activeProjects: string;
  };
  table: {
    developer: string;
    rating: string;
    confidence: string;
    projects: string;
    signals: string;
    profile: string;
    factor: string;
    score: string;
    meaning: string;
    project: string;
    location: string;
    status: string;
    units: string;
    source: string;
  };
  labels: {
    reputation: OptionLabelMap;
    projectStatus: OptionLabelMap;
    moderationStatus: OptionLabelMap;
    disputeStatus: OptionLabelMap;
  };
  factors: Record<
    | "trackRecord"
    | "delivery"
    | "technicalQuality"
    | "legal"
    | "financial"
    | "transparency"
    | "local",
    { label: string; detail: string }
  >;
  statuses: {
    loadingRanking: string;
    loadingProfile: string;
    loadingDeveloperProfile: string;
    profileUnavailable: string;
    updated: (date: string) => string;
    found: (count: number) => string;
    unknownError: string;
  };
  values: {
    noValue: string;
    noData: string;
    legalNameMissing: string;
    headquartersMissing: string;
    completedActive: (completed: number, active: number) => string;
    sources: (sources: string) => string;
    units: (count: string) => string;
    score: (value: number) => string;
    confidence: (value: number) => string;
    dataQuality: (value: number) => string;
    foundedUpdated: (founded: string, updated: string) => string;
    checked: (date: string) => string;
    dispute: (status: string) => string;
  };
  errorPrefix: string;
};

export type ListingDetailCopy = {
  demoData: string;
  actions: {
    back: string;
    refresh: string;
    favorite: string;
    saveReport: string;
    openReport: string;
    answer: string;
  };
  sections: {
    aiAssistant: string;
    insights: string;
    negotiation: string;
    priceHistory: string;
    comparables: string;
    scoring: string;
    area: string;
    areaNews: string;
    guides: string;
    readyHtml: string;
  };
  futureImpact: FutureImpactNarrativeCopy;
  metrics: {
    verdict: string;
    price: string;
    pricePerM2: string;
    fairPriceMid: string;
    fairPriceConfidence: string;
    fairDeviation: string;
    priceLabel: string;
    buildingType: string;
    renovationState: string;
    amenities: string;
    parking: string;
    heating: string;
  };
  fields: {
    audience: string;
    topic: string;
    question: string;
  };
  placeholders: {
    customQuestion: string;
  };
  statuses: {
    loadingObject: string;
    analyticsUpdated: string;
    backendUnavailable: string;
    favoriteAdded: string;
    reportSaved: (reportId: string) => string;
    aiReady: string;
    aiQuestionsUnavailable: string;
    aiBuilding: string;
    aiRefused: string;
    aiSaved: (id: string) => string;
    aiUnavailable: string;
  };
  values: {
    buyer: string;
    realtor: string;
    investor: string;
    refused: string;
    sourceGrounded: string;
    dataQualityPrefix: string;
    m2: string;
  };
  table: {
    date: string;
    price: string;
    pricePerM2: string;
    object: string;
    district: string;
    area: string;
  };
  area: {
    median: (value: string) => string;
    activeListings: (count: number) => string;
    averageExposure: (days: number) => string;
    supply90d: (value: string) => string;
  };
  empty: {
    loadingAnalytics: string;
    noAiAnswer: string;
    noData: string;
    noAreaNews: string;
    noConfirmedAmenities: string;
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
  lifestyle: {
    balcony: string;
    terrace: string;
    garden: string;
    elevator: string;
  };
  chart: {
    priceHistoryAria: (title: string) => string;
  };
  favoriteNote: string;
  errorPrefix: string;
};

export type ComparePageCopy = {
  title: string;
  subtitle: string;
  actions: {
    search: string;
    refresh: string;
    getVerdict: string;
    buildShortlist: string;
  };
  sections: {
    selector: string;
    aiVerdict: string;
    clientShortlist: string;
    comparisonMatrix: string;
    sourcesAndLimits: string;
  };
  metrics: {
    bestChoice: string;
    belowFairPrice: string;
    cheaperMonthly: string;
    rentalSignal: string;
  };
  fields: {
    audience: string;
    question: string;
    client: string;
    intro: string;
  };
  placeholders: {
    aiQuestion: string;
    clientName: string;
    intro: string;
  };
  statuses: {
    loadingListings: string;
    listingsLoaded: string;
    backendUnavailable: string;
    comparing: string;
    compareCount: (count: number) => string;
    compareUnavailable: string;
    compareLimit: string;
    aiNotCreated: string;
    aiReady: string;
    aiBuilding: string;
    aiRefused: string;
    aiSaved: (id: string) => string;
    aiUnavailable: string;
    shortlistNotCreated: string;
    shortlistReady: string;
    shortlistBuilding: string;
    shortlistCount: (count: number) => string;
    shortlistUnavailable: string;
  };
  values: {
    buyer: string;
    realtor: string;
    investor: string;
    refused: string;
    sourceGrounded: string;
    winner: string;
    sourceLinks: string;
    rank: (rank: number) => string;
    roomsShort: (count: number) => string;
    monthly: string;
    loan: string;
    cash: string;
    fair: string;
    negotiation: string;
    gross: string;
    liquidity: string;
    rent: string;
    metersToStop: (meters: number) => string;
    schoolsParks: (schools: number, parks: number) => string;
    plannedInvestments: (count: number) => string;
    mortgageAssumptions: (downPaymentPct: number, loanYears: number, interestPct: number) => string;
  };
  table: {
    metric: string;
    location: string;
    price: string;
    pricePerM2: string;
    areaRooms: string;
    daysOnMarket: string;
    decisionScore: string;
    verdict: string;
    developer: string;
    developerRisk: string;
    developerCheck: string;
    mortgagePayment: string;
    cashNeeded: string;
    totalMoveInCost: string;
    transactionCosts: string;
    renovationFurniture: string;
    readyAlternative: string;
    postRenovationGap: string;
    offerStrategy: string;
    rentalEstimate: string;
    priceLabel: string;
    investmentScore: string;
    riskScore: string;
    negotiationScore: string;
    liquidity: string;
    rentalPotential: string;
    fairPrice: string;
    fairPriceConfidence: string;
    checkCompleteness: string;
    criticalUnknowns: string;
    sourceConfidence: string;
    fairPriceDelta: string;
    discountToFair: string;
    transport: string;
    infrastructure: string;
    plannedInvestments: string;
    negotiationArgument: string;
    mainRisk: string;
    recommendation: string;
  };
  empty: {
    selectMin: string;
    noAiAnswer: string;
    noShortlist: string;
    noData: string;
    noWarnings: string;
    noDeveloper: string;
    noDeveloperRisk: string;
    manualDeveloperCheck: string;
    developerDueDiligence: string;
  };
  developerLabels: Record<string, string>;
  assistantColumn: {
    keyPoints: string;
    tradeoffs: string;
  };
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
    myApartments: "My apartments",
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
    myApartments: "Moje mieszkania",
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
    myApartments: "Мои квартиры",
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
    myApartments: "Мої квартири",
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
    demoData: "Demo data",
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
    demoData: "Dane demonstracyjne",
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
    demoData: "Демонстрационные данные",
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
    demoData: "Демонстраційні дані",
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
    subtitle: "Apartment details, estimated price range, risks, negotiation and nearby comparable listings.",
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
      aiAssistant: "Apartment assistant",
      conclusions: "Conclusions",
      negotiation: "Negotiation",
      comparables: "Comparison base",
      buyerReport: "Buyer report",
    },
    futureImpact: {
      title: "Future infrastructure impact",
      sections: {
        narrative: "Impact narrative",
        catalysts: "Positive catalysts",
        checks: "Disruption and supply checks",
      },
      metrics: {
        score: "Impact score",
        within2km: "Within 2 km",
        nearest: "Nearest project",
        confidence: "Nearest confidence",
      },
      labels: {
        status: "Status",
        expected: "Expected",
        distance: "Distance",
        effects: "Effects",
        risks: "Checks",
      },
      values: {
        noData: "No data.",
        noYear: "year unknown",
        projects: (count) => `${count} project${count === 1 ? "" : "s"}`,
        meters: (meters) => `${meters} m`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "positive",
          mixed: "mixed",
          disruption_risk: "disruption",
          supply_pressure: "supply pressure",
        },
      },
    },
    fields: {
      title: "Title",
      developer: "Developer",
      investment: "Investment / project",
      address: "Address",
      city: "City",
      district: "District",
      market: "Market",
      purchaseIntent: "Purchase goal",
      renovationCondition: "Renovation condition",
      renovationBudget: "Custom renovation budget",
      price: "Price",
      area: "Area m2",
      rooms: "Rooms",
      floor: "Floor",
      buildingFloors: "Building floors",
      buildingYear: "Building year",
      privateAnalysis: "Use this information only to prepare a private apartment check",
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
      fairPriceMid: "Fair price estimate",
      confidence: "Confidence",
      priceLabel: "Price assessment",
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
      privateDraft: "Saved apartment",
      expires: "Expires",
    },
    statuses: {
      ready: "Ready to check",
      noLink: "No link added",
      linkNotChecked: "Link not checked",
      importNotStarted: "Auto-import has not run",
      reportNotCreated: "Report not created",
      notSaved: "Not saved",
      aiReadyAfterCheck: "Apartment assistant is ready after a check",
      aiQuestionsUnavailable: "Apartment questions are temporarily unavailable",
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
      aiReady: "Apartment assistant ready",
      aiNeedsDraft: "Save the apartment before asking follow-up questions",
      aiDraftRequired: "Save the apartment before asking follow-up questions",
      aiBuilding: "Preparing answer...",
      aiRefused: "Answer unavailable for this request",
      aiSaved: () => "Answer saved",
      aiUnavailable: "Answer unavailable",
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
      manual: "entered details",
      manualInput: "entered details",
      notSaved: "not saved",
      noDraft: "not saved",
      dash: "-",
      primary: "primary",
      secondary: "secondary",
      purchaseIntents: {
        self: "For myself",
        family: "Family with children",
        rental: "Rental",
        investment: "Investment",
        unsure: "Not sure",
      },
      renovationConditionUnknown: "not sure",
      renovationConditions: {
        move_in_ready: "Move-in ready",
        refresh: "Refresh",
        light_renovation: "Light renovation",
        full_renovation: "Full renovation",
        shell_developer_standard: "Shell / developer standard",
        custom_budget: "Custom budget",
      },
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Based on available sources",
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
      aiReady: "Answer will appear after your question.",
      aiNeedsSavedDraft: "Save the apartment before asking follow-up questions.",
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
      guardrails: "Limits",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Sprawdź mieszkanie",
    subtitle: "Dane mieszkania, szacowany zakres ceny, ryzyka, negocjacje i najbliższe porównania.",
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
      aiAssistant: "Asystent mieszkania",
      conclusions: "Wnioski",
      negotiation: "Negocjacje",
      comparables: "Baza porównań",
      buyerReport: "Raport kupującego",
    },
    futureImpact: {
      title: "Wpływ przyszłej infrastruktury",
      sections: {
        narrative: "Narracja wpływu",
        catalysts: "Pozytywne katalizatory",
        checks: "Ryzyka budowy i podaży",
      },
      metrics: {
        score: "Impact score",
        within2km: "W promieniu 2 km",
        nearest: "Najbliższy projekt",
        confidence: "Pewność najbliższego",
      },
      labels: {
        status: "Status",
        expected: "Termin",
        distance: "Odległość",
        effects: "Efekty",
        risks: "Do sprawdzenia",
      },
      values: {
        noData: "Brak danych.",
        noYear: "rok nieznany",
        projects: (count) => `${count} ${pluralPl(count, "projekt", "projekty", "projektów")}`,
        meters: (meters) => `${meters} m`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "pozytywny",
          mixed: "mieszany",
          disruption_risk: "utrudnienia",
          supply_pressure: "presja podaży",
        },
      },
    },
    fields: {
      title: "Tytuł",
      developer: "Deweloper",
      investment: "Inwestycja / projekt",
      address: "Adres",
      city: "Miasto",
      district: "Dzielnica",
      market: "Rynek",
      purchaseIntent: "Cel zakupu",
      renovationCondition: "Stan remontu",
      renovationBudget: "Własny budżet remontu",
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
      investmentScore: "Potencjał inwestycji",
      riskScore: "Ryzyko",
      fairPriceMid: "Szacowana cena",
      confidence: "Pewność",
      priceLabel: "Ocena ceny",
      provider: "Źródło",
      domain: "Domena",
      reference: "Odniesienie",
      requiredFields: "Wymagane pola",
      importStatus: "Status importu",
      extracted: "Wyciągnięto",
      http: "HTTP",
      source: "Źródło",
      objectPrice: "Cena obiektu",
      pricePerM2: "Cena za m2",
      fairPriceRange: "Zakres ceny rynkowej",
      comparableListings: "Oferty porównawcze",
      sourceDomain: "Domena źródła",
      privateDraft: "Zapisane mieszkanie",
      expires: "Wygasa",
    },
    statuses: {
      ready: "Gotowe do sprawdzenia",
      noLink: "Nie dodano linku",
      linkNotChecked: "Link niesprawdzony",
      importNotStarted: "Auto-import nie był uruchomiony",
      reportNotCreated: "Raport nieutworzony",
      notSaved: "Nie zapisano",
      aiReadyAfterCheck: "Asystent mieszkania będzie gotowy po sprawdzeniu",
      aiQuestionsUnavailable: "Pytania o mieszkanie są chwilowo niedostępne",
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
      aiReady: "Asystent mieszkania gotowy",
      aiNeedsDraft: "Zapisz mieszkanie przed zadaniem pytania",
      aiDraftRequired: "Zapisz mieszkanie przed zadaniem pytania",
      aiBuilding: "Przygotowujemy odpowiedź...",
      aiRefused: "Nie można przygotować odpowiedzi na to pytanie",
      aiSaved: () => "Odpowiedź zapisana",
      aiUnavailable: "Odpowiedź chwilowo niedostępna",
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
      noDraft: "nie zapisano",
      dash: "-",
      primary: "pierwotny",
      secondary: "wtórny",
      purchaseIntents: {
        self: "Dla siebie",
        family: "Rodzina z dziećmi",
        rental: "Najem",
        investment: "Inwestycja",
        unsure: "Nie wiem",
      },
      renovationConditionUnknown: "nie wiem",
      renovationConditions: {
        move_in_ready: "Gotowe do wprowadzenia",
        refresh: "Odświeżenie",
        light_renovation: "Lekki remont",
        full_renovation: "Pełny remont",
        shell_developer_standard: "Stan deweloperski",
        custom_budget: "Własny budżet",
      },
      buyer: "Kupujący",
      realtor: "Pośrednik",
      investor: "Inwestor",
      refused: "Odrzucono",
      sourceGrounded: "Na podstawie dostępnych źródeł",
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
      aiReady: "Odpowiedź pojawi się po zadaniu pytania.",
      aiNeedsSavedDraft: "Zapisz mieszkanie przed zadaniem pytania.",
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
      guardrails: "Ograniczenia",
    },
    fallbackQuestion: {
      label: "Podsumowanie obiektu",
      description: "Krótkie podsumowanie decyzji na podstawie dostępnych danych.",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Проверить квартиру",
    subtitle: "Адрес, параметры объекта, оценочный диапазон цены, риски, торг и ближайшие аналоги.",
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
      aiAssistant: "Ассистент по квартире",
      conclusions: "Выводы",
      negotiation: "Торг",
      comparables: "База сравнения",
      buyerReport: "Отчет для покупателя",
    },
    futureImpact: {
      title: "Влияние будущей инфраструктуры",
      sections: {
        narrative: "Нарратив влияния",
        catalysts: "Позитивные катализаторы",
        checks: "Риски стройки и нового предложения",
      },
      metrics: {
        score: "Оценка влияния",
        within2km: "В радиусе 2 км",
        nearest: "Ближайший проект",
        confidence: "Уверенность по ближайшему",
      },
      labels: {
        status: "Статус",
        expected: "Срок",
        distance: "Расстояние",
        effects: "Эффекты",
        risks: "Проверки",
      },
      values: {
        noData: "Нет данных.",
        noYear: "год неизвестен",
        projects: (count) => `${count} ${pluralRu(count, "проект", "проекта", "проектов")}`,
        meters: (meters) => `${meters} м`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "позитив",
          mixed: "смешанный",
          disruption_risk: "стройка",
          supply_pressure: "давление предложения",
        },
      },
    },
    fields: {
      title: "Название",
      developer: "Застройщик",
      investment: "Инвестиция / проект",
      address: "Адрес",
      city: "Город",
      district: "Район",
      market: "Рынок",
      purchaseIntent: "Цель покупки",
      renovationCondition: "Состояние ремонта",
      renovationBudget: "Свой бюджет ремонта",
      price: "Цена",
      area: "Площадь m2",
      rooms: "Комнаты",
      floor: "Этаж",
      buildingFloors: "Этажей в доме",
      buildingYear: "Год дома",
      privateAnalysis: "Использовать данные только для частной проверки квартиры",
      audience: "Аудитория",
      topic: "Тема",
      question: "Вопрос",
    },
    placeholders: {
      sourceUrl: "https://www.otodom.pl/...",
      optional: "необязательно",
      customQuestion: "Например: какие риски проверить до zadatek?",
    },
    metrics: {
      verdict: "Вердикт",
      investmentScore: "Инвестиционный потенциал",
      riskScore: "Риск",
      fairPriceMid: "Рыночная оценка",
      confidence: "Уверенность",
      priceLabel: "Оценка цены",
      provider: "Источник",
      domain: "Домен",
      reference: "Ссылка",
      requiredFields: "Обязательные поля",
      importStatus: "Статус импорта",
      extracted: "Найдено",
      http: "HTTP",
      source: "Источник",
      objectPrice: "Цена объекта",
      pricePerM2: "Цена за m2",
      fairPriceRange: "Рыночный диапазон",
      comparableListings: "Похожие объявления",
      sourceDomain: "Источник объявления",
      privateDraft: "Сохраненная квартира",
      expires: "Истекает",
    },
    statuses: {
      ready: "Готово к проверке",
      noLink: "Ссылка не добавлена",
      linkNotChecked: "Ссылка не проверена",
      importNotStarted: "Автоимпорт не запускался",
      reportNotCreated: "Отчет не создан",
      notSaved: "Не сохранен",
      aiReadyAfterCheck: "Ассистент по квартире готов после проверки",
      aiQuestionsUnavailable: "Вопросы по квартире временно недоступны",
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
      aiReady: "Ассистент по квартире готов",
      aiNeedsDraft: "Сохраните квартиру перед вопросом",
      aiDraftRequired: "Сохраните квартиру перед вопросом",
      aiBuilding: "Готовим ответ...",
      aiRefused: "Не можем подготовить ответ на этот вопрос",
      aiSaved: () => "Ответ сохранен",
      aiUnavailable: "Ответ временно недоступен",
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
      manual: "введено вручную",
      manualInput: "введено вручную",
      notSaved: "не сохранено",
      noDraft: "не сохранено",
      dash: "-",
      primary: "первичный рынок",
      secondary: "вторичный рынок",
      purchaseIntents: {
        self: "Для себя",
        family: "Семья с детьми",
        rental: "Аренда",
        investment: "Инвестиция",
        unsure: "Не уверен",
      },
      renovationConditionUnknown: "не знаю",
      renovationConditions: {
        move_in_ready: "Можно въезжать",
        refresh: "Освежить",
        light_renovation: "Легкий ремонт",
        full_renovation: "Полный ремонт",
        shell_developer_standard: "без отделки от застройщика",
        custom_budget: "Свой бюджет",
      },
      buyer: "Покупатель",
      realtor: "Риелтор",
      investor: "Инвестор",
      refused: "Ответ недоступен",
      sourceGrounded: "На основе доступных источников",
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
      aiReady: "Ответ появится после вопроса.",
      aiNeedsSavedDraft: "Сохраните квартиру перед вопросом.",
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
      guardrails: "Ограничения",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Перевірити квартиру",
    subtitle: "Адреса, параметри об'єкта, оціночний діапазон ціни, ризики, торг і найближчі аналоги.",
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
      aiAssistant: "Асистент по квартирі",
      conclusions: "Висновки",
      negotiation: "Торг",
      comparables: "База порівняння",
      buyerReport: "Звіт для покупця",
    },
    futureImpact: {
      title: "Вплив майбутньої інфраструктури",
      sections: {
        narrative: "Наратив впливу",
        catalysts: "Позитивні каталізатори",
        checks: "Ризики будівництва і пропозиції",
      },
      metrics: {
        score: "Оцінка впливу",
        within2km: "У радіусі 2 км",
        nearest: "Найближчий проект",
        confidence: "Впевненість щодо найближчого",
      },
      labels: {
        status: "Статус",
        expected: "Термін",
        distance: "Відстань",
        effects: "Ефекти",
        risks: "Перевірки",
      },
      values: {
        noData: "Немає даних.",
        noYear: "рік невідомий",
        projects: (count) => `${count} ${pluralUk(count, "проект", "проекти", "проектів")}`,
        meters: (meters) => `${meters} м`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "позитив",
          mixed: "змішаний",
          disruption_risk: "будівництво",
          supply_pressure: "тиск пропозиції",
        },
      },
    },
    fields: {
      title: "Назва",
      developer: "Забудовник",
      investment: "Інвестиція / проект",
      address: "Адреса",
      city: "Місто",
      district: "Район",
      market: "Ринок",
      purchaseIntent: "Ціль купівлі",
      renovationCondition: "Стан ремонту",
      renovationBudget: "Свій бюджет ремонту",
      price: "Ціна",
      area: "Площа m2",
      rooms: "Кімнати",
      floor: "Поверх",
      buildingFloors: "Поверхів у будинку",
      buildingYear: "Рік будинку",
      privateAnalysis: "Використовувати дані лише для приватної перевірки квартири",
      audience: "Аудиторія",
      topic: "Тема",
      question: "Питання",
    },
    placeholders: {
      sourceUrl: "https://www.otodom.pl/...",
      optional: "необов'язково",
      customQuestion: "Наприклад: які ризики перевірити до zadatek?",
    },
    metrics: {
      verdict: "Вердикт",
      investmentScore: "Інвестиційний потенціал",
      riskScore: "Ризик",
      fairPriceMid: "Ринкова оцінка",
      confidence: "Впевненість",
      priceLabel: "Оцінка ціни",
      provider: "Джерело",
      domain: "Домен",
      reference: "Посилання",
      requiredFields: "Обов'язкові поля",
      importStatus: "Статус імпорту",
      extracted: "Знайдено",
      http: "HTTP",
      source: "Джерело",
      objectPrice: "Ціна об'єкта",
      pricePerM2: "Ціна за m2",
      fairPriceRange: "Ринковий діапазон",
      comparableListings: "Схожі оголошення",
      sourceDomain: "Джерело оголошення",
      privateDraft: "Збережена квартира",
      expires: "Спливає",
    },
    statuses: {
      ready: "Готово до перевірки",
      noLink: "Посилання не додано",
      linkNotChecked: "Посилання не перевірено",
      importNotStarted: "Автоімпорт не запускався",
      reportNotCreated: "Звіт не створено",
      notSaved: "Не збережено",
      aiReadyAfterCheck: "Асистент по квартирі готовий після перевірки",
      aiQuestionsUnavailable: "Питання про квартиру тимчасово недоступні",
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
      aiReady: "Асистент по квартирі готовий",
      aiNeedsDraft: "Збережіть квартиру перед запитанням",
      aiDraftRequired: "Збережіть квартиру перед запитанням",
      aiBuilding: "Готуємо відповідь...",
      aiRefused: "Не можемо підготувати відповідь на це питання",
      aiSaved: () => "Відповідь збережено",
      aiUnavailable: "Відповідь тимчасово недоступна",
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
      manual: "введено вручну",
      manualInput: "введено вручну",
      notSaved: "не збережено",
      noDraft: "не збережено",
      dash: "-",
      primary: "первинний ринок",
      secondary: "вторинний ринок",
      purchaseIntents: {
        self: "Для себе",
        family: "Сім'я з дітьми",
        rental: "Оренда",
        investment: "Інвестиція",
        unsure: "Не впевнений",
      },
      renovationConditionUnknown: "не знаю",
      renovationConditions: {
        move_in_ready: "Можна заїжджати",
        refresh: "Освіжити",
        light_renovation: "Легкий ремонт",
        full_renovation: "Повний ремонт",
        shell_developer_standard: "без оздоблення від забудовника",
        custom_budget: "Свій бюджет",
      },
      buyer: "Покупець",
      realtor: "Ріелтор",
      investor: "Інвестор",
      refused: "Відповідь недоступна",
      sourceGrounded: "На основі доступних джерел",
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
      aiReady: "Відповідь з'явиться після запитання.",
      aiNeedsSavedDraft: "Збережіть квартиру перед запитанням.",
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
      guardrails: "Обмеження",
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
    title: "My apartments",
    subtitle: "Saved apartment checks, current estimates and next actions.",
    actions: {
      newCheck: "New check",
      refresh: "Refresh",
      report: "Report",
      delete: "Delete",
      html: "HTML",
    },
    sections: { history: "Saved apartments" },
    table: {
      object: "Object",
      parameters: "Parameters",
      score: "Score",
      privateRef: "Saved item",
      retention: "Available until",
      actions: "Actions",
    },
    statuses: {
      loading: "Loading checks...",
      loaded: (count) => `Checks: ${count}`,
      backendUnavailable: "The data service is temporarily unavailable",
      deleting: "Deleting...",
      deleteError: "Delete error",
      deleted: "Check deleted",
      reportGenerating: "Generating report...",
      reportSaved: (reportId) => `Report saved: ${reportId}`,
      reportError: "Report generation error",
      orderCreating: "Creating order...",
      paidReportReady: () => "Report ready",
      paymentError: "Payment error",
    },
    values: {
      manualInput: "manual input",
      rooms: (count) => `${count} room${count === 1 ? "" : "s"}`,
      dataQualityPrefix: "Data quality",
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
    title: "Moje mieszkania",
    subtitle: "Zapisane sprawdzenia mieszkań, aktualne szacunki i kolejne działania.",
    actions: {
      newCheck: "Nowe sprawdzenie",
      refresh: "Odśwież",
      report: "Raport",
      delete: "Usuń",
      html: "HTML",
    },
    sections: { history: "Zapisane mieszkania" },
    table: {
      object: "Obiekt",
      parameters: "Parametry",
      score: "Ocena",
      privateRef: "Zapisane mieszkanie",
      retention: "Dostępne do",
      actions: "Działania",
    },
    statuses: {
      loading: "Ładowanie sprawdzeń...",
      loaded: (count) => `Sprawdzeń: ${count}`,
      backendUnavailable: "Usługa danych jest chwilowo niedostępna",
      deleting: "Usuwanie...",
      deleteError: "Błąd usuwania",
      deleted: "Sprawdzenie usunięte",
      reportGenerating: "Generowanie raportu...",
      reportSaved: (reportId) => `Raport zapisany: ${reportId}`,
      reportError: "Błąd generowania raportu",
      orderCreating: "Tworzenie zamówienia...",
      paidReportReady: () => "Raport gotowy",
      paymentError: "Błąd płatności",
    },
    values: {
      manualInput: "ręczne dane",
      rooms: (count) => `${count} pok.`,
      dataQualityPrefix: "Jakość danych",
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
    title: "Мои квартиры",
    subtitle: "Сохраненные проверки квартир, текущие оценки и следующие действия.",
    actions: {
      newCheck: "Новая проверка",
      refresh: "Обновить",
      report: "Отчет",
      delete: "Удалить",
      html: "HTML",
    },
    sections: { history: "Сохраненные квартиры" },
    table: {
      object: "Объект",
      parameters: "Параметры",
      score: "Оценка",
      privateRef: "Сохраненная квартира",
      retention: "Доступно до",
      actions: "Действия",
    },
    statuses: {
      loading: "Загрузка проверок...",
      loaded: (count) => `Проверок: ${count}`,
      backendUnavailable: "Сервис данных временно недоступен",
      deleting: "Удаление...",
      deleteError: "Ошибка удаления",
      deleted: "Проверка удалена",
      reportGenerating: "Генерация отчета...",
      reportSaved: (reportId) => `Отчет сохранен: ${reportId}`,
      reportError: "Ошибка генерации отчета",
      orderCreating: "Создание заказа...",
      paidReportReady: () => "Отчет готов",
      paymentError: "Ошибка оплаты",
    },
    values: {
      manualInput: "ручной ввод",
      rooms: (count) => `${count} ${pluralRu(count, "комната", "комнаты", "комнат")}`,
      dataQualityPrefix: "Качество данных",
    },
    retention: {
      expired: "истекло",
      expiresToday: "истекает сегодня",
      daysLeft: (days) => `${days} ${pluralRu(days, "день", "дня", "дней")} осталось`,
    },
    empty: {
      noDrafts: "Пока нет сохраненных проверок.",
      loading: "Загрузка данных",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Мої квартири",
    subtitle: "Збережені перевірки квартир, поточні оцінки та наступні дії.",
    actions: {
      newCheck: "Нова перевірка",
      refresh: "Оновити",
      report: "Звіт",
      delete: "Видалити",
      html: "HTML",
    },
    sections: { history: "Збережені квартири" },
    table: {
      object: "Об'єкт",
      parameters: "Параметри",
      score: "Оцінка",
      privateRef: "Збережена квартира",
      retention: "Доступно до",
      actions: "Дії",
    },
    statuses: {
      loading: "Завантаження перевірок...",
      loaded: (count) => `Перевірок: ${count}`,
      backendUnavailable: "Сервіс даних тимчасово недоступний",
      deleting: "Видалення...",
      deleteError: "Помилка видалення",
      deleted: "Перевірку видалено",
      reportGenerating: "Генерація звіту...",
      reportSaved: (reportId) => `Звіт збережено: ${reportId}`,
      reportError: "Помилка генерації звіту",
      orderCreating: "Створення замовлення...",
      paidReportReady: () => "Звіт готовий",
      paymentError: "Помилка оплати",
    },
    values: {
      manualInput: "ручне введення",
      rooms: (count) => `${count} ${pluralUk(count, "кімната", "кімнати", "кімнат")}`,
      dataQualityPrefix: "Якість даних",
    },
    retention: {
      expired: "минуло",
      expiresToday: "минає сьогодні",
      daysLeft: (days) => `${days} ${pluralUk(days, "день", "дні", "днів")} залишилось`,
    },
    empty: {
      noDrafts: "Поки немає збережених перевірок.",
      loading: "Завантаження даних",
    },
    errorPrefix: "Помилка",
  },
};

export const REPORTS_PAGE_COPY: Record<Locale, ReportsPageCopy> = {
  en: {
    title: "Reports",
    subtitle: "Saved property reports for apartment decisions.",
    actions: {
      refresh: "Refresh",
      generate: "Generate",
      open: "Open",
      email: "Email",
      csv: "CSV",
      json: "JSON",
      pdf: "PDF",
    },
    sections: {
      create: "Create report",
      history: "History",
    },
    fields: {
      listingId: "Selected apartment",
      audience: "Audience",
      agency: "Agency",
      agent: "Agent",
      email: "Email",
      phone: "Phone",
      website: "Website",
      note: "Note",
      logoUrl: "Logo URL",
      primaryColor: "Primary",
      accentColor: "Accent",
      footer: "Footer",
      disclaimer: "Legal note",
      whiteLabel: "Branding",
    },
    table: {
      report: "Report",
      object: "Object",
      audience: "Audience",
      insight: "Insight",
      date: "Date",
      content: "Content",
      pdf: "PDF",
    },
    statuses: {
      loading: "Loading reports...",
      loaded: (count) => `Reports: ${count}`,
      backendUnavailable: "Service is temporarily unavailable",
      generating: "Generating report...",
      reportSaved: (reportId) => `Report saved: ${reportId}`,
    },
    values: {
      exportUnavailable: "Export is available on professional plans",
      whiteLabelHint: "Logo, colors and custom footer require a professional plan.",
      items: (count) => `${count} item${count === 1 ? "" : "s"}`,
      noInsight: "No saved summary",
      unknownError: "Something went wrong",
      audienceLabels: {
        buyer: "Buyer",
        realtor: "Realtor",
        investor: "Investor",
      },
      insightLabels: {
        object_explanation: "Object explanation",
        area_summary: "Area summary",
        report_summary: "Report summary",
      },
    },
    empty: {
      loading: "Loading reports",
      noReports: "No saved reports yet.",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Raporty",
    subtitle: "Zapisane raporty pomagające podjąć decyzję o mieszkaniu.",
    actions: {
      refresh: "Odśwież",
      generate: "Generuj",
      open: "Otwórz",
      email: "Email",
      csv: "CSV",
      json: "JSON",
      pdf: "PDF",
    },
    sections: {
      create: "Utwórz raport",
      history: "Historia",
    },
    fields: {
      listingId: "Wybrane mieszkanie",
      audience: "Odbiorca",
      agency: "Agencja",
      agent: "Agent",
      email: "Email",
      phone: "Telefon",
      website: "Strona",
      note: "Notatka",
      logoUrl: "Logo URL",
      primaryColor: "Kolor główny",
      accentColor: "Akcent",
      footer: "Stopka",
      disclaimer: "Nota prawna",
      whiteLabel: "Branding",
    },
    table: {
      report: "Raport",
      object: "Obiekt",
      audience: "Odbiorca",
      insight: "Wniosek",
      date: "Data",
      content: "Treść",
      pdf: "PDF",
    },
    statuses: {
      loading: "Ładowanie raportów...",
      loaded: (count) => `Raportów: ${count}`,
      backendUnavailable: "Usługa jest chwilowo niedostępna",
      generating: "Generowanie raportu...",
      reportSaved: (reportId) => `Raport zapisany: ${reportId}`,
    },
    values: {
      exportUnavailable: "Eksport jest dostępny w planach profesjonalnych",
      whiteLabelHint: "Logo, kolory i własna stopka wymagają planu profesjonalnego.",
      items: (count) => `${count} ${pluralPl(count, "element", "elementy", "elementów")}`,
      noInsight: "Brak zapisanego podsumowania",
      unknownError: "nieznany błąd",
      audienceLabels: {
        buyer: "Kupujący",
        realtor: "Pośrednik",
        investor: "Inwestor",
      },
      insightLabels: {
        object_explanation: "Opis obiektu",
        area_summary: "Podsumowanie obszaru",
        report_summary: "Podsumowanie raportu",
      },
    },
    empty: {
      loading: "Ładowanie raportów",
      noReports: "Nie ma jeszcze zapisanych raportów.",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Отчеты",
    subtitle: "Сохраненные отчеты, которые помогают принять решение по квартире.",
    actions: {
      refresh: "Обновить",
      generate: "Сгенерировать",
      open: "Открыть",
      email: "Email",
      csv: "CSV",
      json: "JSON",
      pdf: "PDF",
    },
    sections: {
      create: "Создать отчет",
      history: "История",
    },
    fields: {
      listingId: "Выбранная квартира",
      audience: "Для кого отчет",
      agency: "Агентство",
      agent: "Агент",
      email: "Email",
      phone: "Телефон",
      website: "Сайт",
      note: "Заметка",
      logoUrl: "URL логотипа",
      primaryColor: "Основной цвет",
      accentColor: "Акцент",
      footer: "Нижний текст",
      disclaimer: "Правовое примечание",
      whiteLabel: "Брендинг",
    },
    table: {
      report: "Отчет",
      object: "Объект",
      audience: "Аудитория",
      insight: "Инсайт",
      date: "Дата",
      content: "Контент",
      pdf: "PDF",
    },
    statuses: {
      loading: "Загрузка отчетов...",
      loaded: (count) => `Отчетов: ${count}`,
      backendUnavailable: "Сервис временно недоступен",
      generating: "Генерация отчета...",
      reportSaved: (reportId) => `Отчет сохранен: ${reportId}`,
    },
    values: {
      exportUnavailable: "Экспорт доступен на профессиональных тарифах",
      whiteLabelHint: "Логотип, цвета и свой нижний текст доступны на профессиональном тарифе.",
      items: (count) => `${count} ${pluralRu(count, "элемент", "элемента", "элементов")}`,
      noInsight: "Нет сохраненного резюме",
      unknownError: "неизвестная ошибка",
      audienceLabels: {
        buyer: "Покупатель",
        realtor: "Риелтор",
        investor: "Инвестор",
      },
      insightLabels: {
        object_explanation: "Пояснение по объекту",
        area_summary: "Резюме района",
        report_summary: "Резюме отчета",
      },
    },
    empty: {
      loading: "Загрузка отчетов",
      noReports: "Пока нет сохраненных отчетов.",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Звіти",
    subtitle: "Збережені звіти, які допомагають прийняти рішення щодо квартири.",
    actions: {
      refresh: "Оновити",
      generate: "Згенерувати",
      open: "Відкрити",
      email: "Email",
      csv: "CSV",
      json: "JSON",
      pdf: "PDF",
    },
    sections: {
      create: "Створити звіт",
      history: "Історія",
    },
    fields: {
      listingId: "Вибрана квартира",
      audience: "Для кого звіт",
      agency: "Агентство",
      agent: "Агент",
      email: "Email",
      phone: "Телефон",
      website: "Сайт",
      note: "Нотатка",
      logoUrl: "URL логотипа",
      primaryColor: "Основний колір",
      accentColor: "Акцент",
      footer: "Нижній текст",
      disclaimer: "Правова примітка",
      whiteLabel: "Брендинг",
    },
    table: {
      report: "Звіт",
      object: "Об'єкт",
      audience: "Аудиторія",
      insight: "Інсайт",
      date: "Дата",
      content: "Контент",
      pdf: "PDF",
    },
    statuses: {
      loading: "Завантаження звітів...",
      loaded: (count) => `Звітів: ${count}`,
      backendUnavailable: "Сервіс тимчасово недоступний",
      generating: "Генерація звіту...",
      reportSaved: (reportId) => `Звіт збережено: ${reportId}`,
    },
    values: {
      exportUnavailable: "Експорт доступний на професійних тарифах",
      whiteLabelHint: "Логотип, кольори й власний нижній текст доступні на професійному тарифі.",
      items: (count) => `${count} ${pluralUk(count, "елемент", "елементи", "елементів")}`,
      noInsight: "Немає збереженого резюме",
      unknownError: "невідома помилка",
      audienceLabels: {
        buyer: "Покупець",
        realtor: "Ріелтор",
        investor: "Інвестор",
      },
      insightLabels: {
        object_explanation: "Пояснення щодо об'єкта",
        area_summary: "Резюме району",
        report_summary: "Резюме звіту",
      },
    },
    empty: {
      loading: "Завантаження звітів",
      noReports: "Поки немає збережених звітів.",
    },
    errorPrefix: "Помилка",
  },
};

export const PRICING_PAGE_COPY: Record<Locale, PricingPageCopy> = {
  en: {
    title: "Buyer reports and pricing",
    subtitle: "Pay for a decision-first report: avoid overpaying, catch risks and prepare negotiation.",
    actions: {
      refresh: "Refresh",
      buyReport: "Buy report",
      open: "Open",
      events: "Details",
      checkApartment: "Check apartment",
      chooseArea: "Choose area",
    },
    metrics: {
      currentPlan: "Current plan",
      subscriptionReports: "Subscription reports",
      oneTimeOrders: "One-time orders",
      status: "Status",
    },
    sections: {
      oneTimeReport: "Decision report",
      invoice: "Invoice",
      orderHistory: "Order history",
      subscriptions: "Subscriptions",
      auditTrail: "Payment history",
    },
    hints: {
      reportContext: "Reports are attached to a checked apartment or selected area.",
      contextMissing: "Open this page from an apartment analysis or area page to buy a report for that property.",
      apartmentContext: "This report will be prepared for the selected apartment.",
      areaContext: "This report will be prepared for the selected area.",
      bundleContext: "Use report bundles after you save apartments to My apartments.",
    },
    fields: {
      b2bInvoice: "Invoice for company",
      company: "Company",
      vat: "VAT/NIP",
      email: "Email",
      address: "Address",
      postalCode: "Postal code",
      city: "City",
      country: "Country",
    },
    table: {
      order: "Order",
      object: "Object",
      status: "Status",
      invoice: "Invoice",
      report: "Report",
      audit: "Details",
    },
    statuses: {
      loading: "Loading pricing...",
      ready: "Ready",
      backendUnavailable: "Service is temporarily unavailable",
      creatingOrder: (title) => `Creating order: ${title}...`,
      checkout: () => "Payment step is ready",
      paid: () => "Payment accepted",
      reportReady: () => "Report is ready",
      auditEvents: () => "Payment history loaded",
      contextNeeded: "Choose an apartment or area first",
    },
    values: {
      unknownError: "Something went wrong",
      noValue: "-",
      eventFallback: "event",
      orders: (count) => `${count} order${count === 1 ? "" : "s"}`,
      events: (count) => `${count} event${count === 1 ? "" : "s"}`,
      auditEmpty: "Select an order to see payment and report history.",
      whiteLabel: "custom branding",
      standard: "standard reports",
      planSummary: (monthlyReports, maxAlerts, branding) =>
        `${monthlyReports} reports/month, ${maxAlerts} tracked searches, ${branding}`,
    },
    empty: {
      loading: "Loading pricing",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Raporty kupującego i cennik",
    subtitle: "Raport decyzyjny: nie przepłacić, wykryć ryzyka i przygotować negocjacje.",
    actions: {
      refresh: "Odśwież",
      buyReport: "Kup raport",
      open: "Otwórz",
      events: "Szczegóły",
      checkApartment: "Sprawdź mieszkanie",
      chooseArea: "Wybierz dzielnicę",
    },
    metrics: {
      currentPlan: "Aktualny plan",
      subscriptionReports: "Raporty w abonamencie",
      oneTimeOrders: "Zamówienia jednorazowe",
      status: "Status",
    },
    sections: {
      oneTimeReport: "Raport decyzyjny",
      invoice: "Faktura",
      orderHistory: "Historia zamówień",
      subscriptions: "Subskrypcje",
      auditTrail: "Historia płatności",
    },
    hints: {
      reportContext: "Raport jest przypięty do sprawdzonego mieszkania albo wybranej dzielnicy.",
      contextMissing: "Otwórz tę stronę z analizy mieszkania albo strony dzielnicy, aby kupić właściwy raport.",
      apartmentContext: "Raport zostanie przygotowany dla wybranego mieszkania.",
      areaContext: "Raport zostanie przygotowany dla wybranej dzielnicy.",
      bundleContext: "Pakiet raportów wykorzystasz po zapisaniu mieszkań w Moich mieszkaniach.",
    },
    fields: {
      b2bInvoice: "Faktura na firmę",
      company: "Firma",
      vat: "VAT/NIP",
      email: "Email",
      address: "Adres",
      postalCode: "Kod pocztowy",
      city: "Miasto",
      country: "Kraj",
    },
    table: {
      order: "Zamówienie",
      object: "Obiekt",
      status: "Status",
      invoice: "Faktura",
      report: "Raport",
      audit: "Szczegóły",
    },
    statuses: {
      loading: "Ładowanie cennika...",
      ready: "Gotowe",
      backendUnavailable: "Usługa jest chwilowo niedostępna",
      creatingOrder: (title) => `Tworzenie zamówienia: ${title}...`,
      checkout: () => "Krok płatności jest gotowy",
      paid: () => "Płatność przyjęta",
      reportReady: () => "Raport jest gotowy",
      auditEvents: () => "Historia płatności załadowana",
      contextNeeded: "Najpierw wybierz mieszkanie albo dzielnicę",
    },
    values: {
      unknownError: "nieznany błąd",
      noValue: "-",
      eventFallback: "zdarzenie",
      orders: (count) => `${count} ${pluralPl(count, "zamówienie", "zamówienia", "zamówień")}`,
      events: (count) => `${count} ${pluralPl(count, "zdarzenie", "zdarzenia", "zdarzeń")}`,
      auditEmpty: "Wybierz zamówienie, aby zobaczyć historię płatności i raportu.",
      whiteLabel: "własne oznaczenie marki",
      standard: "standardowe raporty",
      planSummary: (monthlyReports, maxAlerts, branding) =>
        `${monthlyReports} raportów/mies., ${maxAlerts} śledzonych wyszukiwań, ${branding}`,
    },
    empty: {
      loading: "Ładowanie cennika",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Отчеты покупателя и цены",
    subtitle: "Отчет перед покупкой: не переплатить, не купить проблему и подготовиться к торгу.",
    actions: {
      refresh: "Обновить",
      buyReport: "Купить отчет",
      open: "Открыть",
      events: "События",
      checkApartment: "Проверить квартиру",
      chooseArea: "Выбрать район",
    },
    metrics: {
      currentPlan: "Текущий тариф",
      subscriptionReports: "Отчеты по подписке",
      oneTimeOrders: "Разовые заказы",
      status: "Статус",
    },
    sections: {
      oneTimeReport: "Отчет для решения",
      invoice: "Счет",
      orderHistory: "История заказов",
      subscriptions: "Подписки",
      auditTrail: "История оплаты",
    },
    hints: {
      reportContext: "Отчет привязан к проверенной квартире или выбранному району.",
      contextMissing: "Откройте эту страницу из анализа квартиры или страницы района, чтобы купить нужный отчет.",
      apartmentContext: "Отчет будет подготовлен для выбранной квартиры.",
      areaContext: "Отчет будет подготовлен для выбранного района.",
      bundleContext: "Пакет отчетов удобно использовать после сохранения квартир в Моих квартирах.",
    },
    fields: {
      b2bInvoice: "Счет на компанию",
      company: "Компания",
      vat: "VAT/NIP",
      email: "Email",
      address: "Адрес",
      postalCode: "Почтовый код",
      city: "Город",
      country: "Страна",
    },
    table: {
      order: "Заказ",
      object: "Объект",
      status: "Статус",
      invoice: "Счет",
      report: "Отчет",
      audit: "Детали",
    },
    statuses: {
      loading: "Загрузка тарифов...",
      ready: "Готово",
      backendUnavailable: "Сервис временно недоступен",
      creatingOrder: (title) => `Создание заказа: ${title}...`,
      checkout: () => "Шаг оплаты готов",
      paid: () => "Оплата принята",
      reportReady: () => "Отчет готов",
      auditEvents: () => "История оплаты загружена",
      contextNeeded: "Сначала выберите квартиру или район",
    },
    values: {
      unknownError: "неизвестная ошибка",
      noValue: "-",
      eventFallback: "событие",
      orders: (count) => `${count} ${pluralRu(count, "заказ", "заказа", "заказов")}`,
      events: (count) => `${count} ${pluralRu(count, "событие", "события", "событий")}`,
      auditEmpty: "Выберите заказ, чтобы увидеть историю оплаты и отчета.",
      whiteLabel: "оформление под бренд",
      standard: "стандарт",
      planSummary: (monthlyReports, maxAlerts, branding) =>
        `${monthlyReports} отчетов/мес, ${maxAlerts} уведомлений, ${branding}`,
    },
    empty: {
      loading: "Загрузка тарифов",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Звіти покупця і ціни",
    subtitle: "Звіт перед купівлею: не переплатити, не купити проблему й підготуватися до торгу.",
    actions: {
      refresh: "Оновити",
      buyReport: "Купити звіт",
      open: "Відкрити",
      events: "Події",
      checkApartment: "Перевірити квартиру",
      chooseArea: "Вибрати район",
    },
    metrics: {
      currentPlan: "Поточний тариф",
      subscriptionReports: "Звіти за підпискою",
      oneTimeOrders: "Разові замовлення",
      status: "Статус",
    },
    sections: {
      oneTimeReport: "Звіт для рішення",
      invoice: "Рахунок",
      orderHistory: "Історія замовлень",
      subscriptions: "Підписки",
      auditTrail: "Історія оплати",
    },
    hints: {
      reportContext: "Звіт прив'язаний до перевіреної квартири або вибраного району.",
      contextMissing: "Відкрийте цю сторінку з аналізу квартири або сторінки району, щоб купити потрібний звіт.",
      apartmentContext: "Звіт буде підготовлено для вибраної квартири.",
      areaContext: "Звіт буде підготовлено для вибраного району.",
      bundleContext: "Пакет звітів зручно використати після збереження квартир у Моїх квартирах.",
    },
    fields: {
      b2bInvoice: "Рахунок на компанію",
      company: "Компанія",
      vat: "VAT/NIP",
      email: "Email",
      address: "Адреса",
      postalCode: "Поштовий код",
      city: "Місто",
      country: "Країна",
    },
    table: {
      order: "Замовлення",
      object: "Об'єкт",
      status: "Статус",
      invoice: "Рахунок",
      report: "Звіт",
      audit: "Деталі",
    },
    statuses: {
      loading: "Завантаження тарифів...",
      ready: "Готово",
      backendUnavailable: "Сервіс тимчасово недоступний",
      creatingOrder: (title) => `Створення замовлення: ${title}...`,
      checkout: () => "Крок оплати готовий",
      paid: () => "Оплату прийнято",
      reportReady: () => "Звіт готовий",
      auditEvents: () => "Історію оплати завантажено",
      contextNeeded: "Спочатку виберіть квартиру або район",
    },
    values: {
      unknownError: "невідома помилка",
      noValue: "-",
      eventFallback: "подія",
      orders: (count) => `${count} ${pluralUk(count, "замовлення", "замовлення", "замовлень")}`,
      events: (count) => `${count} ${pluralUk(count, "подія", "події", "подій")}`,
      auditEmpty: "Виберіть замовлення, щоб побачити історію оплати і звіту.",
      whiteLabel: "оформлення під бренд",
      standard: "стандарт",
      planSummary: (monthlyReports, maxAlerts, branding) =>
        `${monthlyReports} звітів/міс., ${maxAlerts} сповіщень, ${branding}`,
    },
    empty: {
      loading: "Завантаження тарифів",
    },
    errorPrefix: "Помилка",
  },
};

export const ALERTS_PAGE_COPY: Record<Locale, AlertsPageCopy> = {
  en: {
    title: "Apartment tracking",
    subtitle: "Track searches and apartments by price changes, availability and better comparable options.",
    actions: {
      refresh: "Refresh",
      create: "Create",
      preview: "Preview",
      dryRun: "Test update",
      checkSend: "Send update",
      clientDigest: "Buyer summary",
      delete: "Delete",
    },
    sections: {
      newAlert: "Track apartments like these",
      alerts: "Tracked searches",
      preview: "Preview",
      realtorDigest: "Buyer summary",
      deliveryHistory: "Recent updates",
    },
    fields: {
      name: "Name",
      municipality: "Gmina",
      voivodeship: "Voivodeship",
      district: "District",
      search: "Search",
      maxPrice: "Max price",
      rooms: "Rooms",
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
      maxBuildingFloors: "Building floors to",
      minBuildingYear: "Building year from",
      maxBuildingYear: "Building year to",
      minInvestment: "Investment potential from",
      maxFairDelta: "Maximum above fair range",
      minNegotiation: "Negotiation potential from",
      minLiquidity: "Liquidity from",
      minRental: "Rental potential from",
      minPriceReductions: "Price drops from",
      maxDaysOnMarket: "Days on market to",
      channel: "Channel",
      frequency: "Frequency",
      deliveryTarget: "Send updates to",
      active: "Active",
      client: "Client",
      intro: "Intro",
      maxMatches: "Objects",
      includeSourceLinks: "Add source links",
    },
    placeholders: {
      municipality: "Wrocław / Kobierzyce",
      voivodeship: "dolnoslaskie",
      search: "address, district, street",
      telegramTarget: "Telegram chat id",
      emailTarget: "email optional",
      clientName: "Anna",
      digestIntro: "Short context for the client",
    },
    options: alertOptions("en"),
    statuses: {
      loading: "Loading alerts...",
      loaded: (count) => `Alerts: ${count}`,
      backendUnavailable: "The data service is temporarily unavailable",
      creating: "Starting tracking...",
      created: () => "Tracking is enabled",
      previewLoaded: (count) => `Matches: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Tracking updated: ${name}`,
      updateError: "Could not update tracking",
      deleteConfirm: (name) => `Stop tracking "${name}"?`,
      deleted: (name) => `Tracking stopped: ${name}`,
      deleteError: "Could not stop tracking",
      saving: "Saving preferences...",
      digestReady: (items, total) => `Client digest: ${items}/${total} matches`,
      digestError: "Could not build client digest",
    },
    values: {
      unknownError: "Something went wrong",
      unknownAlertUpdateError: "unknown tracking update error",
      unknownAlertDeleteError: "unknown tracking delete error",
      unknownDigestError: "unknown digest error",
      items: (count) => `${count} item${count === 1 ? "" : "s"}`,
      matches: (count) => `${count} match${count === 1 ? "" : "es"}`,
      digestMatches: (items, total) => `${items}/${total} matches`,
      notGenerated: "not generated",
      defaultTarget: "default target",
      active: "active",
      paused: "paused",
      yes: "yes",
      no: "no",
      alertNameDefault: "Fabryczna under 700k",
      rooms: (count) => `${count} room${count === 1 ? "" : "s"}`,
      priceDrops: (count) => `${count} drop${count === 1 ? "" : "s"}`,
      scoreLabels: {
        investment: "Investment",
        risk: "Risk",
        fairDelta: "Price vs market",
        negotiation: "Negotiation",
        liquidity: "Liquidity",
        rental: "Rent",
      },
      filterLabels: alertFilterLabels("en"),
    },
    empty: {
      loading: "Loading alerts",
      noAlerts: "No alerts yet.",
      previewPrompt: "Choose an alert to see matching listings.",
      digestPrompt: "Fill in the parameters and click Client digest on the relevant alert.",
      noDeliveryJobs: "Delivery jobs have not run yet.",
    },
    table: {
      channel: "Channel",
      status: "Status",
      matches: "Matches",
      message: "Message",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Śledzenie mieszkań",
    subtitle: "Śledź wyszukiwania i mieszkania: zmiany ceny, dostępność oraz lepsze podobne oferty.",
    actions: {
      refresh: "Odśwież",
      create: "Włącz",
      preview: "Podgląd",
      dryRun: "Test aktualizacji",
      checkSend: "Wyślij aktualizację",
      clientDigest: "Podsumowanie dla kupującego",
      delete: "Usuń",
    },
    sections: {
      newAlert: "Śledź podobne mieszkania",
      alerts: "Śledzone wyszukiwania",
      preview: "Podgląd",
      realtorDigest: "Podsumowanie dla kupującego",
      deliveryHistory: "Ostatnie aktualizacje",
    },
    fields: {
      name: "Nazwa",
      municipality: "Gmina",
      voivodeship: "Województwo",
      district: "Dzielnica",
      search: "Wyszukiwanie",
      maxPrice: "Maks. cena",
      rooms: "Pokoje",
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
      maxBuildingFloors: "Pięter w budynku do",
      minBuildingYear: "Rok budynku od",
      maxBuildingYear: "Rok budynku do",
      minInvestment: "Potencjał inwestycyjny od",
      maxFairDelta: "Maksymalnie ponad ceną rynkową",
      minNegotiation: "Potencjał negocjacji od",
      minLiquidity: "Płynność od",
      minRental: "Potencjał najmu od",
      minPriceReductions: "Obniżek ceny od",
      maxDaysOnMarket: "Dni na rynku do",
      channel: "Kanał",
      frequency: "Częstotliwość",
      deliveryTarget: "Adres aktualizacji",
      active: "Aktywny",
      client: "Klient",
      intro: "Wprowadzenie",
      maxMatches: "Obiekty",
      includeSourceLinks: "Dodaj linki źródłowe",
    },
    placeholders: {
      municipality: "Wrocław / Kobierzyce",
      voivodeship: "dolnoslaskie",
      search: "adres, dzielnica, ulica",
      telegramTarget: "Identyfikator czatu Telegram",
      emailTarget: "email opcjonalny",
      clientName: "Anna",
      digestIntro: "Krótki kontekst dla klienta",
    },
    options: alertOptions("pl"),
    statuses: {
      loading: "Ładowanie alertów...",
      loaded: (count) => `Alertów: ${count}`,
      backendUnavailable: "Usługa danych jest chwilowo niedostępna",
      creating: "Włączanie śledzenia...",
      created: () => "Śledzenie włączone",
      previewLoaded: (count) => `Dopasowań: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Śledzenie zaktualizowane: ${name}`,
      updateError: "Nie udało się zaktualizować śledzenia",
      deleteConfirm: (name) => `Wyłączyć śledzenie "${name}"?`,
      deleted: (name) => `Śledzenie wyłączone: ${name}`,
      deleteError: "Nie udało się wyłączyć śledzenia",
      saving: "Zapisywanie ustawień...",
      digestReady: (items, total) => `Digest klienta: ${items}/${total} dopasowań`,
      digestError: "Nie udało się zbudować digestu klienta",
    },
    values: {
      unknownError: "nieznany błąd",
      unknownAlertUpdateError: "nieznany błąd aktualizacji śledzenia",
      unknownAlertDeleteError: "nieznany błąd wyłączania śledzenia",
      unknownDigestError: "nieznany błąd podsumowania",
      items: (count) => `${count} ${pluralPl(count, "element", "elementy", "elementów")}`,
      matches: (count) => `${count} ${pluralPl(count, "dopasowanie", "dopasowania", "dopasowań")}`,
      digestMatches: (items, total) => `${items}/${total} dopasowań`,
      notGenerated: "nie wygenerowano",
      defaultTarget: "domyślny cel",
      active: "aktywny",
      paused: "pauza",
      yes: "tak",
      no: "nie",
      alertNameDefault: "Fabryczna do 700k",
      rooms: (count) => `${count} pok.`,
      priceDrops: (count) => `${count} ${pluralPl(count, "obniżka", "obniżki", "obniżek")}`,
      scoreLabels: {
        investment: "Inwestycja",
        risk: "Ryzyko",
        fairDelta: "Cena vs rynek",
        negotiation: "Negocjacje",
        liquidity: "Płynność",
        rental: "Najem",
      },
      filterLabels: alertFilterLabels("pl"),
    },
    empty: {
      loading: "Ładowanie alertów",
      noAlerts: "Nie śledzisz jeszcze żadnego wyszukiwania.",
      previewPrompt: "Wybierz śledzone wyszukiwanie, aby zobaczyć pasujące mieszkania.",
      digestPrompt: "Wybierz śledzone wyszukiwanie, aby przygotować podsumowanie.",
      noDeliveryJobs: "Nie ma jeszcze wysłanych aktualizacji.",
    },
    table: {
      channel: "Kanał",
      status: "Status",
      matches: "Dopasowania",
      message: "Komunikat",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Отслеживание квартир",
    subtitle: "Следите за поисками и квартирами: изменения цены, доступность и лучшие похожие варианты.",
    actions: {
      refresh: "Обновить",
      create: "Создать",
      preview: "Предпросмотр",
      dryRun: "Тест обновления",
      checkSend: "Отправить обновление",
      clientDigest: "Сводка для покупателя",
      delete: "Удалить",
    },
    sections: {
      newAlert: "Следить за похожими квартирами",
      alerts: "Отслеживаемые поиски",
      preview: "Предпросмотр",
      realtorDigest: "Сводка для покупателя",
      deliveryHistory: "Последние обновления",
    },
    fields: {
      name: "Название",
      municipality: "Гмина",
      voivodeship: "Воеводство",
      district: "Район",
      search: "Поиск",
      maxPrice: "Макс. цена",
      rooms: "Комнаты",
      buildingType: "Тип здания",
      renovationState: "Состояние",
      balcony: "Балкон",
      terrace: "Терраса",
      garden: "Сад",
      elevator: "Лифт",
      parking: "Паркинг",
      heating: "Отопление",
      minFloor: "Этаж от",
      maxFloor: "Этаж до",
      maxBuildingFloors: "Этажность до",
      minBuildingYear: "Год дома от",
      maxBuildingYear: "Год дома до",
      minInvestment: "Инвестиционный потенциал от",
      maxFairDelta: "Максимум выше рыночного диапазона",
      minNegotiation: "Потенциал торга от",
      minLiquidity: "Ликвидность от",
      minRental: "Потенциал аренды от",
      minPriceReductions: "Снижений цены от",
      maxDaysOnMarket: "Дней на рынке до",
      channel: "Канал",
      frequency: "Частота",
      deliveryTarget: "Адрес доставки",
      active: "Активность",
      client: "Клиент",
      intro: "Вступление",
      maxMatches: "Объектов",
      includeSourceLinks: "Добавить ссылки на источники",
    },
    placeholders: {
      municipality: "Wrocław / Kobierzyce",
      voivodeship: "dolnoslaskie",
      search: "адрес, район, улица",
      telegramTarget: "Идентификатор чата Telegram",
      emailTarget: "email, необязательно",
      clientName: "Anna",
      digestIntro: "Короткий контекст для клиента",
    },
    options: alertOptions("ru"),
    statuses: {
      loading: "Загрузка отслеживаний...",
      loaded: (count) => `Отслеживаний: ${count}`,
      backendUnavailable: "Сервис данных временно недоступен",
      creating: "Включаем отслеживание...",
      created: () => "Отслеживание включено",
      previewLoaded: (count) => `Совпадений: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Отслеживание обновлено: ${name}`,
      updateError: "Не удалось обновить отслеживание",
      deleteConfirm: (name) => `Отключить отслеживание "${name}"?`,
      deleted: (name) => `Отслеживание отключено: ${name}`,
      deleteError: "Не удалось отключить отслеживание",
      saving: "Сохранение настроек...",
      digestReady: (items, total) => `Сводка: ${items}/${total} совпадений`,
      digestError: "Не удалось собрать сводку",
    },
    values: {
      unknownError: "неизвестная ошибка",
      unknownAlertUpdateError: "неизвестная ошибка обновления отслеживания",
      unknownAlertDeleteError: "неизвестная ошибка отключения отслеживания",
      unknownDigestError: "неизвестная ошибка дайджеста",
      items: (count) => `${count} ${pluralRu(count, "элемент", "элемента", "элементов")}`,
      matches: (count) => `${count} ${pluralRu(count, "совпадение", "совпадения", "совпадений")}`,
      digestMatches: (items, total) => `${items}/${total} совпадений`,
      notGenerated: "не сгенерировано",
      defaultTarget: "канал по умолчанию",
      active: "активен",
      paused: "на паузе",
      yes: "да",
      no: "нет",
      alertNameDefault: "Fabryczna до 700k",
      rooms: (count) => `${count} ${pluralRu(count, "комната", "комнаты", "комнат")}`,
      priceDrops: (count) => `${count} ${pluralRu(count, "снижение", "снижения", "снижений")}`,
      scoreLabels: {
        investment: "Инвестиции",
        risk: "Риск",
        fairDelta: "Цена к рынку",
        negotiation: "Торг",
        liquidity: "Ликвидность",
        rental: "Аренда",
      },
      filterLabels: alertFilterLabels("ru"),
    },
    empty: {
      loading: "Загрузка отслеживаний",
      noAlerts: "Вы пока не отслеживаете ни один поиск.",
      previewPrompt: "Выберите отслеживаемый поиск, чтобы увидеть подходящие квартиры.",
      digestPrompt: "Выберите отслеживаемый поиск, чтобы подготовить сводку.",
      noDeliveryJobs: "Обновления еще не отправлялись.",
    },
    table: {
      channel: "Канал",
      status: "Статус",
      matches: "Совпадения",
      message: "Сообщение",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Стеження за квартирами",
    subtitle: "Стежте за пошуками й квартирами: зміни ціни, доступність і кращі схожі варіанти.",
    actions: {
      refresh: "Оновити",
      create: "Створити",
      preview: "Попередній перегляд",
      dryRun: "Тест оновлення",
      checkSend: "Надіслати оновлення",
      clientDigest: "Зведення для покупця",
      delete: "Видалити",
    },
    sections: {
      newAlert: "Стежити за схожими квартирами",
      alerts: "Відстежувані пошуки",
      preview: "Попередній перегляд",
      realtorDigest: "Зведення для покупця",
      deliveryHistory: "Останні оновлення",
    },
    fields: {
      name: "Назва",
      municipality: "Гміна",
      voivodeship: "Воєводство",
      district: "Район",
      search: "Пошук",
      maxPrice: "Макс. ціна",
      rooms: "Кімнати",
      buildingType: "Тип будівлі",
      renovationState: "Стан",
      balcony: "Балкон",
      terrace: "Тераса",
      garden: "Сад",
      elevator: "Ліфт",
      parking: "Паркінг",
      heating: "Опалення",
      minFloor: "Поверх від",
      maxFloor: "Поверх до",
      maxBuildingFloors: "Поверховість до",
      minBuildingYear: "Рік будинку від",
      maxBuildingYear: "Рік будинку до",
      minInvestment: "Інвестиційний потенціал від",
      maxFairDelta: "Максимум вище ринкового діапазону",
      minNegotiation: "Потенціал торгу від",
      minLiquidity: "Ліквідність від",
      minRental: "Потенціал оренди від",
      minPriceReductions: "Знижень ціни від",
      maxDaysOnMarket: "Днів на ринку до",
      channel: "Канал",
      frequency: "Частота",
      deliveryTarget: "Адреса доставки",
      active: "Активність",
      client: "Клієнт",
      intro: "Вступ",
      maxMatches: "Об'єктів",
      includeSourceLinks: "Додати посилання на джерела",
    },
    placeholders: {
      municipality: "Wrocław / Kobierzyce",
      voivodeship: "dolnoslaskie",
      search: "адреса, район, вулиця",
      telegramTarget: "Ідентифікатор чату Telegram",
      emailTarget: "email, необов'язково",
      clientName: "Anna",
      digestIntro: "Короткий контекст для клієнта",
    },
    options: alertOptions("uk"),
    statuses: {
      loading: "Завантаження відстежень...",
      loaded: (count) => `Відстежень: ${count}`,
      backendUnavailable: "Сервіс даних тимчасово недоступний",
      creating: "Вмикаємо стеження...",
      created: () => "Стеження увімкнено",
      previewLoaded: (count) => `Збігів: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Стеження оновлено: ${name}`,
      updateError: "Не вдалося оновити стеження",
      deleteConfirm: (name) => `Вимкнути стеження "${name}"?`,
      deleted: (name) => `Стеження вимкнено: ${name}`,
      deleteError: "Не вдалося вимкнути стеження",
      saving: "Збереження налаштувань...",
      digestReady: (items, total) => `Зведення: ${items}/${total} збігів`,
      digestError: "Не вдалося зібрати зведення",
    },
    values: {
      unknownError: "невідома помилка",
      unknownAlertUpdateError: "невідома помилка оновлення стеження",
      unknownAlertDeleteError: "невідома помилка вимкнення стеження",
      unknownDigestError: "невідома помилка дайджесту",
      items: (count) => `${count} ${pluralUk(count, "елемент", "елементи", "елементів")}`,
      matches: (count) => `${count} ${pluralUk(count, "збіг", "збіги", "збігів")}`,
      digestMatches: (items, total) => `${items}/${total} збігів`,
      notGenerated: "не згенеровано",
      defaultTarget: "канал за замовчуванням",
      active: "активний",
      paused: "на паузі",
      yes: "так",
      no: "ні",
      alertNameDefault: "Fabryczna до 700k",
      rooms: (count) => `${count} ${pluralUk(count, "кімната", "кімнати", "кімнат")}`,
      priceDrops: (count) => `${count} ${pluralUk(count, "зниження", "зниження", "знижень")}`,
      scoreLabels: {
        investment: "Інвестиції",
        risk: "Ризик",
        fairDelta: "Ціна до ринку",
        negotiation: "Торг",
        liquidity: "Ліквідність",
        rental: "Оренда",
      },
      filterLabels: alertFilterLabels("uk"),
    },
    empty: {
      loading: "Завантаження відстежень",
      noAlerts: "Ви ще не відстежуєте жоден пошук.",
      previewPrompt: "Виберіть відстежуваний пошук, щоб побачити відповідні квартири.",
      digestPrompt: "Виберіть відстежуваний пошук, щоб підготувати зведення.",
      noDeliveryJobs: "Оновлення ще не надсилалися.",
    },
    table: {
      channel: "Канал",
      status: "Статус",
      matches: "Збіги",
      message: "Повідомлення",
    },
    errorPrefix: "Помилка",
  },
};

export const ACCOUNT_PAGE_COPY: Record<Locale, AccountPageCopy> = {
  en: {
    title: "Account and subscription",
    subtitle: "Your plan, report limits and saved product access.",
    actions: {
      refresh: "Refresh",
      refreshCrm: "Refresh CRM",
      create: "Create",
      add: "Add",
      delete: "Delete",
      select: "Select",
      choose: "Choose",
      current: "Current",
      createClient: "Create client",
      addNote: "Add note",
      build: "Build",
      enableShare: "Enable share",
      disableShare: "Disable share",
      preview: "Preview",
      publicLink: "Public link",
      open: "Open",
    },
    sections: {
      plans: "Plans",
      profile: "Profile",
      usage: "Plan use",
      capabilities: "Capabilities",
      agencyWorkspace: "Agency workspace",
      agencyCrm: "Agency CRM",
      notes: "Notes",
      shortlist: "Shortlist",
      sharePreview: "Share preview",
      oneTimePurchases: "One-time purchases",
    },
    metrics: {
      plan: "Plan",
      role: "Role",
      reports: "Reports",
      credits: "Credits",
      alerts: "Alerts",
      owner: "Owner",
      city: "City",
      members: "Members",
      status: "Status",
      budget: "Budget",
      rooms: "Rooms",
      location: "Location",
      consent: "Consent",
    },
    fields: {
      name: "Name",
      billingEmail: "Billing email",
      website: "Website",
      city: "City",
      action: "Action",
      plan: "Plan",
      userId: "User ID",
      email: "Email",
      displayName: "Name",
      role: "Role",
      status: "Status",
      client: "Client",
      phone: "Phone",
      district: "District",
      budgetMin: "Budget min",
      budgetMax: "Budget max",
      rooms: "Rooms",
      tags: "Tags",
      profileNotes: "Profile notes",
      consent: "Consent",
      note: "Note",
      visibility: "Visibility",
      pinned: "Pinned",
      title: "Title",
      listingIds: "Selected apartments",
      reportIds: "Report IDs",
      clientMessage: "Message for the client",
      shareLink: "Share link",
      id: "ID",
      planId: "Plan ID",
    },
    placeholders: {
      agencyName: "Example Realty",
      billingEmail: "billing@example.com",
      website: "https://example.com",
      userId: "agent-1",
      memberEmail: "agent@example.com",
      memberName: "Agent One",
      clientName: "Anna Buyer",
      clientEmail: "anna@example.com",
      phone: "+48...",
      district: "Fabryczna",
      budgetMin: "650000",
      budgetMax: "900000",
      rooms: "2, 3",
      tags: "family, investor",
      profileNotes: "Quiet building, tram access",
      note: "What matters for the client or object check",
      shortlistTitle: "Top options for Anna",
      listingIds: "wr-001, wr-002",
      reportIds: "optional saved reports",
      clientMessage: "These options are worth discussing before viewings.",
    },
    labels: accountLabels("en"),
    tables: {
      member: "Member",
      email: "Email",
      role: "Role",
      status: "Status",
      action: "Action",
      product: "Product",
      object: "Object",
      report: "Report",
      price: "Price",
      score: "Score",
      fairDelta: "Fair delta",
      developer: "Developer",
    },
    statuses: accountStatuses("en"),
    values: {
      activeBadge: "active",
      favorites: (count) => `${count} favorites`,
      alerts: (count) => `${count} alerts`,
      monthlyReports: (count) => `${count} reports / month`,
      whiteLabelReports: "White-label reports",
      noWhiteLabel: "No white-label",
      workspaces: (count) => `${count} workspace${count === 1 ? "" : "s"}`,
      clients: (count, agencyName) => `${count} client${count === 1 ? "" : "s"} · ${agencyName}`,
      orders: (count) => `${count} order${count === 1 ? "" : "s"}`,
      reportCredits: (count) => `Report credits: ${count}`,
      agencyEnabled: "Agency enabled",
      agencyPlanRequired: "Agency plan required",
      yes: "Yes",
      no: "No",
      noValue: "-",
      pinnedPrefix: "Pinned · ",
      listingsUpdated: (count, updatedAt) =>
        `${count} listing${count === 1 ? "" : "s"} · ${updatedAt}`,
      fairMid: (value) => `Fair mid ${value}`,
      scoreDetails: (risk, liquidity) => `Risk ${risk}/100 · liquidity ${liquidity}/100`,
      developerReputation: (score, label) => `${score}/100 · ${label ?? ""}`,
      noReputationData: "no reputation data",
      budgetTo: (value) => `to ${value}`,
      budgetFrom: (value) => `from ${value}`,
    },
    empty: {
      crmClients: "CRM clients will appear here after creation.",
      shortlists: "Shortlists will appear after building them from listing IDs.",
      crmClientPrompt: "Choose or create a CRM client for notes and shortlists.",
      shortlistItems: "The shortlist has no valid database listings yet.",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Konto i subskrypcja",
    subtitle: "Twój plan, limity raportów i dostęp do zapisanych funkcji.",
    actions: {
      refresh: "Odśwież",
      refreshCrm: "Odśwież CRM",
      create: "Utwórz",
      add: "Dodaj",
      delete: "Usuń",
      select: "Wybierz",
      choose: "Wybierz",
      current: "Aktualny",
      createClient: "Utwórz klienta",
      addNote: "Dodaj notatkę",
      build: "Zbuduj",
      enableShare: "Włącz share",
      disableShare: "Wyłącz share",
      preview: "Podgląd",
      publicLink: "Publiczny link",
      open: "Otwórz",
    },
    sections: {
      plans: "Plany",
      profile: "Profil",
      usage: "Plan use",
      capabilities: "Możliwości",
      agencyWorkspace: "Agency workspace",
      agencyCrm: "Agency CRM",
      notes: "Notatki",
      shortlist: "Shortlist",
      sharePreview: "Podgląd share",
      oneTimePurchases: "Zakupy jednorazowe",
    },
    metrics: {
      plan: "Plan",
      role: "Rola",
      reports: "Raporty",
      credits: "Kredyty",
      alerts: "Alerty",
      owner: "Owner",
      city: "Miasto",
      members: "Członkowie",
      status: "Status",
      budget: "Budżet",
      rooms: "Pokoje",
      location: "Lokalizacja",
      consent: "Zgoda",
    },
    fields: {
      name: "Nazwa",
      billingEmail: "Email do rozliczeń",
      website: "Strona",
      city: "Miasto",
      action: "Akcja",
      plan: "Plan",
      userId: "User ID",
      email: "Email",
      displayName: "Nazwa",
      role: "Rola",
      status: "Status",
      client: "Klient",
      phone: "Telefon",
      district: "Dzielnica",
      budgetMin: "Budżet min",
      budgetMax: "Budżet max",
      rooms: "Pokoje",
      tags: "Tagi",
      profileNotes: "Notatki profilu",
      consent: "Zgoda",
      note: "Notatka",
      visibility: "Widoczność",
      pinned: "Przypięte",
      title: "Tytuł",
      listingIds: "Wybrane mieszkania",
      reportIds: "Report IDs",
      clientMessage: "Wiadomość dla klienta",
      shareLink: "Link share",
      id: "ID",
      planId: "Plan ID",
    },
    placeholders: {
      agencyName: "Example Realty",
      billingEmail: "billing@example.com",
      website: "https://example.com",
      userId: "agent-1",
      memberEmail: "agent@example.com",
      memberName: "Agent One",
      clientName: "Anna Buyer",
      clientEmail: "anna@example.com",
      phone: "+48...",
      district: "Fabryczna",
      budgetMin: "650000",
      budgetMax: "900000",
      rooms: "2, 3",
      tags: "family, investor",
      profileNotes: "Cichy budynek, dostęp do tramwaju",
      note: "Co jest ważne dla klienta lub sprawdzenia obiektu",
      shortlistTitle: "Najlepsze opcje dla Anny",
      listingIds: "wr-001, wr-002",
      reportIds: "opcjonalne zapisane raporty",
      clientMessage: "Te opcje warto omówić przed oglądaniem.",
    },
    labels: accountLabels("pl"),
    tables: {
      member: "Członek",
      email: "Email",
      role: "Rola",
      status: "Status",
      action: "Akcja",
      product: "Produkt",
      object: "Obiekt",
      report: "Raport",
      price: "Cena",
      score: "Score",
      fairDelta: "Fair delta",
      developer: "Deweloper",
    },
    statuses: accountStatuses("pl"),
    values: {
      activeBadge: "aktywny",
      favorites: (count) => `${count} ulubionych`,
      alerts: (count) => `${count} alertów`,
      monthlyReports: (count) => `${count} raportów / miesiąc`,
      whiteLabelReports: "Raporty white-label",
      noWhiteLabel: "Bez white-label",
      workspaces: (count) => `${count} ${pluralPl(count, "workspace", "workspace'y", "workspace'ów")}`,
      clients: (count, agencyName) =>
        `${count} ${pluralPl(count, "klient", "klientów", "klientów")} · ${agencyName}`,
      orders: (count) => `${count} ${pluralPl(count, "zamówienie", "zamówienia", "zamówień")}`,
      reportCredits: (count) => `Kredyty raportów: ${count}`,
      agencyEnabled: "Agency włączone",
      agencyPlanRequired: "Wymagany plan Agency",
      yes: "Tak",
      no: "Nie",
      noValue: "-",
      pinnedPrefix: "Przypięte · ",
      listingsUpdated: (count, updatedAt) =>
        `${count} ${pluralPl(count, "listing", "listingi", "listingów")} · ${updatedAt}`,
      fairMid: (value) => `Fair mid ${value}`,
      scoreDetails: (risk, liquidity) => `Risk ${risk}/100 · liquidity ${liquidity}/100`,
      developerReputation: (score, label) => `${score}/100 · ${label ?? ""}`,
      noReputationData: "brak danych reputacji",
      budgetTo: (value) => `do ${value}`,
      budgetFrom: (value) => `od ${value}`,
    },
    empty: {
      crmClients: "Klienci CRM pojawią się tutaj po utworzeniu.",
      shortlists: "Shortlisty pojawią się po zbudowaniu ich z listing IDs.",
      crmClientPrompt: "Wybierz lub utwórz klienta CRM dla notatek i shortlist.",
      shortlistItems: "Shortlist nie ma jeszcze poprawnych obiektów z bazy.",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Аккаунт и подписка",
    subtitle: "Ваш тариф, лимиты отчетов и доступ к сохраненным функциям.",
    actions: {
      refresh: "Обновить",
      refreshCrm: "Обновить CRM",
      create: "Создать",
      add: "Добавить",
      delete: "Удалить",
      select: "Выбрать",
      choose: "Выбрать",
      current: "Текущий",
      createClient: "Создать клиента",
      addNote: "Добавить заметку",
      build: "Собрать",
      enableShare: "Включить share",
      disableShare: "Отключить share",
      preview: "Preview",
      publicLink: "Public link",
      open: "Открыть",
    },
    sections: {
      plans: "Планы",
      profile: "Профиль",
      usage: "Plan use",
      capabilities: "Capabilities",
      agencyWorkspace: "Agency workspace",
      agencyCrm: "Agency CRM",
      notes: "Заметки",
      shortlist: "Shortlist",
      sharePreview: "Share preview",
      oneTimePurchases: "Разовые покупки",
    },
    metrics: {
      plan: "Тариф",
      role: "Роль",
      reports: "Отчеты",
      credits: "Credits",
      alerts: "Alerts",
      owner: "Owner",
      city: "Город",
      members: "Участники",
      status: "Статус",
      budget: "Бюджет",
      rooms: "Комнаты",
      location: "Локация",
      consent: "Согласие",
    },
    fields: {
      name: "Название",
      billingEmail: "Billing email",
      website: "Website",
      city: "City",
      action: "Action",
      plan: "Plan",
      userId: "User ID",
      email: "Email",
      displayName: "Name",
      role: "Role",
      status: "Status",
      client: "Клиент",
      phone: "Phone",
      district: "District",
      budgetMin: "Budget min",
      budgetMax: "Budget max",
      rooms: "Rooms",
      tags: "Tags",
      profileNotes: "Profile notes",
      consent: "Consent",
      note: "Заметка",
      visibility: "Visibility",
      pinned: "Pinned",
      title: "Title",
      listingIds: "Выбранные квартиры",
      reportIds: "Report IDs",
      clientMessage: "Message for the client",
      shareLink: "Share link",
      id: "ID",
      planId: "Plan ID",
    },
    placeholders: {
      agencyName: "Example Realty",
      billingEmail: "billing@example.com",
      website: "https://example.com",
      userId: "agent-1",
      memberEmail: "agent@example.com",
      memberName: "Agent One",
      clientName: "Anna Buyer",
      clientEmail: "anna@example.com",
      phone: "+48...",
      district: "Fabryczna",
      budgetMin: "650000",
      budgetMax: "900000",
      rooms: "2, 3",
      tags: "family, investor",
      profileNotes: "Тихий дом, доступ к трамваю",
      note: "Что важно для клиента или проверки объекта",
      shortlistTitle: "Top options for Anna",
      listingIds: "wr-001, wr-002",
      reportIds: "optional saved reports",
      clientMessage: "Эти варианты стоит обсудить до просмотров.",
    },
    labels: accountLabels("ru"),
    tables: {
      member: "Участник",
      email: "Email",
      role: "Роль",
      status: "Статус",
      action: "Действие",
      product: "Продукт",
      object: "Объект",
      report: "Отчет",
      price: "Цена",
      score: "Score",
      fairDelta: "Fair delta",
      developer: "Developer",
    },
    statuses: accountStatuses("ru"),
    values: {
      activeBadge: "active",
      favorites: (count) => `${count} избранных`,
      alerts: (count) => `${count} alerts`,
      monthlyReports: (count) => `${count} отчетов / месяц`,
      whiteLabelReports: "White-label reports",
      noWhiteLabel: "Без white-label",
      workspaces: (count) => `${count} ${pluralRu(count, "workspace", "workspace", "workspaces")}`,
      clients: (count, agencyName) =>
        `${count} ${pluralRu(count, "клиент", "клиента", "клиентов")} · ${agencyName}`,
      orders: (count) => `${count} ${pluralRu(count, "заказ", "заказа", "заказов")}`,
      reportCredits: (count) => `Report credits: ${count}`,
      agencyEnabled: "Agency enabled",
      agencyPlanRequired: "Нужен тариф Agency",
      yes: "Да",
      no: "Нет",
      noValue: "-",
      pinnedPrefix: "Pinned · ",
      listingsUpdated: (count, updatedAt) =>
        `${count} ${pluralRu(count, "объект", "объекта", "объектов")} · ${updatedAt}`,
      fairMid: (value) => `Fair mid ${value}`,
      scoreDetails: (risk, liquidity) => `Risk ${risk}/100 · liquidity ${liquidity}/100`,
      developerReputation: (score, label) => `${score}/100 · ${label ?? ""}`,
      noReputationData: "нет данных репутации",
      budgetTo: (value) => `до ${value}`,
      budgetFrom: (value) => `от ${value}`,
    },
    empty: {
      crmClients: "CRM clients появятся здесь после создания.",
      shortlists: "Shortlists появятся после сборки по listing ids.",
      crmClientPrompt: "Выбери или создай CRM клиента для заметок и shortlist.",
      shortlistItems: "В shortlist пока нет валидных объектов из базы.",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Акаунт і підписка",
    subtitle: "Ваш тариф, ліміти звітів і доступ до збережених функцій.",
    actions: {
      refresh: "Оновити",
      refreshCrm: "Оновити CRM",
      create: "Створити",
      add: "Додати",
      delete: "Видалити",
      select: "Вибрати",
      choose: "Вибрати",
      current: "Поточний",
      createClient: "Створити клієнта",
      addNote: "Додати нотатку",
      build: "Зібрати",
      enableShare: "Увімкнути share",
      disableShare: "Вимкнути share",
      preview: "Preview",
      publicLink: "Public link",
      open: "Відкрити",
    },
    sections: {
      plans: "Плани",
      profile: "Профіль",
      usage: "Plan use",
      capabilities: "Capabilities",
      agencyWorkspace: "Agency workspace",
      agencyCrm: "Agency CRM",
      notes: "Нотатки",
      shortlist: "Shortlist",
      sharePreview: "Share preview",
      oneTimePurchases: "Разові покупки",
    },
    metrics: {
      plan: "Тариф",
      role: "Роль",
      reports: "Звіти",
      credits: "Credits",
      alerts: "Alerts",
      owner: "Owner",
      city: "Місто",
      members: "Учасники",
      status: "Статус",
      budget: "Бюджет",
      rooms: "Кімнати",
      location: "Локація",
      consent: "Згода",
    },
    fields: {
      name: "Назва",
      billingEmail: "Billing email",
      website: "Website",
      city: "City",
      action: "Action",
      plan: "Plan",
      userId: "User ID",
      email: "Email",
      displayName: "Name",
      role: "Role",
      status: "Status",
      client: "Клієнт",
      phone: "Phone",
      district: "District",
      budgetMin: "Budget min",
      budgetMax: "Budget max",
      rooms: "Rooms",
      tags: "Tags",
      profileNotes: "Profile notes",
      consent: "Consent",
      note: "Нотатка",
      visibility: "Visibility",
      pinned: "Pinned",
      title: "Title",
      listingIds: "Вибрані квартири",
      reportIds: "Report IDs",
      clientMessage: "Message for the client",
      shareLink: "Share link",
      id: "ID",
      planId: "Plan ID",
    },
    placeholders: {
      agencyName: "Example Realty",
      billingEmail: "billing@example.com",
      website: "https://example.com",
      userId: "agent-1",
      memberEmail: "agent@example.com",
      memberName: "Agent One",
      clientName: "Anna Buyer",
      clientEmail: "anna@example.com",
      phone: "+48...",
      district: "Fabryczna",
      budgetMin: "650000",
      budgetMax: "900000",
      rooms: "2, 3",
      tags: "family, investor",
      profileNotes: "Тихий будинок, доступ до трамвая",
      note: "Що важливо для клієнта або перевірки об'єкта",
      shortlistTitle: "Top options for Anna",
      listingIds: "wr-001, wr-002",
      reportIds: "optional saved reports",
      clientMessage: "Ці варіанти варто обговорити перед переглядами.",
    },
    labels: accountLabels("uk"),
    tables: {
      member: "Учасник",
      email: "Email",
      role: "Роль",
      status: "Статус",
      action: "Дія",
      product: "Продукт",
      object: "Об'єкт",
      report: "Звіт",
      price: "Ціна",
      score: "Score",
      fairDelta: "Fair delta",
      developer: "Developer",
    },
    statuses: accountStatuses("uk"),
    values: {
      activeBadge: "active",
      favorites: (count) => `${count} обраних`,
      alerts: (count) => `${count} alerts`,
      monthlyReports: (count) => `${count} звітів / місяць`,
      whiteLabelReports: "White-label reports",
      noWhiteLabel: "Без white-label",
      workspaces: (count) => `${count} ${pluralUk(count, "workspace", "workspace", "workspaces")}`,
      clients: (count, agencyName) =>
        `${count} ${pluralUk(count, "клієнт", "клієнти", "клієнтів")} · ${agencyName}`,
      orders: (count) => `${count} ${pluralUk(count, "замовлення", "замовлення", "замовлень")}`,
      reportCredits: (count) => `Report credits: ${count}`,
      agencyEnabled: "Agency enabled",
      agencyPlanRequired: "Потрібен тариф Agency",
      yes: "Так",
      no: "Ні",
      noValue: "-",
      pinnedPrefix: "Pinned · ",
      listingsUpdated: (count, updatedAt) =>
        `${count} ${pluralUk(count, "об'єкт", "об'єкти", "об'єктів")} · ${updatedAt}`,
      fairMid: (value) => `Fair mid ${value}`,
      scoreDetails: (risk, liquidity) => `Risk ${risk}/100 · liquidity ${liquidity}/100`,
      developerReputation: (score, label) => `${score}/100 · ${label ?? ""}`,
      noReputationData: "немає даних репутації",
      budgetTo: (value) => `до ${value}`,
      budgetFrom: (value) => `від ${value}`,
    },
    empty: {
      crmClients: "CRM clients з'являться тут після створення.",
      shortlists: "Shortlists з'являться після збірки за listing ids.",
      crmClientPrompt: "Вибери або створи CRM клієнта для нотаток і shortlist.",
      shortlistItems: "У shortlist поки немає валідних об'єктів з бази.",
    },
    errorPrefix: "Помилка",
  },
};

export const AREA_COMPARE_PAGE_COPY: Record<Locale, AreaComparePageCopy> = {
  en: {
    title: "Area comparison",
    subtitle: "Prices, exposure, liquidity and market pressure against the city baseline.",
    actions: {
      areas: "Areas",
      refresh: "Refresh",
      calculate: "Calculate",
      summary: "Summary",
    },
    sections: {
      parameters: "Parameters",
      topSignals: "Top signals",
      currentBaseline: "Current baseline",
      aiSummary: "Area impact summary",
      positiveSignals: "Positive signals",
      riskSignals: "Risk signals",
      sources: "Sources",
      buyerNotes: "Buyer notes",
      investorNotes: "Investor notes",
      guardrails: "Limits",
      areas: "Areas",
    },
    fields: {
      city: "City",
      sort: "Sort",
      action: "Action",
      area: "Area",
      scope: "Scope",
    },
    metrics: {
      cityMedianM2: "City median m2",
      cityAvgDom: "City avg DOM",
      activeSupply: "Active supply",
      areas: "Areas",
    },
    labels: {
      sort: {
        value: "Value",
        growth: "Growth",
        buyer_market: "Buyer market",
        seller_market: "Seller market",
        liquidity: "Liquidity",
        price_asc: "Price asc",
        price_desc: "Price desc",
      },
      topSignal: {
        value: "Value",
        growth: "Growth",
        buyerMarket: "Buyer market",
        liquidity: "Liquidity",
      },
      market: {
        buyer_market: "buyer",
        seller_market: "seller",
        overheated: "overheated",
        balanced: "balanced",
      },
    },
    table: {
      area: "Area",
      label: "Label",
      medianM2: "Median m2",
      vsCity: "vs city",
      dom: "DOM",
      domVsCity: "DOM vs city",
      supply: "Supply",
      value: "Value",
      growth: "Growth",
      liquidity: "Liquidity",
      buyer: "Buyer",
      seller: "Seller",
      overheated: "Overheated",
    },
    statuses: {
      loadingComparison: "Loading comparison...",
      loadingAreaComparison: "Loading area comparison",
      ready: "Ready",
      backendUnavailable: "Service is temporarily unavailable",
      aiNotCreated: "Area summary not created",
      aiReady: "Area summary ready to generate",
      aiBuilding: "Preparing area summary...",
      aiSaved: () => "Area summary ready",
      aiUnavailable: "Area summary unavailable",
      unknownComparisonError: "unknown area comparison error",
      unknownSummaryError: "unknown area summary error",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} d`,
      rows: (count) => `${count} row${count === 1 ? "" : "s"}`,
      score: (value) => `${value}/100`,
      scope: "market metrics, buyer/investor notes, planned investments",
      sourceGrounded: "Based on available sources",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "No data.",
    },
    empty: {
      aiPrompt: "The area summary will appear here.",
      noAreas: "No areas for the selected city.",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Porównanie obszarów",
    subtitle: "Ceny, ekspozycja, płynność i presja rynku względem city baseline.",
    actions: {
      areas: "Obszary",
      refresh: "Odśwież",
      calculate: "Policz",
      summary: "Summary",
    },
    sections: {
      parameters: "Parametry",
      topSignals: "Top signals",
      currentBaseline: "Current baseline",
      aiSummary: "Podsumowanie wpływu na obszar",
      positiveSignals: "Pozytywne sygnały",
      riskSignals: "Sygnały ryzyka",
      sources: "Źródła",
      buyerNotes: "Notatki dla kupującego",
      investorNotes: "Notatki dla inwestora",
      guardrails: "Ograniczenia",
      areas: "Obszary",
    },
    fields: {
      city: "Miasto",
      sort: "Sortowanie",
      action: "Akcja",
      area: "Obszar",
      scope: "Scope",
    },
    metrics: {
      cityMedianM2: "Mediana miasta m2",
      cityAvgDom: "Śr. DOM miasta",
      activeSupply: "Aktywna podaż",
      areas: "Obszary",
    },
    labels: {
      sort: {
        value: "Value",
        growth: "Growth",
        buyer_market: "Buyer market",
        seller_market: "Seller market",
        liquidity: "Liquidity",
        price_asc: "Cena rosnąco",
        price_desc: "Cena malejąco",
      },
      topSignal: {
        value: "Value",
        growth: "Growth",
        buyerMarket: "Buyer market",
        liquidity: "Liquidity",
      },
      market: {
        buyer_market: "buyer",
        seller_market: "seller",
        overheated: "przegrzany",
        balanced: "zbalansowany",
      },
    },
    table: {
      area: "Obszar",
      label: "Label",
      medianM2: "Mediana m2",
      vsCity: "vs miasto",
      dom: "DOM",
      domVsCity: "DOM vs miasto",
      supply: "Podaż",
      value: "Value",
      growth: "Growth",
      liquidity: "Liquidity",
      buyer: "Buyer",
      seller: "Seller",
      overheated: "Overheated",
    },
    statuses: {
      loadingComparison: "Ładowanie porównania...",
      loadingAreaComparison: "Ładowanie porównania obszarów",
      ready: "Gotowe",
      backendUnavailable: "Usługa jest chwilowo niedostępna",
      aiNotCreated: "Podsumowanie obszaru nieutworzone",
      aiReady: "Podsumowanie obszaru gotowe do przygotowania",
      aiBuilding: "Przygotowujemy podsumowanie obszaru...",
      aiSaved: () => "Podsumowanie obszaru gotowe",
      aiUnavailable: "Podsumowanie obszaru niedostępne",
      unknownComparisonError: "nieznany błąd porównania obszarów",
      unknownSummaryError: "nieznany błąd area summary",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} d`,
      rows: (count) => `${count} ${pluralPl(count, "wiersz", "wiersze", "wierszy")}`,
      score: (value) => `${value}/100`,
      scope: "metryki rynku, notatki buyer/investor, planned investments",
      sourceGrounded: "Na podstawie dostępnych źródeł",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "Brak danych.",
    },
    empty: {
      aiPrompt: "Podsumowanie obszaru pojawi się tutaj.",
      noAreas: "Brak obszarów dla wybranego miasta.",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Сравнение районов",
    subtitle: "Цены, экспозиция, ликвидность и рыночное давление по city baseline.",
    actions: {
      areas: "Районы",
      refresh: "Обновить",
      calculate: "Рассчитать",
      summary: "Summary",
    },
    sections: {
      parameters: "Параметры",
      topSignals: "Top signals",
      currentBaseline: "Current baseline",
      aiSummary: "Резюме влияния на район",
      positiveSignals: "Позитивные сигналы",
      riskSignals: "Риски",
      sources: "Источники",
      buyerNotes: "Заметки для покупателя",
      investorNotes: "Заметки для инвестора",
      guardrails: "Ограничения",
      areas: "Районы",
    },
    fields: {
      city: "Город",
      sort: "Сортировка",
      action: "Действие",
      area: "Район",
      scope: "Scope",
    },
    metrics: {
      cityMedianM2: "Медиана города m2",
      cityAvgDom: "Средний DOM города",
      activeSupply: "Активное предложение",
      areas: "Районы",
    },
    labels: {
      sort: {
        value: "Value",
        growth: "Growth",
        buyer_market: "Buyer market",
        seller_market: "Seller market",
        liquidity: "Liquidity",
        price_asc: "Цена по возрастанию",
        price_desc: "Цена по убыванию",
      },
      topSignal: {
        value: "Value",
        growth: "Growth",
        buyerMarket: "Buyer market",
        liquidity: "Liquidity",
      },
      market: {
        buyer_market: "buyer",
        seller_market: "seller",
        overheated: "перегрет",
        balanced: "сбалансирован",
      },
    },
    table: {
      area: "Район",
      label: "Label",
      medianM2: "Median m2",
      vsCity: "vs city",
      dom: "DOM",
      domVsCity: "DOM vs city",
      supply: "Supply",
      value: "Value",
      growth: "Growth",
      liquidity: "Liquidity",
      buyer: "Buyer",
      seller: "Seller",
      overheated: "Overheated",
    },
    statuses: {
      loadingComparison: "Загрузка сравнения...",
      loadingAreaComparison: "Загрузка сравнения районов",
      ready: "Готово",
      backendUnavailable: "Сервис временно недоступен",
      aiNotCreated: "Резюме района не создано",
      aiReady: "Резюме района готово к подготовке",
      aiBuilding: "Готовим резюме района...",
      aiSaved: () => "Резюме района готово",
      aiUnavailable: "Резюме района недоступно",
      unknownComparisonError: "unknown area comparison error",
      unknownSummaryError: "unknown area summary error",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} дн.`,
      rows: (count) => `${count} ${pluralRu(count, "строка", "строки", "строк")}`,
      score: (value) => `${value}/100`,
      scope: "market metrics, buyer/investor notes, planned investments",
      sourceGrounded: "На основе доступных источников",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "Нет данных.",
    },
    empty: {
      aiPrompt: "Резюме района появится здесь.",
      noAreas: "Нет районов для выбранного города.",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Порівняння районів",
    subtitle: "Ціни, експозиція, ліквідність і ринковий тиск за city baseline.",
    actions: {
      areas: "Райони",
      refresh: "Оновити",
      calculate: "Розрахувати",
      summary: "Summary",
    },
    sections: {
      parameters: "Параметри",
      topSignals: "Top signals",
      currentBaseline: "Current baseline",
      aiSummary: "Резюме впливу на район",
      positiveSignals: "Позитивні сигнали",
      riskSignals: "Ризики",
      sources: "Джерела",
      buyerNotes: "Нотатки для покупця",
      investorNotes: "Нотатки для інвестора",
      guardrails: "Обмеження",
      areas: "Райони",
    },
    fields: {
      city: "Місто",
      sort: "Сортування",
      action: "Дія",
      area: "Район",
      scope: "Scope",
    },
    metrics: {
      cityMedianM2: "Медіана міста m2",
      cityAvgDom: "Середній DOM міста",
      activeSupply: "Активна пропозиція",
      areas: "Райони",
    },
    labels: {
      sort: {
        value: "Value",
        growth: "Growth",
        buyer_market: "Buyer market",
        seller_market: "Seller market",
        liquidity: "Liquidity",
        price_asc: "Ціна за зростанням",
        price_desc: "Ціна за спаданням",
      },
      topSignal: {
        value: "Value",
        growth: "Growth",
        buyerMarket: "Buyer market",
        liquidity: "Liquidity",
      },
      market: {
        buyer_market: "buyer",
        seller_market: "seller",
        overheated: "перегрітий",
        balanced: "збалансований",
      },
    },
    table: {
      area: "Район",
      label: "Label",
      medianM2: "Median m2",
      vsCity: "vs city",
      dom: "DOM",
      domVsCity: "DOM vs city",
      supply: "Supply",
      value: "Value",
      growth: "Growth",
      liquidity: "Liquidity",
      buyer: "Buyer",
      seller: "Seller",
      overheated: "Overheated",
    },
    statuses: {
      loadingComparison: "Завантаження порівняння...",
      loadingAreaComparison: "Завантаження порівняння районів",
      ready: "Готово",
      backendUnavailable: "Сервіс тимчасово недоступний",
      aiNotCreated: "Резюме району не створено",
      aiReady: "Резюме району готове до підготовки",
      aiBuilding: "Готуємо резюме району...",
      aiSaved: () => "Резюме району готове",
      aiUnavailable: "Резюме району недоступне",
      unknownComparisonError: "unknown area comparison error",
      unknownSummaryError: "unknown area summary error",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} дн.`,
      rows: (count) => `${count} ${pluralUk(count, "рядок", "рядки", "рядків")}`,
      score: (value) => `${value}/100`,
      scope: "market metrics, buyer/investor notes, planned investments",
      sourceGrounded: "На основі доступних джерел",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "Немає даних.",
    },
    empty: {
      aiPrompt: "Резюме району з'явиться тут.",
      noAreas: "Немає районів для вибраного міста.",
    },
    errorPrefix: "Помилка",
  },
};

export const NEWS_PAGE_COPY: Record<Locale, NewsPageCopy> = {
  en: {
    title: "Market updates",
    subtitle: "Market, mortgage, transport and MPZP news with area impact.",
    actions: {
      refresh: "Refresh",
      source: "Source",
      summary: "Summarize",
    },
    sections: {
      articles: "Articles",
      articleDetail: "Article detail",
      aiSummary: "News summary",
      keyPoints: "Key points",
      areaImpact: "Area impact",
      sources: "Sources",
      buyerNotes: "Buyer notes",
      investorNotes: "Investor notes",
      guardrails: "Limits",
    },
    placeholders: {
      area: "Filter by area",
    },
    labels: {
      category: {
        all: "All",
        market: "Market",
        mortgage: "Mortgage",
        tax: "Tax",
        legal: "Legal",
        developer: "Developer",
        city_investment: "City investment",
        transport: "Transport",
        mpzp: "MPZP",
      },
      impact: {
        positive: "Positive",
        neutral: "Neutral",
        negative: "Negative",
        mixed: "Mixed",
        unknown: "Unknown",
      },
    },
    statuses: {
      loading: "Loading news...",
      loadingNews: "Loading news",
      loaded: (count) => `News: ${count}`,
      backendUnavailable: "Service is temporarily unavailable",
      aiNotCreated: "Summary not created",
      aiReady: "Summary ready to generate",
      aiBuilding: "Preparing summary...",
      aiSaved: () => "Summary ready",
      aiUnavailable: "Summary unavailable",
      unknownNewsError: "unknown news error",
      unknownDetailError: "unknown news detail error",
      unknownAiError: "summary error",
    },
    values: {
      allAreas: "all areas",
      relatedAreas: (count) => `${count} related local area${count === 1 ? "" : "s"}`,
      sourceGrounded: "Based on available sources",
      noData: "No data.",
    },
    empty: {
      noNews: "No news for the selected filter.",
      chooseNews: "Choose a news article.",
      aiPrompt: "The summary will appear here.",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Aktualności rynku",
    subtitle: "Aktualności rynku, kredytów, transportu i MPZP z wpływem na obszary.",
    actions: {
      refresh: "Odśwież",
      source: "Źródło",
      summary: "Podsumuj",
    },
    sections: {
      articles: "Artykuły",
      articleDetail: "Szczegóły artykułu",
      aiSummary: "Podsumowanie aktualności",
      keyPoints: "Kluczowe punkty",
      areaImpact: "Wpływ na obszary",
      sources: "Źródła",
      buyerNotes: "Notatki dla kupującego",
      investorNotes: "Notatki dla inwestora",
      guardrails: "Ograniczenia",
    },
    placeholders: {
      area: "Filtruj według dzielnicy",
    },
    labels: {
      category: {
        all: "Wszystkie",
        market: "Rynek",
        mortgage: "Kredyty",
        tax: "Podatki",
        legal: "Prawo",
        developer: "Deweloperzy",
        city_investment: "Inwestycje miejskie",
        transport: "Transport",
        mpzp: "MPZP",
      },
      impact: {
        positive: "Pozytywny",
        neutral: "Neutralny",
        negative: "Negatywny",
        mixed: "Mieszany",
        unknown: "Nieznany",
      },
    },
    statuses: {
      loading: "Ładowanie aktualności...",
      loadingNews: "Ładowanie aktualności",
      loaded: (count) => `Aktualności: ${count}`,
      backendUnavailable: "Usługa jest chwilowo niedostępna",
      aiNotCreated: "Podsumowanie nieutworzone",
      aiReady: "Podsumowanie gotowe do przygotowania",
      aiBuilding: "Przygotowujemy podsumowanie...",
      aiSaved: () => "Podsumowanie gotowe",
      aiUnavailable: "Podsumowanie niedostępne",
      unknownNewsError: "nieznany błąd aktualności",
      unknownDetailError: "nieznany błąd szczegółów aktualności",
      unknownAiError: "błąd podsumowania",
    },
    values: {
      allAreas: "wszystkie obszary",
      relatedAreas: (count) => `${count} ${pluralPl(count, "powiązany obszar", "powiązane obszary", "powiązanych obszarów")}`,
      sourceGrounded: "Na podstawie dostępnych źródeł",
      noData: "Brak danych.",
    },
    empty: {
      noNews: "Brak aktualności dla wybranego filtra.",
      chooseNews: "Wybierz aktualność.",
      aiPrompt: "Podsumowanie pojawi się tutaj.",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Новости рынка",
    subtitle: "Новости рынка, ипотеки, транспорта, MPZP и их влияние на районы.",
    actions: {
      refresh: "Обновить",
      source: "Источник",
      summary: "Сделать резюме",
    },
    sections: {
      articles: "Новости",
      articleDetail: "Детали новости",
      aiSummary: "Резюме новости",
      keyPoints: "Главное",
      areaImpact: "Влияние на районы",
      sources: "Источники",
      buyerNotes: "Заметки для покупателя",
      investorNotes: "Заметки для инвестора",
      guardrails: "Ограничения",
    },
    placeholders: {
      area: "Фильтр по району",
    },
    labels: {
      category: {
        all: "Все",
        market: "Рынок",
        mortgage: "Ипотека",
        tax: "Налоги",
        legal: "Право",
        developer: "Застройщики",
        city_investment: "Городские инвестиции",
        transport: "Транспорт",
        mpzp: "MPZP",
      },
      impact: {
        positive: "Позитивный",
        neutral: "Нейтральный",
        negative: "Негативный",
        mixed: "Смешанный",
        unknown: "Неизвестный",
      },
    },
    statuses: {
      loading: "Загрузка новостей...",
      loadingNews: "Загрузка новостей",
      loaded: (count) => `Новостей: ${count}`,
      backendUnavailable: "Сервис временно недоступен",
      aiNotCreated: "Резюме не создано",
      aiReady: "Резюме готово к подготовке",
      aiBuilding: "Готовим резюме...",
      aiSaved: () => "Резюме готово",
      aiUnavailable: "Резюме недоступно",
      unknownNewsError: "ошибка загрузки новостей",
      unknownDetailError: "ошибка загрузки новости",
      unknownAiError: "ошибка подготовки резюме",
    },
    values: {
      allAreas: "все районы",
      relatedAreas: (count) => `${count} ${pluralRu(count, "связанный район", "связанных района", "связанных районов")}`,
      sourceGrounded: "На основе доступных источников",
      noData: "Нет данных.",
    },
    empty: {
      noNews: "Нет новостей для выбранного фильтра.",
      chooseNews: "Выбери новость.",
      aiPrompt: "Резюме появится здесь.",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Новини ринку",
    subtitle: "Новини ринку, іпотеки, транспорту, MPZP та їхній вплив на райони.",
    actions: {
      refresh: "Оновити",
      source: "Джерело",
      summary: "Підготувати резюме",
    },
    sections: {
      articles: "Новини",
      articleDetail: "Деталі новини",
      aiSummary: "Резюме новини",
      keyPoints: "Головне",
      areaImpact: "Вплив на райони",
      sources: "Джерела",
      buyerNotes: "Нотатки для покупця",
      investorNotes: "Нотатки для інвестора",
      guardrails: "Обмеження",
    },
    placeholders: {
      area: "Фільтр за районом",
    },
    labels: {
      category: {
        all: "Усі",
        market: "Ринок",
        mortgage: "Іпотека",
        tax: "Податки",
        legal: "Право",
        developer: "Забудовники",
        city_investment: "Міські інвестиції",
        transport: "Транспорт",
        mpzp: "MPZP",
      },
      impact: {
        positive: "Позитивний",
        neutral: "Нейтральний",
        negative: "Негативний",
        mixed: "Змішаний",
        unknown: "Невідомий",
      },
    },
    statuses: {
      loading: "Завантаження новин...",
      loadingNews: "Завантаження новин",
      loaded: (count) => `Новин: ${count}`,
      backendUnavailable: "Сервіс тимчасово недоступний",
      aiNotCreated: "Резюме не створено",
      aiReady: "Резюме готове до підготовки",
      aiBuilding: "Готуємо резюме...",
      aiSaved: () => "Резюме готове",
      aiUnavailable: "Резюме недоступне",
      unknownNewsError: "помилка завантаження новин",
      unknownDetailError: "помилка завантаження новини",
      unknownAiError: "помилка підготовки резюме",
    },
    values: {
      allAreas: "усі райони",
      relatedAreas: (count) => `${count} ${pluralUk(count, "пов'язаний район", "пов'язані райони", "пов'язаних районів")}`,
      sourceGrounded: "На основі доступних джерел",
      noData: "Немає даних.",
    },
    empty: {
      noNews: "Немає новин для вибраного фільтра.",
      chooseNews: "Вибери новину.",
      aiPrompt: "Резюме з'явиться тут.",
    },
    errorPrefix: "Помилка",
  },
};

export const DEVELOPERS_PAGE_COPY: Record<Locale, DevelopersPageCopy> = {
  en: {
    title: "Developer ranking",
    subtitle: "Risk profile, local track record, sources and due-diligence questions.",
    actions: {
      refresh: "Refresh",
      apply: "Apply",
      open: "Open",
      openProfile: "Open profile",
      ranking: "Ranking",
      source: "Source",
    },
    sections: {
      filters: "Filters",
      developers: "Developers",
      profile: "Profile",
      factors: "Rating factors",
      projects: "Projects",
      qualitySignals: "Quality and risk signals",
      dueDiligence: "Due diligence",
      company: "Company",
      check: "What to check",
      sources: "Sources",
    },
    fields: {
      city: "City",
      minRating: "Min. rating",
      minConfidence: "Min. confidence",
    },
    metrics: {
      inSample: "In sample",
      averageRating: "Average rating",
      strongGood: "Strong/good",
      needsReview: "Needs review",
      rating: "Rating",
      technicalQuality: "Technical quality",
      legalScope: "Legal scope",
      transparency: "Transparency",
      reputationScore: "Reputation Score",
      confidence: "Confidence",
      completedProjects: "Completed projects",
      activeProjects: "Active projects",
    },
    table: {
      developer: "Developer",
      rating: "Rating",
      confidence: "Confidence",
      projects: "Projects",
      signals: "Signals",
      profile: "Profile",
      factor: "Factor",
      score: "Score",
      meaning: "Meaning",
      project: "Project",
      location: "Location",
      status: "Status",
      units: "Units",
      source: "Source",
    },
    labels: {
      reputation: {
        strong: "strong profile",
        good: "good profile",
        mixed: "mixed profile",
        limited_data: "limited data",
        risk_review: "needs review",
      },
      projectStatus: {
        active: "active",
        completed: "completed",
        planned: "planned",
        unknown: "status unknown",
      },
      moderationStatus: {
        active: "active",
        under_review: "under review",
        suppressed: "suppressed",
      },
      disputeStatus: {
        none: "none",
        open: "open",
        resolved: "resolved",
        rejected: "rejected",
      },
    },
    factors: {
      trackRecord: {
        label: "Track record",
        detail: "Count and freshness of completed and active projects.",
      },
      delivery: {
        label: "Delivery",
        detail: "Signals for schedule, construction stages and handover.",
      },
      technicalQuality: {
        label: "Technical quality",
        detail: "Defect, acceptance and technical inspection signals.",
      },
      legal: {
        label: "Legal compliance",
        detail: "KRS/REGON/UOKiK and consumer-risk contract signals.",
      },
      financial: {
        label: "Financial stability",
        detail: "Basic company stability and ownership transparency.",
      },
      transparency: {
        label: "Transparency",
        detail: "Documents, schedule, project pages and source freshness.",
      },
      local: {
        label: "Local experience",
        detail: "Experience in the same city, area and comparable projects.",
      },
    },
    statuses: {
      loadingRanking: "Loading ranking",
      loadingProfile: "Loading profile...",
      loadingDeveloperProfile: "Loading developer profile",
      profileUnavailable: "Profile unavailable",
      updated: (date) => `Updated: ${date}`,
      found: (count) => `${count} found`,
      unknownError: "Something went wrong",
    },
    values: {
      noValue: "-",
      noData: "No data",
      legalNameMissing: "Legal name not provided",
      headquartersMissing: "city not provided",
      completedActive: (completed, active) => `${completed} completed / ${active} active`,
      sources: (sources) => `Sources: ${sources}`,
      units: (count) => `${count} units`,
      score: (value) => `${value}/100`,
      confidence: (value) => `confidence ${value}/100`,
      dataQuality: (value) => `DQ ${value}`,
      foundedUpdated: (founded, updated) => `Founded: ${founded} · updated ${updated}`,
      checked: (date) => `checked ${date}`,
      dispute: (status) => `dispute ${status}`,
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "Ranking deweloperów",
    subtitle: "Profil ryzyka, lokalne doświadczenie, źródła i pytania due diligence.",
    actions: {
      refresh: "Odśwież",
      apply: "Zastosuj",
      open: "Otwórz",
      openProfile: "Otwórz profil",
      ranking: "Ranking",
      source: "Źródło",
    },
    sections: {
      filters: "Filtry",
      developers: "Deweloperzy",
      profile: "Profil",
      factors: "Czynniki ratingu",
      projects: "Projekty",
      qualitySignals: "Quality i risk signals",
      dueDiligence: "Due diligence",
      company: "Firma",
      check: "Co sprawdzić",
      sources: "Źródła",
    },
    fields: {
      city: "Miasto",
      minRating: "Min. rating",
      minConfidence: "Min. confidence",
    },
    metrics: {
      inSample: "W próbie",
      averageRating: "Średni rating",
      strongGood: "Silne/dobre",
      needsReview: "Do sprawdzenia",
      rating: "Rating",
      technicalQuality: "Jakość techniczna",
      legalScope: "Zakres prawny",
      transparency: "Transparentność",
      reputationScore: "Reputation Score",
      confidence: "Confidence",
      completedProjects: "Ukończone projekty",
      activeProjects: "Aktywne projekty",
    },
    table: {
      developer: "Deweloper",
      rating: "Rating",
      confidence: "Confidence",
      projects: "Projekty",
      signals: "Sygnały",
      profile: "Profil",
      factor: "Czynnik",
      score: "Score",
      meaning: "Znaczenie",
      project: "Projekt",
      location: "Lokalizacja",
      status: "Status",
      units: "Lokale",
      source: "Źródło",
    },
    labels: {
      reputation: {
        strong: "silny profil",
        good: "dobry profil",
        mixed: "mieszany profil",
        limited_data: "mało danych",
        risk_review: "do sprawdzenia",
      },
      projectStatus: {
        active: "aktywny",
        completed: "ukończony",
        planned: "planowany",
        unknown: "status nieznany",
      },
      moderationStatus: {
        active: "aktywny",
        under_review: "w przeglądzie",
        suppressed: "ukryty",
      },
      disputeStatus: {
        none: "brak",
        open: "otwarty",
        resolved: "rozwiązany",
        rejected: "odrzucony",
      },
    },
    factors: {
      trackRecord: {
        label: "Track record",
        detail: "Liczba i świeżość ukończonych oraz aktywnych projektów.",
      },
      delivery: {
        label: "Delivery",
        detail: "Sygnały terminów, etapów budowy i przekazania lokali.",
      },
      technicalQuality: {
        label: "Jakość techniczna",
        detail: "Sygnały usterek, odbiorów i kontroli technicznych.",
      },
      legal: {
        label: "Legal compliance",
        detail: "KRS/REGON/UOKiK i consumer-risk signals w umowach.",
      },
      financial: {
        label: "Stabilność finansowa",
        detail: "Podstawowa stabilność firmy i transparentność struktury.",
      },
      transparency: {
        label: "Transparentność",
        detail: "Dokumenty, harmonogram, strony projektów i świeżość źródeł.",
      },
      local: {
        label: "Lokalne doświadczenie",
        detail: "Doświadczenie w tym samym mieście, obszarze i podobnych projektach.",
      },
    },
    statuses: {
      loadingRanking: "Ładowanie rankingu",
      loadingProfile: "Ładowanie profilu...",
      loadingDeveloperProfile: "Ładowanie profilu dewelopera",
      profileUnavailable: "Profil niedostępny",
      updated: (date) => `Zaktualizowano: ${date}`,
      found: (count) => `Znaleziono: ${count}`,
      unknownError: "nieznany błąd",
    },
    values: {
      noValue: "-",
      noData: "Brak danych",
      legalNameMissing: "Brak nazwy prawnej",
      headquartersMissing: "brak miasta",
      completedActive: (completed, active) =>
        `${completed} ${pluralPl(completed, "ukończony", "ukończone", "ukończonych")} / ${active} aktywne`,
      sources: (sources) => `Źródła: ${sources}`,
      units: (count) => `${count} lokali`,
      score: (value) => `${value}/100`,
      confidence: (value) => `confidence ${value}/100`,
      dataQuality: (value) => `DQ ${value}`,
      foundedUpdated: (founded, updated) => `Założony: ${founded} · aktualizacja ${updated}`,
      checked: (date) => `sprawdzone ${date}`,
      dispute: (status) => `dispute ${status}`,
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Рейтинг застройщиков",
    subtitle: "Профиль риска, локальный опыт, источники и вопросы для проверки перед сделкой.",
    actions: {
      refresh: "Обновить",
      apply: "Применить",
      open: "Открыть",
      openProfile: "Открыть профиль",
      ranking: "Рейтинг",
      source: "Источник",
    },
    sections: {
      filters: "Фильтры",
      developers: "Застройщики",
      profile: "Профиль",
      factors: "Факторы рейтинга",
      projects: "Проекты",
      qualitySignals: "Quality и risk signals",
      dueDiligence: "Due diligence",
      company: "Компания",
      check: "Что проверить",
      sources: "Источники",
    },
    fields: {
      city: "Город",
      minRating: "Мин. рейтинг",
      minConfidence: "Мин. уверенность",
    },
    metrics: {
      inSample: "В выборке",
      averageRating: "Средний рейтинг",
      strongGood: "Сильные/хорошие",
      needsReview: "Нужна проверка",
      rating: "Рейтинг",
      technicalQuality: "Техкачество",
      legalScope: "Юр. контур",
      transparency: "Прозрачность",
      reputationScore: "Reputation Score",
      confidence: "Confidence",
      completedProjects: "Сданные проекты",
      activeProjects: "Активные проекты",
    },
    table: {
      developer: "Застройщик",
      rating: "Рейтинг",
      confidence: "Уверенность",
      projects: "Проекты",
      signals: "Сигналы",
      profile: "Профиль",
      factor: "Фактор",
      score: "Score",
      meaning: "Что означает",
      project: "Проект",
      location: "Локация",
      status: "Статус",
      units: "Units",
      source: "Источник",
    },
    labels: {
      reputation: {
        strong: "сильный профиль",
        good: "хороший профиль",
        mixed: "смешанный профиль",
        limited_data: "мало данных",
        risk_review: "нужна проверка",
      },
      projectStatus: {
        active: "активный",
        completed: "сдан",
        planned: "планируется",
        unknown: "статус неизвестен",
      },
      moderationStatus: {
        active: "активен",
        under_review: "на проверке",
        suppressed: "скрыт",
      },
      disputeStatus: {
        none: "нет",
        open: "открыт",
        resolved: "решен",
        rejected: "отклонен",
      },
    },
    factors: {
      trackRecord: {
        label: "Track record",
        detail: "Количество и свежесть сданных/активных проектов.",
      },
      delivery: {
        label: "Delivery",
        detail: "Сигналы по срокам, этапам строительства и handover.",
      },
      technicalQuality: {
        label: "Technical quality",
        detail: "Сигналы дефектов, приемок и технических проверок.",
      },
      legal: {
        label: "Legal compliance",
        detail: "KRS/REGON/UOKiK и договорные consumer-risk signals.",
      },
      financial: {
        label: "Financial stability",
        detail: "Базовая устойчивость компании и прозрачность структуры.",
      },
      transparency: {
        label: "Transparency",
        detail: "Документы, schedule, проектные страницы и source freshness.",
      },
      local: {
        label: "Local experience",
        detail: "Опыт в том же городе/районе и сопоставимых проектах.",
      },
    },
    statuses: {
      loadingRanking: "Загрузка рейтинга",
      loadingProfile: "Загрузка профиля...",
      loadingDeveloperProfile: "Загрузка профиля застройщика",
      profileUnavailable: "Профиль недоступен",
      updated: (date) => `Обновлено: ${date}`,
      found: (count) => `${count} найдено`,
      unknownError: "Something went wrong",
    },
    values: {
      noValue: "-",
      noData: "Нет данных",
      legalNameMissing: "Legal entity не указан",
      headquartersMissing: "город не указан",
      completedActive: (completed, active) => `${completed} сдано / ${active} активно`,
      sources: (sources) => `Источники: ${sources}`,
      units: (count) => `${count} units`,
      score: (value) => `${value}/100`,
      confidence: (value) => `confidence ${value}/100`,
      dataQuality: (value) => `DQ ${value}`,
      foundedUpdated: (founded, updated) => `Основан: ${founded} · обновлено ${updated}`,
      checked: (date) => `checked ${date}`,
      dispute: (status) => `dispute ${status}`,
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "Рейтинг забудовників",
    subtitle: "Профіль ризику, локальний досвід, джерела й питання для перевірки перед угодою.",
    actions: {
      refresh: "Оновити",
      apply: "Застосувати",
      open: "Відкрити",
      openProfile: "Відкрити профіль",
      ranking: "Рейтинг",
      source: "Джерело",
    },
    sections: {
      filters: "Фільтри",
      developers: "Забудовники",
      profile: "Профіль",
      factors: "Фактори рейтингу",
      projects: "Проекти",
      qualitySignals: "Quality і risk signals",
      dueDiligence: "Due diligence",
      company: "Компанія",
      check: "Що перевірити",
      sources: "Джерела",
    },
    fields: {
      city: "Місто",
      minRating: "Мін. рейтинг",
      minConfidence: "Мін. впевненість",
    },
    metrics: {
      inSample: "У вибірці",
      averageRating: "Середній рейтинг",
      strongGood: "Сильні/хороші",
      needsReview: "Потрібна перевірка",
      rating: "Рейтинг",
      technicalQuality: "Техякість",
      legalScope: "Юр. контур",
      transparency: "Прозорість",
      reputationScore: "Reputation Score",
      confidence: "Confidence",
      completedProjects: "Здані проекти",
      activeProjects: "Активні проекти",
    },
    table: {
      developer: "Забудовник",
      rating: "Рейтинг",
      confidence: "Впевненість",
      projects: "Проекти",
      signals: "Сигнали",
      profile: "Профіль",
      factor: "Фактор",
      score: "Score",
      meaning: "Що означає",
      project: "Проект",
      location: "Локація",
      status: "Статус",
      units: "Units",
      source: "Джерело",
    },
    labels: {
      reputation: {
        strong: "сильний профіль",
        good: "хороший профіль",
        mixed: "змішаний профіль",
        limited_data: "мало даних",
        risk_review: "потрібна перевірка",
      },
      projectStatus: {
        active: "активний",
        completed: "зданий",
        planned: "планується",
        unknown: "статус невідомий",
      },
      moderationStatus: {
        active: "активний",
        under_review: "на перевірці",
        suppressed: "прихований",
      },
      disputeStatus: {
        none: "немає",
        open: "відкритий",
        resolved: "вирішений",
        rejected: "відхилений",
      },
    },
    factors: {
      trackRecord: {
        label: "Track record",
        detail: "Кількість і свіжість зданих/активних проектів.",
      },
      delivery: {
        label: "Delivery",
        detail: "Сигнали щодо строків, етапів будівництва й handover.",
      },
      technicalQuality: {
        label: "Technical quality",
        detail: "Сигнали дефектів, приймань і технічних перевірок.",
      },
      legal: {
        label: "Legal compliance",
        detail: "KRS/REGON/UOKiK і договірні consumer-risk signals.",
      },
      financial: {
        label: "Financial stability",
        detail: "Базова стійкість компанії та прозорість структури.",
      },
      transparency: {
        label: "Transparency",
        detail: "Документи, schedule, сторінки проектів і source freshness.",
      },
      local: {
        label: "Local experience",
        detail: "Досвід у тому ж місті/районі та подібних проектах.",
      },
    },
    statuses: {
      loadingRanking: "Завантаження рейтингу",
      loadingProfile: "Завантаження профілю...",
      loadingDeveloperProfile: "Завантаження профілю забудовника",
      profileUnavailable: "Профіль недоступний",
      updated: (date) => `Оновлено: ${date}`,
      found: (count) => `${count} знайдено`,
      unknownError: "Something went wrong",
    },
    values: {
      noValue: "-",
      noData: "Немає даних",
      legalNameMissing: "Legal entity не вказано",
      headquartersMissing: "місто не вказано",
      completedActive: (completed, active) => `${completed} здано / ${active} активно`,
      sources: (sources) => `Джерела: ${sources}`,
      units: (count) => `${count} units`,
      score: (value) => `${value}/100`,
      confidence: (value) => `confidence ${value}/100`,
      dataQuality: (value) => `DQ ${value}`,
      foundedUpdated: (founded, updated) => `Засновано: ${founded} · оновлено ${updated}`,
      checked: (date) => `checked ${date}`,
      dispute: (status) => `dispute ${status}`,
    },
    errorPrefix: "Помилка",
  },
};

export const LISTING_DETAIL_COPY: Record<Locale, ListingDetailCopy> = {
  en: {
    demoData: "Demo data",
    actions: {
      back: "Back",
      refresh: "Refresh",
      favorite: "Favorite",
      saveReport: "Save report",
      openReport: "Open report",
      answer: "Answer",
    },
    sections: {
      aiAssistant: "Apartment assistant",
      insights: "Object insights",
      negotiation: "Negotiation arguments",
      priceHistory: "Price history",
      comparables: "Similar listings",
      scoring: "Scoring",
      area: "Area",
      areaNews: "Area news",
      guides: "Guides",
      readyHtml: "Ready HTML",
    },
    futureImpact: {
      title: "Future infrastructure impact",
      sections: {
        narrative: "Impact narrative",
        catalysts: "Positive catalysts",
        checks: "Disruption and supply checks",
      },
      metrics: {
        score: "Impact score",
        within2km: "Within 2 km",
        nearest: "Nearest project",
        confidence: "Nearest confidence",
      },
      labels: {
        status: "Status",
        expected: "Expected",
        distance: "Distance",
        effects: "Effects",
        risks: "Checks",
      },
      values: {
        noData: "No data.",
        noYear: "year unknown",
        projects: (count) => `${count} project${count === 1 ? "" : "s"}`,
        meters: (meters) => `${meters} m`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "positive",
          mixed: "mixed",
          disruption_risk: "disruption",
          supply_pressure: "supply pressure",
        },
      },
    },
    metrics: {
      verdict: "Verdict",
      price: "Price",
      pricePerM2: "Price per m2",
      fairPriceMid: "Estimated fair price",
      fairPriceConfidence: "Price confidence",
      fairDeviation: "Deviation from estimated price",
      priceLabel: "Price assessment",
      buildingType: "Building type",
      renovationState: "Condition",
      amenities: "Amenities",
      parking: "Parking",
      heating: "Heating",
    },
    fields: {
      audience: "Audience",
      topic: "Topic",
      question: "Question",
    },
    placeholders: {
      customQuestion: "Example: what questions should I ask the seller?",
    },
    statuses: {
      loadingObject: "Loading listing...",
      analyticsUpdated: "Analytics updated",
      backendUnavailable: "Service is temporarily unavailable",
      favoriteAdded: "Added to favorites",
      reportSaved: (reportId) => `Report saved: ${reportId}`,
      aiReady: "Assistant ready",
      aiQuestionsUnavailable: "Questions unavailable",
      aiBuilding: "Preparing answer...",
      aiRefused: "Answer unavailable for this request",
      aiSaved: () => "Answer ready",
      aiUnavailable: "Answer unavailable",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Based on available sources",
      dataQualityPrefix: "DQ",
      m2: "m2",
    },
    table: {
      date: "Date",
      price: "Price",
      pricePerM2: "Price per m2",
      object: "Object",
      district: "District",
      area: "m2",
    },
    area: {
      median: (value) => `Median: ${value}/m2`,
      activeListings: (count) => `Active listings: ${count}`,
      averageExposure: (days) => `Average exposure: ${days} day${days === 1 ? "" : "s"}`,
      supply90d: (value) => `90-day supply: ${value}`,
    },
    empty: {
      loadingAnalytics: "Loading listing analytics",
      noAiAnswer: "The answer will appear here.",
      noData: "No data.",
      noAreaNews: "No linked news for this area yet.",
      noConfirmedAmenities: "no confirmed data",
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
      guardrails: "Limits",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    lifestyle: {
      balcony: "balcony",
      terrace: "terrace",
      garden: "garden",
      elevator: "elevator",
    },
    chart: {
      priceHistoryAria: (title) => `Price history for ${title}`,
    },
    favoriteNote: "Added from detail page",
    errorPrefix: "Error",
  },
  pl: {
    demoData: "Dane demonstracyjne",
    actions: {
      back: "Wstecz",
      refresh: "Odśwież",
      favorite: "Ulubione",
      saveReport: "Zapisz raport",
      openReport: "Otwórz raport",
      answer: "Odpowiedz",
    },
    sections: {
      aiAssistant: "Asystent mieszkania",
      insights: "Wnioski o obiekcie",
      negotiation: "Argumenty negocjacyjne",
      priceHistory: "Historia ceny",
      comparables: "Podobne obiekty",
      scoring: "Scoring",
      area: "Dzielnica",
      areaNews: "Aktualności dzielnicy",
      guides: "Poradniki",
      readyHtml: "Gotowy HTML",
    },
    futureImpact: {
      title: "Wpływ przyszłej infrastruktury",
      sections: {
        narrative: "Narracja wpływu",
        catalysts: "Pozytywne katalizatory",
        checks: "Ryzyka budowy i podaży",
      },
      metrics: {
        score: "Impact score",
        within2km: "W promieniu 2 km",
        nearest: "Najbliższy projekt",
        confidence: "Pewność najbliższego",
      },
      labels: {
        status: "Status",
        expected: "Termin",
        distance: "Odległość",
        effects: "Efekty",
        risks: "Do sprawdzenia",
      },
      values: {
        noData: "Brak danych.",
        noYear: "rok nieznany",
        projects: (count) => `${count} ${pluralPl(count, "projekt", "projekty", "projektów")}`,
        meters: (meters) => `${meters} m`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "pozytywny",
          mixed: "mieszany",
          disruption_risk: "utrudnienia",
          supply_pressure: "presja podaży",
        },
      },
    },
    metrics: {
      verdict: "Werdykt",
      price: "Cena",
      pricePerM2: "Cena za m2",
      fairPriceMid: "Szacowana cena",
      fairPriceConfidence: "Pewność ceny",
      fairDeviation: "Odchylenie od szacunku",
      priceLabel: "Ocena ceny",
      buildingType: "Typ budynku",
      renovationState: "Stan",
      amenities: "Udogodnienia",
      parking: "Parking",
      heating: "Ogrzewanie",
    },
    fields: {
      audience: "Odbiorca",
      topic: "Temat",
      question: "Pytanie",
    },
    placeholders: {
      customQuestion: "Np.: jakie pytania zadać sprzedającemu?",
    },
    statuses: {
      loadingObject: "Ładowanie obiektu...",
      analyticsUpdated: "Analityka odświeżona",
      backendUnavailable: "Usługa jest chwilowo niedostępna",
      favoriteAdded: "Dodano do ulubionych",
      reportSaved: (reportId) => `Raport zapisany: ${reportId}`,
      aiReady: "Asystent gotowy",
      aiQuestionsUnavailable: "Pytania niedostępne",
      aiBuilding: "Przygotowujemy odpowiedź...",
      aiRefused: "Odpowiedź niedostępna dla tego zapytania",
      aiSaved: () => "Odpowiedź gotowa",
      aiUnavailable: "Odpowiedź niedostępna",
    },
    values: {
      buyer: "Kupujący",
      realtor: "Pośrednik",
      investor: "Inwestor",
      refused: "Odrzucono",
      sourceGrounded: "Na podstawie dostępnych źródeł",
      dataQualityPrefix: "DQ",
      m2: "m2",
    },
    table: {
      date: "Data",
      price: "Cena",
      pricePerM2: "Cena za m2",
      object: "Obiekt",
      district: "Dzielnica",
      area: "m2",
    },
    area: {
      median: (value) => `Mediana: ${value}/m2`,
      activeListings: (count) => `Aktywne ogłoszenia: ${count}`,
      averageExposure: (days) => `Średnia ekspozycja: ${days} dni`,
      supply90d: (value) => `Podaż 90 dni: ${value}`,
    },
    empty: {
      loadingAnalytics: "Ładowanie analityki obiektu",
      noAiAnswer: "Odpowiedź pojawi się tutaj.",
      noData: "Brak danych.",
      noAreaNews: "Brak powiązanych aktualności dla tej dzielnicy.",
      noConfirmedAmenities: "brak potwierdzonych danych",
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
      guardrails: "Ograniczenia",
    },
    fallbackQuestion: {
      label: "Podsumowanie obiektu",
      description: "Krótkie podsumowanie decyzji na podstawie dostępnych danych.",
    },
    lifestyle: {
      balcony: "balkon",
      terrace: "taras",
      garden: "ogród",
      elevator: "winda",
    },
    chart: {
      priceHistoryAria: (title) => `Historia ceny dla ${title}`,
    },
    favoriteNote: "Dodane ze strony obiektu",
    errorPrefix: "Błąd",
  },
  ru: {
    demoData: "Демонстрационные данные",
    actions: {
      back: "Назад",
      refresh: "Обновить",
      favorite: "Избранное",
      saveReport: "Сохранить отчет",
      openReport: "Открыть отчет",
      answer: "Ответить",
    },
    sections: {
      aiAssistant: "Помощник по квартире",
      insights: "Выводы по объекту",
      negotiation: "Аргументы для торга",
      priceHistory: "История цены",
      comparables: "Похожие объекты",
      scoring: "Скоринг",
      area: "Район",
      areaNews: "Новости района",
      guides: "Гайды",
      readyHtml: "Готовый HTML",
    },
    futureImpact: {
      title: "Влияние будущей инфраструктуры",
      sections: {
        narrative: "Нарратив влияния",
        catalysts: "Позитивные катализаторы",
        checks: "Риски стройки и нового предложения",
      },
      metrics: {
        score: "Impact score",
        within2km: "В радиусе 2 км",
        nearest: "Ближайший проект",
        confidence: "Уверенность по ближайшему",
      },
      labels: {
        status: "Статус",
        expected: "Срок",
        distance: "Расстояние",
        effects: "Эффекты",
        risks: "Проверки",
      },
      values: {
        noData: "Нет данных.",
        noYear: "год неизвестен",
        projects: (count) => `${count} ${pluralRu(count, "проект", "проекта", "проектов")}`,
        meters: (meters) => `${meters} м`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "позитив",
          mixed: "смешанный",
          disruption_risk: "стройка",
          supply_pressure: "давление предложения",
        },
      },
    },
    metrics: {
      verdict: "Вердикт",
      price: "Цена",
      pricePerM2: "Цена за m2",
      fairPriceMid: "Оценочная цена",
      fairPriceConfidence: "Уверенность в цене",
      fairDeviation: "Отклонение от оценки",
      priceLabel: "Оценка цены",
      buildingType: "Тип здания",
      renovationState: "Состояние",
      amenities: "Удобства",
      parking: "Parking",
      heating: "Отопление",
    },
    fields: {
      audience: "Аудитория",
      topic: "Тема",
      question: "Вопрос",
    },
    placeholders: {
      customQuestion: "Например: какие вопросы задать продавцу?",
    },
    statuses: {
      loadingObject: "Загрузка объекта...",
      analyticsUpdated: "Аналитика обновлена",
      backendUnavailable: "Сервис временно недоступен",
      favoriteAdded: "Добавлено в избранное",
      reportSaved: (reportId) => `Отчет сохранен: ${reportId}`,
      aiReady: "Помощник готов",
      aiQuestionsUnavailable: "Вопросы недоступны",
      aiBuilding: "Готовим ответ...",
      aiRefused: "Ответ недоступен для этого запроса",
      aiSaved: () => "Ответ готов",
      aiUnavailable: "Ответ недоступен",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "На основе доступных источников",
      dataQualityPrefix: "DQ",
      m2: "m2",
    },
    table: {
      date: "Дата",
      price: "Цена",
      pricePerM2: "Цена за m2",
      object: "Объект",
      district: "Район",
      area: "m2",
    },
    area: {
      median: (value) => `Медиана: ${value}/m2`,
      activeListings: (count) => `Активных объявлений: ${count}`,
      averageExposure: (days) =>
        `Средняя экспозиция: ${days} ${pluralRu(days, "день", "дня", "дней")}`,
      supply90d: (value) => `Предложение 90 дней: ${value}`,
    },
    empty: {
      loadingAnalytics: "Загрузка аналитики объекта",
      noAiAnswer: "Ответ появится здесь.",
      noData: "Нет данных.",
      noAreaNews: "Для района пока нет привязанных новостей.",
      noConfirmedAmenities: "нет подтвержденных данных",
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
      guardrails: "Ограничения",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    lifestyle: {
      balcony: "балкон",
      terrace: "терраса",
      garden: "сад",
      elevator: "лифт",
    },
    chart: {
      priceHistoryAria: (title) => `История цены для ${title}`,
    },
    favoriteNote: "Добавлено со страницы объекта",
    errorPrefix: "Ошибка",
  },
  uk: {
    demoData: "Демонстраційні дані",
    actions: {
      back: "Назад",
      refresh: "Оновити",
      favorite: "Обране",
      saveReport: "Зберегти звіт",
      openReport: "Відкрити звіт",
      answer: "Відповісти",
    },
    sections: {
      aiAssistant: "Помічник щодо квартири",
      insights: "Висновки щодо об'єкта",
      negotiation: "Аргументи для торгу",
      priceHistory: "Історія ціни",
      comparables: "Схожі об'єкти",
      scoring: "Скоринг",
      area: "Район",
      areaNews: "Новини району",
      guides: "Гайди",
      readyHtml: "Готовий HTML",
    },
    futureImpact: {
      title: "Вплив майбутньої інфраструктури",
      sections: {
        narrative: "Наратив впливу",
        catalysts: "Позитивні каталізатори",
        checks: "Ризики будівництва і пропозиції",
      },
      metrics: {
        score: "Impact score",
        within2km: "У радіусі 2 км",
        nearest: "Найближчий проект",
        confidence: "Впевненість щодо найближчого",
      },
      labels: {
        status: "Статус",
        expected: "Термін",
        distance: "Відстань",
        effects: "Ефекти",
        risks: "Перевірки",
      },
      values: {
        noData: "Немає даних.",
        noYear: "рік невідомий",
        projects: (count) => `${count} ${pluralUk(count, "проект", "проекти", "проектів")}`,
        meters: (meters) => `${meters} м`,
        expectedYear: (year) => `${year}`,
        categories: {
          positive_catalyst: "позитив",
          mixed: "змішаний",
          disruption_risk: "будівництво",
          supply_pressure: "тиск пропозиції",
        },
      },
    },
    metrics: {
      verdict: "Вердикт",
      price: "Ціна",
      pricePerM2: "Ціна за m2",
      fairPriceMid: "Оціночна ціна",
      fairPriceConfidence: "Впевненість у ціні",
      fairDeviation: "Відхилення від оцінки",
      priceLabel: "Оцінка ціни",
      buildingType: "Тип будівлі",
      renovationState: "Стан",
      amenities: "Зручності",
      parking: "Parking",
      heating: "Опалення",
    },
    fields: {
      audience: "Аудиторія",
      topic: "Тема",
      question: "Питання",
    },
    placeholders: {
      customQuestion: "Наприклад: які питання поставити продавцю?",
    },
    statuses: {
      loadingObject: "Завантаження об'єкта...",
      analyticsUpdated: "Аналітику оновлено",
      backendUnavailable: "Сервіс тимчасово недоступний",
      favoriteAdded: "Додано в обране",
      reportSaved: (reportId) => `Звіт збережено: ${reportId}`,
      aiReady: "Помічник готовий",
      aiQuestionsUnavailable: "Питання недоступні",
      aiBuilding: "Готуємо відповідь...",
      aiRefused: "Відповідь недоступна для цього запиту",
      aiSaved: () => "Відповідь готова",
      aiUnavailable: "Відповідь недоступна",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "На основі доступних джерел",
      dataQualityPrefix: "DQ",
      m2: "m2",
    },
    table: {
      date: "Дата",
      price: "Ціна",
      pricePerM2: "Ціна за m2",
      object: "Об'єкт",
      district: "Район",
      area: "m2",
    },
    area: {
      median: (value) => `Медіана: ${value}/m2`,
      activeListings: (count) => `Активних оголошень: ${count}`,
      averageExposure: (days) =>
        `Середня експозиція: ${days} ${pluralUk(days, "день", "дні", "днів")}`,
      supply90d: (value) => `Пропозиція 90 днів: ${value}`,
    },
    empty: {
      loadingAnalytics: "Завантаження аналітики об'єкта",
      noAiAnswer: "Відповідь з'явиться тут.",
      noData: "Немає даних.",
      noAreaNews: "Для району поки немає прив'язаних новин.",
      noConfirmedAmenities: "немає підтверджених даних",
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
      guardrails: "Обмеження",
    },
    fallbackQuestion: {
      label: "Object summary",
      description: "Short grounded decision summary.",
    },
    lifestyle: {
      balcony: "балкон",
      terrace: "тераса",
      garden: "сад",
      elevator: "ліфт",
    },
    chart: {
      priceHistoryAria: (title) => `Історія ціни для ${title}`,
    },
    favoriteNote: "Додано зі сторінки об'єкта",
    errorPrefix: "Помилка",
  },
};

export const COMPARE_PAGE_COPY: Record<Locale, ComparePageCopy> = {
  en: {
    title: "Compare listings",
    subtitle: "Price, liquidity, risks, negotiation room and investment potential in one view.",
    actions: {
      search: "Search",
      refresh: "Refresh",
      getVerdict: "Explain recommendation",
      buildShortlist: "Prepare summary",
    },
    sections: {
      selector: "Choose listings",
      aiVerdict: "Recommendation explanation",
      clientShortlist: "Buyer summary",
      comparisonMatrix: "Comparison matrix",
      sourcesAndLimits: "Sources and limits",
    },
    metrics: {
      bestChoice: "Best choice",
      belowFairPrice: "Below fair price",
      cheaperMonthly: "Cheaper monthly",
      rentalSignal: "Rental signal",
    },
    fields: {
      audience: "Audience",
      question: "Question",
      client: "Client",
      intro: "Intro",
    },
    placeholders: {
      aiQuestion: "For example: what is better for a family or rental?",
      clientName: "Anna",
      intro: "Context for the client email",
    },
    statuses: {
      loadingListings: "Loading listings...",
      listingsLoaded: "Listings loaded",
      backendUnavailable: "Service is temporarily unavailable",
      comparing: "Comparing listings...",
      compareCount: (count) => `Comparing listings: ${count}`,
      compareUnavailable: "Comparison unavailable for the current set",
      compareLimit: "You can compare up to 5 listings",
      aiNotCreated: "Recommendation not created",
      aiReady: "Recommendation ready to generate",
      aiBuilding: "Preparing recommendation...",
      aiRefused: "Recommendation unavailable for this request",
      aiSaved: () => "Recommendation ready",
      aiUnavailable: "Recommendation unavailable",
      shortlistNotCreated: "Buyer summary not created",
      shortlistReady: "Buyer summary ready to generate",
      shortlistBuilding: "Buyer summary is being prepared...",
      shortlistCount: (count) => `${count} apartments in buyer summary`,
      shortlistUnavailable: "Buyer summary unavailable",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Based on available sources",
      winner: "Best option",
      sourceLinks: "Show source links",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} room${count === 1 ? "" : "s"}`,
      monthly: "mo.",
      loan: "loan",
      cash: "cash",
      fair: "to estimated range",
      negotiation: "negotiation",
      gross: "gross",
      liquidity: "liquidity",
      rent: "rent",
      metersToStop: (meters) => `${meters} m to stop`,
      schoolsParks: (schools, parks) =>
        `${schools} school${schools === 1 ? "" : "s"} · ${parks} park${parks === 1 ? "" : "s"}`,
      plannedInvestments: (count) => `${count} within 2 km`,
      mortgageAssumptions: (downPaymentPct, loanYears, interestPct) =>
        `${downPaymentPct.toFixed(0)}% down / ${loanYears} years / ${interestPct.toFixed(1)}%`,
    },
    table: {
      metric: "Metric",
      location: "Location",
      price: "Price",
      pricePerM2: "Price/m2",
      areaRooms: "Area and rooms",
      daysOnMarket: "Days on market",
      decisionScore: "Decision score",
      verdict: "Verdict",
      developer: "Developer",
      developerRisk: "Developer risk",
      developerCheck: "Developer checks",
      mortgagePayment: "Baseline mortgage",
      cashNeeded: "Cash needed",
      totalMoveInCost: "Total move-in cost",
      transactionCosts: "Transaction costs",
      renovationFurniture: "Renovation + furniture",
      readyAlternative: "Ready-to-move alternative",
      postRenovationGap: "After-renovation gap",
      offerStrategy: "Offer strategy",
      rentalEstimate: "Rental estimate",
      priceLabel: "Price assessment",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      negotiationScore: "Negotiation Score",
      liquidity: "Liquidity",
      rentalPotential: "Rental Potential",
      fairPrice: "Fair price",
      fairPriceConfidence: "Price confidence",
      checkCompleteness: "Check completeness",
      criticalUnknowns: "Critical unknowns",
      sourceConfidence: "Source confidence",
      fairPriceDelta: "Difference from estimate",
      discountToFair: "Below estimate",
      transport: "Transport",
      infrastructure: "Infrastructure",
      plannedInvestments: "Planned investments",
      negotiationArgument: "Negotiation argument",
      mainRisk: "Main risk",
      recommendation: "Recommendation",
    },
    empty: {
      selectMin: "Choose at least 2 listings to compare.",
      noAiAnswer: "Recommendation explanation will appear here after generation.",
      noShortlist: "Buyer summary will appear here after generation.",
      noData: "No data.",
      noWarnings: "No critical warnings",
      noDeveloper: "No matched developer",
      noDeveloperRisk: "No developer risk data",
      manualDeveloperCheck: "Check seller/developer manually",
      developerDueDiligence: "Check KRS/REGON and project company.",
    },
    developerLabels: {
      strong: "strong developer",
      good: "good profile",
      mixed: "mixed profile",
      limited_data: "limited data",
      risk_review: "needs review",
    },
    assistantColumn: {
      keyPoints: "Key points",
      tradeoffs: "Tradeoffs",
    },
  },
  pl: {
    title: "Porównanie ofert",
    subtitle: "Cena, płynność, ryzyka, pole do negocjacji i potencjał inwestycyjny w jednym widoku.",
    actions: {
      search: "Szukaj",
      refresh: "Odśwież",
      getVerdict: "Wyjaśnij rekomendację",
      buildShortlist: "Przygotuj podsumowanie",
    },
    sections: {
      selector: "Wybór ofert",
      aiVerdict: "Wyjaśnienie rekomendacji",
      clientShortlist: "Podsumowanie dla kupującego",
      comparisonMatrix: "Macierz porównania",
      sourcesAndLimits: "Źródła i ograniczenia",
    },
    metrics: {
      bestChoice: "Najlepszy wybór",
      belowFairPrice: "Poniżej szacowanej ceny",
      cheaperMonthly: "Tańsze miesięcznie",
      rentalSignal: "Sygnał najmu",
    },
    fields: {
      audience: "Odbiorca",
      question: "Pytanie",
      client: "Klient",
      intro: "Intro",
    },
    placeholders: {
      aiQuestion: "Na przykład: co wybrać dla rodziny albo pod wynajem?",
      clientName: "Anna",
      intro: "Kontekst do wiadomości dla klienta",
    },
    statuses: {
      loadingListings: "Ładowanie ofert...",
      listingsLoaded: "Oferty załadowane",
      backendUnavailable: "Usługa jest chwilowo niedostępna",
      comparing: "Porównywanie ofert...",
      compareCount: (count) => `Porównywane oferty: ${count}`,
      compareUnavailable: "Porównanie niedostępne dla obecnego zestawu",
      compareLimit: "Można porównać maksymalnie 5 ofert",
      aiNotCreated: "Wyjaśnienie nie zostało jeszcze utworzone",
      aiReady: "Wyjaśnienie jest gotowe do wygenerowania",
      aiBuilding: "Przygotowujemy wyjaśnienie...",
      aiRefused: "Nie można przygotować wyjaśnienia dla tych danych",
      aiSaved: () => "Wyjaśnienie zapisane",
      aiUnavailable: "Wyjaśnienie niedostępne",
      shortlistNotCreated: "Podsumowanie nie zostało jeszcze utworzone",
      shortlistReady: "Podsumowanie jest gotowe do wygenerowania",
      shortlistBuilding: "Przygotowujemy podsumowanie...",
      shortlistCount: (count) => `${count} ofert w podsumowaniu`,
      shortlistUnavailable: "Podsumowanie niedostępne",
    },
    values: {
      buyer: "Kupujący",
      realtor: "Pośrednik",
      investor: "Inwestor",
      refused: "Odrzucono",
      sourceGrounded: "Oparte na danych",
      winner: "Najlepsza opcja",
      sourceLinks: "Pokaż linki źródłowe",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} pok.`,
      monthly: "mies.",
      loan: "kredyt",
      cash: "gotówka",
      fair: "do szacunku",
      negotiation: "negocjacja",
      gross: "brutto",
      liquidity: "płynność",
      rent: "najem",
      metersToStop: (meters) => `${meters} m do przystanku`,
      schoolsParks: (schools, parks) =>
        `${schools} szk. · ${parks} ${pluralPl(parks, "park", "parki", "parków")}`,
      plannedInvestments: (count) => `${count} w promieniu 2 km`,
      mortgageAssumptions: (downPaymentPct, loanYears, interestPct) =>
        `${downPaymentPct.toFixed(0)}% wkładu / ${loanYears} lat / ${interestPct.toFixed(1)}%`,
    },
    table: {
      metric: "Metryka",
      location: "Lokalizacja",
      price: "Cena",
      pricePerM2: "Cena/m2",
      areaRooms: "Powierzchnia i pokoje",
      daysOnMarket: "Dni na rynku",
      decisionScore: "Ocena decyzji",
      verdict: "Werdykt",
      developer: "Deweloper",
      developerRisk: "Ryzyko dewelopera",
      developerCheck: "Sprawdzenie dewelopera",
      mortgagePayment: "Bazowa hipoteka",
      cashNeeded: "Potrzebna gotówka",
      totalMoveInCost: "Całkowity koszt wejścia",
      transactionCosts: "Koszty transakcyjne",
      renovationFurniture: "Remont + meble",
      readyAlternative: "Gotowa alternatywa",
      postRenovationGap: "Różnica po remoncie",
      offerStrategy: "Strategia oferty",
      rentalEstimate: "Szacunek najmu",
      priceLabel: "Ocena ceny",
      investmentScore: "Potencjał inwestycyjny",
      riskScore: "Ryzyko",
      negotiationScore: "Potencjał negocjacji",
      liquidity: "Liquidity",
      rentalPotential: "Potencjał najmu",
      fairPrice: "Szacowana cena",
      fairPriceConfidence: "Pewność szacunku",
      checkCompleteness: "Pełność sprawdzenia",
      criticalUnknowns: "Kluczowe niewiadome",
      sourceConfidence: "Pewność źródeł",
      fairPriceDelta: "Różnica względem szacunku",
      discountToFair: "Poniżej szacunku",
      transport: "Transport",
      infrastructure: "Infrastruktura",
      plannedInvestments: "Planowane inwestycje",
      negotiationArgument: "Argument do negocjacji",
      mainRisk: "Główne ryzyko",
      recommendation: "Rekomendacja",
    },
    empty: {
      selectMin: "Wybierz co najmniej 2 oferty do porównania.",
      noAiAnswer: "Wyjaśnienie rekomendacji pojawi się tutaj po wygenerowaniu.",
      noShortlist: "Podsumowanie dla kupującego pojawi się tutaj po wygenerowaniu.",
      noData: "Brak danych.",
      noWarnings: "Brak krytycznych ostrzeżeń",
      noDeveloper: "Brak dopasowanego dewelopera",
      noDeveloperRisk: "Brak danych o ryzyku dewelopera",
      manualDeveloperCheck: "Sprawdź sprzedawcę/dewelopera ręcznie",
      developerDueDiligence: "Sprawdź KRS/REGON i spółkę projektową.",
    },
    developerLabels: {
      strong: "mocny deweloper",
      good: "dobry profil",
      mixed: "mieszany profil",
      limited_data: "mało danych",
      risk_review: "wymaga sprawdzenia",
    },
    assistantColumn: {
      keyPoints: "Kluczowe wnioski",
      tradeoffs: "Kompromisy",
    },
  },
  ru: {
    title: "Сравнение объектов",
    subtitle: "Сравнение цены, ликвидности, рисков, торга и инвестиционного потенциала.",
    actions: {
      search: "Подбор",
      refresh: "Обновить",
      getVerdict: "Объяснить рекомендацию",
      buildShortlist: "Собрать подборку",
    },
    sections: {
      selector: "Выбор объектов",
      aiVerdict: "Объяснение рекомендации",
      clientShortlist: "Подборка для покупателя",
      comparisonMatrix: "Матрица сравнения",
      sourcesAndLimits: "Источники и ограничения",
    },
    metrics: {
      bestChoice: "Лучший выбор",
      belowFairPrice: "Ниже оценки рынка",
      cheaperMonthly: "Дешевле в месяц",
      rentalSignal: "Арендный сигнал",
    },
    fields: {
      audience: "Для кого",
      question: "Вопрос",
      client: "Клиент",
      intro: "Контекст",
    },
    placeholders: {
      aiQuestion: "Например: что выбрать для семьи или сдачи в аренду?",
      clientName: "Anna",
      intro: "Контекст для письма клиенту",
    },
    statuses: {
      loadingListings: "Загрузка объектов...",
      listingsLoaded: "Объекты загружены",
      backendUnavailable: "Сервис временно недоступен",
      comparing: "Сравнение объектов...",
      compareCount: (count) => `Сравнивается объектов: ${count}`,
      compareUnavailable: "Сравнение недоступно для текущего набора",
      compareLimit: "Максимум 5 объектов в сравнении",
      aiNotCreated: "Объяснение еще не создано",
      aiReady: "Объяснение готово к генерации",
      aiBuilding: "Готовим объяснение...",
      aiRefused: "Не удалось подготовить объяснение для этих данных",
      aiSaved: () => "Объяснение сохранено",
      aiUnavailable: "Объяснение недоступно",
      shortlistNotCreated: "Подборка еще не создана",
      shortlistReady: "Подборка готова к генерации",
      shortlistBuilding: "Готовим подборку...",
      shortlistCount: (count) => `${count} объектов в клиентской подборке`,
      shortlistUnavailable: "Подборка недоступна",
    },
    values: {
      buyer: "Покупатель",
      realtor: "Риелтор",
      investor: "Инвестор",
      refused: "Не удалось ответить",
      sourceGrounded: "Основано на данных",
      winner: "Лучший вариант",
      sourceLinks: "Показать ссылки на источники",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} pok.`,
      monthly: "мес",
      loan: "кредит",
      cash: "наличные",
      fair: "к оценке",
      negotiation: "торг",
      gross: "брутто",
      liquidity: "ликвидность",
      rent: "аренда",
      metersToStop: (meters) => `${meters} м до остановки`,
      schoolsParks: (schools, parks) =>
        `${schools} ${pluralRu(schools, "школа", "школы", "школ")} · ${parks} ${pluralRu(
          parks,
          "парк",
          "парка",
          "парков",
        )}`,
      plannedInvestments: (count) => `${count} в радиусе 2 км`,
      mortgageAssumptions: (downPaymentPct, loanYears, interestPct) =>
        `${downPaymentPct.toFixed(0)}% / ${loanYears} лет / ${interestPct.toFixed(1)}%`,
    },
    table: {
      metric: "Метрика",
      location: "Локация",
      price: "Цена",
      pricePerM2: "Цена/m2",
      areaRooms: "Площадь и комнаты",
      daysOnMarket: "Дней на рынке",
      decisionScore: "Оценка решения",
      verdict: "Вердикт",
      developer: "Застройщик",
      developerRisk: "Риск застройщика",
      developerCheck: "Проверить по застройщику",
      mortgagePayment: "Базовый платеж по ипотеке",
      cashNeeded: "Деньги на старте",
      totalMoveInCost: "Полная стоимость въезда",
      transactionCosts: "Расходы по сделке",
      renovationFurniture: "Ремонт + мебель",
      readyAlternative: "Готовая альтернатива",
      postRenovationGap: "Разница после ремонта",
      offerStrategy: "Стратегия предложения",
      rentalEstimate: "Оценка аренды",
      priceLabel: "Оценка цены",
      investmentScore: "Инвестиционный потенциал",
      riskScore: "Риск",
      negotiationScore: "Потенциал торга",
      liquidity: "Ликвидность",
      rentalPotential: "Потенциал аренды",
      fairPrice: "Оценка рынка",
      fairPriceConfidence: "Уверенность оценки",
      checkCompleteness: "Полнота проверки",
      criticalUnknowns: "Ключевые неизвестные",
      sourceConfidence: "Уверенность источников",
      fairPriceDelta: "Разница с оценкой",
      discountToFair: "Ниже оценки",
      transport: "Транспорт",
      infrastructure: "Инфраструктура",
      plannedInvestments: "Планируемые изменения",
      negotiationArgument: "Аргумент для торга",
      mainRisk: "Главный риск",
      recommendation: "Рекомендация",
    },
    empty: {
      selectMin: "Выбери минимум 2 объекта для сравнения.",
      noAiAnswer: "Объяснение рекомендации появится здесь после генерации.",
      noShortlist: "Подборка для покупателя появится здесь после генерации.",
      noData: "Нет данных.",
      noWarnings: "Критичных предупреждений нет",
      noDeveloper: "Нет сопоставленного застройщика",
      noDeveloperRisk: "Нет данных о риске застройщика",
      manualDeveloperCheck: "Проверить продавца/застройщика вручную",
      developerDueDiligence: "Проверить KRS/REGON и проектную компанию.",
    },
    developerLabels: {
      strong: "сильный застройщик",
      good: "хороший профиль",
      mixed: "смешанный профиль",
      limited_data: "мало данных",
      risk_review: "нужна проверка",
    },
    assistantColumn: {
      keyPoints: "Ключевые выводы",
      tradeoffs: "Компромиссы",
    },
  },
  uk: {
    title: "Порівняння об'єктів",
    subtitle: "Порівняння ціни, ліквідності, ризиків, торгу та інвестиційного потенціалу.",
    actions: {
      search: "Підбір",
      refresh: "Оновити",
      getVerdict: "Пояснити рекомендацію",
      buildShortlist: "Зібрати добірку",
    },
    sections: {
      selector: "Вибір об'єктів",
      aiVerdict: "Пояснення рекомендації",
      clientShortlist: "Добірка для покупця",
      comparisonMatrix: "Матриця порівняння",
      sourcesAndLimits: "Джерела та обмеження",
    },
    metrics: {
      bestChoice: "Найкращий вибір",
      belowFairPrice: "Нижче оцінки ринку",
      cheaperMonthly: "Дешевше на місяць",
      rentalSignal: "Орендний сигнал",
    },
    fields: {
      audience: "Для кого",
      question: "Питання",
      client: "Клієнт",
      intro: "Контекст",
    },
    placeholders: {
      aiQuestion: "Наприклад: що вибрати для сім'ї або здачі в оренду?",
      clientName: "Anna",
      intro: "Контекст для листа клієнту",
    },
    statuses: {
      loadingListings: "Завантаження об'єктів...",
      listingsLoaded: "Об'єкти завантажено",
      backendUnavailable: "Сервіс тимчасово недоступний",
      comparing: "Порівняння об'єктів...",
      compareCount: (count) => `Порівнюється об'єктів: ${count}`,
      compareUnavailable: "Порівняння недоступне для поточного набору",
      compareLimit: "Максимум 5 об'єктів у порівнянні",
      aiNotCreated: "Пояснення ще не створено",
      aiReady: "Пояснення готове до генерації",
      aiBuilding: "Готуємо пояснення...",
      aiRefused: "Не вдалося підготувати пояснення для цих даних",
      aiSaved: () => "Пояснення збережено",
      aiUnavailable: "Пояснення недоступне",
      shortlistNotCreated: "Добірку ще не створено",
      shortlistReady: "Добірка готова до генерації",
      shortlistBuilding: "Готуємо добірку...",
      shortlistCount: (count) => `${count} об'єктів у клієнтській добірці`,
      shortlistUnavailable: "Добірка недоступна",
    },
    values: {
      buyer: "Покупець",
      realtor: "Ріелтор",
      investor: "Інвестор",
      refused: "Не вдалося відповісти",
      sourceGrounded: "Засновано на даних",
      winner: "Найкращий варіант",
      sourceLinks: "Показати посилання на джерела",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} кімн.`,
      monthly: "міс.",
      loan: "кредит",
      cash: "готівка",
      fair: "до оцінки",
      negotiation: "торг",
      gross: "брутто",
      liquidity: "ліквідність",
      rent: "оренда",
      metersToStop: (meters) => `${meters} м до зупинки`,
      schoolsParks: (schools, parks) =>
        `${schools} ${pluralUk(schools, "школа", "школи", "шкіл")} · ${parks} ${pluralUk(
          parks,
          "парк",
          "парки",
          "парків",
        )}`,
      plannedInvestments: (count) => `${count} у радіусі 2 км`,
      mortgageAssumptions: (downPaymentPct, loanYears, interestPct) =>
        `${downPaymentPct.toFixed(0)}% / ${loanYears} років / ${interestPct.toFixed(1)}%`,
    },
    table: {
      metric: "Метрика",
      location: "Локація",
      price: "Ціна",
      pricePerM2: "Ціна/m2",
      areaRooms: "Площа і кімнати",
      daysOnMarket: "Днів на ринку",
      decisionScore: "Оцінка рішення",
      verdict: "Вердикт",
      developer: "Забудовник",
      developerRisk: "Ризик забудовника",
      developerCheck: "Перевірити забудовника",
      mortgagePayment: "Базовий платіж за іпотекою",
      cashNeeded: "Гроші на старті",
      totalMoveInCost: "Повна вартість входу",
      transactionCosts: "Витрати за угодою",
      renovationFurniture: "Ремонт + меблі",
      readyAlternative: "Готова альтернатива",
      postRenovationGap: "Різниця після ремонту",
      offerStrategy: "Стратегія пропозиції",
      rentalEstimate: "Оцінка оренди",
      priceLabel: "Оцінка ціни",
      investmentScore: "Інвестиційний потенціал",
      riskScore: "Ризик",
      negotiationScore: "Потенціал торгу",
      liquidity: "Ліквідність",
      rentalPotential: "Потенціал оренди",
      fairPrice: "Оцінка ринку",
      fairPriceConfidence: "Впевненість оцінки",
      checkCompleteness: "Повнота перевірки",
      criticalUnknowns: "Ключові невідомі",
      sourceConfidence: "Впевненість джерел",
      fairPriceDelta: "Різниця з оцінкою",
      discountToFair: "Нижче оцінки",
      transport: "Транспорт",
      infrastructure: "Інфраструктура",
      plannedInvestments: "Плановані зміни",
      negotiationArgument: "Аргумент для торгу",
      mainRisk: "Головний ризик",
      recommendation: "Рекомендація",
    },
    empty: {
      selectMin: "Вибери мінімум 2 об'єкти для порівняння.",
      noAiAnswer: "Пояснення рекомендації з'явиться тут після генерації.",
      noShortlist: "Добірка для покупця з'явиться тут після генерації.",
      noData: "Немає даних.",
      noWarnings: "Критичних попереджень немає",
      noDeveloper: "Немає зіставленого забудовника",
      noDeveloperRisk: "Немає даних про ризик забудовника",
      manualDeveloperCheck: "Перевірити продавця/забудовника вручну",
      developerDueDiligence: "Перевірити KRS/REGON і проектну компанію.",
    },
    developerLabels: {
      strong: "сильний забудовник",
      good: "хороший профіль",
      mixed: "змішаний профіль",
      limited_data: "мало даних",
      risk_review: "потрібна перевірка",
    },
    assistantColumn: {
      keyPoints: "Ключові висновки",
      tradeoffs: "Компроміси",
    },
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
      subtitle: "Search apartments by price, risk, liquidity and negotiation potential.",
      actions: {
        refresh: "Refresh",
        hiddenGems: "Strong opportunities",
        compare: (count) => `Compare ${count}`,
        alert: "Track search",
        apply: "Apply",
        reset: "Reset",
        reports: "Reports",
        favorite: "Favorite",
      },
      metrics: {
        found: "Listings found",
        bestGem: "Best opportunity",
        bestInvestment: "Best fit",
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
        maxFairDelta: "Maximum above fair range",
        minInvestment: "Investment potential from",
        maxRisk: "Risk up to",
        minNegotiation: "Negotiation potential from",
        minLiquidity: "Liquidity from",
        minRental: "Rental potential from",
        minDataQuality: "Data quality from",
        minDeveloperReputation: "Min developer rating",
        minDeveloperConfidence: "Min developer confidence",
        minDeveloperCompleted: "Completed projects from",
        minDeveloperActive: "Active projects from",
        requireDeveloper: "Only with developer",
        excludeDeveloperRisk: "Without developer risk",
        radiusFromCenter: "Radius from center",
        wholeWroclaw: "Whole Wrocław",
        maxCenterKm: "Max to center, km",
        maxStopM: "Max to stop, m",
        maxSchoolM: "Max to school, m",
        minMajorRoadM: "Min from road, m",
        minIndustrialZoneM: "Min from industrial zone, m",
        mode: "Mode",
        standardMode: "Standard search",
        sort: "Sort",
        pageSize: "Per page",
        advancedFilters: "Advanced filters",
      },
      status: {
        loading: "Loading analytics...",
        backendUnavailable: "The data service is temporarily unavailable",
        filtersReset: "Filters reset",
        compareLimit: "You can compare up to 4 apartments",
        favoriteAdded: "Added to favorites",
        alertCreated: "Alert created",
        mapLoading: "Updating map...",
        mapUnavailable: "The map is temporarily unavailable",
        found: (total, page, totalPages) => `Found ${total} · page ${page} of ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Strong opportunities ${total} · page ${page} of ${totalPages || 1}`,
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
      map: { title: "Map" },
      savedSearchName: "Saved apartment search",
      favoriteNote: "Added from search panel",
    },
    pl: {
      title: "Wyszukiwarka nieruchomości Wrocław",
      subtitle: "Szukaj mieszkań według ceny, ryzyka, płynności i potencjału negocjacji.",
      actions: {
        refresh: "Odśwież",
        hiddenGems: "Mocne okazje",
        compare: (count) => `Porównaj ${count}`,
        alert: "Śledź wyszukiwanie",
        apply: "Zastosuj",
        reset: "Reset",
        reports: "Raporty",
        favorite: "Ulubione",
      },
      metrics: {
        found: "Znalezione oferty",
        bestGem: "Najlepsza okazja",
        bestInvestment: "Najlepiej dopasowane",
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
        maxFairDelta: "Maksymalnie ponad ceną rynkową",
        minInvestment: "Potencjał inwestycyjny od",
        maxRisk: "Ryzyko do",
        minNegotiation: "Potencjał negocjacji od",
        minLiquidity: "Płynność od",
        minRental: "Potencjał najmu od",
        minDataQuality: "Min. jakość danych",
        minDeveloperReputation: "Min. rating dewelopera",
        minDeveloperConfidence: "Pewność danych o deweloperze od",
        minDeveloperCompleted: "Ukończone projekty od",
        minDeveloperActive: "Aktywne projekty od",
        requireDeveloper: "Tylko z deweloperem",
        excludeDeveloperRisk: "Bez istotnych ryzyk dewelopera",
        radiusFromCenter: "Promień od centrum",
        wholeWroclaw: "Cały Wrocław",
        maxCenterKm: "Maks. do centrum, km",
        maxStopM: "Maks. do przystanku, m",
        maxSchoolM: "Maks. do szkoły, m",
        minMajorRoadM: "Min. od drogi, m",
        minIndustrialZoneM: "Min. od strefy przemysłowej, m",
        mode: "Tryb",
        standardMode: "Zwykłe wyszukiwanie",
        sort: "Sortowanie",
        pageSize: "Na stronie",
        advancedFilters: "Filtry zaawansowane",
      },
      status: {
        loading: "Ładowanie analityki...",
        backendUnavailable: "Usługa danych jest chwilowo niedostępna",
        filtersReset: "Filtry zresetowane",
        compareLimit: "Można porównać maksymalnie 4 mieszkania",
        favoriteAdded: "Dodano do ulubionych",
        alertCreated: "Śledzenie wyszukiwania włączone",
        mapLoading: "Aktualizacja mapy...",
        mapUnavailable: "Mapa jest chwilowo niedostępna",
        found: (total, page, totalPages) =>
          `Znaleziono ${total} · strona ${page} z ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Mocne okazje ${total} · strona ${page} z ${totalPages || 1}`,
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
      map: { title: "Mapa" },
      savedSearchName: "Zapisane wyszukiwanie mieszkań",
      favoriteNote: "Dodane z panelu wyszukiwania",
    },
    ru: {
      title: "Подбор недвижимости Wrocław",
      subtitle: "Ищите квартиры по цене, рискам, ликвидности и потенциалу торга.",
      actions: {
        refresh: "Обновить",
        hiddenGems: "Сильные возможности",
        compare: (count) => `Сравнить ${count}`,
        alert: "Уведомление",
        apply: "Применить",
        reset: "Сброс",
        reports: "Отчеты",
        favorite: "Избранное",
      },
      metrics: {
        found: "Объектов найдено",
        bestGem: "Лучшая возможность",
        bestInvestment: "Лучшее совпадение",
        medianArea: "Медиана района",
        priceTrend90d: "Динамика цены 90 дней",
      },
      filters: {
        title: "Фильтры и сортировка",
        search: "Поиск",
        searchPlaceholder: "адрес, район, улица",
        municipality: "Гмина",
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
        maxFairDelta: "Максимум выше рыночного диапазона",
        minInvestment: "Инвестиционный потенциал от",
        maxRisk: "Риск до",
        minNegotiation: "Потенциал торга от",
        minLiquidity: "Ликвидность от",
        minRental: "Потенциал аренды от",
        minDataQuality: "Мин. качество данных",
        minDeveloperReputation: "Мин. рейтинг застройщика",
        minDeveloperConfidence: "Мин. уверенность по застройщику",
        minDeveloperCompleted: "Сданных проектов от",
        minDeveloperActive: "Активных проектов от",
        requireDeveloper: "Только с застройщиком",
        excludeDeveloperRisk: "Без риска застройщика",
        radiusFromCenter: "Радиус от центра",
        wholeWroclaw: "Весь Вроцлав",
        maxCenterKm: "Макс. до центра, км",
        maxStopM: "Макс. до остановки, м",
        maxSchoolM: "Макс. до школы, м",
        minMajorRoadM: "Мин. от дороги, м",
        minIndustrialZoneM: "Мин. от промзоны, м",
        mode: "Режим",
        standardMode: "Обычный поиск",
        sort: "Сортировка",
        pageSize: "На странице",
        advancedFilters: "Дополнительные фильтры",
      },
      status: {
        loading: "Загрузка аналитики...",
        backendUnavailable: "Сервис данных временно недоступен",
        filtersReset: "Фильтры сброшены",
        compareLimit: "Для сравнения можно выбрать максимум 4 квартиры",
        favoriteAdded: "Добавлено в избранное",
        alertCreated: "Уведомление создано",
        mapLoading: "Обновление карты...",
        mapUnavailable: "Карта временно недоступна",
        found: (total, page, totalPages) =>
          `Найдено ${total} · страница ${page} из ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Сильные возможности ${total} · страница ${page} из ${totalPages || 1}`,
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
      map: { title: "Карта" },
      savedSearchName: "Сохраненный поиск из подбора",
      favoriteNote: "Добавлено из панели поиска",
    },
    uk: {
      title: "Підбір нерухомості Wrocław",
      subtitle: "Шукайте квартири за ціною, ризиками, ліквідністю та потенціалом торгу.",
      actions: {
        refresh: "Оновити",
        hiddenGems: "Сильні можливості",
        compare: (count) => `Порівняти ${count}`,
        alert: "Сповіщення",
        apply: "Застосувати",
        reset: "Скинути",
        reports: "Звіти",
        favorite: "Обране",
      },
      metrics: {
        found: "Об'єктів знайдено",
        bestGem: "Найкраща можливість",
        bestInvestment: "Найкращий збіг",
        medianArea: "Медіана району",
        priceTrend90d: "Динаміка ціни 90 днів",
      },
      filters: {
        title: "Фільтри та сортування",
        search: "Пошук",
        searchPlaceholder: "адреса, район, вулиця",
        municipality: "Гміна",
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
        maxFairDelta: "Максимум вище ринкового діапазону",
        minInvestment: "Інвестиційний потенціал від",
        maxRisk: "Ризик до",
        minNegotiation: "Потенціал торгу від",
        minLiquidity: "Ліквідність від",
        minRental: "Потенціал оренди від",
        minDataQuality: "Мін. якість даних",
        minDeveloperReputation: "Мін. рейтинг забудовника",
        minDeveloperConfidence: "Мін. впевненість щодо забудовника",
        minDeveloperCompleted: "Зданих проектів від",
        minDeveloperActive: "Активних проектів від",
        requireDeveloper: "Тільки із забудовником",
        excludeDeveloperRisk: "Без ризику забудовника",
        radiusFromCenter: "Радіус від центру",
        wholeWroclaw: "Увесь Вроцлав",
        maxCenterKm: "Макс. до центру, км",
        maxStopM: "Макс. до зупинки, м",
        maxSchoolM: "Макс. до школи, м",
        minMajorRoadM: "Мін. від дороги, м",
        minIndustrialZoneM: "Мін. від промзони, м",
        mode: "Режим",
        standardMode: "Звичайний пошук",
        sort: "Сортування",
        pageSize: "На сторінці",
        advancedFilters: "Додаткові фільтри",
      },
      status: {
        loading: "Завантаження аналітики...",
        backendUnavailable: "Сервіс даних тимчасово недоступний",
        filtersReset: "Фільтри скинуто",
        compareLimit: "Для порівняння можна вибрати максимум 4 квартири",
        favoriteAdded: "Додано в обране",
        alertCreated: "Сповіщення створено",
        mapLoading: "Оновлення карти...",
        mapUnavailable: "Карта тимчасово недоступна",
        found: (total, page, totalPages) =>
          `Знайдено ${total} · сторінка ${page} з ${totalPages || 1}`,
        hiddenGems: (total, page, totalPages) =>
          `Сильні можливості ${total} · сторінка ${page} з ${totalPages || 1}`,
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
      map: { title: "Карта" },
      savedSearchName: "Збережений пошук з панелі",
      favoriteNote: "Додано з панелі пошуку",
    },
  };
  return {
    ...content[locale],
    optionLabels: optionLabels(locale),
  };
}

function accountLabels(locale: Locale): AccountPageCopy["labels"] {
  const labels: Record<Locale, AccountPageCopy["labels"]> = {
    en: {
      plan: {
        free: "Free",
        buyer_pro: "Buyer Pro",
        investor: "Investor",
        realtor: "Realtor",
        agency: "Agency",
        enterprise: "Enterprise",
      },
      userRole: {
        buyer: "Buyer",
        realtor: "Realtor",
        agency_admin: "Agency admin",
        admin: "Admin",
      },
      subscriptionStatus: {
        trialing: "Trialing",
        active: "Active",
        past_due: "Past due",
        canceled: "Canceled",
      },
      agencyRole: { owner: "Owner", admin: "Admin", agent: "Agent" },
      agencyStatus: { active: "Active", invited: "Invited", disabled: "Disabled" },
      crmClientStatus: {
        active: "Active",
        paused: "Paused",
        won: "Won",
        lost: "Lost",
        archived: "Archived",
      },
      noteVisibility: {
        internal: "Internal",
        client_shareable: "Client shareable",
      },
      shortlistStatus: {
        draft: "Draft",
        shared: "Shared",
        accepted: "Accepted",
        rejected: "Rejected",
        archived: "Archived",
      },
      reportOrderStatus: {
        unpaid: "Unpaid",
        paid: "Paid",
        fulfilled: "Report ready",
        canceled: "Canceled",
      },
      capability: {
        favorites: "Favorites",
        export: "Export",
        api: "API",
        white_label: "White-label",
      },
    },
    pl: {
      plan: {
        free: "Free",
        buyer_pro: "Buyer Pro",
        investor: "Investor",
        realtor: "Realtor",
        agency: "Agency",
        enterprise: "Enterprise",
      },
      userRole: {
        buyer: "Kupujący",
        realtor: "Pośrednik",
        agency_admin: "Admin agencji",
        admin: "Admin",
      },
      subscriptionStatus: {
        trialing: "Trial",
        active: "Aktywna",
        past_due: "Po terminie",
        canceled: "Anulowana",
      },
      agencyRole: { owner: "Owner", admin: "Admin", agent: "Agent" },
      agencyStatus: { active: "Aktywny", invited: "Zaproszony", disabled: "Wyłączony" },
      crmClientStatus: {
        active: "Aktywny",
        paused: "Pauza",
        won: "Wygrany",
        lost: "Utracony",
        archived: "Archiwum",
      },
      noteVisibility: {
        internal: "Wewnętrzna",
        client_shareable: "Do pokazania klientowi",
      },
      shortlistStatus: {
        draft: "Draft",
        shared: "Udostępniony",
        accepted: "Zaakceptowany",
        rejected: "Odrzucony",
        archived: "Archiwum",
      },
      reportOrderStatus: {
        unpaid: "Nieopłacone",
        paid: "Opłacone",
        fulfilled: "Zrealizowane",
        canceled: "Anulowane",
      },
      capability: {
        favorites: "Ulubione",
        export: "Eksport",
        api: "API",
        white_label: "White-label",
      },
    },
    ru: {
      plan: {
        free: "Free",
        buyer_pro: "Buyer Pro",
        investor: "Investor",
        realtor: "Realtor",
        agency: "Agency",
        enterprise: "Enterprise",
      },
      userRole: {
        buyer: "Покупатель",
        realtor: "Риелтор",
        agency_admin: "Админ агентства",
        admin: "Админ",
      },
      subscriptionStatus: {
        trialing: "Trial",
        active: "Активна",
        past_due: "Просрочена",
        canceled: "Отменена",
      },
      agencyRole: { owner: "Owner", admin: "Admin", agent: "Agent" },
      agencyStatus: { active: "Активен", invited: "Приглашен", disabled: "Отключен" },
      crmClientStatus: {
        active: "Активен",
        paused: "Пауза",
        won: "Won",
        lost: "Lost",
        archived: "Архив",
      },
      noteVisibility: {
        internal: "Внутренняя",
        client_shareable: "Можно показать клиенту",
      },
      shortlistStatus: {
        draft: "Draft",
        shared: "Shared",
        accepted: "Accepted",
        rejected: "Rejected",
        archived: "Архив",
      },
      reportOrderStatus: {
        unpaid: "Не оплачен",
        paid: "Оплачен",
        fulfilled: "Готов",
        canceled: "Отменен",
      },
      capability: {
        favorites: "Избранное",
        export: "Export",
        api: "API",
        white_label: "White-label",
      },
    },
    uk: {
      plan: {
        free: "Free",
        buyer_pro: "Buyer Pro",
        investor: "Investor",
        realtor: "Realtor",
        agency: "Agency",
        enterprise: "Enterprise",
      },
      userRole: {
        buyer: "Покупець",
        realtor: "Ріелтор",
        agency_admin: "Адмін агентства",
        admin: "Адмін",
      },
      subscriptionStatus: {
        trialing: "Trial",
        active: "Активна",
        past_due: "Прострочена",
        canceled: "Скасована",
      },
      agencyRole: { owner: "Owner", admin: "Admin", agent: "Agent" },
      agencyStatus: { active: "Активний", invited: "Запрошений", disabled: "Вимкнений" },
      crmClientStatus: {
        active: "Активний",
        paused: "Пауза",
        won: "Won",
        lost: "Lost",
        archived: "Архів",
      },
      noteVisibility: {
        internal: "Внутрішня",
        client_shareable: "Можна показати клієнту",
      },
      shortlistStatus: {
        draft: "Draft",
        shared: "Shared",
        accepted: "Accepted",
        rejected: "Rejected",
        archived: "Архів",
      },
      reportOrderStatus: {
        unpaid: "Не оплачено",
        paid: "Оплачено",
        fulfilled: "Готово",
        canceled: "Скасовано",
      },
      capability: {
        favorites: "Обране",
        export: "Export",
        api: "API",
        white_label: "White-label",
      },
    },
  };
  return labels[locale];
}

function accountStatuses(locale: Locale): AccountPageCopy["statuses"] {
  const statuses: Record<Locale, AccountPageCopy["statuses"]> = {
    en: {
      loadingAccount: "Loading account...",
      loadingAccountAndLimits: "Loading account and limits",
      accountUpdated: "Account updated",
      backendUnavailable: "Service is temporarily unavailable",
      unknownError: "Something went wrong",
      loadingCrmError: "CRM loading error",
      switchingPlan: (plan) => `Switching to ${plan}...`,
      planChanged: (plan) => `Plan: ${plan}`,
      loadingWorkspace: "Loading workspace...",
      workspaceSelected: "Workspace selected",
      loadingWorkspaceError: "Workspace loading error",
      agencyNameRequired: "Agency name is required",
      creatingAgency: "Creating agency workspace...",
      agencyCreated: "Agency workspace created",
      agencyCreateError: "Agency workspace creation error",
      memberUserIdRequired: "Member User ID is required",
      addingMember: "Adding member...",
      memberAdded: "Member added",
      addMemberError: "Member add error",
      updatingRole: "Updating role...",
      roleUpdated: "Role updated",
      roleUpdateError: "Role update error",
      updatingStatus: "Updating status...",
      statusUpdated: "Status updated",
      statusUpdateError: "Status update error",
      removingMember: "Removing member...",
      memberRemoved: "Member removed",
      removeMemberError: "Member remove error",
      loadingCrmClient: "Loading CRM client...",
      crmClientSelected: "CRM client selected",
      crmClientLoadError: "CRM client loading error",
      crmClientNameRequired: "CRM client name is required",
      creatingCrmClient: "Creating CRM client...",
      crmClientCreated: "CRM client created",
      crmClientCreateError: "CRM client creation error",
      updatingCrmClientStatus: "Updating client status...",
      crmClientStatusUpdated: "CRM client status updated",
      crmClientUpdateError: "CRM client update error",
      noteBodyRequired: "Note text is required",
      addingNote: "Adding note...",
      noteAdded: "CRM note added",
      noteAddError: "Note add error",
      shortlistRequired: "Shortlist title and at least one listing ID are required",
      buildingShortlist: "Building CRM shortlist...",
      shortlistCreated: "CRM shortlist created",
      shortlistCreateError: "CRM shortlist creation error",
      enablingShare: "Enabling share...",
      disablingShare: "Disabling share...",
      shareEnabled: "Share enabled",
      shareDisabled: "Share disabled",
      shareUpdateError: "Share update error",
      generatingSharePreview: "Generating share preview...",
      sharePreviewReady: "Share preview ready",
      sharePreviewError: "Share preview error",
    },
    pl: {
      loadingAccount: "Ładowanie konta...",
      loadingAccountAndLimits: "Ładowanie konta i limitów",
      accountUpdated: "Konto odświeżone",
      backendUnavailable: "Usługa jest chwilowo niedostępna",
      unknownError: "nieznany błąd",
      loadingCrmError: "Błąd ładowania CRM",
      switchingPlan: (plan) => `Przełączanie na ${plan}...`,
      planChanged: (plan) => `Plan: ${plan}`,
      loadingWorkspace: "Ładowanie narzędzi profesjonalnych...",
      workspaceSelected: "Narzędzia profesjonalne wybrane",
      loadingWorkspaceError: "Błąd ładowania narzędzi profesjonalnych",
      agencyNameRequired: "Nazwa agencji jest wymagana",
      creatingAgency: "Tworzenie profilu agencji...",
      agencyCreated: "Profil agencji utworzony",
      agencyCreateError: "Błąd tworzenia profilu agencji",
      memberUserIdRequired: "Identyfikator członka jest wymagany",
      addingMember: "Dodawanie członka...",
      memberAdded: "Członek dodany",
      addMemberError: "Błąd dodawania członka",
      updatingRole: "Aktualizacja roli...",
      roleUpdated: "Rola zaktualizowana",
      roleUpdateError: "Błąd aktualizacji roli",
      updatingStatus: "Aktualizacja statusu...",
      statusUpdated: "Status zaktualizowany",
      statusUpdateError: "Błąd aktualizacji statusu",
      removingMember: "Usuwanie członka...",
      memberRemoved: "Członek usunięty",
      removeMemberError: "Błąd usuwania członka",
      loadingCrmClient: "Ładowanie klienta CRM...",
      crmClientSelected: "Klient CRM wybrany",
      crmClientLoadError: "Błąd ładowania klienta CRM",
      crmClientNameRequired: "Imię klienta CRM jest wymagane",
      creatingCrmClient: "Tworzenie klienta CRM...",
      crmClientCreated: "Klient CRM utworzony",
      crmClientCreateError: "Błąd tworzenia klienta CRM",
      updatingCrmClientStatus: "Aktualizacja statusu klienta...",
      crmClientStatusUpdated: "Status klienta CRM zaktualizowany",
      crmClientUpdateError: "Błąd aktualizacji klienta CRM",
      noteBodyRequired: "Treść notatki jest wymagana",
      addingNote: "Dodawanie notatki...",
      noteAdded: "Notatka CRM dodana",
      noteAddError: "Błąd dodawania notatki",
      shortlistRequired: "Tytuł podsumowania i co najmniej jedno mieszkanie są wymagane",
      buildingShortlist: "Przygotowujemy podsumowanie dla klienta...",
      shortlistCreated: "Podsumowanie dla klienta utworzone",
      shortlistCreateError: "Błąd tworzenia podsumowania dla klienta",
      enablingShare: "Włączanie udostępniania...",
      disablingShare: "Wyłączanie udostępniania...",
      shareEnabled: "Udostępnianie włączone",
      shareDisabled: "Udostępnianie wyłączone",
      shareUpdateError: "Błąd aktualizacji udostępniania",
      generatingSharePreview: "Generowanie podglądu dla klienta...",
      sharePreviewReady: "Podgląd dla klienta gotowy",
      sharePreviewError: "Błąd podglądu dla klienta",
    },
    ru: {
      loadingAccount: "Загрузка аккаунта...",
      loadingAccountAndLimits: "Загрузка аккаунта и лимитов",
      accountUpdated: "Аккаунт обновлен",
      backendUnavailable: "Сервис временно недоступен",
      unknownError: "Неизвестная ошибка",
      loadingCrmError: "Ошибка загрузки CRM",
      switchingPlan: (plan) => `Переключение на ${plan}...`,
      planChanged: (plan) => `Тариф: ${plan}`,
      loadingWorkspace: "Загрузка профессиональных инструментов...",
      workspaceSelected: "Профессиональные инструменты выбраны",
      loadingWorkspaceError: "Ошибка загрузки профессиональных инструментов",
      agencyNameRequired: "Название агентства обязательно",
      creatingAgency: "Создание профиля агентства...",
      agencyCreated: "Профиль агентства создан",
      agencyCreateError: "Ошибка создания профиля агентства",
      memberUserIdRequired: "Идентификатор участника обязателен",
      addingMember: "Добавление участника...",
      memberAdded: "Участник добавлен",
      addMemberError: "Ошибка добавления участника",
      updatingRole: "Обновление роли...",
      roleUpdated: "Роль обновлена",
      roleUpdateError: "Ошибка обновления роли",
      updatingStatus: "Обновление статуса...",
      statusUpdated: "Статус обновлен",
      statusUpdateError: "Ошибка обновления статуса",
      removingMember: "Удаление участника...",
      memberRemoved: "Участник удален",
      removeMemberError: "Ошибка удаления участника",
      loadingCrmClient: "Загрузка CRM клиента...",
      crmClientSelected: "CRM клиент выбран",
      crmClientLoadError: "Ошибка загрузки CRM клиента",
      crmClientNameRequired: "Имя CRM клиента обязательно",
      creatingCrmClient: "Создание CRM клиента...",
      crmClientCreated: "CRM клиент создан",
      crmClientCreateError: "Ошибка создания CRM клиента",
      updatingCrmClientStatus: "Обновление статуса клиента...",
      crmClientStatusUpdated: "Статус CRM клиента обновлен",
      crmClientUpdateError: "Ошибка обновления CRM клиента",
      noteBodyRequired: "Текст заметки обязателен",
      addingNote: "Добавление заметки...",
      noteAdded: "CRM заметка добавлена",
      noteAddError: "Ошибка добавления заметки",
      shortlistRequired: "Название подборки и хотя бы одна квартира обязательны",
      buildingShortlist: "Готовим клиентскую подборку...",
      shortlistCreated: "Клиентская подборка создана",
      shortlistCreateError: "Ошибка создания клиентской подборки",
      enablingShare: "Включение шаринга...",
      disablingShare: "Отключение шаринга...",
      shareEnabled: "Шаринг включен",
      shareDisabled: "Шаринг отключен",
      shareUpdateError: "Ошибка обновления шаринга",
      generatingSharePreview: "Готовим предпросмотр для клиента...",
      sharePreviewReady: "Предпросмотр для клиента готов",
      sharePreviewError: "Ошибка предпросмотра для клиента",
    },
    uk: {
      loadingAccount: "Завантаження акаунта...",
      loadingAccountAndLimits: "Завантаження акаунта і лімітів",
      accountUpdated: "Акаунт оновлено",
      backendUnavailable: "Сервіс тимчасово недоступний",
      unknownError: "Невідома помилка",
      loadingCrmError: "Помилка завантаження CRM",
      switchingPlan: (plan) => `Перемикання на ${plan}...`,
      planChanged: (plan) => `Тариф: ${plan}`,
      loadingWorkspace: "Завантаження професійних інструментів...",
      workspaceSelected: "Професійні інструменти вибрано",
      loadingWorkspaceError: "Помилка завантаження професійних інструментів",
      agencyNameRequired: "Назва агентства обов'язкова",
      creatingAgency: "Створення профілю агентства...",
      agencyCreated: "Профіль агентства створено",
      agencyCreateError: "Помилка створення профілю агентства",
      memberUserIdRequired: "Ідентифікатор учасника обов'язковий",
      addingMember: "Додавання учасника...",
      memberAdded: "Учасника додано",
      addMemberError: "Помилка додавання учасника",
      updatingRole: "Оновлення ролі...",
      roleUpdated: "Роль оновлено",
      roleUpdateError: "Помилка оновлення ролі",
      updatingStatus: "Оновлення статусу...",
      statusUpdated: "Статус оновлено",
      statusUpdateError: "Помилка оновлення статусу",
      removingMember: "Видалення учасника...",
      memberRemoved: "Учасника видалено",
      removeMemberError: "Помилка видалення учасника",
      loadingCrmClient: "Завантаження CRM клієнта...",
      crmClientSelected: "CRM клієнта вибрано",
      crmClientLoadError: "Помилка завантаження CRM клієнта",
      crmClientNameRequired: "Ім'я CRM клієнта обов'язкове",
      creatingCrmClient: "Створення CRM клієнта...",
      crmClientCreated: "CRM клієнта створено",
      crmClientCreateError: "Помилка створення CRM клієнта",
      updatingCrmClientStatus: "Оновлення статусу клієнта...",
      crmClientStatusUpdated: "Статус CRM клієнта оновлено",
      crmClientUpdateError: "Помилка оновлення CRM клієнта",
      noteBodyRequired: "Текст нотатки обов'язковий",
      addingNote: "Додавання нотатки...",
      noteAdded: "CRM нотатку додано",
      noteAddError: "Помилка додавання нотатки",
      shortlistRequired: "Назва добірки і хоча б одна квартира обов'язкові",
      buildingShortlist: "Готуємо клієнтську добірку...",
      shortlistCreated: "Клієнтську добірку створено",
      shortlistCreateError: "Помилка створення клієнтської добірки",
      enablingShare: "Увімкнення шарингу...",
      disablingShare: "Вимкнення шарингу...",
      shareEnabled: "Шаринг увімкнено",
      shareDisabled: "Шаринг вимкнено",
      shareUpdateError: "Помилка оновлення шарингу",
      generatingSharePreview: "Готуємо попередній перегляд для клієнта...",
      sharePreviewReady: "Попередній перегляд для клієнта готовий",
      sharePreviewError: "Помилка попереднього перегляду для клієнта",
    },
  };
  return statuses[locale];
}

function alertOptions(locale: Locale): AlertsPageCopy["options"] {
  const sharedLabels = optionLabels(locale);
  const channel: Record<Locale, OptionLabelMap> = {
    en: { email: "email", telegram: "telegram" },
    pl: { email: "email", telegram: "telegram" },
    ru: { email: "email", telegram: "telegram" },
    uk: { email: "email", telegram: "telegram" },
  };
  const frequency: Record<Locale, OptionLabelMap> = {
    en: { instant: "Instant", daily: "Daily", weekly: "Weekly" },
    pl: { instant: "Od razu", daily: "Codziennie", weekly: "Co tydzień" },
    ru: { instant: "Сразу", daily: "Ежедневно", weekly: "Еженедельно" },
    uk: { instant: "Одразу", daily: "Щодня", weekly: "Щотижня" },
  };
  const any: Record<Locale, { any: string; anyFeminine: string }> = {
    en: { any: "Any", anyFeminine: "Any" },
    pl: { any: "Dowolny", anyFeminine: "Dowolna" },
    ru: { any: "Любой", anyFeminine: "Любое" },
    uk: { any: "Будь-який", anyFeminine: "Будь-яке" },
  };

  return {
    any: any[locale].any,
    anyFeminine: any[locale].anyFeminine,
    buildingType: sharedLabels.buildingType,
    renovationState: sharedLabels.renovationState,
    parkingType: sharedLabels.parkingType,
    heatingType: sharedLabels.heatingType,
    channel: channel[locale],
    frequency: frequency[locale],
  };
}

function alertFilterLabels(locale: Locale): OptionLabelMap {
  const labels: Record<Locale, OptionLabelMap> = {
    en: {
      voivodeship: "Voivodeship",
      city: "City",
      municipality: "Gmina",
      district: "District",
      query: "Search",
      building_type: "Building type",
      renovation_state: "Condition",
      has_balcony: "Balcony",
      has_terrace: "Terrace",
      has_garden: "Garden",
      has_elevator: "Elevator",
      parking_type: "Parking",
      heating_type: "Heating",
      rooms: "Rooms",
      max_price: "Max price",
      min_area_m2: "Min area",
      min_floor: "Floor from",
      max_floor: "Floor to",
      max_building_floors: "Building floors to",
      min_building_year: "Building year from",
      max_building_year: "Building year to",
      min_investment_score: "Investment potential from",
      max_risk_score: "Risk up to",
      max_price_delta_to_fair_mid_pct: "Maximum above fair range",
      min_negotiation_score: "Negotiation potential from",
      min_liquidity_score: "Liquidity from",
      min_rental_potential_score: "Rental potential from",
      min_price_reductions: "Price drops from",
      max_days_on_market: "Days on market to",
    },
    pl: {
      voivodeship: "Województwo",
      city: "Miasto",
      municipality: "Gmina",
      district: "Dzielnica",
      query: "Wyszukiwanie",
      building_type: "Typ budynku",
      renovation_state: "Stan",
      has_balcony: "Balkon",
      has_terrace: "Taras",
      has_garden: "Ogród",
      has_elevator: "Winda",
      parking_type: "Parking",
      heating_type: "Ogrzewanie",
      rooms: "Pokoje",
      max_price: "Maks. cena",
      min_area_m2: "Min. powierzchnia",
      min_floor: "Piętro od",
      max_floor: "Piętro do",
      max_building_floors: "Pięter w budynku do",
      min_building_year: "Rok budynku od",
      max_building_year: "Rok budynku do",
      min_investment_score: "Potencjał inwestycyjny od",
      max_risk_score: "Ryzyko do",
      max_price_delta_to_fair_mid_pct: "Maksymalnie ponad ceną rynkową",
      min_negotiation_score: "Potencjał negocjacji od",
      min_liquidity_score: "Płynność od",
      min_rental_potential_score: "Potencjał najmu od",
      min_price_reductions: "Obniżek ceny od",
      max_days_on_market: "Dni na rynku do",
    },
    ru: {
      voivodeship: "Воеводство",
      city: "Город",
      municipality: "Гмина",
      district: "Район",
      query: "Поиск",
      building_type: "Тип здания",
      renovation_state: "Состояние",
      has_balcony: "Балкон",
      has_terrace: "Терраса",
      has_garden: "Сад",
      has_elevator: "Лифт",
      parking_type: "Паркинг",
      heating_type: "Отопление",
      rooms: "Комнаты",
      max_price: "Макс. цена",
      min_area_m2: "Мин. площадь",
      min_floor: "Этаж от",
      max_floor: "Этаж до",
      max_building_floors: "Этажность до",
      min_building_year: "Год дома от",
      max_building_year: "Год дома до",
      min_investment_score: "Инвестиционный потенциал от",
      max_risk_score: "Риск до",
      max_price_delta_to_fair_mid_pct: "Максимум выше рыночного диапазона",
      min_negotiation_score: "Потенциал торга от",
      min_liquidity_score: "Ликвидность от",
      min_rental_potential_score: "Потенциал аренды от",
      min_price_reductions: "Снижений цены от",
      max_days_on_market: "Дней на рынке до",
    },
    uk: {
      voivodeship: "Воєводство",
      city: "Місто",
      municipality: "Гміна",
      district: "Район",
      query: "Пошук",
      building_type: "Тип будівлі",
      renovation_state: "Стан",
      has_balcony: "Балкон",
      has_terrace: "Тераса",
      has_garden: "Сад",
      has_elevator: "Ліфт",
      parking_type: "Паркінг",
      heating_type: "Опалення",
      rooms: "Кімнати",
      max_price: "Макс. ціна",
      min_area_m2: "Мін. площа",
      min_floor: "Поверх від",
      max_floor: "Поверх до",
      max_building_floors: "Поверховість до",
      min_building_year: "Рік будинку від",
      max_building_year: "Рік будинку до",
      min_investment_score: "Інвестиційний потенціал від",
      max_risk_score: "Ризик до",
      max_price_delta_to_fair_mid_pct: "Максимум вище ринкового діапазону",
      min_negotiation_score: "Потенціал торгу від",
      min_liquidity_score: "Ліквідність від",
      min_rental_potential_score: "Потенціал оренди від",
      min_price_reductions: "Знижень ціни від",
      max_days_on_market: "Днів на ринку до",
    },
  };
  return labels[locale];
}

function optionLabels(locale: Locale): ExplorerCopy["optionLabels"] {
  const cardCopy = LISTING_CARD_COPY[locale];
  const sort: Record<Locale, OptionLabelMap> = {
    en: {
      investment_score_desc: "Best overall",
      price_asc: "Price: low to high",
      price_desc: "Price: high to low",
      price_per_m2_asc: "Price/m2: low to high",
      risk_score_asc: "Lowest risk",
      negotiation_score_desc: "Best negotiation opportunities",
      liquidity_score_desc: "Most liquid",
      rental_potential_score_desc: "Best for rent",
      developer_reputation_score_desc: "Seller history: strongest first",
      developer_reputation_score_asc: "Seller history: weakest first",
      developer_confidence_score_desc: "Seller data: most complete first",
      developer_confidence_score_asc: "Seller data: least complete first",
      days_on_market_desc: "Longest on market",
      newest: "Newest",
    },
    pl: {
      investment_score_desc: "Najlepsze ogólnie",
      price_asc: "Cena: najniżej",
      price_desc: "Cena: najwyżej",
      price_per_m2_asc: "Cena/m2: najniżej",
      risk_score_asc: "Najniższe ryzyko",
      negotiation_score_desc: "Najlepsze okazje do negocjacji",
      liquidity_score_desc: "Najbardziej płynne",
      rental_potential_score_desc: "Najlepsze pod wynajem",
      developer_reputation_score_desc: "Historia sprzedającego: najlepsza",
      developer_reputation_score_asc: "Historia sprzedającego: najsłabsza",
      developer_confidence_score_desc: "Dane sprzedającego: najpełniejsze",
      developer_confidence_score_asc: "Dane sprzedającego: najmniej pełne",
      days_on_market_desc: "Najdłużej na rynku",
      newest: "Najnowsze",
    },
    ru: {
      investment_score_desc: "Лучшие в целом",
      price_asc: "Цена: ниже",
      price_desc: "Цена: выше",
      price_per_m2_asc: "Цена/m2: ниже",
      risk_score_asc: "Самый низкий риск",
      negotiation_score_desc: "Лучшие возможности для торга",
      liquidity_score_desc: "Самые ликвидные",
      rental_potential_score_desc: "Лучшие под аренду",
      developer_reputation_score_desc: "История продавца: лучше сначала",
      developer_reputation_score_asc: "История продавца: слабее сначала",
      developer_confidence_score_desc: "Данные продавца: полнее сначала",
      developer_confidence_score_asc: "Данные продавца: менее полные сначала",
      days_on_market_desc: "Дольше на рынке",
      newest: "Новые",
    },
    uk: {
      investment_score_desc: "Найкращі загалом",
      price_asc: "Ціна: нижче",
      price_desc: "Ціна: вище",
      price_per_m2_asc: "Ціна/m2: нижче",
      risk_score_asc: "Найнижчий ризик",
      negotiation_score_desc: "Найкращі можливості для торгу",
      liquidity_score_desc: "Найліквідніші",
      rental_potential_score_desc: "Найкращі під оренду",
      developer_reputation_score_desc: "Історія продавця: краща спочатку",
      developer_reputation_score_asc: "Історія продавця: слабша спочатку",
      developer_confidence_score_desc: "Дані продавця: повніші спочатку",
      developer_confidence_score_asc: "Дані продавця: менш повні спочатку",
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

function pluralPl(count: number, one: string, few: string, many: string) {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (abs === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function pluralUk(count: number, one: string, few: string, many: string) {
  return pluralRu(count, one, few, many);
}
