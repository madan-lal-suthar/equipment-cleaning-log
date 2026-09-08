# Equipment Cleaning Log

A small full-stack slice of a pharmaceutical cleaning-log system: equipment, their
cleaning records, and a field-level audit trail of every change.

- **Backend** — Node.js, TypeScript, Express, Sequelize, PostgreSQL
- **Frontend** — React, TypeScript, Vite, Redux (plain, with thunks)
- **Tests** — Vitest (backend: unit + integration against a real Postgres)

See [NOTES.md](./NOTES.md) for decisions and trade-offs.

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL), or your own Postgres 13+

## Quick start (everything in Docker)

```bash
docker compose up
```

Starts Postgres, migrates, seeds, and serves the API on
http://localhost:4000 and the web app on http://localhost:5173.

There are no Dockerfiles — both services run from the stock `node:22-alpine`
image and install on start, so the first run takes a minute or two while
`npm ci` runs in each container. Source is bind-mounted, so edits hot-reload.

## Local development

**1. PostgreSQL**

```bash
docker compose up -d db          # Postgres 16 on localhost:5433
```

Using your own Postgres? Create a database and put its URL in `backend/.env`.

**2. Backend**

```bash
cd backend
cp .env.example .env             # defaults match the docker-compose db
npm install
npm run db:migrate               # create the schema
npm run db:seed                  # 3 users, 4 equipment, 36 cleaning records
npm run dev                      # http://localhost:4000
```

**3. Frontend**

```bash
cd frontend
cp .env.example .env             # VITE_API_URL=http://localhost:4000
npm install
npm run dev                      # http://localhost:5173
```

Open http://localhost:5173, pick a user in the top-right "Signed in as" selector,
choose a piece of equipment, then add / edit records and view their history.

## Tests

```bash
cd backend  && npm test          # 55 tests — needs the Postgres container running
cd frontend && npm test          # 10 tests — no database needed
```

The backend suite creates and drops its own `cleaning_log_test` database, so it
never touches development data. Override with `TEST_DATABASE_URL=... npm test`.

Also available in both packages: `npm run typecheck`, `npm run build`. In
`backend/`: `npm run db:reset` (down, up, seed).

## API

All responses are JSON; errors are `{ "error": { "code", "message", "details"? } }`,
where `details` is `[{ path, message }]` for field-level failures. Writes require an
`X-User-Id` header holding a seeded user's id (the auth stand-in); reads are open.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/equipment` | offset paging: `?page=1&pageSize=20&status=active&search=GR` |
| `GET` | `/api/equipment/:id` | |
| `POST` | `/api/equipment` | `{ name, code, status? }` |
| `PATCH` | `/api/equipment/:id` | any subset of the above |
| `DELETE` | `/api/equipment/:id` | cascades to its cleaning records |
| `GET` | `/api/equipment/:id/cleaning-records` | keyset paging: `?limit=20&cursor=<opaque>&status=pending` |
| `POST` | `/api/equipment/:id/cleaning-records` | `{ cleanedAt, method, cleanedBy?, notes?, status? }` |
| `GET` | `/api/cleaning-records/:id` | |
| `PATCH` | `/api/cleaning-records/:id` | any subset of the create body |
| `GET` | `/api/cleaning-records/:id/audit` | field-level history, newest first |
| `GET` | `/api/users` | the seeded users the picker offers |

Equipment lists return `pageInfo: { page, pageSize, totalItems, totalPages, hasNextPage }`.
Record lists return `pageInfo: { limit, hasNextPage, nextCursor }` — pass
`nextCursor` back as `?cursor=` for the next page.

An audit entry looks like:

```jsonc
{
  "action": "update",
  "changedByName": "Asha Menon",
  "changedAt": "2026-09-08T11:06:27.483Z",
  "changes": [{ "field": "status", "from": "pending", "to": "verified" }]
}
```

## Layout

```
backend/src/
  db/            Sequelize instance, umzug migrations, seed
  models/        Equipment, CleaningRecord, AuditLog, User
  modules/       equipment · cleaning-records · audit (diff.ts is pure) · users
  middleware/    currentUser, errorHandler
frontend/src/
  api/           fetch client + typed resource calls
  store/         actionTypes · actions · reducers · middleware · selectors
  components/    EquipmentList, CleaningRecordsPanel, forms, AuditTrail
  lib/           cursorStack, errors, formatting
```
