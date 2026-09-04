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

### [x] P1-04. Сделать result page ориентированной на решение

**Область:** `/listings/:id`; `ListingDetailPage`; analytical sections.

**Результат:** первый viewport отвечает на четыре вопроса: цена предложения, fair-price range, предполагаемая переплата/выгода, итоговый verdict и следующий шаг.

**Критерии приемки:** структура `decision -> explanation -> evidence -> action`; secondary analytics раскрываются прогрессивно; нет равного визуального веса у всех metrics; save/compare/negotiate/track доступны в контексте.

**Сложность:** L. **Зависимости:** P0-03, P0-04, P1-02, UI primitives.

### [x] P1-05. Сделать score explainable

**Область:** Risk, Investment, Negotiation, Liquidity и Rental scores.

**Результат:** пользователь понимает, что означает score, какие факторы его изменили, какие данные отсутствуют и что не следует заключать из значения.

**Критерии приемки:** структурированные reason codes; top positive/negative drivers; confidence/coverage; версия расчета; нет backend prose, смешивающего языки.

**Сложность:** L. **Зависимости:** P0-03, P1-02, localization contract.

### [x] P1-06. Завершить локализацию и безопасные ошибки

**Область:** все consumer routes; API error schema; mutation feedback.

**Результат:** PL/EN/RU/UK не смешиваются, а ошибки дают понятный путь восстановления без раскрытия internal details.

**Критерии приемки:** отсутствующие ключи обнаруживаются автоматически; API отдает stable error code + params + correlation id; UI локализует сообщения; проверены loading/empty/partial/error/retry и failed mutation rollback.

**Сложность:** XL. **Зависимости:** error taxonomy, translation ownership, API contracts.

### [x] P1-07. Объединить saved apartments в одну ментальную модель

**Область:** `/saved`; `/my-properties`; header/mobile navigation; save actions.

**Результат:** пользователь не выбирает между двумя похожими разделами и понимает состояние каждого объекта.

**Критерии приемки:** один основной маршрут; миграция/redirect старого маршрута; единые статусы; фильтры и empty state; действия compare/track/remove не расходятся между экранами.

**Сложность:** L. **Зависимости:** P0-02, data model ownership, routing migration.

### [x] P1-08. Исправить comparison flow и contract

**Область:** `/compare`; comparison API; contextual add-to-compare actions.

**Результат:** сравниваются только явно выбранные квартиры; система не подставляет произвольные объекты и не теряет набор при навигации.

**Критерии приемки:** contract принимает стабильный список IDs; минимум/максимум объяснены; unavailable property не ломает весь экран; mobile использует не широкую desktop-таблицу, а пригодное для последовательного сравнения представление; различия и recommendation зависят от intent.

**Сложность:** L. **Зависимости:** P0-02, P1-02, P1-07.

### [x] P1-09. Довести alerts до понятного пользовательского сервиса

**Область:** `/alerts`; listing tracking; delivery channels; notification preferences.

**Результат:** alert создается из контекста квартиры/поиска, показывает условие, канал, статус и последнее срабатывание.

**Критерии приемки:** нет мнимой доставки при отсутствии provider; permission/error states; pause/resume/delete; timezone и frequency понятны; audit trail доступен пользователю.

**Сложность:** L. **Зависимости:** P0-02, provider readiness, event model.

### [x] P1-10. Исправить mortgage и полную стоимость покупки

**Область:** `/mortgage`; listing CTA; purchase costs; affordability.

**Результат:** калькулятор объясняет loan assumptions, налоги/комиссии и связь платежа с конкретной ценой квартиры.

**Критерии приемки:** primary/secondary market treatment; down payment и rate type; fees/taxes with legal freshness; monthly payment и total repayment; сценарии ставки; предупреждение о том, что affordability не равна банковскому решению.

**Сложность:** L. **Зависимости:** legal/product review, P0-03, source freshness.

### [x] P1-11. Сделать negotiation output сценарным и доказуемым

**Область:** negotiation section; report; comparable evidence.

**Результат:** recommended offer/target/walk-away не выглядят гарантированной рыночной истиной.

**Критерии приемки:** значения обозначены как scenarios; каждый аргумент связан с evidence; отсутствующие данные не превращаются в совет; доступны конкретные следующие действия и экспортируемое краткое обоснование.

**Сложность:** M. **Зависимости:** P0-04, P1-05.

### [x] P1-12. Прояснить pricing, reports и entitlement

**Область:** `/pricing`; `/reports`; checkout/subscription mutations.

**Результат:** пользователь понимает, что покупает, какие данные входят, когда формируется report и что происходит после оплаты.

**Критерии приемки:** feature/limit matrix; понятная граница free/paid; никакой fake payment mutation; loading/failure/idempotency; report freshness/version; доступ после оплаты проверяется server-side.

**Сложность:** L. **Зависимости:** P0-02, billing provider/product model, report versioning.

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

---

## P2 - навигация, discovery и системное качество

### [x] P2-01. Упростить IA и активную навигацию

**Область:** desktop header; mobile navigation; secondary routes.

**Результат:** основной путь `/check -> result -> save/compare/negotiate/track` визуально доминирует; текущий раздел всегда понятен.

**Сложность:** M. **Зависимости:** P1-07, route inventory.

### [x] P2-02. Сделать search прозрачным и управляемым

**Область:** `/search`; filters; sort; result cards.

**Результат:** примененные фильтры и сортировка видимы; internal score thresholds не выдаются за естественные пользовательские категории; URL/state воспроизводимы.

**Сложность:** M. **Зависимости:** P1-02, P1-13, P1-14.

### [x] P2-03. Перевести areas на динамические и проверяемые данные

**Область:** `/areas`; `/areas/:slug`; infrastructure; trends; planned investments.

**Результат:** районные выводы имеют источник, дату, scope и coverage; неизвестные данные не заменяются общими рекламными фразами.

**Сложность:** L. **Зависимости:** `$domarion-analytics-integrity`, source registry, P1-13.

### [x] P2-04. Укрепить guides как редакционный продукт

**Область:** `/guides`; `/guides/:slug`; все существующие guide slugs.

**Результат:** видны автор/рецензент, дата обновления, источники и дисклеймер для финансовой/юридической информации; связанные действия ведут в основной flow.

**Сложность:** M. **Зависимости:** editorial ownership, localization.

### [x] P2-05. Привести mobile UX к отдельной композиции

**Область:** все consumer routes на 390 px и tablet viewport.

**Результат:** важные действия доступны без горизонтального скролла и перекрытий; comparison, analytics и forms не являются просто сжатой desktop-версией.

**Сложность:** L. **Зависимости:** P1 result/compare/navigation tasks.

### [x] P2-06. Снизить визуальную плотность и унифицировать компоненты

**Область:** cards, badges, buttons, spacing, typography, chart hierarchy.

**Результат:** меньше равнозначных панелей и декоративных эффектов; decision information сильнее secondary analytics; состояния и controls выглядят единообразно.

**Сложность:** L. **Зависимости:** `$domarion-ui-quality`, P1-04.

### [x] P2-07. Разделить крупные frontend/backend модули и типизировать API

**Область:** большие page/API modules; generated OpenAPI client; domain boundaries.

**Результат:** аналитический contract не дублируется вручную, а изменения проще тестировать без переписывания приложения.

**Сложность:** XL. **Зависимости:** стабилизация P0/P1 API; не выполнять как отдельный rewrite.

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

1. **Production safety:** P0-01 -> P0-02.
2. **Data semantics:** P0-03 -> P0-04.
3. **Core analytical trust:** P1-02 -> P1-03 -> P1-05 -> P1-06.
4. **Primary apartment-check flow:** P1-01 -> P1-04 -> P1-11 -> P1-14.
5. **Personal workflow:** P1-07 -> P1-08 -> P1-09.
6. **Financial/action layer:** P1-10 -> P1-12.
7. **Coverage and discovery:** P1-13 -> P2-01 -> P2-02 -> P2-03 -> P2-04.
8. **Cross-device UI:** P2-05 -> P2-06 -> P2-09 -> P3-01 -> P3-02.
9. **Architecture and continuous verification:** P2-07 выполнять постепенно внутри предыдущих задач; P2-08 закрыть после стабилизации основных flows.

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
