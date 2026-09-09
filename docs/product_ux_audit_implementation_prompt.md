# WartoMetr: prompt и backlog по результатам Product/UX-аудита

Этот файл одновременно является:

- prompt для coding agent;
- приоритизированным backlog;
- checklist приемки изменений.

Чтобы продолжить работу в новой сессии, используйте запрос:

> Выполни следующий незакрытый блок из `@docs/product_ux_audit_implementation_prompt.md`. Строго соблюдай порядок зависимостей, используй указанные skills, не закрывай задачу без release gate и обнови checklist только после проверки.

---

## Основной prompt

Ты работаешь над WartoMetr - consumer-продуктом для принятия решения о покупке квартиры в Польше. Главный вопрос пользователя: **«Стоит ли покупать эту квартиру по этой цене?»**

Цель работы - последовательно устранить findings Product/UX-аудита и привести продукт к структуре:

**решение -> объяснение -> доказательства -> действие**.

Не превращай интерфейс во внутренний аналитический dashboard. Не добавляй крупные новые функции, если они не улучшают основной путь покупателя.

### Обязательные skills

Перед началом работы прочитай и применяй skills из репозитория:

1. `$domarion-product-ux` - для маршрутов, навигации, основного сценария проверки квартиры и продуктовой иерархии.
2. `$domarion-ui-quality` - для компонентов, визуальной системы, responsive UX, accessibility и состояний интерфейса.
3. `$domarion-analytics-integrity` - для fair price, comparable properties, confidence, scores, аренды, инвестиций, ликвидности, переговоров, районов и рыночных данных.
4. `$domarion-release-gate` - после каждого значимого блока изменений и перед отметкой задачи как выполненной.

Если доступен browser/Playwright-инструмент, используй его для проверки реального приложения. Успешный build не заменяет проверку отрендеренного интерфейса.

### Источники истины

Перед изменениями изучи:

- `AGENTS.md`;
- соответствующие `SKILL.md`;
- текущий frontend, backend, API-контракты, модели и тесты;
- `docs/buyer_decision_product_direction.md`;
- `.github/workflows/ci.yml`;
- незакоммиченные изменения через `git status` и `git diff`.

Не отменяй пользовательские изменения. Не меняй backend-контракты и смысл аналитических показателей без явной необходимости, миграционного плана и тестов.

### Порядок работы

1. Выбери первую незакрытую задачу, все зависимости которой выполнены.
2. Изучи текущую реализацию затронутого vertical slice: UI -> API -> domain logic -> persistence -> tests.
3. Кратко зафиксируй план и риски до редактирования.
4. Реализуй минимально достаточное целостное изменение без побочного рефакторинга.
5. Добавь или обнови тесты на поведение, а не только на структуру.
6. Прогони `$domarion-release-gate`, включая browser-проверку на desktop и mobile.
7. Отметь checkbox `[x]` только если критерии приемки подтверждены. Если часть проверки невозможна, оставь `[ ]` и зафиксируй причину.
8. В финальном отчете перечисли: что изменено, что проверено, что не удалось проверить, остаточные риски и следующую доступную задачу.

### Непереговорные ограничения

- Не выдавай demo, sample или fixture data за реальные данные.
- Не подменяй отсутствующие параметры объявления средними значениями и не используй такие подстановки в аналитике.
- Не представляй model estimate как подтвержденный факт.
- Не показывай ложную точность; диапазон предпочтительнее необоснованно точного числа.
- Для аналитики различай: `confirmed fact`, `source data`, `derived metric`, `model estimate`, `unknown`, `insufficient data`.
- Не закрывай P0 одним disclaimer: источник проблемы должен быть устранен или надежно заблокирован.
- Польский является основным production-языком. На одной странице не должно быть случайного смешения PL/EN/RU/UK.
- Не выставляй локализованный пользовательский текст из backend как единственный API-контракт. Передавай структурированные коды и параметры, локализуй во frontend.
- Не используй internal terminology в consumer UI.
- Не запускай следующий приоритет, пока его P0/P1-зависимости не завершены.

---

## Правила статуса checklist

- `[x]` означает, что все критерии приемки подтверждены release gate.
- `[ ]` означает `PARTIAL`, `BLOCKED` или `NOT STARTED`; подробный статус указан внутри блока.
- Частично реализованный блок остается `[ ]`, даже если отдельные его части уже работают.
- External blocker не закрывается локальными тестами, mock provider или успешным deployment.

## P0 - доверие, изоляция данных и корректность решения

### [x] P0-01. Отделить demo/sample data от реального продукта

**Область:** все consumer routes; `domarion/in_memory.py`; source registry; seed/demo scripts; frontend demo banners.

**Проблема:** sample properties, areas, reports и аналитика могут выглядеть как реальные данные.

**Результат:** production-конфигурация не может незаметно загрузить sample data; в явно включенном demo-режиме каждый demo-экран имеет однозначную маркировку.

**Критерии приемки:**

- production startup/readiness завершается ошибкой при активном demo repository или sample source;
- demo включается только явным environment flag;
- demo-объекты имеют машинно-читаемый provenance и заметную пользовательскую маркировку;
- API и UI не смешивают demo и production records;
- есть тесты production/demo конфигураций.

**Сложность:** L. **Зависимости:** конфигурация окружений, repositories, seed data, deployment settings.

### [x] P0-02. Ввести реальную аутентификацию и tenant isolation

**Область:** `domarion/auth.py`; auth API; saved properties; alerts; reports; comparisons; frontend auth/session states.

**Проблема:** общий fallback demo-user делает персональные данные и мутации фактически общими.

**Результат:** любой персональный read/write привязан к проверенному пользователю; анонимный пользователь получает безопасный sign-in flow или явно ограниченный локальный режим.

**Критерии приемки:**

- non-development окружение не имеет shared-user fallback;
- все персональные endpoints требуют валидную identity;
- ownership проверяется на read, update и delete;
- frontend корректно обрабатывает `401/403`, истечение сессии и повторный вход;
- integration tests доказывают изоляцию двух пользователей;
- существующие demo-сценарии перенесены в явно обозначенный режим.

**Сложность:** XL. **Зависимости:** identity provider/session strategy, persistence migration, deployment secrets.

### [x] P0-03. Удалить аналитические подстановки для неизвестных данных

**Область:** property import; normalization; score inputs; fair-price inputs; result rendering.

**Проблема:** отсутствующие area, floor, rooms, year, price или location могут заменяться районными/числовыми defaults и затем влиять на вывод.

**Результат:** неизвестное значение остается неизвестным, сохраняет provenance и снижает доступность/уверенность зависимой аналитики.

**Критерии приемки:**

- nullable/unknown проходит через import, domain model и API без фиктивного числа;
- у каждого аналитически значимого input есть source/provenance;
- зависимые metrics возвращают `insufficient_data` либо честно сниженную confidence;
- UI объясняет, каких данных не хватает и как их добавить;
- regression tests покрывают частичное объявление, parse failure и ручное дополнение данных.

**Сложность:** XL. **Зависимости:** importer schemas, DB models/migrations, score calculators, API contracts.

**Текущий статус (2026-09-07): DONE.** Partner/manual ingestion сохраняет отсутствующий location/infrastructure context как `null`, а явный zero не теряется. Scoring агрегирует только доступные компоненты; неизвестные liquidity/rental/context factors не получают нейтральных чисел, снижают coverage/confidence и передаются через nullable DB/API contracts. Risk, growth, negotiation, comparison, CRM и reports не создают listing-derived выводы для RCN-only areas. `/check` и listing result показывают локализованный список отсутствующих данных и следующий шаг. Добавлена миграция `0037_nullable_context_scores`; regression tests покрывают partial/manual input, parse absence и zero. Release gate: Ruff, ESLint, TypeScript, `525` frontend smoke assertions, npm audit (`0` vulnerabilities), Alembic head, production build, IDE build, `403 passed, 1 skipped`; standalone Playwright прошел PL/EN/RU/UK на desktop/tablet/mobile, critical flow, partial-data guidance, provenance и error/retry. Встроенный browser недоступен из-за environment `sandboxPolicy`, поэтому использован repository Playwright fallback.

### [x] P0-04. Пересобрать comparables, fair-price range и confidence

**Область:** comparable selection; fair-price service; confidence; `/listings/:id`; reports; comparison.

**Проблема:** выборка может объединять неподходящие районы/сегменты, диапазон строится слишком механически, а confidence выглядит надежнее исходных данных.

**Результат:** оценка цены опирается на объяснимую релевантную выборку или честно сообщает о недостатке данных.

**Критерии приемки:**

- фильтры учитывают географию, primary/secondary market, тип объекта, площадь/комнаты, состояние и freshness там, где данные доступны;
- widening fallback выполняется ступенчато и виден пользователю;
- при слабой выборке нет уверенного verdict или точного fair-price числа;
- показаны sample size, geographic scope, time range, источники, freshness и причины исключения;
- диапазон и округление соответствуют качеству данных;
- confidence зависит от полноты, согласованности, свежести и релевантности, а не только количества records;
- unit/property-based tests покрывают сильную, слабую, противоречивую и пустую выборку.

**Сложность:** XL. **Зависимости:** P0-03, market taxonomy, geocoding/district data, analytics versioning.

**Текущий статус (2026-09-07): DONE.** Comparable selection теперь расширяется четырьмя
явными ступенями: от той же dzielnica/market/type/condition/size/rooms до более
широкой выборки по тому же городу и тому же primary/secondary market. Переход на
другой market запрещён, minimum sample равен 3, а сортировка детерминирована
similarity, расстоянием, размером, комнатами и freshness и не зависит от asking
price проверяемого объекта. API и UI показывают ступень, статус выборки, sample,
scope, фактический time range, sources, freshness и агрегированные exclusion
reasons. Fair-price использует listing comparable median только при sample >= 3;
результат округляется до 5 000 PLN, а диапазон расширяется от 6% до 20% в
зависимости от confidence и price dispersion. Confidence формируется из sample
size, relevance, freshness, geography, consistency, source quality и property
completeness; слабая или противоречивая выборка ограничивает confidence и
переводит BUY/NEGOTIATE в VERIFY FIRST. Отчёты показывают range вместо точного
midpoint и включают confidence factors. Regression tests покрывают strong, staged,
weak, contradictory, empty, stale и cross-market cases. Release gate: Ruff,
ESLint, TypeScript, 530 frontend smoke assertions, npm audit (0
vulnerabilities), production build, 410 passed, 1 skipped; отдельные report
tests: 44 passed. Production-mode Playwright прошёл PL/EN/RU/UK на
desktop/tablet/mobile, critical check flow, error state, provenance и новый
confidence block без console/network errors и horizontal overflow. Встроенный
browser недоступен из-за environment sandboxPolicy, поэтому использован
repository Playwright fallback.

### [ ] P0-05. Закрыть production operational и commercial release gate

**Область:** billing, report artifacts, backups, monitoring, legal/source approval, OCI staging/production.

**Результат:** платный production запуск опирается на проверенную оплату, восстановимые данные, наблюдаемую инфраструктуру и документированное право использования источников.

**Критерии приемки:** реальный staging checkout и webhook fulfillment; idempotency/refund проверены; backup timer, offsite backup и restore drill подтверждены; report artifacts вынесены из локального ephemeral storage; настроены uptime/error/data-freshness/cost alerts; source/legal approval и manual paid-report QA зафиксированы.

**Текущий статус (2026-09-07): BLOCKED / EXTERNAL.** Нужны credentials, OCI-доступ и юридическая/ручная проверка; успешный локальный build этот блок не закрывает.

**Сложность:** XL. **Зависимости:** P0-01, P0-02, production credentials, OCI access, legal review.

---

## P1 - основной путь решения о покупке

### [x] P1-01. Добавить информированное согласие для импорта объявления

**Область:** `/check`; URL import API; retention/deletion policy.

**Результат:** до отправки URL пользователь понимает, какие данные будут получены, сохранены и как их удалить; consent доступен на mobile и во всех локалях.

**Критерии приемки:** явное согласие, ссылка на privacy details, понятная ошибка unsupported/private listing, retry и manual-entry fallback.

**Сложность:** M. **Зависимости:** P0-02, legal/privacy copy, retention implementation.

### [x] P1-02. Развести решение для жизни и для инвестиции

**Область:** `/check`; listing result; scoring; comparison; reports.

**Результат:** intent пользователя влияет на приоритет факторов, формулировку verdict и объяснение, но не переписывает исходные факты.

**Критерии приемки:** intent сохраняется; вес/логика версионируются; UI показывает, почему вывод изменился; сравнение не использует один скрытый общий рейтинг для разных intent.

**Сложность:** L. **Зависимости:** P0-03, score semantics, analytics fixtures.

### [x] P1-03. Исправить rental estimate и investment-derived metrics

**Область:** rental analysis; Investment/Rental Score; yield; reports.

**Результат:** аренда не выводится циклически из asking price без независимого рыночного основания.

**Критерии приемки:** источник/метод/период показаны; gross и net yield разведены; расходы и vacancy явны; при отсутствии rental comps вывод `insufficient_data`; тесты не допускают ложной точности.

**Сложность:** L. **Зависимости:** P0-03, P0-04, rental data source.

**Текущий статус (2026-09-08): DONE.** Rental estimate больше не выводится из asking price или sale comparables: месячная аренда строится только по последним версиям независимо полученных rental observations, а asking price используется лишь как знаменатель yield. Добавлены отдельная версионируемая таблица и legal-gated CSV ingestion, staged comparable selection, minimum sample `3`, freshness `120 дней`, диапазон аренды, gross/net yield, явные vacancy/operating assumptions и структурированный confidence. При слабой выборке API/UI возвращают `insufficient_data` и `null` вместо чисел; UNKNOWN не проходит rental-фильтры как zero. `/check` и listing result показывают локализованные source/sample/scope/method/period, assumptions и evidence. Release gate: Ruff, Alembic single head и полный offline SQL upgrade, `419 passed, 1 skipped`, ESLint, TypeScript, `542` smoke assertions, npm audit (`0` vulnerabilities), production build и repository Playwright на PL/EN/RU/UK desktop/tablet/mobile, critical/error/provenance flows, estimated и insufficient rental states; console/network/overflow ошибок нет. Встроенный browser tool в текущем окружении не предоставлен, поэтому использован разрешенный project Playwright fallback. Production rental estimate останется `insufficient_data`, пока оператор не зарегистрирует и не импортирует реально разрешенный независимый feed; demo observations не считаются production evidence.

### [x] P1-04. Сделать result page ориентированной на решение

**Область:** `/listings/:id`; `ListingDetailPage`; analytical sections.

**Результат:** первый viewport отвечает на четыре вопроса: цена предложения, fair-price range, предполагаемая переплата/выгода, итоговый verdict и следующий шаг.

**Критерии приемки:** структура `decision -> explanation -> evidence -> action`; secondary analytics раскрываются прогрессивно; нет равного визуального веса у всех metrics; save/compare/negotiate/track доступны в контексте.

**Сложность:** L. **Зависимости:** P0-03, P0-04, P1-02, UI primitives.

**Текущий статус (2026-09-08): DONE.** `/listings/:id` теперь строится в порядке `decision -> explanation -> evidence -> action`: verdict, asking price, fair-price range, отклонение, confidence и следующий шаг находятся в главном блоке; ключевые причины и риски видны без раскрытия; market evidence и secondary analytics разделены на независимые disclosure-разделы. Дублирующая сетка verdict/price удалена, а save/compare/negotiate/track/mortgage/report доступны в контексте после вывода; negotiation action раскрывает соответствующее evidence. Mobile summary скрывает вторичные total/personalization metrics, использует двухколоночную композицию для главных чисел и не создаёт horizontal overflow. Release gate: ESLint, TypeScript, `554` smoke assertions, production build и repository Playwright на PL/EN/RU/UK desktop/tablet/mobile; отдельно проверены initial/expanded result states на `1440x900` и `390x844`, loading/error/partial-data regression flow, actions, console/network/hydration и overflow. Встроенный browser tool недоступен, поэтому использован project Playwright fallback. Полная структурированная локализация backend reason prose остаётся областью P1-05.

### [x] P1-05. Сделать score explainable

**Область:** Risk, Investment, Negotiation, Liquidity и Rental scores.

**Результат:** пользователь понимает, что означает score, какие факторы его изменили, какие данные отсутствуют и что не следует заключать из значения.

**Критерии приемки:** структурированные reason codes; top positive/negative drivers; confidence/coverage; версия расчета; нет backend prose, смешивающего языки.

**Сложность:** L. **Зависимости:** P0-03, P1-02, localization contract.

**Текущий статус (2026-09-07): PARTIAL.** Missing-data codes, coverage и nullable unknown states выведены на `/check` и listing result. Не все scores имеют полный набор structured positive/negative reason codes и пользовательское объяснение confidence; часть decision content по-прежнему приходит как backend prose.

**Текущий статус (2026-09-08): DONE.** Backend теперь отдаёт отдельный structured explainability block для Investment, Risk, Negotiation, Liquidity и Rental scores: стабильные reason codes, направление драйвера, status, coverage, confidence, missing-data codes и версию формулы. `/check` и listing result локализуют эти коды в PL/EN/RU/UK, показывают основные положительные, отрицательные и неизвестные факторы через progressive disclosure и не выводят внутренние коды или backend-generated score prose. Недоступные Liquidity/Rental scores остаются `insufficient_data`, а не превращаются в ноль. Release gate: Ruff, Alembic single head и полный offline SQL upgrade, `420 passed, 1 skipped`, ESLint, TypeScript, `567` smoke assertions, npm audit (`0` vulnerabilities), production Next.js build и repository Playwright для score explainability в PL/EN/RU/UK на mobile и PL desktop; также повторно пройдены desktop/tablet/mobile, error, critical, provenance и rental states без console/network/hydration/overflow ошибок. Встроенный browser tool недоступен из-за отсутствующего sandboxPolicy, поэтому actual browser QA выполнен через project Playwright fallback.

### [x] P1-06. Завершить локализацию и безопасные ошибки

**Область:** все consumer routes; API error schema; mutation feedback.

**Результат:** PL/EN/RU/UK не смешиваются, а ошибки дают понятный путь восстановления без раскрытия internal details.

**Критерии приемки:** отсутствующие ключи обнаруживаются автоматически; API отдает stable error code + params + correlation id; UI локализует сообщения; проверены loading/empty/partial/error/retry и failed mutation rollback.

**Сложность:** XL. **Зависимости:** error taxonomy, translation ownership, API contracts.

**Текущий статус (2026-09-09): DONE.** Consumer routes больше не выводят backend prose для decision reasons, risks, negotiation, due-diligence, knowledge gaps, source evidence и inline report content: эти сообщения строятся из существующих structured facts в типизированном PL/EN/RU/UK catalog. `/market`, карта и общие state blocks локализованы; TypeScript и smoke-проверки обнаруживают пропущенные locale keys и повторное использование raw backend fields. API возвращает `error.code`, безопасные `params` и `correlation_id`; validation и `500` не раскрывают input, exception text или internal details, а frontend не использует raw response body как пользовательское сообщение. Release gate: Ruff; полный backend suite `422 passed, 1 skipped`; ESLint; TypeScript; `615` smoke assertions; npm audit (`0 vulnerabilities`); production Next.js build; repository Playwright для PL/EN/RU/UK на desktop/tablet/mobile, ненулевого MapLibre canvas, console/network/hydration/overflow, loading/partial/error/retry и failed report/save mutation rollback. Во время gate найдены и исправлены production-only TDZ в locale catalog, ложный `saved` status по одному `draft_id`, zero-height MapLibre canvas из-за CSS precedence и security advisories обновлением MapLibre и существующих dependency overrides до исправленных версий. Standalone generated HTML/PDF является versioned report artifact, не consumer route copy; его legacy language contract явно остается в P1-12 и не используется inline `/check` или `/reports` UI.

### [x] P1-07. Объединить saved apartments в одну ментальную модель

**Область:** `/saved`; `/my-properties`; header/mobile navigation; save actions.

**Результат:** пользователь не выбирает между двумя похожими разделами и понимает состояние каждого объекта.

**Критерии приемки:** один основной маршрут; миграция/redirect старого маршрута; единые статусы; фильтры и empty state; действия compare/track/remove не расходятся между экранами.

**Сложность:** L. **Зависимости:** P0-02, data model ownership, routing migration.

### [ ] P1-08. Исправить comparison flow и contract

**Область:** `/compare`; comparison API; contextual add-to-compare actions.

**Результат:** сравниваются только явно выбранные квартиры; система не подставляет произвольные объекты и не теряет набор при навигации.

**Критерии приемки:** contract принимает стабильный список IDs; минимум/максимум объяснены; unavailable property не ломает весь экран; mobile использует не широкую desktop-таблицу, а пригодное для последовательного сравнения представление; различия и recommendation зависят от intent.

**Сложность:** L. **Зависимости:** P0-02, P1-02, P1-07, P1-16.

**Текущий статус (2026-09-07): PARTIAL.** Явный набор объектов сохранен, но recommendation/trade-offs еще не опираются на durable buyer profile, а detailed metric matrix остается слишком доминирующей на mobile.

### [ ] P1-09. Довести alerts до понятного пользовательского сервиса

**Область:** `/alerts`; listing tracking; delivery channels; notification preferences.

**Результат:** alert создается из контекста квартиры/поиска, показывает условие, канал, статус и последнее срабатывание.

**Критерии приемки:** нет мнимой доставки при отсутствии provider; permission/error states; pause/resume/delete; timezone и frequency понятны; audit trail доступен пользователю.

**Сложность:** L. **Зависимости:** P0-02, P0-05, provider readiness, event model.

**Текущий статус (2026-09-07): PARTIAL.** Event/history foundation существует, но object-watch lifecycle, baseline updates и реальная delivery semantics не проверены end-to-end для пользовательских alerts; недоступные source capabilities должны быть явно заблокированы в UI.

### [ ] P1-10. Исправить mortgage и полную стоимость покупки

**Область:** `/mortgage`; listing CTA; purchase costs; affordability.

**Результат:** калькулятор объясняет loan assumptions, налоги/комиссии и связь платежа с конкретной ценой квартиры.

**Критерии приемки:** primary/secondary market treatment; down payment и rate type; fees/taxes with legal freshness; monthly payment и total repayment; сценарии ставки; предупреждение о том, что affordability не равна банковскому решению.

**Сложность:** L. **Зависимости:** legal/product review, P0-03, source freshness.

**Текущий статус (2026-09-07): PARTIAL.** Основные расчеты реализованы, но legal/product review и freshness налогов/сборов не подтверждены для production release.

### [x] P1-11. Сделать negotiation output сценарным и доказуемым

**Область:** negotiation section; report; comparable evidence.

**Результат:** recommended offer/target/walk-away не выглядят гарантированной рыночной истиной.

**Критерии приемки:** значения обозначены как scenarios; каждый аргумент связан с evidence; отсутствующие данные не превращаются в совет; доступны конкретные следующие действия и экспортируемое краткое обоснование.

**Сложность:** M. **Зависимости:** P0-04, P1-05.

**Текущий статус (2026-09-09): DONE.** Negotiation contract теперь явно разделяет `available` и `insufficient_data`, содержит версию сценария, confidence, structured arguments/actions и обязательные evidence references. При слабой fair-price confidence, низком качестве объявления или недостаточной market sample API не возвращает opening/target/range/walk-away prices и переводит решение в verify-first. Consumer UI, reports и AI используют только этот контракт, локализуют его в PL/EN/RU/UK, показывают provenance каждого аргумента и позволяют скопировать краткий evidence-backed brief. Release gate: Ruff; `427 passed, 1 skipped`; ESLint; TypeScript; `631` frontend smoke assertions; npm audit без уязвимостей; production Next.js build; полный repository Playwright на desktop/tablet/mobile для PL/EN/RU/UK, включая available/insufficient negotiation, critical flow, error/retry, console/network/hydration и overflow checks. Fair-price formula не изменялась.

### [ ] P1-12. Прояснить pricing, reports и entitlement

**Область:** `/pricing`; `/reports`; checkout/subscription mutations.

**Результат:** пользователь понимает, что покупает, какие данные входят, когда формируется report и что происходит после оплаты.

**Критерии приемки:** feature/limit matrix; понятная граница free/paid; никакой fake payment mutation; loading/failure/idempotency; report freshness/version; доступ после оплаты проверяется server-side.

**Сложность:** L. **Зависимости:** P0-02, P0-05, billing provider/product model, report versioning.

**Текущий статус (2026-09-07): PARTIAL / BLOCKED.** Каталог централизован, но consumer/B2B предложения и языки смешаны; live provider checkout/webhook и server-side fulfillment не подтверждены реальным staging платежом. Зависит от P0-05.

### [x] P1-13. Явно показать географическое покрытие

**Область:** `/search`; `/check`; `/areas`; empty/no-data states.

**Результат:** пользователь до анализа знает поддерживаемые города/районы и качество покрытия.

**Критерии приемки:** coverage не обещается шире источников; unsupported location не получает уверенную оценку; есть объяснение и альтернатива; coverage metadata имеет freshness.

**Сложность:** M. **Зависимости:** source registry, P0-04.

### [x] P1-14. Добавить provenance к listing cards и результатам импорта

**Область:** search/cards; saved; compare; listing result.

**Результат:** источник, дата обновления, media status и ключевые ограничения видимы там, где пользователь принимает решение.

**Критерии приемки:** отсутствующее фото не подменяется вводящей в заблуждение картинкой; дубликаты/устаревшие объявления обозначены; ссылка на источник безопасна; freshness единообразна.

**Сложность:** M. **Зависимости:** importer provenance, media pipeline.

### [x] P1-15. Сделать action layer адаптивным к фактам и рискам

**Область:** listing result; report; viewing checklist; seller questions; document/legal checklist; negotiation preparation.

**Результат:** отчет заканчивается конкретными проверяемыми действиями, сформированными только из известных характеристик и выявленных рисков объекта.

**Критерии приемки:** действия имеют structured codes и evidence references; unknown не превращается в факт; risk-specific actions добавляются детерминированно; пользователь может отметить/экспортировать checklist; PL/EN/RU/UK локализуются во frontend.

**Текущий статус (2026-09-09): DONE.** Backend формирует versioned `BuyerActionPlan` со stable action codes, фазами до предложения/на просмотре/после просмотра, приоритетами и обязательными evidence references. План детерминированно различает primary/secondary market, добавляет intent-aware risk-specific steps и не превращает unknown в факт, calculated evidence или фиктивную выборку. `/check` и listing result показывают PL/EN/RU/UK checklist, сохраняют отметки локально, раскрывают provenance и копируют evidence-backed brief; reports и buyer AI используют тот же structured plan. Release gate: targeted suite `129 passed`; полный backend suite `434 passed, 1 skipped`; Ruff; ESLint; TypeScript; `651` smoke assertions; npm audit без уязвимостей; production build; OpenAPI regeneration; repository Playwright на desktop/tablet/mobile во всех локалях, включая action plan на 1440px/390px и recovery/error/console/network/hydration/overflow проверки. Встроенный browser недоступен из-за отсутствующего `sandboxPolicy`, поэтому rendered QA выполнен repository Playwright fallback.

**Сложность:** L. **Зависимости:** P0-03, P1-05, P1-06, P1-11.

### [ ] P1-16. Добавить компактный профиль покупателя

**Область:** account/preferences; `/check`; listing fit; compare; areas.

**Результат:** небольшой набор действительно полезных предпочтений сохраняется и прозрачно влияет на fit, explanations и comparison recommendation.

**Критерии приемки:** сохраняются intent, budget и ограниченный набор lifestyle/investment priorities; onboarding не превращается в длинную анкету; персонализированные выводы обозначены; исходные market facts не меняются; пользователь может изменить или удалить профиль.

**Текущий статус (2026-09-07): NOT STARTED.** Сейчас intent существует локально в отдельных flows, но durable cross-route buyer profile отсутствует.

**Сложность:** L. **Зависимости:** P0-02, P1-02, P1-06.

---

## P2 - навигация, discovery и системное качество

### [x] P2-01. Упростить IA и активную навигацию

**Область:** desktop header; mobile navigation; secondary routes.

**Результат:** основной путь `/check -> result -> save/compare/negotiate/track` визуально доминирует; текущий раздел всегда понятен.

**Сложность:** M. **Зависимости:** P1-07, route inventory.

### [ ] P2-02. Сделать search прозрачным и управляемым

**Область:** `/search`; filters; sort; result cards.

**Результат:** примененные фильтры и сортировка видимы; internal score thresholds не выдаются за естественные пользовательские категории; URL/state воспроизводимы.

**Сложность:** M. **Зависимости:** P1-02, P1-13, P1-14.

**Текущий статус (2026-09-07): PARTIAL.** Search работает, но default surface все еще содержит/опирается на internal analytical thresholds и нуждается в упрощении до location, budget, rooms, size и intent с пользовательскими ranking modes.

### [ ] P2-03. Перевести areas на динамические и проверяемые данные

**Область:** `/areas`; `/areas/:slug`; infrastructure; trends; planned investments.

**Результат:** районные выводы имеют источник, дату, scope и coverage; неизвестные данные не заменяются общими рекламными фразами.

**Сложность:** L. **Зависимости:** `$domarion-analytics-integrity`, source registry, P1-13.

**Текущий статус (2026-09-07): PARTIAL.** RCN rolling median, yearly medians и monthly history verified. Остается decision-first narrative (`dla kogo`, `kto powinien unikać`, risks, alternatives), честное отображение отсутствующего infrastructure coverage вместо подтвержденных нулей и разделение positive catalyst от supply/disruption impact.

### [ ] P2-04. Укрепить guides как редакционный продукт

**Область:** `/guides`; `/guides/:slug`; все существующие guide slugs.

**Результат:** видны автор/рецензент, дата обновления, источники и дисклеймер для финансовой/юридической информации; связанные действия ведут в основной flow.

**Сложность:** M. **Зависимости:** editorial ownership, localization.

**Текущий статус (2026-09-07): PARTIAL.** Основные guide routes и CTA существуют, но source/editorial/legal review, локализация и систематическая связь с актуальным coverage требуют завершения после P2-03.

### [ ] P2-05. Привести mobile UX к отдельной композиции

**Область:** все consumer routes на 390 px и tablet viewport.

**Результат:** важные действия доступны без горизонтального скролла и перекрытий; comparison, analytics и forms не являются просто сжатой desktop-версией.

**Сложность:** L. **Зависимости:** P1 result/compare/navigation tasks.

**Текущий статус (2026-09-07): PARTIAL.** Критические переполнения исправлялись, но listing/report/compare и длинный список areas требуют повторной композиционной проверки на 390 px, tablet и zoom, включая sticky actions и expanded states.

### [ ] P2-06. Снизить визуальную плотность и унифицировать компоненты

**Область:** cards, badges, buttons, spacing, typography, chart hierarchy.

**Результат:** меньше равнозначных панелей и декоративных эффектов; decision information сильнее secondary analytics; состояния и controls выглядят единообразно.

**Сложность:** L. **Зависимости:** `$domarion-ui-quality`, P1-04.

**Текущий статус (2026-09-07): PARTIAL.** Общая система стала последовательнее, но listing/report/compare все еще дают secondary metrics слишком большой визуальный вес и требуют сокращения повторяющихся cards/panels.

### [ ] P2-07. Разделить крупные frontend/backend модули и типизировать API

**Область:** большие page/API modules; generated OpenAPI client; domain boundaries.

**Результат:** аналитический contract не дублируется вручную, а изменения проще тестировать без переписывания приложения.

**Сложность:** XL. **Зависимости:** стабилизация P0/P1 API; не выполнять как отдельный rewrite.

**Текущий статус (2026-09-07): PARTIAL.** Generated API contract используется, но крупные page/domain modules остаются сложными. Делить только по мере работы над открытыми P0/P1 vertical slices, без отдельного rewrite.

### [x] P2-08. Добавить browser quality gate в CI

**Область:** `.github/workflows/ci.yml`; Playwright/browser tests.

**Результат:** CI проверяет реальные критические consumer flows, а не только unit/build.

**Критерии приемки:**

- отдельный job поднимает backend и frontend и ждет health/readiness;
- выполняются smoke/E2E для check -> result -> save -> compare и ключевых failure states;
- есть проверки 390 px и desktop, минимум основной PL locale и smoke остальных локалей;
- console errors, failed requests и hydration errors проваливают тест;
- screenshots/trace сохраняются как artifacts при failure;
- тест не зависит от production data и использует явно маркированный deterministic test fixture.

**Сложность:** L. **Зависимости:** стабильные P0/P1 flows, test authentication, deterministic fixture strategy.

### [x] P2-09. Устранить нестабильные React keys и расхождение UI states

**Область:** developer lists и другие повторяющиеся collections; query/mutation cache.

**Результат:** нет duplicate-key warnings, stale UI после mutation и расхождения между server и client state.

**Сложность:** S. **Зависимости:** стабильные entity identifiers.

### [ ] P2-10. Реализовать продуктовую аналитику decision funnel

**Область:** `/check`; listing/report; comparables; risks; negotiation; saved; compare; pricing; checkout.

**Результат:** команда видит, где пользователь получает ценность и где покидает основной buying journey, без сбора лишних персональных данных.

**Критерии приемки:** документированы и реализованы `check_started`, `check_completed`, `report_opened`, `verdict_viewed`, `comparables_opened`, `risk_opened`, `negotiation_opened`, `negotiation_message_generated`, `property_saved`, `comparison_started`, `comparison_completed`, `pricing_viewed`, `checkout_started`, `purchase_completed`; свойства событий не содержат URL объявления, полного адреса или иных ненужных PII; naming/versioning проверены тестами.

**Текущий статус (2026-09-07): NOT STARTED.** Обязательные funnel events в текущем приложении не обнаружены.

**Сложность:** L. **Зависимости:** P0-02, P1-04, P1-08, P1-12.

### [ ] P2-11. Провести финальный product review и убрать низкоценную сложность

**Область:** полный consumer journey на desktop/mobile; production/internal route separation; product documentation.

**Результат:** подтверждены сценарии check, incomplete data, negotiation, comparison и saved/monitoring; оставшаяся сложность не конкурирует с решением пользователя.

**Критерии приемки:** пройдены сценарии A-E из transformation roadmap; проверены loading/empty/partial/error/retry, console/network и локали; internal/debug/demo surfaces недоступны production users; выполнен полный relevant test suite; создан `docs/product/DOMARION_FINAL_PRODUCT_REVIEW.md` с limitations, data gaps, metrics и remaining P0/P1/P2.

**Текущий статус (2026-09-07): NOT STARTED.** Выполнять только после P0-05, P2-10 и завершения открытых core-flow блоков.

**Сложность:** L. **Зависимости:** P0-05, P1-04, P1-06, P1-08, P1-09, P2-05, P2-10.

---

## P3 - polish

### [x] P3-01. Исправить document outline и accessibility labels

**Область:** consumer pages с двумя `h1`, пропущенными именами controls, landmarks и focus order.

**Сложность:** S. **Зависимости:** P2-01, P2-06.

### [x] P3-02. Исправить typography/spacing мелких финансовых значений

**Область:** mortgage labels/values и аналогичные summary rows.

**Сложность:** S. **Зависимости:** P1-10, P2-06.

---

## Рекомендуемый порядок реализации

1. **Data integrity release blocker:** P0-03 -> P0-04 -> P1-03 -> P1-05.
2. **Localization and decision flow:** P1-06 -> P1-04 -> P1-11 -> P1-15.
3. **Personal decision support:** P1-16 -> P1-08 -> P1-09.
4. **Financial/commercial flow:** P1-10 -> P1-12; P0-05 закрывается параллельно только при наличии external access и evidence.
5. **Discovery:** P2-02 -> P2-03 -> P2-04.
6. **Cross-device quality:** P2-05 -> P2-06; P2-07 выполнять постепенно внутри этих vertical slices.
7. **Measurement and final gate:** P2-10 -> P2-11.

P0 является release blocker. P1 должен быть завершен до расширения feature surface. P2/P3 не должны маскировать нерешенные проблемы доверия косметическими изменениями.

---

## Definition of Done для каждого блока

Задача может быть отмечена выполненной только когда:

- подтвержден текущий contract и зафиксирована семантика изменения;
- добавлены тесты happy path, partial/unknown data и failure/retry, где применимо;
- выполнены formatter, lint, typecheck/static checks, targeted tests, broad tests и build;
- приложение запущено с корректными frontend/backend dependencies;
- проверены desktop, tablet и mobile представления затронутых routes;
- проверены loading, success, empty, partial-data, error и retry states;
- проверены PL/EN/RU/UK либо явно зафиксирована незакрытая локализационная задача;
- browser console и network не содержат необъясненных ошибок;
- для аналитики подтверждены source, freshness, sample size/scope, confidence и поведение при недостатке данных;
- просмотрены `git diff` и `git status`, отсутствуют случайные файлы и unrelated changes;
- выполнен `$domarion-release-gate` и составлен честный итоговый отчет.

## Формат итогового отчета агента

```text
Задача: <ID и название>
Статус: выполнена | частично | заблокирована

Изменено:
- ...

Проверено:
- команда/сценарий и результат

Не проверено:
- причина

Риски:
- ...

Checklist:
- [x]/[ ] <ID>

Следующая доступная задача:
- <ID>
```
