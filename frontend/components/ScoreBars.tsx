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
    coverage: string;
    version: string;
    labels: Record<"investment" | "risk" | "negotiation" | "liquidity" | "rental", string>;
    reasons: Record<"investment" | "risk" | "negotiation" | "liquidity" | "rental", string[]>;
  }
> = {
  en: {
    why: "Why",
    coverage: "Data coverage",
    version: "Calculation",
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
    coverage: "Pokrycie danych",
    version: "Wersja obliczeń",
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
    coverage: "Покрытие данных",
    version: "Версия расчета",
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
    coverage: "Покриття даних",
    version: "Версія розрахунку",
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
  const explainability = scores.explainability;
  const driverLabels = DRIVER_LABELS[locale];
  const drivers = (explainability?.drivers ?? []).map((driver) => {
    const label = driverLabels[driver.code] ?? driverLabels.unknown;
    const direction = driver.direction === "positive" ? "+" : driver.direction === "negative" ? "−" : "?";
    return `${direction} ${label}`;
  });
  const coverage = explainability?.coverage_score ?? 0;
  const version = explainability?.version ?? "score-explanation-v1";
  return (
    <div className="score-stack" data-score-explanation-version={version}>
      <ScoreBar
        label={copy.labels.investment}
        value={scores.investment_score}
        helper={scoreLabel(scores.decision_label, locale)}
        why={drivers.length ? drivers : copy.reasons.investment}
        whyLabel={copy.why}
        coverage={`${copy.coverage}: ${coverage}/100 · ${copy.version} ${version}`}
      />
      <ScoreBar
        label={copy.labels.risk}
        value={scores.risk_score}
        helper={scoreLabel(scores.risk_label, locale)}
        why={drivers.length ? drivers : copy.reasons.risk}
        whyLabel={copy.why}
        coverage={`${copy.coverage}: ${coverage}/100 · ${copy.version} ${version}`}
        risk
      />
      <ScoreBar
        label={copy.labels.negotiation}
        value={scores.negotiation_score}
        helper={scoreLabel(scores.negotiation_label, locale)}
        why={drivers.length ? drivers : copy.reasons.negotiation}
        whyLabel={copy.why}
        coverage={`${copy.coverage}: ${coverage}/100 · ${copy.version} ${version}`}
      />
      <ScoreBar
        label={copy.labels.liquidity}
        value={scores.liquidity_score}
        helper={scoreLabel(scores.liquidity_label, locale)}
        why={drivers.length ? drivers : copy.reasons.liquidity}
        whyLabel={copy.why}
        coverage={`${copy.coverage}: ${coverage}/100 · ${copy.version} ${version}`}
      />
      <ScoreBar
        label={copy.labels.rental}
        value={scores.rental_potential_score}
        helper={scoreLabel(scores.rental_potential_label, locale)}
        why={drivers.length ? drivers : copy.reasons.rental}
        whyLabel={copy.why}
        coverage={`${copy.coverage}: ${coverage}/100 · ${copy.version} ${version}`}
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
  coverage,
  risk = false,
}: {
  label: string;
  value: number;
  helper: string;
  why: string[];
  whyLabel: string;
  coverage: string;
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
      <small className="muted">{coverage}</small>
    </div>
  );
}

const DRIVER_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    price_below_area_median: "price below area median",
    price_above_area_median: "price above area median",
    area_price_trend_up: "area price trend is rising",
    area_price_trend_down: "area price trend is falling",
    transport_access: "nearby public transport",
    local_liquidity: "local liquidity signal",
    long_market_exposure: "long market exposure",
    price_reduction_history: "price reduction history",
    missing_infrastructure_data: "infrastructure data is incomplete",
    comparable_sample_insufficient: "comparable sample is limited",
    unknown: "data signal",
  },
  pl: {
    price_below_area_median: "cena poniżej mediany dzielnicy",
    price_above_area_median: "cena powyżej mediany dzielnicy",
    area_price_trend_up: "ceny w dzielnicy rosną",
    area_price_trend_down: "ceny w dzielnicy spadają",
    transport_access: "bliski transport publiczny",
    local_liquidity: "sygnał lokalnej płynności",
    long_market_exposure: "długi czas ekspozycji",
    price_reduction_history: "historia obniżek ceny",
    missing_infrastructure_data: "niepełne dane o infrastrukturze",
    comparable_sample_insufficient: "ograniczona próba podobnych ofert",
    unknown: "sygnał danych",
  },
  ru: {
    price_below_area_median: "цена ниже медианы района",
    price_above_area_median: "цена выше медианы района",
    area_price_trend_up: "цены в районе растут",
    area_price_trend_down: "цены в районе снижаются",
    transport_access: "рядом общественный транспорт",
    local_liquidity: "сигнал местной ликвидности",
    long_market_exposure: "долгое размещение на рынке",
    price_reduction_history: "история снижения цены",
    missing_infrastructure_data: "неполные данные об инфраструктуре",
    comparable_sample_insufficient: "ограниченная выборка похожих объектов",
    unknown: "сигнал данных",
  },
  uk: {
    price_below_area_median: "ціна нижча за медіану району",
    price_above_area_median: "ціна вища за медіану району",
    area_price_trend_up: "ціни в районі зростають",
    area_price_trend_down: "ціни в районі знижуються",
    transport_access: "поруч громадський транспорт",
    local_liquidity: "сигнал місцевої ліквідності",
    long_market_exposure: "довгий час на ринку",
    price_reduction_history: "історія зниження ціни",
    missing_infrastructure_data: "неповні дані про інфраструктуру",
    comparable_sample_insufficient: "обмежена вибірка схожих об'єктів",
    unknown: "сигнал даних",
  },
};
