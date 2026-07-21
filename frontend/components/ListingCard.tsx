"use client";

import Link from "next/link";
import { BarChart3, FileText, Heart, MapPin } from "lucide-react";

import type { ListingAnalysis } from "@/lib/api";
import { money } from "@/lib/format";
import { DEFAULT_LOCALE, LISTING_CARD_COPY, type Locale } from "@/lib/i18n";
import { decisionTone, scoreLabel } from "@/lib/scoreLabels";

type Props = {
  analysis: ListingAnalysis;
  onFavorite: (listingId: string) => void;
  onReport: (listingId: string) => void;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (listingId: string) => void;
  locale?: Locale;
};

export function ListingCard({
  analysis,
  onFavorite,
  onReport,
  isSelectedForCompare = false,
  onToggleCompare,
  locale = DEFAULT_LOCALE,
}: Props) {
  const { listing, scores } = analysis;
  const copy = LISTING_CARD_COPY[locale];
  const verdictTone = decisionTone(scores);
  const attributeLabels = [
    listing.building_type,
    listing.renovation_state,
    listing.has_balcony ? copy.attributes.balcony : "",
    listing.has_terrace ? copy.attributes.terrace : "",
    listing.has_garden ? copy.attributes.garden : "",
    listing.has_elevator ? copy.attributes.elevator : "",
    listing.parking_type
      ? copy.parking(formatAttribute(listing.parking_type, copy.attributes))
      : "",
    listing.heating_type
      ? copy.heating(formatAttribute(listing.heating_type, copy.attributes))
      : "",
  ]
    .map((value) => formatAttribute(value, copy.attributes))
    .filter(Boolean);

  return (
    <article className="listing-card">
      <div>
        <h3>
          <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
        </h3>
        <div className="muted">
          <MapPin size={14} /> {listing.address}, {listing.district}
        </div>
        <div className="meta-row">
          <span>{money(listing.price, locale)}</span>
          <span>
            {money(listing.price_per_m2, locale)}/{copy.pricePerM2}
          </span>
          <span>{listing.area_m2.toFixed(1)} m2</span>
          <span>{copy.rooms(listing.rooms)}</span>
          <span>{copy.days(listing.days_on_market)}</span>
        </div>
        {attributeLabels.length ? (
          <div className="meta-row">
            {attributeLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        ) : null}
        <div className="meta-row">
          <span className={`status-pill ${verdictTone}`}>
            {scoreLabel(scores.decision_label, locale)}
          </span>
          <span className="score-pill">
            <BarChart3 size={14} /> {copy.scorePrefixes.investment}{" "}
            {scores.investment_score}
          </span>
          <span className="score-pill risk">
            {copy.scorePrefixes.risk} {scores.risk_score}
          </span>
          <span className="score-pill">
            {copy.scorePrefixes.negotiation} {scores.negotiation_score}
          </span>
        </div>
      </div>
      <div className="toolbar">
        {onToggleCompare ? (
          <label className="compare-toggle" title={copy.compareTitle}>
            <input
              type="checkbox"
              checked={isSelectedForCompare}
              onChange={() => onToggleCompare(listing.id)}
            />
            <span>{copy.compare}</span>
          </label>
        ) : null}
        <button
          className="icon-button"
          type="button"
          title={copy.favoriteTitle}
          onClick={() => onFavorite(listing.id)}
        >
          <Heart size={18} />
        </button>
        <button
          className="icon-button"
          type="button"
          title={copy.reportTitle}
          onClick={() => onReport(listing.id)}
        >
          <FileText size={18} />
        </button>
        <Link className="button" href={`/listings/${listing.id}`}>
          {copy.open}
        </Link>
      </div>
    </article>
  );
}

function formatAttribute(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) return "";
  return labels[value] ?? value.replaceAll("_", " ");
}
