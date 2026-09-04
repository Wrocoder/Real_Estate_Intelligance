# WartoMetr Project Instructions

## Product

WartoMetr is a consumer real-estate decision-support web application
for people buying apartments in Poland.

The primary product question is:

> Should I buy this apartment at this price?

The primary user is a private apartment buyer.

Two main intents are supported:

- buying for living;
- buying for investment.

The product must help users move through:

listing
→ analysis
→ decision
→ explanation
→ evidence
→ action.

The main UX hierarchy is:

DECISION
→ EXPLANATION
→ EVIDENCE
→ ACTION

WartoMetr must not feel like an internal analytics dashboard.

Analytical depth should remain available underneath a simple,
consumer-friendly interface.

---

## Product priorities

When making product decisions, prioritize:

1. Understandability
2. Trust
3. Decision support
4. Explainability
5. Data integrity
6. Usability
7. Visual quality
8. Analytical depth
9. Feature quantity

Do not add new large features unless they clearly improve the core
apartment-buying decision workflow.

Prefer improving existing workflows over adding more features.

---

## Core user flows

The most important flow is:

Found apartment
→ Paste Otodom / OLX URL
→ Import listing
→ Understand verdict
→ Understand fair price
→ Understand risks
→ Understand why
→ Save
→ Compare
→ Negotiate
→ Track changes

Other important flows:

- Search apartments
- Compare apartments
- Save apartments
- Track apartments
- Calculate total purchase cost
- Estimate mortgage
- Analyze neighborhoods

---

## Frontend principles

WartoMetr is a consumer product, not an admin dashboard.

Always prefer:

- clear visual hierarchy;
- progressive disclosure;
- simple primary actions;
- understandable terminology;
- calm UI;
- excellent typography;
- restrained colors;
- consistent components;
- strong mobile usability.

Do not expose internal development terminology in public UI.

Never display terms such as:

- MVP
- SEO
- CTA
- Internal links
- dry-run
- workflow names
- implementation details
- database IDs
- developer-only confidence thresholds
- address-first flow
- private analysis
- proxy-market

unless explicitly working on an internal/admin interface.

---

## UI hierarchy

Primary decision information should be visually strongest.

Examples:

- asking price;
- fair-price range;
- estimated overpayment or undervaluation;
- final verdict;
- negotiation range;
- total purchase cost;
- mortgage payment.

Secondary analytics should be visually quieter.

Do not give every metric the same visual importance.

Avoid excessive cards.

Avoid excessive gradients.

Avoid unnecessary shadows.

Avoid glassmorphism used as decoration.

Avoid decorative charts.

Avoid making the interface look like a crypto dashboard or
enterprise admin panel.

---

## Analytics

Never casually change the semantics of:

- fair price;
- comparable properties;
- Risk Score;
- Investment Score;
- Negotiation Score;
- Liquidity Score;
- Rental Score;
- developer analysis;
- infrastructure analysis;
- planned investments;
- market trends.

For analytical values distinguish:

- confirmed fact;
- source data;
- derived metric;
- model estimate;
- unknown;
- insufficient data.

Never invent missing data.

Never present uncertain model output as objective fact.

Avoid fake precision.

Prefer:

Estimated fair price:
690,000–710,000 PLN

instead of:

Fair price:
698,431.27 PLN

when the data does not justify that precision.

Where appropriate expose:

- source;
- freshness;
- sample size;
- geographic scope;
- time range;
- confidence.

---

## Engineering

Before implementing changes:

1. inspect the existing implementation;
2. understand current architecture;
3. identify existing reusable components;
4. understand API contracts;
5. understand data models;
6. understand existing tests.

Prefer incremental changes over rewrites.

Do not create duplicate abstractions if equivalent functionality
already exists.

Do not change backend contracts unless required.

Do not invent API fields.

Do not silently change existing business logic.

Do not delete working functionality merely because it is no longer
a top-level UI element.

---

## Localization

Supported product languages are:

- Polish
- English
- Russian
- Ukrainian

Polish is the primary production language.

A translated interface must not accidentally mix languages.

Use natural human-language translations rather than literal
machine-style translations.

Proper names and legally required Polish terminology may remain
unchanged where appropriate.

---

## Responsive UX

Every consumer-facing change must be usable on:

- mobile;
- tablet;
- laptop;
- desktop.

Do not treat mobile as desktop components stacked vertically.

Important mobile actions must remain obvious and accessible.

Avoid desktop-sized comparison tables on narrow screens.

---

## States

Consumer-facing asynchronous features must have meaningful:

- loading states;
- skeleton states;
- empty states;
- error states;
- retry states.

Avoid generic "Loading..." for important product flows when a more
informative progress state can be shown.

---

## Verification

Do not consider a frontend task complete merely because:

- TypeScript compiles;
- build succeeds;
- tests pass.

Frontend work must be inspected in the rendered application whenever
the environment permits it.

For meaningful changes:

1. inspect git diff;
2. run formatting;
3. run lint;
4. run typecheck;
5. run relevant tests;
6. run build;
7. run the application;
8. verify affected flows;
9. inspect browser console;
10. check responsive behavior;
11. check loading states;
12. check empty states;
13. check error states;
14. check localization;
15. confirm existing functionality has not regressed.

Report clearly:

- what changed;
- what was verified;
- what could not be verified;
- remaining risks.

---

## Final quality rule

For every consumer-facing page ask:

1. What decision is the user trying to make?
2. What is the most important information?
3. What should the user do next?
4. Why should the user trust this information?
5. Can anything be removed?

The target product structure is:

decision
→ explanation
→ evidence
→ action

not:

metrics
→ charts
→ more metrics
→ more charts.
