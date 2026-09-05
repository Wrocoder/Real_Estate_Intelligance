"use client";

import { Info } from "lucide-react";

import { dateValue, numberValue } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

import type { ProvenanceCalculationType } from "@/lib/api";

export type ProvenanceRecord = {
  sourceName?: string | null;
  sourceType?: string | null;
  updatedAt?: string | Date | null;
  sampleSize?: number | null;
  scope?: string | null;
  timeRange?: string | null;
  calculationType?: ProvenanceCalculationType | string | null;
  confidenceScore?: number | null;
  mode?: "live" | "demo" | null;
  note?: string | null;
};

type Props = {
  locale: Locale;
  provenance: ProvenanceRecord;
};

type ProvenanceCopy = {
  summary: string;
  source: string;
  sourceType: string;
  updated: string;
  sample: string;
  scope: string;
  timeRange: string;
  method: string;
  confidence: string;
  demo: string;
  unknown: string;
  days: string;
};

const COPY: Record<Locale, ProvenanceCopy> = {
  en: {
    summary: "Source and method",
    source: "Source",
    sourceType: "Source type",
    updated: "Updated",
    sample: "Observations",
    scope: "Geographic scope",
    timeRange: "Time range",
    method: "How it was prepared",
    confidence: "Confidence",
    demo: "Demo data; it is not evidence of the live market.",
    unknown: "Not supplied",
    days: "days",
  },
  pl: {
    summary: "Źródło i sposób obliczenia",
    source: "Źródło",
    sourceType: "Typ źródła",
    updated: "Aktualizacja",
    sample: "Liczba obserwacji",
    scope: "Zakres geograficzny",
    timeRange: "Zakres czasu",
    method: "Sposób przygotowania",
    confidence: "Pewność",
    demo: "Dane demonstracyjne; nie są dowodem sytuacji na żywym rynku.",
    unknown: "Nie podano",
    days: "dni",
  },
  ru: {
    summary: "Источник и способ расчета",
    source: "Источник",
    sourceType: "Тип источника",
    updated: "Обновлено",
    sample: "Наблюдений",
    scope: "Географический охват",
    timeRange: "Период",
    method: "Как подготовлено",
    confidence: "Уверенность",
    demo: "Демонстрационные данные; это не подтверждение текущего рынка.",
    unknown: "Не указано",
    days: "дн.",
  },
  uk: {
    summary: "Джерело і спосіб розрахунку",
    source: "Джерело",
    sourceType: "Тип джерела",
    updated: "Оновлено",
    sample: "Спостережень",
    scope: "Географічне охоплення",
    timeRange: "Період",
    method: "Як підготовлено",
    confidence: "Впевненість",
    demo: "Демонстраційні дані; це не підтвердження поточного ринку.",
    unknown: "Не вказано",
    days: "днів",
  },
};

const SOURCE_TYPES: Record<string, Record<Locale, string>> = {
  area_market_snapshot: {
    en: "District market snapshot",
    pl: "Migawka rynku dzielnicy",
    ru: "Снимок рынка района",
    uk: "Зріз ринку району",
  },
  area_statistics: {
    en: "District statistics",
    pl: "Statystyki dzielnicy",
    ru: "Статистика района",
    uk: "Статистика району",
  },
  derived_comparable_sample: {
    en: "Comparable sample",
    pl: "Próba porównawcza",
    ru: "Сравнительная выборка",
    uk: "Порівняльна вибірка",
  },
  derived_estimate: {
    en: "Derived estimate",
    pl: "Szacunek pochodny",
    ru: "Производная оценка",
    uk: "Похідна оцінка",
  },
  derived_model: {
    en: "Model estimate",
    pl: "Szacunek modelu",
    ru: "Оценка модели",
    uk: "Оцінка моделі",
  },
  deterministic_fixture: {
    en: "Demo fixture",
    pl: "Dane demonstracyjne",
    ru: "Демонстрационный набор",
    uk: "Демонстраційний набір",
  },
  listing_reference: {
    en: "Listing data",
    pl: "Dane ogłoszenia",
    ru: "Данные объявления",
    uk: "Дані оголошення",
  },
  listing_snapshot: {
    en: "Listing history",
    pl: "Historia ogłoszenia",
    ru: "История объявления",
    uk: "Історія оголошення",
  },
  market_snapshot: {
    en: "Market snapshot",
    pl: "Zestawienie rynku",
    ru: "Снимок рынка",
    uk: "Зріз ринку",
  },
  market_statistics: {
    en: "Market statistics",
    pl: "Statystyki rynku",
    ru: "Статистика рынка",
    uk: "Статистика ринку",
  },
  news_source: {
    en: "News source",
    pl: "Źródło informacji",
    ru: "Источник новости",
    uk: "Джерело новини",
  },
  open_data_or_admin_verified: {
    en: "Public or verified data",
    pl: "Dane publiczne lub zweryfikowane",
    ru: "Открытые или проверенные данные",
    uk: "Відкриті або перевірені дані",
  },
};

const CALCULATION_TYPES: Record<string, Record<Locale, string>> = {
  observed: {
    en: "Observed fact",
    pl: "Zaobserwowany fakt",
    ru: "Наблюдаемый факт",
    uk: "Спостережуваний факт",
  },
  calculated: {
    en: "Calculated from data",
    pl: "Obliczenie z danych",
    ru: "Расчет по данным",
    uk: "Розрахунок за даними",
  },
  model_estimate: {
    en: "Model estimate",
    pl: "Szacunek modelu",
    ru: "Оценка модели",
    uk: "Оцінка моделі",
  },
  unknown: {
    en: "Not specified",
    pl: "Nie określono",
    ru: "Не указано",
    uk: "Не визначено",
  },
};

export function ProvenanceDetails({ locale, provenance }: Props) {
  const copy = COPY[locale];
  const facts = [
    provenance.sourceName
      ? { label: copy.source, value: provenance.sourceName }
      : null,
    provenance.sourceType
      ? { label: copy.sourceType, value: sourceTypeLabel(provenance.sourceType, locale, copy) }
      : null,
    provenance.updatedAt
      ? { label: copy.updated, value: dateValue(provenance.updatedAt, locale) }
      : null,
    provenance.sampleSize !== null && provenance.sampleSize !== undefined
      ? { label: copy.sample, value: numberValue(provenance.sampleSize, locale) }
      : null,
    provenance.scope ? { label: copy.scope, value: provenance.scope } : null,
    provenance.timeRange
      ? { label: copy.timeRange, value: timeRangeLabel(provenance.timeRange, locale, copy) }
      : null,
    provenance.calculationType
      ? { label: copy.method, value: calculationTypeLabel(provenance.calculationType, locale, copy) }
      : null,
    provenance.confidenceScore !== null && provenance.confidenceScore !== undefined
      ? { label: copy.confidence, value: `${provenance.confidenceScore}/100` }
      : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  if (facts.length === 0 && !provenance.note && provenance.mode !== "demo") return null;

  return (
    <details className="provenance-details">
      <summary>
        <Info size={14} aria-hidden="true" /> {copy.summary}
      </summary>
      <div className="provenance-details-body">
        {facts.length > 0 ? (
          <dl className="provenance-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {provenance.mode === "demo" ? <p className="provenance-notice">{copy.demo}</p> : null}
        {provenance.note ? <p className="provenance-note">{provenance.note}</p> : null}
      </div>
    </details>
  );
}

function sourceTypeLabel(value: string, locale: Locale, copy: ProvenanceCopy) {
  return SOURCE_TYPES[value]?.[locale] ?? copy.unknown;
}

function calculationTypeLabel(value: string, locale: Locale, copy: ProvenanceCopy) {
  return CALCULATION_TYPES[value]?.[locale] ?? CALCULATION_TYPES.unknown[locale] ?? copy.unknown;
}

function timeRangeLabel(value: string, locale: Locale, copy: ProvenanceCopy) {
  const match = value.match(/^(?:last\s+)?(\d+)\s*(?:d|days|dni|дн\.?|днів)$/i);
  return match ? `${numberValue(Number(match[1]), locale)} ${copy.days}` : value;
}
