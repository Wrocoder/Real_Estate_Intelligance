# Domarion Analytics: экспертный обзор проекта

Дата: 2026-07-22  
База обзора: `development_plan.md`, `First_prompt_ru.md`, текущий код проекта  
Последний кодовый commit перед этим документом: `ccad19b Localize compare page`

## 1. Краткое резюме

Domarion Analytics / Real Estate Intelligence Poland - SaaS-платформа для
аналитики недвижимости в Польше. MVP сфокусирован на Wroclaw,
Dolnoslaskie и пригородах вокруг Wroclaw, тип недвижимости - квартиры на
продажу, первичный и вторичный рынок.

Главная продуктовая идея из `First_prompt_ru.md`: не просто показывать
объявления, а объяснять, насколько цена справедлива, какие есть риски, что
может влиять на стоимость объекта в будущем, можно ли торговаться и насколько
объект подходит для жизни, аренды или инвестиций.

Текущий проект уже больше похож на технический paid-beta MVP, чем на
wireframe:

- есть FastAPI backend, Next.js frontend, PostGIS-ready model, Alembic
  migrations, in-memory и PostgreSQL repository/store реализации;
- есть поиск объектов, карта, скоринги, детальная аналитика, сравнение
  объектов, отчеты, private check по URL/адресу, draft history, paid report
  flow, alerts, developer reputation, admin ingestion, CRM-light и API-lite;
- есть legal-first data strategy: user-submitted URL only, partner/open-data
  ingestion, source registry, retention policy, запрет фото/контактов/full
  descriptions/raw HTML без отдельного правового основания;
- есть тестовая база: 44 test files, 49 service modules, 32 migrations,
  179 API route decorators, 20 frontend page components.

Главный риск сейчас не "нет продукта", а наоборот: продуктовая поверхность уже
широкая, а внешняя проверка спроса, legal review источников, production deploy
и реальные источники данных еще не закрыты.

## 2. Для кого продукт

### B2C покупатель

Пользователь вставляет ссылку на квартиру с Otodom/OLX или вводит адрес и
параметры вручную. Система строит buyer report:

- fair price range;
- price per m2 и сравнение с аналогами;
- investment/risk/negotiation/liquidity/rental scores;
- ипотека и total purchase cost;
- buyer decision summary;
- max offer / offer anchor;
- pre-zadatek checklist;
- developer reputation, если застройщик распознан;
- future area impact, infrastructure, growth/risk signals;
- warnings и confidence.

### Риелтор / агентство

Сценарий: быстро подготовить клиенту аргументированный отчет или подборку.

Уже есть:

- branded reports / white-label controls;
- compare page для 2-5 объектов;
- realtor client shortlist preview;
- agency workspace;
- CRM-light: clients, notes, shortlists, share preview;
- exports и report bundles.

Открытая задача в плане: ручная загрузка/редактирование listing от риелтора.
Пользователь проекта решил временно пропустить ее и вернуться позже.

### Инвестор

Сценарий: искать undervalued / hidden gems, оценивать rental yield, liquidity,
future growth и risk. Уже есть hidden gems mode, rental estimate, growth
analysis, alert filters и market dashboards. Практическая ценность этого слоя
сильно зависит от покрытия реальными active listings.

### Enterprise/API buyers

В перспективе: банки, девелоперы, фонды, аналитические компании.

Уже есть техническая основа:

- API-lite с API key, quotas, usage logs;
- scoring-as-a-service;
- market intelligence reports;
- dataset exports;
- enterprise custom dashboards.

Это полезно как future option, но для ближайшей paid beta B2C/B2Pro важнее
сначала доказать готовность one-time reports и realtor bundles.

## 3. Основные пользовательские flows

### 3.1. Link-to-report / Check apartment

Frontend: `/check`  
Backend:

- `POST /api/v1/user-submitted-listings/reference-preview`;
- `POST /api/v1/user-submitted-listings/import-from-url`;
- `POST /api/v1/user-submitted-listings/analyze`;
- `POST /api/v1/user-submitted-listings/report`;
- `GET /api/v1/user-submitted-listings/drafts`;
- `POST /api/v1/user-submitted-listings/drafts/{draft_id}/reports/generate`.

Flow:

1. Пользователь вставляет URL или вводит параметры.
2. Для Otodom/OLX backend делает one-off fetch без anti-bot bypass.
3. Извлекаются только минимальные поля объекта: цена, площадь, комнаты, этаж,
   этажность, год, адрес/район, developer/investment name, если доступны.
4. Пользователь подтверждает право использовать ссылку/данные и может поправить
   поля.
5. Объект сохраняется как private draft, owner-scoped.
6. Аналитика строится не на скопированном portal content, а на наших
   legal-first comparables, area statistics, planned investments, GIS/open-data
   layers и scoring services.
7. Отчет не показывает source URL и не хранит фото, контакты, full description
   или raw HTML.

Почему так сделано: массовый scraping порталов остается legal/business risk.
Гибридный flow дает похожий UX, но не ставит всю ценность продукта на спорный
источник.

### 3.2. Search / Explorer

Frontend: `/`  
Backend:

- `GET /api/v1/listings`;
- `GET /api/v1/listings/hidden-gems`;
- `GET /api/v1/map/features`;
- favorites, alerts, saved-search endpoints.

Возможности:

- фильтры по городу, району, gmina/municipality, voivodeship;
- building type, renovation state, floor, building floors, building year;
- balcony, terrace, garden, elevator, parking, heating;
- distance to center, stop, school, major road, industrial zone;
- investment/risk/negotiation/liquidity/rental/data quality filters;
- developer reputation/confidence filters;
- text/address search;
- MapLibre карта с listings, heatmap, clusters, infrastructure,
  planned investments, risk/planning/transport layers.

### 3.3. Listing detail

Frontend: `/listings/{id}`  
Backend:

- `GET /api/v1/listings/{id}`;
- `GET /api/v1/listings/{id}/analysis`;
- `GET /api/v1/listings/{id}/future-impact`;
- `GET /api/v1/listings/{id}/growth-analysis`;
- `GET /api/v1/listings/{id}/risk-profile`;
- `GET /api/v1/listings/{id}/rental-estimate`;
- `GET /api/v1/listings/{id}/developer`;
- AI assistant endpoints.

Показывает:

- object metrics;
- fair price;
- score bars;
- price history;
- comparables;
- area statistics/news/guides;
- developer profile;
- AI assistant with citations/guardrails.

### 3.4. Compare

Frontend: `/compare`  
Backend:

- `POST /api/v1/compare`;
- `POST /api/v1/ai/compare/answer`;
- `POST /api/v1/realtor/client-shortlists/preview`.

Пользователь выбирает 2-5 объектов и получает:

- best choice;
- below fair price;
- cheaper monthly;
- rental signal;
- decision rank;
- mortgage baseline;
- cash needed;
- rental estimate;
- liquidity and rental potential;
- developer risk/check row;
- AI verdict;
- client shortlist для риелтора.

### 3.5. Reports / Paid reports

Frontend: `/reports`, `/pricing`  
Backend:

- `POST /api/v1/reports/object/generate`;
- `GET /api/v1/reports`;
- `GET /api/v1/reports/{id}`;
- `GET /api/v1/reports/{id}/content`;
- `GET /api/v1/reports/{id}/pdf`;
- `GET /api/v1/report-products`;
- `POST /api/v1/report-orders`;
- mock pay / fulfill;
- Stripe/PayU webhook routes.

Report types:

- buyer object report;
- realtor report;
- investor report;
- user-submitted draft report;
- paid area report;
- full object analysis;
- bundle receipt.

Artifact layer supports local and S3-compatible storage abstraction.

### 3.6. Admin / Data Operations

Frontend: `/admin`  
Backend:

- ingestion jobs;
- source registry;
- source health;
- source checks/errors;
- raw listings;
- data quality logs;
- normalized listing correction;
- planned investments CRUD/import;
- partner CSV import;
- infrastructure import/enrichment;
- developer feed import/editor/moderation;
- deduplication review queue;
- data deletion requests;
- audit logs.

Этот слой важен, потому что продукт не должен зависеть от ad-hoc scripts:
данные и источники должны иметь owner, status, allowed use, retention and QA.

## 4. Data strategy и compliance

Проект сознательно не строится на агрессивном scraping одного портала.

Разрешенные/предпочтительные источники:

- partner CSV/API от агентств и риелторов;
- user-submitted URL как private one-off reference;
- official/open data: GUGiK/Geoportal, GUS/BDL, MPZP/Studium, GTFS, city
  geoportals, OSM;
- developer feeds/directories после source-specific review;
- paid data providers после договора.

Запрещено без отдельного правового основания:

- копировать или хранить фото;
- телефоны, email, имена частных продавцов/владельцев;
- full portal descriptions;
- raw HTML после парсинга;
- login/paywall/captcha-protected content;
- scheduled portal crawling без legal approval.

Важно для эксперта: технически one-off URL import уже реализован, но это не
означает, что можно включать массовый crawler. Массовая агрегация portal data
должна проходить отдельный legal review по ToS, database rights, robots,
retention, attribution and commercial use.

Ключевые документы:

- `docs/source_compliance_policy.md`;
- `docs/hybrid_listing_analysis.md`;
- `docs/data_governance_retention.md`;
- `docs/developer_reputation_plan.md`;
- `docs/partner_onboarding.md`;
- `docs/poland_city_expansion_checklist.md`.

## 5. Архитектура

### Backend

Стек:

- FastAPI;
- Pydantic schemas;
- SQLAlchemy/Alembic;
- PostgreSQL/PostGIS-ready repository layer;
- in-memory repository/store implementations for local/demo/tests;
- optional Redis-compatible worker/cache direction;
- local/S3-compatible report artifact storage.

Главный entrypoint:

- `main.py`;
- `domarion/main.py`;
- router: `domarion/api/routes.py`.

Основные service modules:

- `search.py` - поиск и фильтры;
- `scoring.py` / `scoring_service.py` - scoring/fair price;
- `user_submitted_listings.py` - private URL/address draft analysis;
- `report_generation.py`, `report_templates.py`, `report_html.py`,
  `report_pdf.py` - отчеты;
- `listing_comparison.py` - compare metrics;
- `developer_reputation.py` / `developer_filters.py`;
- `future_impact.py`, `growth_analysis.py`, `risk_profile.py`,
  `rental_estimate.py`;
- `market_dashboard.py`, `market_intelligence.py`, `area_comparison.py`;
- `alerts.py`, `alert_delivery.py`, `alert_scheduler.py`;
- `payments.py`, `report_products.py`;
- `crm.py`, `realtor_shortlists.py`, `realtor_digests.py`;
- `api_lite.py`, `custom_dashboards.py`;
- `production_readiness.py`.

Store/repository pattern:

- listing/area data: `domarion/repositories`;
- generated reports: `domarion/report_store`;
- user-submitted drafts: `domarion/user_submitted_listing_store`;
- users/auth/subscriptions: `domarion/user_store`, `domarion/auth_store`;
- report orders: `domarion/report_order_store`;
- ingestion admin: `domarion/ingestion_admin_store`;
- agencies/CRM: `domarion/agency_store`, `domarion/crm_store`;
- AI insights: `domarion/ai_insight_store`;
- news: `domarion/news_store`;
- partner referrals: `domarion/partner_referral_store`.

### Frontend

Стек:

- Next.js app router;
- TypeScript;
- MapLibre for maps;
- lucide-react icons;
- local i18n dictionaries.

Основные страницы:

- `/` - explorer/search/map;
- `/check` - private apartment check and link-to-report;
- `/check/drafts` - private draft history;
- `/listings/{id}` - listing detail;
- `/compare` - object comparison;
- `/reports` - report history/generation;
- `/pricing` - paid report products/orders;
- `/alerts` - saved searches and delivery controls;
- `/account` - account, plan, agency workspace, CRM-light;
- `/admin` - ingestion/data-quality/admin operations;
- `/areas`, `/areas/{areaId}`, `/areas/compare`;
- `/developers`, `/developers/{developerId}`;
- `/market`, `/mortgage`, `/news`, `/guides`;
- `/beta`, `/realtors`.

I18n:

- supported locales: English, Polish, Russian, Ukrainian;
- language switcher in navigation;
- cookie/localStorage persistence;
- localized explorer, listing cards, `/check`, `/check/drafts`,
  `/listings/{id}`, `/compare`;
- remaining i18n work: reports, alerts, pricing, account, areas, news,
  developers, CRM-light, backend messages, generated reports, AI prompts,
  email/Telegram, SEO hreflang.

## 6. Scoring и аналитика

Реализованные scoring layers:

- Fair Price Estimate;
- Investment Score;
- Risk Score;
- Negotiation Score;
- Liquidity Score;
- Rental Potential Score;
- Developer Reputation Score;
- data quality/confidence;
- future impact / growth / risk profile / rental estimate;
- backtesting report for fair price estimate.

Хороший принцип: score не должен выглядеть как абсолютная истина. В отчетах и
AI answers должны оставаться confidence, warnings, disclaimers and source
citations.

Что стоит проверить эксперту:

- понятны ли score labels обычному покупателю;
- не слишком ли много метрик на первом экране;
- достаточно ли хорошо отделены "точные факты" от "модельных оценок";
- насколько report wording юридически осторожен;
- какие scoring weights могут быть опасны без реальных historical data.

## 7. AI Assistant

Реализованные AI-oriented flows:

- listing AI assistant;
- user-submitted draft AI assistant;
- compare AI verdict;
- area impact AI summary;
- news AI summary;
- stored AI insights;
- citations, guardrails, refusal rules, usage logging.

Важно: AI должен быть source-grounded. Он не должен:

- гарантировать доходность;
- давать юридическое заключение;
- обещать рост цены;
- использовать запрещенные source data;
- раскрывать private URL.

Открытая i18n задача: AI prompts/templates пока надо довести до
locale-aware поведения, чтобы пользователь на EN/PL/RU/UK получал не только UI,
но и ответы/дисклеймеры/цитаты на выбранном языке.

## 8. Payments, accounts, alerts

Accounts/subscriptions:

- demo `/me`;
- plan limits;
- usage limits for reports/favorites/alerts/compare items;
- agency workspace and memberships.

Payments:

- report products;
- report orders;
- mock checkout;
- Stripe/PayU hosted checkout adapters;
- webhooks with idempotency and fulfillment path;
- B2B invoice/VAT metadata;
- audit events.

Alerts:

- saved searches;
- alert preview;
- daily email batch delivery;
- Telegram/email channel direction;
- unsubscribe/delete/pause controls;
- realtor digest generation.

## 9. Testing, QA, deployment

На момент обзора:

- backend tests: 317 passed, 1 skipped in last full run;
- frontend smoke: 281 assertions in last run;
- lint/typecheck/build passed for latest code changes;
- deployment smoke script checks API health/readiness, products, listings,
  admin endpoints and key frontend pages.

Текущая technical readiness:

- Dockerfile and compose files exist;
- `render.yaml` exists for Render-based stack;
- production readiness endpoint `/ready`;
- ops runbook exists;
- Postgres/PostGIS migrations exist and were verified locally/staging-style.

Открыто перед настоящим production launch:

- provision real managed Postgres/PostGIS;
- production deploy;
- S3-compatible artifact bucket;
- external monitoring for uptime/job failures/source freshness;
- real cost controls for maps/AI/infrastructure;
- changelog/release notes after first deploy.

## 10. Progress по development_plan.md

Счетчик checkbox-строк на момент подготовки обзора:

| Scope | Done | Open | Total | Progress |
| --- | ---: | ---: | ---: | ---: |
| All checklist lines | 646 | 26 | 672 | 96.1% |
| Without Git Commit Milestones and Current Sprint duplicates | 362 | 26 | 388 | 93.3% |

Почему два числа:

- `All checklist lines` - механический счетчик всех `- [x]` и `- [ ]`.
- `Without Git Commit Milestones and Current Sprint duplicates` - более честный
  счетчик по продуктовым/техническим задачам, потому что milestone/current
  sprint строки частично дублируют уже закрытые work items.

Самые важные открытые блоки:

- Product/research: legal review источников, 20 интервью, отдельные интервью с
  брокерами/агентствами, список первых 30 paid beta candidates, legal/data
  review источников developer reputation.
- i18n: authenticated user language preference, remaining public pages,
  backend UI messages, generated reports, AI templates, SEO hreflang,
  email/Telegram localization, translation QA/tests.
- Admin/product ops: ручная загрузка/редактирование listing от риелтора
  отложена по решению владельца продукта.
- Deployment: production DB, production deploy, S3 bucket, external monitoring,
  cost controls.
- GTM: launch paid beta candidates.
- Expansion roadmap: rental, houses/land/commercial, country expansion checklist.

## 11. Не отходим ли от плана

Короткий ответ: от `development_plan.md` не отходим. Последние работы
закрывают раздел `10.1 Multilingual / i18n`, который был добавлен в план как
обязательный для EN/PL/RU/UK. Ранее закрытые блоки также совпадают с основными
разделами: hybrid link-to-report, reports, scoring, maps/GIS, developer
reputation, alerts, payments, admin, source compliance, CRM/API.

Но есть стратегический риск:

- кодовая часть сильно опережает внешнюю валидацию;
- enterprise/API/CRM-light уже реализованы шире, чем нужно для первого paid
  beta wedge;
- без legal review и реального data coverage часть ценности остается
  демонстрационной;
- без production deploy нельзя проверить платежи, мониторинг, deliverability,
  реальные user objections и willingness to pay.

Рекомендация: не добавлять новые большие продуктовые поверхности до закрытия
следующих gates:

1. legal/source review для активных источников и developer reputation sources;
2. 20 customer interviews plus 30 paid beta candidates;
3. production deploy with managed PostGIS, artifacts and monitoring;
4. locale-aware report/AI generation, если мультиязычность нужна до paid beta;
5. data coverage plan для Wroclaw + suburbs через partner feeds / legal data.

## 12. Что попросить эксперта оценить

### Product

- Понятен ли first wedge: paid buyer object report and realtor 5-report bundle?
- Не слишком ли широкий MVP для первых продаж?
- Какие 3 экрана должны быть идеальными для paid beta: `/check`, report,
  `/pricing`, `/realtors`, `/compare`?
- Какие report sections реально влияют на оплату?
- Нужно ли сейчас продолжать CRM/API, или заморозить до появления первых
  paid users?

### Data/legal

- Допустим ли текущий user-submitted URL one-off flow по польскому/EU контексту?
- Какие source classes можно легально включить первыми?
- Что должно быть в partner data agreement?
- Можно ли использовать developer directories/UOKiK/KRS/REGON/DFG в текущем
  виде и как правильно цитировать?
- Достаточны ли retention/deletion/audit rules для paid beta?

### Real estate domain

- Какие risk factors missing for Poland/Wroclaw buyer decision?
- Корректны ли buyer checklist and pre-zadatek questions?
- Достаточно ли developer reputation methodology осторожна?
- Какие признаки плохой ликвидности/переплаты должны быть добавлены первыми?
- Что должно быть в отчете, чтобы риелтор реально отправил его клиенту?

### Engineering

- Нормальна ли архитектура repository/store/service separation?
- Не слишком ли большой `domarion/api/routes.py`, пора ли дробить router?
- Какие tests нужно добавить перед production?
- Нужны ли background workers/queues до paid beta или достаточно admin/cron?
- Какие SLA/monitoring/cost controls обязательны для запуска?

## 13. Рекомендованный следующий engineering backlog

Если продолжать по плану и делать полезное для main flow, ближайшие задачи:

1. Locale-aware report generation: JSON/HTML/PDF reports на выбранном языке.
2. Locale-aware AI prompts/templates: answers, citations, disclaimers.
3. Локализация `/reports`, `/pricing`, `/alerts`, `/account`.
4. Production deploy preparation: managed PostGIS, S3 artifacts, monitoring.
5. Source/legal review checklist operationalization in admin source registry.
6. Data coverage work: partner CSV/API process for real active listings.

Если цель - быстрее проверить рынок, инженерные задачи надо ограничить:

1. отполировать `/check -> report -> pricing/payment`;
2. сделать 5-10 реальных отчетов вручную/полуавтоматически;
3. собрать objections;
4. улучшать только те report sections, за которые пользователи готовы платить.

## 14. Как быстро проверить проект локально

Backend:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --reload-dir domarion --reload-dir tests
```

Frontend:

```powershell
cd frontend
npm run lint
npm run typecheck
npm run smoke
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Deployment smoke:

```powershell
.\.venv\Scripts\python.exe scripts\smoke_deployment.py
```

Ключевые локальные URL:

- `http://127.0.0.1:3000/check`;
- `http://127.0.0.1:3000/check/drafts`;
- `http://127.0.0.1:3000/listings/wr-001`;
- `http://127.0.0.1:3000/compare`;
- `http://127.0.0.1:3000/pricing`;
- `http://127.0.0.1:3000/reports`;
- `http://127.0.0.1:3000/admin`;
- `http://127.0.0.1:8000/docs`;
- `http://127.0.0.1:8000/ready`.
