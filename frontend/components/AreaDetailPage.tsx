"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, ClipboardCheck, RefreshCw } from "lucide-react";

import { AreaDynamicEvidence } from "@/components/AreaDynamicEvidence";
import { CoverageNotice } from "@/components/CoverageNotice";
import { api, type AreaStatistics } from "@/lib/api";
import { dateValue, money, numberValue } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type Copy = {
  back: string;
  title: (name: string) => string;
  subtitle: string;
  compare: string;
  check: string;
  checkCtaTitle: (name: string) => string;
  checkCtaText: (name: string) => string;
  checkCtaNote: string;
  evidenceTitle: string;
  referencePrice: string;
  evidenceBasis: string;
  observations: string;
  period: string;
  updated: string;
  transactionBasis: string;
  listingBasis: string;
  unknown: string;
  demoSource: string;
  evidenceNote: string;
  loading: string;
  error: string;
  retry: string;
};

const COPY: Record<Locale, Copy> = {
  pl: {
    back: "Osiedla",
    title: (name) => `${name}: czy warto kupić tu mieszkanie?`,
    subtitle: "Najpierw zobacz, co potwierdzają dane o cenach, otoczeniu i planowanych zmianach, a potem sprawdź konkretny adres.",
    compare: "Porównaj osiedla",
    check: "Sprawdź mieszkanie",
    checkCtaTitle: (name) => `Znalazłeś mieszkanie w rejonie ${name}?`,
    checkCtaText: (name) => `Wklej ogłoszenie, a WartoMetr porówna cenę konkretnego mieszkania z dostępnymi danymi dla ${name}.`,
    checkCtaNote: "Jeśli danych będzie za mało, pokażemy ograniczenia zamiast pewnej wyceny.",
    evidenceTitle: "Co wiemy o cenach w tej okolicy",
    referencePrice: "Cena odniesienia",
    evidenceBasis: "Podstawa",
    observations: "Obserwacje",
    period: "Okres",
    updated: "Aktualizacja",
    transactionBasis: "transakcje",
    listingBasis: "ogłoszenia",
    unknown: "brak danych",
    demoSource: "dane demonstracyjne",
    evidenceNote: "To kontekst dla okolicy, nie wycena konkretnego mieszkania. Dokładny adres, metraż, stan i piętro sprawdzisz w analizie ogłoszenia.",
    loading: "Pobieramy dane osiedla...",
    error: "Nie znaleźliśmy zweryfikowanych statystyk dla tego obszaru.",
    retry: "Sprawdź ponownie",
  },
  en: {
    back: "Neighborhoods",
    title: (name) => `${name}: is it a good place to buy an apartment?`,
    subtitle: "Start with what price, surroundings and planned-change data supports, then verify the specific address.",
    compare: "Compare neighborhoods",
    check: "Check an apartment",
    checkCtaTitle: (name) => `Found an apartment in ${name}?`,
    checkCtaText: (name) => `Paste the listing and WartoMetr will compare that specific apartment price with the available evidence for ${name}.`,
    checkCtaNote: "If evidence is too thin, we will show the limitation instead of a confident estimate.",
    evidenceTitle: "What we know about prices here",
    referencePrice: "Reference price",
    evidenceBasis: "Basis",
    observations: "Observations",
    period: "Period",
    updated: "Updated",
    transactionBasis: "transactions",
    listingBasis: "listings",
    unknown: "unknown",
    demoSource: "demo data",
    evidenceNote: "This is neighborhood context, not a valuation of a specific apartment. Use the listing check for exact address, size, condition and floor.",
    loading: "Fetching neighborhood data...",
    error: "We could not find verified statistics for this area.",
    retry: "Check again",
  },
  ru: {
    back: "Районы",
    title: (name) => `${name}: стоит ли покупать здесь квартиру?`,
    subtitle: "Сначала посмотрите, что подтверждают данные о ценах, окружении и планируемых изменениях, затем проверьте конкретный адрес.",
    compare: "Сравнить районы",
    check: "Проверить квартиру",
    checkCtaTitle: (name) => `Нашли квартиру в районе ${name}?`,
    checkCtaText: (name) => `Вставьте объявление, и WartoMetr сравнит цену конкретной квартиры с доступными данными по району ${name}.`,
    checkCtaNote: "Если данных будет недостаточно, мы покажем ограничение вместо уверенной оценки.",
    evidenceTitle: "Что известно о ценах здесь",
    referencePrice: "Ориентир цены",
    evidenceBasis: "Основа",
    observations: "Наблюдения",
    period: "Период",
    updated: "Обновлено",
    transactionBasis: "сделки",
    listingBasis: "объявления",
    unknown: "нет данных",
    demoSource: "демонстрационные данные",
    evidenceNote: "Это контекст района, а не оценка конкретной квартиры. Точный адрес, площадь, состояние и этаж проверяются в анализе объявления.",
    loading: "Загружаем данные района...",
    error: "Для этого района не найдена подтверждённая статистика.",
    retry: "Проверить снова",
  },
  uk: {
    back: "Райони",
    title: (name) => `${name}: чи варто купувати тут квартиру?`,
    subtitle: "Спочатку перегляньте, що підтверджують дані про ціни, оточення і заплановані зміни, потім перевірте конкретну адресу.",
    compare: "Порівняти райони",
    check: "Перевірити квартиру",
    checkCtaTitle: (name) => `Знайшли квартиру в районі ${name}?`,
    checkCtaText: (name) => `Вставте оголошення, і WartoMetr порівняє ціну конкретної квартири з доступними даними для району ${name}.`,
    checkCtaNote: "Якщо даних буде замало, ми покажемо обмеження замість впевненої оцінки.",
    evidenceTitle: "Що відомо про ціни тут",
    referencePrice: "Орієнтир ціни",
    evidenceBasis: "Основа",
    observations: "Спостереження",
    period: "Період",
    updated: "Оновлено",
    transactionBasis: "угоди",
    listingBasis: "оголошення",
    unknown: "немає даних",
    demoSource: "демонстраційні дані",
    evidenceNote: "Це контекст району, а не оцінка конкретної квартири. Точну адресу, площу, стан і поверх перевіряйте в аналізі оголошення.",
    loading: "Завантажуємо дані району...",
    error: "Для цього району не знайдено підтвердженої статистики.",
    retry: "Перевірити знову",
  },
};

export function AreaDetailPage({
  areaId,
  initialArea,
}: {
  areaId: string;
  initialArea: AreaStatistics | null;
}) {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const [area, setArea] = useState(initialArea);
  const [loading, setLoading] = useState(initialArea === null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setArea(await api.getAreaStatistics(areaId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    if (initialArea === null) void load();
  }, [initialArea, load]);

  if (loading) return <div className="empty-state" role="status">{copy.loading}</div>;
  if (failed || !area) {
    return (
      <div className="empty-state state-block error" role="alert">
        <strong>{copy.error}</strong>
        <div className="state-block-actions">
          <button className="button" onClick={() => void load()} type="button">
            <RefreshCw aria-hidden="true" size={15} /> {copy.retry}
          </button>
          <Link className="button" href="/areas"><ArrowLeft size={15} /> {copy.back}</Link>
        </div>
      </div>
    );
  }

  const checkHref = `/check?city=${encodeURIComponent(area.city)}&district=${encodeURIComponent(area.name)}`;

  return (
    <>
      <header className="page-header">
        <div>
          <Link className="button" href="/areas"><ArrowLeft size={16} /> {copy.back}</Link>
          <h1 style={{ marginTop: 14 }}>{copy.title(area.name)}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="toolbar">
          <Link className="button" href={`/areas/compare?area=${encodeURIComponent(area.area_id)}`}>
            <BarChart3 size={16} /> {copy.compare}
          </Link>
          <Link className="button primary" href={checkHref}>
            <ClipboardCheck size={16} /> {copy.check}
          </Link>
        </div>
      </header>
      <CoverageNotice />
      <AreaEvidenceSummary area={area} copy={copy} locale={locale} />
      <section className="area-check-cta" aria-labelledby="area-check-cta-title">
        <div>
          <h2 id="area-check-cta-title">{copy.checkCtaTitle(area.name)}</h2>
          <p>{copy.checkCtaText(area.name)}</p>
          <small>{copy.checkCtaNote}</small>
        </div>
        <Link className="button primary" href={checkHref}>
          <ClipboardCheck size={16} /> {copy.check}
        </Link>
      </section>
      <AreaDynamicEvidence areaId={area.area_id} city={area.city} district={area.name} />
    </>
  );
}

function AreaEvidenceSummary({
  area,
  copy,
  locale,
}: {
  area: AreaStatistics;
  copy: Copy;
  locale: Locale;
}) {
  const transactionBased = area.price_basis === "transaction_observed";
  const sampleSize = area.data_provenance.sample_size
    ?? (transactionBased ? area.transaction_observation_count : area.active_listings);
  const sourceLabel = area.data_provenance.mode === "demo"
    ? copy.demoSource
    : transactionBased
      ? copy.transactionBasis
      : copy.listingBasis;
  const updatedAt = area.data_provenance.updated_at
    ? dateValue(area.data_provenance.updated_at, locale)
    : copy.unknown;

  return (
    <section className="area-evidence-summary" aria-labelledby="area-evidence-summary-title">
      <div>
        <h2 id="area-evidence-summary-title">{copy.evidenceTitle}</h2>
        <p>{copy.evidenceNote}</p>
      </div>
      <dl>
        <div>
          <dt>{copy.referencePrice}</dt>
          <dd>{money(area.median_price_per_m2, locale)}/m²</dd>
        </div>
        <div>
          <dt>{copy.evidenceBasis}</dt>
          <dd>{sourceLabel}</dd>
        </div>
        <div>
          <dt>{copy.observations}</dt>
          <dd>{numberValue(sampleSize, locale)}</dd>
        </div>
        <div>
          <dt>{copy.period}</dt>
          <dd>{area.data_provenance.time_range ?? copy.unknown}</dd>
        </div>
        <div>
          <dt>{copy.updated}</dt>
          <dd>{updatedAt}</dd>
        </div>
      </dl>
    </section>
  );
}
