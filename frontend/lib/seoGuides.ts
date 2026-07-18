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
    category: "Market",
    title: "Cena za m2 Wrocław: как читать цену квартиры перед покупкой",
    description:
      "Практичный гид по цене за m2 во Вроцлаве: медиана, районный контекст, сравнение похожих объектов и сигналы переплаты.",
    heroSummary:
      "Цена за m2 полезна только как первый фильтр. Решение по квартире требует сравнения с районом, похожими объектами, историей цены, состоянием дома и будущими факторами района.",
    keyTakeaways: [
      "Сравнивайте объект не со всем городом, а с похожими квартирами в районе и радиусе 1-2 км.",
      "Сильное отклонение от медианы не всегда ошибка: этаж, дом, отделка и транспорт могут объяснить premium.",
      "Domarion report показывает fair price range и confidence, чтобы не принимать решение по одной средней цене.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/areas", label: "Районы Вроцлава" },
      { href: "/areas/compare", label: "Сравнение районов" },
      { href: "/check", label: "Проверить квартиру" },
      { href: "/pricing", label: "Заказать отчет" },
    ],
    sections: [
      {
        heading: "Что показывает цена за m2",
        body:
          "Цена за m2 нормализует разные площади, но не видит качество дома, точную улицу, ликвидность, юридические риски и future infrastructure.",
        bullets: [
          "Используйте median price per m2 как baseline, а не как окончательный ответ.",
          "Смотрите разницу между объектом и похожими квартирами по комнатам, площади и району.",
          "Проверяйте, не завышена ли цена из-за ремонта, бренда девелопера или обещаний инфраструктуры.",
        ],
      },
      {
        heading: "Когда цена выглядит рискованной",
        body:
          "Риск выше, если квартира дороже локальной медианы, долго висит на рынке, имеет слабую транспортную доступность или требует ремонта.",
        bullets: [
          "Price premium должен быть объяснен фактами, а не только описанием продавца.",
          "Долгая экспозиция и снижения цены усиливают переговорную позицию покупателя.",
          "Недостаток данных должен снижать уверенность отчета, а не скрываться.",
        ],
      },
    ],
  },
  {
    slug: "best-districts-wroclaw",
    category: "Districts",
    title: "Лучшие районы Вроцлава для покупки квартиры",
    description:
      "Как сравнивать районы Вроцлава для жизни, семьи, аренды и перепродажи: цена, транспорт, школы, ликвидность и риски.",
    heroSummary:
      "Лучший район зависит от сценария: жить с семьей, сдавать, покупать дешевле рынка или сохранить ликвидность. Поэтому район нужно сравнивать по нескольким метрикам.",
    keyTakeaways: [
      "Для семьи важнее школы, транспорт, парки и ежедневная логистика.",
      "Для инвестора важны rental potential, ликвидность и цена входа.",
      "Для первого жилья лучше избегать районов, где низкая цена скрывает слабую инфраструктуру.",
    ],
    relatedAreaSlugs: ["wroclaw-krzyki", "wroclaw-fabryczna", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/areas/compare", label: "Сравнить районы" },
      { href: "/areas/wroclaw-krzyki", label: "Krzyki" },
      { href: "/areas/wroclaw-fabryczna", label: "Fabryczna" },
      { href: "/areas/wroclaw-psie-pole", label: "Psie Pole" },
    ],
    sections: [
      {
        heading: "Как выбирать район",
        body:
          "Не начинайте с общего рейтинга. Сначала задайте сценарий покупки, затем сравните цену, инфраструктуру и ликвидность под этот сценарий.",
        bullets: [
          "Покупателю для жизни нужна проверка улицы, а не только названия района.",
          "Инвестору нужен yield и exit liquidity, а не только рост цены.",
          "Риелтору нужен клиентский аргумент, почему район соответствует бюджету.",
        ],
      },
      {
        heading: "Что проверять в отчете",
        body:
          "Сильный районный блок должен показывать market baseline, активное предложение, planned investments и негативные факторы рядом с конкретным объектом.",
        bullets: [
          "Сравните объект с медианой и похожими квартирами.",
          "Проверьте дороги, транспорт, школы, парки и промышленные зоны.",
          "Проверьте, не растет ли предложение быстрее спроса.",
        ],
      },
    ],
  },
  {
    slug: "where-to-buy-near-wroclaw",
    category: "Suburbs",
    title: "Где купить квартиру рядом с Вроцлавом",
    description:
      "Практичный гид по покупке квартиры в пригородах Вроцлава: Kobierzyce, Wysoka, Bielany Wrocławskie, Oława и suburban fallback.",
    heroSummary:
      "Пригород может дать больше площади за те же деньги, но требует жесткой проверки транспорта, школ, будущих дорог и ликвидности перепродажи.",
    keyTakeaways: [
      "Сравнивайте не только цену, но и ежедневное время до работы, школы и сервисов.",
      "Для пригорода особенно важен risk score по транспорту и future road investments.",
      "Если comparables мало, отчет должен явно показывать proxy-market confidence warning.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki"],
    internalLinks: [
      { href: "/check", label: "Проверить suburban объект" },
      { href: "/?municipality=Kobierzyce", label: "Подбор в gmina Kobierzyce" },
      { href: "/guides/dolnoslaskie-market-analysis", label: "Рынок Dolnośląskie" },
      { href: "/pricing", label: "Full object analysis" },
    ],
    sections: [
      {
        heading: "Что дает пригород",
        body:
          "Сильная сторона пригородов - площадь и цена входа. Слабая сторона - зависимость от транспорта, дорог, локальных школ и реальной ликвидности.",
        bullets: [
          "Проверяйте, сколько похожих квартир реально продается рядом.",
          "Смотрите, является ли адрес Wrocław-adjacent или уже отдельным рынком.",
          "Не переносите медиану Вроцлава напрямую на пригород без confidence warning.",
        ],
      },
      {
        heading: "Когда пригород рискован",
        body:
          "Риск выше при слабом общественном транспорте, отсутствии школ, зависимости от одной дороги или большом объеме нового предложения.",
        bullets: [
          "Проверьте расстояние до остановки и крупных дорог.",
          "Проверьте planned roads/tram/bus routes и сроки реализации.",
          "Сравните аренду и перепродажу с городскими альтернативами.",
        ],
      },
    ],
  },
  {
    slug: "district-comparison-wroclaw",
    category: "Districts",
    title: "Сравнение районов Вроцлава: как выбрать между 2-3 локациями",
    description:
      "Методика сравнения районов Вроцлава по цене, предложению, ликвидности, growth potential и buyer/seller market signals.",
    heroSummary:
      "Сравнение районов полезно, когда бюджет подходит нескольким локациям. Главная ошибка - сравнивать только среднюю цену и игнорировать предложение, ликвидность и риски.",
    keyTakeaways: [
      "Сравнивайте районы по одинаковому типу квартиры и бюджету.",
      "Buyer market и seller market signals помогают понять переговорную позицию.",
      "Район с более низкой ценой может быть хуже, если ликвидность и инфраструктура слабые.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/areas/compare", label: "Открыть comparison dashboard" },
      { href: "/compare", label: "Сравнить конкретные объекты" },
      { href: "/reports", label: "История отчетов" },
      { href: "/guides/best-districts-wroclaw", label: "Лучшие районы" },
    ],
    sections: [
      {
        heading: "Как сравнивать корректно",
        body:
          "Для честного сравнения задайте один сценарий: например 3 комнаты, семейная покупка, бюджет до определенной суммы и доступ к транспорту.",
        bullets: [
          "Сравните median price per m2 и active listings.",
          "Сравните average days on market и supply change.",
          "Сравните future-area-development и nearby risks.",
        ],
      },
      {
        heading: "Как использовать результат",
        body:
          "Результат сравнения должен помогать выбрать shortlist районов и сформировать вопросы для просмотра конкретных объектов.",
        bullets: [
          "Если район дороже, найдите конкретные причины premium.",
          "Если район дешевле, проверьте, не покупаете ли вы слабую ликвидность.",
          "Для риелтора это готовый аргумент клиенту по trade-offs.",
        ],
      },
    ],
  },
  {
    slug: "flats-with-growth-potential",
    category: "Investment",
    title: "Квартиры с потенциалом роста: как не спутать upside с риском",
    description:
      "Как искать квартиры с growth potential во Вроцлаве: future infrastructure, цена относительно рынка, ликвидность и риск переоценки.",
    heroSummary:
      "Потенциал роста не равен дешевизне. Хороший кандидат сочетает разумную цену, понятный future-area catalyst, ликвидность и отсутствие критических рисков.",
    keyTakeaways: [
      "Ищите подтвержденные planned investments, а не только обещания в описании.",
      "Низкая цена может быть сигналом риска, если район или дом слабые.",
      "Отчет должен отделять growth thesis от финансовой гарантии.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/?mode=hidden_gems", label: "Hidden gems view" },
      { href: "/alerts", label: "Investor alerts" },
      { href: "/guides/wroclaw-price-per-m2", label: "Цена за m2" },
      { href: "/pricing", label: "Investor report" },
    ],
    sections: [
      {
        heading: "Что считать catalyst",
        body:
          "Catalyst - это фактор, который может улучшить спрос или ликвидность: транспорт, новая школа, парк, рабочие места или городская инвестиция.",
        bullets: [
          "Проверьте источник planned investment и срок реализации.",
          "Оцените радиус влияния: 500 м, 1 км, 2 км, 5 км.",
          "Проверьте, не заложен ли catalyst уже в цену.",
        ],
      },
      {
        heading: "Как избежать ловушки",
        body:
          "Слабая квартира в слабом доме рядом с будущим проектом не становится автоматически хорошей инвестицией.",
        bullets: [
          "Смотрите Risk Score и Liquidity Score вместе с Investment Score.",
          "Проверяйте конкурирующее предложение новых проектов.",
          "Не используйте growth thesis как прогноз или гарантию доходности.",
        ],
      },
    ],
  },
  {
    slug: "dolnoslaskie-market-analysis",
    category: "Market",
    title: "Analiza rynku nieruchomości Dolnośląskie: что смотреть перед покупкой",
    description:
      "Гид по рыночной аналитике Dolnośląskie: Wrocław, пригороды, supply, demand, price history, liquidity и regional data checklist.",
    heroSummary:
      "Dolnośląskie нельзя анализировать одной средней ценой. Wrocław, suburbs и соседние города имеют разные drivers цены, транспорта и ликвидности.",
    keyTakeaways: [
      "Разделяйте городские районы, suburban markets и отдельные города.",
      "Проверяйте supply change, active listings и average days on market.",
      "Для масштабирования Domarion нужен source checklist по каждому городу.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/market", label: "Market dashboard" },
      { href: "/areas", label: "Area pages" },
      { href: "/guides/where-to-buy-near-wroclaw", label: "Где купить рядом с Вроцлавом" },
      { href: "/reports", label: "Market reports" },
    ],
    sections: [
      {
        heading: "Какие метрики важны",
        body:
          "Для регионального анализа нужны цена за m2, активное предложение, новые и снятые объявления, экспозиция и структура по комнатам/площади.",
        bullets: [
          "Смотрите динамику, а не только текущий уровень цены.",
          "Сравнивайте рынки только внутри похожей географии.",
          "Отмечайте low-confidence зоны с малым количеством comparables.",
        ],
      },
      {
        heading: "Что использовать в MVP",
        body:
          "Для MVP достаточно Wrocław, ближайших suburbs и честных fallback warnings там, где данных мало.",
        bullets: [
          "Развивайте partner data и open-data layers.",
          "Собирайте price history через legal-first snapshots.",
          "Готовьте expansion checklist до выхода в другие города.",
        ],
      },
    ],
  },
  {
    slug: "mortgage-calculator-poland",
    category: "Finance",
    title: "Ипотечный калькулятор Польша: как связать платеж с ценой квартиры",
    description:
      "Как использовать ипотечный расчет при покупке квартиры в Польше: взнос, ставка, срок, DTI, total purchase cost и безопасный бюджет.",
    heroSummary:
      "Квартира может быть fair-priced, но все равно неподходящей по cashflow. Поэтому buyer report должен связывать цену, ипотечный платеж и запас бюджета.",
    keyTakeaways: [
      "Считайте не только платеж, но и total purchase cost.",
      "DTI и monthly buffer важнее максимально возможного кредита.",
      "Ипотечный расчет не заменяет решение банка и брокера.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki"],
    internalLinks: [
      { href: "/mortgage", label: "Открыть mortgage calculator" },
      { href: "/check", label: "Проверить объект с платежом" },
      { href: "/guides/total-purchase-cost-poland", label: "Total purchase cost" },
      { href: "/pricing", label: "Buyer report" },
    ],
    sections: [
      {
        heading: "Что считать до offer",
        body:
          "Перед offer нужно видеть monthly payment, расходы на покупку, ремонтный резерв и стресс-сценарий ставки.",
        bullets: [
          "Проверьте comfortable и stretched сценарии.",
          "Сравните платеж с доходом и текущими обязательствами.",
          "Не тратьте весь бюджет на цену объекта без учета сделки.",
        ],
      },
      {
        heading: "Как это попадает в отчет",
        body:
          "Buyer report должен показывать платеж, total purchase cost, max offer и checklist перед zadatek.",
        bullets: [
          "Max offer должен учитывать fair price и бюджет.",
          "Сценарии платежа должны быть понятны без финансового жаргона.",
          "Отчет должен явно говорить, что это не кредитное решение.",
        ],
      },
    ],
  },
  {
    slug: "purchase-checklist-poland",
    category: "Checklist",
    title: "Checklist покупки квартиры в Польше",
    description:
      "Что проверить перед покупкой квартиры в Польше: цена, księga wieczysta, zadatek, ипотека, документы, район и вопросы продавцу.",
    heroSummary:
      "Покупка квартиры требует не только сравнения цены. Нужно проверить документы, риски объекта, район, стоимость сделки и условия до zadatek.",
    keyTakeaways: [
      "Отдельно проверяйте объект, продавца/застройщика, район и финансирование.",
      "Вопросы продавцу должны идти из рисков отчета, а не из общего списка.",
      "Перед zadatek нужен короткий pre-signing checklist.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/check", label: "Проверить квартиру" },
      { href: "/guides/ksiega-wieczysta-checklist", label: "Księga wieczysta" },
      { href: "/guides/total-purchase-cost-poland", label: "Стоимость покупки" },
      { href: "/pricing", label: "Full object analysis" },
    ],
    sections: [
      {
        heading: "Что проверить первым",
        body:
          "Сначала отсекайте дорогие ошибки: цена выше рынка, слабая ликвидность, проблемы с документами, плохая инфраструктура и неверный бюджет.",
        bullets: [
          "Сравните цену с похожими объектами.",
          "Проверьте księga wieczysta и правовой статус.",
          "Проверьте район, транспорт, школы, дороги и промзоны.",
        ],
      },
      {
        heading: "Что спросить у продавца",
        body:
          "Вопросы должны быть привязаны к конкретному объекту: снижалась ли цена, почему продажа, какие расходы, что с ремонтом и документами.",
        bullets: [
          "Спросите про czynsz, fundusz remontowy и плановые ремонты.",
          "Проверьте, что входит в цену: parking, storage, furniture.",
          "Уточните timeline сделки и условия zadatek.",
        ],
      },
    ],
  },
  {
    slug: "ksiega-wieczysta-checklist",
    category: "Legal",
    title: "Księga wieczysta: что проверить перед покупкой квартиры",
    description:
      "Практичный checklist по księga wieczysta: собственность, działy, ипотека, roszczenia, służebność и вопросы к юристу.",
    heroSummary:
      "Księga wieczysta - один из ключевых документов сделки. Domarion может напомнить, что проверять, но не заменяет юриста или нотариуса.",
    keyTakeaways: [
      "Проверьте собственника, права, ограничения и ипотечные записи.",
      "Любые roszczenia или służebność требуют отдельного объяснения специалиста.",
      "Юридические выводы не должны строиться только AI или scoring-системой.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki"],
    internalLinks: [
      { href: "/guides/purchase-checklist-poland", label: "Purchase checklist" },
      { href: "/mortgage", label: "Mortgage/legal referral" },
      { href: "/check", label: "Проверить объект" },
      { href: "/pricing", label: "Buyer report" },
    ],
    sections: [
      {
        heading: "Какие разделы смотреть",
        body:
          "Покупателю важно понимать, что книга показывает объект, собственность, права/ограничения и ипотечные записи.",
        bullets: [
          "Сверьте адрес и объект с фактической квартирой.",
          "Проверьте, кто является собственником.",
          "Проверьте ограничения, roszczenia и hipoteczne wpisy.",
        ],
      },
      {
        heading: "Когда нужен специалист",
        body:
          "Если есть непонятные записи, наследственные вопросы, доли, спорные права или developer structure, нужен legal review.",
        bullets: [
          "Не принимайте юридические гарантии из аналитического отчета.",
          "Используйте отчет как список вопросов к юристу/нотариусу.",
          "Сохраняйте все source citations и документы сделки.",
        ],
      },
    ],
  },
  {
    slug: "total-purchase-cost-poland",
    category: "Finance",
    title: "Сколько стоит покупка квартиры в Польше: total purchase cost",
    description:
      "Как считать полную стоимость покупки квартиры в Польше: цена, налог, нотариус, агент, ипотека, ремонт, parking и резерв.",
    heroSummary:
      "Цена объявления не равна бюджету сделки. Полная стоимость включает налоги, нотариуса, ипотечные расходы, ремонт, parking/storage и cash buffer.",
    keyTakeaways: [
      "Покупатель должен видеть бюджет сделки до offer.",
      "Вторичный и первичный рынок имеют разные расходы.",
      "Ремонтный резерв может изменить решение сильнее, чем скидка продавца.",
    ],
    relatedAreaSlugs: ["wroclaw-fabryczna", "wroclaw-krzyki", "wroclaw-psie-pole"],
    internalLinks: [
      { href: "/mortgage", label: "Mortgage calculator" },
      { href: "/guides/mortgage-calculator-poland", label: "Ипотека Польша" },
      { href: "/check", label: "Проверить квартиру" },
      { href: "/reports", label: "Отчеты" },
    ],
    sections: [
      {
        heading: "Из чего состоит бюджет",
        body:
          "Помимо цены квартиры учитывайте transaction costs, financing costs, moving/renovation reserve и обязательные платежи после покупки.",
        bullets: [
          "Проверьте tax/notary/agency assumptions для своего рынка и сделки.",
          "Отдельно считайте parking, komórka lokatorska и отделку.",
          "Сравните monthly cost с доходом и safety buffer.",
        ],
      },
      {
        heading: "Как связать с отчетом",
        body:
          "Buyer report должен показывать, сколько реально стоит решение, а не только насколько объект дешевле или дороже fair value.",
        bullets: [
          "Max offer должен учитывать hidden costs и ремонт.",
          "Скидка может быть недостаточной, если total cost выходит за бюджет.",
          "Расчет должен быть прозрачным и редактируемым.",
        ],
      },
    ],
  },
];

export function getSeoGuide(slug: string) {
  return SEO_GUIDES.find((guide) => guide.slug === slug) ?? null;
}
