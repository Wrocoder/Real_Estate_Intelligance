"use client";

import Link from "next/link";
import { BarChart3, FileText, Heart, MapPin } from "lucide-react";

import type { ListingAnalysis } from "@/lib/api";
import { money } from "@/lib/format";

type Props = {
  analysis: ListingAnalysis;
  onFavorite: (listingId: string) => void;
  onReport: (listingId: string) => void;
};

export function ListingCard({ analysis, onFavorite, onReport }: Props) {
  const { listing, scores } = analysis;

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
          <span>{money(listing.price)}</span>
          <span>{money(listing.price_per_m2)}/m2</span>
          <span>{listing.area_m2.toFixed(1)} m2</span>
          <span>{listing.rooms} pokoje</span>
          <span>{listing.days_on_market} дней</span>
        </div>
        <div className="meta-row">
          <span className="score-pill">
            <BarChart3 size={14} /> I {scores.investment_score}
          </span>
          <span className="score-pill risk">R {scores.risk_score}</span>
          <span className="score-pill">N {scores.negotiation_score}</span>
        </div>
      </div>
      <div className="toolbar">
        <button
          className="icon-button"
          type="button"
          title="Добавить в избранное"
          onClick={() => onFavorite(listing.id)}
        >
          <Heart size={18} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="Сгенерировать отчет"
          onClick={() => onReport(listing.id)}
        >
          <FileText size={18} />
        </button>
        <Link className="button" href={`/listings/${listing.id}`}>
          Открыть
        </Link>
      </div>
    </article>
  );
}

