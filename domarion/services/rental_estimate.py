from __future__ import annotations

from domarion.schemas import (
    Listing,
    ListingRentalEstimate,
    MortgageCalculationRequest,
    PropertyScores,
    RentalCashflowScenario,
)
from domarion.services.mortgage import calculate_mortgage

RENTAL_ESTIMATE_METHODOLOGY_NOTE = (
    "Rental estimate is a deterministic MVP heuristic for screening. It is based on "
    "property price, rental potential score, location signals and conservative financing "
    "assumptions. Verify real rent comparables, fees, taxes and vacancy before investing."
)


def build_listing_rental_estimate(
    listing: Listing,
    scores: PropertyScores,
    *,
    comparable_count: int = 0,
) -> ListingRentalEstimate:
    gross_yield_pct = _estimate_gross_yield_pct(listing, scores)
    monthly_rent_mid = round(listing.price * gross_yield_pct / 100 / 12)
    monthly_rent_low = round(monthly_rent_mid * 0.9)
    monthly_rent_high = round(monthly_rent_mid * 1.1)
    vacancy_rate_pct = _vacancy_rate_pct(scores.rental_potential_score)
    vacancy_loss = round(monthly_rent_mid * vacancy_rate_pct / 100)
    operating_costs = _operating_costs_monthly(listing, monthly_rent_mid)
    net_operating_income = monthly_rent_mid - vacancy_loss - operating_costs
    confidence_score = _confidence_score(
        listing=listing,
        scores=scores,
        comparable_count=comparable_count,
    )

    return ListingRentalEstimate(
        listing_id=listing.id,
        monthly_rent_low_pln=monthly_rent_low,
        monthly_rent_mid_pln=monthly_rent_mid,
        monthly_rent_high_pln=monthly_rent_high,
        rent_per_m2_mid_pln=round(monthly_rent_mid / listing.area_m2),
        gross_yield_pct=gross_yield_pct,
        vacancy_rate_pct=vacancy_rate_pct,
        operating_costs_monthly_pln=operating_costs,
        net_operating_income_monthly_pln=net_operating_income,
        confidence_score=confidence_score,
        cashflow_scenarios=_cashflow_scenarios(
            listing=listing,
            monthly_rent=monthly_rent_mid,
            vacancy_loss=vacancy_loss,
            operating_costs=operating_costs,
            gross_yield_pct=gross_yield_pct,
        ),
        assumptions=_assumptions(listing, scores),
        risk_notes=_risk_notes(listing, scores, confidence_score),
        methodology_note=RENTAL_ESTIMATE_METHODOLOGY_NOTE,
    )


def _estimate_gross_yield_pct(listing: Listing, scores: PropertyScores) -> float:
    estimate = 4.0 + (scores.rental_potential_score - 50) * 0.035
    estimate -= max(scores.price_delta_to_fair_mid_pct, 0) * 0.015
    if listing.nearest_stop_m <= 300:
        estimate += 0.25
    if listing.distance_to_center_km <= 4:
        estimate += 0.2
    if listing.planned_investments_within_2km > 0:
        estimate += 0.15
    if scores.risk_score >= 60:
        estimate -= 0.2
    return round(min(max(estimate, 2.5), 6.5), 1)


def _vacancy_rate_pct(rental_potential_score: int) -> float:
    if rental_potential_score >= 70:
        return 5.0
    if rental_potential_score >= 55:
        return 7.0
    return 10.0


def _operating_costs_monthly(listing: Listing, monthly_rent: int) -> int:
    maintenance_reserve = round(listing.area_m2 * 8)
    management_reserve = round(monthly_rent * 0.08)
    furnishing_reserve = round(monthly_rent * 0.04)
    return maintenance_reserve + management_reserve + furnishing_reserve


def _cashflow_scenarios(
    *,
    listing: Listing,
    monthly_rent: int,
    vacancy_loss: int,
    operating_costs: int,
    gross_yield_pct: float,
) -> list[RentalCashflowScenario]:
    cash_purchase = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=listing.price,
            market_type=listing.market_type,
        )
    )
    financed = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=round(listing.price * 0.2),
            loan_years=25,
            annual_interest_rate_pct=7.5,
            rate_type="variable",
            market_type=listing.market_type,
        )
    )
    return [
        _cashflow_scenario(
            code="cash_purchase",
            label="Cash purchase, before tax",
            monthly_rent=monthly_rent,
            vacancy_loss=vacancy_loss,
            operating_costs=operating_costs,
            mortgage_payment=0,
            cash_invested=cash_purchase.costs.upfront_cash_needed_pln,
            gross_yield_pct=gross_yield_pct,
        ),
        _cashflow_scenario(
            code="financed_80_ltv",
            label="80% LTV, 25y, 7.5% rate, before tax",
            monthly_rent=monthly_rent,
            vacancy_loss=vacancy_loss,
            operating_costs=operating_costs,
            mortgage_payment=financed.base_scenario.monthly_total_payment_pln,
            cash_invested=financed.costs.upfront_cash_needed_pln,
            gross_yield_pct=gross_yield_pct,
        ),
    ]


def _cashflow_scenario(
    *,
    code: str,
    label: str,
    monthly_rent: int,
    vacancy_loss: int,
    operating_costs: int,
    mortgage_payment: int,
    cash_invested: int,
    gross_yield_pct: float,
) -> RentalCashflowScenario:
    net_cashflow_monthly = monthly_rent - vacancy_loss - operating_costs - mortgage_payment
    annual_net_cashflow = net_cashflow_monthly * 12
    net_yield_on_cash_pct = (
        round(annual_net_cashflow / cash_invested * 100, 2) if cash_invested else 0
    )
    return RentalCashflowScenario(
        code=code,
        label=label,
        monthly_rent_pln=monthly_rent,
        vacancy_loss_pln=vacancy_loss,
        operating_costs_pln=operating_costs,
        mortgage_payment_pln=mortgage_payment,
        net_cashflow_monthly_pln=net_cashflow_monthly,
        annual_net_cashflow_pln=annual_net_cashflow,
        cash_invested_pln=cash_invested,
        gross_yield_pct=gross_yield_pct,
        net_yield_on_cash_pct=net_yield_on_cash_pct,
    )


def _confidence_score(
    *,
    listing: Listing,
    scores: PropertyScores,
    comparable_count: int,
) -> int:
    value = (
        listing.data_quality_score * 0.45
        + scores.fair_price_confidence_score * 0.25
        + min(comparable_count, 5) * 6
    )
    if scores.rental_potential_score >= 60:
        value += 8
    return round(min(max(value, 0), 100))


def _assumptions(listing: Listing, scores: PropertyScores) -> list[str]:
    return [
        "Rent range uses MVP rental-potential heuristic, not live rental comparables.",
        "Cashflow is before income tax, depreciation/accounting effects and one-off repairs.",
        "Financed scenario assumes 20% down, 25 years and 7.5% annual variable rate.",
        f"Rental Potential Score: {scores.rental_potential_score}/100.",
        f"Transport input: nearest stop {listing.nearest_stop_m} m.",
    ]


def _risk_notes(
    listing: Listing,
    scores: PropertyScores,
    confidence_score: int,
) -> list[str]:
    notes: list[str] = []
    if confidence_score < 65:
        notes.append("Rental estimate confidence is limited; verify real rent comparables.")
    if scores.rental_potential_score < 55:
        notes.append("Rental potential is not strong enough to rely on rent as the main thesis.")
    if listing.nearest_stop_m > 800:
        notes.append("Weak transport can increase vacancy and reduce rent resilience.")
    if scores.price_delta_to_fair_mid_pct > 7:
        notes.append("Higher entry price pressures yield and cashflow.")
    return notes or ["No major rental-specific warning in current MVP data."]
