# Authentication feedback polish

This pass keeps Phase 2 credentials, session rotation, CSRF, verification requirements, workspace permissions and demo separation intact. It adds no notification or blur dependency and starts no Phase 3 features.

## Feedback and registration outcomes

Web uses the existing `ToastProvider`; native uses the existing `mobile-ui` provider. Both support success, error and information with the existing theme tokens, icons and rounded surfaces. Identical active notifications are deduplicated. Dismissal remains available, web announcements are polite and web timers pause for hover/focus. Native announcements use the platform accessibility APIs. Existing demo dismissal timing is preserved.

Only a validated successful registration response produces “Account created. Check your email to verify it.” Persistent guidance, login/open-verification links and a resend action remain after the toast disappears. Confirmed creation locks further registration submission on that screen.

The API now distinguishes failure after account creation with HTTP 503 and the safe `REGISTRATION_VERIFICATION_UNAVAILABLE` code. The response keeps its generic public message and request ID; provider errors, addresses and credentials remain excluded. SMTP readiness failure before account creation remains an ordinary 503. Both clients offer resend/login for confirmed partial creation; an ambiguous network failure tells the user to check their inbox or try login/verification before registering again. No success is inferred from a timeout, network error or arbitrary server text. Unsent email-token cleanup remains unchanged.

Field validation stays inline. Authentication error text comes from the neutral client-owned message catalog, never raw exceptions. Passwords remain available after failed submissions and clear after confirmed successful credential actions, as before.

## Blocking actions

Signup, login, email verification, reset/recovery, resend and logout use app-local action lifecycles. They synchronously reject repeated submissions and immediately cover the form with a translucent themed overlay. Spinner/details appear after 120 ms to avoid a flash for instant responses. A 20-second action deadline also bounds a hung client/storage operation; individual network calls retain their 15-second deadline. Success, failure, timeout and screen cleanup clear the UI. Cleanup aborts requests and prevents late toasts or navigation callbacks; cancellation does not undo a mutation already accepted by the server.

Web uses `inert`, a focused overlay, keyboard/scroll interception and focus restoration without changing document overflow or scrollbar width. Its overlay and toast placement follow the visual viewport for a software keyboard. Native uses a transparent `Modal`, hides covered controls from accessibility and pointer interaction, preserves the existing keyboard-aware forms and measures keyboard overlap without double-padding an Android window that has already resized. Hardware back cancels the native action. Reduced motion keeps the spinner static and removes native toast animation. Background session restoration/refresh, ordinary data reads and workspace saves retain local loading states.

The native fetch adapter invokes the stored transport without binding its class instance as the receiver; this fixes browser preview's illegal-invocation failure. Native browser login/session persistence still requires the Next app, and native refresh credentials still require SecureStore. Cancellation during a native login response/storage write cannot publish a late authenticated session.

## Repeatable checks

Run `pnpm check` and `pnpm build` sequentially. Start `pnpm nx run web:auth-preview` on port 3010 and a current Expo browser preview separately. Then:

```sh
AUTH_FEEDBACK_MOBILE_URL=http://localhost:19007 pnpm nx run web:auth-feedback-check
BASE_URL=http://localhost:3010 pnpm e2e:web
PROTOTYPE_URL=http://localhost:3010 pnpm nx run web:notification-check
pnpm nx run mobile:auth-native-bundle
```

`auth-feedback-check` intercepts authentication responses in both browsers: it sends no real emails and creates no accounts. It checks both themes, 320/390/1280-pixel Next layouts, duplicate submission, slow responses, API failures, confirmed partial registration, network failure, timeout, navigation cleanup, verification/reset, persistent instructions, reduced motion and focus/layout stability. The keyboard viewport check is simulated; Expo browser rendering is supplemental evidence. Screenshots are written to `/tmp/revuping-auth-feedback-browser`.

Native unit checks exercise repeated taps, timeout/late completion, navigation cleanup, successful and partial registration, preserved values, reduced-motion modal accessibility in both themes, already-open keyboard overlap and cancelled SecureStore writes. The Android export checks complete Metro/Hermes bundling.

For the existing real PostgreSQL/Redis/Mailpit integration check, use the explicit Mailpit SMTP overrides documented in `AUTHENTICATION.md`. Never run it using development Gmail settings. Existing development servers can be left running by starting a built test API on a separate port with `pnpm nx exec --projects=api --excludeTaskDependencies -- node <absolute-path-to-apps/api/dist/main.js>`, configuring `API_ENV_FILE`, `PORT`, test namespace and Mailpit overrides; then set `API_TEST_URL` and run `api-e2e:auth-check --excludeTaskDependencies` with the same overrides.

## Android runtime limitation

No Android device/emulator or `adb` is available on this machine. Browser rendering, React Native unit tests and a Hermes export do not establish Android keyboard, TalkBack, system-back or SecureStore runtime behavior. On a device, repeat signup/login/verification/reset with the keyboard open, both themes and reduced motion; use a slow/offline connection, tap repeatedly, navigate/back during a request, dismiss notifications and confirm the overlay clears while entered values remain. Use Mailpit or an explicitly chosen development inbox. No external Gmail test message is sent by these checks.

## Executed verification

On 2026-10-03, `pnpm check` passed all 29 tasks across 11 projects, and sequential `pnpm build` passed web/admin/API production builds. The focused Next/Expo browser feedback check, two Chromium web smoke tests and existing notification checks passed. The latter covered both themes at 390/768/1440 pixels, reduced motion, success/failure/retry, focus and safe toast positioning. The complete Android Metro/Hermes bundle exported successfully. The existing real authentication integration check passed 13 groups against the isolated API on port 3302 using PostgreSQL, Redis and Mailpit; dependency outage injection was not enabled. No real Gmail email was sent and no Android device verification was performed.
