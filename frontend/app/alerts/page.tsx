"use client";

import { useEffect, useState } from "react";
import { Bell, Eye, RefreshCw, Send, Trash2 } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type Alert,
  type AlertChannel,
  type AlertDeliveryJob,
  type AlertFrequency,
  type AlertPreview,
  type AlertUpdate,
} from "@/lib/api";
import { money } from "@/lib/format";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [jobs, setJobs] = useState<AlertDeliveryJob[]>([]);
  const [preview, setPreview] = useState<AlertPreview | null>(null);
  const [status, setStatus] = useState("Загрузка alerts...");
  const [error, setError] = useState("");
  const [savingAlertId, setSavingAlertId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Fabryczna до 700k",
    query: "",
    district: "Fabryczna",
    maxPrice: "700000",
    minFloor: "",
    maxFloor: "",
    maxBuildingFloors: "",
    minBuildingYear: "",
    maxBuildingYear: "",
    minInvestment: "40",
    maxFairDelta: "",
    minNegotiation: "",
    minLiquidity: "",
    minRental: "",
    minPriceReductions: "",
    maxDaysOnMarket: "",
    channel: "email" as AlertChannel,
    frequency: "daily" as AlertFrequency,
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
        query: form.query || null,
        district: form.district || null,
        max_price: form.maxPrice ? Number(form.maxPrice) : null,
        min_floor: form.minFloor ? Number(form.minFloor) : null,
        max_floor: form.maxFloor ? Number(form.maxFloor) : null,
        max_building_floors: form.maxBuildingFloors
          ? Number(form.maxBuildingFloors)
          : null,
        min_building_year: form.minBuildingYear ? Number(form.minBuildingYear) : null,
        max_building_year: form.maxBuildingYear ? Number(form.maxBuildingYear) : null,
        min_investment_score: form.minInvestment ? Number(form.minInvestment) : null,
        max_price_delta_to_fair_mid_pct: form.maxFairDelta
          ? Number(form.maxFairDelta)
          : null,
        min_negotiation_score: form.minNegotiation ? Number(form.minNegotiation) : null,
        min_liquidity_score: form.minLiquidity ? Number(form.minLiquidity) : null,
        min_rental_potential_score: form.minRental ? Number(form.minRental) : null,
        min_price_reductions: form.minPriceReductions
          ? Number(form.minPriceReductions)
          : null,
        max_days_on_market: form.maxDaysOnMarket
          ? Number(form.maxDaysOnMarket)
          : null,
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

  async function updateAlertPreferences(alertId: string, payload: AlertUpdate) {
    setSavingAlertId(alertId);
    setError("");
    try {
      const updated = await api.updateAlert(alertId, payload);
      setAlerts((current) =>
        current.map((item) => (item.id === alertId ? updated : item)),
      );
      setPreview((current) =>
        current?.alert.id === alertId ? { ...current, alert: updated } : current,
      );
      setStatus(`Alert обновлен: ${updated.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown alert update error");
      setStatus("Не удалось обновить alert");
    } finally {
      setSavingAlertId(null);
    }
  }

  async function deleteAlert(alert: Alert) {
    if (!window.confirm(`Удалить alert "${alert.name}"?`)) {
      return;
    }

    setSavingAlertId(alert.id);
    setError("");
    try {
      await api.deleteAlert(alert.id);
      setAlerts((current) => current.filter((item) => item.id !== alert.id));
      setPreview((current) => (current?.alert.id === alert.id ? null : current));
      setStatus(`Alert удален: ${alert.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown alert delete error");
      setStatus("Не удалось удалить alert");
    } finally {
      setSavingAlertId(null);
    }
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
            <span>Поиск</span>
            <input
              className="input"
              placeholder="адрес, район, улица"
              value={form.query}
              onChange={(event) => setForm({ ...form, query: event.target.value })}
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
            <span>Этаж от</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minFloor}
              onChange={(event) => setForm({ ...form, minFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Этаж до</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxFloor}
              onChange={(event) => setForm({ ...form, maxFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Этажность до</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxBuildingFloors}
              onChange={(event) =>
                setForm({ ...form, maxBuildingFloors: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Год дома от</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minBuildingYear}
              onChange={(event) =>
                setForm({ ...form, minBuildingYear: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Год дома до</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxBuildingYear}
              onChange={(event) =>
                setForm({ ...form, maxBuildingYear: event.target.value })
              }
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
            <span>Макс. fair delta %</span>
            <input
              className="input"
              inputMode="decimal"
              value={form.maxFairDelta}
              placeholder="0"
              onChange={(event) => setForm({ ...form, maxFairDelta: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Negotiation</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minNegotiation}
              placeholder="70"
              onChange={(event) => setForm({ ...form, minNegotiation: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Liquidity</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minLiquidity}
              placeholder="60"
              onChange={(event) => setForm({ ...form, minLiquidity: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Мин. Rental</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minRental}
              placeholder="70"
              onChange={(event) => setForm({ ...form, minRental: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Снижений цены от</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minPriceReductions}
              placeholder="1"
              onChange={(event) =>
                setForm({ ...form, minPriceReductions: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Дней на рынке до</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxDaysOnMarket}
              placeholder="30"
              onChange={(event) => setForm({ ...form, maxDaysOnMarket: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Канал</span>
            <select
              className="input"
              value={form.channel}
              onChange={(event) =>
                setForm({ ...form, channel: event.target.value as AlertChannel })
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
                  frequency: event.target.value as AlertFrequency,
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
                      <div className="alert-preferences">
                        <label className="field compact-field">
                          <span>Частота</span>
                          <select
                            className="input"
                            disabled={savingAlertId === alert.id}
                            value={alert.frequency}
                            onChange={(event) =>
                              void updateAlertPreferences(alert.id, {
                                frequency: event.target.value as AlertFrequency,
                              })
                            }
                          >
                            <option value="instant">instant</option>
                            <option value="daily">daily</option>
                            <option value="weekly">weekly</option>
                          </select>
                        </label>
                        <label className="field compact-field">
                          <span>Канал</span>
                          <select
                            className="input"
                            disabled={savingAlertId === alert.id}
                            value={alert.channel}
                            onChange={(event) =>
                              void updateAlertPreferences(alert.id, {
                                channel: event.target.value as AlertChannel,
                              })
                            }
                          >
                            <option value="email">email</option>
                            <option value="telegram">telegram</option>
                          </select>
                        </label>
                        <label className="field compact-field">
                          <span>Delivery target</span>
                          <input
                            key={`${alert.id}-${alert.delivery_target ?? "default"}`}
                            className="input"
                            defaultValue={alert.delivery_target ?? ""}
                            disabled={savingAlertId === alert.id}
                            placeholder={
                              alert.channel === "telegram"
                                ? "Telegram chat id"
                                : "email optional"
                            }
                            onBlur={(event) => {
                              const nextTarget = event.currentTarget.value.trim();
                              const currentTarget = alert.delivery_target ?? "";
                              if (nextTarget === currentTarget) {
                                return;
                              }
                              void updateAlertPreferences(alert.id, {
                                delivery_target: nextTarget || null,
                              });
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                            }}
                          />
                        </label>
                        <label className="field checkbox-field alert-active-field">
                          <input
                            type="checkbox"
                            checked={alert.is_active}
                            disabled={savingAlertId === alert.id}
                            onChange={(event) =>
                              void updateAlertPreferences(alert.id, {
                                is_active: event.target.checked,
                              })
                            }
                          />
                          <span>{alert.is_active ? "Активен" : "На паузе"}</span>
                        </label>
                      </div>
                      {savingAlertId === alert.id ? (
                        <div className="meta-row">
                          <span>Сохранение настроек...</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="button-row">
                      <button
                        className="button"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void loadPreview(alert.id)}
                      >
                        <Eye size={16} /> Preview
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void deliver(alert.id, true)}
                      >
                        <Send size={16} /> Dry run
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void deliver(alert.id, false)}
                      >
                        <Send size={16} /> Check send
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void deleteAlert(alert)}
                      >
                        <Trash2 size={16} /> Удалить
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
                        <span>Fair Δ {match.scores.price_delta_to_fair_mid_pct.toFixed(1)}%</span>
                        <span>N {match.scores.negotiation_score}</span>
                        <span>L {match.scores.liquidity_score}</span>
                        <span>Rent {match.scores.rental_potential_score}</span>
                        <span>{match.listing.price_reductions} drops</span>
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
