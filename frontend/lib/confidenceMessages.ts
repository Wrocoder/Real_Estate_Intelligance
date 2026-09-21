import type { FairPriceConfidence } from "./api";
import type { Locale } from "./i18n";

export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";

export function valuationConfidenceLevel(confidence?: FairPriceConfidence | null): ConfidenceLevel | undefined {
  return confidence?.evidence_status === "insufficient" ? "insufficient" : confidence?.level;
}

export const confidenceMessages = {
  pl: {
    title: "Dlaczego taka pewność?", levels: { high: "Wysoka", medium: "Średnia", low: "Niska", insufficient: "Niewystarczające dane" },
    note: "Ocena jakości dowodów, nie prawdopodobieństwo trafności ceny.", unknown: "Brak danych", legacy: "Starsza analiza nie zawiera pełnych pomiarów jakości danych. Odśwież ją przed podjęciem decyzji.",
    listings: "Podobne ogłoszenia", transactions: "Transakcje w statystyce obszaru", distance: "Mediana odległości (m)", distanceCount: "Ogłoszenia ze znaną odległością", age: "Mediana wieku ogłoszeń (dni)", oldest: "Najstarsze ogłoszenie (dni)", baseline: "Wiek podstawy statystyki obszaru (dni)", dispersion: "Rozpiętość cen względem mediany", missing: "Brakujące cechy mieszkania", date: "Data oceny", support: "Wspiera ocenę", limits: "Ogranicza ocenę", neutral: "Ograniczone wsparcie",
    reasons: {
      comparable_sample_limited: "Próba zawiera mniej niż pięć podobnych ogłoszeń.",
      comparable_sample_insufficient: "Mało podobnych ogłoszeń; statystyka obszaru nie zastępuje dopasowanych transakcji.", comparable_prices_inconsistent: "Ceny podobnych ogłoszeń znacznie się różnią.", geographic_scope_widened: "Próbę rozszerzono poza najbliższą okolicę lub ścisłe kryteria.", comparable_distance_incomplete: "Nie dla wszystkich ogłoszeń znamy odległość.", evidence_recency_unknown: "Nie można ustalić świeżości dowodów.", evidence_stale: "Ogłoszenia lub dane bazowe są starsze niż sześć miesięcy.", evidence_date_in_future: "Daty dowodów wykraczają poza datę oceny i wymagają sprawdzenia.", source_quality_unknown: "Pochodzenie części danych nie jest dostatecznie opisane.", demo_evidence: "Ocena korzysta z danych demonstracyjnych.", property_attributes_incomplete: "Brakuje cech potrzebnych do porównania mieszkań.", property_context_incomplete: "Brakuje części informacji o otoczeniu mieszkania.", transaction_baseline_unavailable: "Podstawa ceny nie jest potwierdzona statystyką transakcji.", market_evidence_insufficient: "Za mało danych, aby wiarygodnie ocenić cenę. Najpierw uzupełnij dowody.", baseline_recency_unknown: "Brakuje daty danych użytych w medianie obszaru.", baseline_stale: "Podstawa statystyki obszaru jest starsza niż rok.",
    },
  },
  en: {
    title: "Why this confidence level?", levels: { high: "High", medium: "Medium", low: "Low", insufficient: "Insufficient data" },
    note: "Evidence quality, not the probability that the price is accurate.", unknown: "Not available", legacy: "This older analysis lacks complete evidence measurements. Refresh it before making a decision.",
    listings: "Comparable listings", transactions: "Transactions in area statistics", distance: "Median distance (m)", distanceCount: "Listings with known distance", age: "Median listing age (days)", oldest: "Oldest listing (days)", baseline: "Area baseline age (days)", dispersion: "Price spread relative to median", missing: "Missing property attributes", date: "Assessment date", support: "Supports confidence", limits: "Limits confidence", neutral: "Limited support",
    reasons: {
      comparable_sample_limited: "The sample contains fewer than five comparable listings.",
      comparable_sample_insufficient: "Few comparable listings; area statistics do not replace matched transactions.", comparable_prices_inconsistent: "Comparable asking prices vary substantially.", geographic_scope_widened: "The sample extends beyond the closest area or strict matching criteria.", comparable_distance_incomplete: "Some comparable distances are unknown.", evidence_recency_unknown: "Evidence freshness cannot be established.", evidence_stale: "Listings or baseline data are more than six months old.", evidence_date_in_future: "Evidence dates exceed the assessment date and need checking.", source_quality_unknown: "Some data origins are insufficiently documented.", demo_evidence: "The assessment uses demonstration data.", property_attributes_incomplete: "Property attributes needed for matching are missing.", property_context_incomplete: "Some property surroundings data is missing.", transaction_baseline_unavailable: "The price baseline is not supported by transaction statistics.", market_evidence_insufficient: "Too little evidence for a reliable price assessment. Gather more evidence first.", baseline_recency_unknown: "The date of the area median's underlying data is unknown.", baseline_stale: "The area baseline is more than a year old.",
    },
  },
  ru: {
    title: "Почему такой уровень уверенности?", levels: { high: "Высокая", medium: "Средняя", low: "Низкая", insufficient: "Недостаточно данных" },
    note: "Оценка качества доказательств, а не вероятность точности цены.", unknown: "Нет данных", legacy: "В старом анализе нет полного набора показателей качества данных. Обновите его перед решением.",
    listings: "Похожие объявления", transactions: "Сделки в статистике территории", distance: "Медиана расстояния (м)", distanceCount: "Объявления с известным расстоянием", age: "Медианный возраст объявлений (дней)", oldest: "Самое старое объявление (дней)", baseline: "Возраст базы статистики территории (дней)", dispersion: "Размах цен относительно медианы", missing: "Отсутствующие характеристики квартиры", date: "Дата оценки", support: "Поддерживает оценку", limits: "Ограничивает оценку", neutral: "Ограниченная поддержка",
    reasons: {
      comparable_sample_limited: "В выборке меньше пяти похожих объявлений.",
      comparable_sample_insufficient: "Мало похожих объявлений; статистика территории не заменяет подбор сделок.", comparable_prices_inconsistent: "Цены похожих объявлений заметно различаются.", geographic_scope_widened: "Выборка расширена за пределы ближайшей территории или строгих критериев.", comparable_distance_incomplete: "Расстояние известно не для всех объявлений.", evidence_recency_unknown: "Свежесть доказательств установить нельзя.", evidence_stale: "Объявления или базовые данные старше шести месяцев.", evidence_date_in_future: "Даты данных позже даты оценки и требуют проверки.", source_quality_unknown: "Происхождение части данных описано недостаточно.", demo_evidence: "В оценке использованы демонстрационные данные.", property_attributes_incomplete: "Не хватает характеристик для сравнения квартир.", property_context_incomplete: "Не хватает части сведений об окружении квартиры.", transaction_baseline_unavailable: "База цены не подтверждена статистикой сделок.", market_evidence_insufficient: "Доказательств недостаточно для надёжной оценки цены. Сначала дополните данные.", baseline_recency_unknown: "Дата данных в медиане территории неизвестна.", baseline_stale: "База статистики территории старше года.",
    },
  },
  uk: {
    title: "Чому такий рівень впевненості?", levels: { high: "Висока", medium: "Середня", low: "Низька", insufficient: "Недостатньо даних" },
    note: "Оцінка якості доказів, а не ймовірність точності ціни.", unknown: "Немає даних", legacy: "У старому аналізі немає повного набору показників якості даних. Оновіть його перед рішенням.",
    listings: "Схожі оголошення", transactions: "Угоди у статистиці території", distance: "Медіана відстані (м)", distanceCount: "Оголошення з відомою відстанню", age: "Медіанний вік оголошень (днів)", oldest: "Найстаріше оголошення (днів)", baseline: "Вік бази статистики території (днів)", dispersion: "Розмах цін відносно медіани", missing: "Відсутні характеристики квартири", date: "Дата оцінки", support: "Підтримує оцінку", limits: "Обмежує оцінку", neutral: "Обмежена підтримка",
    reasons: {
      comparable_sample_limited: "У вибірці менше п'яти схожих оголошень.",
      comparable_sample_insufficient: "Мало схожих оголошень; статистика території не замінює добір угод.", comparable_prices_inconsistent: "Ціни схожих оголошень суттєво відрізняються.", geographic_scope_widened: "Вибірку розширено за межі найближчої території або суворих критеріїв.", comparable_distance_incomplete: "Відстань відома не для всіх оголошень.", evidence_recency_unknown: "Свіжість доказів встановити неможливо.", evidence_stale: "Оголошення або базові дані старші за шість місяців.", evidence_date_in_future: "Дати даних пізніші за дату оцінки й потребують перевірки.", source_quality_unknown: "Походження частини даних описано недостатньо.", demo_evidence: "В оцінці використано демонстраційні дані.", property_attributes_incomplete: "Бракує характеристик для порівняння квартир.", property_context_incomplete: "Бракує частини даних про оточення квартири.", transaction_baseline_unavailable: "База ціни не підтверджена статистикою угод.", market_evidence_insufficient: "Доказів недостатньо для надійної оцінки ціни. Спочатку доповніть дані.", baseline_recency_unknown: "Дата даних у медіані території невідома.", baseline_stale: "База статистики території старша за рік.",
    },
  },
} satisfies Record<Locale, unknown>;

export function confidenceReasons(confidence: FairPriceConfidence, locale: Locale): string[] {
  const copy = confidenceMessages[locale];
  return [...confidence.limitation_codes].sort((a, b) => Number(b === "market_evidence_insufficient") - Number(a === "market_evidence_insufficient"))
    .map(code => copy.reasons[code as keyof typeof copy.reasons] ?? copy.unknown);
}
