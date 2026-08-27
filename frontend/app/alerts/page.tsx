"use client";

import { useCallback, useEffect, useState } from "react";
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
import { money, numberValue, percent } from "@/lib/format";
import { ALERTS_PAGE_COPY, type AlertsPageCopy, type Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const BUILDING_TYPE_OPTIONS = [
  "apartment_block",
  "low_rise_block",
  "tenement",
  "detached_house",
] as const;
const RENOVATION_STATE_OPTIONS = [
  "developer_standard",
  "ready_to_move_in",
  "needs_refresh",
  "needs_renovation",
] as const;
const PARKING_TYPE_OPTIONS = ["underground", "garage", "surface", "street"] as const;
const HEATING_TYPE_OPTIONS = ["municipal", "gas", "electric", "heat_pump"] as const;
const CHANNEL_OPTIONS: AlertChannel[] = ["email", "telegram"];
const FREQUENCY_OPTIONS: AlertFrequency[] = ["instant", "daily", "weekly"];

export default function AlertsPage() {
  const { locale } = useLocalePreference();
  const copy = ALERTS_PAGE_COPY[locale];
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [jobs, setJobs] = useState<AlertDeliveryJob[]>([]);
  const [preview, setPreview] = useState<AlertPreview | null>(null);
  const [digest, setDigest] = useState<RealtorSavedSearchDigest | null>(null);
  const [status, setStatus] = useState(copy.statuses.loading);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingAlertId, setSavingAlertId] = useState<string | null>(null);
  const [digestForm, setDigestForm] = useState({
    clientName: "",
    intro: "",
    maxMatches: "5",
    includeSourceLinks: false,
  });
  const [form, setForm] = useState({
    name: copy.values.alertNameDefault,
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

  const load = useCallback(async () => {
    setError("");
    setIsLoading(true);
    setStatus(copy.statuses.loading);
    try {
      const [alertData, jobData] = await Promise.all([
        api.listAlerts(),
        api.listAlertDeliveryJobs(),
      ]);
      setAlerts(alertData);
      setJobs(jobData);
      setStatus(copy.statuses.loaded(alertData.length));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    } finally {
      setIsLoading(false);
    }
  }, [copy]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAlert() {
    setError("");
    setStatus(copy.statuses.creating);
    try {
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
      setAlerts((current) => [alert, ...current]);
      setStatus(copy.statuses.created(alert.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    }
  }

  async function loadPreview(alertId: string) {
    setError("");
    try {
      const data = await api.previewAlert(alertId);
      setPreview(data);
      setStatus(copy.statuses.previewLoaded(data.total_matches));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    }
  }

  async function deliver(alertId: string, dryRun: boolean) {
    setError("");
    try {
      const job = await api.deliverAlert(alertId, dryRun, 5);
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setStatus(copy.statuses.deliveryPrepared(job.status, job.message));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    }
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
      setStatus(copy.statuses.updated(updated.name));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownAlertUpdateError);
      setStatus(copy.statuses.updateError);
    } finally {
      setSavingAlertId(null);
    }
  }

  async function deleteAlert(alert: Alert) {
    if (!window.confirm(copy.statuses.deleteConfirm(alert.name))) {
      return;
    }

    setSavingAlertId(alert.id);
    setError("");
    try {
      await api.deleteAlert(alert.id);
      setAlerts((current) => current.filter((item) => item.id !== alert.id));
      setPreview((current) => (current?.alert.id === alert.id ? null : current));
      setDigest((current) => (current?.alert.id === alert.id ? null : current));
      setStatus(copy.statuses.deleted(alert.name));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownAlertDeleteError);
      setStatus(copy.statuses.deleteError);
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
      setStatus(copy.statuses.digestReady(data.items.length, data.total_matches));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownDigestError);
      setStatus(copy.statuses.digestError);
    } finally {
      setSavingAlertId(null);
    }
  }

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

      <section className="panel">
        <div className="panel-header">
          <h2>{copy.sections.newAlert}</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <label className="field">
            <span>{copy.fields.name}</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.municipality}</span>
            <input
              className="input"
              placeholder={copy.placeholders.municipality}
              value={form.municipality}
              onChange={(event) =>
                setForm({ ...form, municipality: event.target.value, district: "" })
              }
            />
          </label>
          <label className="field">
            <span>{copy.fields.voivodeship}</span>
            <input
              className="input"
              placeholder={copy.placeholders.voivodeship}
              value={form.voivodeship}
              onChange={(event) => setForm({ ...form, voivodeship: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.district}</span>
            <input
              className="input"
              value={form.district}
              onChange={(event) => setForm({ ...form, district: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.search}</span>
            <input
              className="input"
              placeholder={copy.placeholders.search}
              value={form.query}
              onChange={(event) => setForm({ ...form, query: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.maxPrice}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxPrice}
              onChange={(event) => setForm({ ...form, maxPrice: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.buildingType}</span>
            <select
              className="input"
              value={form.buildingType}
              onChange={(event) => setForm({ ...form, buildingType: event.target.value })}
            >
              <option value="">{copy.options.any}</option>
              {BUILDING_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.options.buildingType[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.fields.renovationState}</span>
            <select
              className="input"
              value={form.renovationState}
              onChange={(event) => setForm({ ...form, renovationState: event.target.value })}
            >
              <option value="">{copy.options.anyFeminine}</option>
              {RENOVATION_STATE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.options.renovationState[option]}
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
            <span>{copy.fields.balcony}</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.hasTerrace}
              onChange={(event) => setForm({ ...form, hasTerrace: event.target.checked })}
            />
            <span>{copy.fields.terrace}</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.hasGarden}
              onChange={(event) => setForm({ ...form, hasGarden: event.target.checked })}
            />
            <span>{copy.fields.garden}</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.hasElevator}
              onChange={(event) => setForm({ ...form, hasElevator: event.target.checked })}
            />
            <span>{copy.fields.elevator}</span>
          </label>
          <label className="field">
            <span>{copy.fields.parking}</span>
            <select
              className="input"
              value={form.parkingType}
              onChange={(event) => setForm({ ...form, parkingType: event.target.value })}
            >
              <option value="">{copy.options.any}</option>
              {PARKING_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.options.parkingType[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.fields.heating}</span>
            <select
              className="input"
              value={form.heatingType}
              onChange={(event) => setForm({ ...form, heatingType: event.target.value })}
            >
              <option value="">{copy.options.anyFeminine}</option>
              {HEATING_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.options.heatingType[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.fields.minFloor}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minFloor}
              onChange={(event) => setForm({ ...form, minFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.maxFloor}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxFloor}
              onChange={(event) => setForm({ ...form, maxFloor: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.maxBuildingFloors}</span>
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
            <span>{copy.fields.minBuildingYear}</span>
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
            <span>{copy.fields.maxBuildingYear}</span>
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
            <span>{copy.fields.minInvestment}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minInvestment}
              onChange={(event) => setForm({ ...form, minInvestment: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.maxFairDelta}</span>
            <input
              className="input"
              inputMode="decimal"
              value={form.maxFairDelta}
              placeholder="0"
              onChange={(event) => setForm({ ...form, maxFairDelta: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.minNegotiation}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minNegotiation}
              placeholder="70"
              onChange={(event) => setForm({ ...form, minNegotiation: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.minLiquidity}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minLiquidity}
              placeholder="60"
              onChange={(event) => setForm({ ...form, minLiquidity: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.minRental}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.minRental}
              placeholder="70"
              onChange={(event) => setForm({ ...form, minRental: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.minPriceReductions}</span>
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
            <span>{copy.fields.maxDaysOnMarket}</span>
            <input
              className="input"
              inputMode="numeric"
              value={form.maxDaysOnMarket}
              placeholder="30"
              onChange={(event) => setForm({ ...form, maxDaysOnMarket: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{copy.fields.channel}</span>
            <select
              className="input"
              value={form.channel}
              onChange={(event) =>
                setForm({ ...form, channel: event.target.value as AlertChannel })
              }
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.options.channel[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.fields.frequency}</span>
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
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.options.frequency[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.fields.deliveryTarget}</span>
            <input
              className="input"
              placeholder={
                form.channel === "telegram"
                  ? copy.placeholders.telegramTarget
                  : copy.placeholders.emailTarget
              }
              value={form.deliveryTarget}
              onChange={(event) => setForm({ ...form, deliveryTarget: event.target.value })}
            />
          </label>
          <button className="button primary" type="button" onClick={() => void createAlert()}>
            <Bell size={16} /> {copy.actions.create}
          </button>
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>{copy.sections.alerts}</h2>
            <span className="muted">{copy.values.items(alerts.length)}</span>
          </div>
          <div className="panel-body">
            {error ? (
              <ErrorBlock message={error} prefix={copy.errorPrefix} />
            ) : alerts.length === 0 && isLoading ? (
              <LoadingBlock label={copy.empty.loading} />
            ) : alerts.length === 0 ? (
              <EmptyBlock label={copy.empty.noAlerts} />
            ) : (
              <div className="listing-list">
                {alerts.map((alert) => (
                  <article className="listing-card" key={alert.id}>
                    <div>
                      <h3>{alert.name}</h3>
                      <div className="meta-row">
                        <span>{copy.options.frequency[alert.frequency]}</span>
                        <span>{copy.options.channel[alert.channel]}</span>
                        <span>{alert.delivery_target ?? copy.values.defaultTarget}</span>
                        <span>{alert.is_active ? copy.values.active : copy.values.paused}</span>
                      </div>
                      <div className="meta-row">
                        {Object.entries(alert.filters)
                          .filter(([, value]) => value !== null && value !== undefined)
                          .map(([key, value]) => (
                            <span key={key}>
                              {filterLabel(key, copy)}: {formatFilterValue(key, value, locale, copy)}
                            </span>
                          ))}
                      </div>
                      <div className="alert-preferences">
                        <label className="field compact-field">
                          <span>{copy.fields.frequency}</span>
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
                            {FREQUENCY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {copy.options.frequency[option]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field compact-field">
                          <span>{copy.fields.channel}</span>
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
                            {CHANNEL_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {copy.options.channel[option]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field compact-field">
                          <span>{copy.fields.deliveryTarget}</span>
                          <input
                            key={`${alert.id}-${alert.delivery_target ?? copy.values.defaultTarget}`}
                            className="input"
                            defaultValue={alert.delivery_target ?? ""}
                            disabled={savingAlertId === alert.id}
                            placeholder={
                              alert.channel === "telegram"
                                ? copy.placeholders.telegramTarget
                                : copy.placeholders.emailTarget
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
                          <span>{alert.is_active ? copy.values.active : copy.values.paused}</span>
                        </label>
                      </div>
                      {savingAlertId === alert.id ? (
                        <div className="meta-row">
                          <span>{copy.statuses.saving}</span>
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
                        <Eye size={16} /> {copy.actions.preview}
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void deliver(alert.id, true)}
                      >
                        <Send size={16} /> {copy.actions.dryRun}
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void deliver(alert.id, false)}
                      >
                        <Send size={16} /> {copy.actions.checkSend}
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void buildRealtorDigest(alert.id)}
                      >
                        <FileText size={16} /> {copy.actions.clientDigest}
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        disabled={savingAlertId === alert.id}
                        onClick={() => void deleteAlert(alert)}
                      >
                        <Trash2 size={16} /> {copy.actions.delete}
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
            <h2>{copy.sections.preview}</h2>
            <span className="muted">{copy.values.matches(preview ? preview.total_matches : 0)}</span>
          </div>
          <div className="panel-body">
            {!preview ? (
              <EmptyBlock label={copy.empty.previewPrompt} />
            ) : (
              <div className="listing-list">
                {preview.matches.map((match) => (
                  <article className="listing-card" key={match.listing.id}>
                    <div>
                      <h3>{match.listing.title}</h3>
                      <div className="meta-row">
                        <span>{money(match.listing.price, locale)}</span>
                        <span>
                          {copy.values.scoreLabels.investment} {match.scores.investment_score}
                        </span>
                        <span>
                          {copy.values.scoreLabels.risk} {match.scores.risk_score}
                        </span>
                        <span>
                          {copy.values.scoreLabels.fairDelta}{" "}
                          {percent(match.scores.price_delta_to_fair_mid_pct, locale)}
                        </span>
                        <span>
                          {copy.values.scoreLabels.negotiation}{" "}
                          {match.scores.negotiation_score}
                        </span>
                        <span>
                          {copy.values.scoreLabels.liquidity} {match.scores.liquidity_score}
                        </span>
                        <span>
                          {copy.values.scoreLabels.rental}{" "}
                          {match.scores.rental_potential_score}
                        </span>
                        <span>{copy.values.priceDrops(match.listing.price_reductions)}</span>
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
          <h2>{copy.sections.realtorDigest}</h2>
          <span className="muted">
            {digest
              ? copy.values.digestMatches(digest.items.length, digest.total_matches)
              : copy.values.notGenerated}
          </span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>{copy.fields.client}</span>
              <input
                className="input"
                placeholder={copy.placeholders.clientName}
                value={digestForm.clientName}
                onChange={(event) =>
                  setDigestForm({ ...digestForm, clientName: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>{copy.fields.intro}</span>
              <input
                className="input"
                placeholder={copy.placeholders.digestIntro}
                value={digestForm.intro}
                onChange={(event) =>
                  setDigestForm({ ...digestForm, intro: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>{copy.fields.maxMatches}</span>
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
              <span>{copy.fields.includeSourceLinks}</span>
            </label>
          </div>
          {!digest ? (
            <EmptyBlock label={copy.empty.digestPrompt} />
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
                        <span>{money(item.price, locale)}</span>
                        <span>{copy.values.rooms(item.rooms)}</span>
                        <span>{numberValue(item.area_m2, locale)} m2</span>
                        <span>
                          {copy.values.scoreLabels.fairDelta}{" "}
                          {percent(item.price_delta_to_fair_mid_pct, locale)}
                        </span>
                        <span>
                          {copy.values.scoreLabels.negotiation} {item.negotiation_score}
                        </span>
                        <span>
                          {copy.values.scoreLabels.liquidity} {item.liquidity_score}
                        </span>
                        <span>
                          {copy.values.scoreLabels.rental} {item.rental_potential_score}
                        </span>
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
          <h2>{copy.sections.deliveryHistory}</h2>
          <span className="muted">{copy.values.items(jobs.length)}</span>
        </div>
        <div className="panel-body">
          {jobs.length === 0 ? (
            <EmptyBlock label={copy.empty.noDeliveryJobs} />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{copy.table.channel}</th>
                  <th>{copy.table.status}</th>
                  <th>{copy.table.matches}</th>
                  <th>{copy.table.message}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.provider}</td>
                    <td>{job.status}</td>
                    <td>{numberValue(job.total_matches, locale)}</td>
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

function filterLabel(key: string, copy: AlertsPageCopy) {
  return copy.values.filterLabels[key] ?? key;
}

function formatFilterValue(
  key: string,
  value: unknown,
  locale: Locale,
  copy: AlertsPageCopy,
) {
  if (typeof value === "boolean") {
    return value ? copy.values.yes : copy.values.no;
  }
  if (typeof value === "number") {
    if (key === "max_price") return money(value, locale);
    if (key === "min_area_m2") return `${numberValue(value, locale)} m2`;
    if (key.endsWith("_pct")) return percent(value, locale);
    return numberValue(value, locale);
  }
  if (typeof value === "string") {
    if (key === "building_type") return copy.options.buildingType[value] ?? value;
    if (key === "renovation_state") return copy.options.renovationState[value] ?? value;
    if (key === "parking_type") return copy.options.parkingType[value] ?? value;
    if (key === "heating_type") return copy.options.heatingType[value] ?? value;
    return value;
  }
  return String(value);
}
