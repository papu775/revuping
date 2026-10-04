# Private Feedback Inbox

The real inbox is `/workspace/feedback?workspace=<authorized workspace ID>`. The demo at `/dashboard/feedback` remains separate and unchanged. Native accounts use the protected `account-feedback` route; demo tabs continue to use fictional local fixtures.

## Behavior and permissions

Verified OWNER and STAFF members can read private responses, append internal notes, assign current workspace members, edit follow-up priorities/dates/tags, and resolve/reopen feedback. Customer-supplied contact information is private and does not establish marketing consent. Notes are never sent to customers.

The layout and components come from the existing Feedback Inbox and Follow-up editor. Necessary additions are bounded pagination, a real empty state, errors/retry, explicit unsaved-change handling, and activity pagination. Unlike the demo shortcut, resolution requires an entered summary. Assignment means an internal follow-up owner; it does not claim that a customer visited that employee.

Plan updates use an optimistic revision. Conflicts retain the client draft; discard and refresh to reconcile another member's changes. Notes have normalized UUID retry keys and append-only actor/timestamp history. Repeating the same note/key/actor is idempotent; changing it returns a conflict. No customer/user identity or actor fields are trusted from request bodies.

Every endpoint checks workspace membership; reads and writes hold membership locks through their transaction. Mutations follow workspace → membership → response lock order. Cross-workspace response IDs return no record. Database composite foreign keys protect feedback/activity tenant consistency. Existing session verification, CSRF and authenticated rate budgets are preserved.

## Configuration and endpoints

Apply `pnpm nx run api:migrate-deploy`, then restart the API. The migration adds fields/history to the existing private responses without resetting data. No additional external credentials or dependencies are required. Dates are calendar dates; overdue uses the current UTC date. Follow-up plans do not send scheduled reminders in this phase.

- `GET workspaces/:id/feedback`: `query` (up to 100 characters), `status` (`ALL`, `UNRESOLVED`, `IN_PROGRESS`, `OVERDUE`, `RESOLVED`), optional `location`, and `page`; 25 records/page, stable date/ID ordering.
- `GET workspaces/:id/feedback/members`: authorized assignment choices.
- `PUT workspaces/:id/feedback/:response`: revision and strict plan fields.
- `POST workspaces/:id/feedback/:response/notes`: UUID `key`, nonempty `body` (up to 2,000 characters).
- `GET workspaces/:id/feedback/:response/history?page=1`: 25 private activity entries/page.

The BFF forwards query parameters after its existing path/method allowlist; API query schemas reject unknown and repeated fields.

## Verification record

Executed sequentially on 2026-10-04:

- `pnpm nx run api:migrate-deploy`: additive migration passed.
- `pnpm check`: all 29 lint/type/unit tasks passed; contract tests cover genuine resolution summaries, invalid calendar dates, bounds/forged fields, note normalization and correct conflict guidance.
- `pnpm build`: web/admin/API production builds passed sequentially.
- `NODE_ENV=test SMTP_HOST=127.0.0.1 PHASE5_WEB_URL=http://localhost:3010 pnpm nx run web:feedback-check`: passed against PostgreSQL, Redis and Mailpit with isolated disposable accounts. Covered anonymous/cross-tenant/revoked denials, CSRF, composite activity FK rejection, search/status/overdue/pagination, stale plan conflicts, concurrent normalized note retries, actor history and durable resolve/reopen. Executed the actual native API adapter against the real API. Browser coverage includes owner/staff login, client routing, save/error recovery, draft protection, conflict discard/refresh reconciliation, reload, empty states, browser pagination and reduced-motion back/forward. No page runtime errors.
- `EXPO_PUBLIC_API_URL=http://10.0.2.2:3302/api/v1 pnpm nx run mobile:auth-native-bundle`: Android Metro/Hermes export passed.
- `BASE_URL=http://localhost:3010 pnpm e2e:web`: both Chromium smoke tests passed.

A test fixture initially retained an existing resolution summary; it was corrected to exercise missing-summary rejection. Screenshot theme configuration initially used an incorrect storage key; it was corrected and final screenshots assert the actual HTML theme. A back/forward test initially raced unfinished navigation; final tests await each destination. Repeated synthetic registrations reached the isolated test rate budget; only `rp:auth:test:phase5-live:*` keys were cleared for the rerun. User/production rate keys and existing workspace records were untouched.

Assignment choices currently return up to 100 workspace members; larger-team paging belongs with the next team-settings phase. Due dates and history are private plans, not scheduled email reminders. Browser screenshots are stored under `/tmp/revuping-phase5` and inspected against the demo at 1280/390 widths in both themes, including button hover bounds. Actual Android runtime/device behavior is not established by these browser or bundle checks.
