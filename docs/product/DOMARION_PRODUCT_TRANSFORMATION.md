# Domarion Product Transformation Audit

Audit date: 2026-09-05
Baseline commit: 230af7d (`Fix Alpine npm lockfile dependencies`)
Product: Domarion / WartoMetr

## Executive Summary

Domarion is a broad real-estate intelligence platform with a usable buyer
decision foundation. The repository already contains more capability than is
needed for an initial market validation: listing search, private URL import,
decision packages, comparable evidence, risk and investment signals, due
diligence, negotiation guidance, comparison, saved apartments, object watches,
reports, payments, alerts, localization, and Oracle Cloud deployment.

The main transformation risk is not missing analytics. It is that a technically
wide product can still fail to earn trust or money at the moment a buyer must
decide whether to spend hundreds of thousands of PLN. The next work must make
the existing decision path trustworthy, observable, commercially testable, and
operationally recoverable before adding broad feature surface.

The target hierarchy remains:

`LISTING -> ANALYSIS -> VERDICT -> EVIDENCE -> COMPARISON -> NEGOTIATION -> ACTION -> MONITORING`

The primary product question is:

> Should I buy this apartment at this price?

## Current State

### Product surface

The current public and internal route inventory includes:

- `/` for apartment search and onboarding;
- `/check` for URL import or manual apartment analysis;
- `/check/drafts` and `/saved` for personal checked and saved apartments;
- `/listings/[id]` for contextual listing analysis;
- `/compare` and `/areas/compare` for property and area comparison;
- `/areas` and `/areas/[areaId]` for public area decision support;
- `/mortgage` for purchase-cost and affordability calculations;
- `/reports` and `/pricing` for report history and paid report flow;
- `/alerts` for saved-search and object-watch workflows;
- `/account` for buyer account plus agency/CRM functionality;
- `/guides`, `/news`, `/developers` for acquisition and evidence content;
- `/beta` and `/realtors` for campaign/professional entry points;
- `/market` and `/admin` for internal/professional and administrative work.

Navigation and sitemap work already separates consumer, contextual, pro, beta,
and admin routes. The remaining product risk is density and role mixing inside
some screens, especially account/pro functionality and the amount of advanced
analysis exposed around the core check flow.

### Architecture

Backend:

- FastAPI application entrypoint in `domarion/main.py`.
- API routers and dependency boundaries in `domarion/api/routes.py` and
  `domarion/api/auth_routes.py`.
- Domain services under `domarion/services/`, including buyer decision,
  comparables, scoring, mortgage, rental, market, future impact, alerts,
  reports, payments, and ingestion.
- Pydantic contracts in `domarion/schemas.py`.
- Memory and PostgreSQL store implementations selected through factory modules.
- SQLAlchemy models in `domarion/db/models.py` and Alembic migrations through
  `0033_password_credentials`.
- Redis is used by the deployed topology for service-level infrastructure; the
  OCI compose stack provides PostGIS, Redis, API, worker, frontend, and Caddy.

Frontend:

- Next.js App Router under `frontend/app`.
- Shared buyer decision, provenance, state, score, map, and navigation
  components under `frontend/components`.
- API transport boundary in `frontend/lib/apiClient.ts`, typed endpoint facade
  in `frontend/lib/api.ts`, and generated OpenAPI types in
  `frontend/lib/generated-api.ts`.
- Locale dictionaries and route copy in `frontend/lib/i18n.ts`, with Polish as
  the production default and EN/RU/UK support.
- Shared formatters, score labels, localized errors, and locale preference
  hooks are already available.

Operations:

- CI covers backend tests, frontend lint/typecheck/smoke, Docker builds, and
  Playwright browser quality.
- OCI deployment uses `scripts/deploy_oracle_cloud.sh` and
  `scripts/oracle_cloud_preflight.py` with an external env file.
- The last deployment issue exposed a cross-platform npm lockfile gap; commit
  `230af7d` corrected the Alpine optional dependency entries.

### Decision and analytics foundation

The existing `BuyerDecisionPackage` is the main reusable decision contract. It
contains:

- deterministic verdict status: `buy`, `negotiate`, `avoid`, `verify_first`;
- score-10 buyer presentation plus headline and summary;
- seller price, fair-price range, delta, opening offer, realistic deal range,
  and maximum reasonable offer;
- top reasons, top risks, and critical unknowns;
- intent fit for self, family, rental, investment, and unsure;
- due diligence, knowledge matrix, total acquisition cost, and disclaimers;
- pre-viewing and post-viewing assistants;
- watch trigger recommendations.

Analytics also expose fair-price confidence, data quality notes, comparables,
market snapshots, listing events, future-impact data, developer evidence, and
source references. The analytics code already distinguishes missing data in a
number of flows and has targeted tests for strong, weak, partial, and unknown
inputs.

### Commercial and retention foundation

Existing code supports report products, bundle credits, mock/Stripe/PayU
adapters, webhook idempotency, report artifact storage abstraction, invoice
metadata, white-label reports, partner referrals, paid-beta tracking, saved
reports, saved apartments, saved-search alerts, object-watch alerts, and
delivery-job history.

This is a foundation, not proof of commercial viability. The repository docs
explicitly state that 20 paid buyer reports or 3 paid realtor pilots plus 5
decision-impact outcomes are still required before broad expansion.

## Reusable Functionality

Reuse these boundaries instead of creating parallel implementations:

| Need | Existing implementation |
| --- | --- |
| Buyer verdict | `domarion/services/buyer_decision.py` and `BuyerDecisionPackage` |
| Price evidence | `domarion/services/comparables.py`, `PropertyScores`, analysis APIs |
| Confidence/provenance | source references, coverage metadata, data-quality notes, `ListingProvenance` |
| Risk and due diligence | `PropertyDueDiligence`, risk profile service, `BuyerDecisionPanel` |
| Negotiation | `BuyerNegotiationAssistant`, negotiation evidence and decision UI |
| Total purchase cost | mortgage service and `TotalAcquisitionCost` |
| Intent fit | `PurchaseIntent`, intent-fit scoring in buyer decision service |
| Viewing follow-up | `PostViewingVerdictRecalculator` and backend recalculation service |
| Monitoring | alerts service, object-watch schemas, listing events, delivery jobs |
| Comparison | `/api/v1/compare`, compare page, mobile comparison cards |
| Localization | shared dictionaries, locale hook, formatter and error helpers |
| Async states | `StateBlocks`, page-specific loading/error/empty/retry handling |
| API typing | generated OpenAPI contract plus `apiClient` transport boundary |
| Release verification | CI browser-quality job, smoke script, deployment preflight |

## Gaps And Risks

### P0: trust, money, and production boundaries

1. **Identity boundary is closed in the current repository build.** The auth
   module retains development/test header and query fallbacks only for explicit
   demo environments. Production and staging startup reject demo mode, and
   session-authenticated roles, plans, and ownership come from the auth store.
   The remaining product decision is the first-user policy: open registration
   or explicitly invite-only manual beta.
2. **Paid checkout is not production-proven.** The default OCI example uses
   `PAYMENT_PROVIDER=mock`. Stripe and PayU adapters have tests, but hosted
   checkout and webhook fulfillment have not been verified against the live
   environment.
3. **Backup and restore are not proven.** The scripts and systemd timer exist,
   but an offsite backup, fresh timer output, and restore drill are still
   operational acceptance criteria.
4. **Monitoring and cost controls are not proven.** Uptime, error, worker,
   source-freshness, payment-webhook, and OCI budget alerts are configurable but
   not confirmed in the repository audit.
5. **Paid report artifacts are local in the OCI staging example.** Scale-ready
   production requires private S3-compatible storage and an artifact recovery
   test.
6. **Source/legal review remains a release dependency.** User-submitted URL
   import is deliberately limited, but paid report source fields and external
   claims need an explicit review record.

### P1: decision value and evidence

1. `/check` now keeps the URL flow primary and presents the manual path as
   essential buyer inputs first: address, city, district, price, size, and
   rooms. Title, market, renovation, developer, and building details are
   progressively disclosed as optional data. The remaining follow-up is to
   standardize this hierarchy across the other decision surfaces.
2. Provenance is implemented in several shapes rather than one reusable
   contract. Some views show source class and freshness, while comparable and
   area evidence can still expose raw internal source-type wording.
3. Future infrastructure has structured impact fields and a narrative panel,
   but status, expected year, confidence, disruption, supply pressure, and
   positive/negative effects need a consistent buyer-facing evidence model.
4. Report and listing-detail views contain strong decision data but still expose
   more score and analytics surface than a first-time buyer needs before the
   decision summary.
5. Data completeness is visible in selected check flows, but a consistent
   explanation of unknown legal, technical, and interior-condition inputs is
   needed across listing, report, compare, and saved views.

### P2: retention, personalization, and acquisition

1. Object-watch API and UI foundations exist, but a complete event lifecycle
   for all requested triggers, baseline updates, and user-facing history still
   needs end-to-end validation.
2. Buyer preference fields are represented mainly as purchase intent and
   lightweight form inputs. A small durable profile for high-value preferences
   is not yet a coherent cross-route product contract.
3. Search has buyer-facing modes and many filters, but internal/professional
   controls remain close to the consumer experience in some routes.
4. Area pages have dynamic evidence and planned investment data, but their
   narrative should answer who should live there, who should avoid it, and what
   alternatives exist before showing a directory of metrics.
5. Product analytics event naming and funnel instrumentation are not yet a
   documented first-class contract across the main buying journey.

### Quality and operational risks

- Full backend tests have a known independent failure around a dynamically
  generated correlation id comparison; it is not caused by the frontend
  transformation work and must be isolated before using the full suite as a
  release signal.
- Browser automation through the embedded browser may be unavailable in the
  current sandbox; the repository has a standalone Playwright runner and CI
  browser gate as alternatives.
- Generated frontend OpenAPI output is large and must only be regenerated from
  the actual backend contract.
- Existing local `artifacts/` directories are generated QA output and must not
  be promoted to product data or committed accidentally.

## Transformation Plan

The plan is deliberately ordered by dependency and value. Work is one task at a
time. No broad feature module starts before the P0 production and commercial
validation gates are either closed or explicitly limited to an invite-only beta.

### Phase 0: audit and baseline

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T0-01 | Inspect repository, routes, contracts, models, migrations, tests, analytics, auth, billing, reports, and deployment | DONE | none |
| T0-02 | Create and maintain this transformation audit | DONE | T0-01 |
| T0-03 | Record paid-beta validation, legal/source, backup/restore, and release evidence outside product code | BLOCKED / external | T0-01 |

### Phase 1: production trust gate

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T1-01 | Close public identity boundary: remove caller-controlled role/plan/user trust at production edge; preserve explicit test-only fixtures | DONE | T0-02 |
| T1-02 | Verify live staging checkout and webhook fulfillment with one supported provider | BLOCKED / credentials | T1-01 |
| T1-03 | Verify backup timer, offsite backup, restore drill, monitoring, and cost alerts | BLOCKED / OCI access | T0-03 |
| T1-04 | Establish paid-report manual QA checklist and source/legal approval record | PARTIAL | T0-03 |

### Phase 2: decision-first experience

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T2-01 | Simplify `/check` to URL/address plus essential facts and intent, with progressive disclosure | DONE | T1-01 |
| T2-02 | Standardize verdict summary across check, listing, report, saved, and compare | DONE | T2-01 |
| T2-03 | Make report first viewport answer price, fair range, verdict, confidence, and next action | DONE | T2-02 |
| T2-04 | Validate loading, partial-data, error/retry, and failed-mutation states for the core flow | DONE | T2-01 |

### Phase 3: evidence and analytics integrity

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T3-01 | Introduce one provenance presentation contract for source, freshness, scope, sample, and calculation type | DONE | T2-02 |
| T3-02 | Make comparable evidence inspectable through `Dlaczego taka cena?` without overclaiming | DONE | T3-01 |
| T3-03 | Formalize HIGH/MEDIUM/LOW confidence explanations and unknowns across all decision surfaces | PARTIAL | T3-01 |
| T3-04 | Complete future-infrastructure impact narrative with positive catalyst versus supply/disruption separation | PARTIAL | T3-01 |
| T3-05 | Verify analytics boundaries for fair price, risk, rental, liquidity, negotiation, and investment outputs | PARTIAL | T3-01 |

### Phase 4: action and retention

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T4-01 | Validate object-watch lifecycle, trigger baselines, event history, and delivery semantics | PARTIAL | T2-02, T1-03 |
| T4-02 | Generate adaptive viewing, document, seller-question, and negotiation actions from known risks | PARTIAL | T3-03 |
| T4-03 | Add a small durable buyer preference profile and use it transparently in fit and compare | NOT STARTED | T2-02, T1-01 |
| T4-04 | Turn compare into recommendation plus explicit trade-offs while preserving detail access | PARTIAL | T2-02, T4-03 |

### Phase 5: understandable discovery and area value

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T5-01 | Simplify search around buyer inputs and ranking modes | PARTIAL | T2-02 |
| T5-02 | Rewrite area pages around fit, avoid, price, risk, alternatives, and evidence | PARTIAL | T3-01 |
| T5-03 | Keep SEO guides contextual, source-backed, and connected to `/check` | PARTIAL | T5-02 |

### Phase 6: commercial and measurement layer

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T6-01 | Centralize and verify pricing ladder and entitlement copy | PARTIAL | T1-02 |
| T6-02 | Document and implement product funnel events without unnecessary personal data | NOT STARTED | T2-02, T1-01 |
| T6-03 | Produce final product review and remove low-value complexity | NOT STARTED | T1-03, T2-04, T6-02 |

## Dependency Graph

```text
T0-01 -> T0-02 -> T1-01 -> T2-01 -> T2-02 -> T2-03
                         |          |          |
                         |          |          +-> T4-04
                         |          +-> T3-01 -> T3-02 -> T3-03 -> T4-02
                         |                    |        |       +-> T3-04
                         |                    |        +-------> T4-03
                         |                    +-> T3-05
                         +-> T1-02 -> T6-01
T0-03 ------------------> T1-03 -> T4-01 -> T6-03
T0-03 ------------------> T1-04
T2-01 ------------------> T2-04 -> T6-03
T2-02 ------------------> T5-01 -> T5-02 -> T5-03
T2-02 ------------------> T6-02 -> T6-03
```

External gates are not hidden inside frontend work. T1-02, T1-03, and T0-03
require credentials, infrastructure, human QA, or customer evidence and must
be reported as blocked until actually verified.

## Task Acceptance Criteria

Every implementation task must meet the relevant criteria below before its
status changes to DONE:

### Product and UX

- A first-time buyer can identify the primary decision, the main evidence, and
  the next action without reading every metric.
- The primary action is obvious on desktop and at approximately 390px mobile.
- The path remains `decision -> explanation -> evidence -> action`.
- Advanced controls are progressive and do not dominate the first interaction.
- Polish is complete and EN/RU/UK do not mix accidentally on one route.
- Loading, empty, partial-data, error, retry, and failed-mutation states are
  explicit and recoverable.
- Keyboard access, focus, semantic structure, labels, contrast, and zoom are
  verified for affected routes.

### Analytics and trust

- Existing calculation semantics and API contracts are preserved unless the
  task explicitly changes them with tests and migration notes.
- Every significant claim identifies fact/source/derived/model/unknown status
  where technically possible.
- Fair-price ranges are not presented with unsupported precision.
- Confidence exposes understandable factors such as comparables, freshness,
  similarity, geography, time range, and missing attributes.
- Unknown or insufficient data cannot silently become a positive or neutral
  signal.
- Comparable and infrastructure evidence includes source, freshness, scope, and
  relevant limitations.

### Engineering and release

- Related unit/integration tests cover happy path, null/unknown/partial data,
  boundary values, and failure/retry behavior where applicable.
- `git diff` and `git status` are reviewed; generated artifacts and secrets are
  excluded.
- Formatter, lint, typecheck, targeted tests, broad tests, and build pass.
- The actual application is run and affected routes are inspected on desktop,
  tablet when relevant, and mobile.
- Browser console, hydration, and network failures are explained or fixed.
- Release gate is run before changing any task status to DONE.

## Task Execution Log

### T1-01: Production Identity Boundary — DONE (2026-09-05)

Implemented and verified:

- centralized `demo_identity_allowed` policy in `Settings`, with the allowlist
  limited to `local`, `development`, and `test` when demo mode is explicitly on;
- startup validation and `get_current_account` now use that same policy;
- session-authenticated users resolve role, plan, and ownership from the auth
  store, regardless of caller-provided identity headers;
- regression coverage for forged role/plan headers, tenant isolation, demo
  environment boundaries, startup safety, and production-readiness behavior;
- README, API surface, and production audit documentation now distinguish
  local fixtures from production authentication;
- malformed CI workflow indentation repaired so the repository deployment tests
  can parse and validate the release workflow.

Release evidence:

- targeted auth/config/readiness suite: `26 passed`;
- full backend suite: `376 passed, 1 skipped`;
- Ruff lint: passed; frontend lint, typecheck, smoke (`460 assertions`), build,
  and `npm audit --audit-level=moderate`: passed;
- standalone Playwright browser gate: all four locales on desktop and mobile,
  failure-state, authenticated check/save/compare flow: passed;
- embedded browser connection was unavailable because the environment returned
  the `sandboxPolicy` error; standalone repository browser QA was used instead.

Partial and blocked follow-ups:

- first-user policy and external identity-provider decision remain product and
  operational decisions, not a reason to re-enable caller-controlled headers;
- live payment credentials, backup/restore drill, monitoring/cost alerts,
  source/legal approval, and paid-beta evidence remain external gates for
  T1-02/T1-03/T1-04;
- the repository-wide Ruff formatter check still reports historical formatting
  drift in unrelated files; Ruff lint is clean and no broad reformat was applied.

Next dependency-ordered task: **T1-02**, live staging checkout and webhook
fulfillment. It remains blocked until a supported provider, credentials, and a
reachable staging callback are available.

### T1-02: Live Checkout And Webhook Fulfillment — BLOCKED (2026-09-05)

Repository verification completed:

- local Stripe and PayU adapter, webhook-signature, fulfillment, and duplicate
  event tests pass;
- the current OCI example and local runtime use the intentional `mock` provider;
- no Stripe/PayU credentials, webhook secret, or reachable staging callback are
  available in this environment, so a hosted checkout cannot be honestly run.

Unblock requirements:

- choose one first provider;
- supply test-mode provider credentials and webhook secret through the staging
  secret manager;
- expose a reachable callback and execute one real checkout, webhook fulfillment,
  duplicate delivery, and order-audit verification;
- only then switch the paid beta environment away from `mock`.

This external block does not prevent T2-01, whose direct dependency is the now
closed T1-01 identity boundary. The product remains an invite-only/controlled
beta until the payment gate is closed.

### T2-01: Essential-First `/check` Flow — DONE (2026-09-05)

Implemented and verified:

- kept listing URL import as the primary entry point with the existing intent
  selector and privacy consent;
- reordered the manual path around the minimum useful buyer facts: address,
  city, district, asking price, area, and room count;
- added native required semantics for the six essential fields so incomplete
  manual submissions are stopped before the API request;
- moved title, developer, investment, market, renovation, floor, and building
  details into a closed-by-default optional disclosure block;
- preserved the expanded purchase-intent selector and all existing API payload
  fields, loading/error/save/report/compare behavior, and four locale copies;
- added responsive styling for the helper and optional disclosure without
  introducing a second form or changing the backend contract.

Release evidence:

- frontend lint, typecheck, smoke (`460 assertions`), and production build:
  passed;
- standalone Playwright browser gate: all four locales on desktop and mobile,
  failure-state, and authenticated manual check/save/compare flow: passed;
- direct DOM check at 390px: `advancedOpen=false`, six essential required
  controls, `overflow=false`, `lang=pl`;
- visual screenshots inspected at 1440px and 390px; no incoherent overlap or
  horizontal overflow found.

Follow-up requirements:

- T2-02 should reuse the same decision-first hierarchy when standardizing the
  verdict summary across check, listing, report, saved, and compare views.

### T2-02: Shared Decision Summary — DONE (2026-09-05)

Implemented and verified:

- added a normalized `GeneratedReportDecisionSummary` snapshot to report list
  and detail contracts, sourced from existing deterministic buyer-decision
  metadata without changing scoring semantics or report storage migrations;
- sanitized legacy metadata values before schema validation so malformed,
  out-of-range or non-finite values become explicit unknowns instead of
  breaking report history;
- added the shared `DecisionSummary` frontend component with the consistent
  order: verdict, explanation, asking/fair price, confidence, and offer/cost
  context;
- reused the component in `/check`, listing detail, `/saved`, `/compare`, and
  `/reports`, including score-only fallbacks and honest unavailable states for
  favorites or older reports without a decision snapshot;
- restored nested `analysis_payload.analysis` reading for saved private drafts,
  so a saved checked apartment keeps its current verdict and fair-price range;
- localized the visible verdict summary labels and explanations for Polish,
  English, Russian, and Ukrainian, while preserving backend source values and
  numeric semantics;
- regenerated `frontend/lib/generated-api.ts`, documented the report snapshot
  response, and added API/store, invalid-metadata, and static surface coverage.

Release evidence:

- targeted report/history and user-submitted analysis suite: `50 passed`;
- full backend suite: `377 passed, 1 skipped`;
- full Ruff lint: passed; frontend lint and typecheck: passed;
- frontend static smoke: `475 assertions`; production build: passed;
- standard standalone Playwright browser gate: all four locales on desktop and
  mobile, failure-state, and authenticated check/save/compare flow: passed;
- affected-route rendered QA: `/check`, `/saved`, listing detail, `/reports`,
  and `/compare` showed the shared summary with no console errors; mobile
  summary at 390px had no horizontal overflow and retained seven metrics;
- affected summary localization QA: `pl/en/ru/uk` at 390px passed labels,
  document language, overflow, and browser-console checks;
- embedded browser remains unavailable because the environment returns the
  `sandboxPolicy` error; standalone repository Playwright was used instead;
- repository-wide Ruff formatter check still reports historical drift in 63
  files, so unrelated code was not mass-reformatted.

Partial and follow-up requirements:

- old reports without buyer-decision metadata remain intentionally partial and
  render an unavailable signal rather than a fabricated verdict;
- detailed report body and some legacy AI insight text still follow existing
  backend language/source contracts and remain a later localization cleanup;
- the next report task must preserve the first-viewport hierarchy while
  validating loading, partial-data, error/retry, and failed-mutation states.

### T2-03: Report First Viewport — DONE (2026-09-05)

Implemented and verified:

- moved the deterministic buyer verdict before the generic report summary,
  score grid, charts, and detailed sections in generated object reports;
- made the report decision block explicit with BUY / NEGOTIATE / SKIP /
  VERIFY FIRST, one-sentence explanation, asking price, fair-price range,
  confidence, recommended offer, and maximum reasonable offer;
- added a deterministic next-step instruction based only on the existing
  verdict status, before secondary cost and analytics details;
- moved listing ID, audience, template, and source metadata below the decision
  block so internal context does not displace the buying answer;
- added responsive report CSS so the primary decision metrics remain readable
  as two compact mobile columns, with the full next step visible at 390px;
- reused the shared localized `DecisionSummary` and next-step copy in the
  inline `/check` report result, including a score fallback when a decision
  package is unavailable;
- added order, status, confidence, next-step, and responsive HTML coverage to
  the report tests and frontend smoke surface.

Release evidence:

- targeted report, history, and user-submitted analysis suite: `57 passed`;
- full backend suite: `377 passed, 1 skipped`;
- full Ruff lint: passed; the changed report block was manually reviewed for
  formatting while preserving the file's existing style;
- frontend lint, typecheck, static smoke (`480 assertions`), and production
  build: passed;
- direct generated HTML QA at 1440x900 and 390x844: HTTP 200, five primary
  decision metrics, verdict-before-summary-before-score order, next-step
  visibility, no horizontal overflow, and no browser-console errors;
- authenticated inline `/check` report QA at 390px for `pl/en/ru/uk`:
  two decision summaries, localized next-step labels, matching document
  language, no horizontal overflow, and no browser-console errors;
- standard standalone Playwright browser gate: all four locales on desktop and
  mobile, failure-state, and authenticated check/save/compare flow: passed;
- visual inspection of desktop and mobile first-viewport screenshots found no
  incoherent overlap or clipped decision content;
- embedded browser remains unavailable because the environment returns the
  `sandboxPolicy` error; standalone repository Playwright was used instead;
- repository-wide Ruff formatter check still reports historical drift in 63
  files, so unrelated code was not mass-reformatted.

Partial and follow-up requirements:

- generated report body still contains legacy Russian/English source labels and
  uses the existing `lang="ru"` contract; full report localization remains a
  separate task and was not hidden by the new summary;
- reports without a buyer decision still show an honest score-only or missing
  state rather than inventing a verdict;
- T2-04 must validate loading, partial-data, error/retry, and failed-mutation
  states for the full decision flow.

The next dependency-ordered task at the time of this section was **T2-04**;
its completion is recorded below.

### T2-04: Core Flow State Recovery — DONE (2026-09-05)

Implemented and verified:

- added a reusable retry action to `ErrorBlock` while keeping retry semantics
  owned by the affected workflow;
- added explicit loading blocks for draft restore, import, analysis, report
  generation, save, and tracking operations;
- disabled conflicting controls while an operation is active, including the
  manual form fieldset, to prevent duplicate submissions and mismatched input;
- cleared stale analysis/report output when a new check or report generation
  starts, so an error cannot appear next to an outdated decision;
- made partial, failed, and unsupported URL-import outcomes explicit, with
  honest copy and an open manual-entry path for incomplete data;
- preserved the last report form for a deterministic report retry and wired
  draft loading, analysis, import, report, save, and tracking retries to the
  correct operation;
- added a dedicated `browser:check-recovery` Playwright gate covering delayed
  loading, failed report/save requests, partial import, unsupported import,
  and all four supported UI locales;
- added a tablet viewport to the standard standalone browser-quality gate.

Release evidence:

- frontend lint, typecheck, static smoke (`489 assertions`), and production
  build: passed;
- full backend suite: `377 passed, 1 skipped`;
- full Ruff lint: passed;
- `git diff --check`: passed; repository-wide Ruff formatter check still
  reports historical drift in 63 files, so unrelated files were not reformatted;
- `npm audit --audit-level=moderate`: `0 vulnerabilities`;
- dedicated recovery Playwright gate: core loading/retry mutations passed;
  partial and unsupported import outcomes passed in `en/pl/ru/uk` at 390px;
- standard standalone Playwright browser gate: all four locales at
  `1440x900`, `768x1024`, and `390x844`, plus failure-state and authenticated
  check/save/compare flow: passed;
- embedded browser remains unavailable because the environment returns the
  `sandboxPolicy` error; standalone repository Playwright was used instead.

Partial and follow-up requirements:

- the browser partial-import case uses a contract fixture because live portal
  extraction is external and non-deterministic; backend partial/failed/
  unsupported outcomes remain covered by the existing service/API tests;
- generated report body localization and its existing `lang="ru"` contract
  remain a separate follow-up from T2-03;
- post-viewing recalculation has its own local error handling and remains
  outside this shared retry contract;
The next dependency-ordered task at the time of this section was **T3-01**;
its completion is recorded below.

### T3-01: Provenance Presentation Contract — DONE (2026-09-05)

Implemented and verified:

- extended buyer source and negotiation evidence with optional observation
  count, geographic scope, time range, update date, and an explicit
  observed/calculated/model-estimate/unknown calculation type;
- populated provenance from the existing listing, comparable, area, planned
  investment, rental, and listing-history records without inventing missing
  observations;
- added the reusable `ProvenanceDetails` disclosure component with four
  localized copies, mapped source classes, localized method labels, and
  honest demo/unknown states;
- reused the component in buyer decision sources, negotiation arguments,
  listing provenance, and dynamic area evidence, removing raw source-type
  codes from those consumer surfaces;
- extended generated buyer HTML reports with the same provenance facts and
  a backend source/method formatter;
- regenerated `frontend/lib/generated-api.ts` from the running FastAPI
  `/openapi.json` contract and added backend/frontend contract assertions.

Release evidence:

- full backend suite: `378 passed, 1 skipped`;
- targeted buyer/API/report suite: `80 passed`;
- Ruff lint: passed; `git diff --check`: passed;
- repository-wide Ruff formatter check still reports historical drift in `64`
  unrelated files; no broad reformat was applied;
- frontend lint, typecheck, static smoke (`500 assertions`), and production
  build: passed;
- `npm audit --audit-level=moderate`: `0 vulnerabilities`;
- standalone browser gate: all four locales at desktop, tablet, and mobile,
  plus failure-state, critical flow, and expanded provenance on listing and
  area pages: passed;
- mobile visual inspection confirmed readable expanded provenance without
  horizontal overflow or incoherent overlap;
- embedded browser remains unavailable because the environment returns the
  `sandboxPolicy` error; standalone repository Playwright was used instead.

Partial and follow-up requirements:

- legacy `DataProvenance` payloads and some non-buyer coverage/news surfaces
  retain their existing API shape; the shared presentation is introduced at
  the decision surfaces first to preserve compatibility;
- generated report body copy still follows the existing mixed-language
  contract and needs the later report-localization task;
- live transaction-source freshness and sample quality remain dependent on
  production data ingestion, not the presentation layer;

### T3-02: Inspectable Comparable Evidence — DONE (2026-09-05)

Implemented and verified:

- added a typed `ComparableEvidence` contract to listing analysis with the
  selected object's source/provenance, observed date, market type, price,
  price/m2, size, rooms, optional floor/building year/condition, distance,
  price deltas, deterministic similarity score, and explicit match factors;
- built the evidence from the existing fresh comparable selection, keeping
  the existing selection semantics and fair-price calculation unchanged;
- added the localized `Dlaczego taka cena?` panel to `/check` and listing
  detail, with a compact summary, expandable per-property evidence, mapped
  factor labels, provenance disclosure, links to the reference listings, and
  a clear area-level fallback when no comparable sample is available;
- extended generated HTML reports with observation date, distance, technical
  match and the comparable selection scope, while explicitly stating that
  these are reference points rather than transaction valuations or guarantees;
- regenerated `frontend/lib/generated-api.ts`, added backend/HTML/frontend
  contract tests, and added rendered mobile browser assertions for localization,
  overflow, and internal factor-code leakage.

Release evidence:

- full backend suite: `380 passed, 1 skipped`;
- targeted comparable/buyer/report/API suite: `32 passed`;
- Ruff lint: passed; `git diff --check`: passed;
- frontend lint, typecheck, production build, and static smoke (`506
  assertions`): passed;
- `npm audit --audit-level=moderate`: `0 vulnerabilities`;
- standalone browser gate: all four locales at desktop, tablet, and mobile,
  plus failure-state, critical flow, provenance surfaces, and the new
  comparable evidence surface: passed;
- mobile visual inspection confirmed readable expanded evidence at 390px with
  no horizontal overflow (`scrollWidth === clientWidth`);
- embedded browser remains unavailable because the environment returns the
  `sandboxPolicy` error; standalone repository Playwright was used instead.

Partial and follow-up requirements:

- similarity is a deterministic comparison of available listing attributes,
  not a confidence score and not a substitute for transaction comparables;
- the current repository has listing observations rather than a complete RCN
  transaction feed, so the UI keeps source class and limitations visible;
- T3-03 is next: formalize HIGH/MEDIUM/LOW confidence explanations and
  unknowns across all decision surfaces.

## Remaining External Limitations

- Customer interviews, paid sales, legal review, payment credentials, OCI
  monitoring, and restore drills cannot be honestly marked complete from this
  repository alone.
- Demo/sample data remains valid only in explicitly marked local/test/demo
  contexts; it must never be used as evidence of commercial product traction.
- No transformation task is complete based only on a successful build.
