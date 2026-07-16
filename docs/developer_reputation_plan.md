# Developer Reputation and Ranking Plan

Цель: добавить в Domarion слой оценки застройщиков, чтобы покупатель видел не только цену и район, но и кто строил объект, чем застройщик силен, какие есть риски и на каких источниках основаны выводы.

## Что уже есть в проекте

- В `docs/partner_onboarding.md` уже предусмотрен `source_type=developer_feed`.
- В listing-модели и private draft history есть нормализованные `developer_id`, `developer_name`, `investment_name` и `primary_market_project_id`.
- Добавлен первый in-memory слой: developer profiles, projects, quality signals и listing-to-developer mapping.
- Добавлены PostgreSQL таблицы для developer profiles, projects, quality signals и reputation snapshots.
- Добавлены developer aliases для brand/legal entity/SPV/project company/parent company matching.
- Добавлен legal-first JSON feed importer для source-backed developer data и aliases без копирования персональных данных.
- Public API уже отдает ranking, developer detail и lookup by listing для MVP/demo данных.
- В object reports добавлена секция о застройщике, если для объекта есть сопоставление.

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

1. [x] Data model and sample data: developer profiles, projects and listing-to-developer mapping.
2. [x] Legal-first feed import for developer profiles, projects and quality signals.
3. [x] Public API: developer ranking list, developer detail, lookup by listing.
4. [x] Developer Reputation Score v1 with transparent factors and confidence score.
5. [x] Add developer section to object reports.
6. [x] Add developer reputation block to user-submitted link reports when developer is recognized.
7. [x] Frontend ranking page and developer block on listing detail.
8. [x] Dedicated developer profile page with source freshness and project timeline.
9. [x] Developer aliases for brand, legal entity, SPV, project company and parent company matching.
10. [ ] Add admin manual editor for developer profiles and quality signals.
11. [ ] Add source citation and dispute-correction workflow.
