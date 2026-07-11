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
- [ ] Обновить 12-месячный roadmap по фактическому состоянию продукта.
- [ ] Описать минимальную команду запуска и зоны ответственности.
- [ ] Оценить сложность блоков: ingestion, dedup, geocoding, PostGIS, map, scoring, reports, payments, alerts, AI, scaling, legal.

## 1.1 Legal, Compliance и Data Governance

- [ ] Зафиксировать policy по Terms of Service, robots.txt и rate limiting для каждого источника.
- [ ] Описать правила хранения оригинальных ссылок, raw payload и минимально необходимых данных.
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
- [ ] Проверить миграции на живой PostGIS БД после запуска Docker Desktop.
- [ ] Добавить geometry columns и spatial indexes.
- [x] Добавить таблицы `generated_reports`, `user_favorites`, `user_alerts`.
- [x] Добавить миграционную проверку в CI.
- [ ] Добавить таблицы `listing_events` и расширить price history под снятие/републикацию/изменение параметров.
- [ ] Добавить таблицу `property_deduplication_matches` для review queue и объяснения match decisions.
- [ ] Добавить справочники `locations`, `districts`, `municipalities`.
- [ ] Добавить таблицы инфраструктуры: `transport_stops`, `transport_routes`, `schools`, `kindergartens`, `amenities`, `industrial_zones`.
- [ ] Добавить `ai_insights` для сохранения AI summaries и object explanations.
- [ ] Добавить `scraping_jobs`/`source_errors` или эквивалент для легальных source checks без агрессивного scraping lock-in.
- [ ] Добавить S3-compatible storage abstraction для generated PDF/HTML artifacts.

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
- [ ] Добавить OpenSearch или PostgreSQL full-text search.
- [x] Добавить saved searches.
- [ ] Расширить фильтры: gmina, voivodeship, floor, building floors, building year, building type, renovation state.
- [ ] Добавить lifestyle-фильтры: balcony, terrace, garden, elevator, parking, heating.
- [ ] Добавить proximity-фильтры: distance to center, stop, school, major road, industrial zone.
- [ ] Добавить фильтры по rental potential, liquidity и data quality для investor/realtor workflows.
- [ ] Добавить API для поиска объектов ниже рынка и hidden gems.
- [ ] Добавить API сравнения 2-5 объектов с mortgage payment, rental potential и liquidity fields.

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
- [ ] Добавить data enrichment pipeline для infrastructure matching и distance calculations.
- [ ] Добавить official open-data ingestion roadmap: GUGiK/Geoportal, RCN, GUS/BDL, MPZP/Studium, OSM, GTFS.
- [ ] Добавить импорт schools/kindergartens/transport/healthcare/parks/industrial zones.
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
- [ ] Добавить человекочитаемые score labels: good option, overpriced, negotiable, risky, investment potential.
- [x] Добавить market dashboards: active/new/removed listings, exposure time, price/rooms/area distributions.
- [ ] Добавить district/city comparison analytics.
- [x] Добавить market indexes: overheated area, buyer market, seller market, area liquidity.
- [ ] Добавить future-area-development analysis по радиусам 500 м, 1 км, 2 км, 5 км, 10 км.
- [ ] Добавить growth factors: transport, schools, parks, hospitals, retail, offices, universities, population/jobs growth.
- [ ] Добавить risk factors: noise, flood, pollution, airport/rail/industrial zones, oversupply, weak transport, weak rental yield.
- [ ] Добавить rental estimate и gross yield/cashflow inputs для investor flow.
- [x] Добавить mortgage affordability и total purchase cost inputs в buyer analytics.
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
- [ ] Добавить native PDF generation.
- [x] Добавить email delivery.
- [x] Добавить mortgage calculation и total purchase cost в buyer report v1.
- [x] Добавить buyer report секции: mortgage calculation, seller questions, purchase checklist, total cost.
- [x] Добавить realtor report секции: map, comparable listings table, client-facing price arguments.
- [x] Добавить investor report секции: rental yield, alternatives comparison, liquidity and growth thesis.
- [ ] Добавить paid area report product.
- [ ] Добавить full object analysis report product.
- [ ] Добавить bundles: package of 5 reports.
- [ ] Добавить white-label PDF controls для logo, colors, footer и agency disclaimer.
- [ ] Добавить export reports в CSV/JSON для realtor/investor workflows.

## 8. Users, Auth и Payments

- [x] Выбрать MVP auth strategy: header identity с fallback на future Auth.js/Clerk/custom JWT.
- [x] Добавить users table.
- [x] Добавить roles: buyer, realtor, agency_admin, admin.
- [x] Добавить subscriptions table.
- [x] Добавить access limits для Free/Buyer Pro/Realtor.
- [x] Добавить PayU/Stripe adapter interface поверх mock checkout.
- [x] Добавить Stripe/PayU webhook signature verification.
- [x] Добавить payment callback endpoints и idempotency keys.
- [ ] Подключить hosted checkout API для Stripe или PayU.
- [x] Добавить one-time report purchase flow.
- [x] Добавить audit logging для paid artifacts.
- [ ] Добавить тарифы Investor, Agency и Enterprise/API в plan limits.
- [ ] Добавить team/agency accounts: несколько агентов под одной организацией.
- [ ] Добавить роли и права для agency owner/admin/agent.
- [ ] Добавить report credits и usage quotas для packages.
- [ ] Добавить invoice/VAT metadata для B2B checkout.
- [ ] Добавить lead capture для mortgage/legal/renovation partner referrals.

## 9. Favorites и Alerts

- [x] Добавить user_favorites table.
- [x] Добавить API избранного.
- [x] Добавить user_alerts table.
- [x] Добавить saved search alerts.
- [x] Добавить email alerts delivery skeleton.
- [x] Добавить Telegram alerts delivery skeleton.
- [x] Добавить фактическую SMTP delivery отправку.
- [x] Добавить фактическую Telegram Bot API delivery отправку.
- [ ] Добавить daily email alerts.
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
- [ ] Сделать страницу сравнения районов.
- [x] Сделать mortgage calculator page.
- [ ] Сделать news page.
- [ ] Сделать public demand-validation landing page для paid beta.
- [ ] Сделать mobile-friendly QA pass для ключевых страниц.
- [ ] Добавить charting library и графики price history/market distributions.
- [ ] Добавить realtor подборки объектов для клиента.
- [ ] Добавить investor hidden gems view.

## 11. Map и GIS

- [x] Подключить MapLibre.
- [x] Отобразить listings на карте.
- [ ] Добавить clusters.
- [x] Добавить infrastructure layers.
- [x] Добавить planned investments layer.
- [x] Добавить sample open-data слой Wrocław planned transport investments.
- [ ] Добавить PostGIS distance calculations.
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
- [ ] Добавить ручную загрузку/редактирование listing от риелтора.
- [ ] Добавить moderation workflow для data deletion requests.
- [ ] Добавить просмотр source errors и retry actions.
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
- [ ] Добавить lead tracking для partner referrals и early sales.

## 18. Agency, Enterprise/API и Data Products

- [ ] Добавить agency workspace model.
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
- [ ] Проверить миграции на живой PostGIS БД после стабилизации Docker Desktop.
- [x] Сделать Commit 17 и push.
- [x] Сделать Commit 18 и push.
- [x] Сделать Commit 19 и push.
