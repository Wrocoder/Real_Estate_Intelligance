"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Plus, RefreshCw, ShieldAlert } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type DataQualityLog,
  type IngestionJob,
  type RawListingSummary,
} from "@/lib/api";
import { numberValue } from "@/lib/format";

export default function AdminPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [logs, setLogs] = useState<DataQualityLog[]>([]);
  const [rawListings, setRawListings] = useState<RawListingSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [status, setStatus] = useState("Загрузка ingestion dashboard...");
  const [error, setError] = useState("");

  const load = useCallback(async (jobId: string) => {
    setError("");
    setStatus("Загрузка ingestion dashboard...");
    try {
      const [jobData, logData, rawData] = await Promise.all([
        api.listAdminIngestionJobs(),
        api.listAdminDataQualityLogs({ job_id: jobId || undefined, limit: 50 }),
        api.listAdminRawListings({ limit: 50 }),
      ]);
      setJobs(jobData);
      setLogs(logData);
      setRawListings(rawData);
      setStatus("Admin dashboard обновлен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Admin API недоступен");
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  const latestJob = jobs[0];
  const warningCount = logs.filter((log) => log.severity === "warning").length;
  const errorCount = logs.filter((log) => log.severity === "error").length;
  const sourceNames = useMemo(
    () => Array.from(new Set(rawListings.map((item) => item.source_name))),
    [rawListings],
  );

  async function createManualJob() {
    const created = await api.createAdminIngestionJob({
      source_name: "Manual admin note",
      source_type: "manual",
      status: "queued",
      notes: "Created from admin dashboard MVP.",
      metadata: { intent: "manual_follow_up" },
    });
    setSelectedJobId(created.id);
    await load(created.id);
    setStatus(`Job создан: ${created.id}`);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Internal Admin</h1>
          <p>Ingestion jobs, data quality logs и raw listing preview для контроля данных.</p>
        </div>
        <div className="toolbar">
          <button className="button" type="button" onClick={() => void load(selectedJobId)}>
            <RefreshCw size={16} /> Обновить
          </button>
          <button className="button primary" type="button" onClick={() => void createManualJob()}>
            <Plus size={16} /> Job
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Jobs</span>
          <strong>{numberValue(jobs.length)}</strong>
        </div>
        <div className="metric">
          <span>Raw listings</span>
          <strong>{numberValue(rawListings.length)}</strong>
        </div>
        <div className="metric">
          <span>Warnings</span>
          <strong>{numberValue(warningCount)}</strong>
        </div>
        <div className="metric">
          <span>Errors</span>
          <strong>{numberValue(errorCount)}</strong>
        </div>
      </section>

      {error ? (
        <ErrorBlock message={error} />
      ) : jobs.length === 0 && status.startsWith("Загрузка") ? (
        <LoadingBlock />
      ) : (
        <div className="admin-grid" style={{ marginTop: 16 }}>
          <section className="panel">
            <div className="panel-header">
              <h2>Ingestion Jobs</h2>
              <span className="status-line">{status}</span>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Rows</th>
                    <th>Raw</th>
                    <th>Properties</th>
                    <th>Snapshots</th>
                    <th>Errors</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className={selectedJobId === job.id ? "selected-row" : undefined}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        void load(job.id);
                      }}
                    >
                      <td>
                        <strong>{job.source_name}</strong>
                        <small>{job.source_type}</small>
                      </td>
                      <td>
                        <span className={`status-pill ${job.status}`}>{job.status}</span>
                      </td>
                      <td>{job.rows_seen}</td>
                      <td>
                        +{job.raw_created} / ~{job.raw_updated}
                      </td>
                      <td>
                        +{job.properties_created} / ~{job.properties_updated}
                      </td>
                      <td>
                        +{job.snapshots_created} / ~{job.snapshots_updated}
                      </td>
                      <td>{job.errors_count}</td>
                      <td>{formatDate(job.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="panel">
            <div className="panel-header">
              <h2>Data Quality</h2>
              <ShieldAlert size={18} />
            </div>
            <div className="panel-body">
              <label className="field" style={{ marginBottom: 12 }}>
                <span>Job filter</span>
                <select
                  className="select"
                  value={selectedJobId}
                  onChange={(event) => {
                    setSelectedJobId(event.target.value);
                    void load(event.target.value);
                  }}
                >
                  <option value="">Все jobs</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.source_name} · {job.status}
                    </option>
                  ))}
                </select>
              </label>

              {logs.length === 0 ? (
                <EmptyBlock label="Нет data-quality логов под текущий фильтр." />
              ) : (
                <ul className="section-list compact">
                  {logs.map((log) => (
                    <li key={log.id}>
                      <span className={`status-pill ${log.severity}`}>{log.severity}</span>
                      <strong>{log.code}</strong>
                      <p className="muted">{log.message}</p>
                      <small>
                        {log.source_name}
                        {log.source_listing_id ? ` · ${log.source_listing_id}` : ""}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Raw Listings Preview</h2>
              <span className="muted">
                <Database size={14} /> {sourceNames.join(", ") || "no sources"}
              </span>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Listing ID</th>
                    <th>URL</th>
                    <th>Fetched</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {rawListings.map((raw) => (
                    <tr key={String(raw.id)}>
                      <td>{raw.source_name}</td>
                      <td>{raw.source_listing_id}</td>
                      <td>
                        <a href={raw.source_url} target="_blank" rel="noreferrer">
                          open
                        </a>
                      </td>
                      <td>{formatDate(raw.fetched_at)}</td>
                      <td>
                        <code>{compactPayload(raw.raw_payload)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {latestJob ? (
        <p className="muted" style={{ marginTop: 12 }}>
          Latest job: {latestJob.id} · {latestJob.source_name} · {latestJob.status}
        </p>
      ) : null}
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function compactPayload(payload: Record<string, unknown>) {
  const text = JSON.stringify(payload);
  if (text.length <= 140) return text;
  return `${text.slice(0, 137)}...`;
}
