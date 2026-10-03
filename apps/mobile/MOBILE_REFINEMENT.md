# Mobile design and native UX refinement — 3 October 2026

The existing app was refined in place. The workspace was clean at the start; the earlier repair is recorded in [MOBILE_REVIEW.md](MOBILE_REVIEW.md). Web source, routes, CSS, API/admin starters and backend behavior are unchanged. No credentials, environment files, real billing prices or integrations were added.

**Android device review remains outstanding.** The local Gradle build was attempted, but this environment has no Java/JDK, Android SDK, `adb`, emulator or native device tool. It stops with `JAVA_HOME is not set and no 'java' command could be found in your PATH.` No native screenshots were captured. The screenshots below are Expo **WEB** evidence; they do not verify Android layout, keyboard, TalkBack, device font scaling, system dialogs or native module linking.

## Web/mobile parity checklist

| Reference                                              | Native adaptation                                                                                                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web auth story, wordmark and cream/navy/violet palette | Existing vector wordmark retained; static feedback composition replaces empty space. System fonts remain scalable. CTA gutters and demo labels are consistent.                                                     |
| Dashboard: urgent work, metrics, trends and tasks      | Identity and ratings occupy separate rows; chart values are visible. QR scans, review-link clicks, private feedback and Google reviews remain separate metrics. Attention counts track local resolution.           |
| Customers and campaign eligibility                     | Consent and opt-out restrictions remain enforced. One consent badge; distinct request activity, record source and human dates. Previewing sends nothing.                                                           |
| Public customer feedback page                          | The QR preview offers equally styled Google review and private feedback choices. Neither choice depends on a rating or survey answer. No external page is opened by the demo.                                      |
| Surveys and review approval                            | Question type is separate from Required. “Text” replaces “Optional text”; stored drafts migrate on hydration. Editing an approved reply requires fresh owner approval.                                             |
| Reports and staff insights                             | Counts, units and labels match the underlying data. Staff names are labelled as staff, with precise numeric and half-star ratings.                                                                                 |
| Widgets and provider setup                             | Preview theme is separate from app theme. Swatches have a checkmark and border. Provider symbols use existing native icons and the web reference's Google “G” treatment. Connections stay simulated.               |
| Settings, profile and billing                          | Category selectors, opening-time controls and a location editor replace free-form profile fields. Native appearance follows light/dark/system preference. Existing TBD prices and demo-only plan selection remain. |

Inspected references: `apps/web/src/features/auth/auth.tsx`, `features/product/{overview,customers,campaigns,surveys,insights,settings,widgets}.tsx`, and the existing shared brand/theme assets. Native source never imports the web app.

## Shared controls and motion

- Stable 24px gutters, wrapping identity rows, 48px controls, visible search/input focus and clearable search fields. No font scaling was disabled.
- Button press feedback, restrained 180ms filter-label transitions, 210ms measured accordion height/fade/chevron motion and small toast transitions. Existing 200ms sheets retain exit content. No looping decoration was introduced.
- Accordion drafts live in their parent. Collapse hides descendants from accessibility and browser focus, then unmounts them after the transition. Interrupted transitions cancel stale completion callbacks. Settled expanded content does not clip focus indicators.
- Reduced motion removes press scaling, height/rotation and transition duration. Theme colors change together; native appearance also updates native controls.
- Switches retain native behavior, use a white thumb and contrasting track, and show an On/Off label. Native visual contrast still needs device confirmation; the web switch renderer differs from Android.
- Date/time controls use the system picker on Android and an iOS picker sheet. The browser preview has an explicitly documented text fallback. The only added dependency is Expo SDK 57's pinned `@react-native-community/datetimepicker@9.1.0`, declared in the app and UI consumer. The lockfile remains frozen-install compatible.

SDK compatibility checked against the installed bundled-module manifest and [Expo SDK 57 date-picker documentation](https://docs.expo.dev/versions/v57.0.0/sdk/date-time-picker/). The app-level appearance override uses the installed React Native 0.86 `unspecified` value for system preference; see [React Native Appearance](https://reactnative.dev/docs/0.86/appearance).

## Route inventory and browser coverage

Every route below was captured at the top and final scroll position in **light and dark**, at **320×640 and 390×844**. Seven routes also received 430×932 long-data and browser text-size stress captures. Browser text enlargement does not emulate Android `fontScale`.

| Routes                                         | Reviewed behavior / refinement                                                                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/welcome`, `/login`, `/signup`                | Branded preview, form hierarchy, consistent demo labels, CTA gutters, scrollable final actions; password reveal/login checked without password persistence.                                               |
| `/onboarding`                                  | Existing wizard retained; category, opening hours and locations share the settings editors. Native hardware-back handling remains unverified.                                                             |
| `/`                                            | Urgent work, metrics, named chart values and separated task identity/rating layout.                                                                                                                       |
| `/feedback`, `/feedback/1`                     | Search/filter layout, notes, priority, invalid dates, plan save, resolve/reopen and list-driven back navigation. Detail tabs are hidden; Resolve occupies a layout footer rather than overlaying content. |
| `/customers`, `/customers/1`, `/customers/add` | Validation, local save/filter, one consent badge, consent/opt-out restrictions, request activity and preview sheet. Detail/add tabs are hidden.                                                           |
| `/campaigns`, `/campaigns/builder`             | Eligibility, date/time save, human schedule strings, singular/plural counts and filters. Native calendar/time dialogs remain unverified.                                                                  |
| `/more`                                        | Secondary navigation, identity and final menu-item reachability.                                                                                                                                          |
| `/more/qr-studio`                              | Contrast-safe QR/quiet zone, selected colors, equal customer-page choices and private/public preview sheets. QR style saves; no export/share/download is claimed.                                         |
| `/more/reviews`                                | Expandable excerpts, distinct owner reply, draft edit/save, approval and approval removal after a revision. Nothing is published.                                                                         |
| `/more/surveys`, `/survey-editor`              | Response presentation; editor add/type/choices/reorder/remove/save, parent-held drafts, compact labelled toolbar, rapid accordion toggles and reduced-motion collapse.                                    |
| `/more/referrals`                              | Invitation editing, collapsible terms/eligibility, readable dates, preview and pause. Link opens still do not establish bookings or reviews.                                                              |
| `/more/reports`                                | Fixture-based request totals checked for date/location filters; chart labels, visible values and final summary reachability reviewed.                                                                     |
| `/more/staff`                                  | Staff filter, correctly named chart, singular/plural counts, 2.5/4.5 half-stars and exact numbers.                                                                                                        |
| `/more/competitors`                            | Fractional rating treatment, wrapping metrics and final card.                                                                                                                                             |
| `/more/widgets`                                | Color validation/selected swatches, review selection, preview theme/layout and readable selectable code sheet.                                                                                            |
| `/more/integrations`                           | Provider symbols, status/action hierarchy and simulate/disconnect flow.                                                                                                                                   |
| `/more/settings`                               | Category/hours/locations, profile save, invitation validation, switches, templates and final actions.                                                                                                     |
| `/more/profile`                                | Light/dark/system selection; reset cancel/confirm; destructive contrast and final information card.                                                                                                       |
| `/more/billing`                                | Highlighted/selected plan distinction, demo selection and unchanged TBD pricing.                                                                                                                          |

The final browser pass checks page width, fresh fixture state per route and top/end captures. Native insets, keyboard visibility, system back, physical touch targets and TalkBack cannot be established by it. Content passing behind an opaque header during scrolling was assessed through final reachability, not treated as a defect by itself.

No floating gear is rendered by the application or visible in these browser captures. The original device overlay's origin cannot be established without that device/native screenshot; no speculative overlay removal was made.

## Verification and reproducible evidence

- **PASS — `pnpm check`**: all 24 lint/typecheck/test targets across 10 workspace projects.
- **PASS — `pnpm build`**: all three web/admin/API builds run sequentially.
- **PASS — `pnpm e2e:web`**: both existing web Chromium smoke flows.
- **PASS — `pnpm nx run mobile:test --runInBand`**: 3 suites, 16 tests, including half-stars, mocked Android date selection, interrupted accordion/sheet transitions, date validation and reapproval semantics.
- **PASS — `pnpm nx run mobile:dependency-check`**: Expo dependency compatibility; dependencies are up to date.
- **PASS — `pnpm nx graph --file=/tmp/revuping-refinement-graph.json`**: dependency graph generated after adding the picker.
- **PASS — `pnpm nx run mobile:export --platform=android --max-workers=2`**: Android Hermes bundle; this is **not** an APK or native runtime test.
- **PASS — `pnpm nx run mobile:ux-check`**: 128 browser flow/capture checks, no page or console errors. Repeatable supplementary browser pass against `http://localhost:19006`. `MOBILE_PREVIEW_URL` and `MOBILE_QA_OUTPUT` can override the preview/output location. Results and the full capture matrix are written to `/tmp/revuping-mobile-refinement-qa` by default.
- **BLOCKED — `pnpm nx run mobile:android-build`**: blocked by missing Java; SDK/device checks also unavailable.

Supplemental checks also passed in both themes: keyboard Tab skips collapsed question inputs, reviews expand/collapse, and the 14-day report total agrees with the fixture count of 82. Native keyboard behavior remains unverified.

Selected browser comparisons and final captures are saved in [docs/screenshots/refinement](docs/screenshots/refinement). The review cycle included initial captures, corrections, all-route recapture and inspection of top/end and stress images. These are supplemental images, never native screenshots. Light-mode 390px before/after pairs cover welcome, home, survey editor and customer details. Final 320px light/dark contact sheets cover all 26 routes at their top and end; separate captures show equal QR choices, dark settings and long customer details. The saved `results.json` records the final automated pass.

## Native acceptance still required

Use a local JDK/Android SDK and an emulator or connected device, then run `pnpm nx run mobile:run-android` with the existing local workflow. The new native picker requires rebuilding a development app; restarting Metro alone does not add native modules. No EAS account is required by this workflow.

Confirm every route in both themes and small/standard device sizes; increase device font size; open/close the keyboard in forms and sheets; check date/time dialog appearance, cancel/confirm and timezone behavior; exercise TalkBack, Android back, rapid controls, reset, final-item scrolling, status/navigation bars, icons and QR readability. Capture actual Android screenshots before calling native acceptance complete. iOS runtime behavior is also unverified.
