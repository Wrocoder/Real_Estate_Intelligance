# WartoMetr: полный пакет для профессионального ревью

Дата подготовки: 15 сентября 2026 года  
Состояние кода: `main`, commit `4a8406b`  
Развернутое окружение: Oracle Cloud Infrastructure, staging  
Frontend: <https://app.141-144-246-78.sslip.io>  
API: <https://api.141-144-246-78.sslip.io>  

## 1. Назначение документа

Этот документ предназначен для независимого профессионального ревью WartoMetr:
продукта поддержки решений при покупке квартиры в Польше. Он описывает не
только задуманную концепцию, но и фактически реализованные пользовательские
сценарии, архитектуру, аналитическую логику, источники данных, инфраструктуру,
проверки качества и известные ограничения.

Просим разделять при оценке четыре уровня зрелости:

1. **Работает в развернутом staging** - доступно на Oracle VM и проверено.
2. **Реализовано в коде** - существует и покрыто тестами, но может требовать
   внешней настройки или реальных пользователей.
3. **Технический контур** - подготовлена архитектура, но нет production-доказательств.
4. **Не завершено** - явно перечислено в разделе ограничений.

## 2. Краткое описание продукта

WartoMetr помогает частному покупателю ответить на главный вопрос:

> Стоит ли покупать эту квартиру по заявленной цене?

Это не агрегатор объявлений и не профессиональный BI-dashboard. Главная
продуктовая последовательность:

`решение -> объяснение -> доказательства -> действие -> сравнение -> наблюдение`

Продукт должен за несколько секунд показать:

- стоит ли продолжать рассматривать объект;
- насколько цена соответствует доступным рыночным данным;
- какой диапазон цены выглядит разумным;
- с какой цены начинать переговоры и где находится верхняя разумная граница;
- какие существенные риски обнаружены;
- какие данные подтверждены, рассчитаны, оценены моделью или отсутствуют;
- что проверить до просмотра, задатка и подписания договора;
- насколько вывод соответствует цели покупки: для жизни или инвестиции;
- какой из нескольких объектов является более рациональным выбором.

Текущие статусы buyer verdict:

- `BUY` - объект можно продолжать рассматривать при условии обычных проверок;
- `NEGOTIATE` - объект интересен, но текущая цена требует переговоров;
- `AVOID` - сочетание цены и рисков не оправдывает продолжение без существенных изменений;
- `VERIFY FIRST` - данных недостаточно или есть критичные неизвестные.

Пользовательские подписи локализованы; внутренние коды не должны становиться
самостоятельным доказательством или юридической рекомендацией.

## 3. Целевая аудитория и коммерческая гипотеза

### Основная аудитория

Частный покупатель квартиры в Польше, приобретающий жилье:

- для собственного проживания;
- для семьи;
- для сдачи в аренду;
- как инвестицию;
- без окончательно выбранной цели.

### Дополнительные аудитории

- риелторы и небольшие агентства, готовящие аргументированные подборки клиентам;
- инвесторы, которым важны цена входа, ликвидность, аренда и риск;
- в перспективе API/данные для профессиональных организаций.

Основной продуктовый приоритет остается B2C-покупателем. CRM, API-lite и
enterprise-модули существуют как дополнительная техническая поверхность и не
должны определять главный потребительский UX.

### Гипотеза монетизации

В коде и продуктовой документации предусмотрена следующая лестница для проверки:

| Продукт | Ценовая гипотеза | Назначение |
| --- | ---: | --- |
| Free Check | 0 PLN | Краткий verdict, позиция цены, основные риски |
| Buyer Check | 49 PLN | Цена, comparables, история, район, риски и переговоры |
| Full Due Diligence | 149 PLN | Расширенные проверки, документы и полная стоимость покупки |
| Expert Review | 299-499 PLN | Автоматический отчет плюс ручная проверка аналитиком |
| Realtor Pro | 199-399 PLN/месяц | Отчеты, branding, compare, shortlist и workspace |

Это гипотезы, а не доказанные цены. Live-платежи и коммерческая конверсия пока
не подтверждены.

## 4. Главный пользовательский сценарий

### 4.1. Проверка квартиры

Маршрут: `/check`.

1. Пользователь вставляет ссылку Otodom/OLX либо вводит параметры вручную.
2. Система создает private, owner-scoped черновик.
3. Пользователь проверяет и корректирует распознанные параметры.
4. Backend сопоставляет объект с доступными районными данными и comparables.
5. Пользователь получает verdict, fair-price range, confidence, риски и неизвестные.
6. Далее доступны план действий, переговоры, сохранение, сравнение и отчет.

URL используется как переданная пользователем одноразовая ссылка. Система не
предполагает массовый обход порталов, не хранит фотографии, контакты, полный
текст объявления или raw HTML как основу продукта. Подробные правила находятся
в `docs/source_compliance_policy.md` и `docs/hybrid_listing_analysis.md`.

### 4.2. Структура результата

Первый уровень результата содержит:

- verdict и краткое объяснение;
- цену продавца;
- оценочный диапазон справедливой цены;
- переплату или потенциальную скидку;
- confidence и полноту проверки;
- основные положительные факторы;
- основные риски и критичные неизвестные;
- рекомендуемое следующее действие.

Ниже, по принципу progressive disclosure:

- comparable evidence;
- риски объекта и локации;
- due-diligence checklist;
- расчет полной стоимости приобретения;
- ипотечный сценарий;
- negotiation plan;
- район и инфраструктура;
- история и вторичная аналитика.

### 4.3. До и после просмотра

Реализованы два вспомогательных режима:

- до просмотра: причины смотреть или пропустить, вопросы продавцу, документы и
  элементы, которые нужно проверить или сфотографировать;
- после просмотра: состояние, окна, шум, запах, влажность, подъезд, дом,
  ориентация, кухня/ванная и ожидаемый ремонт.

Ответы после просмотра могут пересчитать verdict, но не превращаются в
юридическое или техническое заключение.

## 5. Реализованные пользовательские разделы

| Маршрут | Роль в продукте | Текущее назначение |
| --- | --- | --- |
| `/check` | Главный | Проверка квартиры по URL или вручную |
| `/` | Основной | Поиск доступных объектов и карта |
| `/check/drafts` | Основной, личный | My apartments: сохраненные проверки |
| `/saved` | Основной, личный | Сохраненные и отслеживаемые квартиры |
| `/areas` | Основной, публичный | Каталог локаций и районная статистика |
| `/areas/{areaId}` | Контекстный | Детали, история цены и evidence района |
| `/areas/compare` | Контекстный | Сравнение районов |
| `/listings/{id}` | Контекстный | Полный анализ объекта из поиска |
| `/compare` | Контекстный | Выбор лучшей из 2-4 квартир и trade-offs |
| `/mortgage` | Контекстный | Ипотека и полная стоимость покупки |
| `/alerts` | Личный | Настройка мониторинга и история доставок |
| `/reports` | Личный/pro | История и генерация отчетов |
| `/pricing` | Коммерческий | Продукты, заказы и checkout-контур |
| `/account` | Личный/pro | Профиль, подписка, buyer preferences, agency workspace |
| `/developers` | Evidence/pro | Рейтинг и профили застройщиков |
| `/news` | Контекстный | Новости, связанные с районами и рынком |
| `/guides` | Публичный | Материалы для покупателя |
| `/realtors` | Pro acquisition | Предложение для риелторов |
| `/beta` | Acquisition | Контролируемый beta-вход |
| `/admin` | Внутренний | Источники, ingestion, data quality и moderation |
| `/market` | Внутренний/pro | Аналитический dashboard |

`/admin` и `/market` скрыты в публичном production frontend и возвращают `404`,
если отдельное внутреннее окружение явно не включает `INTERNAL_ROUTES_ENABLED`.
Backend admin endpoints независимо защищены ролью `admin`.

## 6. Поиск, сравнение и сохранение

### Поиск

Реализованы:

- город, район, gmina, voivodeship;
- бюджет, площадь, комнаты и тип рынка;
- параметры здания и состояния;
- расстояние до центра, транспорта, школы, дороги и промышленной зоны;
- текстовый поиск с поддержкой польской диакритики;
- сортировка и пагинация;
- MapLibre-карта, кластеры и GIS-слои;
- hidden-gems режим для недооцененных вариантов.

Практическая ценность поиска активных предложений зависит от подключенного и
юридически одобренного listing feed. RCN является источником транзакций и не
заменяет базу актуальных объявлений.

### Сравнение

Сравнение начинается с рекомендации, причин и компромиссов, а не с большой
таблицы score. Оно учитывает доступные:

- цену и fair-value delta;
- полную стоимость приобретения;
- соответствие цели покупателя;
- риски и неизвестные;
- ликвидность и rental evidence;
- диапазон переговоров;
- ипотечный baseline.

### Сохранение и monitoring

Реализованы owner-scoped favorites, сохраненные проверки, alerts и object-watch
рекомендации. События объявления могут отражать изменение цены, удаление,
повторную публикацию и изменение параметров. Реальная email/Telegram-доставка
зависит от production credentials и пока не считается доказанной.

## 7. Аналитика и правила доверия

### 7.1. Классы информации

WartoMetr различает:

- **FACT / SOURCE DATA** - данные, полученные из зарегистрированного источника;
- **DERIVED METRIC** - детерминированный расчет на основе source data;
- **MODEL ESTIMATE** - оценка, диапазон, score или inference;
- **UNKNOWN** - данных нет;
- **INSUFFICIENT DATA** - данные есть, но их недостаточно для вывода.

Отсутствие данных не должно превращаться в ноль, среднее значение или
нейтральный score без явного обоснования.

### 7.2. Fair price

Текущий area baseline предпочитает медиану подтвержденных RCN-транзакций за
скользящие 365 дней. Если транзакционных данных нет, допускается явно
маркированный listing baseline. История за весь доступный период хранится
отдельно и не смешивается с текущим окном.

Fair price показывается диапазоном. Вместе с ним по возможности доступны:

- basis: transaction или listing observations;
- количество наблюдений;
- фактический временной диапазон;
- географический scope;
- confidence;
- comparable evidence и факторы сходства.

Это аналитическая оценка, а не лицензированный operat szacunkowy.

### 7.3. Buyer decision

Версия основной логики: `buyer-decision-v2-intent`. Решение строится
детерминированно из доступных score, due diligence, полной стоимости и intent
fit. Текущая агрегирующая часть buyer score использует веса:

- investment: 32%;
- обратный risk: 24%;
- liquidity: 13%;
- negotiation: 9%;
- fair-price confidence: 8%;
- due diligence: 14%.

Доступные компоненты перенормируются. Затем учитываются положительная цена
относительно fair-price midpoint и post-renovation value gap. Intent fit может
дополнительно корректировать результат.

Основные inspectable thresholds текущей версии:

- высокий risk или сильная переплата вместе со слабым due diligence -> `AVOID`;
- недостаточная market evidence или fair-price confidence ниже 50 -> `VERIFY FIRST`;
- повышенный risk, слабый due diligence или низкий intent fit -> `VERIFY FIRST`;
- переплата от 5% или negotiation score от 60 -> `NEGOTIATE`;
- иначе -> `BUY`.

Эти правила являются предметом обязательного экспертного ревью и backtesting.
Они не должны восприниматься как доказанная универсальная рыночная модель.

### 7.4. Дополнительные аналитические блоки

Реализованы:

- Investment Score;
- Risk Score;
- Negotiation Score;
- Liquidity Score;
- Rental Potential Score;
- buyer intent fit;
- developer reputation и confidence;
- risk profile;
- future impact и growth analysis;
- total acquisition cost;
- mortgage scenarios;
- comparable selection и similarity factors;
- scoring weight versioning и backtesting.

Score используется только как supporting evidence. UI должен объяснять
направление, важные факторы и uncertainty.

### 7.5. Negotiation

Когда evidence достаточно, система формирует:

- opening offer;
- realistic deal range;
- maximum reasonable offer;
- аргументы продавцу;
- список подтверждающих факторов и дальнейших действий.

При недостаточной evidence ценовые рекомендации должны отсутствовать, а не
генерироваться из произвольного процента скидки.

## 8. Данные RCN и география

### 8.1. Источник и модель хранения

RCN/GUGiK рассматривается как реестр наблюдений о транзакциях, а не как поток
объявлений. Используется официальный WFS `ms:lokale`:

<https://mapy.geoportal.gov.pl/wss/service/rcn>

Транзакции хранятся отдельно от listing snapshots. Сохраняются стабильный
source/version identifier, дата документа, цена, площадь, TERYT и координаты.
При изменении source version история сохраняется, но market metrics используют
только последнюю версию логической транзакции.

### 8.2. Национальное обновление

Импорт разделен на все 16 voivodeship TERYT prefixes. Для каждого региона есть
собственный checkpoint и overlap. Ошибка одного региона не откатывает успешно
записанные другие регионы. Ограничены количество страниц, строк, timeout и
разрешенные provider URLs.

На Oracle staging по состоянию на 15 сентября 2026 года:

- 401 726 сохраненных наблюдений;
- представлены все 16 воеводств;
- диапазон дат документов: 20 июня 1928 - 31 июля 2026;
- ежедневный запуск настроен на 08:00 `Europe/Warsaw`;
- exact duplicate source versions reconfirmed, новые версии сохраняются
  идемпотентно;
- невалидные строки изолируются в data-quality logs.

401 726 - не число уникальных квартир и не утверждение о полном покрытии рынка.
Количество включает сохраненные версии и исторические записи. Дата импорта не
означает, что источник содержит сделки до текущего дня.

### 8.3. TERYT/SIMC и нормализация Location

В репозиторий включен зафиксированный официальный snapshot GUS TERYT/SIMC от
14 сентября 2026 года. Нормализация:

- восстанавливает официальный регистр и польскую диакритику;
- поддерживает явно заданные варианты крупных городов на других языках;
- использует полный семизначный SIMC как стабильную идентичность;
- различает одноименные населенные пункты по powiat и voivodeship;
- не применяет опасное fuzzy-слияние похожих названий.

Примеры `BRODY/brody`, `Annapol/Annopol` больше не создают case-only или
диакритические дубли. Два разных Adamowo или Brody остаются разными официальными
локациями и подписываются административным контекстом.

Production API `/api/v1/areas` на момент проверки возвращает:

- 4 031 аналитическую строку;
- 3 859 уникальных Location ID для поискового выбора;
- 0 случаев, где один Location ID имеет разные названия;
- 0 дублей, отличающихся только регистром.

### 8.4. Официальные границы районов

В deployment включены pinned municipal datasets с ожидаемым числом объектов и
SHA-256. CI/деплой больше не зависит от доступности municipal server в момент
релиза.

| Город | Проверенных полигонов | Source CRS | Назначение RCN на staging |
| --- | ---: | ---: | ---: |
| Wrocław | 48 | EPSG:2177 | 22 919 из 22 919 |
| Kraków | 18 | EPSG:2178 | 23 706 из 23 706 |
| Lublin | 27 | EPSG:2179 | 9 940 из 9 940 |
| Łódź | 36 | EPSG:2180 | 6 304 из 6 329 |
| Warszawa | 18 | EPSG:2180 | 55 329 из 55 329 |
| Gdańsk | 36 | EPSG:2177 | 17 373 из 17 373 |

PostGIS выполняет point-in-polygon с преобразованием CRS. Точка вне всех
официальных полигонов остается на уровне города и не получает район по догадке.

Источники и checksums находятся в
`deploy/oracle/rcn-district-boundaries.verified.json`. Среди источников:

- Wrocław Geoportal;
- MSIP Kraków;
- Lublin Open Data;
- Łódź municipal ArcGIS;
- Warszawa ZDM public layer;
- Otwarty Gdańsk.

Для Poznań районное назначение пока не включено. Текущий официальный список
содержит 42 osiedla, а найденный официальный polygon dataset относится к
устаревшему делению 2015 года на 57 единиц. Он намеренно не выдается за
актуальные границы.

## 9. Areas UX

Страница `/areas` предназначена для ответа на вопрос: подходит ли эта локация
для цели покупателя?

Недавняя переработка включает:

- стабильную sidebar-навигацию на desktop;
- компактное мобильное меню;
- доступ к Account и My apartments;
- поисковое поле Location вместо нечитабельного native select на тысячи строк;
- datalist из нормализованных официальных локаций;
- административный контекст для одноименных мест;
- фильтрацию по stable Location ID, а не по визуальной строке;
- состояния loading, unavailable, error и retry;
- понятное отображение источника, количества наблюдений и временного окна;
- area detail и price-history без интерполяции отсутствующих месяцев.

## 10. Total purchase cost и mortgage

Backend отдельно возвращает:

- цену квартиры;
- налоги и transaction costs;
- notary/court и введенные дополнительные расходы;
- ремонт и furnishing;
- полную стоимость покупки;
- необходимый cash at signing;
- сумму кредита и платеж;
- страхование и прочие ежемесячные расходы;
- полную стоимость обслуживания кредита.

Для secondary market реализованы 2% PCC, явно заявляемое пользователем
освобождение для first-home и отдельное manual exclusion. Освобождение не
выводится автоматически из отсутствующих данных. Расчет является budgeting
support, а не банковским решением или индивидуальным налоговым заключением.

## 11. Auth, приватность и разграничение доступа

Реализованы:

- email/password registration и login;
- подписанная HttpOnly session cookie;
- `/api/v1/auth/session` и logout;
- tenant-scoped drafts, favorites, alerts, reports и account data;
- buyer, realtor, agency_admin и admin roles;
- plan limits и usage limits;
- agency workspace и CRM-light;
- server-side admin authorization;
- data deletion requests и audit log.

Demo identity headers разрешены только в явно включенных local/test fixtures.
Staging/production startup запрещает небезопасные demo fallbacks.

Product analytics использует случайный session journey UUID и ограниченный
набор категориальных событий. Запрещены URL объявления, адрес, entity/order ID,
контакты, billing data, координаты, custom text, IP и user-agent. Raw events
хранятся не более 180 дней; публичного read endpoint нет.

## 12. Reports, payments и AI

### Reports

Реализованы JSON/HTML/PDF report contracts, история отчетов, buyer/realtor/
investor templates, white-label параметры и local/S3-compatible artifact
abstraction. На текущем OCI staging artifacts остаются локальными; offsite
artifact recovery не доказан.

### Payments

Реализованы:

- report products и orders;
- mock checkout;
- Stripe и PayU hosted-checkout adapters;
- signed webhooks, idempotency и fulfillment;
- VAT/invoice metadata;
- payment/order audit events.

Live provider credentials, настоящий платеж, refund и settlement не проверены.
Поэтому payment subsystem следует считать реализованным техническим контуром,
но не production-proven коммерческой системой.

### AI

AI-oriented endpoints могут формировать объяснения по объекту, сравнению,
району и новости, а также сохранять owner-scoped insights. AI должен работать
только поверх структурированных данных приложения и не имеет права изобретать:

- цены и транзакции;
- риски и источники;
- юридические факты;
- уверенность;
- будущую доходность;
- отсутствующие параметры объекта.

Основное решение формируется inspectable business logic, а AI используется для
объяснения и формулировки grounded actions.

## 13. Data operations и admin

Внутренний admin-контур включает:

- Source Registry с owner, legal status, allowed use и refresh cadence;
- ingestion jobs и source health;
- source checks, sanitized errors и retry queue;
- data-quality logs;
- raw listing preview и normalized corrections;
- partner CSV ingestion;
- infrastructure и planned investments import;
- developer feed import, aliases, projects, signals и moderation;
- deduplication review queue;
- scoring backtest;
- area snapshot и price-history rebuild;
- audit logs и data deletion requests.

Источник не становится `approved` автоматически. Это решение оператора после
отдельной legal/source проверки.

## 14. Техническая архитектура

### Backend

- Python 3.12;
- FastAPI и Pydantic;
- SQLAlchemy 2 и Alembic;
- PostgreSQL/PostGIS;
- Redis;
- memory implementations для локальных детерминированных тестов;
- отдельные repository/store abstractions;
- CLI `domarion` и persistent worker;
- optional Sentry и structured logging;
- S3-compatible report artifacts.

Основные уровни:

1. `domarion/api` - HTTP routes, auth dependencies и contracts.
2. `domarion/services` - аналитика и business logic.
3. `domarion/repositories` и `*_store` - persistence boundaries.
4. `domarion/ingestion` - источники, нормализация, quality gates и upsert.
5. `domarion/db` и `alembic` - PostgreSQL models и migrations.
6. `scripts` - deployment, backup, smoke и RCN operations.

### Frontend

- Next.js 15 App Router;
- React 19;
- TypeScript;
- MapLibre GL;
- lucide-react;
- generated OpenAPI TypeScript contract;
- локальные PL/EN/RU/UK dictionaries;
- Playwright browser quality suite.

### Масштаб репозитория

На дату документа:

- 167 Python modules в `domarion`;
- 43 Alembic migration files;
- 63 backend test files;
- 24 frontend page routes;
- отдельные smoke, browser, deployment и operational scripts.

Размер сам по себе не является доказательством качества. Важный архитектурный
риск - крупный `domarion/api/routes.py`; новые vertical slices следует выносить
по доменным границам без полной переписи системы.

## 15. Развертывание на Oracle Cloud

Текущий staging использует одну Oracle VM и Docker Compose:

- Caddy: TLS и reverse proxy;
- Next.js frontend;
- FastAPI API;
- worker;
- PostgreSQL/PostGIS;
- Redis;
- migrate one-shot service;
- persistent volumes под DB, Redis, artifacts, backups и geographic data.

Публичные адреса:

- frontend: <https://app.141-144-246-78.sslip.io>;
- API health: <https://api.141-144-246-78.sslip.io/health>;
- API readiness: <https://api.141-144-246-78.sslip.io/ready>.

15 сентября 2026 года непосредственно на VM проверено:

- checkout `4a8406b`;
- API, frontend, PostgreSQL и Redis healthy;
- worker running;
- `/ready` возвращает `ready`;
- `/areas` возвращает HTTP 200.

Это staging на техническом sslip.io-домене, а не финальный production domain.

## 16. CI, тестирование и release gates

GitHub Actions выполняет:

- backend tests и Ruff;
- migration/deployment contracts;
- frontend ESLint и TypeScript;
- smoke assertions;
- production Next.js build;
- Docker build;
- Playwright Browser Quality на desktop, tablet и mobile;
- PL/EN/RU/UK сценарии;
- loading, empty, partial, error и retry states;
- checks ключевых buyer flows и public/internal route separation.

Последний релизный run подтвердил Backend, Frontend, Docker Build и Browser
Quality. Автоматический SSH deploy из GitHub-hosted runner завершился `exit 255`
до первой команды на VM. Релиз был выполнен и проверен через прямой SSH.

Добавленные SSH connection retries корректно обрабатывают краткие сетевые
сбои, но не решают недоступность VM из сети конкретного hosted runner. Для
устойчивого automatic deploy нужен один из вариантов:

- OCI NSG/security-list правило, подтвержденное для runner network;
- self-hosted GitHub runner внутри OCI;
- pull-based release agent с защищенным release marker.

Нельзя считать этот инфраструктурный вопрос закрытым только потому, что ручной
deploy проходит.

## 17. Что проверено в текущем deployed candidate

- навигация desktop и mobile;
- Account и My apartments в меню;
- `/areas` desktop/mobile;
- поисковый Location control и 3 859 нормализованных вариантов;
- отсутствие case-only Location duplicates;
- disambiguation одноименных населенных пунктов;
- API health/readiness;
- контейнеры OCI;
- RCN inventory всех воеводств;
- районное назначение шести крупных городов;
- frontend без incoherent overlap и horizontal overflow в проверенных сценариях;
- CI backend/frontend/docker/browser gates.

Не проверено с production credentials:

- полный authenticated flow реального внешнего пользователя;
- live Stripe/PayU transaction, refund и settlement;
- реальная email/Telegram object-watch доставка пользователю;
- offsite backup restore drill;
- восстановление private report artifacts из внешнего хранилища;
- production monitoring/cost alert chain;
- human legal approval всех коммерчески используемых источников и wording.

## 18. Известные ограничения и риски

### P0: до платного публичного запуска

1. Провести документированную legal/source review для активных источников.
2. Выполнить настоящий checkout/webhook/refund сценарий.
3. Проверить offsite backup и clean restore.
4. Перенести private report artifacts в надежное S3-compatible storage.
5. Настроить uptime, application error, source freshness, payment и cost alerts.
6. Проверить tenant isolation и auth flow с реальными beta accounts.

### P1: качество данных и операций

1. Получить юридически разрешенный feed активных listings.
2. Получить независимый свежий rental feed; до этого rental выводы должны быть
   `insufficient data` там, где evidence недостаточно.
3. Добавить актуальные официальные границы Poznań после появления проверяемого
   current polygon source.
4. Проверить 25 неразрешенных точек Łódź и актуальность граничных случаев.
5. Подтвердить cron, alert delivery, backups и monitoring длительным наблюдением.

### Product/market risk

Кодовая поверхность уже шире, чем нужно для первой проверки спроса. До
следующей крупной feature-разработки рекомендуется подтвердить хотя бы одно:

- 20 оплаченных buyer reports;
- 3 оплаченных realtor pilots;
- минимум 5 документированных случаев, где отчет изменил решение, помог
  договориться о цене или предотвратил плохую покупку.

Demo traffic, mock payments и repository tests не являются подтверждением PMF.

## 19. Рекомендуемый сценарий независимого ревью

### Product/UX review

1. Открыть главную страницу на 1440 px и 390 px.
2. Проверить понятность primary navigation.
3. Пройти `/check` вручную и с пользовательской ссылкой.
4. Зафиксировать, можно ли понять verdict за 10 секунд.
5. Проверить evidence, unknowns и next actions.
6. Сохранить объект, открыть My apartments и перейти к сравнению.
7. Проверить negotiation и mortgage/total-cost контекст.
8. Открыть `/areas`, найти несколько одноименных локаций и крупный город.
9. Проверить error/partial/insufficient-data states.
10. Повторить ключевые шаги на польском и одном дополнительном языке.

### Real-estate/domain review

1. Проверить методику fair-price range и selected comparables.
2. Оценить thresholds `BUY/NEGOTIATE/AVOID/VERIFY FIRST`.
3. Проверить opening offer, deal range и maximum reasonable offer.
4. Проверить due-diligence вопросы для primary и secondary market.
5. Оценить полноту рисков: право, здание, район, шум, flood, plan, transport.
6. Проверить total purchase cost и PCC assumptions.
7. Оценить, какие выводы требуют обязательной ручной проверки эксперта.

### Data/statistics review

1. Проверить RCN filtering и выбор price basis.
2. Проверить logical identity/version selection.
3. Проверить rolling 365-day window и historical series.
4. Проверить treatment малых выборок и confidence.
5. Проверить locality/district scope и PostGIS joins.
6. Проверить SIMC normalization и отсутствие ошибочного fuzzy merge.
7. Проверить backtesting на temporal leakage и selection bias.

### Security/privacy review

1. Проверить session cookie, CSRF/CORS assumptions и password storage.
2. Проверить tenant isolation всех owner-scoped stores.
3. Проверить admin role boundary.
4. Проверить private URL retention и отсутствие утечек в reports/AI/exports.
5. Проверить payment webhooks и idempotency.
6. Проверить secrets, backups, logs, Sentry и data-deletion process.

### Architecture/operations review

1. Проверить границы API/service/store.
2. Проверить транзакционность ingestion и migration safety.
3. Проверить idempotency worker tasks.
4. Провести backup/restore и rollback drill.
5. Оценить single-VM failure modes и путь к managed DB/object storage.
6. Закрыть GitHub-hosted runner -> OCI deployment connectivity.

## 20. Формат желаемого отзыва

Для каждого замечания просим указать:

- severity: blocker / high / medium / low;
- направление: product / UX / real estate / data / security / engineering / ops;
- конкретный экран, endpoint, файл или шаг сценария;
- наблюдаемое поведение;
- риск для покупателя или бизнеса;
- рекомендуемое изменение;
- способ проверить исправление.

Особенно ценны ответы на вопросы:

1. Помогает ли WartoMetr принять решение, а не просто показывает аналитику?
2. Достаточно ли честно разделены facts, source data, derived metrics и estimates?
3. Какие три аналитических вывода сейчас наиболее ненадежны?
4. Какие три части отчета действительно имеют платежную ценность?
5. Какие сведения отсутствуют для безопасного решения о покупке в Польше?
6. Что обязательно убрать или упростить до controlled paid beta?
7. Какая проверка нужна, чтобы доверять fair-price и negotiation рекомендациям?
8. Какие P0-риски не позволяют открыть неограниченный платный production?

## 21. Карта ключевых файлов

### Продукт и UX

- `AGENTS.md` - product principles и quality rules;
- `docs/buyer_decision_product_direction.md` - product direction;
- `docs/product/DOMARION_FINAL_PRODUCT_REVIEW.md` - final repository review;
- `docs/frontend_route_product_map.md` - назначение frontend routes;
- `frontend/components/BuyerDecisionPanel.tsx` - verdict presentation;
- `frontend/components/AreasDirectory.tsx` - Areas и Location control.

### Аналитика и данные

- `domarion/services/buyer_decision.py` - verdict, negotiation и action logic;
- `domarion/services/scoring.py` - scoring calculations;
- `domarion/services/comparables.py` - comparable selection/evidence;
- `domarion/services/market_metrics.py` - transaction/listing area metrics;
- `domarion/ingestion/rcn_transactions.py` - RCN parsing и quality checks;
- `domarion/ingestion/rcn_poland.py` - nationwide regional orchestration;
- `domarion/ingestion/district_boundaries.py` - official polygon import;
- `domarion/teryt_registry.py` - TERYT/SIMC normalization;
- `deploy/oracle/rcn-district-boundaries.verified.json` - pinned sources/checksums.

### API и persistence

- `domarion/main.py` - FastAPI application;
- `domarion/api/routes.py` - основной API surface;
- `domarion/api/auth_routes.py` - authentication;
- `domarion/api/compare_routes.py` - comparison vertical slice;
- `domarion/repositories/postgres.py` - PostgreSQL repository;
- `domarion/schemas.py` - public contracts;
- `alembic/versions` - schema history;
- `docs/api_surface.md` - human-readable API map.

### Deployment и quality

- `.github/workflows/ci.yml` - CI и OCI deployment jobs;
- `compose.oracle.yaml` - Oracle stack;
- `scripts/deploy_oracle_cloud.sh` - VM deployment;
- `scripts/run_rcn_daily_oracle.sh` - daily RCN operation;
- `scripts/inspect_rcn_oracle.sh` - data inventory;
- `scripts/postgres_backup.py` - backup helper;
- `frontend/scripts/browser-quality.mjs` - rendered UX gate;
- `tests` - backend/API/data/deployment tests.

## 22. Итоговая самооценка

WartoMetr уже является работающим controlled-beta candidate с широкой
технической основой, национальной RCN-статистикой и сильным фокусом на
explainable buyer decision. Самые важные недавние улучшения - переход от
score-dashboard к verdict-first UX, явные unknown/insufficient states,
нормализация TERYT/SIMC, searchable Areas Location и подключение официальных
районных границ шести крупных городов.

Проект пока нельзя честно называть полностью готовым к неограниченному платному
production. Главные незакрытые доказательства находятся не в количестве
features, а во внешней legal review, live payments, approved active-listing и
rental feeds, offsite restore, monitoring, reliable automatic deployment и
реальной коммерческой валидации.

Ключевой вопрос ревью:

> Достаточно ли текущих данных, правил и объяснений, чтобы частный покупатель
> принял более качественное и более безопасное решение о конкретной квартире,
> и какие изменения сильнее всего повысят доверие к этому решению?

## 23. Основные внешние источники для проверки provenance

- GUS eTERYT, официальные формы предоставления TERYT/SIMC:
  <https://eteryt.stat.gov.pl/eTeryt/rejestr_teryt/udostepnianie_danych/formy_i_zasady_udostepniania/formy_i_zasady_udostepniania.aspx>;
- GUGiK/Geoportal, RCN WFS:
  <https://mapy.geoportal.gov.pl/wss/service/rcn>;
- Wrocław Geoportal, osiedle boundaries:
  <https://geoportal.wroclaw.pl/www/pliki/osiedla/granice-osiedli.zip>;
- MSIP Kraków, district boundaries:
  <https://msip.um.krakow.pl/Dane/Dzielnice_SHP.zip>;
- Lublin Open Data WFS:
  <https://gis.lublin.eu/otwartedane/administracja/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.0.0&TYPENAME=administracja:dzielnice_granice&SRSNAME=EPSG:2179&OUTPUTFORMAT=application/json>;
- официальный список osiedla Poznań:
  <https://www.poznan.pl/mim/osiedla/list/>;
- найденный устаревший polygon dataset Poznań Open Data:
  <https://www.poznan.pl/opendata/en/data-item/aab44f50-ed56-4d3c-b110-2ba1054b3df4>.

Полный машинно-проверяемый список подключенных boundary sources, CRS,
ожидаемого количества полигонов и SHA-256 находится в
`deploy/oracle/rcn-district-boundaries.verified.json`.
