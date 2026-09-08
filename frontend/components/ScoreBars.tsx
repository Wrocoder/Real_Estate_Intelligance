import type { PropertyScores, ScoreCode, ScoreDimensionExplainability } from "@/lib/api";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { scoreDimension, scoreDriverLabel, scoreLabel } from "@/lib/scoreLabels";

type Props = {
  scores: PropertyScores;
  locale?: Locale;
};

const COPY: Record<
  Locale,
  {
    why: string;
    strengths: string;
    concerns: string;
    unknowns: string;
    coverage: string;
    confidence: string;
    version: string;
    insufficient: string;
    confidenceLabels: Record<"high" | "medium" | "low", string>;
    meanings: Record<"investment" | "risk" | "negotiation" | "liquidity" | "rental", string>;
    missingTitle: string;
    missingAction: string;
    labels: Record<"investment" | "risk" | "negotiation" | "liquidity" | "rental", string>;
    reasons: Record<"investment" | "risk" | "negotiation" | "liquidity" | "rental", string[]>;
  }
> = {
  en: {
    why: "Why",
    strengths: "What supports it",
    concerns: "What weakens it",
    unknowns: "Missing evidence",
    coverage: "Data coverage",
    confidence: "Confidence",
    version: "Calculation",
    insufficient: "Insufficient data",
    confidenceLabels: { high: "high", medium: "medium", low: "low" },
    meanings: {
      investment: "Higher means a stronger investment fit after price, market, rental and risk signals are combined.",
      risk: "Higher means more detected risk. A low result is preferable.",
      negotiation: "Higher means stronger evidence for negotiating the asking price.",
      liquidity: "Higher means similar apartments may be easier to resell, based on available listing-market history.",
      rental: "Higher means a stronger rental case based on independent rental observations and the purchase price.",
    },
    missingTitle: "Missing data",
    missingAction: "Add these details to the apartment check or verify them during the viewing.",
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
    strengths: "Co wspiera wynik",
    concerns: "Co go osłabia",
    unknowns: "Brakujące dowody",
    coverage: "Pokrycie danych",
    confidence: "Pewność",
    version: "Wersja obliczeń",
    insufficient: "Za mało danych",
    confidenceLabels: { high: "wysoka", medium: "średnia", low: "niska" },
    meanings: {
      investment: "Wyższy wynik oznacza lepsze dopasowanie inwestycyjne po uwzględnieniu ceny, rynku, najmu i ryzyk.",
      risk: "Wyższy wynik oznacza więcej wykrytego ryzyka. Niższy wynik jest korzystniejszy.",
      negotiation: "Wyższy wynik oznacza mocniejsze dowody do negocjowania ceny ofertowej.",
      liquidity: "Wyższy wynik oznacza potencjalnie łatwiejszą odsprzedaż na podstawie dostępnej historii ofert.",
      rental: "Wyższy wynik oznacza lepszy scenariusz najmu oparty na niezależnych obserwacjach i cenie zakupu.",
    },
    missingTitle: "Brakujące dane",
    missingAction: "Uzupełnij je w analizie mieszkania albo sprawdź podczas oględzin.",
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
    strengths: "Что поддерживает результат",
    concerns: "Что его ухудшает",
    unknowns: "Недостающие подтверждения",
    coverage: "Покрытие данных",
    confidence: "Уверенность",
    version: "Версия расчета",
    insufficient: "Недостаточно данных",
    confidenceLabels: { high: "высокая", medium: "средняя", low: "низкая" },
    meanings: {
      investment: "Чем выше результат, тем лучше инвестиционная пригодность с учётом цены, рынка, аренды и рисков.",
      risk: "Чем выше результат, тем больше выявленный риск. Более низкий результат предпочтительнее.",
      negotiation: "Чем выше результат, тем убедительнее основания для переговоров о цене.",
      liquidity: "Чем выше результат, тем потенциально легче перепродажа по доступной истории объявлений.",
      rental: "Чем выше результат, тем сильнее сценарий аренды на основе независимых наблюдений и цены покупки.",
    },
    missingTitle: "Недостающие данные",
    missingAction: "Добавьте их в проверку квартиры или уточните во время просмотра.",
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
    strengths: "Що підтримує результат",
    concerns: "Що його погіршує",
    unknowns: "Відсутні підтвердження",
    coverage: "Покриття даних",
    confidence: "Впевненість",
    version: "Версія розрахунку",
    insufficient: "Недостатньо даних",
    confidenceLabels: { high: "висока", medium: "середня", low: "низька" },
    meanings: {
      investment: "Що вищий результат, то краща інвестиційна придатність з урахуванням ціни, ринку, оренди та ризиків.",
      risk: "Що вищий результат, то більше виявленого ризику. Нижчий результат є кращим.",
      negotiation: "Що вищий результат, то переконливіші підстави для переговорів про ціну.",
      liquidity: "Що вищий результат, то потенційно легший перепродаж за наявною історією оголошень.",
      rental: "Що вищий результат, то сильніший сценарій оренди на основі незалежних спостережень і ціни купівлі.",
    },
    missingTitle: "Відсутні дані",
    missingAction: "Додайте їх до перевірки квартири або уточніть під час перегляду.",
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
  const coverage = explainability?.coverage_score ?? 0;
  const version = explainability?.version ?? "score-explanation-v1";
  const rows: Array<{
    code: ScoreCode;
    value: number | null;
    helper: string;
    risk?: boolean;
  }> = [
    {
      code: "investment",
      value: scores.investment_score,
      helper: scoreLabel(scores.decision_label, locale),
    },
    {
      code: "risk",
      value: scores.risk_score,
      helper: scoreLabel(scores.risk_label, locale),
      risk: true,
    },
    {
      code: "negotiation",
      value: scores.negotiation_score,
      helper: scoreLabel(scores.negotiation_label, locale),
    },
    {
      code: "liquidity",
      value: scores.liquidity_score,
      helper: scoreLabel(scores.liquidity_label, locale),
    },
    {
      code: "rental",
      value: scores.rental_potential_score,
      helper: scoreLabel(scores.rental_potential_label, locale),
    },
  ];
  return (
    <div className="score-stack" data-score-explanation-version={version}>
      {rows.map((row) => (
        <ScoreBar
          copy={copy}
          explanation={scoreDimension(scores, row.code)}
          fallbackCoverage={coverage}
          fallbackReasons={copy.reasons[row.code]}
          helper={row.helper}
          key={row.code}
          label={copy.labels[row.code]}
          locale={locale}
          meaning={copy.meanings[row.code]}
          risk={row.risk}
          value={row.value}
          version={scores.formula_version}
        />
      ))}
      <ScoreDataGap missingDataCodes={explainability?.missing_data_codes ?? []} locale={locale} />
    </div>
  );
}

export function ScoreDataGap({ missingDataCodes, locale = DEFAULT_LOCALE }: {
  missingDataCodes: string[];
  locale?: Locale;
}) {
  const missingData = missingDataCodes.map(
    (code) => MISSING_DATA_LABELS[locale][code] ?? code,
  );
  if (missingData.length === 0) return null;

  return (
    <div className="score-data-gap" role="status">
      <strong>{COPY[locale].missingTitle}</strong>
      <span>{missingData.join(", ")}</span>
      <small>{COPY[locale].missingAction}</small>
    </div>
  );
}

const MISSING_DATA_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    distance_to_center_km: "distance to the city center",
    nearest_stop_m: "distance to public transport",
    nearest_school_m: "distance to a school",
    nearest_major_road_m: "distance to a major road",
    nearest_industrial_zone_m: "distance to an industrial zone",
    parks_within_1km: "parks nearby",
    schools_within_1km: "schools nearby",
    planned_investments_within_2km: "planned investments nearby",
    rental_observations: "independent rental observations",
  },
  pl: {
    distance_to_center_km: "odległość od centrum",
    nearest_stop_m: "odległość od transportu publicznego",
    nearest_school_m: "odległość od szkoły",
    nearest_major_road_m: "odległość od głównej drogi",
    nearest_industrial_zone_m: "odległość od strefy przemysłowej",
    parks_within_1km: "parki w pobliżu",
    schools_within_1km: "szkoły w pobliżu",
    planned_investments_within_2km: "planowane inwestycje w pobliżu",
    rental_observations: "niezależne obserwacje najmu",
  },
  ru: {
    distance_to_center_km: "расстояние до центра",
    nearest_stop_m: "расстояние до общественного транспорта",
    nearest_school_m: "расстояние до школы",
    nearest_major_road_m: "расстояние до крупной дороги",
    nearest_industrial_zone_m: "расстояние до промышленной зоны",
    parks_within_1km: "парки рядом",
    schools_within_1km: "школы рядом",
    planned_investments_within_2km: "планируемые проекты рядом",
    rental_observations: "независимые наблюдения аренды",
  },
  uk: {
    distance_to_center_km: "відстань до центру",
    nearest_stop_m: "відстань до громадського транспорту",
    nearest_school_m: "відстань до школи",
    nearest_major_road_m: "відстань до головної дороги",
    nearest_industrial_zone_m: "відстань до промислової зони",
    parks_within_1km: "парки поруч",
    schools_within_1km: "школи поруч",
    planned_investments_within_2km: "заплановані проєкти поруч",
    rental_observations: "незалежні спостереження оренди",
  },
};

function ScoreBar({
  copy,
  explanation,
  fallbackCoverage,
  fallbackReasons,
  label,
  locale,
  meaning,
  value,
  helper,
  version,
  risk = false,
}: {
  copy: (typeof COPY)[Locale];
  explanation?: ScoreDimensionExplainability;
  fallbackCoverage: number;
  fallbackReasons: string[];
  label: string;
  locale: Locale;
  meaning: string;
  value: number | null;
  helper: string;
  version: string;
  risk?: boolean;
}) {
  const drivers = explanation?.drivers ?? [];
  const positive = drivers.filter((driver) => driver.direction === "positive").slice(0, 3);
  const negative = drivers.filter((driver) => driver.direction === "negative").slice(0, 3);
  const unknown = drivers.filter((driver) => driver.direction === "unknown").slice(0, 3);
  const coverage = explanation?.coverage_score ?? fallbackCoverage;
  const confidence = explanation?.confidence_level ?? confidenceFromCoverage(coverage);
  const calculationVersion = publicCalculationVersion(explanation?.calculation_version ?? version);
  return (
    <div className="score-bar" data-score-code={explanation?.score_code}>
      <div className="score-label">
        <span>{label}</span>
        <strong>{value === null ? copy.insufficient : `${value}/100`}</strong>
      </div>
      <span className="status-line">{helper}</span>
      <div className={risk ? "bar risk" : "bar"} aria-hidden="true">
        <span style={{ width: `${value === null ? 0 : Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <p className="score-meaning">{meaning}</p>
      <details className="score-explanation-details">
        <summary>{copy.why}</summary>
        <div className="score-explanation-body">
          <DriverGroup drivers={positive} label={copy.strengths} locale={locale} tone="positive" />
          <DriverGroup drivers={negative} label={copy.concerns} locale={locale} tone="negative" />
          <DriverGroup drivers={unknown} label={copy.unknowns} locale={locale} tone="unknown" />
          {!drivers.length ? (
            <div className="score-driver-group unknown">
              <ul>{fallbackReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </div>
          ) : null}
          <p className="score-explanation-meta">
            {copy.coverage}: {coverage}/100 · {copy.confidence}: {copy.confidenceLabels[confidence]} · {copy.version}: {calculationVersion}
          </p>
        </div>
      </details>
    </div>
  );
}

function DriverGroup({
  drivers,
  label,
  locale,
  tone,
}: {
  drivers: NonNullable<ScoreDimensionExplainability["drivers"]>;
  label: string;
  locale: Locale;
  tone: "positive" | "negative" | "unknown";
}) {
  if (!drivers.length) return null;
  return (
    <div className={`score-driver-group ${tone}`}>
      <strong>{label}</strong>
      <ul>
        {drivers.map((driver) => (
          <li key={`${driver.direction}-${driver.code}`}>{scoreDriverLabel(driver.code, locale)}</li>
        ))}
      </ul>
    </div>
  );
}

function confidenceFromCoverage(coverage: number): "high" | "medium" | "low" {
  if (coverage >= 75) return "high";
  if (coverage >= 50) return "medium";
  return "low";
}

function publicCalculationVersion(value: string) {
  return value.match(/v\d+$/i)?.[0] ?? value;
}
