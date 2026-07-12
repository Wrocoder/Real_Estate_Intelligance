"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Heart, RefreshCw } from "lucide-react";

import { ScoreBars } from "@/components/ScoreBars";
import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { api, objectReportUrl, type ListingAnalysis } from "@/lib/api";
import { money, percent } from "@/lib/format";
import { decisionTone, scoreLabel } from "@/lib/scoreLabels";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;
  const [analysis, setAnalysis] = useState<ListingAnalysis | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setStatus("Загрузка объекта...");
    try {
      const data = await api.getAnalysis(listingId);
      setAnalysis(data);
      setStatus("Аналитика обновлена");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFavorite() {
    await api.addFavorite(listingId, "Added from detail page");
    setStatus("Добавлено в избранное");
  }

  async function generateReport() {
    const report = await api.generateReport(listingId);
    setStatus(`Отчет сохранен: ${report.id}`);
  }

  if (error) return <ErrorBlock message={error} />;
  if (!analysis) return <LoadingBlock label="Загрузка аналитики объекта" />;

  const { listing, scores, area_statistics: areaStats } = analysis;
  const verdictTone = decisionTone(scores);

  return (
    <>
      <header className="page-header">
        <div>
          <Link href="/" className="button">
            <ArrowLeft size={16} /> Назад
          </Link>
          <h1 style={{ marginTop: 14 }}>{listing.title}</h1>
          <p>
            {listing.address}, {listing.district} · {listing.market_type}
          </p>
        </div>
        <div className="toolbar">
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Обновить
          </button>
          <button className="button" type="button" onClick={() => void addFavorite()}>
            <Heart size={16} /> Favorite
          </button>
          <button className="button primary" type="button" onClick={() => void generateReport()}>
            <FileText size={16} /> Сохранить отчет
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Вердикт</span>
          <strong>{scoreLabel(scores.decision_label)}</strong>
        </div>
        <div className="metric">
          <span>Цена</span>
          <strong>{money(listing.price)}</strong>
        </div>
        <div className="metric">
          <span>Цена за m2</span>
          <strong>{money(listing.price_per_m2)}/m2</strong>
        </div>
        <div className="metric">
          <span>Fair price mid</span>
          <strong>{money(scores.fair_price_mid)}</strong>
        </div>
        <div className="metric">
          <span>Fair price confidence</span>
          <strong>{scores.fair_price_confidence_score}/100</strong>
        </div>
        <div className="metric">
          <span>Отклонение от fair mid</span>
          <strong>{percent(scores.price_delta_to_fair_mid_pct)}</strong>
        </div>
        <div className="metric">
          <span>Price label</span>
          <strong>{scoreLabel(scores.price_label)}</strong>
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Выводы по объекту</h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="panel-body">
            <ul className="section-list">
              {analysis.insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Аргументы для торга</h2>
            <ul className="section-list">
              {analysis.negotiation_arguments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>История цены</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Цена</th>
                  <th>Цена за m2</th>
                </tr>
              </thead>
              <tbody>
                {analysis.price_history.map((point) => (
                  <tr key={point.observed_at}>
                    <td>{point.observed_at}</td>
                    <td>{money(point.price)}</td>
                    <td>{money(point.price_per_m2)}/m2</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>Похожие объекты</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Объект</th>
                  <th>Район</th>
                  <th>Цена</th>
                  <th>m2</th>
                </tr>
              </thead>
              <tbody>
                {analysis.comparables.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/listings/${item.id}`}>{item.title}</Link>
                    </td>
                    <td>{item.district}</td>
                    <td>{money(item.price)}</td>
                    <td>{money(item.price_per_m2)}/m2</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Скоринг</h2>
            <div className="button-row">
              <span className={`status-pill ${verdictTone}`}>
                {scoreLabel(scores.decision_label)}
              </span>
              <span className="score-pill">DQ {listing.data_quality_score}</span>
            </div>
          </div>
          <div className="panel-body">
            <ScoreBars scores={scores} />
            <h2>Район</h2>
            <ul className="section-list">
              <li>Медиана: {money(areaStats.median_price_per_m2)}/m2</li>
              <li>Активных объявлений: {areaStats.active_listings}</li>
              <li>Средняя экспозиция: {areaStats.average_days_on_market} дней</li>
              <li>Предложение 90 дней: {percent(areaStats.supply_change_90d_pct)}</li>
            </ul>
            <h2>Готовый HTML</h2>
            <a
              className="button primary"
              href={objectReportUrl(listing.id)}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={16} /> Открыть отчет
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
