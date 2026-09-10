"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

import { api, type AreaStatistics } from "@/lib/api";
import { dateValue, money } from "@/lib/format";
import { GUIDE_UI_COPY } from "@/lib/guideUiCopy";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

export function GuideRelatedAreas({
  areaSlugs,
  initialLocale,
}: {
  areaSlugs: string[];
  initialLocale: Locale;
}) {
  const { locale } = useLocalePreference(initialLocale);
  const copy = GUIDE_UI_COPY[locale];
  const [areas, setAreas] = useState<AreaStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedCount, setFailedCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled(
      areaSlugs.map((areaId) => api.getAreaStatistics(areaId)),
    );
    setAreas(
      results.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      ),
    );
    setFailedCount(
      results.filter((result) => result.status === "rejected" || !result.value).length,
    );
    setLoading(false);
  }, [areaSlugs]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <p className="guide-area-state" aria-live="polite">{copy.areasLoading}</p>;
  }

  if (!areas.length) {
    return (
      <div className="guide-area-state error" role="alert">
        <p>{copy.areasError}</p>
        <button className="button" onClick={() => void load()} type="button">
          <RefreshCw aria-hidden="true" size={14} /> {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="guide-related-areas">
      {failedCount ? <p className="guide-area-state warning">{copy.areasPartial}</p> : null}
      <ul>
        {areas.map((area) => {
          const hasPrice = area.median_price_per_m2 > 0;
          const transactionBased = area.price_basis === "transaction_observed";
          const updatedAt = area.data_provenance.updated_at;
          return (
            <li key={area.area_id}>
              <Link href={`/areas/${encodeURIComponent(area.area_id)}`}>
                <span>
                  <strong>{area.name}</strong>
                  <small>{transactionBased ? copy.transaction : copy.listing}</small>
                </span>
                <b>{hasPrice ? `${money(area.median_price_per_m2, locale)}/m²` : copy.noPrice}</b>
                <small>
                  {copy.source}: {area.data_provenance.source_name ?? copy.sourceUnknown}
                  {updatedAt ? ` · ${copy.sourceUpdated}: ${dateValue(updatedAt, locale)}` : ""}
                </small>
                {area.data_provenance.mode === "demo" ? (
                  <span className="status-pill warning">{copy.demo}</span>
                ) : null}
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
