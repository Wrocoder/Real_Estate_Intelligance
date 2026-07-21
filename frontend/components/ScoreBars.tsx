import type { PropertyScores } from "@/lib/api";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { scoreLabel } from "@/lib/scoreLabels";

type Props = {
  scores: PropertyScores;
  locale?: Locale;
};

export function ScoreBars({ scores, locale = DEFAULT_LOCALE }: Props) {
  return (
    <div className="score-stack">
      <ScoreBar
        label="Investment"
        value={scores.investment_score}
        helper={scoreLabel(scores.decision_label, locale)}
      />
      <ScoreBar
        label="Risk"
        value={scores.risk_score}
        helper={scoreLabel(scores.risk_label, locale)}
        risk
      />
      <ScoreBar
        label="Negotiation"
        value={scores.negotiation_score}
        helper={scoreLabel(scores.negotiation_label, locale)}
      />
      <ScoreBar
        label="Liquidity"
        value={scores.liquidity_score}
        helper={scoreLabel(scores.liquidity_label, locale)}
      />
      <ScoreBar
        label="Rental"
        value={scores.rental_potential_score}
        helper={scoreLabel(scores.rental_potential_label, locale)}
      />
    </div>
  );
}

function ScoreBar({
  label,
  value,
  helper,
  risk = false,
}: {
  label: string;
  value: number;
  helper: string;
  risk?: boolean;
}) {
  return (
    <div className="score-bar">
      <div className="score-label">
        <span>{label}</span>
        <strong>{value}/100</strong>
      </div>
      <span className="status-line">{helper}</span>
      <div className={risk ? "bar risk" : "bar"} aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
