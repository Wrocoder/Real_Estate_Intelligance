export type SeoArea = {
  areaId: string;
  slug: string;
  name: string;
  city: string;
  district: string;
  title: string;
  description: string;
  medianPricePerM2: number;
  averagePricePerM2: number;
  activeListings: number;
  averageDaysOnMarket: number;
  priceChange90dPct: number;
  supplyChange90dPct: number;
  buyerFit: string[];
  investorFit: string[];
  risks: string[];
  plannedInvestments: string[];
  internalLinks: Array<{ href: string; label: string }>;
};

export const SEO_AREAS: SeoArea[] = [
  {
    areaId: "wroclaw-fabryczna",
    slug: "wroclaw-fabryczna",
    name: "Fabryczna",
    city: "Wrocław",
    district: "Fabryczna",
    title: "Mieszkania we Wrocławiu Fabryczna: ceny, ryzyka i potencjał dzielnicy",
    description:
      "Analiza Fabrycznej we Wrocławiu: mediana ceny za m2, podaż, płynność, plany transportowe i czynniki ryzyka przed zakupem mieszkania.",
    medianPricePerM2: 11800,
    averagePricePerM2: 12150,
    activeListings: 691,
    averageDaysOnMarket: 84,
    priceChange90dPct: 0.9,
    supplyChange90dPct: 8.1,
    buyerFit: [
      "Dobry wybór dla kupujących, którym zależy na niższej cenie niż w centralnych dzielnicach.",
      "Może pasować rodzinom, jeśli konkretne mieszkanie ma blisko szkołę i transport publiczny.",
      "Warto porównywać tu mieszkania trzypokojowe w budżecie poniżej dzielnic premium.",
    ],
    investorFit: [
      "Potencjał zależy od transportu i jakości konkretnej ulicy.",
      "Najlepiej wyglądają mieszkania blisko przystanków i z niskim poziomem ryzyka.",
      "Rosnąca podaż wymaga dyscypliny cenowej i dobrej pozycji negocjacyjnej.",
    ],
    risks: [
      "Dzielnica jest zróżnicowana, więc średnia cena nie zastępuje sprawdzenia konkretnej ulicy.",
      "Wzrost podaży w ostatnich 90 dniach może zwiększać konkurencję między sprzedającymi.",
      "Dla części mieszkań trzeba osobno sprawdzić odległość od stref przemysłowych i dużych dróg.",
    ],
    plannedInvestments: [
      "Brak potwierdzonej inwestycji przypiętej do tej dzielnicy w aktualnej publicznej warstwie WartoMetr.",
      "Przed zakupem sprawdź Biuletyn Informacji Publicznej miasta i najnowsze komunikaty transportowe dla konkretnej ulicy.",
    ],
    internalLinks: [
      { href: "/?district=Fabryczna", label: "Zobacz mieszkania w Fabrycznej" },
      { href: "/compare", label: "Porównaj mieszkania" },
      { href: "/check", label: "Sprawdź konkretne mieszkanie" },
    ],
  },
  {
    areaId: "wroclaw-krzyki",
    slug: "wroclaw-krzyki",
    name: "Krzyki",
    city: "Wrocław",
    district: "Krzyki",
    title: "Mieszkania we Wrocławiu Krzyki: cena za m2 i analiza dzielnicy",
    description:
      "Przegląd Krzyków we Wrocławiu: ceny, dynamika rynku, infrastruktura, planowane inwestycje i ryzyka przepłacenia.",
    medianPricePerM2: 13200,
    averagePricePerM2: 13750,
    activeListings: 842,
    averageDaysOnMarket: 78,
    priceChange90dPct: 1.8,
    supplyChange90dPct: 5.6,
    buyerFit: [
      "Dobry wybór dla kupujących, którzy chcą rozwiniętej infrastruktury i dużego wyboru mieszkań.",
      "Trzeba dokładnie porównywać cenę za m2, bo dzielnica jest droższa od wielu alternatyw.",
      "Na rynku pierwotnym szczególnie ważne jest sprawdzenie terminów obiecywanej infrastruktury.",
    ],
    investorFit: [
      "Dzielnica może być dobra pod najem przy mocnej dostępności transportowej.",
      "Mieszkania z wysoką ceną za m2 wymagają uzasadnienia jakością budynku i lokalizacji.",
      "Warto szukać dobrej płynności, nie tylko wysokiego potencjału inwestycyjnego.",
    ],
    risks: [
      "Ryzyko przepłacenia rośnie, jeśli cena jest wyraźnie powyżej mediany dzielnicy.",
      "Nowe projekty mogą konkurować ze sobą przy najmie i odsprzedaży.",
      "Poszczególne części dzielnicy różnią się transportem i infrastrukturą społeczną.",
    ],
    plannedInvestments: [
      "Brak potwierdzonej inwestycji przypiętej do tej dzielnicy w aktualnej publicznej warstwie WartoMetr.",
      "Przed zakupem sprawdź Biuletyn Informacji Publicznej miasta i najnowsze komunikaty transportowe dla konkretnej ulicy.",
    ],
    internalLinks: [
      { href: "/?district=Krzyki", label: "Zobacz mieszkania na Krzykach" },
      { href: "/check/drafts", label: "Moje mieszkania" },
      { href: "/alerts", label: "Śledź podobne mieszkania" },
    ],
  },
  {
    areaId: "wroclaw-psie-pole",
    slug: "wroclaw-psie-pole",
    name: "Psie Pole",
    city: "Wrocław",
    district: "Psie Pole",
    title: "Mieszkania we Wrocławiu Psie Pole: rynek, płynność i ryzyka",
    description:
      "Praktyczna analiza Psiego Pola: cena za m2, podaż, średni czas ekspozycji, infrastruktura i ryzyka dla rodziny lub inwestora.",
    medianPricePerM2: 11250,
    averagePricePerM2: 11640,
    activeListings: 514,
    averageDaysOnMarket: 92,
    priceChange90dPct: 2.4,
    supplyChange90dPct: 3.2,
    buyerFit: [
      "Dobry wybór dla kupujących, którym zależy na większym metrażu, zieleni i niższej cenie za m2.",
      "Rodziny powinny sprawdzać szkoły, transport i czas do centrum dla konkretnego adresu.",
      "Mieszkania czteropokojowe mogą być ciekawe, jeśli oferta nie jest zbyt długo na rynku.",
    ],
    investorFit: [
      "Potencjał może być wyższy przy mieszkaniach blisko usług i zieleni.",
      "Płynność trzeba sprawdzać szczególnie uważnie, bo średni czas ekspozycji jest wyższy niż w części dzielnic.",
      "Dobra pozycja negocjacyjna pojawia się przy długiej ekspozycji i obniżkach ceny.",
    ],
    risks: [
      "Średni czas na rynku jest wyższy, co może oznaczać wolniejszą płynność.",
      "Dla najmu kluczowy jest transport, inaczej popyt może być słabszy.",
      "Trzeba osobno sprawdzić bliskość kolei, stref przemysłowych i hałaśliwych tras.",
    ],
    plannedInvestments: [
      "Brak potwierdzonej inwestycji przypiętej do tej dzielnicy w aktualnej publicznej warstwie WartoMetr.",
      "Przed zakupem sprawdź Biuletyn Informacji Publicznej miasta i najnowsze komunikaty transportowe dla konkretnej ulicy.",
    ],
    internalLinks: [
      { href: "/?district=Psie Pole", label: "Zobacz mieszkania na Psim Polu" },
      { href: "/compare", label: "Porównaj mieszkania rodzinne" },
      { href: "/check", label: "Sprawdź konkretne mieszkanie" },
    ],
  },
];

export function getSeoArea(slug: string) {
  return SEO_AREAS.find((area) => area.slug === slug) ?? null;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}
