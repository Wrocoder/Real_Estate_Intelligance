# WartoMetr Phase 14 Implementation

Date: 2026-09-23

## Scope

Phase 14 makes saved apartments more useful after the initial check by surfacing
existing object-watch monitoring signals on the My apartments page.

This phase does not add new scraping, change fair-price calculations or change
alert trigger semantics.

## Implemented

- My apartments now loads active object-watch alerts and their preview events.
- Saved apartment cards show a monitoring section with:
  - whether tracking is active, paused or not enabled;
  - meaningful detected changes from `watch_events`;
  - a clear no-change state when no trigger fired;
  - a clear unavailable state when monitoring preview could not be checked.
- Tracking a saved apartment immediately fetches the new alert preview and
  updates the card in place.
- Checked private drafts are matched to draft object watches first, then to a
  listing watch fallback when present.
- Favorite listings are matched to listing object watches.

## Data Integrity

Monitoring content is derived from backend `AlertPreview.watch_events`.

The UI does not fabricate changes, prices, comparable listings or fair-value
movement. Private user-submitted draft watches keep the existing backend
limitation: WartoMetr does not re-crawl a private portal URL.

## Verification Notes

Verified:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `BROWSER_QUALITY_SCENARIO=saved-monitoring npm run browser:quality` against
  local frontend plus local memory/demo API on `127.0.0.1:8010`.
