import { Check, ClipboardCheck, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProvenanceDetails } from "@/components/ProvenanceDetails";
import type { BuyerActionPlan } from "@/lib/api";
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
  dueDiligenceScore: number;
  dueDiligenceLabel: string;
};

const PHASES = ["before_offer", "on_viewing", "after_viewing"] as const;

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

export function BuyerActionPlanPanel({
  plan,
  locale,
  dueDiligenceScore,
  dueDiligenceLabel,
}: Props) {
  const copy = actionPlanCopy(locale);
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
            <ClipboardCheck size={16} /> {copy.title}
          </h3>
          <p className="muted">{copy.description}</p>
        </div>
        <div className="buyer-action-plan-score">
          <strong>{dueDiligenceScore}/100</strong>
          <span className="muted">{dueDiligenceLabel}</span>
        </div>
      </div>

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
