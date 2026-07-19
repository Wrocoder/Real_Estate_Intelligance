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
  type DeveloperReputationLabel,
} from "@/lib/api";
import { numberValue, scoreTone } from "@/lib/format";

export default function DevelopersPage() {
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
      setError(caught instanceof Error ? caught.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }, [city, minConfidence, minScore]);

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
          <h1>Рейтинг застройщиков</h1>
          <p>Профиль риска, локальный опыт, источники и вопросы для проверки перед сделкой.</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> Обновить
        </button>
      </header>

      <form className="panel" onSubmit={submit}>
        <div className="panel-header">
          <h2>Фильтры</h2>
        </div>
        <div className="panel-body form-grid compact">
          <label>
            Город
            <input className="input" value={city} onChange={(event) => setCity(event.target.value)} />
          </label>
          <label>
            Мин. рейтинг
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
            Мин. уверенность
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
            <ShieldCheck size={16} /> Применить
          </button>
        </div>
      </form>

      <section className="metric-grid" style={{ marginTop: 16 }}>
        <div className="metric">
          <span>В выборке</span>
          <strong>{metrics.total}</strong>
        </div>
        <div className="metric">
          <span>Средний рейтинг</span>
          <strong>{metrics.averageScore}/100</strong>
        </div>
        <div className="metric">
          <span>Сильные/хорошие</span>
          <strong>{metrics.goodCount}</strong>
        </div>
        <div className="metric">
          <span>Нужна проверка</span>
          <strong>{metrics.riskCount}</strong>
        </div>
      </section>

      {error ? <ErrorBlock message={error} /> : null}
      {loading ? <LoadingBlock label="Загрузка рейтинга" /> : null}

      {!loading && ranking ? (
        <div className="detail-grid" style={{ marginTop: 16 }}>
          <section className="panel">
            <div className="panel-header">
              <h2>Застройщики</h2>
              <span className="status-line">{ranking.total} найдено</span>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Застройщик</th>
                    <th>Рейтинг</th>
                    <th>Уверенность</th>
                    <th>Проекты</th>
                    <th>Сигналы</th>
                    <th>Профиль</th>
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
                          {item.developer.legal_name ?? item.developer.headquarters_city ?? "—"}
                        </small>
                      </td>
                      <td>
                        <span className={`status-pill ${scoreTone(item.reputation_score)}`}>
                          {item.reputation_score}/100
                        </span>
                      </td>
                      <td>{item.confidence_score}/100</td>
                      <td>
                        {item.completed_projects_count} сдано / {item.active_projects_count} активно
                      </td>
                      <td>{item.quality_signals.length}</td>
                      <td>
                        <Link
                          className="button"
                          href={`/developers/${item.developer.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Открыть
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
              <h2>Профиль</h2>
              {selected ? (
                <span className={`status-pill ${labelTone(selected.label)}`}>
                  {labelText(selected.label)}
                </span>
              ) : null}
            </div>
            <div className="panel-body">
              {selected ? (
                <>
                  <div className="button-row" style={{ marginBottom: 12 }}>
                    <Link className="button primary" href={`/developers/${selected.developer.id}`}>
                      <Building2 size={16} /> Открыть профиль
                    </Link>
                  </div>
                  <DeveloperDetails reputation={selected} />
                </>
              ) : (
                "Нет данных"
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DeveloperDetails({ reputation }: { reputation: DeveloperReputation }) {
  return (
    <>
      <div className="metric-grid compact">
        <div className="metric">
          <span>Рейтинг</span>
          <strong>{reputation.reputation_score}/100</strong>
        </div>
        <div className="metric">
          <span>Техкачество</span>
          <strong>{reputation.technical_quality_score}/100</strong>
        </div>
        <div className="metric">
          <span>Юр. контур</span>
          <strong>{reputation.legal_compliance_score}/100</strong>
        </div>
        <div className="metric">
          <span>Прозрачность</span>
          <strong>{reputation.transparency_score}/100</strong>
        </div>
      </div>

      <h2>{reputation.developer.name}</h2>
      <ul className="section-list compact">
        <li>
          <Building2 size={16} /> {reputation.developer.legal_name ?? "Legal name не указан"}
        </li>
        <li>
          KRS {reputation.developer.krs ?? "—"} · NIP {reputation.developer.nip ?? "—"} · REGON{" "}
          {reputation.developer.regon ?? "—"}
        </li>
        <li>Источники: {reputation.source_citations.map((item) => item.source_name).join(", ")}</li>
      </ul>

      <h2>Сигналы</h2>
      <ul className="section-list compact">
        {reputation.quality_signals.map((signal) => (
          <li key={signal.id}>
            <SignalIcon signal={signal} /> {signal.title}: {signal.summary}
            {signalStatusText(signal) ? (
              <small className="muted"> · {signalStatusText(signal)}</small>
            ) : null}
          </li>
        ))}
      </ul>

      <h2>Вопросы перед сделкой</h2>
      <ul className="section-list compact">
        {reputation.due_diligence_questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>

      <h2>Проекты</h2>
      <ul className="section-list compact">
        {reputation.projects.map((project) => (
          <li key={project.id}>
            {project.name}, {project.district ?? project.city}: {projectStatusText(project.status)}
            {project.completed_year ? `, ${project.completed_year}` : ""}
            {project.units_count ? `, ${numberValue(project.units_count)} units` : ""}
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

function labelText(label: DeveloperReputationLabel) {
  return {
    strong: "сильный",
    good: "хороший",
    mixed: "смешанный",
    limited_data: "мало данных",
    risk_review: "проверить",
  }[label];
}

function labelTone(label: DeveloperReputationLabel) {
  if (label === "strong" || label === "good") return "healthy";
  if (label === "mixed" || label === "limited_data") return "warning";
  return "error";
}

function projectStatusText(status: string) {
  return {
    active: "активный",
    completed: "сдан",
    planned: "планируется",
    unknown: "статус неизвестен",
  }[status] ?? status;
}
