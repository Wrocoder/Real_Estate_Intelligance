"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, CreditCard, ExternalLink, FileText, RefreshCw } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type AccountSummary,
  type PlanLimits,
  type ReportOrder,
  type ReportOrderEvent,
  type ReportProduct,
} from "@/lib/api";
import { numberValue } from "@/lib/format";

export default function PricingPage() {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [products, setProducts] = useState<ReportProduct[]>([]);
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [events, setEvents] = useState<ReportOrderEvent[]>([]);
  const [listingId, setListingId] = useState("wr-001");
  const [status, setStatus] = useState("Загрузка тарифов...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setStatus("Загрузка тарифов...");
    try {
      const [accountData, planData, productData, orderData] = await Promise.all([
        api.getMe(),
        api.listPlans(),
        api.listReportProducts(),
        api.listReportOrders(),
      ]);
      setAccount(accountData);
      setPlans(planData);
      setProducts(productData);
      setOrders(orderData);
      setStatus("Готово");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createAndPay(product: ReportProduct) {
    setStatus(`Создание заказа: ${product.title}...`);
    const checkout = await api.createReportOrder({
      listing_id: listingId,
      product_code: product.code,
      audience: product.audience,
    });
    setStatus(`Checkout ${checkout.provider}: ${checkout.external_reference ?? checkout.order.id}`);

    const paid = await api.mockPayReportOrder(checkout.order.id);
    setStatus(`Оплачено: ${paid.id}`);

    const fulfilled = await api.fulfillReportOrder(paid.id);
    setOrders((current) => [fulfilled, ...current.filter((order) => order.id !== fulfilled.id)]);
    setEvents(await api.listReportOrderEvents(fulfilled.id));
    setStatus(`Отчет готов: ${fulfilled.generated_report_id}`);
  }

  async function loadEvents(orderId: string) {
    setEvents(await api.listReportOrderEvents(orderId));
    setStatus(`Audit events: ${orderId}`);
  }

  const planByCode = useMemo(() => Object.fromEntries(plans.map((plan) => [plan.plan, plan])), [plans]);

  if (error) return <ErrorBlock message={error} />;
  if (!account || products.length === 0) return <LoadingBlock label="Загрузка pricing" />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Оплата и отчеты</h1>
          <p>Разовые отчеты, mock checkout и тарифные ограничения для paid MVP.</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> Обновить
        </button>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Текущий тариф</span>
          <strong>{account.subscription.plan}</strong>
        </div>
        <div className="metric">
          <span>Отчеты по подписке</span>
          <strong>
            {account.usage.reports_this_month}/{account.limits.monthly_reports}
          </strong>
        </div>
        <div className="metric">
          <span>One-time orders</span>
          <strong>{numberValue(orders.length)}</strong>
        </div>
        <div className="metric">
          <span>Status</span>
          <strong>{status}</strong>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Разовый отчет</h2>
          <span className="muted">mock checkout без реального PSP</span>
        </div>
        <div className="panel-body">
          <label className="field pricing-listing-field">
            <span>Listing ID</span>
            <input
              className="input"
              value={listingId}
              onChange={(event) => setListingId(event.target.value)}
            />
          </label>

          <div className="pricing-grid">
            {products.map((product) => (
              <article className="pricing-card" key={product.code}>
                <div className="pricing-card-header">
                  <div>
                    <strong>{product.title}</strong>
                    <span>{product.description}</span>
                  </div>
                  <b>{formatGrosz(product.amount_grosz)}</b>
                </div>
                <ul className="section-list compact">
                  {product.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={14} /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => void createAndPay(product)}
                >
                  <CreditCard size={16} /> Mock pay + generate
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>История заказов</h2>
            <span className="muted">{orders.length} orders</span>
          </div>
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Объект</th>
                  <th>Статус</th>
                  <th>Отчет</th>
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.product_code}</td>
                    <td>{order.listing_id}</td>
                    <td>{order.status}</td>
                    <td>
                      {order.generated_report_id ? (
                        <a
                          className="button"
                          href={reportContentUrl(order.generated_report_id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={16} /> Открыть
                        </a>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td>
                      <button className="button" type="button" onClick={() => void loadEvents(order.id)}>
                        <Activity size={16} /> Events
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Подписки</h2>
            <FileText size={18} />
          </div>
          <div className="panel-body">
            <ul className="section-list">
              {Object.entries(planByCode).map(([plan, limits]) => (
                <li key={plan}>
                  <strong>{plan}</strong>: {limits.monthly_reports} отчетов/мес,{" "}
                  {limits.max_alerts} alerts, {limits.can_white_label ? "white-label" : "standard"}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Audit trail</h2>
          <span className="muted">{events.length} events</span>
        </div>
        <div className="panel-body">
          {events.length === 0 ? (
            <p className="muted">Выберите заказ, чтобы увидеть историю checkout, оплаты и генерации.</p>
          ) : (
            <ul className="section-list">
              {events.map((event) => (
                <li key={event.id}>
                  <Activity size={14} />
                  <strong>{event.event_type}</strong>
                  <span>{event.message ?? "event"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function formatGrosz(value: number) {
  return `${new Intl.NumberFormat("pl-PL").format(value / 100)} PLN`;
}
