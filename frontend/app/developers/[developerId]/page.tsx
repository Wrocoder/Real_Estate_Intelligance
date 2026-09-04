"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { localizedError } from "@/lib/errorMessages";
import {
  api,
  type DeveloperProject,
  type DeveloperQualitySignal,
  type DeveloperReputation,
  type DeveloperSourceCitation,
} from "@/lib/api";
import { dateValue, numberValue, scoreTone } from "@/lib/format";
import { DEVELOPERS_PAGE_COPY, type DevelopersPageCopy, type Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

export default function DeveloperProfilePage() {
  const { locale } = useLocalePreference();
  const copy = DEVELOPERS_PAGE_COPY[locale];
  const params = useParams<{ developerId: string }>();
  const developerId = decodeURIComponent(params.developerId);
  const [reputation, setReputation] = useState<DeveloperReputation | null>(null);
  const [status, setStatus] = useState(copy.statuses.loadingProfile);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setStatus(copy.statuses.loadingProfile);
    try {
      const data = await api.getDeveloper(developerId);
      setReputation(data);
      setStatus(copy.statuses.updated(dateValue(data.developer.updated_at, locale)));
    } catch (caught) {
      setError(localizedError(caught, locale, copy.statuses.unknownError));
      setStatus(copy.statuses.profileUnavailable);
    }
  }, [copy, developerId, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const factors = useMemo(() => (reputation ? factorRows(reputation, copy) : []), [copy, reputation]);

  if (error) return <ErrorBlock message={error} prefix={copy.errorPrefix} />;
  if (!reputation) return <LoadingBlock label={copy.statuses.loadingDeveloperProfile} />;

  return (
    <>
      <header className="page-header">
        <div>
          <Link href="/developers" className="button">
            <ArrowLeft size={16} /> {copy.actions.ranking}
          </Link>
          <h1 style={{ marginTop: 14 }}>{reputation.developer.name}</h1>
          <p>
            {reputation.developer.legal_name ?? copy.values.legalNameMissing} ·{" "}
            {reputation.developer.headquarters_city ?? copy.values.headquartersMissing}
          </p>
        </div>
        <div className="toolbar">
          <span className={`status-pill ${reputationTone(reputation)}`}>
            {copy.labels.reputation[reputation.label] ?? reputation.label}
          </span>
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>{copy.metrics.reputationScore}</span>
          <strong>{copy.values.score(reputation.reputation_score)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.confidence}</span>
          <strong>{copy.values.score(reputation.confidence_score)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.completedProjects}</span>
          <strong>{numberValue(reputation.completed_projects_count, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.activeProjects}</span>
          <strong>{numberValue(reputation.active_projects_count, locale)}</strong>
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>{copy.sections.factors}</h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>{copy.table.factor}</th>
                  <th>{copy.table.score}</th>
                  <th>{copy.table.meaning}</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((factor) => (
                  <tr key={factor.id}>
                    <td>{factor.label}</td>
                    <td>
                      <span className={`status-pill ${scoreTone(factor.score)}`}>
                        {copy.values.score(factor.score)}
                      </span>
                    </td>
                    <td>{factor.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel-body">
            <h2>{copy.sections.projects}</h2>
            <ProjectTable copy={copy} locale={locale} projects={reputation.projects} />

            <h2>{copy.sections.qualitySignals}</h2>
            <ul className="section-list">
              {reputation.quality_signals.map((signal) => (
                <li key={signal.id}>
                  <SignalIcon signal={signal} /> <strong>{signal.title}</strong>:{" "}
                  {signal.summary}
                  <br />
                  <small className="muted">
                    {signal.source_name} · {copy.values.confidence(signal.confidence_score)}
                    {signal.observed_at ? ` · ${dateValue(signal.observed_at, locale)}` : ""}
                    {signalStatusText(signal, copy) ? ` · ${signalStatusText(signal, copy)}` : ""}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.sections.dueDiligence}</h2>
            <span className="score-pill">{copy.values.dataQuality(reputation.confidence_score)}</span>
          </div>
          <div className="panel-body">
            <h2>{copy.sections.company}</h2>
            <ul className="section-list compact">
              <li>
                <Building2 size={16} />{" "}
                {reputation.developer.legal_name ?? reputation.developer.name}
              </li>
              <li>
                KRS {reputation.developer.krs ?? copy.values.noValue} · NIP{" "}
                {reputation.developer.nip ?? copy.values.noValue} · REGON{" "}
                {reputation.developer.regon ?? copy.values.noValue}
              </li>
              <li>
                {copy.values.foundedUpdated(
                  reputation.developer.founded_year?.toString() ?? copy.values.noValue,
                  dateValue(reputation.developer.updated_at, locale),
                )}
              </li>
              {reputation.developer.website_url ? (
                <li>
                  <a href={reputation.developer.website_url} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> {host(reputation.developer.website_url)}
                  </a>
                </li>
              ) : null}
            </ul>

            <h2>{copy.sections.check}</h2>
            <ul className="section-list compact">
              {reputation.due_diligence_questions.map((question) => (
                <li key={question}>
                  <ShieldCheck size={16} /> {question}
                </li>
              ))}
            </ul>

            <h2>{copy.sections.sources}</h2>
            <ul className="section-list compact">
              {reputation.source_citations.map((citation) => (
                <SourceItem
                  citation={citation}
                  copy={copy}
                  key={`${citation.source_name}-${citation.checked_at}`}
                  locale={locale}
                />
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function ProjectTable({
  copy,
  locale,
  projects,
}: {
  copy: DevelopersPageCopy;
  locale: Locale;
  projects: DeveloperProject[];
}) {
  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>{copy.table.project}</th>
            <th>{copy.table.location}</th>
            <th>{copy.table.status}</th>
            <th>{copy.table.units}</th>
            <th>{copy.table.source}</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>
                {project.district ?? copy.values.noValue}, {project.city}
              </td>
              <td>
                <span className={`status-pill ${projectTone(project)}`}>
                  {copy.labels.projectStatus[project.status] ?? project.status}
                  {project.completed_year ? ` · ${project.completed_year}` : ""}
                </span>
              </td>
              <td>
                {project.units_count
                  ? numberValue(project.units_count, locale)
                  : copy.values.noValue}
              </td>
              <td>
                {project.source_url ? (
                  <a href={project.source_url} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> {copy.actions.source}
                  </a>
                ) : (
                  copy.values.noValue
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceItem({
  citation,
  copy,
  locale,
}: {
  citation: DeveloperSourceCitation;
  copy: DevelopersPageCopy;
  locale: Locale;
}) {
  return (
    <li>
      <CalendarDays size={16} />{" "}
      {citation.source_url ? (
        <a href={citation.source_url} target="_blank" rel="noreferrer">
          {citation.source_name}
        </a>
      ) : (
        citation.source_name
      )}
      <br />
      <small className="muted">
        {copy.values.checked(dateValue(citation.checked_at, locale))}
        {citation.note ? ` · ${citation.note}` : ""}
      </small>
    </li>
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

function factorRows(reputation: DeveloperReputation, copy: DevelopersPageCopy) {
  return [
    {
      id: "track-record",
      label: copy.factors.trackRecord.label,
      score: reputation.track_record_score,
      detail: copy.factors.trackRecord.detail,
    },
    {
      id: "delivery",
      label: copy.factors.delivery.label,
      score: reputation.delivery_score,
      detail: copy.factors.delivery.detail,
    },
    {
      id: "technical-quality",
      label: copy.factors.technicalQuality.label,
      score: reputation.technical_quality_score,
      detail: copy.factors.technicalQuality.detail,
    },
    {
      id: "legal",
      label: copy.factors.legal.label,
      score: reputation.legal_compliance_score,
      detail: copy.factors.legal.detail,
    },
    {
      id: "financial",
      label: copy.factors.financial.label,
      score: reputation.financial_stability_score,
      detail: copy.factors.financial.detail,
    },
    {
      id: "transparency",
      label: copy.factors.transparency.label,
      score: reputation.transparency_score,
      detail: copy.factors.transparency.detail,
    },
    {
      id: "local",
      label: copy.factors.local.label,
      score: reputation.local_experience_score,
      detail: copy.factors.local.detail,
    },
  ];
}

function reputationTone(reputation: DeveloperReputation) {
  if (reputation.label === "strong" || reputation.label === "good") return "healthy";
  if (reputation.label === "mixed" || reputation.label === "limited_data") return "warning";
  return "error";
}

function projectTone(project: DeveloperProject) {
  if (project.status === "completed") return "healthy";
  if (project.status === "active") return "info";
  if (project.status === "planned") return "warning";
  return "";
}

function host(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}
