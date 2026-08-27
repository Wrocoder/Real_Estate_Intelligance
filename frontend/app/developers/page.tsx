"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Building2, RefreshCw, ShieldCheck } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type DeveloperQualitySignal,
  type DeveloperRankingResponse,
  type DeveloperReputation,
} from "@/lib/api";
import { numberValue, scoreTone } from "@/lib/format";
import { DEVELOPERS_PAGE_COPY, type DevelopersPageCopy, type Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

export default function DevelopersPage() {
  const { locale } = useLocalePreference();
  const copy = DEVELOPERS_PAGE_COPY[locale];
  const [city, setCity] = useState("Wrocław");
  const [minScore, setMinScore] = useState("0");
  const [minConfidence, setMinConfidence] = useState("0");
  const [ranking, setRanking] = useState<DeveloperRankingResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => ranking?.items.find((item) => item.developer.id === selectedId) ?? ranking?.items[0],
    [ranking, selectedId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listDevelopers({
        city: city.trim() || undefined,
        min_reputation_score: minScore ? Number(minScore) : undefined,
        min_confidence_score: minConfidence ? Number(minConfidence) : undefined,
        limit: 50,
      });
      setRanking(data);
      setSelectedId((current) =>
        current && data.items.some((item) => item.developer.id === current)
          ? current
          : data.items[0]?.developer.id ?? null,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.statuses.unknownError);
    } finally {
      setLoading(false);
    }
  }, [city, copy, minConfidence, minScore]);

  useEffect(() => {
    void load();
  }, [load]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load();
  }

  const metrics = buildMetrics(ranking);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> {copy.actions.refresh}
        </button>
      </header>

      <form className="panel" onSubmit={submit}>
        <div className="panel-header">
          <h2>{copy.sections.filters}</h2>
        </div>
        <div className="panel-body form-grid compact">
          <label>
            {copy.fields.city}
            <input className="input" value={city} onChange={(event) => setCity(event.target.value)} />
          </label>
          <label>
            {copy.fields.minRating}
            <input
              className="input"
              min="0"
              max="100"
              type="number"
              value={minScore}
              onChange={(event) => setMinScore(event.target.value)}
            />
          </label>
          <label>
            {copy.fields.minConfidence}
            <input
              className="input"
              min="0"
              max="100"
              type="number"
              value={minConfidence}
              onChange={(event) => setMinConfidence(event.target.value)}
            />
          </label>
          <button className="button primary" type="submit">
            <ShieldCheck size={16} /> {copy.actions.apply}
          </button>
        </div>
      </form>

      <section className="metric-grid" style={{ marginTop: 16 }}>
        <div className="metric">
          <span>{copy.metrics.inSample}</span>
          <strong>{numberValue(metrics.total, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.averageRating}</span>
          <strong>{copy.values.score(metrics.averageScore)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.strongGood}</span>
          <strong>{numberValue(metrics.goodCount, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.needsReview}</span>
          <strong>{numberValue(metrics.riskCount, locale)}</strong>
        </div>
      </section>

      {error ? <ErrorBlock message={error} prefix={copy.errorPrefix} /> : null}
      {loading ? <LoadingBlock label={copy.statuses.loadingRanking} /> : null}

      {!loading && ranking ? (
        <div className="detail-grid" style={{ marginTop: 16 }}>
          <section className="panel">
            <div className="panel-header">
              <h2>{copy.sections.developers}</h2>
              <span className="status-line">{copy.statuses.found(ranking.total)}</span>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.table.developer}</th>
                    <th>{copy.table.rating}</th>
                    <th>{copy.table.confidence}</th>
                    <th>{copy.table.projects}</th>
                    <th>{copy.table.signals}</th>
                    <th>{copy.table.profile}</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.items.map((item) => (
                    <tr
                      key={item.developer.id}
                      className={selected?.developer.id === item.developer.id ? "selected-row" : ""}
                      onClick={() => setSelectedId(item.developer.id)}
                    >
                      <td>
                        <strong>{item.developer.name}</strong>
                        <small>
                          {item.developer.legal_name ??
                            item.developer.headquarters_city ??
                            copy.values.noValue}
                        </small>
                      </td>
                      <td>
                        <span className={`status-pill ${scoreTone(item.reputation_score)}`}>
                          {copy.values.score(item.reputation_score)}
                        </span>
                      </td>
                      <td>{copy.values.score(item.confidence_score)}</td>
                      <td>
                        {copy.values.completedActive(
                          item.completed_projects_count,
                          item.active_projects_count,
                        )}
                      </td>
                      <td>{numberValue(item.quality_signals.length, locale)}</td>
                      <td>
                        <Link
                          className="button"
                          href={`/developers/${item.developer.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {copy.actions.open}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="panel">
            <div className="panel-header">
              <h2>{copy.sections.profile}</h2>
              {selected ? (
                <span className={`status-pill ${labelTone(selected.label)}`}>
                  {copy.labels.reputation[selected.label] ?? selected.label}
                </span>
              ) : null}
            </div>
            <div className="panel-body">
              {selected ? (
                <>
                  <div className="button-row" style={{ marginBottom: 12 }}>
                    <Link className="button primary" href={`/developers/${selected.developer.id}`}>
                      <Building2 size={16} /> {copy.actions.openProfile}
                    </Link>
                  </div>
                  <DeveloperDetails copy={copy} locale={locale} reputation={selected} />
                </>
              ) : (
                copy.values.noData
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DeveloperDetails({
  copy,
  locale,
  reputation,
}: {
  copy: DevelopersPageCopy;
  locale: Locale;
  reputation: DeveloperReputation;
}) {
  return (
    <>
      <div className="metric-grid compact">
        <div className="metric">
          <span>{copy.metrics.rating}</span>
          <strong>{copy.values.score(reputation.reputation_score)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.technicalQuality}</span>
          <strong>{copy.values.score(reputation.technical_quality_score)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.legalScope}</span>
          <strong>{copy.values.score(reputation.legal_compliance_score)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.transparency}</span>
          <strong>{copy.values.score(reputation.transparency_score)}</strong>
        </div>
      </div>

      <h2>{reputation.developer.name}</h2>
      <ul className="section-list compact">
        <li>
          <Building2 size={16} /> {reputation.developer.legal_name ?? copy.values.legalNameMissing}
        </li>
        <li>
          KRS {reputation.developer.krs ?? copy.values.noValue} · NIP{" "}
          {reputation.developer.nip ?? copy.values.noValue} · REGON{" "}
          {reputation.developer.regon ?? copy.values.noValue}
        </li>
        <li>
          {copy.values.sources(
            reputation.source_citations.map((item) => item.source_name).join(", "),
          )}
        </li>
      </ul>

      <h2>{copy.sections.qualitySignals}</h2>
      <ul className="section-list compact">
        {reputation.quality_signals.map((signal) => (
          <li key={signal.id}>
            <SignalIcon signal={signal} /> {signal.title}: {signal.summary}
            {signalStatusText(signal, copy) ? (
              <small className="muted"> · {signalStatusText(signal, copy)}</small>
            ) : null}
          </li>
        ))}
      </ul>

      <h2>{copy.sections.dueDiligence}</h2>
      <ul className="section-list compact">
        {reputation.due_diligence_questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>

      <h2>{copy.sections.projects}</h2>
      <ul className="section-list compact">
        {reputation.projects.map((project) => (
          <li key={project.id}>
            {project.name}, {project.district ?? project.city}:{" "}
            {copy.labels.projectStatus[project.status] ?? project.status}
            {project.completed_year ? `, ${project.completed_year}` : ""}
            {project.units_count
              ? `, ${copy.values.units(numberValue(project.units_count, locale))}`
              : ""}
          </li>
        ))}
      </ul>
    </>
  );
}

function SignalIcon({ signal }: { signal: DeveloperQualitySignal }) {
  if (signal.severity === "warning" || signal.severity === "risk") {
    return <AlertTriangle size={16} />;
  }
  return <ShieldCheck size={16} />;
}

function signalStatusText(signal: DeveloperQualitySignal, copy: DevelopersPageCopy) {
  const parts: string[] = [];
  if (signal.moderation_status !== "active") {
    parts.push(copy.labels.moderationStatus[signal.moderation_status] ?? signal.moderation_status);
  }
  if (signal.dispute_status !== "none") {
    parts.push(copy.values.dispute(copy.labels.disputeStatus[signal.dispute_status] ?? signal.dispute_status));
  }
  return parts.join(", ");
}

function buildMetrics(ranking: DeveloperRankingResponse | null) {
  const items = ranking?.items ?? [];
  const averageScore = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.reputation_score, 0) / items.length)
    : 0;
  return {
    total: ranking?.total ?? 0,
    averageScore,
    goodCount: items.filter((item) => item.label === "strong" || item.label === "good").length,
    riskCount: items.filter((item) => item.label === "mixed" || item.label === "risk_review").length,
  };
}

function labelTone(label: DeveloperReputation["label"]) {
  if (label === "strong" || label === "good") return "healthy";
  if (label === "mixed" || label === "limited_data") return "warning";
  return "error";
}
