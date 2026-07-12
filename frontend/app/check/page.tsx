"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  ExternalLink,
  FileText,
  Link2,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";

import { ErrorBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type GeneratedReport,
  type SourceReferencePreview,
  type SourceUrlImportFields,
  type SourceUrlImportResult,
  type UserSubmittedListingAnalysis,
  type UserSubmittedListingReport,
  type UserSubmittedListingRequest,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import { decisionTone, scoreLabel } from "@/lib/scoreLabels";

type CheckFormState = {
  title: string;
  source_url: string;
  address: string;
  city: string;
  district: string;
  market_type: "primary" | "secondary";
  price: string;
  area_m2: string;
  rooms: string;
  floor: string;
  building_floors: string;
  building_year: string;
  confirm_private_analysis: boolean;
};

const DEFAULT_FORM: CheckFormState = {
  title: "",
  source_url: "",
  address: "Nowy Dwór, Wrocław",
  city: "Wrocław",
  district: "Fabryczna",
  market_type: "secondary",
  price: "675000",
  area_m2: "58.4",
  rooms: "3",
  floor: "3",
  building_floors: "6",
  building_year: "2014",
  confirm_private_analysis: true,
};

const DISTRICTS = ["Fabryczna", "Krzyki", "Psie Pole"];

export default function CheckListingPage() {
  const [form, setForm] = useState<CheckFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<UserSubmittedListingAnalysis | null>(null);
  const [referencePreview, setReferencePreview] =
    useState<SourceReferencePreview | null>(null);
  const [urlImportResult, setUrlImportResult] =
    useState<SourceUrlImportResult | null>(null);
  const [reportResult, setReportResult] = useState<UserSubmittedListingReport | null>(null);
  const [savedReport, setSavedReport] = useState<GeneratedReport | null>(null);
  const [status, setStatus] = useState("Готово к проверке");
  const [referenceStatus, setReferenceStatus] = useState("Ссылка не добавлена");
  const [urlImportStatus, setUrlImportStatus] = useState("Автоимпорт не запускался");
  const [reportStatus, setReportStatus] = useState("Отчет не создан");
  const [saveStatus, setSaveStatus] = useState("Не сохранен");
  const [error, setError] = useState("");

  async function analyze(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setStatus("Расчет...");
    try {
      const payload = await api.analyzeUserSubmittedListing(buildListingPayload(form));
      setResult(payload);
      setReportResult(null);
      setSavedReport(null);
      setStatus("Проверка готова");
      setReportStatus("Отчет не создан");
      setSaveStatus("Не сохранен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Ошибка проверки");
    }
  }

  async function previewReference() {
    setError("");
    setReferenceStatus("Проверка ссылки...");
    try {
      const preview = await api.previewUserSubmittedListingReference(form.source_url);
      setReferencePreview(preview);
      setReferenceStatus(`${preview.provider_label}: ссылка принята как private reference`);
      if (preview.suggested_title && !form.title.trim()) {
        setForm((current) => ({ ...current, title: preview.suggested_title ?? "" }));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setReferenceStatus("Ошибка ссылки");
    }
  }

  async function importFromUrl() {
    setError("");
    setReferenceStatus("Загрузка ссылки...");
    setUrlImportStatus("Автоимпорт...");
    try {
      const payload = await api.importUserSubmittedListingFromUrl(form.source_url);
      setUrlImportResult(payload);
      setReferencePreview(payload.reference_preview);
      applyImportedFields(payload.fields);
      setReferenceStatus(`${payload.reference_preview.provider_label}: private reference`);
      setUrlImportStatus(urlImportStatusLabel(payload));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setReferenceStatus("Ошибка ссылки");
      setUrlImportStatus("Ошибка автоимпорта");
    }
  }

  async function createReport() {
    setError("");
    setReportStatus("Генерация...");
    try {
      const payload = await api.createUserSubmittedListingReport({
        ...buildListingPayload(form),
        audience: "buyer",
      });
      setResult(payload.analysis);
      setReportResult(payload);
      setSavedReport(null);
      setStatus("Проверка готова");
      setReportStatus("Отчет готов");
      setSaveStatus("Не сохранен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setReportStatus("Ошибка отчета");
    }
  }

  async function saveReportToHistory() {
    if (!result?.draft_id) return;
    setError("");
    setSaveStatus("Сохранение...");
    try {
      const payload = await api.generateUserSubmittedDraftReport(result.draft_id, {
        audience: "buyer",
        report_format: "html",
      });
      setSavedReport(payload);
      setSaveStatus("Сохранен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setSaveStatus("Ошибка сохранения");
    }
  }

  function updateField<K extends keyof CheckFormState>(key: K, value: CheckFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyImportedFields(fields: SourceUrlImportFields) {
    setForm((current) => ({
      ...current,
      title: fields.title ?? current.title,
      address: fields.address ?? current.address,
      city: fields.city ?? current.city,
      district: normalizeDistrict(fields.district) ?? current.district,
      market_type: fields.market_type ?? current.market_type,
      price: fields.price ? String(fields.price) : current.price,
      area_m2: fields.area_m2 ? String(fields.area_m2) : current.area_m2,
      rooms: fields.rooms ? String(fields.rooms) : current.rooms,
      floor: fields.floor !== null && fields.floor !== undefined ? String(fields.floor) : current.floor,
      building_floors: fields.building_floors
        ? String(fields.building_floors)
        : current.building_floors,
      building_year: fields.building_year ? String(fields.building_year) : current.building_year,
    }));
  }

  const analysis = result?.analysis ?? null;
  const verdictTone = analysis ? decisionTone(analysis.scores) : "info";

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Проверить квартиру</h1>
          <p>Адрес, параметры объекта, fair price, риски, торг и ближайшие аналоги.</p>
        </div>
        <div className="button-row">
          <Link className="button" href="/check/drafts">
            <FileText size={16} /> История
          </Link>
          <button
            className="button"
            disabled={!form.confirm_private_analysis}
            type="button"
            onClick={() => void createReport()}
          >
            <FileText size={16} /> Получить отчет
          </button>
          <button
            className="button primary"
            disabled={!form.confirm_private_analysis}
            type="button"
            onClick={() => void analyze()}
          >
            <ClipboardCheck size={16} /> Проверить
          </button>
        </div>
      </header>

      {error ? <ErrorBlock message={error} /> : null}

      <section className="panel">
        <div className="panel-header">
          <h2>Ссылка объявления</h2>
          <span className="status-line">{referenceStatus}</span>
        </div>
        <div className="panel-body">
          <div className="form-grid compact">
            <label className="field">
              <span>Otodom / OLX URL</span>
              <input
                className="input"
                placeholder="https://www.otodom.pl/..."
                type="url"
                value={form.source_url}
                onChange={(event) => {
                  updateField("source_url", event.target.value);
                  setReferencePreview(null);
                  setUrlImportResult(null);
                  setReferenceStatus("Ссылка не проверена");
                  setUrlImportStatus("Автоимпорт не запускался");
                }}
              />
            </label>
            <button
              className="button"
              disabled={!form.source_url.trim()}
              type="button"
              onClick={() => void previewReference()}
            >
              <Link2 size={16} /> Принять ссылку
            </button>
            <button
              className="button"
              disabled={!form.source_url.trim()}
              type="button"
              onClick={() => void importFromUrl()}
            >
              <RefreshCw size={16} /> Автозаполнить
            </button>
            <button
              className="button primary"
              disabled={!form.confirm_private_analysis}
              type="button"
              onClick={() => void createReport()}
            >
              <FileText size={16} /> Ссылка + параметры → отчет
            </button>
          </div>
          <p className="status-line" style={{ marginTop: 12 }}>{urlImportStatus}</p>
          {referencePreview ? (
            <div className="metric-grid compact" style={{ marginTop: 12 }}>
              <div className="metric">
                <span>Provider</span>
                <strong>{referencePreview.provider_label}</strong>
              </div>
              <div className="metric">
                <span>Domain</span>
                <strong>{referencePreview.source_domain ?? "manual"}</strong>
              </div>
              <div className="metric">
                <span>Reference</span>
                <strong>{referencePreview.listing_reference_id ?? "—"}</strong>
              </div>
              <div className="metric">
                <span>Required fields</span>
                <strong>{referencePreview.manual_fields_required.length}</strong>
              </div>
            </div>
          ) : null}
          {urlImportResult ? (
            <div className="metric-grid compact" style={{ marginTop: 12 }}>
              <div className="metric">
                <span>Import status</span>
                <strong>{urlImportResult.status}</strong>
              </div>
              <div className="metric">
                <span>Extracted</span>
                <strong>{urlImportResult.fields_extracted.length}</strong>
              </div>
              <div className="metric">
                <span>HTTP</span>
                <strong>{urlImportResult.fetch_status_code ?? "—"}</strong>
              </div>
              <div className="metric">
                <span>Source</span>
                <strong>{urlImportResult.extraction_source ?? "—"}</strong>
              </div>
            </div>
          ) : null}
          {referencePreview ? (
            <ul className="section-list compact" style={{ marginTop: 12 }}>
              {[...referencePreview.warnings, ...(urlImportResult?.warnings ?? [])].map(
                (warning, index) => (
                  <li key={`${index}-${warning}`}>{warning}</li>
                ),
              )}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric">
          <span>Вердикт</span>
          <strong>{analysis ? scoreLabel(analysis.scores.decision_label) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Investment Score</span>
          <strong>{analysis ? analysis.scores.investment_score : "—"}</strong>
        </div>
        <div className="metric">
          <span>Risk Score</span>
          <strong>{analysis ? analysis.scores.risk_score : "—"}</strong>
        </div>
        <div className="metric">
          <span>Fair price mid</span>
          <strong>{analysis ? money(analysis.scores.fair_price_mid) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Confidence</span>
          <strong>{result ? `${result.confidence_score}/100` : "—"}</strong>
        </div>
        <div className="metric">
          <span>Price label</span>
          <strong>{analysis ? scoreLabel(analysis.scores.price_label) : "—"}</strong>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <form className="panel" onSubmit={(event) => void analyze(event)}>
          <div className="panel-header">
            <h2>Параметры объекта</h2>
            <button
              className="button"
              disabled={!form.confirm_private_analysis}
              type="submit"
            >
              <RefreshCw size={16} /> Обновить
            </button>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <label className="field">
                <span>Название</span>
                <input
                  className="input"
                  placeholder="optional"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Адрес</span>
                <input
                  className="input"
                  required
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Город</span>
                <input
                  className="input"
                  required
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Район</span>
                <select
                  className="select"
                  value={form.district}
                  onChange={(event) => updateField("district", event.target.value)}
                >
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Рынок</span>
                <select
                  className="select"
                  value={form.market_type}
                  onChange={(event) =>
                    updateField("market_type", event.target.value as CheckFormState["market_type"])
                  }
                >
                  <option value="secondary">secondary</option>
                  <option value="primary">primary</option>
                </select>
              </label>
              <NumberField
                label="Цена"
                value={form.price}
                onChange={(value) => updateField("price", value)}
              />
              <NumberField
                label="Площадь m2"
                step="0.1"
                value={form.area_m2}
                onChange={(value) => updateField("area_m2", value)}
              />
              <NumberField
                label="Комнаты"
                value={form.rooms}
                onChange={(value) => updateField("rooms", value)}
              />
              <NumberField
                label="Этаж"
                value={form.floor}
                onChange={(value) => updateField("floor", value)}
              />
              <NumberField
                label="Этажей в доме"
                value={form.building_floors}
                onChange={(value) => updateField("building_floors", value)}
              />
              <NumberField
                label="Год дома"
                value={form.building_year}
                onChange={(value) => updateField("building_year", value)}
              />
            </div>

            <label className="compare-toggle" style={{ marginTop: 12 }}>
              <input
                checked={form.confirm_private_analysis}
                type="checkbox"
                onChange={(event) =>
                  updateField("confirm_private_analysis", event.target.checked)
                }
              />
              <ShieldCheck size={16} />
              <span>private analysis</span>
            </label>
            <p className="status-line">{status}</p>
            <p className="status-line">{reportStatus}</p>
            <p className="status-line">{saveStatus}</p>
          </div>
        </form>

        <aside className="panel">
          <div className="panel-header">
            <h2>Итог проверки</h2>
            {analysis ? (
              <span className={`status-pill ${verdictTone}`}>
                {scoreLabel(analysis.scores.decision_label)}
              </span>
            ) : null}
          </div>
          <div className="panel-body">
            {analysis && result ? (
              <>
                <ul className="section-list compact">
                  <li>
                    <span>Цена объекта</span>
                    <strong>{money(analysis.listing.price)}</strong>
                  </li>
                  <li>
                    <span>Цена за m2</span>
                    <strong>{money(analysis.listing.price_per_m2)}</strong>
                  </li>
                  <li>
                    <span>Fair price range</span>
                    <strong>
                      {money(analysis.scores.fair_price_low)} -{" "}
                      {money(analysis.scores.fair_price_high)}
                    </strong>
                  </li>
                  <li>
                    <span>Comparable listings</span>
                    <strong>{analysis.comparables.length}</strong>
                  </li>
                  <li>
                    <span>Source domain</span>
                    <strong>{result.source_domain ?? "manual input"}</strong>
                  </li>
                  <li>
                    <span>Private draft</span>
                    <strong>{result.draft_id ? shortId(result.draft_id) : "not saved"}</strong>
                  </li>
                  <li>
                    <span>Expires</span>
                    <strong>{result.draft_expires_at ? dateLabel(result.draft_expires_at) : "—"}</strong>
                  </li>
                </ul>
                <ul className="section-list" style={{ marginTop: 12 }}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="empty-state">Введите параметры и запустите проверку.</div>
            )}
          </div>
        </aside>
      </section>

      {analysis ? (
        <section className="grid-2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <h2>Выводы</h2>
            </div>
            <div className="panel-body">
              <ul className="section-list">
                {analysis.insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="panel">
            <div className="panel-header">
              <h2>Торг</h2>
            </div>
            <div className="panel-body">
              <ul className="section-list">
                {analysis.negotiation_arguments.map((argument) => (
                  <li key={argument}>{argument}</li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      ) : null}

      {analysis ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>База сравнения</h2>
            <span className="status-pill info">{result?.comparables_basis}</span>
          </div>
          <div className="panel-body">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Объект</th>
                    <th>Район</th>
                    <th>Цена</th>
                    <th>m2</th>
                    <th>Комнаты</th>
                    <th>Цена/m2</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.comparables.map((listing) => (
                    <tr key={listing.id}>
                      <td>{listing.title}</td>
                      <td>{listing.district}</td>
                      <td>{money(listing.price)}</td>
                      <td>{numberValue(listing.area_m2)}</td>
                      <td>{listing.rooms}</td>
                      <td>{money(listing.price_per_m2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">{result?.retention_note}</p>
          </div>
        </section>
      ) : null}

      {reportResult ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>Buyer report</h2>
            <div className="button-row">
              {savedReport ? (
                <a
                  className="button"
                  href={reportContentUrl(savedReport.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} /> HTML
                </a>
              ) : null}
              <button
                className="button"
                disabled={!result?.draft_id}
                type="button"
                onClick={() => void saveReportToHistory()}
              >
                <Save size={16} /> Сохранить
              </button>
              <span className="status-pill info">{reportResult.report.template_name}</span>
            </div>
          </div>
          <div className="panel-body">
            <p className="empty-state">{reportResult.report.summary}</p>
            <div className="grid-2" style={{ marginTop: 12 }}>
              {reportResult.report.sections.map((section) => (
                <section key={section.title}>
                  <div className="panel-header inline">
                    <h3>{section.title}</h3>
                  </div>
                  <ul className="section-list">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <p className="muted">{reportResult.report.disclaimer}</p>
          </div>
        </section>
      ) : null}
    </>
  );
}

function buildListingPayload(form: CheckFormState): UserSubmittedListingRequest {
  return {
    title: form.title.trim() || null,
    source_url: form.source_url.trim() || null,
    address: form.address.trim(),
    city: form.city.trim() || "Wrocław",
    district: form.district,
    market_type: form.market_type,
    price: toNumber(form.price),
    area_m2: toNumber(form.area_m2),
    rooms: toNumber(form.rooms),
    floor: toOptionalNumber(form.floor),
    building_floors: toOptionalNumber(form.building_floors),
    building_year: toOptionalNumber(form.building_year),
    confirm_private_analysis: form.confirm_private_analysis,
    save_private_draft: true,
    retention_days: 30,
  };
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        inputMode="decimal"
        min="0"
        step={step ?? "1"}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function toNumber(value: string) {
  return Number(value || 0);
}

function toOptionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function normalizeDistrict(value: string | null) {
  if (!value) return null;
  const normalized = value.toLocaleLowerCase("pl-PL");
  return (
    DISTRICTS.find((district) => normalized.includes(district.toLocaleLowerCase("pl-PL"))) ??
    null
  );
}

function urlImportStatusLabel(result: SourceUrlImportResult) {
  if (result.status === "extracted") {
    return `Автоимпорт: заполнено ${result.fields_extracted.length} полей`;
  }
  if (result.status === "partial") {
    return `Автоимпорт частичный: заполнено ${result.fields_extracted.length} полей`;
  }
  if (result.status === "unsupported") {
    return "Автоимпорт доступен только для Otodom/OLX";
  }
  return "Автоимпорт не получил параметры, заполните поля вручную";
}
