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
import {
  api,
  type DeveloperProject,
  type DeveloperQualitySignal,
  type DeveloperReputation,
  type DeveloperSourceCitation,
} from "@/lib/api";
import { numberValue, scoreTone } from "@/lib/format";

export default function DeveloperProfilePage() {
  const params = useParams<{ developerId: string }>();
  const developerId = decodeURIComponent(params.developerId);
  const [reputation, setReputation] = useState<DeveloperReputation | null>(null);
  const [status, setStatus] = useState("Загрузка профиля...");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setStatus("Загрузка профиля...");
    try {
      const data = await api.getDeveloper(developerId);
      setReputation(data);
      setStatus(`Обновлено: ${dateLabel(data.developer.updated_at)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Профиль недоступен");
    }
  }, [developerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const factors = useMemo(() => (reputation ? factorRows(reputation) : []), [reputation]);

  if (error) return <ErrorBlock message={error} />;
  if (!reputation) return <LoadingBlock label="Загрузка профиля застройщика" />;

  return (
    <>
      <header className="page-header">
        <div>
          <Link href="/developers" className="button">
            <ArrowLeft size={16} /> Рейтинг
          </Link>
          <h1 style={{ marginTop: 14 }}>{reputation.developer.name}</h1>
          <p>
            {reputation.developer.legal_name ?? "Legal entity не указан"} ·{" "}
            {reputation.developer.headquarters_city ?? "город не указан"}
          </p>
        </div>
        <div className="toolbar">
          <span className={`status-pill ${reputationTone(reputation)}`}>
            {reputationLabel(reputation)}
          </span>
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Reputation Score</span>
          <strong>{reputation.reputation_score}/100</strong>
        </div>
        <div className="metric">
          <span>Confidence</span>
          <strong>{reputation.confidence_score}/100</strong>
        </div>
        <div className="metric">
          <span>Сданные проекты</span>
          <strong>{reputation.completed_projects_count}</strong>
        </div>
        <div className="metric">
          <span>Активные проекты</span>
          <strong>{reputation.active_projects_count}</strong>
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Факторы рейтинга</h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Фактор</th>
                  <th>Score</th>
                  <th>Что означает</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((factor) => (
                  <tr key={factor.id}>
                    <td>{factor.label}</td>
                    <td>
                      <span className={`status-pill ${scoreTone(factor.score)}`}>
                        {factor.score}/100
                      </span>
                    </td>
                    <td>{factor.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel-body">
            <h2>Проекты</h2>
            <ProjectTable projects={reputation.projects} />

            <h2>Quality и risk signals</h2>
            <ul className="section-list">
              {reputation.quality_signals.map((signal) => (
                <li key={signal.id}>
                  <SignalIcon signal={signal} /> <strong>{signal.title}</strong>:{" "}
                  {signal.summary}
                  <br />
                  <small className="muted">
                    {signal.source_name} · confidence {signal.confidence_score}/100
                    {signal.observed_at ? ` · ${dateLabel(signal.observed_at)}` : ""}
                    {signalStatusText(signal) ? ` · ${signalStatusText(signal)}` : ""}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Due diligence</h2>
            <span className="score-pill">DQ {reputation.confidence_score}</span>
          </div>
          <div className="panel-body">
            <h2>Компания</h2>
            <ul className="section-list compact">
              <li>
                <Building2 size={16} />{" "}
                {reputation.developer.legal_name ?? reputation.developer.name}
              </li>
              <li>
                KRS {reputation.developer.krs ?? "-"} · NIP{" "}
                {reputation.developer.nip ?? "-"} · REGON{" "}
                {reputation.developer.regon ?? "-"}
              </li>
              <li>
                Основан: {reputation.developer.founded_year ?? "-"} · обновлено{" "}
                {dateLabel(reputation.developer.updated_at)}
              </li>
              {reputation.developer.website_url ? (
                <li>
                  <a href={reputation.developer.website_url} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> {host(reputation.developer.website_url)}
                  </a>
                </li>
              ) : null}
            </ul>

            <h2>Что проверить</h2>
            <ul className="section-list compact">
              {reputation.due_diligence_questions.map((question) => (
                <li key={question}>
                  <ShieldCheck size={16} /> {question}
                </li>
              ))}
            </ul>

            <h2>Источники</h2>
            <ul className="section-list compact">
              {reputation.source_citations.map((citation) => (
                <SourceItem citation={citation} key={`${citation.source_name}-${citation.checked_at}`} />
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function ProjectTable({ projects }: { projects: DeveloperProject[] }) {
  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Проект</th>
            <th>Локация</th>
            <th>Статус</th>
            <th>Units</th>
            <th>Источник</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>
                {project.district ?? "-"}, {project.city}
              </td>
              <td>
                <span className={`status-pill ${projectTone(project)}`}>
                  {projectStatus(project)}
                  {project.completed_year ? ` · ${project.completed_year}` : ""}
                </span>
              </td>
              <td>{project.units_count ? numberValue(project.units_count) : "-"}</td>
              <td>
                {project.source_url ? (
                  <a href={project.source_url} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> source
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceItem({ citation }: { citation: DeveloperSourceCitation }) {
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
        checked {dateLabel(citation.checked_at)}
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

function signalStatusText(signal: DeveloperQualitySignal) {
  const parts: string[] = [];
  if (signal.moderation_status !== "active") {
    parts.push(signal.moderation_status);
  }
  if (signal.dispute_status !== "none") {
    parts.push(`dispute ${signal.dispute_status}`);
  }
  return parts.join(", ");
}

function factorRows(reputation: DeveloperReputation) {
  return [
    {
      id: "track-record",
      label: "Track record",
      score: reputation.track_record_score,
      detail: "Количество и свежесть сданных/активных проектов.",
    },
    {
      id: "delivery",
      label: "Delivery",
      score: reputation.delivery_score,
      detail: "Сигналы по срокам, этапам строительства и handover.",
    },
    {
      id: "technical-quality",
      label: "Technical quality",
      score: reputation.technical_quality_score,
      detail: "Сигналы дефектов, приемок и технических проверок.",
    },
    {
      id: "legal",
      label: "Legal compliance",
      score: reputation.legal_compliance_score,
      detail: "KRS/REGON/UOKiK и договорные consumer-risk signals.",
    },
    {
      id: "financial",
      label: "Financial stability",
      score: reputation.financial_stability_score,
      detail: "Базовая устойчивость компании и прозрачность структуры.",
    },
    {
      id: "transparency",
      label: "Transparency",
      score: reputation.transparency_score,
      detail: "Документы, schedule, проектные страницы и source freshness.",
    },
    {
      id: "local",
      label: "Local experience",
      score: reputation.local_experience_score,
      detail: "Опыт в том же городе/районе и сопоставимых проектах.",
    },
  ];
}

function reputationLabel(reputation: DeveloperReputation) {
  return {
    strong: "сильный профиль",
    good: "хороший профиль",
    mixed: "смешанный профиль",
    limited_data: "мало данных",
    risk_review: "нужна проверка",
  }[reputation.label];
}

function reputationTone(reputation: DeveloperReputation) {
  if (reputation.label === "strong" || reputation.label === "good") return "healthy";
  if (reputation.label === "mixed" || reputation.label === "limited_data") return "warning";
  return "error";
}

function projectStatus(project: DeveloperProject) {
  return {
    active: "активный",
    completed: "сдан",
    planned: "планируется",
    unknown: "статус неизвестен",
  }[project.status];
}

function projectTone(project: DeveloperProject) {
  if (project.status === "completed") return "healthy";
  if (project.status === "active") return "info";
  if (project.status === "planned") return "warning";
  return "";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function host(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}
