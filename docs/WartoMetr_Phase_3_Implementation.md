# WartoMetr Phase 3: Fair-Price Evidence

Date: 2026-09-16. Scope: Phase 3 of the transformation roadmap; Phase 4 is not included.

## Pipeline Audit

- Transactions are stored separately from listings (`transaction_observations`, migration 0034). Source identifiers, versions, dates, price basis, currency, area and quality are preserved. This phase does not modify ingestion, stored records or database schema.
- `market_metrics.refresh_market_metrics` uses approved, active, non-demo sources, current transaction versions, quality and price checks. Future transactions are excluded. Its decision window is 365 days; longer history is stored separately. The baseline uses the transaction median when observations exist, otherwise the listing median.
- Transaction aggregation is geographic, not individual apartment matching. It does not currently filter the baseline to the subject's rooms, size or market segment. The API does not expose a set of matched individual transaction rows for a property. The UI explicitly communicates this limitation rather than inventing transaction comparables.
- `select_comparables` separately selects up to five listings. It requires the same city and market, then widens district, size and room criteria through four stages. Optional condition/building-type matches are used at the strict stage; missing attributes do not receive similarity points. Ranking is independent of asking price. The freshness cutoff is 180 days before the subject's last observation, not a promise that the sample is current today. Existing selection semantics are unchanged.
- The fair-price midpoint uses the area median alone below three comparable listings. With at least three, it blends area and listing medians with the configured weights (default 65/35), then multiplies by subject area. It does not apply independent price adjustments for floor, age, condition, parking or distance.
- Midpoint rounding uses 5,000 PLN; endpoints round outward at the same step. Base half-width is 6/10/15 percent according to confidence, widened by observed price dispersion where applicable. This is a heuristic estimate range, not a statistical confidence interval.

## Changes

`PropertyScores.fair_price_evidence` is an additive, optional API object populated at the actual calculation site. It records the selected method, baseline basis, actual median inputs and weights, number of listings used, minimum sample, subject size, range half-width, rounding step and freshness reference date. The frontend does not reconstruct weights or infer the method from a count.

The existing evidence disclosure now includes a shared explanation on both listing analysis and apartment-check results. It distinguishes model estimate, calculated area statistic and source listing prices, shows transaction dates/count/window when applicable, and exposes missing source/date/sample information. Existing comparable details retain distance, size, rooms, floor, year, condition, observed date, provenance and similarity factors.

Small samples are explicitly described as insufficient to contribute their median to the price, even though they still influence confidence. Unknown similarity and price-dispersion inputs no longer display their internal fallback factor scores as observed evidence; their status and displayed value are unknown. Backend confidence calculations remain unchanged.

No valuation formula, verdict rule, confidence threshold, selection rule or data persistence semantics changed. Default and custom weighting paths are tested. Older stored analyses remain valid with a null/missing evidence object and show a refresh explanation instead of fabricated calculation details. No migration or historical backfill is required.

## Verification

- Targeted backend suite: 164 passed, including 16 new evidence cases, scoring, comparables, market metrics, buyer decisions, submitted listings, report history and API behavior.
- Ruff passed for affected Python files; TypeScript, ESLint, build and 847 frontend smoke assertions passed during implementation.
- New browser suite: 16 passed against the locally served production build; four languages at 1440/768/390 widths, transaction aggregate, custom weights, legacy response and missing evidence. It checks console/runtime/network failures and horizontal overflow. Desktop/mobile screenshots inspected.
- Final build: all 16 evidence browser cases, 23 buyer-result regression cases and all three recovery groups passed. Recovery also checks that the manually entered apartment result displays backend calculation details.

Initial API-test collection used incompatible local environment settings; it was rerun with explicit isolated memory/test backends and passed. No persistent database was modified by this verification.

## Limits And Risks

This is an evidence/transparency improvement, not validation of market accuracy. Individual transaction matching, segment-specific transaction baselines and property-level price adjustments remain unavailable and are not claimed. The existing confidence model contains internal fallback scores for unavailable dimensions; this phase exposes the missing evidence honestly without recalibrating those scores. Freshness is relative to the subject observation; an old subject can still yield an old sample. Confidence calibration and live-data recency remain analytical limitations.

No live-portal ingestion, production deployment, production database integration, full backend suite or full historical browser-quality suite is claimed. Browser fixtures test controlled data states; local API data is demonstrational. PDF report redesign is outside this phase.

## Files

- `domarion/schemas.py`, `domarion/services/scoring.py`
- `tests/test_fair_price_evidence.py`
- `frontend/lib/api.ts`, `frontend/lib/generated-api.ts`
- `frontend/lib/fairPriceEvidenceMessages.ts`
- `frontend/components/FairPriceEvidencePanel.tsx`, `frontend/components/ComparableEvidencePanel.tsx`
- `frontend/app/globals.css`, `frontend/package.json`
- `frontend/scripts/fair-price-evidence.mjs`, `frontend/scripts/check-recovery.mjs`
- `docs/api_surface.md`
