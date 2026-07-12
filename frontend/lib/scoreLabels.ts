import type { PropertyScores } from "@/lib/api";

const LABELS: Record<string, string> = {
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
};

export function scoreLabel(value: string) {
  return LABELS[value] ?? value;
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
