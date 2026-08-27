"use client";

import { useCallback, useEffect, useState } from "react";
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
  type ReportAudience,
  type ReportBranding,
} from "@/lib/api";
import { dateValue } from "@/lib/format";
import { REPORTS_PAGE_COPY, type ReportsPageCopy } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

export default function ReportsPage() {
  const { locale } = useLocalePreference();
  const copy = REPORTS_PAGE_COPY[locale];
  const [reports, setReports] = useState<GeneratedReportListItem[]>([]);
  const [insights, setInsights] = useState<AIInsightListItem[]>([]);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [listingId, setListingId] = useState("wr-001");
  const [audience, setAudience] = useState<ReportAudience>("buyer");
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
  const [status, setStatus] = useState(copy.statuses.loading);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setIsLoading(true);
    setStatus(copy.statuses.loading);
    try {
      const [accountData, data, insightData] = await Promise.all([
        api.getMe(),
        api.listReports(),
        api.listAIInsights({ limit: 200 }),
      ]);
      setAccount(accountData);
      setReports(data);
      setInsights(insightData);
      setStatus(copy.statuses.loaded(data.length));
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

  async function generateReport() {
    setError("");
    setStatus(copy.statuses.generating);
    try {
      const report = await api.generateReport(
        listingId,
        audience,
        audience === "realtor"
          ? cleanBranding(branding, account?.limits.can_white_label ?? false)
          : undefined,
      );
      const insightData = await api.listAIInsights({ limit: 200 });
      setReports((current) => [report, ...current]);
      setInsights(insightData);
      setStatus(copy.statuses.reportSaved(report.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    }
  }

  const canWhiteLabel = account?.limits.can_white_label ?? false;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="button-row">
          {account?.limits.can_export ? (
            <>
              <a className="button" href={reportExportUrl("csv")}>
                <Download size={16} /> {copy.actions.csv}
              </a>
              <a className="button" href={reportExportUrl("json")}>
                <Download size={16} /> {copy.actions.json}
              </a>
            </>
          ) : (
            <span className="muted">{copy.values.exportUnavailable}</span>
          )}
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{copy.sections.create}</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <label className="field">
            <span>{copy.fields.listingId}</span>
            <input
              className="input"
              value={listingId}
              onChange={(event) => setListingId(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{copy.fields.audience}</span>
            <select
              className="select"
              value={audience}
              onChange={(event) => setAudience(event.target.value as ReportAudience)}
            >
              <option value="buyer">{copy.values.audienceLabels.buyer}</option>
              <option value="realtor">{copy.values.audienceLabels.realtor}</option>
              <option value="investor">{copy.values.audienceLabels.investor}</option>
            </select>
          </label>
          <button className="button primary" type="button" onClick={() => void generateReport()}>
            <FileText size={16} /> {copy.actions.generate}
          </button>
          {audience === "realtor" ? (
            <>
              <BrandingField
                label={copy.fields.agency}
                value={branding.agency_name ?? ""}
                onChange={(value) => setBranding({ ...branding, agency_name: value })}
              />
              <BrandingField
                label={copy.fields.agent}
                value={branding.agent_name ?? ""}
                onChange={(value) => setBranding({ ...branding, agent_name: value })}
              />
              <BrandingField
                label={copy.fields.email}
                value={branding.agent_email ?? ""}
                onChange={(value) => setBranding({ ...branding, agent_email: value })}
              />
              <BrandingField
                label={copy.fields.phone}
                value={branding.agent_phone ?? ""}
                onChange={(value) => setBranding({ ...branding, agent_phone: value })}
              />
              <BrandingField
                label={copy.fields.website}
                value={branding.website_url ?? ""}
                onChange={(value) => setBranding({ ...branding, website_url: value })}
              />
              <BrandingField
                label={copy.fields.note}
                value={branding.note ?? ""}
                onChange={(value) => setBranding({ ...branding, note: value })}
              />
              {canWhiteLabel ? (
                <>
                  <BrandingField
                    label={copy.fields.logoUrl}
                    value={branding.logo_url ?? ""}
                    onChange={(value) => setBranding({ ...branding, logo_url: value })}
                  />
                  <ColorField
                    label={copy.fields.primaryColor}
                    value={branding.primary_color ?? "#0F766E"}
                    onChange={(value) => setBranding({ ...branding, primary_color: value })}
                  />
                  <ColorField
                    label={copy.fields.accentColor}
                    value={branding.accent_color ?? "#B42318"}
                    onChange={(value) => setBranding({ ...branding, accent_color: value })}
                  />
                  <BrandingField
                    label={copy.fields.footer}
                    value={branding.footer_text ?? ""}
                    onChange={(value) => setBranding({ ...branding, footer_text: value })}
                  />
                  <BrandingField
                    label={copy.fields.disclaimer}
                    value={branding.agency_disclaimer ?? ""}
                    onChange={(value) => setBranding({ ...branding, agency_disclaimer: value })}
                  />
                </>
              ) : (
                <div className="field">
                  <span>{copy.fields.whiteLabel}</span>
                  <small className="muted">{copy.values.whiteLabelHint}</small>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{copy.sections.history}</h2>
          <span className="muted">{copy.values.items(reports.length)}</span>
        </div>
        <div className="panel-body">
          {error ? (
            <ErrorBlock message={error} prefix={copy.errorPrefix} />
          ) : reports.length === 0 && isLoading ? (
            <LoadingBlock label={copy.empty.loading} />
          ) : reports.length === 0 ? (
            <EmptyBlock label={copy.empty.noReports} />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.table.report}</th>
                    <th>{copy.table.object}</th>
                    <th>{copy.table.audience}</th>
                    <th>{copy.table.insight}</th>
                    <th>{copy.table.date}</th>
                    <th>{copy.table.content}</th>
                    <th>{copy.table.pdf}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const insight = insightForReport(insights, report.id);
                    return (
                      <tr key={report.id}>
                        <td>{report.title}</td>
                        <td>{report.listing_id}</td>
                        <td>{copy.values.audienceLabels[report.audience] ?? report.audience}</td>
                        <td>
                          {insight ? (
                            <>
                              <strong>{insightLabel(insight, copy)}</strong>
                              <small>{insight.summary}</small>
                            </>
                          ) : (
                            <span className="muted">{copy.values.noInsight}</span>
                          )}
                        </td>
                        <td>{dateValue(report.created_at, locale)}</td>
                        <td>
                          <a
                            className="button"
                            href={reportContentUrl(report.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={16} /> {copy.actions.open}
                          </a>
                          <button
                            className="button"
                            type="button"
                            onClick={() => void emailReport(report.id)}
                            style={{ marginLeft: 8 }}
                          >
                            <Mail size={16} /> {copy.actions.email}
                          </button>
                        </td>
                        <td>
                          <a
                            className="button"
                            href={reportPdfUrl(report.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={16} /> {copy.actions.pdf}
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

function insightLabel(insight: AIInsightListItem, copy: ReportsPageCopy) {
  return copy.values.insightLabels[insight.insight_type] ?? copy.values.insightLabels.report_summary;
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
