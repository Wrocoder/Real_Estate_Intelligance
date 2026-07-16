# Data Governance Retention Policy

## Scope

This policy covers source registry retention settings, raw ingestion payload pruning, and data deletion request handling.

## Source-Specific Retention

Every ingestion source can define:

- `raw_payload_retention_days`: how long raw source payloads can be retained for QA/debugging.
- `private_url_retention_days`: how long private user-submitted source URLs can be retained.
- `retention_notes`: legal/product notes explaining the retention basis.

If `raw_payload_retention_days` is not set, automatic raw payload pruning is disabled for that source until legal/product ownership defines a policy.

## Raw Payload Pruning

Admin endpoint:

`POST /api/v1/admin/ingestion/sources/prune-retained-raw-payloads`

Default mode is `dry_run=true`. When applied with `dry_run=false`, the job replaces expired `raw_listings.raw_payload` with a minimal retention marker:

- `retention_pruned`
- `pruned_at`
- `source_name`
- `raw_payload_retention_days`
- `original_payload_hash`

The job does not delete normalized properties, snapshots, price history, reports, or scoring outputs.

## User-Submitted URL References

User-submitted source URLs are private references. They are not displayed publicly, indexed for SEO, exported in public reports, or used for scheduled crawling without source-specific legal approval.

The system source `User Submitted Private References` uses:

- `raw_payload_retention_days=30`
- `private_url_retention_days=30`

User drafts still also keep their per-draft `retention_days` and can be pruned with the existing draft prune endpoint.

## Data Deletion Requests

Admin endpoints:

- `POST /api/v1/admin/data-deletion-requests`
- `GET /api/v1/admin/data-deletion-requests`
- `POST /api/v1/admin/data-deletion-requests/{request_id}/process`

Requests are stored with target, source metadata, status, requester, processor, timestamps, action summary, and result payload.

The process endpoint can directly delete `user_submitted_draft` targets when `target_owner_id` is provided. Other target types are recorded as manual or not-yet-supported execution targets until a dedicated delete API exists for them.
