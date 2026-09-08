# Notes

## Key decisions and trade-offs

### Data model

Four tables: `users`, `equipment`, `cleaning_records`, `audit_logs`.

- **UUID keys** — ids appear in URLs and cursors; sequential integers would leak row
  counts and make cursors guessable.
- **`cleaned_by` is a string, not a FK.** The operator who cleaned the machine is
  often not the person entering the record. The *actor* of a change is tracked
  separately, on the audit row.
- **`audit_logs.changed_by_name` is denormalised** next to `changed_by_id`, and the
  FK is `ON DELETE SET NULL`. Renaming or deleting a user must not rewrite history.
- **`changes` is JSONB** (`[{ field, from, to }]`). Every read is "the whole history
  of this record", never "all changes to field X", so a document per entry fits.
  A relational `audit_log_changes` table would be more normalised for no gain here.
- **`method` is free text.** Methods are site-configurable; an enum would need a
  migration per method. A lookup table is the right answer at scale.

### Sequelize, and why not `sync()`

Sequelize v6 with `Model.init` + `InferAttributes`, so a typo in a `where` clause
fails to compile. The schema is owned by **migrations, not `sync()`** — `sync()`
drifts from production and cannot express the composite descending indexes, enums
and cascade rules this schema needs. Migrations run under umzug so they stay
TypeScript in the same tsconfig, and are listed explicitly rather than globbed: the
list *is* the ordering. The trade-off is a little more ceremony for one migration.

### Audit trail

`modules/audit/diff.ts` is a pure function — before-snapshot, after-snapshot,
tracked fields → `[{ field, from, to }]`. Keeping it free of Sequelize is what makes
it cheap to test exhaustively.

- **Values are normalised first** (`Date` → ISO string, `undefined` → `null`).
  Without this a `PATCH` would diff a `Date` against a string and report a change
  that never happened.
- **Only tracked business fields are diffed** — `updatedAt` changes on every write
  and is noise in a trail someone has to read.
- **Absent ≠ cleared.** A missing field is "not submitted"; clearing is an explicit
  `null`, recorded as `value → null`.
- **A no-op update writes no audit row.**
- **The write and its audit row share one transaction**, and updates take
  `SELECT … FOR UPDATE` while reading the before-snapshot, so two concurrent edits
  cannot diff against the same stale values.

### Pagination — keyset for records, offset for equipment

**Cleaning records use keyset (cursor) pagination**, ordered by
`(cleaned_at DESC, id DESC)`. This list is append-heavy: with `OFFSET`, a record
inserted while you are on page 1 pushes a row you have already seen onto page 2 —
you see it twice and miss another entirely. A cursor anchors on a position in the
sort order instead, so pages stay stable, and Postgres seeks straight into the index
rather than counting and discarding `OFFSET` rows.

- **`id` is in the sort key as a tiebreaker.** `cleaned_at` is not unique —
  bulk-entered records routinely share a timestamp — and without a unique tiebreaker
  a cursor cannot distinguish rows already seen from rows with the same timestamp
  not yet seen.
- The query fetches `limit + 1` rows and trims one, so `hasNextPage` costs no second
  query and the cursor points at the last row kept.
- Cursors are base64url JSON: opaque enough not to be hand-built, readable in a
  debugger. Not a security boundary — every request is re-scoped to the equipment in
  the path.
- **The trade-off: no total count and no jumping to page 7.** The client keeps a
  stack of the cursors it has used so "Previous" still works
  (`frontend/src/lib/cursorStack.ts`).

**Equipment uses offset pagination** deliberately — the list is small, slow-moving,
and shown with a "Page 2 of 3 · 4 total" control that is worth a `COUNT(*)`. The
instability that rules offset out for records does not bite a list nobody appends to.

### API design

- Records are nested for list/create (`/api/equipment/:id/cleaning-records`), their
  only meaningful scope, but flat for read/update — a record id is globally unique,
  so repeating the equipment id would be noise.
- `PATCH`, not `PUT`: partial updates are what the UI and the diff both want.
- zod is called directly in controllers. A generic middleware would have to smuggle
  the parsed value onto `req` and lose the inferred type.
- One error handler, so clients always get `{ error: { code, message, details? } }`.
  **`details` is the useful half** — every field-attributable failure carries
  `[{ path, message }]` and the client renders each against its input. Sequelize's
  "code must be unique" is rewritten on the way out; it reads as a schema rule, not
  as something the person typing can act on.
- **A blank filter is not a bad request.** `?search=` or `?search=%20` means "not
  searching"; rejecting it would turn a stray space into a 400 for the whole list.
- Listing records for a non-existent equipment is a **404, not an empty page** — an
  empty page would make a typo look like "never been cleaned".

### Auth — deliberately shallow

The client sends `X-User-Id`; middleware resolves it against `users`, and mutating
routes require it. Enough to make `cleanedBy` and the audit "who" point at real rows.
**This is not security** — anyone can send anyone's id.

### Front-end state — plain Redux

All state lives in one store, server data and view state alike; components keep
`useState` only for raw keystrokes inside a form.

Plain Redux (`legacy_createStore`, hand-written action constants, reducers,
`redux-thunk`) rather than Redux Toolkit. **This is the weakest trade in the
project**: roughly 1,100 lines across `src/store/` to replace about 40 lines of
React Query hooks, and RTK is what the Redux team now recommends. Nothing the
library used to provide comes free — refetch-on-change is a `useEffect`,
invalidation is a mutation thunk re-dispatching a fetch thunk, and out-of-order
responses (the search box fires per keystroke) need a monotonic request id in
`store/requestId.ts` so reducers can ignore stale ones. What is genuinely lost is
the response cache: revisiting a page always refetches.

## Assumptions

- "Who changed it" is the authenticated user, separate from `cleanedBy` — the
  operator who physically did the cleaning.
- `cleanedAt` may be backdated (records are often entered after the fact), so it is
  not validated against "now".
- Audit entries are required for cleaning records, not for equipment.
- `status` transitions are unrestricted. A real system would enforce a workflow and
  forbid self-verification.

## What I would do differently with more time

- **Move the store to RTK Query** — it would delete the request-id guard, the manual
  loading flags and most of the thunks outright.
- **Cursor pagination on the audit endpoint**; it currently returns every entry.
- **Optimistic concurrency on update** (`If-Match` or a version column). The row lock
  prevents a corrupt diff, but the second writer still wins.
- **A `cleaning_methods` lookup table**, with the audit storing the id.
- **Real sessions and roles** in place of the header stand-in — and for this domain,
  per-action re-authentication for verification steps (21 CFR Part 11).
- A generic auditing hook once a second entity needs auditing. With one entity,
  explicit `writeAuditEntry` calls are clearer than clever.

## Deliberately left out

- **Authentication, authorisation and roles** beyond the stand-in above.
- **Soft deletes.** Deleting equipment cascades to its cleaning records; a real GxP
  system would retire and retain, never hard-delete. `Retire` exists so deleting is
  rarely the right choice, and delete sits behind a confirmation.
- **Reachable history for deleted records.** `audit_logs.entity_id` has no FK, so
  audit rows survive a cascade — but `getCleaningRecordAudit` resolves the record
  first, so the audit route 404s once it is gone. The history is *retained but
  unreadable*, which is the worst of both. The fix is small (drop the existence
  check, or expose `GET /api/audit?entityId=`) but it changes what a 404 means on
  that route, so it belongs in a deliberate decision rather than a drive-by edit.
- **Auditing equipment changes.** The table is entity-agnostic (`entity_type` +
  `entity_id`) and would take it; the brief asked for the cleaning-record trail.
- **Blocking records against retired equipment** — plausible, but my assumption
  rather than a stated requirement.
- **Rate limiting, helmet, CSRF, request logging** — out of scope for a local
  exercise.
- **Front-end routing.** One master/detail screen, so the selection is not in the URL.
- **Optimistic UI updates.** Mutations refetch — simpler and correct at this scale.
- **Dockerfiles.** `docker-compose.yml` runs `api` and `web` straight from
  `node:22-alpine` with the source bind-mounted, so there is nothing to build. The
  cost is that `npm ci` runs at container start rather than in a cached build layer.
  A production setup would want real multi-stage Dockerfiles.
