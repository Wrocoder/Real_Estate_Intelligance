"use client";

import { useEffect, useState } from "react";
import { Bell, Eye, FileText, RefreshCw, Send, Trash2 } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type Alert,
  type AlertChannel,
  type AlertDeliveryJob,
  type AlertFrequency,
  type AlertPreview,
  type AlertUpdate,
  type RealtorSavedSearchDigest,
} from "@/lib/api";
import { money } from "@/lib/format";

const BUILDING_TYPE_OPTIONS = [
  { value: "apartment_block", label: "Блок / многоквартирный" },
  { value: "low_rise_block", label: "Низкая застройка" },
  { value: "tenement", label: "Kamienica" },
  { value: "detached_house", label: "Дом" },
];
const RENOVATION_STATE_OPTIONS = [
  { value: "developer_standard", label: "Developer standard" },
  { value: "ready_to_move_in", label: "Готово к въезду" },
  { value: "needs_refresh", label: "Требует освежения" },
  { value: "needs_renovation", label: "Требует ремонта" },
];
const PARKING_TYPE_OPTIONS = [
  { value: "underground", label: "Подземный" },
  { value: "garage", label: "Гараж" },
  { value: "surface", label: "Наземный" },
  { value: "street", label: "Уличный" },
];
const HEATING_TYPE_OPTIONS = [
  { value: "municipal", label: "Городское" },
  { value: "gas", label: "Газовое" },
  { value: "electric", label: "Электрическое" },
  { value: "heat_pump", label: "Heat pump" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [jobs, setJobs] = useState<AlertDeliveryJob[]>([]);
  const [preview, setPreview] = useState<AlertPreview | null>(null);
  const [digest, setDigest] = useState<RealtorSavedSearchDigest | null>(null);
  const [status, setStatus] = useState("Загрузка alerts...");
  const [error, setError] = useState("");
  const [savingAlertId, setSavingAlertId] = useState<string | null>(null);
  const [digestForm, setDigestForm] = useState({
    clientName: "",
    intro: "",
    maxMatches: "5",
    includeSourceLinks: false,
  });
  const [form, setForm] = useState({
    name: "Fabryczna до 700k",
    query: "",
    voivodeship: "",
    municipality: "",
    district: "Fabryczna",
    buildingType: "",
    renovationState: "",
    hasBalcony: false,
    hasTerrace: false,
    hasGarden: false,
    hasElevator: false,
    parkingType: "",
    heatingType: "",
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
        voivodeship: form.voivodeship || null,
        city: form.municipality ? null : "Wrocław",
        municipality: form.municipality || null,
        query: form.query || null,
        district: form.district || null,
        building_type: form.buildingType || null,
        renovation_state: form.renovationState || null,
        has_balcony: form.hasBalcony || null,
        has_terrace: form.hasTerrace || null,
        has_garden: form.hasGarden || null,
        has_elevator: form.hasElevator || null,
        parking_type: form.parkingType || null,
        heating_type: form.heatingType || null,
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
      setDigest((current) => (current?.alert.id === alertId ? null : current));
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
      setDigest((current) => (current?.alert.id === alert.id ? null : current));
      setStatus(`Alert удален: ${alert.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown alert delete error");
      setStatus("Не удалось удалить alert");
    } finally {
      setSavingAlertId(null);
    }
  }

  async function buildRealtorDigest(alertId: string) {
    setSavingAlertId(alertId);
    setError("");
    try {
      const maxMatches = Number(digestForm.maxMatches) || 5;
      const data = await api.buildRealtorAlertDigest(alertId, {
        client_name: digestForm.clientName || null,
        intro: digestForm.intro || null,
        max_matches: maxMatches,
        include_source_links: digestForm.includeSourceLinks,
      });
      setDigest(data);
      setStatus(`Client digest: ${data.items.length}/${data.total_matches} matches`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown digest error");
      setStatus("Не удалось собрать client digest");
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
            <span>Gmina</span>
            <input
              className="input"
              placeholder="Wrocław / Kobierzyce"
              value={form.municipality}
              onChange={(event) =>
                setForm({ ...form, municipality: event.target.value, district: "" })
              }
            />
          </label>
          <label className="field">
            <span>Województwo</span>
            <input
              className="input"
              placeholder="dolnoslaskie"
              value={form.voivodeship}
              onChange={(event) => setForm({ ...form, voivodeship: event.target.value })}
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
            <span>Тип здания</span>
            <select
              className="input"
              value={form.buildingType}
              onChange={(event) => setForm({ ...form, buildingType: event.target.value })}
            >
              <option value="">Любой</option>
              {BUILDING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Состояние</span>
            <select
              className="input"
              value={form.renovationState}
              onChange={(event) => setForm({ ...form, renovationState: event.target.value })}
            >
              <option value="">Любое</option>
              {RENOVATION_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.hasBalcony}
              onChange={(event) => setForm({ ...form, hasBalcony: event.target.checked })}
            />
            <span>Балкон</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.hasTerrace}
              onChange={(event) => setForm({ ...form, hasTerrace: event.target.checked })}
            />
            <span>Терраса</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.hasGarden}
              onChange={(event) => setForm({ ...form, hasGarden: event.target.checked })}
            />
            <span>Сад</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.hasElevator}
              onChange={(event) => setForm({ ...form, hasElevator: event.target.checked })}
            />
            <span>Лифт</span>
          </label>
          <label className="field">
            <span>Parking</span>
            <select
              className="input"
              value={form.parkingType}
              onChange={(event) => setForm({ ...form, parkingType: event.target.value })}
            >
              <option value="">Любой</option>
              {PARKING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Отопление</span>
            <select
              className="input"
              value={form.heatingType}
              onChange={(event) => setForm({ ...form, heatingType: event.target.value })}
            >
              <option value="">Любое</option>
              {HEATING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
                        className="button"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void buildRealtorDigest(alert.id)}
                      >
                        <FileText size={16} /> Client digest
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
          <h2>Realtor client digest</h2>
          <span className="muted">
            {digest ? `${digest.items.length}/${digest.total_matches} matches` : "not generated"}
          </span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>Клиент</span>
              <input
                className="input"
                placeholder="Anna"
                value={digestForm.clientName}
                onChange={(event) =>
                  setDigestForm({ ...digestForm, clientName: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Intro</span>
              <input
                className="input"
                placeholder="Короткий контекст для клиента"
                value={digestForm.intro}
                onChange={(event) =>
                  setDigestForm({ ...digestForm, intro: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Объектов</span>
              <input
                className="input"
                inputMode="numeric"
                value={digestForm.maxMatches}
                onChange={(event) =>
                  setDigestForm({ ...digestForm, maxMatches: event.target.value })
                }
              />
            </label>
            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={digestForm.includeSourceLinks}
                onChange={(event) =>
                  setDigestForm({
                    ...digestForm,
                    includeSourceLinks: event.target.checked,
                  })
                }
              />
              <span>Добавить source links</span>
            </label>
          </div>
          {!digest ? (
            <EmptyBlock label="Заполните параметры и нажмите Client digest у нужного alert." />
          ) : (
            <div className="digest-layout">
              <div>
                <h3>{digest.subject}</h3>
                <p className="muted">{digest.summary}</p>
                <textarea className="input digest-message" readOnly value={digest.client_message} />
              </div>
              <div className="listing-list">
                {digest.items.map((item) => (
                  <article className="listing-card" key={item.listing_id}>
                    <div>
                      <h3>{item.title}</h3>
                      <div className="meta-row">
                        <span>{money(item.price)}</span>
                        <span>{item.rooms} rooms</span>
                        <span>{item.area_m2} m2</span>
                        <span>{item.price_delta_to_fair_mid_pct.toFixed(1)}% fair Δ</span>
                        <span>N {item.negotiation_score}</span>
                        <span>L {item.liquidity_score}</span>
                        <span>Rent {item.rental_potential_score}</span>
                      </div>
                      <div className="meta-row">
                        <span>{item.client_pitch}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <p className="muted">{digest.disclaimer}</p>
            </div>
          )}
        </div>
      </section>

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
