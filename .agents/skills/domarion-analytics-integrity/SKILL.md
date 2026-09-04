---
name: domarion-analytics-integrity
description: Use whenever changing, reviewing, displaying, calculating, or interpreting Domarion real-estate analytics including fair value, comparable properties, risks, investment, liquidity, rental, negotiation, developers, infrastructure, market trends, and planned investments.
---

# Domarion Analytics Integrity

## Goal

Protect analytical correctness and user trust.

Real-estate recommendations may influence decisions worth hundreds
of thousands of PLN.

Do not change analytical semantics casually.

---

## Analytical categories

This skill applies to:

- fair-price estimation;
- price per square meter;
- comparable properties;
- Investment Score;
- Risk Score;
- Liquidity Score;
- Rental Score;
- Negotiation Score;
- developer analysis;
- location analysis;
- infrastructure;
- planned investments;
- market history;
- market trends.

---

## Data classification

Always distinguish between:

### FACT

Directly supported by reliable source data.

### SOURCE DATA

Raw or normalized information supplied by a source.

### DERIVED METRIC

Deterministically calculated from source data.

### MODEL ESTIMATE

Prediction, score, approximation or inferred value.

### UNKNOWN

Data is unavailable.

### INSUFFICIENT DATA

Data exists but is not sufficient for a reliable conclusion.

Never silently transform UNKNOWN into a neutral or positive score.

---

## Before changing analytics

Identify:

1. source fields;
2. calculation;
3. units;
4. currency;
5. geographical scope;
6. time window;
7. filters;
8. sample size;
9. confidence behavior;
10. fallback behavior.

Find existing tests before modifying behavior.

---

## Fair price

Fair price should normally be communicated as a range unless the
underlying methodology justifies stronger precision.

Prefer:

690,000–710,000 PLN

over:

698,431.27 PLN

when uncertainty exists.

When available expose:

- comparable count;
- geographic radius;
- size tolerance;
- date/time window;
- update date;
- confidence.

---

## Comparables

Comparable properties should be genuinely comparable.

Review factors such as:

- location;
- distance;
- apartment size;
- number of rooms;
- property type;
- primary/secondary market;
- building age;
- condition;
- floor;
- relevant amenities;
- observation date.

Do not claim strong confidence from weak comparables.

---

## Score behavior

For every score understand:

- what a high score means;
- what a low score means;
- which inputs contribute;
- normalization;
- missing-data behavior;
- confidence behavior.

Do not invert or reinterpret score semantics in the frontend.

---

## Missing data

Do not invent substitutes silently.

If fallback/proxy data is used:

- make the behavior explicit internally;
- expose lower confidence where appropriate;
- avoid strong claims.

---

## Sources

Claims about external reality should have traceable origin where possible.

Particularly sensitive:

- planned infrastructure;
- transport projects;
- developer reputation;
- environmental risks;
- market trends.

A production user should not see demo or placeholder infrastructure
presented as confirmed reality.

---

## Currency and units

Explicitly verify:

- PLN;
- EUR where applicable;
- PLN/m²;
- m²;
- percentages;
- distances;
- dates;
- mortgage periods.

Do not mix units accidentally.

---

## Time

Market analytics are time-sensitive.

Verify:

- observation window;
- listing date;
- last update;
- price history;
- stale data behavior.

Do not describe stale information as current.

---

## Analytics UI

Scores should be explainable.

Prefer:

Liquidity 78/100 — High

Why:
- ...
- ...
- ...

over a standalone numeric badge.

The user should understand the main drivers.

---

## Verification

When analytics change:

1. identify old behavior;
2. identify intended new behavior;
3. check API contracts;
4. check migrations if relevant;
5. check historical data implications;
6. update tests;
7. test boundary cases;
8. test missing data;
9. test zero values;
10. test null values;
11. test unusually large/small values;
12. verify UI interpretation matches backend semantics.

Never approve analytics changes merely because the application runs.
