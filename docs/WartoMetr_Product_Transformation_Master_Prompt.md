You are working on the existing **WartoMetr** repository.

WartoMetr is a consumer real-estate decision-support product for people buying apartments in Poland.

The product already has a substantial implementation: frontend, backend, PostgreSQL/PostGIS, RCN transaction ingestion, fair-price analysis, comparables, buyer decision logic, scoring, reports, payments infrastructure, authentication, saved apartments, comparison, areas, alerts, mortgage/total cost, due diligence concepts, and other supporting functionality.

Do NOT treat this as a greenfield project.

Your job is to progressively transform the existing product into a focused, commercially useful buyer decision platform.

---

# 1. Product mission

The primary product question is:

> **Should I buy this apartment at this price?**

Every major product decision should support this question.

The primary user is a private apartment buyer in Poland.

The core user journey should become:

```text
LISTING
→ ANALYSIS
→ DECISION
→ EXPLANATION
→ EVIDENCE
→ ACTION
→ VIEWING
→ COMPARISON
→ NEGOTIATION
→ PURCHASE / REJECT
```

WartoMetr must NOT become:

* another Otodom-style listing portal;
* a generic real-estate dashboard;
* a collection of scores;
* an AI chatbot with invented conclusions;
* a CRM disguised as a consumer product;
* a feature catalogue.

The product should feel like:

> **an independent second opinion before buying an apartment**

A possible positioning statement is:

> Wklej ogłoszenie mieszkania. WartoMetr sprawdzi rzeczywiste ceny sprzedaży, ryzyka i pokaże, ile rozsądnie za nie zapłacić.

---

# 2. Product hierarchy

Always prioritize:

```text
DECISION
→ EXPLANATION
→ EVIDENCE
→ ACTION
```

The user must understand the most important conclusion within approximately 10 seconds.

Detailed analytics should remain available through progressive disclosure.

Do not expose internal analytical complexity unless it helps the buyer make a decision.

---

# 3. Engineering rules

Before changing anything:

1. Read `AGENTS.md`.
2. Inspect the existing repository architecture.
3. Read relevant product and technical documentation.
4. Inspect the current frontend routes and major buyer flows.
5. Inspect the existing backend contracts and business logic.
6. Inspect existing tests.
7. Reuse current functionality whenever possible.
8. Do not rewrite working subsystems without a concrete reason.
9. Avoid large architectural rewrites.
10. Preserve backward compatibility unless there is a documented reason not to.

Relevant files/documentation may include:

```text
AGENTS.md

docs/README.md
docs/WartoMetr_Phase_0_Audit.md
docs/frontend_route_product_map.md
docs/api_surface.md

frontend/components/BuyerDecisionPanel.tsx
frontend/components/AreasDirectory.tsx

domarion/services/buyer_decision.py
domarion/services/scoring.py
domarion/services/comparables.py
domarion/services/market_metrics.py

domarion/api/*
domarion/repositories/*
domarion/ingestion/*
domarion/db/*
alembic/*
tests/*
```

Do not assume these are the only relevant files. Search the repository.

---

# 4. Critical rule: do not implement everything at once

This roadmap must be implemented in phases.

For each phase:

1. inspect the current implementation;
2. identify what already exists;
3. identify what should be reused;
4. identify gaps;
5. propose concrete changes;
6. implement only that phase;
7. run relevant tests;
8. run lint/type checks;
9. run frontend build where applicable;
10. add/update tests;
11. document important behavioral changes;
12. report exactly what changed and what remains.

Do not silently continue into the next phase.

Avoid unrelated cleanup.

If you discover an architectural issue, record it separately unless it blocks the current phase.

---

# 5. Phase 0 — Repository and product audit

Before implementing product changes, inspect the repository and create a concrete implementation map.

Determine:

* current `/` behavior;
* current `/check` behavior;
* how listing URL parsing works;
* buyer decision flow;
* fair-price calculation;
* comparables selection;
* confidence calculation;
* negotiation calculation;
* risks;
* due diligence;
* total purchase cost;
* reports;
* checkout;
* compare;
* saved apartments;
* monitoring;
* analytics;
* areas;
* navigation;
* mobile UX.

For each roadmap item below classify it as:

```text
ALREADY GOOD
EXISTS BUT NEEDS REWORK
PARTIALLY IMPLEMENTED
MISSING
BLOCKED BY DATA
BLOCKED BY LEGAL / EXTERNAL SOURCE
```

Produce a concise implementation plan referencing actual repository files.

Do not change code during Phase 0 unless a trivial fix is required to complete the audit.

---

# 6. Phase 1 — Make apartment checking the primary product

The `/check` flow should become the primary acquisition and product entry point.

The homepage must strongly prioritize:

```text
Sprawdź mieszkanie przed zakupem
```

Primary interaction:

```text
Paste Otodom / OLX / supported listing URL
→ analyze
```

Manual entry may remain as fallback.

The first screen should NOT primarily be a large apartment search interface.

Recommended concept:

```text
Sprawdź mieszkanie przed zakupem

Wklej ogłoszenie.
Sprawdzimy rzeczywiste ceny sprzedaży,
ryzyka i pokażemy, ile rozsądnie zapłacić.

[ listing URL ]

[ Sprawdź mieszkanie ]

Cena rynkowa • Ryzyka • Negocjacje • Koszt zakupu
```

Requirements:

* reuse existing `/check` functionality;
* avoid duplicate implementations;
* make URL analysis the obvious primary CTA;
* preserve manual entry;
* ensure mobile usability;
* minimize cognitive load;
* keep loading/error/partial states excellent.

Simplify the primary navigation.

Candidate top-level consumer navigation:

```text
Sprawdź mieszkanie
Moje mieszkania
Porównaj
Lokalizacje
Poradniki
Account
```

Do not delete working secondary routes simply because they are removed from primary navigation.

---

# 7. Phase 2 — Redesign the Buyer Decision result

The result page is the most important page in the entire application.

The first viewport should answer:

```text
Should I continue considering this apartment?
Is the asking price reasonable?
What is the reasonable price range?
How confident are we?
What are the biggest risks?
What should I do next?
```

Target information hierarchy:

```text
VERDICT

Asking price
Estimated fair-price range
Difference vs fair value

Confidence
Evidence summary

Top positive factors
Top risks
Critical unknowns

Recommended next action
```

Example presentation:

```text
NEGOCJUJ

Cena sprzedającego:
749 000 zł

Rozsądna cena:
690 000 – 720 000 zł

Cena ofertowa jest około 5.8% powyżej
środka szacowanego zakresu.

Pewność:
Wysoka

Evidence:
17 podobnych transakcji
```

Below the first viewport use progressive disclosure for:

* comparables;
* risks;
* unknowns;
* due diligence;
* negotiation;
* total purchase cost;
* mortgage;
* location;
* supporting scores.

Do NOT lead with:

```text
Risk Score 63
Investment Score 72
Liquidity Score 68
```

Translate internal scores into buyer-oriented conclusions.

Internal scores may remain available as secondary evidence.

---

# 8. Phase 3 — Strengthen fair-price evidence

Fair-price is one of the most important commercial assets of WartoMetr.

Inspect and improve the complete flow:

```text
source transactions
→ filtering
→ comparable selection
→ market baseline
→ adjustments
→ fair-price range
→ confidence
→ UI evidence
```

The result should explain WHY the estimate exists.

Where available expose:

* number of comparable transactions;
* transaction dates;
* geographical distance;
* area / district;
* price per m²;
* apartment size;
* rooms;
* market type;
* building age/year;
* similarity factors;
* observation window;
* geographic scope.

Avoid false precision.

Prefer ranges over exact artificial values.

The system must clearly distinguish:

```text
FACT
DERIVED METRIC
MODEL ESTIMATE
UNKNOWN
INSUFFICIENT DATA
```

Never convert missing evidence into a neutral score.

---

# 9. Phase 4 — Confidence model

Inspect the current confidence implementation.

Confidence should be explainable and preferably derived from measurable evidence such as:

```text
sample size
recency
geographical distance
comparable similarity
price dispersion
data completeness
source quality
```

The UI should be able to explain why confidence is:

```text
HIGH
MEDIUM
LOW
INSUFFICIENT
```

Example:

```text
High confidence

23 comparable transactions
median distance: 620 m
median transaction age: 4 months
high property similarity
```

or:

```text
Low confidence

Only 4 relevant transactions were available
and recent price dispersion is high.
```

Do not expose meaningless percentages unless they are properly calibrated.

---

# 10. Phase 5 — Fair-price backtesting

Build or improve a proper temporal backtesting framework.

The basic methodology should be:

```text
historical transaction T
→ hide actual transaction price
→ use only evidence available before T
→ calculate estimated fair price
→ compare estimate with actual transaction price
```

Prevent temporal leakage.

Track metrics such as:

```text
MAE
Median Absolute Percentage Error
RMSE if useful
prediction interval coverage
sample count
```

Allow segmentation by:

```text
city
district
primary / secondary market
size range
number of rooms
building age
confidence band
number of comparables
```

Store/report the model or rule version.

Example:

```text
fair-price-v3
```

Backtesting must be reproducible.

Add tests around temporal leakage and deterministic behavior.

---

# 11. Phase 6 — Methodology / trust page

Create or improve a public methodology page.

Possible route:

```text
/methodology
```

Explain:

* which data is used;
* what RCN represents;
* how comparables work;
* what fair price means;
* why it is a range;
* what confidence means;
* what WartoMetr does NOT know;
* what is model-estimated;
* what requires human verification;
* that WartoMetr is not an official `operat szacunkowy`.

Where backtesting metrics are available, show real metrics.

Never invent metrics.

If insufficient evidence exists, explicitly state that.

---

# 12. Phase 7 — Commercial Buyer Report

Create one clear core paid product:

```text
Buyer Report
```

Initial pricing assumption:

```text
49 PLN
```

Pricing must remain configurable.

Free result may contain:

* verdict;
* asking-price position;
* high-level confidence;
* limited risks;
* basic explanation.

Paid Buyer Report should unlock significantly more decision value:

* detailed fair-price range;
* comparable transactions;
* complete risk analysis;
* negotiation strategy;
* suggested opening offer;
* maximum reasonable price;
* total purchase cost;
* due-diligence checklist;
* full evidence;
* downloadable report.

Do not arbitrarily hide critical safety information behind a paywall.

The paid report should provide deeper analysis, not conceal known severe risks from free users.

Reuse the existing report/payment infrastructure.

Do not build duplicate checkout logic.

---

# 13. Phase 8 — Real payment validation

Inspect existing Stripe / PayU infrastructure.

Prepare one production-capable Buyer Report purchase path.

Requirements:

* real checkout adapter;
* signed webhook verification;
* idempotent fulfillment;
* order state;
* payment state;
* failure handling;
* refund handling where already supported;
* audit events;
* test/sandbox flow;
* no fake production success states.

Keep mock checkout only for development/test environments.

Do not expose production payment flows until environment configuration is valid.

---

# 14. Phase 9 — Apartment comparison as a core workflow

The user should be able to compare approximately 2–4 apartments.

Comparison should answer:

> Which apartment is the most rational choice for this buyer?

Do not start with a giant metrics table.

Start with:

```text
Recommended choice
Reasons
Trade-offs
```

Then evidence.

Compare available data such as:

* asking price;
* fair price;
* overpricing/underpricing;
* confidence;
* risks;
* total purchase cost;
* location;
* buyer intent fit;
* negotiation potential;
* unknowns;
* liquidity/rental evidence when reliable.

Example:

```text
Najlepszy wybór: mieszkanie B

Why:
- price closest to fair value;
- lowest material risk;
- lower total acquisition cost.

Trade-off:
Apartment A has the better location.
```

Build on the existing compare implementation instead of replacing it blindly.

---

# 15. Phase 10 — Multi-property commercial pack

Prepare support for a product such as:

```text
3 Apartment Pack
```

Initial pricing hypothesis:

```text
99 PLN
```

Exact commercial pricing must remain configurable.

The pack should make it convenient to:

```text
analyze apartment A
analyze apartment B
analyze apartment C
compare them
```

Do not over-engineer billing before product validation.

---

# 16. Phase 11 — Before-viewing assistant

After analysis provide:

```text
Przygotuj mnie do oglądania
```

Generate a property-specific viewing checklist.

Checklist items should derive from actual known characteristics and risks.

Examples:

```text
ground floor
→ check moisture and privacy

old building
→ ask about electrical/plumbing installations

high administrative fee
→ request recent fee statement

road nearby
→ visit during peak traffic

asking price above comparables
→ ask seller what justifies premium
```

Avoid generic checklist spam.

Show:

```text
WHY this item matters
WHAT to inspect
WHAT to ask
```

---

# 17. Phase 12 — After-viewing workflow

Allow the buyer to return after viewing the apartment.

Collect structured observations such as:

* condition;
* expected renovation;
* windows;
* noise;
* sunlight;
* smell;
* moisture;
* staircase/common areas;
* building condition;
* bathroom/kitchen;
* layout problems;
* user notes where safe.

Allow these observations to update the buyer decision.

Example:

```text
Before viewing:
NEGOCJUJ

After viewing:
VERIFY FIRST

Reason:
potential moisture issue
+
estimated renovation cost increased materially
```

Preserve the original analysis and clearly explain what changed.

---

# 18. Phase 13 — Negotiation assistant

Turn analysis into practical negotiation support.

Where evidence is sufficient provide:

```text
Suggested opening offer
Target range
Maximum reasonable price
Supporting arguments
```

Be careful with terminology.

Do not claim a probable final transaction price unless the underlying evidence supports it.

Prefer:

```text
Suggested opening offer
Maximum rational price
```

over unsupported claims such as:

```text
Seller will probably accept X
```

Negotiation arguments should reference evidence such as:

* comparable transactions;
* overpricing;
* renovation cost;
* listing age if legally and technically available;
* risks;
* total purchase cost.

Optionally prepare a concise message to the seller/agent.

---

# 19. Phase 14 — Monitoring

Saved apartments should become useful after the initial check.

Where legally and technically supported monitor relevant changes such as:

* asking-price change;
* listing removed;
* listing reappeared;
* listing parameters changed;
* new comparable evidence;
* fair-price estimate changed.

Examples:

```text
Cena została obniżona:
749 000 zł → 729 000 zł
```

and:

```text
Nowa cena znajduje się blisko górnej granicy
szacowanego fair-price range.
```

Keep source-compliance constraints in mind.

Do not create unauthorized mass scraping.

---

# 20. Phase 15 — Buyer due diligence workspace

After validating the core paid Buyer Report, expand toward due diligence.

Possible categories:

```text
Księga wieczysta
Ownership
Mortgage / claims
Planning / POG / MPZP
Flood risk
Building
Wspólnota
Administrative fees
Energy certificate
Utilities
Renovation
Future development
Noise / roads / industry
```

Use explicit states:

```text
VERIFIED
REQUIRES CHECK
RISK
UNKNOWN
INSUFFICIENT DATA
```

Never present automated analysis as legal advice.

Clearly identify when professional legal, technical or valuation review is required.

---

# 21. Phase 16 — Document analysis

Allow users to upload relevant apartment documents when appropriate.

Examples:

* księga-related documents;
* fee statements;
* energy certificate;
* floor plan;
* developer prospectus;
* building/community documents;
* agreement drafts.

AI may help extract information.

But extracted claims must remain grounded in the uploaded document.

Where possible include document provenance:

```text
source document
page
field
```

Never let generative AI invent document facts.

---

# 22. Phase 17 — Product analytics

Inspect current analytics and extend it only with privacy-safe events.

Track the core funnel:

```text
landing_viewed
check_started
listing_parsed
analysis_completed
result_viewed
payment_started
payment_completed
saved
compare_started
compare_completed
buyer_outcome
```

Measure:

```text
Time to Value
paste URL → meaningful verdict
```

Target direction:

```text
as fast as realistically possible
preferably < 30 seconds
```

Do not weaken analytical correctness merely to hit the latency target.

---

# 23. Decision outcome tracking

This is strategically important.

After a reasonable period, allow WartoMetr to ask:

```text
Co zrobiłeś po analizie?
```

Possible outcomes:

```text
Kupiłem
Negocjowałem
Zrezygnowałem
Sprawdzam dalej
```

And:

```text
Czy WartoMetr wpłynął na Twoją decyzję?
```

This should be privacy-conscious and optional.

The objective is to measure whether WartoMetr changes real property decisions.

---

# 24. North-star metrics

Do not optimize primarily for page views.

Useful business/product metrics include:

```text
Paid Property Checks
Helpful Buyer Decisions
Repeat Check Rate
Compare Usage
Payment Conversion
Decision Impact Rate
Time to Value
```

The product must optimize for useful buyer decisions rather than engagement for its own sake.

---

# 25. Phase 18 — Wrocław-first validation

Do not prioritize nationwide UX expansion before validating the product.

Wrocław should be treated as the primary controlled-beta market where practical because existing district and transaction support is already strong.

Poland-wide data ingestion may remain operational.

But product validation, manual quality review and initial acquisition should prioritize one market before spreading effort across the country.

Do not intentionally degrade support for other currently working cities.

---

# 26. SEO / acquisition foundation

Area pages should support organic acquisition without becoming SEO spam.

Useful page concept:

```text
Ceny mieszkań — Jagodno
```

Show real evidence:

* transaction statistics;
* observation count;
* time window;
* price history;
* methodology/provenance.

Then connect the page to the commercial product:

```text
Znalazłeś mieszkanie na Jagodnie?

Sprawdź, czy jego cena jest rozsądna.
```

CTA:

```text
Wklej ogłoszenie
```

Never generate unsupported location claims merely for SEO.

---

# 27. B2B only after buyer validation

The existing realtor/agency functionality should not dominate current development.

After the B2C Buyer Report is validated, WartoMetr may expand toward:

```text
WartoMetr Pro
```

Potential users:

* buyer agents;
* independent realtors;
* mortgage advisers;
* small agencies;
* investors.

Potential functionality:

* client workspace;
* reports;
* comparison;
* white-label branding;
* property history;
* notes;
* saved analysis.

Recurring pricing may later be tested.

Do not build a large CRM before demand is proven.

---

# 28. Features to deprioritize

Do NOT expand these areas unless they directly improve the buyer decision:

* generic market dashboards;
* generic news;
* chatbot-first UX;
* large independent developer portal;
* social/community features;
* large CRM;
* unnecessary scoring models;
* broad API products;
* complex nationwide search;
* additional infrastructure abstractions with no immediate product benefit.

Existing implementations may remain.

Just do not let them determine roadmap priority.

---

# 29. AI rules

AI is supporting infrastructure, not the decision engine.

AI may:

* explain structured analysis;
* summarize evidence;
* explain trade-offs;
* produce grounded next actions;
* extract structured information from documents.

AI must NOT invent:

* transaction prices;
* comparable transactions;
* risks;
* legal facts;
* missing apartment parameters;
* confidence;
* investment return;
* rental evidence;
* future price growth.

The main recommendation must remain inspectable and grounded in deterministic business/data logic where possible.

---

# 30. Product quality gates

For each major buyer-facing change verify:

### Desktop

* 1440px

### Mobile

* approximately 390px

### Important states

* loading
* partial
* success
* insufficient data
* empty
* error
* retry
* authenticated
* unauthenticated where relevant

Important Polish-language flows must work correctly.

Do not allow:

* horizontal overflow;
* unreadable tables;
* score overload;
* inconsistent navigation;
* unsupported conclusions;
* fake precision.

---

# 31. Commercial validation gate

Do not recommend starting another major product vertical until at least one of these is achieved:

```text
20 paid Buyer Reports
OR
3 paying/serious B2B pilots
OR
5 documented cases where WartoMetr:
- changed a buying decision;
- helped negotiate price;
- or helped avoid a bad purchase.
```

Repository size, test count, demo traffic and mock payments do not count as product-market validation.

---

# 32. Immediate implementation priority

Use this order unless repository inspection reveals a blocker:

```text
P0
1. Product/repository audit
2. Homepage → check-first UX
3. Buyer Decision result redesign
4. Fair-price evidence
5. Comparable quality
6. Confidence methodology
7. Fair-price temporal backtesting
8. Methodology/trust page
9. Commercial Buyer Report
10. Real checkout path

P1
11. Apartment comparison
12. Multi-apartment pack
13. Before-viewing workflow
14. After-viewing workflow
15. Negotiation assistant
16. Monitoring

P2
17. Due diligence workspace
18. Document analysis
19. Decision outcome tracking
20. Acquisition/SEO improvements

P3
21. B2B Pro expansion
22. Broader geographic/product expansion
```

---

# 33. Definition of success for the first commercial version

The first strong commercial version should let a buyer:

```text
1. Paste an apartment listing URL.
2. Confirm extracted apartment parameters.
3. Receive a clear recommendation.
4. Understand whether the asking price is reasonable.
5. See the estimated fair-price range.
6. Understand confidence.
7. Inspect comparable evidence.
8. See material risks and unknowns.
9. Understand what to check before viewing/purchase.
10. Get negotiation guidance.
11. Save the apartment.
12. Compare it with alternatives.
13. Purchase a useful detailed report.
```

If this flow is excellent, do not delay launch merely because secondary features are incomplete.

---

# 34. How to work with me

We will execute this roadmap iteratively.

When I tell you:

```text
Implement Phase N
```

you must:

### Step 1

Inspect the current implementation related to that phase.

### Step 2

Summarize:

```text
CURRENT STATE
WHAT CAN BE REUSED
WHAT IS WRONG / MISSING
FILES TO CHANGE
IMPLEMENTATION PLAN
RISKS
```

### Step 3

Implement the phase.

### Step 4

Run relevant:

```text
tests
lint
type checks
frontend build
browser tests
```

depending on what changed.

### Step 5

Report:

```text
IMPLEMENTED
FILES CHANGED
BEHAVIOR CHANGED
TESTS RUN
KNOWN LIMITATIONS
NEXT RECOMMENDED PHASE
```

Do not claim that something works unless you verified it.

Do not introduce fake data merely to make the UI look complete.

Do not change unrelated functionality.

Do not silently move to the next phase.

---

# 35. First task

Start with **Phase 0 only**.

Perform a repository audit against this roadmap.

Do not implement the roadmap yet.

I want a concrete gap analysis based on the actual repository.

Return:

1. current architecture relevant to this roadmap;
2. existing functionality that should be preserved;
3. features already satisfying the roadmap;
4. features needing rework;
5. missing pieces;
6. data/external/legal blockers;
7. recommended implementation sequence;
8. exact major files/components/services likely affected by Phase 1;
9. risks of the proposed changes.

Be critical.

Do not assume the existing documentation is correct if the implementation contradicts it.

The repository code is the final source of truth for what is actually implemented.
