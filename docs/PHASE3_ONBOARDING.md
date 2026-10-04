# Phase 3: business onboarding and local logo storage

Phase 2 authentication is committed in `477f463`; its feedback polish is `3da0987`. This phase keeps password hashing, opaque web/native sessions, CSRF, trusted fragment-token email links, token expiry/single use, membership authorization and explicit demo separation. Admin and review collection/integrations remain deferred.

## Journey and ownership

`/workspace` now uses a responsive four-step business wizard with the existing logo, theme tokens, fields, branded selectors, buttons and toast host. Enter the business name once; workspace creation uses that same name. Steps are Business (name/category/optional logo), Primary location (name/optional address/editable IANA timezone), Hours and branding, Review and finish. Server drafts save on Continue/Back; reload resumes the saved step and browser Back/Forward changes the selected step. Unsaved edits survive background session refresh; closing/reloading before a save discards those unsaved edits. Hours can be skipped, closed, or contain up to four non-overlapping intervals per day; overnight intervals are explicitly rejected. Branding previews display the uploaded logo. Completed accounts show saved details and a truthful no-feedback state; demo metrics remain on the explicit fictional demo routes.

Web DOM components remain app-local. Android uses native fields, bottom-sheet selectors, keyboard-aware scrolling, safe areas, an Expo image picker and the same neutral typed contracts. Only multiple-workspace accounts see a selector. STAFF sees business details but cannot change drafts, branding, logos or completion.

Blocking actions use a compact waveform mark with subtle animation, action text, themed translucent backdrop, covered-control accessibility protection and existing bounded/cancellable action lifecycle. Reduced motion keeps the mark still. Background reads do not create blocking overlays. The shared web toast host is portalled to the body and fixed at the top-right; it no longer searches for empty regions in the form. Routine saves use toasts; field errors and necessary verification guidance remain inline. Branded verification/reset emails use inline styles, table markup, system fonts, a text wordmark, CTA, expiry/security copy, fallback link and plain text. Tokens stay in fragments.

Verification links are processed once on entry. Success removes resend/email controls and offers Continue setup for an authenticated session, or login otherwise. Session verification is refreshed; returning to the original workspace tab refreshes authoritative state. A consumed/invalid token only becomes a verified state when the authenticated session independently confirms verification. Business completion remains separate.

## Schema and API

The additive `20261004000000_business_onboarding` migration adds business draft JSON, revision, completed timestamp and unique logo key; location timezone, hours and a primary flag; and a durable LogoObject upload journal. A partial unique index guarantees one primary location per business. Existing tenant-consistent composite foreign keys remain intact. Business/workspace names stay synchronized. Completion requires business name, category, primary location name, valid IANA timezone and valid branding/hours; address, hours and logo are optional.

All routes require a verified authenticated session and membership. Existing web CSRF checks also cover PUT, multipart POST and DELETE; native uses existing bearer sessions.

| Route under `/api/v1`           | Behavior                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| GET `workspaces/:id/onboarding` | Member-readable typed business/location draft and completion snapshot              |
| PUT `workspaces/:id/onboarding` | OWNER-only validated draft save or completion; explicit revision                   |
| POST `workspaces/:id/logo`      | OWNER-only multipart `file` + `revision`; sanitized upload and database attachment |
| GET `workspaces/:id/logo`       | Member-authorized private image response, no-store and nosniff                     |
| DELETE `workspaces/:id/logo`    | OWNER-only removal with JSON `revision`                                            |

Writes lock the workspace, recheck ownership and compare revision. Exact save/completion replay is idempotent; different stale writes receive 409 and clients ask to reload authoritative details. Repeated completion does not create additional businesses or primary locations. Unknown fields and client-provided references are rejected. The Next proxy only adds these narrow route/method combinations, bounds multipart bytes even without Content-Length and forwards authorized image bytes without exposing storage keys or credentials.

## MiniStack configuration

Read and inspected the official [configuration](https://ministack.org/docs/configuration), [S3 operation/limitations](https://ministack.org/docs/services/s3), and the pinned `v1.5.21` S3 handler and running container authorization/persistence source before accepting the setup.

Compose adds `ministackorg/ministack:1.5.21` (pulled digest `sha256:7a30ff0670578e10528b5a9a21e795ef494f96bbc35691c9b0742ea35de71808`) at `127.0.0.1:${S3_PORT:-4566}` with readiness checking and independent named state/object volumes. PERSIST_STATE and S3_PERSIST are both enabled, with STATE_DIR and S3_DATA_DIR matching the mounts. PostgreSQL, Redis and Mailpit retain their existing containers and volumes. No MinIO and no Docker socket are added.

Keep the existing local environment files. Add the settings from [storage.env.example](../infra/storage.env.example) to the API environment; use safe dummy credentials only in explicit local-emulator mode. Production forbids that mode and dummy `test` credentials. AWS SDK v3 S3Client supports configurable endpoint, region, bucket, path-style behavior and server credentials (explicit managed pair or default server credential chain). Production buckets must be provisioned privately with public access blocked and appropriate IAM/encryption controls; the application does not create production buckets. Storage startup is lazy and never part of authentication readiness.

```sh
docker compose --env-file infra/.env -f infra/compose.yml up -d --wait
pnpm nx run api:migrate-deploy
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
# Retry orphan cleanup periodically through the deployment's scheduler:
pnpm nx run api:cleanup-logos
```

Uploads are bounded to 2 MiB, actual decoded PNG/JPEG/WebP content, one raster frame, 4096 pixels per axis and 16,777,216 decoded pixels. SVG, unsupported content, corrupt images and oversized input are rejected. Sharp auto-orients and re-encodes to metadata-free WebP at no more than 1024 pixels per axis. Keys are generated by the server under `workspaces/<authorized-id>/logos/<uuid>.webp`. The database reference changes only after successful storage. Revision races or upload/attachment failures trigger best-effort cleanup. A journal written before S3 preserves ambiguous/failed writes and failed replacement/removal deletions for retry. `cleanup-logos` checks unreferenced journal entries older than one hour, validates their workspace prefix, rechecks references, deletes S3 first and only then clears the journal; failures retain retry evidence. No user-supplied URL is fetched.

Browser images use the same-origin Next backend route; Android images use the configured reachable API base and current bearer header. S3 endpoints and keys never become client asset URLs. For Android Studio use `EXPO_PUBLIC_API_URL=http://10.0.2.2:3002/api/v1` and API_HOST=0.0.0.0; USB devices can use adb reverse, and Wi-Fi devices use the host LAN IP. Browser/native clients need no access to the MiniStack port and never receive an internal Docker hostname. Configure HTTPS API URLs in production. No presigned URLs are used, so there is no untested presigned behavior in this application.

## Emulator limitations

MiniStack 1.5.21 is development/test infrastructure. Passing these checks does not establish production S3 compatibility. S3 is account-scoped but shared across regions. SSE headers do not encrypt stored bytes. State snapshots are written on graceful shutdown; a normal restart was tested, abrupt kill/crash recovery was not. IAM authorization is disabled by default. The pinned evaluator also treats an empty access key (unsigned requests), `test`, configured root keys and account IDs as local root; enabling AUTH does not turn it into an authentication boundary. Our probe returned HTTP 200 for an unsigned private object despite public-access-block configuration. Therefore the local emulator holds synthetic/local data only and binds to loopback; application membership authorization is independently tested at the API. Do not expose this emulator or store sensitive production data in it. Independently validate production IAM, public access, encryption, SDK checksums and lifecycle behavior against the chosen S3 service.

## Verification

The migration applied successfully without resetting data. API integration checks run through `api-e2e:onboarding-check` with local PostgreSQL/Redis/Mailpit/MiniStack and synthetic accounts. They cover drafts, exact replay, stale conflicts, duplicate completion and location count, OWNER/STAFF, cross-workspace access, unsupported/oversized/overdimensioned images, actual-content validation, read, replacement, removal, container-restart persistence and storage outage while authentication remains available. Fixtures and captured messages are cleaned up.

The browser `web:onboarding-check` uses Playwright and Mailpit for signup, slow-action loader/toast, login before verification, second-tab verification and original-tab recovery, wizard, logo validation/preview, hours validation, review, completion, reload/edit, replacement/removal, Back/Forward, both themes, desktop/narrow layouts, dropdowns and keyboard focus. Screenshots are stored under `/tmp/revuping-phase3-browser` and inspected separately. The landing page already has its established hero artwork and product compositions, which are preserved.

```sh
# Isolated test API: explicit env path because nx exec changes cwd.
API_ENV_FILE="$PWD/apps/api/.env" NODE_ENV=test SMTP_HOST=127.0.0.1 \
SMTP_PORT=1025 SMTP_SECURE=false SMTP_FROM=accounts@revuping.test \
WEB_URL=http://localhost:3010 CORS_ORIGINS=http://localhost:3010 PORT=3302 \
AUTH_RATE_NAMESPACE=rp:auth:test:phase3 S3_LOCAL_EMULATOR=true \
S3_ENDPOINT=http://127.0.0.1:4566 S3_FORCE_PATH_STYLE=true \
pnpm nx exec --projects=api --excludeTaskDependencies -- node "$PWD/apps/api/dist/main.js"
# Separate terminals, after building:
API_INTERNAL_URL=http://127.0.0.1:3302/api/v1 pnpm nx run web:auth-preview --excludeTaskDependencies
NODE_ENV=test SMTP_HOST=127.0.0.1 PHASE3_STORAGE_RESTART=true pnpm nx run api-e2e:onboarding-check
pnpm nx run web:onboarding-check
pnpm nx run web:verification-check
BASE_URL=http://localhost:3010 pnpm e2e:web
PROTOTYPE_URL=http://localhost:3010 pnpm nx run web:product-check
pnpm nx run mobile:auth-native-bundle
pnpm check
pnpm build
pnpm nx graph --file=/tmp/revuping-phase3-graph.json
```

Automated email checks use Mailpit only. Browser-rendered emails do not prove compatibility with every email client. Metro/Hermes export, native unit checks and browser screenshots do not prove Android runtime behavior. No adb/device is available here; gallery permissions, native file descriptors/network upload, authenticated Image headers across session rotation, keyboard/system Back, TalkBack and actual safe-area rendering still require a device run. Existing developer changes to `.gitignore`, the staged API example deletion and authentication documentation are excluded from the Phase 3 commit.

## Executed results and visual review

On 2026-10-04, full `pnpm check` passed all 29 tasks and sequential `pnpm build` passed all five tasks. The applied migration, onboarding API integration (including graceful MiniStack restart persistence and orphan cleanup), onboarding browser journey, verification-state checks, Chromium web smoke (two tests), existing demo product checks and Phase 2 authentication regression (13 groups) passed. The existing product check captured 150 route/theme/viewport combinations without overflow or browser errors. Native Metro/Hermes export passed; no Android runtime was available.

The onboarding browser journey also captured both verification and reset HTML emails at desktop/narrow widths, checked matching HTML/plain-text reset links, completed a real password reset and logged in with the replacement password. Verification-state checks use a real invalid token; outage and anonymous-success responses are deliberately mocked. Real authenticated verification and cross-tab recovery use Mailpit links in the onboarding journey.

Inspected screenshots include the preserved landing page, signup loader/toast, verified email screen, both email templates, category dropdowns, logo validation with retained preview, desktop light/narrow dark review and completed business summary. Fixed an interaction found during review: non-submit wizard controls (including Add interval) explicitly use button type, preventing accidental form submission. Dropdown captures use viewport screenshots because a full-page screenshot resizes the viewport and closes Radix overlays. Screenshots remain local in `/tmp/revuping-phase3-browser`; synthetic links in them are expired by fixture cleanup. The isolated API and preview processes were stopped after testing; existing infrastructure and volumes were preserved.
