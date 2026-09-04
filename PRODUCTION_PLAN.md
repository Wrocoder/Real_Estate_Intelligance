# WartoMetr Productization and UX Redesign

You are working on the existing **WartoMetr** real-estate analytics application.

Your task is to transform the current technically strong MVP/dashboard into a polished, trustworthy, consumer-facing product that helps a private home buyer answer one primary question:

> **Should I buy this apartment at this price?**

Do not treat this as a simple visual redesign.

This is a **productization task** involving information architecture, UX simplification, visual hierarchy, product copy, navigation, decision-support flows, and integration of existing analytics into a coherent user journey.

---

# 1. Before changing anything

First inspect the entire repository and understand:

* frontend architecture;
* routing;
* components;
* existing design system;
* API contracts;
* data models;
* existing analytics;
* scoring logic;
* listing import logic;
* reports;
* comparison;
* alerts;
* mortgage;
* saved checks/drafts;
* areas;
* guides;
* localization;
* authentication/account;
* current responsive behavior.

Inspect every existing user-facing route.

Do not start rewriting components immediately.

First identify:

1. what can be reused;
2. what should be refactored;
3. what should only be visually redesigned;
4. what should be moved into another part of the UX;
5. what should be hidden from consumer users;
6. what technical/internal terminology is currently exposed.

Preserve existing backend contracts and working business logic unless changing them is necessary.

Avoid unnecessary rewrites.

---

# 2. Product positioning

The primary user for this version is:

> A private person buying an apartment in Poland.

Support two user intents:

* **For living**
* **For investment**

Realtor/Agency functionality may remain in the codebase but should not dominate the main consumer interface.

Professional features can later become **WartoMetr Pro**.

The core WartoMetr value proposition should be:

> Check an apartment before buying. Understand its fair price, risks, strengths and negotiation potential.

The product should feel like a trusted real-estate decision assistant, not an analytics dashboard.

---

# 3. Core user journey

The primary journey should become:

```text
Found apartment
    ↓
Paste Otodom / OLX URL
    ↓
WartoMetr imports listing
    ↓
Understand verdict
    ↓
Understand fair price
    ↓
Understand risks
    ↓
Understand why
    ↓
Compare
    ↓
Calculate total cost
    ↓
Prepare negotiation
    ↓
Save
    ↓
Track changes
```

Every major UX decision should support this journey.

---

# 4. Make `/check` the core product

Redesign `/check` as the main entry point.

The first interaction should be extremely simple:

```text
Check an apartment before buying

Paste an Otodom or OLX link

[ URL __________________ ]

[ Check apartment ]
```

Secondary action:

```text
Or search for an apartment with WartoMetr
```

Do not overwhelm the first screen with technical options.

Manual entry may still exist, but it should be secondary.

---

# 5. Redesign the analysis result

This is the most important screen in the product.

Do not start with charts and scores.

Start with a human-readable decision.

Example structure:

```text
WartoMetr verdict

Worth considering

Listing price
729,000 PLN

Estimated fair price
690,000–710,000 PLN

This apartment appears to be approximately
19,000–39,000 PLN above the estimated market range.

WartoMetr Score
72 / 100
```

Then explain the decision.

Example:

```text
Why?

✓ Good public transport access
✓ High neighborhood liquidity
✓ Price has already been reduced twice
~ Limited number of directly comparable listings
! Busy road approximately 230 m away
! Listing price is above comparable properties
```

The user should understand the conclusion in less than 10 seconds.

Detailed analytics should appear below this summary.

---

# 6. Scores must become explainable

Keep useful scores such as:

* Investment
* Risk
* Liquidity
* Rental
* Negotiation

But never show a score without explaining it.

Bad:

```text
Liquidity
78
```

Good:

```text
Liquidity
78 / 100
High

Why:
- similar apartments sell faster than the city median;
- this size category has strong demand;
- public transport is nearby;
- local supply is relatively limited.
```

Every score should answer:

> Why did WartoMetr calculate this?

---

# 7. Build a strong trust layer

Trust is a critical product requirement.

For important calculations display:

* data source;
* data freshness;
* number of observations;
* confidence level;
* methodology summary where appropriate.

Example:

```text
Estimated fair price
690,000–710,000 PLN

Based on:
17 comparable listings
within 1.2 km
±10 m²
last 90 days

Updated:
1 September 2026

Confidence:
High
```

Provide:

```text
View comparable properties
```

Clearly distinguish:

* confirmed facts;
* source data;
* model-derived estimates;
* insufficient-data situations.

Do not present uncertain information as objective truth.

---

# 8. Remove internal/development terminology from the UI

Search the entire consumer-facing application and remove or replace internal terms such as:

* MVP
* SEO
* CTA
* Internal links
* dry-run
* private analysis
* address-first flow
* proxy-market
* Listing ID
* implementation terminology
* internal workflow names
* developer-oriented confidence thresholds

These concepts may remain internally in code.

They must not appear in the public product UI.

---

# 9. Simplify navigation

Reduce the primary navigation.

Target navigation:

```text
Check
Search
My apartments
Areas
```

Then:

```text
Profile
```

Do not keep every product capability as a top-level navigation item.

Contextual features should appear where they are relevant.

Examples:

* Compare appears after apartments are selected.
* Mortgage appears inside apartment analysis.
* Reports appear inside apartment analysis.
* Alerts appear inside a saved apartment or search.
* Market data appears inside Areas.
* News appears in relevant area/property context.

---

# 10. Redesign property search

The default search should be simple.

Primary filters:

* location;
* price;
* rooms;
* size;
* primary / secondary market;
* buying purpose.

Buying purpose:

```text
For living
For investment
```

Move detailed options into:

```text
Advanced filters
```

Do not ask normal users to configure numeric thresholds such as:

```text
Liquidity >= 47
Negotiation >= 53
Developer Confidence >= 62
```

Instead offer sorting/intents such as:

```text
Best overall
Best value
Lowest risk
Best for rent
Most liquid
Best negotiation opportunities
```

The system should translate these into the internal scores automatically.

---

# 11. Redesign comparison

Comparison must provide a recommendation, not just a spreadsheet.

Example:

```text
Best overall option
Apartment B

Why:
+ 22,000 PLN below estimated fair price
+ better public transport
+ lower risk
+ stronger liquidity

Trade-offs:
- 5 m² smaller
- approximately 12 minutes farther from the city center
```

Then show the detailed comparison table.

Support 2–4 apartments.

---

# 12. Integrate mortgage and total purchase cost into properties

Do not make mortgage analysis feel like an unrelated calculator.

Inside the property analysis show:

```text
Total purchase cost

Apartment                  729,000 PLN
PCC                         14,580 PLN
Notary                       4,500 PLN
Estimated renovation        40,000 PLN

Estimated total
788,080 PLN
```

Then:

```text
Down payment
160,000 PLN

Mortgage
568,000 PLN

Estimated monthly payment
~4,150 PLN
```

Reuse the existing mortgage logic wherever possible.

---

# 13. Turn negotiation analytics into an actionable feature

Do not stop at a Negotiation Score.

Produce a practical recommendation.

Example:

```text
Suggested negotiation range

685,000–700,000 PLN
```

Explain why:

```text
- listing active for 74 days;
- seller already reduced price by 15,000 PLN;
- comparable apartments are cheaper;
- local supply increased;
- asking price exceeds estimated fair value.
```

Include a concise negotiation strategy based on actual property signals.

---

# 14. Property-specific viewing checklist

Generate a checklist for the specific apartment.

Example:

```text
Questions to ask during the viewing

□ Ask for the current monthly administration fee
□ Verify reserve fund contributions
□ Verify legal status of the parking space
□ Check window noise because of the nearby main road
□ Ask why the owner is selling
□ Ask about electrical installation age
□ Request the land and mortgage register number
```

The checklist should use property-specific risks when available.

---

# 15. Redesign Alerts

Alerts should become a retention mechanism.

For a property:

```text
Track this apartment
```

Possible updates:

* price reduced;
* listing removed;
* listing returned;
* better comparable apartment appeared;
* meaningful market conditions changed.

For search:

```text
Track apartments like these
```

Use the current search filters automatically.

Do not force users through a large technical alert configuration form unless they explicitly open advanced settings.

---

# 16. Replace drafts/history with `My apartments`

Rename consumer-facing drafts/check history into:

> My apartments

Each card should contain useful current state:

```text
Krzycka 42
Wrocław

699,000 PLN

Fair price
680,000–705,000 PLN

Score
72 / 100

Price ↓20,000 PLN

Updated today
```

Actions:

```text
Open
Compare
Track
```

The page should clearly encourage returning to WartoMetr during the apartment search process.

---

# 17. Improve Areas

Area pages should help users make decisions.

For example:

```text
Krzyki

Families       ★★★★★
Investment     ★★★★☆
Transport      ★★★★☆
Liquidity      High
Median price   13,400 PLN/m²
```

Then provide:

* important subareas;
* price history;
* current supply;
* transport;
* schools;
* green areas;
* risks;
* planned infrastructure;
* liquidity;
* investment context.

Whenever possible support planned investments and infrastructure claims with a source and date.

Do not use placeholder/demo claims in production-facing UI.

---

# 18. Guides must be user content, not visible SEO infrastructure

Remove any visible terms such as:

* SEO page
* internal links
* CTA
* keyword targeting
* MVP content

Guides should look like real useful editorial content.

Each guide should naturally connect to the product.

Example:

```text
Found an apartment for 13,900 PLN/m²?

Check whether its asking price is reasonable.

[ Paste Otodom link ]
```

Target funnel:

```text
Google
→ Guide
→ Check
→ Analysis
→ Save
→ Paid report / subscription
```

---

# 19. Localization

Audit every string.

Supported languages:

* Polish
* English
* Russian
* Ukrainian

A page must never mix languages unless it is a proper noun or legally necessary terminology.

Polish should be treated as the primary production language.

Remove accidental mixtures such as:

```text
Cash upfront
Województwo
Private drafts
Message
Investment
```

inside an otherwise Russian or Polish screen.

Use natural language, not literal machine-style translation.

---

# 20. Visual design requirements

The result must look like a serious modern consumer fintech / proptech product.

Do not interpret "beautiful" as decorative.

Beautiful means:

* clear visual hierarchy;
* excellent spacing;
* restrained use of color;
* consistent typography;
* coherent component system;
* strong readable numbers;
* clean cards;
* meaningful icons;
* low cognitive load;
* excellent responsive behavior;
* polished states;
* subtle motion only where useful;
* no visual noise;
* no dashboard overload.

The design should communicate:

> trustworthy, calm, analytical, premium, modern.

It should NOT communicate:

> crypto dashboard, developer admin panel, AI gimmick, flashy startup landing page.

---

# 21. Design system

Before creating many one-off components, establish or clean up a shared design system.

Define consistent:

* typography scale;
* heading hierarchy;
* spacing scale;
* border radius;
* borders;
* shadows;
* buttons;
* inputs;
* cards;
* score presentation;
* badges;
* alerts;
* tables;
* tabs;
* charts;
* tooltips;
* modal/dialog patterns;
* empty states;
* loading states;
* error states;
* skeletons.

Reuse these components.

Avoid arbitrary styling per page.

---

# 22. Color semantics

Use color intentionally.

For example:

* positive / safe;
* warning;
* negative / risk;
* neutral / informational.

Do not make the application overly colorful.

A score should not become a rainbow.

Accessibility and contrast must remain good.

Do not rely on color alone to communicate status.

---

# 23. Typography and numbers

Real-estate numbers are a core part of the interface.

Give strong hierarchy to:

* price;
* fair-price range;
* price per m²;
* estimated overpayment;
* total purchase cost;
* mortgage payment;
* negotiation range.

Avoid presenting every metric at equal visual importance.

Primary decision numbers should dominate.

Secondary analytics should remain visually quieter.

---

# 24. Responsive and mobile UX

Audit every important route at:

* mobile;
* tablet;
* laptop;
* large desktop.

The application must remain fully usable on mobile.

Do not simply stack desktop cards vertically.

Consider the mobile decision flow separately.

Important mobile actions should remain accessible:

* Check apartment;
* Save;
* Compare;
* Track;
* View verdict.

Avoid oversized tables on small screens.

Use cards or horizontal comparison patterns where necessary.

---

# 25. Loading, empty and error states

Every important asynchronous flow must have polished states.

Examples:

Listing import:

```text
Reading listing
Comparing local market
Checking risks
Calculating fair price
Preparing verdict
```

Do not show generic:

```text
Loading...
```

for important user flows.

Provide useful errors:

```text
We could not import this listing automatically.

You can:
[ Try again ]
[ Enter apartment details manually ]
```

---

# 26. Avoid fake precision

Do not imply unrealistic certainty.

Prefer:

```text
Estimated fair range
690,000–710,000 PLN
```

instead of:

```text
Fair value
698,431 PLN
```

if the model does not justify that precision.

Use confidence appropriately.

---

# 27. Monetization readiness

Prepare the UX for:

### Free

* basic analysis;
* basic fair-price estimate;
* limited checks.

### Full Property Report

Potential one-time purchase:

```text
29–49 PLN
```

Possible content:

* complete fair-price analysis;
* comparable properties;
* full risk analysis;
* negotiation recommendation;
* total purchase cost;
* viewing checklist;
* PDF export.

### Buyer Pro

Potential monthly product:

```text
49–79 PLN/month
```

Possible features:

* more/unlimited checks;
* alerts;
* price tracking;
* comparison;
* advanced market insights.

Do not implement arbitrary pricing logic if the backend does not support it yet.

But structure the product so monetization can be added cleanly.

---

# 28. First-time onboarding

A new visitor should immediately see three choices:

```text
What do you want to do?

I already found an apartment
[ Check apartment ]

I'm still searching
[ Find apartments ]

I'm choosing between several
[ Compare apartments ]
```

Do not force account creation before users understand the value unless technically required.

---

# 29. Preserve working analytics

Do not remove useful analytical capabilities simply because they no longer appear as top-level UI.

Features such as:

* Risk Score;
* Investment Score;
* Negotiation Score;
* Liquidity;
* Rental;
* developer analytics;
* market analysis;
* infrastructure;
* planned investments;

remain valuable.

The change is primarily:

```text
raw analytics
        ↓
explanation
        ↓
decision
        ↓
action
```

---

# 30. Implementation strategy

Do not attempt a blind rewrite of the entire frontend.

Work incrementally.

Recommended implementation phases:

## Phase 1 — Product cleanup

* remove internal terminology;
* fix localization;
* simplify navigation;
* establish design system;
* clean global layout.

## Phase 2 — Core Check

* redesign `/check`;
* redesign analysis result;
* verdict;
* fair-price presentation;
* confidence;
* explanations;
* comparable properties.

## Phase 3 — Decision tools

* comparison;
* negotiation;
* total cost;
* mortgage integration;
* property checklist.

## Phase 4 — Retention

* My apartments;
* saved objects;
* property tracking;
* search alerts;
* price-change signals.

## Phase 5 — Areas and acquisition

* area redesign;
* guide cleanup;
* guide → check flows;
* stronger cross-linking based on user intent.

## Phase 6 — Monetization readiness

* report upgrade UX;
* plan boundaries;
* usage limits presentation;
* billing integration if existing infrastructure supports it.

---

# 31. Acceptance criteria

The redesign is successful when a first-time user can open WartoMetr and, without external explanation:

1. understand what WartoMetr does within 10 seconds;
2. know where to paste an apartment link;
3. understand the verdict;
4. understand whether the asking price is reasonable;
5. understand the main risks;
6. understand why WartoMetr reached its conclusion;
7. inspect supporting evidence;
8. save the apartment;
9. compare it with another apartment;
10. estimate total purchase cost;
11. understand negotiation potential;
12. track future changes.

---

# 32. UX quality bar

Before considering any page complete, ask:

* Is the primary action obvious?
* Is the most important information visually dominant?
* Can any element be removed?
* Is the language understandable to a normal home buyer?
* Does every score explain itself?
* Does the user understand where the data came from?
* Is there a logical next action?
* Does this feel like a finished product rather than an internal dashboard?
* Does it work well on mobile?
* Are loading and error states polished?
* Is the visual style consistent with the rest of WartoMetr?

If not, iterate.

---

# 33. What NOT to do

Do not:

* add new large features unless required for this redesign;
* redesign the backend without a strong reason;
* replace working logic unnecessarily;
* expose implementation details;
* create dozens of new score types;
* add decorative charts that do not help decisions;
* use excessive gradients;
* use excessive glassmorphism;
* make every section a card;
* make every metric equally prominent;
* build an admin-dashboard-looking UI;
* sacrifice usability for visual effects;
* invent data that is not provided by the backend.

---

# 34. Verification

After each major implementation phase:

1. run the application;
2. test all modified routes;
3. verify desktop and mobile layouts;
4. test loading states;
5. test empty states;
6. test error states;
7. verify localization;
8. verify navigation;
9. ensure existing core functionality has not regressed;
10. fix console/runtime/type errors.

Where automated tests exist, update and run them.

Add tests for important new frontend behavior where appropriate.

---

# Final product standard

The target is not simply:

> a better-looking WartoMetr.

The target is:

> a product that helps someone make a several-hundred-thousand-zloty property decision with confidence.

Every screen should therefore prioritize:

**decision → explanation → evidence → action**

over:

**data → metrics → charts → more data**.

The final product should feel simple on the surface while keeping the existing analytical depth underneath.
