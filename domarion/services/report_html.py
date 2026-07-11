from html import escape

from domarion.schemas import ListingAnalysis, ObjectReport


def render_object_report_html(report: ObjectReport, analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    scores = analysis.scores
    branding = report.branding
    brand_name = branding.agency_name if branding and branding.agency_name else "Domarion Analytics"
    branding_html = _render_branding(branding)

    score_cards = "".join(
        [
            _score_card("Investment", scores.investment_score),
            _score_card("Risk", scores.risk_score),
            _score_card("Negotiation", scores.negotiation_score),
            _score_card("Liquidity", scores.liquidity_score),
            _score_card("Rental", scores.rental_potential_score),
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
      --accent: #0f766e;
      --risk: #b42318;
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

    <p class="footer">{escape(report.disclaimer)}</p>
  </main>
</body>
</html>
"""


def _render_section(title: str, items: list[str]) -> str:
    rows = "\n".join(f"<li>{escape(item)}</li>" for item in items)
    return f"<section><h2>{escape(title)}</h2><ul>{rows}</ul></section>"


def _score_card(label: str, value: int) -> str:
    css_class = "score risk" if label == "Risk" else "score"
    return f'<div class="{css_class}"><span>{escape(label)}</span><strong>{value}</strong></div>'


def _metric(label: str, value: str) -> str:
    return (
        '<div class="metric">'
        f'<div class="label">{escape(label)}</div>'
        f'<div class="value">{escape(value)}</div>'
        "</div>"
    )


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
    return f'<p class="muted">{content}<br>Powered by Domarion Analytics</p>'


def _money(value: int) -> str:
    return f"{value:,} PLN".replace(",", " ")
