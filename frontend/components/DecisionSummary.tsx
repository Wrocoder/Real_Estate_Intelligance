import type {
  BuyerDecisionPackage,
  BuyerVerdictStatus,
  GeneratedReportDecisionSummary,
  PropertyScores,
} from "@/lib/api";
import { money, percent } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

export type DecisionSummaryData = {
  status?: BuyerVerdictStatus | null;
  score?: number | null;
  headline?: string | null;
  summary?: string | null;
  seller_price_pln?: number | null;
  fair_price_low_pln?: number | null;
  fair_price_mid_pln?: number | null;
  fair_price_high_pln?: number | null;
  price_delta_to_fair_mid_pct?: number | null;
  confidence_score?: number | null;
  recommended_offer_pln?: number | null;
  max_reasonable_offer_pln?: number | null;
  total_move_in_cost_pln?: number | null;
  selected_intent?: BuyerDecisionPackage["selected_intent"] | null;
  selected_intent_score?: number | null;
};

type Props = {
  decision?: BuyerDecisionPackage | null;
  snapshot?: GeneratedReportDecisionSummary | null;
  fallback?: DecisionSummaryData | null;
  fallbackLabel?: string | null;
  fallbackSummary?: string | null;
  confidenceScore?: number | null;
  locale: Locale;
  compact?: boolean;
};

type DecisionSummaryCopy = {
  eyebrow: string;
  reportSummary: string;
  analysisSignal: string;
  noSummary: string;
  forYou: string;
  askingPrice: string;
  fairPrice: string;
  recommendedOffer: string;
  maxOffer: string;
  totalCost: string;
  confidence: string;
  aboveFair: (value: string) => string;
  belowFair: (value: string) => string;
  withinFair: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  nextStep: string;
};

const COPY: Record<Locale, DecisionSummaryCopy> = {
  en: {
    eyebrow: "WartoMetr verdict",
    reportSummary: "Report summary",
    analysisSignal: "Analysis signal",
    noSummary: "The buyer conclusion is not available for this item yet.",
    forYou: "For you",
    askingPrice: "Asking price",
    fairPrice: "Estimated fair range",
    recommendedOffer: "Recommended offer",
    maxOffer: "Do not exceed",
    totalCost: "Estimated total",
    confidence: "Confidence",
    aboveFair: (value) => `${value} above the estimated fair value`,
    belowFair: (value) => `${value} below the estimated fair value`,
    withinFair: "Within the estimated fair range",
    confidenceHigh: "High",
    confidenceMedium: "Medium",
    confidenceLow: "Low",
    nextStep: "Next step",
  },
  pl: {
    eyebrow: "Werdykt WartoMetr",
    reportSummary: "Podsumowanie raportu",
    analysisSignal: "Sygnał analizy",
    noSummary: "Wniosek dla kupującego nie jest jeszcze dostępny dla tego elementu.",
    forYou: "Dla Ciebie",
    askingPrice: "Cena ofertowa",
    fairPrice: "Szacowany zakres rynkowy",
    recommendedOffer: "Rekomendowana oferta",
    maxOffer: "Nie przekraczać",
    totalCost: "Szacowany koszt całkowity",
    confidence: "Pewność",
    aboveFair: (value) => `${value} powyżej szacowanej ceny rynkowej`,
    belowFair: (value) => `${value} poniżej szacowanej ceny rynkowej`,
    withinFair: "W szacowanym zakresie rynkowym",
    confidenceHigh: "Wysoka",
    confidenceMedium: "Średnia",
    confidenceLow: "Niska",
    nextStep: "Kolejny krok",
  },
  ru: {
    eyebrow: "Вердикт WartoMetr",
    reportSummary: "Резюме отчета",
    analysisSignal: "Сигнал анализа",
    noSummary: "Вывод для покупателя пока недоступен для этого объекта.",
    forYou: "Для вас",
    askingPrice: "Цена предложения",
    fairPrice: "Оценочный рыночный диапазон",
    recommendedOffer: "Рекомендуемое предложение",
    maxOffer: "Не превышать",
    totalCost: "Оценочная полная стоимость",
    confidence: "Уверенность",
    aboveFair: (value) => `${value} выше оценочной рыночной цены`,
    belowFair: (value) => `${value} ниже оценочной рыночной цены`,
    withinFair: "В оценочном рыночном диапазоне",
    confidenceHigh: "Высокая",
    confidenceMedium: "Средняя",
    confidenceLow: "Низкая",
    nextStep: "Следующий шаг",
  },
  uk: {
    eyebrow: "Вердикт WartoMetr",
    reportSummary: "Резюме звіту",
    analysisSignal: "Сигнал аналізу",
    noSummary: "Висновок для покупця поки недоступний для цього об'єкта.",
    forYou: "Для вас",
    askingPrice: "Ціна пропозиції",
    fairPrice: "Оціночний ринковий діапазон",
    recommendedOffer: "Рекомендована пропозиція",
    maxOffer: "Не перевищувати",
    totalCost: "Оціночна повна вартість",
    confidence: "Впевненість",
    aboveFair: (value) => `${value} вище оціночної ринкової ціни`,
    belowFair: (value) => `${value} нижче оціночної ринкової ціни`,
    withinFair: "У межах оціночного ринкового діапазону",
    confidenceHigh: "Висока",
    confidenceMedium: "Середня",
    confidenceLow: "Низька",
    nextStep: "Наступний крок",
  },
};

const VERDICT_LABELS: Record<Locale, Record<BuyerVerdictStatus, string>> = {
  en: { buy: "WORTH CONSIDERING", negotiate: "NEGOTIATE", avoid: "AVOID", verify_first: "VERIFY FIRST" },
  pl: { buy: "WARTO ROZWAŻYĆ", negotiate: "NEGOCJUJ", avoid: "ODPUŚĆ", verify_first: "NAJPIERW SPRAWDŹ" },
  ru: { buy: "ПОКУПАТЬ", negotiate: "ТОРГОВАТЬСЯ", avoid: "ИЗБЕГАТЬ", verify_first: "СНАЧАЛА ПРОВЕРИТЬ" },
  uk: { buy: "КУПУВАТИ", negotiate: "ТОРГУВАТИСЯ", avoid: "УНИКАТИ", verify_first: "СПОЧАТКУ ПЕРЕВІРИТИ" },
};

const VERDICT_SUMMARIES: Record<Locale, Record<BuyerVerdictStatus, string>> = {
  en: {
    buy: "The price and available evidence support considering the apartment at the current price.",
    negotiate: "The apartment may be worth considering, but the price should be negotiated before purchase.",
    avoid: "The risk or missing evidence is too material for a normal offer at this stage.",
    verify_first: "Verify the key facts and the apartment before making an offer.",
  },
  pl: {
    buy: "Cena i dostępne dane przemawiają za rozważeniem zakupu przy obecnej cenie.",
    negotiate: "Mieszkanie wygląda sensownie, ale przed zakupem warto wynegocjować lepszą cenę.",
    avoid: "Ryzyko lub brakujące dane są zbyt istotne, aby na tym etapie składać zwykłą ofertę.",
    verify_first: "Najpierw sprawdź kluczowe informacje i mieszkanie przed złożeniem oferty.",
  },
  ru: {
    buy: "Цена и доступные данные позволяют рассматривать покупку по текущей цене.",
    negotiate: "Квартиру можно рассматривать, но перед покупкой стоит договориться о лучшей цене.",
    avoid: "Риск или недостаток подтверждений слишком существенны для обычного предложения на этом этапе.",
    verify_first: "Сначала проверьте ключевые факты и квартиру перед предложением цены.",
  },
  uk: {
    buy: "Ціна та доступні дані дозволяють розглядати купівлю за поточною ціною.",
    negotiate: "Квартиру можна розглядати, але перед купівлею варто домовитися про кращу ціну.",
    avoid: "Ризик або брак підтверджень надто суттєві для звичайної пропозиції на цьому етапі.",
    verify_first: "Спочатку перевірте ключові факти та квартиру перед пропозицією ціни.",
  },
};

const NEXT_STEPS: Record<Locale, Record<BuyerVerdictStatus, string>> = {
  en: {
    buy: "Request the documents and verify the technical condition before paying a deposit.",
    negotiate: "Prepare the first offer using the fair-price range and the evidence below.",
    avoid: "Pause the purchase and reconsider only if the material risk or missing evidence changes.",
    verify_first: "Close the critical unknowns before making an offer or paying a deposit.",
  },
  pl: {
    buy: "Poproś o dokumenty i sprawdź stan techniczny przed wpłatą zadatku.",
    negotiate: "Przygotuj pierwszą ofertę na podstawie zakresu rynkowego i poniższych dowodów.",
    avoid: "Wstrzymaj zakup i wróć do niego dopiero, gdy istotne ryzyko lub brakujące dane się zmienią.",
    verify_first: "Uzupełnij kluczowe informacje przed złożeniem oferty lub wpłatą zadatku.",
  },
  ru: {
    buy: "Запросите документы и проверьте техническое состояние до внесения задатка.",
    negotiate: "Подготовьте первое предложение на основе оценочного диапазона и приведенных ниже подтверждений.",
    avoid: "Приостановите покупку и вернитесь к ней только после изменения существенного риска или неизвестных данных.",
    verify_first: "Закройте критические неизвестные до предложения цены или внесения задатка.",
  },
  uk: {
    buy: "Запросіть документи та перевірте технічний стан до внесення завдатку.",
    negotiate: "Підготуйте першу пропозицію на основі оціночного діапазону та наведених нижче підтверджень.",
    avoid: "Призупиніть купівлю та поверніться до неї лише після зміни суттєвого ризику або невідомих даних.",
    verify_first: "Закрийте критичні невідомі до пропозиції ціни або внесення завдатку.",
  },
};

export function DecisionSummary({
  decision,
  snapshot,
  fallback,
  fallbackLabel,
  fallbackSummary,
  confidenceScore,
  locale,
  compact = false,
}: Props) {
  const copy = COPY[locale];
  const data = decision
    ? { ...decisionSummaryFromDecision(decision), confidence_score: confidenceScore ?? null }
    : snapshot ?? fallback ?? (fallbackSummary ? { summary: fallbackSummary } : null);

  if (!data) return null;

  const status = data.status ?? null;
  const headline =
    (status && locale !== "en" ? VERDICT_LABELS[locale][status] : null) ??
    data.headline ??
    fallbackLabel ??
    (status ? VERDICT_LABELS[locale][status] : copy.reportSummary);
  const summary =
    (status ? VERDICT_SUMMARIES[locale][status] : null) ??
    data.summary ??
    fallbackSummary ??
    copy.noSummary;
  const relation = priceRelation(data.price_delta_to_fair_mid_pct, locale, copy);
  const score = data.score !== null && data.score !== undefined ? `${Math.round(data.score * 10)}/100` : null;
  const selectedIntent = data.selected_intent_score !== null && data.selected_intent_score !== undefined
    ? `${Math.round(data.selected_intent_score / 10)}/10`
    : null;
  const fairPrice = fairPriceValue(data, locale);

  return (
    <div className={`decision-summary${compact ? " decision-summary-compact" : ""}`}>
      <div className="buyer-decision-hero decision-summary-hero">
        <div>
          <div className="meta-row">
            <span className={`status-pill ${status ? verdictTone(status) : "info"}`}>
              {status ? VERDICT_LABELS[locale][status] : fallbackLabel ?? copy.analysisSignal}
            </span>
            {status ? <span className="status-pill info">{copy.eyebrow}</span> : null}
          </div>
          <h2>{headline}</h2>
          <p>{summary}</p>
          {relation ? <p className="buyer-price-relation">{relation}</p> : null}
        </div>
        {score ? <strong className="buyer-decision-score">{score}</strong> : null}
      </div>

      <div className="buyer-decision-metrics decision-summary-metrics">
        {selectedIntent ? <SummaryMetric label={copy.forYou} value={selectedIntent} /> : null}
        {numberValue(data.seller_price_pln) ? (
          <SummaryMetric label={copy.askingPrice} value={money(data.seller_price_pln!, locale)} />
        ) : null}
        {fairPrice ? <SummaryMetric label={copy.fairPrice} value={fairPrice} /> : null}
        {numberValue(data.recommended_offer_pln) ? (
          <SummaryMetric label={copy.recommendedOffer} value={money(data.recommended_offer_pln!, locale)} />
        ) : null}
        {numberValue(data.max_reasonable_offer_pln) ? (
          <SummaryMetric label={copy.maxOffer} value={money(data.max_reasonable_offer_pln!, locale)} />
        ) : null}
        {numberValue(data.total_move_in_cost_pln) ? (
          <SummaryMetric label={copy.totalCost} value={money(data.total_move_in_cost_pln!, locale)} />
        ) : null}
        {numberValue(data.confidence_score) ? (
          <SummaryMetric label={copy.confidence} value={confidenceLabel(data.confidence_score!, copy)} />
        ) : null}
      </div>
      {status ? (
        <p className="decision-summary-next-step">
          <strong>{copy.nextStep}:</strong> {NEXT_STEPS[locale][status]}
        </p>
      ) : null}
    </div>
  );
}

export function decisionSummaryFromDecision(decision: BuyerDecisionPackage): DecisionSummaryData {
  const verdict = decision.verdict;
  return {
    status: verdict.status,
    score: verdict.score,
    headline: verdict.headline,
    summary: verdict.summary,
    seller_price_pln: verdict.seller_price_pln,
    fair_price_low_pln: verdict.fair_price_low_pln,
    fair_price_mid_pln: verdict.fair_price_mid_pln,
    fair_price_high_pln: verdict.fair_price_high_pln,
    price_delta_to_fair_mid_pct: verdict.price_delta_to_fair_mid_pct,
    confidence_score: null,
    recommended_offer_pln: verdict.recommended_offer_pln,
    max_reasonable_offer_pln: verdict.max_reasonable_offer_pln,
    total_move_in_cost_pln: decision.total_acquisition.total_move_in_cost_pln,
    selected_intent: decision.selected_intent,
    selected_intent_score: decision.selected_intent_fit?.score ?? null,
  };
}

export function decisionSummaryFromScores(
  scores: PropertyScores,
  sellerPricePln: number,
): DecisionSummaryData {
  return {
    seller_price_pln: sellerPricePln,
    fair_price_low_pln: scores.fair_price_low,
    fair_price_mid_pln: scores.fair_price_mid,
    fair_price_high_pln: scores.fair_price_high,
    price_delta_to_fair_mid_pct: scores.price_delta_to_fair_mid_pct,
    confidence_score: scores.fair_price_confidence_score,
  };
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function numberValue(value: number | null | undefined) {
  return value !== null && value !== undefined;
}

function fairPriceValue(data: DecisionSummaryData, locale: Locale) {
  if (numberValue(data.fair_price_low_pln) && numberValue(data.fair_price_high_pln)) {
    return `${money(data.fair_price_low_pln!, locale)} - ${money(data.fair_price_high_pln!, locale)}`;
  }
  if (numberValue(data.fair_price_mid_pln)) return money(data.fair_price_mid_pln!, locale);
  return null;
}

function priceRelation(
  value: number | null | undefined,
  locale: Locale,
  copy: DecisionSummaryCopy,
) {
  if (!numberValue(value)) return null;
  if (value! > 0) return copy.aboveFair(percent(value!, locale));
  if (value! < 0) return copy.belowFair(percent(Math.abs(value!), locale));
  return copy.withinFair;
}

function confidenceLabel(score: number, copy: DecisionSummaryCopy) {
  if (score >= 75) return copy.confidenceHigh;
  if (score >= 50) return copy.confidenceMedium;
  return copy.confidenceLow;
}

function verdictTone(status: BuyerVerdictStatus) {
  if (status === "buy") return "healthy";
  if (status === "negotiate") return "warning";
  if (status === "avoid") return "error";
  return "info";
}
