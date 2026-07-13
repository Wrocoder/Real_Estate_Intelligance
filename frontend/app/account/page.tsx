"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type AccountSummary,
  type AgencyMemberRole,
  type AgencyMembershipStatus,
  type AgencyWorkspace,
  type AgencyWorkspaceSummary,
  type PlanLimits,
  type ReportOrder,
  type SubscriptionPlan,
} from "@/lib/api";
import { numberValue } from "@/lib/format";

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Free",
  buyer_pro: "Buyer Pro",
  investor: "Investor",
  realtor: "Realtor",
  agency: "Agency",
  enterprise: "Enterprise",
};
const AGENCY_ROLE_OPTIONS: AgencyMemberRole[] = ["agent", "admin", "owner"];
const AGENCY_ROLE_LABELS: Record<AgencyMemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  agent: "Agent",
};
const AGENCY_STATUS_LABELS: Record<AgencyMembershipStatus, string> = {
  active: "Active",
  invited: "Invited",
  disabled: "Disabled",
};

export default function AccountPage() {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [agencies, setAgencies] = useState<AgencyWorkspaceSummary[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<AgencyWorkspace | null>(null);
  const [agencyBusy, setAgencyBusy] = useState(false);
  const [agencyForm, setAgencyForm] = useState({
    name: "",
    billing_email: "",
    website_url: "",
    city: "Wrocław",
  });
  const [memberForm, setMemberForm] = useState({
    user_id: "",
    email: "",
    display_name: "",
    role: "agent" as AgencyMemberRole,
  });
  const [status, setStatus] = useState("Загрузка аккаунта...");
  const [error, setError] = useState("");

  const load = useCallback(async (preferredAgencyId?: string | null) => {
    setError("");
    setStatus("Загрузка аккаунта...");
    try {
      const [accountData, planData, orderData, agencyData] = await Promise.all([
        api.getMe(),
        api.listPlans(),
        api.listReportOrders(),
        api.listAgencies(),
      ]);
      setAccount(accountData);
      setPlans(planData);
      setOrders(orderData);
      setAgencies(agencyData);
      if (agencyData.length > 0) {
        const selectedId =
          preferredAgencyId && agencyData.some((agency) => agency.id === preferredAgencyId)
            ? preferredAgencyId
            : agencyData[0].id;
        setSelectedAgency(await api.getAgency(selectedId));
      } else {
        setSelectedAgency(null);
      }
      setStatus("Аккаунт обновлен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Backend API недоступен");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function switchPlan(plan: SubscriptionPlan) {
    setStatus(`Переключение на ${PLAN_LABELS[plan]}...`);
    const updated = await api.updateSubscription(plan);
    setAccount(updated);
    setStatus(`Тариф: ${PLAN_LABELS[updated.subscription.plan]}`);
  }

  async function refreshAgency(agencyId = selectedAgency?.id) {
    if (!agencyId) return;
    const [agencyList, agencyDetail] = await Promise.all([
      api.listAgencies(),
      api.getAgency(agencyId),
    ]);
    setAgencies(agencyList);
    setSelectedAgency(agencyDetail);
  }

  async function selectAgency(agencyId: string) {
    setAgencyBusy(true);
    setStatus("Загрузка workspace...");
    try {
      setSelectedAgency(await api.getAgency(agencyId));
      setStatus("Workspace выбран");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка загрузки workspace");
    } finally {
      setAgencyBusy(false);
    }
  }

  async function createAgency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agencyForm.name.trim()) {
      setStatus("Название agency обязательно");
      return;
    }
    setAgencyBusy(true);
    setStatus("Создание agency workspace...");
    try {
      const created = await api.createAgency({
        name: agencyForm.name,
        billing_email: blankToNull(agencyForm.billing_email),
        website_url: blankToNull(agencyForm.website_url),
        city: blankToNull(agencyForm.city),
      });
      setSelectedAgency(created);
      setAgencies(await api.listAgencies());
      setAgencyForm({ name: "", billing_email: "", website_url: "", city: "Wrocław" });
      setStatus("Agency workspace создан");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка создания agency workspace");
    } finally {
      setAgencyBusy(false);
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !memberForm.user_id.trim()) {
      setStatus("User ID участника обязателен");
      return;
    }
    setAgencyBusy(true);
    setStatus("Добавление участника...");
    try {
      await api.addAgencyMember(selectedAgency.id, {
        user_id: memberForm.user_id,
        email: blankToNull(memberForm.email),
        display_name: blankToNull(memberForm.display_name),
        role: memberForm.role,
        status: "active",
      });
      setMemberForm({ user_id: "", email: "", display_name: "", role: "agent" });
      await refreshAgency(selectedAgency.id);
      setStatus("Участник добавлен");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка добавления участника");
    } finally {
      setAgencyBusy(false);
    }
  }

  async function updateMemberRole(membershipId: string, role: AgencyMemberRole) {
    if (!selectedAgency) return;
    setAgencyBusy(true);
    setStatus("Обновление роли...");
    try {
      await api.updateAgencyMember(selectedAgency.id, membershipId, { role });
      await refreshAgency(selectedAgency.id);
      setStatus("Роль обновлена");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка обновления роли");
    } finally {
      setAgencyBusy(false);
    }
  }

  async function updateMemberStatus(
    membershipId: string,
    memberStatus: AgencyMembershipStatus,
  ) {
    if (!selectedAgency) return;
    setAgencyBusy(true);
    setStatus("Обновление статуса...");
    try {
      await api.updateAgencyMember(selectedAgency.id, membershipId, { status: memberStatus });
      await refreshAgency(selectedAgency.id);
      setStatus("Статус обновлен");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка обновления статуса");
    } finally {
      setAgencyBusy(false);
    }
  }

  async function removeMember(membershipId: string) {
    if (!selectedAgency) return;
    setAgencyBusy(true);
    setStatus("Удаление участника...");
    try {
      await api.removeAgencyMember(selectedAgency.id, membershipId);
      await refreshAgency(selectedAgency.id);
      setStatus("Участник удален");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка удаления участника");
    } finally {
      setAgencyBusy(false);
    }
  }

  const currentPlan = account?.subscription.plan ?? "free";
  const canCreateAgency = currentPlan === "agency" || currentPlan === "enterprise";
  const selectedCanManage =
    selectedAgency?.current_user_status === "active" &&
    (selectedAgency.current_user_role === "owner" || selectedAgency.current_user_role === "admin");
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
        <button className="button" type="button" onClick={() => void load(selectedAgency?.id)}>
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
          <span>Credits</span>
          <strong>{numberValue(account.usage.report_credits_available)}</strong>
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
            <p className="muted">
              Report credits: {numberValue(account.usage.report_credits_available)}
            </p>

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
          <h2>Agency workspace</h2>
          <span className="muted">{agencies.length} workspaces</span>
        </div>
        <div className="panel-body">
          <form className="form-grid compact" onSubmit={(event) => void createAgency(event)}>
            <label className="field">
              <span>Название</span>
              <input
                className="input"
                value={agencyForm.name}
                onChange={(event) =>
                  setAgencyForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Example Realty"
              />
            </label>
            <label className="field">
              <span>Billing email</span>
              <input
                className="input"
                value={agencyForm.billing_email}
                onChange={(event) =>
                  setAgencyForm((current) => ({
                    ...current,
                    billing_email: event.target.value,
                  }))
                }
                placeholder="billing@example.com"
              />
            </label>
            <label className="field">
              <span>Website</span>
              <input
                className="input"
                value={agencyForm.website_url}
                onChange={(event) =>
                  setAgencyForm((current) => ({
                    ...current,
                    website_url: event.target.value,
                  }))
                }
                placeholder="https://example.com"
              />
            </label>
            <label className="field">
              <span>City</span>
              <input
                className="input"
                value={agencyForm.city}
                onChange={(event) =>
                  setAgencyForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </label>
            <div className="field">
              <span>Action</span>
              <button
                className="button primary"
                type="submit"
                disabled={!canCreateAgency || agencyBusy}
              >
                <Building2 size={16} />
                Создать
              </button>
            </div>
            <div className="field">
              <span>Plan</span>
              <span className={canCreateAgency ? "status-pill healthy" : "status-pill warning"}>
                {canCreateAgency ? "Agency enabled" : "Agency plan required"}
              </span>
            </div>
          </form>

          {agencies.length > 0 ? (
            <div className="toolbar" style={{ marginTop: 14 }}>
              {agencies.map((agency) => (
                <button
                  key={agency.id}
                  className={agency.id === selectedAgency?.id ? "button primary" : "button"}
                  type="button"
                  disabled={agencyBusy}
                  onClick={() => void selectAgency(agency.id)}
                >
                  <Users size={16} />
                  {agency.name}
                  <span className="status-pill info">{agency.members_count}</span>
                </button>
              ))}
            </div>
          ) : null}

          {selectedAgency ? (
            <div style={{ marginTop: 16 }}>
              <div className="panel-header inline">
                <h3>{selectedAgency.name}</h3>
                <span className="status-pill info">
                  {AGENCY_ROLE_LABELS[selectedAgency.current_user_role]}
                </span>
              </div>
              <div className="metric-grid" style={{ marginBottom: 14 }}>
                <div className="metric">
                  <span>Owner</span>
                  <strong>{selectedAgency.owner_id}</strong>
                </div>
                <div className="metric">
                  <span>City</span>
                  <strong>{selectedAgency.city ?? "-"}</strong>
                </div>
                <div className="metric">
                  <span>Members</span>
                  <strong>{selectedAgency.members_count}</strong>
                </div>
                <div className="metric">
                  <span>Status</span>
                  <strong>{AGENCY_STATUS_LABELS[selectedAgency.current_user_status]}</strong>
                </div>
              </div>

              <form className="form-grid compact" onSubmit={(event) => void addMember(event)}>
                <label className="field">
                  <span>User ID</span>
                  <input
                    className="input"
                    value={memberForm.user_id}
                    disabled={!selectedCanManage}
                    onChange={(event) =>
                      setMemberForm((current) => ({
                        ...current,
                        user_id: event.target.value,
                      }))
                    }
                    placeholder="agent-1"
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    className="input"
                    value={memberForm.email}
                    disabled={!selectedCanManage}
                    onChange={(event) =>
                      setMemberForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="agent@example.com"
                  />
                </label>
                <label className="field">
                  <span>Name</span>
                  <input
                    className="input"
                    value={memberForm.display_name}
                    disabled={!selectedCanManage}
                    onChange={(event) =>
                      setMemberForm((current) => ({
                        ...current,
                        display_name: event.target.value,
                      }))
                    }
                    placeholder="Agent One"
                  />
                </label>
                <label className="field">
                  <span>Role</span>
                  <select
                    className="select"
                    value={memberForm.role}
                    disabled={!selectedCanManage}
                    onChange={(event) =>
                      setMemberForm((current) => ({
                        ...current,
                        role: event.target.value as AgencyMemberRole,
                      }))
                    }
                  >
                    {AGENCY_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {AGENCY_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="field">
                  <span>Action</span>
                  <button
                    className="button"
                    type="submit"
                    disabled={!selectedCanManage || agencyBusy}
                  >
                    <UserPlus size={16} />
                    Добавить
                  </button>
                </div>
              </form>

              <div className="table-scroll" style={{ marginTop: 14 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Участник</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Статус</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAgency.members.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <strong>{memberDisplayName(member)}</strong>
                          <small>{member.user_id}</small>
                        </td>
                        <td>{member.email ?? "-"}</td>
                        <td>
                          <select
                            className="select"
                            value={member.role}
                            disabled={!selectedCanManage || agencyBusy}
                            onChange={(event) =>
                              void updateMemberRole(
                                member.id,
                                event.target.value as AgencyMemberRole,
                              )
                            }
                          >
                            {AGENCY_ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {AGENCY_ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="select"
                            value={member.status}
                            disabled={!selectedCanManage || agencyBusy}
                            onChange={(event) =>
                              void updateMemberStatus(
                                member.id,
                                event.target.value as AgencyMembershipStatus,
                              )
                            }
                          >
                            {Object.entries(AGENCY_STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="button danger"
                            type="button"
                            disabled={
                              !selectedCanManage ||
                              agencyBusy ||
                              !canRemoveAgencyMember(selectedAgency, member.id)
                            }
                            onClick={() => void removeMember(member.id)}
                          >
                            <Trash2 size={16} />
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </section>

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
  return ["free", "buyer_pro", "investor", "realtor", "agency", "enterprise"].indexOf(plan);
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function memberDisplayName(member: AgencyWorkspace["members"][number]) {
  return member.display_name || member.email || member.user_id;
}

function canRemoveAgencyMember(agency: AgencyWorkspace, membershipId: string) {
  const member = agency.members.find((item) => item.id === membershipId);
  if (!member) return false;
  if (member.role !== "owner" || member.status !== "active") return true;
  const activeOwners = agency.members.filter(
    (item) => item.role === "owner" && item.status === "active",
  ).length;
  return activeOwners > 1;
}
