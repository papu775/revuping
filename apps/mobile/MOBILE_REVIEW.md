# RevuPing mobile review — 3 October 2026

The subsequent design refinement and its latest checks are recorded in [MOBILE_REFINEMENT.md](MOBILE_REFINEMENT.md). This report preserves the earlier setup repair.

This is a frontend setup and design repair of the existing application, not a regenerated app. **Android device verification remains outstanding.** No Java executable, Android SDK, `adb`, emulator or native interaction tool was available in this execution environment. The local APK build was attempted and stopped at `JAVA_HOME is not set and no 'java' command could be found in your PATH.` Browser screenshots and React Native component tests do not establish device correctness.

The existing mobile changes were preserved in checkpoint **3fd3b925dd16120f56db1e0fded3a04fa9262f0f**. The final repair commit follows that checkpoint; it was not pushed.

## Setup findings and repairs

- Retained Expo **57.0.26**, React **19.2.3**, React Native **0.86.3**, Expo Router **57.0.24** and the existing SDK-compatible native dependencies. Compatibility was checked against the installed Expo bundled-module manifest, Expo's SDK 57 release notes and `expo install --check`.
- pnpm 11 ignored the hoisting options in `.npmrc`. Moved `nodeLinker: hoisted` to `pnpm-workspace.yaml`, its supported configuration location. Relinked generated dependency folders after switching installation layout. This removed the duplicate native installations reported by Expo Doctor; versions were not randomly upgraded. Lockfile changes include the corrected peer dependency contexts.
- The installed test renderer was 19.3.0 while React was 19.2.3. Aligned the renderer and lockfile to 19.2.3; declared the icons dependency in its actual `mobile-ui` consumer.
- Replaced manual Metro resolver/debug overrides with Expo's automatic monorepo configuration. The SVG transformer preserves Expo's transformer. Removed the fake DOM/SVG declarations and unsafe component/storage casts.
- Native libraries now use TypeScript's bundler resolution and real workspace package exports/dependencies. Removed the root mobile path aliases and root `baseUrl`, which also caused the web app's app-local `@/` imports to resolve incorrectly.
- Corrected mobile application/library tags to `platform:native`. `mobile-tokens` is a native utility, since it contains a React Native theme provider. Added native dependency boundaries against DOM, Next, server packages and browser libraries. Native presentation remains separate from the web components.
- `mobile:start`, `mobile:serve` and `mobile:export` use Expo CLI commands. Removed inferred unconditional cache clearing. The default `mobile:build` now runs local Gradle, as does `mobile:android-build`; local development does not require EAS or login.
- Preserved `expo-router/entry`, `src/app` discovery, Babel's Expo preset, gesture root, safe-area provider, Hermes, new architecture, package identifier `com.revuping.mobile`, and committed native projects. Existing Android configuration uses compile/target SDK 36, minimum SDK 24 and Gradle 9.3.1.
- Replaced the starter launcher/splash graphics with the existing RevuPing audio-lines brand mark. The vector source is `assets/images/brand-mark.svg`; corresponding Expo, Android and iOS raster assets were updated.

Primary documentation checked: [Nx Expo](https://nx.dev/docs/technologies/react/expo/introduction), [Expo SDK 57](https://expo.dev/changelog/sdk-57), [Expo monorepos](https://docs.expo.dev/guides/monorepos/), [Expo Metro](https://docs.expo.dev/versions/v57.0.0/config/metro/), [React Native releases](https://reactnative.dev/versions), and [pnpm configuration](https://pnpm.io/settings).

## Design and behavior repairs

The completed web app's cream/navy, violet and restrained sage palette, wordmark, terminology and demo boundaries are the reference. Android/iOS system fonts and native cards, tabs, stacks and sheets are intentional adaptations. There is no desktop sidebar, WebView or 3D QR model.

Shared controls now have 48dp button/icon/filter targets, stable input focus borders, password masking/reveal, readable avatar initials in both themes, selected/disabled/loading semantics, wrapping headers/actions and consistent card/detail gutters. Filters cannot grow vertically when a list is short. The tab bar has space for labels, adapts to font scale, hides for long editors and keyboard entry, and content uses the remaining scroll area rather than arbitrary bottom-navigation spacers.

Sheets retain their contents through a restrained 200ms close transition and cancel stale animations on reopen. Navigation and sheet/skeleton motion respect native reduced-motion preferences. Long dialogs and sheets scroll. Forms retain draft state during selectors and wizard steps; Android hardware back steps through campaign/onboarding wizards. Direct-link editor saves/back actions have valid fallback destinations. Theme changes also update status-bar styling and the native root background.

Customer consent/opt-out status and campaign eligibility now agree. Campaign audiences and schedule validation work, duplicate saves are guarded, and changing campaign type selects the matching template. Reply approvals are idempotent. Feedback resolution and follow-up state agree. Report date filters change the data and aggregate locations by date; exact chart values are available as text. Missing survey answers are excluded rather than counted as zero. Widget selection/layout changes affect its native preview; colour drafts can be invalid while editing, and the embed snippet uses native selectable text instead of claiming a fake clipboard copy. Team invitations validate email/duplicates and explicitly record a local demo result.

The advertised survey editor was a placeholder and referrals were absent despite being part of the existing product scope. Surveys now have a full-screen question editor with validation, ordering, required-state controls and saved demo data. Referrals now have a native programme form, invitation sheet, pause/resume and fictional activity. Customer details expose the existing request template as a clearly simulated preview.

## Screen inventory and review coverage

All 24 original destinations were inspected in source and the supplemental browser preview; the two repaired destinations were also reviewed. No row below means an Android device test passed.

| Mobile destination                                | Web feature / review result                                                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/welcome`, `/login`, `/signup`                   | Auth/marketing: native wordmark, explicit demo entry/setup, scrolling forms and secure password fields. No credentials saved.    |
| `/onboarding`                                     | Business setup: existing profile defaults, usable colour input, steps and back behavior.                                         |
| `/`                                               | Overview: dashboard, charts and today's tasks; tasks now open onboarding, integrations, reviews or the actual feedback detail.   |
| `/feedback`, `/feedback/[id]`                     | Feedback/follow-up: search, filters, notes, assignment, priority/due/summary, resolution and history presentation.               |
| `/customers`, `/customers/[id]`, `/customers/add` | Customers: cards, search/empty results, consent, opt-out, timeline, validated add form and request preview.                      |
| `/campaigns`, `/campaigns/builder`                | Requests/reminders/repeat visits: one concise native destination, four-step full-screen builder and eligibility-aware demo save. |
| `/more`                                           | Secondary modules: readable menu, demo business identity and meaningful destinations.                                            |
| `/more/qr-studio`                                 | QR: colour validation, quiet zone, readable ink fallback, small-phone sizing and customer-page preview.                          |
| `/more/reviews`                                   | Google review/reply drafts: readable cards, wrapping/full-width actions, editing and approval; explicit no-publishing notice.    |
| `/more/surveys`, `/survey-editor`                 | Survey list, response summary and repaired full-screen question editor.                                                          |
| `/more/referrals`                                 | Existing web referral programme adapted to native form/cards/invitation sheet.                                                   |
| `/more/reports`                                   | Location/date filters, aggregated trend, summary and accessible chart values.                                                    |
| `/more/staff`                                     | Staff/services: existing fictional insight cards and rating presentation.                                                        |
| `/more/competitors`                               | Fictional comparison: readable selected-business surface and wrapping metrics.                                                   |
| `/more/widgets`                                   | Selected review/social-card layouts, theme/colour editing and selectable demo embed snippet.                                     |
| `/more/integrations`                              | Clearly simulated connection/disconnection; no provider account linked.                                                          |
| `/more/settings`                                  | Business branding, team/notifications/templates; keyboard/scrolling and validated demo invitations.                              |
| `/more/billing`                                   | TBD pricing and explicit plan-selection preview; no payment/subscription created.                                                |
| `/more/profile`                                   | Light/dark/system selection, demo identity and reset confirmation.                                                               |

Intentional scope limits: request/reminder/repeat-visit features share Campaigns instead of separate desktop pages; insights use cards and charts instead of tables; the review wall stacks on a phone. QR is still a **preview/style editor**: native file export/share is not implemented, its URL is fictional, and the UI says no file is downloaded or shared. Embed snippets do not install a live widget. Messaging, Google publishing, connections, billing and referral events remain simulated. No backend service was added.

## Checks actually performed

- `pnpm check`: passed the full workspace lint/type/test run (24 successful tasks). Mobile has eight behavior/component tests covering password reveal, filter selection, sheet close/reopen, eligibility, date/reminder validation, consent/opt-out, repeated approval and follow-up resolution.
- `pnpm build`: passed web, admin and API production builds, sequentially.
- `pnpm e2e:web`: passed both Chromium smoke flows after the shared installation/TypeScript changes. Web presentation/route source was not edited.
- `pnpm nx run mobile:export --platform=android --max-workers=2`: passed; generated an Android Hermes bundle and metadata. This is a native-platform bundle, **not an APK or device run**.
- `pnpm nx run mobile:dependency-check`: passed Expo's installed-SDK compatible dependency check.
- `pnpm dlx expo-doctor apps/mobile`: **20/21 checks passed**. Duplicate native packages are fixed. The remaining warning is native/app-config synchronization: committed `android`/`ios` folders are not automatically rewritten when `app.json` changes. This warning was retained, not suppressed.
- `pnpm nx graph --file=/tmp/revuping-mobile-graph.json`: generated the updated graph; mobile depends on its three native packages, with no application-to-application or DOM rendering imports.
- `pnpm nx run mobile:android-build`: attempted, blocked by missing Java before Gradle could build an APK. SDK/device checks also could not run.
- Supplemental Chromium/Expo-web review: all 26 destinations at 390×844 in light/dark, plus key screens at 320×640 and 430×932. Interacted with password reveal, customer validation/save/filtering, report filtering, survey validation/save, theme selection/system browser changes, widget layouts/colour validation, referral preview/pause, sheet close/reopen, snippet preview, invalid team invitation and empty customer search. Final interaction passes had no application console/page errors. Reduced-motion preference and a 150% browser text stress capture supplement source review only; they do not verify native animation/accessibility or Android font scale.

## Before/after evidence

These are **Expo web browser screenshots**, not native screenshots. Selected pairs are committed under `docs/screenshots/`; the full temporary capture set is `/tmp/revuping-mobile-audit/`.

| Browser screen                | Before                                                    | After                                                   |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Home/tab labels               | [Before](docs/screenshots/before-light-home.png)          | [After](docs/screenshots/after-light-home.png)          |
| Customer form/raw-text defect | [Before](docs/screenshots/before-light-customers-add.png) | [After](docs/screenshots/after-light-customers-add.png) |
| Dark avatars/filter height    | [Before](docs/screenshots/before-dark-customers.png)      | [After](docs/screenshots/after-dark-customers.png)      |
| Login/branding/password       | [Before](docs/screenshots/before-light-login.png)         | [After](docs/screenshots/after-light-login.png)         |

## Local Ubuntu workflow

Use Node 24.20.x and pnpm 11.25.0. Install with the committed lockfile:

```sh
pnpm install --frozen-lockfile
pnpm nx run mobile:start --port=19000 --max-workers=2
# Equivalent default-port shortcut:
pnpm dev:mobile
```

The Metro startup command was exercised and its `/status` endpoint checked. Native app installation/run requires a local JDK and Android SDK plus an emulator or connected device. Configure `JAVA_HOME`, `ANDROID_HOME` and the SDK's `platform-tools`/`emulator` on PATH using your own local paths; do not commit local paths or environment files. The native build configuration targets SDK 36. Once that tooling exists:

```sh
adb devices
pnpm nx run mobile:run-android --port=19000
# Root shortcut (default Expo port):
pnpm android:mobile
# Local debug APK without EAS:
pnpm nx run mobile:android-build
# mobile:build also uses local Gradle.
# Output: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

The APK/run commands are verified target definitions, but **could not complete here**. Android run uses `expo run:android`; Gradle build uses `./gradlew :app:assembleDebug --no-daemon`. No EAS credentials/login are required.

Keep the committed native projects and app config in sync. After changing icon, scheme, orientation, plugins or other native config, use the explicit local prebuild target and review its diff before building. The target uses `--no-clean --no-install` to update existing native folders without replacing them or running dependency/CocoaPods installation. Restart Metro after changing Metro configuration or installation layout; routine startup does not delete its cache.

## Remaining device verification

Run the following on a small Android phone/emulator and a larger one, preserving before/after native screenshots and logcat output:

1. Open every inventory destination in light and dark, then change the system theme while System is selected. Check status/navigation bars, safe areas and rotation/resize constraints.
2. Increase Android system font size (including roughly 150% and 200%). Check wrapped tab labels, headers, names, badges, selectors, final actions and dialogs; ensure there is no horizontal clipping.
3. Open the keyboard in login/signup/onboarding, customer add, reply edit, feedback notes, campaign/survey/referral editors and settings. Scroll to each final action; tap it once with the keyboard open.
4. Check hardware/predictive back, direct-link fallback, wizard previous-step state, sheet dismissal, focus return and TalkBack selected/disabled/error announcements.
5. Enable native Remove animations/reduced motion. Repeat navigation, sheets and rapid close/reopen. Check no stale overlays, duplicate saves or stuck loading.
6. Check horizontal filters, long names/messages, empty lists, one-point report charts, valid/invalid colours and QR contrast/sizing. Confirm QR preview-only limits, mock publication/connection/billing notices and actual persisted demo state across restart/reset.
7. Build/install the local APK and inspect runtime logs. The Android bundle passing alone does not validate autolinking, launcher/splash resources, native navigation, keyboard handling or system bars. iOS build/device verification was also not performed.
