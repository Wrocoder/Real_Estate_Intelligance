# Developer Reputation and Ranking Plan

Цель: добавить в Domarion слой оценки застройщиков, чтобы покупатель видел не только цену и район, но и кто строил объект, чем застройщик силен, какие есть риски и на каких источниках основаны выводы.

## Что уже есть в проекте

- В `docs/partner_onboarding.md` уже предусмотрен `source_type=developer_feed`.
- В listing-модели пока нет нормализованного `developer_id`, `developer_name`, `investment_name` и связи с проектом застройщика.
- В отчетах пока нет отдельной секции о застройщике.

## Candidate Sources

Legal-first источники, которые можно использовать для MVP и последующего скоринга:

- RynekPierwotny developer directory: активные и архивные профили застройщиков, инвестиции и локации.
  - https://rynekpierwotny.pl/deweloperzy/s/wroclaw/
- UOKiK: решения, postępowania и consumer-protection сигналы по девелоперам.
  - https://uokik.gov.pl/tag/deweloperzy
- PRS/KRS open API: регистрационные данные компаний, статус, KRS, связи с юрлицом.
  - https://prs.ms.gov.pl/krs/openApi
- GUS REGON API: NIP/REGON/KRS lookup и базовые данные компании.
  - https://api.stat.gov.pl/Home/RegonApi
- Deweloperski Fundusz Gwarancyjny context: проверка, что primary-market investment имеет buyer-protection context.
  - https://dfg.ufg.pl/dfg/
- Technical acceptance / defect datasets from partners or manual inspection companies, only with legal agreement.
- Public reviews are useful as weak signals only after legal/TOS review; raw personal review text should not be copied into reports.

## Scoring Method

Developer Reputation Score should be explainable and source-backed:

- Track record: completed projects, active projects, years active.
- Delivery reliability: delays, stage/handover signals, repeated schedule issues.
- Technical quality: defect frequency/severity from partner inspections or manual audits.
- Contract/legal risk: UOKiK decisions, proceedings, prohibited clauses, consumer complaints.
- Financial/company stability: KRS/REGON status, group structure, available financial statement signals.
- Transparency: clear investment pages, schedules, escrow/DFG context, prospectus completeness.
- Local fit: experience in the same city/district and comparable completed projects.
- Confidence score: high only when multiple source types agree; low when based on directory data only.

## Report Integration

Every object report should include a developer section when developer data exists:

- `Кто строил / строит`: normalized developer name, company identifiers if available.
- `Что хорошего`: completed projects, local experience, quality positives, transparency positives.
- `Что проверить`: contract clauses, delays, known disputes, defect patterns, DFG/prospectus checks.
- `Source citations`: short source list and freshness date.
- `Disclaimer`: this is due-diligence context, not a legal guarantee or definitive ranking.

## MVP Slices

1. Data model and sample data: developer profiles, projects and listing-to-developer mapping.
2. Admin import/manual editor for developer profiles and quality signals.
3. Public API: developer ranking list, developer detail, lookup by listing.
4. Developer Reputation Score v1 with transparent factors and confidence score.
5. Add developer section to object reports and user-submitted link reports.
6. Frontend pages: ranking, developer profile, developer block on listing/report pages.
7. Add source citation and dispute-correction workflow.
