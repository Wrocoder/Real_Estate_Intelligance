"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";

import { api, type CoverageMetadata } from "@/lib/api";
import { dateValue } from "@/lib/format";
import { useLocalePreference } from "@/lib/useLocalePreference";

const COPY = {
  en: {
    title: "Current geographic coverage",
    loading: "Checking supported locations...",
    unavailable: "Coverage details are temporarily unavailable. We will not rate a location until its market data is available.",
    cities: "Locations with data",
    browse: "Browse locations",
    checked: "Coverage checked",
    source: "Coverage source",
    areas: "Neighborhoods with data",
    freshness: "The date is the latest area-statistics calculation, not today's market observation.",
    note: "An unsupported city or district gets no confident market estimate. Start with a supported area or check the listing details manually.",
  },
  pl: {
    title: "Aktualny zakres geograficzny",
    loading: "Sprawdzamy obsługiwane lokalizacje...",
    unavailable: "Szczegóły zasięgu są chwilowo niedostępne. Nie ocenimy lokalizacji, dopóki nie będzie dla niej danych rynkowych.",
    cities: "Miejscowości z danymi",
    browse: "Przeglądaj lokalizacje",
    checked: "Sprawdzono zakres",
    source: "Źródło zakresu",
    areas: "Osiedla z danymi",
    freshness: "Data oznacza ostatnie obliczenie statystyk obszaru, a nie dzisiejszą obserwację rynku.",
    note: "Dla nieobsługiwanego miasta lub rejonu nie pokazujemy pewnej wyceny rynkowej. Wybierz obsługiwany obszar albo sprawdź dane ogłoszenia ręcznie.",
  },
  ru: {
    title: "Текущее географическое покрытие",
    loading: "Проверяем поддерживаемые локации...",
    unavailable: "Данные о покрытии временно недоступны. Мы не будем уверенно оценивать локацию без рыночных данных.",
    cities: "Населённые пункты с данными",
    browse: "Посмотреть локации",
    checked: "Покрытие проверено",
    source: "Источник покрытия",
    areas: "Районы с данными",
    freshness: "Дата означает последний расчёт районной статистики, а не сегодняшнее наблюдение рынка.",
    note: "Для неподдерживаемого города или района мы не показываем уверенную рыночную оценку. Выберите поддерживаемый район или проверьте данные объявления вручную.",
  },
  uk: {
    title: "Поточне географічне покриття",
    loading: "Перевіряємо підтримувані локації...",
    unavailable: "Дані про покриття тимчасово недоступні. Ми не будемо впевнено оцінювати локацію без ринкових даних.",
    cities: "Населені пункти з даними",
    browse: "Переглянути локації",
    checked: "Покриття перевірено",
    source: "Джерело покриття",
    areas: "Райони з даними",
    freshness: "Дата означає останній розрахунок районної статистики, а не сьогоднішнє спостереження ринку.",
    note: "Для непідтримуваного міста або району ми не показуємо впевнену ринкову оцінку. Виберіть підтримуваний район або перевірте дані оголошення вручну.",
  },
} as const;

export function CoverageNotice() {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const [coverage, setCoverage] = useState<CoverageMetadata | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api.getCoverage().then((payload) => {
      if (!cancelled) setCoverage(payload);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="coverage-notice" aria-label={copy.title}>
      <div className="coverage-notice-heading">
        <MapPinned size={18} />
        <strong>{copy.title}</strong>
      </div>
      {coverage ? (
        <>
          <div className="coverage-summary">
            <span><b>{copy.cities}</b> {coverage.supported_cities.length.toLocaleString(locale)}</span>
            <span><b>{copy.areas}</b> {coverage.supported_districts.length.toLocaleString(locale)}</span>
            <span><b>{copy.checked}</b> {dateValue(coverage.checked_at, locale)}</span>
            <span><b>{copy.source}</b> {coverage.source_name}</span>
          </div>
          <Link className="coverage-notice-link" href="/areas">
            {copy.browse} <ArrowRight aria-hidden="true" size={15} />
          </Link>
          <p>{copy.note}</p>
          <small>{copy.freshness}</small>
        </>
      ) : (
        <p>{failed ? copy.unavailable : copy.loading}</p>
      )}
    </section>
  );
}
