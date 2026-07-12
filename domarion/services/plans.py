from domarion.schemas import PlanLimits, SubscriptionPlan

PLAN_LIMITS: dict[SubscriptionPlan, PlanLimits] = {
    "free": PlanLimits(
        plan="free",
        max_favorites=5,
        max_alerts=2,
        monthly_reports=1,
        max_compare_items=2,
        can_export=False,
        can_use_api=False,
        can_white_label=False,
    ),
    "buyer_pro": PlanLimits(
        plan="buyer_pro",
        max_favorites=50,
        max_alerts=10,
        monthly_reports=20,
        max_compare_items=5,
        can_export=False,
        can_use_api=False,
        can_white_label=False,
    ),
    "investor": PlanLimits(
        plan="investor",
        max_favorites=150,
        max_alerts=40,
        monthly_reports=60,
        max_compare_items=5,
        can_export=True,
        can_use_api=False,
        can_white_label=False,
    ),
    "realtor": PlanLimits(
        plan="realtor",
        max_favorites=250,
        max_alerts=50,
        monthly_reports=100,
        max_compare_items=5,
        can_export=True,
        can_use_api=False,
        can_white_label=True,
    ),
    "agency": PlanLimits(
        plan="agency",
        max_favorites=1000,
        max_alerts=250,
        monthly_reports=500,
        max_compare_items=5,
        can_export=True,
        can_use_api=True,
        can_white_label=True,
    ),
    "enterprise": PlanLimits(
        plan="enterprise",
        max_favorites=5000,
        max_alerts=1000,
        monthly_reports=5000,
        max_compare_items=5,
        can_export=True,
        can_use_api=True,
        can_white_label=True,
    ),
}


def get_plan_limits(plan: SubscriptionPlan) -> PlanLimits:
    return PLAN_LIMITS[plan]


def list_plan_limits() -> list[PlanLimits]:
    return list(PLAN_LIMITS.values())
