# Frontend design review — 2 October 2026

This pass preserves the existing 25 product routes, mock workflows, cream/navy themes, violet/sage palette, tilted QR/feedback hero, curved lines and floating marketing/auth cards. Backend, payments, real connections and the admin starter were outside scope.

## Changes and defects corrected

- Shared labelled filter toolbar with equal 48px controls and responsive wrapping. Search focus surrounds the complete icon/input control, with no duplicate textbox outline.
- Wide survey builder with fixed header/close control, scrolling question body and separate responsive footer. Eight-question limit, new-question scrolling/focus, readable validation, reorder/delete controls and existing save behavior retained.
- Consistent page action groups, table spacing, neutral badges, section typography and dark nested surfaces. Customer action text no longer wraps vertically.
- Horizontal sample charts have a larger plotting area, scale labels, subtle gridlines and intentional empty/zero states. A shared `.chart-bars` name collision with the overview chart was corrected. Keyboard values and chart-data tables remain available.
- One brand-colour component used by QR studio, widgets, settings and onboarding: swatch, validated editable hex, native picker and selected presets.
- Four recognizable provider cards use a balanced two-column desktop/four-column wide layout, aligned content/actions and explicit preview statuses.
- Onboarding has a compact stepper, grouped fields, separate actions and a clear completion screen. Repeated demo banners become expandable concise indicators; contextual simulated-action notices remain.
- Refined sticky marketing header, navigation spacing and theme icon motion. Operational buttons remain stationary: browser testing found hover translation could make tablet onboarding's finish button unstable.
- Removed the old stand artwork from authentication. Tablet review also found missing branding between existing breakpoints; login/signup now show the mobile logo through 800px.

## Route and viewport matrix

Every route below was captured at top, middle and bottom in Chromium, with a 1000px-high viewport. All route responses were 200. No horizontal overflow or page/console errors were observed by the final design check.

| Width  | Light | Dark | Route cases |
| ------ | ----- | ---- | ----------- |
| 390px  | Pass  | Pass | 50          |
| 768px  | Pass  | Pass | 50          |
| 1440px | Pass  | Pass | 50          |
| 1920px | Pass  | Pass | 50          |

Route inventory: `/`, `/login`, `/signup`, `/dashboard`, `/dashboard/customers`, `/dashboard/qr`, `/dashboard/feedback`, `/dashboard/reviews`, `/dashboard/surveys`, `/dashboard/requests`, `/dashboard/campaigns`, `/dashboard/reminders`, `/dashboard/repeat-visits`, `/dashboard/referrals`, `/dashboard/reports`, `/dashboard/staff`, `/dashboard/competitors`, `/dashboard/widgets`, `/dashboard/integrations`, `/dashboard/settings`, `/dashboard/billing`, `/dashboard/onboarding`, `/r/demo-salon`, `/survey/demo-salon`, `/refer/demo-salon`.

Screenshot contact sheets were visually inspected across the matrix. Control checks at each width/theme exercise customer focus/empty state, eight-question survey editing, validation, focus trapping/restoration, Escape, brand-colour validation/selection, pricing anchors and onboarding completion. Mobile navigation/sidebar was expanded and exercised. System appearance followed dark-to-light preference changes. Existing product/refinement/hero checks additionally exercise mock flows, keyboard dropdowns, loading/failure/retry, toast delivery, real sample downloads, password-eye geometry/caret, avatar alignment, print colours, normal/reduced motion and hero composition.

## Reproduce verification

Start the built web application on an available port and set `PROTOTYPE_URL` accordingly. Commands below used `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`; browser checks and production builds ran sequentially.

```sh
pnpm nx run-many -t lint typecheck test --projects=web --parallel=1 --output-style=static
pnpm nx build web
PROTOTYPE_URL=http://localhost:3400 pnpm nx run web:design-check
PROTOTYPE_URL=http://localhost:3400 pnpm nx run web:product-check
PROTOTYPE_URL=http://localhost:3400 pnpm nx run web:refinement-check
PROTOTYPE_URL=http://localhost:3400 pnpm nx run web:hero-check
```

The new uncached `web:design-check` retains this 200-case matrix and focused interaction assertions. `DESIGN_ARTIFACTS` can change its output directory. Existing product checks now address the renamed horizontal chart selector.

All commands above passed. Lint/typecheck/unit tests ran uncached (one existing unit test); the production build generated all 25 routes. The product check separately captured 150 route/theme/viewport cases and passed shared workflows in both themes. Refinement checks verified actual QR SVG/PNG exports, print contrast and long-label containment; hero checks confirmed the layered composition, no canvas and functional QR downloads.

A supplemental browser check (`node /tmp/revuping-short-viewport.cjs`) passed at 390×640 in both themes: survey header/footer containment, simulated provider errors, dropdown viewport bounds, focused chart tooltip and expanded chart-data table. Its screenshots are alongside the matrix artifacts and its log is `/tmp/revuping-design-short-viewport.log`.

## Screenshot evidence

Artifacts are local review files under `/tmp`, excluded from the commit. Before captures used the existing baseline; after captures used the production build. Before screenshots may include the Next.js development indicator. Comparison images show before on the left and after on the right; survey comparison also demonstrates the expanded eight-question state.

- [Customers](/tmp/revuping-design/comparisons/customers.jpg)
- [Survey builder](/tmp/revuping-design/comparisons/survey-builder.jpg)
- [Reports](/tmp/revuping-design/comparisons/reports.jpg)
- [Integrations](/tmp/revuping-design/comparisons/integrations.jpg)
- [Onboarding](/tmp/revuping-design/comparisons/onboarding.jpg)
- [Authentication](/tmp/revuping-design/comparisons/auth.jpg)
- Machine-readable matrix: `/tmp/revuping-design/after/matrix.json`
- Per-route screenshots and expanded-state captures: `/tmp/revuping-design/after`
- Logs: `/tmp/revuping-design-final-matrix3.log`, `/tmp/revuping-design-product.log`, `/tmp/revuping-design-refinement.log`, `/tmp/revuping-design-hero.log`, `/tmp/revuping-design-build4.log`, `/tmp/revuping-design-final-code-check.log`.

## Limits and commit baseline

No unresolved defects were found in the reviewed states. Verification used Chromium; Firefox, WebKit, real mobile devices, screen-reader output and operating-system native colour-picker dialogs were not independently reviewed. Browser checks do not establish exhaustive accessibility compliance or verify external integrations, which remain simulated.

The workspace was clean before this pass. Existing commit `fcd6858889354b388d36cfa973547bca720a16ce` serves as the before/checkpoint baseline, so no redundant checkpoint was created. The final scoped commit is reported in the delivery message; nothing was pushed.
