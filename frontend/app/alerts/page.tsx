"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Building2, Eye, RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type Alert,
  type AlertChannel,
  type AlertFrequency,
  type AlertPreview,
  type AlertUpdate,
} from "@/lib/api";
import { money, percent } from "@/lib/format";
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
const ALERT_PRODUCT_COPY = {
  en: {
    title: "Track apartments",
    subtitle: "Get notified when prices change, listings disappear or better comparable apartments appear.",
    newAlert: "Track apartments like these",
    create: "Start tracking",
    advanced: "Advanced settings",
    apartmentWatch: "Track this apartment",
    searchWatch: "Track apartments like these",
    apartmentWatchDescription: "Open My apartments, choose a checked apartment and turn on tracking from its card.",
    searchWatchDescription: "Create a simple search watch for new apartments, price drops and better comparable options.",
    activeTracks: "Active tracking",
    whatHappens: "What Domarion watches",
    previewTitle: "Matching apartments and signals",
    previewPrompt: "Choose a tracked search to see current matching apartments and changes.",
    noAlerts: "No tracking yet. Start from a checked apartment or create a search watch below.",
    location: "Location",
    price: "Price",
    delivery: "Updates",
  },
  pl: {
    title: "Śledź mieszkania",
    subtitle: "Otrzymuj informacje o zmianie ceny, zniknięciu ogłoszenia albo pojawieniu się lepszych podobnych mieszkań.",
    newAlert: "Śledź podobne mieszkania",
    create: "Włącz śledzenie",
    advanced: "Ustawienia zaawansowane",
    apartmentWatch: "Śledź to mieszkanie",
    searchWatch: "Śledź podobne mieszkania",
    apartmentWatchDescription: "Otwórz Moje mieszkania, wybierz sprawdzone mieszkanie i włącz śledzenie z karty.",
    searchWatchDescription: "Utwórz proste śledzenie wyszukiwania dla nowych mieszkań, obniżek cen i lepszych podobnych ofert.",
    activeTracks: "Aktywne śledzenie",
    whatHappens: "Co obserwuje Domarion",
    previewTitle: "Pasujące mieszkania i sygnały",
    previewPrompt: "Wybierz śledzone wyszukiwanie, aby zobaczyć aktualne mieszkania i zmiany.",
    noAlerts: "Nie masz jeszcze śledzenia. Zacznij od sprawdzonego mieszkania albo utwórz śledzenie wyszukiwania poniżej.",
    location: "Lokalizacja",
    price: "Cena",
    delivery: "Aktualizacje",
  },
  ru: {
    title: "Следите за квартирами",
    subtitle: "Получайте уведомления о снижении цены, исчезновении объявления или появлении лучшего похожего варианта.",
    newAlert: "Следить за похожими квартирами",
    create: "Включить отслеживание",
    advanced: "Дополнительные настройки",
    apartmentWatch: "Следить за этой квартирой",
    searchWatch: "Следить за похожими квартирами",
    apartmentWatchDescription: "Откройте Мои квартиры, выберите проверенную квартиру и включите отслеживание с карточки.",
    searchWatchDescription: "Создайте простое отслеживание поиска для новых квартир, снижений цены и лучших похожих вариантов.",
    activeTracks: "Активное отслеживание",
    whatHappens: "Что отслеживает Domarion",
    previewTitle: "Подходящие квартиры и сигналы",
    previewPrompt: "Выберите отслеживаемый поиск, чтобы увидеть текущие квартиры и изменения.",
    noAlerts: "Отслеживания пока нет. Начните с проверенной квартиры или создайте отслеживание поиска ниже.",
    location: "Локация",
    price: "Цена",
    delivery: "Обновления",
  },
  uk: {
    title: "Стежте за квартирами",
    subtitle: "Отримуйте сповіщення про зниження ціни, зникнення оголошення або появу кращого схожого варіанта.",
    newAlert: "Стежити за схожими квартирами",
    create: "Увімкнути стеження",
    advanced: "Додаткові налаштування",
    apartmentWatch: "Стежити за цією квартирою",
    searchWatch: "Стежити за схожими квартирами",
    apartmentWatchDescription: "Відкрийте Мої квартири, виберіть перевірену квартиру й увімкніть стеження з картки.",
    searchWatchDescription: "Створіть просте стеження пошуку для нових квартир, знижень ціни й кращих схожих варіантів.",
    activeTracks: "Активне стеження",
    whatHappens: "Що відстежує Domarion",
    previewTitle: "Відповідні квартири й сигнали",
    previewPrompt: "Виберіть відстежуваний пошук, щоб побачити поточні квартири й зміни.",
    noAlerts: "Стеження поки немає. Почніть із перевіреної квартири або створіть стеження пошуку нижче.",
    location: "Локація",
    price: "Ціна",
    delivery: "Оновлення",
  },
} as const;

type AlertProductCopy = (typeof ALERT_PRODUCT_COPY)[Locale];

export default function AlertsPage() {
  const { locale } = useLocalePreference();
  const copy = ALERTS_PAGE_COPY[locale];
  const product = ALERT_PRODUCT_COPY[locale];
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [preview, setPreview] = useState<AlertPreview | null>(null);
  const [status, setStatus] = useState(copy.statuses.loading);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingAlertId, setSavingAlertId] = useState<string | null>(null);
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
    rooms: "",
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
      const alertData = await api.listAlerts();
      setAlerts(alertData);
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
          alert_kind: "saved_search",
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
          rooms: form.rooms ? Number(form.rooms) : null,
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
      setStatus(copy.statuses.deleted(alert.name));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownAlertDeleteError);
      setStatus(copy.statuses.deleteError);
    } finally {
      setSavingAlertId(null);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{product.title}</h1>
          <p>{product.subtitle}</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> {copy.actions.refresh}
        </button>
      </header>

      <section className="alert-intent-grid">
        <Link className="alert-intent-card primary" href="/check/drafts">
          <Building2 size={18} />
          <span>
            <strong>{product.apartmentWatch}</strong>
            <small>{product.apartmentWatchDescription}</small>
          </span>
        </Link>
        <a className="alert-intent-card" href="#track-search">
          <Search size={18} />
          <span>
            <strong>{product.searchWatch}</strong>
            <small>{product.searchWatchDescription}</small>
          </span>
        </a>
      </section>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>{product.activeTracks}</h2>
            <span className="muted">{copy.values.items(alerts.length)}</span>
          </div>
          <div className="panel-body">
            {error ? (
              <ErrorBlock message={error} prefix={copy.errorPrefix} />
            ) : alerts.length === 0 && isLoading ? (
              <LoadingBlock label={copy.empty.loading} />
            ) : alerts.length === 0 ? (
              <EmptyBlock label={product.noAlerts} />
            ) : (
              <div className="listing-list">
                {alerts.map((alert) => (
                  <article className="alert-track-card" key={alert.id}>
                    <div>
                      <div className="panel-header inline">
                        <div>
                          <h3>{alert.name}</h3>
                          <p className="muted">{alertKindLabel(alert, product)}</p>
                        </div>
                        <span className={`status-pill ${alert.is_active ? "healthy" : "warning"}`}>
                          {alert.is_active ? copy.values.active : copy.values.paused}
                        </span>
                      </div>

                      <div className="alert-summary-grid">
                        {alertSummaryItems(alert, locale, copy, product).map((item) => (
                          <div key={item.label}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="alert-watch-list">
                        <span>{product.whatHappens}</span>
                        <div className="meta-row">
                          {watchedEventLabels(alert, locale).map((label) => (
                            <span className="status-pill info" key={label}>
                              {label}
                            </span>
                          ))}
                        </div>
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
            <h2>{product.previewTitle}</h2>
            <span className="muted">{copy.values.matches(preview ? preview.total_matches : 0)}</span>
          </div>
          <div className="panel-body">
            {!preview ? (
              <EmptyBlock label={product.previewPrompt} />
            ) : (
              <div className="listing-list">
                {preview.watch_events.map((event) => (
                  <article className="alert-event-card" key={`${event.trigger_type}-${event.title}`}>
                    <span className={`status-pill ${eventSeverityTone(event.severity)}`}>
                      {watchEventLabel(event.trigger_type, locale)}
                    </span>
                    <h3>{event.title}</h3>
                    <p>{event.summary}</p>
                    {event.current_value || event.baseline_value ? (
                      <small>
                        {[event.baseline_value, event.current_value].filter(Boolean).join(" -> ")}
                      </small>
                    ) : null}
                  </article>
                ))}
                {preview.matches.map((match) => (
                  <article className="alert-match-card" key={match.listing.id}>
                    <div>
                      <h3>{match.listing.title}</h3>
                      <div className="meta-row">
                        <span>{money(match.listing.price, locale)}</span>
                        <span>
                          {copy.values.scoreLabels.fairDelta}:{" "}
                          {percent(match.scores.price_delta_to_fair_mid_pct, locale)}
                        </span>
                        <span>
                          {copy.values.scoreLabels.negotiation}:{" "}
                          {match.scores.negotiation_score}
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

      <section className="panel" id="track-search" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{product.newAlert}</h2>
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
            <span>{copy.fields.rooms}</span>
            <select
              className="input"
              value={form.rooms}
              onChange={(event) => setForm({ ...form, rooms: event.target.value })}
            >
              <option value="">{copy.options.any}</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4+</option>
            </select>
          </label>
          <details className="advanced-filters">
            <summary>{product.advanced}</summary>
            <div className="advanced-filter-grid">
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
            </div>
          </details>
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
            <Bell size={16} /> {product.create}
          </button>
        </div>
      </section>
    </>
  );
}

function alertKindLabel(alert: Alert, product: AlertProductCopy) {
  return alert.filters.alert_kind === "object_watch"
    ? product.apartmentWatch
    : product.searchWatch;
}

function alertSummaryItems(
  alert: Alert,
  locale: Locale,
  copy: AlertsPageCopy,
  product: AlertProductCopy,
) {
  const location = [
    alert.filters.municipality,
    alert.filters.city,
    alert.filters.district,
  ].filter(Boolean);
  const price = alert.filters.max_price
    ? money(alert.filters.max_price, locale)
    : copy.options.any;
  const rooms = alert.filters.rooms ? copy.values.rooms(alert.filters.rooms) : copy.options.any;
  const delivery = [
    copy.options.frequency[alert.frequency],
    copy.options.channel[alert.channel],
  ].join(" · ");

  return [
    {
      label: product.location,
      value: location.length > 0 ? location.join(", ") : copy.options.any,
    },
    { label: product.price, value: price },
    { label: copy.fields.rooms, value: rooms },
    { label: product.delivery, value: delivery },
  ];
}

function watchedEventLabels(alert: Alert, locale: Locale) {
  const triggers = alert.filters.object_watch_triggers;
  if (triggers && triggers.length > 0) {
    return triggers.map((trigger) => watchEventLabel(trigger, locale));
  }
  const labels: Record<Locale, string[]> = {
    en: ["New matching apartments", "Price reductions", "Better comparable apartments"],
    pl: ["Nowe pasujące mieszkania", "Obniżki cen", "Lepsze podobne oferty"],
    ru: ["Новые подходящие квартиры", "Снижения цен", "Лучшие похожие варианты"],
    uk: ["Нові відповідні квартири", "Зниження цін", "Кращі схожі варіанти"],
  };
  return labels[locale];
}

function watchEventLabel(trigger: string, locale: Locale) {
  const labels: Record<Locale, Record<string, string>> = {
    en: {
      price_change: "Price changed",
      cheaper_comparable: "Cheaper comparable appeared",
      days_on_market_threshold: "Listing is still active",
      planned_investment_status: "Area plans changed",
      developer_signal: "Developer signal changed",
      negotiation_opportunity: "Negotiation opportunity",
    },
    pl: {
      price_change: "Cena się zmieniła",
      cheaper_comparable: "Pojawiła się tańsza podobna oferta",
      days_on_market_threshold: "Ogłoszenie nadal jest aktywne",
      planned_investment_status: "Zmieniły się plany w okolicy",
      developer_signal: "Zmienił się sygnał o deweloperze",
      negotiation_opportunity: "Szansa na negocjacje",
    },
    ru: {
      price_change: "Цена изменилась",
      cheaper_comparable: "Появился более дешевый аналог",
      days_on_market_threshold: "Объявление все еще активно",
      planned_investment_status: "Изменились планы района",
      developer_signal: "Изменился сигнал о застройщике",
      negotiation_opportunity: "Возможность торга",
    },
    uk: {
      price_change: "Ціна змінилася",
      cheaper_comparable: "З'явився дешевший схожий варіант",
      days_on_market_threshold: "Оголошення досі активне",
      planned_investment_status: "Змінилися плани району",
      developer_signal: "Змінився сигнал про забудовника",
      negotiation_opportunity: "Можливість торгу",
    },
  };
  return labels[locale][trigger] ?? trigger;
}

function eventSeverityTone(severity: string) {
  if (severity === "opportunity") return "healthy";
  if (severity === "risk") return "rejected";
  if (severity === "watch") return "warning";
  return "info";
}
