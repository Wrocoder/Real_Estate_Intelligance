"use client";

import Link from "next/link";

import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import type { ComparableEvidence, ListingAnalysis } from "@/lib/api";
import { dateValue, money, numberValue, percent } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type Props = {
  analysis: ListingAnalysis;
  locale: Locale;
};

type ComparableCopy = {
  title: string;
  description: string;
  sample: (count: number) => string;
  scope: string;
  freshness: string;
  observed: string;
  distance: string;
  market: string;
  details: string;
  match: string;
  matchNote: string;
  price: string;
  pricePerM2: string;
  size: string;
  rooms: string;
  floor: string;
  year: string;
  condition: string;
  factors: string;
  openListing: string;
  emptyTitle: string;
  emptyText: string;
  limitations: string;
  marketTypes: Record<"primary" | "secondary", string>;
  conditions: Record<string, string>;
  factorsMap: Record<string, string>;
  unknown: string;
  meters: string;
  days: string;
  delta: (value: string) => string;
};

const COPY: Record<Locale, ComparableCopy> = {
  en: {
    title: "Why this price?",
    description:
      "These properties are reference points for the estimate. They are not a transaction valuation or a guarantee of the achievable price.",
    sample: (count) => `${count} comparable ${count === 1 ? "property" : "properties"}`,
    scope: "Selection scope",
    freshness: "Observation window",
    observed: "Observed",
    distance: "Distance",
    market: "Market",
    details: "Property details",
    match: "Technical match",
    matchNote: "A deterministic comparison of available attributes, not confidence in the fair-price estimate.",
    price: "Price",
    pricePerM2: "Price/m2",
    size: "Size",
    rooms: "Rooms",
    floor: "Floor",
    year: "Building year",
    condition: "Condition",
    factors: "What matched",
    openListing: "Open listing",
    emptyTitle: "No sufficiently similar properties found",
    emptyText:
      "The fair-price estimate uses area-level data or other available signals. Treat it as indicative and review the confidence and data gaps before making a decision.",
    limitations: "The selection is limited to fresh data available in the selected market scope.",
    marketTypes: { primary: "Primary", secondary: "Secondary" },
    conditions: {
      move_in_ready: "Move-in ready",
      refresh: "Refresh",
      light_renovation: "Light renovation",
      full_renovation: "Full renovation",
      shell_developer_standard: "Shell / developer standard",
      custom_budget: "Custom budget",
    },
    factorsMap: {
      same_district: "same district",
      same_city_different_district: "same city, different district",
      different_city: "different city",
      same_market: "same market",
      different_market: "different market",
      similar_size: "similar size",
      wider_size_range: "wider size range",
      same_rooms: "same room count",
      rooms_differ: "different room count",
      same_building_type: "same building type",
      building_type_differs: "different building type",
      building_type_unknown: "building type unavailable",
      same_condition: "same condition",
      condition_differs: "different condition",
      condition_unknown: "condition unavailable",
      nearby: "nearby",
      same_area_proximity: "same area proximity",
      wider_area_proximity: "wider area proximity",
      distance_unknown: "distance unavailable",
    },
    unknown: "Not available",
    meters: "m",
    days: "days",
    delta: (value) => `${value} vs subject`,
  },
  pl: {
    title: "Dlaczego taka cena?",
    description:
      "Te nieruchomości są punktami odniesienia dla szacunku. Nie są wyceną transakcyjną ani gwarancją ceny, którą można uzyskać.",
    sample: (count) => `${count} ${count === 1 ? "porównywana nieruchomość" : "porównywane nieruchomości"}`,
    scope: "Zakres wyboru",
    freshness: "Okno obserwacji",
    observed: "Zaobserwowano",
    distance: "Odległość",
    market: "Rynek",
    details: "Dane nieruchomości",
    match: "Dopasowanie techniczne",
    matchNote: "Deterministyczne porównanie dostępnych cech, a nie pewność szacunku ceny.",
    price: "Cena",
    pricePerM2: "Cena/m²",
    size: "Metraż",
    rooms: "Pokoje",
    floor: "Piętro",
    year: "Rok budowy",
    condition: "Stan",
    factors: "Co się zgadza",
    openListing: "Otwórz ogłoszenie",
    emptyTitle: "Nie znaleźliśmy wystarczająco podobnych nieruchomości",
    emptyText:
      "Szacunek ceny korzysta z danych dzielnicy lub innych dostępnych sygnałów. Traktuj go orientacyjnie i sprawdź pewność oraz braki danych przed decyzją.",
    limitations: "Wybór obejmuje tylko świeże dane dostępne w wybranym zakresie rynku.",
    marketTypes: { primary: "Pierwotny", secondary: "Wtórny" },
    conditions: {
      move_in_ready: "Gotowe do zamieszkania",
      refresh: "Do odświeżenia",
      light_renovation: "Lekki remont",
      full_renovation: "Pełny remont",
      shell_developer_standard: "Stan deweloperski",
      custom_budget: "Własny budżet",
    },
    factorsMap: {
      same_district: "ta sama dzielnica",
      same_city_different_district: "to samo miasto, inna dzielnica",
      different_city: "inne miasto",
      same_market: "ten sam rynek",
      different_market: "inny rynek",
      similar_size: "podobny metraż",
      wider_size_range: "szerszy zakres metrażu",
      same_rooms: "ta sama liczba pokoi",
      rooms_differ: "inna liczba pokoi",
      same_building_type: "ten sam typ budynku",
      building_type_differs: "inny typ budynku",
      building_type_unknown: "brak typu budynku",
      same_condition: "ten sam stan",
      condition_differs: "inny stan",
      condition_unknown: "brak informacji o stanie",
      nearby: "blisko",
      same_area_proximity: "blisko w tej samej okolicy",
      wider_area_proximity: "dalsza okolica",
      distance_unknown: "brak odległości",
    },
    unknown: "Brak danych",
    meters: "m",
    days: "dni",
    delta: (value) => `${value} względem obiektu`,
  },
  ru: {
    title: "Почему такая цена?",
    description:
      "Эти объекты служат ориентиром для оценки. Это не оценка сделки и не гарантия достижимой цены.",
    sample: (count) => `${count} ${count === 1 ? "сравнимый объект" : "сравнимых объекта"}`,
    scope: "Охват выборки",
    freshness: "Окно наблюдения",
    observed: "Наблюдалось",
    distance: "Расстояние",
    market: "Рынок",
    details: "Данные объекта",
    match: "Техническое сходство",
    matchNote: "Детерминированное сравнение доступных признаков, а не уверенность в оценке цены.",
    price: "Цена",
    pricePerM2: "Цена/m²",
    size: "Площадь",
    rooms: "Комнаты",
    floor: "Этаж",
    year: "Год постройки",
    condition: "Состояние",
    factors: "Что совпало",
    openListing: "Открыть объявление",
    emptyTitle: "Не найдено достаточно похожих объектов",
    emptyText:
      "Оценка цены использует данные района и другие доступные сигналы. Считайте её ориентиром и проверьте уверенность и пробелы в данных.",
    limitations: "В выборку попали только свежие данные в выбранном охвате рынка.",
    marketTypes: { primary: "Первичный", secondary: "Вторичный" },
    conditions: {
      move_in_ready: "Готово к заселению",
      refresh: "Освежить",
      light_renovation: "Лёгкий ремонт",
      full_renovation: "Полный ремонт",
      shell_developer_standard: "Стандарт от застройщика",
      custom_budget: "Свой бюджет",
    },
    factorsMap: {
      same_district: "тот же район",
      same_city_different_district: "тот же город, другой район",
      different_city: "другой город",
      same_market: "тот же рынок",
      different_market: "другой рынок",
      similar_size: "похожая площадь",
      wider_size_range: "более широкий диапазон площади",
      same_rooms: "то же число комнат",
      rooms_differ: "другое число комнат",
      same_building_type: "тот же тип дома",
      building_type_differs: "другой тип дома",
      building_type_unknown: "тип дома неизвестен",
      same_condition: "то же состояние",
      condition_differs: "другое состояние",
      condition_unknown: "состояние неизвестно",
      nearby: "рядом",
      same_area_proximity: "рядом в той же зоне",
      wider_area_proximity: "дальняя зона",
      distance_unknown: "расстояние неизвестно",
    },
    unknown: "Нет данных",
    meters: "м",
    days: "дн.",
    delta: (value) => `${value} относительно объекта`,
  },
  uk: {
    title: "Чому така ціна?",
    description:
      "Ці об'єкти є орієнтирами для оцінки. Це не оцінка угоди й не гарантія досяжної ціни.",
    sample: (count) => `${count} ${count === 1 ? "порівнянний об'єкт" : "порівнянних об'єкти"}`,
    scope: "Охоплення вибірки",
    freshness: "Період спостереження",
    observed: "Спостерігалося",
    distance: "Відстань",
    market: "Ринок",
    details: "Дані об'єкта",
    match: "Технічна схожість",
    matchNote: "Детерміноване порівняння доступних ознак, а не впевненість в оцінці ціни.",
    price: "Ціна",
    pricePerM2: "Ціна/м²",
    size: "Площа",
    rooms: "Кімнати",
    floor: "Поверх",
    year: "Рік будівництва",
    condition: "Стан",
    factors: "Що збіглося",
    openListing: "Відкрити оголошення",
    emptyTitle: "Не знайдено достатньо схожих об'єктів",
    emptyText:
      "Оцінка ціни використовує дані району та інші доступні сигнали. Вважайте її орієнтиром і перевірте впевненість та прогалини в даних.",
    limitations: "До вибірки потрапили лише свіжі дані у вибраному охопленні ринку.",
    marketTypes: { primary: "Первинний", secondary: "Вторинний" },
    conditions: {
      move_in_ready: "Готове до заселення",
      refresh: "Оновлення",
      light_renovation: "Легкий ремонт",
      full_renovation: "Повний ремонт",
      shell_developer_standard: "Стандарт від забудовника",
      custom_budget: "Власний бюджет",
    },
    factorsMap: {
      same_district: "той самий район",
      same_city_different_district: "те саме місто, інший район",
      different_city: "інше місто",
      same_market: "той самий ринок",
      different_market: "інший ринок",
      similar_size: "схожа площа",
      wider_size_range: "ширший діапазон площі",
      same_rooms: "та сама кількість кімнат",
      rooms_differ: "інша кількість кімнат",
      same_building_type: "той самий тип будинку",
      building_type_differs: "інший тип будинку",
      building_type_unknown: "тип будинку невідомий",
      same_condition: "той самий стан",
      condition_differs: "інший стан",
      condition_unknown: "стан невідомий",
      nearby: "поруч",
      same_area_proximity: "поруч у тій самій зоні",
      wider_area_proximity: "дальша зона",
      distance_unknown: "відстань невідома",
    },
    unknown: "Немає даних",
    meters: "м",
    days: "днів",
    delta: (value) => `${value} відносно об'єкта`,
  },
};

const SCOPE_LABELS: Record<string, Record<Locale, string>> = {
  "same district, market, type, size and rooms": {
    en: "same district, market, type, size and rooms",
    pl: "ta sama dzielnica, rynek, typ, metraż i liczba pokoi",
    ru: "тот же район, рынок, тип, площадь и число комнат",
    uk: "той самий район, ринок, тип, площа й кількість кімнат",
  },
  "same city, market, type, size and rooms": {
    en: "same city, market, type, size and rooms",
    pl: "to samo miasto, rynek, typ, metraż i liczba pokoi",
    ru: "тот же город, рынок, тип, площадь и число комнат",
    uk: "те саме місто, ринок, тип, площа й кількість кімнат",
  },
  "same city and market, widened size/rooms": {
    en: "same city and market; wider size/room range",
    pl: "to samo miasto i rynek; szerszy zakres metrażu/pokoi",
    ru: "тот же город и рынок; более широкий диапазон площади/комнат",
    uk: "те саме місто й ринок; ширший діапазон площі/кімнат",
  },
  "same city, widened market fallback": {
    en: "same city; market scope widened",
    pl: "to samo miasto; rozszerzony zakres rynku",
    ru: "тот же город; охват рынка расширен",
    uk: "те саме місто; охоплення ринку розширено",
  },
  "no relevant fresh comparables": {
    en: "no relevant fresh comparables",
    pl: "brak świeżych, odpowiednich porównań",
    ru: "нет подходящих свежих сравнений",
    uk: "немає відповідних свіжих порівнянь",
  },
  "legacy alert matching": {
    en: "legacy matching scope",
    pl: "starszy zakres dopasowania",
    ru: "устаревший охват сопоставления",
    uk: "застаріле охоплення зіставлення",
  },
};

export function ComparableEvidencePanel({ analysis, locale }: Props) {
  const copy = COPY[locale];
  const evidence = analysis.comparable_evidence ?? [];
  const scope = SCOPE_LABELS[analysis.comparables_scope]?.[locale] ?? copy.unknown;

  return (
    <section className="comparable-evidence-section" aria-labelledby="comparable-evidence-title">
      <div className="comparable-evidence-heading">
        <div>
          <h2 id="comparable-evidence-title">{copy.title}</h2>
          <p className="muted-text">{copy.description}</p>
        </div>
        <span className="status-pill info">{copy.sample(evidence.length)}</span>
      </div>
      <div className="comparable-evidence-summary">
        <span><strong>{copy.scope}:</strong> {scope}</span>
        <span>
          <strong>{copy.freshness}:</strong> {numberValue(analysis.comparables_freshness_days, locale)} {copy.days}
        </span>
        <span>{copy.limitations}</span>
      </div>
      {evidence.length > 0 ? (
        <div className="comparable-evidence-list">
          {evidence.map((item, index) => (
            <ComparableEvidenceItem key={item.listing_id} copy={copy} item={item} locale={locale} open={index === 0} />
          ))}
        </div>
      ) : (
        <div className="comparable-evidence-empty">
          <strong>{copy.emptyTitle}</strong>
          <p>{copy.emptyText}</p>
        </div>
      )}
    </section>
  );
}

function ComparableEvidenceItem({
  copy,
  item,
  locale,
  open,
}: {
  copy: ComparableCopy;
  item: ComparableEvidence;
  locale: Locale;
  open: boolean;
}) {
  const priceDelta = percent(item.price_per_m2_delta_to_subject_pct, locale);
  return (
    <details className="comparable-evidence-item" open={open}>
      <summary>
        <span className="comparable-evidence-item-title">
          <strong>{item.title}</strong>
          <small>{item.district} · {copy.marketTypes[item.market_type]}</small>
        </span>
        <span className="comparable-evidence-item-price">
          <strong>{money(item.price_per_m2, locale)}/{copy.pricePerM2.split("/")[1] ?? "m²"}</strong>
          <small>{copy.delta(priceDelta)}</small>
        </span>
      </summary>
      <div className="comparable-evidence-item-body">
        <dl className="comparable-evidence-facts">
          <Fact label={copy.price} value={money(item.price, locale)} />
          <Fact label={copy.pricePerM2} value={money(item.price_per_m2, locale)} />
          <Fact label={copy.size} value={`${numberValue(item.area_m2, locale)} m²`} />
          <Fact label={copy.rooms} value={String(item.rooms)} />
          <Fact label={copy.market} value={copy.marketTypes[item.market_type]} />
          <Fact label={copy.observed} value={dateValue(item.observed_at, locale)} />
          <Fact label={copy.distance} value={item.distance_m === null ? copy.unknown : `${numberValue(item.distance_m, locale)} ${copy.meters}`} />
          <Fact label={copy.floor} value={item.floor === null ? copy.unknown : String(item.floor)} />
          <Fact label={copy.year} value={item.building_year === null ? copy.unknown : String(item.building_year)} />
          <Fact label={copy.condition} value={conditionLabel(item.renovation_state, copy)} />
        </dl>
        <div className="comparable-evidence-match">
          <strong>{copy.match}: {item.similarity_score}/100</strong>
          <span>{copy.matchNote}</span>
          <ul>
            {item.similarity_factors.map((factor) => (
              <li key={factor}>{copy.factorsMap[factor] ?? copy.unknown}</li>
            ))}
          </ul>
        </div>
        <div className="comparable-evidence-actions">
          <ProvenanceDetails
            locale={locale}
            provenance={{
              sourceName: item.source_name,
              sourceType: item.data_provenance.source_type,
              updatedAt: item.observed_at,
              sampleSize: 1,
              scope: item.district,
              calculationType: "observed",
              mode: item.data_provenance.mode,
            }}
          />
          <Link className="button" href={`/listings/${item.listing_id}`}>{copy.openListing}</Link>
        </div>
      </div>
    </details>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function conditionLabel(value: string | null, copy: ComparableCopy) {
  return value ? copy.conditions[value] ?? copy.unknown : copy.unknown;
}
