---
name: domarion-ui-quality
description: Use whenever creating, redesigning, styling, reviewing, or polishing Domarion frontend UI, components, layouts, responsive behavior, loading states, forms, dashboards, reports, or consumer-facing pages.
---

# Domarion UI Quality

## Visual goal

Domarion should feel like a polished modern European
consumer fintech/proptech product.

Desired qualities:

- trustworthy;
- calm;
- premium;
- analytical;
- modern;
- clear;
- restrained.

The UI must not look like:

- an admin dashboard;
- a crypto dashboard;
- a developer tool;
- an AI demo;
- a generic Tailwind template.

---

## Core principle

Beautiful does not mean decorative.

Beautiful means:

- obvious hierarchy;
- excellent spacing;
- excellent typography;
- low cognitive load;
- consistency;
- restrained visual language;
- polished interactions;
- strong responsive behavior.

---

## Visual hierarchy

Identify one dominant purpose for every major screen.

Primary information must dominate.

Examples:

- asking price;
- fair-price range;
- verdict;
- estimated overpayment;
- negotiation range;
- total purchase cost.

Secondary analytics should be quieter.

Never visually emphasize every number equally.

---

## Layout

Prefer clean grouping and whitespace.

Avoid turning every section into a floating card.

Use cards only when they improve grouping or interaction.

Prefer:

- whitespace;
- section hierarchy;
- typography;
- subtle dividers;

before introducing another container.

---

## Colors

Use a restrained palette.

Semantic colors should represent:

- positive;
- warning;
- negative/risk;
- informational/neutral.

Do not create rainbow scoring.

Do not rely on color alone.

Maintain sufficient contrast.

---

## Typography

Use a consistent typography scale.

Financial/property numbers deserve deliberate hierarchy.

Important numbers must be easy to scan.

Avoid excessive font sizes and weights.

Do not use tiny secondary text for information required to
understand the analysis.

---

## Components

Reuse shared components.

Before creating new components search for existing:

- buttons;
- inputs;
- select controls;
- cards;
- alerts;
- badges;
- score components;
- dialogs;
- tables;
- tabs;
- tooltips;
- skeletons.

Do not create slightly different versions of the same UI pattern
on every route.

---

## Effects

Use effects intentionally.

Avoid:

- excessive gradients;
- excessive shadows;
- excessive rounded containers;
- excessive glassmorphism;
- glowing UI;
- decorative animations.

Motion should explain:

- loading;
- state transitions;
- expansion/collapse;
- successful interaction.

Not merely prove that CSS supports animation.

---

## Charts

Every chart must answer a user question.

Do not add charts simply because data exists.

If one sentence or one number communicates the conclusion better,
use the sentence or number.

---

## Forms

Forms should reveal complexity progressively.

Default state should request only essential information.

Advanced fields should not dominate the first interaction.

Preserve entered data after recoverable errors.

Use appropriate validation and human-readable errors.

---

## Mobile

Treat mobile as a first-class experience.

Verify important routes around 390px width.

Do not simply stack every desktop card vertically.

Prioritize:

- verdict;
- price;
- fair price;
- primary CTA;
- Save;
- Compare;
- Track.

Avoid unusable wide tables.

Use responsive cards or alternate comparison layouts when needed.

---

## States

Every important async feature should have polished:

- initial;
- loading;
- success;
- empty;
- partial-data;
- failure;
- retry states.

For apartment import prefer meaningful progress such as:

- Reading listing
- Comparing local market
- Checking risks
- Calculating fair price
- Preparing analysis

instead of an unexplained spinner.

---

## Accessibility

Check:

- contrast;
- focus visibility;
- keyboard interaction;
- semantic HTML;
- form labels;
- icon labels;
- status communication beyond color.

---

## Browser verification

Frontend UI cannot be considered finished from source code alone.

Whenever practical:

1. run the real application;
2. inspect affected routes;
3. test desktop;
4. test mobile;
5. inspect loading states;
6. inspect empty states;
7. inspect errors;
8. inspect browser console;
9. iterate after seeing rendered output.

Do not report completion based only on a successful build.

---

## Final UI review

Before completing a page ask:

- What catches the eye first?
- Is that the correct thing?
- Is there unnecessary visual noise?
- Are too many things presented as cards?
- Are colors doing useful work?
- Are related elements aligned?
- Are spacing patterns consistent?
- Does it feel trustworthy enough for a property decision worth
  hundreds of thousands of PLN?
