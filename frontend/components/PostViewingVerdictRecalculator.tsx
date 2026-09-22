import { ClipboardCheck, RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type {
  BuyerVerdictStatus,
  PostViewingChecklistAnswers,
  PostViewingIssueLevel,
  PostViewingRenovationNeed,
  PostViewingVerdictRecalculation,
} from "@/lib/api";
import { localizedError } from "@/lib/errorMessages";
import { money } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type Props = {
  disabled?: boolean;
  locale: Locale;
  onRecalculate: (
    answers: PostViewingChecklistAnswers,
  ) => Promise<PostViewingVerdictRecalculation>;
  onRestore?: (result: PostViewingVerdictRecalculation) => void;
  result: PostViewingVerdictRecalculation | null;
  storageKey?: string;
};

type IssueField = Exclude<
  keyof PostViewingChecklistAnswers,
  "renovation_need" | "notes"
>;

type AnswersState = Record<IssueField, PostViewingIssueLevel> & {
  renovation_need: PostViewingRenovationNeed;
  notes: string;
};

type Copy = {
  title: string;
  subtitle: string;
  actions: { recalculate: string };
  fields: Record<IssueField, string> & {
    renovation_need: string;
    notes: string;
  };
  options: Record<PostViewingIssueLevel | PostViewingRenovationNeed, string>;
  metrics: {
    original: string;
    updated: string;
    risk: string;
    offer: string;
  };
  sections: {
    changed: string;
    findings: string;
    actions: string;
  };
  statuses: {
    idle: string;
    calculating: string;
    restored: string;
    ready: (status: string, score: number) => string;
    error: string;
  };
  verdicts: Record<BuyerVerdictStatus, string>;
  changed: {
    same: string;
    status: (before: string, after: string) => string;
    score: (delta: string) => string;
    offer: (value: string) => string;
    risk: (value: number) => string;
  };
  empty: string;
  saved: string;
};

const ISSUE_FIELDS: IssueField[] = [
  "condition",
  "windows",
  "noise",
  "smell",
  "humidity",
  "staircase",
  "orientation",
  "kitchen_bathroom",
  "layout",
];

const ISSUE_OPTIONS: PostViewingIssueLevel[] = [
  "unknown",
  "good",
  "minor_issue",
  "major_issue",
];

const RENOVATION_OPTIONS: PostViewingRenovationNeed[] = [
  "unknown",
  "none",
  "refresh",
  "light",
  "full",
];

const DEFAULT_ANSWERS: AnswersState = {
  condition: "unknown",
  windows: "unknown",
  noise: "unknown",
  smell: "unknown",
  humidity: "unknown",
  staircase: "unknown",
  orientation: "unknown",
  kitchen_bathroom: "unknown",
  layout: "unknown",
  renovation_need: "unknown",
  notes: "",
};

type StoredPostViewingState = {
  answers: AnswersState;
  result: PostViewingVerdictRecalculation;
  savedAt: number;
  version: 1;
};

const COPY: Record<Locale, Copy> = {
  en: {
    title: "Post-viewing verdict recalculation",
    subtitle: "Record what you saw at the viewing and keep the original verdict beside the updated one.",
    actions: { recalculate: "Recalculate verdict" },
    fields: {
      condition: "Condition",
      windows: "Windows",
      noise: "Noise",
      smell: "Smell",
      humidity: "Moisture",
      staircase: "Common areas",
      orientation: "Sunlight",
      kitchen_bathroom: "Kitchen/bathroom",
      layout: "Layout",
      renovation_need: "Renovation need",
      notes: "Viewing notes",
    },
    options: {
      unknown: "Unknown",
      good: "Good",
      minor_issue: "Minor issue",
      major_issue: "Major issue",
      none: "None",
      refresh: "Refresh",
      light: "Light renovation",
      full: "Full renovation",
    },
    metrics: {
      original: "Original verdict",
      updated: "Updated verdict",
      risk: "Risk adjustment",
      offer: "Lower offer ceiling by",
    },
    sections: {
      changed: "What changed",
      findings: "Applied findings",
      actions: "Next actions",
    },
    statuses: {
      idle: "Add viewing answers after the visit",
      calculating: "Recalculating...",
      restored: "Restored your last post-viewing update",
      ready: (status, score) => `Updated: ${status}, ${score.toFixed(1)}/10`,
      error: "Post-viewing recalculation failed",
    },
    verdicts: {
      buy: "BUY",
      negotiate: "NEGOTIATE",
      avoid: "AVOID",
      verify_first: "VERIFY FIRST",
    },
    changed: {
      same: "Verdict label stayed the same; use the updated risks and offer ceiling.",
      status: (before, after) => `Verdict changed from ${before} to ${after}.`,
      score: (delta) => `Decision score changed by ${delta} points.`,
      offer: (value) => `Suggested offer ceiling reduced by ${value}.`,
      risk: (value) => `Risk adjustment: +${value} points.`,
    },
    empty: "No recalculation yet.",
    saved: "Saved on this device for your return to this apartment.",
  },
  pl: {
    title: "Przeliczenie werdyktu po oględzinach",
    subtitle: "Zapisz, co było widać na miejscu, i porównaj pierwotny werdykt z nowym.",
    actions: { recalculate: "Przelicz werdykt" },
    fields: {
      condition: "Stan",
      windows: "Okna",
      noise: "Hałas",
      smell: "Zapach",
      humidity: "Wilgoć",
      staircase: "Części wspólne",
      orientation: "Nasłonecznienie",
      kitchen_bathroom: "Kuchnia/łazienka",
      layout: "Układ",
      renovation_need: "Remont",
      notes: "Notatki z oględzin",
    },
    options: {
      unknown: "Nieznane",
      good: "Dobre",
      minor_issue: "Drobny problem",
      major_issue: "Poważny problem",
      none: "Brak",
      refresh: "Odświeżenie",
      light: "Lekki remont",
      full: "Pełny remont",
    },
    metrics: {
      original: "Pierwotny werdykt",
      updated: "Nowy werdykt",
      risk: "Korekta ryzyka",
      offer: "Obniż limit oferty o",
    },
    sections: {
      changed: "Co się zmieniło",
      findings: "Uwzględnione wnioski",
      actions: "Następne kroki",
    },
    statuses: {
      idle: "Dodaj odpowiedzi po oględzinach",
      calculating: "Przeliczanie...",
      restored: "Przywrócono ostatnią aktualizację po oględzinach",
      ready: (status, score) => `Nowy wynik: ${status}, ${score.toFixed(1)}/10`,
      error: "Nie udało się przeliczyć werdyktu",
    },
    verdicts: {
      buy: "BUY",
      negotiate: "NEGOCJUJ",
      avoid: "ODPUŚĆ",
      verify_first: "NAJPIERW SPRAWDŹ",
    },
    changed: {
      same: "Werdykt pozostał ten sam; użyj zaktualizowanych ryzyk i limitu oferty.",
      status: (before, after) => `Werdykt zmienił się z ${before} na ${after}.`,
      score: (delta) => `Ocena decyzji zmieniła się o ${delta} pkt.`,
      offer: (value) => `Sugerowany limit oferty obniżono o ${value}.`,
      risk: (value) => `Korekta ryzyka: +${value} pkt.`,
    },
    empty: "Nie ma jeszcze przeliczenia.",
    saved: "Zapisano na tym urządzeniu, aby wrócić do tej analizy.",
  },
  ru: {
    title: "Пересчет вердикта после просмотра",
    subtitle: "Зафиксируйте, что увидели на месте, и сравните исходный вывод с обновленным.",
    actions: { recalculate: "Пересчитать вердикт" },
    fields: {
      condition: "Состояние",
      windows: "Окна",
      noise: "Шум",
      smell: "Запах",
      humidity: "Влажность",
      staircase: "Общие зоны",
      orientation: "Свет",
      kitchen_bathroom: "Кухня/ванная",
      layout: "Планировка",
      renovation_need: "Нужен ремонт",
      notes: "Заметки просмотра",
    },
    options: {
      unknown: "Неизвестно",
      good: "Хорошо",
      minor_issue: "Небольшая проблема",
      major_issue: "Серьезная проблема",
      none: "Нет",
      refresh: "Освежить",
      light: "Легкий ремонт",
      full: "Полный ремонт",
    },
    metrics: {
      original: "Исходный вердикт",
      updated: "Новый вердикт",
      risk: "Корректировка риска",
      offer: "Снизить потолок офера на",
    },
    sections: {
      changed: "Что изменилось",
      findings: "Учтенные выводы",
      actions: "Следующие шаги",
    },
    statuses: {
      idle: "Добавьте ответы после просмотра",
      calculating: "Пересчет...",
      restored: "Восстановлено последнее обновление после просмотра",
      ready: (status, score) => `Обновлено: ${status}, ${score.toFixed(1)}/10`,
      error: "Не удалось пересчитать вердикт",
    },
    verdicts: {
      buy: "ПОКУПАТЬ",
      negotiate: "ТОРГОВАТЬСЯ",
      avoid: "ИЗБЕГАТЬ",
      verify_first: "СНАЧАЛА ПРОВЕРИТЬ",
    },
    changed: {
      same: "Вердикт остался тем же; используйте обновленные риски и потолок предложения.",
      status: (before, after) => `Вердикт изменился с ${before} на ${after}.`,
      score: (delta) => `Оценка решения изменилась на ${delta} п.`,
      offer: (value) => `Рекомендуемый потолок предложения снижен на ${value}.`,
      risk: (value) => `Корректировка риска: +${value} п.`,
    },
    empty: "Пересчета пока нет.",
    saved: "Сохранено на этом устройстве, чтобы вернуться к этой квартире.",
  },
  uk: {
    title: "Перерахунок вердикту після перегляду",
    subtitle: "Зафіксуйте, що побачили на місці, і порівняйте початковий висновок з оновленим.",
    actions: { recalculate: "Перерахувати вердикт" },
    fields: {
      condition: "Стан",
      windows: "Вікна",
      noise: "Шум",
      smell: "Запах",
      humidity: "Вологість",
      staircase: "Спільні зони",
      orientation: "Світло",
      kitchen_bathroom: "Кухня/ванна",
      layout: "Планування",
      renovation_need: "Потрібен ремонт",
      notes: "Нотатки перегляду",
    },
    options: {
      unknown: "Невідомо",
      good: "Добре",
      minor_issue: "Невелика проблема",
      major_issue: "Серйозна проблема",
      none: "Немає",
      refresh: "Освіжити",
      light: "Легкий ремонт",
      full: "Повний ремонт",
    },
    metrics: {
      original: "Початковий вердикт",
      updated: "Новий вердикт",
      risk: "Корекція ризику",
      offer: "Знизити ліміт офера на",
    },
    sections: {
      changed: "Що змінилося",
      findings: "Враховані висновки",
      actions: "Наступні кроки",
    },
    statuses: {
      idle: "Додайте відповіді після перегляду",
      calculating: "Перерахунок...",
      restored: "Відновлено останнє оновлення після перегляду",
      ready: (status, score) => `Оновлено: ${status}, ${score.toFixed(1)}/10`,
      error: "Не вдалося перерахувати вердикт",
    },
    verdicts: {
      buy: "КУПУВАТИ",
      negotiate: "ТОРГУВАТИСЯ",
      avoid: "УНИКАТИ",
      verify_first: "СПОЧАТКУ ПЕРЕВІРИТИ",
    },
    changed: {
      same: "Вердикт залишився тим самим; використайте оновлені ризики та ліміт пропозиції.",
      status: (before, after) => `Вердикт змінився з ${before} на ${after}.`,
      score: (delta) => `Оцінка рішення змінилася на ${delta} п.`,
      offer: (value) => `Рекомендований ліміт пропозиції знижено на ${value}.`,
      risk: (value) => `Корекція ризику: +${value} п.`,
    },
    empty: "Перерахунку ще немає.",
    saved: "Збережено на цьому пристрої, щоб повернутися до цієї квартири.",
  },
};

export function PostViewingVerdictRecalculator({
  disabled = false,
  locale,
  onRecalculate,
  onRestore,
  result,
  storageKey,
}: Props) {
  const copy = COPY[locale];
  const [answers, setAnswers] = useState<AnswersState>(DEFAULT_ANSWERS);
  const [status, setStatus] = useState(copy.statuses.idle);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const restoredStorageKey = useRef<string | null>(null);

  useEffect(() => {
    setStatus(result ? statusForResult(copy, result) : copy.statuses.idle);
  }, [copy, result]);

  useEffect(() => {
    if (!storageKey || restoredStorageKey.current === storageKey) return;
    restoredStorageKey.current = storageKey;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const stored = raw ? (JSON.parse(raw) as Partial<StoredPostViewingState>) : null;
      if (!stored || stored.version !== 1 || !stored.answers || !stored.result) return;
      setAnswers({ ...DEFAULT_ANSWERS, ...stored.answers });
      setStatus(copy.statuses.restored);
      onRestore?.(stored.result);
    } catch {
      // Browser storage is best effort; the user can still recalculate from the form.
    }
  }, [copy.statuses.restored, onRestore, storageKey]);

  async function submit() {
    setLoading(true);
    setError("");
    setStatus(copy.statuses.calculating);
    const submittedAnswers: AnswersState = {
      ...answers,
      notes: answers.notes.trim(),
    };
    const apiAnswers: PostViewingChecklistAnswers = {
      ...answers,
      notes: answers.notes.trim() || null,
    };
    try {
      const payload = await onRecalculate(apiAnswers);
      setStatus(statusForResult(copy, payload));
      if (storageKey) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            answers: submittedAnswers,
            result: payload,
            savedAt: Date.now(),
            version: 1,
          } satisfies StoredPostViewingState),
        );
      }
    } catch (caught) {
      setError(localizedError(caught, locale, copy.statuses.error));
      setStatus(copy.statuses.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel post-viewing-recalculator">
      <div className="panel-header">
        <div>
          <h2 className="icon-title">
            <ClipboardCheck size={16} /> {copy.title}
          </h2>
          <p className="muted">{copy.subtitle}</p>
        </div>
        <span className="status-line" role="status">{status}</span>
      </div>
      <div className="panel-body">
        <div className="form-grid compact post-viewing-form">
          {ISSUE_FIELDS.map((field) => (
            <label className="field" key={field}>
              <span>{copy.fields[field]}</span>
              <select
                className="select"
                value={answers[field]}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [field]: event.target.value as PostViewingIssueLevel,
                  }))
                }
              >
                {ISSUE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {copy.options[option]}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="field">
            <span>{copy.fields.renovation_need}</span>
            <select
              className="select"
              value={answers.renovation_need}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  renovation_need: event.target.value as PostViewingRenovationNeed,
                }))
              }
            >
              {RENOVATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.options[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field post-viewing-notes">
            <span>{copy.fields.notes}</span>
            <input
              className="input"
              value={answers.notes}
              onChange={(event) =>
                setAnswers((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>
          <button
            className="button primary post-viewing-submit"
            disabled={disabled || loading}
            type="button"
            onClick={() => void submit()}
          >
            <RefreshCw size={16} /> {copy.actions.recalculate}
          </button>
        </div>

        {error ? (
          <p className="status-line" style={{ marginTop: 12 }}>
            {error}
          </p>
        ) : null}

        {result ? (
          <>
            <div className="metric-grid compact post-viewing-metrics" style={{ marginTop: 12 }}>
              <Metric
                label={copy.metrics.original}
                value={`${copy.verdicts[result.original_decision.verdict.status]} · ${result.original_decision.verdict.score.toFixed(1)}/10`}
              />
              <Metric
                label={copy.metrics.updated}
                value={`${copy.verdicts[result.updated_decision.verdict.status]} · ${result.updated_decision.verdict.score.toFixed(1)}/10`}
              />
              <Metric
                label={copy.metrics.risk}
                value={`${result.risk_adjustment_points >= 0 ? "+" : ""}${result.risk_adjustment_points}`}
              />
              <Metric label={copy.metrics.offer} value={money(result.offer_adjustment_pln, locale)} />
            </div>
            <section className="post-viewing-change-summary" style={{ marginTop: 12 }}>
              <div className="panel-header inline">
                <h3>{copy.sections.changed}</h3>
                <span className="status-pill info">{copy.saved}</span>
              </div>
              <TextList empty={copy.empty} items={changeSummary(result, copy, locale)} />
            </section>
            <div className="grid-2" style={{ marginTop: 12 }}>
              <section>
                <div className="panel-header inline">
                  <h3>
                    <ShieldAlert size={16} /> {copy.sections.findings}
                  </h3>
                </div>
                <TextList empty={copy.empty} items={result.applied_findings} />
              </section>
              <section>
                <div className="panel-header inline">
                  <h3>{copy.sections.actions}</h3>
                </div>
                <TextList empty={copy.empty} items={result.recommended_actions} />
              </section>
            </div>
            <p className="muted" style={{ marginTop: 12 }}>
              {result.disclaimer}
            </p>
          </>
        ) : (
          <p className="empty-state" style={{ marginTop: 12 }}>
            {copy.empty}
          </p>
        )}
      </div>
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

function TextList({ empty, items }: { empty: string; items: string[] }) {
  if (items.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="section-list compact">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function statusForResult(copy: Copy, result: PostViewingVerdictRecalculation) {
  const verdict = result.updated_decision.verdict;
  return copy.statuses.ready(
    copy.verdicts[verdict.status] ?? verdict.status,
    verdict.score,
  );
}

function changeSummary(
  result: PostViewingVerdictRecalculation,
  copy: Copy,
  locale: Locale,
) {
  const original = result.original_decision.verdict;
  const updated = result.updated_decision.verdict;
  const changes: string[] = [];
  const originalLabel = copy.verdicts[original.status] ?? original.status;
  const updatedLabel = copy.verdicts[updated.status] ?? updated.status;

  if (original.status === updated.status) {
    changes.push(copy.changed.same);
  } else {
    changes.push(copy.changed.status(originalLabel, updatedLabel));
  }

  const scoreDelta = updated.score - original.score;
  if (Math.abs(scoreDelta) >= 0.1) {
    changes.push(copy.changed.score(`${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(1)}`));
  }
  if (result.offer_adjustment_pln > 0) {
    changes.push(copy.changed.offer(money(result.offer_adjustment_pln, locale)));
  }
  if (result.risk_adjustment_points > 0) {
    changes.push(copy.changed.risk(result.risk_adjustment_points));
  }
  return changes;
}
