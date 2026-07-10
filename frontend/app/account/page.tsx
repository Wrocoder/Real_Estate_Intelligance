"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, RefreshCw, ShieldCheck, UserCircle } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type AccountSummary,
  type PlanLimits,
  type ReportOrder,
  type SubscriptionPlan,
} from "@/lib/api";
import { numberValue } from "@/lib/format";

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Free",
  buyer_pro: "Buyer Pro",
  realtor: "Realtor",
  agency: "Agency",
  enterprise: "Enterprise",
};

export default function AccountPage() {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [status, setStatus] = useState("Загрузка аккаунта...");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setStatus("Загрузка аккаунта...");
    try {
      const [accountData, planData, orderData] = await Promise.all([
        api.getMe(),
        api.listPlans(),
        api.listReportOrders(),
      ]);
      setAccount(accountData);
      setPlans(planData);
      setOrders(orderData);
      setStatus("Аккаунт обновлен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function switchPlan(plan: SubscriptionPlan) {
    setStatus(`Переключение на ${PLAN_LABELS[plan]}...`);
    const updated = await api.updateSubscription(plan);
    setAccount(updated);
    setStatus(`Тариф: ${PLAN_LABELS[updated.subscription.plan]}`);
  }

  const currentPlan = account?.subscription.plan ?? "free";
  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (left, right) => planWeight(left.plan) - planWeight(right.plan),
      ),
    [plans],
  );

  if (error) return <ErrorBlock message={error} />;
  if (!account) return <LoadingBlock label="Загрузка аккаунта и лимитов" />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Аккаунт и подписка</h1>
          <p>Текущий пользователь, тарифные лимиты и usage для MVP-монетизации.</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> Обновить
        </button>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Тариф</span>
          <strong>{PLAN_LABELS[currentPlan]}</strong>
        </div>
        <div className="metric">
          <span>Роль</span>
          <strong>{account.user.role}</strong>
        </div>
        <div className="metric">
          <span>Отчеты</span>
          <strong>
            {account.usage.reports_this_month}/{account.limits.monthly_reports}
          </strong>
        </div>
        <div className="metric">
          <span>Alerts</span>
          <strong>
            {account.usage.alerts}/{account.limits.max_alerts}
          </strong>
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Планы</h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="panel-body plan-grid">
            {sortedPlans.map((plan) => (
              <article
                key={plan.plan}
                className={plan.plan === currentPlan ? "plan-card active" : "plan-card"}
              >
                <div className="plan-card-header">
                  <strong>{PLAN_LABELS[plan.plan]}</strong>
                  {plan.plan === currentPlan ? <span className="score-pill">active</span> : null}
                </div>
                <ul className="section-list compact">
                  <li>{numberValue(plan.max_favorites)} избранных</li>
                  <li>{numberValue(plan.max_alerts)} alerts</li>
                  <li>{numberValue(plan.monthly_reports)} отчетов / месяц</li>
                  <li>{plan.can_white_label ? "White-label reports" : "Без white-label"}</li>
                </ul>
                <button
                  className={plan.plan === currentPlan ? "button" : "button primary"}
                  type="button"
                  disabled={plan.plan === currentPlan}
                  onClick={() => void switchPlan(plan.plan)}
                >
                  <CreditCard size={16} />
                  {plan.plan === currentPlan ? "Текущий" : "Выбрать"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Профиль</h2>
            <UserCircle size={18} />
          </div>
          <div className="panel-body">
            <ul className="section-list">
              <li>ID: {account.user.id}</li>
              <li>Email: {account.user.email ?? "-"}</li>
              <li>Status: {account.subscription.status}</li>
              <li>Plan ID: {account.subscription.id}</li>
            </ul>

            <h2>Usage</h2>
            <UsageBar label="Favorites" value={account.usage.favorites} limit={account.limits.max_favorites} />
            <UsageBar label="Alerts" value={account.usage.alerts} limit={account.limits.max_alerts} />
            <UsageBar
              label="Reports"
              value={account.usage.reports_this_month}
              limit={account.limits.monthly_reports}
            />

            <h2>Capabilities</h2>
            <div className="capability-list">
              <Capability label="Export" enabled={account.limits.can_export} />
              <Capability label="API" enabled={account.limits.can_use_api} />
              <Capability label="White-label" enabled={account.limits.can_white_label} />
            </div>
          </div>
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Разовые покупки</h2>
          <span className="muted">{orders.length} orders</span>
        </div>
        <div className="panel-body">
          <table className="table">
            <thead>
              <tr>
                <th>Продукт</th>
                <th>Объект</th>
                <th>Статус</th>
                <th>Отчет</th>
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
                        Открыть
                      </a>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function UsageBar({ label, value, limit }: { label: string; value: number; limit: number }) {
  const width = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
  return (
    <div className="usage-row">
      <span>
        {label}: {value}/{limit}
      </span>
      <div className="bar">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Capability({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span className={enabled ? "capability enabled" : "capability"}>
      <ShieldCheck size={14} />
      {label}
    </span>
  );
}

function planWeight(plan: SubscriptionPlan) {
  return ["free", "buyer_pro", "realtor", "agency", "enterprise"].indexOf(plan);
}
