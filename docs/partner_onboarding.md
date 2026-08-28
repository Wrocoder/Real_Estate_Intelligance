# Partner Data Onboarding

Цель: получать актуальные квартиры в продаже legal-first способом, без неразрешенного копирования чужих порталов.
Общая policy по Terms/robots/rate limits и запрещенным данным описана в
`docs/source_compliance_policy.md`.

## 1. Допустимые источники

- Partner CSV/API от агентства, девелопера, CRM или MLS-like системы, где партнер подтверждает право передавать данные Domarion.
- Ручная админ-загрузка CSV для пилотных агентств и paid beta.
- Official/open data только для enrichment: инфраструктура, планы города, статистика, границы районов. Не использовать open data как замену активным объявлениям о продаже, если такого набора данных нет.
- Paid data provider, если договор разрешает аналитику, хранение истории цен и показ пользователям.

Не подключать источник к production ingestion, пока в Source Registry не заполнены `legal_status`, `owner`, `refresh_cadence`, `ingestion_method`, `allowed_use`, `robots_txt_url` и `terms_url` при наличии.

## 2. Source Registry

Каждый источник заводится в `/admin` в блоке `Source Registry`.

Поля:

- `name`: стабильное имя источника. Оно должно совпадать с `source_name` в CSV/import job.
- `source_type`: `partner_csv`, `partner_api`, `crm_export`, `developer_feed`,
  `official_open_data`, `user_submitted_reference`, `manual`.
- `legal_status`: `review_required`, `approved`, `unknown`, `blocked`.
- `refresh_cadence`: `manual`, `daily`, `weekly`, `monthly` или договорная частота.
- `owner`: кто внутри отвечает за источник.
- `ingestion_method`: `partner_csv`, `admin_csv_upload`, `partner_api_pull`,
  `crm_export`, `planned_investments_import`, `infrastructure_reference_import`,
  `developer_feed_import`, `user_submitted_one_off`, `manual`.
- `allowed_use`: список через запятую, например `analytics,reports,price_history,map_layers`.
- `robots_txt_url`, `terms_url`, `notes`: evidence trail для legal/data governance.
- `is_active`: выключить, если договор истек, источник нестабилен или legal review не пройден.

## 3. Partner Listings CSV

Формат: UTF-8 CSV, максимум 5 MB для текущего admin endpoint.

Обязательные колонки, как их проверяет `domarion/ingestion/partner_csv.py`:

```csv
source_listing_id,title,source_url,city,district,address,market_type,price,area_m2,rooms
```

Рекомендуемые колонки:

```csv
observed_at,first_seen_at,last_seen_at,lat,lon,municipality,voivodeship,area_id,floor,building_floors,building_year,currency,price_per_m2,building_type,renovation_state,has_balcony,has_terrace,has_garden,has_elevator,parking_type,heating_type,distance_to_center_km,nearest_stop_m,nearest_school_m,nearest_major_road_m,nearest_industrial_zone_m,parks_within_1km,schools_within_1km,planned_investments_within_2km,data_quality_score,developer_id,developer_name,investment_name,primary_market_project_id,active_status,status,description_hash,description_digest,description_sha256
```

Правила:

- `source_listing_id` должен быть стабильным ID у партнера.
- `observed_at`, `first_seen_at`, `last_seen_at` передавать в ISO формате `YYYY-MM-DD`.
  Если `observed_at` отсутствует, importer использует текущую дату.
- `market_type`: `primary` или `secondary`.
- `source_url` должен вести на страницу партнера или объект в CRM, если это разрешено.
- `lat` и `lon` необязательны только если offline geocoder может распознать
  `address`/`city`/`district`; иначе строка будет отклонена.
- `description` можно передавать только если у партнера есть правовое основание;
  importer сохраняет SHA-256 hash, а не полный текст. Предпочтительнее сразу
  передавать `description_hash`, `description_digest` или `description_sha256`.
- Для primary-market объектов передавать `developer_id`, `developer_name`,
  `investment_name` и `primary_market_project_id`, если они есть у источника.
- Не передавать фото, телефоны владельцев, email клиентов, private notes и персональные данные без отдельного правового основания.
- Для полного snapshot источника используйте `mark_missing_removed=true`:
  объекты этого source, отсутствующие в файле, будут отмечены как `removed`,
  а повторное появление создаст `republished` event.

## 4. Admin Flow

1. Завести источник в `Source Registry` со статусом `review_required`.
2. Провести legal review: договор, TOS, allowed use, retention, removal process.
3. Перевести `legal_status` в `approved`.
4. Загрузить CSV через `Partner CSV Import` сначала в dry-run.
5. Проверить `Data Quality`, warnings/errors и `Raw Listings Preview`.
6. Запустить non-dry-run только для approved источника и Postgres окружения.

CLI dry-run:

```bash
domarion import-partner-csv data/samples/partner_listings_wroclaw.csv \
  --source-name "Demo Partner" \
  --dry-run
```

Full snapshot import:

```bash
domarion import-partner-csv data/samples/partner_listings_wroclaw.csv \
  --source-name "Demo Partner" \
  --mark-missing-removed
```

API для загрузки:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/admin/listings/import-csv" \
  -H "X-Domarion-User-Id: admin" \
  -H "X-Domarion-Email: admin@example.com" \
  -H "X-Domarion-Role: admin" \
  -H "X-Domarion-Plan: enterprise" \
  -F "source_name=Demo Partner" \
  -F "dry_run=true" \
  -F "mark_missing_removed=false" \
  -F "file=@data/samples/partner_listings_wroclaw.csv;type=text/csv"
```

Non-dry-run API import requires `INGESTION_ADMIN_STORE_BACKEND=postgres` and
`DATA_REPOSITORY_BACKEND=postgres`, so raw listings, jobs, quality logs,
properties and snapshots land in the same PostgreSQL/PostGIS database.

## 5. Acceptance Checklist

- Source exists in registry and `legal_status=approved`.
- `allowed_use` includes the intended product usage.
- CSV dry-run returns zero critical errors.
- Data-quality warnings are reviewed or accepted.
- Partner has a removal/update path.
- Raw payload excludes prohibited personal/contact data.
- Full snapshot imports use `mark_missing_removed=true` only when the partner file
  really represents the complete current source state.
