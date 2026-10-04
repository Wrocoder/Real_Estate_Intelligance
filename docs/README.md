# Documentation Index

Reviewed: 2026-10-03. This index distinguishes maintained references, proposed
work and historical evidence. A document's presence does not prove deployment,
market accuracy or production readiness.

## Start Here

- [Repository setup and commands](../README.md)
- [Project rules](../AGENTS.md)
- [Current transformation roadmap](WartoMetr_Product_Transformation_Master_Prompt.md)
- [Current readiness audit](current_readiness_audit_2026-10-03.md)
- [Frontend route map](frontend_route_product_map.md)
- [API surface](api_surface.md); running OpenAPI is authoritative for schemas.

Use the current transformation roadmap for implementation order. Older product
prompts, broad analytics concepts and completed checklists have been removed;
their committed versions remain in Git history. Do not use historical test
counts or readiness verdicts as evidence for the current working tree.

## Implementation Evidence

- [Phase 0 audit](WartoMetr_Phase_0_Audit.md): baseline and unresolved findings.
- [Phase 1](WartoMetr_Phase_1_Implementation.md): apartment-check entry.
- [Phase 2](WartoMetr_Phase_2_Implementation.md): decision-first result.
- [Phase 3](WartoMetr_Phase_3_Implementation.md): valuation evidence and limits.
- [Phase 4](WartoMetr_Phase_4_Implementation.md): measured confidence and insufficient evidence.
- [Phase 5](WartoMetr_Phase_5_Implementation.md): temporal transaction holdout backtesting.
- [Phase 6](WartoMetr_Phase_6_Implementation.md): public methodology and trust page.
- [Phase 7](WartoMetr_Phase_7_Implementation.md): commercial Buyer Report.
- [Phase 8](WartoMetr_Phase_8_Implementation.md): real payment validation.
- [Phase 9](WartoMetr_Phase_9_Implementation.md): apartment comparison workflow.
- [Phase 10](WartoMetr_Phase_10_Implementation.md): 3 Apartment Pack commercial support.
- [Phase 11](WartoMetr_Phase_11_Implementation.md): before-viewing assistant.
- [Phase 12](WartoMetr_Phase_12_Implementation.md): after-viewing workflow.
- [Phase 13](WartoMetr_Phase_13_Implementation.md): negotiation assistant.
- [Phase 14](WartoMetr_Phase_14_Implementation.md): saved-apartment monitoring.
- [Phase 15](WartoMetr_Phase_15_Implementation.md): buyer due-diligence workspace.
- [Phase 16](WartoMetr_Phase_16_Implementation.md): private document-analysis first slice.
- [Phase 17](WartoMetr_Phase_17_Implementation.md): privacy-safe product analytics and outcome tracking.
- [Phase 18](WartoMetr_Phase_18_Implementation.md): Wrocław-first validation and area-to-check acquisition path.
- [Phase 19](WartoMetr_Phase_19_Implementation.md): area acquisition evidence summary and city-preserving search path.
- [Phase 20](WartoMetr_Phase_20_Implementation.md): buyer-result trust boundary preview.
- [Phase 21](WartoMetr_Phase_21_Implementation.md): privacy-safe buyer outcome prompt hardening.
- [Phase 22](WartoMetr_Phase_22_Implementation.md): isolated browser verification for the buyer outcome prompt.
- [Phase 23](WartoMetr_Phase_23_Implementation.md): focused apartment-check browser QA scenarios.
- [Phase 24](WartoMetr_Phase_24_Implementation.md): full apartment-check browser QA verification.
- [Phase 25](WartoMetr_Phase_25_Implementation.md): privacy-safe admin buyer decision funnel metrics.
- [Phase 26](WartoMetr_Phase_26_Implementation.md): browser verification for the admin buyer decision funnel.
- [Phase 27](WartoMetr_Phase_27_Implementation.md): maintained browser release gate for buyer and aggregate admin checks.
- [Phase 28](WartoMetr_Phase_28_Implementation.md): deterministic memory stores for CI browser gates.
- [Phase 29](WartoMetr_Phase_29_Implementation.md): separated public and internal frontend browser gates in CI.
- [Phase 30](WartoMetr_Phase_30_Implementation.md): focused browser scenario for apartment comparison decisions.
- [Phase 31](WartoMetr_Phase_31_Implementation.md): focused browser scenario for provenance and evidence surfaces.
- [Phase 32](WartoMetr_Phase_32_Implementation.md): focused browser scenario for buyer action plans.
- [Phase 33](WartoMetr_Phase_33_Implementation.md): focused browser scenario for available negotiation guidance.
- [Phase 34](WartoMetr_Phase_34_Implementation.md): focused browser scenario for listing decision hierarchy.
- [Phase 35](WartoMetr_Phase_35_Implementation.md): focused browser scenario for score explainability.
- [Phase 36](WartoMetr_Phase_36_Implementation.md): focused browser scenario for rental evidence.
- [Phase 37](WartoMetr_Phase_37_Implementation.md): focused browser scenario for check flow states.

These are dated verification records, not independent roadmaps. Later phase
reports supersede earlier descriptions of the affected workflows. Phase 37 and
later work is governed by the current roadmap, not implied complete here.

## Runtime And Operations

- [Deployment and CI](deployment.md)
- [Local database and session troubleshooting](local_runtime.md)
- [OCI staging setup](oci_staging_setup_runbook.md)
- [Production operations](production_ops_runbook.md)
- [Source compliance](source_compliance_policy.md)
- [Retention and deletion](data_governance_retention.md)
- [Partner onboarding](partner_onboarding.md)

OCI instructions replace the original migration/hosting plans. The inactive
Render fallback is still described in deployment.md and implemented by
../render.yaml; deleting an old planning document does not retire that config.

## Data And Product Contracts

- [User-provided listing analysis](hybrid_listing_analysis.md)
- [Developer reputation](developer_reputation_plan.md)
- [Authorized listing feeds](product/AUTHORIZED_LISTING_FEED_CONTRACT.md)
- [RCN transaction ingestion](product/RCN_TRANSACTION_INGESTION.md)
- [Rental observations](product/RENTAL_OBSERVATION_INGESTION.md)
- [Product analytics](product/PRODUCT_ANALYTICS.md)

## Proposals And Commercial Work

These describe proposed work or validation procedures, not current feature
availability, current pricing or approval to change the implementation order.

- [Document-upload design](document_upload_due_diligence_plan.md): guardrails
  and later-slice design for document analysis beyond the implemented Phase 16
  metadata/text-first screening.
- [City expansion checklist](poland_city_expansion_checklist.md): retained
  data-source and rollout gates, not a current geographic coverage inventory.
- [Validation strategy](product_validation_strategy.md): dated hypotheses.
- [Paid beta playbook](paid_beta_playbook.md): operating proposal.
- [Market-data pipeline audit](product/DOMARION_REAL_MARKET_DATA_PIPELINE.md):
  historical implementation plan; use ingestion contracts for current behavior.

## Historical Operational Evidence

- [Readiness audit, 2026-09-01](production_readiness_audit_2026-09-01.md)
- [OCI RCN verification, 2026-09-13](operations/ORACLE_RCN_VERIFICATION_2026-09-13.md)

Keep unresolved gates until newer evidence closes them: real payment-provider
sandbox/live checkout execution, offsite backup and restore, private artifact
recovery, real notification delivery and worker cadence, monitoring,
source/legal approval and manual paid-report QA. Local tests do not close these
gates. The dated audits do not establish today's deployment state.

## Repository Hygiene

Generated browser screenshots, test exports and local run logs belong in ignored
artifacts directories. Do not remove source datasets, migrations, lockfiles,
deployment manifests, active runtime data or local secrets as documentation
cleanup. The root july.py scratch file is not the authoritative migration chain;
the maintained migrations live in ../alembic/versions/.
