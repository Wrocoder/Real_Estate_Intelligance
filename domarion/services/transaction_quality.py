"""Conservative source screening, not a market valuation or price correction."""

from datetime import datetime
from decimal import Decimal

MODERN_TRANSACTION_YEAR = 2000
MIN_REVIEWED_PRICE_PER_M2 = Decimal("100")
MAX_REVIEWED_PRICE_PER_M2 = Decimal("100000")


def price_exclusion_reason(
    price_per_m2: Decimal | float,
    transaction_date: datetime,
) -> str | None:
    price = Decimal(str(price_per_m2))
    if not price.is_finite() or price <= 0:
        return "invalid_price_per_m2"
    # These wide review limits only apply to modern PLN, not historical currencies.
    if transaction_date.year >= MODERN_TRANSACTION_YEAR and not (
        MIN_REVIEWED_PRICE_PER_M2 <= price <= MAX_REVIEWED_PRICE_PER_M2
    ):
        return "price_per_m2_requires_source_review"
    return None
