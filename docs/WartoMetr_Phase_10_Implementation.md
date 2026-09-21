# WartoMetr Phase 10 Implementation

Date: 2026-09-22

## Scope

Phase 10 adds commercial support for a consumer-facing `3 Apartment Pack`.
The pack reuses the existing paid order, payment confirmation, fulfillment and
report-credit mechanics instead of introducing a new billing subsystem.

## Implemented

- Added report product `apartment_pack_3` with default price `9900` grosz.
- Added configurable env setting `APARTMENT_PACK_3_AMOUNT_GROSZ`.
- Added bundle reference `bundle:apartment-pack-3`.
- Fulfillment grants 3 report credits and stores a paid receipt report.
- Credit balance calculation now supports multiple fulfilled bundle products.
- Pricing UI displays the pack next to the single Buyer Report and allows pack
  purchase without a selected apartment.
- Existing `report_bundle_5` remains backward-compatible.

## Product Behavior

The intended buyer flow is:

```text
Buy 3 Apartment Pack
→ analyze apartment A
→ analyze apartment B
→ analyze apartment C
→ compare saved reports
```

The pack does not change valuation, verdict, confidence, negotiation or
comparison semantics. It only changes paid access to additional Buyer Report
generation after the monthly subscription allowance is exhausted.

## Verification Notes

Automated coverage should include:

- report product list exposes `apartment_pack_3`;
- pack price follows `APARTMENT_PACK_3_AMOUNT_GROSZ`;
- mock checkout and fulfillment grant 3 credits;
- generated receipt report uses `bundle:apartment-pack-3` and
  `report_product_code=apartment_pack_3`;
- credits are consumed by subsequent Buyer Report generation.

Real payment-provider sandbox/live execution remains an external release gate.
