# Local Runtime Troubleshooting

## Persistent data

The API loads `.env`. Each store has its own backend setting, such as
`DATA_REPOSITORY_BACKEND` and `AUTH_STORE_BACKEND`. `DOMARION_STORAGE_BACKEND`,
`DOMARION_ENV` and `ALLOW_DEMO_AUTH` are not recognized settings.

Start Docker Desktop before starting the API. The existing local database is
managed by the `wartometr-local` Compose project using `compose.staging.yaml`.
Keep its project name and volumes to retain existing users and transaction data.
Use the configured `DB_PORT` / `REDIS_PORT` when recreating services; the existing
local instance exposes PostgreSQL on `55433` and Redis on `56379`.

```powershell
docker start wartometr-local-db-1 wartometr-local-redis-1
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

`/health` checks that the API process responds. `/ready` also executes `SELECT 1`
when any persistent store uses PostgreSQL. An unavailable database returns `503`
with a failed `database_connection` check, including in local mode. PostgreSQL
connection attempts are limited to five seconds. Database operational errors
return a safe `service_unavailable` error to clients and preserve diagnostics in
server logs.

Area-directory locations are derived from existing area statistics and transaction
observations. `/api/v1/locations/municipalities` and `/api/v1/locations` are separate
reference tables. Empty reference tables do not imply transaction data is absent;
do not run `seed-demo` into the live local database to fill them.

## Browser sessions

Local browser API requests use the same loopback hostname as the page. This allows
the existing `SameSite=Lax` session cookie to work when the frontend is opened
through either `localhost` or `127.0.0.1`. The API must allow the frontend origin
in `CORS_ORIGINS`. Non-local API addresses and server-side requests retain their
configured URL.

## Two frontend servers

Concurrent Next.js servers must use separate output directories. Start the public
frontend normally on port 3000 with `INTERNAL_ROUTES_ENABLED=false`. For the
internal frontend, use a second terminal:

```powershell
cd frontend
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
$env:NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3001"
$env:INTERNAL_ROUTES_ENABLED="true"
$env:NEXT_DIST_DIR=".next-internal"
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Stop dev servers before building into their output directory.

## Regression verification

With the API on 8000 and public frontend on 3000:

```powershell
cd frontend
npm run browser:local-runtime
```

This local-only test creates one test account, checks invalid and valid login,
session persistence, location loading and logout on both loopback hostnames at
desktop and mobile widths. Screenshots are saved under
`frontend/artifacts/local-runtime`. The printed test-account email can be used to
identify and clean up only that account after verification.
