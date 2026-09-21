# WartoMetr Phase 0: Repository And Product Audit

Date: 2026-09-15. Scope: Phase 0 of `WartoMetr_Product_Transformation_Master_Prompt.md` only.

## Executive Assessment

The repository already contains much of the intended buyer product. Reuse its decision engine, source provenance, report generation, authentication, saved objects, comparison recommendations and payment adapters. A broad rewrite is not justified.

The largest gaps are continuity of the URL-check journey, transaction-level valuation evidence, trustworthy report output, temporal validation and payment correctness. Existing documentation overstates completion in several of these areas. A passing demo suite does not establish production readiness.

No application code, configuration or database was changed during this audit. This document is the only new deliverable. Existing modifications and untracked artifacts were left intact.

## Evidence And Limits

- Read the master prompt and project instructions; inspected relevant routes, components, services, storage implementations, transaction models, migrations and tests.
- Ran eight existing backend test files: **115 passed**, with 205 dependency/deprecation warnings, in explicitly isolated memory stores and test mode.
- The first test attempt stopped during collection: the repository test fixture enables demo mode, while local configuration selected a persistent data backend. The startup guard correctly rejected that combination. The successful retry used process-local overrides; no `.env` files were edited.
- Ran `npm.cmd run typecheck` in `frontend`: passed.
- Browser connection failed before opening a page: the tool reported missing `sandboxPolicy` metadata. No listeners were found on the checked ports 3000, 3001, 8000 or 8001. Browser/mobile findings below are source inspections, not fresh screenshots or executed user journeys.
- Did not run a frontend build, lint, the full test suite, PostgreSQL integration tests, live imports, provider checkout, webhook concurrency tests or delivery jobs. These are not claimed as verified.
- Did not query production data or certify source permissions, legal wording, real sales, current city coverage or valuation accuracy. External constraints below identify required evidence, not legal conclusions.

## 1. Architecture

| Layer | Current implementation | Roadmap implication |
| --- | --- | --- |
| Frontend | Next.js 15, React 19, TypeScript; `frontend/app`, shared components, global CSS, MapLibre, Lucide | Keep the framework and reusable buyer components. Root and check pages currently own substantial local state. |
| API client | `frontend/lib/api.ts`, `generated-api.ts`, `openApiContract.ts` | Preserve typed contracts; regenerate affected types when a later phase changes API schemas. |
| Backend | FastAPI/Pydantic; `domarion/main.py`, large `api/routes.py`, separate auth/compare/product-analytics routers | Extend existing endpoints in their current ownership boundaries. Splitting the large router is not a Phase 1 prerequisite. |
| Decisions | `services/scoring.py`, `buyer_decision.py`, `risk_profile.py`, `listing_comparison.py` | Deterministic rules already create buyer verdicts, price ranges, negotiation and actions. |
| Data | SQLAlchemy/PostgreSQL/PostGIS; repository and domain stores with memory alternatives | Memory tests use demo observations. Their success is not evidence about deployed RCN coverage. |
| Transactions | `ingestion/rcn_transactions.py`, `rcn_poland.py`, `services/market_metrics.py`, `transaction_versions.py`, `transaction_quality.py` | RCN observations are separate from listing observations; preserve that distinction. |
| Reports/payments | `services/reports.py`, `report_templates.py`, `report_generation.py`, `report_html.py`, `report_pdf.py`, `payments.py`, report/order/artifact stores | Reuse generation, artifacts, order events and provider adapters. Correctness and commercial scope still need work. |
| Retention/monitoring | User-submitted draft store; favorites/alerts in user store; `alerts.py`, `alert_scheduler.py`, `alert_delivery.py` | Already supports ownership, saved checks and object-watch baselines. Portal refresh is a separate capability. |
| Measurement | `product_analytics.py`, analytics store, frontend `productAnalytics.ts`; separate paid-beta tracking | Existing bounded event contract can be extended; commercial outcomes are not established by counters. |

Important database boundaries: transaction observations have source/version identity, transaction date and observation date; drafts retain analysis payloads; orders reference generated reports; webhook events have a unique provider/event key. Relevant migrations include `0034_transaction_observations.py`, `0036_area_transaction_history.py`, `0037_nullable_context_scores.py`, `0039_buyer_profiles.py`, `0040_product_analytics_events.py`, `0041_transaction_logical_identity.py`, `0042_transaction_money_bigint.py`, plus the existing draft, report-order and webhook migrations.

## 2. Priority Findings

### F1. Missing facts become invented report inputs

`domarion/services/reports.py:45`, `_renderable_analysis`, substitutes unknown context with 6 km to the centre, 500 m to a stop, 900 m to a school, 700 m to a major road, 2,200 m to an industrial zone and zero counts. `build_object_report` passes this modified analysis to the section builders. `report_templates.py` consumes these values in location statements and buyer strengths/constraints, including lines 1040 and 1146 onwards.

The original API analysis retaining nulls does not protect the generated report text. This contradicts the roadmap's missing-data rule. Treat removal of these substitutions and report-level null regression coverage as a trust prerequisite for paid delivery. Confirm the affected rendered sections across audiences during implementation; this audit traced the code path rather than rendering the defect.

### F2. Current backtesting does not validate transaction fair value

`domarion/services/backtesting.py:23` predicts against the next **listing snapshot price**, not a hidden historical transaction. It obtains present area statistics and comparables from the repository without an evidence-availability cutoff. Replacing the subject's historical asking price does not make the remaining inputs historical.

The module honestly describes itself as listing-price monitoring, and its version/error/drift reporting is reusable. It cannot support transaction-accuracy claims. Phase 5 needs transaction targets, both transaction-date and availability-date cutoffs, historical version selection, interval coverage and reproducible inputs. `latest_transaction_versions` currently chooses the latest version globally; future temporal evaluation must exclude later corrections before choosing versions.

### F3. Saved URL checks cannot complete the advertised comparison path

`frontend/components/SavedApartmentsPage.tsx:148` constructs `/compare?ids=<draft.listing_id>` for a saved check. `domarion/api/compare_routes.py:117`, `_resolve_compare_analyses`, only calls `repository.get_listing`; it never reads the owner-scoped draft store. User-submitted analysis creates a separate private object rather than inserting a marketplace listing.

Thus a comparison containing a private check cannot resolve that check through this endpoint. The existing public-listing comparison should be retained and extended to typed, owner-scoped references. This is a core journey dependency, not merely comparison-page polish.

### F4. Payment fulfillment is only sequentially idempotent

`domarion/api/routes.py:3949` checks for an existing webhook event, marks the order paid, generates a report and only then records the webhook event. `report_order_store/postgres.py` commits these operations independently. Its unique webhook key protects event insertion, not the earlier report-generation work. Concurrent deliveries can both pass the initial check.

The same handler does not compare the signed payment amount/currency with the order or validate a persisted checkout identity before fulfillment. `payments.py:440` and `:508` verify signatures, but signature validity alone does not perform those order checks. Non-paid events are recorded as ignored; failure/refund transitions are not implemented as a complete lifecycle. `ReportOrderStatus` contains only unpaid, paid, fulfilled and canceled.

Phase 8 requires atomic claiming/fulfillment, order/payment binding, explicit failure handling and provider sandbox verification. Existing sequential duplicate tests are useful but insufficient. These findings are based on code inspection, not a simulated exploit or concurrency run.

### F5. URL import skips explicit confirmation of extracted parameters

`frontend/app/check/page.tsx:480` merges imported fields and immediately calls `createReportFromForm` when required fields appear populated. Import consent is not confirmation of the extracted price, area, address and market type. The parser itself asks callers to confirm fields (`user_submitted_listings.py:343`).

Defaults and retained context can also mask missing extraction: `DEFAULT_FORM` supplies Wroclaw/Fabryczna/secondary market, and `mergeImportedFields` falls back to existing location and market values. `clearObjectFieldsForNewUrl` retains that context. A partial import can therefore satisfy frontend required checks using unconfirmed values. Phase 1 should add a clear confirmation state and preserve unknowns until confirmed.

### F6. Transaction evidence and listing comparables are different systems

`market_metrics.py` derives district/city price statistics from approved, active, non-demo RCN sources, quality filtering and latest observation versions, using a 365-day decision window. `comparables.py:36` selects **listings** from the same city/market, progressively widens attributes and returns at most five by default.

`scoring.py:164` uses 65% area median plus 35% comparable-listing median when at least three comparables exist; otherwise it uses the area median. The range is rounded in 5,000 PLN steps and widened by heuristic confidence. There are no explicit subject-specific price adjustments for floor, age or condition in that fair-price formula.

The visible comparable panel is useful listing evidence, but it is not a set of individually selected RCN transactions. A district transaction count must not be described as the count of similar transactions. Phase 3 needs a transaction-comparable contract, property/market filtering, provenance and a clear explanation of the actual estimate basis. Source attributes may constrain which adjustments are defensible.

### F7. Confidence has multiple meanings

`scoring.py:1060` implements seven explainable factors and caps for small samples, dispersion, widened geography and missing context. This is valuable existing work. However, the factor values and range widths are heuristic, there is no calibrated insufficient confidence level, and unavailable inputs can receive fixed scores such as relevance 35 or consistency 55.

Separately, `user_submitted_listings.py:207` creates an overall confidence score from data quality, fair-price confidence and comparable count. `/check` passes this overall score to the headline decision panel (`page.tsx:834`), while verdict rules use fair-price confidence. Labels can therefore refer to different quantities. Phase 4 should distinguish completeness from valuation confidence, explain unavailable factors and validate ranges in Phase 5.

### F8. Paid product depth and pricing are not yet the proposed Buyer Report

`report_products.py` centralizes a 49 PLN Buyer Check, 149 PLN Full Due Diligence and other products, including a five-report B2B bundle. Amounts are constants in code, not runtime commercial configuration. `/pricing` shows more than one buyer product.

The authenticated `/user-submitted-listings/report` endpoint (`api/routes.py:1779`) builds the complete structured report without requiring a paid order. Paid generation and plan quotas exist separately. This is a different entitlement model from a free result plus a deeper paid Buyer Report. Phase 7 must define the actual paid value and server-side access rules; do not simply hide frontend sections or remove essential risk information.

### F9. Post-viewing results do not survive a return visit

`api/routes.py:1840` reads the saved draft and returns a recalculation without saving observations or the updated result. The frontend retains it in component state. Original and updated decisions are available in the response, but a durable observation/history workflow is missing.

`BuyerActionPlanPanel.tsx:43` persists checklist completion only in browser local storage. This helps on one device but is not an account-synchronized due-diligence workspace.

### F10. Acquisition and reporting need a localization/auth pass

The root route is still `ExplorerPage`, with onboarding choices followed by search, map and advanced filters (`frontend/app/page.tsx:297`, `:575`). Navigation promotes `/check`, but its search link and brand lead to `/`. Comparison and guides are not in the primary item list.

Production check/import/report endpoints use `CurrentAccountDep`; `auth.py:55` requires sign-in outside demo mode. Phase 1 must explicitly support the sign-in transition and retain the entered URL. A guest analysis endpoint is a separate backend change, not a capability to assume.

Frontend dictionaries cover PL/EN/RU/UK, but report templates contain mixed Russian/English text and lack a locale parameter in their builder contract. Frontend localization alone does not localize downloadable reports. Treat this as a Phase 7 delivery gap.

## 3. Roadmap Classification

Statuses describe code inspected in this audit, not production certification. Where a feature has both implementation and external gaps, both are shown.

| Phase/item | Status | Reuse and remaining work |
| --- | --- | --- |
| 0. Audit | ALREADY GOOD | This implementation map and verification record complete the requested audit scope; runtime/data limitations remain explicit. |
| 1. Check-first entry | EXISTS BUT NEEDS REWORK | URL/manual flow already exists. Move search off the root experience, reuse check state, confirm extraction, handle sign-in and preserve search links. See F5/F10. |
| 2. Buyer Decision result | EXISTS BUT NEEDS REWORK | `DecisionSummary` already leads with verdict/prices/confidence/next action; `BuyerDecisionPanel` shows reasons/risks and disclosure. Critical unknowns sit inside details, entry controls remain above results, and evidence summary needs better placement. Browser validation pending. |
| 3. Fair-price evidence | PARTIALLY IMPLEMENTED | RCN aggregate baseline, listing comparables and provenance exist. Individual comparable transactions and explicit valuation adjustments are missing. See F6. |
| Comparable quality | EXISTS BUT NEEDS REWORK | Staged selection, exclusions, distance and similarity are present. Default sample cap is five; missing attributes permit matches; no upper historical date bound. Reuse selection metadata and add appropriate transaction selection. |
| 4. Confidence | EXISTS BUT NEEDS REWORK | Seven factors and caps exist. Unify meanings, make missing evidence explicit and calibrate. See F7. |
| 5. Temporal backtesting | EXISTS BUT NEEDS REWORK | Existing module is listing-snapshot monitoring. Transaction holdout, availability cutoffs, coverage and full requested segmentation are missing. See F2. |
| 6. Methodology/trust page | MISSING | No standalone public methodology route found. Existing disclosures, guides and disclaimers are reusable. Publish actual methodology and only validated performance metrics. |
| 7. Buyer Report | EXISTS BUT NEEDS REWORK | Reports, downloads, order references and a 49 PLN product exist. Resolve missing-data substitutions, localization, product scope, entitlement boundary and configurable price. |
| 8. Real payment validation | PARTIALLY IMPLEMENTED | Stripe/PayU adapters and signatures exist. Fix F4 before production certification; external provider credentials and sandbox evidence are still required. |
| 9. Comparison | EXISTS BUT NEEDS REWORK | Recommendation, reasons, trade-offs, costs and mobile alternative layout exist for public listings. Private draft comparison is missing. UI accepts up to five while analytics records sizes only up to four. |
| 10. Three-apartment pack | MISSING | Reuse existing bundle credits and fulfillment. The current five-report realtor bundle is not the proposed three-apartment buyer pack. |
| 11. Before-viewing assistant | ALREADY GOOD | As a reusable code capability: structured actions with evidence references, viewing questions, documents and phase grouping already exist. Validate prioritization on real apartments; no new assistant engine is needed. |
| 12. After-viewing workflow | PARTIALLY IMPLEMENTED | Structured observations and deterministic recalculation exist. Persist observations, versions and changed reasons, then reuse them on reopening/comparison. |
| 13. Negotiation assistant | EXISTS BUT NEEDS REWORK | Evidence-gated opening offer, range, ceiling and copyable brief exist, with contract tests. Review remaining `realistic_deal`/`Realna transakcja` terminology and align it with supported scenarios. |
| 14. Monitoring | PARTIALLY IMPLEMENTED; BLOCKED BY LEGAL / EXTERNAL SOURCE for portal refresh | Object watch, baselines, triggers and delivery infrastructure exist. Private draft watch deliberately does not re-fetch portal URLs; it primarily finds cheaper public comparables and reports that limitation. Full removal/relisting/content/fair-value monitoring is not established. |
| 15. Due-diligence workspace | PARTIALLY IMPLEMENTED; BLOCKED BY DATA for verified findings | Market-specific checklists, unknowns and evidence-linked actions exist. Durable case state, attached proof and professional verification are missing. Local checkbox completion is not verified evidence. |
| 16. Document analysis | MISSING | `document_upload_due_diligence_plan.md` is a design, and `test_document_upload_plan.py` checks that design text. No implemented buyer document upload/extraction workflow was found. |
| 17. Product analytics | PARTIALLY IMPLEMENTED | Fourteen bounded events, retention and aggregate funnel endpoint exist. No complete Time to Value metric or new funnel/outcome contract. Keep established event names compatible. |
| Decision outcome tracking | PARTIALLY IMPLEMENTED | Paid-beta administrative tracking contains decision impact; an optional consumer outcome follow-up tied to a check is missing. |
| 18. Wroclaw-first validation | PARTIALLY IMPLEMENTED | Wroclaw defaults, districts and RCN ingestion exist. Real beta coverage, paid reports and documented buyer impact were not verified. |
| Acquisition/SEO | EXISTS BUT NEEDS REWORK | Area pages, dynamic evidence/history, guides and sitemap exist. Area detail already links to `/check?district=...`; preserve this. No case for mass page generation. |
| Later B2B Pro | PARTIALLY IMPLEMENTED | CRM, agencies, shortlists, realtor reports and bundle foundations already exist. Freeze expansion until the commercial validation gate is met. |
| Risk layers | BLOCKED BY DATA | `risk_profile.py:20` explicitly lists missing flood, official noise, pollution and rail/airport layers. Current proximity heuristics must stay distinct from verified risks. |
| Rental evidence | BLOCKED BY DATA | Independent rental selection and insufficient-data states exist; real legally usable feed coverage was not established. Preserve null handling. |

## 4. Functionality To Preserve

- Deterministic verdicts and evidence-gated negotiation; tests for all verdict states, low confidence and invalid evidence references.
- `DecisionSummary`, `BuyerDecisionPanel`, `ComparableEvidencePanel`, `ProvenanceDetails`, `BuyerActionPlanPanel`, `StateBlocks` and existing four-language dictionaries.
- Manual entry, partial/failed/unsupported import states, retry handling, draft ownership and private-source handling.
- Independent RCN storage, logical transaction identity, source approval filters and listing/transaction provenance separation.
- Existing public listing search, saved favorites, context links, comparison recommendations, mortgage calculations and area evidence.
- Report history, generated artifacts, billing metadata, signatures and audit events, while repairing their identified gaps.
- Explicit production/demo separation, authenticated account ownership and hidden internal routes.

## 5. Data And External Blockers

| Required evidence | Why it matters | What can proceed now |
| --- | --- | --- |
| Actual approved RCN coverage and usable property attributes | Counts alone do not establish comparable similarity, current coverage or accuracy | Implement selection contracts and temporal evaluation; measure real coverage separately. |
| Historical availability of transactions and revisions | Prevents training/evaluating with information unavailable at the valuation date | Use `transaction_date`, `observed_at` and source version history; document ingestion-date limitations. |
| Portal import/monitoring permission and reliable access | One-off parser success is not evidence of permitted or reliable repeated access | Preserve manual fallback and avoid promising monitoring not implemented. |
| Verified flood/noise/planning/legal/building data | Current unknowns cannot become positive safety claims | Improve evidence and next actions without inventing facts. |
| Provider account, secrets, webhook reachability and sandbox lifecycle | Required for real checkout/fulfillment certification | Repair payment logic locally; then run provider sandbox tests. |
| Legal/commercial review of consumer copy and report sources | Repository assertions are not a rights review | Record precise claims and sources; do not certify legality in this audit. |
| Real buyer outcomes and payment evidence | Required for the commercial validation gate | Reuse paid-beta tracking; do not equate demo orders with sales. |
| Browser/runtime and deployed delivery environment | Required for 1440px/390px UX and actual scheduled notifications | Source review and isolated unit/API tests can proceed. |

Total acquisition cost already exposes several assumptions and a custom renovation budget. However, `buyer_decision.py:1619` fixes 20% down payment, 25 years, 7.5% interest and 0.5% bank commission; `_ready_to_move_alternative` uses asking price plus 72% of renovation cost. This is a heuristic scenario, not an observed competing apartment. Later financial UX must make assumptions editable and clearly distinguish such scenarios. This audit does not validate tax rates or financing advice.

## 6. Recommended Sequence

1. Implement Phase 1 only next: shared check-first entry, extraction confirmation, explicit sign-in recovery, preserved search route and contextual links. Do not change valuation or payments in that phase.
2. Phase 2: consolidate the result hierarchy using existing summary/components; surface critical unknowns and an honest evidence summary. Recheck desktop/mobile with real rendered states.
3. Phase 3: repair report missing-data propagation (F1) as an explicitly scoped evidence-integrity dependency, then expose genuine transaction comparables and the actual valuation basis. Document any formula changes.
4. Phase 4: distinguish valuation confidence from completeness and define insufficient evidence. Phase 5: validate temporally and calibrate before publishing accuracy or interval claims.
5. Phase 6: publish methodology from the verified implementation and evaluation, including limits.
6. Phase 7: define one useful configurable Buyer Report, localize generated output and centralize entitlements. Phase 8: repair payment lifecycle and validate a real provider sandbox path before paid launch.
7. Phase 9: resolve owner-scoped private checks in comparison. This is required before claiming the complete first-commercial-version journey; it must not be deferred as optional polish. Continue with Phases 10-14 in order after that.
8. Phases 15-16 follow core paid validation. Extend outcome measurement using existing events and paid-beta tracking; keep Wroclaw as the controlled validation market. Defer new B2B/geographic verticals until the stated commercial gate is met.

Trust defects F1/F4 are release blockers even if their implementation phases come later. They do not require silently expanding Phase 1 or starting another phase during this audit.

## 7. Concrete Phase 1 Plan

### Current State And Reuse

`/check` is an implemented URL/manual buyer workflow, not a reusable component yet. `/` is the search implementation. The shared layout already promotes check; secondary links assume `/` means search. State includes consent, buyer intent, import status, draft restoration, retries, reports and analytics.

### Proposed Changes

1. Extract the existing check experience into a shared component used by `/` and `/check`, maintaining one state implementation. Keep `/check?draft=...` and area-context entry working.
2. Preserve the current search experience at an explicit `/search` route; do not delete or recreate the search engine. Map old root search query links to the retained search behavior where recognizable.
3. Change search-labelled links to `/search`; leave the brand pointing to the new home. Add the roadmap's comparison/guides entries only where their destination has a meaningful entry state; preserve contextual and internal-route boundaries.
4. Separate importing from analysis with a compact extracted-parameter confirmation step. Preserve uncertain fields and require confirmation of carried location/market values. Keep manual entry and retry data.
5. Reuse existing authentication handling and retain URL/intent/consent state across sign-in. Do not imply anonymous analysis is supported; adding it would require an explicit backend design within an agreed scope.
6. Reduce the completed-result entry surface so the verdict is reachable immediately. Leave the detailed Phase 2 redesign for Phase 2.
7. Update the route map, links and affected smoke/browser checks, including all four locales and production/demo distinctions.

### Expected Files

| Existing or proposed file | Intended responsibility |
| --- | --- |
| `frontend/app/page.tsx` | Replace root search entry with the shared check experience. |
| `frontend/app/check/page.tsx` | Thin route around shared check; retain query restoration behavior. |
| `frontend/components/CheckListingExperience.tsx` (proposed) | Move existing check implementation; single owner of workflow state. |
| `frontend/app/search/page.tsx` (proposed) | Preserve the current explorer and its URL filters. |
| `frontend/components/LocalizedNavigation.tsx` | Correct check/search/saved/compare/guides destinations and active state. |
| `frontend/components/SidebarNavigation.tsx` | Reuse mobile menu; adjust only if navigation layout needs it. |
| `frontend/app/layout.tsx` | Review shell and metadata; change only as needed. |
| `frontend/app/globals.css` | Scoped entry/confirmation/responsive styles; avoid global redesign. |
| `frontend/lib/i18n.ts`, `frontend/lib/errorMessages.ts` | Consumer copy and recoverable import/auth states. |
| `frontend/lib/productAnalytics.ts` | Reuse existing check events; change only for required entry semantics. |
| `frontend/app/compare/page.tsx`, area/guide components and other search links | Update only links whose purpose is search. Full comparison implementation stays outside Phase 1. |
| `frontend/app/sitemap.ts`, route metadata/robots configuration | Reflect actual public route roles without indexing private checks. |
| `frontend/scripts/smoke-ui.mjs`, `browser-quality.mjs`, `check-recovery.mjs` | Update route expectations; cover entry, confirmation and recovery. |
| `docs/frontend_route_product_map.md` | Replace obsolete root/search and saved-route descriptions. |

No database migration or valuation formula change is expected for this frontend-focused Phase 1. `frontend/lib/api.ts`, `domarion/api/routes.py` and `domarion/auth.py` are contract review points, not automatic edit targets.

### Acceptance Checks And Risks

- Root offers URL checking as its primary interaction; `/search` retains filtering, pagination, map, selection and search-alert context.
- Complete and partial import both require trustworthy parameter confirmation; a missing district/market is not silently inherited as a fact.
- Manual check, URL retry, saved draft reopening and area-prefilled entry still work.
- Sign-in recovery retains user input; no demo identity is introduced into production.
- Check-start/completion events are not double-counted by shared-route mounting or import/report transitions.
- Desktop 1440px and mobile about 390px: no overflow, readable labels, keyboard/focus behavior and meaningful loading/error/partial/empty states. Also inspect tablet and PL/EN/RU/UK.
- Existing root-query bookmarks and all search-labelled links are the main navigation regression risk. State extraction can also break effects, draft restoration and async cancellation.
- Moving root content affects public metadata and discovery; prevent private URL/analysis details from entering public metadata.
- Verify with tests, lint, typecheck, build and browser flows during implementation. None of this Phase 1 work is performed by the audit.

## 8. Documentation Corrections To Carry Forward

- `docs/frontend_route_product_map.md` still names `/check/drafts` as the primary saved destination, while navigation uses `/saved`.
- The superseded August product-direction document marked object-watch creation as absent; the draft and listing watch endpoints existed at this audit. Its checked post-viewing item meant recalculation, not durable observation history.
- The superseded September 12 product review described comparison of stable public listing IDs; that did not verify comparison of saved private checks. Its historical test/browser results were not repeated or adopted as this audit's evidence. Both older documents remain in Git history.
- The document-upload test verifies a plan, not an upload implementation. The existing backtest validates listing transitions, not historical transactions.

## 9. Verification Record

Executed backend files: `tests/test_buyer_decision.py`, `test_scoring.py`, `test_scoring_backtesting.py`, `test_payment_webhooks.py`, `test_paid_report_flow.py`, `test_user_submitted_listing_analysis.py`, `test_favorites_alerts.py`, `test_product_analytics.py`.

Result: 115 passed in 5.24 seconds after explicit test/memory configuration. Provider HTTP and delivery tests use their existing mocks; this did not charge customers, send production notifications or prove live integrations. TypeScript validation passed separately. No application processes were left running by this audit.

Next recommended task: **Phase 1**, with the scope and acceptance checks above. Phase 0 does not authorize or execute subsequent phases.
