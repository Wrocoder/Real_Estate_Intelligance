"use client";

import { AlertTriangle, FlaskConical, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type BannerCopy = {
  title: string;
  body: string;
  checking: string;
  error: string;
  retry: string;
};

const COPY: Record<Locale, BannerCopy> = {
  pl: {
    title: "Tryb demonstracyjny",
    body: "Pokazane mieszkania i analizy są danymi testowymi, a nie ofertami rynkowymi.",
    checking: "Sprawdzamy źródło danych...",
    error: "Nie udało się potwierdzić źródła danych. Nie opieraj decyzji na tych informacjach.",
    retry: "Sprawdź ponownie",
  },
  en: {
    title: "Demo mode",
    body: "The apartments and analyses shown are test data, not live market listings.",
    checking: "Checking the data source...",
    error: "The data source could not be verified. Do not base a decision on this information.",
    retry: "Check again",
  },
  ru: {
    title: "Демонстрационный режим",
    body: "Показанные квартиры и расчёты — тестовые данные, а не реальные объявления.",
    checking: "Проверяем источник данных...",
    error: "Не удалось подтвердить источник данных. Не принимайте решение на основе этой информации.",
    retry: "Проверить снова",
  },
  uk: {
    title: "Демонстраційний режим",
    body: "Показані квартири й розрахунки є тестовими даними, а не реальними оголошеннями.",
    checking: "Перевіряємо джерело даних...",
    error: "Не вдалося підтвердити джерело даних. Не приймайте рішення на основі цієї інформації.",
    retry: "Перевірити знову",
  },
};

export function DemoModeBanner({ initialLocale }: { initialLocale: Locale }) {
  const { locale } = useLocalePreference(initialLocale);
  const [status, setStatus] = useState<"checking" | "demo" | "live" | "error">(
    "checking",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("checking");
    api.getRuntimeContext()
      .then((context) => {
        if (!cancelled) setStatus(context.data_mode === "demo" ? "demo" : "live");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status === "live") return null;
  const copy = COPY[locale];

  if (status === "checking") {
    return (
      <div className="demo-mode-banner checking" role="status">
        <RefreshCw aria-hidden="true" className="spin" size={18} />
        <span>{copy.checking}</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="demo-mode-banner error" role="alert">
        <AlertTriangle aria-hidden="true" size={18} />
        <div>
          <strong>{copy.error}</strong>
          <button className="button secondary compact" onClick={() => setAttempt((value) => value + 1)}>
            <RefreshCw aria-hidden="true" size={15} />
            {copy.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-mode-banner" role="status" data-testid="demo-mode-banner">
      <FlaskConical aria-hidden="true" size={18} />
      <div>
        <strong>{copy.title}</strong>
        <span>{copy.body}</span>
      </div>
    </div>
  );
}
