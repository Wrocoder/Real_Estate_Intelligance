"use client";

import { useEffect, useState } from "react";
import { Bell, Eye, RefreshCw, Send } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { api, type Alert, type AlertDeliveryJob, type AlertPreview } from "@/lib/api";
import { money } from "@/lib/format";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [jobs, setJobs] = useState<AlertDeliveryJob[]>([]);
  const [preview, setPreview] = useState<AlertPreview | null>(null);
  const [status, setStatus] = useState("Загрузка alerts...");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "Fabryczna до 700k",
    district: "Fabryczna",
    maxPrice: "700000",
    minInvestment: "40",
    channel: "email" as "email" | "telegram",
    frequency: "daily" as "instant" | "daily" | "weekly",
    deliveryTarget: "",
  });

  async function load() {
    setError("");
    try {
      const [alertData, jobData] = await Promise.all([
        api.listAlerts(),
        api.listAlertDeliveryJobs(),
      ]);
      setAlerts(alertData);
      setJobs(jobData);
      setStatus(`Alerts: ${alertData.length}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createAlert() {
    const alert = await api.createAlert({
      name: form.name,
      filters: {
        city: "Wrocław",
        district: form.district || null,
        max_price: form.maxPrice ? Number(form.maxPrice) : null,
        min_investment_score: form.minInvestment ? Number(form.minInvestment) : null,
      },
      channel: form.channel,
      frequency: form.frequency,
      delivery_target: form.deliveryTarget || null,
    });
    setAlerts([alert, ...alerts]);
    setStatus(`Alert создан: ${alert.id}`);
  }

  async function loadPreview(alertId: string) {
    const data = await api.previewAlert(alertId);
    setPreview(data);
    setStatus(`Совпадений: ${data.total_matches}`);
  }

  async function deliver(alertId: string, dryRun: boolean) {
    const job = await api.deliverAlert(alertId, dryRun, 5);
    setJobs([job, ...jobs.filter((item) => item.id !== job.id)]);
    setStatus(`${job.status}: ${job.message}`);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Saved search alerts</h1>
          <p>Уведомления по фильтрам и скорингу с dry-run и delivery через email/Telegram.</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> Обновить
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Новый alert</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <label className="field">
            <span>Название</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Район</span>
            <input
              className="input"
              value={form.district}
              onChange={(event) => setForm({ ...form, district: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Макс. цена</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxPrice}
              onChange={(event) => setForm({ ...form, maxPrice: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Investment</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minInvestment}
              onChange={(event) => setForm({ ...form, minInvestment: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Канал</span>
            <select
              className="input"
              value={form.channel}
              onChange={(event) =>
                setForm({ ...form, channel: event.target.value as "email" | "telegram" })
              }
            >
              <option value="email">email</option>
              <option value="telegram">telegram</option>
            </select>
          </label>
          <label className="field">
            <span>Частота</span>
            <select
              className="input"
              value={form.frequency}
              onChange={(event) =>
                setForm({
                  ...form,
                  frequency: event.target.value as "instant" | "daily" | "weekly",
                })
              }
            >
              <option value="instant">instant</option>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
            </select>
          </label>
          <label className="field">
            <span>Delivery target</span>
            <input
              className="input"
              placeholder={form.channel === "telegram" ? "Telegram chat id" : "email optional"}
              value={form.deliveryTarget}
              onChange={(event) => setForm({ ...form, deliveryTarget: event.target.value })}
            />
          </label>
          <button className="button primary" type="button" onClick={() => void createAlert()}>
            <Bell size={16} /> Создать
          </button>
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Alerts</h2>
            <span className="muted">{alerts.length} items</span>
          </div>
          <div className="panel-body">
            {error ? (
              <ErrorBlock message={error} />
            ) : alerts.length === 0 && status.startsWith("Загрузка") ? (
              <LoadingBlock />
            ) : alerts.length === 0 ? (
              <EmptyBlock label="Пока нет alerts." />
            ) : (
              <div className="listing-list">
                {alerts.map((alert) => (
                  <article className="listing-card" key={alert.id}>
                    <div>
                      <h3>{alert.name}</h3>
                      <div className="meta-row">
                        <span>{alert.frequency}</span>
                        <span>{alert.channel}</span>
                        <span>{alert.delivery_target ?? "default target"}</span>
                        <span>{alert.is_active ? "active" : "paused"}</span>
                      </div>
                      <div className="meta-row">
                        {Object.entries(alert.filters)
                          .filter(([, value]) => value !== null && value !== undefined)
                          .map(([key, value]) => (
                            <span key={key}>
                              {key}: {String(value)}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="button-row">
                      <button className="button" type="button" onClick={() => void loadPreview(alert.id)}>
                        <Eye size={16} /> Preview
                      </button>
                      <button className="button" type="button" onClick={() => void deliver(alert.id, true)}>
                        <Send size={16} /> Dry run
                      </button>
                      <button className="button" type="button" onClick={() => void deliver(alert.id, false)}>
                        <Send size={16} /> Check send
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Preview</h2>
            <span className="muted">{preview ? preview.total_matches : 0} matches</span>
          </div>
          <div className="panel-body">
            {!preview ? (
              <EmptyBlock label="Выберите alert, чтобы увидеть подходящие объекты." />
            ) : (
              <div className="listing-list">
                {preview.matches.map((match) => (
                  <article className="listing-card" key={match.listing.id}>
                    <div>
                      <h3>{match.listing.title}</h3>
                      <div className="meta-row">
                        <span>{money(match.listing.price)}</span>
                        <span>I {match.scores.investment_score}</span>
                        <span>R {match.scores.risk_score}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Delivery history</h2>
          <span className="muted">{jobs.length} jobs</span>
        </div>
        <div className="panel-body">
          {jobs.length === 0 ? (
            <EmptyBlock label="Delivery jobs еще не запускались." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Канал</th>
                  <th>Статус</th>
                  <th>Matches</th>
                  <th>Сообщение</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.provider}</td>
                    <td>{job.status}</td>
                    <td>{job.total_matches}</td>
                    <td>{job.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
