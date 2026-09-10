# Domarion Product Transformation Audit

Audit date: 2026-09-05
Last verification refresh: 2026-09-10
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
2. A compact durable buyer profile now carries intent, budget, and up to three
   priorities across check, comparison, and supported area ranking. Its effect
   is labeled as personalization and does not alter market facts.
3. Search now keeps location, budget, rooms, size, market, intent and a visible
   buyer-readable ranking on the primary surface. Professional thresholds stay
   under advanced disclosure and are shown explicitly when applied.
4. Area detail pages now lead with a conditional buyer conclusion, suitability,
   cautions, next checks and source-comparable alternatives. Price,
   infrastructure and planned-investment evidence remains below it with honest
   partial, empty and unavailable states.
5. Guides now expose article-specific editorial ownership, review scope,
   official sources and topic-specific disclaimers. Related area figures come
   from the current API with provenance and explicit unavailable states.
6. Product analytics event naming and funnel instrumentation are not yet a
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
| T3-03 | Formalize HIGH/MEDIUM/LOW confidence explanations and unknowns across all decision surfaces | DONE | T3-01 |
| T3-04 | Complete future-infrastructure impact narrative with positive catalyst versus supply/disruption separation | PARTIAL | T3-01 |
| T3-05 | Verify analytics boundaries for fair price, risk, rental, liquidity, negotiation, and investment outputs | PARTIAL | T3-01 |

### Phase 4: action and retention

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T4-01 | Validate object-watch lifecycle, trigger baselines, event history, and delivery semantics | PARTIAL / BLOCKED | T2-02, T1-03 |
| T4-02 | Generate adaptive viewing, document, seller-question, and negotiation actions from known risks | DONE | T3-03 |
| T4-03 | Add a small durable buyer preference profile and use it transparently in fit and compare | DONE | T2-02, T1-01 |
| T4-04 | Turn compare into recommendation plus explicit trade-offs while preserving detail access | DONE | T2-02, T4-03 |

### Phase 5: understandable discovery and area value

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| T5-01 | Simplify search around buyer inputs and ranking modes | DONE | T2-02 |
| T5-02 | Rewrite area pages around fit, avoid, price, risk, alternatives, and evidence | DONE | T3-01 |
| T5-03 | Keep SEO guides contextual, source-backed, and connected to `/check` | DONE | T5-02 |

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
- RCN coverage depends on the official register's published geographic and
  temporal scope and is not a census of every Polish transaction, so the UI
  keeps source class, sample size and limitations visible;
- T3-03 was completed by P0-04 through structured HIGH/MEDIUM/LOW fair-price
  confidence factors and explicit unknown/insufficient-evidence states.

### P0-03: Unknown Data Integrity — DONE (2026-09-07)

Implemented and verified:

- removed partner-ingestion and manual-analysis location/infrastructure
  defaults; missing values remain `null`, while an explicitly supplied zero is
  preserved;
- made context-dependent score components nullable and reweighted score
  aggregation over available evidence instead of inserting neutral values;
- propagated unknown liquidity, rental, growth, risk and buyer-fit states
  through the database, migration `0037`, API schemas, comparison, CRM,
  alerts, reports and frontend contracts;
- prevented RCN-only area statistics from generating listing supply,
  exposure or liquidity claims;
- reduced confidence and coverage when analytical inputs are missing and
  exposed localized missing-data guidance on `/check` and listing results;
- made an existing demo area with no price history return an empty observation
  set instead of a false 404, without manufacturing history points;
- added regression coverage for partial/manual listings, absent parsed fields,
  explicit zero, empty growth evidence and nullable report output.

Release evidence:

- full backend suite: `403 passed, 1 skipped`;
- Ruff, frontend ESLint, TypeScript, `525` frontend smoke assertions, npm audit
  (`0` vulnerabilities), Alembic single-head check, PyCharm build and
  production Next.js build: passed;
- standalone Playwright: PL/EN/RU/UK at desktop, tablet and mobile, partial-data
  guidance in the critical `/check` flow, save/compare, provenance, unsupported
  source, loading, failure and retry states: passed with no console/network
  errors or horizontal overflow;
- the embedded browser remains blocked by the environment `sandboxPolicy`
  error; the repository Playwright release-gate fallback was used.

Follow-up requirements:

- P1-03 still owns an independent rental evidence source and explicit gross/net
  yield, vacancy and expense semantics;
- migration downgrade removes rows containing new nullable derived scores
  before restoring legacy non-null constraints; production rollback planning
  must account for that intentional integrity-preserving behavior.

### P0-04: Comparable Selection and Fair-Price Confidence — DONE (2026-09-07)

Changed:

- replaced first-match comparable selection with four visible widening stages
  and a minimum useful listing sample of three;
- kept every stage inside the subject's city and primary/secondary market, and
  made ranking independent of the subject asking price;
- exposed selection status, stage counts, target sample, observed period,
  source names and structured exclusion counts through ListingAnalysis;
- added a structured fair-price confidence contract with sample, relevance,
  freshness, geography, price consistency, source quality and property
  completeness factors;
- made fewer than three listing comparables non-influential on the point
  estimate, while retaining the rolling 365-day RCN area baseline;
- rounded fair-price results to 5,000 PLN and calibrated the range from 6% to
  20% based on confidence and comparable price dispersion;
- capped contradictory or unsupported estimates at LOW confidence and required
  VERIFY FIRST before a BUY/NEGOTIATE conclusion when confidence is below 50;
- added localized evidence-quality explanations to /check and listing detail,
  preserved the range in comparison summaries and replaced exact fair-price
  midpoint presentation in generated reports with the range.

Verified:

- Ruff passed for the complete repository;
- backend suite: 410 passed, 1 skipped;
- focused report suite: 44 passed;
- frontend ESLint, TypeScript and 530 smoke assertions passed;
- npm audit reported 0 vulnerabilities and the production Next.js build
  completed;
- production-mode repository Playwright passed Polish, English, Russian and
  Ukrainian at 1440px, 768px and 390px, plus the manual Check Apartment flow,
  failure state and provenance/confidence surfaces with no console errors,
  failed requests or horizontal overflow;
- screenshots of the listing evidence section were inspected at 1440x900 and
  390x844; the low-confidence sample renders as a wide range and a single-column
  mobile factor list.

Limitations and follow-up:

- the embedded browser remained unavailable because its environment omitted
  sandboxPolicy; the repository Playwright fallback performed actual browser
  verification;
- RCN remains an area-level transaction baseline in this flow rather than
  individually exposed transaction comparables;
- P1-03 owns independent rental evidence and P1-05 owns complete structured
  explanations for non-price scores.

### P1-03: Rental Evidence and Yield Integrity — DONE (2026-09-08)

Changed:

- removed the circular asking-price-derived monthly rent heuristic; monthly
  rent now comes only from independent long-term rental observations, while
  asking price is used only as the gross/net yield denominator;
- added migration `0038_rental_observations` and an immutable version history
  keyed by source, stable observation ID and content hash;
- added legal-gated CSV ingestion that requires an active, non-demo, approved
  source with explicit `rental_analytics` permission and distinguishes new,
  changed and reconfirmed observations;
- made PostgreSQL analytics select only the latest version of each source
  observation and ignore a latest removed/expired version;
- added staged rental comparable selection with a 120-day freshness limit,
  minimum sample of three, property relevance ordering and no cross-city
  fallback;
- exposed rent range, gross yield, net yield before tax and financing,
  vacancy and operating-reserve assumptions, evidence sample, period, scope,
  sources and structured confidence;
- capped confidence below HIGH for samples smaller than five and capped
  contradictory rent observations at LOW;
- changed absent rental evidence to `insufficient_data` with nullable rent,
  yield and Rental Score fields; unknown values no longer behave as zero in
  search, hidden-gem, alert, risk, comparison or report consumers;
- added a localized rental evidence panel to `/check` and listing detail for
  Polish, English, Russian and Ukrainian.

Verified:

- full backend suite: `419 passed, 1 skipped`;
- Ruff, Alembic single-head check and complete PostgreSQL offline upgrade SQL:
  passed;
- frontend ESLint, TypeScript, `542` smoke assertions, npm audit with zero
  vulnerabilities and production Next.js build: passed;
- repository Playwright passed all four locales at 1440px, 768px and 390px,
  the critical manual-check flow, failure and provenance states, and both
  estimated and insufficient rental states without console errors, failed
  requests or horizontal overflow;
- desktop estimated and mobile insufficient rental panels were inspected from
  rendered screenshots; a medium-confidence numerical inconsistency found in
  that review was corrected and reverified at `74/100`.

Operational limitation:

- the repository provides a production-safe ingestion and calculation path,
  but it does not grant rights to any external rental dataset. Production
  remains honestly at `insufficient_data` until an operator registers and
  imports a genuinely approved independent rental feed. Demo rental records
  remain isolated to explicit demo mode and are not production evidence;
- the embedded browser integration is unavailable in this environment, so the
  project Playwright release-gate fallback performed actual browser QA.

### P1-04: Decision-First Listing Result — DONE (2026-09-08)

Changed:

- reordered `/listings/:id` around the buyer decision: verdict and price
  relationship first, concise reasons and risks second, inspectable market
  evidence third, contextual actions fourth;
- removed the duplicate flat metric grid that repeated verdict, asking price,
  fair-price range and confidence with equal visual weight;
- split comparable/rental evidence and secondary apartment analytics into
  separate accessible disclosure sections;
- kept save, compare, negotiation, tracking, mortgage and report actions in
  the property context; negotiation now opens and scrolls to its supporting
  evidence rather than targeting content hidden in a closed disclosure;
- added a denser mobile decision composition and removed secondary total-cost
  and personalization tiles from that compact first summary. Those values
  remain available in the expanded decision details.

Verified:

- ESLint, TypeScript, 554 frontend smoke assertions, production Next.js build
  and `git diff --check` passed;
- repository Playwright verified PL/EN/RU/UK at desktop, tablet and mobile,
  plus initial and expanded listing-result states at 1440x900 and 390x844;
- loading/error/partial-data regression flow, evidence disclosure, contextual
  actions, negotiation reveal, console errors, network failures, hydration and
  horizontal overflow were checked;
- rendered desktop and mobile screenshots were inspected. The embedded
  browser integration was unavailable, so the project Playwright fallback was
  used for actual browser QA.

Follow-up:

- P1-05 completed the conversion of score explanations into structured,
  localized drivers. P1-04 itself does not reinterpret analytical facts in the
  browser.

### P1-05: Explainable Property Scores - DONE (2026-09-08)

Changed:

- added an independent explainability contract for Investment, Risk,
  Negotiation, Liquidity and Rental scores;
- each score now exposes stable reason codes, positive/negative/unknown
  direction, data status, weighted coverage, confidence, missing-data codes
  and the scoring formula version;
- kept the score formulas and numeric outputs unchanged while separating their
  evidence instead of reusing one generic explanation for every score;
- localized score meanings and driver labels in Polish, English, Russian and
  Ukrainian on `/check` and listing detail;
- added progressive disclosure for the strongest positive, negative and
  unknown factors, including explicit insufficient-data states;
- stopped `/check` from rendering backend-generated score reason prose. Legacy
  explainability remains accepted as an API fallback for older stored payloads.

Verified:

- full backend suite: `420 passed, 1 skipped`; Ruff passed;
- Alembic has one head (`0038_rental_observations`) and the complete PostgreSQL
  offline upgrade SQL passed with UTF-8 output enabled;
- frontend ESLint, TypeScript, `567` smoke assertions, npm audit with zero
  vulnerabilities and production Next.js build passed;
- repository Playwright verified score explainability in PL/EN/RU/UK on mobile
  and in Polish on desktop, alongside the complete locale/viewport, error,
  critical-flow, provenance and rental-state suite without console, network,
  hydration or horizontal-overflow failures;
- rendered desktop and mobile score explanations were visually inspected. The
  embedded browser integration remained unavailable because sandboxPolicy was
  not provided, so the repository Playwright fallback performed actual browser
  QA.

Follow-up:

- P1-06 completed the remaining consumer copy localization, stable API error
  envelope and mutation rollback/retry feedback described below.

### P1-06: Consumer Localization and Safe Errors - DONE (2026-09-09)

Changed:

- added a typed PL/EN/RU/UK decision-message catalog derived from existing
  structured prices, confidence, risk, evidence, negotiation and due-diligence
  values; no market fact or analytical formula changed;
- stopped `/check`, listing decision panels and `/reports` from rendering raw
  backend decision, AI insight or inline report prose;
- fully localized `/market` and removed the Polish-only default error prefix
  from shared state blocks;
- standardized API failures on `error.code`, safe `params` and
  `correlation_id`; validation and unhandled errors no longer expose submitted
  input, exception text or backend diagnostics;
- changed the frontend transport to map structured codes to localized copy and
  never treat a raw response body as a user-facing error;
- corrected report-save feedback so a draft identifier is not presented as a
  successfully saved report and failed mutations roll back visibly;
- fixed a production-only temporal-dead-zone initialization error discovered
  while rendering the optimized `/check` build;
- upgraded MapLibre GL from the vulnerable 5.x line to patched 6.8.0 after the
  release audit reported the critical sanitizer-bypass advisory; the existing
  dynamic ESM import remained compatible;
- localized map controls and evidence labels in PL/EN/RU/UK and fixed the CSS
  precedence issue that left the MapLibre canvas at zero height in production;
- updated the existing `sharp` and `js-yaml` security overrides after the final
  dependency audit reported newly disclosed advisories.

Verified:

- full backend suite: `422 passed, 1 skipped`; targeted Ruff and
  `git diff --check` passed;
- frontend ESLint, TypeScript, `615` static smoke assertions, npm audit with
  zero vulnerabilities and production Next.js build passed;
- repository Playwright passed PL/EN/RU/UK on desktop, tablet and mobile,
  including buyer-decision and map localization, non-zero MapLibre canvas,
  console/network/hydration and horizontal-overflow checks;
- the dedicated recovery gate passed loading, partial import, unsupported
  source, actionable error/retry, failed report generation, failed save
  rollback and successful retries;
- local production frontend and API returned healthy responses at
  `http://127.0.0.1:3000` and `http://127.0.0.1:8010`.

Scope note:

- immutable/standalone generated HTML and PDF files retain their versioned
  report-language contract and are tracked with report generation, freshness
  and entitlement work in P1-12. Raw artifact prose is not rendered inline on
  `/check` or `/reports` and was not relabeled as localized content.

### P1-11: Evidence-backed Negotiation Scenarios - DONE (2026-09-09)

Changed:

- introduced a versioned negotiation scenario contract with explicit
  `available` and `insufficient_data` states, confidence, nullable scenario
  prices, structured arguments/actions, limitation codes and guardrails;
- gated all opening, target, reasonable-range and maximum-offer advice on fair
  value confidence, listing data quality and a minimum comparable or
  transaction sample; missing evidence now produces no price advice;
- linked every negotiation argument and applicable action to stable evidence
  records carrying source, source type, freshness, sample, geographic scope,
  time range, calculation type and confidence;
- made verdict and negotiation scenario prices one validated contract and
  removed duplicate price calculations from report generation;
- changed consumer, report and AI negotiation output to consume the structured
  scenario instead of legacy backend prose;
- added PL/EN/RU/UK presentation for scenario states, arguments, limitations,
  actions and guardrails, plus a copyable evidence-backed negotiation brief;
- removed duplicate legacy negotiation prose from `/check` and listing detail.

Verified:

- full backend suite: `427 passed, 1 skipped`; Ruff and `git diff --check`
  passed;
- frontend ESLint, TypeScript, `631` smoke assertions, npm audit with zero
  vulnerabilities and the production Next.js build passed;
- repository Playwright passed PL/EN/RU/UK on desktop, tablet and mobile,
  available and insufficient negotiation states, copied brief content,
  provenance, critical check/save/compare flow, error/retry behavior and
  console/network/hydration/overflow checks;
- local production frontend and current API are running at
  `http://127.0.0.1:3000` and `http://127.0.0.1:8010`.

Follow-up:

- P1-15 should extend the same code/evidence pattern to the complete adaptive
  viewing, seller-question and legal/document checklist;
- immutable report artifact language/version and paid entitlement remain in
  P1-12 and the externally blocked P0-05 release work;
- fair-price methodology was not changed by this task; only availability and
  presentation of negotiation advice were tightened.

### P1-15: Evidence-backed Buyer Action Plan - DONE (2026-09-09)

Changed:

- introduced a versioned `BuyerActionPlan` contract with stable action codes,
  before-offer/viewing/after-viewing phases, priorities and mandatory evidence
  references validated by the API schema;
- generated deterministic secondary- versus primary-market document checks,
  seller questions, viewing steps and intent-aware risk-specific actions from
  the existing listing, risk, score and area inputs;
- kept missing facts explicit: unknown evidence carries no invented value,
  sample or calculated classification and has zero confidence until verified;
- added a PL/EN/RU/UK checklist to the buyer decision UI with persistent local
  completion state, provenance disclosure and a copyable action brief;
- changed report and buyer AI action output to consume the structured plan and
  its evidence instead of maintaining a separate free-text checklist.

Verified:

- targeted buyer/API/import/report suite: `129 passed`; full backend suite:
  `434 passed, 1 skipped`; Ruff and `git diff --check` passed;
- frontend ESLint, TypeScript, `651` smoke assertions, npm audit with zero
  vulnerabilities and the production Next.js build passed;
- generated OpenAPI TypeScript was refreshed from the running FastAPI contract;
- repository Playwright passed PL/EN/RU/UK on desktop, tablet and mobile,
  including the action plan at 1440px and 390px, negotiation, localization,
  console/network/hydration/overflow checks and core recovery/retry states;
- the embedded browser remained unavailable because the environment did not
  provide `sandboxPolicy`; repository Playwright provided the rendered QA.

Follow-up:

- P1-16 now provides the durable buyer profile used by check, comparison and
  supported area-ranking signals;
- generated report language/version and paid entitlement remain in P1-12;
- production legal review remains part of the externally blocked P0-05 gate.

### P1-16: Compact Buyer Profile - DONE (2026-09-09)

Changed:

- introduced a tenant-scoped `BuyerProfile` with purchase intent, an optional
  maximum apartment price and no more than three validated priorities;
- added memory and PostgreSQL persistence, migration `0039_buyer_profiles`,
  CRUD `/me/buyer-profile` endpoints and profile inclusion in `/me`;
- added a compact localized account form that supports save, edit and delete
  without turning onboarding into a questionnaire;
- applied saved intent to `/check`, and built a visibly labeled personalized
  comparison recommendation from the active intent, budget and only available
  fit/score evidence;
- applied area profile defaults only when a direct `value` or `liquidity`
  ranking exists; unsupported lifestyle preferences do not produce inferred
  area claims;
- kept asking prices, fair value, risks and all other market facts unchanged.

Verified:

- full backend suite: `436 passed, 1 skipped`; targeted profile suite:
  `9 passed`; Ruff and `git diff --check` passed;
- frontend ESLint, TypeScript, `667` smoke assertions, npm audit with zero
  vulnerabilities and the production Next.js build passed;
- generated OpenAPI TypeScript was refreshed from the running API;
- repository Playwright passed PL/EN/RU/UK rendering, save/reload and
  cross-route behavior on desktop and mobile, including console, network and
  horizontal-overflow checks;
- Alembic reports the single head `0039_buyer_profiles`; a real PostgreSQL
  upgrade was not run in this workspace;
- the embedded browser remained unavailable because the environment did not
  provide `sandboxPolicy`; repository Playwright provided the rendered QA.

Follow-up:

- P1-08 now consumes this profile in the completed comparison recommendation
  contract described below;
- P1-09 can use the same profile for monitoring relevance without changing
  alert facts or delivery semantics.

### P1-08 / T4-04: Comparison Decision Flow - DONE (2026-09-10)

Changed:

- made the comparison request reject blank or duplicate IDs and retain the
  explicit two-to-five listing selection as the reproducible URL state;
- made partial comparison responses return both requested and unavailable IDs,
  while still requiring at least two valid listings;
- added deterministic `compare-recommendation-v1` output with purchase intent,
  profile budget/priorities, structured reasons, explicit trade-offs and their
  numeric reference values;
- preserved the existing `decision_score` and all source analytics. The new
  recommendation weights only available inputs and renormalizes around missing
  values instead of synthesizing neutral scores;
- made budget a candidate constraint only when at least one listing is within
  budget; otherwise the response keeps the general recommendation and exposes
  `all_over_budget`;
- moved the recommendation before evidence, collapsed the detailed matrix by
  default, localized structured reason/trade-off codes in PL/EN/RU/UK, and kept
  mobile comparison as sequential listing panels rather than a wide table.

Verified:

- targeted comparison suite: `7 passed`; full backend suite: `440 passed, 1
  skipped`; repository-wide Ruff passed;
- frontend ESLint, TypeScript, `675` smoke assertions and the production Next.js
  build passed;
- generated OpenAPI TypeScript was refreshed from the running FastAPI contract;
- repository Playwright passed all four locales at desktop, tablet and mobile,
  plus recommendation-first rendering, partial unavailable listings, collapsed
  detail, console/network/hydration and horizontal-overflow checks;
- rendered Polish comparison views at 1440px and 390px were visually inspected.

Follow-up:

- the next dependency-ordered product task is P1-09 / T4-01, object-watch and
  alert delivery semantics; provider and OCI-dependent acceptance remains an
  external constraint;
- P2-10 can now instrument `comparison_started` and `comparison_completed`
  against a stable comparison contract.

### P1-09 / T4-01: Alert Delivery Audit - PARTIAL / BLOCKED (2026-09-10)

Repository evidence confirms contextual object-watch creation, deterministic
event previews, pause/resume/delete controls, persisted delivery jobs and
user-visible delivery history. Completion remains externally blocked: the
production worker schedules only daily email, SMTP and Telegram are not
configured in the audited environment, and no OCI cadence or real-recipient
delivery was observed. Instant, weekly and Telegram delivery must not be
marketed as live until P0-05, provider credentials and OCI evidence are
available.

### P2-02 / T5-01: Transparent Buyer Search - DONE (2026-09-10)

Changed:

- kept location, district, rooms, budget, size, market, purchase intent and a
  buyer-readable ranking control in the primary search form;
- removed implicit intent-based analytical thresholds. Purchase intent changes
  the visible default ranking but no longer silently excludes listings with
  lower or unavailable investment, rental, liquidity or risk metrics;
- preserved every manually selected advanced constraint in the URL and exposed
  each one in the active-filter summary instead of hiding them behind a count;
- replaced ambiguous ranking labels with their actual semantics: lowest price
  per square metre, lowest risk, highest investment potential and highest
  rental potential;
- changed result cards to lead with verdict, fair-price range and purpose fit,
  and removed unexplained investment/rental/negotiation score initials;
- removed the duplicated summary metric grid and the no-op apply button.

Verified:

- frontend ESLint, TypeScript, `690` smoke assertions, npm audit with zero
  vulnerabilities and the production Next.js build passed;
- repository Playwright passed PL/EN/RU/UK rendering and the existing desktop,
  tablet and mobile flows;
- focused Playwright checks at 390px and 1440px confirmed visible intent,
  district, liquidity and ranking state; reproducible URL state; the explicitly
  requested liquidity API parameter; and the absence of hidden intent score
  thresholds;
- rendered Polish search views at 390px and 1440px were visually inspected.

Follow-up:

- P2-03 / T5-02 is the next dependency in this historical checkpoint and is
  completed in the section below;
- P1-09 remains blocked on P0-05, provider configuration and OCI delivery
  evidence rather than additional frontend presentation work.

### P2-03 / T5-02: Decision-First, Source-Backed Areas - DONE (2026-09-10)

Changed:

- added a conditional buyer conclusion before area analytics, covering who the
  area may fit, who should be cautious, evidence limitations and concrete
  checks to perform for the exact address;
- derived price-evidence strength from source mode, sample size and provenance
  completeness. Demo or missing price evidence cannot be presented as high
  confidence;
- selected comparable area alternatives dynamically from the same city dataset
  by the closest observed median instead of using static recommendations;
- distinguished populated, partial, empty and unavailable infrastructure data.
  Zero records are no longer presented as proof that an amenity does not exist;
- exposed infrastructure scope, source domains and update date, including an
  explicit unknown state when source freshness is unavailable;
- classified planned projects as potential improvement, construction
  disruption, supply pressure or unclear impact, and exposed their status,
  expected year, source and confidence without implying property-level
  distance from district assignment;
- localized the decision content, page heading and metadata for PL/EN/RU/UK.

Verified:

- frontend ESLint, TypeScript, `717` smoke assertions, npm audit with zero
  vulnerabilities and the production Next.js build passed;
- the full repository Playwright suite passed all existing flows and all four
  supported locales;
- focused area checks at 390px and 1440px covered listing/demo evidence,
  transaction evidence, and partial, empty and unavailable infrastructure;
- console errors, failed requests, hydration errors and horizontal overflow
  were checked, and Polish mobile and desktop screenshots were visually
  inspected.

Follow-up:

- P2-04 / T5-03 is the next dependency in this historical checkpoint and is
  completed in the section below;
- production coverage still depends on imported provider data and refresh
  operations. The UI reports those gaps honestly but cannot create evidence
  that the configured sources do not supply.

### P2-04 / T5-03: Verifiable Editorial Guides - DONE (2026-09-10)

Changed:

- introduced an article-specific editorial contract for all ten guide slugs,
  including author, reviewer role, update date, review scope, disclaimer type
  and relevant official sources with a description of what each source
  supports;
- used market, financial and legal disclaimers according to the article topic
  without claiming that WartoMetr provides a valuation, credit decision, tax
  advice or legal interpretation;
- added `dateModified`, `inLanguage`, reviewer and source citations to Article
  JSON-LD;
- replaced static `seoAreas` figures inside guides with current area API data.
  The UI distinguishes transaction and asking-price context, marks demo data,
  exposes source and freshness, and handles loading, partial, unavailable and
  retry states without stale fallbacks;
- connected the guide catalog and every article to `/check` with guide source
  context, while keeping supporting area and report actions secondary;
- localized the guide interface for PL/EN/RU/UK. The Polish editorial corpus is
  explicitly marked with `lang="pl"` and a localized availability notice, so
  it is not presented as an accidental or complete translation.

Verified:

- frontend ESLint, TypeScript, `748` smoke assertions, npm audit with zero
  vulnerabilities and the production Next.js build passed;
- the full repository Playwright suite passed the existing check, save,
  compare, negotiation, area, score and rental flows alongside the new guide
  coverage;
- focused Playwright covered the catalog at 390px and 1440px, every existing
  guide slug on mobile, localized interface states for PL/EN/RU/UK, and live,
  partial and unavailable related-area data;
- console errors, failed requests, hydration errors and horizontal overflow
  were checked;
- Polish catalog and article screenshots were visually inspected at mobile and
  desktop widths.

Follow-up:

- a named external legal or financial reviewer remains an organizational gate
  and is not implied by the internal product-and-source review role;
- full editorial-body translations can be commissioned later. Until then the
  content language is declared honestly and the surrounding product interface
  remains localized;
- P2-05 is completed in the section below; P2-06 is the next open
  product-quality task in roadmap order.

### P2-05: Mobile-Specific Consumer Composition - DONE (2026-09-10)

Changed:

- replaced the permanently expanded mobile/tablet sidebar with a compact
  sticky brand header and a localized native disclosure for navigation and
  language controls; the menu remains keyboard accessible and desktop keeps
  the established full navigation;
- kept the listing verdict, fair-value evidence, confidence, major risks and
  next action ahead of collapsed supporting analytics, and verified that the
  comparison recommendation and trade-offs remain ahead of its collapsed
  matrix;
- changed the mobile reports summary from a long single-column sequence to a
  stable two-column composition, with the final date metric spanning the row;
- added a focused browser contract for the areas, listing, compare and reports
  routes at 390px and 768px. It checks the sticky shell, keyboard menu,
  first-content position, collapsed detail hierarchy, report columns and
  horizontal overflow alongside console, request and hydration failures;
- added smoke contracts protecting the mobile shell, report composition and
  both browser-gate viewport sizes.

Verified:

- frontend ESLint, TypeScript, `765` smoke assertions, npm audit with zero
  vulnerabilities and the 36-route production Next.js build passed;
- focused Playwright passed the mobile composition scenario at 390px and
  768px;
- the full repository Playwright suite passed PL/EN/RU/UK desktop, tablet and
  mobile coverage plus existing check, save, listing, compare, negotiation,
  action-plan, search, area, guide, score and rental success/partial/error
  scenarios;
- rendered 390px screenshots for areas, listing, compare and reports were
  inspected; primary actions and conclusions remained visible without
  incoherent overlap or horizontal scrolling.

Follow-up:

- P2-06 is completed in the section below; P2-07 is the next open engineering
  quality task in roadmap order.

### P2-06: Reduced Visual Density and Unified Hierarchy - DONE (2026-09-10)

Changed:

- removed the duplicate verdict badge from the shared decision summary. A
  single semantic WartoMetr marker now supports the verdict headline instead
  of repeating it;
- introduced a shared quiet summary-strip treatment and applied it to compact
  decision metrics, report account metrics and comparison highlights, avoiding
  card-within-card composition while preserving all decision-relevant values;
- removed the comparison highlight that duplicated the already dominant
  recommendation. The remaining fair-price, monthly-cost and rental signals
  are presented as secondary rows, and per-property ranking uses one divided
  list instead of another group of equal-weight cards;
- reduced the report summary to three useful account metrics and moved request
  progress to an `aria-live` status line rather than presenting status as a
  fourth analytical metric;
- made additional listing analysis visually quieter and reorganized mobile
  listing actions into a full-width primary command, paired secondary actions
  and a balanced full-width final report command;
- replaced raw English backend analysis and assistant disclaimers on the
  listing route with equivalent consumer-facing PL/EN/RU/UK copy, and corrected
  the remaining Russian and Ukrainian parking labels in that contract.

Verified:

- frontend ESLint, TypeScript, `795` smoke assertions, npm audit with zero
  vulnerabilities and the 36-route production Next.js build passed;
- focused Playwright covered listing, compare and reports at 390px and 1440px,
  asserting one verdict marker, three non-duplicated comparison highlights,
  borderless nested compact metrics, three report account metrics, localized
  listing disclaimer copy and the balanced mobile action grid;
- the full repository Playwright suite passed all PL/EN/RU/UK desktop, tablet
  and mobile flows together with existing expanded, partial, unavailable,
  error and retry coverage;
- rendered listing, compare and reports screenshots were inspected at mobile
  and desktop widths with no incoherent overlap or horizontal overflow.

Follow-up:

- P2-07 should split large modules only along proven domain boundaries and
  must not become a standalone frontend or backend rewrite.

## Remaining External Limitations

- Customer interviews, paid sales, legal review, payment credentials, OCI
  monitoring, and restore drills cannot be honestly marked complete from this
  repository alone.
- Demo/sample data remains valid only in explicitly marked local/test/demo
  contexts; it must never be used as evidence of commercial product traction.
- No transformation task is complete based only on a successful build.

## RCN Refresh Automation Update (2026-09-05)

- **DONE:** Added an idempotent `rcn-transactions` worker task with a
  persisted 24-hour cadence based on the last successful ingestion job.
- **DONE:** Added `district_boundaries` and an importer for the official
  Wrocław Geoportal osiedle SHP/ZIP. PostGIS assigns EPSG:2180 RCN points to
  EPSG:2177 boundaries; unmatched points stay at city level.
- **DONE:** Added optional English Telegram operator reporting with separate
  counts for new logical transactions, changed source versions, reconfirmed
  versions, rejected source rows and district assignments. Missing Telegram
  credentials skip delivery without invalidating a successful import.
- **DONE (2026-09-06):** Stabilized RCN WFS traversal with deterministic
  sorting and explicit `STARTINDEX` fallback pagination. Historical source
  versions remain stored, while market metrics use only the latest version of
  each logical transaction.
- **VERIFIED locally (2026-09-06):** A complete sorted WFS run read 47,420
  source rows and accepted 22,388 residential Wrocław transactions. An
  immediate second run reported `0 new`, `0 changed`, and `22,388
  reconfirmed`; before the rolling-window change, market metrics rebuilt 47
  geographic aggregates from 13,633 current transaction versions in the
  then-current three-year window.
- **VERIFIED locally:** 48 official boundaries imported, 17,248 existing RCN
  observations assigned to 43 osiedle areas, 2,166 geocoded observations
  remained unresolved, and 44 area statistics were rebuilt from 12,107 recent
  transaction observations.
- **OPERATOR SETUP REQUIRED:** Copy the official boundary ZIP to the VM,
  configure `RCN_DISTRICT_BOUNDARIES_LOCATION`, install the 08:00
  `Europe/Warsaw` cron entry, and add Telegram token/chat id when notification
  is desired.

## RCN Area Price Window and History Update (2026-09-06)

- **DONE:** Changed the transaction-derived `AreaStatistics` baseline from a
  three-year pool to a rolling 365-day window. Fair-price, scoring and area
  comparison consumers continue using the same field, but it now represents
  recent accepted transactions only.
- **DONE:** Added separately materialized monthly and calendar-year medians for
  the full available RCN period. Every point contains its accepted observation
  count and uses only the latest retained source version of a logical deal.
- **DONE:** Added yearly medians to `/areas` cards and a provenance-aware monthly
  price chart to `/areas/{area_id}`. Missing months are shown as gaps, not
  inferred values.
- **VERIFIED locally (2026-09-06):** Migration `0036` applied to PostgreSQL and
  a real-data refresh rebuilt 46 area aggregates from 22,538 retained current
  transaction versions, of which 5,176 fall inside the rolling 365-day
  decision window. For Borek, the API returned a current median of 12,358
  PLN/m2 from 125 transactions and 24 observed monthly points across four
  calendar years; 2024 is absent because no accepted observations exist.
- **VERIFIED release gate:** Backend suite `400 passed, 1 skipped`; Ruff,
  frontend lint, typecheck, 525 UI smoke assertions, production build and npm
  audit passed. Standalone Playwright verified `/areas` and the Borek detail on
  1440x900 and 390x844 viewports with no failed requests, runtime errors or
  horizontal overflow. The in-app browser remained unavailable because of its
  environment `sandboxPolicy`, so repository Playwright was used for actual
  desktop/mobile browser verification.
