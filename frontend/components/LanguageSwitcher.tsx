"use client";

import { Languages } from "lucide-react";

import {
  LANGUAGE_SWITCHER_LABELS,
  LOCALE_OPTIONS,
  type Locale,
} from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

export function LanguageSwitcher({ initialLocale }: { initialLocale: Locale }) {
  const { locale, setLocale } = useLocalePreference(initialLocale);
  const labels = LANGUAGE_SWITCHER_LABELS[locale];

  return (
    <section className="language-switcher" aria-label={labels.ariaLabel}>
      <div className="language-switcher-header">
        <Languages size={16} />
        <span>{labels.label}</span>
      </div>
      <div className="language-options" role="group" aria-label={labels.menuLabel}>
        {LOCALE_OPTIONS.map((option) => (
          <button
            aria-pressed={option.code === locale}
            className={option.code === locale ? "active" : undefined}
            key={option.code}
            onClick={() => setLocale(option.code)}
            title={`${option.nativeName} (${option.englishName})`}
            type="button"
          >
            {option.shortLabel}
          </button>
        ))}
      </div>
    </section>
  );
}
