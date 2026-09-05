"use client";

import { ExternalLink } from "lucide-react";

import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import type { Listing } from "@/lib/api";
import { dateValue } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type ListingProvenanceProps = {
  listing: Pick<
    Listing,
    | "source_name"
    | "source_url"
    | "last_seen_at"
    | "relisted"
    | "media_status"
    | "data_provenance"
    | "city"
    | "district"
  >;
  locale: Locale;
};

const COPY = {
  en: { source: "Source", updated: "Updated", media: "Photos", unknown: "Status not supplied", missing: "No photos supplied", available: "Available", stale: "Stale listing", relisted: "Relisted / possible duplicate", sourceLink: "Open source listing" },
  pl: { source: "Źródło", updated: "Aktualizacja", media: "Zdjęcia", unknown: "Brak informacji ze źródła", missing: "Źródło nie podało zdjęć", available: "Dostępne", stale: "Nieaktualne ogłoszenie", relisted: "Ponownie wystawione / możliwy duplikat", sourceLink: "Otwórz ogłoszenie źródłowe" },
  ru: { source: "Источник", updated: "Обновлено", media: "Фото", unknown: "Источник не сообщил статус", missing: "Источник не предоставил фото", available: "Доступны", stale: "Устаревшее объявление", relisted: "Выставлено повторно / возможный дубликат", sourceLink: "Открыть объявление источника" },
  uk: { source: "Джерело", updated: "Оновлено", media: "Фото", unknown: "Джерело не повідомило статус", missing: "Джерело не надало фото", available: "Доступні", stale: "Неактуальне оголошення", relisted: "Виставлено повторно / можливий дублікат", sourceLink: "Відкрити оголошення джерела" },
} as const;

export function ListingProvenance({ listing, locale }: ListingProvenanceProps) {
  const copy = COPY[locale];
  const stale = isStale(listing.last_seen_at);
  const href = safeHttpsUrl(listing.source_url);
  const mediaLabel = listing.media_status === "available" ? copy.available : listing.media_status === "missing" ? copy.missing : copy.unknown;

  return (
    <div className="listing-provenance" aria-label={`${copy.source}: ${listing.source_name}`}>
      <span><strong>{copy.source}:</strong> {href ? <a href={href} target="_blank" rel="noreferrer" title={copy.sourceLink}>{listing.source_name} <ExternalLink size={12} /></a> : listing.source_name}</span>
      <span>{copy.updated}: {dateValue(listing.last_seen_at, locale)}</span>
      <span>{copy.media}: {mediaLabel}</span>
      {stale ? <span className="status-pill warning">{copy.stale}</span> : null}
      {listing.relisted ? <span className="status-pill warning">{copy.relisted}</span> : null}
      <ProvenanceDetails
        locale={locale}
        provenance={{
          sourceName: listing.source_name,
          sourceType: listing.data_provenance.source_type,
          updatedAt: listing.last_seen_at,
          sampleSize: 1,
          scope: `${listing.city}: ${listing.district}`,
          calculationType: "observed",
          mode: listing.data_provenance.mode,
        }}
      />
    </div>
  );
}

export function safeHttpsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isStale(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000;
}
