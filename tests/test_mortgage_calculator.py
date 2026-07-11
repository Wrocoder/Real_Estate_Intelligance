from fastapi.testclient import TestClient

from domarion.main import app
from domarion.schemas import MortgageCalculationRequest
from domarion.services.mortgage import calculate_mortgage

client = TestClient(app)


def test_mortgage_calculator_builds_total_cost_and_affordability() -> None:
    result = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=600_000,
            down_payment_pln=120_000,
            loan_years=20,
            annual_interest_rate_pct=0,
            monthly_income_pln=10_000,
            monthly_existing_debt_pln=500,
            monthly_housing_costs_pln=600,
            insurance_monthly_pln=300,
            renovation_budget_pln=20_000,
        )
    )

    assert result.costs.loan_amount_pln == 480_000
    assert result.costs.down_payment_pct == 20
    assert result.costs.pcc_tax_pln == 12_000
    assert result.costs.upfront_cash_needed_pln == 157_400
    assert result.base_scenario.monthly_principal_interest_pln == 2_000
    assert result.base_scenario.monthly_total_payment_pln == 2_900
    assert result.affordability.status == "comfortable"
    assert result.affordability.base_debt_to_income_pct == 34
    assert (
        result.scenarios[1].monthly_total_payment_pln
        > result.base_scenario.monthly_total_payment_pln
    )


def test_mortgage_calculator_skips_pcc_for_primary_market() -> None:
    result = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=700_000,
            down_payment_pln=140_000,
            market_type="primary",
        )
    )

    assert result.costs.pcc_tax_pln == 0
    assert result.affordability.status == "unknown"


def test_mortgage_calculator_api_rejects_down_payment_above_price() -> None:
    response = client.post(
        "/api/v1/mortgage/calculate",
        json={
            "property_price_pln": 500_000,
            "down_payment_pln": 600_000,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "down_payment_pln cannot exceed property_price_pln"


def test_mortgage_calculator_api_returns_scenarios() -> None:
    response = client.post(
        "/api/v1/mortgage/calculate",
        json={
            "property_price_pln": 800_000,
            "down_payment_pln": 160_000,
            "loan_years": 25,
            "annual_interest_rate_pct": 7.2,
            "rate_type": "variable",
            "monthly_income_pln": 13_000,
            "monthly_existing_debt_pln": 800,
            "monthly_housing_costs_pln": 700,
            "insurance_monthly_pln": 120,
            "bank_commission_pct": 1,
            "agent_commission_pct": 2,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["costs"]["loan_amount_pln"] == 640_000
    assert payload["costs"]["bank_commission_pln"] == 6_400
    assert payload["costs"]["agent_commission_pln"] == 16_000
    assert [scenario["scenario_code"] for scenario in payload["scenarios"]] == [
        "base",
        "rate_plus_2pp",
        "rate_minus_1pp",
    ]
    assert payload["base_scenario"]["debt_to_income_pct"] is not None
    assert "oferta kredytowa" in payload["disclaimer"]
