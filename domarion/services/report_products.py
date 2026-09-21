from domarion.core.config import get_settings
from domarion.schemas import ReportProduct, ReportProductCode


def _report_products() -> dict[ReportProductCode, ReportProduct]:
    settings = get_settings()
    return {
        "object_report": ReportProduct(
            code="object_report",
            title="Buyer Report",
            audience="buyer",
            amount_grosz=settings.buyer_report_amount_grosz,
            currency="PLN",
            description=(
                "Decision report for one apartment: fair-price range, comparables, "
                "risk analysis, negotiation strategy and due-diligence checklist."
            ),
            features=[
                "BUY / NEGOTIATE / SKIP verdict with explanation",
                "Detailed fair-price range, confidence and comparable evidence",
                "Negotiation range, opening offer and maximum reasonable price",
                "Total purchase cost, risk checks and downloadable report",
            ],
        ),
        "full_object_analysis": ReportProduct(
            code="full_object_analysis",
            title="Extended Buyer Report",
            audience="buyer",
            amount_grosz=14900,
            currency="PLN",
            description=(
                "Backward-compatible extended report for deeper beta checks before "
                "reservation or deposit."
            ),
            features=[
                "Everything from Buyer Report",
                "Full due-diligence checklist and critical unknowns",
                "Total acquisition cost with renovation/furniture context",
                "Comparable alternatives and negotiation script",
            ],
        ),
        "investor_report": ReportProduct(
            code="investor_report",
            title="Investor Report",
            audience="investor",
            amount_grosz=19900,
            currency="PLN",
            description=(
                "Инвестиционный отчет: доходность, ликвидность, upside/risk "
                "и альтернативы."
            ),
            features=[
                "Rental Potential Score",
                "Liquidity Score",
                "Hidden-gem аргументы",
                "Инвестиционный вывод без финансовой рекомендации",
            ],
        ),
        "area_report": ReportProduct(
            code="area_report",
            title="Area Market Report",
            audience="realtor",
            amount_grosz=7900,
            currency="PLN",
            description=(
                "Платный отчет по району: динамика цен, ликвидность, "
                "спрос/предложение и market indices."
            ),
            features=[
                "Median and average PLN/m2",
                "Liquidity, buyer/seller and overheated indices",
                "Supply and price movement 90d",
                "Inventory distributions for client-facing context",
            ],
        ),
        "report_bundle_5": ReportProduct(
            code="report_bundle_5",
            title="5-report beta bundle",
            audience="realtor",
            amount_grosz=29900,
            currency="PLN",
            description=(
                "Beta bundle для риелтора: 5 клиентских проверок цены, "
                "рисков и торга."
            ),
            features=[
                "5 additional buyer-decision report credits",
                "Client-ready verdict and negotiation copy",
                "Works after monthly plan limit is reached",
                "Feedback required after each beta report",
            ],
        ),
        "apartment_pack_3": ReportProduct(
            code="apartment_pack_3",
            title="3 Apartment Pack",
            audience="buyer",
            amount_grosz=settings.apartment_pack_3_amount_grosz,
            currency="PLN",
            description=(
                "Three Buyer Report credits for comparing apartment A, B and C before "
                "making a purchase decision."
            ),
            features=[
                "3 buyer-decision report credits",
                "Analyze three shortlisted apartments",
                "Compare the saved reports side by side",
                "Configurable one-time price before checkout",
            ],
        ),
    }


def list_report_products() -> list[ReportProduct]:
    return list(_report_products().values())


def get_report_product(code: ReportProductCode) -> ReportProduct:
    return _report_products()[code]
