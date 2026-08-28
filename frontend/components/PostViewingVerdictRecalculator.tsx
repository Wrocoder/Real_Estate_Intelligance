import { ClipboardCheck, RefreshCw, ShieldAlert } from "lucide-react";
import { useState } from "react";

import type {
  BuyerVerdictStatus,
  PostViewingChecklistAnswers,
  PostViewingIssueLevel,
  PostViewingRenovationNeed,
  PostViewingVerdictRecalculation,
} from "@/lib/api";
import { money } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type Props = {
  disabled?: boolean;
  locale: Locale;
  onRecalculate: (
    answers: PostViewingChecklistAnswers,
  ) => Promise<PostViewingVerdictRecalculation>;
  result: PostViewingVerdictRecalculation | null;
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
  actions: {
    recalculate: string;
  };
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
    findings: string;
    actions: string;
  };
  statuses: {
    idle: string;
    calculating: string;
    ready: (status: string, score: number) => string;
    error: string;
  };
  verdicts: Record<BuyerVerdictStatus, string>;
  empty: string;
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
  renovation_need: "unknown",
  notes: "",
};

const COPY: Record<Locale, Copy> = {
  en: {
    title: "Post-viewing verdict recalculation",
    actions: { recalculate: "Recalculate verdict" },
    fields: {
      condition: "Condition",
      windows: "Windows",
      noise: "Noise",
      smell: "Smell",
      humidity: "Humidity",
      staircase: "Staircase",
      orientation: "Orientation",
      kitchen_bathroom: "Kitchen/bathroom",
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
      offer: "Offer reserve",
    },
    sections: {
      findings: "Applied findings",
      actions: "Next actions",
    },
    statuses: {
      idle: "Add viewing answers after the visit",
      calculating: "Recalculating...",
      ready: (status, score) => `Updated: ${status}, ${score.toFixed(1)}/10`,
      error: "Post-viewing recalculation failed",
    },
    verdicts: {
      buy: "BUY",
      negotiate: "NEGOTIATE",
      avoid: "AVOID",
      verify_first: "VERIFY FIRST",
    },
    empty: "No recalculation yet.",
  },
  pl: {
    title: "Przeliczenie werdyktu po oględzinach",
    actions: { recalculate: "Przelicz werdykt" },
    fields: {
      condition: "Stan",
      windows: "Okna",
      noise: "Hałas",
      smell: "Zapach",
      humidity: "Wilgoć",
      staircase: "Klatka",
      orientation: "Ekspozycja",
      kitchen_bathroom: "Kuchnia/łazienka",
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
      offer: "Rezerwa oferty",
    },
    sections: {
      findings: "Uwzględnione wnioski",
      actions: "Następne kroki",
    },
    statuses: {
      idle: "Dodaj odpowiedzi po oględzinach",
      calculating: "Przeliczanie...",
      ready: (status, score) => `Nowy wynik: ${status}, ${score.toFixed(1)}/10`,
      error: "Nie udało się przeliczyć werdyktu",
    },
    verdicts: {
      buy: "BUY",
      negotiate: "NEGOCJUJ",
      avoid: "ODPUŚĆ",
      verify_first: "NAJPIERW SPRAWDŹ",
    },
    empty: "Nie ma jeszcze przeliczenia.",
  },
  ru: {
    title: "Пересчет вердикта после просмотра",
    actions: { recalculate: "Пересчитать вердикт" },
    fields: {
      condition: "Состояние",
      windows: "Окна",
      noise: "Шум",
      smell: "Запах",
      humidity: "Влажность",
      staircase: "Подъезд",
      orientation: "Стороны света",
      kitchen_bathroom: "Кухня/ванная",
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
      offer: "Резерв в offer",
    },
    sections: {
      findings: "Учтенные выводы",
      actions: "Следующие шаги",
    },
    statuses: {
      idle: "Добавьте ответы после просмотра",
      calculating: "Пересчет...",
      ready: (status, score) => `Обновлено: ${status}, ${score.toFixed(1)}/10`,
      error: "Не удалось пересчитать вердикт",
    },
    verdicts: {
      buy: "ПОКУПАТЬ",
      negotiate: "ТОРГОВАТЬСЯ",
      avoid: "ИЗБЕГАТЬ",
      verify_first: "СНАЧАЛА ПРОВЕРИТЬ",
    },
    empty: "Пересчета пока нет.",
  },
  uk: {
    title: "Перерахунок вердикту після перегляду",
    actions: { recalculate: "Перерахувати вердикт" },
    fields: {
      condition: "Стан",
      windows: "Вікна",
      noise: "Шум",
      smell: "Запах",
      humidity: "Вологість",
      staircase: "Під'їзд",
      orientation: "Сторони світу",
      kitchen_bathroom: "Кухня/ванна",
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
      offer: "Резерв в offer",
    },
    sections: {
      findings: "Враховані висновки",
      actions: "Наступні кроки",
    },
    statuses: {
      idle: "Додайте відповіді після перегляду",
      calculating: "Перерахунок...",
      ready: (status, score) => `Оновлено: ${status}, ${score.toFixed(1)}/10`,
      error: "Не вдалося перерахувати вердикт",
    },
    verdicts: {
      buy: "КУПУВАТИ",
      negotiate: "ТОРГУВАТИСЯ",
      avoid: "УНИКАТИ",
      verify_first: "СПОЧАТКУ ПЕРЕВІРИТИ",
    },
    empty: "Перерахунку ще немає.",
  },
};

export function PostViewingVerdictRecalculator({
  disabled = false,
  locale,
  onRecalculate,
  result,
}: Props) {
  const copy = COPY[locale];
  const [answers, setAnswers] = useState<AnswersState>(DEFAULT_ANSWERS);
  const [status, setStatus] = useState(copy.statuses.idle);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    setStatus(copy.statuses.calculating);
    try {
      const payload = await onRecalculate({
        ...answers,
        notes: answers.notes.trim() || null,
      });
      const verdict = payload.updated_decision.verdict;
      setStatus(
        copy.statuses.ready(
          copy.verdicts[verdict.status] ?? verdict.status,
          verdict.score,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="icon-title">
          <ClipboardCheck size={16} /> {copy.title}
        </h2>
        <span className="status-line">{status}</span>
      </div>
      <div className="panel-body">
        <div className="form-grid compact">
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
          <label className="field">
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
            className="button primary"
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
            <div className="metric-grid compact" style={{ marginTop: 12 }}>
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
