import type { Locale } from "@/lib/i18n";

const INTL_LOCALES: Record<Locale, string> = {
  en: "en-US",
  pl: "pl-PL",
  ru: "ru-RU",
  uk: "uk-UA",
};

export function money(value: number, locale?: Locale) {
  return `${new Intl.NumberFormat(intlLocale(locale)).format(value)} PLN`;
}

export function numberValue(value: number, locale?: Locale) {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function percent(value: number, locale?: Locale) {
  const sign = value > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${sign}${formatted}%`;
}

export function dateValue(value: string | Date, locale?: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export function scoreTone(score: number) {
  if (score >= 75) return "strong";
  if (score >= 50) return "medium";
  return "weak";
}

function intlLocale(locale: Locale | undefined) {
  return locale ? INTL_LOCALES[locale] : "pl-PL";
}
