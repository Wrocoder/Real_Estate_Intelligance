"use client";

import { DecisionSummary, decisionSummaryFromScores } from "@/components/DecisionSummary";
import { ListingProvenance } from "@/components/ListingProvenance";
import type {
  CompareItemMetrics,
  CompareRecommendation,
  CompareRecommendationSignal,
  DeveloperReputation,
  ListingAnalysis,
  PurchaseIntent,
} from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";
import type { ComparePageCopy, Locale } from "@/lib/i18n";
import { scoreLabel } from "@/lib/scoreLabels";

export type CompareStatusState =
  | { key: "loadingListings" }
  | { key: "listingsLoaded" }
  | { key: "backendUnavailable" }
  | { key: "comparing" }
  | { key: "compareCount"; count: number }
  | { key: "compareUnavailable" }
  | { key: "compareLimit" };

export type AiStatusState =
  | { key: "aiNotCreated" }
  | { key: "aiReady" }
  | { key: "aiBuilding" }
  | { key: "aiRefused" }
  | { key: "aiSaved"; id: string }
  | { key: "aiUnavailable" };

export type ShortlistStatusState =
  | { key: "shortlistNotCreated" }
  | { key: "shortlistReady" }
  | { key: "shortlistBuilding" }
  | { key: "shortlistCount"; count: number }
  | { key: "shortlistUnavailable" };

type CompareProductCopy = {
  bestOverall: string;
  why: string;
  tradeoffs: string;
  fallbackSummary: string;
  noMaterialTradeoffs: string;
};

export function InsightColumn({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <h3 className="ai-verdict-heading">{title}</h3>
      {items.length === 0 ? (
        <p className="muted">{emptyLabel}</p>
      ) : (
        <ul className="ai-verdict-list">
          {[...new Set(items)].map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecommendationSummary({
  copy,
  items,
  metrics,
  recommendation,
  badgeLabel,
  locale,
}: {
  copy: CompareProductCopy;
  items: ListingAnalysis[];
  metrics: CompareItemMetrics[];
  recommendation: CompareRecommendation;
  badgeLabel?: string;
  locale: Locale;
}) {
  const item =
    items.find((analysis) => analysis.listing.id === recommendation.listing_id) ?? items[0];
  const metric = metrics.find((candidate) => candidate.listing_id === item?.listing.id);
  if (!item || !metric) return null;

  return (
    <article className="compare-recommendation">
      <div>
        <span className="status-pill healthy">{badgeLabel ?? copy.bestOverall}</span>
        <h2>{item.listing.title}</h2>
        <p>{item.listing.district}</p>
        <ListingProvenance listing={item.listing} locale={locale} />
      </div>
      <DecisionSummary
        compact
        confidenceScore={item.scores.fair_price_confidence_score}
        decision={item.buyer_decision}
        fallback={decisionSummaryFromScores(item.scores, item.listing.price)}
        fallbackLabel={scoreLabel(item.scores.decision_label, locale)}
        fallbackSummary={copy.fallbackSummary}
        locale={locale}
      />
      <div className="compare-recommendation-grid">
        <div>
          <h3>{copy.why}</h3>
          <ul className="section-list compact">
            {recommendation.reasons.map((reason, index) => (
              <li key={`${reason.code}-${index}`}>
                {recommendationSignalText(reason, locale)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{copy.tradeoffs}</h3>
          <ul className="section-list compact">
            {recommendation.tradeoffs.length > 0 ? (
              recommendation.tradeoffs.map((tradeoff, index) => (
                <li key={`${tradeoff.code}-${index}`}>
                  {recommendationSignalText(tradeoff, locale)}
                </li>
              ))
            ) : (
              <li>{copy.noMaterialTradeoffs}</li>
            )}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function comparisonRows(
  items: ListingAnalysis[],
  metricById: Map<string, CompareItemMetrics>,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return [
    {
      id: "location",
      label: copy.table.location,
      values: items.map((item) => `${item.listing.district}, ${item.listing.address}`),
    },
    {
      id: "price",
      label: copy.table.price,
      values: items.map((item) => money(item.listing.price, locale)),
    },
    {
      id: "price-per-m2",
      label: copy.table.pricePerM2,
      values: items.map((item) => `${money(item.listing.price_per_m2, locale)}/m2`),
    },
    {
      id: "area-rooms",
      label: copy.table.areaRooms,
      values: items.map(
        (item) => `${numberValue(item.listing.area_m2, locale)} m2 · ${copy.values.roomsShort(item.listing.rooms)}`,
      ),
    },
    {
      id: "days-on-market",
      label: copy.table.daysOnMarket,
      values: items.map((item) => numberValue(item.listing.days_on_market, locale)),
    },
    {
      id: "decision-score",
      label: copy.table.decisionScore,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${copy.values.rank(metric.rank)} · ${metric.decision_score}/100 · ${scoreLabel(
              metric.decision_label,
              locale,
            )}`
          : "-";
      }),
    },
    {
      id: "decision-label",
      label: copy.table.verdict,
      values: items.map((item) => scoreLabel(item.scores.decision_label, locale)),
    },
    {
      id: "developer",
      label: copy.table.developer,
      values: items.map((item) => developerSummary(item.developer_reputation, copy)),
    },
    {
      id: "developer-risk",
      label: copy.table.developerRisk,
      values: items.map((item) => developerRiskSummary(item.developer_reputation, copy)),
    },
    {
      id: "developer-check",
      label: copy.table.developerCheck,
      values: items.map((item) => developerCheckSummary(item.developer_reputation, copy)),
    },
    {
      id: "mortgage-payment",
      label: copy.table.mortgagePayment,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${money(metric.estimated_monthly_payment_pln, locale)}/${copy.values.monthly} · ${
              copy.values.loan
            } ${money(metric.loan_amount_pln, locale)}`
          : "-";
      }),
    },
    {
      id: "cash-needed",
      label: copy.table.cashNeeded,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${money(metric.upfront_cash_needed_pln, locale)} · ${copy.values.cash} ${money(
              metric.down_payment_pln,
              locale,
            )}`
          : "-";
      }),
    },
    {
      id: "total-move-in-cost",
      label: copy.table.totalMoveInCost,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric ? money(metric.total_move_in_cost_pln, locale) : "-";
      }),
    },
    {
      id: "transaction-costs",
      label: copy.table.transactionCosts,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric ? money(metric.transaction_costs_pln, locale) : "-";
      }),
    },
    {
      id: "renovation-furniture",
      label: copy.table.renovationFurniture,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric
          ? `${money(metric.renovation_estimate_pln, locale)} + ${money(
              metric.furniture_estimate_pln,
              locale,
            )}`
          : "-";
      }),
    },
    {
      id: "ready-alternative",
      label: copy.table.readyAlternative,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        if (!metric) return "-";
        return metric.ready_to_move_alternative_price_pln
          ? money(metric.ready_to_move_alternative_price_pln, locale)
          : "-";
      }),
    },
    {
      id: "post-renovation-gap",
      label: copy.table.postRenovationGap,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        if (!metric) return "-";
        return metric.post_renovation_value_gap_pln !== null
          ? money(metric.post_renovation_value_gap_pln, locale)
          : "-";
      }),
    },
    {
      id: "offer-strategy",
      label: copy.table.offerStrategy,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric && metric.opening_offer_pln !== null && metric.max_reasonable_offer_pln !== null
          ? `${money(metric.opening_offer_pln, locale)} -> ${money(
              metric.max_reasonable_offer_pln,
              locale,
            )}`
          : copy.empty.noData;
      }),
    },
    {
      id: "rental-estimate",
      label: copy.table.rentalEstimate,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        if (
          !metric ||
          metric.estimated_gross_rental_yield_pct === null ||
          metric.estimated_monthly_rent_pln === null
        ) {
          return copy.empty.noData;
        }
        return `${numberValue(metric.estimated_gross_rental_yield_pct, locale)}% ${
          copy.values.gross
        } · ${money(metric.estimated_monthly_rent_pln, locale)}/${copy.values.monthly}`;
      }),
    },
    {
      id: "price-label",
      label: copy.table.priceLabel,
      values: items.map((item) => scoreLabel(item.scores.price_label, locale)),
    },
    {
      id: "investment-score",
      label: copy.table.investmentScore,
      values: items.map((item) => `${item.scores.investment_score}/100`),
    },
    {
      id: "risk-score",
      label: copy.table.riskScore,
      values: items.map(
        (item) =>
          `${item.scores.risk_score}/100 · ${scoreLabel(item.scores.risk_label, locale)}`,
      ),
    },
    {
      id: "negotiation-score",
      label: copy.table.negotiationScore,
      values: items.map(
        (item) =>
          `${item.scores.negotiation_score}/100 · ${scoreLabel(
            item.scores.negotiation_label,
            locale,
          )}`,
      ),
    },
    {
      id: "liquidity-score",
      label: copy.table.liquidity,
      values: items.map((item) =>
        item.scores.liquidity_score === null
          ? copy.empty.noData
          : `${item.scores.liquidity_score}/100 · ${scoreLabel(
              item.scores.liquidity_label,
              locale,
            )}`,
      ),
    },
    {
      id: "rental-potential-score",
      label: copy.table.rentalPotential,
      values: items.map((item) =>
        item.scores.rental_potential_score === null
          ? copy.empty.noData
          : `${item.scores.rental_potential_score}/100 · ${scoreLabel(
              item.scores.rental_potential_label,
              locale,
            )}`,
      ),
    },
    {
      id: "fair-price-range",
      label: copy.table.fairPrice,
      values: items.map(
        (item) =>
          `${money(item.scores.fair_price_low, locale)} - ${money(
            item.scores.fair_price_high,
            locale,
          )}`,
      ),
    },
    {
      id: "fair-price-confidence",
      label: copy.table.fairPriceConfidence,
      values: items.map((item) => `${item.scores.fair_price_confidence_score}/100`),
    },
    {
      id: "check-completeness",
      label: copy.table.checkCompleteness,
      values: items.map((item) =>
        item.buyer_decision
          ? `${item.buyer_decision.knowledge.check_completeness_score}/100`
          : "-",
      ),
    },
    {
      id: "critical-unknowns",
      label: copy.table.criticalUnknowns,
      values: items.map((item) =>
        item.buyer_decision?.verdict.critical_unknowns.slice(0, 3).join("; ") ||
        copy.empty.noData,
      ),
    },
    {
      id: "source-confidence",
      label: copy.table.sourceConfidence,
      values: items.map((item) =>
        item.buyer_decision?.knowledge.source_evidence
          .slice(0, 3)
          .map((source) => `${source.topic}: ${source.confidence_score}/100`)
          .join("; ") || copy.empty.noData,
      ),
    },
    {
      id: "fair-price-delta",
      label: copy.table.fairPriceDelta,
      values: items.map((item) => percent(item.scores.price_delta_to_fair_mid_pct, locale)),
    },
    {
      id: "discount-to-fair",
      label: copy.table.discountToFair,
      values: items.map((item) => {
        const metric = metricById.get(item.listing.id);
        return metric ? money(metric.estimated_discount_to_fair_mid_pln, locale) : "-";
      }),
    },
    {
      id: "transport",
      label: copy.table.transport,
      values: items.map((item) =>
        item.listing.nearest_stop_m === null
          ? copy.empty.noData
          : copy.values.metersToStop(item.listing.nearest_stop_m),
      ),
    },
    {
      id: "infrastructure",
      label: copy.table.infrastructure,
      values: items.map((item) =>
        item.listing.schools_within_1km === null || item.listing.parks_within_1km === null
          ? copy.empty.noData
          : copy.values.schoolsParks(
              item.listing.schools_within_1km,
              item.listing.parks_within_1km,
            ),
      ),
    },
    {
      id: "planned-investments",
      label: copy.table.plannedInvestments,
      values: items.map((item) =>
        item.listing.planned_investments_within_2km === null
          ? copy.empty.noData
          : copy.values.plannedInvestments(item.listing.planned_investments_within_2km),
      ),
    },
  ];
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? (
        <small className="muted" style={{ display: "block", marginTop: 6, lineHeight: 1.35 }}>
          {detail}
        </small>
      ) : null}
    </div>
  );
}

export function compareStatusText(copy: ComparePageCopy, state: CompareStatusState) {
  switch (state.key) {
    case "compareCount":
      return copy.statuses.compareCount(state.count);
    default:
      return copy.statuses[state.key];
  }
}

export function aiStatusText(copy: ComparePageCopy, state: AiStatusState) {
  switch (state.key) {
    case "aiSaved":
      return copy.statuses.aiSaved(state.id);
    default:
      return copy.statuses[state.key];
  }
}

export function shortlistStatusText(copy: ComparePageCopy, state: ShortlistStatusState) {
  switch (state.key) {
    case "shortlistCount":
      return copy.statuses.shortlistCount(state.count);
    default:
      return copy.statuses[state.key];
  }
}

function developerSummary(reputation: DeveloperReputation | null, copy: ComparePageCopy) {
  if (!reputation) return copy.empty.noDeveloper;
  return `${reputation.developer.name} · ${reputation.reputation_score}/100`;
}

function developerRiskSummary(reputation: DeveloperReputation | null, copy: ComparePageCopy) {
  if (!reputation) return copy.empty.noDeveloperRisk;
  return (
    reputation.risk_signals[0] ??
    reputation.positive_signals[0] ??
    `${reputation.completed_projects_count} completed · ${reputation.active_projects_count} active`
  );
}

function developerCheckSummary(reputation: DeveloperReputation | null, copy: ComparePageCopy) {
  if (!reputation) return copy.empty.manualDeveloperCheck;
  return reputation.due_diligence_questions[0] ?? copy.empty.developerDueDiligence;
}

export function developerLabel(reputation: DeveloperReputation, copy: ComparePageCopy) {
  return copy.developerLabels[reputation.label] ?? reputation.label;
}

export function developerTone(reputation: DeveloperReputation) {
  if (reputation.label === "strong" || reputation.label === "good") return "healthy";
  if (reputation.label === "mixed" || reputation.label === "limited_data") return "warning";
  return "error";
}

export function listingShort(items: ListingAnalysis[], listingId: string | null, copy: ComparePageCopy) {
  if (listingId === null) return copy.empty.noData;
  const item = items.find((analysis) => analysis.listing.id === listingId);
  if (!item) return listingId;
  return `${item.listing.district}, ${copy.values.roomsShort(item.listing.rooms)}`;
}

export function fairDetail(
  metric: CompareItemMetrics | undefined,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return metric
    ? `${percent(metric.price_delta_to_fair_mid_pct, locale)} ${copy.values.fair} · ${money(
        metric.estimated_discount_to_fair_mid_pln,
        locale,
      )} ${copy.values.negotiation}`
    : "";
}

export function paymentDetail(
  metric: CompareItemMetrics | undefined,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  return metric
    ? `${money(metric.estimated_monthly_payment_pln, locale)}/${copy.values.monthly} · ${money(
        metric.upfront_cash_needed_pln,
        locale,
      )} ${copy.values.cash}`
    : "";
}

export function rentDetail(
  metric: CompareItemMetrics | undefined,
  copy: ComparePageCopy,
  locale: Parameters<typeof money>[1],
) {
  if (
    !metric ||
    metric.estimated_gross_rental_yield_pct === null ||
    metric.estimated_monthly_rent_pln === null
  ) {
    return copy.empty.noData;
  }
  return `${numberValue(metric.estimated_gross_rental_yield_pct, locale)}% · ${money(
    metric.estimated_monthly_rent_pln,
    locale,
  )}/${copy.values.monthly}`;
}

function recommendationSignalText(signal: CompareRecommendationSignal, locale: Locale): string {
  const value = signal.value ?? 0;
  const reference = signal.reference_value ?? 0;
  const score = `${numberValue(value, locale)}/100`;
  const versus = { en: "vs", pl: "wobec", ru: "против", uk: "проти" }[locale];
  const scoreComparison = `${score} ${versus} ${numberValue(reference, locale)}/100`;
  const priceDifference = money(Math.max(value - reference, 0), locale);
  const areaDifference = numberValue(Math.max(reference - value, 0), locale);
  const distanceDifference = numberValue(Math.max(value - reference, 0), locale);

  const translations: Record<Locale, Record<CompareRecommendationSignal["code"], string>> = {
    en: {
      overall_balance: `${score} for the best overall balance of available factors`,
      intent_fit: `${score} fit for the selected buying purpose`,
      price_value: `${percent(value, locale)} against estimated fair value`,
      low_risk: `${score} risk level, the lowest among the compared options`,
      daily_living: `${score} fit for everyday living priorities`,
      family_fit: `${score} fit for family priorities`,
      liquidity: `${score} liquidity, the strongest available result`,
      rental_income: `${score} rental potential, the strongest available result`,
      budget_fit: `${money(value, locale)} stays within the saved ${money(reference, locale)} limit`,
      higher_price: `${priceDifference} more than the least expensive option`,
      higher_risk: `Higher risk: ${scoreComparison}`,
      weaker_liquidity: `Weaker liquidity: ${scoreComparison}`,
      weaker_rental_income: `Weaker rental potential: ${scoreComparison}`,
      smaller_area: `${areaDifference} m2 less than the largest option`,
      farther_from_center: `${distanceDifference} km farther from the city center`,
      over_budget: `${priceDifference} above the saved maximum price`,
    },
    pl: {
      overall_balance: `${score} za najlepszy ogólny bilans dostępnych czynników`,
      intent_fit: `${score} dopasowania do wybranego celu zakupu`,
      price_value: `${percent(value, locale)} względem szacowanej wartości rynkowej`,
      low_risk: `Ryzyko ${score}, najniższe wśród porównywanych ofert`,
      daily_living: `${score} dopasowania do codziennego życia`,
      family_fit: `${score} dopasowania do potrzeb rodziny`,
      liquidity: `Płynność ${score}, najlepszy dostępny wynik`,
      rental_income: `Potencjał najmu ${score}, najlepszy dostępny wynik`,
      budget_fit: `${money(value, locale)} mieści się w limicie ${money(reference, locale)}`,
      higher_price: `O ${priceDifference} drożej od najtańszej opcji`,
      higher_risk: `Wyższe ryzyko: ${scoreComparison}`,
      weaker_liquidity: `Słabsza płynność: ${scoreComparison}`,
      weaker_rental_income: `Słabszy potencjał najmu: ${scoreComparison}`,
      smaller_area: `O ${areaDifference} m2 mniej od największej opcji`,
      farther_from_center: `O ${distanceDifference} km dalej od centrum`,
      over_budget: `O ${priceDifference} powyżej zapisanej ceny maksymalnej`,
    },
    ru: {
      overall_balance: `${score} за лучший общий баланс доступных факторов`,
      intent_fit: `${score} соответствия выбранной цели покупки`,
      price_value: `${percent(value, locale)} относительно оценочной рыночной стоимости`,
      low_risk: `Риск ${score}, самый низкий среди сравниваемых вариантов`,
      daily_living: `${score} соответствия приоритетам для жизни`,
      family_fit: `${score} соответствия потребностям семьи`,
      liquidity: `Ликвидность ${score}, лучший доступный результат`,
      rental_income: `Арендный потенциал ${score}, лучший доступный результат`,
      budget_fit: `${money(value, locale)} укладывается в лимит ${money(reference, locale)}`,
      higher_price: `На ${priceDifference} дороже самого доступного варианта`,
      higher_risk: `Выше риск: ${scoreComparison}`,
      weaker_liquidity: `Ниже ликвидность: ${scoreComparison}`,
      weaker_rental_income: `Ниже арендный потенциал: ${scoreComparison}`,
      smaller_area: `На ${areaDifference} m2 меньше самого большого варианта`,
      farther_from_center: `На ${distanceDifference} км дальше от центра`,
      over_budget: `На ${priceDifference} выше сохранённой максимальной цены`,
    },
    uk: {
      overall_balance: `${score} за найкращий загальний баланс доступних чинників`,
      intent_fit: `${score} відповідності вибраній меті купівлі`,
      price_value: `${percent(value, locale)} відносно оціненої ринкової вартості`,
      low_risk: `Ризик ${score}, найнижчий серед порівнюваних варіантів`,
      daily_living: `${score} відповідності пріоритетам для життя`,
      family_fit: `${score} відповідності потребам сім'ї`,
      liquidity: `Ліквідність ${score}, найкращий доступний результат`,
      rental_income: `Орендний потенціал ${score}, найкращий доступний результат`,
      budget_fit: `${money(value, locale)} вкладається в ліміт ${money(reference, locale)}`,
      higher_price: `На ${priceDifference} дорожче найдоступнішого варіанта`,
      higher_risk: `Вищий ризик: ${scoreComparison}`,
      weaker_liquidity: `Нижча ліквідність: ${scoreComparison}`,
      weaker_rental_income: `Нижчий орендний потенціал: ${scoreComparison}`,
      smaller_area: `На ${areaDifference} m2 менше найбільшого варіанта`,
      farther_from_center: `На ${distanceDifference} км далі від центру`,
      over_budget: `На ${priceDifference} вище збереженої максимальної ціни`,
    },
  };
  return translations[locale][signal.code];
}

export function syncCompareUrl(ids: string[], intent: PurchaseIntent) {
  const params = new URLSearchParams(window.location.search);
  if (ids.length) params.set("ids", ids.join(","));
  else params.delete("ids");
  params.set("intent", intent);
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}
