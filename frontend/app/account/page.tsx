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
import { ACCOUNT_PAGE_COPY, type AccountPageCopy, type Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const AGENCY_ROLE_OPTIONS: AgencyMemberRole[] = ["agent", "admin", "owner"];
const AGENCY_STATUS_OPTIONS: AgencyMembershipStatus[] = ["active", "invited", "disabled"];
const CRM_CLIENT_STATUS_OPTIONS: CrmClientStatus[] = [
  "active",
  "paused",
  "won",
  "lost",
  "archived",
];
const CRM_NOTE_VISIBILITY_OPTIONS: CrmNoteVisibility[] = ["internal", "client_shareable"];
const ACCOUNT_INTL_LOCALES: Record<Locale, string> = {
  en: "en-US",
  pl: "pl-PL",
  ru: "ru-RU",
  uk: "uk-UA",
};

export default function AccountPage() {
  const { locale } = useLocalePreference();
  const copy = ACCOUNT_PAGE_COPY[locale];
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
  const [status, setStatus] = useState(copy.statuses.loadingAccount);
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
        setStatus(caught instanceof Error ? caught.message : copy.statuses.loadingCrmError);
      } finally {
        setCrmBusy(false);
      }
    },
    [copy],
  );

  const load = useCallback(async (preferredAgencyId?: string | null) => {
    setError("");
    setStatus(copy.statuses.loadingAccount);
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
      setStatus(copy.statuses.accountUpdated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.statuses.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    }
  }, [copy]);

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
    setStatus(copy.statuses.switchingPlan(copy.labels.plan[plan] ?? plan));
    const updated = await api.updateSubscription(plan);
    setAccount(updated);
    setStatus(copy.statuses.planChanged(copy.labels.plan[updated.subscription.plan] ?? updated.subscription.plan));
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
    setStatus(copy.statuses.loadingWorkspace);
    try {
      setSelectedAgency(await api.getAgency(agencyId));
      setStatus(copy.statuses.workspaceSelected);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.loadingWorkspaceError);
    } finally {
      setAgencyBusy(false);
    }
  }

  async function createAgency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agencyForm.name.trim()) {
      setStatus(copy.statuses.agencyNameRequired);
      return;
    }
    setAgencyBusy(true);
    setStatus(copy.statuses.creatingAgency);
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
      setStatus(copy.statuses.agencyCreated);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.agencyCreateError);
    } finally {
      setAgencyBusy(false);
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !memberForm.user_id.trim()) {
      setStatus(copy.statuses.memberUserIdRequired);
      return;
    }
    setAgencyBusy(true);
    setStatus(copy.statuses.addingMember);
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
      setStatus(copy.statuses.memberAdded);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.addMemberError);
    } finally {
      setAgencyBusy(false);
    }
  }

  async function updateMemberRole(membershipId: string, role: AgencyMemberRole) {
    if (!selectedAgency) return;
    setAgencyBusy(true);
    setStatus(copy.statuses.updatingRole);
    try {
      await api.updateAgencyMember(selectedAgency.id, membershipId, { role });
      await refreshAgency(selectedAgency.id);
      setStatus(copy.statuses.roleUpdated);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.roleUpdateError);
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
    setStatus(copy.statuses.updatingStatus);
    try {
      await api.updateAgencyMember(selectedAgency.id, membershipId, { status: memberStatus });
      await refreshAgency(selectedAgency.id);
      setStatus(copy.statuses.statusUpdated);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.statusUpdateError);
    } finally {
      setAgencyBusy(false);
    }
  }

  async function removeMember(membershipId: string) {
    if (!selectedAgency) return;
    setAgencyBusy(true);
    setStatus(copy.statuses.removingMember);
    try {
      await api.removeAgencyMember(selectedAgency.id, membershipId);
      await refreshAgency(selectedAgency.id);
      setStatus(copy.statuses.memberRemoved);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.removeMemberError);
    } finally {
      setAgencyBusy(false);
    }
  }

  async function selectCrmClient(clientId: string) {
    if (!selectedAgency) return;
    setCrmBusy(true);
    setCrmSharePreview(null);
    setStatus(copy.statuses.loadingCrmClient);
    try {
      setSelectedCrmClient(await api.getAgencyCrmClient(selectedAgency.id, clientId));
      setStatus(copy.statuses.crmClientSelected);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.crmClientLoadError);
    } finally {
      setCrmBusy(false);
    }
  }

  async function createCrmClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !crmClientForm.display_name.trim()) {
      setStatus(copy.statuses.crmClientNameRequired);
      return;
    }
    setCrmBusy(true);
    setStatus(copy.statuses.creatingCrmClient);
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
      setStatus(copy.statuses.crmClientCreated);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.crmClientCreateError);
    } finally {
      setCrmBusy(false);
    }
  }

  async function updateCrmClientStatus(clientStatus: CrmClientStatus) {
    if (!selectedAgency || !selectedCrmClient) return;
    setCrmBusy(true);
    setStatus(copy.statuses.updatingCrmClientStatus);
    try {
      await api.updateAgencyCrmClient(selectedAgency.id, selectedCrmClient.id, {
        status: clientStatus,
      });
      await loadCrmForAgency(selectedAgency.id, selectedCrmClient.id);
      setStatus(copy.statuses.crmClientStatusUpdated);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.crmClientUpdateError);
    } finally {
      setCrmBusy(false);
    }
  }

  async function createCrmNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !selectedCrmClient || !crmNoteForm.body.trim()) {
      setStatus(copy.statuses.noteBodyRequired);
      return;
    }
    setCrmBusy(true);
    setStatus(copy.statuses.addingNote);
    try {
      await api.createAgencyCrmNote(selectedAgency.id, selectedCrmClient.id, {
        body: crmNoteForm.body,
        visibility: crmNoteForm.visibility,
        pinned: crmNoteForm.pinned,
      });
      setCrmNoteForm({ body: "", visibility: "internal", pinned: false });
      await loadCrmForAgency(selectedAgency.id, selectedCrmClient.id);
      setStatus(copy.statuses.noteAdded);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.noteAddError);
    } finally {
      setCrmBusy(false);
    }
  }

  async function createCrmShortlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgency || !selectedCrmClient) return;
    const listingIds = parseTokenList(crmShortlistForm.listing_ids);
    if (!crmShortlistForm.title.trim() || listingIds.length === 0) {
      setStatus(copy.statuses.shortlistRequired);
      return;
    }
    setCrmBusy(true);
    setCrmSharePreview(null);
    setStatus(copy.statuses.buildingShortlist);
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
      setStatus(copy.statuses.shortlistCreated);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.shortlistCreateError);
    } finally {
      setCrmBusy(false);
    }
  }

  async function toggleCrmShortlistShare(shortlist: CrmShortlist) {
    if (!selectedAgency || !selectedCrmClient) return;
    const nextShareEnabled = !shortlist.share_enabled;
    setCrmBusy(true);
    setCrmSharePreview(null);
    setStatus(nextShareEnabled ? copy.statuses.enablingShare : copy.statuses.disablingShare);
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
      setStatus(nextShareEnabled ? copy.statuses.shareEnabled : copy.statuses.shareDisabled);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.shareUpdateError);
    } finally {
      setCrmBusy(false);
    }
  }

  async function previewCrmShare(shortlist: CrmShortlist) {
    if (!selectedAgency || !selectedCrmClient) return;
    setCrmBusy(true);
    setStatus(copy.statuses.generatingSharePreview);
    try {
      setCrmSharePreview(
        await api.previewAgencyCrmShortlistShare(
          selectedAgency.id,
          selectedCrmClient.id,
          shortlist.id,
        ),
      );
      setStatus(copy.statuses.sharePreviewReady);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : copy.statuses.sharePreviewError);
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

  if (error) return <ErrorBlock message={error} prefix={copy.errorPrefix} />;
  if (!account) return <LoadingBlock label={copy.statuses.loadingAccountAndLimits} />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <button className="button" type="button" onClick={() => void load(selectedAgency?.id)}>
          <RefreshCw size={16} /> {copy.actions.refresh}
        </button>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>{copy.metrics.plan}</span>
          <strong>{copy.labels.plan[currentPlan]}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.role}</span>
          <strong>{copy.labels.userRole[account.user.role] ?? account.user.role}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.reports}</span>
          <strong>
            {numberValue(account.usage.reports_this_month, locale)}/
            {numberValue(account.limits.monthly_reports, locale)}
          </strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.credits}</span>
          <strong>{numberValue(account.usage.report_credits_available, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.alerts}</span>
          <strong>
            {numberValue(account.usage.alerts, locale)}/
            {numberValue(account.limits.max_alerts, locale)}
          </strong>
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>{copy.sections.plans}</h2>
            <span className="status-line">{status}</span>
          </div>
          <div className="panel-body plan-grid">
            {sortedPlans.map((plan) => (
              <article
                key={plan.plan}
                className={plan.plan === currentPlan ? "plan-card active" : "plan-card"}
              >
                <div className="plan-card-header">
                  <strong>{copy.labels.plan[plan.plan]}</strong>
                  {plan.plan === currentPlan ? (
                    <span className="score-pill">{copy.values.activeBadge}</span>
                  ) : null}
                </div>
                <ul className="section-list compact">
                  <li>{copy.values.favorites(numberValue(plan.max_favorites, locale))}</li>
                  <li>{copy.values.alerts(numberValue(plan.max_alerts, locale))}</li>
                  <li>{copy.values.monthlyReports(numberValue(plan.monthly_reports, locale))}</li>
                  <li>
                    {plan.can_white_label
                      ? copy.values.whiteLabelReports
                      : copy.values.noWhiteLabel}
                  </li>
                </ul>
                <button
                  className={plan.plan === currentPlan ? "button" : "button primary"}
                  type="button"
                  disabled={plan.plan === currentPlan}
                  onClick={() => void switchPlan(plan.plan)}
                >
                  <CreditCard size={16} />
                  {plan.plan === currentPlan ? copy.actions.current : copy.actions.choose}
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.sections.profile}</h2>
            <UserCircle size={18} />
          </div>
          <div className="panel-body">
            <ul className="section-list">
              <li>
                {copy.fields.id}: {account.user.id}
              </li>
              <li>
                {copy.fields.email}: {account.user.email ?? copy.values.noValue}
              </li>
              <li>
                {copy.metrics.status}:{" "}
                {copy.labels.subscriptionStatus[account.subscription.status] ??
                  account.subscription.status}
              </li>
              <li>
                {copy.fields.planId}: {account.subscription.id}
              </li>
            </ul>

            <h2>{copy.sections.usage}</h2>
            <UsageBar
              label={copy.labels.capability.favorites}
              value={account.usage.favorites}
              limit={account.limits.max_favorites}
              locale={locale}
            />
            <UsageBar
              label={copy.metrics.alerts}
              value={account.usage.alerts}
              limit={account.limits.max_alerts}
              locale={locale}
            />
            <UsageBar
              label={copy.metrics.reports}
              value={account.usage.reports_this_month}
              limit={account.limits.monthly_reports}
              locale={locale}
            />
            <p className="muted">
              {copy.values.reportCredits(
                numberValue(account.usage.report_credits_available, locale),
              )}
            </p>

            <h2>{copy.sections.capabilities}</h2>
            <div className="capability-list">
              <Capability label={copy.labels.capability.export} enabled={account.limits.can_export} />
              <Capability label={copy.labels.capability.api} enabled={account.limits.can_use_api} />
              <Capability
                label={copy.labels.capability.white_label}
                enabled={account.limits.can_white_label}
              />
            </div>
          </div>
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
            <h2>{copy.sections.agencyWorkspace}</h2>
            <span className="muted">{copy.values.workspaces(agencies.length)}</span>
        </div>
        <div className="panel-body">
          <form className="form-grid compact" onSubmit={(event) => void createAgency(event)}>
            <label className="field">
              <span>{copy.fields.name}</span>
              <input
                className="input"
                value={agencyForm.name}
                onChange={(event) =>
                  setAgencyForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={copy.placeholders.agencyName}
              />
            </label>
            <label className="field">
              <span>{copy.fields.billingEmail}</span>
              <input
                className="input"
                value={agencyForm.billing_email}
                onChange={(event) =>
                  setAgencyForm((current) => ({
                    ...current,
                    billing_email: event.target.value,
                  }))
                }
                placeholder={copy.placeholders.billingEmail}
              />
            </label>
            <label className="field">
              <span>{copy.fields.website}</span>
              <input
                className="input"
                value={agencyForm.website_url}
                onChange={(event) =>
                  setAgencyForm((current) => ({
                    ...current,
                    website_url: event.target.value,
                  }))
                }
                placeholder={copy.placeholders.website}
              />
            </label>
            <label className="field">
              <span>{copy.fields.city}</span>
              <input
                className="input"
                value={agencyForm.city}
                onChange={(event) =>
                  setAgencyForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </label>
            <div className="field">
              <span>{copy.fields.action}</span>
              <button
                className="button primary"
                type="submit"
                disabled={!canCreateAgency || agencyBusy}
              >
                <Building2 size={16} />
                {copy.actions.create}
              </button>
            </div>
            <div className="field">
              <span>{copy.fields.plan}</span>
              <span className={canCreateAgency ? "status-pill healthy" : "status-pill warning"}>
                {canCreateAgency ? copy.values.agencyEnabled : copy.values.agencyPlanRequired}
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
                  {copy.labels.agencyRole[selectedAgency.current_user_role] ??
                    selectedAgency.current_user_role}
                </span>
              </div>
              <div className="metric-grid" style={{ marginBottom: 14 }}>
                <div className="metric">
                  <span>{copy.metrics.owner}</span>
                  <strong>{selectedAgency.owner_id}</strong>
                </div>
                <div className="metric">
                  <span>{copy.metrics.city}</span>
                  <strong>{selectedAgency.city ?? copy.values.noValue}</strong>
                </div>
                <div className="metric">
                  <span>{copy.metrics.members}</span>
                  <strong>{numberValue(selectedAgency.members_count, locale)}</strong>
                </div>
                <div className="metric">
                  <span>{copy.metrics.status}</span>
                  <strong>
                    {copy.labels.agencyStatus[selectedAgency.current_user_status] ??
                      selectedAgency.current_user_status}
                  </strong>
                </div>
              </div>

              <form className="form-grid compact" onSubmit={(event) => void addMember(event)}>
                <label className="field">
                  <span>{copy.fields.userId}</span>
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
                    placeholder={copy.placeholders.userId}
                  />
                </label>
                <label className="field">
                  <span>{copy.fields.email}</span>
                  <input
                    className="input"
                    value={memberForm.email}
                    disabled={!selectedCanManage}
                    onChange={(event) =>
                      setMemberForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder={copy.placeholders.memberEmail}
                  />
                </label>
                <label className="field">
                  <span>{copy.fields.displayName}</span>
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
                    placeholder={copy.placeholders.memberName}
                  />
                </label>
                <label className="field">
                  <span>{copy.fields.role}</span>
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
                        {copy.labels.agencyRole[role] ?? role}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="field">
                  <span>{copy.fields.action}</span>
                  <button
                    className="button"
                    type="submit"
                    disabled={!selectedCanManage || agencyBusy}
                  >
                    <UserPlus size={16} />
                    {copy.actions.add}
                  </button>
                </div>
              </form>

              <div className="table-scroll" style={{ marginTop: 14 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{copy.tables.member}</th>
                      <th>{copy.tables.email}</th>
                      <th>{copy.tables.role}</th>
                      <th>{copy.tables.status}</th>
                      <th>{copy.tables.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAgency.members.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <strong>{memberDisplayName(member)}</strong>
                          <small>{member.user_id}</small>
                        </td>
                        <td>{member.email ?? copy.values.noValue}</td>
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
                                {copy.labels.agencyRole[role] ?? role}
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
                            {AGENCY_STATUS_OPTIONS.map((value) => (
                              <option key={value} value={value}>
                                {copy.labels.agencyStatus[value] ?? value}
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
                            {copy.actions.delete}
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
              {copy.sections.agencyCrm}
            </h2>
            <div className="toolbar">
              <span className="muted">
                {copy.values.clients(crmClients.length, selectedAgency.name)}
              </span>
              <button
                className="button"
                type="button"
                disabled={crmBusy}
                onClick={() => void loadCrmForAgency(selectedAgency.id, selectedCrmClient?.id)}
              >
                <RefreshCw size={16} />
                {copy.actions.refreshCrm}
              </button>
            </div>
          </div>
          <div className="panel-body">
            <form className="form-grid wide" onSubmit={(event) => void createCrmClient(event)}>
              <label className="field">
                <span>{copy.fields.client}</span>
                <input
                  className="input"
                  value={crmClientForm.display_name}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      display_name: event.target.value,
                    }))
                  }
                  placeholder={copy.placeholders.clientName}
                />
              </label>
              <label className="field">
                <span>{copy.fields.email}</span>
                <input
                  className="input"
                  value={crmClientForm.email}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder={copy.placeholders.clientEmail}
                />
              </label>
              <label className="field">
                <span>{copy.fields.phone}</span>
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
                <span>{copy.fields.city}</span>
                <input
                  className="input"
                  value={crmClientForm.city}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>{copy.fields.district}</span>
                <input
                  className="input"
                  value={crmClientForm.district}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      district: event.target.value,
                    }))
                  }
                  placeholder={copy.placeholders.district}
                />
              </label>
              <label className="field">
                <span>{copy.fields.budgetMin}</span>
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
                  placeholder={copy.placeholders.budgetMin}
                />
              </label>
              <label className="field">
                <span>{copy.fields.budgetMax}</span>
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
                  placeholder={copy.placeholders.budgetMax}
                />
              </label>
              <label className="field">
                <span>{copy.fields.rooms}</span>
                <input
                  className="input"
                  value={crmClientForm.preferred_rooms}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      preferred_rooms: event.target.value,
                    }))
                  }
                  placeholder={copy.placeholders.rooms}
                />
              </label>
              <label className="field">
                <span>{copy.fields.tags}</span>
                <input
                  className="input"
                  value={crmClientForm.tags}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder={copy.placeholders.tags}
                />
              </label>
              <label className="field">
                <span>{copy.fields.profileNotes}</span>
                <input
                  className="input"
                  value={crmClientForm.profile_notes}
                  onChange={(event) =>
                    setCrmClientForm((current) => ({
                      ...current,
                      profile_notes: event.target.value,
                    }))
                  }
                  placeholder={copy.placeholders.profileNotes}
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
                <span>{copy.fields.consent}</span>
              </label>
              <div className="field">
                <span>{copy.fields.action}</span>
                <button className="button primary" type="submit" disabled={crmBusy}>
                  <UserPlus size={16} />
                  {copy.actions.createClient}
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
                        {copy.labels.crmClientStatus[client.status] ?? client.status} ·{" "}
                        {client.city ?? copy.values.noValue}
                      </small>
                      <span>{formatBudget(client.budget_min, client.budget_max, locale, copy)}</span>
                    </button>
                  ))
                ) : (
                  <p className="empty-state">{copy.empty.crmClients}</p>
                )}
              </aside>

              {selectedCrmClient ? (
                <div className="crm-detail">
                  <div className="panel-header inline">
                    <h3>{selectedCrmClient.display_name}</h3>
                    <div className="toolbar">
                      <span className={`status-pill ${crmClientStatusTone(selectedCrmClient.status)}`}>
                        {copy.labels.crmClientStatus[selectedCrmClient.status] ??
                          selectedCrmClient.status}
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
                            {copy.labels.crmClientStatus[clientStatus] ?? clientStatus}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="metric-grid">
                    <div className="metric">
                      <span>{copy.metrics.budget}</span>
                      <strong>
                        {formatBudget(
                          selectedCrmClient.budget_min,
                          selectedCrmClient.budget_max,
                          locale,
                          copy,
                        )}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>{copy.metrics.rooms}</span>
                      <strong>{formatRooms(selectedCrmClient.preferred_rooms, copy)}</strong>
                    </div>
                    <div className="metric">
                      <span>{copy.metrics.location}</span>
                      <strong>
                        {[selectedCrmClient.city, selectedCrmClient.district]
                          .filter(Boolean)
                          .join(", ") || copy.values.noValue}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>{copy.metrics.consent}</span>
                      <strong>
                        {selectedCrmClient.consent_to_contact ? copy.values.yes : copy.values.no}
                      </strong>
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
                          {copy.sections.notes}
                        </h3>
                        <span className="muted">
                          {numberValue(selectedCrmClient.notes.length, locale)}
                        </span>
                      </div>
                      <label className="field">
                        <span>{copy.fields.note}</span>
                        <textarea
                          className="textarea"
                          value={crmNoteForm.body}
                          onChange={(event) =>
                            setCrmNoteForm((current) => ({
                              ...current,
                              body: event.target.value,
                            }))
                          }
                          placeholder={copy.placeholders.note}
                        />
                      </label>
                      <div className="form-grid compact">
                        <label className="field">
                          <span>{copy.fields.visibility}</span>
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
                            {CRM_NOTE_VISIBILITY_OPTIONS.map((value) => (
                              <option key={value} value={value}>
                                {copy.labels.noteVisibility[value] ?? value}
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
                          <span>{copy.fields.pinned}</span>
                        </label>
                        <div className="field">
                          <span>{copy.fields.action}</span>
                          <button className="button" type="submit" disabled={crmBusy}>
                            {copy.actions.addNote}
                          </button>
                        </div>
                      </div>
                      <ul className="section-list compact">
                        {selectedCrmClient.notes.slice(0, 5).map((note) => (
                          <li key={note.id}>
                            <strong>
                              {note.pinned ? copy.values.pinnedPrefix : ""}
                              {copy.labels.noteVisibility[note.visibility] ?? note.visibility}
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
                          {copy.sections.shortlist}
                        </h3>
                        <span className="muted">
                          {numberValue(selectedCrmClient.shortlists.length, locale)}
                        </span>
                      </div>
                      <label className="field">
                        <span>{copy.fields.title}</span>
                        <input
                          className="input"
                          value={crmShortlistForm.title}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          placeholder={copy.placeholders.shortlistTitle}
                        />
                      </label>
                      <label className="field">
                        <span>{copy.fields.listingIds}</span>
                        <input
                          className="input"
                          value={crmShortlistForm.listing_ids}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              listing_ids: event.target.value,
                            }))
                          }
                          placeholder={copy.placeholders.listingIds}
                        />
                      </label>
                      <label className="field">
                        <span>{copy.fields.reportIds}</span>
                        <input
                          className="input"
                          value={crmShortlistForm.report_ids}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              report_ids: event.target.value,
                            }))
                          }
                          placeholder={copy.placeholders.reportIds}
                        />
                      </label>
                      <label className="field">
                        <span>{copy.fields.clientMessage}</span>
                        <textarea
                          className="textarea"
                          value={crmShortlistForm.client_message}
                          onChange={(event) =>
                            setCrmShortlistForm((current) => ({
                              ...current,
                              client_message: event.target.value,
                            }))
                          }
                          placeholder={copy.placeholders.clientMessage}
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
                          <span>{copy.fields.shareLink}</span>
                        </label>
                        <div className="field">
                          <span>{copy.fields.action}</span>
                          <button className="button primary" type="submit" disabled={crmBusy}>
                            <Share2 size={16} />
                            {copy.actions.build}
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
                                {copy.labels.shortlistStatus[shortlist.status] ?? shortlist.status}
                              </span>
                              <span className="muted">
                                {copy.values.listingsUpdated(
                                  shortlist.items.length,
                                  formatDate(shortlist.updated_at, locale),
                                )}
                              </span>
                            </div>
                          </div>
                          {shortlist.client_message ? (
                            <p className="muted">{shortlist.client_message}</p>
                          ) : null}
                          <CrmShortlistItems copy={copy} items={shortlist.items} locale={locale} />
                          <div className="button-row">
                            <button
                              className="button"
                              type="button"
                              disabled={crmBusy}
                              onClick={() => void toggleCrmShortlistShare(shortlist)}
                            >
                              <Share2 size={16} />
                              {shortlist.share_enabled
                                ? copy.actions.disableShare
                                : copy.actions.enableShare}
                            </button>
                            <button
                              className="button"
                              type="button"
                              disabled={crmBusy || !shortlist.share_enabled}
                              onClick={() => void previewCrmShare(shortlist)}
                            >
                              <Clipboard size={16} />
                              {copy.actions.preview}
                            </button>
                            {shortlist.share_token ? (
                              <a
                                className="button"
                                href={crmSharedShortlistUrl(shortlist.share_token)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {copy.actions.publicLink}
                              </a>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">{copy.empty.shortlists}</p>
                  )}

                  {crmSharePreview ? (
                    <CrmSharePreviewBlock copy={copy} locale={locale} preview={crmSharePreview} />
                  ) : null}
                </div>
              ) : (
                <p className="empty-state">{copy.empty.crmClientPrompt}</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{copy.sections.oneTimePurchases}</h2>
          <span className="muted">{copy.values.orders(orders.length)}</span>
        </div>
        <div className="panel-body">
          <table className="table">
            <thead>
              <tr>
                <th>{copy.tables.product}</th>
                <th>{copy.tables.object}</th>
                <th>{copy.tables.status}</th>
                <th>{copy.tables.report}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.product_code}</td>
                  <td>{order.listing_id}</td>
                  <td>{copy.labels.reportOrderStatus[order.status] ?? order.status}</td>
                  <td>
                    {order.generated_report_id ? (
                      <a
                        className="button"
                        href={reportContentUrl(order.generated_report_id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.actions.open}
                      </a>
                    ) : (
                      <span className="muted">{copy.values.noValue}</span>
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

function UsageBar({
  label,
  value,
  limit,
  locale,
}: {
  label: string;
  value: number;
  limit: number;
  locale: Locale;
}) {
  const width = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
  return (
    <div className="usage-row">
      <span>
        {label}: {numberValue(value, locale)}/{numberValue(limit, locale)}
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

function CrmShortlistItems({
  copy,
  items,
  locale,
}: {
  copy: AccountPageCopy;
  items: CrmShortlist["items"];
  locale: Locale;
}) {
  if (items.length === 0) {
    return <p className="empty-state">{copy.empty.shortlistItems}</p>;
  }
  return (
    <div className="table-scroll">
      <table className="table crm-shortlist-table">
        <thead>
          <tr>
            <th>{copy.tables.object}</th>
            <th>{copy.tables.price}</th>
            <th>{copy.tables.score}</th>
            <th>{copy.tables.fairDelta}</th>
            <th>{copy.tables.developer}</th>
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
                  {item.city}, {item.district}, {item.address} ·{" "}
                  {formatRooms([item.rooms], copy)} · {numberValue(item.area_m2, locale)} m2
                </small>
              </td>
              <td>
                <strong>{money(item.price, locale)}</strong>
                <small>{money(Math.round(item.price / Math.max(item.area_m2, 1)), locale)}/m2</small>
              </td>
              <td>
                <strong>{numberValue(item.decision_score, locale)}/100</strong>
                <small>
                  {copy.values.scoreDetails(item.risk_score, item.liquidity_score)}
                </small>
              </td>
              <td>
                <strong>{percent(item.price_delta_to_fair_mid_pct, locale)}</strong>
                <small>{copy.values.fairMid(money(item.fair_price_mid_pln, locale))}</small>
              </td>
              <td>
                <strong>{item.developer_name ?? copy.values.noValue}</strong>
                <small>
                  {item.developer_reputation_score !== null
                    ? copy.values.developerReputation(
                        item.developer_reputation_score,
                        item.developer_reputation_label,
                      )
                    : copy.values.noReputationData}
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CrmSharePreviewBlock({
  copy,
  locale,
  preview,
}: {
  copy: AccountPageCopy;
  locale: Locale;
  preview: CrmSharePreview;
}) {
  return (
    <div className="crm-share-preview">
      <div className="panel-header inline">
        <h3 className="icon-title">
          <Share2 size={16} />
          {copy.sections.sharePreview}
        </h3>
        {preview.share_token ? (
          <a
            className="button"
            href={crmSharedShortlistUrl(preview.share_token)}
            target="_blank"
            rel="noreferrer"
          >
            {copy.actions.publicLink}
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
      <CrmShortlistItems copy={copy} items={preview.items} locale={locale} />
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

function formatBudget(
  minValue: number | null,
  maxValue: number | null,
  locale: Locale,
  copy: AccountPageCopy,
) {
  if (minValue !== null && maxValue !== null) {
    return `${money(minValue, locale)} - ${money(maxValue, locale)}`;
  }
  if (maxValue !== null) return copy.values.budgetTo(money(maxValue, locale));
  if (minValue !== null) return copy.values.budgetFrom(money(minValue, locale));
  return copy.values.noValue;
}

function formatRooms(rooms: number[], copy: AccountPageCopy) {
  return rooms.length > 0 ? rooms.join(", ") : copy.values.noValue;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(
    ACCOUNT_INTL_LOCALES[locale],
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
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
