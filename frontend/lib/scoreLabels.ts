import type { PropertyScores } from "@/lib/api";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const LABELS: Record<Locale, Record<string, string>> = {
  en: {
    strong_candidate: "Strong candidate",
    good_option: "Good option",
    fair_option: "Fair option",
    overpriced: "Looks expensive",
    risky: "High risk",
    weak_fit: "Weak fit",
    below_fair: "Below fair price",
    fair: "In fair range",
    above_fair: "Above fair price",
    low_risk: "Low risk",
    moderate_risk: "Moderate risk",
    elevated_risk: "Elevated risk",
    high_risk: "High risk",
    weak_negotiation: "Weak negotiation",
    some_negotiation: "Some negotiation",
    negotiable: "Negotiable",
    strong_negotiation: "Strong negotiation",
    weak: "Weak",
    moderate: "Moderate",
    good: "Good",
    strong: "Strong",
  },
  pl: {
    strong_candidate: "Mocny kandydat",
    good_option: "Dobra opcja",
    fair_option: "Rozsądna opcja",
    overpriced: "Wygląda drogo",
    risky: "Wysokie ryzyko",
    weak_fit: "Słabe dopasowanie",
    below_fair: "Poniżej fair price",
    fair: "W fair range",
    above_fair: "Powyżej fair price",
    low_risk: "Niskie ryzyko",
    moderate_risk: "Umiarkowane ryzyko",
    elevated_risk: "Podwyższone ryzyko",
    high_risk: "Wysokie ryzyko",
    weak_negotiation: "Słaby potencjał negocjacji",
    some_negotiation: "Jest miejsce na negocjacje",
    negotiable: "Warto negocjować",
    strong_negotiation: "Silny potencjał negocjacji",
    weak: "Słaby",
    moderate: "Średni",
    good: "Dobry",
    strong: "Silny",
  },
  ru: {
    strong_candidate: "Сильный кандидат",
    good_option: "Хороший вариант",
    fair_option: "Нормальный вариант",
    overpriced: "Похоже дорого",
    risky: "Высокий риск",
    weak_fit: "Слабое совпадение",
    below_fair: "Ниже fair price",
    fair: "В fair range",
    above_fair: "Выше fair price",
    low_risk: "Низкий риск",
    moderate_risk: "Умеренный риск",
    elevated_risk: "Повышенный риск",
    high_risk: "Высокий риск",
    weak_negotiation: "Слабый торг",
    some_negotiation: "Есть торг",
    negotiable: "Торг уместен",
    strong_negotiation: "Сильный торг",
    weak: "Слабый",
    moderate: "Средний",
    good: "Хороший",
    strong: "Сильный",
  },
  uk: {
    strong_candidate: "Сильний кандидат",
    good_option: "Хороший варіант",
    fair_option: "Нормальний варіант",
    overpriced: "Схоже дорого",
    risky: "Високий ризик",
    weak_fit: "Слабка відповідність",
    below_fair: "Нижче fair price",
    fair: "У fair range",
    above_fair: "Вище fair price",
    low_risk: "Низький ризик",
    moderate_risk: "Помірний ризик",
    elevated_risk: "Підвищений ризик",
    high_risk: "Високий ризик",
    weak_negotiation: "Слабкий торг",
    some_negotiation: "Є простір для торгу",
    negotiable: "Торг доречний",
    strong_negotiation: "Сильний торг",
    weak: "Слабкий",
    moderate: "Середній",
    good: "Хороший",
    strong: "Сильний",
  },
};

export function scoreLabel(value: string, locale: Locale = DEFAULT_LOCALE) {
  return LABELS[locale][value] ?? LABELS[DEFAULT_LOCALE][value] ?? value;
}

export function decisionTone(scores: PropertyScores) {
  if (scores.decision_label === "risky" || scores.decision_label === "weak_fit") {
    return "warning";
  }
  if (scores.decision_label === "overpriced") {
    return "error";
  }
  return "info";
}
