import { Building2, CalendarDays, CircleAlert, Database, Percent } from "lucide-react";

import type { ListingRentalEstimate } from "@/lib/api";
import { dateValue, money, numberValue } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type Props = {
  estimate: ListingRentalEstimate | null;
  locale: Locale;
};

const COPY = {
  en: {
    title: "Rental evidence",
    estimated: "Estimate based on rental observations",
    insufficient: "Not enough rental data",
    insufficientText: "We do not calculate rent or yield without at least three relevant rental observations.",
    rent: "Estimated monthly rent",
    gross: "Gross yield",
    net: "Net yield",
    confidence: "Confidence",
    sample: "Relevant observations",
    scope: "Selection scope",
    method: "Method",
    methodDescription: "Median rent per m² from relevant observations",
    period: "Observed period",
    sources: "Sources",
    assumptions: "Scenario assumptions",
    evidence: "Rental comparables",
    beforeTax: "Before income tax and financing",
    vacancy: "Vacancy",
    management: "Management reserve",
    maintenance: "Maintenance reserve",
    similarity: "match",
    month: "mo.",
    confidenceLevels: { high: "High", medium: "Medium", low: "Low" },
    scopes: ["Same district, close match", "Same district, wider match", "Same city, similar apartments", "Same city, wider match"],
  },
  pl: {
    title: "Dane o najmie",
    estimated: "Szacunek oparty na ofertach najmu",
    insufficient: "Za mało danych o najmie",
    insufficientText: "Nie wyliczamy czynszu ani rentowności bez co najmniej trzech trafnych obserwacji najmu.",
    rent: "Szacowany czynsz miesięczny",
    gross: "Rentowność brutto",
    net: "Rentowność netto",
    confidence: "Pewność",
    sample: "Trafne obserwacje",
    scope: "Zakres wyboru",
    method: "Metoda",
    methodDescription: "Mediana czynszu za m² z trafnych obserwacji",
    period: "Okres obserwacji",
    sources: "Źródła",
    assumptions: "Założenia scenariusza",
    evidence: "Porównywalne oferty najmu",
    beforeTax: "Przed podatkiem dochodowym i finansowaniem",
    vacancy: "Pustostan",
    management: "Rezerwa na zarządzanie",
    maintenance: "Rezerwa na utrzymanie",
    similarity: "dopasowania",
    month: "mies.",
    confidenceLevels: { high: "Wysoka", medium: "Średnia", low: "Niska" },
    scopes: ["To samo osiedle, ścisłe dopasowanie", "To samo osiedle, szersze dopasowanie", "To samo miasto, podobne mieszkania", "To samo miasto, szersze dopasowanie"],
  },
  ru: {
    title: "Данные об аренде",
    estimated: "Оценка по арендным объявлениям",
    insufficient: "Недостаточно данных об аренде",
    insufficientText: "Мы не рассчитываем аренду и доходность без трёх релевантных арендных наблюдений.",
    rent: "Оценочная аренда в месяц",
    gross: "Валовая доходность",
    net: "Чистая доходность",
    confidence: "Уверенность",
    sample: "Релевантные наблюдения",
    scope: "Область выборки",
    method: "Метод",
    methodDescription: "Медиана аренды за м² по релевантным наблюдениям",
    period: "Период наблюдений",
    sources: "Источники",
    assumptions: "Допущения сценария",
    evidence: "Сравнимые объявления аренды",
    beforeTax: "До налога на доход и финансирования",
    vacancy: "Простой",
    management: "Резерв на управление",
    maintenance: "Резерв на содержание",
    similarity: "сходства",
    month: "мес.",
    confidenceLevels: { high: "Высокая", medium: "Средняя", low: "Низкая" },
    scopes: ["Тот же район, точное соответствие", "Тот же район, расширенный поиск", "Тот же город, похожие квартиры", "Тот же город, расширенный поиск"],
  },
  uk: {
    title: "Дані про оренду",
    estimated: "Оцінка за орендними оголошеннями",
    insufficient: "Недостатньо даних про оренду",
    insufficientText: "Ми не розраховуємо оренду та дохідність без трьох релевантних орендних спостережень.",
    rent: "Оціночна оренда на місяць",
    gross: "Валова дохідність",
    net: "Чиста дохідність",
    confidence: "Впевненість",
    sample: "Релевантні спостереження",
    scope: "Область вибірки",
    method: "Метод",
    methodDescription: "Медіана оренди за м² за релевантними спостереженнями",
    period: "Період спостережень",
    sources: "Джерела",
    assumptions: "Припущення сценарію",
    evidence: "Порівнювані оголошення оренди",
    beforeTax: "До податку на дохід і фінансування",
    vacancy: "Простій",
    management: "Резерв на управління",
    maintenance: "Резерв на утримання",
    similarity: "схожості",
    month: "міс.",
    confidenceLevels: { high: "Висока", medium: "Середня", low: "Низька" },
    scopes: ["Той самий район, точна відповідність", "Той самий район, розширений пошук", "Те саме місто, схожі квартири", "Те саме місто, розширений пошук"],
  },
} as const;

export function RentalEvidencePanel({ estimate, locale }: Props) {
  if (!estimate) return null;
  const copy = COPY[locale];
  const complete =
    estimate.status === "estimated" &&
    estimate.monthly_rent_low_pln !== null &&
    estimate.monthly_rent_high_pln !== null &&
    estimate.gross_yield_pct !== null &&
    estimate.net_yield_pct !== null;

  return (
    <section className="rental-evidence" aria-labelledby="rental-evidence-title">
      <header className="rental-evidence-header">
        <div>
          <span className="eyebrow"><Building2 size={14} /> {copy.title}</span>
          <h3 id="rental-evidence-title">{complete ? copy.estimated : copy.insufficient}</h3>
        </div>
        <span className={`status-pill ${complete ? "healthy" : "warning"}`}>
          {copy.confidenceLevels[estimate.confidence.level]} {estimate.confidence_score}/100
        </span>
      </header>

      {!complete ? (
        <div className="rental-empty" role="status">
          <CircleAlert size={18} />
          <div>
            <strong>{copy.insufficientText}</strong>
            <span>{copy.sample}: {estimate.sample_size}/{estimate.target_sample_size}</span>
          </div>
        </div>
      ) : (
        <div className="rental-metrics">
          <div><span>{copy.rent}</span><strong>{money(estimate.monthly_rent_low_pln!, locale)}–{money(estimate.monthly_rent_high_pln!, locale)}</strong></div>
          <div><span>{copy.gross}</span><strong>{numberValue(estimate.gross_yield_pct!, locale)}%</strong></div>
          <div><span>{copy.net}</span><strong>{numberValue(estimate.net_yield_pct!, locale)}%</strong><small>{copy.beforeTax}</small></div>
        </div>
      )}

      <dl className="rental-provenance">
        <div><dt><Database size={14} /> {copy.sample}</dt><dd>{estimate.sample_size}/{estimate.target_sample_size}</dd></div>
        <div><dt>{copy.scope}</dt><dd>{copy.scopes[estimate.selection_level] ?? copy.scopes[3]}</dd></div>
        <div><dt>{copy.method}</dt><dd>{copy.methodDescription}</dd></div>
        <div><dt><CalendarDays size={14} /> {copy.period}</dt><dd>{estimate.period ?? "—"}</dd></div>
        <div><dt>{copy.sources}</dt><dd>{estimate.source_names.join(", ") || "—"}</dd></div>
      </dl>

      <details className="rental-details">
        <summary><Percent size={15} /> {copy.assumptions}</summary>
        <ul className="section-list compact">
          {estimate.assumptions.map((item) => (
            <li key={item.code}>
              {assumptionLabel(item.code, item.label, copy)}: {assumptionValue(item.value, item.unit, locale)}
            </li>
          ))}
        </ul>
      </details>

      {estimate.comparables.length > 0 ? (
        <details className="rental-details">
          <summary>{copy.evidence}</summary>
          <div className="rental-comparable-list">
            {estimate.comparables.map((item) => (
              <article key={item.observation_id}>
                <strong>{money(item.monthly_rent_pln, locale)}/{copy.month}</strong>
                <span>{item.area_m2.toLocaleString(locale)} m² · {item.rooms ?? "—"} · {item.district ?? "—"}</span>
                <small>{item.source_name} · {dateValue(item.observed_at, locale)} · {item.similarity_score}% {copy.similarity}</small>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function assumptionLabel(
  code: string,
  fallback: string,
  copy: (typeof COPY)[Locale],
) {
  if (code === "vacancy_rate") return copy.vacancy;
  if (code === "management_reserve") return copy.management;
  if (code === "maintenance_reserve") return copy.maintenance;
  return fallback;
}

function assumptionValue(
  value: number,
  unit: "percent" | "pln_per_m2_month" | "pln_month",
  locale: Locale,
) {
  if (unit === "percent") return `${numberValue(value, locale)}%`;
  if (unit === "pln_per_m2_month") return `${money(value, locale)}/m²`;
  return money(value, locale);
}
