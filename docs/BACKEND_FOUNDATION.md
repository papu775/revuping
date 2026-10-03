# Backend foundation

RevuPing starts as a NestJS REST modular monolith. This phase implements configuration, transport, health, database schema and local infrastructure. Web and mobile retain their frozen design and fictional demo state. Admin, authentication, business CRUD, payments, campaigns and integrations remain deferred.

## Ownership and boundaries

| Owner                                       | Responsibility                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`                                  | Server configuration, Nest composition, Prisma schema/migrations/client, database and Redis lifecycle, health and HTTP transport |
| `packages/api-contracts`                    | Public wire types, Zod response/API URL validation and a small Fetch liveness client; no server/framework dependencies           |
| `apps/web/src/data-access/api-client.ts`    | Opt-in Next public URL adapter; existing demo store stays independent                                                            |
| `apps/mobile/src/data-access/api-client.ts` | Opt-in Expo public URL adapter; existing local demo store stays independent                                                      |
| Existing web components                     | DOM presentation and web styling, owned by web                                                                                   |
| `packages/mobile-ui`                        | Native presentation, never imported by web                                                                                       |
| `packages/mobile-tokens`                    | Existing native theme/design tokens; React/React Native providers keep this package native                                       |
| `packages/mobile-data`                      | Existing mobile demo data and persistence; not a backend client                                                                  |

There is one new package with three concrete consumers: API, web and mobile. It has a compiled CommonJS entry for Nest runtime and a source condition for Metro/TypeScript. Nx builds it before dependent apps/tests. No app imports another app; neutral contracts cannot import Nest, Prisma, Node, native or DOM components. Browser/native projects cannot depend on server projects or server packages. ESLint enforces these platform/type constraints. Database models are never frontend DTOs; future public contracts belong in the neutral package rather than Prisma exports.

PostgreSQL is the system of record. Prisma 7 uses `prisma.config.ts`, the `prisma-client` generator with an explicit API-local output, and the PostgreSQL driver adapter. Generated code is ignored and regenerated through Nx dependencies. Schema generation uses a nonconnecting `.invalid` URL so checks/builds require no real credentials; runtime and migration commands require actual configuration. Existing NestJS 11, Next.js, Expo and TypeScript versions are preserved. New dependencies are Prisma 7.10, its PG adapter/client/CLI, pg, ioredis 5, Swagger 11, class-validator/class-transformer, Pino 9 and the already-used Zod 4 version. Optional Swagger telemetry installation is disabled. Only Prisma's engine installation is enabled; Prisma client generation is explicit.

Redis initially supports readiness and the future rate-limiting/job infrastructure. There is no endpoint caching. No worker, fake job or BullMQ dependency exists yet. No microservices, Kafka, Kubernetes, CQRS or generic repository layer is introduced.

## Schema decisions

- User email uses PostgreSQL `citext` and a unique constraint, including case variants. There are no password/session/token fields.
- Users have many memberships across workspaces; `(workspaceId, userId)` is the membership primary key. The workspace-specific role is `OWNER` or `STAFF`. The user lookup has its own index.
- One workspace owns one optional business and many locations, matching the current workspace/business product. The business's workspace ID is unique. A composite location-to-business foreign key also includes workspace ID, preventing cross-workspace business references at the database level.
- IDs are UUIDs; every model records creation/update timestamps with explicit timezone-aware precision. Tenant lookup indexes are explicit.
- Workspace deletion cascades to its business, locations and memberships; business deletion cascades to its locations; user deletion removes memberships and does not delete workspaces. Primary key updates cascade. There are no public deletion endpoints in this phase. Future deletion flows must authorize operations and prevent losing the final workspace owner.

These integrity constraints do **not** implement authenticated tenant isolation. The next phase must resolve workspace access from authenticated membership, never treat a client-supplied workspace ID as proof of access, and scope every tenant-owned query/mutation by the resolved workspace. Jobs must carry and revalidate workspace context. Tests must cover cross-workspace access and owner/staff permissions before business endpoints ship.

## Local commands

Run from the repository root with Node 24.20.x and pnpm 11.25.0. Copy examples only when the destination does not already exist; preserve existing local credentials and align connection URLs with the selected ports. Examples contain safe local sample values, not production secrets.

```sh
pnpm install --frozen-lockfile
cp -n infra/.env.example infra/.env
cp -n apps/api/.env.example apps/api/.env
docker compose --env-file infra/.env -f infra/compose.yml config --quiet
docker compose --env-file infra/.env -f infra/compose.yml up -d --wait
docker compose --env-file infra/.env -f infra/compose.yml ps
pnpm nx run api:prisma-validate
pnpm nx run api:prisma-generate
pnpm nx run api:migrate-deploy
pnpm nx run api:migration-status
pnpm nx run api:schema-check     # tests integrity in a rolled-back transaction
pnpm dev:api
```

The Compose project is `revuping-foundation`. Default bindings are **127.0.0.1:5433** (PostgreSQL 16) and **127.0.0.1:6380** (Redis 7), distinct from standard ports. Change `POSTGRES_PORT`/`REDIS_PORT` in `infra/.env` and the corresponding API URLs if occupied. Services have named persistent volumes, health checks and modest memory limits. Applications continue running on the host. PostgreSQL credentials initialize a new volume only; changing the env file does not change an existing database password. Never remove volumes or reset data to repair a migration.

```sh
# Stop containers while preserving volumes/data:
docker compose --env-file infra/.env -f infra/compose.yml down
# New, reviewed schema changes only, against the developer's own database:
pnpm nx run api:migrate-dev -- --name describe_change
# Heavy checks run sequentially:
pnpm check
pnpm build
pnpm e2e:api
pnpm nx run api-e2e:connectivity-check
EXPO_PUBLIC_API_URL=http://10.0.2.2:3002/api/v1 pnpm nx run mobile:api-connectivity-bundle
pnpm nx graph
```

`migrate-deploy` applies checked-in migrations without a shadow database or reset. `migrate-dev` can request a reset on drift: decline it and investigate; never accept a destructive reset. There is no seed or invented account. Production deployment/publishing is outside this phase. CI uses isolated ephemeral PostgreSQL/Redis services and applies migrations before API end-to-end checks.

## Configuration and addresses

API loads `apps/api/.env` when launched from the workspace root; exported variables take precedence. `API_ENV_FILE` can supply an explicit path. Prisma CLI loads the API-local `.env`. Missing/invalid `DATABASE_URL`, `REDIS_URL` or `CORS_ORIGINS` fails startup with field names only. Database/Redis URLs must use their expected protocols. Ports, log level, environment and the exact boolean docs switch are validated. Origins must be exact HTTP(S) origins, without credentials, wildcards, paths or trailing slashes. Native requests with no Origin are permitted; CORS is a browser policy, never authorization.

API defaults to port 3002 and loopback binding. Set `API_HOST=0.0.0.0` for emulator/device access. Production credentials must come from managed environment configuration, with appropriate TLS/network controls. There are no production credential fallbacks.

```sh
cp -n apps/web/.env.example apps/web/.env.local
cp -n apps/mobile/.env.example apps/mobile/.env
# Web: NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
# Android emulator: EXPO_PUBLIC_API_URL=http://10.0.2.2:3002/api/v1
# Android USB device, alternative:
adb reverse tcp:3002 tcp:3002
# Then EXPO_PUBLIC_API_URL=http://localhost:3002/api/v1
pnpm dev:web
pnpm dev:mobile
```

For a physical device on Wi-Fi, use `http://<computer-LAN-IP>:3002/api/v1`, bind API to `0.0.0.0` and allow that port through the local firewall. `localhost` on Android means the Android device/emulator itself; `10.0.2.2` is the Android Studio emulator's host alias. iOS simulator usually reaches the Mac host via localhost. Android production builds should use HTTPS; local HTTP availability depends on the development build's network policy. Expo Go/development builds are the intended local environment. Android native requests do not need browser CORS origins; Expo **web** requires its actual origin in `CORS_ORIGINS`, such as `http://localhost:8081` or `http://localhost:19006`. Add 127.0.0.1 or LAN browser origins explicitly when used.

Restart Next/Expo after changing public variables; Next public variables are fixed in a built bundle. Never put database URLs, Redis URLs or credentials into `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`. Public API URL validation rejects embedded credentials and requires `/api/v1`. Both app-local `getApiClient()` factories expose typed, response-validated `getLiveness()`, with a five-second timeout and optional cancellation. They remain unused by demo rendering; no ordinary product user sees dependency readiness.

## HTTP behavior

| Endpoint                            | Behavior                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/health/live`           | 200 `{ "status": "ok" }`; never queries dependencies                                                           |
| `GET /api/v1/health/ready`          | 200 when database `SELECT 1` and Redis `PING` succeed; otherwise a sanitized 503                               |
| `/api/v1/docs`, `/api/v1/docs-json` | OpenAPI UI/JSON in development; disabled by default in production, explicitly controlled by `API_DOCS_ENABLED` |

All requests receive `X-Request-ID`; a safe incoming ID is preserved, malformed/oversized IDs are replaced. Errors use `{ "error": { "code", "message", "requestId" } }` and never forward internal exception text, stack traces, credential values or dependency addresses. Validation transforms DTOs, rejects unknown fields and omits request values from errors. DTO-based request validation is exercised through test-only routes; there are no business DTO endpoints yet. Structured completion logs include method, matched route, status, duration and request ID, without payloads, query strings or headers. Nested sensitive fields and Error objects are redacted. SIGINT/SIGTERM shutdown closes HTTP and database/Redis resources. Database pool size and dependency timeouts are bounded. Liveness stays available during dependency outages; readiness is a connectivity check, not a claim that migrations or business authorization are correct.

## Next phases

1. **Authentication and workspace access:** select and verify a maintained OIDC identity provider; use Authorization Code + PKCE, provider-hosted identity handling and server verification of issuer/audience/expiry/signature. Map a verified stable provider subject to a local user through a reviewed follow-up migration. Do not use client-supplied email/roles/workspace IDs as authentication. Native tokens belong in secure storage; web session/cookie/CSRF handling must be designed and tested then. No custom password/session scheme has been invented here.
2. Implement users/workspaces/memberships and authorized business/location operations with tenant-scoped services and cross-tenant tests. Add customers, feedback and review links only as concrete features arrive.
3. Add campaigns and a separate runnable BullMQ worker when scheduled work exists. API enqueues versioned payloads with workspace context; workers revalidate membership/tenant ownership, use idempotency keys, bounded retries/backoff and failure observability. Reminders and integration retries belong there. Redis queues require durable deployment configuration and deliberate retention policies.
4. Implement integrations and subscriptions/payments with verified provider contracts, webhook authentication and idempotency. Admin remains separately deferred.

Official version-specific guidance: [Prisma 7 generator](https://docs.prisma.io/docs/orm/v7/prisma-schema/overview/generators), [Prisma 7 configuration](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Nest validation](https://docs.nestjs.com/techniques/validation), [Nest OpenAPI](https://docs.nestjs.com/openapi/introduction) and [Nest CORS](https://docs.nestjs.com/security/cors).

## Executed verification

Executed on 2026-10-03 with Node 24.20.0 and pnpm 11.25.0:

| Command/check                                                                                             | Result                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                                                          | Passed; previously declared direct dependency versions remained unchanged                                                                                                                       |
| `docker compose --env-file infra/.env -f infra/compose.yml config --quiet` and `up -d --wait`             | Passed; both services healthy, loopback bindings and new named volumes verified                                                                                                                 |
| `pnpm nx run api:prisma-validate` / `api:prisma-generate`                                                 | Passed with Prisma 7.10                                                                                                                                                                         |
| `pnpm nx run api:migrate-deploy` / `api:migration-status`                                                 | Initial migration applied; database up to date; no reset                                                                                                                                        |
| `pnpm nx run api:migration-diff -- --from-config-datasource --to-schema prisma/schema.prisma --exit-code` | Passed, no schema drift                                                                                                                                                                         |
| `pnpm nx run api:schema-check`                                                                            | Passed: case-insensitive email uniqueness, membership uniqueness, multi-workspace roles, one business per workspace, tenant-consistent location foreign key and cascades; test data rolled back |
| `pnpm check`                                                                                              | Passed across the workspace, including foundation environment/HTTP/redaction/contract tests and existing mobile/web/admin checks                                                                |
| `pnpm build`                                                                                              | Passed; web, admin and API production builds ran sequentially                                                                                                                                   |
| `pnpm e2e:api`                                                                                            | Passed all three real API checks against PostgreSQL and Redis                                                                                                                                   |
| `API_TEST_URL=http://127.0.0.1:3002/api/v1 node apps/api-e2e/scripts/check-connectivity.cjs`              | Passed in Chromium for actual web/Expo-web adapters and both allowed origins; unlisted origin blocked                                                                                           |
| Local API in production mode with `API_DOCS_ENABLED=false`                                                | Live/readiness 200, correlated request IDs, Swagger UI and JSON both 404                                                                                                                        |
| Temporary stop/start of each **RevuPing-only** dependency                                                 | Readiness changed to sanitized 503 while liveness stayed 200; readiness recovered without restarting API; volumes preserved                                                                     |
| Built API with no API env file and required variables removed                                             | Exited 1, naming required fields without values or stack traces                                                                                                                                 |
| Structured request log probe with sensitive headers/query                                                 | Sensitive marker absent; only matched route, method/status/timing and request ID logged                                                                                                         |
| `pnpm nx graph --file=/tmp/revuping-foundation-graph.json`                                                | Graph verified; API/web/mobile consume neutral contracts, with no app-to-app source imports                                                                                                     |

Additional checks passed:

- `pnpm nx run api-e2e:connectivity-check`: Nx-owned API startup/shutdown and bounded liveness wait.
- `EXPO_PUBLIC_API_URL=http://10.0.2.2:3002/api/v1 pnpm nx run mobile:api-connectivity-bundle`: standalone Android Metro/Hermes bundle compiles the actual mobile adapter and shared source exports with the configured emulator URL, without screen changes. Metro's source-resolution issue was fixed using extensionless CommonJS-compatible imports.
- SIGTERM of the owned API process exited cleanly and released port 3002. Both dependencies remained healthy; all schema-check fixture tables remained empty.
- `BASE_URL=http://localhost:3010 pnpm e2e:web`: both existing Chromium smoke tests passed against an isolated production preview. The preview was stopped; the pre-existing development servers were preserved.

Native Android networking was **not executed**: no adb, emulator or connected device tooling is available. Browser/Expo-web connectivity and the native JavaScript bundle do not verify Android HTTP policy, LAN routing or native Fetch. CI workflow updates were reviewed locally; no remote CI run, production deployment or push was performed. Authentication, membership authorization, business APIs and authenticated tenant isolation are intentionally not implemented.

The connectivity check compiles the actual app-local public URL adapters into a temporary browser harness. It checks typed response validation and real API Fetch/CORS from web and Expo-web origins without changing any product routes or screens. Both origins must be configured, and Chromium must be installed (`pnpm exec playwright install chromium`). It does not verify native Android networking or Expo's native bundle. When the API is already running, use `API_TEST_URL=http://127.0.0.1:3002/api/v1 node apps/api-e2e/scripts/check-connectivity.cjs`; the Nx target otherwise owns API startup/shutdown. Custom ports require `API_TEST_URL` as well as API configuration.

Chromium requires loopback access permission for synthetic harness documents. The test grants [Playwright's local-network-access permission](https://playwright.dev/docs/api/class-browsercontext#browser-context-grant-permissions) only to its isolated test origins, with normal CORS enforcement active. No browser flags or product security settings are changed.
