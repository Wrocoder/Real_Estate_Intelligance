import type { BuyerDecisionPackage, BuyerSourceEvidence, DueDiligenceChecklistItem } from "@/lib/api";
import { money } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

const CHECKLIST_CODES = [
  "kw_owner",
  "kw_mortgage",
  "land_status",
  "community_debt",
  "fees",
  "planned_repairs",
  "installations",
  "energy_certificate",
  "area_match",
  "unauthorized_works",
  "floor_context",
  "developer_identity",
  "track_record",
  "regulatory_signals",
  "escrow",
  "permits",
  "construction_status",
  "finish_standard",
  "prospekt",
  "delay_penalties",
  "warranties",
] as const;

type MessageCatalog = {
  priceBelow: (percent: string) => string;
  priceNear: string;
  priceAbove: (percent: string, amount: string) => string;
  intentFit: (score: number) => string;
  negotiationRoom: (score: number) => string;
  dueDiligenceRisk: (score: number) => string;
  unknownChecks: (count: number) => string;
  renovationGap: (amount: string) => string;
  lowConfidence: (score: number) => string;
  noMajorRisk: string;
  postureStrong: string;
  postureModerate: string;
  postureLimited: string;
  comparableArgument: (low: string, high: string) => string;
  supplyArgument: string;
  historyArgument: string;
  fairPriceArgument: (price: string) => string;
  factsArgument: string;
  negotiationUnavailable: string;
  scenarioConfidence: (score: number) => string;
  argumentFairRange: (low: string, high: string, confidence: number) => string;
  argumentAboveFair: (percent: number, amount: string) => string;
  argumentComparableSample: (count: number) => string;
  argumentLongExposure: (days: number, average: number) => string;
  argumentPriceReductions: (count: number) => string;
  argumentRelisted: string;
  argumentSupplyGrowth: (percent: number) => string;
  actionCollectEvidence: string;
  actionVerifyHistory: string;
  actionCompareAlternatives: string;
  actionVerifyDocuments: string;
  actionConfirmCondition: string;
  actionSubmitOffer: (price: string) => string;
  actionRespectCeiling: (price: string) => string;
  limitationFairConfidence: string;
  limitationSubjectQuality: string;
  limitationComparables: string;
  limitationTransactions: string;
  limitationMarketEvidence: string;
  limitationUnknown: string;
  guardrailScenario: string;
  guardrailDeposit: string;
  guardrailCeiling: string;
  guardrailNoAdvice: string;
  guardrailCollectEvidence: string;
  exportTitle: string;
  exportStatusAvailable: string;
  exportStatusUnavailable: string;
  exportEvidence: string;
  exportActions: string;
  openingScript: (price: string) => string;
  rangeScript: (low: string, high: string) => string;
  ceilingScript: (price: string) => string;
  diligenceStrong: string;
  diligenceMixed: string;
  diligenceWeak: string;
  documentsSecondary: string[];
  documentsPrimary: string[];
  sellerQuestions: string[];
  photoChecks: string[];
  buildingChecks: string[];
  surroundingsChecks: string[];
  postViewing: string[];
  watch: string[];
  watchFairRange: string;
  acquisitionMortgage: string;
  acquisitionPcc: string;
  acquisitionNoPcc: string;
  acquisitionRenovation: (amount: string) => string;
  knownSource: (topic: string, source: string) => string;
  estimatedSource: (topic: string, source: string) => string;
  sourceBasisObserved: string;
  sourceBasisCalculated: string;
  sourceBasisEstimated: string;
  sourceBasisUnknown: string;
  sourceNote: string;
  disclaimer: string;
  renovationConditions: Record<string, string>;
  budgetSources: Record<string, string>;
  checklist: Record<string, string>;
  checklistUnknown: string;
  sourceTopics: Record<string, string>;
};

const CATALOG: Record<Locale, MessageCatalog> = {
  pl: {
    priceBelow: (percent) => `Cena ofertowa jest o ${percent}% poniżej środka szacowanego zakresu.`,
    priceNear: "Cena ofertowa jest blisko szacowanego zakresu wartości.",
    priceAbove: (percent, amount) => `Cena ofertowa jest o ${percent}% (${amount}) powyżej środka szacowanego zakresu.`,
    intentFit: (score) => `Wybrany cel zakupu ma dopasowanie ${score}/10.`,
    negotiationRoom: (score) => `Dane wskazują przestrzeń do negocjacji (${score}/100).`,
    dueDiligenceRisk: (score) => `Przed ofertą trzeba uzupełnić istotne sprawdzenia (${score}/100).`,
    unknownChecks: (count) => `Nie potwierdzono jeszcze ${count} istotnych kwestii.`,
    renovationGap: (amount) => `Koszt po remoncie może być wyższy od gotowej alternatywy o ${amount}.`,
    lowConfidence: (score) => `Pewność wyceny jest ograniczona (${score}/100).`,
    noMajorRisk: "W danych strukturalnych nie wykryto obecnie istotnego sygnału ostrzegawczego.",
    postureStrong: "Mocna pozycja kupującego",
    postureModerate: "Umiarkowana przestrzeń do negocjacji",
    postureLimited: "Ograniczona przestrzeń; opieraj się na dowodach",
    comparableArgument: (low, high) => `Porównywalne dane wspierają zakres ${low}-${high}.`,
    supplyArgument: "Zmiana lokalnej podaży może wspierać spokojną rozmowę o cenie.",
    historyArgument: "Historia oferty uzasadnia pytanie o wcześniejsze ceny i czas ekspozycji.",
    fairPriceArgument: (price) =>
      `Szacowany środek wartości wynosi ${price}; traktuj go jako punkt odniesienia, nie gwarancję.`,
    factsArgument: "Użyj potwierdzonych parametrów mieszkania jako podstawy rozmowy.",
    negotiationUnavailable:
      "Brak wystarczających danych rynkowych do wyznaczenia odpowiedzialnego scenariusza ceny.",
    scenarioConfidence: (score) => `Pewność scenariusza: ${score}/100.`,
    argumentFairRange: (low, high, confidence) =>
      `Szacowany zakres ${low}-${high} ma pewność ${confidence}/100.`,
    argumentAboveFair: (percent, amount) =>
      `Cena ofertowa jest o ${percent.toFixed(1)}% (${amount}) powyżej szacowanego środka.`,
    argumentComparableSample: (count) => `Wycena uwzględnia ${count} porównywalne oferty.`,
    argumentLongExposure: (days, average) =>
      `Oferta jest aktywna ${days} dni wobec średniej ${average} dni w okolicy.`,
    argumentPriceReductions: (count) => `Cena była obniżana ${count} raz(y).`,
    argumentRelisted: "Oferta została opublikowana ponownie; sprawdź wcześniejszą cenę i czas ekspozycji.",
    argumentSupplyGrowth: (percent) => `Lokalna podaż wzrosła o ${percent.toFixed(1)}% w 90 dni.`,
    actionCollectEvidence: "Zbierz aktualne oferty porównawcze lub dane transakcyjne.",
    actionVerifyHistory: "Zapytaj o pierwszą datę publikacji i wcześniejsze ceny.",
    actionCompareAlternatives: "Porównaj co najmniej dwie aktualne alternatywy przed złożeniem oferty.",
    actionVerifyDocuments: "Sprawdź własność, obciążenia i dokumenty budynku przed ofertą.",
    actionConfirmCondition: "Potwierdź stan techniczny i koszty remontu podczas oględzin.",
    actionSubmitOffer: (price) => `Złóż warunkową ofertę startową ${price}.`,
    actionRespectCeiling: (price) => `Nie podnoś scenariuszowego sufitu ponad ${price} bez nowych dowodów.`,
    limitationFairConfidence: "Pewność fair price jest niższa niż 50/100.",
    limitationSubjectQuality: "Dane o analizowanym mieszkaniu są niepełne.",
    limitationComparables: "Dostępne są mniej niż trzy porównywalne oferty.",
    limitationTransactions: "Dostępnych jest mniej niż dziesięć obserwacji transakcyjnych.",
    limitationMarketEvidence: "Żadna próba rynkowa nie osiąga minimalnego progu.",
    limitationUnknown: "Potrzebne są dodatkowe dane rynkowe.",
    guardrailScenario: "To scenariusz negocjacyjny, a nie potwierdzona wycena ani zaakceptowana cena.",
    guardrailDeposit: "Przed zadatkiem zakończ kontrolę dokumentów i stanu technicznego.",
    guardrailCeiling: "Podnoś sufit tylko wtedy, gdy nowe dowody uzasadniają wyższą cenę.",
    guardrailNoAdvice: "Nie wyznaczaj oferty na podstawie niepełnych danych.",
    guardrailCollectEvidence: "Najpierw uzupełnij dowody rynkowe, potem nazwij cenę.",
    exportTitle: "WartoMetr - krótkie uzasadnienie negocjacji",
    exportStatusAvailable: "Status: scenariusz dostępny",
    exportStatusUnavailable: "Status: za mało danych do scenariusza ceny",
    exportEvidence: "Podstawy",
    exportActions: "Następne kroki",
    openingScript: (price) =>
      `Zacznij od ${price} i wyjaśnij, że oferta wynika z zakresu wartości i wymaganych sprawdzeń.`,
    rangeScript: (low, high) => `Prowadź rozmowę wokół zakresu ${low}-${high}, a nie tylko ceny ofertowej.`,
    ceilingScript: (price) =>
      `Nie przekraczaj ${price}, dopóki dokumenty i stan techniczny nie poprawią obrazu ryzyka.`,
    diligenceStrong: "Większość kluczowych kwestii nadal wymaga potwierdzenia",
    diligenceMixed: "Część kluczowych kwestii wymaga potwierdzenia",
    diligenceWeak: "Zakres podstawowych sprawdzeń jest stosunkowo kompletny",
    documentsSecondary: [
      "Księga wieczysta",
      "Zaświadczenie o braku zaległości",
      "Rozliczenie czynszu i funduszu remontowego",
      "Protokoły i plany remontów wspólnoty",
      "Świadectwo energetyczne",
    ],
    documentsPrimary: [
      "Prospekt informacyjny z załącznikami",
      "Pozwolenie na budowę i tytuł do gruntu",
      "Harmonogram rachunku powierniczego",
      "Standard wykończenia",
      "Projekt umowy i zasady usuwania wad",
    ],
    sellerQuestions: [
      "Co dokładnie obejmuje cena?",
      "Jakie są bieżące opłaty miesięczne?",
      "Czy są planowane duże remonty budynku?",
      "Czy lokal lub budynek ma znane wady?",
      "Kiedy można otrzymać komplet dokumentów do weryfikacji?",
    ],
    photoChecks: [
      "Okna i widok z każdego pokoju",
      "Kuchnia, łazienka i instalacje",
      "Narożniki, sufity i ślady wilgoci",
      "Klatka schodowa, elewacja i części wspólne",
    ],
    buildingChecks: [
      "Stan wejścia, klatki i części wspólnych",
      "Ślady napraw dachu, elewacji lub windy",
      "Instalacje, ogrzewanie i wentylacja",
      "Ogłoszenia wspólnoty o planowanych pracach",
    ],
    surroundingsChecks: [
      "Hałas przy otwartych i zamkniętych oknach",
      "Dojście do transportu publicznego",
      "Presja parkingowa wieczorem",
      "Planowane budowy i uciążliwości w pobliżu",
    ],
    postViewing: [
      "Oceń stan techniczny i zakres remontu",
      "Sprawdź okna, hałas i światło dzienne",
      "Sprawdź wilgoć, zapach i wentylację",
      "Porównaj stan z opisem oferty",
      "Przelicz maksymalną cenę po oględzinach",
    ],
    watch: [
      "Powiadom o zmianie ceny",
      "Powiadom o nowej tańszej alternatywie",
      "Powiadom o istotnej zmianie dostępnych danych",
    ],
    watchFairRange: "Powiadom, gdy cena wejdzie w szacowany zakres wartości",
    acquisitionMortgage: "Rata jest scenariuszem opartym na jawnych założeniach finansowania.",
    acquisitionPcc: "Scenariusz rynku wtórnego obejmuje PCC 2%.",
    acquisitionNoPcc: "Scenariusz rynku pierwotnego nie obejmuje PCC; sprawdź VAT i opłaty dewelopera.",
    acquisitionRenovation: (amount) => `Budżet remontu w scenariuszu: ${amount}.`,
    knownSource: (topic, source) => `${topic}: dane ze źródła ${source}.`,
    estimatedSource: (topic, source) => `${topic}: obliczenie na podstawie ${source}.`,
    sourceBasisObserved: "Dane zaobserwowane w zarejestrowanym źródle.",
    sourceBasisCalculated: "Wartość obliczona z dostępnych obserwacji.",
    sourceBasisEstimated: "Estymacja modelowa; nie jest potwierdzoną ceną transakcyjną.",
    sourceBasisUnknown: "Sposób wyliczenia nie został potwierdzony.",
    sourceNote: "Przed decyzją sprawdź dane źródłowe i ich aktualność.",
    disclaimer:
      "Wynik wspiera wstępną decyzję kupującego. Nie zastępuje wyceny, badania technicznego ani porady prawnej, finansowej lub podatkowej.",
    renovationConditions: {
      ready_to_move_in: "gotowe do zamieszkania",
      needs_refresh: "do odświeżenia",
      light_renovation: "lekki remont",
      full_renovation: "pełny remont",
      custom_budget: "własny budżet",
    },
    budgetSources: {
      custom_budget: "budżet użytkownika",
      declared_condition: "deklarowany stan",
      condition_shell_developer_standard: "standard deweloperski",
      market_type_primary_default: "założenie dla rynku pierwotnego",
      listing_state_ready: "stan podany w ofercie",
      market_state_default: "założenie rynkowe",
    },
    checklist: checklistPl(),
    checklistUnknown: "Dodatkowa kwestia do potwierdzenia",
    sourceTopics: {
      comparables: "Porównywalne nieruchomości",
      area_supply: "Lokalna podaż",
      listing_history: "Historia oferty",
      fair_price: "Szacowana wartość",
      listing_facts: "Parametry oferty",
      area_statistics: "Rynek lokalny",
      rental_estimate: "Potencjał najmu",
      future_area_impact: "Zmiany w okolicy",
      due_diligence: "Zakres weryfikacji",
    },
  },
  en: {
    priceBelow: (percent) => `The asking price is ${percent}% below the estimated midpoint.`,
    priceNear: "The asking price is close to the estimated fair-value range.",
    priceAbove: (percent, amount) => `The asking price is ${percent}% (${amount}) above the estimated midpoint.`,
    intentFit: (score) => `The selected buying goal has a ${score}/10 fit.`,
    negotiationRoom: (score) => `The evidence indicates room to negotiate (${score}/100).`,
    dueDiligenceRisk: (score) => `Material checks remain before an offer (${score}/100).`,
    unknownChecks: (count) => `${count} material checks are still unconfirmed.`,
    renovationGap: (amount) => `The post-renovation cost may exceed a ready alternative by ${amount}.`,
    lowConfidence: (score) => `Valuation confidence is limited (${score}/100).`,
    noMajorRisk: "No material warning is currently present in the structured data.",
    postureStrong: "Strong buyer leverage",
    postureModerate: "Moderate room to negotiate",
    postureLimited: "Limited room; rely on evidence",
    comparableArgument: (low, high) => `Comparable evidence supports a ${low}-${high} range.`,
    supplyArgument: "Local supply changes can support a measured price discussion.",
    historyArgument: "Listing history supports asking about earlier prices and exposure time.",
    fairPriceArgument: (price) => `The estimated midpoint is ${price}; use it as a reference, not a guarantee.`,
    factsArgument: "Use confirmed apartment facts as the basis of the discussion.",
    negotiationUnavailable:
      "There is not enough market evidence to produce a responsible price scenario.",
    scenarioConfidence: (score) => `Scenario confidence: ${score}/100.`,
    argumentFairRange: (low, high, confidence) =>
      `The estimated ${low}-${high} range has ${confidence}/100 confidence.`,
    argumentAboveFair: (percent, amount) =>
      `The asking price is ${percent.toFixed(1)}% (${amount}) above the estimated midpoint.`,
    argumentComparableSample: (count) => `The estimate includes ${count} comparable listings.`,
    argumentLongExposure: (days, average) =>
      `The listing has been active for ${days} days versus an area average of ${average}.`,
    argumentPriceReductions: (count) => `The asking price was reduced ${count} time(s).`,
    argumentRelisted: "The listing was relisted; verify its previous price and exposure.",
    argumentSupplyGrowth: (percent) => `Local supply increased ${percent.toFixed(1)}% over 90 days.`,
    actionCollectEvidence: "Collect current comparable listings or transaction observations.",
    actionVerifyHistory: "Ask for the original publication date and previous asking prices.",
    actionCompareAlternatives: "Compare at least two current alternatives before making an offer.",
    actionVerifyDocuments: "Verify ownership, encumbrances and building documents before an offer.",
    actionConfirmCondition: "Confirm technical condition and renovation costs during viewing.",
    actionSubmitOffer: (price) => `Submit a conditional opening offer of ${price}.`,
    actionRespectCeiling: (price) => `Do not raise the scenario ceiling above ${price} without new evidence.`,
    limitationFairConfidence: "Fair-price confidence is below 50/100.",
    limitationSubjectQuality: "The analyzed apartment data is incomplete.",
    limitationComparables: "Fewer than three comparable listings are available.",
    limitationTransactions: "Fewer than ten transaction observations are available.",
    limitationMarketEvidence: "Neither market sample reaches the minimum threshold.",
    limitationUnknown: "Additional market evidence is required.",
    guardrailScenario: "This is a negotiation scenario, not a certified valuation or accepted price.",
    guardrailDeposit: "Complete document and technical checks before paying a deposit.",
    guardrailCeiling: "Raise the ceiling only when new evidence supports a higher price.",
    guardrailNoAdvice: "Do not infer an offer from incomplete data.",
    guardrailCollectEvidence: "Collect market evidence before naming a price.",
    exportTitle: "WartoMetr - negotiation brief",
    exportStatusAvailable: "Status: price scenario available",
    exportStatusUnavailable: "Status: insufficient data for a price scenario",
    exportEvidence: "Evidence",
    exportActions: "Next actions",
    openingScript: (price) =>
      `Open at ${price} and explain that the offer reflects the value range and required checks.`,
    rangeScript: (low, high) => `Anchor the discussion around ${low}-${high}, not only the asking price.`,
    ceilingScript: (price) =>
      `Do not exceed ${price} unless documents and technical checks materially improve the risk picture.`,
    diligenceStrong: "Most key matters still require confirmation",
    diligenceMixed: "Some key matters require confirmation",
    diligenceWeak: "The basic verification scope is relatively complete",
    documentsSecondary: [
      "Land and mortgage register",
      "No-arrears certificate",
      "Service-charge and repair-fund statement",
      "Community minutes and repair plans",
      "Energy certificate",
    ],
    documentsPrimary: [
      "Information prospectus and annexes",
      "Building permit and land title",
      "Escrow payment schedule",
      "Finish specification",
      "Draft agreement and defect procedure",
    ],
    sellerQuestions: [
      "What exactly is included in the price?",
      "What are the current monthly charges?",
      "Are major building works planned?",
      "Are there known apartment or building defects?",
      "When can the full document set be reviewed?",
    ],
    photoChecks: [
      "Windows and view from each room",
      "Kitchen, bathroom and installations",
      "Corners, ceilings and moisture traces",
      "Staircase, facade and common areas",
    ],
    buildingChecks: [
      "Entrance, staircase and common areas",
      "Signs of roof, facade or lift repairs",
      "Installations, heating and ventilation",
      "Community notices about planned works",
    ],
    surroundingsChecks: [
      "Noise with windows open and closed",
      "Walk to public transport",
      "Evening parking pressure",
      "Nearby construction and nuisance",
    ],
    postViewing: [
      "Assess technical condition and renovation scope",
      "Check windows, noise and daylight",
      "Check moisture, smell and ventilation",
      "Compare condition with the listing",
      "Recalculate the ceiling after viewing",
    ],
    watch: [
      "Notify me about a price change",
      "Notify me about a cheaper alternative",
      "Notify me about a material data change",
    ],
    watchFairRange: "Notify me when the price enters the estimated fair range",
    acquisitionMortgage: "The payment is a scenario based on explicit financing assumptions.",
    acquisitionPcc: "The secondary-market scenario includes 2% PCC.",
    acquisitionNoPcc: "The primary-market scenario excludes PCC; verify VAT and developer fees.",
    acquisitionRenovation: (amount) => `Scenario renovation budget: ${amount}.`,
    knownSource: (topic, source) => `${topic}: source data from ${source}.`,
    estimatedSource: (topic, source) => `${topic}: calculated from ${source}.`,
    sourceBasisObserved: "Data observed in a registered source.",
    sourceBasisCalculated: "Value calculated from available observations.",
    sourceBasisEstimated: "Model estimate; this is not a confirmed transaction price.",
    sourceBasisUnknown: "The calculation basis has not been confirmed.",
    sourceNote: "Check source data and freshness before deciding.",
    disclaimer:
      "This result supports initial buyer screening. It does not replace a valuation, technical inspection, or legal, financial or tax advice.",
    renovationConditions: {
      ready_to_move_in: "ready to move in",
      needs_refresh: "needs refresh",
      light_renovation: "light renovation",
      full_renovation: "full renovation",
      custom_budget: "custom budget",
    },
    budgetSources: {
      custom_budget: "buyer budget",
      declared_condition: "declared condition",
      condition_shell_developer_standard: "developer finish standard",
      market_type_primary_default: "primary-market assumption",
      listing_state_ready: "listing condition",
      market_state_default: "market assumption",
    },
    checklist: checklistEn(),
    checklistUnknown: "Additional matter to confirm",
    sourceTopics: {
      comparables: "Comparable properties",
      area_supply: "Local supply",
      listing_history: "Listing history",
      fair_price: "Estimated value",
      listing_facts: "Listing facts",
      area_statistics: "Local market",
      rental_estimate: "Rental potential",
      future_area_impact: "Area changes",
      due_diligence: "Verification scope",
    },
  },
  ru: {
    priceBelow: (percent) => `Цена предложения на ${percent}% ниже середины оценочного диапазона.`,
    priceNear: "Цена предложения близка к оценочному диапазону стоимости.",
    priceAbove: (percent, amount) => `Цена предложения на ${percent}% (${amount}) выше середины оценочного диапазона.`,
    intentFit: (score) => `Соответствие выбранной цели покупки: ${score}/10.`,
    negotiationRoom: (score) => `Данные указывают на возможность торга (${score}/100).`,
    dueDiligenceRisk: (score) => `До предложения нужно завершить важные проверки (${score}/100).`,
    unknownChecks: (count) => `Ещё не подтверждено важных пунктов: ${count}.`,
    renovationGap: (amount) => `Стоимость после ремонта может быть выше готовой альтернативы на ${amount}.`,
    lowConfidence: (score) => `Надёжность оценки ограничена (${score}/100).`,
    noMajorRisk: "В структурированных данных сейчас нет существенного предупреждения.",
    postureStrong: "Сильная позиция покупателя",
    postureModerate: "Умеренная возможность торга",
    postureLimited: "Возможность ограничена; опирайтесь на доказательства",
    comparableArgument: (low, high) => `Сопоставимые данные поддерживают диапазон ${low}-${high}.`,
    supplyArgument: "Изменение локального предложения может поддержать спокойное обсуждение цены.",
    historyArgument: "История объявления даёт основание спросить о прежних ценах и сроке экспозиции.",
    fairPriceArgument: (price) => `Оценочная середина составляет ${price}; это ориентир, а не гарантия.`,
    factsArgument: "Используйте подтверждённые параметры квартиры как основу разговора.",
    negotiationUnavailable:
      "Рыночных данных недостаточно, чтобы ответственно рассчитать ценовой сценарий.",
    scenarioConfidence: (score) => `Уверенность сценария: ${score}/100.`,
    argumentFairRange: (low, high, confidence) =>
      `Оценочный диапазон ${low}-${high} имеет уверенность ${confidence}/100.`,
    argumentAboveFair: (percent, amount) =>
      `Цена предложения на ${percent.toFixed(1)}% (${amount}) выше оценочной середины.`,
    argumentComparableSample: (count) => `В расчёте учтено сопоставимых предложений: ${count}.`,
    argumentLongExposure: (days, average) =>
      `Объявление активно ${days} дней при среднем значении по району ${average}.`,
    argumentPriceReductions: (count) => `Цена снижалась ${count} раз(а).`,
    argumentRelisted: "Объявление размещено повторно; проверьте прежнюю цену и срок экспозиции.",
    argumentSupplyGrowth: (percent) => `Местное предложение выросло на ${percent.toFixed(1)}% за 90 дней.`,
    actionCollectEvidence: "Соберите актуальные аналоги или данные о сделках.",
    actionVerifyHistory: "Уточните первую дату публикации и предыдущие цены.",
    actionCompareAlternatives: "Сравните минимум две актуальные альтернативы до предложения.",
    actionVerifyDocuments: "Проверьте собственника, обременения и документы дома до предложения.",
    actionConfirmCondition: "Подтвердите техническое состояние и стоимость ремонта на просмотре.",
    actionSubmitOffer: (price) => `Предложите условную стартовую цену ${price}.`,
    actionRespectCeiling: (price) => `Не повышайте сценарный максимум выше ${price} без новых данных.`,
    limitationFairConfidence: "Уверенность fair price ниже 50/100.",
    limitationSubjectQuality: "Данные об анализируемой квартире неполны.",
    limitationComparables: "Доступно меньше трёх сопоставимых предложений.",
    limitationTransactions: "Доступно меньше десяти наблюдений по сделкам.",
    limitationMarketEvidence: "Ни одна рыночная выборка не достигла минимального порога.",
    limitationUnknown: "Нужны дополнительные рыночные данные.",
    guardrailScenario: "Это сценарий торга, а не подтверждённая оценка или согласованная цена.",
    guardrailDeposit: "До задатка завершите проверку документов и технического состояния.",
    guardrailCeiling: "Повышайте максимум только при появлении новых подтверждающих данных.",
    guardrailNoAdvice: "Не рассчитывайте предложение по неполным данным.",
    guardrailCollectEvidence: "Сначала соберите рыночные данные, затем называйте цену.",
    exportTitle: "WartoMetr - краткое обоснование торга",
    exportStatusAvailable: "Статус: ценовой сценарий доступен",
    exportStatusUnavailable: "Статус: данных для ценового сценария недостаточно",
    exportEvidence: "Основания",
    exportActions: "Следующие шаги",
    openingScript: (price) =>
      `Начните с ${price} и объясните, что предложение основано на диапазоне стоимости и необходимых проверках.`,
    rangeScript: (low, high) => `Обсуждайте диапазон ${low}-${high}, а не только цену продавца.`,
    ceilingScript: (price) => `Не превышайте ${price}, пока документы и техническая проверка не улучшат картину риска.`,
    diligenceStrong: "Большинство ключевых вопросов ещё нужно подтвердить",
    diligenceMixed: "Часть ключевых вопросов нужно подтвердить",
    diligenceWeak: "Базовый объём проверки относительно полный",
    documentsSecondary: [
      "Земельно-ипотечный реестр",
      "Справка об отсутствии задолженности",
      "Расчёт платежей и ремонтного фонда",
      "Протоколы и планы ремонтов дома",
      "Энергетический сертификат",
    ],
    documentsPrimary: [
      "Информационный проспект с приложениями",
      "Разрешение на строительство и право на землю",
      "График эскроу-платежей",
      "Стандарт отделки",
      "Проект договора и порядок устранения дефектов",
    ],
    sellerQuestions: [
      "Что именно входит в цену?",
      "Каковы текущие ежемесячные платежи?",
      "Планируется ли крупный ремонт дома?",
      "Есть ли известные дефекты квартиры или дома?",
      "Когда можно получить полный комплект документов?",
    ],
    photoChecks: [
      "Окна и вид из каждой комнаты",
      "Кухня, ванная и коммуникации",
      "Углы, потолки и следы влаги",
      "Подъезд, фасад и общие зоны",
    ],
    buildingChecks: [
      "Вход, подъезд и общие зоны",
      "Признаки ремонта крыши, фасада или лифта",
      "Коммуникации, отопление и вентиляция",
      "Объявления сообщества о планируемых работах",
    ],
    surroundingsChecks: [
      "Шум при открытых и закрытых окнах",
      "Путь до общественного транспорта",
      "Парковка вечером",
      "Стройка и неудобства поблизости",
    ],
    postViewing: [
      "Оцените техническое состояние и ремонт",
      "Проверьте окна, шум и дневной свет",
      "Проверьте влажность, запах и вентиляцию",
      "Сравните состояние с объявлением",
      "Пересчитайте предельную цену после просмотра",
    ],
    watch: [
      "Сообщить об изменении цены",
      "Сообщить о более дешёвой альтернативе",
      "Сообщить о существенном изменении данных",
    ],
    watchFairRange: "Сообщить, когда цена войдёт в оценочный диапазон",
    acquisitionMortgage: "Платёж является сценарием с явными параметрами финансирования.",
    acquisitionPcc: "Сценарий вторичного рынка включает PCC 2%.",
    acquisitionNoPcc: "Сценарий первичного рынка не включает PCC; проверьте VAT и сборы застройщика.",
    acquisitionRenovation: (amount) => `Бюджет ремонта в сценарии: ${amount}.`,
    knownSource: (topic, source) => `${topic}: данные источника ${source}.`,
    estimatedSource: (topic, source) => `${topic}: расчёт на основе ${source}.`,
    sourceBasisObserved: "Данные зафиксированы зарегистрированным источником.",
    sourceBasisCalculated: "Значение рассчитано по доступным наблюдениям.",
    sourceBasisEstimated: "Модельная оценка; это не подтверждённая цена сделки.",
    sourceBasisUnknown: "Основа расчёта не подтверждена.",
    sourceNote: "Перед решением проверьте источник и актуальность данных.",
    disclaimer:
      "Результат поддерживает первичную оценку покупателя. Он не заменяет оценку, техническое обследование и юридическую, финансовую или налоговую консультацию.",
    renovationConditions: {
      ready_to_move_in: "готово к заселению",
      needs_refresh: "требует обновления",
      light_renovation: "лёгкий ремонт",
      full_renovation: "полный ремонт",
      custom_budget: "собственный бюджет",
    },
    budgetSources: {
      custom_budget: "бюджет покупателя",
      declared_condition: "заявленное состояние",
      condition_shell_developer_standard: "стандарт застройщика",
      market_type_primary_default: "допущение первичного рынка",
      listing_state_ready: "состояние из объявления",
      market_state_default: "рыночное допущение",
    },
    checklist: checklistRu(),
    checklistUnknown: "Дополнительный вопрос для проверки",
    sourceTopics: {
      comparables: "Сопоставимые объекты",
      area_supply: "Локальное предложение",
      listing_history: "История объявления",
      fair_price: "Оценочная стоимость",
      listing_facts: "Параметры объявления",
      area_statistics: "Локальный рынок",
      rental_estimate: "Арендный потенциал",
      future_area_impact: "Изменения района",
      due_diligence: "Объём проверки",
    },
  },
  uk: {
    priceBelow: (percent) => `Ціна пропозиції на ${percent}% нижча за середину оціночного діапазону.`,
    priceNear: "Ціна пропозиції близька до оціночного діапазону вартості.",
    priceAbove: (percent, amount) =>
      `Ціна пропозиції на ${percent}% (${amount}) вища за середину оціночного діапазону.`,
    intentFit: (score) => `Відповідність обраній меті купівлі: ${score}/10.`,
    negotiationRoom: (score) => `Дані вказують на можливість торгу (${score}/100).`,
    dueDiligenceRisk: (score) => `До пропозиції потрібно завершити важливі перевірки (${score}/100).`,
    unknownChecks: (count) => `Ще не підтверджено важливих пунктів: ${count}.`,
    renovationGap: (amount) => `Вартість після ремонту може перевищити готову альтернативу на ${amount}.`,
    lowConfidence: (score) => `Надійність оцінки обмежена (${score}/100).`,
    noMajorRisk: "У структурованих даних зараз немає суттєвого попередження.",
    postureStrong: "Сильна позиція покупця",
    postureModerate: "Помірна можливість торгу",
    postureLimited: "Можливість обмежена; спирайтеся на докази",
    comparableArgument: (low, high) => `Порівнювані дані підтримують діапазон ${low}-${high}.`,
    supplyArgument: "Зміна локальної пропозиції може підтримати спокійне обговорення ціни.",
    historyArgument: "Історія оголошення дає підставу запитати про попередні ціни та строк експозиції.",
    fairPriceArgument: (price) => `Оціночна середина становить ${price}; це орієнтир, а не гарантія.`,
    factsArgument: "Використовуйте підтверджені параметри квартири як основу розмови.",
    negotiationUnavailable:
      "Ринкових даних недостатньо, щоб відповідально розрахувати ціновий сценарій.",
    scenarioConfidence: (score) => `Впевненість сценарію: ${score}/100.`,
    argumentFairRange: (low, high, confidence) =>
      `Оціночний діапазон ${low}-${high} має впевненість ${confidence}/100.`,
    argumentAboveFair: (percent, amount) =>
      `Ціна пропозиції на ${percent.toFixed(1)}% (${amount}) вища за оціночну середину.`,
    argumentComparableSample: (count) => `У розрахунку враховано порівнюваних пропозицій: ${count}.`,
    argumentLongExposure: (days, average) =>
      `Оголошення активне ${days} днів за середнього значення в районі ${average}.`,
    argumentPriceReductions: (count) => `Ціну знижували ${count} раз(и).`,
    argumentRelisted: "Оголошення розміщене повторно; перевірте попередню ціну і строк експозиції.",
    argumentSupplyGrowth: (percent) => `Місцева пропозиція зросла на ${percent.toFixed(1)}% за 90 днів.`,
    actionCollectEvidence: "Зберіть актуальні аналоги або дані про угоди.",
    actionVerifyHistory: "Уточніть першу дату публікації та попередні ціни.",
    actionCompareAlternatives: "Порівняйте щонайменше дві актуальні альтернативи до пропозиції.",
    actionVerifyDocuments: "Перевірте власника, обтяження і документи будинку до пропозиції.",
    actionConfirmCondition: "Підтвердьте технічний стан і вартість ремонту під час перегляду.",
    actionSubmitOffer: (price) => `Запропонуйте умовну стартову ціну ${price}.`,
    actionRespectCeiling: (price) => `Не підвищуйте сценарну межу понад ${price} без нових даних.`,
    limitationFairConfidence: "Впевненість fair price нижча за 50/100.",
    limitationSubjectQuality: "Дані про аналізовану квартиру неповні.",
    limitationComparables: "Доступно менше трьох порівнюваних пропозицій.",
    limitationTransactions: "Доступно менше десяти спостережень за угодами.",
    limitationMarketEvidence: "Жодна ринкова вибірка не досягла мінімального порогу.",
    limitationUnknown: "Потрібні додаткові ринкові дані.",
    guardrailScenario: "Це сценарій торгу, а не підтверджена оцінка чи узгоджена ціна.",
    guardrailDeposit: "До завдатку завершіть перевірку документів і технічного стану.",
    guardrailCeiling: "Підвищуйте межу лише за наявності нових підтверджувальних даних.",
    guardrailNoAdvice: "Не розраховуйте пропозицію за неповними даними.",
    guardrailCollectEvidence: "Спочатку зберіть ринкові дані, потім називайте ціну.",
    exportTitle: "WartoMetr - коротке обґрунтування торгу",
    exportStatusAvailable: "Статус: ціновий сценарій доступний",
    exportStatusUnavailable: "Статус: даних для цінового сценарію недостатньо",
    exportEvidence: "Підстави",
    exportActions: "Наступні кроки",
    openingScript: (price) =>
      `Почніть з ${price} і поясніть, що пропозиція базується на діапазоні вартості та необхідних перевірках.`,
    rangeScript: (low, high) => `Обговорюйте діапазон ${low}-${high}, а не лише ціну продавця.`,
    ceilingScript: (price) =>
      `Не перевищуйте ${price}, доки документи й технічна перевірка не поліпшать картину ризику.`,
    diligenceStrong: "Більшість ключових питань ще треба підтвердити",
    diligenceMixed: "Частину ключових питань треба підтвердити",
    diligenceWeak: "Базовий обсяг перевірки відносно повний",
    documentsSecondary: [
      "Земельно-іпотечний реєстр",
      "Довідка про відсутність заборгованості",
      "Розрахунок платежів і ремонтного фонду",
      "Протоколи та плани ремонтів будинку",
      "Енергетичний сертифікат",
    ],
    documentsPrimary: [
      "Інформаційний проспект із додатками",
      "Дозвіл на будівництво і право на землю",
      "Графік ескроу-платежів",
      "Стандарт оздоблення",
      "Проєкт договору і порядок усунення дефектів",
    ],
    sellerQuestions: [
      "Що саме входить у ціну?",
      "Які поточні щомісячні платежі?",
      "Чи планується великий ремонт будинку?",
      "Чи є відомі дефекти квартири або будинку?",
      "Коли можна отримати повний комплект документів?",
    ],
    photoChecks: [
      "Вікна і вид з кожної кімнати",
      "Кухня, ванна і комунікації",
      "Кути, стелі та сліди вологи",
      "Під'їзд, фасад і спільні зони",
    ],
    buildingChecks: [
      "Вхід, під'їзд і спільні зони",
      "Ознаки ремонту даху, фасаду або ліфта",
      "Комунікації, опалення та вентиляція",
      "Оголошення спільноти про заплановані роботи",
    ],
    surroundingsChecks: [
      "Шум із відкритими та закритими вікнами",
      "Шлях до громадського транспорту",
      "Паркування ввечері",
      "Будівництво і незручності поблизу",
    ],
    postViewing: [
      "Оцініть технічний стан і ремонт",
      "Перевірте вікна, шум і денне світло",
      "Перевірте вологість, запах і вентиляцію",
      "Порівняйте стан з оголошенням",
      "Перерахуйте граничну ціну після огляду",
    ],
    watch: ["Повідомити про зміну ціни", "Повідомити про дешевшу альтернативу", "Повідомити про суттєву зміну даних"],
    watchFairRange: "Повідомити, коли ціна ввійде в оціночний діапазон",
    acquisitionMortgage: "Платіж є сценарієм із явними параметрами фінансування.",
    acquisitionPcc: "Сценарій вторинного ринку включає PCC 2%.",
    acquisitionNoPcc: "Сценарій первинного ринку не включає PCC; перевірте VAT і збори забудовника.",
    acquisitionRenovation: (amount) => `Бюджет ремонту в сценарії: ${amount}.`,
    knownSource: (topic, source) => `${topic}: дані джерела ${source}.`,
    estimatedSource: (topic, source) => `${topic}: розрахунок на основі ${source}.`,
    sourceBasisObserved: "Дані зафіксовані зареєстрованим джерелом.",
    sourceBasisCalculated: "Значення розраховане за доступними спостереженнями.",
    sourceBasisEstimated: "Модельна оцінка; це не підтверджена ціна угоди.",
    sourceBasisUnknown: "Основу розрахунку не підтверджено.",
    sourceNote: "Перед рішенням перевірте джерело й актуальність даних.",
    disclaimer:
      "Результат підтримує первинну оцінку покупця. Він не замінює оцінку, технічне обстеження та юридичну, фінансову чи податкову консультацію.",
    renovationConditions: {
      ready_to_move_in: "готове до заселення",
      needs_refresh: "потребує оновлення",
      light_renovation: "легкий ремонт",
      full_renovation: "повний ремонт",
      custom_budget: "власний бюджет",
    },
    budgetSources: {
      custom_budget: "бюджет покупця",
      declared_condition: "заявлений стан",
      condition_shell_developer_standard: "стандарт забудовника",
      market_type_primary_default: "припущення первинного ринку",
      listing_state_ready: "стан з оголошення",
      market_state_default: "ринкове припущення",
    },
    checklist: checklistUk(),
    checklistUnknown: "Додаткове питання для перевірки",
    sourceTopics: {
      comparables: "Порівнювані об'єкти",
      area_supply: "Локальна пропозиція",
      listing_history: "Історія оголошення",
      fair_price: "Оціночна вартість",
      listing_facts: "Параметри оголошення",
      area_statistics: "Локальний ринок",
      rental_estimate: "Орендний потенціал",
      future_area_impact: "Зміни району",
      due_diligence: "Обсяг перевірки",
    },
  },
};

function checklist(labels: string[]): Record<string, string> {
  return Object.fromEntries(CHECKLIST_CODES.map((code, index) => [code, labels[index]]));
}

function checklistPl() {
  return checklist([
    "Właściciel i uprawnienie sprzedającego",
    "Hipoteki, roszczenia i służebności",
    "Stan prawny gruntu",
    "Brak zadłużenia wobec wspólnoty",
    "Czynsz, media i fundusz remontowy",
    "Planowane remonty budynku",
    "Instalacje, ogrzewanie i wentylacja",
    "Świadectwo energetyczne",
    "Powierzchnia zgodna z dokumentami",
    "Zmiany układu i samowola budowlana",
    "Piętro i kontekst budynku",
    "Tożsamość dewelopera i spółki projektu",
    "Historia realizacji dewelopera",
    "Sygnały prawne i spory",
    "Rachunek powierniczy",
    "Pozwolenie i tytuł do gruntu",
    "Etap budowy i termin odbioru",
    "Dokładny standard wykończenia",
    "Prospekt informacyjny",
    "Kary za opóźnienie i prawo odstąpienia",
    "Gwarancje i procedura wad",
  ]);
}

function checklistEn() {
  return checklist([
    "Owner and seller authority",
    "Mortgages, claims and easements",
    "Land legal status",
    "No community arrears",
    "Service charges and repair fund",
    "Planned building repairs",
    "Installations, heating and ventilation",
    "Energy certificate",
    "Area matches documents",
    "Layout changes and unauthorized works",
    "Floor and building context",
    "Developer and project-company identity",
    "Developer delivery history",
    "Legal and dispute signals",
    "Escrow account",
    "Permit and land title",
    "Construction stage and handover",
    "Exact finish specification",
    "Information prospectus",
    "Delay penalties and withdrawal rights",
    "Warranties and defect procedure",
  ]);
}

function checklistRu() {
  return checklist([
    "Владелец и полномочия продавца",
    "Ипотеки, требования и сервитуты",
    "Правовой статус земли",
    "Отсутствие долгов перед сообществом",
    "Платежи и ремонтный фонд",
    "Планируемый ремонт дома",
    "Коммуникации, отопление и вентиляция",
    "Энергетический сертификат",
    "Площадь соответствует документам",
    "Перепланировки и самовольные работы",
    "Этаж и характеристики дома",
    "Застройщик и проектная компания",
    "История проектов застройщика",
    "Юридические сигналы и споры",
    "Эскроу-счёт",
    "Разрешение и право на землю",
    "Этап строительства и передача",
    "Точный стандарт отделки",
    "Информационный проспект",
    "Штрафы за задержку и право отказа",
    "Гарантии и устранение дефектов",
  ]);
}

function checklistUk() {
  return checklist([
    "Власник і повноваження продавця",
    "Іпотеки, вимоги та сервітути",
    "Правовий статус землі",
    "Відсутність боргів перед спільнотою",
    "Платежі та ремонтний фонд",
    "Запланований ремонт будинку",
    "Комунікації, опалення та вентиляція",
    "Енергетичний сертифікат",
    "Площа відповідає документам",
    "Перепланування і самовільні роботи",
    "Поверх і характеристики будинку",
    "Забудовник і проєктна компанія",
    "Історія проєктів забудовника",
    "Юридичні сигнали та спори",
    "Ескроу-рахунок",
    "Дозвіл і право на землю",
    "Етап будівництва і передача",
    "Точний стандарт оздоблення",
    "Інформаційний проспект",
    "Штрафи за затримку і право відмови",
    "Гарантії та усунення дефектів",
  ]);
}

export type LocalizedBuyerDecision = {
  reasons: string[];
  risks: string[];
  unknowns: string[];
  negotiationPosture: string;
  negotiationAvailable: boolean;
  negotiationStatus: string;
  negotiationConfidence: string;
  negotiationLimitations: string[];
  negotiationArguments: Array<{
    key: string;
    text: string;
    evidence: BuyerDecisionPackage["negotiation"]["argument_evidence"];
  }>;
  negotiationActions: string[];
  negotiationGuardrails: string[];
  negotiationBrief: string;
  diligenceLabel: string;
  documents: string[];
  sellerQuestions: string[];
  totalNotes: string[];
  known: string[];
  estimated: string[];
  couldNotVerify: string[];
  photos: string[];
  buildingChecks: string[];
  surroundingsChecks: string[];
  postViewing: string[];
  watchTriggers: string[];
  disclaimer: string;
  renovationCondition: string | null;
  budgetSource: string;
};

export function localizeBuyerDecision(
  decision: BuyerDecisionPackage,
  locale: Locale,
  confidenceScore?: number | null,
): LocalizedBuyerDecision {
  const c = CATALOG[locale];
  const verdict = decision.verdict;
  const delta = verdict.price_delta_to_fair_mid_pct;
  const unknownItems = decision.due_diligence.checklist.filter(
    (item) => item.status === "unknown" || item.status === "verify_required",
  );
  const unknowns = unknownItems.slice(0, 6).map((item) => checklistLabel(c, item));
  const reasons = [delta <= -2 ? c.priceBelow(Math.abs(delta).toFixed(1)) : c.priceNear];
  if ((decision.selected_intent_fit?.score ?? 0) >= 65)
    reasons.push(c.intentFit(Math.round((decision.selected_intent_fit?.score ?? 0) / 10)));
  if (decision.negotiation.negotiation_score >= 60)
    reasons.push(c.negotiationRoom(decision.negotiation.negotiation_score));
  const risks: string[] = [];
  if (delta >= 5) risks.push(c.priceAbove(delta.toFixed(1), money(Math.max(verdict.overpricing_pln, 0), locale)));
  if (decision.due_diligence.score < 60) risks.push(c.dueDiligenceRisk(decision.due_diligence.score));
  if (unknownItems.length > 0) risks.push(c.unknownChecks(unknownItems.length));
  if ((decision.total_acquisition.post_renovation_value_gap_pln ?? 0) > 0)
    risks.push(c.renovationGap(money(decision.total_acquisition.post_renovation_value_gap_pln ?? 0, locale)));
  if (confidenceScore !== null && confidenceScore !== undefined && confidenceScore < 50)
    risks.push(c.lowConfidence(confidenceScore));
  if (risks.length === 0) risks.push(c.noMajorRisk);
  const evidenceById = new Map(decision.negotiation.argument_evidence.map((item) => [item.id, item]));
  const negotiationArguments: LocalizedBuyerDecision["negotiationArguments"] = decision.negotiation.arguments.map(
    (item, index) => ({
      key: `${item.code}-${index}`,
      text: negotiationArgument(c, item, locale),
      evidence: item.evidence_refs.flatMap((reference) => {
        const evidence = evidenceById.get(reference);
        return evidence ? [evidence] : [];
      }),
    }),
  );
  const negotiationActions = decision.negotiation.next_actions.map((item) => negotiationAction(c, item, locale));
  const negotiationLimitations = decision.negotiation.limitation_codes.map((code) => negotiationLimitation(c, code));
  const negotiationGuardrails = decision.negotiation.guardrail_codes.map((code) => negotiationGuardrail(c, code));
  const negotiationAvailable = decision.negotiation.scenario_status === "available";
  const negotiationConfidence = c.scenarioConfidence(decision.negotiation.scenario_confidence_score);
  const negotiationBrief = [
    c.exportTitle,
    negotiationAvailable ? c.exportStatusAvailable : c.exportStatusUnavailable,
    negotiationConfidence,
    ...(negotiationArguments.length > 0
      ? [
          "",
          `${c.exportEvidence}:`,
          ...negotiationArguments.map((item) => {
            const sources = item.evidence.map((evidence) => evidence.source_name).join(", ");
            return sources
              ? `- ${item.text} (${c.exportEvidence}: ${sources})`
              : `- ${item.text}`;
          }),
        ]
      : []),
    "",
    `${c.exportActions}:`,
    ...negotiationActions.map((item) => `- ${item}`),
    "",
    ...negotiationGuardrails.map((item) => `- ${item}`),
  ].join("\n");
  const sourceRows = decision.knowledge.source_evidence.map((source) => {
    const topic = sourceTopic(c, source.topic);
    return source.calculation_type === "observed"
      ? c.knownSource(topic, source.source_name)
      : c.estimatedSource(topic, source.source_name);
  });
  const totalNotes = [
    c.acquisitionMortgage,
    decision.due_diligence.market_type === "secondary" ? c.acquisitionPcc : c.acquisitionNoPcc,
  ];
  if (decision.total_acquisition.renovation_estimate_pln > 0)
    totalNotes.push(c.acquisitionRenovation(money(decision.total_acquisition.renovation_estimate_pln, locale)));
  return {
    reasons: reasons.slice(0, 3),
    risks: risks.slice(0, 4),
    unknowns,
    negotiationAvailable,
    negotiationStatus: negotiationAvailable ? c.exportStatusAvailable : c.negotiationUnavailable,
    negotiationConfidence,
    negotiationLimitations,
    negotiationPosture:
      decision.negotiation.posture === "unavailable"
        ? c.negotiationUnavailable
        : decision.negotiation.posture === "strong"
        ? c.postureStrong
        : decision.negotiation.posture === "moderate" || decision.negotiation.posture === "price_only"
          ? c.postureModerate
          : c.postureLimited,
    negotiationArguments,
    negotiationActions,
    negotiationGuardrails,
    negotiationBrief,
    diligenceLabel:
      decision.due_diligence.score < 45
        ? c.diligenceStrong
        : decision.due_diligence.score < 75
          ? c.diligenceMixed
          : c.diligenceWeak,
    documents: decision.due_diligence.market_type === "secondary" ? c.documentsSecondary : c.documentsPrimary,
    sellerQuestions: c.sellerQuestions,
    totalNotes,
    known: sourceRows
      .filter((_, index) => decision.knowledge.source_evidence[index]?.calculation_type === "observed")
      .slice(0, 4),
    estimated: sourceRows
      .filter((_, index) => decision.knowledge.source_evidence[index]?.calculation_type !== "observed")
      .slice(0, 4),
    couldNotVerify: unknowns.slice(0, 5),
    photos: c.photoChecks,
    buildingChecks: c.buildingChecks,
    surroundingsChecks: c.surroundingsChecks,
    postViewing: c.postViewing,
    watchTriggers: [...c.watch, ...(delta > 0 ? [c.watchFairRange] : [])],
    disclaimer: c.disclaimer,
    renovationCondition: decision.total_acquisition.renovation_condition
      ? (c.renovationConditions[decision.total_acquisition.renovation_condition] ?? null)
      : null,
    budgetSource:
      c.budgetSources[decision.total_acquisition.renovation_budget_source] ?? c.budgetSources.market_state_default,
  };
}

export function localizedSourceEvidence(source: BuyerSourceEvidence, locale: Locale) {
  const c = CATALOG[locale];
  const basis =
    source.calculation_type === "observed"
      ? c.sourceBasisObserved
      : source.calculation_type === "calculated"
        ? c.sourceBasisCalculated
        : source.calculation_type === "model_estimate"
          ? c.sourceBasisEstimated
          : c.sourceBasisUnknown;
  return { topic: sourceTopic(c, source.topic), basis, note: c.sourceNote };
}

function checklistLabel(c: MessageCatalog, item: DueDiligenceChecklistItem) {
  return c.checklist[item.code] ?? c.checklistUnknown;
}

function sourceTopic(c: MessageCatalog, topic: string) {
  return c.sourceTopics[topic] ?? c.sourceTopics.listing_facts;
}

function negotiationArgument(
  c: MessageCatalog,
  argument: BuyerDecisionPackage["negotiation"]["arguments"][number],
  locale: Locale,
) {
  const p = argument.params;
  const low = numberParam(p.low_pln);
  const high = numberParam(p.high_pln);
  const confidence = numberParam(p.confidence_score);
  if (argument.code === "fair_value_range" && low !== null && high !== null && confidence !== null)
    return c.argumentFairRange(money(low, locale), money(high, locale), confidence);
  const deltaPct = numberParam(p.delta_pct);
  const deltaPln = numberParam(p.delta_pln);
  if (argument.code === "asking_above_fair_mid" && deltaPct !== null && deltaPln !== null)
    return c.argumentAboveFair(deltaPct, money(deltaPln, locale));
  const sampleSize = numberParam(p.sample_size);
  if (argument.code === "comparable_sample" && sampleSize !== null)
    return c.argumentComparableSample(sampleSize);
  const days = numberParam(p.days_on_market);
  const averageDays = numberParam(p.area_average_days);
  if (argument.code === "long_market_exposure" && days !== null && averageDays !== null)
    return c.argumentLongExposure(days, averageDays);
  const reductions = numberParam(p.count);
  if (argument.code === "price_reductions" && reductions !== null)
    return c.argumentPriceReductions(reductions);
  if (argument.code === "relisted") return c.argumentRelisted;
  const supplyChange = numberParam(p.change_pct);
  if (argument.code === "area_supply_growth" && supplyChange !== null)
    return c.argumentSupplyGrowth(supplyChange);
  return c.factsArgument;
}

function negotiationAction(
  c: MessageCatalog,
  action: BuyerDecisionPackage["negotiation"]["next_actions"][number],
  locale: Locale,
) {
  if (action.code === "collect_market_evidence") return c.actionCollectEvidence;
  if (action.code === "verify_listing_history") return c.actionVerifyHistory;
  if (action.code === "compare_alternatives") return c.actionCompareAlternatives;
  if (action.code === "verify_documents_before_offer") return c.actionVerifyDocuments;
  if (action.code === "confirm_condition_and_costs") return c.actionConfirmCondition;
  const openingOffer = numberParam(action.params.opening_offer_pln);
  if (action.code === "submit_conditional_offer" && openingOffer !== null)
    return c.actionSubmitOffer(money(openingOffer, locale));
  const maxOffer = numberParam(action.params.max_offer_pln);
  if (action.code === "compare_before_raising_ceiling" && maxOffer !== null)
    return c.actionRespectCeiling(money(maxOffer, locale));
  return c.actionCollectEvidence;
}

function negotiationLimitation(c: MessageCatalog, code: string) {
  if (code === "fair_price_confidence_low") return c.limitationFairConfidence;
  if (code === "subject_data_quality_low") return c.limitationSubjectQuality;
  if (code === "comparable_sample_below_minimum") return c.limitationComparables;
  if (code === "transaction_sample_below_minimum") return c.limitationTransactions;
  if (code === "market_evidence_insufficient") return c.limitationMarketEvidence;
  return c.limitationUnknown;
}

function negotiationGuardrail(c: MessageCatalog, code: string) {
  if (code === "scenario_not_valuation") return c.guardrailScenario;
  if (code === "verify_before_deposit") return c.guardrailDeposit;
  if (code === "do_not_exceed_without_new_evidence") return c.guardrailCeiling;
  if (code === "no_price_advice_insufficient_data") return c.guardrailNoAdvice;
  if (code === "collect_evidence_before_offer") return c.guardrailCollectEvidence;
  return c.guardrailScenario;
}

function numberParam(value: string | number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
