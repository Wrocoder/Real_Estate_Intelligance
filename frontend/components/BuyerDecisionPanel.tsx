import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  HelpCircle,
  ShieldAlert,
  Target,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import type { BuyerDecisionPackage, BuyerSourceEvidence, BuyerVerdictStatus } from "@/lib/api";
import { dateValue, money } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type Props = {
  decision: BuyerDecisionPackage | null;
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

export function BuyerDecisionPanel({ decision, locale }: Props) {
  if (!decision) return null;

  const copy = COPY[locale];
  const verdict = decision.verdict;
  const negotiation = decision.negotiation;
  const dueDiligence = decision.due_diligence;
  const knowledge = decision.knowledge;
  const total = decision.total_acquisition;
  const domarionScore = Math.round(verdict.score * 10);
  const overpricingAbs = Math.abs(verdict.overpricing_pln);
  const priceRelation =
    verdict.overpricing_pln > 0
      ? copy.labels.aboveRange(money(overpricingAbs, locale))
      : verdict.overpricing_pln < 0
        ? copy.labels.belowRange(money(overpricingAbs, locale))
        : copy.labels.withinRange;
  const selectedIntentFit =
    decision.selected_intent_fit ??
    decision.intent_fit.find((fit) => fit.intent === decision.selected_intent) ??
    decision.intent_fit.find((fit) => fit.intent === "unsure") ??
    null;

  return (
    <section className={`buyer-decision buyer-decision-${verdict.status}`}>
      <div className="buyer-decision-hero">
        <div>
          <div className="meta-row">
            <span className={`status-pill ${verdictStatusTone(verdict.status)}`}>
              {copy.statuses[verdict.status]}
            </span>
            <span className="status-pill info">{copy.eyebrow}</span>
            {selectedIntentFit ? (
              <span className="status-pill info">
                {copy.labels.selectedIntent}:{" "}
                {copy.intents[decision.selected_intent] ?? decision.selected_intent}
              </span>
            ) : null}
          </div>
          <h2>{verdict.headline}</h2>
          <p>{verdict.summary}</p>
          <p className="buyer-price-relation">{priceRelation}</p>
        </div>
        <strong className="buyer-decision-score">{domarionScore}/100</strong>
      </div>

      <div className="buyer-decision-metrics">
        {selectedIntentFit ? (
          <Metric
            label={copy.metrics.forYou}
            value={`${Math.round(selectedIntentFit.score / 10)}/10`}
          />
        ) : null}
        <Metric label={copy.metrics.sellerPrice} value={money(verdict.seller_price_pln, locale)} />
        <Metric
          label={copy.metrics.fairPrice}
            value={`${money(verdict.fair_price_low_pln, locale)}-${money(
              verdict.fair_price_high_pln,
              locale,
            )}`}
        />
        <Metric
          label={copy.metrics.recommendedOffer}
          value={money(verdict.recommended_offer_pln, locale)}
        />
        <Metric
          label={copy.metrics.maxOffer}
          value={money(verdict.max_reasonable_offer_pln, locale)}
        />
        <Metric
          label={copy.metrics.moveInCost}
          value={money(total.total_move_in_cost_pln, locale)}
        />
        <Metric
          label={copy.metrics.completeness}
          value={`${knowledge.check_completeness_score}/100`}
        />
      </div>

      <a className="button primary buyer-decision-cta" href="#buyer-negotiation">
        <ClipboardCheck size={16} /> {copy.cta}
      </a>

      <div className="buyer-decision-columns">
        <DecisionList
          icon={<CheckCircle2 size={16} />}
          title={copy.sections.reasons}
          items={verdict.top_reasons}
          emptyLabel={copy.labels.empty}
        />
        <DecisionList
          icon={<ShieldAlert size={16} />}
          title={copy.sections.risks}
          items={verdict.top_risks}
          emptyLabel={copy.labels.empty}
        />
        <DecisionList
          icon={<HelpCircle size={16} />}
          title={copy.sections.unknowns}
          items={verdict.critical_unknowns}
          emptyLabel={copy.labels.empty}
        />
      </div>

      <div className="buyer-decision-detail-grid">
        <section id="buyer-negotiation" className="buyer-decision-block">
          <h3>
            <Target size={16} /> {copy.sections.negotiation}
          </h3>
          <dl className="buyer-decision-facts">
            <Fact label={copy.labels.openingOffer} value={money(negotiation.opening_offer_pln, locale)} />
            <Fact
              label={copy.labels.realisticDeal}
              value={`${money(negotiation.realistic_deal_low_pln, locale)}-${money(
                negotiation.realistic_deal_high_pln,
                locale,
              )}`}
            />
            <Fact
              label={copy.labels.walkAway}
              value={money(negotiation.max_reasonable_offer_pln, locale)}
            />
            <Fact label={copy.labels.posture} value={negotiation.posture} />
          </dl>
          <ul className="section-list compact">
            {negotiation.arguments.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {negotiation.seller_script.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="buyer-decision-block">
          <h3>
            <ShieldAlert size={16} /> {copy.sections.dueDiligence}
          </h3>
          <dl className="buyer-decision-facts">
            <Fact label={copy.labels.score} value={`${dueDiligence.score}/100`} />
            <Fact label={copy.labels.posture} value={dueDiligence.label} />
          </dl>
          <GroupedLists
            groups={[
              [copy.labels.documents, dueDiligence.documents_to_request.slice(0, 5)],
              [copy.labels.sellerQuestions, dueDiligence.questions_for_seller.slice(0, 5)],
            ]}
            emptyLabel={copy.labels.empty}
          />
        </section>

        <section className="buyer-decision-block">
          <h3>
            <WalletCards size={16} /> {copy.sections.totalCost}
          </h3>
          <dl className="buyer-decision-facts">
            {total.renovation_condition ? (
              <Fact
                label={copy.labels.renovationCondition}
                value={humanizeCode(total.renovation_condition)}
              />
            ) : null}
            <Fact
              label={copy.labels.budgetSource}
              value={humanizeCode(total.renovation_budget_source)}
            />
            <Fact label={copy.labels.purchasePrice} value={money(total.purchase_price_pln, locale)} />
            <Fact label={copy.labels.pccTax} value={money(total.pcc_tax_pln, locale)} />
            <Fact label={copy.labels.notary} value={money(total.notary_and_court_pln, locale)} />
            <Fact label={copy.labels.bankCosts} value={money(total.bank_costs_pln, locale)} />
            <Fact label={copy.labels.renovation} value={money(total.renovation_estimate_pln, locale)} />
            <Fact label={copy.labels.furniture} value={money(total.furniture_estimate_pln, locale)} />
            <Fact label={copy.metrics.moveInCost} value={money(total.total_move_in_cost_pln, locale)} />
            <Fact label={copy.labels.upfrontCash} value={money(total.upfront_cash_needed_pln, locale)} />
            <Fact
              label={copy.labels.monthlyPayment}
              value={money(total.monthly_payment_baseline_pln, locale)}
            />
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
            {total.notes.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="buyer-decision-block">
          <h3>{copy.sections.knowledge}</h3>
          <GroupedLists
            groups={[
              [copy.labels.known, knowledge.known.slice(0, 4)],
              [copy.labels.estimated, knowledge.estimated.slice(0, 4)],
              [copy.labels.couldNotVerify, knowledge.could_not_verify.slice(0, 5)],
            ]}
            emptyLabel={copy.labels.empty}
          />
        </section>

        <section className="buyer-decision-block">
          <h3>
            <Eye size={16} /> {copy.sections.preViewing}
          </h3>
          <GroupedLists
            groups={[
              [copy.labels.sellerQuestions, decision.pre_viewing.seller_questions.slice(0, 5)],
              [copy.labels.photos, decision.pre_viewing.photos_to_take.slice(0, 4)],
              [copy.labels.building, decision.pre_viewing.building_checks.slice(0, 4)],
              [copy.labels.surroundings, decision.pre_viewing.surroundings_checks.slice(0, 4)],
              [copy.labels.afterViewing, decision.post_viewing_checklist.slice(0, 5)],
            ]}
            emptyLabel={copy.labels.empty}
          />
        </section>

        <section className="buyer-decision-block">
          <h3>
            <Bell size={16} /> {copy.sections.watch}
          </h3>
          <ul className="section-list compact">
            {decision.watch_triggers.slice(0, 6).map((item) => (
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
                {copy.intents[fit.intent] ?? fit.intent}: {Math.round(fit.score / 10)}/10
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

      <p className="muted buyer-decision-disclaimer">{decision.disclaimer}</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function GroupedLists({
  groups,
  emptyLabel,
}: {
  groups: Array<[string, string[]]>;
  emptyLabel: string;
}) {
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
  return (
    <article className="buyer-source-item">
      <strong>{source.topic}</strong>
      <span>{source.basis}</span>
      <small>
        {source.source_name} · {copy.labels.confidence}{" "}
        {confidenceLabel(source.confidence_score, copy)}
        {source.updated_at ? ` · ${copy.labels.updated} ${dateValue(source.updated_at, locale)}` : ""}
      </small>
      {source.note ? <small>{source.note}</small> : null}
    </article>
  );
}

function verdictStatusTone(status: BuyerVerdictStatus) {
  if (status === "buy") return "healthy";
  if (status === "negotiate") return "warning";
  if (status === "avoid") return "error";
  return "info";
}

function humanizeCode(value: string) {
  return value.replaceAll("_", " ");
}

function confidenceLabel(score: number, copy: BuyerDecisionCopy) {
  if (score >= 75) return copy.labels.confidenceHigh;
  if (score >= 50) return copy.labels.confidenceMedium;
  return copy.labels.confidenceLow;
}
