# RevuPing

An organized production-development foundation with a completed interactive customer frontend. Authentication, persistence, tenant isolation and service integrations are not implemented. Admin and API retain their generated starter behavior.

## Setup and commands

Use Node **24.20.x** (see `.node-version`) and pnpm **11.25.0** (pinned in `package.json`). The audited dependencies are Nx 23.2.0, Next.js 16.1.7, NestJS 11.2.7 and TypeScript 6.0.3. No framework upgrade is part of this organization work.

```sh
pnpm install --frozen-lockfile
pnpm dev:web                    # localhost:3000
pnpm dev:admin                  # localhost:3001
pnpm dev:api                    # localhost:3002/api
pnpm check                      # all lint, typecheck and unit test targets, sequentially
pnpm build                      # all three production builds, sequentially
pnpm check:affected --base=main --head=HEAD
pnpm exec playwright install chromium
pnpm e2e:web
pnpm e2e:admin
pnpm e2e:api
pnpm nx show project web --json  # resolved inferred + explicit tasks
pnpm nx graph
```

The browser tests start their owning frontend automatically. `BASE_URL` optionally points them at an already running server. Existing detailed mock-flow scripts remain Nx targets (`web:product-check`, `web:prototype-check`, etc.). Start web first and set `PROTOTYPE_URL=http://localhost:3000` to run them. They write artifacts under `/tmp` by default and are deliberately uncached. API end-to-end tests start API through Nx task dependencies.

## Ownership and structure

| Project      | Responsibility                                                                        |
| ------------ | ------------------------------------------------------------------------------------- |
| `apps/web`   | Customer Next.js App Router application, marketing, demo authentication and dashboard |
| `apps/admin` | Platform administration Next.js starter; no administration features yet               |
| `apps/api`   | NestJS starter module/controller/service; no product APIs yet                         |
| `apps/*-e2e` | Tests owned by the corresponding application                                          |

Web source:

- `src/app`: framework routes, layouts, loading states and styles. Keep Next route files here.
- `src/features/auth`, `dashboard`, `marketing`, `product`: application feature implementation.
- `src/components`: reusable application presentation, UI primitives, theme and motion.
- `src/data-access`: fictional fixtures, product state and demo workspace provider. This does not call API.
- `src/lib`: focused browser utilities (deadlines, print palette, QR export and panel focus).
- `specs` and `scripts`: unit tests and existing browser regression tools.

Admin's small starter stays in `src/app`; API composition, transport and service remain in `src/app/app.module.ts`, `app.controller.ts` and `app.service.ts`. Add cohesive Nest feature modules as real backend features arrive. Do not create empty layers merely to match web.

There are no shared libraries: current applications have no concrete shared implementation consumers. Extract a library under `packages/` only with clear ownership, a public package export and real consumers. Use pnpm workspace dependencies (`workspace:*`) rather than aliases into another project's source.

## Dependency rules

Nx ESLint tags use `scope:web|admin|api`, `type:app|e2e` and `platform:browser|server|test`. No source project may import another application or e2e project. The e2e projects retain intentional implicit graph edges to their tested apps.

For future libraries, use meaningful platform/type tags: browser projects can consume only browser or neutral libraries; neutral contracts remain independent of framework/server packages. UI consumes UI/contracts/util libraries, data access consumes data-access/contracts/util, and features consume feature/UI/data-access/contracts/util. Nx checks cycles and cross-project deep imports. All rules are enforced by lint, not just documentation.

Browser source also rejects Node/server packages and imports from `src/server`. Future Next server implementation must live in `src/server`, import `server-only`, and be used from appropriate server entry points. Current `app/api` routes are server entry points. Never import server code into a client component or re-export it through a browser barrel. Existing `@/` aliases are local to each frontend and supported in Jest.

## Configuration

No application environment variables are needed for the frontend demo. `.env.example` files describe the actual configuration; they contain no service credentials. Next loads its app-local environment files. Never put a secret in `NEXT_PUBLIC_*`: those values are exposed to browsers. API currently reads only `PORT` from the process environment (default 3002); it does not load dotenv files. Export it in the shell when overriding the default.

Local `.env*` files are ignored except examples. Add configuration only when consumed by implemented behavior, validate server values at startup, and update examples and Nx build inputs when adding environment-dependent build output.

## Adding a feature

Keep the route under `src/app`, feature implementation under its owning `src/features/<feature>`, and reusable presentation in `src/components`. Keep fixture/state access separate from rendering; replace mock data with a deliberate data-access boundary when real APIs exist. Preserve framework conventions and strict TypeScript. Use explicit imports; add barrels only for intentional public APIs. Backend controllers should delegate to services inside a cohesive module. Do not import an application's internals from another application.

## Tasks and CI

Nx infers framework tasks; package metadata adds application-specific targets. Shared compiler/workspace/package settings and Node version participate in task inputs. Generated Next/build/test output is excluded from default input hashing. Typecheck outputs declare incremental build metadata. Builds, lint, types and unit tests are cached; servers and browser checks are not.

GitHub Actions installs with the pinned pnpm and frozen lockfile. PR lint/types/unit tests use explicit base/head affected checks; main pushes and manual runs check the full workspace. Every run builds all applications sequentially and runs Chromium frontend and API end-to-end tests. No Nx Cloud account or paid distributed runners are required.

## Official guidance consulted

Checked current official guidance on 2026-10-02 and applied it to the installed versions:

- [Nx workspace organization](https://nx.dev/docs/concepts/decisions/overview), [module boundaries](https://nx.dev/docs/features/enforce-module-boundaries), [task inputs](https://nx.dev/docs/reference/inputs), [affected checks](https://nx.dev/docs/features/ci-features/affected)
- [Next.js App Router structure](https://nextjs.org/docs/app/getting-started/project-structure) and [server/client isolation](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [NestJS modules](https://docs.nestjs.com/modules)
- [TypeScript configuration](https://www.typescriptlang.org/tsconfig/) and [strict](https://www.typescriptlang.org/tsconfig/strict)
- [pnpm workspaces](https://pnpm.io/workspaces) and [package settings](https://pnpm.io/package_json)

## Before production deployment

Implement and verify authentication/authorization, tenant data isolation, durable storage, API contracts, real integrations, secret management, operational monitoring and deployment configuration. Web auth, messages, billing, integrations, survey/referral results and dashboard state are fictional/session-local interactions; browser refresh resets demo state. Starter hello routes are not production product APIs.
