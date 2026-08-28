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
    mockPayGenerate: string;
    open: string;
    events: string;
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
    mockCheckout: string;
  };
  fields: {
    listingId: string;
    areaId: string;
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
    areaId: string;
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
    areaIds: (ids: string) => string;
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
      renovationCondition: "Renovation condition",
      renovationBudget: "Custom renovation budget",
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
      renovationCondition: "Состояние ремонта",
      renovationBudget: "Свой бюджет ремонта",
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
      renovationConditionUnknown: "не знаю",
      renovationConditions: {
        move_in_ready: "Можно въезжать",
        refresh: "Освежить",
        light_renovation: "Легкий ремонт",
        full_renovation: "Полный ремонт",
        shell_developer_standard: "Developer standard",
        custom_budget: "Свой бюджет",
      },
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
      renovationCondition: "Стан ремонту",
      renovationBudget: "Свій бюджет ремонту",
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
      renovationConditionUnknown: "не знаю",
      renovationConditions: {
        move_in_ready: "Можна заїжджати",
        refresh: "Освіжити",
        light_renovation: "Легкий ремонт",
        full_renovation: "Повний ремонт",
        shell_developer_standard: "Developer standard",
        custom_budget: "Свій бюджет",
      },
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

export const REPORTS_PAGE_COPY: Record<Locale, ReportsPageCopy> = {
  en: {
    title: "Reports",
    subtitle: "Saved HTML/JSON reports for buyers, realtors and investors.",
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
      listingId: "Listing ID",
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
      disclaimer: "Nota prawna",
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
      backendUnavailable: "Backend API unavailable",
      generating: "Generating report...",
      reportSaved: (reportId) => `Report saved: ${reportId}`,
    },
    values: {
      exportUnavailable: "Export is available on Realtor/Agency plans",
      whiteLabelHint: "Logo, colors and custom footer require Realtor/Agency.",
      items: (count) => `${count} item${count === 1 ? "" : "s"}`,
      noInsight: "No saved summary",
      unknownError: "unknown error",
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
    subtitle: "Zapisane raporty HTML/JSON dla kupującego, pośrednika i inwestora.",
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
      listingId: "Listing ID",
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
      disclaimer: "Disclaimer",
      whiteLabel: "White-label",
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
      backendUnavailable: "Backend API niedostępne",
      generating: "Generowanie raportu...",
      reportSaved: (reportId) => `Raport zapisany: ${reportId}`,
    },
    values: {
      exportUnavailable: "Eksport jest dostępny w planach Realtor/Agency",
      whiteLabelHint: "Logo, kolory i własna stopka wymagają planu Realtor/Agency.",
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
    subtitle: "Сохраненные HTML/JSON отчеты по объектам для покупателя, риелтора и инвестора.",
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
      listingId: "Listing ID",
      audience: "Аудитория",
      agency: "Агентство",
      agent: "Агент",
      email: "Email",
      phone: "Телефон",
      website: "Сайт",
      note: "Заметка",
      logoUrl: "URL логотипа",
      primaryColor: "Основной цвет",
      accentColor: "Акцент",
      footer: "Футер",
      disclaimer: "Дисклеймер",
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
      backendUnavailable: "Backend API недоступен",
      generating: "Генерация отчета...",
      reportSaved: (reportId) => `Отчет сохранен: ${reportId}`,
    },
    values: {
      exportUnavailable: "Экспорт доступен на тарифах Realtor/Agency",
      whiteLabelHint: "Логотип, цвета и кастомный футер доступны на Realtor/Agency.",
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
    subtitle: "Збережені HTML/JSON звіти за об'єктами для покупця, ріелтора й інвестора.",
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
      listingId: "Listing ID",
      audience: "Аудиторія",
      agency: "Агентство",
      agent: "Агент",
      email: "Email",
      phone: "Телефон",
      website: "Сайт",
      note: "Нотатка",
      logoUrl: "URL логотипа",
      primaryColor: "Основний колір",
      accentColor: "Акцент",
      footer: "Футер",
      disclaimer: "Дисклеймер",
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
      backendUnavailable: "Backend API недоступний",
      generating: "Генерація звіту...",
      reportSaved: (reportId) => `Звіт збережено: ${reportId}`,
    },
    values: {
      exportUnavailable: "Експорт доступний на планах Realtor/Agency",
      whiteLabelHint: "Логотип, кольори й кастомний футер доступні на Realtor/Agency.",
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
      mockPayGenerate: "Mock pay + generate",
      open: "Open",
      events: "Events",
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
      auditTrail: "Audit trail",
    },
    hints: {
      mockCheckout: "paid beta checkout shell; replace mock provider before live payments",
    },
    fields: {
      listingId: "Listing ID",
      areaId: "Area ID",
      b2bInvoice: "B2B invoice",
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
      audit: "Audit",
    },
    statuses: {
      loading: "Loading pricing...",
      ready: "Ready",
      backendUnavailable: "Backend API unavailable",
      creatingOrder: (title) => `Creating order: ${title}...`,
      checkout: (provider, reference) => `Checkout ${provider}: ${reference}`,
      paid: (orderId) => `Paid: ${orderId}`,
      reportReady: (reportId) => `Report ready: ${reportId ?? "-"}`,
      auditEvents: (orderId) => `Audit events: ${orderId}`,
    },
    values: {
      unknownError: "unknown error",
      noValue: "-",
      eventFallback: "event",
      orders: (count) => `${count} order${count === 1 ? "" : "s"}`,
      events: (count) => `${count} event${count === 1 ? "" : "s"}`,
      auditEmpty: "Select an order to see checkout, payment and generation history.",
      whiteLabel: "white-label",
      standard: "standard",
      planSummary: (monthlyReports, maxAlerts, branding) =>
        `${monthlyReports} reports/month, ${maxAlerts} alerts, ${branding}`,
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
      mockPayGenerate: "Mock pay + generuj",
      open: "Otwórz",
      events: "Zdarzenia",
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
      auditTrail: "Audyt",
    },
    hints: {
      mockCheckout: "paid beta checkout shell; przed live payments podłącz realny PSP",
    },
    fields: {
      listingId: "Listing ID",
      areaId: "Area ID",
      b2bInvoice: "Faktura B2B",
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
      audit: "Audyt",
    },
    statuses: {
      loading: "Ładowanie cennika...",
      ready: "Gotowe",
      backendUnavailable: "Backend API niedostępne",
      creatingOrder: (title) => `Tworzenie zamówienia: ${title}...`,
      checkout: (provider, reference) => `Checkout ${provider}: ${reference}`,
      paid: (orderId) => `Opłacono: ${orderId}`,
      reportReady: (reportId) => `Raport gotowy: ${reportId ?? "-"}`,
      auditEvents: (orderId) => `Zdarzenia audytu: ${orderId}`,
    },
    values: {
      unknownError: "nieznany błąd",
      noValue: "-",
      eventFallback: "zdarzenie",
      orders: (count) => `${count} ${pluralPl(count, "zamówienie", "zamówienia", "zamówień")}`,
      events: (count) => `${count} ${pluralPl(count, "zdarzenie", "zdarzenia", "zdarzeń")}`,
      auditEmpty: "Wybierz zamówienie, aby zobaczyć historię checkout, płatności i generowania.",
      whiteLabel: "white-label",
      standard: "standard",
      planSummary: (monthlyReports, maxAlerts, branding) =>
        `${monthlyReports} raportów/mies., ${maxAlerts} alerts, ${branding}`,
    },
    empty: {
      loading: "Ładowanie cennika",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "Buyer reports и цены",
    subtitle: "Отчет перед покупкой: не переплатить, не купить проблему и подготовиться к торгу.",
    actions: {
      refresh: "Обновить",
      mockPayGenerate: "Mock pay + generate",
      open: "Открыть",
      events: "События",
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
      auditTrail: "Аудит",
    },
    hints: {
      mockCheckout: "paid beta checkout shell; перед live payments нужен реальный PSP",
    },
    fields: {
      listingId: "Listing ID",
      areaId: "Area ID",
      b2bInvoice: "B2B-счет",
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
      audit: "Аудит",
    },
    statuses: {
      loading: "Загрузка тарифов...",
      ready: "Готово",
      backendUnavailable: "Backend API недоступен",
      creatingOrder: (title) => `Создание заказа: ${title}...`,
      checkout: (provider, reference) => `Checkout ${provider}: ${reference}`,
      paid: (orderId) => `Оплачено: ${orderId}`,
      reportReady: (reportId) => `Отчет готов: ${reportId ?? "-"}`,
      auditEvents: (orderId) => `События аудита: ${orderId}`,
    },
    values: {
      unknownError: "неизвестная ошибка",
      noValue: "-",
      eventFallback: "событие",
      orders: (count) => `${count} ${pluralRu(count, "заказ", "заказа", "заказов")}`,
      events: (count) => `${count} ${pluralRu(count, "событие", "события", "событий")}`,
      auditEmpty: "Выберите заказ, чтобы увидеть историю checkout, оплаты и генерации.",
      whiteLabel: "white-label",
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
    title: "Buyer reports і ціни",
    subtitle: "Звіт перед купівлею: не переплатити, не купити проблему й підготуватися до торгу.",
    actions: {
      refresh: "Оновити",
      mockPayGenerate: "Mock pay + generate",
      open: "Відкрити",
      events: "Події",
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
      auditTrail: "Аудит",
    },
    hints: {
      mockCheckout: "paid beta checkout shell; перед live payments потрібен реальний PSP",
    },
    fields: {
      listingId: "Listing ID",
      areaId: "Area ID",
      b2bInvoice: "B2B-рахунок",
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
      audit: "Аудит",
    },
    statuses: {
      loading: "Завантаження тарифів...",
      ready: "Готово",
      backendUnavailable: "Backend API недоступний",
      creatingOrder: (title) => `Створення замовлення: ${title}...`,
      checkout: (provider, reference) => `Checkout ${provider}: ${reference}`,
      paid: (orderId) => `Оплачено: ${orderId}`,
      reportReady: (reportId) => `Звіт готовий: ${reportId ?? "-"}`,
      auditEvents: (orderId) => `Події аудиту: ${orderId}`,
    },
    values: {
      unknownError: "невідома помилка",
      noValue: "-",
      eventFallback: "подія",
      orders: (count) => `${count} ${pluralUk(count, "замовлення", "замовлення", "замовлень")}`,
      events: (count) => `${count} ${pluralUk(count, "подія", "події", "подій")}`,
      auditEmpty: "Виберіть замовлення, щоб побачити історію checkout, оплати й генерації.",
      whiteLabel: "white-label",
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
    title: "Saved search alerts",
    subtitle: "Filter and scoring alerts with dry-run delivery through email or Telegram.",
    actions: {
      refresh: "Refresh",
      create: "Create",
      preview: "Preview",
      dryRun: "Dry run",
      checkSend: "Check send",
      clientDigest: "Client digest",
      delete: "Delete",
    },
    sections: {
      newAlert: "New alert",
      alerts: "Alerts",
      preview: "Preview",
      realtorDigest: "Realtor client digest",
      deliveryHistory: "Delivery history",
    },
    fields: {
      name: "Name",
      municipality: "Gmina",
      voivodeship: "Voivodeship",
      district: "District",
      search: "Search",
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
      maxBuildingFloors: "Building floors to",
      minBuildingYear: "Building year from",
      maxBuildingYear: "Building year to",
      minInvestment: "Min. Investment",
      maxFairDelta: "Max fair delta %",
      minNegotiation: "Min. Negotiation",
      minLiquidity: "Min. Liquidity",
      minRental: "Min. Rental",
      minPriceReductions: "Price drops from",
      maxDaysOnMarket: "Days on market to",
      channel: "Channel",
      frequency: "Frequency",
      deliveryTarget: "Delivery target",
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
      backendUnavailable: "Backend API unavailable",
      creating: "Creating alert...",
      created: (alertId) => `Alert created: ${alertId}`,
      previewLoaded: (count) => `Matches: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Alert updated: ${name}`,
      updateError: "Could not update alert",
      deleteConfirm: (name) => `Delete alert "${name}"?`,
      deleted: (name) => `Alert deleted: ${name}`,
      deleteError: "Could not delete alert",
      saving: "Saving preferences...",
      digestReady: (items, total) => `Client digest: ${items}/${total} matches`,
      digestError: "Could not build client digest",
    },
    values: {
      unknownError: "unknown error",
      unknownAlertUpdateError: "unknown alert update error",
      unknownAlertDeleteError: "unknown alert delete error",
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
        investment: "I",
        risk: "R",
        fairDelta: "Fair delta",
        negotiation: "N",
        liquidity: "L",
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
    title: "Alerty zapisanych wyszukiwań",
    subtitle: "Alerty filtrów i scoringu z dry-run oraz dostawą przez email lub Telegram.",
    actions: {
      refresh: "Odśwież",
      create: "Utwórz",
      preview: "Podgląd",
      dryRun: "Dry run",
      checkSend: "Wyślij test",
      clientDigest: "Digest klienta",
      delete: "Usuń",
    },
    sections: {
      newAlert: "Nowy alert",
      alerts: "Alerty",
      preview: "Podgląd",
      realtorDigest: "Digest dla klienta pośrednika",
      deliveryHistory: "Historia dostaw",
    },
    fields: {
      name: "Nazwa",
      municipality: "Gmina",
      voivodeship: "Województwo",
      district: "Dzielnica",
      search: "Wyszukiwanie",
      maxPrice: "Maks. cena",
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
      minInvestment: "Min. Investment",
      maxFairDelta: "Maks. fair delta %",
      minNegotiation: "Min. Negotiation",
      minLiquidity: "Min. Liquidity",
      minRental: "Min. Rental",
      minPriceReductions: "Obniżek ceny od",
      maxDaysOnMarket: "Dni na rynku do",
      channel: "Kanał",
      frequency: "Częstotliwość",
      deliveryTarget: "Cel dostawy",
      active: "Aktywny",
      client: "Klient",
      intro: "Intro",
      maxMatches: "Obiekty",
      includeSourceLinks: "Dodaj linki źródłowe",
    },
    placeholders: {
      municipality: "Wrocław / Kobierzyce",
      voivodeship: "dolnoslaskie",
      search: "adres, dzielnica, ulica",
      telegramTarget: "Telegram chat id",
      emailTarget: "email opcjonalny",
      clientName: "Anna",
      digestIntro: "Krótki kontekst dla klienta",
    },
    options: alertOptions("pl"),
    statuses: {
      loading: "Ładowanie alertów...",
      loaded: (count) => `Alertów: ${count}`,
      backendUnavailable: "Backend API niedostępne",
      creating: "Tworzenie alertu...",
      created: (alertId) => `Alert utworzony: ${alertId}`,
      previewLoaded: (count) => `Dopasowań: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Alert zaktualizowany: ${name}`,
      updateError: "Nie udało się zaktualizować alertu",
      deleteConfirm: (name) => `Usunąć alert "${name}"?`,
      deleted: (name) => `Alert usunięty: ${name}`,
      deleteError: "Nie udało się usunąć alertu",
      saving: "Zapisywanie ustawień...",
      digestReady: (items, total) => `Digest klienta: ${items}/${total} dopasowań`,
      digestError: "Nie udało się zbudować digestu klienta",
    },
    values: {
      unknownError: "nieznany błąd",
      unknownAlertUpdateError: "nieznany błąd aktualizacji alertu",
      unknownAlertDeleteError: "nieznany błąd usuwania alertu",
      unknownDigestError: "nieznany błąd digestu",
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
        investment: "I",
        risk: "R",
        fairDelta: "Fair delta",
        negotiation: "N",
        liquidity: "L",
        rental: "Najem",
      },
      filterLabels: alertFilterLabels("pl"),
    },
    empty: {
      loading: "Ładowanie alertów",
      noAlerts: "Nie ma jeszcze alertów.",
      previewPrompt: "Wybierz alert, aby zobaczyć pasujące obiekty.",
      digestPrompt: "Uzupełnij parametry i kliknij Digest klienta przy odpowiednim alercie.",
      noDeliveryJobs: "Delivery jobs nie były jeszcze uruchamiane.",
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
    title: "Уведомления поиска",
    subtitle: "Уведомления по фильтрам и скорингу с dry-run и доставкой через email или Telegram.",
    actions: {
      refresh: "Обновить",
      create: "Создать",
      preview: "Preview",
      dryRun: "Dry run",
      checkSend: "Проверить отправку",
      clientDigest: "Дайджест клиенту",
      delete: "Удалить",
    },
    sections: {
      newAlert: "Новый alert",
      alerts: "Alerts",
      preview: "Preview",
      realtorDigest: "Клиентский дайджест риелтора",
      deliveryHistory: "История доставок",
    },
    fields: {
      name: "Название",
      municipality: "Gmina",
      voivodeship: "Województwo",
      district: "Район",
      search: "Поиск",
      maxPrice: "Макс. цена",
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
      minInvestment: "Мин. Investment",
      maxFairDelta: "Макс. fair delta %",
      minNegotiation: "Мин. Negotiation",
      minLiquidity: "Мин. Liquidity",
      minRental: "Мин. Rental",
      minPriceReductions: "Снижений цены от",
      maxDaysOnMarket: "Дней на рынке до",
      channel: "Канал",
      frequency: "Частота",
      deliveryTarget: "Адрес доставки",
      active: "Активность",
      client: "Клиент",
      intro: "Вступление",
      maxMatches: "Объектов",
      includeSourceLinks: "Добавить source links",
    },
    placeholders: {
      municipality: "Wrocław / Kobierzyce",
      voivodeship: "dolnoslaskie",
      search: "адрес, район, улица",
      telegramTarget: "Telegram chat id",
      emailTarget: "email optional",
      clientName: "Anna",
      digestIntro: "Короткий контекст для клиента",
    },
    options: alertOptions("ru"),
    statuses: {
      loading: "Загрузка alerts...",
      loaded: (count) => `Alerts: ${count}`,
      backendUnavailable: "Backend API недоступен",
      creating: "Создание alert...",
      created: (alertId) => `Alert создан: ${alertId}`,
      previewLoaded: (count) => `Совпадений: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Alert обновлен: ${name}`,
      updateError: "Не удалось обновить alert",
      deleteConfirm: (name) => `Удалить alert "${name}"?`,
      deleted: (name) => `Alert удален: ${name}`,
      deleteError: "Не удалось удалить alert",
      saving: "Сохранение настроек...",
      digestReady: (items, total) => `Client digest: ${items}/${total} matches`,
      digestError: "Не удалось собрать client digest",
    },
    values: {
      unknownError: "неизвестная ошибка",
      unknownAlertUpdateError: "неизвестная ошибка обновления alert",
      unknownAlertDeleteError: "неизвестная ошибка удаления alert",
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
        investment: "I",
        risk: "R",
        fairDelta: "Fair delta",
        negotiation: "N",
        liquidity: "L",
        rental: "Rent",
      },
      filterLabels: alertFilterLabels("ru"),
    },
    empty: {
      loading: "Загрузка alerts",
      noAlerts: "Пока нет alerts.",
      previewPrompt: "Выберите alert, чтобы увидеть подходящие объекты.",
      digestPrompt: "Заполните параметры и нажмите Дайджест клиенту у нужного alert.",
      noDeliveryJobs: "Delivery jobs еще не запускались.",
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
    title: "Сповіщення пошуку",
    subtitle: "Сповіщення за фільтрами й скорингом з dry-run і доставкою через email або Telegram.",
    actions: {
      refresh: "Оновити",
      create: "Створити",
      preview: "Preview",
      dryRun: "Dry run",
      checkSend: "Перевірити відправку",
      clientDigest: "Дайджест клієнту",
      delete: "Видалити",
    },
    sections: {
      newAlert: "Новий alert",
      alerts: "Alerts",
      preview: "Preview",
      realtorDigest: "Клієнтський дайджест ріелтора",
      deliveryHistory: "Історія доставок",
    },
    fields: {
      name: "Назва",
      municipality: "Gmina",
      voivodeship: "Województwo",
      district: "Район",
      search: "Пошук",
      maxPrice: "Макс. ціна",
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
      minInvestment: "Мін. Investment",
      maxFairDelta: "Макс. fair delta %",
      minNegotiation: "Мін. Negotiation",
      minLiquidity: "Мін. Liquidity",
      minRental: "Мін. Rental",
      minPriceReductions: "Знижень ціни від",
      maxDaysOnMarket: "Днів на ринку до",
      channel: "Канал",
      frequency: "Частота",
      deliveryTarget: "Адреса доставки",
      active: "Активність",
      client: "Клієнт",
      intro: "Вступ",
      maxMatches: "Об'єктів",
      includeSourceLinks: "Додати source links",
    },
    placeholders: {
      municipality: "Wrocław / Kobierzyce",
      voivodeship: "dolnoslaskie",
      search: "адреса, район, вулиця",
      telegramTarget: "Telegram chat id",
      emailTarget: "email optional",
      clientName: "Anna",
      digestIntro: "Короткий контекст для клієнта",
    },
    options: alertOptions("uk"),
    statuses: {
      loading: "Завантаження alerts...",
      loaded: (count) => `Alerts: ${count}`,
      backendUnavailable: "Backend API недоступний",
      creating: "Створення alert...",
      created: (alertId) => `Alert створено: ${alertId}`,
      previewLoaded: (count) => `Збігів: ${count}`,
      deliveryPrepared: (status, message) => `${status}: ${message}`,
      updated: (name) => `Alert оновлено: ${name}`,
      updateError: "Не вдалося оновити alert",
      deleteConfirm: (name) => `Видалити alert "${name}"?`,
      deleted: (name) => `Alert видалено: ${name}`,
      deleteError: "Не вдалося видалити alert",
      saving: "Збереження налаштувань...",
      digestReady: (items, total) => `Client digest: ${items}/${total} matches`,
      digestError: "Не вдалося зібрати client digest",
    },
    values: {
      unknownError: "невідома помилка",
      unknownAlertUpdateError: "невідома помилка оновлення alert",
      unknownAlertDeleteError: "невідома помилка видалення alert",
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
        investment: "I",
        risk: "R",
        fairDelta: "Fair delta",
        negotiation: "N",
        liquidity: "L",
        rental: "Rent",
      },
      filterLabels: alertFilterLabels("uk"),
    },
    empty: {
      loading: "Завантаження alerts",
      noAlerts: "Поки немає alerts.",
      previewPrompt: "Виберіть alert, щоб побачити відповідні об'єкти.",
      digestPrompt: "Заповніть параметри й натисніть Дайджест клієнту у потрібного alert.",
      noDeliveryJobs: "Delivery jobs ще не запускалися.",
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
    subtitle: "Current user, plan limits and usage for MVP monetization.",
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
      usage: "Usage",
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
      listingIds: "Listing IDs",
      reportIds: "Report IDs",
      clientMessage: "Client message",
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
    subtitle: "Aktualny użytkownik, limity planu i usage dla monetyzacji MVP.",
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
      usage: "Usage",
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
      listingIds: "Listing IDs",
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
    subtitle: "Текущий пользователь, тарифные лимиты и usage для MVP-монетизации.",
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
      usage: "Usage",
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
      listingIds: "Listing IDs",
      reportIds: "Report IDs",
      clientMessage: "Client message",
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
    subtitle: "Поточний користувач, тарифні ліміти й usage для MVP-монетизації.",
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
      usage: "Usage",
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
      listingIds: "Listing IDs",
      reportIds: "Report IDs",
      clientMessage: "Client message",
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
      aiSummary: "AI area impact summary",
      positiveSignals: "Positive signals",
      riskSignals: "Risk signals",
      sources: "Sources",
      buyerNotes: "Buyer notes",
      investorNotes: "Investor notes",
      guardrails: "Guardrails",
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
      backendUnavailable: "Backend API unavailable",
      aiNotCreated: "AI area summary not created",
      aiReady: "AI area summary ready to generate",
      aiBuilding: "Building AI area summary...",
      aiSaved: (id) => `AI area summary saved: ${id}`,
      aiUnavailable: "AI area summary unavailable",
      unknownComparisonError: "unknown area comparison error",
      unknownSummaryError: "unknown area summary error",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} d`,
      rows: (count) => `${count} row${count === 1 ? "" : "s"}`,
      score: (value) => `${value}/100`,
      scope: "market metrics, buyer/investor notes, planned investments",
      sourceGrounded: "Source-grounded",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "No data.",
    },
    empty: {
      aiPrompt: "AI summary will appear after generation for the selected area.",
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
      aiSummary: "AI area impact summary",
      positiveSignals: "Pozytywne sygnały",
      riskSignals: "Sygnały ryzyka",
      sources: "Źródła",
      buyerNotes: "Notatki dla kupującego",
      investorNotes: "Notatki dla inwestora",
      guardrails: "Guardrails",
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
      backendUnavailable: "Backend API niedostępne",
      aiNotCreated: "AI area summary nie utworzone",
      aiReady: "AI area summary gotowe do generacji",
      aiBuilding: "Budowanie AI area summary...",
      aiSaved: (id) => `AI area summary zapisane: ${id}`,
      aiUnavailable: "AI area summary niedostępne",
      unknownComparisonError: "nieznany błąd porównania obszarów",
      unknownSummaryError: "nieznany błąd area summary",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} d`,
      rows: (count) => `${count} ${pluralPl(count, "wiersz", "wiersze", "wierszy")}`,
      score: (value) => `${value}/100`,
      scope: "metryki rynku, notatki buyer/investor, planned investments",
      sourceGrounded: "Source-grounded",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "Brak danych.",
    },
    empty: {
      aiPrompt: "AI summary pojawi się po generacji dla wybranego obszaru.",
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
      aiSummary: "AI area impact summary",
      positiveSignals: "Позитивные сигналы",
      riskSignals: "Риски",
      sources: "Sources",
      buyerNotes: "Заметки для покупателя",
      investorNotes: "Заметки для инвестора",
      guardrails: "Guardrails",
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
      backendUnavailable: "Backend API недоступен",
      aiNotCreated: "AI area summary не создан",
      aiReady: "AI area summary готов к генерации",
      aiBuilding: "AI area summary строится...",
      aiSaved: (id) => `AI area summary сохранен: ${id}`,
      aiUnavailable: "AI area summary недоступен",
      unknownComparisonError: "unknown area comparison error",
      unknownSummaryError: "unknown area summary error",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} дн.`,
      rows: (count) => `${count} ${pluralRu(count, "строка", "строки", "строк")}`,
      score: (value) => `${value}/100`,
      scope: "market metrics, buyer/investor notes, planned investments",
      sourceGrounded: "Source-grounded",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "Нет данных.",
    },
    empty: {
      aiPrompt: "AI summary появится после генерации для выбранного района.",
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
      aiSummary: "AI area impact summary",
      positiveSignals: "Позитивні сигнали",
      riskSignals: "Ризики",
      sources: "Sources",
      buyerNotes: "Нотатки для покупця",
      investorNotes: "Нотатки для інвестора",
      guardrails: "Guardrails",
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
      backendUnavailable: "Backend API недоступний",
      aiNotCreated: "AI area summary не створено",
      aiReady: "AI area summary готовий до генерації",
      aiBuilding: "AI area summary будується...",
      aiSaved: (id) => `AI area summary збережено: ${id}`,
      aiUnavailable: "AI area summary недоступний",
      unknownComparisonError: "unknown area comparison error",
      unknownSummaryError: "unknown area summary error",
    },
    values: {
      noValue: "-",
      days: (count) => `${count} дн.`,
      rows: (count) => `${count} ${pluralUk(count, "рядок", "рядки", "рядків")}`,
      score: (value) => `${value}/100`,
      scope: "market metrics, buyer/investor notes, planned investments",
      sourceGrounded: "Source-grounded",
      indexSummary: (value, growth) => `V ${value}/100 · G ${growth}/100`,
      topSignalDetails: (value, growth, price) => `V ${value}/100 · G ${growth}/100 · ${price}/m2`,
      noData: "Немає даних.",
    },
    empty: {
      aiPrompt: "AI summary з'явиться після генерації для вибраного району.",
      noAreas: "Немає районів для вибраного міста.",
    },
    errorPrefix: "Помилка",
  },
};

export const NEWS_PAGE_COPY: Record<Locale, NewsPageCopy> = {
  en: {
    title: "News intelligence",
    subtitle: "Market, mortgage, transport and MPZP news with area impact.",
    actions: {
      refresh: "Refresh",
      source: "Source",
      summary: "Summary",
    },
    sections: {
      articles: "Articles",
      articleDetail: "Article detail",
      aiSummary: "AI news summary",
      keyPoints: "Key points",
      areaImpact: "Area impact",
      sources: "Sources",
      buyerNotes: "Buyer notes",
      investorNotes: "Investor notes",
      guardrails: "Guardrails",
    },
    placeholders: {
      areaId: "area_id",
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
      backendUnavailable: "Backend API unavailable",
      aiNotCreated: "AI summary not created",
      aiReady: "AI summary ready to generate",
      aiBuilding: "Building AI summary...",
      aiSaved: (id) => `AI summary saved: ${id}`,
      aiUnavailable: "AI summary unavailable",
      unknownNewsError: "unknown news error",
      unknownDetailError: "unknown news detail error",
      unknownAiError: "unknown AI summary error",
    },
    values: {
      allAreas: "all areas",
      areaIds: (ids) => `Area ids: ${ids}`,
      sourceGrounded: "Source-grounded",
      noData: "No data.",
    },
    empty: {
      noNews: "No news for the selected filter.",
      chooseNews: "Choose a news article.",
      aiPrompt: "AI summary will appear after generation.",
    },
    errorPrefix: "Error",
  },
  pl: {
    title: "News intelligence",
    subtitle: "Aktualności rynku, kredytów, transportu i MPZP z wpływem na obszary.",
    actions: {
      refresh: "Odśwież",
      source: "Źródło",
      summary: "Summary",
    },
    sections: {
      articles: "Artykuły",
      articleDetail: "Szczegóły artykułu",
      aiSummary: "AI news summary",
      keyPoints: "Kluczowe punkty",
      areaImpact: "Wpływ na obszary",
      sources: "Źródła",
      buyerNotes: "Notatki dla kupującego",
      investorNotes: "Notatki dla inwestora",
      guardrails: "Guardrails",
    },
    placeholders: {
      areaId: "area_id",
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
      backendUnavailable: "Backend API niedostępne",
      aiNotCreated: "AI summary nie utworzone",
      aiReady: "AI summary gotowe do generacji",
      aiBuilding: "Budowanie AI summary...",
      aiSaved: (id) => `AI summary zapisane: ${id}`,
      aiUnavailable: "AI summary niedostępne",
      unknownNewsError: "nieznany błąd aktualności",
      unknownDetailError: "nieznany błąd szczegółów aktualności",
      unknownAiError: "nieznany błąd AI summary",
    },
    values: {
      allAreas: "wszystkie obszary",
      areaIds: (ids) => `Area ids: ${ids}`,
      sourceGrounded: "Source-grounded",
      noData: "Brak danych.",
    },
    empty: {
      noNews: "Brak aktualności dla wybranego filtra.",
      chooseNews: "Wybierz aktualność.",
      aiPrompt: "AI summary pojawi się po generacji.",
    },
    errorPrefix: "Błąd",
  },
  ru: {
    title: "News intelligence",
    subtitle: "Новости рынка, ипотеки, транспорта, MPZP и их влияние на районы.",
    actions: {
      refresh: "Обновить",
      source: "Источник",
      summary: "Summary",
    },
    sections: {
      articles: "Articles",
      articleDetail: "Детали новости",
      aiSummary: "AI news summary",
      keyPoints: "Главное",
      areaImpact: "Влияние на районы",
      sources: "Sources",
      buyerNotes: "Заметки для покупателя",
      investorNotes: "Заметки для инвестора",
      guardrails: "Guardrails",
    },
    placeholders: {
      areaId: "area_id",
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
      backendUnavailable: "Backend API недоступен",
      aiNotCreated: "AI summary не создан",
      aiReady: "AI summary готов к генерации",
      aiBuilding: "AI summary строится...",
      aiSaved: (id) => `AI summary сохранен: ${id}`,
      aiUnavailable: "AI summary недоступен",
      unknownNewsError: "unknown news error",
      unknownDetailError: "unknown news detail error",
      unknownAiError: "unknown AI summary error",
    },
    values: {
      allAreas: "все районы",
      areaIds: (ids) => `Area ids: ${ids}`,
      sourceGrounded: "Source-grounded",
      noData: "Нет данных.",
    },
    empty: {
      noNews: "Нет новостей для выбранного фильтра.",
      chooseNews: "Выбери новость.",
      aiPrompt: "AI summary появится после генерации.",
    },
    errorPrefix: "Ошибка",
  },
  uk: {
    title: "News intelligence",
    subtitle: "Новини ринку, іпотеки, транспорту, MPZP та їхній вплив на райони.",
    actions: {
      refresh: "Оновити",
      source: "Джерело",
      summary: "Summary",
    },
    sections: {
      articles: "Articles",
      articleDetail: "Деталі новини",
      aiSummary: "AI news summary",
      keyPoints: "Головне",
      areaImpact: "Вплив на райони",
      sources: "Sources",
      buyerNotes: "Нотатки для покупця",
      investorNotes: "Нотатки для інвестора",
      guardrails: "Guardrails",
    },
    placeholders: {
      areaId: "area_id",
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
      backendUnavailable: "Backend API недоступний",
      aiNotCreated: "AI summary не створено",
      aiReady: "AI summary готовий до генерації",
      aiBuilding: "AI summary будується...",
      aiSaved: (id) => `AI summary збережено: ${id}`,
      aiUnavailable: "AI summary недоступний",
      unknownNewsError: "unknown news error",
      unknownDetailError: "unknown news detail error",
      unknownAiError: "unknown AI summary error",
    },
    values: {
      allAreas: "усі райони",
      areaIds: (ids) => `Area ids: ${ids}`,
      sourceGrounded: "Source-grounded",
      noData: "Немає даних.",
    },
    empty: {
      noNews: "Немає новин для вибраного фільтра.",
      chooseNews: "Вибери новину.",
      aiPrompt: "AI summary з'явиться після генерації.",
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
      unknownError: "unknown error",
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
      unknownError: "unknown error",
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
      unknownError: "unknown error",
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
    actions: {
      back: "Back",
      refresh: "Refresh",
      favorite: "Favorite",
      saveReport: "Save report",
      openReport: "Open report",
      answer: "Answer",
    },
    sections: {
      aiAssistant: "AI assistant",
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
    metrics: {
      verdict: "Verdict",
      price: "Price",
      pricePerM2: "Price per m2",
      fairPriceMid: "Fair price mid",
      fairPriceConfidence: "Fair price confidence",
      fairDeviation: "Deviation from fair mid",
      priceLabel: "Price label",
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
      backendUnavailable: "Backend API unavailable",
      favoriteAdded: "Added to favorites",
      reportSaved: (reportId) => `Report saved: ${reportId}`,
      aiReady: "AI assistant ready",
      aiQuestionsUnavailable: "AI questions unavailable",
      aiBuilding: "AI answer is being built...",
      aiRefused: "AI answer refused by guardrail rules",
      aiSaved: (id) => `AI answer saved: ${id}`,
      aiUnavailable: "AI answer unavailable",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
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
      noAiAnswer: "AI answer will appear after the request.",
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
      guardrails: "Guardrails",
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
    actions: {
      back: "Wstecz",
      refresh: "Odśwież",
      favorite: "Ulubione",
      saveReport: "Zapisz raport",
      openReport: "Otwórz raport",
      answer: "Odpowiedz",
    },
    sections: {
      aiAssistant: "AI assistant",
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
    metrics: {
      verdict: "Werdykt",
      price: "Cena",
      pricePerM2: "Cena za m2",
      fairPriceMid: "Fair price mid",
      fairPriceConfidence: "Fair price confidence",
      fairDeviation: "Odchylenie od fair mid",
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
      backendUnavailable: "Backend API niedostępne",
      favoriteAdded: "Dodano do ulubionych",
      reportSaved: (reportId) => `Raport zapisany: ${reportId}`,
      aiReady: "AI assistant gotowy",
      aiQuestionsUnavailable: "AI questions niedostępne",
      aiBuilding: "AI answer jest generowany...",
      aiRefused: "AI answer odrzucony przez guardrail rules",
      aiSaved: (id) => `AI answer zapisany: ${id}`,
      aiUnavailable: "AI answer niedostępny",
    },
    values: {
      buyer: "Kupujący",
      realtor: "Pośrednik",
      investor: "Inwestor",
      refused: "Odrzucono",
      sourceGrounded: "Source-grounded",
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
      noAiAnswer: "AI answer pojawi się po zapytaniu.",
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
      guardrails: "Guardrails",
    },
    fallbackQuestion: {
      label: "Podsumowanie obiektu",
      description: "Krótki source-grounded summary decyzji.",
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
    actions: {
      back: "Назад",
      refresh: "Обновить",
      favorite: "Избранное",
      saveReport: "Сохранить отчет",
      openReport: "Открыть отчет",
      answer: "Ответить",
    },
    sections: {
      aiAssistant: "AI assistant",
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
    metrics: {
      verdict: "Вердикт",
      price: "Цена",
      pricePerM2: "Цена за m2",
      fairPriceMid: "Fair price mid",
      fairPriceConfidence: "Fair price confidence",
      fairDeviation: "Отклонение от fair mid",
      priceLabel: "Price label",
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
      backendUnavailable: "Backend API недоступен",
      favoriteAdded: "Добавлено в избранное",
      reportSaved: (reportId) => `Отчет сохранен: ${reportId}`,
      aiReady: "AI assistant готов",
      aiQuestionsUnavailable: "AI questions недоступны",
      aiBuilding: "AI answer строится...",
      aiRefused: "AI answer отклонен guardrail-правилом",
      aiSaved: (id) => `AI answer сохранен: ${id}`,
      aiUnavailable: "AI answer недоступен",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
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
      noAiAnswer: "AI answer появится после запроса.",
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
      guardrails: "Guardrails",
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
    actions: {
      back: "Назад",
      refresh: "Оновити",
      favorite: "Обране",
      saveReport: "Зберегти звіт",
      openReport: "Відкрити звіт",
      answer: "Відповісти",
    },
    sections: {
      aiAssistant: "AI assistant",
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
    metrics: {
      verdict: "Вердикт",
      price: "Ціна",
      pricePerM2: "Ціна за m2",
      fairPriceMid: "Fair price mid",
      fairPriceConfidence: "Fair price confidence",
      fairDeviation: "Відхилення від fair mid",
      priceLabel: "Price label",
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
      backendUnavailable: "Backend API недоступний",
      favoriteAdded: "Додано в обране",
      reportSaved: (reportId) => `Звіт збережено: ${reportId}`,
      aiReady: "AI assistant готовий",
      aiQuestionsUnavailable: "AI questions недоступні",
      aiBuilding: "AI answer будується...",
      aiRefused: "AI answer відхилено guardrail-правилом",
      aiSaved: (id) => `AI answer збережено: ${id}`,
      aiUnavailable: "AI answer недоступний",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
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
      noAiAnswer: "AI answer з'явиться після запиту.",
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
      guardrails: "Guardrails",
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
      getVerdict: "Get verdict",
      buildShortlist: "Build shortlist",
    },
    sections: {
      selector: "Choose listings",
      aiVerdict: "AI verdict",
      clientShortlist: "Client shortlist",
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
      backendUnavailable: "Backend API unavailable",
      comparing: "Comparing listings...",
      compareCount: (count) => `Comparing listings: ${count}`,
      compareUnavailable: "Comparison unavailable for the current set",
      compareLimit: "You can compare up to 5 listings",
      aiNotCreated: "AI verdict not created",
      aiReady: "AI verdict ready to generate",
      aiBuilding: "AI verdict is building...",
      aiRefused: "AI verdict refused by guardrail rules",
      aiSaved: (id) => `AI verdict saved: ${id}`,
      aiUnavailable: "AI verdict unavailable",
      shortlistNotCreated: "Client shortlist not created",
      shortlistReady: "Client shortlist ready to generate",
      shortlistBuilding: "Client shortlist is building...",
      shortlistCount: (count) => `${count} listings in client shortlist`,
      shortlistUnavailable: "Client shortlist unavailable",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
      winner: "Winner",
      sourceLinks: "Source links",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} room${count === 1 ? "" : "s"}`,
      monthly: "mo.",
      loan: "loan",
      cash: "cash",
      fair: "to fair",
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
      decisionScore: "Decision Score",
      verdict: "Verdict",
      developer: "Developer",
      developerRisk: "Developer risk",
      developerCheck: "Developer checks",
      mortgagePayment: "Baseline mortgage",
      cashNeeded: "Cash needed",
      totalMoveInCost: "Total move-in cost",
      transactionCosts: "Transaction costs",
      renovationFurniture: "Renovation + furniture",
      readyAlternative: "Ready-to-move proxy",
      postRenovationGap: "After-renovation gap",
      offerStrategy: "Offer strategy",
      rentalEstimate: "Rental estimate",
      priceLabel: "Price label",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      negotiationScore: "Negotiation Score",
      liquidity: "Liquidity",
      rentalPotential: "Rental Potential",
      fairPrice: "Fair price",
      fairPriceConfidence: "Fair price confidence",
      checkCompleteness: "Check completeness",
      criticalUnknowns: "Critical unknowns",
      sourceConfidence: "Source confidence",
      fairPriceDelta: "Delta to fair mid",
      discountToFair: "Discount to fair",
      transport: "Transport",
      infrastructure: "Infrastructure",
      plannedInvestments: "Planned investments",
      negotiationArgument: "Negotiation argument",
      mainRisk: "Main risk",
      recommendation: "Recommendation",
    },
    empty: {
      selectMin: "Choose at least 2 listings to compare.",
      noAiAnswer: "AI verdict will appear here after generation for selected listings.",
      noShortlist: "Client shortlist will appear here after generation for selected listings.",
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
      getVerdict: "Pobierz verdict",
      buildShortlist: "Zbuduj shortlistę",
    },
    sections: {
      selector: "Wybór ofert",
      aiVerdict: "AI verdict",
      clientShortlist: "Client shortlist",
      comparisonMatrix: "Macierz porównania",
      sourcesAndLimits: "Źródła i ograniczenia",
    },
    metrics: {
      bestChoice: "Najlepszy wybór",
      belowFairPrice: "Poniżej fair price",
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
      backendUnavailable: "Backend API niedostępne",
      comparing: "Porównywanie ofert...",
      compareCount: (count) => `Porównywane oferty: ${count}`,
      compareUnavailable: "Porównanie niedostępne dla obecnego zestawu",
      compareLimit: "Można porównać maksymalnie 5 ofert",
      aiNotCreated: "AI verdict nieutworzony",
      aiReady: "AI verdict gotowy do wygenerowania",
      aiBuilding: "AI verdict jest generowany...",
      aiRefused: "AI verdict odrzucony przez guardrail rules",
      aiSaved: (id) => `AI verdict zapisany: ${id}`,
      aiUnavailable: "AI verdict niedostępny",
      shortlistNotCreated: "Client shortlist nieutworzona",
      shortlistReady: "Client shortlist gotowa do wygenerowania",
      shortlistBuilding: "Client shortlist jest generowana...",
      shortlistCount: (count) => `${count} ofert w client shortlist`,
      shortlistUnavailable: "Client shortlist niedostępna",
    },
    values: {
      buyer: "Kupujący",
      realtor: "Pośrednik",
      investor: "Inwestor",
      refused: "Odrzucono",
      sourceGrounded: "Source-grounded",
      winner: "Winner",
      sourceLinks: "Source links",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} pok.`,
      monthly: "mies.",
      loan: "kredyt",
      cash: "cash",
      fair: "do fair",
      negotiation: "negocjacja",
      gross: "gross",
      liquidity: "liquidity",
      rent: "rent",
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
      decisionScore: "Decision Score",
      verdict: "Verdict",
      developer: "Deweloper",
      developerRisk: "Ryzyko dewelopera",
      developerCheck: "Sprawdzenie dewelopera",
      mortgagePayment: "Bazowa hipoteka",
      cashNeeded: "Potrzebna gotówka",
      totalMoveInCost: "Całkowity koszt wejścia",
      transactionCosts: "Koszty transakcyjne",
      renovationFurniture: "Remont + meble",
      readyAlternative: "Gotowa alternatywa proxy",
      postRenovationGap: "Różnica po remoncie",
      offerStrategy: "Strategia oferty",
      rentalEstimate: "Szacunek najmu",
      priceLabel: "Price label",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      negotiationScore: "Negotiation Score",
      liquidity: "Liquidity",
      rentalPotential: "Rental Potential",
      fairPrice: "Fair price",
      fairPriceConfidence: "Fair price confidence",
      checkCompleteness: "Pełność sprawdzenia",
      criticalUnknowns: "Kluczowe niewiadome",
      sourceConfidence: "Pewność źródeł",
      fairPriceDelta: "Delta do fair mid",
      discountToFair: "Rabat do fair",
      transport: "Transport",
      infrastructure: "Infrastruktura",
      plannedInvestments: "Planowane inwestycje",
      negotiationArgument: "Argument do negocjacji",
      mainRisk: "Główne ryzyko",
      recommendation: "Rekomendacja",
    },
    empty: {
      selectMin: "Wybierz co najmniej 2 oferty do porównania.",
      noAiAnswer: "AI verdict pojawi się tutaj po wygenerowaniu dla wybranych ofert.",
      noShortlist: "Client shortlist pojawi się tutaj po wygenerowaniu dla wybranych ofert.",
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
      tradeoffs: "Tradeoffs",
    },
  },
  ru: {
    title: "Сравнение объектов",
    subtitle: "Сравнение цены, ликвидности, рисков, торга и инвестиционного потенциала.",
    actions: {
      search: "Подбор",
      refresh: "Обновить",
      getVerdict: "Получить verdict",
      buildShortlist: "Собрать подборку",
    },
    sections: {
      selector: "Выбор объектов",
      aiVerdict: "AI verdict",
      clientShortlist: "Client shortlist",
      comparisonMatrix: "Матрица сравнения",
      sourcesAndLimits: "Источники и ограничения",
    },
    metrics: {
      bestChoice: "Лучший выбор",
      belowFairPrice: "Ниже fair price",
      cheaperMonthly: "Дешевле в месяц",
      rentalSignal: "Арендный сигнал",
    },
    fields: {
      audience: "Аудитория",
      question: "Вопрос",
      client: "Клиент",
      intro: "Intro",
    },
    placeholders: {
      aiQuestion: "Например: что выбрать для семьи или сдачи в аренду?",
      clientName: "Anna",
      intro: "Контекст для письма клиенту",
    },
    statuses: {
      loadingListings: "Загрузка объектов...",
      listingsLoaded: "Объекты загружены",
      backendUnavailable: "Backend API недоступен",
      comparing: "Сравнение объектов...",
      compareCount: (count) => `Сравнивается объектов: ${count}`,
      compareUnavailable: "Сравнение недоступно для текущего набора",
      compareLimit: "Максимум 5 объектов в сравнении",
      aiNotCreated: "AI verdict не создан",
      aiReady: "AI verdict готов к генерации",
      aiBuilding: "AI verdict строится...",
      aiRefused: "AI verdict отклонен guardrail-правилом",
      aiSaved: (id) => `AI verdict сохранен: ${id}`,
      aiUnavailable: "AI verdict недоступен",
      shortlistNotCreated: "Client shortlist не создан",
      shortlistReady: "Client shortlist готов к генерации",
      shortlistBuilding: "Client shortlist строится...",
      shortlistCount: (count) => `${count} объектов в клиентской подборке`,
      shortlistUnavailable: "Client shortlist недоступен",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
      winner: "Winner",
      sourceLinks: "Source links",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} pok.`,
      monthly: "мес",
      loan: "loan",
      cash: "cash",
      fair: "к fair",
      negotiation: "торг",
      gross: "gross",
      liquidity: "liquidity",
      rent: "rent",
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
      decisionScore: "Decision Score",
      verdict: "Вердикт",
      developer: "Застройщик",
      developerRisk: "Риск застройщика",
      developerCheck: "Проверить по застройщику",
      mortgagePayment: "Ипотека baseline",
      cashNeeded: "Cash needed",
      totalMoveInCost: "Полная стоимость въезда",
      transactionCosts: "Сделка и fees",
      renovationFurniture: "Ремонт + мебель",
      readyAlternative: "Готовая альтернатива",
      postRenovationGap: "Разница после ремонта",
      offerStrategy: "Стратегия offer",
      rentalEstimate: "Rental estimate",
      priceLabel: "Оценка цены",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      negotiationScore: "Negotiation Score",
      liquidity: "Liquidity",
      rentalPotential: "Rental Potential",
      fairPrice: "Fair price",
      fairPriceConfidence: "Fair price confidence",
      checkCompleteness: "Полнота проверки",
      criticalUnknowns: "Ключевые неизвестные",
      sourceConfidence: "Уверенность источников",
      fairPriceDelta: "Delta до fair mid",
      discountToFair: "Скидка до fair",
      transport: "Транспорт",
      infrastructure: "Инфраструктура",
      plannedInvestments: "Planned investments",
      negotiationArgument: "Аргумент для торга",
      mainRisk: "Главный риск",
      recommendation: "Рекомендация",
    },
    empty: {
      selectMin: "Выбери минимум 2 объекта для сравнения.",
      noAiAnswer: "AI verdict появится здесь после генерации для выбранных объектов.",
      noShortlist: "Client shortlist появится здесь после генерации для выбранных объектов.",
      noData: "Нет данных.",
      noWarnings: "Критичных предупреждений нет",
      noDeveloper: "Нет сопоставленного застройщика",
      noDeveloperRisk: "Нет данных для developer risk",
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
      tradeoffs: "Tradeoffs",
    },
  },
  uk: {
    title: "Порівняння об'єктів",
    subtitle: "Порівняння ціни, ліквідності, ризиків, торгу та інвестиційного потенціалу.",
    actions: {
      search: "Підбір",
      refresh: "Оновити",
      getVerdict: "Отримати verdict",
      buildShortlist: "Зібрати добірку",
    },
    sections: {
      selector: "Вибір об'єктів",
      aiVerdict: "AI verdict",
      clientShortlist: "Client shortlist",
      comparisonMatrix: "Матриця порівняння",
      sourcesAndLimits: "Джерела та обмеження",
    },
    metrics: {
      bestChoice: "Найкращий вибір",
      belowFairPrice: "Нижче fair price",
      cheaperMonthly: "Дешевше на місяць",
      rentalSignal: "Орендний сигнал",
    },
    fields: {
      audience: "Аудиторія",
      question: "Питання",
      client: "Клієнт",
      intro: "Intro",
    },
    placeholders: {
      aiQuestion: "Наприклад: що вибрати для сім'ї або здачі в оренду?",
      clientName: "Anna",
      intro: "Контекст для листа клієнту",
    },
    statuses: {
      loadingListings: "Завантаження об'єктів...",
      listingsLoaded: "Об'єкти завантажено",
      backendUnavailable: "Backend API недоступний",
      comparing: "Порівняння об'єктів...",
      compareCount: (count) => `Порівнюється об'єктів: ${count}`,
      compareUnavailable: "Порівняння недоступне для поточного набору",
      compareLimit: "Максимум 5 об'єктів у порівнянні",
      aiNotCreated: "AI verdict не створено",
      aiReady: "AI verdict готовий до генерації",
      aiBuilding: "AI verdict будується...",
      aiRefused: "AI verdict відхилено guardrail-правилом",
      aiSaved: (id) => `AI verdict збережено: ${id}`,
      aiUnavailable: "AI verdict недоступний",
      shortlistNotCreated: "Client shortlist не створено",
      shortlistReady: "Client shortlist готовий до генерації",
      shortlistBuilding: "Client shortlist будується...",
      shortlistCount: (count) => `${count} об'єктів у клієнтській добірці`,
      shortlistUnavailable: "Client shortlist недоступний",
    },
    values: {
      buyer: "Buyer",
      realtor: "Realtor",
      investor: "Investor",
      refused: "Refused",
      sourceGrounded: "Source-grounded",
      winner: "Winner",
      sourceLinks: "Source links",
      rank: (rank) => `#${rank}`,
      roomsShort: (count) => `${count} кімн.`,
      monthly: "міс.",
      loan: "loan",
      cash: "cash",
      fair: "до fair",
      negotiation: "торг",
      gross: "gross",
      liquidity: "liquidity",
      rent: "rent",
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
      decisionScore: "Decision Score",
      verdict: "Вердикт",
      developer: "Забудовник",
      developerRisk: "Ризик забудовника",
      developerCheck: "Перевірити забудовника",
      mortgagePayment: "Іпотека baseline",
      cashNeeded: "Cash needed",
      totalMoveInCost: "Повна вартість входу",
      transactionCosts: "Угода і fees",
      renovationFurniture: "Ремонт + меблі",
      readyAlternative: "Готова альтернатива",
      postRenovationGap: "Різниця після ремонту",
      offerStrategy: "Стратегія offer",
      rentalEstimate: "Rental estimate",
      priceLabel: "Оцінка ціни",
      investmentScore: "Investment Score",
      riskScore: "Risk Score",
      negotiationScore: "Negotiation Score",
      liquidity: "Liquidity",
      rentalPotential: "Rental Potential",
      fairPrice: "Fair price",
      fairPriceConfidence: "Fair price confidence",
      checkCompleteness: "Повнота перевірки",
      criticalUnknowns: "Ключові невідомі",
      sourceConfidence: "Впевненість джерел",
      fairPriceDelta: "Delta до fair mid",
      discountToFair: "Знижка до fair",
      transport: "Транспорт",
      infrastructure: "Інфраструктура",
      plannedInvestments: "Planned investments",
      negotiationArgument: "Аргумент для торгу",
      mainRisk: "Головний ризик",
      recommendation: "Рекомендація",
    },
    empty: {
      selectMin: "Вибери мінімум 2 об'єкти для порівняння.",
      noAiAnswer: "AI verdict з'явиться тут після генерації для вибраних об'єктів.",
      noShortlist: "Client shortlist з'явиться тут після генерації для вибраних об'єктів.",
      noData: "Немає даних.",
      noWarnings: "Критичних попереджень немає",
      noDeveloper: "Немає зіставленого забудовника",
      noDeveloperRisk: "Немає даних для developer risk",
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
      tradeoffs: "Tradeoffs",
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
        fulfilled: "Fulfilled",
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
      backendUnavailable: "Backend API unavailable",
      unknownError: "unknown error",
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
      backendUnavailable: "Backend API niedostępne",
      unknownError: "nieznany błąd",
      loadingCrmError: "Błąd ładowania CRM",
      switchingPlan: (plan) => `Przełączanie na ${plan}...`,
      planChanged: (plan) => `Plan: ${plan}`,
      loadingWorkspace: "Ładowanie workspace...",
      workspaceSelected: "Workspace wybrany",
      loadingWorkspaceError: "Błąd ładowania workspace",
      agencyNameRequired: "Nazwa agencji jest wymagana",
      creatingAgency: "Tworzenie agency workspace...",
      agencyCreated: "Agency workspace utworzony",
      agencyCreateError: "Błąd tworzenia agency workspace",
      memberUserIdRequired: "User ID członka jest wymagany",
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
      shortlistRequired: "Tytuł shortlist i co najmniej jeden listing ID są wymagane",
      buildingShortlist: "Budowanie CRM shortlist...",
      shortlistCreated: "CRM shortlist utworzony",
      shortlistCreateError: "Błąd budowania CRM shortlist",
      enablingShare: "Włączanie share...",
      disablingShare: "Wyłączanie share...",
      shareEnabled: "Share włączony",
      shareDisabled: "Share wyłączony",
      shareUpdateError: "Błąd aktualizacji share",
      generatingSharePreview: "Generowanie podglądu share...",
      sharePreviewReady: "Podgląd share gotowy",
      sharePreviewError: "Błąd podglądu share",
    },
    ru: {
      loadingAccount: "Загрузка аккаунта...",
      loadingAccountAndLimits: "Загрузка аккаунта и лимитов",
      accountUpdated: "Аккаунт обновлен",
      backendUnavailable: "Backend API недоступен",
      unknownError: "unknown error",
      loadingCrmError: "Ошибка загрузки CRM",
      switchingPlan: (plan) => `Переключение на ${plan}...`,
      planChanged: (plan) => `Тариф: ${plan}`,
      loadingWorkspace: "Загрузка workspace...",
      workspaceSelected: "Workspace выбран",
      loadingWorkspaceError: "Ошибка загрузки workspace",
      agencyNameRequired: "Название agency обязательно",
      creatingAgency: "Создание agency workspace...",
      agencyCreated: "Agency workspace создан",
      agencyCreateError: "Ошибка создания agency workspace",
      memberUserIdRequired: "User ID участника обязателен",
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
      shortlistRequired: "Название shortlist и хотя бы один listing id обязательны",
      buildingShortlist: "Сборка CRM shortlist...",
      shortlistCreated: "CRM shortlist создан",
      shortlistCreateError: "Ошибка сборки CRM shortlist",
      enablingShare: "Включение шаринга...",
      disablingShare: "Отключение шаринга...",
      shareEnabled: "Шаринг включен",
      shareDisabled: "Шаринг отключен",
      shareUpdateError: "Ошибка обновления шаринга",
      generatingSharePreview: "Генерация share preview...",
      sharePreviewReady: "Share preview готов",
      sharePreviewError: "Ошибка share preview",
    },
    uk: {
      loadingAccount: "Завантаження акаунта...",
      loadingAccountAndLimits: "Завантаження акаунта і лімітів",
      accountUpdated: "Акаунт оновлено",
      backendUnavailable: "Backend API недоступний",
      unknownError: "unknown error",
      loadingCrmError: "Помилка завантаження CRM",
      switchingPlan: (plan) => `Перемикання на ${plan}...`,
      planChanged: (plan) => `Тариф: ${plan}`,
      loadingWorkspace: "Завантаження workspace...",
      workspaceSelected: "Workspace вибрано",
      loadingWorkspaceError: "Помилка завантаження workspace",
      agencyNameRequired: "Назва agency обов'язкова",
      creatingAgency: "Створення agency workspace...",
      agencyCreated: "Agency workspace створено",
      agencyCreateError: "Помилка створення agency workspace",
      memberUserIdRequired: "User ID учасника обов'язковий",
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
      shortlistRequired: "Назва shortlist і хоча б один listing id обов'язкові",
      buildingShortlist: "Збірка CRM shortlist...",
      shortlistCreated: "CRM shortlist створено",
      shortlistCreateError: "Помилка збірки CRM shortlist",
      enablingShare: "Увімкнення шарингу...",
      disablingShare: "Вимкнення шарингу...",
      shareEnabled: "Шаринг увімкнено",
      shareDisabled: "Шаринг вимкнено",
      shareUpdateError: "Помилка оновлення шарингу",
      generatingSharePreview: "Генерація share preview...",
      sharePreviewReady: "Share preview готовий",
      sharePreviewError: "Помилка share preview",
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
    en: { instant: "instant", daily: "daily", weekly: "weekly" },
    pl: { instant: "instant", daily: "daily", weekly: "weekly" },
    ru: { instant: "instant", daily: "daily", weekly: "weekly" },
    uk: { instant: "instant", daily: "daily", weekly: "weekly" },
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
      min_investment_score: "Min Investment",
      max_risk_score: "Max Risk",
      max_price_delta_to_fair_mid_pct: "Max fair delta",
      min_negotiation_score: "Min Negotiation",
      min_liquidity_score: "Min Liquidity",
      min_rental_potential_score: "Min Rental",
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
      min_investment_score: "Min Investment",
      max_risk_score: "Max Risk",
      max_price_delta_to_fair_mid_pct: "Maks. fair delta",
      min_negotiation_score: "Min Negotiation",
      min_liquidity_score: "Min Liquidity",
      min_rental_potential_score: "Min Rental",
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
      min_investment_score: "Мин. Investment",
      max_risk_score: "Макс. Risk",
      max_price_delta_to_fair_mid_pct: "Макс. fair delta",
      min_negotiation_score: "Мин. Negotiation",
      min_liquidity_score: "Мин. Liquidity",
      min_rental_potential_score: "Мин. Rental",
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
      min_investment_score: "Мін. Investment",
      max_risk_score: "Макс. Risk",
      max_price_delta_to_fair_mid_pct: "Макс. fair delta",
      min_negotiation_score: "Мін. Negotiation",
      min_liquidity_score: "Мін. Liquidity",
      min_rental_potential_score: "Мін. Rental",
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
