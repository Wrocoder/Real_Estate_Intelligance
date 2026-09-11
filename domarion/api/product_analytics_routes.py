from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from domarion.auth import CurrentAccountDep
from domarion.product_analytics_store import ProductAnalyticsStore
from domarion.product_analytics_store.factory import get_product_analytics_store
from domarion.schemas import ProductEventAccepted, ProductEventCreate, ProductFunnelSummary
from domarion.services.product_analytics import (
    build_product_funnel_summary,
    validate_product_event,
)

router = APIRouter(prefix="/api/v1", tags=["product-analytics"])
ProductAnalyticsStoreDep = Annotated[
    ProductAnalyticsStore,
    Depends(get_product_analytics_store),
]


@router.post(
    "/product-events",
    response_model=ProductEventAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
def record_product_event(
    payload: ProductEventCreate,
    store: ProductAnalyticsStoreDep,
) -> ProductEventAccepted:
    try:
        validate_product_event(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_product_event"},
        ) from exc
    store.record_event(payload, datetime.now(UTC).replace(tzinfo=None))
    return ProductEventAccepted(event_name=payload.event_name)


@router.get("/admin/product-funnel", response_model=ProductFunnelSummary)
def get_product_funnel(
    account: CurrentAccountDep,
    store: ProductAnalyticsStoreDep,
    days: Annotated[int, Query(ge=1, le=90)] = 30,
) -> ProductFunnelSummary:
    if account.user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return build_product_funnel_summary(store, window_days=days)
