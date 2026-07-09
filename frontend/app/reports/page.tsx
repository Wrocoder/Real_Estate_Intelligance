"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, RefreshCw } from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { api, reportContentUrl, type GeneratedReportListItem } from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<GeneratedReportListItem[]>([]);
  const [listingId, setListingId] = useState("wr-001");
  const [audience, setAudience] = useState<"buyer" | "realtor" | "investor">("buyer");
  const [status, setStatus] = useState("Загрузка отчетов...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await api.listReports();
      setReports(data);
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
    const report = await api.generateReport(listingId, audience);
    setReports([report, ...reports]);
    setStatus(`Отчет сохранен: ${report.id}`);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Отчеты</h1>
          <p>Сохраненные HTML/JSON отчеты по объектам для клиента, риелтора и инвестора.</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> Обновить
        </button>
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
            <table className="table">
              <thead>
                <tr>
                  <th>Отчет</th>
                  <th>Объект</th>
                  <th>Аудитория</th>
                  <th>Дата</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.title}</td>
                    <td>{report.listing_id}</td>
                    <td>{report.audience}</td>
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
                    </td>
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
