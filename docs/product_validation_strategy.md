# Product Validation Strategy

Дата обновления: 2026-08-27
Статус: product validation plan поверх реализованного MVP. Это не заменяет
юридический review, интервью с рынком и список реальных paid beta candidates.

## Executive Summary

Domarion уже технически ближе к paid beta, чем к обычному прототипу: есть
object-check flow, reports, pricing, lead capture, admin queue, source registry,
developer reputation, alerts, карты и score explanations. Главный риск теперь
не в том, что MVP нечего показать, а в том, что продукт может слишком долго
оставаться инженерным демо без валидации спроса, юридического допуска источников
и paid-production операционной дисциплины.

Текущая оценка:

- product readiness: 7/10;
- technical readiness: 9/10.

Практичный first wedge:

- B2C: one-time buyer object report по конкретной квартире перед offer/zadatek.
- B2Pro: realtor branded report и 5-report beta bundle.
- Investor: hidden gems shortlist только после улучшения data coverage and buyer proof.
- Enterprise/API: использовать как existing technical surface, но не расширять
  до доказанного B2C/B2Pro demand and stable data.

Product reset зафиксирован отдельно в
`docs/buyer_decision_product_direction.md`. Новый главный вопрос продукта:

> Стоит ли мне покупать именно эту квартиру за эти деньги?

Fair Price, Risk Score, Investment Score, Negotiation Score, developer
reputation, infrastructure and mortgage are supporting evidence for that
decision, not the headline product.

## Validation Gate

До следующей крупной разработки продукт должен доказать willingness to pay:

- 20 paid buyer reports sold to strangers at 49-149 PLN; or
- 3 paid realtor bundle pilots with real client conversations; and
- at least 5 concrete decision-impact outcomes: price negotiation, avoided bad
  purchase, due-diligence issue found, viewing skipped, or better alternative chosen.

Do not start new large modules before this gate: broader CRM, enterprise
dashboards, API expansion, country expansion, rental/houses/commercial roadmap,
wide news product or new investor tooling.

## Decision-First Positioning

Do not sell "analytics". Sell outcome:

- buyer: do not overpay by 30-100k PLN;
- buyer: do not buy a problematic apartment;
- family: avoid a wrong district/building choice;
- investor: find a good object faster;
- realtor: make client conversations more credible;
- agency: produce professional decision reports in minutes.

The B2C product name to test:

> Проверка квартиры перед покупкой: цена, документы, риски, район, торг.

## Commercial Potential Scorecard

Шкала 1-10. Для сложности и рисков высокий балл означает большую сложность или
большой риск.

| Direction | Score | Why | What strengthens it | What weakens it | What to validate |
| --- | ---: | --- | --- | --- | --- |
| Overall commercial potential | 8.0 | Buying property is high-stakes and reports are concrete paid artifacts. | Report flow, price/future infra/risk mix, Wrocław focus. | Legal/data dependency and trust gap. | 20 paid buyer reports or 3 realtor beta bundles. |
| B2C buyers | 6.5 | Pain is strong, but repeat subscription is weak. | One-time report, SEO, clear checklist. | Low retention and high trust requirement. | Landing conversion and willingness to pay 49-199 PLN. |
| B2B realtors | 8.5 | Agents repeatedly need client-ready arguments. | White-label PDF, workspace, comparables, negotiation angle. | CRM/process inertia and agency politics. | 5 agents using reports in real client calls. |
| Investors | 8.0 | Hidden gems and rental/fair-value analytics are valuable. | Alerts, scoring, price history. | Needs better live coverage and confidence. | Paid shortlist conversion and repeat use. |
| API/data | 7.5 | Banks/developers/funds pay for structured market intelligence. | PostGIS, snapshots, scoring, reports. | Requires stable data, SLA, API keys, legal rights. | 2 discovery calls with data buyers. |
| SEO | 7.0 | High-intent queries around price/m2, districts, checklists. | Area pages, reports, mortgage calculators. | Competitive SERP and content maintenance. | Organic traffic to 10 focused pages. |
| Subscription | 6.5 | Works better for pros than first-time buyers. | Realtor/Investor plans and alerts. | B2C churn. | Plan upgrade from beta users. |
| One-time reports | 8.5 | Directly matches urgent decision moment. | Current checkout/report engine. | Must feel trustworthy and specific. | Paid conversion per landing source. |
| Technical complexity | 8.0 | GIS, dedup, ingestion, source quality and report artifacts are hard. | Narrow geography and legal-first ingestion. | Multi-source data and production ops. | CI + staging + monitoring under real data load. |
| Legal complexity | 7.0 | Portals, database rights, GDPR/RODO and disclaimers matter. | Source compliance policy and partner feeds. | Aggressive scraping would raise risk. | Lawyer-approved source matrix. |
| Source dependency risk | 8.0 | Current value needs active listing coverage. | Partner data, user-submitted flow, open-data moat. | Overreliance on one portal. | 3 independent listing sources. |
| Competitive advantage | 7.5 | Combined reports, future infra, scoring and source policy are differentiated. | Historical snapshots and dedup over time. | Portals can copy simpler analytics. | Users cite Domarion-only insights as buying reason. |
| First sales in 3 months | 7.0 | Possible with manual/semi-auto report workflow. | `/beta`, `/realtors`, lead capture. | No real outreach/interviews yet. | 20 stranger-paid buyer reports or 3 realtor bundles. |
| MRR 10,000 PLN | 6.5 | Realistic with agencies, harder through B2C alone. | Realtor bundles and agency workspace. | Sales cycle and trust. | 20-30 active pro seats or report bundles. |
| Poland expansion | 7.0 | Replicable after source and geodata checklist. | Narrow playbook and modular sources. | Local data differences. | Second-city source checklist and pilot. |

## Competitor Analysis

Desk research checked public pages on 2026-07-18. Sources:

- Otodom: https://www.otodom.pl/
- OLX Nieruchomości: https://www.olx.pl/nieruchomosci/
- Morizon: https://www.morizon.pl/
- Gratka Nieruchomości: https://gratka.pl/nieruchomosci
- RynekPierwotny: https://rynekpierwotny.pl/
- SonarHome: https://sonarhome.pl/
- urban.one: https://urban.one/
- Cenatorium: https://cenatorium.pl/

| Competitor | What they do | Audience | Strengths | Weaknesses / gaps | Threat | Domarion angle |
| --- | --- | --- | --- | --- | --- | --- |
| Otodom | Major real estate portal with listings and market content. | Buyers, sellers, agencies, developers. | Inventory, brand, SEO, user intent. | Portal UX still centered on listings, not independent object due diligence. | High. | Do not compete as portal; use user-submitted/private analysis, reports, future infra and risk explanation. |
| OLX Nieruchomości | Classifieds marketplace with real estate category. | Broad consumer audience, private sellers, agencies. | Traffic, low-friction listings, broad reach. | Classified data quality and analytics depth vary. | Medium-high. | Build trust layer and decision report above raw classifieds. |
| Morizon | Real estate search portal with property listings. | Buyers/renters/agencies. | Listings, search pages, SEO footprint. | Less focused on buyer decision report and future-infra scoring. | Medium. | Position as analytical layer and paid report product. |
| Gratka | Classified/real estate listings marketplace. | Buyers/renters/sellers. | Long-running classified brand and listing breadth. | Similar portal limitation: discovery over due diligence. | Medium. | Win on specific object analysis and negotiation/risk sections. |
| RynekPierwotny | Primary-market/developer listing portal. | New-build buyers, developers. | Developer/new-build inventory and primary-market focus. | Incentives can be closer to lead generation than independent due diligence. | High for primary market. | Developer reputation, quality/legal signal explanations and independent buyer checklist. |
| SonarHome | Valuation, selling/buying services and data-backed property insight. | Owners, buyers, investors. | Clear valuation proposition, recognizable proptech brand. | Less broad as a buyer report/future infrastructure workspace. | High for valuation. | Use fair-price as one part of broader object decision report. |
| urban.one | Automated property valuation / market data product. | Consumers and professional/financial users. | AVM positioning and data product angle. | Less workflow around user-submitted report, negotiation and local risks. | High for valuation/API. | Partner/supplier candidate; Domarion differentiates on workflow and due diligence report. |
| Cenatorium | Property data, valuations and market analytics. | Banks, institutions, professionals. | Data depth, valuation credibility, enterprise fit. | Enterprise/data-provider orientation, not buyer UX. | High for enterprise/API. | Potential data provider or benchmark; avoid competing before Domarion has data rights and SLA. |
| Agency CRMs | Manage clients, listings, tasks and pipeline. | Agencies and agents. | Embedded daily workflow. | Usually not strong at independent market/risk/future-area analytics. | Medium. | CRM-light only after reports prove value; integrations/API-lite later. |

Positioning rule:

Domarion should not claim to be a better portal. The wedge is:

> independent property decision intelligence: price fairness, risk, future area
> signals, developer reputation, buyer/realtor/investor reports and source-aware
> explanations.

## Risk Register

| Risk | Level | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| Unapproved scraping / database rights | High | Legal blocking, source takedowns, product instability. | Source compliance policy, partner feeds, user-submitted one-off only, legal review before scheduled portal crawling. | Founder + legal |
| GDPR/RODO and personal/contact data | High | Compliance breach and trust loss. | Do not ingest photos/contacts/private notes; retention policy; deletion workflow; admin audit. | Backend/data |
| Weak active listing coverage | High | Reports feel generic or low-confidence. | Partner CSV/API, paid data providers, user-submitted flow, confidence warnings, suburban coverage packs. | Data |
| Bad geocoding / wrong address | High | Bad scores and user harm. | Confidence score, manual confirmation, aliases, QA logs, map validation. | Data/GIS |
| Fair price estimate wrong | High | Trust loss and refund risk. | Confidence ranges, disclaimers, backtesting, area fallback warnings, no guarantees. | Analytics |
| AI hallucination or unsafe advice | Medium-high | Misleading output. | Source-grounded templates, refusal rules, citations, disclaimers, usage logging. | Backend/AI |
| Paid beta has traffic but no paid conversion | High | Business invalidation. | One-time reports, realtor bundle, lead tracking, interviews, iterate offer/pricing. | Founder/sales |
| Realtor adoption friction | Medium-high | B2B sales slow. | White-label reports, 5-report pilot, low setup, export, agency workspace. | Sales/product |
| Competitors copy simple scores | Medium | Differentiation weakens. | Build moat in snapshots, dedup, source quality, future infra layers, report workflow. | Product/data |
| Map/API/AI costs grow | Medium | Margins suffer. | Cost controls, caching, usage quotas, monitoring, plan limits. | Ops |
| Production ops incomplete | High | Cannot safely sell at scale. | Choose hosting, managed PostGIS, Redis, backup, S3 artifacts, monitoring. | Engineering |
| Sponsored/partner bias harms trust | Medium-high | Product credibility drops. | Explicit labels, commercial blocks cannot influence scores/AI/fair price. | Product/legal |

## Moat Strategy

Near-term moat:

- source-aware reports that explain confidence and missing data;
- private user-submitted object flow with no public source leak;
- fair price, negotiation, risk and buyer decision summary in one artifact;
- developer reputation citations and due-diligence questions;
- future infrastructure impact as an explanation of how the area may change,
  not just points on a map;
- paid beta feedback loop tied to lead/admin queue.

Data moat:

- historical snapshots and price changes;
- deduplication matches across sources;
- source freshness and data-quality logs;
- area market snapshots;
- geocoded infrastructure and planned investment layers;
- developer aliases, projects and quality signals.

Distribution moat:

- SEO pages for high-intent Wrocław/Dolnośląskie queries;
- realtor white-label workflow and agency workspace;
- partner referrals for mortgage/legal/renovation;
- report templates that become sales assets.

Trust moat:

- explicit source compliance policy;
- no photos/contacts/full portal descriptions without legal basis;
- confidence and disclaimers instead of overpromising;
- sponsored/promoted separation from analytics.

## Updated 12-Month Validation Roadmap

### Months 1-2: Paid Beta Readiness

- Oracle Cloud deployment, Render fallback Blueprint, staging compose,
  production preflight, worker model, API-lite, market intelligence, reports,
  payments, alerts, developer CRUD/import and SEO pages are already implemented
  as product/technical surface.
- Freeze new large modules until the validation gate is met.
- Reframe `/check`, `/beta`, `/pricing` and buyer reports around
  `buy / negotiate / avoid / verify first`.
- Add visible `What we know / estimate / could not verify` and source basis to
  buyer-facing surfaces.
- Run legal review for source matrix and developer reputation sources.
- Recruit first 30 paid beta candidates.
- Sell 20 stranger-paid buyer reports or 3 realtor bundle pilots.
- Run mobile QA pass for `/beta`, `/check`, `/pricing`, `/reports`, `/realtors`,
  `/account` and `/admin`.
- Fill Render secrets/domains, configure S3/R2 artifacts, monitoring targets,
  cost alerts and logical backup restore drill.
- Verify live Stripe or PayU checkout and webhook fulfillment before paid traffic.

### Months 3-4: Data Coverage and Trust

- Improve Wrocław/suburban listing coverage via partner CSV/API and user-owned data.
- Convert first partner imports into recurring approved source playbooks:
  Source Registry, dry-run QA, non-dry-run import, dedup review and removal path.
- Extend infrastructure/open-data imports only where legal status and attribution
  are clear.
- Calibrate fair-price confidence using more historical snapshots and backtests.
- Add report QA rubric for low-confidence comparables, developer matches and
  user-submitted URL extraction failures.
- Build P1 buyer modules: Property Due Diligence checklist, Negotiation
  Assistant, Total Acquisition Cost and Renovation Cost.

### Months 5-6: Sales Repeatability

- Package realtor workflow already present in the app: branded report, object
  comparison, shortlist, export and agency workspace.
- Measure report conversion, refund objections, most-used report sections.
- Decide which CRM-light parts agents actually use before expanding workflow depth.
- Start second-city data-source checklist only after Wrocław paid beta proves
  repeatable value.

### Months 7-9: Pro and Investor Product

- Improve hidden gems and Object Watch only if buyer paid reports show recurring
  monitoring demand.
- Validate API-lite and market intelligence with 2-3 B2B discovery/pilot buyers
  before committing to SLA-style enterprise support.
- Add operational metrics for API usage, report fulfillment, alert delivery,
  source freshness and support tickets.
- Decide whether paid data providers are needed to make investor workflows
  trustworthy.

### Months 10-12: Expansion Decision

- Decide whether to expand beyond Wrocław/Dolnośląskie or deepen local moat.
- Prepare rental, houses, land and commercial roadmaps.
- Keep enterprise custom dashboards as configured-preview workflow unless data
  buyers show concrete demand for bespoke dashboards.
- Evaluate country expansion only after Poland multi-city source checklist is proven.

## Minimum Launch Team

MVP paid beta can run lean:

- Founder/product owner: sales, interviews, offer, pricing, partnerships.
- Backend/data engineer: ingestion, scoring, reports, source registry, QA.
- Frontend engineer: buyer/realtor workflows, mobile QA, SEO pages.
- GIS/PostGIS specialist part-time: boundaries, MPZP/Studium, risk layers.
- Legal consultant part-time: ToS, database rights, RODO, disclaimers, contracts.
- Real estate domain expert part-time: report QA, due-diligence wording, seller questions.
- Sales/partnerships part-time: realtor/agency outreach and partner model.

Can be compressed for founder-led MVP if founder covers product/backend/data:

- founder/backend/data;
- contract frontend;
- legal consultant;
- real estate reviewer;
- part-time sales/outreach.

## Complexity Assessment

| Block | Complexity | Why | MVP simplification | Later |
| --- | ---: | --- | --- | --- |
| Ingestion | 8 | Multi-source legality, freshness, schema drift. | Partner CSV, user-submitted, dry-run admin. | APIs, providers, monitoring workers. |
| Dedup | 8 | Same property appears across sources with imperfect fields. | Rules + review queue. | Text/photo hashes only if allowed, ML matching. |
| Geocoding | 7 | Polish addresses and suburban labels are messy. | Aliases, confidence, manual confirmation. | Paid geocoding, official address registries. |
| PostGIS | 7 | Distance/radius/spatial indexes need correctness. | Narrow Wrocław data and smoke tests. | Full region/country scale. |
| Map | 7 | Layers, performance and mobile UX are hard. | MapLibre with selected layers. | MPZP, flood/noise/pollution, advanced overlays. |
| Scoring | 8 | Must be useful but not overclaim. | Explainable v1, confidence, backtesting. | More historical data and calibration. |
| Reports | 6 | HTML/PDF/content quality and trust. | Templates and QA checklist. | Brand kits, sharing, team workflows. |
| Payments | 6 | PSP, webhooks, invoices, idempotency. | Mock + adapters, one-time products. | Live PSP, tax/accounting integration. |
| Alerts | 6 | Delivery, preferences, relevance. | Daily/Telegram/email skeleton with limits. | Realtime workers and smarter matching. |
| AI | 7 | Hallucination and source safety. | Source-grounded templates and refusals. | More assistants and evals. |
| Scaling | 7 | Data volume, jobs, maps, artifacts. | Managed services, queues, quotas. | Multi-region/data warehouse. |
| Legal | 8 | Portals, database rights, GDPR/RODO, ads. | Compliance policy and legal review gates. | Ongoing source-specific audits. |

## Next Validation Metrics

- 20 interviews completed by segment.
- 30 paid beta candidates with channel and status.
- 20 paid buyer reports sold to strangers or 3 paid realtor beta bundles.
- Landing conversion: visit to lead, lead to paid, paid to repeat/referral.
- Report usefulness score after delivery.
- Decision impact count: price reduced, bad object rejected, problem found,
  viewing skipped, or better alternative selected.
- Average estimated buyer savings vs report price.
- Top 5 missing data objections.
- Legal source matrix approved/blocked/review-required.
- Number of reports with low confidence because of weak comparables.
