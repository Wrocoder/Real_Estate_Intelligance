"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Mail, RefreshCw } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  reportExportUrl,
  reportContentUrl,
  reportPdfUrl,
  type AccountSummary,
  type AIInsightListItem,
  type GeneratedReportListItem,
  type ReportBranding,
} from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<GeneratedReportListItem[]>([]);
  const [insights, setInsights] = useState<AIInsightListItem[]>([]);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [listingId, setListingId] = useState("wr-001");
  const [audience, setAudience] = useState<"buyer" | "realtor" | "investor">("buyer");
  const [branding, setBranding] = useState<ReportBranding>({
    agency_name: "Domarion Realty",
    agent_name: "Anna Kowalska",
    agent_email: "anna@example.com",
    agent_phone: "+48 500 000 000",
    website_url: "https://example.com",
    note: "Prepared for client discussion.",
    logo_url: "https://example.com/logo.png",
    primary_color: "#0F766E",
    accent_color: "#B42318",
    footer_text: "Prepared by Domarion Realty for client review.",
    agency_disclaimer: "Agency materials are informational and require independent diligence.",
  });
  const [status, setStatus] = useState("Загрузка отчетов...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [accountData, data, insightData] = await Promise.all([
        api.getMe(),
        api.listReports(),
        api.listAIInsights({ limit: 200 }),
      ]);
      setAccount(accountData);
      setReports(data);
      setInsights(insightData);
      setStatus(`Отчетов: ${data.length}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function generateReport() {
    setStatus("Генерация отчета...");
    const report = await api.generateReport(
      listingId,
      audience,
      audience === "realtor"
        ? cleanBranding(branding, account?.limits.can_white_label ?? false)
        : undefined,
    );
    const insightData = await api.listAIInsights({ limit: 200 });
    setReports([report, ...reports]);
    setInsights(insightData);
    setStatus(`Отчет сохранен: ${report.id}`);
  }

  const canWhiteLabel = account?.limits.can_white_label ?? false;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Отчеты</h1>
          <p>Сохраненные HTML/JSON отчеты по объектам для клиента, риелтора и инвестора.</p>
        </div>
        <div className="button-row">
          {account?.limits.can_export ? (
            <>
              <a className="button" href={reportExportUrl("csv")}>
                <Download size={16} /> CSV
              </a>
              <a className="button" href={reportExportUrl("json")}>
                <Download size={16} /> JSON
              </a>
            </>
          ) : (
            <span className="muted">Export доступен на Realtor/Agency планах</span>
          )}
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Создать отчет</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <label className="field">
            <span>Listing ID</span>
            <input
              className="input"
              value={listingId}
              onChange={(event) => setListingId(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Аудитория</span>
            <select
              className="select"
              value={audience}
              onChange={(event) => setAudience(event.target.value as typeof audience)}
            >
              <option value="buyer">Buyer</option>
              <option value="realtor">Realtor</option>
              <option value="investor">Investor</option>
            </select>
          </label>
          <button className="button primary" type="button" onClick={() => void generateReport()}>
            <FileText size={16} /> Сгенерировать
          </button>
          {audience === "realtor" ? (
            <>
              <BrandingField
                label="Agency"
                value={branding.agency_name ?? ""}
                onChange={(value) => setBranding({ ...branding, agency_name: value })}
              />
              <BrandingField
                label="Agent"
                value={branding.agent_name ?? ""}
                onChange={(value) => setBranding({ ...branding, agent_name: value })}
              />
              <BrandingField
                label="Email"
                value={branding.agent_email ?? ""}
                onChange={(value) => setBranding({ ...branding, agent_email: value })}
              />
              <BrandingField
                label="Phone"
                value={branding.agent_phone ?? ""}
                onChange={(value) => setBranding({ ...branding, agent_phone: value })}
              />
              <BrandingField
                label="Website"
                value={branding.website_url ?? ""}
                onChange={(value) => setBranding({ ...branding, website_url: value })}
              />
              <BrandingField
                label="Note"
                value={branding.note ?? ""}
                onChange={(value) => setBranding({ ...branding, note: value })}
              />
              {canWhiteLabel ? (
                <>
                  <BrandingField
                    label="Logo URL"
                    value={branding.logo_url ?? ""}
                    onChange={(value) => setBranding({ ...branding, logo_url: value })}
                  />
                  <ColorField
                    label="Primary"
                    value={branding.primary_color ?? "#0F766E"}
                    onChange={(value) => setBranding({ ...branding, primary_color: value })}
                  />
                  <ColorField
                    label="Accent"
                    value={branding.accent_color ?? "#B42318"}
                    onChange={(value) => setBranding({ ...branding, accent_color: value })}
                  />
                  <BrandingField
                    label="Footer"
                    value={branding.footer_text ?? ""}
                    onChange={(value) => setBranding({ ...branding, footer_text: value })}
                  />
                  <BrandingField
                    label="Disclaimer"
                    value={branding.agency_disclaimer ?? ""}
                    onChange={(value) => setBranding({ ...branding, agency_disclaimer: value })}
                  />
                </>
              ) : (
                <div className="field">
                  <span>White-label</span>
                  <small className="muted">Logo, colors and custom footer need Realtor/Agency.</small>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>История</h2>
          <span className="muted">{reports.length} items</span>
        </div>
        <div className="panel-body">
          {error ? (
            <ErrorBlock message={error} />
          ) : reports.length === 0 && status.startsWith("Загрузка") ? (
            <LoadingBlock />
          ) : reports.length === 0 ? (
            <EmptyBlock label="Пока нет сохраненных отчетов." />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Отчет</th>
                    <th>Объект</th>
                    <th>Аудитория</th>
                    <th>Insight</th>
                    <th>Дата</th>
                    <th>Content</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const insight = insightForReport(insights, report.id);
                    return (
                      <tr key={report.id}>
                        <td>{report.title}</td>
                        <td>{report.listing_id}</td>
                        <td>{report.audience}</td>
                        <td>
                          {insight ? (
                            <>
                              <strong>{insightLabel(insight)}</strong>
                              <small>{insight.summary}</small>
                            </>
                          ) : (
                            <span className="muted">Нет сохраненного summary</span>
                          )}
                        </td>
                        <td>{new Date(report.created_at).toLocaleString("pl-PL")}</td>
                        <td>
                          <a
                            className="button"
                            href={reportContentUrl(report.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={16} /> Открыть
                          </a>
                          <button
                            className="button"
                            type="button"
                            onClick={() => void emailReport(report.id)}
                            style={{ marginLeft: 8 }}
                          >
                            <Mail size={16} /> Email
                          </button>
                        </td>
                        <td>
                          <a
                            className="button"
                            href={reportPdfUrl(report.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={16} /> PDF
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

async function emailReport(reportId: string) {
  const result = await api.emailReport(reportId, { dry_run: true });
  window.alert(result.message);
}

function insightForReport(insights: AIInsightListItem[], reportId: string) {
  return (
    insights.find(
      (insight) =>
        insight.source_report_id === reportId && insight.insight_type === "object_explanation",
    ) ?? insights.find((insight) => insight.source_report_id === reportId)
  );
}

function insightLabel(insight: AIInsightListItem) {
  if (insight.insight_type === "object_explanation") {
    return "Object explanation";
  }
  if (insight.insight_type === "area_summary") {
    return "Area summary";
  }
  return "Report summary";
}

function BrandingField({
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
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ColorField({
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
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function cleanBranding(branding: ReportBranding, canWhiteLabel: boolean): ReportBranding {
  const entries = Object.entries(branding)
    .filter(([key]) => canWhiteLabel || !WHITE_LABEL_BRANDING_FIELDS.has(key))
    .map(([key, value]) => [key, value?.trim() || null]);
  return Object.fromEntries(entries) as ReportBranding;
}

const WHITE_LABEL_BRANDING_FIELDS = new Set([
  "logo_url",
  "primary_color",
  "accent_color",
  "footer_text",
  "agency_disclaimer",
]);
