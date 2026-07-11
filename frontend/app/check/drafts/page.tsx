"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, RefreshCw, Trash2 } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type GeneratedReport,
  type UserSubmittedListingDraft,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";

export default function CheckDraftsPage() {
  const [drafts, setDrafts] = useState<UserSubmittedListingDraft[]>([]);
  const [savedReports, setSavedReports] = useState<Record<string, GeneratedReport>>({});
  const [status, setStatus] = useState("Загрузка проверок...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setStatus("Загрузка проверок...");
    try {
      const data = await api.listUserSubmittedListingDrafts({ limit: 100 });
      setDrafts(data);
      setStatus(`Проверок: ${data.length}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteDraft(draftId: string) {
    setError("");
    setStatus("Удаление...");
    const response = await api.deleteUserSubmittedListingDraft(draftId);
    if (!response.ok) {
      const body = await response.text();
      setError(`API ${response.status}: ${body}`);
      setStatus("Ошибка удаления");
      return;
    }
    setDrafts((current) => current.filter((draft) => draft.id !== draftId));
    setSavedReports((current) => {
      const next = { ...current };
      delete next[draftId];
      return next;
    });
    setStatus("Проверка удалена");
  }

  async function saveReport(draftId: string) {
    setError("");
    setStatus("Генерация отчета...");
    try {
      const report = await api.generateUserSubmittedDraftReport(draftId, {
        audience: "buyer",
        report_format: "html",
      });
      setSavedReports((current) => ({ ...current, [draftId]: report }));
      setStatus(`Отчет сохранен: ${shortId(report.id)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Ошибка генерации отчета");
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Мои проверки</h1>
          <p>Private drafts по квартирам, которые были проверены через address-first flow.</p>
        </div>
        <div className="button-row">
          <Link className="button" href="/check">
            <FileText size={16} /> Новая проверка
          </Link>
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>История</h2>
          <span className="status-line">{status}</span>
        </div>
        <div className="panel-body">
          {error ? (
            <ErrorBlock message={error} />
          ) : drafts.length === 0 && status.startsWith("Загрузка") ? (
            <LoadingBlock />
          ) : drafts.length === 0 ? (
            <EmptyBlock label="Пока нет сохраненных проверок." />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Объект</th>
                    <th>Параметры</th>
                    <th>Score</th>
                    <th>Private ref</th>
                    <th>Retention</th>
                    <th>Действия</th>
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
                          {money(draft.price)}
                          <small>
                            {numberValue(draft.area_m2)} m2, {draft.rooms} pok.
                          </small>
                        </td>
                        <td>
                          <span className="score-pill">{draft.confidence_score}/100</span>
                          <small>DQ {draft.data_quality_score}/100</small>
                        </td>
                        <td>{draft.source_domain ?? "manual input"}</td>
                        <td>
                          {dateLabel(draft.expires_at)}
                          <small>{relativeDays(draft.expires_at)}</small>
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
                                <ExternalLink size={16} /> HTML
                              </a>
                            ) : (
                              <button
                                className="button"
                                type="button"
                                onClick={() => void saveReport(draft.id)}
                              >
                                <FileText size={16} /> Отчет
                              </button>
                            )}
                            <button
                              className="button danger"
                              type="button"
                              onClick={() => void deleteDraft(draft.id)}
                            >
                              <Trash2 size={16} /> Удалить
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

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function relativeDays(value: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / dayMs);
  if (days < 0) return "expired";
  if (days === 0) return "expires today";
  return `${days} d left`;
}
