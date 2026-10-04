# Phase 4: real QR Studio and private customer feedback

## Behavior and boundaries

Real web accounts open `/workspace/qr-studio?workspace=<authorized workspace UUID>` from their dashboard. Native accounts use `/account-qr-studio` with the same workspace selection. Owners save settings; staff may view/share/export saved settings but cannot update them. The fictional `/dashboard/qr-studio` and `/r/demo-salon` flows remain separate and never submit to the real feedback API.

Each completed business location has a random UUID public identifier. It is independent of names/branding and survives edits, disable/re-enable and container restarts. Disabling preserves the printed link but makes public reads/logo/submissions unavailable. Location CRUD is still deferred; onboarding creates a primary location, and the studio handles additional existing authorized locations without mixing drafts.

Display name, welcoming/display text, colour override, layout, Google review URL and enablement are **location settings**. An empty display name inherits the saved business name; null colour inherits onboarding branding. Settings do not rename the underlying business. The studio shows dirty state, warns before leaving the document or discarding a location draft, and exports only saved settings. Concurrent stale saves return 409 and preserve the draft for manual recovery.

The public page `/r/<public UUID>` requires neither login nor the native app. It shows only the customer-facing name/location/message/colour/logo and review destination. Google review and private feedback choices have equal prominence at every rating, including after success. Missing Google configuration is explicit; no review gating, incentives, click-to-review claims, tracking, marketing consent or automatic messages are introduced. Private feedback is stored for the business team; the full Feedback Inbox and activity reporting remain deferred.

## Schema and API

Migration `20261004010000_qr_feedback` is additive. It backfills stable public IDs for existing locations, adds enablement/revision and QR overrides, and adds `PrivateFeedback` with tenant-consistent composite foreign keys, rating/message checks, initial `UNRESOLVED` status, timestamps, lookup indexes and unique `(locationId, submissionKey)`. No reset or existing-data deletion is part of deployment.

Authenticated, verified membership routes:

- `GET /api/v1/workspaces/:id/locations`: saved QR settings for completed business locations.
- `PUT /api/v1/workspaces/:id/locations/:location/qr`: owner-only, strict schema, optimistic revision and existing web CSRF/native bearer protection.

Public routes:

- `GET /api/v1/public/locations/:publicId`: minimal customer projection.
- `GET /api/v1/public/locations/:publicId/logo`: current sanitized branding asset only for an enabled completed location. Bucket credentials, keys and other assets remain private; S3 is not made public.
- `POST /api/v1/public/locations/:publicId/feedback`: rating 1–5, message 1–2000 characters, optional name/email and client UUID key. Ownership comes exclusively from the resolved public location. Success returns only `{received:true}`, after durable persistence.

Transactions follow workspace → location lock order. Concurrent identical submissions serialize using a transaction-scoped advisory lock and database uniqueness; identical normalized payloads replay success, changed payloads return 409. Contacts are feedback follow-up information, not consented customer records. No public feedback listing or contact disclosure exists.

Public Redis budgets are IP-scoped, not global location counters: reads/logo 300 per IP and 120 per location+IP; feedback 30 per IP and 10 per location+IP, over fifteen minutes. Redis outages fail closed with sanitized 503. Existing body limits and authenticated budgets remain. The BFF strips auth cookies on public requests and retains its strict path/method allowlist. **Production must attribute client IPs through a protected ingress that overwrites forwarding headers**, explicit API `TRUSTED_PROXIES` and web `AUTH_TRUST_EDGE_HEADERS=true`. Default local proxy aggregation shares an IP budget; do not mistake that for per-visitor attribution in an unconfigured deployment.

Google URL validation parses the URL without fetching it. Supported HTTPS forms are `g.page/r/<id>/review`, `search.google.com/local/writereview?placeid=<id>` and `www.google.com/maps?cid=<numeric id>` or `maps.google.com/maps?cid=<numeric id>`. Credentials, nondefault ports, fragments, arbitrary query parameters, redirect endpoints, misleading subdomains and shortened Maps redirects are rejected. Obtain the review link from the [official Google Business Profile instructions](https://support.google.com/business/answer/16816815?hl=en). A click does not prove a published review.

## Configuration and local commands

Set **server-only** `PUBLIC_CUSTOMER_BASE_URL` in the ignored API environment. It must be an HTTP(S) origin without path, credentials, query, fragment or trailing slash. Development defaults explicitly to `http://localhost:3000`; production requires an explicitly configured HTTPS origin. URLs never use incoming Host. Changing this configured origin can invalidate printed links: select a durable origin before distribution.

```sh
pnpm install --frozen-lockfile
pnpm nx run api:migrate-deploy
pnpm check
pnpm build
```

For normal development, set `PUBLIC_CUSTOMER_BASE_URL=http://localhost:3000`, then run `pnpm dev:api` and `pnpm dev:web`. Preserve the existing local PostgreSQL, Redis, Mailpit and MiniStack services. No tunnel is created. **A phone's localhost is the phone itself**; configure an actually reachable HTTPS web origin and web/API ingress for device testing (browser submission keys use secure-context Web Crypto). Native receives the customer URL from the server; it never exposes Docker hostnames or guesses a production domain.

The actual isolated test setup uses the existing local services with a compiled API and Next preview:

```sh
NODE_ENV=test API_HOST=127.0.0.1 PORT=3302 \
  WEB_URL=http://localhost:3010 PUBLIC_CUSTOMER_BASE_URL=http://localhost:3010 \
  CORS_ORIGINS=http://localhost:3010 \
  SMTP_HOST=127.0.0.1 SMTP_PORT=1025 SMTP_SECURE=false \
  SMTP_FROM=accounts@revuping.test SMTP_USER= SMTP_PASSWORD= \
  AUTH_RATE_NAMESPACE=rp:auth:test:phase4-live LOG_LEVEL=silent \
  S3_LOCAL_EMULATOR=true S3_ENDPOINT=http://127.0.0.1:4566 S3_FORCE_PATH_STYLE=true \
  node apps/api/dist/main.js

API_INTERNAL_URL=http://127.0.0.1:3302/api/v1 NODE_ENV=production \
  pnpm --dir apps/web exec next start --port 3010 --hostname 127.0.0.1

NODE_ENV=test SMTP_HOST=127.0.0.1 SMTP_PORT=1025 SMTP_SECURE=false \
  SMTP_FROM=accounts@revuping.test SMTP_USER= SMTP_PASSWORD= \
  API_TEST_URL=http://127.0.0.1:3302/api/v1 PHASE4_WEB_URL=http://localhost:3010 \
  pnpm nx run web:qr-check
```

The test creates disposable accounts, verifies Mailpit tokens via the real API, and removes only its own accounts/workspaces/logo objects/mail. It never flushes Redis or resets PostgreSQL. Rate keys expire; repeated local test iterations may require deleting only the dedicated test namespace. Test artifacts default to `/tmp/revuping-phase4` and are not committed.

## Exports and native scope

Web exports self-contained SVG with escaped text and embedded sanitized WebP logos, and PNG at four times the SVG dimensions (1680 pixels wide). System Georgia/Arial fonts are used; font availability can affect typography across print/rendering tools. Four-module QR quiet zones, white QR background, at least 4.5:1 dark-on-white colour, and logo outside the matrix are retained. Light branding remains an accent while the QR/text use navy. No remote QR generation service or remote font/image fetch is used during export.

At 300 dpi a 1680-pixel card is 5.6 inches wide. This documents an assumption, **not a print-ready certification**; printers, scaling, paper, ink and scan distance still require physical checks. The [independent jsQR decoder](https://github.com/cozmo/jsQR) is a development-only dependency, separate from the generator.

Native loads/saves the same settings/contracts, renders the logo and QR, previews the public page through native Linking, and shares the stable link through native Share. Card file downloads open the real web studio, which requires a web login; this pass does not claim an on-device SVG/PNG file export. No Android runtime or physical camera/printed-card scan is certified by a JavaScript bundle test.

## Security and verification record

The previous audit's reachable proxy, rate-limit and Next issues are already fixed. The dependency audit after adding jsQR still reports **0 critical, 3 high, 2 moderate**. The remaining high findings concern deepmerge-ts in trusted Prisma configuration, node-forge in Expo signing and braces in glob/Metro tooling; no untrusted Phase 4 route uses these processing paths. They remain maintenance obligations, not fixed findings. Existing native decoder and SMTP enumeration limitations remain in `docs/security/AUDIT-2026-10-04.md`.

MiniStack's anonymous-object behavior does not establish production bucket privacy. The deliberate public logo endpoint checks enabled/completed location state and reads only that business's current sanitized logo. Real S3 IAM/public-access-block policy, cleanup scheduling, trusted production ingress and physical scan/device behavior still need deployment verification.

Executed sequentially against the final implementation:

| Check                                                                                                                        | Result                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                                                                             | Passed; lockfile unchanged by install.                                                                                                                                                                                                |
| `pnpm nx run api:migrate-deploy`                                                                                             | Applied the additive migration to existing local PostgreSQL without a reset.                                                                                                                                                          |
| `pnpm check`                                                                                                                 | All 29 lint/typecheck/test targets passed, including new URL, configuration, strict-input and UUID-normalization tests.                                                                                                               |
| `pnpm build`                                                                                                                 | Web, admin and API plus dependencies passed; project builds run sequentially.                                                                                                                                                         |
| `pnpm nx graph --file=/tmp/rp-p4-project-graph.html`                                                                         | Generated after the development-only decoder dependency change.                                                                                                                                                                       |
| `pnpm nx run mobile:auth-native-bundle`                                                                                      | Android JavaScript export passed; no device/emulator runtime exercised.                                                                                                                                                               |
| `pnpm nx run web:qr-check` with the test environment above                                                                   | Passed real PostgreSQL, Redis, MiniStack, Mailpit, API and browser checks described below.                                                                                                                                            |
| `POLISH_FAST=1 PHASE3_WEB_URL=http://localhost:3010 PHASE3_ARTIFACTS=/tmp/rp-p4-onboarding pnpm nx run web:onboarding-check` | Passed existing registration → verification → login → onboarding → dashboard, persistence, returning login, saved-step resume, failure recovery, tenant selection and explicit demo checks. Uses the same local SMTP overrides above. |
| `PROTOTYPE_URL=http://localhost:3010 ROUTING_ARTIFACTS=/tmp/rp-p4-navigation pnpm nx run web:routing-check`                  | Passed client-side navigation, back/forward, slow loading, both themes and reduced motion.                                                                                                                                            |
| `BASE_URL=http://localhost:3010 pnpm e2e:web`                                                                                | Both existing Chromium tests passed.                                                                                                                                                                                                  |
| `pnpm audit --json`                                                                                                          | 0 critical / 3 high / 2 moderate; outstanding tooling findings discussed above.                                                                                                                                                       |
| `git diff --check`                                                                                                           | Passed.                                                                                                                                                                                                                               |

The QR check covers owner save/reload, staff and cross-workspace denial, web CSRF rejection, composite tenant FK rejection, location draft discard/isolation, business-name independence, stable public links after branding changes, and self-contained SVG/PNG exports with saved logos in both layouts. Independently decoding both formats returns the exact saved customer URL. Public tests cover all five ratings, safe configured and missing Google links, unavailable/disabled pages, preserved values after failure, double-click suppression, durable timestamps/unresolved status, concurrent retries including mixed-case UUIDs, changed-payload 409, bounds/ownership rejection, case-normalized rate limits, and demo isolation. No browser runtime errors were observed.

Actual dependency-outage probes also passed by setting `PHASE4_REDIS_OUTAGE_URL=http://127.0.0.1:3303/api/v1` and `PHASE4_STORAGE_OUTAGE_URL=http://127.0.0.1:3304/api/v1` for the same QR command: isolated APIs used an unreachable Redis or S3 endpoint. Redis reads/submissions returned sanitized 503; unavailable storage left customer metadata readable and returned sanitized 503 for the logo. Export-logo failure and public submission failure also preserve useful UI state.

Rendered QR studio and public form screenshots were captured and visually inspected at **1280px and 390px, light and dark**, alongside pending, success and unavailable states and exported cards. Checks include overflow, long escaped names, readable QR/branding, selected/focus states, and stable hover bounds. Theme screenshots now use the actual theme control; directly changing the HTML class had bypassed the provider's transition suppression and captured an artificial intermediate colour frame. Artifacts stay in `/tmp/revuping-phase4` and `/tmp/rp-p4-navigation`.

Review also corrected workspace/location transaction lock ordering and normalized UUID submission keys before advisory locking, preventing case aliases from racing the database uniqueness constraint. Native bundle verification does not prove Android navigation, camera decoding, platform sharing or print scanning. Local emulator tests do not establish production S3 compatibility or privacy.
