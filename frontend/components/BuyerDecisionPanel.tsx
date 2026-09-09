import { Bell, Check, CheckCircle2, ClipboardCheck, Copy, HelpCircle, ShieldAlert, Target, WalletCards } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { BuyerActionPlanPanel, BuyerActionPlanUnavailable } from "@/components/BuyerActionPlanPanel";
import { DecisionSummary } from "@/components/DecisionSummary";
import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import type { BuyerDecisionPackage, BuyerSourceEvidence, BuyerVerdictStatus } from "@/lib/api";
import { localizeBuyerDecision, localizedSourceEvidence } from "@/lib/buyerDecisionMessages";
import { money } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type Props = {
  decision: BuyerDecisionPackage | null;
  confidenceScore?: number | null;
  locale: Locale;
};

type BuyerDecisionCopy = {
  eyebrow: string;
  cta: string;
  metrics: {
    forYou: string;
    sellerPrice: string;
    fairPrice: string;
    recommendedOffer: string;
    maxOffer: string;
    moveInCost: string;
    completeness: string;
  };
  sections: {
    decisionDetails: string;
    reasons: string;
    risks: string;
    unknowns: string;
    negotiation: string;
    dueDiligence: string;
    totalCost: string;
    knowledge: string;
    preViewing: string;
    watch: string;
    sources: string;
    intent: string;
  };
  labels: {
    openingOffer: string;
    realisticDeal: string;
    walkAway: string;
    posture: string;
    score: string;
    documents: string;
    sellerQuestions: string;
    photos: string;
    building: string;
    surroundings: string;
    afterViewing: string;
    known: string;
    estimated: string;
    couldNotVerify: string;
    updated: string;
    confidence: string;
    selectedIntent: string;
    monthlyPayment: string;
    renovationCondition: string;
    budgetSource: string;
    purchasePrice: string;
    pccTax: string;
    notary: string;
    bankCosts: string;
    upfrontCash: string;
    renovation: string;
    furniture: string;
    readyAlternative: string;
    gap: string;
    empty: string;
    aboveRange: (value: string) => string;
    belowRange: (value: string) => string;
    withinRange: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    scenarioOnly: string;
    evidence: string;
    nextStep: string;
    limitations: string;
    guardrails: string;
    copyBrief: string;
    copied: string;
    copyFailed: string;
  };
  statuses: Record<BuyerVerdictStatus, string>;
  intents: Record<string, string>;
};

const COPY: Record<Locale, BuyerDecisionCopy> = {
  en: {
    eyebrow: "WartoMetr verdict",
    cta: "Prepare viewing and negotiation",
    metrics: {
      forYou: "For you",
      sellerPrice: "Seller price",
      fairPrice: "Fair price",
      recommendedOffer: "Recommended offer",
      maxOffer: "Max reasonable",
      moveInCost: "Estimated total",
      completeness: "Data quality",
    },
    sections: {
      decisionDetails: "Why this is the verdict",
      reasons: "Why it works",
      risks: "Main risks",
      unknowns: "Not verified",
      negotiation: "Negotiation assistant",
      dueDiligence: "Viewing checklist",
      totalCost: "Total acquisition cost",
      knowledge: "What we know",
      preViewing: "Before viewing",
      watch: "Track this apartment",
      sources: "Sources and confidence",
      intent: "Fit by buyer intent",
    },
    labels: {
      openingOffer: "Opening offer",
      realisticDeal: "Realistic deal",
      walkAway: "Do not exceed",
      posture: "Posture",
      score: "WartoMetr Score",
      documents: "Documents",
      sellerQuestions: "Seller questions",
      photos: "Photos",
      building: "Building",
      surroundings: "Surroundings",
      afterViewing: "After viewing",
      known: "Known",
      estimated: "Estimated",
      couldNotVerify: "Could not verify",
      updated: "Updated",
      confidence: "Confidence",
      selectedIntent: "Goal",
      monthlyPayment: "Estimated monthly payment",
      renovationCondition: "Condition",
      budgetSource: "Budget source",
      purchasePrice: "Apartment",
      pccTax: "PCC",
      notary: "Notary and court",
      bankCosts: "Bank costs",
      upfrontCash: "Down payment and fees",
      renovation: "Renovation",
      furniture: "Furniture",
      readyAlternative: "Ready alternative",
      gap: "Post-renovation gap",
      empty: "No data.",
      aboveRange: (value) => `${value} above the estimated market range`,
      belowRange: (value) => `${value} below the estimated market range`,
      withinRange: "Within the estimated market range",
      confidenceHigh: "High",
      confidenceMedium: "Medium",
      confidenceLow: "Low",
      scenarioOnly: "Scenario only",
      evidence: "Evidence",
      nextStep: "Next step",
      limitations: "Why no price scenario",
      guardrails: "Boundaries",
      copyBrief: "Copy negotiation brief",
      copied: "Brief copied",
      copyFailed: "Could not copy the brief",
    },
    statuses: {
      buy: "WORTH CONSIDERING",
      negotiate: "NEGOTIATE",
      avoid: "AVOID",
      verify_first: "VERIFY FIRST",
    },
    intents: {
      self: "For yourself",
      family: "Family",
      rental: "Rental",
      investment: "Investment",
      unsure: "Unsure",
    },
  },
  pl: {
    eyebrow: "Werdykt WartoMetr",
    cta: "Przygotuj oględziny i negocjacje",
    metrics: {
      forYou: "Dla Ciebie",
      sellerPrice: "Cena sprzedającego",
      fairPrice: "Szacowany zakres ceny",
      recommendedOffer: "Rekomendowana oferta",
      maxOffer: "Rozsądny sufit",
      moveInCost: "Szacowany koszt całkowity",
      completeness: "Pokrycie danych",
    },
    sections: {
      decisionDetails: "Dlaczego taki werdykt",
      reasons: "Dlaczego warto",
      risks: "Główne ryzyka",
      unknowns: "Niezweryfikowane",
      negotiation: "Asystent negocjacji",
      dueDiligence: "Lista do sprawdzenia",
      totalCost: "Całkowity koszt zakupu",
      knowledge: "Co wiemy",
      preViewing: "Przed oględzinami",
      watch: "Śledź to mieszkanie",
      sources: "Źródła i pewność",
      intent: "Dopasowanie do celu",
    },
    labels: {
      openingOffer: "Oferta startowa",
      realisticDeal: "Realna transakcja",
      walkAway: "Nie przekraczać",
      posture: "Pozycja",
      score: "Ocena WartoMetr",
      documents: "Dokumenty",
      sellerQuestions: "Pytania do sprzedającego",
      photos: "Zdjęcia",
      building: "Budynek",
      surroundings: "Okolica",
      afterViewing: "Po oględzinach",
      known: "Wiemy",
      estimated: "Szacujemy",
      couldNotVerify: "Nie udało się sprawdzić",
      updated: "Aktualizacja",
      confidence: "Pewność",
      selectedIntent: "Cel",
      monthlyPayment: "Rata bazowa",
      renovationCondition: "Stan",
      budgetSource: "Źródło szacunku",
      purchasePrice: "Mieszkanie",
      pccTax: "PCC",
      notary: "Notariusz i sąd",
      bankCosts: "Koszty bankowe",
      upfrontCash: "Wkład i opłaty na start",
      renovation: "Remont",
      furniture: "Meble",
      readyAlternative: "Gotowa alternatywa",
      gap: "Różnica po remoncie",
      empty: "Brak danych.",
      aboveRange: (value) => `${value} powyżej szacowanego zakresu rynkowego`,
      belowRange: (value) => `${value} poniżej szacowanego zakresu rynkowego`,
      withinRange: "W szacowanym zakresie rynkowym",
      confidenceHigh: "Wysoka",
      confidenceMedium: "Średnia",
      confidenceLow: "Niska",
      scenarioOnly: "Tylko scenariusz",
      evidence: "Dowód",
      nextStep: "Kolejny krok",
      limitations: "Dlaczego nie ma scenariusza ceny",
      guardrails: "Granice scenariusza",
      copyBrief: "Kopiuj krótkie uzasadnienie",
      copied: "Uzasadnienie skopiowane",
      copyFailed: "Nie udało się skopiować uzasadnienia",
    },
    statuses: {
      buy: "WARTO ROZWAŻYĆ",
      negotiate: "NEGOCJUJ",
      avoid: "ODPUŚĆ",
      verify_first: "NAJPIERW SPRAWDŹ",
    },
    intents: {
      self: "Dla siebie",
      family: "Rodzina",
      rental: "Najem",
      investment: "Inwestycja",
      unsure: "Nie wiem",
    },
  },
  ru: {
    eyebrow: "Вердикт WartoMetr",
    cta: "Подготовиться к просмотру и торгу",
    metrics: {
      forYou: "Для вас",
      sellerPrice: "Цена продавца",
      fairPrice: "Оценочный диапазон цены",
      recommendedOffer: "Рекомендуемое предложение",
      maxOffer: "Разумный максимум",
      moveInCost: "Стоимость въезда",
      completeness: "Покрытие данных",
    },
    sections: {
      decisionDetails: "Почему такой вывод",
      reasons: "Почему стоит смотреть",
      risks: "Главные риски",
      unknowns: "Не проверено",
      negotiation: "Помощник торга",
      dueDiligence: "Список проверки",
      totalCost: "Полная стоимость покупки",
      knowledge: "Что мы знаем",
      preViewing: "До просмотра",
      watch: "Наблюдение за объектом",
      sources: "Источники и уверенность",
      intent: "Подходит под цель",
    },
    labels: {
      openingOffer: "Стартовое предложение",
      realisticDeal: "Реальная сделка",
      walkAway: "Не превышать",
      posture: "Позиция",
      score: "Оценка WartoMetr",
      documents: "Документы",
      sellerQuestions: "Вопросы продавцу",
      photos: "Фото",
      building: "Дом",
      surroundings: "Окружение",
      afterViewing: "После просмотра",
      known: "Знаем",
      estimated: "Оцениваем",
      couldNotVerify: "Не удалось проверить",
      updated: "Обновлено",
      confidence: "Уверенность",
      selectedIntent: "Цель",
      monthlyPayment: "Базовый платеж",
      renovationCondition: "Состояние",
      budgetSource: "Источник бюджета",
      purchasePrice: "Квартира",
      pccTax: "PCC",
      notary: "Нотариус и суд",
      bankCosts: "Банковские расходы",
      upfrontCash: "Первоначальный взнос и сборы",
      renovation: "Ремонт",
      furniture: "Мебель",
      readyAlternative: "Готовая альтернатива",
      gap: "Разница после ремонта",
      empty: "Нет данных.",
      aboveRange: (value) => `${value} выше оценочного рыночного диапазона`,
      belowRange: (value) => `${value} ниже оценочного рыночного диапазона`,
      withinRange: "В пределах оценочного рыночного диапазона",
      confidenceHigh: "Высокая",
      confidenceMedium: "Средняя",
      confidenceLow: "Низкая",
      scenarioOnly: "Только сценарий",
      evidence: "Основание",
      nextStep: "Следующий шаг",
      limitations: "Почему нет ценового сценария",
      guardrails: "Ограничения сценария",
      copyBrief: "Скопировать обоснование торга",
      copied: "Обоснование скопировано",
      copyFailed: "Не удалось скопировать обоснование",
    },
    statuses: {
      buy: "ПОКУПАТЬ",
      negotiate: "ТОРГОВАТЬСЯ",
      avoid: "ИЗБЕГАТЬ",
      verify_first: "СНАЧАЛА ПРОВЕРИТЬ",
    },
    intents: {
      self: "Для себя",
      family: "Семья",
      rental: "Аренда",
      investment: "Инвестиция",
      unsure: "Не уверен",
    },
  },
  uk: {
    eyebrow: "Вердикт WartoMetr",
    cta: "Підготувати перегляд і торг",
    metrics: {
      forYou: "Для вас",
      sellerPrice: "Ціна продавця",
      fairPrice: "Оціночний діапазон ціни",
      recommendedOffer: "Рекомендована пропозиція",
      maxOffer: "Розумна межа",
      moveInCost: "Вартість входу",
      completeness: "Покриття даних",
    },
    sections: {
      decisionDetails: "Чому такий висновок",
      reasons: "Чому варто дивитися",
      risks: "Головні ризики",
      unknowns: "Не перевірено",
      negotiation: "Помічник торгу",
      dueDiligence: "Список перевірки",
      totalCost: "Повна вартість купівлі",
      knowledge: "Що ми знаємо",
      preViewing: "До перегляду",
      watch: "Спостереження за об'єктом",
      sources: "Джерела і впевненість",
      intent: "Відповідність цілі",
    },
    labels: {
      openingOffer: "Стартова пропозиція",
      realisticDeal: "Реальна угода",
      walkAway: "Не перевищувати",
      posture: "Позиція",
      score: "Оцінка WartoMetr",
      documents: "Документи",
      sellerQuestions: "Питання продавцю",
      photos: "Фото",
      building: "Будинок",
      surroundings: "Оточення",
      afterViewing: "Після перегляду",
      known: "Знаємо",
      estimated: "Оцінюємо",
      couldNotVerify: "Не вдалося перевірити",
      updated: "Оновлено",
      confidence: "Впевненість",
      selectedIntent: "Ціль",
      monthlyPayment: "Базовий платіж",
      renovationCondition: "Стан",
      budgetSource: "Джерело бюджету",
      purchasePrice: "Квартира",
      pccTax: "PCC",
      notary: "Нотаріус і суд",
      bankCosts: "Банківські витрати",
      upfrontCash: "Перший внесок і збори",
      renovation: "Ремонт",
      furniture: "Меблі",
      readyAlternative: "Готова альтернатива",
      gap: "Різниця після ремонту",
      empty: "Немає даних.",
      aboveRange: (value) => `${value} вище оціночного ринкового діапазону`,
      belowRange: (value) => `${value} нижче оціночного ринкового діапазону`,
      withinRange: "У межах оціночного ринкового діапазону",
      confidenceHigh: "Висока",
      confidenceMedium: "Середня",
      confidenceLow: "Низька",
      scenarioOnly: "Лише сценарій",
      evidence: "Підстава",
      nextStep: "Наступний крок",
      limitations: "Чому немає цінового сценарію",
      guardrails: "Межі сценарію",
      copyBrief: "Скопіювати обґрунтування торгу",
      copied: "Обґрунтування скопійовано",
      copyFailed: "Не вдалося скопіювати обґрунтування",
    },
    statuses: {
      buy: "КУПУВАТИ",
      negotiate: "ТОРГУВАТИСЯ",
      avoid: "УНИКАТИ",
      verify_first: "СПОЧАТКУ ПЕРЕВІРИТИ",
    },
    intents: {
      self: "Для себе",
      family: "Сім'я",
      rental: "Оренда",
      investment: "Інвестиція",
      unsure: "Не впевнений",
    },
  },
};

export function BuyerDecisionPanel({ decision, confidenceScore, locale }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  if (!decision) return null;

  const copy = COPY[locale];
  const negotiation = decision.negotiation;
  const dueDiligence = decision.due_diligence;
  const knowledge = decision.knowledge;
  const total = decision.total_acquisition;
  const localized = localizeBuyerDecision(decision, locale, confidenceScore);
  return (
    <section className={`buyer-decision buyer-decision-${decision.verdict.status}`}>
      <DecisionSummary confidenceScore={confidenceScore} decision={decision} locale={locale} />

      <div className="buyer-decision-key-factors">
        <DecisionList
          icon={<CheckCircle2 size={16} />}
          title={copy.sections.reasons}
          items={localized.reasons}
          emptyLabel={copy.labels.empty}
        />
        <DecisionList
          icon={<ShieldAlert size={16} />}
          title={copy.sections.risks}
          items={localized.risks}
          emptyLabel={copy.labels.empty}
        />
      </div>

      <button
        className="button primary buyer-decision-cta"
        type="button"
        onClick={() => revealDecisionSection(detailsRef.current, "buyer-negotiation")}
      >
        <ClipboardCheck size={16} /> {copy.cta}
      </button>

      <details className="buyer-decision-details" id="buyer-decision-details" ref={detailsRef}>
        <summary>{copy.sections.decisionDetails}</summary>
        <div className="buyer-decision-details-body">
          <DecisionList
            icon={<HelpCircle size={16} />}
            title={copy.sections.unknowns}
            items={localized.unknowns}
            emptyLabel={copy.labels.empty}
          />

          <div className="buyer-decision-detail-grid">
            <section id="buyer-negotiation" className="buyer-decision-block">
              <h3>
                <Target size={16} /> {copy.sections.negotiation}
              </h3>
              <p className="muted">
                {localized.negotiationStatus} {localized.negotiationConfidence}
              </p>
              {localized.negotiationAvailable &&
              negotiation.opening_offer_pln !== null &&
              negotiation.realistic_deal_low_pln !== null &&
              negotiation.realistic_deal_high_pln !== null &&
              negotiation.max_reasonable_offer_pln !== null ? (
                <dl className="buyer-decision-facts">
                  <Fact label={copy.labels.openingOffer} value={money(negotiation.opening_offer_pln, locale)} />
                  <Fact
                    label={copy.labels.realisticDeal}
                    value={`${money(negotiation.realistic_deal_low_pln, locale)}-${money(
                      negotiation.realistic_deal_high_pln,
                      locale,
                    )}`}
                  />
                  <Fact label={copy.labels.walkAway} value={money(negotiation.max_reasonable_offer_pln, locale)} />
                  <Fact label={copy.labels.posture} value={localized.negotiationPosture} />
                </dl>
              ) : null}
              {!localized.negotiationAvailable && localized.negotiationLimitations.length > 0 ? (
                <div>
                  <strong>{copy.labels.limitations}</strong>
                  <ul className="section-list compact">
                    {localized.negotiationLimitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <ul className="section-list compact">
                {localized.negotiationArguments.slice(0, 4).map((item) => {
                  return (
                    <li key={item.key}>
                      <strong>{item.text}</strong>
                      {item.evidence.map((evidence) => (
                        <div key={evidence.id}>
                          <small className="muted">
                            {copy.labels.evidence}: {evidence.source_name}
                          </small>
                          <ProvenanceDetails
                            locale={locale}
                            provenance={{
                              sourceName: evidence.source_name,
                              sourceType: evidence.source_type,
                              updatedAt: evidence.updated_at,
                              sampleSize: evidence.sample_size,
                              scope: evidence.geographic_scope,
                              timeRange: evidence.time_range,
                              calculationType: evidence.calculation_type ?? "unknown",
                              confidenceScore: evidence.confidence_score,
                            }}
                          />
                        </div>
                      ))}
                    </li>
                  );
                })}
                {localized.negotiationActions.map((item) => (
                  <li key={item}>
                    <strong>{copy.labels.nextStep}:</strong> {item}
                  </li>
                ))}
              </ul>
              <div>
                <strong>{copy.labels.guardrails}</strong>
                <ul className="section-list compact">
                  {localized.negotiationGuardrails.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <button
                className="button secondary"
                type="button"
                onClick={async () => {
                  try {
                    await copyToClipboard(localized.negotiationBrief);
                    setCopyStatus("copied");
                  } catch {
                    setCopyStatus("failed");
                  }
                }}
              >
                {copyStatus === "copied" ? <Check size={16} /> : <Copy size={16} />}
                {copy.labels.copyBrief}
              </button>
              <span className="muted" role="status" aria-live="polite">
                {copyStatus === "copied" ? copy.labels.copied : copyStatus === "failed" ? copy.labels.copyFailed : ""}
              </span>
            </section>

            {decision.action_plan ? (
              <BuyerActionPlanPanel
                dueDiligenceLabel={localized.diligenceLabel}
                dueDiligenceScore={dueDiligence.score}
                locale={locale}
                plan={decision.action_plan}
              />
            ) : (
              <BuyerActionPlanUnavailable locale={locale} />
            )}

            <section className="buyer-decision-block">
              <h3>
                <WalletCards size={16} /> {copy.sections.totalCost}
              </h3>
              <dl className="buyer-decision-facts">
                {total.renovation_condition ? (
                  <Fact
                    label={copy.labels.renovationCondition}
                    value={localized.renovationCondition ?? copy.labels.empty}
                  />
                ) : null}
                <Fact label={copy.labels.budgetSource} value={localized.budgetSource} />
                <Fact label={copy.labels.purchasePrice} value={money(total.purchase_price_pln, locale)} />
                <Fact label={copy.labels.pccTax} value={money(total.pcc_tax_pln, locale)} />
                <Fact label={copy.labels.notary} value={money(total.notary_and_court_pln, locale)} />
                <Fact label={copy.labels.bankCosts} value={money(total.bank_costs_pln, locale)} />
                <Fact label={copy.labels.renovation} value={money(total.renovation_estimate_pln, locale)} />
                <Fact label={copy.labels.furniture} value={money(total.furniture_estimate_pln, locale)} />
                <Fact label={copy.metrics.moveInCost} value={money(total.total_move_in_cost_pln, locale)} />
                <Fact label={copy.labels.upfrontCash} value={money(total.upfront_cash_needed_pln, locale)} />
                <Fact label={copy.labels.monthlyPayment} value={money(total.monthly_payment_baseline_pln, locale)} />
                {total.ready_to_move_alternative_price_pln ? (
                  <Fact
                    label={copy.labels.readyAlternative}
                    value={money(total.ready_to_move_alternative_price_pln, locale)}
                  />
                ) : null}
                {total.post_renovation_value_gap_pln !== null ? (
                  <Fact label={copy.labels.gap} value={money(total.post_renovation_value_gap_pln, locale)} />
                ) : null}
              </dl>
              <ul className="section-list compact">
                {localized.totalNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="buyer-decision-block">
              <h3>{copy.sections.knowledge}</h3>
              <GroupedLists
                groups={[
                  [copy.labels.known, localized.known],
                  [copy.labels.estimated, localized.estimated],
                  [copy.labels.couldNotVerify, localized.couldNotVerify],
                ]}
                emptyLabel={copy.labels.empty}
              />
            </section>

            <section className="buyer-decision-block">
              <h3>
                <Bell size={16} /> {copy.sections.watch}
              </h3>
              <ul className="section-list compact">
                {localized.watchTriggers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>{copy.sections.intent}</h3>
              <div className="buyer-intent-strip">
                {decision.intent_fit.map((fit) => (
                  <span
                    className={`score-pill ${fit.intent === decision.selected_intent ? "selected" : ""}`}
                    key={fit.intent}
                  >
                    {copy.intents[fit.intent] ?? fit.intent}:{" "}
                    {fit.score === null ? copy.labels.empty : `${Math.round(fit.score / 10)}/10`}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <section className="buyer-decision-block buyer-decision-sources">
            <h3>{copy.sections.sources}</h3>
            <div className="buyer-source-grid">
              {knowledge.source_evidence.map((source) => (
                <SourceEvidenceItem
                  copy={copy}
                  key={`${source.topic}-${source.source_name}`}
                  locale={locale}
                  source={source}
                />
              ))}
            </div>
          </section>

          <p className="muted buyer-decision-disclaimer">{localized.disclaimer}</p>
        </div>
      </details>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) throw new Error("clipboard_copy_failed");
  } finally {
    textarea.remove();
  }
}

function DecisionList({
  icon,
  title,
  items,
  emptyLabel,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <section className="buyer-decision-block">
      <h3>
        {icon} {title}
      </h3>
      {items.length > 0 ? (
        <ul className="section-list compact">
          {items.slice(0, 6).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">{emptyLabel}</p>
      )}
    </section>
  );
}

function GroupedLists({ groups, emptyLabel }: { groups: Array<[string, string[]]>; emptyLabel: string }) {
  const visibleGroups = groups.filter(([, items]) => items.length > 0);
  if (visibleGroups.length === 0) return <p className="muted">{emptyLabel}</p>;

  return (
    <div className="buyer-decision-list-groups">
      {visibleGroups.map(([label, items]) => (
        <div key={label}>
          <strong>{label}</strong>
          <ul className="section-list compact">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SourceEvidenceItem({
  copy,
  locale,
  source,
}: {
  copy: BuyerDecisionCopy;
  locale: Locale;
  source: BuyerSourceEvidence;
}) {
  const localized = localizedSourceEvidence(source, locale);
  return (
    <article className="buyer-source-item">
      <strong>{localized.topic}</strong>
      <span>{localized.basis}</span>
      <small>
        {source.source_name} · {copy.labels.confidence} {confidenceLabel(source.confidence_score, copy)}
      </small>
      <ProvenanceDetails
        locale={locale}
        provenance={{
          sourceName: source.source_name,
          sourceType: source.source_type,
          updatedAt: source.updated_at,
          sampleSize: source.sample_size,
          scope: source.geographic_scope,
          timeRange: source.time_range,
          calculationType: source.calculation_type ?? "unknown",
          confidenceScore: source.confidence_score,
          note: localized.note,
        }}
      />
    </article>
  );
}

function confidenceLabel(score: number, copy: BuyerDecisionCopy) {
  if (score >= 75) return copy.labels.confidenceHigh;
  if (score >= 50) return copy.labels.confidenceMedium;
  return copy.labels.confidenceLow;
}

function revealDecisionSection(details: HTMLDetailsElement | null, sectionId: string) {
  if (!details) return;
  details.open = true;
  window.requestAnimationFrame(() => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
