export type SeoGuideLink = {
  href: string;
  label: string;
};

export type SeoGuideSection = {
  heading: string;
  body: string;
  bullets: string[];
};

export type SeoGuide = {
  slug: string;
  category: string;
  title: string;
  description: string;
  heroSummary: string;
  keyTakeaways: string[];
  sections: SeoGuideSection[];
  relatedAreaSlugs: string[];
  internalLinks: SeoGuideLink[];
};

export const SEO_GUIDES: SeoGuide[] = [
  {
    slug: "wroclaw-price-per-m2",
    category: "Rynek",
    title: "Cena za m2 we Wrocławiu: jak czytać cenę mieszkania przed zakupem",
    description:
      "Praktyczny przewodnik po cenie za m2 we Wrocławiu: mediana, kontekst dzielnicy, porównanie podobnych mieszkań i sygnały przepłacenia.",
    heroSummary:
      "Cena za m2 jest dobrym pierwszym filtrem, ale decyzja o zakupie wymaga porównania z podobnymi mieszkaniami, historią ceny, stanem budynku i lokalizacją.",
    keyTakeaways: [
      "Porównuj mieszkanie z podobnymi ofertami w dzielnicy i promieniu 1-2 km, nie z całym miastem.",
      "Wyższa cena nie zawsze oznacza przepłacenie: piętro, budynek, wykończenie i transport mogą uzasadniać premię.",
      "Domarion pokazuje szacowany zakres ceny i poziom pewności, żeby nie opierać decyzji na jednej średniej.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/areas", label: "Dzielnice Wrocławia" },
      { href: "/areas/compare", label: "Porównaj dzielnice" },
      { href: "/check", label: "Sprawdź mieszkanie" },
      { href: "/pricing", label: "Zamów raport" },
    ],
    sections: [
      {
        heading: "Co pokazuje cena za m2",
        body:
          "Cena za m2 ułatwia porównanie różnych metraży, ale nie pokazuje jakości budynku, dokładnej ulicy, płynności, ryzyk prawnych ani przyszłej infrastruktury.",
        bullets: [
          "Używaj mediany jako punktu odniesienia, nie jako ostatecznej odpowiedzi.",
          "Sprawdzaj różnicę względem podobnych mieszkań o zbliżonej powierzchni, liczbie pokoi i lokalizacji.",
          "Weryfikuj, czy wyższa cena wynika z faktów, a nie wyłącznie z opisu sprzedającego.",
        ],
      },
      {
        heading: "Kiedy cena wygląda ryzykownie",
        body:
          "Ryzyko rośnie, gdy mieszkanie jest wyraźnie droższe od lokalnego rynku, długo pozostaje w sprzedaży, ma słaby transport albo wymaga kosztownego remontu.",
        bullets: [
          "Premia cenowa powinna mieć konkretne uzasadnienie.",
          "Długa ekspozycja i obniżki ceny wzmacniają pozycję negocjacyjną kupującego.",
          "Mała liczba podobnych ofert powinna obniżać pewność analizy.",
        ],
      },
    ],
  },
  {
    slug: "best-districts-wroclaw",
    category: "Dzielnice",
    title: "Najlepsze dzielnice Wrocławia do zakupu mieszkania",
    description:
      "Jak porównywać dzielnice Wrocławia pod kątem życia, rodziny, najmu i odsprzedaży: cena, transport, szkoły, płynność i ryzyka.",
    heroSummary:
      "Najlepsza dzielnica zależy od celu zakupu. Inaczej oceniasz mieszkanie dla rodziny, inaczej pod najem, a inaczej pod późniejszą odsprzedaż.",
    keyTakeaways: [
      "Dla rodziny kluczowe są szkoły, transport, zieleń i codzienna logistyka.",
      "Dla inwestora ważne są najem, płynność i cena wejścia.",
      "Przy pierwszym mieszkaniu unikaj sytuacji, w której niska cena maskuje słabą infrastrukturę.",
    ],
    relatedAreaSlugs: ["wroclaw-krzyki", "wroclaw-fabryczna", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/areas/compare", label: "Porównaj dzielnice" },
      { href: "/areas/wroclaw-krzyki", label: "Krzyki" },
      { href: "/areas/wroclaw-fabryczna", label: "Fabryczna" },
      { href: "/areas/wroclaw-psie-pole", label: "Psie Pole" },
    ],
    sections: [
      {
        heading: "Jak wybierać dzielnicę",
        body:
          "Zacznij od celu zakupu, a dopiero potem porównuj cenę, infrastrukturę, płynność i ryzyka dla konkretnego typu mieszkania.",
        bullets: [
          "Do mieszkania dla siebie potrzebujesz oceny ulicy, nie tylko nazwy dzielnicy.",
          "Pod najem liczą się realny popyt i płynność wyjścia z inwestycji.",
          "Dla budżetu ważne jest, czy niższa cena nie oznacza większych kompromisów.",
        ],
      },
      {
        heading: "Co powinien pokazać raport",
        body:
          "Dobry raport dzielnicy pokazuje punkt odniesienia cenowy, aktywną podaż, planowane zmiany i ryzyka blisko konkretnego mieszkania.",
        bullets: [
          "Porównaj mieszkanie z medianą i podobnymi ofertami.",
          "Sprawdź transport, szkoły, parki, drogi i strefy przemysłowe.",
          "Zobacz, czy podaż nie rośnie szybciej niż popyt.",
        ],
      },
    ],
  },
  {
    slug: "where-to-buy-near-wroclaw",
    category: "Okolice miasta",
    title: "Gdzie kupić mieszkanie w okolicach Wrocławia",
    description:
      "Przewodnik po zakupie mieszkania pod Wrocławiem: Kobierzyce, Wysoka, Bielany Wrocławskie, Oława i sąsiednie rynki.",
    heroSummary:
      "Okolice miasta mogą dać większy metraż za tę samą cenę, ale wymagają twardej weryfikacji transportu, szkół, dróg i płynności odsprzedaży.",
    keyTakeaways: [
      "Porównuj nie tylko cenę, ale też codzienny czas do pracy, szkoły i usług.",
      "Poza miastem szczególnie ważne są transport i planowane zmiany drogowe.",
      "Jeśli podobnych mieszkań jest mało, raport powinien jasno pokazać ograniczoną pewność danych.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki"],
    internalLinks: [
      { href: "/check", label: "Sprawdź mieszkanie pod miastem" },
      { href: "/?municipality=Kobierzyce", label: "Zobacz mieszkania w gminie Kobierzyce" },
      { href: "/guides/dolnoslaskie-market-analysis", label: "Rynek Dolnego Śląska" },
      { href: "/check", label: "Pełna analiza mieszkania" },
    ],
    sections: [
      {
        heading: "Co daje lokalizacja pod miastem",
        body:
          "Mocną stroną okolic Wrocławia jest metraż i cena wejścia. Słabszą stroną bywa zależność od transportu, dróg, szkół i realnej płynności.",
        bullets: [
          "Sprawdź, ile podobnych mieszkań faktycznie sprzedaje się w pobliżu.",
          "Zobacz, czy adres działa jak część rynku Wrocławia, czy jak osobny lokalny rynek.",
          "Nie przenoś mediany Wrocławia bez korekty na miejscowości pod miastem.",
        ],
      },
      {
        heading: "Kiedy okolice miasta są ryzykowne",
        body:
          "Ryzyko rośnie przy słabym transporcie publicznym, braku szkół, zależności od jednej drogi albo dużej liczbie nowych ofert.",
        bullets: [
          "Sprawdź odległość do przystanku i głównych dróg.",
          "Zweryfikuj planowane drogi, tramwaje lub linie autobusowe oraz terminy.",
          "Porównaj najem i odsprzedaż z alternatywami w mieście.",
        ],
      },
    ],
  },
  {
    slug: "district-comparison-wroclaw",
    category: "Dzielnice",
    title: "Porównanie dzielnic Wrocławia: jak wybrać między kilkoma lokalizacjami",
    description:
      "Metoda porównywania dzielnic Wrocławia po cenie, podaży, płynności, potencjale wzrostu i pozycji negocjacyjnej kupującego.",
    heroSummary:
      "Porównanie dzielnic jest przydatne, gdy budżet pasuje do kilku lokalizacji. Sama średnia cena nie wystarczy.",
    keyTakeaways: [
      "Porównuj dzielnice dla tego samego typu mieszkania i podobnego budżetu.",
      "Sygnały rynku kupującego i sprzedającego pomagają ocenić negocjacje.",
      "Tańsza dzielnica może być gorszym wyborem, jeśli ma słabą płynność i infrastrukturę.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/areas/compare", label: "Porównaj dzielnice" },
      { href: "/compare", label: "Porównaj konkretne mieszkania" },
      { href: "/check/drafts", label: "Moje mieszkania" },
      { href: "/guides/best-districts-wroclaw", label: "Najlepsze dzielnice" },
    ],
    sections: [
      {
        heading: "Jak porównywać uczciwie",
        body:
          "Ustal jeden scenariusz, na przykład trzy pokoje, zakup rodzinny, określony budżet i dobry dojazd do transportu.",
        bullets: [
          "Porównaj medianę ceny za m2 i aktywną podaż.",
          "Porównaj średni czas ekspozycji i zmianę podaży.",
          "Porównaj planowane zmiany i ryzyka w najbliższej okolicy.",
        ],
      },
      {
        heading: "Jak używać wyniku",
        body:
          "Wynik powinien pomóc wybrać krótką listę dzielnic i przygotować pytania na oglądanie konkretnych mieszkań.",
        bullets: [
          "Jeśli dzielnica jest droższa, znajdź konkretne powody premii cenowej.",
          "Jeśli dzielnica jest tańsza, sprawdź, czy nie kupujesz słabej płynności.",
          "Dla kupującego to sposób na zobaczenie kompromisów przed wizytą.",
        ],
      },
    ],
  },
  {
    slug: "flats-with-growth-potential",
    category: "Inwestycja",
    title: "Mieszkania z potencjałem wzrostu: jak nie pomylić potencjału z ryzykiem",
    description:
      "Jak szukać mieszkań z potencjałem wzrostu we Wrocławiu: przyszła infrastruktura, cena względem rynku, płynność i ryzyko przepłacenia.",
    heroSummary:
      "Potencjał wzrostu nie oznacza automatycznie okazji. Dobry kandydat łączy rozsądną cenę, jasny czynnik rozwoju, płynność i brak krytycznych ryzyk.",
    keyTakeaways: [
      "Szukaj potwierdzonych miejskich inwestycji, nie tylko obietnic w opisie.",
      "Niska cena może być sygnałem ryzyka, jeśli budynek lub lokalizacja są słabe.",
      "Raport powinien oddzielać hipotezę wzrostu od gwarancji finansowej.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/?mode=hidden_gems", label: "Znajdź mocne okazje" },
      { href: "/alerts", label: "Śledź warianty inwestycyjne" },
      { href: "/guides/wroclaw-price-per-m2", label: "Cena za m2" },
      { href: "/check", label: "Sprawdź wariant inwestycyjny" },
    ],
    sections: [
      {
        heading: "Co jest czynnikiem wzrostu",
        body:
          "Czynnikiem wzrostu jest zmiana, która może poprawić popyt lub płynność: transport, szkoła, park, miejsca pracy albo inwestycja miejska.",
        bullets: [
          "Sprawdź źródło planowanej inwestycji i termin realizacji.",
          "Oceń zasięg wpływu: 500 m, 1 km, 2 km lub 5 km.",
          "Sprawdź, czy ten czynnik nie jest już wliczony w cenę.",
        ],
      },
      {
        heading: "Jak uniknąć pułapki",
        body:
          "Słabe mieszkanie w słabym budynku nie staje się automatycznie dobrą inwestycją tylko dlatego, że w okolicy jest przyszły projekt.",
        bullets: [
          "Patrz na ryzyko i płynność razem z potencjałem inwestycyjnym.",
          "Sprawdzaj konkurencyjną podaż nowych projektów.",
          "Nie traktuj hipotezy wzrostu jak gwarancji zwrotu.",
        ],
      },
    ],
  },
  {
    slug: "dolnoslaskie-market-analysis",
    category: "Rynek",
    title: "Analiza rynku nieruchomości na Dolnym Śląsku: co sprawdzić przed zakupem",
    description:
      "Przewodnik po analizie rynku na Dolnym Śląsku: Wrocław, okolice miasta, podaż, popyt, historia cen, płynność i jakość danych.",
    heroSummary:
      "Dolnego Śląska nie da się oceniać jedną średnią ceną. Wrocław, okolice miasta i sąsiednie miejscowości mają różne czynniki ceny, transportu i płynności.",
    keyTakeaways: [
      "Oddzielaj dzielnice miejskie, okolice miasta i samodzielne lokalne rynki.",
      "Sprawdzaj zmianę podaży, aktywne ogłoszenia i średni czas ekspozycji.",
      "W miejscach z małą liczbą podobnych ofert pokazuj niższą pewność analizy.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/market", label: "Przegląd rynku" },
      { href: "/areas", label: "Dzielnice" },
      { href: "/guides/where-to-buy-near-wroclaw", label: "Gdzie kupić pod Wrocławiem" },
      { href: "/areas", label: "Dane dzielnic" },
    ],
    sections: [
      {
        heading: "Jakie dane są ważne",
        body:
          "Do analizy regionalnej potrzebujesz ceny za m2, aktywnej podaży, nowych i zdjętych ogłoszeń, czasu ekspozycji oraz struktury po pokojach i metrażu.",
        bullets: [
          "Patrz na dynamikę, nie tylko na bieżący poziom ceny.",
          "Porównuj rynki tylko w podobnej geografii.",
          "Oznaczaj miejsca z niską pewnością i małą liczbą podobnych mieszkań.",
        ],
      },
      {
        heading: "Jak zacząć",
        body:
          "Na pierwszym etapie wystarczy Wrocław, najbliższe okolice i uczciwe ostrzeżenia tam, gdzie danych jest mało.",
        bullets: [
          "Łącz dane partnerskie i otwarte źródła miejskie.",
          "Zbieraj historię cen legalnie i przejrzyście.",
          "Przed wejściem do kolejnych miast przygotuj listę wiarygodnych źródeł.",
        ],
      },
    ],
  },
  {
    slug: "mortgage-calculator-poland",
    category: "Finanse",
    title: "Kredyt hipoteczny w Polsce: jak powiązać ratę z ceną mieszkania",
    description:
      "Jak używać kalkulacji kredytu przy zakupie mieszkania: wkład własny, oprocentowanie, okres, obciążenie dochodu, całkowity koszt i bezpieczny budżet.",
    heroSummary:
      "Mieszkanie może wyglądać rozsądnie cenowo, ale nadal nie pasować do budżetu. Dlatego analiza powinna łączyć cenę, ratę kredytu i rezerwę bezpieczeństwa.",
    keyTakeaways: [
      "Licz nie tylko ratę, ale też całkowity koszt zakupu.",
      "Bufor miesięczny jest ważniejszy niż maksymalna zdolność kredytowa.",
      "Kalkulacja nie zastępuje decyzji banku ani rozmowy z doradcą.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki"],
    internalLinks: [
      { href: "/mortgage", label: "Otwórz kalkulator kredytu" },
      { href: "/check", label: "Sprawdź mieszkanie z ratą" },
      { href: "/guides/total-purchase-cost-poland", label: "Całkowity koszt zakupu" },
      { href: "/check", label: "Sprawdź mieszkanie" },
    ],
    sections: [
      {
        heading: "Co policzyć przed ofertą",
        body:
          "Przed złożeniem oferty warto znać miesięczną ratę, koszty zakupu, rezerwę remontową i wariant przy wyższym oprocentowaniu.",
        bullets: [
          "Sprawdź scenariusz komfortowy i napięty.",
          "Porównaj ratę z dochodem i obecnymi zobowiązaniami.",
          "Nie wydawaj całego budżetu na cenę mieszkania bez kosztów transakcji.",
        ],
      },
      {
        heading: "Jak połączyć to z raportem",
        body:
          "Raport kupującego powinien pokazywać ratę, całkowity koszt zakupu, maksymalną rozsądną ofertę i listę kontroli przed zadatkiem.",
        bullets: [
          "Maksymalna oferta powinna uwzględniać zakres ceny rynkowej i budżet.",
          "Scenariusze raty muszą być czytelne bez żargonu finansowego.",
          "Raport powinien jasno mówić, że nie jest decyzją kredytową.",
        ],
      },
    ],
  },
  {
    slug: "purchase-checklist-poland",
    category: "Lista kontroli",
    title: "Lista kontroli zakupu mieszkania w Polsce",
    description:
      "Co sprawdzić przed zakupem mieszkania: cena, księga wieczysta, zadatek, kredyt, dokumenty, dzielnica i pytania do sprzedającego.",
    heroSummary:
      "Zakup mieszkania wymaga nie tylko porównania ceny. Trzeba sprawdzić dokumenty, ryzyka lokalu, dzielnicę, koszt transakcji i warunki przed zadatkiem.",
    keyTakeaways: [
      "Oddzielnie sprawdzaj mieszkanie, sprzedającego lub dewelopera, dzielnicę i finansowanie.",
      "Pytania do sprzedającego powinny wynikać z ryzyk konkretnego mieszkania.",
      "Przed zadatkiem potrzebna jest krótka lista rzeczy do potwierdzenia.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/check", label: "Sprawdź mieszkanie" },
      { href: "/guides/ksiega-wieczysta-checklist", label: "Księga wieczysta" },
      { href: "/guides/total-purchase-cost-poland", label: "Koszt zakupu" },
      { href: "/check", label: "Pełna analiza mieszkania" },
    ],
    sections: [
      {
        heading: "Co sprawdzić najpierw",
        body:
          "Najpierw odetnij drogie błędy: cenę powyżej rynku, słabą płynność, problemy z dokumentami, złą infrastrukturę i błędny budżet.",
        bullets: [
          "Porównaj cenę z podobnymi mieszkaniami.",
          "Sprawdź księgę wieczystą i stan prawny.",
          "Zweryfikuj dzielnicę, transport, szkoły, drogi i strefy przemysłowe.",
        ],
      },
      {
        heading: "O co zapytać sprzedającego",
        body:
          "Pytania powinny być powiązane z konkretnym mieszkaniem: obniżki ceny, powód sprzedaży, koszty, remont i dokumenty.",
        bullets: [
          "Zapytaj o czynsz, fundusz remontowy i planowane remonty.",
          "Sprawdź, co wchodzi w cenę: miejsce parkingowe, komórka lokatorska, wyposażenie.",
          "Ustal harmonogram transakcji i warunki zadatku.",
        ],
      },
    ],
  },
  {
    slug: "ksiega-wieczysta-checklist",
    category: "Prawo",
    title: "Księga wieczysta: co sprawdzić przed zakupem mieszkania",
    description:
      "Praktyczna lista kontroli księgi wieczystej: własność, działy, hipoteka, roszczenia, służebność i pytania do prawnika.",
    heroSummary:
      "Księga wieczysta jest jednym z kluczowych dokumentów transakcji. Domarion może pomóc przygotować pytania, ale nie zastępuje prawnika ani notariusza.",
    keyTakeaways: [
      "Sprawdź właściciela, prawa, ograniczenia i wpisy hipoteczne.",
      "Roszczenia lub służebności wymagają wyjaśnienia przez specjalistę.",
      "Wnioski prawne nie powinny opierać się wyłącznie na analizie automatycznej.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki"],
    internalLinks: [
      { href: "/guides/purchase-checklist-poland", label: "Lista kontroli zakupu" },
      { href: "/mortgage", label: "Kredyt i budżet" },
      { href: "/check", label: "Sprawdź mieszkanie" },
      { href: "/check", label: "Przygotuj pytania" },
    ],
    sections: [
      {
        heading: "Które działy sprawdzić",
        body:
          "Kupujący powinien rozumieć, co księga mówi o lokalu, właścicielu, prawach, ograniczeniach i wpisach hipotecznych.",
        bullets: [
          "Porównaj adres i lokal z faktycznym mieszkaniem.",
          "Sprawdź, kto jest właścicielem.",
          "Zweryfikuj ograniczenia, roszczenia i wpisy hipoteczne.",
        ],
      },
      {
        heading: "Kiedy potrzebny jest specjalista",
        body:
          "Jeśli wpisy są niejasne, występują kwestie spadkowe, udziały, sporne prawa albo złożona struktura dewelopera, potrzebna jest kontrola prawnika.",
        bullets: [
          "Nie traktuj raportu analitycznego jak gwarancji prawnej.",
          "Użyj raportu jako listy pytań do prawnika lub notariusza.",
          "Zachowuj wszystkie źródła i dokumenty transakcji.",
        ],
      },
    ],
  },
  {
    slug: "total-purchase-cost-poland",
    category: "Finanse",
    title: "Ile kosztuje zakup mieszkania w Polsce: całkowity budżet",
    description:
      "Jak liczyć pełny koszt zakupu mieszkania: cena, podatek, notariusz, pośrednik, kredyt, remont, miejsce parkingowe i rezerwa.",
    heroSummary:
      "Cena z ogłoszenia nie jest budżetem transakcji. Pełny koszt obejmuje podatki, notariusza, koszty kredytu, remont, parking lub komórkę i bufor gotówkowy.",
    keyTakeaways: [
      "Kupujący powinien znać budżet transakcji przed złożeniem oferty.",
      "Rynek wtórny i pierwotny mają różne koszty dodatkowe.",
      "Rezerwa remontowa może zmienić decyzję mocniej niż rabat sprzedającego.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/mortgage", label: "Kalkulator kredytu" },
      { href: "/guides/mortgage-calculator-poland", label: "Kredyt hipoteczny" },
      { href: "/check", label: "Sprawdź mieszkanie" },
      { href: "/check/drafts", label: "Moje mieszkania" },
    ],
    sections: [
      {
        heading: "Z czego składa się budżet",
        body:
          "Poza ceną mieszkania uwzględnij koszty transakcji, koszty kredytu, rezerwę na przeprowadzkę i remont oraz stałe opłaty po zakupie.",
        bullets: [
          "Sprawdź podatek, notariusza i prowizję pośrednika dla swojej transakcji.",
          "Osobno policz miejsce parkingowe, komórkę lokatorską i wykończenie.",
          "Porównaj miesięczną ratę z dochodem i buforem finansowym.",
        ],
      },
      {
        heading: "Jak połączyć koszt z decyzją",
        body:
          "Raport kupującego powinien pokazać, ile naprawdę kosztuje decyzja, a nie tylko czy mieszkanie jest tańsze lub droższe od zakresu rynkowego.",
        bullets: [
          "Maksymalna oferta powinna uwzględniać dodatkowe koszty i remont.",
          "Rabat może być niewystarczający, jeśli całkowity koszt wychodzi poza budżet.",
          "Kalkulacja powinna być przejrzysta i możliwa do korekty.",
        ],
      },
    ],
  },
];

export function getSeoGuide(slug: string) {
  return SEO_GUIDES.find((guide) => guide.slug === slug) ?? null;
}
