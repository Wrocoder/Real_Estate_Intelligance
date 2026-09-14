from datetime import datetime
from decimal import Decimal

import pytest

from domarion.services.transaction_quality import price_exclusion_reason


@pytest.mark.parametrize("price", [Decimal("100"), Decimal("100000")])
def test_modern_price_review_limits_are_inclusive(price: Decimal) -> None:
    assert price_exclusion_reason(price, datetime(2026, 1, 1)) is None


@pytest.mark.parametrize("price", [Decimal("99.99"), Decimal("100000.01")])
def test_modern_price_outside_review_limits_is_excluded(price: Decimal) -> None:
    assert (
        price_exclusion_reason(price, datetime(2026, 1, 1)) == "price_per_m2_requires_source_review"
    )


@pytest.mark.parametrize("price", [Decimal("0"), Decimal("-1"), float("nan"), float("inf")])
def test_invalid_price_is_excluded_for_every_transaction_period(
    price: Decimal | float,
) -> None:
    assert price_exclusion_reason(price, datetime(1999, 1, 1)) == "invalid_price_per_m2"


def test_historical_price_is_not_compared_with_modern_pln_limits() -> None:
    assert price_exclusion_reason(Decimal("25"), datetime(1999, 12, 31)) is None
