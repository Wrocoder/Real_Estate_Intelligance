import { request } from "../apiClient";
import type {
  AICompareAnswer,
  AICompareAnswerRequest,
  CompareResponse,
  PurchaseIntent,
  RealtorClientShortlist,
  RealtorClientShortlistRequest,
} from "../api";
import type { CompareRequestContract } from "../openApiContract";

export function compareListings(
  listingIds: string[],
  purchaseIntent: PurchaseIntent = "unsure",
) {
  const payload: CompareRequestContract = {
    listing_ids: listingIds,
    purchase_intent: purchaseIntent,
  };
  return request<CompareResponse>("/api/v1/compare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function buildRealtorClientShortlist(payload: RealtorClientShortlistRequest) {
  return request<RealtorClientShortlist>("/api/v1/realtor/client-shortlists/preview", {
    method: "POST",
    body: JSON.stringify({
      listing_ids: payload.listing_ids,
      client_name: payload.client_name || null,
      intro: payload.intro || null,
      include_source_links: payload.include_source_links ?? false,
    }),
  });
}

export function answerCompareAIQuestion(payload: AICompareAnswerRequest) {
  return request<AICompareAnswer>("/api/v1/ai/compare/answer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
