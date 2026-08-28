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
    monthlyPayment: string;
    renovationCondition: string;
    budgetSource: string;
    upfrontCash: string;
    renovation: string;
    furniture: string;
    readyAlternative: string;
    gap: string;
    empty: string;
  };
  statuses: Record<BuyerVerdictStatus, string>;
  intents: Record<string, string>;
};

const COPY: Record<Locale, BuyerDecisionCopy> = {
  en: {
    eyebrow: "Domarion verdict",
    cta: "Prepare viewing and negotiation",
    metrics: {
      sellerPrice: "Seller price",
      fairPrice: "Fair price",
      recommendedOffer: "Recommended offer",
      maxOffer: "Max reasonable",
      moveInCost: "Move-in cost",
      completeness: "Check completeness",
    },
    sections: {
      reasons: "Why it works",
      risks: "Main risks",
      unknowns: "Not verified",
      negotiation: "Negotiation assistant",
      dueDiligence: "Property due diligence",
      totalCost: "Total acquisition cost",
      knowledge: "What we know",
      preViewing: "Before viewing",
      watch: "Object watch",
      sources: "Sources and confidence",
      intent: "Fit by buyer intent",
    },
    labels: {
      openingOffer: "Opening offer",
      realisticDeal: "Realistic deal",
      walkAway: "Do not exceed",
      posture: "Posture",
      score: "Score",
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
      monthlyPayment: "Monthly baseline",
      renovationCondition: "Condition",
      budgetSource: "Budget source",
      upfrontCash: "Upfront cash",
      renovation: "Renovation",
      furniture: "Furniture",
      readyAlternative: "Ready alternative",
      gap: "Post-renovation gap",
      empty: "No data.",
    },
    statuses: {
      buy: "BUY",
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
    eyebrow: "Werdykt Domarion",
    cta: "Przygotuj oględziny i negocjacje",
    metrics: {
      sellerPrice: "Cena sprzedającego",
      fairPrice: "Fair price",
      recommendedOffer: "Rekomendowana oferta",
      maxOffer: "Rozsądny sufit",
      moveInCost: "Koszt wejścia",
      completeness: "Pełność sprawdzenia",
    },
    sections: {
      reasons: "Dlaczego warto",
      risks: "Główne ryzyka",
      unknowns: "Niezweryfikowane",
      negotiation: "Asystent negocjacji",
      dueDiligence: "Property due diligence",
      totalCost: "Całkowity koszt zakupu",
      knowledge: "Co wiemy",
      preViewing: "Przed oględzinami",
      watch: "Object watch",
      sources: "Źródła i pewność",
      intent: "Dopasowanie do celu",
    },
    labels: {
      openingOffer: "Oferta startowa",
      realisticDeal: "Realna transakcja",
      walkAway: "Nie przekraczać",
      posture: "Pozycja",
      score: "Score",
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
      monthlyPayment: "Rata bazowa",
      renovationCondition: "Stan",
      budgetSource: "Źródło budżetu",
      upfrontCash: "Gotówka na start",
      renovation: "Remont",
      furniture: "Meble",
      readyAlternative: "Gotowa alternatywa",
      gap: "Różnica po remoncie",
      empty: "Brak danych.",
    },
    statuses: {
      buy: "BUY",
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
    eyebrow: "Вердикт Domarion",
    cta: "Подготовиться к просмотру и торгу",
    metrics: {
      sellerPrice: "Цена продавца",
      fairPrice: "Справедливая цена",
      recommendedOffer: "Рекомендуемый offer",
      maxOffer: "Разумный максимум",
      moveInCost: "Стоимость въезда",
      completeness: "Полнота проверки",
    },
    sections: {
      reasons: "Почему стоит смотреть",
      risks: "Главные риски",
      unknowns: "Не проверено",
      negotiation: "Помощник торга",
      dueDiligence: "Due diligence объекта",
      totalCost: "Полная стоимость покупки",
      knowledge: "Что мы знаем",
      preViewing: "До просмотра",
      watch: "Наблюдение за объектом",
      sources: "Источники и уверенность",
      intent: "Подходит под цель",
    },
    labels: {
      openingOffer: "Стартовый offer",
      realisticDeal: "Реальная сделка",
      walkAway: "Не превышать",
      posture: "Позиция",
      score: "Score",
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
      monthlyPayment: "Платеж baseline",
      renovationCondition: "Состояние",
      budgetSource: "Источник бюджета",
      upfrontCash: "Наличные на старт",
      renovation: "Ремонт",
      furniture: "Мебель",
      readyAlternative: "Готовая альтернатива",
      gap: "Разница после ремонта",
      empty: "Нет данных.",
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
    eyebrow: "Вердикт Domarion",
    cta: "Підготувати перегляд і торг",
    metrics: {
      sellerPrice: "Ціна продавця",
      fairPrice: "Справедлива ціна",
      recommendedOffer: "Рекомендована offer",
      maxOffer: "Розумна межа",
      moveInCost: "Вартість входу",
      completeness: "Повнота перевірки",
    },
    sections: {
      reasons: "Чому варто дивитися",
      risks: "Головні ризики",
      unknowns: "Не перевірено",
      negotiation: "Помічник торгу",
      dueDiligence: "Due diligence об'єкта",
      totalCost: "Повна вартість купівлі",
      knowledge: "Що ми знаємо",
      preViewing: "До перегляду",
      watch: "Спостереження за об'єктом",
      sources: "Джерела і впевненість",
      intent: "Відповідність цілі",
    },
    labels: {
      openingOffer: "Стартова offer",
      realisticDeal: "Реальна угода",
      walkAway: "Не перевищувати",
      posture: "Позиція",
      score: "Score",
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
      monthlyPayment: "Платіж baseline",
      renovationCondition: "Стан",
      budgetSource: "Джерело бюджету",
      upfrontCash: "Готівка на старт",
      renovation: "Ремонт",
      furniture: "Меблі",
      readyAlternative: "Готова альтернатива",
      gap: "Різниця після ремонту",
      empty: "Немає даних.",
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

  return (
    <section className={`buyer-decision buyer-decision-${verdict.status}`}>
      <div className="buyer-decision-hero">
        <div>
          <div className="meta-row">
            <span className={`status-pill ${verdictStatusTone(verdict.status)}`}>
              {copy.statuses[verdict.status]}
            </span>
            <span className="status-pill info">{copy.eyebrow}</span>
          </div>
          <h2>{verdict.headline}</h2>
          <p>{verdict.summary}</p>
        </div>
        <strong className="buyer-decision-score">{verdict.score.toFixed(1)}/10</strong>
      </div>

      <div className="buyer-decision-metrics">
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
            <Fact label={copy.labels.renovation} value={money(total.renovation_estimate_pln, locale)} />
            <Fact label={copy.labels.furniture} value={money(total.furniture_estimate_pln, locale)} />
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
              <span className="score-pill" key={fit.intent}>
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
        {source.source_name} · {copy.labels.confidence} {source.confidence_score}/100
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
