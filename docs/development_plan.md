# Domarion Analytics Development Plan

Дата старта плана: 2026-07-10  
Рабочая ветка: `main`  
Правило коммитов: коммит и push после завершения крупного блока, когда тесты и линтер проходят.

## 0. Правила разработки

- [x] Не хранить `.idea/`, `.venv/`, logs и generated exports в git.
- [x] Каждый крупный блок закрывать тестами.
- [x] Перед коммитом запускать `pytest` и `ruff`.
- [x] Держать документацию запуска в `README.md`.
- [ ] Добавить CI на GitHub Actions.
- [ ] Добавить pre-commit hooks после стабилизации форматирования.
- [ ] Вести changelog/release notes после первого deploy.

## 1. Product и Research

- [x] Подготовить полную концепцию продукта.
- [x] Описать целевые аудитории и MVP scope.
- [x] Описать источники данных и legal/data strategy.
- [x] Описать архитектуру, monetization, GTM, SEO, риски, roadmap.
- [ ] Провести legal review источников данных.
- [ ] Провести 20 интервью: покупатели, риелторы, инвесторы.
- [ ] Сформировать список первых 30 агентств/риелторов для paid beta.
- [ ] Подготовить коммерческий оффер для риелторов.

## 2. Repository и Backend Foundation

- [x] Удалить tracked `.idea/`.
- [x] Добавить `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`.
- [x] Добавить `pyproject.toml`.
- [x] Добавить FastAPI application factory.
- [x] Добавить health endpoint.
- [x] Добавить базовый README с командами запуска.
- [x] Добавить Dockerfile.
- [x] Добавить `compose.yaml` с PostGIS и Redis.
- [ ] Добавить GitHub Actions CI.
- [ ] Добавить Makefile/Taskfile или единый CLI для dev-команд.

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
- [ ] Добавить миграционную проверку в CI.

## 4. Listings и Search API

- [x] Добавить listing schemas.
- [x] Добавить in-memory demo listings по Wrocław.
- [x] Добавить `/api/v1/listings`.
- [x] Добавить `/api/v1/listings/{id}`.
- [x] Добавить `/api/v1/areas`.
- [x] Добавить `/api/v1/areas/{id}/statistics`.
- [x] Добавить сравнение `/api/v1/compare`.
- [ ] Добавить pagination.
- [ ] Добавить сортировку.
- [ ] Добавить фильтры по score, price/m2, days_on_market.
- [ ] Добавить OpenSearch или PostgreSQL full-text search.
- [x] Добавить saved searches.

## 5. Ingestion Pipeline

- [x] Добавить legal-first CSV ingestion для партнерских/ручных выгрузок.
- [x] Валидировать обязательные CSV-колонки.
- [x] Нормализовать listing fields.
- [x] Сохранять raw payload hash.
- [x] Сохранять property, property_source, listing_snapshots.
- [x] Добавить sample CSV.
- [x] Добавить dry-run CLI.
- [ ] Добавить ingestion jobs table usage.
- [ ] Добавить data quality logs.
- [ ] Добавить CSV import API endpoint для internal admin.
- [ ] Добавить дедупликацию v1 при импорте.
- [ ] Добавить geocoding pipeline.
- [ ] Добавить source monitoring и error reporting.

## 6. Scoring и Analytics

- [x] Добавить Fair Price Estimate v1.
- [x] Добавить Investment Score v1.
- [x] Добавить Risk Score v1.
- [x] Добавить Negotiation Score v1.
- [x] Добавить Liquidity Score v1.
- [x] Добавить Rental Potential Score v1.
- [x] Добавить объяснения, warnings и negotiation arguments.
- [ ] Вынести веса scoring в конфигурацию.
- [ ] Добавить версионирование scoring formulas.
- [ ] Добавить backtesting на historical snapshots.
- [ ] Добавить area market snapshots job.
- [ ] Добавить confidence score для fair price estimate.

## 7. Reports

- [x] Добавить JSON object report.
- [x] Добавить printable HTML report.
- [x] Добавить CLI генерацию HTML.
- [x] Добавить API endpoint HTML-отчета.
- [x] Добавить XSS escaping для HTML.
- [x] Добавить `generated_reports` в БД.
- [x] Добавить `/api/v1/reports` history endpoints.
- [ ] Добавить report templates для buyer/realtor/investor.
- [ ] Добавить branded realtor report fields.
- [ ] Добавить native PDF generation.
- [ ] Добавить email delivery.

## 8. Users, Auth и Payments

- [ ] Выбрать auth strategy: Auth.js/Clerk/custom JWT.
- [ ] Добавить users table.
- [ ] Добавить roles: buyer, realtor, agency_admin, admin.
- [ ] Добавить subscriptions table.
- [ ] Добавить access limits для Free/Buyer Pro/Realtor.
- [ ] Подключить Stripe или PayU.
- [ ] Добавить one-time report purchase flow.
- [ ] Добавить audit logging для paid artifacts.

## 9. Favorites и Alerts

- [x] Добавить user_favorites table.
- [x] Добавить API избранного.
- [x] Добавить user_alerts table.
- [x] Добавить saved search alerts.
- [ ] Добавить daily email alerts.
- [ ] Добавить Telegram alerts.
- [x] Добавить hidden gems alert v1.

## 10. Frontend MVP

- [x] Создать Next.js app.
- [x] Настроить TypeScript, API client и CSS design system.
- [x] Сделать layout и навигацию.
- [x] Сделать search page.
- [x] Сделать listing card.
- [x] Сделать listing detail page.
- [ ] Сделать compare page.
- [x] Сделать reports generation/history page.
- [x] Сделать alerts page.
- [ ] Сделать pricing page.
- [ ] Сделать account page.
- [ ] Подключить auth.

## 11. Map и GIS

- [ ] Подключить MapLibre.
- [ ] Отобразить listings на карте.
- [ ] Добавить clusters.
- [ ] Добавить infrastructure layers.
- [ ] Добавить planned investments layer.
- [ ] Добавить PostGIS distance calculations.
- [ ] Добавить filters by radius.
- [ ] Добавить risk/growth map overlays.

## 12. Admin Panel

- [ ] Добавить internal admin auth.
- [ ] Добавить список ingestion jobs.
- [ ] Добавить просмотр raw listings.
- [ ] Добавить ручное исправление normalized listing.
- [ ] Добавить dedup review queue.
- [ ] Добавить planned investments CRUD.
- [ ] Добавить data quality dashboard.

## 13. AI Assistant

- [ ] Добавить AI data contract: какие данные можно использовать.
- [ ] Добавить object summary prompt.
- [ ] Добавить buyer/realtor/investor answer templates.
- [ ] Добавить source-grounded responses.
- [ ] Добавить hallucination guardrails.
- [ ] Добавить AI usage logging.
- [ ] Добавить limited AI endpoint.

## 14. News и SEO

- [ ] Добавить news_articles schema.
- [ ] Добавить ручной news ingestion v1.
- [ ] Добавить AI summary для новости.
- [ ] Добавить SEO area pages.
- [ ] Добавить sitemap.
- [ ] Добавить robots.txt.
- [ ] Добавить structured data.

## 15. Testing, Quality и Observability

- [x] Добавить API tests.
- [x] Добавить scoring tests.
- [x] Добавить ingestion tests.
- [x] Добавить report tests.
- [ ] Добавить repository integration tests с Postgres.
- [ ] Добавить contract tests для API.
- [ ] Добавить coverage report.
- [ ] Добавить structured logging.
- [ ] Добавить error tracking.
- [ ] Добавить performance smoke tests.

## 16. Deployment

- [ ] Выбрать MVP hosting: VPS/Render/Railway/Fly.io/Cloud Run.
- [ ] Добавить production Docker build.
- [ ] Добавить environment variable documentation.
- [ ] Добавить managed Postgres/PostGIS.
- [ ] Добавить Redis.
- [ ] Добавить backup strategy.
- [ ] Добавить staging environment.
- [ ] Добавить production deploy.

## 17. Git Commit Milestones

- [x] Commit 1: product docs, backend foundation, DB, ingestion, HTML reports.
- [x] Commit 2: report persistence and report history API.
- [x] Commit 3: favorites and alerts foundation.
- [x] Commit 4: frontend MVP shell and listing pages.
- [ ] Commit 5: map MVP.
- [ ] Commit 6: auth and subscriptions foundation.
- [ ] Commit 7: paid report flow.
- [ ] Commit 8: deployment MVP.

## Current Sprint

Цель: заменить MVP-карту-схему на полноценный MapLibre/PostGIS map MVP.

- [ ] Подключить MapLibre к frontend.
- [ ] Сделать endpoint с listings geojson/features.
- [ ] Отобразить markers и price labels.
- [ ] Добавить bbox/radius filters.
- [ ] Добавить первый слой planned investments из demo/open data.
- [ ] Добавить risk/growth overlays v1.
- [ ] Добавить tests для geo endpoint.
- [ ] Сделать Commit 5 и push.
