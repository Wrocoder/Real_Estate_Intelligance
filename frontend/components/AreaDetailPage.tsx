"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, ClipboardCheck, RefreshCw } from "lucide-react";

import { AreaDynamicEvidence } from "@/components/AreaDynamicEvidence";
import { CoverageNotice } from "@/components/CoverageNotice";
import { api, type AreaStatistics } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type Copy = {
  back: string;
  title: (name: string) => string;
  subtitle: string;
  compare: string;
  check: string;
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
          <Link className="button primary" href={`/check?district=${encodeURIComponent(area.name)}`}>
            <ClipboardCheck size={16} /> {copy.check}
          </Link>
        </div>
      </header>
      <CoverageNotice />
      <AreaDynamicEvidence areaId={area.area_id} city={area.city} district={area.name} />
    </>
  );
}
