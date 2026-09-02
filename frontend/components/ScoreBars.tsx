import type { PropertyScores } from "@/lib/api";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { scoreLabel } from "@/lib/scoreLabels";

type Props = {
  scores: PropertyScores;
  locale?: Locale;
};

const COPY: Record<
  Locale,
  {
    why: string;
    labels: Record<"investment" | "risk" | "negotiation" | "liquidity" | "rental", string>;
    reasons: Record<"investment" | "risk" | "negotiation" | "liquidity" | "rental", string[]>;
  }
> = {
  en: {
    why: "Why",
    labels: {
      investment: "Investment fit",
      risk: "Risk",
      negotiation: "Negotiation",
      liquidity: "Liquidity",
      rental: "Rental",
    },
    reasons: {
      investment: ["price, location, liquidity and rent signals are combined"],
      risk: ["warnings, surroundings and data gaps increase this score"],
      negotiation: ["price position, exposure time and price changes are considered"],
      liquidity: ["demand proxies, transport and local supply affect resale speed"],
      rental: ["rent estimate, area demand and apartment size affect this score"],
    },
  },
  pl: {
    why: "Dlaczego",
    labels: {
      investment: "Dopasowanie inwestycyjne",
      risk: "Ryzyko",
      negotiation: "Negocjacje",
      liquidity: "Płynność",
      rental: "Najem",
    },
    reasons: {
      investment: ["łączymy cenę, lokalizację, płynność i sygnały najmu"],
      risk: ["ostrzeżenia, otoczenie i braki danych podnoszą tę ocenę"],
      negotiation: ["uwzględniamy pozycję ceny, czas ekspozycji i zmiany ceny"],
      liquidity: ["popyt, transport i lokalna podaż wpływają na łatwość odsprzedaży"],
      rental: ["szacunek czynszu, popyt w okolicy i metraż wpływają na ocenę"],
    },
  },
  ru: {
    why: "Почему",
    labels: {
      investment: "Инвестиционная пригодность",
      risk: "Риск",
      negotiation: "Торг",
      liquidity: "Ликвидность",
      rental: "Аренда",
    },
    reasons: {
      investment: ["учитываются цена, локация, ликвидность и сигналы аренды"],
      risk: ["предупреждения, окружение и пробелы в данных повышают оценку"],
      negotiation: ["учитываются цена относительно рынка, срок продажи и изменения цены"],
      liquidity: ["спрос, транспорт и локальное предложение влияют на скорость перепродажи"],
      rental: ["оценка аренды, спрос в районе и метраж влияют на показатель"],
    },
  },
  uk: {
    why: "Чому",
    labels: {
      investment: "Інвестиційна придатність",
      risk: "Ризик",
      negotiation: "Торг",
      liquidity: "Ліквідність",
      rental: "Оренда",
    },
    reasons: {
      investment: ["враховуються ціна, локація, ліквідність і сигнали оренди"],
      risk: ["попередження, оточення і прогалини в даних підвищують оцінку"],
      negotiation: ["враховуються позиція ціни, час продажу і зміни ціни"],
      liquidity: ["попит, транспорт і локальна пропозиція впливають на швидкість перепродажу"],
      rental: ["оцінка оренди, попит у районі і метраж впливають на показник"],
    },
  },
};

export function ScoreBars({ scores, locale = DEFAULT_LOCALE }: Props) {
  const copy = COPY[locale];
  return (
    <div className="score-stack">
      <ScoreBar
        label={copy.labels.investment}
        value={scores.investment_score}
        helper={scoreLabel(scores.decision_label, locale)}
        why={copy.reasons.investment.concat(scores.reasons.slice(0, 1))}
        whyLabel={copy.why}
      />
      <ScoreBar
        label={copy.labels.risk}
        value={scores.risk_score}
        helper={scoreLabel(scores.risk_label, locale)}
        why={copy.reasons.risk.concat(scores.warnings.slice(0, 2))}
        whyLabel={copy.why}
        risk
      />
      <ScoreBar
        label={copy.labels.negotiation}
        value={scores.negotiation_score}
        helper={scoreLabel(scores.negotiation_label, locale)}
        why={copy.reasons.negotiation.concat(scores.reasons.slice(0, 1))}
        whyLabel={copy.why}
      />
      <ScoreBar
        label={copy.labels.liquidity}
        value={scores.liquidity_score}
        helper={scoreLabel(scores.liquidity_label, locale)}
        why={copy.reasons.liquidity.concat(scores.reasons.slice(0, 1))}
        whyLabel={copy.why}
      />
      <ScoreBar
        label={copy.labels.rental}
        value={scores.rental_potential_score}
        helper={scoreLabel(scores.rental_potential_label, locale)}
        why={copy.reasons.rental}
        whyLabel={copy.why}
      />
    </div>
  );
}

function ScoreBar({
  label,
  value,
  helper,
  why,
  whyLabel,
  risk = false,
}: {
  label: string;
  value: number;
  helper: string;
  why: string[];
  whyLabel: string;
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
      <small className="muted">{whyLabel}: {why.filter(Boolean).slice(0, 3).join("; ")}</small>
    </div>
  );
}
