"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Plus, RefreshCw, ShieldAlert } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type DataQualityLog,
  type IngestionJob,
  type PlannedInvestment,
  type PlannedInvestmentPayload,
  type RawListingSummary,
} from "@/lib/api";
import { numberValue } from "@/lib/format";

type InvestmentForm = {
  name: string;
  investment_type: string;
  status: string;
  city: string;
  district: string;
  expected_year: string;
  lat: string;
  lon: string;
  source_url: string;
  confidence_score: string;
  notes: string;
};

const defaultInvestmentForm: InvestmentForm = {
  name: "New planned investment",
  investment_type: "tram",
  status: "planned",
  city: "Wrocław",
  district: "Fabryczna",
  expected_year: "2029",
  lat: "51.112",
  lon: "16.968",
  source_url: "https://example.com/planned-investment",
  confidence_score: "60",
  notes: "",
};

export default function AdminPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [logs, setLogs] = useState<DataQualityLog[]>([]);
  const [rawListings, setRawListings] = useState<RawListingSummary[]>([]);
  const [plannedInvestments, setPlannedInvestments] = useState<PlannedInvestment[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");
  const [investmentForm, setInvestmentForm] =
    useState<InvestmentForm>(defaultInvestmentForm);
  const [status, setStatus] = useState("Загрузка ingestion dashboard...");
  const [error, setError] = useState("");

  const load = useCallback(async (jobId: string) => {
    setError("");
    setStatus("Загрузка ingestion dashboard...");
    try {
      const [jobData, logData, rawData, investmentData] = await Promise.all([
        api.listAdminIngestionJobs(),
        api.listAdminDataQualityLogs({ job_id: jobId || undefined, limit: 50 }),
        api.listAdminRawListings({ limit: 50 }),
        api.listAdminPlannedInvestments({ city: "Wrocław" }),
      ]);
      setJobs(jobData);
      setLogs(logData);
      setRawListings(rawData);
      setPlannedInvestments(investmentData);
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
  const selectedInvestment = plannedInvestments.find(
    (investment) => investment.id === selectedInvestmentId,
  );
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

  async function createInvestment() {
    const payload = investmentPayload(investmentForm);
    const created = await api.createAdminPlannedInvestment(payload);
    setSelectedInvestmentId(created.id);
    setInvestmentForm(formFromInvestment(created));
    await load(selectedJobId);
    setStatus(`Planned investment создан: ${created.name}`);
  }

  async function updateInvestment() {
    if (!selectedInvestmentId) {
      setStatus("Выбери planned investment для обновления");
      return;
    }
    const updated = await api.updateAdminPlannedInvestment(
      selectedInvestmentId,
      investmentPayload(investmentForm),
    );
    setInvestmentForm(formFromInvestment(updated));
    await load(selectedJobId);
    setStatus(`Planned investment обновлен: ${updated.name}`);
  }

  async function deleteInvestment() {
    if (!selectedInvestmentId) {
      setStatus("Выбери planned investment для удаления");
      return;
    }
    const response = await api.deleteAdminPlannedInvestment(selectedInvestmentId);
    if (!response.ok) {
      setStatus(`Delete failed: HTTP ${response.status}`);
      return;
    }
    setSelectedInvestmentId("");
    setInvestmentForm(defaultInvestmentForm);
    await load(selectedJobId);
    setStatus("Planned investment удален");
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
          <span>Planned investments</span>
          <strong>{numberValue(plannedInvestments.length)}</strong>
        </div>
        <div className="metric">
          <span>Warnings / errors</span>
          <strong>
            {numberValue(warningCount)} / {numberValue(errorCount)}
          </strong>
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
              <h2>Planned Investments CRUD</h2>
              <span className="muted">{plannedInvestments.length} active layers</span>
            </div>
            <div className="panel-body planned-investment-grid">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>District</th>
                      <th>Year</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannedInvestments.map((investment) => (
                      <tr
                        key={investment.id}
                        className={
                          selectedInvestmentId === investment.id ? "selected-row" : undefined
                        }
                        onClick={() => {
                          setSelectedInvestmentId(investment.id);
                          setInvestmentForm(formFromInvestment(investment));
                        }}
                      >
                        <td>
                          <strong>{investment.name}</strong>
                          <small>{investment.id}</small>
                        </td>
                        <td>{investment.investment_type}</td>
                        <td>
                          <span className={`status-pill ${investment.status}`}>
                            {investment.status}
                          </span>
                        </td>
                        <td>{investment.district ?? "-"}</td>
                        <td>{investment.expected_year ?? "-"}</td>
                        <td>{investment.confidence_score}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>{selectedInvestment ? "Редактирование" : "Новый слой"}</h3>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setSelectedInvestmentId("");
                      setInvestmentForm(defaultInvestmentForm);
                    }}
                  >
                    Сброс
                  </button>
                </div>
                <div className="form-grid compact">
                  <Field
                    label="Name"
                    value={investmentForm.name}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, name: value })}
                  />
                  <Field
                    label="Type"
                    value={investmentForm.investment_type}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, investment_type: value })
                    }
                  />
                  <Field
                    label="Status"
                    value={investmentForm.status}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, status: value })}
                  />
                  <Field
                    label="City"
                    value={investmentForm.city}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, city: value })}
                  />
                  <Field
                    label="District"
                    value={investmentForm.district}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, district: value })
                    }
                  />
                  <Field
                    label="Year"
                    value={investmentForm.expected_year}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, expected_year: value })
                    }
                  />
                  <Field
                    label="Lat"
                    value={investmentForm.lat}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, lat: value })}
                  />
                  <Field
                    label="Lon"
                    value={investmentForm.lon}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, lon: value })}
                  />
                  <Field
                    label="Confidence"
                    value={investmentForm.confidence_score}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, confidence_score: value })
                    }
                  />
                </div>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Source URL</span>
                  <input
                    className="input"
                    value={investmentForm.source_url}
                    onChange={(event) =>
                      setInvestmentForm({ ...investmentForm, source_url: event.target.value })
                    }
                  />
                </label>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Notes</span>
                  <textarea
                    className="textarea"
                    value={investmentForm.notes}
                    onChange={(event) =>
                      setInvestmentForm({ ...investmentForm, notes: event.target.value })
                    }
                  />
                </label>
                <div className="toolbar" style={{ marginTop: 12 }}>
                  <button className="button primary" type="button" onClick={() => void createInvestment()}>
                    Create
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedInvestmentId}
                    onClick={() => void updateInvestment()}
                  >
                    Update
                  </button>
                  <button
                    className="button danger"
                    type="button"
                    disabled={!selectedInvestmentId}
                    onClick={() => void deleteInvestment()}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </section>

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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function investmentPayload(form: InvestmentForm): PlannedInvestmentPayload {
  return {
    name: form.name,
    investment_type: form.investment_type,
    status: form.status,
    city: form.city,
    district: form.district || null,
    expected_year: form.expected_year ? Number(form.expected_year) : null,
    lat: Number(form.lat),
    lon: Number(form.lon),
    source_url: form.source_url || null,
    confidence_score: Number(form.confidence_score),
    notes: form.notes || null,
  };
}

function formFromInvestment(investment: PlannedInvestment): InvestmentForm {
  return {
    name: investment.name,
    investment_type: investment.investment_type,
    status: investment.status,
    city: investment.city,
    district: investment.district ?? "",
    expected_year: investment.expected_year ? String(investment.expected_year) : "",
    lat: String(investment.lat),
    lon: String(investment.lon),
    source_url: investment.source_url ?? "",
    confidence_score: String(investment.confidence_score),
    notes: investment.notes ?? "",
  };
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
