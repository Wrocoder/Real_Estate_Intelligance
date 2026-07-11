# Hybrid User-Provided Listing Analysis

Цель: дать пользователю почти тот же UX, что и “найди объект на портале и сравни”, но не строить MVP на массовом скрапинге чужих баз объявлений.

## Product Flow

1. Пользователь открывает “Проверить квартиру”.
2. Вводит адрес или район, цену, площадь, комнаты и базовые параметры.
3. Опционально вставляет URL объявления.
4. Система нормализует объект, геокодирует адрес и считает data-quality/confidence score.
5. Сравнение строится по нашим legal-first данным: партнерские snapshots, user-owned/manual listings, area statistics, market snapshots, planned investments и open-data слои.
6. Если comparables мало, система делает area-level estimate и явно показывает низкую confidence.
7. Отчет не публикует URL объявления и не показывает пользователям скрытые ссылки на порталы.

## Source URL Policy

- URL хранится только как приватный internal reference/evidence для объекта пользователя.
- URL не индексируется в SEO, не показывается другим пользователям, не экспортируется в публичные отчеты.
- URL не используется для scheduled crawling, bulk indexing или мониторинга портала без отдельного legal approval.
- URL-assisted parsing можно добавить только как one-off user-submitted analysis после review конкретного источника в Source Registry.
- Не извлекать и не хранить фото, контактные данные, имена частных продавцов, телефоны, email или private notes.
- Пользователь подтверждает, что он имеет право использовать переданные параметры/ссылку для личного анализа.

## Data Model Direction

Минимальный MVP может хранить объект как draft/report metadata:

- `owner_id`
- `address`
- `city`
- `district`
- `price`
- `area_m2`
- `rooms`
- `floor`
- `building_year`
- `market_type`
- `source_url_private`
- `source_domain`
- `data_quality_score`
- `created_at`
- `expires_at`

Позже можно вынести в таблицу `user_submitted_listings` и связать с `report_orders`, `generated_reports`, `user_favorites`.

## Analysis Contract

Система должна возвращать:

- normalized draft listing;
- confidence score;
- fair price range;
- comparable area/listing basis;
- warnings по недостающим параметрам;
- planned investments nearby;
- buyer questions/checklist;
- mortgage/total purchase cost section.

## Non-Goals For MVP

- Массовый crawler Otodom/OLX/Morizon.
- Обход anti-bot, captcha, login, paywall или rate limits.
- Публичное отображение чужих source URLs.
- Републикация описаний, фото или контактов продавцов.
- Claims вроде “официальная цена рынка” без confidence/disclaimer.
