import { api, type ProductEventCreate, type ProductEventName } from "./api";
import type { Locale } from "./i18n";

const JOURNEY_STORAGE_KEY = "wartometr_product_journey_v1";

type ProductEventProperties = NonNullable<ProductEventCreate["properties"]>;

export function trackProductEvent(
  eventName: ProductEventName,
  locale: Locale,
  properties: ProductEventProperties = {},
) {
  const journeyId = getJourneyId();
  if (!journeyId) return;
  void api
    .recordProductEvent({
      event_name: eventName,
      journey_id: journeyId,
      schema_version: "1.0",
      locale,
      properties,
    })
    .catch(() => undefined);
}

export function trackProductEventOnce(
  eventName: ProductEventName,
  locale: Locale,
  properties: ProductEventProperties,
  dedupeKey: string,
) {
  if (typeof window === "undefined") return;
  const storageKey = `${JOURNEY_STORAGE_KEY}:${eventName}:${dedupeKey}`;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    return;
  }
  trackProductEvent(eventName, locale, properties);
}

function getJourneyId() {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(JOURNEY_STORAGE_KEY);
    if (existing) return existing;
    const created = window.crypto.randomUUID();
    window.sessionStorage.setItem(JOURNEY_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function productIntent(intent: string | null | undefined) {
  if (intent === "investment") return "investment";
  if (intent === "self" || intent === "family" || intent === "rental") return "living";
  return "unsure";
}

export function productConfidence(score: number | null | undefined) {
  if (score == null) return "unknown";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function productVerdict(status: string | null | undefined) {
  if (status === "buy") return "buy";
  if (status === "negotiate") return "negotiate";
  if (status === "avoid") return "skip";
  return "unavailable";
}

export function productPaymentProvider(provider: string | null | undefined) {
  if (provider === "stripe" || provider === "payu" || provider === "mock") return provider;
  return "unknown";
}
