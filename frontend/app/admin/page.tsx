"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Database,
  Handshake,
  Mail,
  PencilLine,
  Plus,
  RefreshCw,
  ShieldAlert,
  Upload,
} from "lucide-react";

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  type AdminAuditLog,
  type AlertDeliveryBatchResult,
  type DataDeletionRequest,
  type DataDeletionRequestStatus,
  type DataDeletionTargetType,
  type DataQualityLog,
  type IngestionJob,
  type IngestionSourceHealth,
  type InfrastructureEnrichmentJobResult,
  type ListingCorrectionPayload,
  type ListingCorrectionResult,
  type PartnerCsvImportResponse,
  type PartnerReferral,
  type PartnerReferralStatus,
  type PlannedInvestment,
  type PlannedInvestmentImportResponse,
  type PlannedInvestmentPayload,
  type PropertyDeduplicationMatch,
  type PropertyDeduplicationReviewStatus,
  type RawListingSummary,
  type ScoringBacktestReport,
  type ScoringBacktestResult,
  type SourceCheckJob,
  type SourceError,
  type SourceLegalStatus,
  type SourceRegistryEntry,
  type SourceRegistryEntryPayload,
  type SourceRetentionPruneResult,
} from "@/lib/api";
import { numberValue } from "@/lib/format";

type InvestmentForm = {
  name: string;
  investment_type: string;
  status: string;
  city: string;
  district: string;
  expected_year: string;
  lat: string;
  lon: string;
  source_url: string;
  confidence_score: string;
  notes: string;
};

type SourceForm = {
  name: string;
  source_type: string;
  base_url: string;
  legal_status: SourceLegalStatus;
  refresh_cadence: string;
  owner: string;
  ingestion_method: string;
  allowed_use: string;
  robots_txt_url: string;
  terms_url: string;
  notes: string;
  raw_payload_retention_days: string;
  private_url_retention_days: string;
  retention_notes: string;
  is_active: boolean;
};

type DataDeletionRequestForm = {
  target_type: DataDeletionTargetType;
  target_id: string;
  target_owner_id: string;
  source_name: string;
  reason: string;
};

type ListingCorrectionForm = {
  listingId: string;
  title: string;
  city: string;
  district: string;
  area_id: string;
  municipality: string;
  address: string;
  market_type: "" | "primary" | "secondary";
  price: string;
  area_m2: string;
  rooms: string;
  floor: string;
  building_floors: string;
  building_year: string;
  lat: string;
  lon: string;
  nearest_stop_m: string;
  nearest_school_m: string;
  nearest_major_road_m: string;
  nearest_industrial_zone_m: string;
  data_quality_score: string;
  correction_reason: string;
  corrected_by: string;
};

type ListingCorrectionTextField =
  | "title"
  | "city"
  | "district"
  | "area_id"
  | "municipality"
  | "address";

type ListingCorrectionNumberField =
  | "price"
  | "area_m2"
  | "rooms"
  | "floor"
  | "building_floors"
  | "building_year"
  | "lat"
  | "lon"
  | "nearest_stop_m"
  | "nearest_school_m"
  | "nearest_major_road_m"
  | "nearest_industrial_zone_m"
  | "data_quality_score";

const defaultInvestmentForm: InvestmentForm = {
  name: "New planned investment",
  investment_type: "tram",
  status: "planned",
  city: "Wrocław",
  district: "Fabryczna",
  expected_year: "2029",
  lat: "51.112",
  lon: "16.968",
  source_url: "https://example.com/planned-investment",
  confidence_score: "60",
  notes: "",
};

const defaultSourceForm: SourceForm = {
  name: "New Agency Partner",
  source_type: "partner_csv",
  base_url: "https://agency.example",
  legal_status: "review_required",
  refresh_cadence: "weekly",
  owner: "partnerships",
  ingestion_method: "admin_csv_upload",
  allowed_use: "analytics,reports,price_history",
  robots_txt_url: "https://agency.example/robots.txt",
  terms_url: "https://agency.example/terms",
  notes: "",
  raw_payload_retention_days: "90",
  private_url_retention_days: "",
  retention_notes: "Prune raw payloads after QA window.",
  is_active: true,
};

const defaultDeletionRequestForm: DataDeletionRequestForm = {
  target_type: "user_submitted_draft",
  target_id: "",
  target_owner_id: "",
  source_name: "User Submitted Private References",
  reason: "User requested deletion of private source reference.",
};

const defaultListingCorrectionForm: ListingCorrectionForm = {
  listingId: "wr-001",
  title: "",
  city: "",
  district: "",
  area_id: "",
  municipality: "",
  address: "",
  market_type: "",
  price: "",
  area_m2: "",
  rooms: "",
  floor: "",
  building_floors: "",
  building_year: "",
  lat: "",
  lon: "",
  nearest_stop_m: "",
  nearest_school_m: "",
  nearest_major_road_m: "",
  nearest_industrial_zone_m: "",
  data_quality_score: "",
  correction_reason: "QA correction after source parsing review.",
  corrected_by: "admin@domarion.local",
};

export default function AdminPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [sourceHealth, setSourceHealth] = useState<IngestionSourceHealth[]>([]);
  const [sourceCheckJobs, setSourceCheckJobs] = useState<SourceCheckJob[]>([]);
  const [sourceErrors, setSourceErrors] = useState<SourceError[]>([]);
  const [sources, setSources] = useState<SourceRegistryEntry[]>([]);
  const [scoringBacktest, setScoringBacktest] =
    useState<ScoringBacktestResult | null>(null);
  const [scoringBacktestReport, setScoringBacktestReport] =
    useState<ScoringBacktestReport | null>(null);
  const [logs, setLogs] = useState<DataQualityLog[]>([]);
  const [rawListings, setRawListings] = useState<RawListingSummary[]>([]);
  const [dedupMatches, setDedupMatches] = useState<PropertyDeduplicationMatch[]>([]);
  const [plannedInvestments, setPlannedInvestments] = useState<PlannedInvestment[]>([]);
  const [partnerReferrals, setPartnerReferrals] = useState<PartnerReferral[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [dataDeletionRequests, setDataDeletionRequests] = useState<DataDeletionRequest[]>([]);
  const [dailyAlertRun, setDailyAlertRun] =
    useState<AlertDeliveryBatchResult | null>(null);
  const [enrichmentRun, setEnrichmentRun] =
    useState<InfrastructureEnrichmentJobResult | null>(null);
  const [retentionPruneRun, setRetentionPruneRun] =
    useState<SourceRetentionPruneResult | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [dedupReviewFilter, setDedupReviewFilter] =
    useState<PropertyDeduplicationReviewStatus | "">("open");
  const dedupReviewFilterRef = useRef<PropertyDeduplicationReviewStatus | "">("open");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedDeletionRequestId, setSelectedDeletionRequestId] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditResourceFilter, setAuditResourceFilter] = useState("");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");
  const [selectedReferralId, setSelectedReferralId] = useState("");
  const [referralStatus, setReferralStatus] =
    useState<PartnerReferralStatus>("contacted");
  const [referralAssignedTo, setReferralAssignedTo] = useState("");
  const [referralPartnerName, setReferralPartnerName] = useState("");
  const [referralNotes, setReferralNotes] = useState("");
  const [sourceForm, setSourceForm] = useState<SourceForm>(defaultSourceForm);
  const [deletionRequestForm, setDeletionRequestForm] =
    useState<DataDeletionRequestForm>(defaultDeletionRequestForm);
  const [listingCorrectionForm, setListingCorrectionForm] =
    useState<ListingCorrectionForm>(defaultListingCorrectionForm);
  const [listingCorrectionResult, setListingCorrectionResult] =
    useState<ListingCorrectionResult | null>(null);
  const [deletionActionSummary, setDeletionActionSummary] = useState(
    "Processed from admin moderation workflow.",
  );
  const [executeDeletionTarget, setExecuteDeletionTarget] = useState(true);
  const [investmentForm, setInvestmentForm] =
    useState<InvestmentForm>(defaultInvestmentForm);
  const [partnerCsvFile, setPartnerCsvFile] = useState<File | null>(null);
  const [partnerSourceName, setPartnerSourceName] = useState("Demo Partner");
  const [partnerDryRun, setPartnerDryRun] = useState(true);
  const [partnerImportResult, setPartnerImportResult] =
    useState<PartnerCsvImportResponse | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSourceName, setImportSourceName] = useState("wroclaw.pl WPT");
  const [importDryRun, setImportDryRun] = useState(true);
  const [importResult, setImportResult] =
    useState<PlannedInvestmentImportResponse | null>(null);
  const [status, setStatus] = useState("Загрузка ingestion dashboard...");
  const [error, setError] = useState("");

  const load = useCallback(async (
    jobId: string,
    dedupStatus?: PropertyDeduplicationReviewStatus | "",
  ) => {
    setError("");
    setStatus("Загрузка ingestion dashboard...");
    const activeDedupStatus = dedupStatus ?? dedupReviewFilterRef.current;
    try {
      const [
        jobData,
        healthData,
        sourceCheckData,
        sourceErrorData,
        sourceData,
        backtestData,
        backtestReportData,
        logData,
        rawData,
        dedupData,
        investmentData,
        referralData,
        auditData,
        deletionRequestData,
      ] =
        await Promise.all([
          api.listAdminIngestionJobs(),
          api.listAdminIngestionSourceHealth(),
          api.listAdminSourceCheckJobs({ limit: 50 }),
          api.listAdminSourceErrors({ limit: 50 }),
          api.listAdminIngestionSources(),
          api.getAdminScoringBacktest({ city: "Wrocław", limit: 5 }),
          api.getAdminScoringBacktestReport({ city: "Wrocław", limit: 10 }),
          api.listAdminDataQualityLogs({ job_id: jobId || undefined, limit: 50 }),
          api.listAdminRawListings({ limit: 50 }),
          api.listAdminDeduplicationMatches({
            job_id: jobId || undefined,
            review_status: activeDedupStatus || undefined,
            limit: 50,
          }),
          api.listAdminPlannedInvestments({ city: "Wrocław" }),
          api.listAdminPartnerReferrals({ limit: 100 }),
          api.listAdminAuditLogs({ limit: 100 }),
          api.listAdminDataDeletionRequests({ limit: 50 }),
        ]);
      setJobs(jobData);
      setSourceHealth(healthData);
      setSourceCheckJobs(sourceCheckData);
      setSourceErrors(sourceErrorData);
      setSources(sourceData);
      setScoringBacktest(backtestData);
      setScoringBacktestReport(backtestReportData);
      setLogs(logData);
      setRawListings(rawData);
      setDedupMatches(dedupData);
      setPlannedInvestments(investmentData);
      setPartnerReferrals(referralData);
      setAuditLogs(auditData);
      setDataDeletionRequests(deletionRequestData);
      setStatus("Admin dashboard обновлен");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Admin API недоступен");
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  const latestJob = jobs[0];
  const warningCount = logs.filter((log) => log.severity === "warning").length;
  const errorCount = logs.filter((log) => log.severity === "error").length;
  const openSourceErrorCount = sourceErrors.filter(
    (sourceError) => sourceError.status === "open",
  ).length;
  const retryableSourceErrorCount = sourceErrors.filter(
    (sourceError) => sourceError.retryable && sourceError.status !== "resolved",
  ).length;
  const openDedupCount = dedupMatches.filter(
    (match) => match.review_status === "open",
  ).length;
  const selectedInvestment = plannedInvestments.find(
    (investment) => investment.id === selectedInvestmentId,
  );
  const selectedSource = sources.find((source) => source.id === selectedSourceId);
  const selectedDeletionRequest = dataDeletionRequests.find(
    (request) => request.id === selectedDeletionRequestId,
  );
  const selectedReferral = partnerReferrals.find(
    (referral) => referral.id === selectedReferralId,
  );
  const sourceNames = useMemo(
    () => Array.from(new Set(rawListings.map((item) => item.source_name))),
    [rawListings],
  );
  const auditActionOptions = useMemo(
    () => Array.from(new Set(auditLogs.map((item) => item.action_type))).sort(),
    [auditLogs],
  );
  const auditResourceOptions = useMemo(
    () => Array.from(new Set(auditLogs.map((item) => item.resource_type))).sort(),
    [auditLogs],
  );
  const filteredAuditLogs = useMemo(
    () =>
      auditLogs.filter(
        (log) =>
          (!auditActionFilter || log.action_type === auditActionFilter) &&
          (!auditResourceFilter || log.resource_type === auditResourceFilter),
      ),
    [auditActionFilter, auditLogs, auditResourceFilter],
  );
  const openDeletionRequestCount = dataDeletionRequests.filter(
    (request) => request.status === "open",
  ).length;

  async function createManualJob() {
    const created = await api.createAdminIngestionJob({
      source_name: "Manual admin note",
      source_type: "manual",
      status: "queued",
      notes: "Created from admin dashboard MVP.",
      metadata: { intent: "manual_follow_up" },
    });
    setSelectedJobId(created.id);
    await load(created.id);
    setStatus(`Job создан: ${created.id}`);
  }

  async function createSource() {
    const created = await api.createAdminIngestionSource(sourcePayload(sourceForm));
    setSelectedSourceId(created.id);
    setSourceForm(formFromSource(created));
    await load(selectedJobId);
    setStatus(`Source создан: ${created.name}`);
  }

  async function updateSource() {
    if (!selectedSourceId) {
      setStatus("Выбери source registry entry для обновления");
      return;
    }
    const updated = await api.updateAdminIngestionSource(
      selectedSourceId,
      sourcePayload(sourceForm),
    );
    setSourceForm(formFromSource(updated));
    await load(selectedJobId);
    setStatus(`Source обновлен: ${updated.name}`);
  }

  async function updateDedupReviewStatus(
    matchId: number,
    reviewStatus: PropertyDeduplicationReviewStatus,
  ) {
    const updated = await api.updateAdminDeduplicationMatch(matchId, {
      review_status: reviewStatus,
    });
    setDedupMatches((current) => {
      const nextMatches = current.map((match) => (match.id === updated.id ? updated : match));
      if (dedupReviewFilter && updated.review_status !== dedupReviewFilter) {
        return nextMatches.filter((match) => match.id !== updated.id);
      }
      return nextMatches;
    });
    setStatus(
      `Dedup match ${updated.id} помечен как ${updated.review_status}`,
    );
  }

  async function correctNormalizedListing() {
    const listingId = listingCorrectionForm.listingId.trim();
    if (!listingId) {
      setStatus("Укажи listing ID для correction");
      return;
    }
    if (!listingCorrectionForm.correction_reason.trim()) {
      setStatus("Укажи причину correction");
      return;
    }

    setError("");
    setStatus(`Normalized listing correction: ${listingId}...`);
    try {
      const result = await api.correctAdminNormalizedListing(
        listingId,
        listingCorrectionPayload(listingCorrectionForm),
      );
      setListingCorrectionResult(result);
      setStatus(
        `Listing ${result.listing.id} обновлен: ${result.changed_fields.join(", ")}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown listing correction error");
      setStatus("Listing correction failed");
    }
  }

  async function createSourceCheckForSelectedSource() {
    if (!selectedSource) {
      setStatus("Выбери source registry entry для проверки");
      return;
    }
    const created = await api.createAdminSourceCheckJob({
      source_id: selectedSource.id,
      source_name: selectedSource.name,
      source_type: selectedSource.source_type,
      check_type: "manual_review",
      status: "queued",
      target_domain: domainFromUrl(selectedSource.base_url),
      notes: "Manual source check from admin dashboard.",
      metadata: { legal_status: selectedSource.legal_status },
    });
    await load(selectedJobId);
    setStatus(`Source check создан: ${created.id}`);
  }

  async function runRetentionPrune(dryRun: boolean) {
    setError("");
    setStatus(dryRun ? "Retention prune dry-run..." : "Retention prune apply...");
    try {
      const result = await api.pruneAdminRetainedRawPayloads({
        dry_run: dryRun,
        source_name: selectedSource?.name,
        limit: 500,
      });
      setRetentionPruneRun(result);
      await load(selectedJobId);
      setStatus(
        `Retention prune: ${result.raw_payloads_pruned} payloads ` +
          `${dryRun ? "would be pruned" : "pruned"}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown retention prune error");
      setStatus("Retention prune failed");
    }
  }

  async function createDataDeletionRequest() {
    if (!deletionRequestForm.target_id.trim()) {
      setStatus("Укажи target id для deletion request");
      return;
    }
    const created = await api.createAdminDataDeletionRequest({
      target_type: deletionRequestForm.target_type,
      target_id: deletionRequestForm.target_id.trim(),
      target_owner_id: blankToNull(deletionRequestForm.target_owner_id),
      source_name: blankToNull(deletionRequestForm.source_name),
      reason: blankToNull(deletionRequestForm.reason),
      request_payload: { created_from: "admin_dashboard" },
    });
    setSelectedDeletionRequestId(created.id);
    setDeletionActionSummary("Processed from admin moderation workflow.");
    await load(selectedJobId);
    setStatus(`Deletion request создан: ${created.id}`);
  }

  async function processDataDeletionRequest(statusValue: Exclude<DataDeletionRequestStatus, "open">) {
    if (!selectedDeletionRequestId) {
      setStatus("Выбери deletion request для обработки");
      return;
    }
    if (!deletionActionSummary.trim()) {
      setStatus("Укажи action summary для audit trail");
      return;
    }
    const updated = await api.processAdminDataDeletionRequest(selectedDeletionRequestId, {
      status: statusValue,
      action_summary: deletionActionSummary.trim(),
      execute_target_deletion: executeDeletionTarget,
      result_payload: { processed_from: "admin_dashboard" },
    });
    setSelectedDeletionRequestId(updated.id);
    await load(selectedJobId);
    setStatus(`Deletion request ${updated.status}: ${updated.id}`);
  }

  async function retrySourceError(errorId: string) {
    const result = await api.retryAdminSourceError(errorId);
    await load(selectedJobId);
    setStatus(`Retry job создан: ${result.retry_job.id}`);
  }

  async function resolveSourceError(errorId: string) {
    const updated = await api.updateAdminSourceError(errorId, {
      status: "resolved",
      resolution_note: "Resolved from admin dashboard.",
    });
    await load(selectedJobId);
    setStatus(`Source error resolved: ${updated.error_code}`);
  }

  async function createInvestment() {
    const payload = investmentPayload(investmentForm);
    const created = await api.createAdminPlannedInvestment(payload);
    setSelectedInvestmentId(created.id);
    setInvestmentForm(formFromInvestment(created));
    await load(selectedJobId);
    setStatus(`Planned investment создан: ${created.name}`);
  }

  async function updateInvestment() {
    if (!selectedInvestmentId) {
      setStatus("Выбери planned investment для обновления");
      return;
    }
    const updated = await api.updateAdminPlannedInvestment(
      selectedInvestmentId,
      investmentPayload(investmentForm),
    );
    setInvestmentForm(formFromInvestment(updated));
    await load(selectedJobId);
    setStatus(`Planned investment обновлен: ${updated.name}`);
  }

  async function deleteInvestment() {
    if (!selectedInvestmentId) {
      setStatus("Выбери planned investment для удаления");
      return;
    }
    const response = await api.deleteAdminPlannedInvestment(selectedInvestmentId);
    if (!response.ok) {
      setStatus(`Delete failed: HTTP ${response.status}`);
      return;
    }
    setSelectedInvestmentId("");
    setInvestmentForm(defaultInvestmentForm);
    await load(selectedJobId);
    setStatus("Planned investment удален");
  }

  async function updatePartnerReferral() {
    if (!selectedReferralId) {
      setStatus("Выбери partner referral для обновления");
      return;
    }
    const updated = await api.updateAdminPartnerReferral(selectedReferralId, {
      status: referralStatus,
      assigned_to: blankToNull(referralAssignedTo),
      partner_name: blankToNull(referralPartnerName),
      notes: blankToNull(referralNotes),
    });
    setReferralStatus(updated.status);
    setReferralAssignedTo(updated.assigned_to ?? "");
    setReferralPartnerName(updated.partner_name ?? "");
    setReferralNotes(updated.notes ?? "");
    await load(selectedJobId);
    setStatus(`Partner referral обновлен: ${updated.id}`);
  }

  async function deliverDailyEmailAlerts(dryRun: boolean) {
    setError("");
    setStatus(dryRun ? "Daily email alerts dry-run..." : "Daily email alerts delivery...");
    try {
      const result = await api.deliverAdminDailyEmailAlerts({
        dry_run: dryRun,
        max_matches: 10,
        limit: 500,
        force: false,
      });
      setDailyAlertRun(result);
      setStatus(
        `Daily email alerts: ${result.jobs_prepared} prepared, ` +
          `${result.jobs_persisted} persisted, ${result.skipped_count} skipped`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown daily alerts error");
      setStatus("Daily email alerts failed");
    }
  }

  async function runInfrastructureEnrichment(dryRun: boolean) {
    setError("");
    setStatus(dryRun ? "Infrastructure enrichment dry-run..." : "Infrastructure enrichment...");
    try {
      const result = await api.enrichAdminInfrastructure({ dry_run: dryRun, limit: 1000 });
      setEnrichmentRun(result);
      await load(selectedJobId);
      setStatus(
        `Infrastructure enrichment: ${result.properties_with_changes} with changes, ` +
          `${result.properties_updated} updated`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown enrichment error");
      setStatus("Infrastructure enrichment failed");
    }
  }

  async function importPartnerCsv(dryRun = partnerDryRun) {
    if (!partnerCsvFile) {
      setStatus("Выбери CSV файл partner listings");
      return;
    }

    setError("");
    setStatus(dryRun ? "Проверка partner CSV..." : "Импорт partner CSV...");
    try {
      const result = await api.importAdminPartnerCsv({
        file: partnerCsvFile,
        sourceName: partnerSourceName,
        dryRun,
      });
      setPartnerImportResult(result);
      setSelectedJobId(result.job.id);
      await load(result.job.id);
      setStatus(
        `${dryRun ? "Dry-run" : "Import"} partner CSV: ${result.rows_seen} rows, ` +
          `raw +${result.raw_created}/~${result.raw_updated}, ` +
          `properties +${result.properties_created}/~${result.properties_updated}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown partner CSV import error");
      setStatus("Partner CSV import failed");
    }
  }

  async function importInvestments(dryRun = importDryRun) {
    if (!importFile) {
      setStatus("Выбери JSON или CSV файл planned investments");
      return;
    }

    setError("");
    setStatus(dryRun ? "Проверка planned investments..." : "Импорт planned investments...");
    try {
      const result = await api.importAdminPlannedInvestments({
        file: importFile,
        sourceName: importSourceName,
        dryRun,
      });
      setImportResult(result);
      setSelectedJobId(result.job.id);
      await load(result.job.id);
      setStatus(
        `${dryRun ? "Dry-run" : "Import"}: ${result.rows_seen} rows, ` +
          `+${result.created}, ~${result.updated}, errors ${result.errors.length}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown import error");
      setStatus("Planned investments import failed");
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Internal Admin</h1>
          <p>Source registry, ingestion jobs, data quality logs и raw listing preview.</p>
        </div>
        <div className="toolbar">
          <button className="button" type="button" onClick={() => void load(selectedJobId)}>
            <RefreshCw size={16} /> Обновить
          </button>
          <button className="button primary" type="button" onClick={() => void createManualJob()}>
            <Plus size={16} /> Job
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Jobs</span>
          <strong>{numberValue(jobs.length)}</strong>
        </div>
        <div className="metric">
          <span>Raw listings</span>
          <strong>{numberValue(rawListings.length)}</strong>
        </div>
        <div className="metric">
          <span>Planned investments</span>
          <strong>{numberValue(plannedInvestments.length)}</strong>
        </div>
        <div className="metric">
          <span>Dedup review</span>
          <strong>
            {numberValue(openDedupCount)} / {numberValue(dedupMatches.length)}
          </strong>
        </div>
        <div className="metric">
          <span>Partner leads</span>
          <strong>{numberValue(partnerReferrals.length)}</strong>
        </div>
        <div className="metric">
          <span>Deletion requests</span>
          <strong>
            {numberValue(openDeletionRequestCount)} / {numberValue(dataDeletionRequests.length)}
          </strong>
        </div>
        <div className="metric">
          <span>Audit events</span>
          <strong>{numberValue(auditLogs.length)}</strong>
        </div>
        <div className="metric">
          <span>Warnings / errors</span>
          <strong>
            {numberValue(warningCount)} / {numberValue(errorCount)}
          </strong>
        </div>
        <div className="metric">
          <span>Source errors</span>
          <strong>
            {numberValue(openSourceErrorCount)} / {numberValue(retryableSourceErrorCount)}
          </strong>
        </div>
      </section>

      {error ? (
        <ErrorBlock message={error} />
      ) : jobs.length === 0 && status.startsWith("Загрузка") ? (
        <LoadingBlock />
      ) : (
        <div className="admin-grid" style={{ marginTop: 16 }}>
          <section className="panel">
            <div className="panel-header">
              <h2>Ingestion Jobs</h2>
              <span className="status-line">{status}</span>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Rows</th>
                    <th>Raw</th>
                    <th>Properties</th>
                    <th>Snapshots</th>
                    <th>Errors</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className={selectedJobId === job.id ? "selected-row" : undefined}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        void load(job.id);
                      }}
                    >
                      <td>
                        <strong>{job.source_name}</strong>
                        <small>{job.source_type}</small>
                      </td>
                      <td>
                        <span className={`status-pill ${job.status}`}>{job.status}</span>
                      </td>
                      <td>{job.rows_seen}</td>
                      <td>
                        +{job.raw_created} / ~{job.raw_updated}
                      </td>
                      <td>
                        +{job.properties_created} / ~{job.properties_updated}
                      </td>
                      <td>
                        +{job.snapshots_created} / ~{job.snapshots_updated}
                      </td>
                      <td>{job.errors_count}</td>
                      <td>{formatDate(job.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="panel">
            <div className="panel-header">
              <h2>Data Quality</h2>
              <ShieldAlert size={18} />
            </div>
            <div className="panel-body">
              <label className="field" style={{ marginBottom: 12 }}>
                <span>Job filter</span>
                <select
                  className="select"
                  value={selectedJobId}
                  onChange={(event) => {
                    const nextJobId = event.target.value;
                    setSelectedJobId(nextJobId);
                    void load(nextJobId, dedupReviewFilter);
                  }}
                >
                  <option value="">Все jobs</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.source_name} · {job.status}
                    </option>
                  ))}
                </select>
              </label>

              {logs.length === 0 ? (
                <EmptyBlock label="Нет data-quality логов под текущий фильтр." />
              ) : (
                <ul className="section-list compact">
                  {logs.map((log) => (
                    <li key={log.id}>
                      <span className={`status-pill ${log.severity}`}>{log.severity}</span>
                      <strong>{log.code}</strong>
                      <p className="muted">{log.message}</p>
                      <small>
                        {log.source_name}
                        {log.source_listing_id ? ` · ${log.source_listing_id}` : ""}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Dedup Review</h2>
              <span className="muted">
                {numberValue(openDedupCount)} open · {numberValue(dedupMatches.length)} latest
              </span>
            </div>
            <div className="panel-body compact-panel-body">
              <div className="toolbar">
                <label className="field inline-field">
                  <span>Review status</span>
                  <select
                    className="select"
                    value={dedupReviewFilter}
                    onChange={(event) => {
                      const nextStatus = event.target.value as
                        | PropertyDeduplicationReviewStatus
                        | "";
                      setDedupReviewFilter(nextStatus);
                      dedupReviewFilterRef.current = nextStatus;
                      void load(selectedJobId, nextStatus);
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="auto_resolved">Auto resolved</option>
                    <option value="">All</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="table-scroll">
              {dedupMatches.length === 0 ? (
                <EmptyBlock label="Нет deduplication decisions под текущий фильтр." />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Decision</th>
                      <th>Score</th>
                      <th>Incoming</th>
                      <th>Candidate</th>
                      <th>Reasons</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dedupMatches.map((match) => (
                      <tr key={match.id}>
                        <td>
                          <strong>{match.source_name}</strong>
                          <small>{match.source_listing_id}</small>
                        </td>
                        <td>
                          <span className={`status-pill ${dedupDecisionClass(match)}`}>
                            {match.decision}
                          </span>
                          <small>{match.review_status}</small>
                        </td>
                        <td>{match.match_score}/100</td>
                        <td>
                          <strong>{dedupPayloadText(match.incoming_payload, "address")}</strong>
                          <small>
                            {dedupPayloadText(match.incoming_payload, "area_m2")} m2 ·{" "}
                            {dedupPayloadText(match.incoming_payload, "rooms")} rooms
                          </small>
                        </td>
                        <td>
                          <strong>{dedupPayloadText(match.candidate_payload, "address")}</strong>
                          <small>
                            property {match.candidate_property_id ?? "-"} · matched{" "}
                            {match.matched_property_id ?? "-"}
                          </small>
                        </td>
                        <td>{match.reasons.slice(0, 3).join(" · ") || "-"}</td>
                        <td>
                          {match.review_status === "open" ? (
                            <button
                              className="button"
                              type="button"
                              onClick={() =>
                                void updateDedupReviewStatus(match.id, "auto_resolved")
                              }
                            >
                              Mark resolved
                            </button>
                          ) : (
                            <button
                              className="button"
                              type="button"
                              onClick={() => void updateDedupReviewStatus(match.id, "open")}
                            >
                              Reopen
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Normalized Listing Correction</h2>
              <PencilLine size={18} />
            </div>
            <div className="panel-body planned-investment-grid">
              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>Manual QA patch</h3>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setListingCorrectionForm(defaultListingCorrectionForm);
                      setListingCorrectionResult(null);
                    }}
                  >
                    Сброс
                  </button>
                </div>
                <div className="form-grid compact">
                  <Field
                    label="Listing ID"
                    value={listingCorrectionForm.listingId}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, listingId: value })
                    }
                  />
                  <label className="field">
                    <span>Market</span>
                    <select
                      className="select"
                      value={listingCorrectionForm.market_type}
                      onChange={(event) =>
                        setListingCorrectionForm({
                          ...listingCorrectionForm,
                          market_type: event.target.value as ListingCorrectionForm["market_type"],
                        })
                      }
                    >
                      <option value="">No change</option>
                      <option value="secondary">secondary</option>
                      <option value="primary">primary</option>
                    </select>
                  </label>
                  <Field
                    label="Price"
                    value={listingCorrectionForm.price}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, price: value })
                    }
                  />
                  <Field
                    label="Area m2"
                    value={listingCorrectionForm.area_m2}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, area_m2: value })
                    }
                  />
                  <Field
                    label="Rooms"
                    value={listingCorrectionForm.rooms}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, rooms: value })
                    }
                  />
                  <Field
                    label="Floor"
                    value={listingCorrectionForm.floor}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, floor: value })
                    }
                  />
                  <Field
                    label="Building floors"
                    value={listingCorrectionForm.building_floors}
                    onChange={(value) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        building_floors: value,
                      })
                    }
                  />
                  <Field
                    label="Year"
                    value={listingCorrectionForm.building_year}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, building_year: value })
                    }
                  />
                  <Field
                    label="City"
                    value={listingCorrectionForm.city}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, city: value })
                    }
                  />
                  <Field
                    label="District"
                    value={listingCorrectionForm.district}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, district: value })
                    }
                  />
                  <Field
                    label="Area ID"
                    value={listingCorrectionForm.area_id}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, area_id: value })
                    }
                  />
                  <Field
                    label="Municipality"
                    value={listingCorrectionForm.municipality}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, municipality: value })
                    }
                  />
                  <Field
                    label="Lat"
                    value={listingCorrectionForm.lat}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, lat: value })
                    }
                  />
                  <Field
                    label="Lon"
                    value={listingCorrectionForm.lon}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, lon: value })
                    }
                  />
                  <Field
                    label="Stop m"
                    value={listingCorrectionForm.nearest_stop_m}
                    onChange={(value) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        nearest_stop_m: value,
                      })
                    }
                  />
                  <Field
                    label="School m"
                    value={listingCorrectionForm.nearest_school_m}
                    onChange={(value) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        nearest_school_m: value,
                      })
                    }
                  />
                  <Field
                    label="Road m"
                    value={listingCorrectionForm.nearest_major_road_m}
                    onChange={(value) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        nearest_major_road_m: value,
                      })
                    }
                  />
                  <Field
                    label="Industrial m"
                    value={listingCorrectionForm.nearest_industrial_zone_m}
                    onChange={(value) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        nearest_industrial_zone_m: value,
                      })
                    }
                  />
                  <Field
                    label="Quality"
                    value={listingCorrectionForm.data_quality_score}
                    onChange={(value) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        data_quality_score: value,
                      })
                    }
                  />
                </div>
                <Field
                  label="Title"
                  value={listingCorrectionForm.title}
                  onChange={(value) =>
                    setListingCorrectionForm({ ...listingCorrectionForm, title: value })
                  }
                />
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Address</span>
                  <input
                    className="input"
                    value={listingCorrectionForm.address}
                    onChange={(event) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        address: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="form-grid compact" style={{ marginTop: 10 }}>
                  <Field
                    label="Corrected by"
                    value={listingCorrectionForm.corrected_by}
                    onChange={(value) =>
                      setListingCorrectionForm({ ...listingCorrectionForm, corrected_by: value })
                    }
                  />
                </div>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Reason</span>
                  <textarea
                    className="textarea"
                    value={listingCorrectionForm.correction_reason}
                    onChange={(event) =>
                      setListingCorrectionForm({
                        ...listingCorrectionForm,
                        correction_reason: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="toolbar" style={{ marginTop: 12 }}>
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => void correctNormalizedListing()}
                  >
                    Apply correction
                  </button>
                </div>
              </div>

              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>Correction result</h3>
                </div>
                {listingCorrectionResult ? (
                  <>
                    <div className="metric-grid compact">
                      <div className="metric">
                        <span>Price</span>
                        <strong>{numberValue(listingCorrectionResult.listing.price)} PLN</strong>
                      </div>
                      <div className="metric">
                        <span>PLN/m2</span>
                        <strong>
                          {numberValue(listingCorrectionResult.listing.price_per_m2)}
                        </strong>
                      </div>
                      <div className="metric">
                        <span>Area</span>
                        <strong>{listingCorrectionResult.listing.area_m2} m2</strong>
                      </div>
                      <div className="metric">
                        <span>Quality</span>
                        <strong>{listingCorrectionResult.listing.data_quality_score}/100</strong>
                      </div>
                    </div>
                    <ul className="section-list compact" style={{ marginTop: 12 }}>
                      <li>
                        <strong>{listingCorrectionResult.listing.title}</strong>
                        <p className="muted">
                          {listingCorrectionResult.listing.address} ·{" "}
                          {listingCorrectionResult.listing.district}
                        </p>
                        <small>
                          fields: {listingCorrectionResult.changed_fields.join(", ")}
                        </small>
                      </li>
                      <li>
                        <strong>Reason</strong>
                        <p className="muted">{listingCorrectionResult.correction_reason}</p>
                        <small>{listingCorrectionResult.corrected_by ?? "admin"}</small>
                      </li>
                    </ul>
                  </>
                ) : (
                  <EmptyBlock label="Нет примененной normalized listing correction." />
                )}
              </div>
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Daily Email Alerts</h2>
              <Mail size={18} />
            </div>
            <div className="panel-body">
              <div className="toolbar">
                <button
                  className="button"
                  type="button"
                  onClick={() => void deliverDailyEmailAlerts(true)}
                >
                  Dry run
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => void deliverDailyEmailAlerts(false)}
                >
                  Send due
                </button>
              </div>
              {dailyAlertRun ? (
                <>
                  <div className="metric-grid" style={{ marginTop: 14 }}>
                    <div className="metric">
                      <span>Alerts seen</span>
                      <strong>{numberValue(dailyAlertRun.alerts_seen)}</strong>
                    </div>
                    <div className="metric">
                      <span>Prepared</span>
                      <strong>{numberValue(dailyAlertRun.jobs_prepared)}</strong>
                    </div>
                    <div className="metric">
                      <span>Persisted</span>
                      <strong>{numberValue(dailyAlertRun.jobs_persisted)}</strong>
                    </div>
                    <div className="metric">
                      <span>Skipped</span>
                      <strong>{numberValue(dailyAlertRun.skipped_count)}</strong>
                    </div>
                  </div>
                  {dailyAlertRun.jobs.length ? (
                    <div className="table-scroll" style={{ marginTop: 14 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Owner</th>
                            <th>Status</th>
                            <th>Matches</th>
                            <th>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyAlertRun.jobs.map((job) => (
                            <tr key={job.id}>
                              <td>{job.owner_id}</td>
                              <td>
                                <span className={`status-pill ${job.status}`}>
                                  {job.status}
                                </span>
                              </td>
                              <td>{job.total_matches}</td>
                              <td>{job.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {dailyAlertRun.skipped.length ? (
                    <ul className="section-list compact" style={{ marginTop: 14 }}>
                      {dailyAlertRun.skipped.map((item) => (
                        <li key={`${item.owner_id}-${item.alert_id}`}>
                          <span className="status-pill warning">{item.reason}</span>
                          <strong>{item.alert_id}</strong>
                          <small>
                            {item.last_delivery_at
                              ? formatDate(item.last_delivery_at)
                              : "no previous delivery"}
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Leads & Partner Referrals</h2>
              <Handshake size={18} />
            </div>
            <div className="panel-body planned-investment-grid">
              <div className="table-scroll">
                {partnerReferrals.length === 0 ? (
                  <EmptyBlock label="Нет beta/partner lead заявок." />
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Contact</th>
                        <th>Context</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerReferrals.map((referral) => (
                        <tr
                          key={referral.id}
                          className={
                            selectedReferralId === referral.id ? "selected-row" : undefined
                          }
                          onClick={() => {
                            setSelectedReferralId(referral.id);
                            setReferralStatus(referral.status);
                            setReferralAssignedTo(referral.assigned_to ?? "");
                            setReferralPartnerName(referral.partner_name ?? "");
                            setReferralNotes(referral.notes ?? "");
                          }}
                        >
                          <td>
                            <strong>{referralTypeLabel(referral.referral_type)}</strong>
                            <small>{referral.city}</small>
                          </td>
                          <td>
                            <span className={`status-pill ${referral.status}`}>
                              {referral.status}
                            </span>
                          </td>
                          <td>
                            {referral.contact_name || referral.owner_id}
                            <small>{referralContact(referral)}</small>
                          </td>
                          <td>
                            {referral.source_context}
                            <small>{referralLeadContext(referral)}</small>
                          </td>
                          <td>{formatDate(referral.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>{selectedReferral ? "Обработка лида" : "Выбери заявку"}</h3>
                </div>
                {selectedReferral ? (
                  <>
                    <ul className="section-list compact" style={{ marginBottom: 12 }}>
                      <li>
                        <strong>{referralTypeLabel(selectedReferral.referral_type)}</strong>
                        <p className="muted">{selectedReferral.message || "Без сообщения"}</p>
                        <small>
                          {selectedReferralContactLine(selectedReferral)}
                          {referralLeadContext(selectedReferral) !== "-" ? (
                            <> · {referralLeadContext(selectedReferral)}</>
                          ) : null}
                        </small>
                      </li>
                    </ul>
                    <div className="form-grid compact">
                      <label className="field">
                        <span>Status</span>
                        <select
                          className="select"
                          value={referralStatus}
                          onChange={(event) =>
                            setReferralStatus(event.target.value as PartnerReferralStatus)
                          }
                        >
                          <option value="new">new</option>
                          <option value="contacted">contacted</option>
                          <option value="qualified">qualified</option>
                          <option value="closed">closed</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </label>
                      <Field
                        label="Assigned"
                        value={referralAssignedTo}
                        onChange={setReferralAssignedTo}
                      />
                      <Field
                        label="Partner"
                        value={referralPartnerName}
                        onChange={setReferralPartnerName}
                      />
                    </div>
                    <label className="field" style={{ marginTop: 10 }}>
                      <span>Notes</span>
                      <textarea
                        className="textarea"
                        value={referralNotes}
                        onChange={(event) => setReferralNotes(event.target.value)}
                      />
                    </label>
                    <div className="toolbar" style={{ marginTop: 12 }}>
                      <button
                        className="button primary"
                        type="button"
                        onClick={() => void updatePartnerReferral()}
                      >
                        Update
                      </button>
                    </div>
                  </>
                ) : (
                  <EmptyBlock label="Выбери строку заявки для редактирования." />
                )}
              </div>
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Source Health</h2>
              <Database size={18} />
            </div>
            <div className="panel-body">
              <div className="toolbar" style={{ marginBottom: 14 }}>
                <button
                  className="button"
                  type="button"
                  onClick={() => void runInfrastructureEnrichment(true)}
                >
                  Enrichment dry-run
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => void runInfrastructureEnrichment(false)}
                >
                  Apply enrichment
                </button>
              </div>
              {enrichmentRun ? (
                <div className="metric-grid compact" style={{ marginBottom: 14 }}>
                  <div className="metric">
                    <span>Properties seen</span>
                    <strong>{numberValue(enrichmentRun.properties_seen)}</strong>
                  </div>
                  <div className="metric">
                    <span>With changes</span>
                    <strong>{numberValue(enrichmentRun.properties_with_changes)}</strong>
                  </div>
                  <div className="metric">
                    <span>Updated</span>
                    <strong>{numberValue(enrichmentRun.properties_updated)}</strong>
                  </div>
                  <div className="metric">
                    <span>Snapshots</span>
                    <strong>{numberValue(enrichmentRun.snapshots_updated)}</strong>
                  </div>
                </div>
              ) : null}
              {sourceHealth.length === 0 ? (
                <EmptyBlock label="Нет ingestion sources." />
              ) : (
                <ul className="section-list compact">
                  {sourceHealth.map((source) => (
                    <li key={`${source.source_name}-${source.source_type}`}>
                      <span className={`status-pill ${source.health_status}`}>
                        {source.health_status}
                      </span>
                      <strong>{source.source_name}</strong>
                      <p className="muted">
                        {source.source_type} · latest {source.latest_job_status} · rows{" "}
                        {numberValue(source.rows_seen)}
                      </p>
                      <small>
                        warnings {numberValue(source.warning_count)} · errors{" "}
                        {numberValue(source.error_count)}
                        {source.last_error_message ? ` · ${source.last_error_message}` : ""}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Source Errors & Checks</h2>
              <span className="muted">
                {numberValue(openSourceErrorCount)} open ·{" "}
                {numberValue(sourceCheckJobs.length)} checks
              </span>
            </div>
            <div className="panel-body planned-investment-grid">
              <div className="table-scroll">
                {sourceErrors.length === 0 ? (
                  <EmptyBlock label="Нет source errors." />
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Code</th>
                        <th>Retry</th>
                        <th>Message</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceErrors.map((sourceError) => (
                        <tr key={sourceError.id}>
                          <td>
                            <strong>{sourceError.source_name}</strong>
                            <small>{sourceError.source_type}</small>
                          </td>
                          <td>
                            <span className={`status-pill ${sourceErrorStatusClass(sourceError)}`}>
                              {sourceError.status}
                            </span>
                            <small>{sourceError.severity}</small>
                          </td>
                          <td>
                            {sourceError.error_code}
                            <small>{sourceErrorDomain(sourceError)}</small>
                          </td>
                          <td>
                            {sourceError.retryable ? "yes" : "no"}
                            <small>
                              count {sourceError.retry_count}
                              {sourceError.last_retry_job_id
                                ? ` · ${sourceError.last_retry_job_id}`
                                : ""}
                            </small>
                          </td>
                          <td>{sourceError.message}</td>
                          <td>
                            <button
                              className="button"
                              type="button"
                              disabled={
                                !sourceError.retryable || sourceError.status === "resolved"
                              }
                              onClick={() => void retrySourceError(sourceError.id)}
                            >
                              Retry
                            </button>
                            <button
                              className="button"
                              type="button"
                              disabled={sourceError.status === "resolved"}
                              onClick={() => void resolveSourceError(sourceError.id)}
                              style={{ marginLeft: 8 }}
                            >
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>Latest source checks</h3>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedSource}
                    onClick={() => void createSourceCheckForSelectedSource()}
                  >
                    Check selected source
                  </button>
                </div>
                {sourceCheckJobs.length === 0 ? (
                  <EmptyBlock label="Нет source check jobs." />
                ) : (
                  <ul className="section-list compact">
                    {sourceCheckJobs.slice(0, 8).map((checkJob) => (
                      <li key={checkJob.id}>
                        <span className={`status-pill ${checkJob.status}`}>
                          {checkJob.status}
                        </span>
                        <strong>{checkJob.source_name}</strong>
                        <p className="muted">
                          {checkJob.check_type}
                          {checkJob.target_domain ? ` · ${checkJob.target_domain}` : ""}
                        </p>
                        <small>
                          {checkJob.created_by} · {formatDate(checkJob.created_at)}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Source Registry</h2>
              <span className="muted">{numberValue(sources.length)} sources</span>
            </div>
            <div className="panel-body planned-investment-grid">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Legal</th>
                      <th>Method</th>
                      <th>Cadence</th>
                      <th>Retention</th>
                      <th>Owner</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((source) => (
                      <tr
                        key={source.id}
                        className={selectedSourceId === source.id ? "selected-row" : undefined}
                        onClick={() => {
                          setSelectedSourceId(source.id);
                          setSourceForm(formFromSource(source));
                        }}
                      >
                        <td>
                          <strong>{source.name}</strong>
                          <small>
                            {source.source_type}
                            {source.base_url ? ` · ${source.base_url}` : ""}
                          </small>
                        </td>
                        <td>
                          <span className={`status-pill ${legalStatusClass(source.legal_status)}`}>
                            {source.legal_status}
                          </span>
                          <small>{source.allowed_use.join(", ") || "no allowed use"}</small>
                        </td>
                        <td>{source.ingestion_method}</td>
                        <td>{source.refresh_cadence}</td>
                        <td>
                          raw {retentionDaysLabel(source.raw_payload_retention_days)}
                          <small>
                            private {retentionDaysLabel(source.private_url_retention_days)}
                          </small>
                        </td>
                        <td>{source.owner}</td>
                        <td>
                          <span className={`status-pill ${source.is_active ? "healthy" : "failed"}`}>
                            {source.is_active ? "active" : "paused"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>{selectedSource ? "Редактирование" : "Новый источник"}</h3>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setSelectedSourceId("");
                      setSourceForm(defaultSourceForm);
                    }}
                  >
                    Сброс
                  </button>
                </div>
                <div className="form-grid compact">
                  <Field
                    label="Name"
                    value={sourceForm.name}
                    onChange={(value) => setSourceForm({ ...sourceForm, name: value })}
                  />
                  <Field
                    label="Type"
                    value={sourceForm.source_type}
                    onChange={(value) => setSourceForm({ ...sourceForm, source_type: value })}
                  />
                  <label className="field">
                    <span>Legal status</span>
                    <select
                      className="select"
                      value={sourceForm.legal_status}
                      onChange={(event) =>
                        setSourceForm({
                          ...sourceForm,
                          legal_status: event.target.value as SourceLegalStatus,
                        })
                      }
                    >
                      <option value="review_required">review_required</option>
                      <option value="approved">approved</option>
                      <option value="unknown">unknown</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </label>
                  <Field
                    label="Cadence"
                    value={sourceForm.refresh_cadence}
                    onChange={(value) =>
                      setSourceForm({ ...sourceForm, refresh_cadence: value })
                    }
                  />
                  <Field
                    label="Owner"
                    value={sourceForm.owner}
                    onChange={(value) => setSourceForm({ ...sourceForm, owner: value })}
                  />
                  <Field
                    label="Method"
                    value={sourceForm.ingestion_method}
                    onChange={(value) =>
                      setSourceForm({ ...sourceForm, ingestion_method: value })
                    }
                  />
                  <Field
                    label="Allowed use"
                    value={sourceForm.allowed_use}
                    onChange={(value) => setSourceForm({ ...sourceForm, allowed_use: value })}
                  />
                  <Field
                    label="Raw retention days"
                    value={sourceForm.raw_payload_retention_days}
                    onChange={(value) =>
                      setSourceForm({ ...sourceForm, raw_payload_retention_days: value })
                    }
                  />
                  <Field
                    label="Private URL days"
                    value={sourceForm.private_url_retention_days}
                    onChange={(value) =>
                      setSourceForm({ ...sourceForm, private_url_retention_days: value })
                    }
                  />
                  <label className="field checkbox-field">
                    <span>Active</span>
                    <input
                      type="checkbox"
                      checked={sourceForm.is_active}
                      onChange={(event) =>
                        setSourceForm({ ...sourceForm, is_active: event.target.checked })
                      }
                    />
                  </label>
                </div>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Base URL</span>
                  <input
                    className="input"
                    value={sourceForm.base_url}
                    onChange={(event) =>
                      setSourceForm({ ...sourceForm, base_url: event.target.value })
                    }
                  />
                </label>
                <div className="form-grid compact" style={{ marginTop: 10 }}>
                  <label className="field">
                    <span>robots.txt</span>
                    <input
                      className="input"
                      value={sourceForm.robots_txt_url}
                      onChange={(event) =>
                        setSourceForm({ ...sourceForm, robots_txt_url: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Terms URL</span>
                    <input
                      className="input"
                      value={sourceForm.terms_url}
                      onChange={(event) =>
                        setSourceForm({ ...sourceForm, terms_url: event.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Notes</span>
                  <textarea
                    className="textarea"
                    value={sourceForm.notes}
                    onChange={(event) =>
                      setSourceForm({ ...sourceForm, notes: event.target.value })
                    }
                  />
                </label>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Retention notes</span>
                  <textarea
                    className="textarea"
                    value={sourceForm.retention_notes}
                    onChange={(event) =>
                      setSourceForm({ ...sourceForm, retention_notes: event.target.value })
                    }
                  />
                </label>
                <div className="toolbar" style={{ marginTop: 12 }}>
                  <button className="button primary" type="button" onClick={() => void createSource()}>
                    Create
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedSourceId}
                    onClick={() => void updateSource()}
                  >
                    Update
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedSourceId}
                    onClick={() => void runRetentionPrune(true)}
                  >
                    Retention dry-run
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedSourceId}
                    onClick={() => void runRetentionPrune(false)}
                  >
                    Apply prune
                  </button>
                </div>
                {retentionPruneRun ? (
                  <p className="muted" style={{ marginTop: 10 }}>
                    Retention prune: {numberValue(retentionPruneRun.raw_payloads_pruned)} payloads ·{" "}
                    {retentionPruneRun.dry_run ? "dry-run" : "applied"}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Data Deletion Requests</h2>
              <span className="muted">
                {numberValue(openDeletionRequestCount)} open ·{" "}
                {numberValue(dataDeletionRequests.length)} total
              </span>
            </div>
            <div className="panel-body planned-investment-grid">
              <div className="table-scroll">
                {dataDeletionRequests.length === 0 ? (
                  <EmptyBlock label="Нет data deletion requests." />
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Target</th>
                        <th>Status</th>
                        <th>Source</th>
                        <th>Requested</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataDeletionRequests.map((request) => (
                        <tr
                          key={request.id}
                          className={
                            selectedDeletionRequestId === request.id
                              ? "selected-row"
                              : undefined
                          }
                          onClick={() => {
                            setSelectedDeletionRequestId(request.id);
                            setDeletionActionSummary(
                              request.action_summary ??
                                "Processed from admin moderation workflow.",
                            );
                          }}
                        >
                          <td>
                            <strong>{request.target_type}</strong>
                            <small>
                              {request.target_id}
                              {request.target_owner_id
                                ? ` · owner ${request.target_owner_id}`
                                : ""}
                            </small>
                          </td>
                          <td>
                            <span className={`status-pill ${deletionStatusClass(request.status)}`}>
                              {request.status}
                            </span>
                            <small>
                              {request.processed_at
                                ? `processed ${formatDate(request.processed_at)}`
                                : "pending"}
                            </small>
                          </td>
                          <td>
                            {request.source_name ?? "-"}
                            <small>
                              {request.source_url_hash
                                ? `hash ${request.source_url_hash.slice(0, 10)}`
                                : ""}
                            </small>
                          </td>
                          <td>
                            {request.requested_by}
                            <small>{formatDate(request.created_at)}</small>
                          </td>
                          <td>{request.reason ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>Moderation</h3>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setSelectedDeletionRequestId("");
                      setDeletionRequestForm(defaultDeletionRequestForm);
                      setDeletionActionSummary("Processed from admin moderation workflow.");
                    }}
                  >
                    Сброс
                  </button>
                </div>
                {selectedDeletionRequest ? (
                  <ul className="section-list compact" style={{ marginBottom: 12 }}>
                    <li>
                      <span className={`status-pill ${deletionStatusClass(selectedDeletionRequest.status)}`}>
                        {selectedDeletionRequest.status}
                      </span>
                      <strong>{selectedDeletionRequest.target_id}</strong>
                      <p className="muted">
                        {selectedDeletionRequest.target_type}
                        {selectedDeletionRequest.target_owner_id
                          ? ` · ${selectedDeletionRequest.target_owner_id}`
                          : ""}
                      </p>
                    </li>
                  </ul>
                ) : null}
                <div className="form-grid compact">
                  <label className="field">
                    <span>Target type</span>
                    <select
                      className="select"
                      value={deletionRequestForm.target_type}
                      onChange={(event) =>
                        setDeletionRequestForm({
                          ...deletionRequestForm,
                          target_type: event.target.value as DataDeletionTargetType,
                        })
                      }
                    >
                      <option value="user_submitted_draft">user_submitted_draft</option>
                      <option value="raw_listing">raw_listing</option>
                      <option value="generated_report">generated_report</option>
                      <option value="source_reference">source_reference</option>
                      <option value="other">other</option>
                    </select>
                  </label>
                  <Field
                    label="Target ID"
                    value={deletionRequestForm.target_id}
                    onChange={(value) =>
                      setDeletionRequestForm({ ...deletionRequestForm, target_id: value })
                    }
                  />
                  <Field
                    label="Owner ID"
                    value={deletionRequestForm.target_owner_id}
                    onChange={(value) =>
                      setDeletionRequestForm({ ...deletionRequestForm, target_owner_id: value })
                    }
                  />
                  <Field
                    label="Source name"
                    value={deletionRequestForm.source_name}
                    onChange={(value) =>
                      setDeletionRequestForm({ ...deletionRequestForm, source_name: value })
                    }
                  />
                </div>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Reason</span>
                  <textarea
                    className="textarea"
                    value={deletionRequestForm.reason}
                    onChange={(event) =>
                      setDeletionRequestForm({
                        ...deletionRequestForm,
                        reason: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Action summary</span>
                  <textarea
                    className="textarea"
                    value={deletionActionSummary}
                    onChange={(event) => setDeletionActionSummary(event.target.value)}
                  />
                </label>
                <label className="field checkbox-field" style={{ marginTop: 10 }}>
                  <span>Execute target deletion</span>
                  <input
                    type="checkbox"
                    checked={executeDeletionTarget}
                    onChange={(event) => setExecuteDeletionTarget(event.target.checked)}
                  />
                </label>
                <div className="toolbar" style={{ marginTop: 12 }}>
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => void createDataDeletionRequest()}
                  >
                    Create request
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedDeletionRequest || selectedDeletionRequest.status !== "open"}
                    onClick={() => void processDataDeletionRequest("processed")}
                  >
                    Process
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedDeletionRequest || selectedDeletionRequest.status !== "open"}
                    onClick={() => void processDataDeletionRequest("rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Admin Audit Logs</h2>
              <span className="muted">
                {numberValue(filteredAuditLogs.length)} shown · {numberValue(auditLogs.length)} total
              </span>
            </div>
            <div className="panel-body">
              <div className="form-grid compact" style={{ marginBottom: 12 }}>
                <label className="field">
                  <span>Action</span>
                  <select
                    className="select"
                    value={auditActionFilter}
                    onChange={(event) => setAuditActionFilter(event.target.value)}
                  >
                    <option value="">All actions</option>
                    {auditActionOptions.map((actionType) => (
                      <option key={actionType} value={actionType}>
                        {actionType}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Resource</span>
                  <select
                    className="select"
                    value={auditResourceFilter}
                    onChange={(event) => setAuditResourceFilter(event.target.value)}
                  >
                    <option value="">All resources</option>
                    {auditResourceOptions.map((resourceType) => (
                      <option key={resourceType} value={resourceType}>
                        {resourceType}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="toolbar">
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setAuditActionFilter("");
                      setAuditResourceFilter("");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              </div>
              {filteredAuditLogs.length === 0 ? (
                <EmptyBlock label="Нет audit events для выбранного фильтра." />
              ) : (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Actor</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Metadata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.slice(0, 50).map((auditLog) => (
                        <tr key={auditLog.id}>
                          <td>
                            <strong>{auditLog.action_type}</strong>
                            <small>{auditLog.message ?? auditLog.id}</small>
                          </td>
                          <td>
                            {auditLog.resource_type}
                            <small>{auditLog.resource_id ?? "-"}</small>
                          </td>
                          <td>
                            {auditLog.actor_id}
                            <small>{auditLog.actor_role}</small>
                          </td>
                          <td>
                            <span className={`status-pill ${auditStatusClass(auditLog.status)}`}>
                              {auditLog.status}
                            </span>
                          </td>
                          <td>{formatDate(auditLog.created_at)}</td>
                          <td>
                            <code>{auditMetadataPreview(auditLog.metadata)}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Scoring Backtest</h2>
              <BarChart3 size={18} />
            </div>
            <div className="panel-body">
              {scoringBacktest === null || scoringBacktest.evaluated_points === 0 ? (
                <EmptyBlock label="Нет historical snapshots для backtest." />
              ) : (
                <>
                  <div className="metric-grid compact">
                    <div className="metric">
                      <span>Evaluated points</span>
                      <strong>{numberValue(scoringBacktest.evaluated_points)}</strong>
                    </div>
                    <div className="metric">
                      <span>Listings</span>
                      <strong>
                        {numberValue(scoringBacktest.listings_evaluated)} /{" "}
                        {numberValue(scoringBacktest.listings_seen)}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>Mean error</span>
                      <strong>{pct(scoringBacktest.mean_absolute_error_pct)}</strong>
                    </div>
                    <div className="metric">
                      <span>Within 10%</span>
                      <strong>{pct(scoringBacktest.within_10_pct)}</strong>
                    </div>
                  </div>
                  {scoringBacktestReport ? (
                    <>
                      <div className="metric-grid compact" style={{ marginTop: 14 }}>
                        <div className="metric">
                          <span>Report status</span>
                          <strong>
                            <span
                              className={`status-pill ${backtestSeverityClass(
                                scoringBacktestReport.overall_severity,
                              )}`}
                            >
                              {scoringBacktestReport.overall_severity}
                            </span>
                          </strong>
                        </div>
                        <div className="metric">
                          <span>Quality label</span>
                          <strong style={{ fontSize: 14 }}>
                            {scoringBacktestReport.quality_label}
                          </strong>
                        </div>
                        <div className="metric">
                          <span>Worst area</span>
                          <strong style={{ fontSize: 14 }}>
                            {scoringBacktestReport.area_drift[0]?.label ?? "-"}
                          </strong>
                        </div>
                        <div className="metric">
                          <span>Worst period</span>
                          <strong style={{ fontSize: 14 }}>
                            {scoringBacktestReport.period_drift[0]?.label ?? "-"}
                          </strong>
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <h3>Findings</h3>
                        <ul className="section-list compact">
                          {scoringBacktestReport.findings.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <h3>Recommendations</h3>
                        <ul className="section-list compact">
                          {scoringBacktestReport.recommendations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="table-scroll" style={{ marginTop: 14 }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Error bucket</th>
                              <th>Points</th>
                              <th>Share</th>
                              <th>Mean error</th>
                              <th>Over / under</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scoringBacktestReport.error_buckets.map((bucket) => (
                              <tr key={bucket.code}>
                                <td>{bucket.label}</td>
                                <td>{numberValue(bucket.evaluated_points)}</td>
                                <td>{pct(bucket.share_pct)}</td>
                                <td>{pct(bucket.mean_absolute_error_pct)}</td>
                                <td>
                                  {numberValue(bucket.overestimate_count)} /{" "}
                                  {numberValue(bucket.underestimate_count)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="table-scroll" style={{ marginTop: 14 }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Drift segment</th>
                              <th>Points</th>
                              <th>Mean</th>
                              <th>Within 10%</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ...scoringBacktestReport.area_drift.slice(0, 3),
                              ...scoringBacktestReport.period_drift.slice(0, 3),
                            ].map((segment) => (
                              <tr key={`${segment.segment_type}-${segment.key}`}>
                                <td>
                                  <strong>{segment.label}</strong>
                                  <small>{segment.trend_note}</small>
                                </td>
                                <td>{numberValue(segment.evaluated_points)}</td>
                                <td>{pct(segment.mean_absolute_error_pct)}</td>
                                <td>{pct(segment.within_10_pct)}</td>
                                <td>
                                  <span
                                    className={`status-pill ${backtestSeverityClass(
                                      segment.severity,
                                    )}`}
                                  >
                                    {segment.severity}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}
                  <div className="table-scroll" style={{ marginTop: 14 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Listing</th>
                          <th>Observed</th>
                          <th>Target</th>
                          <th>Predicted</th>
                          <th>Actual</th>
                          <th>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scoringBacktest.items.map((item) => (
                          <tr key={`${item.listing_id}-${item.observed_at}`}>
                            <td>
                              <strong>{item.title}</strong>
                              <small>{item.weights_profile}</small>
                            </td>
                            <td>{item.observed_at}</td>
                            <td>{item.target_observed_at}</td>
                            <td>{numberValue(item.predicted_fair_price_mid)} PLN</td>
                            <td>{numberValue(item.actual_price)} PLN</td>
                            <td>{pct(item.absolute_error_pct)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Partner CSV Import</h2>
              <Upload size={18} />
            </div>
            <div className="panel-body">
              <div className="form-grid compact">
                <label className="field">
                  <span>File</span>
                  <input
                    className="input"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => {
                      setPartnerCsvFile(event.target.files?.[0] ?? null);
                      setPartnerImportResult(null);
                    }}
                  />
                </label>
                <label className="field">
                  <span>Source name</span>
                  <input
                    className="input"
                    value={partnerSourceName}
                    onChange={(event) => setPartnerSourceName(event.target.value)}
                  />
                </label>
                <label className="field checkbox-field">
                  <span>Dry-run</span>
                  <input
                    type="checkbox"
                    checked={partnerDryRun}
                    onChange={(event) => setPartnerDryRun(event.target.checked)}
                  />
                </label>
              </div>
              <div className="toolbar" style={{ marginTop: 12 }}>
                <button className="button primary" type="button" onClick={() => void importPartnerCsv()}>
                  <Upload size={16} /> {partnerDryRun ? "Check CSV" : "Import CSV"}
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setPartnerDryRun(false);
                    void importPartnerCsv(false);
                  }}
                >
                  Import now
                </button>
              </div>
              {partnerImportResult ? (
                <div className="metric-grid compact" style={{ marginTop: 14 }}>
                  <div className="metric">
                    <span>Rows</span>
                    <strong>{numberValue(partnerImportResult.rows_seen)}</strong>
                  </div>
                  <div className="metric">
                    <span>Raw</span>
                    <strong>
                      +{numberValue(partnerImportResult.raw_created)} / ~
                      {numberValue(partnerImportResult.raw_updated)}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Properties</span>
                    <strong>
                      +{numberValue(partnerImportResult.properties_created)} / ~
                      {numberValue(partnerImportResult.properties_updated)}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Job</span>
                    <strong>{partnerImportResult.job.status}</strong>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Planned Investments Import</h2>
              <Upload size={18} />
            </div>
            <div className="panel-body">
              <div className="form-grid compact">
                <label className="field">
                  <span>File</span>
                  <input
                    className="input"
                    type="file"
                    accept=".json,.csv,application/json,text/csv"
                    onChange={(event) => {
                      setImportFile(event.target.files?.[0] ?? null);
                      setImportResult(null);
                    }}
                  />
                </label>
                <label className="field">
                  <span>Source name</span>
                  <input
                    className="input"
                    value={importSourceName}
                    onChange={(event) => setImportSourceName(event.target.value)}
                  />
                </label>
                <label className="field checkbox-field">
                  <span>Dry-run</span>
                  <input
                    type="checkbox"
                    checked={importDryRun}
                    onChange={(event) => setImportDryRun(event.target.checked)}
                  />
                </label>
              </div>
              <div className="toolbar" style={{ marginTop: 12 }}>
                <button className="button primary" type="button" onClick={() => void importInvestments()}>
                  <Upload size={16} /> {importDryRun ? "Check file" : "Import file"}
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setImportDryRun(false);
                    void importInvestments(false);
                  }}
                >
                  Import now
                </button>
              </div>
              {importResult ? (
                <div className="metric-grid compact" style={{ marginTop: 14 }}>
                  <div className="metric">
                    <span>Rows</span>
                    <strong>{numberValue(importResult.rows_seen)}</strong>
                  </div>
                  <div className="metric">
                    <span>Created</span>
                    <strong>{numberValue(importResult.created)}</strong>
                  </div>
                  <div className="metric">
                    <span>Updated</span>
                    <strong>{numberValue(importResult.updated)}</strong>
                  </div>
                  <div className="metric">
                    <span>Job</span>
                    <strong>{importResult.job.status}</strong>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Planned Investments CRUD</h2>
              <span className="muted">{plannedInvestments.length} active layers</span>
            </div>
            <div className="panel-body planned-investment-grid">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>District</th>
                      <th>Year</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannedInvestments.map((investment) => (
                      <tr
                        key={investment.id}
                        className={
                          selectedInvestmentId === investment.id ? "selected-row" : undefined
                        }
                        onClick={() => {
                          setSelectedInvestmentId(investment.id);
                          setInvestmentForm(formFromInvestment(investment));
                        }}
                      >
                        <td>
                          <strong>{investment.name}</strong>
                          <small>{investment.id}</small>
                        </td>
                        <td>{investment.investment_type}</td>
                        <td>
                          <span className={`status-pill ${investment.status}`}>
                            {investment.status}
                          </span>
                        </td>
                        <td>{investment.district ?? "-"}</td>
                        <td>{investment.expected_year ?? "-"}</td>
                        <td>{investment.confidence_score}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="investment-form">
                <div className="panel-header inline">
                  <h3>{selectedInvestment ? "Редактирование" : "Новый слой"}</h3>
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setSelectedInvestmentId("");
                      setInvestmentForm(defaultInvestmentForm);
                    }}
                  >
                    Сброс
                  </button>
                </div>
                <div className="form-grid compact">
                  <Field
                    label="Name"
                    value={investmentForm.name}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, name: value })}
                  />
                  <Field
                    label="Type"
                    value={investmentForm.investment_type}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, investment_type: value })
                    }
                  />
                  <Field
                    label="Status"
                    value={investmentForm.status}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, status: value })}
                  />
                  <Field
                    label="City"
                    value={investmentForm.city}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, city: value })}
                  />
                  <Field
                    label="District"
                    value={investmentForm.district}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, district: value })
                    }
                  />
                  <Field
                    label="Year"
                    value={investmentForm.expected_year}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, expected_year: value })
                    }
                  />
                  <Field
                    label="Lat"
                    value={investmentForm.lat}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, lat: value })}
                  />
                  <Field
                    label="Lon"
                    value={investmentForm.lon}
                    onChange={(value) => setInvestmentForm({ ...investmentForm, lon: value })}
                  />
                  <Field
                    label="Confidence"
                    value={investmentForm.confidence_score}
                    onChange={(value) =>
                      setInvestmentForm({ ...investmentForm, confidence_score: value })
                    }
                  />
                </div>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Source URL</span>
                  <input
                    className="input"
                    value={investmentForm.source_url}
                    onChange={(event) =>
                      setInvestmentForm({ ...investmentForm, source_url: event.target.value })
                    }
                  />
                </label>
                <label className="field" style={{ marginTop: 10 }}>
                  <span>Notes</span>
                  <textarea
                    className="textarea"
                    value={investmentForm.notes}
                    onChange={(event) =>
                      setInvestmentForm({ ...investmentForm, notes: event.target.value })
                    }
                  />
                </label>
                <div className="toolbar" style={{ marginTop: 12 }}>
                  <button className="button primary" type="button" onClick={() => void createInvestment()}>
                    Create
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={!selectedInvestmentId}
                    onClick={() => void updateInvestment()}
                  >
                    Update
                  </button>
                  <button
                    className="button danger"
                    type="button"
                    disabled={!selectedInvestmentId}
                    onClick={() => void deleteInvestment()}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="panel admin-wide">
            <div className="panel-header">
              <h2>Raw Listings Preview</h2>
              <span className="muted">
                <Database size={14} /> {sourceNames.join(", ") || "no sources"}
              </span>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Listing ID</th>
                    <th>URL</th>
                    <th>Fetched</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {rawListings.map((raw) => (
                    <tr key={String(raw.id)}>
                      <td>{raw.source_name}</td>
                      <td>{raw.source_listing_id}</td>
                      <td>
                        <a href={raw.source_url} target="_blank" rel="noreferrer">
                          open
                        </a>
                      </td>
                      <td>{formatDate(raw.fetched_at)}</td>
                      <td>
                        <code>{compactPayload(raw.raw_payload)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {latestJob ? (
        <p className="muted" style={{ marginTop: 12 }}>
          Latest job: {latestJob.id} · {latestJob.source_name} · {latestJob.status}
        </p>
      ) : null}
    </>
  );
}

function Field({
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function sourcePayload(form: SourceForm): Required<SourceRegistryEntryPayload> {
  return {
    name: form.name,
    source_type: form.source_type,
    base_url: blankToNull(form.base_url),
    legal_status: form.legal_status,
    refresh_cadence: form.refresh_cadence,
    owner: form.owner,
    ingestion_method: form.ingestion_method,
    allowed_use: form.allowed_use
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    robots_txt_url: blankToNull(form.robots_txt_url),
    terms_url: blankToNull(form.terms_url),
    notes: blankToNull(form.notes),
    raw_payload_retention_days: numberOrNull(form.raw_payload_retention_days),
    private_url_retention_days: numberOrNull(form.private_url_retention_days),
    retention_notes: blankToNull(form.retention_notes),
    is_active: form.is_active,
  };
}

function formFromSource(source: SourceRegistryEntry): SourceForm {
  return {
    name: source.name,
    source_type: source.source_type,
    base_url: source.base_url ?? "",
    legal_status: source.legal_status,
    refresh_cadence: source.refresh_cadence,
    owner: source.owner,
    ingestion_method: source.ingestion_method,
    allowed_use: source.allowed_use.join(","),
    robots_txt_url: source.robots_txt_url ?? "",
    terms_url: source.terms_url ?? "",
    notes: source.notes ?? "",
    raw_payload_retention_days:
      source.raw_payload_retention_days === null ? "" : String(source.raw_payload_retention_days),
    private_url_retention_days:
      source.private_url_retention_days === null ? "" : String(source.private_url_retention_days),
    retention_notes: source.retention_notes ?? "",
    is_active: source.is_active,
  };
}

function investmentPayload(form: InvestmentForm): PlannedInvestmentPayload {
  return {
    name: form.name,
    investment_type: form.investment_type,
    status: form.status,
    city: form.city,
    district: form.district || null,
    expected_year: form.expected_year ? Number(form.expected_year) : null,
    lat: Number(form.lat),
    lon: Number(form.lon),
    source_url: form.source_url || null,
    confidence_score: Number(form.confidence_score),
    notes: form.notes || null,
  };
}

function listingCorrectionPayload(form: ListingCorrectionForm): ListingCorrectionPayload {
  const payload: ListingCorrectionPayload = {
    correction_reason: form.correction_reason.trim(),
    corrected_by: blankToNull(form.corrected_by),
  };
  addText(payload, "title", form.title);
  addText(payload, "city", form.city);
  addText(payload, "district", form.district);
  addText(payload, "area_id", form.area_id);
  addText(payload, "municipality", form.municipality);
  addText(payload, "address", form.address);
  if (form.market_type) {
    payload.market_type = form.market_type;
  }
  addNumber(payload, "price", form.price);
  addNumber(payload, "area_m2", form.area_m2);
  addNumber(payload, "rooms", form.rooms);
  addNumber(payload, "floor", form.floor);
  addNumber(payload, "building_floors", form.building_floors);
  addNumber(payload, "building_year", form.building_year);
  addNumber(payload, "lat", form.lat);
  addNumber(payload, "lon", form.lon);
  addNumber(payload, "nearest_stop_m", form.nearest_stop_m);
  addNumber(payload, "nearest_school_m", form.nearest_school_m);
  addNumber(payload, "nearest_major_road_m", form.nearest_major_road_m);
  addNumber(payload, "nearest_industrial_zone_m", form.nearest_industrial_zone_m);
  addNumber(payload, "data_quality_score", form.data_quality_score);
  return payload;
}

function addText(
  payload: ListingCorrectionPayload,
  key: ListingCorrectionTextField,
  value: string,
) {
  const trimmed = value.trim();
  if (trimmed) {
    payload[key] = trimmed;
  }
}

function addNumber(
  payload: ListingCorrectionPayload,
  key: ListingCorrectionNumberField,
  value: string,
) {
  const trimmed = value.trim();
  if (trimmed) {
    payload[key] = Number(trimmed);
  }
}

function formFromInvestment(investment: PlannedInvestment): InvestmentForm {
  return {
    name: investment.name,
    investment_type: investment.investment_type,
    status: investment.status,
    city: investment.city,
    district: investment.district ?? "",
    expected_year: investment.expected_year ? String(investment.expected_year) : "",
    lat: String(investment.lat),
    lon: String(investment.lon),
    source_url: investment.source_url ?? "",
    confidence_score: String(investment.confidence_score),
    notes: investment.notes ?? "",
  };
}

function referralContact(referral: PartnerReferral) {
  return [referral.contact_email, referral.contact_phone].filter(Boolean).join(" · ") || "-";
}

function referralTypeLabel(referralType: PartnerReferral["referral_type"]) {
  const labels: Record<PartnerReferral["referral_type"], string> = {
    buyer_beta: "Buyer beta",
    realtor_beta: "Realtor beta",
    mortgage: "Mortgage",
    legal: "Legal",
    renovation: "Renovation",
  };
  return labels[referralType] ?? referralType;
}

function referralLeadContext(referral: PartnerReferral) {
  const metadata = referral.metadata ?? {};
  const objectReference = metadata.object_reference_private;
  const agencyName = metadata.agency_name;
  if (typeof objectReference === "string" && objectReference.trim()) {
    return `object: ${objectReference}`;
  }
  if (typeof agencyName === "string" && agencyName.trim()) {
    return `agency: ${agencyName}`;
  }
  return referral.listing_id || referral.report_id || referral.district || "-";
}

function selectedReferralContactLine(referral: PartnerReferral) {
  return [
    referral.contact_name,
    referral.contact_email,
    referral.contact_phone,
    referral.city,
    referral.district,
  ]
    .filter(Boolean)
    .join(" · ");
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function domainFromUrl(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0] || null;
  }
}

function legalStatusClass(status: SourceLegalStatus) {
  if (status === "approved") return "healthy";
  if (status === "blocked") return "failed";
  if (status === "review_required") return "warning";
  return "queued";
}

function retentionDaysLabel(value: number | null) {
  return value === null ? "off" : `${value}d`;
}

function deletionStatusClass(status: DataDeletionRequestStatus) {
  if (status === "processed") return "healthy";
  if (status === "rejected") return "failed";
  return "warning";
}

function auditStatusClass(status: AdminAuditLog["status"]) {
  if (status === "succeeded") return "healthy";
  if (status === "blocked") return "warning";
  return "failed";
}

function auditMetadataPreview(metadata: Record<string, unknown>) {
  const text = JSON.stringify(metadata);
  if (text.length <= 120) return text;
  return `${text.slice(0, 117)}...`;
}

function sourceErrorStatusClass(sourceError: SourceError) {
  if (sourceError.status === "resolved" || sourceError.status === "ignored") return "healthy";
  if (sourceError.status === "retry_scheduled") return "warning";
  return sourceError.severity === "error" ? "failed" : "warning";
}

function sourceErrorDomain(sourceError: SourceError) {
  const sourceDomain =
    typeof sourceError.metadata.source_domain === "string"
      ? sourceError.metadata.source_domain
      : null;
  const sourceUrlHash =
    typeof sourceError.metadata.source_url_hash === "string"
      ? sourceError.metadata.source_url_hash
      : null;
  return [sourceDomain, sourceUrlHash ? `hash ${sourceUrlHash.slice(0, 10)}` : null]
    .filter(Boolean)
    .join(" · ");
}

function dedupDecisionClass(match: PropertyDeduplicationMatch) {
  if (match.decision === "matched") return "healthy";
  if (match.decision === "review_required" || match.review_status === "open") {
    return "warning";
  }
  return "failed";
}

function backtestSeverityClass(severity: ScoringBacktestReport["overall_severity"]) {
  if (severity === "healthy") return "healthy";
  if (severity === "critical") return "failed";
  return "warning";
}

function dedupPayloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function pct(value: number | null) {
  return value === null ? "-" : `${value.toFixed(1)}%`;
}

function compactPayload(payload: Record<string, unknown>) {
  const text = JSON.stringify(payload);
  if (text.length <= 140) return text;
  return `${text.slice(0, 137)}...`;
}
