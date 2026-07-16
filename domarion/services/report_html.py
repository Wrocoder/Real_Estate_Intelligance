from html import escape

from domarion.schemas import (
    AreaStatistics,
    ListingAnalysis,
    MarketDashboard,
    MarketDashboardArea,
    MarketDistributionBucket,
    ObjectReport,
)


def render_object_report_html(report: ObjectReport, analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    scores = analysis.scores
    branding = report.branding
    brand_name = branding.agency_name if branding and branding.agency_name else "Domarion Analytics"
    branding_html = _render_branding(branding)
    footer_html = _render_report_footer(report.disclaimer, branding)
    primary_color = _brand_color(branding.primary_color if branding else None, "#0f766e")
    accent_color = _brand_color(branding.accent_color if branding else None, "#b42318")

    score_cards = "".join(
        [
            _score_card("Investment", scores.investment_score, scores.decision_label),
            _score_card("Risk", scores.risk_score, scores.risk_label),
            _score_card("Negotiation", scores.negotiation_score, scores.negotiation_label),
            _score_card("Liquidity", scores.liquidity_score, scores.liquidity_label),
            _score_card("Rental", scores.rental_potential_score, scores.rental_potential_label),
        ]
    )
    sections = "\n".join(
        _render_section(section.title, section.items) for section in report.sections
    )
    price_history_rows = "\n".join(
        (
            "<tr>"
            f"<td>{escape(str(point.observed_at))}</td>"
            f"<td>{_money(point.price)}</td>"
            f"<td>{_money(point.price_per_m2)}/m2</td>"
            "</tr>"
        )
        for point in analysis.price_history
    )
    comparable_rows = "\n".join(
        (
            "<tr>"
            f"<td>{escape(item.title)}</td>"
            f"<td>{escape(item.district)}</td>"
            f"<td>{item.rooms}</td>"
            f"<td>{item.area_m2:.1f}</td>"
            f"<td>{_money(item.price)}</td>"
            f"<td>{_money(item.price_per_m2)}/m2</td>"
            "</tr>"
        )
        for item in analysis.comparables
    )

    return f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(listing.title)} - Domarion Analytics</title>
  <style>
    :root {{
      color-scheme: light;
      --ink: #17202a;
      --muted: #5f6b7a;
      --line: #d9dee6;
      --soft: #f5f7fa;
      --accent: {primary_color};
      --risk: {accent_color};
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: #eef2f5;
      color: var(--ink);
      font: 14px/1.5 Arial, Helvetica, sans-serif;
    }}
    .page {{
      width: min(1040px, calc(100% - 32px));
      margin: 24px auto;
      background: #fff;
      border: 1px solid var(--line);
      padding: 32px;
    }}
    .topline {{
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid var(--ink);
      padding-bottom: 18px;
      margin-bottom: 22px;
    }}
    .brand {{ font-weight: 700; color: var(--accent); letter-spacing: .02em; }}
    .brand-logo {{ display: block; max-width: 180px; max-height: 54px; margin-bottom: 10px; }}
    h1 {{ margin: 8px 0 8px; font-size: 28px; line-height: 1.15; }}
    h2 {{ margin: 28px 0 10px; font-size: 18px; }}
    h3 {{ margin: 0 0 8px; font-size: 15px; }}
    p {{ margin: 0 0 10px; }}
    .muted {{ color: var(--muted); }}
    .summary {{
      font-size: 16px;
      border-left: 4px solid var(--accent);
      background: var(--soft);
      padding: 14px 16px;
      margin: 18px 0 20px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }}
    .metric {{
      border: 1px solid var(--line);
      padding: 10px 12px;
      min-height: 72px;
    }}
    .metric .label {{ color: var(--muted); font-size: 12px; }}
    .metric .value {{ font-size: 20px; font-weight: 700; margin-top: 4px; }}
    .scores {{
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin: 16px 0 20px;
    }}
    .score {{
      border: 1px solid var(--line);
      padding: 12px;
      text-align: center;
    }}
    .score strong {{ display: block; font-size: 24px; color: var(--accent); }}
    .score.risk strong {{ color: var(--risk); }}
    ul {{ margin: 8px 0 0 18px; padding: 0; }}
    li {{ margin: 4px 0; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 13px;
    }}
    th, td {{
      border: 1px solid var(--line);
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }}
    th {{ background: var(--soft); }}
    .footer {{
      border-top: 1px solid var(--line);
      margin-top: 28px;
      padding-top: 12px;
      color: var(--muted);
      font-size: 12px;
    }}
    @media print {{
      body {{ background: #fff; }}
      .page {{ width: 100%; margin: 0; border: 0; padding: 18mm; }}
      h2 {{ break-after: avoid; }}
      table, .metric, .score {{ break-inside: avoid; }}
    }}
  </style>
</head>
<body>
  <main class="page">
    <section class="topline">
      <div>
        {_render_logo(branding)}
        <div class="brand">{escape(brand_name)}</div>
        {branding_html}
        <h1>{escape(listing.title)}</h1>
        <p class="muted">
          {escape(listing.address)} · {escape(listing.district)}, {escape(listing.city)}
        </p>
      </div>
      <div class="muted">
        <p>Listing ID: {escape(listing.id)}</p>
        <p>Audience: {escape(report.audience)}</p>
        <p>Template: {escape(report.template_name)}</p>
        <p>Source: {escape(listing.source_name)}</p>
      </div>
    </section>

    <p class="summary">{escape(report.summary)}</p>

    <section class="grid">
      {_metric("Цена", _money(listing.price))}
      {_metric("Цена за m2", f"{_money(listing.price_per_m2)}/m2")}
      {_metric("Площадь", f"{listing.area_m2:.1f} m2")}
      {_metric("Комнаты", str(listing.rooms))}
      {_metric("Тип здания", _attribute_label(listing.building_type))}
      {_metric("Состояние", _attribute_label(listing.renovation_state))}
      {_metric("Дней на рынке", str(listing.days_on_market))}
      {_metric("Снижений цены", str(listing.price_reductions))}
      {_metric("Fair price mid", _money(scores.fair_price_mid))}
      {_metric("Fair price confidence", f"{scores.fair_price_confidence_score}/100")}
      {_metric("Отклонение", f"{scores.price_delta_to_fair_mid_pct:+.1f}%")}
    </section>

    <section class="scores">{score_cards}</section>

    {sections}

    <section>
      <h2>История цены</h2>
      <table>
        <thead><tr><th>Дата</th><th>Цена</th><th>Цена за m2</th></tr></thead>
        <tbody>{price_history_rows or '<tr><td colspan="3">Нет данных.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>Похожие объекты</h2>
      <table>
        <thead>
          <tr>
            <th>Объект</th><th>Район</th><th>Комнаты</th><th>m2</th><th>Цена</th><th>Цена за m2</th>
          </tr>
        </thead>
        <tbody>{comparable_rows or '<tr><td colspan="6">Недостаточно данных.</td></tr>'}</tbody>
      </table>
    </section>

    {footer_html}
  </main>
</body>
</html>
"""


def render_area_report_html(area: AreaStatistics, dashboard: MarketDashboard, summary: str) -> str:
    market_area = _dashboard_area_for_report(area, dashboard)
    index_cards = (
        "".join(
            [
                _area_index_card("Liquidity", market_area.liquidity_index),
                _area_index_card("Buyer market", market_area.buyer_market_index),
                _area_index_card("Seller market", market_area.seller_market_index),
                _area_index_card("Overheated", market_area.overheated_index),
            ]
        )
        if market_area
        else '<p class="muted">Market indices are unavailable for this area.</p>'
    )

    return f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(area.name)} - Area Market Report</title>
  <style>
    :root {{
      color-scheme: light;
      --ink: #17202a;
      --muted: #5f6b7a;
      --line: #d9dee6;
      --soft: #f5f7fa;
      --accent: #0f766e;
      --warn: #b45309;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: #eef2f5;
      color: var(--ink);
      font: 14px/1.5 Arial, Helvetica, sans-serif;
    }}
    .page {{
      width: min(1040px, calc(100% - 32px));
      margin: 24px auto;
      background: #fff;
      border: 1px solid var(--line);
      padding: 32px;
    }}
    .topline {{
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid var(--ink);
      padding-bottom: 18px;
      margin-bottom: 22px;
    }}
    .brand {{ font-weight: 700; color: var(--accent); }}
    h1 {{ margin: 8px 0 8px; font-size: 28px; line-height: 1.15; }}
    h2 {{ margin: 28px 0 10px; font-size: 18px; }}
    p {{ margin: 0 0 10px; }}
    .muted {{ color: var(--muted); }}
    .summary {{
      font-size: 16px;
      border-left: 4px solid var(--accent);
      background: var(--soft);
      padding: 14px 16px;
      margin: 18px 0 20px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }}
    .metric {{
      border: 1px solid var(--line);
      padding: 10px 12px;
      min-height: 72px;
    }}
    .metric .label {{ color: var(--muted); font-size: 12px; }}
    .metric .value {{ font-size: 20px; font-weight: 700; margin-top: 4px; }}
    .indices {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 16px 0 20px;
    }}
    .index {{
      border: 1px solid var(--line);
      padding: 12px;
      text-align: center;
    }}
    .index strong {{ display: block; font-size: 24px; color: var(--accent); }}
    .index.warn strong {{ color: var(--warn); }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 13px;
    }}
    th, td {{
      border: 1px solid var(--line);
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }}
    th {{ background: var(--soft); }}
    .footer {{
      border-top: 1px solid var(--line);
      margin-top: 28px;
      padding-top: 12px;
      color: var(--muted);
      font-size: 12px;
    }}
    @media print {{
      body {{ background: #fff; }}
      .page {{ width: 100%; margin: 0; border: 0; padding: 18mm; }}
      h2 {{ break-after: avoid; }}
      table, .metric, .index {{ break-inside: avoid; }}
    }}
  </style>
</head>
<body>
  <main class="page">
    <section class="topline">
      <div>
        <div class="brand">Domarion Analytics</div>
        <h1>Area Market Report: {escape(area.name)}</h1>
        <p class="muted">{escape(area.city)} · Area ID: {escape(area.area_id)}</p>
      </div>
      <div class="muted">
        <p>Template: Area Market Report v1</p>
        <p>Listings in sample: {dashboard.listings_count}</p>
        <p>Audience: realtor / buyer context</p>
      </div>
    </section>

    <p class="summary">{escape(summary)}</p>

    <section class="grid">
      {_metric("Median PLN/m2", f"{_money(area.median_price_per_m2)}/m2")}
      {_metric("Average PLN/m2", f"{_money(area.average_price_per_m2)}/m2")}
      {_metric("Active listings", str(area.active_listings))}
      {_metric("Avg days on market", f"{area.average_days_on_market} d")}
      {_metric("New 30d", str(area.new_listings_30d))}
      {_metric("Removed 30d", str(area.removed_listings_30d))}
      {_metric("Price 90d", _percent(area.price_change_90d_pct))}
      {_metric("Supply 90d", _percent(area.supply_change_90d_pct))}
    </section>

    <section>
      <h2>Market indices</h2>
      <div class="indices">{index_cards}</div>
    </section>

    <section>
      <h2>Inventory distributions</h2>
      <table>
        <thead><tr><th>Bucket</th><th>Price</th><th>PLN/m2</th><th>Area</th></tr></thead>
        <tbody>{_area_distribution_rows(dashboard)}</tbody>
      </table>
    </section>

    <section>
      <h2>Interpretation</h2>
      <table>
        <tbody>
          <tr><th>Buyer signal</th><td>{escape(_buyer_signal(market_area))}</td></tr>
          <tr><th>Seller signal</th><td>{escape(_seller_signal(market_area))}</td></tr>
          <tr><th>Liquidity signal</th><td>{escape(_liquidity_signal(market_area))}</td></tr>
          <tr>
            <th>Data note</th>
            <td>
              Report uses current Domarion area statistics and listing sample. It is analytical
              context, not legal, tax or investment advice.
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <p class="footer">
      This report is generated from Domarion market data. Validate source data, legal status,
      financing and technical condition before making a transaction decision.
    </p>
  </main>
</body>
</html>
"""


def _render_section(title: str, items: list[str]) -> str:
    rows = "\n".join(f"<li>{escape(item)}</li>" for item in items)
    return f"<section><h2>{escape(title)}</h2><ul>{rows}</ul></section>"


def _score_card(label: str, value: int, helper: str) -> str:
    css_class = "score risk" if label == "Risk" else "score"
    return (
        f'<div class="{css_class}">'
        f"<span>{escape(label)}</span>"
        f"<strong>{value}</strong>"
        f'<span class="muted">{escape(_label_text(helper))}</span>'
        "</div>"
    )


def _metric(label: str, value: str) -> str:
    if not value:
        return ""
    return (
        '<div class="metric">'
        f'<div class="label">{escape(label)}</div>'
        f'<div class="value">{escape(value)}</div>'
        "</div>"
    )


def _attribute_label(value: str | None) -> str:
    if not value:
        return ""
    return value.replace("_", " ")


def _render_branding(branding) -> str:
    if branding is None:
        return ""
    rows = []
    if branding.agent_name:
        rows.append(f"Agent: {escape(branding.agent_name)}")
    if branding.agent_email:
        rows.append(f"Email: {escape(branding.agent_email)}")
    if branding.agent_phone:
        rows.append(f"Phone: {escape(branding.agent_phone)}")
    if branding.website_url:
        rows.append(f"Web: {escape(branding.website_url)}")
    if branding.note:
        rows.append(escape(branding.note))
    if not rows:
        return ""
    content = "<br>".join(rows)
    return f'<p class="muted">{content}</p>'


def _render_logo(branding) -> str:
    if branding is None or not branding.logo_url:
        return ""
    return (
        f'<img class="brand-logo" src="{escape(branding.logo_url, quote=True)}" '
        'alt="Agency logo">'
    )


def _render_report_footer(disclaimer: str, branding) -> str:
    rows = []
    if branding and branding.agency_disclaimer:
        rows.append(f"<strong>{escape(branding.agency_disclaimer)}</strong>")
    rows.append(escape(disclaimer))
    rows.append(
        escape(branding.footer_text)
        if branding and branding.footer_text
        else "Powered by Domarion Analytics"
    )
    return '<div class="footer">' + "".join(f"<p>{row}</p>" for row in rows if row) + "</div>"


def _brand_color(value: str | None, fallback: str) -> str:
    if value and len(value) == 7 and value.startswith("#"):
        return escape(value)
    return fallback


def _label_text(value: str) -> str:
    return {
        "strong_candidate": "Strong candidate",
        "good_option": "Good option",
        "fair_option": "Fair option",
        "overpriced": "Overpriced",
        "risky": "Risky",
        "weak_fit": "Weak fit",
        "below_fair": "Below fair",
        "fair": "Fair",
        "above_fair": "Above fair",
        "low_risk": "Low risk",
        "moderate_risk": "Moderate risk",
        "elevated_risk": "Elevated risk",
        "high_risk": "High risk",
        "weak_negotiation": "Weak negotiation",
        "some_negotiation": "Some negotiation",
        "negotiable": "Negotiable",
        "strong_negotiation": "Strong negotiation",
        "weak": "Weak",
        "moderate": "Moderate",
        "good": "Good",
        "strong": "Strong",
    }.get(value, value)


def _money(value: int) -> str:
    return f"{value:,} PLN".replace(",", " ")


def _dashboard_area_for_report(
    area: AreaStatistics,
    dashboard: MarketDashboard,
) -> MarketDashboardArea | None:
    for item in dashboard.areas:
        if item.area_id == area.area_id:
            return item
    return None


def _area_index_card(label: str, value: int) -> str:
    css_class = "index warn" if label == "Overheated" else "index"
    return f'<div class="{css_class}"><span>{escape(label)}</span><strong>{value}</strong></div>'


def _area_distribution_rows(dashboard: MarketDashboard) -> str:
    max_len = max(
        len(dashboard.price_distribution),
        len(dashboard.price_per_m2_distribution),
        len(dashboard.area_distribution),
        0,
    )
    if max_len == 0:
        return '<tr><td colspan="4">No listing distribution data.</td></tr>'

    rows = []
    for index in range(max_len):
        price = _bucket_cell(dashboard.price_distribution, index)
        price_per_m2 = _bucket_cell(dashboard.price_per_m2_distribution, index)
        area = _bucket_cell(dashboard.area_distribution, index)
        rows.append(
            "<tr>"
            f"<td>{index + 1}</td>"
            f"<td>{price}</td>"
            f"<td>{price_per_m2}</td>"
            f"<td>{area}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def _bucket_cell(buckets: list[MarketDistributionBucket], index: int) -> str:
    if index >= len(buckets):
        return "-"
    bucket = buckets[index]
    return f"{escape(bucket.label)}: {bucket.count}"


def _percent(value: float | None) -> str:
    if value is None:
        return "-"
    return f"{value:+.1f}%"


def _buyer_signal(area: MarketDashboardArea | None) -> str:
    if area is None:
        return "Not enough data for buyer market signal."
    if area.buyer_market_index >= 65:
        return "Buyer has stronger negotiation context: softer price or longer exposure signals."
    if area.seller_market_index >= 65:
        return "Seller position is stronger: use comparables and risk checks before negotiating."
    return "Balanced market context; compare concrete listings and days-on-market."


def _seller_signal(area: MarketDashboardArea | None) -> str:
    if area is None:
        return "Not enough data for seller market signal."
    if area.seller_market_index >= 65:
        return "Seller market pressure is high; attractive listings may require faster decisions."
    if area.buyer_market_index >= 65:
        return "Supply or exposure supports more patient negotiation."
    return "No dominant seller pressure in the current area sample."


def _liquidity_signal(area: MarketDashboardArea | None) -> str:
    if area is None:
        return "Not enough data for liquidity signal."
    if area.liquidity_index >= 70:
        return "Liquidity looks strong relative to the current Domarion sample."
    if area.liquidity_index <= 35:
        return "Liquidity looks weak; validate exit scenarios and rental demand."
    return "Liquidity is moderate and should be checked against object-level quality."
