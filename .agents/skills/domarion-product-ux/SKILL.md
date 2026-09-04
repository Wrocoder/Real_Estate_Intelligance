---
name: domarion-product-ux
description: Use when designing, reviewing, refactoring, or implementing any consumer-facing Domarion workflow, page, navigation, property analysis, search, comparison, saved apartment, alert, area, report, mortgage, or onboarding experience.
---

# Domarion Product UX

## Goal

Domarion helps private buyers answer:

> Should I buy this apartment at this price?

The interface must transform complex real-estate analytics into
clear decisions.

Always follow:

DECISION
→ EXPLANATION
→ EVIDENCE
→ ACTION

Do not turn Domarion into an analytics dashboard.

---

## Primary user

Primary:

Private person buying an apartment in Poland.

Supported intents:

- For living
- For investment

Professional realtor/agency functionality must not dominate
consumer workflows.

---

## Before modifying UX

Inspect:

1. current route;
2. current components;
3. API/data used by the page;
4. existing user actions;
5. related flows;
6. mobile behavior;
7. loading/error/empty states.

Identify:

- the user's primary question;
- primary action;
- unnecessary complexity;
- implementation terminology exposed to users;
- unexplained scores;
- missing evidence;
- unclear next action.

---

## Core product flow

Prefer:

Found apartment
→ Check
→ Verdict
→ Fair price
→ Risks
→ Explanation
→ Evidence
→ Save
→ Compare
→ Negotiate
→ Track

Do not expose all available analytics before the user understands
the basic conclusion.

---

## Property analysis

The analysis screen should first communicate:

- property identity;
- asking price;
- estimated fair-price range;
- verdict;
- estimated overpayment/undervaluation;
- strongest positives;
- strongest risks.

Only then show detailed analytics.

A first-time user should understand the conclusion within
approximately 10 seconds.

---

## Scores

Scores may include:

- Investment
- Risk
- Liquidity
- Rental
- Negotiation

Never present a score without context.

For each score explain:

- meaning;
- direction;
- important contributing factors;
- uncertainty where relevant.

Bad:

Liquidity: 78

Better:

Liquidity: 78/100 — High

Why:
- strong demand for similar apartments;
- relatively limited local supply;
- good public transport;
- popular apartment size.

---

## Search

Default apartment search should stay simple.

Prefer filters such as:

- location;
- budget;
- rooms;
- size;
- market type;
- living/investment intent.

Move specialist filters under advanced controls.

Do not expect consumers to choose internal score thresholds.

Prefer user-oriented sorting such as:

- Best overall
- Best value
- Lowest risk
- Best for rent
- Most liquid
- Best negotiation opportunities

Translate these intents into internal analytics automatically.

---

## Comparison

Comparison must help make a decision.

Start with:

- recommended option;
- reasons;
- important trade-offs.

Then show detailed comparison.

Do not begin with a large spreadsheet.

---

## Saved properties

Use consumer terminology such as:

My apartments
Saved apartments
Tracked apartments

Avoid:

Drafts
Private drafts
Internal analysis

Cards should communicate meaningful state:

- current price;
- fair-price range;
- verdict/score;
- price changes;
- updated time;
- tracking status.

---

## Alerts

Prefer contextual creation.

From property:

Track this apartment

From search:

Track apartments like these

Reuse current context automatically.

Do not require users to manually reconstruct the current search
through a large configuration form.

---

## Mortgage and purchase costs

Integrate financial calculations into property context.

Prefer:

Apartment price
+ taxes
+ notary
+ renovation
+ additional costs
= total purchase cost

Then:

down payment
mortgage amount
monthly payment

Do not make users repeatedly enter information already known
about the selected property.

---

## Negotiation

Convert negotiation analytics into actions.

Provide:

- suggested negotiation range;
- strongest negotiation arguments;
- market evidence;
- relevant listing history.

Do not stop at a numerical Negotiation Score.

---

## Areas

Area pages must help answer:

> Is this a good area for my purpose?

Show:

- price;
- liquidity;
- transport;
- schools;
- green areas;
- risks;
- supply;
- market trend;
- relevant infrastructure;
- planned investments.

Use smaller meaningful neighborhoods/osiedla where the data supports it.

---

## Trust

Whenever a decision relies on significant analytical data,
make evidence discoverable.

Examples:

- source;
- update date;
- comparable count;
- search radius;
- historical window;
- confidence.

Do not overwhelm the primary view with methodology.
Use progressive disclosure.

---

## Copy

Write for normal property buyers.

Avoid internal terminology.

Avoid jargon when a simple phrase works.

Prefer:

Estimated fair price

instead of:

Model-derived valuation proxy

Prefer:

Why we think this

instead of:

Score factors metadata

---

## Verification

Before completing UX work verify:

- primary action is obvious;
- verdict is understandable;
- important numbers dominate;
- scores are explainable;
- evidence can be inspected;
- next action is clear;
- unnecessary content has been removed;
- mobile flow works;
- loading/error/empty states make sense.

If the interface looks impressive but makes the decision harder,
the redesign failed.
