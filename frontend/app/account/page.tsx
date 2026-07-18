"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Clipboard,
  CreditCard,
  FileText,
  MessageSquare,
  RefreshCw,
  Share2,
  ShieldCheck,
  Trash2,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  crmSharedShortlistUrl,
  reportContentUrl,
  type AccountSummary,
  type AgencyMemberRole,
  type AgencyMembershipStatus,
  type AgencyWorkspace,
  type AgencyWorkspaceSummary,
  type CrmClient,
  type CrmClientDetail,
  type CrmClientStatus,
  type CrmNoteVisibility,
  type CrmSharePreview,
  type CrmShortlist,
  type PlanLimits,
  type ReportOrder,
  type SubscriptionPlan,
} from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";

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
const CRM_CLIENT_STATUS_OPTIONS: CrmClientStatus[] = [
  "active",
  "paused",
  "won",
  "lost",
  "archived",
];
const CRM_CLIENT_STATUS_LABELS: Record<CrmClientStatus, string> = {
  active: "Active",
  paused: "Paused",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};
const CRM_NOTE_VISIBILITY_LABELS: Record<CrmNoteVisibility, string> = {
  internal: "Internal",
  client_shareable: "Client shareable",
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
  const [crmClients, setCrmClients] = useState<CrmClient[]>([]);
  const [selectedCrmClient, setSelectedCrmClient] = useState<CrmClientDetail | null>(null);
  const [crmSharePreview, setCrmSharePreview] = useState<CrmSharePreview | null>(null);
  const [crmBusy, setCrmBusy] = useState(false);
  const [crmClientForm, setCrmClientForm] = useState({
    display_name: "",
    email: "",
    phone: "",
    city: "Wrocław",
    district: "",
    budget_min: "",
    budget_max: "",
    preferred_rooms: "",
    tags: "",
    consent_to_contact: false,
    profile_notes: "",
  });
  const [crmNoteForm, setCrmNoteForm] = useState({
    body: "",
    visibility: "internal" as CrmNoteVisibility,
    pinned: false,
  });
  const [crmShortlistForm, setCrmShortlistForm] = useState({
    title: "",
    listing_ids: "wr-001, wr-002",
    report_ids: "",
    client_message: "",
    share_enabled: true,
  });
  const [status, setStatus] = useState("Загрузка аккаунта...");
  const [error, setError] = useState("");

  const loadCrmForAgency = useCallback(
    async (agencyId: string, preferredClientId?: string | null) => {
      setCrmBusy(true);
      setCrmSharePreview(null);
      try {
        const clients = await api.listAgencyCrmClients(agencyId, { limit: 50 });
        setCrmClients(clients);
        const clientId =
          preferredClientId && clients.some((client) => client.id === preferredClientId)
            ? preferredClientId
            : clients[0]?.id;
        if (clientId) {
          setSelectedCrmClient(await api.getAgencyCrmClient(agencyId, clientId));
        } else {
          setSelectedCrmClient(null);
        }
      } catch (caught) {
        setStatus(caught instanceof Error ? caught.message : "Ошибка загрузки CRM");
      } finally {
        setCrmBusy(false);
      }
    },
    [],
  );

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

  const selectedAgencyId = selectedAgency?.id ?? null;

  useEffect(() => {
    if (!selectedAgencyId) {
      setCrmClients([]);
      setSelectedCrmClient(null);
      setCrmSharePreview(null);
      return;
    }
    void loadCrmForAgency(selectedAgencyId);
  }, [loadCrmForAgency, selectedAgencyId]);

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

  async function selectCrmClient(clientId: string) {
    if (!selectedAgency) return;
    setCrmBusy(true);
    setCrmSharePreview(null);
    setStatus("Загрузка CRM клиента...");
    try {
      setSelectedCrmClient(await api.getAgencyCrmClient(selectedAgency.id, clientId));
      setStatus("CRM клиент выбран");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка загрузки CRM клиента");
    } finally {
      setCrmBusy(false);
    }
  }

  async function createCrmClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !crmClientForm.display_name.trim()) {
      setStatus("Имя CRM клиента обязательно");
      return;
    }
    setCrmBusy(true);
    setStatus("Создание CRM клиента...");
    try {
      const created = await api.createAgencyCrmClient(selectedAgency.id, {
        display_name: crmClientForm.display_name,
        email: blankToNull(crmClientForm.email),
        phone: blankToNull(crmClientForm.phone),
        city: blankToNull(crmClientForm.city),
        district: blankToNull(crmClientForm.district),
        budget_min: toOptionalNumber(crmClientForm.budget_min),
        budget_max: toOptionalNumber(crmClientForm.budget_max),
        preferred_rooms: parseNumberList(crmClientForm.preferred_rooms),
        tags: parseTokenList(crmClientForm.tags),
        consent_to_contact: crmClientForm.consent_to_contact,
        profile_notes: blankToNull(crmClientForm.profile_notes),
      });
      setCrmClientForm({
        display_name: "",
        email: "",
        phone: "",
        city: selectedAgency.city ?? "Wrocław",
        district: "",
        budget_min: "",
        budget_max: "",
        preferred_rooms: "",
        tags: "",
        consent_to_contact: false,
        profile_notes: "",
      });
      await loadCrmForAgency(selectedAgency.id, created.id);
      setStatus("CRM клиент создан");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка создания CRM клиента");
    } finally {
      setCrmBusy(false);
    }
  }

  async function updateCrmClientStatus(clientStatus: CrmClientStatus) {
    if (!selectedAgency || !selectedCrmClient) return;
    setCrmBusy(true);
    setStatus("Обновление статуса клиента...");
    try {
      await api.updateAgencyCrmClient(selectedAgency.id, selectedCrmClient.id, {
        status: clientStatus,
      });
      await loadCrmForAgency(selectedAgency.id, selectedCrmClient.id);
      setStatus("Статус CRM клиента обновлен");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка обновления CRM клиента");
    } finally {
      setCrmBusy(false);
    }
  }

  async function createCrmNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !selectedCrmClient || !crmNoteForm.body.trim()) {
      setStatus("Текст заметки обязателен");
      return;
    }
    setCrmBusy(true);
    setStatus("Добавление заметки...");
    try {
      await api.createAgencyCrmNote(selectedAgency.id, selectedCrmClient.id, {
        body: crmNoteForm.body,
        visibility: crmNoteForm.visibility,
        pinned: crmNoteForm.pinned,
      });
      setCrmNoteForm({ body: "", visibility: "internal", pinned: false });
      await loadCrmForAgency(selectedAgency.id, selectedCrmClient.id);
      setStatus("CRM заметка добавлена");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка добавления заметки");
    } finally {
      setCrmBusy(false);
    }
  }

  async function createCrmShortlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !selectedCrmClient) return;
    const listingIds = parseTokenList(crmShortlistForm.listing_ids);
    if (!crmShortlistForm.title.trim() || listingIds.length === 0) {
      setStatus("Название shortlist и хотя бы один listing id обязательны");
      return;
    }
    setCrmBusy(true);
    setCrmSharePreview(null);
    setStatus("Сборка CRM shortlist...");
    try {
      const created = await api.createAgencyCrmShortlist(selectedAgency.id, selectedCrmClient.id, {
        title: crmShortlistForm.title,
        listing_ids: listingIds,
        report_ids: parseTokenList(crmShortlistForm.report_ids),
        client_message: blankToNull(crmShortlistForm.client_message),
        share_enabled: crmShortlistForm.share_enabled,
      });
      setCrmShortlistForm({
        title: "",
        listing_ids: "wr-001, wr-002",
        report_ids: "",
        client_message: "",
        share_enabled: true,
      });
      await loadCrmForAgency(selectedAgency.id, selectedCrmClient.id);
      if (created.share_enabled) {
        setCrmSharePreview(
          await api.previewAgencyCrmShortlistShare(
            selectedAgency.id,
            selectedCrmClient.id,
            created.id,
          ),
        );
      }
      setStatus("CRM shortlist создан");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка сборки CRM shortlist");
    } finally {
      setCrmBusy(false);
    }
  }

  async function toggleCrmShortlistShare(shortlist: CrmShortlist) {
    if (!selectedAgency || !selectedCrmClient) return;
    const nextShareEnabled = !shortlist.share_enabled;
    setCrmBusy(true);
    setCrmSharePreview(null);
    setStatus(nextShareEnabled ? "Включение шаринга..." : "Отключение шаринга...");
    try {
      const updated = await api.updateAgencyCrmShortlist(
        selectedAgency.id,
        selectedCrmClient.id,
        shortlist.id,
        {
          share_enabled: nextShareEnabled,
          expires_in_days: nextShareEnabled ? 14 : undefined,
        },
      );
      await loadCrmForAgency(selectedAgency.id, selectedCrmClient.id);
      if (updated.share_enabled) {
        setCrmSharePreview(
          await api.previewAgencyCrmShortlistShare(
            selectedAgency.id,
            selectedCrmClient.id,
            updated.id,
          ),
        );
      }
      setStatus(nextShareEnabled ? "Шаринг включен" : "Шаринг отключен");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка обновления шаринга");
    } finally {
      setCrmBusy(false);
    }
  }

  async function previewCrmShare(shortlist: CrmShortlist) {
    if (!selectedAgency || !selectedCrmClient) return;
    setCrmBusy(true);
    setStatus("Генерация share preview...");
    try {
      setCrmSharePreview(
        await api.previewAgencyCrmShortlistShare(
          selectedAgency.id,
          selectedCrmClient.id,
          shortlist.id,
        ),
      );
      setStatus("Share preview готов");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Ошибка share preview");
    } finally {
      setCrmBusy(false);
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

      {selectedAgency ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2 className="icon-title">
              <MessageSquare size={17} />
              Agency CRM
            </h2>
            <div className="toolbar">
              <span className="muted">
                {crmClients.length} clients · {selectedAgency.name}
              </span>
              <button
                className="button"
                type="button"
                disabled={crmBusy}
                onClick={() => void loadCrmForAgency(selectedAgency.id, selectedCrmClient?.id)}
              >
                <RefreshCw size={16} />
                Обновить CRM
              </button>
            </div>
          </div>
          <div className="panel-body">
            <form className="form-grid wide" onSubmit={(event) => void createCrmClient(event)}>
              <label className="field">
                <span>Клиент</span>
                <input
                  className="input"
                  value={crmClientForm.display_name}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      display_name: event.target.value,
                    }))
                  }
                  placeholder="Anna Buyer"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  className="input"
                  value={crmClientForm.email}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="anna@example.com"
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  className="input"
                  value={crmClientForm.phone}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="+48..."
                />
              </label>
              <label className="field">
                <span>City</span>
                <input
                  className="input"
                  value={crmClientForm.city}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>District</span>
                <input
                  className="input"
                  value={crmClientForm.district}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      district: event.target.value,
                    }))
                  }
                  placeholder="Fabryczna"
                />
              </label>
              <label className="field">
                <span>Budget min</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={crmClientForm.budget_min}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      budget_min: event.target.value,
                    }))
                  }
                  placeholder="650000"
                />
              </label>
              <label className="field">
                <span>Budget max</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={crmClientForm.budget_max}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      budget_max: event.target.value,
                    }))
                  }
                  placeholder="900000"
                />
              </label>
              <label className="field">
                <span>Rooms</span>
                <input
                  className="input"
                  value={crmClientForm.preferred_rooms}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      preferred_rooms: event.target.value,
                    }))
                  }
                  placeholder="2, 3"
                />
              </label>
              <label className="field">
                <span>Tags</span>
                <input
                  className="input"
                  value={crmClientForm.tags}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder="family, investor"
                />
              </label>
              <label className="field">
                <span>Profile notes</span>
                <input
                  className="input"
                  value={crmClientForm.profile_notes}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      profile_notes: event.target.value,
                    }))
                  }
                  placeholder="Quiet building, tram access"
                />
              </label>
              <label className="field inline-field">
                <input
                  type="checkbox"
                  checked={crmClientForm.consent_to_contact}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      consent_to_contact: event.target.checked,
                    }))
                  }
                />
                <span>Consent</span>
              </label>
              <div className="field">
                <span>Action</span>
                <button className="button primary" type="submit" disabled={crmBusy}>
                  <UserPlus size={16} />
                  Создать клиента
                </button>
              </div>
            </form>

            <div className="crm-layout">
              <aside className="crm-client-list">
                {crmClients.length > 0 ? (
                  crmClients.map((client) => (
                    <button
                      key={client.id}
                      className={
                        client.id === selectedCrmClient?.id
                          ? "crm-client-button selected"
                          : "crm-client-button"
                      }
                      type="button"
                      disabled={crmBusy}
                      onClick={() => void selectCrmClient(client.id)}
                    >
                      <strong>{client.display_name}</strong>
                      <small>
                        {CRM_CLIENT_STATUS_LABELS[client.status]} · {client.city ?? "-"}
                      </small>
                      <span>{formatBudget(client.budget_min, client.budget_max)}</span>
                    </button>
                  ))
                ) : (
                  <p className="empty-state">CRM clients появятся здесь после создания.</p>
                )}
              </aside>

              {selectedCrmClient ? (
                <div className="crm-detail">
                  <div className="panel-header inline">
                    <h3>{selectedCrmClient.display_name}</h3>
                    <div className="toolbar">
                      <span className={`status-pill ${crmClientStatusTone(selectedCrmClient.status)}`}>
                        {CRM_CLIENT_STATUS_LABELS[selectedCrmClient.status]}
                      </span>
                      <select
                        className="select"
                        value={selectedCrmClient.status}
                        disabled={crmBusy}
                        onChange={(event) =>
                          void updateCrmClientStatus(event.target.value as CrmClientStatus)
                        }
                      >
                        {CRM_CLIENT_STATUS_OPTIONS.map((clientStatus) => (
                          <option key={clientStatus} value={clientStatus}>
                            {CRM_CLIENT_STATUS_LABELS[clientStatus]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="metric-grid">
                    <div className="metric">
                      <span>Budget</span>
                      <strong>
                        {formatBudget(selectedCrmClient.budget_min, selectedCrmClient.budget_max)}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>Rooms</span>
                      <strong>{formatRooms(selectedCrmClient.preferred_rooms)}</strong>
                    </div>
                    <div className="metric">
                      <span>Location</span>
                      <strong>
                        {[selectedCrmClient.city, selectedCrmClient.district]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>Consent</span>
                      <strong>{selectedCrmClient.consent_to_contact ? "Yes" : "No"}</strong>
                    </div>
                  </div>

                  {selectedCrmClient.tags.length > 0 || selectedCrmClient.profile_notes ? (
                    <div className="meta-row">
                      {selectedCrmClient.tags.map((tag) => (
                        <span className="status-pill info" key={tag}>
                          {tag}
                        </span>
                      ))}
                      {selectedCrmClient.profile_notes ? (
                        <span>{selectedCrmClient.profile_notes}</span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="crm-subgrid">
                    <form className="crm-card-list" onSubmit={(event) => void createCrmNote(event)}>
                      <div className="panel-header inline">
                        <h3 className="icon-title">
                          <MessageSquare size={16} />
                          Notes
                        </h3>
                        <span className="muted">{selectedCrmClient.notes.length}</span>
                      </div>
                      <label className="field">
                        <span>Note</span>
                        <textarea
                          className="textarea"
                          value={crmNoteForm.body}
                          onChange={(event) =>
                            setCrmNoteForm((current) => ({
                              ...current,
                              body: event.target.value,
                            }))
                          }
                          placeholder="Что важно для клиента или проверки объекта"
                        />
                      </label>
                      <div className="form-grid compact">
                        <label className="field">
                          <span>Visibility</span>
                          <select
                            className="select"
                            value={crmNoteForm.visibility}
                            onChange={(event) =>
                              setCrmNoteForm((current) => ({
                                ...current,
                                visibility: event.target.value as CrmNoteVisibility,
                              }))
                            }
                          >
                            {Object.entries(CRM_NOTE_VISIBILITY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field inline-field">
                          <input
                            type="checkbox"
                            checked={crmNoteForm.pinned}
                            onChange={(event) =>
                              setCrmNoteForm((current) => ({
                                ...current,
                                pinned: event.target.checked,
                              }))
                            }
                          />
                          <span>Pinned</span>
                        </label>
                        <div className="field">
                          <span>Action</span>
                          <button className="button" type="submit" disabled={crmBusy}>
                            Добавить note
                          </button>
                        </div>
                      </div>
                      <ul className="section-list compact">
                        {selectedCrmClient.notes.slice(0, 5).map((note) => (
                          <li key={note.id}>
                            <strong>
                              {note.pinned ? "Pinned · " : ""}
                              {CRM_NOTE_VISIBILITY_LABELS[note.visibility]}
                            </strong>
                            <p className="muted">{note.body}</p>
                          </li>
                        ))}
                      </ul>
                    </form>

                    <form
                      className="crm-card-list"
                      onSubmit={(event) => void createCrmShortlist(event)}
                    >
                      <div className="panel-header inline">
                        <h3 className="icon-title">
                          <FileText size={16} />
                          Shortlist
                        </h3>
                        <span className="muted">{selectedCrmClient.shortlists.length}</span>
                      </div>
                      <label className="field">
                        <span>Title</span>
                        <input
                          className="input"
                          value={crmShortlistForm.title}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          placeholder="Top options for Anna"
                        />
                      </label>
                      <label className="field">
                        <span>Listing IDs</span>
                        <input
                          className="input"
                          value={crmShortlistForm.listing_ids}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              listing_ids: event.target.value,
                            }))
                          }
                          placeholder="wr-001, wr-002"
                        />
                      </label>
                      <label className="field">
                        <span>Report IDs</span>
                        <input
                          className="input"
                          value={crmShortlistForm.report_ids}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              report_ids: event.target.value,
                            }))
                          }
                          placeholder="optional saved reports"
                        />
                      </label>
                      <label className="field">
                        <span>Client message</span>
                        <textarea
                          className="textarea"
                          value={crmShortlistForm.client_message}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              client_message: event.target.value,
                            }))
                          }
                          placeholder="These options are worth discussing before viewings."
                        />
                      </label>
                      <div className="form-grid compact">
                        <label className="field inline-field">
                          <input
                            type="checkbox"
                            checked={crmShortlistForm.share_enabled}
                            onChange={(event) =>
                              setCrmShortlistForm((current) => ({
                                ...current,
                                share_enabled: event.target.checked,
                              }))
                            }
                          />
                          <span>Share link</span>
                        </label>
                        <div className="field">
                          <span>Action</span>
                          <button className="button primary" type="submit" disabled={crmBusy}>
                            <Share2 size={16} />
                            Собрать
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {selectedCrmClient.shortlists.length > 0 ? (
                    <div className="crm-card-list">
                      {selectedCrmClient.shortlists.map((shortlist) => (
                        <article className="crm-shortlist-card" key={shortlist.id}>
                          <div className="panel-header inline">
                            <h3>{shortlist.title}</h3>
                            <div className="toolbar">
                              <span className={`status-pill ${shortlistStatusTone(shortlist)}`}>
                                {shortlist.status}
                              </span>
                              <span className="muted">
                                {shortlist.items.length} listings · {formatDate(shortlist.updated_at)}
                              </span>
                            </div>
                          </div>
                          {shortlist.client_message ? (
                            <p className="muted">{shortlist.client_message}</p>
                          ) : null}
                          <CrmShortlistItems items={shortlist.items} />
                          <div className="button-row">
                            <button
                              className="button"
                              type="button"
                              disabled={crmBusy}
                              onClick={() => void toggleCrmShortlistShare(shortlist)}
                            >
                              <Share2 size={16} />
                              {shortlist.share_enabled ? "Отключить share" : "Включить share"}
                            </button>
                            <button
                              className="button"
                              type="button"
                              disabled={crmBusy || !shortlist.share_enabled}
                              onClick={() => void previewCrmShare(shortlist)}
                            >
                              <Clipboard size={16} />
                              Preview
                            </button>
                            {shortlist.share_token ? (
                              <a
                                className="button"
                                href={crmSharedShortlistUrl(shortlist.share_token)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Public link
                              </a>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Shortlists появятся после сборки по listing ids.</p>
                  )}

                  {crmSharePreview ? <CrmSharePreviewBlock preview={crmSharePreview} /> : null}
                </div>
              ) : (
                <p className="empty-state">Выбери или создай CRM клиента для заметок и shortlist.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

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

function CrmShortlistItems({ items }: { items: CrmShortlist["items"] }) {
  if (items.length === 0) {
    return <p className="empty-state">В shortlist пока нет валидных объектов из базы.</p>;
  }
  return (
    <div className="table-scroll">
      <table className="table crm-shortlist-table">
        <thead>
          <tr>
            <th>Объект</th>
            <th>Цена</th>
            <th>Score</th>
            <th>Fair delta</th>
            <th>Developer</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.listing_id}>
              <td>
                <strong>
                  #{item.rank} · {item.title}
                </strong>
                <small>
                  {item.city}, {item.district}, {item.address} · {item.rooms} pok. ·{" "}
                  {numberValue(item.area_m2)} m2
                </small>
              </td>
              <td>
                <strong>{money(item.price)}</strong>
                <small>{money(Math.round(item.price / Math.max(item.area_m2, 1)))}/m2</small>
              </td>
              <td>
                <strong>{item.decision_score}/100</strong>
                <small>
                  Risk {item.risk_score}/100 · liquidity {item.liquidity_score}/100
                </small>
              </td>
              <td>
                <strong>{percent(item.price_delta_to_fair_mid_pct)}</strong>
                <small>Fair mid {money(item.fair_price_mid_pln)}</small>
              </td>
              <td>
                <strong>{item.developer_name ?? "-"}</strong>
                <small>
                  {item.developer_reputation_score !== null
                    ? `${item.developer_reputation_score}/100 · ${item.developer_reputation_label}`
                    : "no reputation data"}
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CrmSharePreviewBlock({ preview }: { preview: CrmSharePreview }) {
  return (
    <div className="crm-share-preview">
      <div className="panel-header inline">
        <h3 className="icon-title">
          <Share2 size={16} />
          Share preview
        </h3>
        {preview.share_token ? (
          <a
            className="button"
            href={crmSharedShortlistUrl(preview.share_token)}
            target="_blank"
            rel="noreferrer"
          >
            Public link
          </a>
        ) : null}
      </div>
      <p>
        <strong>{preview.title}</strong>
        {preview.client_display_name ? ` · ${preview.client_display_name}` : ""}
      </p>
      {preview.client_message ? <p className="muted">{preview.client_message}</p> : null}
      {preview.client_shareable_notes.length > 0 ? (
        <ul className="section-list compact">
          {preview.client_shareable_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <CrmShortlistItems items={preview.items} />
      <p className="muted">{preview.disclaimer}</p>
    </div>
  );
}

function planWeight(plan: SubscriptionPlan) {
  return ["free", "buyer_pro", "investor", "realtor", "agency", "enterprise"].indexOf(plan);
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/\s/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseTokenList(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function parseNumberList(value: string) {
  return parseTokenList(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function formatBudget(minValue: number | null, maxValue: number | null) {
  if (minValue !== null && maxValue !== null) return `${money(minValue)} - ${money(maxValue)}`;
  if (maxValue !== null) return `до ${money(maxValue)}`;
  if (minValue !== null) return `от ${money(minValue)}`;
  return "-";
}

function formatRooms(rooms: number[]) {
  return rooms.length > 0 ? rooms.join(", ") : "-";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function crmClientStatusTone(status: CrmClientStatus) {
  if (status === "active" || status === "won") return "healthy";
  if (status === "paused") return "warning";
  if (status === "lost") return "rejected";
  return "info";
}

function shortlistStatusTone(shortlist: CrmShortlist) {
  if (shortlist.status === "accepted") return "healthy";
  if (shortlist.status === "shared") return shortlist.share_enabled ? "info" : "warning";
  if (shortlist.status === "rejected") return "rejected";
  if (shortlist.status === "archived") return "warning";
  return "queued";
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
