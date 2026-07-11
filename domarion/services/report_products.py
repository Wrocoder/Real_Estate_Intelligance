from domarion.schemas import ReportProduct, ReportProductCode

REPORT_PRODUCTS: dict[ReportProductCode, ReportProduct] = {
    "object_report": ReportProduct(
        code="object_report",
        title="Object Check",
        audience="buyer",
        amount_grosz=4900,
        currency="PLN",
        description="Одноразовый HTML-отчет по объекту: цена, район, риски и аргументы для торга.",
        features=[
            "Fair price range",
            "Investment/Risk/Negotiation Score",
            "История цены",
            "Инфраструктура и planned investments",
        ],
    ),
    "full_object_analysis": ReportProduct(
        code="full_object_analysis",
        title="Full Object Analysis",
        audience="buyer",
        amount_grosz=14900,
        currency="PLN",
        description=(
            "Расширенный анализ для покупателя: объект, район, ипотечный контекст "
            "и checklist."
        ),
        features=[
            "Все из Object Check",
            "Расширенный buyer checklist",
            "Сравнение с аналогами",
            "Риски ликвидности и переговорная позиция",
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
}


def list_report_products() -> list[ReportProduct]:
    return list(REPORT_PRODUCTS.values())


def get_report_product(code: ReportProductCode) -> ReportProduct:
    return REPORT_PRODUCTS[code]
