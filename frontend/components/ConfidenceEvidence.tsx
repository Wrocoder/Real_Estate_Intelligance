import type { FairPriceConfidence } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { dateValue, numberValue } from "@/lib/format";
import { confidenceMessages, confidenceReasons, valuationConfidenceLevel } from "@/lib/confidenceMessages";

export function ConfidenceEvidence({ confidence, locale, factorLabels }: {
  confidence: FairPriceConfidence; locale: Locale; factorLabels: Record<string, string>;
}) {
  const copy = confidenceMessages[locale];
  const number = (value?: number | null) => typeof value === "number" && Number.isFinite(value) ? numberValue(value, locale) : copy.unknown;
  const measured = confidence.model_version === "fair-price-confidence-v2";
  return <section className="comparable-confidence confidence-explanation" aria-label={copy.title}>
    <h3>{copy.title} {copy.levels[valuationConfidenceLevel(confidence)!]}</h3>
    <p>{copy.note}</p>
    {!measured && <p>{copy.legacy}</p>}
    <dl className="comparable-evidence-facts">
      <Fact label={copy.listings} value={number(confidence.comparable_count)} />
      <Fact label={copy.transactions} value={number(confidence.transaction_observation_count)} />
      <Fact label={copy.distance} value={number(confidence.median_distance_m)} />
      <Fact label={copy.distanceCount} value={number(measured ? confidence.distance_observation_count : null)} />
      <Fact label={copy.age} value={number(confidence.median_age_days)} />
      <Fact label={copy.oldest} value={number(confidence.oldest_age_days)} />
      <Fact label={copy.baseline} value={number(confidence.baseline_age_days)} />
      <Fact label={copy.dispersion} value={confidence.price_dispersion_pct == null ? copy.unknown : `${number(confidence.price_dispersion_pct)}%`} />
      <Fact label={copy.missing} value={number(confidence.missing_property_fields?.length)} />
      <Fact label={copy.date} value={confidence.evaluated_at ? dateValue(confidence.evaluated_at, locale) : copy.unknown} />
    </dl>
    <ul className="confidence-reasons">{confidenceReasons(confidence, locale).map((reason, index) => <li key={index}>{reason}</li>)}</ul>
    {measured && <ul className="confidence-factor-statuses">{confidence.factors.map(factor => <li key={factor.code} data-status={factor.status}>
      <span>{factorLabels[factor.code] ?? copy.unknown}</span>
      <strong>{factor.status === "unknown" || factor.score == null ? copy.unknown : factor.status === "supporting" ? copy.support : factor.status === "limiting" ? copy.limits : copy.neutral}</strong>
    </li>)}</ul>}
  </section>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
