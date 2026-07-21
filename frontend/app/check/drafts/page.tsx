"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, ExternalLink, FileText, RefreshCw, Trash2 } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type GeneratedReport,
  type UserSubmittedListingDraft,
} from "@/lib/api";
import { dateValue, money, numberValue } from "@/lib/format";
import { CHECK_DRAFTS_COPY, type CheckDraftsPageCopy } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

export default function CheckDraftsPage() {
  const { locale } = useLocalePreference();
  const copy = CHECK_DRAFTS_COPY[locale];
  const [drafts, setDrafts] = useState<UserSubmittedListingDraft[]>([]);
  const [savedReports, setSavedReports] = useState<Record<string, GeneratedReport>>({});
  const [status, setStatus] = useState(copy.statuses.loading);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setIsLoading(true);
    setStatus(copy.statuses.loading);
    try {
      const data = await api.listUserSubmittedListingDrafts({ limit: 100 });
      setDrafts(data);
      setStatus(copy.statuses.loaded(data.length));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.backendUnavailable);
    } finally {
      setIsLoading(false);
    }
  }, [copy]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deleteDraft(draftId: string) {
    setError("");
    setStatus(copy.statuses.deleting);
    const response = await api.deleteUserSubmittedListingDraft(draftId);
    if (!response.ok) {
      const body = await response.text();
      setError(`API ${response.status}: ${body}`);
      setStatus(copy.statuses.deleteError);
      return;
    }
    setDrafts((current) => current.filter((draft) => draft.id !== draftId));
    setSavedReports((current) => {
      const next = { ...current };
      delete next[draftId];
      return next;
    });
    setStatus(copy.statuses.deleted);
  }

  async function saveReport(draftId: string) {
    setError("");
    setStatus(copy.statuses.reportGenerating);
    try {
      const report = await api.generateUserSubmittedDraftReport(draftId, {
        audience: "buyer",
        report_format: "html",
      });
      setSavedReports((current) => ({ ...current, [draftId]: report }));
      setStatus(copy.statuses.reportSaved(shortId(report.id)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.reportError);
    }
  }

  async function mockPayReport(draftId: string) {
    setError("");
    setStatus(copy.statuses.orderCreating);
    try {
      const checkout = await api.createReportOrder({
        listing_id: `draft:${draftId}`,
        product_code: "object_report",
        audience: "buyer",
      });
      setStatus(copy.statuses.mockPayment(checkout.order.id));
      const paid = await api.mockPayReportOrder(checkout.order.id);
      const fulfilled = await api.fulfillReportOrder(paid.id);
      if (fulfilled.generated_report_id) {
        const report = await api.getGeneratedReport(fulfilled.generated_report_id);
        setSavedReports((current) => ({ ...current, [draftId]: report }));
      }
      setStatus(copy.statuses.paidReportReady(shortId(fulfilled.id)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus(copy.statuses.paymentError);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="button-row">
          <Link className="button" href="/check">
            <FileText size={16} /> {copy.actions.newCheck}
          </Link>
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{copy.sections.history}</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body">
          {error ? (
            <ErrorBlock message={error} prefix={copy.errorPrefix} />
          ) : drafts.length === 0 && isLoading ? (
            <LoadingBlock label={copy.empty.loading} />
          ) : drafts.length === 0 ? (
            <EmptyBlock label={copy.empty.noDrafts} />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>{copy.table.object}</th>
                    <th>{copy.table.parameters}</th>
                    <th>{copy.table.score}</th>
                    <th>{copy.table.privateRef}</th>
                    <th>{copy.table.retention}</th>
                    <th>{copy.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => {
                    const report = savedReports[draft.id];
                    return (
                      <tr key={draft.id}>
                        <td>
                          <strong>{draft.address}</strong>
                          <small>
                            {draft.district}, {draft.city}
                          </small>
                        </td>
                        <td>
                          {money(draft.price, locale)}
                          <small>
                            {numberValue(draft.area_m2, locale)} m2,{" "}
                            {copy.values.rooms(draft.rooms)}
                          </small>
                        </td>
                        <td>
                          <span className="score-pill">{draft.confidence_score}/100</span>
                          <small>
                            {copy.values.dataQualityPrefix} {draft.data_quality_score}/100
                          </small>
                        </td>
                        <td>{draft.source_domain ?? copy.values.manualInput}</td>
                        <td>
                          {dateValue(draft.expires_at, locale)}
                          <small>{relativeDays(draft.expires_at, copy)}</small>
                        </td>
                        <td>
                          <div className="button-row">
                            {report ? (
                              <a
                                className="button"
                                href={reportContentUrl(report.id)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink size={16} /> {copy.actions.html}
                              </a>
                            ) : (
                              <>
                                <button
                                  className="button"
                                  type="button"
                                  onClick={() => void saveReport(draft.id)}
                                >
                                  <FileText size={16} /> {copy.actions.report}
                                </button>
                                <button
                                  className="button primary"
                                  type="button"
                                  onClick={() => void mockPayReport(draft.id)}
                                >
                                  <CreditCard size={16} /> {copy.actions.mockPay}
                                </button>
                              </>
                            )}
                            <button
                              className="button danger"
                              type="button"
                              onClick={() => void deleteDraft(draft.id)}
                            >
                              <Trash2 size={16} /> {copy.actions.delete}
                            </button>
                          </div>
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

function shortId(value: string) {
  return value.slice(0, 8);
}

function relativeDays(value: string, copy: CheckDraftsPageCopy) {
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / dayMs);
  if (days < 0) return copy.retention.expired;
  if (days === 0) return copy.retention.expiresToday;
  return copy.retention.daysLeft(days);
}
