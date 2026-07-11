from domarion.schemas import (
    MortgageAffordability,
    MortgageCalculationRequest,
    MortgageCalculationResult,
    MortgageCostBreakdown,
    MortgageScenario,
)

MORTGAGE_DISCLAIMER = (
    "Szacunek techniczny do wstępnego budżetowania. To nie jest oferta kredytowa, "
    "rekomendacja finansowa ani decyzja banku."
)


def calculate_mortgage(payload: MortgageCalculationRequest) -> MortgageCalculationResult:
    if payload.down_payment_pln > payload.property_price_pln:
        raise ValueError("down_payment_pln cannot exceed property_price_pln")

    loan_amount = payload.property_price_pln - payload.down_payment_pln
    down_payment_pct = _ratio_pct(payload.down_payment_pln, payload.property_price_pln)
    loan_to_value_pct = _ratio_pct(loan_amount, payload.property_price_pln)
    pcc_tax = _calculate_pcc_tax(payload)
    bank_commission = round(loan_amount * payload.bank_commission_pct / 100)
    agent_commission = round(payload.property_price_pln * payload.agent_commission_pct / 100)
    upfront_cash_needed = (
        payload.down_payment_pln
        + pcc_tax
        + payload.notary_fee_pln
        + payload.court_fees_pln
        + bank_commission
        + agent_commission
        + payload.renovation_budget_pln
    )

    costs = MortgageCostBreakdown(
        property_price_pln=payload.property_price_pln,
        down_payment_pln=payload.down_payment_pln,
        down_payment_pct=down_payment_pct,
        loan_amount_pln=loan_amount,
        loan_to_value_pct=loan_to_value_pct,
        pcc_tax_pln=pcc_tax,
        notary_fee_pln=payload.notary_fee_pln,
        court_fees_pln=payload.court_fees_pln,
        bank_commission_pln=bank_commission,
        agent_commission_pln=agent_commission,
        renovation_budget_pln=payload.renovation_budget_pln,
        upfront_cash_needed_pln=upfront_cash_needed,
    )

    scenario_rates = [
        ("base", "Bazowy scenariusz", payload.annual_interest_rate_pct),
        ("rate_plus_2pp", "Stopa +2 pp", payload.annual_interest_rate_pct + 2),
        ("rate_minus_1pp", "Stopa -1 pp", max(payload.annual_interest_rate_pct - 1, 0)),
    ]
    scenarios = [
        _build_scenario(
            payload,
            loan_amount=loan_amount,
            scenario_code=code,
            label=label,
            annual_interest_rate_pct=rate,
        )
        for code, label, rate in scenario_rates
    ]
    base_scenario = scenarios[0]
    affordability = _build_affordability(payload, base_scenario)

    return MortgageCalculationResult(
        costs=costs,
        base_scenario=base_scenario,
        scenarios=scenarios,
        affordability=affordability,
        notes=_build_notes(payload, costs, affordability),
        disclaimer=MORTGAGE_DISCLAIMER,
    )


def _calculate_pcc_tax(payload: MortgageCalculationRequest) -> int:
    if not payload.include_pcc or payload.market_type != "secondary":
        return 0
    return round(payload.property_price_pln * 0.02)


def _build_scenario(
    payload: MortgageCalculationRequest,
    *,
    loan_amount: int,
    scenario_code: str,
    label: str,
    annual_interest_rate_pct: float,
) -> MortgageScenario:
    monthly_principal_interest = _monthly_payment(
        principal=loan_amount,
        annual_interest_rate_pct=annual_interest_rate_pct,
        loan_years=payload.loan_years,
    )
    monthly_total_payment = (
        monthly_principal_interest
        + payload.insurance_monthly_pln
        + payload.monthly_housing_costs_pln
    )
    loan_months = payload.loan_years * 12
    total_repaid = monthly_principal_interest * loan_months
    total_interest = max(total_repaid - loan_amount, 0)
    debt_to_income_pct = None
    if payload.monthly_income_pln:
        debt_to_income_pct = _ratio_pct(
            payload.monthly_existing_debt_pln + monthly_total_payment,
            payload.monthly_income_pln,
        )

    return MortgageScenario(
        scenario_code=scenario_code,
        label=label,
        annual_interest_rate_pct=round(annual_interest_rate_pct, 2),
        loan_years=payload.loan_years,
        monthly_principal_interest_pln=monthly_principal_interest,
        monthly_total_payment_pln=monthly_total_payment,
        total_interest_pln=total_interest,
        total_repaid_pln=total_repaid,
        debt_to_income_pct=debt_to_income_pct,
    )


def _monthly_payment(*, principal: int, annual_interest_rate_pct: float, loan_years: int) -> int:
    if principal <= 0:
        return 0

    loan_months = loan_years * 12
    monthly_rate = annual_interest_rate_pct / 100 / 12
    if monthly_rate == 0:
        return round(principal / loan_months)

    factor = (1 + monthly_rate) ** loan_months
    return round(principal * monthly_rate * factor / (factor - 1))


def _build_affordability(
    payload: MortgageCalculationRequest,
    base_scenario: MortgageScenario,
) -> MortgageAffordability:
    if payload.monthly_income_pln is None:
        return MortgageAffordability(status="unknown")

    comfortable_limit = round(payload.monthly_income_pln * 0.35)
    stretched_limit = round(payload.monthly_income_pln * 0.45)
    available_comfortable = comfortable_limit - payload.monthly_existing_debt_pln
    available_stretched = stretched_limit - payload.monthly_existing_debt_pln
    base_debt_to_income_pct = base_scenario.debt_to_income_pct or 0
    payment_to_income_pct = _ratio_pct(
        base_scenario.monthly_total_payment_pln,
        payload.monthly_income_pln,
    )
    monthly_buffer = (
        payload.monthly_income_pln
        - payload.monthly_existing_debt_pln
        - base_scenario.monthly_total_payment_pln
    )

    if base_debt_to_income_pct <= 35:
        status = "comfortable"
    elif base_debt_to_income_pct <= 45:
        status = "stretched"
    else:
        status = "high_risk"

    return MortgageAffordability(
        status=status,
        monthly_income_pln=payload.monthly_income_pln,
        available_for_mortgage_comfortable_pln=max(available_comfortable, 0),
        available_for_mortgage_stretched_pln=max(available_stretched, 0),
        base_debt_to_income_pct=base_debt_to_income_pct,
        payment_to_income_pct=payment_to_income_pct,
        monthly_buffer_after_payment_pln=monthly_buffer,
    )


def _build_notes(
    payload: MortgageCalculationRequest,
    costs: MortgageCostBreakdown,
    affordability: MortgageAffordability,
) -> list[str]:
    notes: list[str] = []
    if costs.down_payment_pct < 10:
        notes.append("Wkład własny jest poniżej typowego minimum 10%.")
    elif costs.down_payment_pct < 20:
        notes.append("Wkład własny jest poniżej 20%; bank może wymagać dodatkowego ubezpieczenia.")

    if payload.market_type == "secondary" and payload.include_pcc:
        notes.append("Dla rynku wtórnego uwzględniono podatek PCC 2%.")

    if payload.rate_type == "variable":
        notes.append("Zmienna stopa zwiększa ryzyko wzrostu raty; sprawdź scenariusz +2 pp.")

    if affordability.status == "stretched":
        notes.append("Relacja raty i długów do dochodu jest podwyższona.")
    elif affordability.status == "high_risk":
        notes.append("Relacja raty i długów do dochodu przekracza konserwatywny próg 45%.")

    if not notes:
        notes.append("Parametry mieszczą się w konserwatywnych progach wstępnej analizy.")
    return notes


def _ratio_pct(numerator: int | float, denominator: int | float) -> float:
    if denominator == 0:
        return 0.0
    return round(float(numerator) / float(denominator) * 100, 2)
