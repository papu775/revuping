# Post-onboarding routing and photography pass

## Diagnosis and resulting behavior

The existing API already validates onboarding drafts and writes business completion plus the primary location transactionally. A real local-API reproduction of Finish setup confirmed the browser remained on `/workspace` showing “Your business is ready”: the client only changed its editing state and showed a toast. The workspace server page checked only the session, never selected-workspace completion. The existing `/dashboard` was a separate fictional demo, with no real-account destination.

Real accounts now use `/workspace/dashboard`. The shared `accountDestination` contract derives the destination from authoritative session verification and selected business `completedAt`: anonymous → login; unverified → verification; verified without a workspace → initial setup; incomplete selected workspace → setup; completed selected workspace → dashboard. Web server routes read session, current membership list and selected onboarding with `cache: 'no-store'`. An explicit unknown workspace is rejected, rather than falling back to a different tenant. The remembered selection is a user-scoped preference cookie, validated against current membership on every server read; native uses an equivalent user-scoped AsyncStorage preference and authenticated API reads. Neither preference authorizes access.

Finish setup requires a confirmed API response with `completedAt`, invalidates account route caches through a server action, then replaces the onboarding URL with the dashboard URL. Step and edit parameters are removed. The server also redirects completed users visiting onboarding directly. `?edit=business&workspace=<id>` is the explicit owner-authorized business-edit flow. Failed completion leaves the draft and error visible. The existing API membership/revision checks, private logo reads and cleanup behavior are retained.

The real dashboard reuses the existing sidebar, topbar, layout, navigation controls, heading and buttons through `DashboardShell`. It shows saved business branding/location and useful edit/demo actions. Customer activity is empty; feedback, campaigns and integrations are explicitly unavailable for real accounts. `/dashboard` remains the clearly labelled fictional demo. No future business modules or user-avatar backend were added.

Native account routing uses Expo Router, fresh session/workspace/onboarding reads, guarded routes and a separate real dashboard. Completed setup replaces the native route. Foreground/focus reads recheck authorization. Owner editing and selected workspace status use the same policy; demo activation remains explicit.

## Signup and navigation

Successful registration, including the confirmed account-created/email-delivery-failed outcome, replaces the signup form with check-email guidance and resend/verification/login actions. Unconfirmed creation errors retain the form and recovery links. Native signup follows the same success-state behavior.

Internal page links already used Next.js navigation. The standalone login/signup page shells remounted, and blocking submission state ended before navigation committed. A browser run also exposed an immediate `router.replace()` followed by `router.refresh()` race that left navigation on the old onboarding URL. Cache invalidation now happens before navigation through `refreshAccountRoutes`; the destination's server authorization remains authoritative.

Login/signup share a persistent auth supporting panel. Workspace routes share a persistent account header and canvas. Dashboard routes retain their shell and fade only content. Onboarding step changes retain the wizard frame and draft, with step heading focus and deliberate scrolling. Incoming content fades from 0.88 opacity with at most 3px movement over 180ms; reduced motion disables it. Native screen/step fades are 180ms with reduced-motion support; native step content animates independently, with scroll and accessibility-focus handling. No animation library was added. Pending dashboard data uses structural skeletons; submissions retain blocking loaders.

Final browser-error checks also detected a server/client mismatch around the shared workspace layout wrapper and a reduced-motion-dependent initial theme-icon style. The final layout uses a fragment around the persistent header/content, and the icon has deterministic initial rendering. The complete development and production journeys then passed without hydration errors; these checks remain in the harness.

## Assets

Three original photographic illustrations were actually generated with the available imagegen tool, inspected, and optimized to local WebP files. The café conversation supports auth; café/florist scenes appear on the landing page; the invented James portrait is explicitly opted into fictional demo examples. Scene dimensions and responsive aspect ratios reserve space before decoding. Form text has a separate opaque panel. Real-account avatars are not assigned generated or stock portraits.

See [asset provenance and terms](../apps/web/public/images/SOURCES.md) for generation identifiers, dimensions and the reviewed OpenAI source terms. No stock-image download or Unsplash attribution/license is claimed.

## Verification

The checks below use Node 24.20.0 and pnpm 11.25.0. The local production preview uses an isolated API on port 3302 and Mailpit on 8025; user development services are preserved. Synthetic account/workspace/logo/email fixtures are cleaned up by the real journey harness. Fault-state checks explicitly use intercepted responses.

- `pnpm check`: workspace lint, type checks and unit tests, including shared routing and native signup/client tests.
- `pnpm build`: sequential production builds.
- `pnpm nx run web:onboarding-check --excludeTaskDependencies`: real signup, Mailpit verification, verified login, initial setup, logo upload/replacement/removal/failure, persisted timezone/hours, browser step back/forward, server rejection of missing completion data, simulated completion failure with draft retention, slow confirmed finish → dashboard, exact response/DB completion timestamp comparison, reload, logout/back/login, incomplete selected-workspace resume, completed selection, unknown workspace rejection, staff edit rejection, direct onboarding redirect, explicit demo and anonymous dashboard rejection. Document/header identity assertions verify internal navigation rather than screenshots alone.
- `pnpm nx run web:routing-check --excludeTaskDependencies`: persistent auth/demo shells, no internal document requests, back/forward, delayed routes and photographic loading, both themes, desktop/narrow widths and reduced motion. Image boxes remain reserved during decode; local assets load successfully. Browser errors and horizontal overflow are checked.
- `pnpm nx run web:auth-feedback-check --excludeTaskDependencies` with `AUTH_FEEDBACK_WEB_ONLY=1`: success, confirmed delivery failure/resend, invalid login, network failure, timeout, repeated submission, loader teardown, verification/reset and notification behavior. These fault cases are mocked, not claimed as real delivery failures.

Final `pnpm check` passed all 29 tasks across 11 projects (22 cached); `pnpm build` passed all five tasks (four cached). The real development journey passed in 61 seconds and the production journey in 47.9 seconds. Navigation checks passed in 15.7 seconds, including delayed photographic decoding and unchanged image-box geometry. The web fault-state check passed, and `BASE_URL=http://localhost:3010 pnpm e2e:web` passed both Chromium smoke tests.

`PROTOTYPE_URL=http://localhost:3010 pnpm nx run web:product-check --excludeTaskDependencies` passed 150 route/theme/viewport combinations plus existing demo interactions, controls, focus restoration, exports and preference checks in 2m29s, without browser errors or overflow (336 screenshot artifacts). `pnpm nx run mobile:auth-native-bundle` successfully exported the Android Hermes bundle in 12.8 seconds. Native type/unit checks passed in the workspace check; actual Android device verification was unavailable.

Desktop/narrow screenshots were inspected in light and dark themes for the real dashboard, signup confirmation, auth supporting photography and landing photographs. Long business/address/email strings wrap, visible images decode, forms remain separate from photographs, and route/error checks report no unexpected browser errors. Artifacts are local, outside the commit: `/tmp/rp-routing-production`, `/tmp/rp-routing-navigation-complete`, `/tmp/rp-routing-auth-feedback-final.log`, and `/tmp/rp-routing-product`.

## Limits

No `adb` or Android emulator binary is available in this environment. Native type/unit checks and an Android Hermes export can validate code and bundling; they do not establish actual device routing, hardware back, keyboard, TalkBack, safe areas or animation behavior. Browser screenshots likewise do not prove Android behavior. Real-account activity modules remain deferred. Local MiniStack logo behavior is not a production S3 compatibility certification; this pass preserves the storage adapter and existing emulator limitations documented for Phase 3.
