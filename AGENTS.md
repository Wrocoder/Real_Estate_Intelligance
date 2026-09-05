# WartoMetr Project Instructions

## 1. Product identity

WartoMetr is a consumer real-estate decision-support application for people buying apartments in Poland.

It is not primarily:

* a property analytics dashboard;
* a generic real-estate data explorer;
* a listing aggregator;
* a collection of scores;
* an AI chat interface;
* a professional BI tool.

WartoMetr is primarily:

> A buyer decision-support product that helps a private apartment buyer decide whether a specific apartment is worth buying at a specific price.

The primary product question is:

> **Should I buy this apartment at this price?**

The primary user is a private apartment buyer.

The two main buying intents are:

* buying for living;
* buying for investment.

The product should help users understand:

* whether the apartment is worth considering;
* whether the asking price is reasonable;
* what a reasonable purchase price is;
* what the important risks are;
* why the product reached its conclusion;
* how confident the conclusion is;
* what should be verified before buying;
* how the apartment compares with alternatives;
* how to negotiate;
* what the user should do next.

---

## 2. Core product journey

The primary journey is:

listing
→ analysis
→ decision
→ explanation
→ evidence
→ action
→ comparison
→ monitoring.

The primary UX hierarchy is:

**DECISION**
→ **EXPLANATION**
→ **EVIDENCE**
→ **ACTION**

Detailed analytics belong underneath this hierarchy.

Do not force users to interpret raw metrics or charts before receiving a useful conclusion.

WartoMetr must never feel like an internal analytics dashboard.

---

## 3. Product priorities

When making product or implementation decisions, use this priority order:

1. Understandability
2. Trust
3. Decision support
4. Explainability
5. Data integrity
6. Usability
7. Visual quality
8. Analytical depth
9. Feature quantity

When priorities conflict, the earlier item wins.

Examples:

* a simpler explanation is better than an additional chart;
* transparent uncertainty is better than a confident-looking estimate;
* one strong recommendation is better than five weak scores;
* an existing workflow improved properly is better than another unfinished feature.

Do not add large features unless they clearly improve the apartment-buying decision workflow.

Prefer improving and simplifying existing workflows over increasing feature count.

---

## 4. Core user flows

### 4.1 Apartment check

The most important flow is:

Found apartment
→ Paste Otodom / OLX URL or provide property details
→ Import or enter listing
→ Understand verdict
→ Understand fair value
→ Understand risks
→ Understand evidence
→ Understand confidence
→ Get next actions
→ Save
→ Compare
→ Negotiate
→ Track changes.

This is the highest-priority consumer flow.

Changes that damage this flow should be treated as regressions unless explicitly approved.

---

### 4.2 Search

Users should be able to search using concepts they naturally understand, such as:

* city or area;
* budget;
* rooms;
* size;
* buying purpose;
* basic lifestyle requirements.

Do not require ordinary users to configure internal analytical concepts such as:

* liquidity score;
* negotiation score;
* risk thresholds;
* developer confidence;
* infrastructure weights;
* model confidence thresholds.

WartoMetr should use such data internally to improve ranking and recommendations.

Advanced filters may expose deeper controls separately when useful.

---

### 4.3 Comparison

Comparison must help the user answer:

> Which apartment is the better decision for me, and why?

Do not reduce comparison to a table of scores.

Where possible explain:

* which property is better overall;
* which is better financially;
* which is better for living;
* which is safer;
* which is easier to negotiate;
* what the user gains by choosing one;
* what the user gives up;
* whether the price difference is justified.

---

### 4.4 Negotiation

Negotiation is a core decision-support capability.

Where supported by data, WartoMetr should help users understand:

* reasonable purchase range;
* suggested first offer;
* target price;
* maximum reasonable price;
* negotiation arguments;
* property weaknesses relevant to negotiation;
* market evidence supporting the negotiation position.

Negotiation guidance must be based on available evidence.

Never fabricate arguments.

---

### 4.5 Saved properties and monitoring

Saved properties should support an ongoing buying process rather than act as bookmarks only.

Where technically supported, useful changes include:

* price changes;
* listing removal;
* relisting;
* time on market;
* changes to listing content;
* new comparable listings;
* local supply changes;
* meaningful fair-value changes.

Monitoring should surface actionable changes rather than generate noise.

---

## 5. Decision Engine principles

The top-level property conclusion should eventually support clear outcomes such as:

* BUY;
* NEGOTIATE;
* SKIP.

Localized consumer-facing labels may differ.

A verdict must not be produced from an arbitrary or unexplained score.

It should be based on explicit analytical dimensions where available, such as:

* asking price versus fair value;
* comparable properties;
* property-specific risks;
* location risks;
* liquidity;
* market alternatives;
* negotiation potential;
* investment economics;
* buyer preferences;
* data confidence.

Prefer deterministic and inspectable business logic for important decisions.

AI may help explain a conclusion.

AI must not silently invent the conclusion, facts, sources, prices, risks or confidence.

---

## 6. Price and valuation principles

Price analysis is one of the most important WartoMetr capabilities.

Where data allows it, distinguish clearly between:

* asking price;
* estimated fair value;
* fair-value range;
* overpricing or undervaluation;
* suggested purchase range;
* suggested first offer;
* walk-away price.

Avoid fake precision.

Prefer:

> Estimated fair value: 690,000–710,000 PLN

instead of:

> Fair value: 698,431.27 PLN

when the underlying data does not justify exact precision.

A range is often more honest and useful than a precise-looking number.

Do not silently change the semantics or calculation methodology of fair value.

Material methodology changes require:

* inspection of current behavior;
* impact analysis;
* test updates;
* documentation;
* explicit explanation in the implementation summary.

---

## 7. Evidence and comparable properties

Important conclusions should be inspectable.

Where comparable-property data exists, make it possible to understand why a property received a particular valuation.

Useful comparable attributes may include:

* transaction or listing type;
* date;
* distance;
* price;
* price per square meter;
* area;
* room count;
* floor;
* building age;
* property condition;
* similarity;
* source.

Do not hide weak evidence behind a strong-looking result.

If evidence is insufficient, communicate that limitation.

---

## 8. Trust and data provenance

Trust is a core product feature, not a footer item.

For important analytical values, support provenance where technically possible.

Useful provenance includes:

* source;
* source type;
* freshness;
* observation count;
* sample size;
* geographic scope;
* time range;
* calculation method;
* confidence.

Clearly distinguish:

* confirmed fact;
* source data;
* transaction data;
* listing data;
* derived metric;
* calculated statistic;
* model estimate;
* model inference;
* unknown;
* insufficient data.

Never invent missing data.

Never present inferred information as directly observed fact.

Never convert missing data into a neutral-looking score without clearly documenting that behavior.

---

## 9. Confidence

Important calculated results should communicate uncertainty when appropriate.

Use understandable confidence concepts such as:

* HIGH;
* MEDIUM;
* LOW.

Confidence should be based on explicit inputs where possible, for example:

* number of comparable properties;
* quality of data sources;
* similarity of comparable properties;
* data freshness;
* geographic distance;
* time distance;
* missing attributes;
* model limitations.

Do not use confidence merely as visual decoration.

A user should be able to understand why confidence is high or low.

Do not expose developer-only threshold configuration in consumer UI.

---

## 10. Risk analysis

Risk analysis must help the buyer make a better decision, not scare the buyer.

Possible risk categories include:

* price risk;
* liquidity risk;
* flood risk;
* noise;
* industrial proximity;
* transport;
* planning risk;
* building risk;
* legal or document risk;
* developer risk;
* infrastructure risk.

Where appropriate, a risk should explain:

* what was detected;
* severity;
* supporting evidence;
* why it matters;
* what the buyer should verify or do.

Avoid vague warnings.

Prefer actionable explanation.

---

## 11. Living vs investment intent

The two main buying intents are:

### Buying for living

Prioritize factors such as:

* lifestyle fit;
* commute;
* public transport;
* schools;
* green space;
* noise;
* neighborhood quality;
* infrastructure;
* future development;
* everyday convenience.

### Buying for investment

Prioritize factors such as:

* acquisition price;
* rental economics;
* rental demand;
* liquidity;
* vacancy risk;
* future supply;
* local price trends;
* resale potential;
* transport and employment accessibility.

Intent must affect real recommendations where enough data exists.

Do not display two intent options if both lead to effectively identical conclusions.

---

## 12. Personalization

Where buyer preferences are available, use them to improve:

* property ranking;
* fit;
* comparison;
* explanations;
* recommendations.

Useful preferences may include:

* budget;
* buying intent;
* work location;
* maximum commute;
* car ownership;
* children;
* schools;
* green-space importance;
* transport importance;
* noise sensitivity;
* nightlife importance;
* investment goals.

Do not turn onboarding into a long questionnaire.

Collect only information with meaningful decision value.

Clearly distinguish personalized conclusions from general market conclusions.

---

## 13. Action layer

Every important analysis should help answer:

> What should I do next?

Where appropriate provide useful next actions such as:

* questions for the seller or agent;
* property viewing checklist;
* document checklist;
* legal verification checklist;
* building/community questions;
* negotiation preparation;
* issues requiring professional verification.

Actions should adapt to discovered risks where possible.

Do not end important consumer workflows with raw analytics alone.

---

## 14. Total purchase cost

Purchase price is not the same as acquisition cost.

Where supported, total-cost analysis may include:

* apartment price;
* taxes;
* notary costs;
* agent commission;
* parking;
* storage;
* renovation;
* finishing;
* mortgage-related costs;
* estimated monthly ownership costs.

Assumptions must be transparent.

Values that depend on user-specific assumptions should be editable where practical.

Do not present unsupported cost assumptions as facts.

---

## 15. Frontend principles

WartoMetr is a consumer product, not an admin dashboard.

Always prefer:

* clear visual hierarchy;
* progressive disclosure;
* simple primary actions;
* understandable terminology;
* calm UI;
* excellent typography;
* restrained colors;
* consistent components;
* strong mobile usability;
* clear states;
* accessible interactions.

The user should understand the most important conclusion within seconds.

Do not make the interface visually dense simply because a large amount of data exists.

---

## 16. UI hierarchy

Primary decision information should be visually strongest.

Examples:

* verdict;
* asking price;
* fair-value range;
* overpayment or undervaluation;
* negotiation range;
* walk-away price;
* confidence;
* major risks;
* total purchase cost;
* mortgage impact.

Secondary analytics should be visually quieter.

Detailed data belongs lower in the page or behind progressive disclosure.

Do not give every metric equal visual importance.

Avoid:

* excessive cards;
* excessive gradients;
* unnecessary shadows;
* decorative glassmorphism;
* meaningless badges;
* decorative charts;
* unnecessary gauges;
* radial charts without clear value;
* interfaces resembling crypto dashboards;
* interfaces resembling enterprise admin panels.

A chart should exist only when it helps the user understand something faster or better than text and numbers.

---

## 17. Consumer terminology

Do not expose internal development terminology in public UI.

Never display terms such as:

* MVP;
* SEO;
* CTA;
* internal links;
* dry-run;
* workflow names;
* implementation details;
* database IDs;
* internal status codes;
* developer-only confidence thresholds;
* address-first flow;
* private analysis;
* proxy-market;
* raw feature names;
* internal model names;

unless explicitly working on an internal or admin interface.

Translate internal concepts into natural consumer language.

---

## 18. Analytics semantics

Never casually change the semantics of:

* fair price;
* comparable properties;
* Risk Score;
* Investment Score;
* Negotiation Score;
* Liquidity Score;
* Rental Score;
* developer analysis;
* infrastructure analysis;
* planned investments;
* market trends;
* total acquisition cost;
* mortgage calculations.

Before changing analytical logic:

1. inspect current implementation;
2. identify all dependencies;
3. understand stored data;
4. inspect API contracts;
5. inspect UI assumptions;
6. inspect tests;
7. understand backward compatibility.

Do not silently change business meaning.

---

## 19. Missing and partial data

Real-estate data is often incomplete.

The product must handle incomplete data explicitly.

Use states such as:

* unavailable;
* insufficient data;
* unknown;
* not applicable;
* low confidence.

Do not replace missing values with:

* zero;
* average;
* neutral score;
* synthetic data;

unless that behavior is intentional, documented and analytically justified.

Partial data must not break the entire report when useful conclusions can still be shown.

---

## 20. Engineering principles

Before implementing changes:

1. inspect the existing implementation;
2. understand current architecture;
3. identify existing reusable components;
4. understand API contracts;
5. understand database models;
6. inspect migrations where relevant;
7. understand existing business logic;
8. understand existing tests;
9. inspect similar functionality elsewhere in the repository.

Prefer incremental changes over unnecessary rewrites.

Do not create duplicate abstractions when equivalent functionality already exists.

Do not introduce a second implementation of an existing concept merely because the old one is inconvenient.

Prefer extending a coherent abstraction over creating parallel systems.

---

## 21. Change scope

Respect task scope.

For focused tasks:

* change only what is needed;
* avoid unrelated refactoring;
* avoid redesigning unrelated pages;
* avoid renaming unrelated concepts;
* avoid formatting entire files unnecessarily.

For broad product-transformation tasks:

* work according to the explicitly provided roadmap;
* complete dependencies in the correct order;
* document architectural decisions;
* avoid random feature additions outside the roadmap.

Do not silently expand task scope.

---

## 22. Backend and API safety

Do not change backend contracts unless required.

Do not invent API fields.

Do not assume a backend capability exists because the frontend needs it.

If required data is unavailable:

* inspect the backend first;
* document the gap;
* implement the backend capability if it is within task scope;
* otherwise expose the limitation honestly.

Do not create frontend fake data to simulate completed backend capability.

Preserve backward compatibility when reasonably possible.

If a breaking change is necessary, document it clearly.

---

## 23. Database and data integrity

Treat stored analytical data as production data.

Before schema or query changes:

* inspect existing migrations;
* inspect constraints;
* inspect indexes;
* inspect foreign keys;
* inspect consumers;
* inspect data lifecycle;
* inspect nullability assumptions;
* inspect status transitions.

Do not modify database semantics merely to simplify frontend implementation.

Avoid destructive migration behavior unless explicitly required.

Data integrity has higher priority than implementation convenience.

---

## 24. AI usage

AI can improve:

* explanations;
* summaries;
* negotiation wording;
* natural-language guidance;
* interpretation of structured results.

AI must not be treated as an authoritative source of property facts.

AI must not invent:

* market data;
* transaction data;
* comparable properties;
* regulations;
* addresses;
* risks;
* prices;
* source provenance;
* confidence;
* legal conclusions.

Whenever deterministic structured data exists, use it as the source of truth.

AI-generated content should remain grounded in verified application data.

---

## 25. Localization

Supported product languages are:

* Polish;
* English;
* Russian;
* Ukrainian.

Polish is the primary production language.

A translated interface must never accidentally mix languages.

Use natural human-language translations rather than literal machine-style translations.

Maintain consistent terminology throughout the product.

Proper names and legally required Polish terminology may remain unchanged when appropriate.

Internal code identifiers and technical documentation should generally remain in English unless existing project conventions require otherwise.

---

## 26. Responsive UX

Every consumer-facing change must be usable on:

* mobile;
* tablet;
* laptop;
* desktop.

Do not treat mobile as desktop components stacked vertically.

Mobile UX should be intentionally designed.

Important mobile actions must remain obvious and accessible.

Avoid desktop-sized comparison tables on narrow screens.

Prefer mobile-specific comparison patterns where appropriate.

Avoid horizontal overflow unless the interaction genuinely requires it.

---

## 27. Accessibility

Consumer-facing UI should follow basic accessibility standards.

Check:

* semantic HTML;
* keyboard navigation;
* focus visibility;
* form labels;
* button names;
* dialog behavior;
* contrast;
* readable typography;
* meaningful error messages;
* screen-reader-friendly structure where practical.

Do not rely only on color to communicate important states.

---

## 28. Async states

Consumer-facing asynchronous functionality must have meaningful:

* loading states;
* skeleton states;
* progress states;
* empty states;
* partial-data states;
* error states;
* retry states;
* success states.

Avoid generic `Loading...` for important workflows when more informative progress can be shown.

Do not leave users on empty screens during long-running analysis.

---

## 29. Error handling

Errors should explain:

* what happened;
* whether user data is safe;
* whether retrying may help;
* what the user can do next.

Do not expose:

* stack traces;
* raw backend exceptions;
* SQL messages;
* internal service names;
* internal IDs;

in public UI.

Preserve technical diagnostics in logs where appropriate.

---

## 30. Performance

Consumer-facing pages should feel fast.

Avoid:

* unnecessary network requests;
* repeated API calls;
* unnecessarily large bundles;
* expensive client-side computation;
* loading large analytics before primary conclusions;
* rendering invisible heavy components;
* excessive animation.

Prioritize loading in this order where technically possible:

1. page shell;
2. primary decision information;
3. critical evidence;
4. secondary analytics;
5. non-critical details.

Do not delay the main verdict merely to load lower-priority charts.

---

## 31. SEO and public content

Public area pages, guides and educational content may support acquisition.

SEO must not degrade product quality.

Avoid:

* automatically generated low-value pages;
* keyword-stuffed text;
* duplicate content;
* fake local pages;
* content that exists only for crawlers.

Public content should answer real buyer questions and naturally lead into the core apartment-check workflow.

---

## 32. Monetization principles

Monetization must follow demonstrated user value.

Do not artificially hide essential trust information behind payment.

Users should understand the value of the product before paying.

Paid functionality may reasonably include deeper capabilities such as:

* full decision report;
* detailed comparable properties;
* advanced negotiation guidance;
* multi-property comparison;
* monitoring;
* extended risk analysis;
* downloadable reports.

Pricing and entitlement logic must be centralized where practical.

Do not hardcode inconsistent pricing throughout the frontend.

Billing states must be explicit and trustworthy.

---

## 33. Commercial trust

Production-facing surfaces should make it clear who operates the product and how conclusions are generated.

Important trust surfaces may include:

* methodology;
* data sources;
* data limitations;
* privacy policy;
* terms;
* contact information;
* pricing;
* billing conditions;
* FAQ;
* sample report;
* appropriate disclaimers.

Do not use disclaimers as a substitute for poor data quality.

---

## 34. Internal and production separation

Production users must not accidentally see:

* development routes;
* private drafts;
* debug information;
* prototype labels;
* internal admin navigation;
* placeholder content;
* stale product names;
* mock analytical values;
* unfinished experiments.

Development functionality should be clearly separated from public product functionality.

---

## 35. Product analytics

When analytics instrumentation is part of the task, focus on the real decision funnel.

Useful events may include:

* check_started;
* check_completed;
* report_opened;
* verdict_viewed;
* comparables_opened;
* risk_opened;
* negotiation_opened;
* negotiation_message_generated;
* property_saved;
* comparison_started;
* comparison_completed;
* pricing_viewed;
* checkout_started;
* purchase_completed.

Do not collect unnecessary personal information merely because it is technically possible.

Event naming should remain consistent and documented.

---

## 36. Testing

Important analytical and business logic must have automated tests.

Prioritize tests for:

* valuation;
* verdict logic;
* confidence;
* negotiation calculations;
* risk classification;
* comparison;
* pricing and entitlements;
* localization-critical behavior;
* API contracts;
* data transformations.

UI tests should focus on high-value user flows rather than implementation details.

Do not overfit tests to DOM structure when user-observable behavior can be tested instead.

---

## 37. Verification workflow

Do not consider a task complete merely because:

* TypeScript compiles;
* Python imports;
* build succeeds;
* tests pass.

For meaningful changes, verify the actual user experience whenever the environment permits it.

Use the relevant subset of this workflow:

1. inspect git status;
2. inspect git diff;
3. run formatter;
4. run lint;
5. run typecheck;
6. run relevant unit tests;
7. run integration tests where applicable;
8. run build;
9. run the application;
10. verify affected user flows;
11. inspect browser console;
12. inspect network failures where relevant;
13. verify desktop behavior;
14. verify mobile behavior;
15. verify loading states;
16. verify empty states;
17. verify partial-data states;
18. verify error states;
19. verify localization;
20. confirm unrelated functionality has not regressed.

Do not claim something was verified if it was not actually verified.

---

## 38. Task completion report

At the end of a meaningful implementation task, report clearly:

### Changed

What was implemented.

### Verified

What was actually tested or inspected.

### Not verified

Anything that could not be tested in the current environment.

### Remaining risks

Known limitations or follow-up concerns.

### Files

Important files changed or created.

Avoid vague completion messages such as:

> Done.

A successful build alone does not prove the user flow works.

---

## 39. Refactoring rule

Refactoring is justified when it:

* removes duplication;
* reduces complexity;
* improves correctness;
* makes business logic explicit;
* enables the requested feature safely;
* improves maintainability without changing behavior.

Refactoring is not justified merely because another implementation style looks cleaner.

Do not perform broad architectural rewrites during unrelated product tasks.

---

## 40. Documentation

Update documentation when a change affects:

* architecture;
* business logic;
* API contracts;
* database schema;
* analytical semantics;
* user-visible behavior;
* configuration;
* operational behavior.

Documentation should explain why important decisions exist, not merely repeat code.

Do not allow product documentation to describe functionality that no longer exists.

---

## 41. Final consumer quality check

For every consumer-facing page ask:

1. What decision is the user trying to make?
2. What is the most important information on this page?
3. Is that information immediately visible?
4. What should the user do next?
5. Why should the user trust the information?
6. Is uncertainty communicated honestly?
7. Is the interface asking the user to understand an internal concept?
8. Can anything be removed?
9. Does this work well on mobile?
10. Would this page help someone making a real apartment purchase decision?

If the answers are unclear, the page is not finished.

---

## 42. Final product quality rule

The target product structure is:

**decision**
→ **explanation**
→ **evidence**
→ **action**

not:

**metrics**
→ **charts**
→ **more metrics**
→ **more charts**

A successful WartoMetr experience should allow a private buyer to quickly understand:

* whether the apartment is worth considering;
* whether the price is reasonable;
* what a reasonable price would be;
* what the major risks are;
* why WartoMetr reached that conclusion;
* how reliable the conclusion is;
* what to verify;
* how to negotiate;
* what to do next.

The ultimate success criterion is not analytical complexity or visual sophistication.

It is:

> **WartoMetr helped the user make a better apartment-buying decision.**
