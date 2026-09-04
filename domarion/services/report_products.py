from domarion.schemas import ReportProduct, ReportProductCode

REPORT_PRODUCTS: dict[ReportProductCode, ReportProduct] = {
    "object_report": ReportProduct(
        code="object_report",
        title="Buyer Check",
        audience="buyer",
        amount_grosz=4900,
        currency="PLN",
        description=(
            "Проверка перед покупкой: не переплатить, увидеть риски и подготовить "
            "разумный opening offer."
        ),
        features=[
            "WartoMetr Verdict: buy / negotiate / avoid / verify first",
            "Fair price range and overpayment estimate",
            "Opening offer and max reasonable offer",
            "Top risks, unknowns and seller questions",
        ],
    ),
    "full_object_analysis": ReportProduct(
        code="full_object_analysis",
        title="Full Due Diligence",
        audience="buyer",
        amount_grosz=14900,
        currency="PLN",
        description=(
            "Расширенная проверка перед zadatek: документы, дом, район, total cost "
            "и переговорная стратегия."
        ),
        features=[
            "Все из Buyer Check",
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
        description="Инвестиционный отчет: доходность, ликвидность, upside/risk и альтернативы.",
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
        description="Beta bundle для риелтора: 5 клиентских проверок цены, рисков и торга.",
        features=[
            "5 additional buyer-decision report credits",
            "Client-ready verdict and negotiation copy",
            "Works after monthly plan limit is reached",
            "Feedback required after each beta report",
        ],
    ),
}


def list_report_products() -> list[ReportProduct]:
    return list(REPORT_PRODUCTS.values())


def get_report_product(code: ReportProductCode) -> ReportProduct:
    return REPORT_PRODUCTS[code]
