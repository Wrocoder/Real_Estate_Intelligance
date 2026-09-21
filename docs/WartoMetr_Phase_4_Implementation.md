# Phase 4: Confidence Model

Date: 2026-09-16. Scope: explainable valuation confidence, not Phase 5 calibration.

## Contract And Compatibility

New calculations use `domarion-scoring-v2` and
`fair-price-confidence-v2`. The existing numeric score and three-value `level`
remain for older consumers. `evidence_status=insufficient` takes precedence over
`level` in the consumer UI and report snapshots. Its stored score is zero as an
explicit compatibility sentinel, not a measured zero-quality observation.

Factor scores are now nullable and factor status can be `unknown`. Consumers
must not convert unknown measurements into neutral values. Old payloads default
to confidence v1; new measurements remain absent and the UI asks for a refresh.
Existing saved reports are not recalculated or rewritten. No migration is needed.

## Measured Inputs

- Comparable count, median similarity from the existing comparison model.
- Median geographic distance and the count with known coordinates.
- Median and oldest listing age, measured from last observation, not publication.
- Area baseline age: transaction period end for transaction baselines, otherwise
  provenance update time. An update timestamp is only a freshness proxy.
- Price spread: `(max - min) / median * 100`, not a statistical confidence interval.
- Missing subject attributes: year, floor, condition, building type, latitude,
  longitude. Ground floor and zero distance are valid values, not missing data.
- Source type and demo/live provenance. This identifies documented source kinds;
  it is not independently verified source reliability or transaction matching.

Evaluation defaults to the current UTC date. Historical evaluation can explicitly
pass `evaluation_date`; the existing backtest passes the subject observation date.
This does not resolve historical area-baseline leakage or prove model accuracy.

## Deterministic Rules

Weights: sample 20, similarity 20, freshness 15, geography 15, price consistency
15, source provenance 10, completeness 5. The denominator stays 100 when inputs
are unknown, so removing evidence cannot improve the result by renormalization.

Sample support is 100 for at least five listings, 78 for three or four, 62 for
a usable area baseline, 30 for a smaller nonempty sample, otherwise unknown.
A usable baseline requires at least ten observations and a known age of 0-365 days.
Sufficient evidence requires three listings or that baseline; future dates force
insufficient status. Area observations never become matched-property counts.

Geographic support: 100 within 1 km, 75 within 3 km, otherwise 40. Freshness uses
the oldest comparable (or area baseline when no comparables): 95 through 30 days,
80 through 90, 60 through 180, otherwise 25. Price consistency support is 90 for
spread through 12%, 70 through 22%, otherwise 35. Source support is 80 for known
source kinds, 30 for demonstration data, otherwise unknown. Completeness is the
observed fraction of the six subject attributes.

Levels: high at 75+, medium at 50-74, low below 50, overridden by insufficient.
Explicit caps prevent strong-looking results despite known limitations:

- Fewer than five comparable listings: at most medium.
- Missing distances, widened selection, missing subject fields, unknown source
  kind or unknown baseline date: at most medium.
- Dispersion above 22%, evidence older than 180 days, baseline older than a year,
  unknown evidence freshness or demonstration data: at most low.
- Existing property-context caps remain in place.

These thresholds are inspectable heuristics, not empirically calibrated probabilities.
No UI displays the valuation confidence score or factor scores as percentages.

## Valuation Impact

The midpoint formula, comparable selection and price rounding are unchanged.
Range half-widths remain 6/10/15% for high/medium/low with the existing dispersion
adjustment; insufficient evidence uses 20%. These ranges are heuristic bounds,
not coverage guarantees. Changes can affect negotiation eligibility and verdicts.

Measured local demo comparison for `wr-001`: midpoint stays 700,000 PLN; range
changes from 595,000-805,000 to 560,000-840,000; old confidence 49 becomes
insufficient (one comparable, unknown baseline date). This is a compatibility
check, not market validation.

## UI And Verification

The decision overview and expandable evidence use HIGH / MEDIUM / LOW /
INSUFFICIENT labels in Polish, English, Russian and Ukrainian. Evidence shows
actual measurements, unknown states and translated limitations. Saved report
summaries preserve the explicit confidence level. Text and HTML valuation
summaries no longer express confidence as a score out of 100.

Automated coverage includes fresh complete samples, medium samples, missing
attributes, valid zeros, stale/future evidence, no evidence, transaction counts,
demo provenance, unknown sources, dispersion and legacy payloads. Browser checks
cover four levels in all four locales at 1440 and 390 px; valuation evidence also
has 768 px coverage. Screenshots were visually inspected on desktop and mobile.

Final local checks: 539 backend tests passed, one skipped; Ruff and frontend
lint/typecheck/build passed; 847 smoke assertions passed. Browser suites passed
32 confidence cases, 16 valuation-evidence cases, 23 buyer-result cases and three
check/retry scenarios. Tests use isolated in-memory stores and explicit fixtures,
not a production database or proof of real-market accuracy.

Not verified: production database migration/deployment (none requested), live
market accuracy, probability calibration, historical leakage remediation, or
independent source-quality validation. Existing generated report templates still
contain mixed-language legacy content; full report localization is outside this phase.
