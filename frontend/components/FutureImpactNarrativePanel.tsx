import { Construction, MapPin } from "lucide-react";

import type { FutureImpactNarrativeItem, ListingFutureImpact } from "@/lib/api";
import { numberValue } from "@/lib/format";
import type { FutureImpactNarrativeCopy, Locale } from "@/lib/i18n";

type Props = {
  copy: FutureImpactNarrativeCopy;
  impact: ListingFutureImpact | null | undefined;
  locale: Locale;
};

export function FutureImpactNarrativePanel({ copy, impact, locale }: Props) {
  if (!impact) return null;

  const nearest = impact.nearest_investments[0] ?? null;
  const within2km = impact.buckets.find((bucket) => bucket.radius_m === 2000);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="icon-title">
          <Construction size={16} /> {copy.title}
        </h2>
        <span className="status-pill info">{impact.impact_score}/100</span>
      </div>
      <div className="panel-body">
        <p className="empty-state">{impact.summary}</p>

        <div className="metric-grid compact" style={{ marginTop: 12 }}>
          <Metric label={copy.metrics.score} value={`${impact.impact_score}/100`} />
          <Metric
            label={copy.metrics.within2km}
            value={copy.values.projects(within2km?.count ?? 0)}
          />
          <Metric
            label={copy.metrics.nearest}
            value={
              nearest
                ? copy.values.meters(numberValue(nearest.distance_m, locale))
                : copy.values.noData
            }
          />
          <Metric
            label={copy.metrics.confidence}
            value={
              nearest
                ? `${nearest.investment.confidence_score}/100`
                : copy.values.noData
            }
          />
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          <section>
            <div className="panel-header inline">
              <h3>{copy.sections.narrative}</h3>
            </div>
            <TextList copy={copy} items={impact.impact_narrative.slice(0, 3)} />
          </section>

          <section>
            <div className="panel-header inline">
              <h3>{copy.sections.catalysts}</h3>
            </div>
            <ProjectList
              copy={copy}
              items={impact.positive_catalysts.slice(0, 3)}
              locale={locale}
            />
          </section>

          <section>
            <div className="panel-header inline">
              <h3>{copy.sections.checks}</h3>
            </div>
            <ProjectList
              copy={copy}
              items={impact.negative_or_supply_projects.slice(0, 3)}
              locale={locale}
            />
          </section>

          <section>
            <div className="panel-header inline">
              <h3>{copy.labels.risks}</h3>
            </div>
            <TextList copy={copy} items={impact.risk_signals.slice(0, 4)} />
          </section>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          {impact.methodology_note}
        </p>
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

function TextList({
  copy,
  items,
}: {
  copy: FutureImpactNarrativeCopy;
  items: string[];
}) {
  if (items.length === 0) return <p className="muted">{copy.values.noData}</p>;

  return (
    <ul className="section-list compact">
      {[...new Set(items)].map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ProjectList({
  copy,
  items,
  locale,
}: {
  copy: FutureImpactNarrativeCopy;
  items: FutureImpactNarrativeItem[];
  locale: Locale;
}) {
  if (items.length === 0) return <p className="muted">{copy.values.noData}</p>;

  return (
    <ul className="section-list compact">
      {items.map((item) => {
        const risks = [...item.disruption_risks, ...item.supply_pressure_risks];
        return (
          <li key={item.investment_id ?? `${item.name}-${item.expected_year ?? "unknown"}-${item.distance_m}`}>
            <div className="meta-row">
              <strong>{item.name}</strong>
              <span className={`status-pill ${categoryTone(item.category)}`}>
                {copy.values.categories[item.category] ?? item.category}
              </span>
            </div>
            <small>
              <MapPin size={13} /> {copy.labels.distance}:{" "}
              {copy.values.meters(numberValue(item.distance_m, locale))} ·{" "}
              {copy.labels.status}: {item.status} · {copy.labels.expected}:{" "}
              {item.expected_year
                ? copy.values.expectedYear(item.expected_year)
                : copy.values.noYear} · {copy.metrics.confidence}{" "}
              {item.confidence_score}/100
            </small>
            {item.positive_effects.length > 0 ? (
              <span>
                {copy.labels.effects}: {item.positive_effects.join("; ")}
              </span>
            ) : null}
            {risks.length > 0 ? (
              <span>
                {copy.labels.risks}: {risks.join("; ")}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function categoryTone(category: FutureImpactNarrativeItem["category"]) {
  if (category === "positive_catalyst") return "healthy";
  if (category === "supply_pressure") return "error";
  return "warning";
}
