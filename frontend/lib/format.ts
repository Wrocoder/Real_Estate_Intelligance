export function money(value: number) {
  return `${new Intl.NumberFormat("pl-PL").format(value)} PLN`;
}

export function numberValue(value: number) {
  return new Intl.NumberFormat("pl-PL").format(value);
}

export function percent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function scoreTone(score: number) {
  if (score >= 75) return "strong";
  if (score >= 50) return "medium";
  return "weak";
}

