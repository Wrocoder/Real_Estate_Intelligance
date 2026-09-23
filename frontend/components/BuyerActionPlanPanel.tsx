import { Check, ClipboardCheck, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import type {
  BuyerActionEvidence,
  BuyerActionItem,
  BuyerActionPlan,
  DueDiligenceChecklistItem,
  PropertyDueDiligence,
  ViewingAssistant,
} from "@/lib/api";
import { localizedDueDiligenceChecklistLabel } from "@/lib/buyerDecisionMessages";
import {
  actionEvidenceLabel,
  actionLabel,
  actionPlanBrief,
  actionPlanCopy,
} from "@/lib/buyerActionMessages";
import type { Locale } from "@/lib/i18n";

type Props = {
  plan: BuyerActionPlan;
  locale: Locale;
  dueDiligence: PropertyDueDiligence;
  dueDiligenceScore: number;
  dueDiligenceLabel: string;
};

const PHASES = ["before_offer", "on_viewing", "after_viewing"] as const;
const PRIORITY_RANK: Record<BuyerActionItem["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

type ViewingPrepCopy = {
  title: string;
  description: string;
  recommendation: Record<ViewingAssistant["recommendation"], string>;
  why: string;
  inspect: string;
  ask: string;
  documents: string;
  empty: string;
  fallbackAsk: string;
  fallbackWhy: string;
};

const VIEWING_COPY: Record<Locale, ViewingPrepCopy> = {
  pl: {
    title: "Przygotuj mnie do oglądania",
    description: "Najważniejsze rzeczy do sprawdzenia na miejscu, wybrane z ryzyk i brakujących danych tego mieszkania.",
    recommendation: {
      view: "Warto obejrzeć z przygotowaną listą",
      verify_first: "Najpierw zamknij krytyczne niewiadome",
      skip: "Raczej odpuść oglądanie",
    },
    why: "Dlaczego to ważne",
    inspect: "Co obejrzeć",
    ask: "O co zapytać",
    documents: "Dokumenty do poproszenia przed decyzją",
    empty: "Brak wystarczających danych, aby zbudować listę pod to mieszkanie.",
    fallbackAsk: "Poproś sprzedającego o potwierdzenie tego punktu i dokument lub zdjęcie, jeśli dotyczy.",
    fallbackWhy: "Ten punkt wynika z niezweryfikowanych informacji w analizie.",
  },
  en: {
    title: "Prepare for the viewing",
    description: "The most important on-site checks selected from this apartment's risks and missing facts.",
    recommendation: {
      view: "Worth viewing with a prepared list",
      verify_first: "Close critical unknowns first",
      skip: "Probably skip the viewing",
    },
    why: "Why it matters",
    inspect: "What to inspect",
    ask: "What to ask",
    documents: "Documents to request before deciding",
    empty: "There is not enough data to build a property-specific viewing list.",
    fallbackAsk: "Ask the seller to confirm this point and provide a document or photo where relevant.",
    fallbackWhy: "This item comes from information that is not yet verified in the analysis.",
  },
  ru: {
    title: "Подготовиться к просмотру",
    description: "Главные проверки на месте, выбранные из рисков и недостающих фактов по этой квартире.",
    recommendation: {
      view: "Стоит смотреть с подготовленным списком",
      verify_first: "Сначала закрыть критичные неизвестные",
      skip: "Скорее пропустить просмотр",
    },
    why: "Почему это важно",
    inspect: "Что проверить",
    ask: "О чем спросить",
    documents: "Документы до решения",
    empty: "Недостаточно данных, чтобы собрать список проверки именно для этой квартиры.",
    fallbackAsk: "Попросите продавца подтвердить этот пункт и показать документ или фото, если применимо.",
    fallbackWhy: "Этот пункт связан с непроверенной информацией в анализе.",
  },
  uk: {
    title: "Підготуватися до огляду",
    description: "Головні перевірки на місці, вибрані з ризиків і відсутніх фактів щодо цієї квартири.",
    recommendation: {
      view: "Варто дивитися з підготовленим списком",
      verify_first: "Спочатку закрийте критичні невідомі",
      skip: "Скоріше пропустіть огляд",
    },
    why: "Чому це важливо",
    inspect: "Що перевірити",
    ask: "Про що запитати",
    documents: "Документи до рішення",
    empty: "Недостатньо даних, щоб скласти список перевірки саме для цієї квартири.",
    fallbackAsk: "Попросіть продавця підтвердити цей пункт і показати документ або фото, якщо доречно.",
    fallbackWhy: "Цей пункт пов'язаний із неперевіреною інформацією в аналізі.",
  },
};

type ViewingPrepItem = {
  code: string;
  priority: BuyerActionItem["priority"];
  why: string;
  inspect: string;
  ask: string;
  evidence: BuyerActionEvidence | null;
};

type DiligenceState = "verified" | "requires_check" | "risk" | "unknown" | "insufficient_data";
type DiligenceWorkspaceCopy = {
  title: string;
  description: string;
  statusTitle: string;
  criticalTitle: string;
  riskTitle: string;
  documentsTitle: string;
  questionsTitle: string;
  noRisks: string;
  legalCaveat: string;
  market: Record<PropertyDueDiligence["market_type"], string>;
  states: Record<DiligenceState, string>;
  priorities: Record<DueDiligenceChecklistItem["priority"], string>;
  categories: Record<string, string>;
};

const DILIGENCE_COPY: Record<Locale, DiligenceWorkspaceCopy> = {
  pl: {
    title: "Kontrola przed zakupem",
    description: "Najpierw zamknij sprawy, które mogą zmienić decyzję przed ofertą, zadatkiem lub umową.",
    statusTitle: "Status kontroli",
    criticalTitle: "Krytyczne punkty do zamknięcia",
    riskTitle: "Sygnały ryzyka",
    documentsTitle: "Dokumenty do poproszenia",
    questionsTitle: "Pytania do sprzedającego",
    noRisks: "Nie wykryto dodatkowych czerwonych flag poza standardową listą kontroli.",
    legalCaveat: "To jest lista kontrolna do decyzji kupującego, nie porada prawna. KW, umowę, zadatek i stan techniczny potwierdź z prawnikiem, notariuszem lub rzeczoznawcą.",
    market: { primary: "Rynek pierwotny", secondary: "Rynek wtórny" },
    states: {
      verified: "ZWERYFIKOWANE",
      requires_check: "WYMAGA SPRAWDZENIA",
      risk: "RYZYKO",
      unknown: "NIEZNANE",
      insufficient_data: "ZA MAŁO DANYCH",
    },
    priorities: { critical: "Krytyczne", high: "Ważne", medium: "Uzupełniające", low: "Opcjonalne" },
    categories: {
      legal: "Prawo i KW",
      financial: "Koszty i zobowiązania",
      building: "Budynek",
      technical: "Stan techniczny",
      documents: "Dokumenty",
      developer: "Deweloper",
      delivery: "Realizacja",
      contract: "Umowa",
    },
  },
  en: {
    title: "Due diligence workspace",
    description: "Close the checks that can change the decision before an offer, deposit or contract.",
    statusTitle: "Check status",
    criticalTitle: "Critical checks to close",
    riskTitle: "Risk signals",
    documentsTitle: "Documents to request",
    questionsTitle: "Questions for the seller",
    noRisks: "No additional red flags detected beyond the standard diligence checklist.",
    legalCaveat: "This is a buyer decision checklist, not legal advice. Confirm the register, contract, deposit and technical condition with a lawyer, notary or qualified expert.",
    market: { primary: "Primary market", secondary: "Secondary market" },
    states: {
      verified: "VERIFIED",
      requires_check: "REQUIRES CHECK",
      risk: "RISK",
      unknown: "UNKNOWN",
      insufficient_data: "INSUFFICIENT DATA",
    },
    priorities: { critical: "Critical", high: "Important", medium: "Supporting", low: "Optional" },
    categories: {
      legal: "Legal and register",
      financial: "Costs and liabilities",
      building: "Building",
      technical: "Technical condition",
      documents: "Documents",
      developer: "Developer",
      delivery: "Delivery",
      contract: "Contract",
    },
  },
  ru: {
    title: "Проверки перед покупкой",
    description: "Закройте проверки, которые могут изменить решение до предложения цены, задатка или договора.",
    statusTitle: "Статус проверок",
    criticalTitle: "Критичные пункты",
    riskTitle: "Сигналы риска",
    documentsTitle: "Документы для запроса",
    questionsTitle: "Вопросы продавцу",
    noRisks: "Дополнительных красных флагов сверх стандартного списка проверки не найдено.",
    legalCaveat: "Это список проверки для решения покупателя, не юридическая консультация. KW, договор, задаток и техническое состояние подтвердите с юристом, нотариусом или профильным экспертом.",
    market: { primary: "Первичный рынок", secondary: "Вторичный рынок" },
    states: {
      verified: "ПРОВЕРЕНО",
      requires_check: "ТРЕБУЕТ ПРОВЕРКИ",
      risk: "РИСК",
      unknown: "НЕИЗВЕСТНО",
      insufficient_data: "НЕДОСТАТОЧНО ДАННЫХ",
    },
    priorities: { critical: "Критично", high: "Важно", medium: "Дополнительно", low: "Опционально" },
    categories: {
      legal: "Право и KW",
      financial: "Расходы и долги",
      building: "Дом",
      technical: "Техническое состояние",
      documents: "Документы",
      developer: "Застройщик",
      delivery: "Сроки сдачи",
      contract: "Договор",
    },
  },
  uk: {
    title: "Перевірки перед купівлею",
    description: "Закрийте перевірки, які можуть змінити рішення до пропозиції ціни, завдатку або договору.",
    statusTitle: "Статус перевірок",
    criticalTitle: "Критичні пункти",
    riskTitle: "Сигнали ризику",
    documentsTitle: "Документи для запиту",
    questionsTitle: "Питання продавцю",
    noRisks: "Додаткових червоних прапорців понад стандартний список перевірки не знайдено.",
    legalCaveat: "Це список перевірки для рішення покупця, не юридична консультація. KW, договір, завдаток і технічний стан підтвердьте з юристом, нотаріусом або профільним експертом.",
    market: { primary: "Первинний ринок", secondary: "Вторинний ринок" },
    states: {
      verified: "ПЕРЕВІРЕНО",
      requires_check: "ПОТРЕБУЄ ПЕРЕВІРКИ",
      risk: "РИЗИК",
      unknown: "НЕВІДОМО",
      insufficient_data: "НЕДОСТАТНЬО ДАНИХ",
    },
    priorities: { critical: "Критично", high: "Важливо", medium: "Додатково", low: "Опційно" },
    categories: {
      legal: "Право і KW",
      financial: "Витрати і борги",
      building: "Будинок",
      technical: "Технічний стан",
      documents: "Документи",
      developer: "Забудовник",
      delivery: "Строки здачі",
      contract: "Договір",
    },
  },
};

export function BuyerActionPlanUnavailable({ locale }: { locale: Locale }) {
  const copy = actionPlanCopy(locale);
  return (
    <section className="buyer-decision-block buyer-action-plan" id="buyer-action-plan">
      <h3>
        <ClipboardCheck size={16} /> {copy.title}
      </h3>
      <p className="muted">{copy.unavailable}</p>
    </section>
  );
}

export function BeforeViewingAssistantPanel({
  assistant,
  locale,
  plan,
}: {
  assistant: ViewingAssistant;
  locale: Locale;
  plan: BuyerActionPlan | null;
}) {
  const copy = VIEWING_COPY[locale];
  const planCopy = actionPlanCopy(locale);
  const items = useMemo(
    () => buildViewingPrepItems(plan, assistant, locale, copy),
    [assistant, copy, locale, plan],
  );
  const documents = assistant.documents_to_request.slice(0, 5);

  return (
    <section className="buyer-decision-block before-viewing-assistant" id="buyer-before-viewing" tabIndex={-1}>
      <div className="before-viewing-heading">
        <div>
          <h3>
            <ClipboardCheck size={16} /> {copy.title}
          </h3>
          <p className="muted">{copy.description}</p>
        </div>
        <span className={`before-viewing-status recommendation-${assistant.recommendation}`}>
          {copy.recommendation[assistant.recommendation]}
        </span>
      </div>

      {items.length ? (
        <div className="before-viewing-items">
          {items.map((item) => (
            <article className="before-viewing-item" key={item.code}>
              <div className="before-viewing-item-header">
                <strong>{item.inspect}</strong>
                <span className={`buyer-action-priority priority-${item.priority}`}>
                  {planCopy.priorities[item.priority]}
                </span>
              </div>
              <dl>
                <dt>{copy.why}</dt>
                <dd>
                  {item.why}
                  {item.evidence ? (
                    <details className="buyer-action-evidence">
                      <summary>{planCopy.evidenceLabel}</summary>
                      <div className="buyer-action-evidence-item">
                        <ProvenanceDetails
                          locale={locale}
                          provenance={{
                            sourceName: item.evidence.source_name,
                            sourceType: item.evidence.source_type,
                            updatedAt: item.evidence.updated_at,
                            sampleSize: item.evidence.sample_size,
                            scope: item.evidence.geographic_scope,
                            timeRange: item.evidence.time_range,
                            calculationType: item.evidence.calculation_type,
                            confidenceScore: item.evidence.confidence_score,
                          }}
                        />
                      </div>
                    </details>
                  ) : null}
                </dd>
                <dt>{copy.inspect}</dt>
                <dd>{item.inspect}</dd>
                <dt>{copy.ask}</dt>
                <dd>{item.ask}</dd>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">{copy.empty}</p>
      )}

      {documents.length ? (
        <details className="before-viewing-documents">
          <summary>{copy.documents}</summary>
          <ul className="section-list compact">
            {documents.map((document) => (
              <li key={document}>{document}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export function BuyerActionPlanPanel({
  plan,
  locale,
  dueDiligence,
  dueDiligenceScore,
  dueDiligenceLabel,
}: Props) {
  const copy = actionPlanCopy(locale);
  const diligenceCopy = DILIGENCE_COPY[locale];
  const storageKey = `wartometr-action-plan:${plan.subject_id}:${plan.version}`;
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const evidenceById = useMemo(
    () => new Map(plan.evidence.map((item) => [item.id, item])),
    [plan.evidence],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const actionCodes = new Set(plan.items.map((item) => item.code));
      const restored = stored ? (JSON.parse(stored) as string[]) : [];
      setCompleted(new Set(restored.filter((code) => actionCodes.has(code))));
    } catch {
      setCompleted(new Set());
    }
  }, [plan.items, storageKey]);

  function toggle(code: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // The checklist still works for this session when storage is unavailable.
      }
      return next;
    });
  }

  return (
    <section className="buyer-decision-block buyer-action-plan" id="buyer-action-plan">
      <div className="buyer-action-plan-heading">
        <div>
          <h3>
            <ClipboardCheck size={16} /> {diligenceCopy.title}
          </h3>
          <p className="muted">{diligenceCopy.description}</p>
        </div>
        <div className="buyer-action-plan-score">
          <strong>{dueDiligenceScore}/100</strong>
          <span className="muted">{dueDiligenceLabel}</span>
          <small>{diligenceCopy.market[dueDiligence.market_type]}</small>
        </div>
      </div>

      <DueDiligenceWorkspace
        copy={diligenceCopy}
        dueDiligence={dueDiligence}
        locale={locale}
      />

      <p className="buyer-action-plan-progress" role="status" aria-live="polite">
        {copy.progress(completed.size, plan.items.length)}
      </p>

      <div className="buyer-action-plan-phases">
        {PHASES.map((phase) => {
          const items = plan.items.filter((item) => item.phase === phase);
          if (!items.length) return null;
          return (
            <section className="buyer-action-phase" key={phase}>
              <h4>{copy.phases[phase]}</h4>
              <div className="buyer-action-items">
                {items.map((item) => {
                  const itemEvidence = item.evidence_refs.flatMap((reference) => {
                    const evidence = evidenceById.get(reference);
                    return evidence ? [evidence] : [];
                  });
                  return (
                    <div className={`buyer-action-item ${completed.has(item.code) ? "completed" : ""}`} key={item.code}>
                      <label>
                        <input
                          checked={completed.has(item.code)}
                          onChange={() => toggle(item.code)}
                          type="checkbox"
                        />
                        <span>{actionLabel(item, locale)}</span>
                      </label>
                      <span className={`buyer-action-priority priority-${item.priority}`}>
                        {copy.priorities[item.priority]}
                      </span>
                      {itemEvidence.length ? (
                        <details className="buyer-action-evidence">
                          <summary>{copy.evidenceLabel}</summary>
                          {itemEvidence.map((evidence) => (
                            <div className="buyer-action-evidence-item" key={evidence.id}>
                              <p>{actionEvidenceLabel(evidence, locale)}</p>
                              <ProvenanceDetails
                                locale={locale}
                                provenance={{
                                  sourceName: evidence.source_name,
                                  sourceType: evidence.source_type,
                                  updatedAt: evidence.updated_at,
                                  sampleSize: evidence.sample_size,
                                  scope: evidence.geographic_scope,
                                  timeRange: evidence.time_range,
                                  calculationType: evidence.calculation_type,
                                  confidenceScore: evidence.confidence_score,
                                }}
                              />
                            </div>
                          ))}
                        </details>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="buyer-action-plan-export">
        <button
          className="button secondary"
          type="button"
          onClick={async () => {
            try {
              await copyToClipboard(actionPlanBrief(plan, locale));
              setCopyStatus("copied");
            } catch {
              setCopyStatus("failed");
            }
          }}
        >
          {copyStatus === "copied" ? <Check size={16} /> : <Copy size={16} />}
          {copy.copy}
        </button>
        <span className="muted" role="status" aria-live="polite">
          {copyStatus === "copied" ? copy.copied : copyStatus === "failed" ? copy.copyFailed : ""}
        </span>
      </div>
    </section>
  );
}

function DueDiligenceWorkspace({
  copy,
  dueDiligence,
  locale,
}: {
  copy: DiligenceWorkspaceCopy;
  dueDiligence: PropertyDueDiligence;
  locale: Locale;
}) {
  const counts = dueDiligenceStateCounts(dueDiligence);
  const criticalChecks = dueDiligence.checklist
    .filter((item) => item.priority === "critical" || item.status === "verify_required" || item.status === "unknown")
    .slice(0, 8);

  return (
    <div className="due-diligence-workspace">
      <section className="due-diligence-status">
        <h4>{copy.statusTitle}</h4>
        <div className="due-diligence-status-grid">
          {(["verified", "requires_check", "risk", "unknown", "insufficient_data"] as const).map((state) => (
            <div className={`due-diligence-status-card state-${state}`} key={state}>
              <strong>{counts[state]}</strong>
              <span>{copy.states[state]}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="due-diligence-columns">
        <section>
          <h4>{copy.criticalTitle}</h4>
          <div className="due-diligence-checks">
            {criticalChecks.map((item) => {
              const state = diligenceStateForItem(item);
              return (
                <article className="due-diligence-check" key={item.code}>
                  <div>
                    <span className={`status-pill ${diligenceTone(state)}`}>{copy.states[state]}</span>
                    <span className="due-diligence-category">{copy.categories[item.category] ?? item.category}</span>
                  </div>
                  <strong>{localizedDueDiligenceChecklistLabel(item, locale)}</strong>
                  <p>{item.rationale}</p>
                  <small>{copy.priorities[item.priority]}</small>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h4>{copy.riskTitle}</h4>
          {dueDiligence.red_flags.length ? (
            <ul className="section-list compact due-diligence-risk-list">
              {dueDiligence.red_flags.slice(0, 6).map((flag) => (
                <li key={flag}><span className="status-pill rejected">{copy.states.risk}</span>{flag}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">{copy.noRisks}</p>
          )}
        </section>
      </div>

      <div className="due-diligence-columns compact">
        <section>
          <h4>{copy.documentsTitle}</h4>
          <ul className="section-list compact">
            {dueDiligence.documents_to_request.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section>
          <h4>{copy.questionsTitle}</h4>
          <ul className="section-list compact">
            {dueDiligence.questions_for_seller.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>

      <p className="due-diligence-caveat">{copy.legalCaveat}</p>
    </div>
  );
}

function dueDiligenceStateCounts(dueDiligence: PropertyDueDiligence): Record<DiligenceState, number> {
  const counts: Record<DiligenceState, number> = {
    verified: 0,
    requires_check: 0,
    risk: dueDiligence.red_flags.length,
    unknown: 0,
    insufficient_data: 0,
  };
  for (const item of dueDiligence.checklist) {
    counts[diligenceStateForItem(item)] += 1;
  }
  return counts;
}

function diligenceStateForItem(item: DueDiligenceChecklistItem): DiligenceState {
  if (item.status === "known") return "verified";
  if (item.status === "verify_required") return "requires_check";
  if (item.status === "estimated") return "insufficient_data";
  return "unknown";
}

function diligenceTone(state: DiligenceState) {
  if (state === "verified") return "healthy";
  if (state === "risk") return "rejected";
  if (state === "requires_check" || state === "insufficient_data") return "warning";
  return "info";
}

function buildViewingPrepItems(
  plan: BuyerActionPlan | null,
  assistant: ViewingAssistant,
  locale: Locale,
  copy: ViewingPrepCopy,
): ViewingPrepItem[] {
  if (!plan) {
    return assistant.building_checks.slice(0, 2).map((check, index) => ({
      code: `building-check-${index}`,
      priority: index === 0 ? "high" : "medium",
      why: copy.fallbackWhy,
      inspect: check,
      ask: assistant.seller_questions[index] ?? copy.fallbackAsk,
      evidence: null,
    }));
  }

  const evidenceById = new Map(plan.evidence.map((item) => [item.id, item]));
  const sellerQuestions = deduplicateStrings([
    ...plan.items
      .filter((item) => item.category === "seller_question")
      .sort((left, right) => PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority])
      .map((item) => actionLabel(item, locale)),
    ...assistant.seller_questions,
  ]);

  return plan.items
    .filter((item) => item.phase === "on_viewing")
    .sort((left, right) => PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority])
    .slice(0, 4)
    .map((item, index) => {
      const evidence = item.evidence_refs
        .map((reference) => evidenceById.get(reference))
        .find((candidate): candidate is BuyerActionEvidence => candidate !== undefined);
      return {
        code: item.code,
        priority: item.priority,
        why: evidence ? actionEvidenceLabel(evidence, locale) : copy.fallbackWhy,
        inspect: actionLabel(item, locale),
        ask: sellerQuestions[index] ?? copy.fallbackAsk,
        evidence: evidence ?? null,
      };
    });
}

function deduplicateStrings(items: string[]) {
  const result: string[] = [];
  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || result.includes(normalized)) continue;
    result.push(normalized);
  }
  return result;
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
