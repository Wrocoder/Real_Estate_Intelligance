---
name: domarion-release-gate
description: Use after meaningful Domarion code changes, especially frontend flows, product UX, analytics, API behavior, refactors, or release preparation, to verify the implementation before declaring the task complete.
---

# Domarion Release Gate

## Goal

Do not report meaningful implementation work as complete until it
has been verified.

A successful build is necessary but not sufficient.

---

## Step 1 — Inspect changes

Inspect the complete git diff.

Confirm:

- changes match the requested scope;
- unrelated files were not modified;
- no debug code remains;
- no temporary placeholders remain;
- no accidental API changes were introduced.

---

## Step 2 — Static verification

Use the commands already defined by the repository.

Run appropriate:

- formatter;
- lint;
- typecheck;
- static analysis.

Do not invent new tooling if the repository already defines the
required commands.

---

## Step 3 — Tests

Run relevant:

- unit tests;
- integration tests;
- frontend tests;
- backend tests.

Prefer targeted tests first.

Run broader suites when the change has broad impact.

---

## Step 4 — Build

Build affected applications.

Verify no:

- compile errors;
- TypeScript errors;
- bundler errors;
- dependency errors.

---

## Step 5 — Run application

Whenever possible run the application.

Verify modified routes through the actual rendered UI.

Do not treat source inspection as equivalent to browser verification.

---

## Step 6 — Browser verification

For affected consumer routes check:

### Desktop

Approximately 1440px width.

### Mobile

Approximately 390px width.

### Tablet

When the layout meaningfully changes between desktop and mobile.

Check:

- primary action;
- layout;
- text wrapping;
- overflow;
- navigation;
- dialogs;
- forms;
- tables;
- cards;
- charts;
- sticky/fixed elements.

---

## Step 7 — Functional flow

Execute the real user flow affected by the change.

Examples:

Check:
URL
→ import
→ result

Compare:
select properties
→ compare
→ recommendation

Alert:
search
→ create alert
→ verify saved state

Saved:
save
→ open My apartments
→ reopen property

---

## Step 8 — Application states

Check relevant:

- loading;
- skeleton;
- success;
- empty;
- partial-data;
- error;
- retry.

Do not only test the happy path.

---

## Step 9 — Browser health

Inspect:

- console errors;
- uncaught exceptions;
- failed network requests;
- hydration warnings;
- obvious performance problems.

---

## Step 10 — Localization

Verify affected UI does not unintentionally mix:

- Polish;
- English;
- Russian;
- Ukrainian.

Check important text in all relevant locale files.

---

## Step 11 — Analytics safety

If analytics were touched:

verify with domarion-analytics-integrity principles.

Confirm frontend interpretation still matches backend semantics.

---

## Step 12 — Regression check

Confirm existing related functionality still works.

Pay special attention to shared:

- components;
- APIs;
- state management;
- localization;
- routing;
- authentication.

---

## Final report

Before declaring completion summarize:

### Changed

What was implemented.

### Verified

What checks were actually performed.

### Not verified

Anything that could not be tested.

### Remaining risks

Known limitations or follow-up issues.

Never claim something was verified if it was not actually tested.

---

## Hard rule

Do not declare a UI implementation complete solely because:

- npm build passed;
- TypeScript compiled;
- lint passed;
- the code looks correct.

Rendered UI must be inspected whenever the environment permits it.
