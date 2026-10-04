# Current Readiness Audit - 2026-10-03

Scope: repository documentation, FastAPI route surface, Next.js route map,
CI/release gates and the WartoMetr buyer-decision product direction.

This audit compares committed documentation with the current working tree. It
does not prove the state of the remote OCI VM, payment dashboards, external
monitoring, legal approvals or live data freshness.

## Executive Verdict

Ready for:

- local development and deterministic demo/test scenarios;
- internal demos and founder-operated staging;
- focused browser-quality checks for the main apartment-check, comparison,
  evidence, negotiation, action-plan, rental and admin-funnel scenarios.

Not ready to call fully production-ready for public paid self-serve traffic
until the external gates below are closed and recorded with fresh evidence:

- offsite backup plus restore drill;
- live or test-mode Stripe/PayU checkout and webhook verification from the
  deployed frontend;
- production monitoring, alerting and cost controls;
- S3-compatible private report artifact storage or an explicitly limited
  manual artifact process;
- approved source registry and live data freshness evidence for the datasets
  used in paid reports;
- remote CI/deployment observation for the current commit.

## Documentation State

Maintained references:

- `README.md`
- `docs/README.md`
- `docs/api_surface.md`
- `docs/frontend_route_product_map.md`
- `docs/hybrid_listing_analysis.md`
- `docs/source_compliance_policy.md`
- `docs/product/*.md`
- `docs/production_ops_runbook.md`
- `docs/oci_staging_setup_runbook.md`

Historical evidence, not current status:

- `docs/WartoMetr_Phase_*_Implementation.md`
- `docs/production_readiness_audit_2026-09-01.md`
- `docs/operations/ORACLE_RCN_VERIFICATION_2026-09-13.md`
- `docs/product/DOMARION_REAL_MARKET_DATA_PIPELINE.md`

The historical files remain useful because they record what was verified at
the time. They should not be deleted as cleanup unless their content is first
summarized into a maintained changelog or release-history file.

## Code Surface Checked

- Backend package: FastAPI app in `domarion/main.py`, public router in
  `domarion/api/routes.py`, auth router, compare router and product analytics
  router.
- Frontend routes: `frontend/app` currently contains consumer, contextual,
  pro/internal and admin pages matching the route map.
- CI: `.github/workflows/ci.yml` runs backend lint/tests/coverage/performance
  smoke, frontend lint/typecheck/smoke/build, browser-quality gates and Docker
  builds. OCI deployment remains protected/manual or commit-message triggered.

## Documentation Corrections Made

- `docs/api_surface.md` was stale. It now records the missing current endpoint
  groups: auth, buyer profile, runtime context, coverage, object watch,
  post-viewing verdicts, draft document checks, product events and admin
  product funnel.
- `README.md` incorrectly pointed to Phase 7 as the latest implementation
  report. It now points to this audit and Phase 37.

## What Appears Complete In The Repository

- Decision-first apartment check exists through `/` and `/check`, with manual
  entry, URL import preview, analysis, partial-data guidance, save/track and
  comparison paths.
- Buyer result surfaces include verdict, fair-price range, confidence, risks,
  evidence, negotiation and action-plan layers.
- Search, saved apartments, comparison, alerts, reports, pricing, methodology,
  area pages, developer evidence and guides have frontend routes.
- Backend contains stores and tests for auth, tenant isolation, reports,
  payments, alerts, favorites, buyer decisions, confidence, fair-price
  evidence, RCN transactions, rental observations, product analytics,
  document-check first slice and admin ingestion.
- Browser-quality scripts cover the highest-value consumer flows and separate
  public/internal route gates.

## Main Product Gaps

- The product surface is broader than the primary buyer journey. Routes such as
  `/market`, `/developers`, `/reports`, `/mortgage`, `/pricing`, `/beta` and
  `/realtors` exist, but the route map correctly says several should remain
  contextual, hidden from primary navigation or de-emphasized until the buyer
  workflow is commercially proven.
- The buyer flow has many advanced capabilities, but production copy and IA
  still need ongoing cleanup to avoid implementation terms, pro/admin concepts
  and score-heavy presentation leaking into consumer surfaces.
- Document analysis is a first slice around private draft checks; the broader
  due-diligence document-upload plan remains a proposal.
- Transaction-backed valuation is partly integrated through area statistics.
  Transaction-level comparable evidence in buyer reports remains follow-up
  work according to the market-data pipeline record.

## Main Operational Gaps

- Backup/restore is documented but needs current VM evidence.
- Payment providers are implemented and tested in code, but live deployed
  checkout/webhook execution is not recorded as proven.
- Monitoring and cost alerts are required by readiness docs, but this audit did
  not inspect external dashboards or secrets.
- OCI deployment scripts and GitHub workflow exist, but this audit did not
  verify the currently deployed commit, service health or external domains.
- Report artifact storage must be proven on S3-compatible private storage for
  production-scale paid reports.

## Main Data/Trust Gaps

- The app has strong source-compliance guardrails, but paid reports still need
  fresh evidence that live Source Registry entries are approved, active and
  legally usable for the specific commercial claims.
- Demo mode is clearly labeled and guarded in code, but production readiness
  depends on deployed configuration. Do not infer production data quality from
  memory/demo tests.
- Market coverage should continue to be described as observed/limited unless
  an approved live feed and successful refresh evidence are recorded.

## Deletion Decision

No documentation files were deleted in this pass. The apparently old phase and
readiness files are historical verification records, and `docs/README.md`
already marks them as non-authoritative for today's deployment state. Deleting
them now would remove useful audit trail without improving product correctness.

Safe future cleanup:

- consolidate Phase 1-37 into a single release-history document;
- keep only the latest operational audit plus links to archived records;
- remove generated screenshots/logs from ignored artifact directories only.

Do not delete:

- migrations;
- source/data contracts;
- source-compliance and retention policies;
- deployment manifests;
- production runbooks;
- historical audits that have not been summarized elsewhere.

## Recommended Next Work

1. Run the full local release gate from `docs/production_ops_runbook.md` and
   record the output for the current commit.
2. Observe the remote GitHub CI run for the current commit, especially
   browser-quality and Docker jobs.
3. On OCI, record `/ready`, service status, backup timer, latest backup and one
   restore drill.
4. Verify Stripe or PayU in test mode end to end from the deployed frontend,
   including webhook fulfillment and report artifact persistence.
5. Confirm production Source Registry approvals and current data freshness for
   the dataset used in buyer reports.
6. Continue product cleanup around the primary apartment-check journey before
   promoting pro/market/admin-adjacent surfaces.
