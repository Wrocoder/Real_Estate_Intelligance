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
    title: "Квартиры во Wrocław Fabryczna: цены, риски и потенциал района",
    description:
      "Аналитика района Fabryczna во Вроцлаве: медианная цена за m2, предложение, ликвидность, транспортные планы и факторы риска для покупки квартиры.",
    medianPricePerM2: 11800,
    averagePricePerM2: 12150,
    activeListings: 691,
    averageDaysOnMarket: 84,
    priceChange90dPct: 0.9,
    supplyChange90dPct: 8.1,
    buyerFit: [
      "Подходит покупателям, которым важна цена ниже центральных районов и доступ к крупным жилым массивам.",
      "Интересен семьям, если конкретный объект находится рядом со школами и транспортом.",
      "Хорош для сравнения 3-комнатных квартир в бюджете ниже премиальных районов.",
    ],
    investorFit: [
      "Потенциал зависит от транспортных улучшений и качества конкретной локации.",
      "Сильнее всего смотреть объекты с хорошей доступностью до остановок и низким Risk Score.",
      "Рост предложения требует дисциплины по цене покупки и переговорной позиции.",
    ],
    risks: [
      "В районе есть неоднородные зоны, поэтому средняя цена не заменяет проверку улицы.",
      "Рост предложения за 90 дней может усиливать конкуренцию между продавцами.",
      "Для части объектов нужно отдельно проверять расстояние до промзон и крупных дорог.",
    ],
    plannedInvestments: [
      "Nowy Dwór tram corridor в демо-слое MVP.",
      "Локальные улучшения транспорта могут повысить ликвидность отдельных объектов.",
    ],
    internalLinks: [
      { href: "/?district=Fabryczna", label: "Открыть подбор в Fabryczna" },
      { href: "/compare", label: "Сравнить объекты" },
      { href: "/pricing", label: "Заказать отчет по объекту" },
    ],
  },
  {
    areaId: "wroclaw-krzyki",
    slug: "wroclaw-krzyki",
    name: "Krzyki",
    city: "Wrocław",
    district: "Krzyki",
    title: "Квартиры во Wrocław Krzyki: цена за m2 и аналитика района",
    description:
      "Обзор Krzyki во Вроцлаве: медианные цены, динамика рынка, инфраструктура, planned investments и риски переплаты при покупке квартиры.",
    medianPricePerM2: 13200,
    averagePricePerM2: 13750,
    activeListings: 842,
    averageDaysOnMarket: 78,
    priceChange90dPct: 1.8,
    supplyChange90dPct: 5.6,
    buyerFit: [
      "Подходит покупателям, которым важна развитая городская инфраструктура и большой выбор объектов.",
      "Нужно тщательно сравнивать цену за m2: район дороже части альтернатив во Вроцлаве.",
      "Для первичного рынка особенно важно проверять сроки инфраструктурных обещаний.",
    ],
    investorFit: [
      "Район может быть интересен для аренды при хорошей транспортной доступности.",
      "Объекты с высокой ценой за m2 требуют сильного обоснования через качество дома и локации.",
      "Лучше искать варианты с хорошей ликвидностью, а не только с высоким Investment Score.",
    ],
    risks: [
      "Риск переплаты выше, если цена существенно выше медианы района.",
      "Новые проекты могут конкурировать друг с другом по аренде и перепродаже.",
      "Отдельные части района отличаются по транспорту и социальной инфраструктуре.",
    ],
    plannedInvestments: [
      "Jagodno road and bus priority upgrade в демо-слое MVP.",
      "Транспортные улучшения могут быть важнее для окраинных частей района.",
    ],
    internalLinks: [
      { href: "/?district=Krzyki", label: "Открыть подбор в Krzyki" },
      { href: "/reports", label: "История отчетов" },
      { href: "/alerts", label: "Создать alert" },
    ],
  },
  {
    areaId: "wroclaw-psie-pole",
    slug: "wroclaw-psie-pole",
    name: "Psie Pole",
    city: "Wrocław",
    district: "Psie Pole",
    title: "Квартиры во Wrocław Psie Pole: рынок, ликвидность и риски",
    description:
      "Практичная аналитика Psie Pole: цена за m2, предложение, среднее время продажи, инфраструктура, будущие проекты и риски для семьи или инвестора.",
    medianPricePerM2: 11250,
    averagePricePerM2: 11640,
    activeListings: 514,
    averageDaysOnMarket: 92,
    priceChange90dPct: 2.4,
    supplyChange90dPct: 3.2,
    buyerFit: [
      "Подходит покупателям, которым важна площадь, зелень и более доступная цена за m2.",
      "Семейным покупателям нужно проверять школы, транспорт и время до центра по конкретному адресу.",
      "4-комнатные квартиры могут быть интересны, если объект не висит слишком долго на рынке.",
    ],
    investorFit: [
      "Потенциал может быть выше у объектов рядом с будущими сервисами и зелеными зонами.",
      "Ликвидность стоит проверять особенно строго: среднее время экспозиции выше, чем в части районов.",
      "Сильная переговорная позиция возможна у объектов с долгой экспозицией и снижениями цены.",
    ],
    risks: [
      "Среднее время на рынке выше, что может говорить о более медленной ликвидности.",
      "Для аренды важна транспортная связность, иначе спрос может быть слабее.",
      "Нужно отдельно смотреть близость железной дороги, промзон и шумных трасс.",
    ],
    plannedInvestments: [
      "Psie Pole school and public services hub в демо-слое MVP.",
      "Pocket park and greenery renewal может быть позитивным фактором для жизни.",
    ],
    internalLinks: [
      { href: "/?district=Psie Pole", label: "Открыть подбор в Psie Pole" },
      { href: "/compare", label: "Сравнить семейные квартиры" },
      { href: "/pricing", label: "Проверить объект отчетом" },
    ],
  },
];

export function getSeoArea(slug: string) {
  return SEO_AREAS.find((area) => area.slug === slug) ?? null;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}
