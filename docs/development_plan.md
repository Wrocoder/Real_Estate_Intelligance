# Domarion Analytics Development Plan

Дата старта плана: 2026-07-10  
Рабочая ветка: `main`  
Правило коммитов: коммит и push после завершения крупного блока, когда тесты и линтер проходят.

## 0. Правила разработки

- [x] Не хранить `.idea/`, `.venv/`, logs и generated exports в git.
- [x] Каждый крупный блок закрывать тестами.
- [x] Перед коммитом запускать `pytest` и `ruff`.
- [x] Держать документацию запуска в `README.md`.
- [x] Добавить CI на GitHub Actions.
- [x] Добавить pre-commit hooks после стабилизации форматирования.
- [ ] Вести changelog/release notes после первого deploy.

## 1. Product и Research

- [x] Подготовить полную концепцию продукта.
- [x] Описать целевые аудитории и MVP scope.
- [x] Описать источники данных и legal/data strategy.
- [x] Описать архитектуру, monetization, GTM, SEO, риски, roadmap.
- [ ] Провести legal review источников данных.
- [ ] Провести 20 интервью: покупатели, риелторы, инвесторы.
- [ ] Провести отдельные интервью с ипотечными брокерами и малыми агентствами.
- [ ] Сформировать список первых 30 агентств/риелторов для paid beta.
- [ ] Подготовить коммерческий оффер для риелторов.
- [ ] Подготовить оценку коммерческого потенциала по шкале из `First_prompt_ru.md`.
- [ ] Подготовить конкурентный анализ Otodom, OLX, Morizon, Gratka, SonarHome, Cenatorium, urban.one и агентских CRM.
- [ ] Подготовить risk register: юридические, технические и бизнес-риски с mitigation-планом.
- [ ] Описать moat strategy: история цен, дедупликация, snapshots, геоданные, SEO и агентские партнерства.
- [ ] Описать hybrid user-provided listing strategy: пользователь вводит адрес/URL/параметры, а анализ строится без массового копирования порталов.
- [x] Зафиксировать hybrid flow spec в `docs/hybrid_listing_analysis.md`.
- [x] Зафиксировать developer reputation/ranking backlog и candidate sources в `docs/developer_reputation_plan.md`.
- [ ] Провести legal/data review источников для рейтинга застройщиков: directories, UOKiK, KRS/REGON, DFG, partner inspection data, public reviews.
- [ ] Обновить 12-месячный roadmap по фактическому состоянию продукта.
- [ ] Описать минимальную команду запуска и зоны ответственности.
- [ ] Оценить сложность блоков: ingestion, dedup, geocoding, PostGIS, map, scoring, reports, payments, alerts, AI, scaling, legal.

## 1.1 Legal, Compliance и Data Governance

- [ ] Зафиксировать policy по Terms of Service, robots.txt и rate limiting для каждого источника.
- [ ] Описать правила хранения оригинальных ссылок, raw payload и минимально необходимых данных.
- [ ] Описать policy для user-submitted source URL: хранить приватно, не показывать пользователям, не использовать для bulk crawling без legal approval.
- [ ] Описать запрет на копирование фото и контактных данных без правового основания.
- [ ] Добавить процесс удаления данных по запросу.
- [ ] Добавить GDPR/RODO data retention policy.
- [ ] Добавить финансовые, юридические и инвестиционные disclaimers для scoring, AI и отчетов.
- [x] Добавить реестр источников данных с owner, legal status, refresh cadence и quality status.
- [ ] Добавить audit trail для доступа к платным отчетам, admin-действий и data deletion requests.

## 2. Repository и Backend Foundation

- [x] Удалить tracked `.idea/`.
- [x] Добавить `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`.
- [x] Добавить `pyproject.toml`.
- [x] Добавить FastAPI application factory.
- [x] Добавить health endpoint.
- [x] Добавить базовый README с командами запуска.
- [x] Добавить Dockerfile.
- [x] Добавить `compose.yaml` с PostGIS и Redis.
- [x] Добавить GitHub Actions CI.
- [x] Добавить Makefile/Taskfile или единый CLI для dev-команд.

## 3. Database и Repository Layer

- [x] Добавить SQLAlchemy models.
- [x] Добавить Alembic.
- [x] Создать initial migration.
- [x] Добавить PostGIS extension в миграцию.
- [x] Добавить `memory` и `postgres` repository backend.
- [x] Добавить repository factory через `DATA_REPOSITORY_BACKEND`.
- [x] Добавить demo seed command.
- [x] Проверить миграции на живой PostGIS БД после запуска Docker Desktop.
- [x] Добавить geometry columns и spatial indexes.
- [x] Добавить таблицы `generated_reports`, `user_favorites`, `user_alerts`.
- [x] Добавить миграционную проверку в CI.
- [x] Добавить таблицы `listing_events` и расширить price history под снятие/републикацию/изменение параметров.
- [x] Добавить таблицу `property_deduplication_matches` для review queue и объяснения match decisions.
- [x] Добавить справочники `locations`, `districts`, `municipalities`.
- [x] Добавить таблицы инфраструктуры: `transport_stops`, `transport_routes`, `schools`, `kindergartens`, `amenities`, `industrial_zones`.
- [x] Добавить `ai_insights` для сохранения AI summaries и object explanations.
- [x] Добавить таблицы `agencies` и `agency_memberships` для agency workspaces.
- [ ] Добавить таблицы `developer_profiles`, `developer_projects`, `developer_quality_signals`, `developer_reputation_snapshots`.
- [ ] Связать listings/user-submitted drafts с `developer_id`, `investment_name` и primary-market project metadata.
- [x] Добавить `scraping_jobs`/`source_errors` или эквивалент для легальных source checks без агрессивного scraping lock-in.
- [x] Добавить S3-compatible storage abstraction для generated PDF/HTML artifacts.

## 4. Listings и Search API

- [x] Добавить listing schemas.
- [x] Добавить in-memory demo listings по Wrocław.
- [x] Добавить `/api/v1/listings`.
- [x] Добавить `/api/v1/listings/{id}`.
- [x] Добавить `/api/v1/areas`.
- [x] Добавить `/api/v1/areas/{id}/statistics`.
- [x] Добавить сравнение `/api/v1/compare`.
- [x] Добавить pagination.
- [x] Добавить сортировку.
- [x] Добавить фильтры по score, price/m2, days_on_market.
- [x] Добавить API-level text/address search по title, address, district, city и source metadata.
- [ ] Подключить OpenSearch или PostgreSQL full-text indexes для production-scale поиска.
- [x] Добавить saved searches.
- [ ] Расширить фильтры: gmina, voivodeship, floor, building floors, building year, building type, renovation state.
- [ ] Добавить lifestyle-фильтры: balcony, terrace, garden, elevator, parking, heating.
- [x] Добавить proximity-фильтры: distance to center, stop, school, major road, industrial zone.
- [x] Добавить фильтры по rental potential, liquidity и data quality для investor/realtor workflows.
- [x] Добавить API для поиска объектов ниже рынка и hidden gems.
- [x] Добавить API сравнения 2-5 объектов с mortgage payment, rental potential и liquidity fields.
- [x] Добавить developer filters/sort: developer reputation, active projects, completed projects, legal-risk flags, quality confidence.
- [x] Добавить public API для рейтинга застройщиков, developer detail и lookup developer-by-listing.

## 4.1 Hybrid User-Provided Listing Flow

Стратегия описана в `docs/hybrid_listing_analysis.md`: не строить MVP на массовом скрапинге порталов. Пользователь сам приносит объект: вводит адрес, цену, площадь, комнаты и опционально URL объявления. URL хранится как приватный reference/evidence, не показывается другим пользователям и не используется для массового scheduled crawling без legal approval по конкретному источнику.

- [x] Добавить публичный flow “Проверить квартиру”: address-first ввод объекта без необходимости иметь объект в нашей базе.
- [x] Добавить форму ручных параметров: адрес/район, цена, площадь, комнаты, этаж, год, рынок, URL объявления optional.
- [x] Добавить `UserSubmittedListing` draft persistence/report metadata для временного объекта пользователя.
- [x] Добавить backend endpoint для нормализации user-submitted listing и расчета preliminary score.
- [x] Добавить приватную обработку `source_url` как internal reference: не показывать в UI/отчетах, не индексировать публично, не экспортировать в SEO.
- [x] Добавить data-quality score для пользовательского ввода: missing floor/year, approximate location, defaulted infrastructure.
- [x] Строить comparables не из URL, а из наших legal-first listings, партнерских snapshots, area statistics и open-data слоев.
- [x] Добавить fallback, если comparables мало: area-level estimate + confidence warning.
- [x] Добавить optional URL-assisted reference preview только как one-off user-submitted analysis, без bulk indexing, anti-bot обхода и контактов/фото.
- [x] Добавить one-off URL import по user-submitted Otodom/OLX ссылке: обычный fetch без anti-bot обхода, извлечение минимальных полей и подтверждение пользователем перед отчетом.
- [x] Доработать link-to-report flow: один клик импортирует Otodom/OLX параметры и строит buyer report без подстановки демо-данных.
- [x] Добавить enhanced private listing report: источник/надежность, fair value, action plan, warnings и no source URL leak.
- [x] Добавить proxy-market fallback для объектов вне текущего coverage с явным warning.
- [x] Добавить первый suburban coverage seed для Mędłów: area statistics, local comparables, geocoding и normalization из broad portal region label.
- [x] Добавить suburban coverage pack для Kobierzyce/Wysoka/Bielany Wrocławskie/Oława: area statistics, local comparables, aliases и geocoding.
- [x] Добавить stronger URL extraction fixtures под Otodom/OLX embedded-state variants: assignment scripts, JSON.parse state, nested location и parameter dictionaries.
- [x] Перевести suburban coverage в sample data sources: partner CSV для comparables и CSV area statistics для local baselines.
- [x] Добавить пользовательское подтверждение: “я имею право использовать эту ссылку/данные для личного анализа”.
- [x] Добавить retention policy для user-submitted drafts и ссылок.
- [x] Покрыть API contract tests и frontend typecheck для address-first flow.

## 5. Ingestion Pipeline

- [x] Добавить legal-first CSV ingestion для партнерских/ручных выгрузок.
- [x] Валидировать обязательные CSV-колонки.
- [x] Нормализовать listing fields.
- [x] Сохранять raw payload hash.
- [x] Сохранять property, property_source, listing_snapshots.
- [x] Добавить sample CSV.
- [x] Добавить dry-run CLI.
- [x] Добавить ingestion jobs table usage.
- [x] Добавить data quality logs.
- [x] Добавить JSON/CSV import planned investments для open-data слоев.
- [x] Добавить CSV import API endpoint для internal admin.
- [x] Добавить planned investments import API endpoint для internal admin.
- [x] Добавить дедупликацию v1 при импорте.
- [x] Добавить geocoding pipeline.
- [x] Добавить source monitoring и error reporting.
- [x] Добавить ingestion source registry с legal status и refresh policy.
- [x] Добавить price history update pipeline: first_seen, current_price, price_per_m2 history, price drops/raises.
- [ ] Добавить listing events pipeline: removed, republished, description changed, parameters changed.
- [x] Добавить data enrichment pipeline для infrastructure matching и distance calculations.
- [x] Добавить official open-data ingestion roadmap: GUGiK/Geoportal, RCN, GUS/BDL, MPZP/Studium, OSM, GTFS.
- [x] Добавить импорт schools/kindergartens/transport/healthcare/parks/industrial zones.
- [x] Добавить ingestion/source type `user_submitted_reference` для приватных ссылок и ручных параметров пользователя.
- [ ] Добавить legal-first developer data ingestion: developer feeds, KRS/REGON lookup, UOKiK events, directories, partner inspection datasets.
- [ ] Добавить нормализацию developer aliases: brand name, legal entity, SPV/project company, parent company.
- [ ] Улучшить deduplication v2: этаж, описание, агентство, источник, text similarity, distance threshold, photo hashes only if allowed.
- [ ] Добавить source-specific retention и delete-request handling.

## 6. Scoring и Analytics

- [x] Добавить Fair Price Estimate v1.
- [x] Добавить Investment Score v1.
- [x] Добавить Risk Score v1.
- [x] Добавить Negotiation Score v1.
- [x] Добавить Liquidity Score v1.
- [x] Добавить Rental Potential Score v1.
- [x] Добавить объяснения, warnings и negotiation arguments.
- [x] Вынести веса scoring в конфигурацию.
- [x] Добавить версионирование scoring formulas.
- [x] Добавить backtesting на historical snapshots.
- [x] Добавить area market snapshots job.
- [x] Добавить confidence score для fair price estimate.
- [x] Добавить человекочитаемые score labels: good option, overpriced, negotiable, risky, investment potential.
- [x] Добавить market dashboards: active/new/removed listings, exposure time, price/rooms/area distributions.
- [x] Добавить district/city comparison analytics.
- [x] Добавить market indexes: overheated area, buyer market, seller market, area liquidity.
- [x] Добавить future-area-development analysis по радиусам 500 м, 1 км, 2 км, 5 км, 10 км.
- [ ] Добавить growth factors: transport, schools, parks, hospitals, retail, offices, universities, population/jobs growth.
- [x] Добавить risk factors v1: price, liquidity/oversupply, weak transport, major-road/noise proxy, industrial zones, weak rental yield, data/developer/future-area risks, plus missing public risk layers for flood/noise/pollution/rail/airport.
- [x] Добавить rental estimate и gross yield/cashflow inputs для investor flow.
- [x] Добавить mortgage affordability и total purchase cost inputs в buyer analytics.
- [x] Добавить Developer Reputation Score v1: track record, delivery reliability, defect signals, legal/UOKiK risk, KRS/REGON stability, transparency, confidence.
- [ ] Добавить backtesting отчеты по drift/ошибке fair price estimate.

## 7. Reports

- [x] Добавить JSON object report.
- [x] Добавить printable HTML report.
- [x] Добавить CLI генерацию HTML.
- [x] Добавить API endpoint HTML-отчета.
- [x] Добавить XSS escaping для HTML.
- [x] Добавить `generated_reports` в БД.
- [x] Добавить `/api/v1/reports` history endpoints.
- [x] Добавить report templates для buyer/realtor/investor.
- [x] Добавить branded realtor report fields.
- [x] Добавить native PDF generation.
- [x] Добавить email delivery.
- [x] Добавить mortgage calculation и total purchase cost в buyer report v1.
- [x] Добавить buyer report секции: mortgage calculation, seller questions, purchase checklist, total cost.
- [x] Добавить buyer decision summary: рекомендация, max offer, стартовый offer anchor, главные риски и проверки перед zadatek.
- [x] Добавить buyer fit/outlook секцию: жизнь, семья, аренда, ликвидность и развитие района.
- [x] Добавить buyer object-check report из user-submitted listing draft.
- [x] Добавить сохранение buyer object-check report из user-submitted draft в report history.
- [x] Добавить paid checkout/fulfillment для user-submitted draft через `draft:<draft_id>`.
- [x] Добавить realtor report секции: map, comparable listings table, client-facing price arguments.
- [x] Добавить investor report секции: rental yield, alternatives comparison, liquidity and growth thesis.
- [x] Добавить paid area report product.
- [x] Добавить full object analysis report product.
- [x] Добавить bundles: package of 5 reports.
- [x] Добавить white-label PDF controls для logo, colors, footer и agency disclaimer.
- [x] Добавить export reports в CSV/JSON для realtor/investor workflows.
- [x] Добавить секцию застройщика в buyer/investor/realtor reports: кто строил, сильные стороны, риски, что проверить, source citations.
- [x] Добавить developer reputation block в user-submitted link reports для Otodom/OLX/new-build объектов, если застройщик распознан.

## 8. Users, Auth и Payments

- [x] Выбрать MVP auth strategy: header identity с fallback на future Auth.js/Clerk/custom JWT.
- [x] Добавить users table.
- [x] Добавить roles: buyer, realtor, agency_admin, admin.
- [x] Добавить subscriptions table.
- [x] Добавить access limits для Free/Buyer Pro/Realtor.
- [x] Добавить PayU/Stripe adapter interface поверх mock checkout.
- [x] Добавить Stripe/PayU webhook signature verification.
- [x] Добавить payment callback endpoints и idempotency keys.
- [x] Подключить hosted checkout API для Stripe и PayU.
- [x] Добавить one-time report purchase flow.
- [x] Добавить audit logging для paid artifacts.
- [x] Добавить тарифы Investor, Agency и Enterprise/API в plan limits.
- [x] Добавить team/agency accounts: несколько агентов под одной организацией.
- [x] Добавить роли и права для agency owner/admin/agent.
- [x] Добавить report credits и usage quotas для packages.
- [x] Добавить invoice/VAT metadata для B2B checkout.
- [x] Добавить lead capture для mortgage/legal/renovation partner referrals.

## 9. Favorites и Alerts

- [x] Добавить user_favorites table.
- [x] Добавить API избранного.
- [x] Добавить user_alerts table.
- [x] Добавить saved search alerts.
- [x] Добавить email alerts delivery skeleton.
- [x] Добавить Telegram alerts delivery skeleton.
- [x] Добавить фактическую SMTP delivery отправку.
- [x] Добавить фактическую Telegram Bot API delivery отправку.
- [x] Добавить daily email alerts.
- [x] Добавить Telegram alerts.
- [x] Добавить hidden gems alert v1.
- [ ] Добавить advanced investor alerts: below market, price drop, new comparable, high rental potential.
- [ ] Добавить realtor saved-search digests для клиентов.
- [ ] Добавить alert frequency controls: instant, daily, weekly.
- [ ] Добавить unsubscribe/manage preferences flow.

## 10. Frontend MVP

- [x] Создать Next.js app.
- [x] Настроить TypeScript, API client и CSS design system.
- [x] Сделать layout и навигацию.
- [x] Сделать search page.
- [x] Сделать listing card.
- [x] Сделать listing detail page.
- [x] Сделать compare page.
- [x] Сделать reports generation/history page.
- [x] Сделать alerts page.
- [x] Сделать pricing page.
- [x] Сделать account page.
- [x] Подключить auth foundation.
- [x] Сделать отдельную страницу market/area analytics dashboard.
- [x] Сделать страницу сравнения районов.
- [x] Сделать mortgage calculator page.
- [x] Сделать страницу “Проверить квартиру” для user-submitted listing: адрес/URL/ручные параметры.
- [x] Сделать страницу истории user-submitted private drafts.
- [x] Добавить управление agency workspace и участниками на account page.
- [x] Сделать developer ranking page.
- [x] Сделать developer profile page: projects, reputation score, quality/legal signals, source freshness.
- [x] Добавить developer block на listing detail page.
- [x] Добавить developer block на compare page.
- [ ] Сделать news page.
- [ ] Сделать public demand-validation landing page для paid beta.
- [ ] Сделать mobile-friendly QA pass для ключевых страниц.
- [ ] Добавить charting library и графики price history/market distributions.
- [ ] Добавить realtor подборки объектов для клиента.
- [x] Добавить investor hidden gems view.

## 11. Map и GIS

- [x] Подключить MapLibre.
- [x] Отобразить listings на карте.
- [ ] Добавить clusters.
- [x] Добавить infrastructure layers.
- [x] Добавить planned investments layer.
- [x] Добавить sample open-data слой Wrocław planned transport investments.
- [x] Добавить PostGIS distance calculations.
- [x] Добавить filters by radius.
- [x] Добавить risk/growth map overlays.
- [ ] Добавить price-per-m2 heatmap.
- [ ] Добавить переключаемые слои районов, гмин и воеводства.
- [ ] Добавить слои transport stops/routes, schools, kindergartens, hospitals, parks, retail.
- [ ] Добавить слои industrial zones, noise/major roads/rail/airport, flood and pollution risk.
- [ ] Добавить MPZP/Studium layer.
- [ ] Добавить future roads, tram lines and bus routes layers.
- [ ] Добавить radius analysis panel 500 м, 1 км, 2 км, 5 км, 10 км.

## 12. Admin Panel

- [x] Добавить internal admin auth.
- [x] Добавить список ingestion jobs.
- [x] Добавить просмотр raw listings.
- [ ] Добавить ручное исправление normalized listing.
- [ ] Добавить dedup review queue.
- [x] Добавить planned investments CRUD.
- [x] Добавить data quality dashboard.
- [x] Добавить source registry UI: legal status, refresh cadence, robots/TOS notes, owner.
- [x] Добавить admin view user-submitted listing drafts и source URL references без публичного раскрытия ссылок.
- [x] Добавить admin review queue для mortgage/legal/renovation partner referrals.
- [ ] Добавить admin CRUD/import для developer profiles, projects, aliases и quality signals.
- [ ] Добавить moderation/dispute workflow для developer reputation signals.
- [ ] Добавить ручную загрузку/редактирование listing от риелтора.
- [ ] Добавить moderation workflow для data deletion requests.
- [x] Добавить просмотр source errors и retry actions.
- [ ] Добавить admin audit log UI.

## 13. AI Assistant

- [ ] Добавить AI data contract: какие данные можно использовать.
- [ ] Добавить object summary prompt.
- [ ] Добавить buyer/realtor/investor answer templates.
- [ ] Добавить source-grounded responses.
- [ ] Добавить hallucination guardrails.
- [ ] Добавить AI usage logging.
- [ ] Добавить limited AI endpoint.
- [ ] Добавить AI question set из `First_prompt_ru.md`: price, negotiation, risks, future plans, family/rental fit, seller questions.
- [ ] Добавить compare-A-vs-B AI response template.
- [x] Добавить source-grounded AI template для developer due diligence: positives, risks, questions to ask, citations, disclaimers.
- [ ] Добавить source citations в каждый AI response.
- [ ] Добавить refusal rules для юридических гарантий, финансовых рекомендаций и прогнозов без disclaimer.
- [ ] Добавить AI summaries для news и area impact.

## 14. News и SEO

- [ ] Добавить news_articles schema.
- [ ] Добавить ручной news ingestion v1.
- [ ] Добавить AI summary для новости.
- [x] Добавить SEO area pages.
- [x] Добавить sitemap.
- [x] Добавить robots.txt.
- [x] Добавить structured data.
- [ ] Добавить news categories: market, mortgage, tax, legal, developer, city investment, transport, MPZP.
- [ ] Добавить area impact fields для news: affected districts, price impact hypothesis, audience relevance.
- [ ] Добавить SEO pages: Wrocław price per m2, best districts, where to buy near Wrocław, district comparison.
- [ ] Добавить SEO pages: flats with growth potential, Dolnośląskie market analysis, mortgage calculator Poland.
- [ ] Добавить SEO pages: purchase checklist, księga wieczysta checklist, total purchase cost in Poland.
- [ ] Добавить internal linking между SEO pages, area pages, listings и reports.

## 15. Testing, Quality и Observability

- [x] Добавить API tests.
- [x] Добавить scoring tests.
- [x] Добавить ingestion tests.
- [x] Добавить report tests.
- [x] Добавить agency accounts API/contract tests.
- [x] Добавить optional repository integration tests с Postgres.
- [x] Добавить contract tests для API.
- [ ] Добавить coverage report.
- [ ] Добавить structured logging.
- [ ] Добавить error tracking.
- [ ] Добавить performance smoke tests.
- [ ] Добавить data quality acceptance tests для geocoding, dedup и source freshness.
- [ ] Добавить contract tests для paid artifacts и report metadata.
- [ ] Добавить frontend smoke tests для search, map, reports, admin и payments.
- [ ] Добавить load/performance smoke для listings search и map features.

## 16. Deployment

- [ ] Выбрать MVP hosting: VPS/Render/Railway/Fly.io/Cloud Run.
- [x] Добавить production Docker build.
- [x] Добавить environment variable documentation.
- [ ] Добавить managed Postgres/PostGIS.
- [ ] Добавить Redis.
- [ ] Добавить backup strategy.
- [x] Добавить staging environment.
- [ ] Добавить production deploy.
- [ ] Добавить S3-compatible bucket для отчетов и generated artifacts.
- [ ] Добавить background worker deployment для alerts, ingestion и report generation.
- [ ] Добавить production monitoring: uptime, job failures, source freshness, payment webhooks.
- [ ] Добавить cost controls для maps, AI и infrastructure.

## 17. Go-to-Market, Sales и Partnerships

- [ ] Сделать demand-validation landing page для “проверка квартиры перед покупкой”.
- [ ] Сделать landing variant для “аналитика и отчеты для риелторов”.
- [ ] Подготовить outreach scripts для LinkedIn, Facebook groups и cold emails агентствам.
- [ ] Запустить список paid beta candidates: риелторы, маленькие агентства, инвесторы, ипотечные брокеры.
- [ ] Описать manual/semi-automated workflow первого платного отчета.
- [ ] Подготовить offer для отчетов: object report, area report, realtor report, hidden gems подборка.
- [ ] Подготовить партнерскую модель: mortgage brokers, banks, insurers, lawyers, notaries, appraisers, renovation/design partners.
- [ ] Добавить правило явной маркировки рекламы, promoted listings и sponsored reports.
- [x] Добавить lead tracking для partner referrals и early sales.

## 18. Agency, Enterprise/API и Data Products

- [x] Добавить agency workspace model.
- [ ] Добавить CRM-light backlog: clients, shortlists, notes, report sharing.
- [ ] Добавить API-lite для agency/enterprise consumers.
- [ ] Добавить API keys, quotas, usage logs и rate limits.
- [ ] Добавить export datasets для investor/realtor plans.
- [ ] Добавить market intelligence reports для banks, developers and funds.
- [ ] Добавить scoring-as-a-service endpoint design.
- [ ] Добавить custom dashboard backlog для enterprise clients.
- [ ] Добавить lead scoring backlog для mortgage/broker partnerships.

## 19. Expansion Roadmap

- [ ] Подготовить критерии масштабирования за пределы Wrocław/Dolnośląskie.
- [ ] Добавить roadmap для аренды.
- [ ] Добавить roadmap для домов, земли и commercial real estate.
- [ ] Подготовить data-source checklist для других городов Польши.
- [ ] Подготовить country expansion checklist для Czechia, Germany, Spain and EU markets.

## 20. Git Commit Milestones

- [x] Commit 1: product docs, backend foundation, DB, ingestion, HTML reports.
- [x] Commit 2: report persistence and report history API.
- [x] Commit 3: favorites and alerts foundation.
- [x] Commit 4: frontend MVP shell and listing pages.
- [x] Commit 5: map MVP.
- [x] Commit 6: auth and subscriptions foundation.
- [x] Commit 7: paid report flow.
- [x] Commit 8: deployment MVP.
- [x] Commit 9: search pagination and compare page.
- [x] Commit 10: ingestion admin MVP.
- [x] Commit 11: planned investments CRUD.
- [x] Commit 12: SEO area pages.
- [x] Commit 13: payment audit and alert delivery skeleton.
- [x] Commit 14: payment webhook processing.
- [x] Commit 15: alert delivery transports.
- [x] Commit 16: PostGIS staging verifier.
- [x] Commit 17: planned investments open-data ingestion.
- [x] Commit 18: source registry and partner onboarding.
- [x] Commit 19: price history update pipeline.
- [x] Commit 20: hybrid user-provided listing analysis flow.
- [x] Commit 21: user-submitted buyer object-check report.
- [x] Commit 22: user-submitted draft persistence and retention.
- [x] Commit 23: saved report generation from user-submitted draft.
- [x] Commit 24: user-facing private draft history page.
- [x] Commit 25: paid report orders for user-submitted drafts.
- [x] Commit 26: paid area report product.
- [x] Commit 27: distinct paid full object analysis artifact.
- [x] Commit 28: report bundle credits package.
- [x] Commit 29: CSV/JSON report history exports.
- [x] Commit 30: Investor plan limits.
- [x] Commit 31: partner referral lead capture.
- [x] Commit 32: daily email alert batch delivery.
- [x] Commit 33: URL-assisted private listing check.
- [x] Commit 34: one-off URL import for private listing checks.
- [x] Commit 35: human-readable score labels.
- [x] Commit 36: user-submitted reference source telemetry.
- [x] Commit 37: live PostGIS migration verification.
- [x] Commit 38: PostGIS geometry columns and spatial indexes.
- [x] Commit 39: PostGIS distance calculations for radius queries.
- [x] Commit 40: listing event timeline from price history.
- [x] Commit 41: property deduplication review queue.
- [x] Commit 42: location reference tables and API.
- [x] Commit 43: infrastructure reference tables and API.
- [x] Commit 44: AI insight persistence for generated reports.
- [x] Commit 45: source check jobs and source error retry queue.
- [x] Commit 46: infrastructure enrichment pipeline.
- [x] Commit 47: district and city comparison analytics.
- [x] Commit 48: S3-compatible report artifact storage abstraction.
- [x] Commit 49: Stripe/PayU hosted checkout API adapters.
- [x] Commit 50: official open-data roadmap API.
- [x] Commit 51: infrastructure reference JSON/CSV import.
- [x] Commit 52: native PDF report export.
- [x] Commit 53: B2B invoice metadata for checkout.
- [x] Commit 54: white-label report controls.
- [x] Commit 55: agency workspaces and memberships.
- [x] Commit 56: stronger link-to-report flow for user-submitted URLs.
- [x] Commit 57: suburban Mędłów coverage for link reports.
- [x] Commit 58: suburban coverage pack for link reports.
- [x] Commit 59: stronger URL extraction fixtures.
- [x] Commit 60: source-backed suburban coverage samples.
- [x] Commit 61: comparison decision metrics and mortgage baseline.
- [x] Commit 62: hidden gems search mode.
- [x] Commit 63: proximity filters for search and hidden gems.
- [x] Commit 64: text and address search for listings.
- [x] Commit 65: developer reputation data model and source-backed report section.

## Current Sprint

Цель: перейти от skeleton к production-grade интеграциям и данным.

- [x] Добавить PostGIS staging verifier и optional integration test.
- [x] Сделать Commit 16 и push.
- [x] Добавить JSON/CSV import planned investments.
- [x] Добавить sample open-data файл по Wrocław transport investments.
- [x] Добавить тесты dry-run и idempotent upsert.
- [x] Добавить source registry backend/API/UI.
- [x] Добавить partner data onboarding format.
- [x] Добавить price history update pipeline и backfill command/API.
- [x] Добавить hybrid user-provided listing analysis spec в план.
- [x] Реализовать first slice: публичная форма проверки квартиры + backend draft/analysis endpoint.
- [x] Добавить buyer report endpoint и UI для user-submitted draft.
- [x] Добавить private draft persistence, owner-scoped draft endpoints, admin list/prune и retention metadata.
- [x] Добавить генерацию saved report из user-submitted draft в существующую историю отчетов.
- [x] Добавить user-facing страницу истории private drafts с удалением и генерацией отчетов.
- [x] Добавить paid checkout/fulfillment из private draft через существующий report order lifecycle.
- [x] Добавить paid area report product через `area:<area_id>` order reference.
- [x] Добавить distinct paid artifact для `full_object_analysis`.
- [x] Добавить `report_bundle_5` paid package и списание credits сверх monthly limit.
- [x] Добавить owner-scoped CSV/JSON export saved reports для планов с `can_export`.
- [x] Добавить Investor plan limits в тарифную сетку.
- [x] Добавить partner referral lead capture API/store/UI и admin review queue.
- [x] Добавить daily email alert batch delivery для cron/admin запуска.
- [x] Добавить URL-assisted private listing check: reference preview + быстрый отчет на `/check`.
- [x] Добавить one-off URL import для автозаполнения `/check` по user-submitted Otodom/OLX URL.
- [x] Добавить человекочитаемые score labels в API/UI/report metadata.
- [x] Добавить `user_submitted_reference` source type и sanitized telemetry для private URL import.
- [x] Проверить миграции на живой PostGIS БД после стабилизации Docker Desktop.
- [x] Добавить geometry columns и GiST spatial indexes для `properties` и `planned_investments`.
- [x] Добавить PostGIS distance calculations для listing/map radius queries и private draft scoring.
- [x] Добавить `listing_events` timeline из snapshots для price/parameter/status changes.
- [x] Добавить `property_deduplication_matches` review queue с match score, reasons и admin API/UI.
- [x] Добавить справочники `municipalities`, `districts`, `location_references` с public API.
- [x] Добавить infrastructure reference tables/API для transport, education, amenities и industrial zones.
- [x] Добавить `ai_insights` table/store/API и сохранение report summaries/object explanations для generated reports.
- [x] Добавить `source_check_jobs`/`source_errors` для legal source checks, sanitized URL import failures и retry queue.
- [x] Добавить data enrichment pipeline для infrastructure matching и distance calculations.
- [x] Добавить district/city comparison analytics и страницу сравнения районов.
- [x] Добавить S3-compatible storage abstraction для generated PDF/HTML artifacts.
- [x] Подключить hosted checkout API для Stripe и PayU.
- [x] Добавить official open-data ingestion roadmap API.
- [x] Добавить import для schools/kindergartens/transport/healthcare/parks/industrial zones.
- [x] Добавить native PDF generation для object reports и saved report history.
- [x] Добавить invoice/VAT metadata для B2B checkout.
- [x] Добавить white-label PDF controls для logo, colors, footer и agency disclaimer.
- [x] Добавить team/agency accounts: workspace, memberships и owner/admin/agent роли.
- [x] Добавить управление agency workspace и участниками на account page.
- [x] Доработать one-click Otodom/OLX link-to-report flow с enhanced private listing report.
- [x] Добавить nearest covered market fallback для объектов вне текущего coverage.
- [x] Добавить Mędłów coverage seed для Otodom link-to-report без proxy-market fallback.
- [x] Добавить Kobierzyce/Wysoka/Bielany/Oława coverage pack для link-to-report.
- [x] Добавить stronger URL extraction fixtures для Otodom/OLX embedded state variants.
- [x] Перевести suburban coverage seeds в partner/open-data sample files вместо ручных listing blocks.
- [x] Добавить расширенный compare API/UI: decision rank, ипотечный baseline, cash needed, liquidity и rental potential.
- [x] Добавить hidden gems search mode: API, ranked signals и frontend режим с investor-фильтрами.
- [x] Добавить proximity-фильтры в search/hidden gems: центр, остановка, школа, major road и industrial zone.
- [x] Добавить text/address search в listings, hidden gems и saved-search alerts.
- [x] Добавить developer reputation/ranking foundation: data model, sources, score, report section и frontend ranking.
- [x] Добавить developer filters/sort в listings и hidden gems: reputation, confidence, projects и risk signals.
- [x] Усилить developer due diligence в отчетах: posture, projects, signals, registry checks, citations и disclaimer.
- [x] Добавить buyer decision summary в object/link reports: recommendation, max offer, risks и pre-zadatek checks.
- [x] Добавить First_prompt-style fit/outlook answers в object/link reports: family, rental, liquidity и future area signals.
- [x] Добавить listing future-impact API и report integration: radius buckets, nearest planned investments, impact score.
- [x] Добавить structured listing risk profile API/report integration: risk factors, evidence, checks, missing risk layers.
- [x] Добавить listing rental estimate API/report integration: rent range, gross yield, NOI, cash/financed cashflow scenarios.
- [x] Сделать Commit 17 и push.
- [x] Сделать Commit 18 и push.
- [x] Сделать Commit 19 и push.
- [x] Сделать Commit 20 и push.
- [x] Сделать Commit 21 и push.
- [x] Сделать Commit 22 и push.
- [x] Сделать Commit 23 и push.
- [x] Сделать Commit 24 и push.
- [x] Сделать Commit 25 и push.
- [x] Сделать Commit 26 и push.
- [x] Сделать Commit 27 и push.
- [x] Сделать Commit 28 и push.
- [x] Сделать Commit 29 и push.
- [x] Сделать Commit 30 и push.
- [x] Сделать Commit 31 и push.
- [x] Сделать Commit 32 и push.
- [x] Сделать Commit 33 и push.
- [x] Сделать Commit 34 и push.
- [x] Сделать Commit 35 и push.
- [x] Сделать Commit 36 и push.
- [x] Сделать Commit 37 и push.
- [x] Сделать Commit 38 и push.
- [x] Сделать Commit 39 и push.
- [x] Сделать Commit 40 и push.
- [x] Сделать Commit 41 и push.
- [x] Сделать Commit 42 и push.
- [x] Сделать Commit 43 и push.
- [x] Сделать Commit 44 и push.
- [x] Сделать Commit 45 и push.
- [x] Сделать Commit 46 и push.
- [x] Сделать Commit 47 и push.
- [x] Сделать Commit 48 и push.
- [x] Сделать Commit 49 и push.
- [x] Сделать Commit 50 и push.
- [x] Сделать Commit 51 и push.
- [x] Сделать Commit 52 и push.
- [x] Сделать Commit 53 и push.
- [x] Сделать Commit 54 и push.
- [x] Сделать Commit 55 и push.
- [x] Сделать Commit 56 и push.
- [x] Сделать Commit 57 и push.
- [x] Сделать Commit 58 и push.
- [x] Сделать Commit 59 и push.
- [x] Сделать Commit 60 и push.
