"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_CHANGED_EVENT,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  type Locale,
  normalizeLocale,
} from "@/lib/i18n";

type LocaleChangedEvent = CustomEvent<{ locale: Locale }>;

export function useLocalePreference(initialLocale: Locale = DEFAULT_LOCALE) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const storedLocale = readStoredLocale(initialLocale);
    setLocaleState(storedLocale);
    applyLocalePreference(storedLocale);

    const handleLocaleChanged = (event: Event) => {
      const nextLocale = (event as LocaleChangedEvent).detail?.locale;
      if (nextLocale) setLocaleState(nextLocale);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY) {
        setLocaleState(normalizeLocale(event.newValue));
      }
    };

    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialLocale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    applyLocalePreference(nextLocale);
    window.dispatchEvent(
      new CustomEvent(LOCALE_CHANGED_EVENT, {
        detail: { locale: nextLocale },
      }),
    );
  };

  return { locale, setLocale };
}

export function readStoredLocale(fallback: Locale = DEFAULT_LOCALE): Locale {
  if (typeof window === "undefined") return fallback;
  return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY) ?? fallback);
}

function applyLocalePreference(locale: Locale) {
  document.documentElement.lang = locale;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
