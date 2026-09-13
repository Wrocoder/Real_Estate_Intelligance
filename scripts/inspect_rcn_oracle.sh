#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${DOMARION_APP_DIR:-/srv/domarion/app}"
ENV_FILE="${DOMARION_ENV_FILE:-/srv/domarion/env/oracle.env}"
COMPOSE_FILE="${DOMARION_COMPOSE_FILE:-compose.oracle.yaml}"

cd "$APP_DIR"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db sh -c \
  'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
SELECT count(*) AS observations,
       count(DISTINCT left(teryt, 2)) AS voivodeships,
       min(transaction_date)::date AS oldest_transaction,
       max(transaction_date)::date AS newest_transaction
FROM transaction_observations;

SELECT left(teryt, 2) AS teryt_prefix, count(*) AS observations
FROM transaction_observations
GROUP BY left(teryt, 2)
ORDER BY left(teryt, 2);

SELECT city,
       count(*) AS observations,
       count(*) FILTER (WHERE district IS NOT NULL) AS district_assigned,
       count(DISTINCT district) FILTER (WHERE district IS NOT NULL) AS districts
FROM transaction_observations
WHERE city IN ('Wrocław', 'Kraków', 'Warszawa', 'Gdańsk', 'Lublin', 'Poznań', 'Łódź')
GROUP BY city
ORDER BY city;
SQL
