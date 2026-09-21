import type { ListingAnalysis } from "@/lib/api";
import { dateValue, money, numberValue } from "@/lib/format";
import { fairPriceEvidenceMessages } from "@/lib/fairPriceEvidenceMessages";
import type { Locale } from "@/lib/i18n";

export function FairPriceEvidencePanel({ analysis, locale }: { analysis: ListingAnalysis; locale: Locale }) {
  const copy = fairPriceEvidenceMessages[locale];
  const evidence = analysis.scores.fair_price_evidence;
  const area = analysis.area_statistics;
  const transactionBasis = evidence?.area_price_basis === "transaction_observed";
  const sample = transactionBasis ? area.transaction_observation_count : area.data_provenance.sample_size;
  const date = (value?: string | null) => value ? dateValue(value, locale) : copy.unknown;
  const number = (value?: number | null) => typeof value === "number" && Number.isFinite(value) ? numberValue(value, locale) : copy.unknown;
  const basis = transactionBasis ? copy.transactions : evidence?.area_price_basis === "listing_observed" ? copy.asking : copy.unknown;

  return (
    <section className="fair-price-evidence" aria-labelledby="fair-price-evidence-title">
      <h2 id="fair-price-evidence-title">{copy.title}</h2>
      {!evidence ? <p>{copy.legacy}</p> : <>
        <p className="muted-text">{copy.estimate}</p>
        <dl className="comparable-evidence-facts">
          <Fact label={copy.result} value={`${money(analysis.scores.fair_price_low, locale)} - ${money(analysis.scores.fair_price_high, locale)}`} />
          <Fact label={`${copy.area} (${basis})`} value={`${money(evidence.area_median_per_m2, locale)}/m²`} />
          <Fact label={`${copy.area}: ${copy.weight}`} value={`${number(evidence.area_weight * 100)}%`} />
          <Fact label={copy.listings} value={evidence.listing_median_per_m2 == null ? copy.unknown : `${money(evidence.listing_median_per_m2, locale)}/m²`} />
          <Fact label={`${copy.listings}: ${copy.weight}`} value={`${number(evidence.listing_weight * 100)}%`} />
          <Fact label={copy.sample} value={number(evidence.listings_used_count)} />
          <Fact label={copy.size} value={`${number(evidence.subject_area_m2)} m²`} />
          <Fact label={copy.range} value={`±${number(evidence.range_half_width_pct)}%`} />
          <Fact label={copy.rounding} value={money(evidence.rounding_step_pln, locale)} />
        </dl>
        <p>{copy.method}</p>
        {evidence.method === "area_median" && <p className="fair-price-evidence-limitation">{copy.fallback} {copy.minimum}: {number(evidence.minimum_listing_sample)}.</p>}
        <p>{copy.widthNote}</p>
        <h3>{copy.derived}: {copy.area}</h3>
        <dl className="comparable-evidence-facts">
          <Fact label={copy.scope} value={area.data_provenance.geographic_scope || area.name || copy.unknown} />
          <Fact label={copy.updated} value={date(area.data_provenance.updated_at)} />
          <Fact label={copy.sources} value={area.data_sources?.join(", ") || area.data_provenance.source_name || copy.unknown} />
          {transactionBasis && <>
            <Fact label={copy.count} value={number(area.transaction_observation_count)} />
            <Fact label={copy.period} value={`${date(area.transaction_observed_from)} - ${date(area.transaction_observed_to)}`} />
            <Fact label={copy.window} value={number(area.transaction_window_days)} />
          </>}
          <Fact label={copy.reference} value={date(evidence.selection_reference_date)} />
        </dl>
        {transactionBasis && <p className="fair-price-transaction-note">{copy.transactionNote}</p>}
        {(sample == null || sample < 3) && <p className="fair-price-evidence-limitation">{copy.missingSample}</p>}
        <p>{copy.scopeNote}</p>
        {!evidence.property_adjustments_applied && <p className="fair-price-adjustments">{copy.adjustments}</p>}
      </>}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
