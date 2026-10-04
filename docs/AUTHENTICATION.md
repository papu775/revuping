# Phase 2: authentication and workspace access

Phase 1 was committed as `1ea16cfd74363615f7cfdbf55c1172d867e3b5e3`. Phase 2 explicitly replaces its proposed OIDC direction with first-party email/password authentication in NestJS. Admin, business/location CRUD, invitations, ownership transfer, billing and integrations remain deferred.

## Architecture and security behavior

`apps/api/src/auth` owns credentials, email actions, sessions, CSRF and Redis limits. `src/workspaces` resolves authorization through the authenticated user's database membership. The existing neutral `api-contracts` package owns safe user/session/workspace responses. Prisma records never become frontend DTOs. App-local clients own network/session state; no new global state library was needed.

Passwords use maintained **node-argon2 0.45.1**, Argon2id v19, 64 MiB memory, three iterations and one lane, with library-generated salts. New passwords are 12–128 characters; passphrases and Unicode are supported. Passwords are never trimmed or truncated. Login permits shorter historical inputs but rejects overlong values. Email is trimmed/lowercased and CITEXT uniqueness remains authoritative. Existing users without credentials remain unverified; no legacy account is automatically granted access.

Opaque credentials use Node's cryptographically secure `randomBytes(32)` and base64url encoding. Only SHA-256 digests of session, refresh, CSRF binding and email action credentials are stored. High-entropy tokens do not need password hashing. Password hashes, token digests, bodies, cookies, authorization headers and email addresses are excluded from request logs; request IDs and sanitized Phase 1 errors remain intact.

| Credential            | Lifetime and behavior                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Web session           | Seven days absolute; opaque HttpOnly cookie, SameSite=Lax, Path=/, no Domain; Secure and `__Host-` names in API production |
| Native access         | Five minutes; opaque value in memory; every request checks the server session, expiry and revocation                       |
| Native refresh family | Thirty days absolute, no sliding extension; hashed credentials, atomic rotation and retained consumed-token history        |
| Verification link     | Twenty-four hours, hashed, single use                                                                                      |
| Reset link            | Thirty minutes, hashed, single use; invalidates other pending reset links and revokes all web/native sessions              |

Logout revokes the current session; logout-all revokes every session for that user. Revocation is effective for subsequent authorization checks immediately, including native access credentials. An already authorized in-flight request can finish. Rotation replaces native access as well as refresh credentials. A duplicate/replayed refresh consumes no second credential and **commits family revocation**; deliberate simultaneous duplicate refreshes therefore return one success and one denial, with the successful credential subsequently revoked. The native client single-flights refresh, retries an unauthorized protected request at most once, and does not retry an ambiguous network failure during rotation. If rotation succeeded but its response was lost, the next attempt detects reuse and requires login.

Native refresh credentials use **Expo SecureStore 57.0.4**, compatible with the installed Expo SDK 57, with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. They never use AsyncStorage. The existing Android manifest now references SecureStore's backup/transfer exclusion resources. Failure to persist a newly issued rotation attempts server logout and clears local access. Android restore rotates through SecureStore; browser Expo preview deliberately does not offer real session persistence. Use the Next web app for browser authentication. Verification/reset links open the trusted web URL; native users can open them in the browser or paste the link into the native action screen.

## Web proxy and CSRF

`/api/backend/*` is a narrowly allowlisted same-origin Next server proxy. `API_INTERNAL_URL` is server-only and required in production; development defaults to `http://127.0.0.1:3002/api/v1`. The proxy forwards only authentication cookies, origin, CSRF and request ID, and cannot proxy native-token endpoints. Browser code never sees a session credential and uses neither localStorage nor sessionStorage for auth. Next `/workspace` performs server session authorization; backend guards authorize every workspace endpoint independently. Cache refresh and UI redirects are conveniences, never authorization.

Every cookie-authenticated mutation requires the exact configured `WEB_URL` Origin and an `X-CSRF-Token` matching an HttpOnly CSRF cookie. Authenticated mutations also bind its digest to the session. CSRF bootstrap is `GET auth/csrf`; the token returned here is a CSRF nonce, not an authentication credential. Login/registration/recovery also require origin and CSRF before a session exists. Native public actions have explicit `auth/native/*` routes; bearer requests never authenticate cookies. Direct cross-origin browser cookie access to Nest is intentionally unavailable; use the proxy.

API `TRUSTED_PROXIES` accepts exact IP addresses/CIDRs and defaults to none. Arbitrary incoming forwarding headers are ignored. Next also strips forwarding headers by default; its upstream IP then has a conservative shared IP limit, while normalized account limits remain separate. For production client IP attribution, put Next behind ingress that **overwrites** X-Forwarded-For and prevents direct public access to Next, set `AUTH_TRUST_EDGE_HEADERS=true`, and configure API trust with only the actual Next/ingress addresses. Never trust arbitrary public forwarding headers or use `trust proxy=true`. API and proxy must remain behind HTTPS/network controls.

Redis limits use atomic Lua counters with fifteen-minute TTLs; no permanent account lockout. Registration: IP 10/account 3; login: IP 30/account 10; resend/recovery: IP 20/account 5; verification: IP 30/token 10; reset: IP 20/token 5; native refresh: IP 120/family 60. Keys hash identifiers, and `AUTH_RATE_NAMESPACE` separates deployments/tests. Dependency failures return sanitized 503, not an authenticated fallback or demo switch.

Unauthenticated email/verification/reset budgets are scoped to the trusted caller IP; an unrelated IP cannot consume a victim's account budget. Refresh family budgets span IPs, with an IP limit before credential lookup. Authenticated user budgets span sessions: workspace creation 10, logo uploads 20, reads 600 and other writes 240 per fifteen minutes, with additional IP caps. Invalid session lookups and readiness requests are also bounded. Rate-limit responses expose numeric `Retry-After`, including through the Next proxy. Default proxy-IP aggregation still requires production ingress configuration as described above.

Duplicate registration returns the same 201 confirmation as new registration without changing the existing account. Synchronous SMTP timing and send failures can still disclose eligibility; the audit report records this remaining limitation. Native ambiguous refresh errors invalidate local credentials and attempt SecureStore removal to prevent replay on a later restoration; only a pre-rotation 429 retains them. Failed server logout still invalidates local state and attempts credential removal, while server revocation remains unconfirmed during outage. Physical storage failure across process restarts still needs device verification.

## Workspace behavior

`GET workspaces` lists only the caller's memberships. `POST workspaces` takes `{name,key}` and creates the workspace, OWNER membership and idempotency record in one transaction, serialized per user. Reusing that user's key returns the existing workspace even if the submitted name differs. Both clients use the stable `initial-workspace` key for setup, so retry/reload cannot create a second initial workspace. Registration creates no workspace or business records.

`GET workspaces/:id` requires membership; `PATCH workspaces/:id` accepts only a name and requires OWNER. STAFF can read, never edit. Membership rows are locked during owner mutation. Client roles, emails and selected IDs never authorize access. Unverified users can see their session, verify/resend and log out, but all workspace operations are denied. Real `/workspace` screens show verified setup or a truthful minimal state; no fabricated metrics. Web `/dashboard` and native explicitly entered demo tabs retain their fictional behavior. Logout/account switch clears real workspace state and stale asynchronous loads cannot publish old results.

## Local setup

Use Node 24.20.x and pnpm 11.25.0. Preserve any existing env files and credentials; copy examples only if missing.

```sh
pnpm install --frozen-lockfile
cp -n infra/.env.example infra/.env
# Create apps/api/.env using the configuration below; it is ignored by Git.
cp -n apps/web/.env.example apps/web/.env.local
cp -n apps/mobile/.env.example apps/mobile/.env
docker compose --env-file infra/.env -f infra/compose.yml up -d --wait
pnpm nx run api:migrate-deploy
pnpm nx run api:migration-status
pnpm dev:api
# Separate terminals:
pnpm dev:web
pnpm dev:mobile
```

Create the ignored `apps/api/.env` explicitly (replace the database and Redis placeholders with your local infrastructure credentials):

```dotenv
DATABASE_URL=postgresql://REPLACE_USER:REPLACE_PASSWORD@127.0.0.1:5433/REPLACE_DATABASE
REDIS_URL=redis://:REPLACE_PASSWORD@127.0.0.1:6380/0
CORS_ORIGINS=http://localhost:3000
WEB_URL=http://localhost:3000
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=accounts@revuping.test
S3_LOCAL_EMULATOR=true
S3_ENDPOINT=http://127.0.0.1:4566
S3_REGION=us-east-1
S3_BUCKET=revuping-logos
S3_FORCE_PATH_STYLE=true
```

This local S3 profile uses emulator-only dummy credentials internally. Production forbids the emulator, requires HTTPS web/CORS/S3 origins, and uses server-side S3 credentials or the AWS credential chain. Do not copy local credentials into production. Optional settings and validation live in `apps/api/src/config/environment.ts`.

The reviewed additive migration is `20261003010000_auth_sessions_workspaces`, after `20261003000000_foundation`. It adds User credential/verification state, Session, RefreshToken, EmailActionToken and WorkspaceCreation, plus revocation/expiry/lookup indexes and cascading foreign keys. There are no resets or destructive migration statements. Existing PostgreSQL/Redis volumes and services are preserved. Mailpit captures emails locally, with loopback-only **SMTP 1025** and inbox **http://127.0.0.1:8025**. PostgreSQL remains 5433 and Redis 6380. No external recipient receives test mail; Mailpit has no configured relay.

API additions: `WEB_URL=http://localhost:3000`, `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, `SMTP_FROM=accounts@revuping.test`, optional `SMTP_USER`/`SMTP_PASSWORD`, `TRUSTED_PROXIES`, and `AUTH_RATE_NAMESPACE`. API links use trusted `WEB_URL`, never incoming Host. Email action tokens live in the **URL fragment**, are read into memory then removed from browser history, and never appear in HTTP paths/query logs or API response bodies. Delivery is synchronous SMTP acceptance; it does not prove arrival in an external inbox. Failed SMTP returns 503 and removes that unsent action token. Registration may already have created an account if later delivery fails; use resend rather than assuming no account exists. Recovery/resend return the same eligibility message for known and unknown addresses and check SMTP availability for both.

Web additions: `API_INTERNAL_URL` and `AUTH_TRUST_EDGE_HEADERS=false`. Expo uses `EXPO_PUBLIC_API_URL`; Android emulator `http://10.0.2.2:3002/api/v1`, USB device with `adb reverse tcp:3002 tcp:3002` can use localhost, Wi-Fi device uses the computer LAN address. Bind API `API_HOST=0.0.0.0` for emulator/LAN, and allow the selected local port through the firewall. Restart Next/Expo after env changes. Never put server credentials in public variables. Native release builds use HTTPS. Adding SecureStore requires rebuilding an existing custom development build; it is available in Expo Go.

### Gmail SMTP for development

For development emails to a real inbox, replace the SMTP settings in the ignored `apps/api/.env`:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_FROM=your-account@gmail.com
SMTP_USER=your-account@gmail.com
SMTP_PASSWORD=your-google-app-password
```

Use the same Gmail account for sender and username. Enable Google 2-Step Verification and create an [App Password](https://support.google.com/accounts/answer/185833?hl=en); keep it only in the local API environment file. Gmail uses port 465 with implicit TLS, or port 587 with STARTTLS (`SMTP_SECURE=false`), as described in [Google's SMTP configuration](https://support.google.com/a/answer/176600?hl=en). Restart `pnpm dev:api` after editing the file. This profile sends actual email when authentication actions are used; SMTP acceptance alone does not prove inbox delivery.

Automated checks and the Mailpit-based manual checks below must use local Mailpit instead. The check commands explicitly override every SMTP setting so a development Gmail account is never used by those checks.

## Checks and cleanup

Run heavy checks sequentially:

```sh
pnpm check
pnpm build
pnpm e2e:web
pnpm e2e:api
pnpm nx run api:schema-check
SMTP_HOST=127.0.0.1 SMTP_PORT=1025 SMTP_SECURE=false \
  SMTP_FROM=accounts@revuping.test SMTP_USER= SMTP_PASSWORD= \
  NODE_ENV=test AUTH_RATE_NAMESPACE=rp:auth:test:phase2 LOG_LEVEL=silent \
  pnpm nx run api-e2e:auth-check
SMTP_HOST=127.0.0.1 SMTP_PORT=1025 SMTP_SECURE=false \
  SMTP_FROM=accounts@revuping.test SMTP_USER= SMTP_PASSWORD= \
  NODE_ENV=test WEB_URL=http://localhost:3010 CORS_ORIGINS=http://localhost:3010 \
  AUTH_RATE_NAMESPACE=rp:auth:test:browser LOG_LEVEL=silent \
  API_INTERNAL_URL=http://127.0.0.1:3002/api/v1 \
  pnpm nx run api-e2e:web-auth-check --parallel=1
EXPO_PUBLIC_API_URL=http://10.0.2.2:3002/api/v1 pnpm nx run mobile:auth-native-bundle
pnpm nx graph --file=/tmp/revuping-phase2-graph.json
```

The authentication checks require test mode, a dedicated `rp:auth:test:*` Redis namespace and local Mailpit. They delete only their own synthetic `.test` users, workspaces, messages and test-namespace counters. Run these checks serially and stop another API instance before Nx starts its owned API. The browser check uses an owned preview on port 3010 and writes ignored screenshots in `apps/api-e2e/test-output/auth`. Existing detailed demo checks still use `PROTOTYPE_URL=<running-web-origin> pnpm nx run web:product-check`.

Optional local-only outage verification: add `AUTH_DEPENDENCY_OUTAGES=1` to the `auth-check` invocation. This requires the documented local ports and Docker access; it stops and restores only RevuPing Mailpit, Redis and PostgreSQL, preserving volumes. Do not enable it against shared/production infrastructure or the CI service containers.

Schedule `pnpm nx run api:cleanup-auth` daily using an operational scheduler. It deletes expired action records and expired sessions (cascading refresh history), plus sessions revoked more than seven days ago. Consumed refresh hashes remain until family expiry/revoked retention ends; never delete an active family's consumed hashes, which would disable reuse detection. Workspace idempotency records remain for the workspace lifetime. Redis counters expire automatically. No worker app exists.

## Production configuration and native manual checks

Production requires explicit HTTPS `WEB_URL`, matching proxy origin, internal API URL, SMTP host/from and TLS/STARTTLS; configure authenticated SMTP or a network-authorized relay and real sender-domain deliverability. Secure cookie names require HTTPS. Configure private proxy trust as above, managed PostgreSQL/Redis with TLS/access controls/backups, reviewed migrations, cleanup scheduling, monitoring and log redaction at the ingress as well as the application. Do not expose local Mailpit publicly. No production deployment or external email sending is performed by this phase.

Android tooling/device execution is unavailable on the implementation machine (no adb/emulator in PATH). A Metro/Hermes export validates bundling, not native networking or SecureStore. On an Android emulator/device:

1. Configure the address above, start API plus Compose/Mailpit, run `pnpm nx run mobile:prebuild -- --platform android`, then `pnpm android:mobile` with a configured Android SDK/JDK and running emulator/device. Rebuild any existing custom development client with SecureStore, then start `pnpm dev:mobile`.
2. Create a `.test` account, inspect Mailpit, log in while unverified and confirm no workspace operations are available. Open/paste the verification link; return and refresh verification state.
3. Create the workspace, tap rapidly and repeat setup after a connection interruption; confirm only one initial workspace and no demo numbers/business data.
4. Force-close and reopen the app. Confirm restoration through SecureStore, then background/resume after five minutes to exercise access refresh. Make simultaneous requests and confirm one refresh request in redacted API logs.
5. Log out, relaunch and confirm no real workspace access. Log in twice on separate devices, use logout-all, and confirm the other device loses access on its next API request.
6. Reset through Mailpit; confirm old password, access and refresh credentials stop working, then log in with the new password. Test airplane mode: useful failure/retry, never automatic demo access. Enter/leave the demo explicitly and confirm it remains separate.
7. Deny/unavailable SecureStore and confirm authentication fails without AsyncStorage fallback. Repeat restoration, refresh and logout on a release/development build using HTTPS.

Version-specific primary references: [node-argon2](https://github.com/ranisalt/node-argon2), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [Nodemailer SMTP](https://nodemailer.com/smtp) and [Mailpit Docker](https://mailpit.axllent.org/docs/install/docker/).

## Executed verification

On 2026-10-03, using Node 24.20.0 and pnpm 11.25.0:

- Frozen lockfile installation passed; existing framework versions were preserved.
- The additive migration deployed successfully. Real PostgreSQL/Redis/Mailpit authentication checks passed **14 groups**, including expiry, single use, session revocation, native rotation/replay/concurrency, cookie/CSRF, account/IP rate limits and cross-workspace OWNER/STAFF access. Local Mailpit, Redis and PostgreSQL outages returned safe failures and recovered without restarting API. All three containers were restored healthy and volumes preserved.
- `pnpm check` passed all workspace lint/typecheck/unit-test tasks. New tests cover production cookie/CSRF policy, public contract secrecy, native refresh single-flight/bounded retries/storage failure and stale account responses.
- `pnpm build` passed sequential production builds for web, admin and API; no admin feature was developed.
- `api-e2e:web-auth-check` passed in Chromium: protected route, signup, Mailpit verification, unverified restrictions, workspace create/update, restoration, HttpOnly credential secrecy, reset, logout/all, explicit demo separation and light/dark small-viewport layout.
- Android prebuild applied SecureStore's backup exclusions without cleaning the existing native project or upgrading React dependencies. `mobile:auth-native-bundle` passed for the **complete app**, producing Hermes bytecode v98 with one Metro worker. This is not device verification.
- Nx graph confirmed API/web/mobile consume neutral contracts without app-to-app source dependencies.
- Existing web Chromium smoke tests passed (2), API smoke tests passed (3), and the detailed product check passed 150 route/theme/viewport combinations plus all existing interaction flows without page overflow or browser errors. Transactional schema checks passed, Prisma validation/status passed, migration drift was empty, and the expired-auth cleanup command completed successfully.

Native networking, SecureStore persistence and Android runtime behavior still require the manual device checks above. Production HTTPS/ingress, SMTP delivery, managed infrastructure and cleanup scheduling are deployment configuration; none was deployed here. CI was updated with Mailpit/auth checks but no remote pipeline was run.
