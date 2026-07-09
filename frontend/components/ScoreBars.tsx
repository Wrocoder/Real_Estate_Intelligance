import type { PropertyScores } from "@/lib/api";

type Props = {
  scores: PropertyScores;
};

export function ScoreBars({ scores }: Props) {
  return (
    <div className="score-stack">
      <ScoreBar label="Investment" value={scores.investment_score} />
      <ScoreBar label="Risk" value={scores.risk_score} risk />
      <ScoreBar label="Negotiation" value={scores.negotiation_score} />
      <ScoreBar label="Liquidity" value={scores.liquidity_score} />
      <ScoreBar label="Rental" value={scores.rental_potential_score} />
    </div>
  );
}

function ScoreBar({ label, value, risk = false }: { label: string; value: number; risk?: boolean }) {
  return (
    <div className="score-bar">
      <div className="score-label">
        <span>{label}</span>
        <strong>{value}/100</strong>
      </div>
      <div className={risk ? "bar risk" : "bar"} aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

