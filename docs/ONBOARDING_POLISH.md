# Onboarding and shared form polish

This pass preserves authentication, workspace membership checks, business revisions/persistence, private API asset reads, MiniStack configuration and demo isolation. It does not add review data or another feature phase.

## Forms and controls

Signup uses compact field errors on blur/submit, separate helper text, stable accessible labels, `aria-invalid`/`aria-describedby`, and first-invalid-field focus. Errors clear as valid input is supplied. Blur defers to submit when the submit button receives focus, avoiding an error row moving the button between pointer-down and click. Reset password uses the same inline validation hierarchy; server/network errors remain separate alerts. The backend password policy is unchanged. Shared input focus/error styles and button rest/pressed/disabled styles also apply to existing settings/demo consumers.

The actual RevuPing logo was rasterized from the existing shared Logo component at 2× resolution (276×76 PNG) and is displayed at 138×38 in both email templates. Nodemailer sends it as the inline `revuping-logo` CID attachment. Alt text and the plain-text message provide fallback branding; no external or localhost image URL is used. Trusted action URLs, fragment tokens and single-use expiry behavior are preserved. Browser previews substitute bytes fetched from the captured Mailpit attachment for the CID; this verifies the delivered asset, rather than just previewing a local file.

The web logo control has a contained preview, a placeholder, keyboard-accessible upload/replace/remove actions, a hidden real file input, drag/drop, upload/processing status and inline failure/retry. Existing server decoding, size/dimension validation, authorization, revision handling, replacement/removal and cleanup are unchanged.

## Business branding and hours

The existing `revuping-theme` Light/Dark/System preference remains the appearance setting. Business colour saves through the existing onboarding API and never calls `setTheme`. Shared brand calculations supply accent, an appropriate foreground and contrasting light/dark focus colours. Business previews use a soft accent surface and selected accent chip; global error/success semantics and RevuPing identity remain intact. A colour-sample test covers AA contrast for accent text across 4,096 RGB combinations. Previews distinguish unsaved changes from saved data.

Hours retain seven arrays of up to four same-day intervals. The additive `closedDays` boolean array distinguishes explicitly closed days from empty, unprovided hours. Missing legacy flags parse as false; empty existing data is never inferred as closed. The nullable `Location.closedDays` JSONB column is added without rewriting historical rows. Completion/editing persists the flags with the primary location. The API rejects a closed day containing intervals. The compact editor supports Open/Closed/Not provided and explicit destination selection before copying hours. Existing overlap/time/overnight rules remain enforced; overnight limitations are stated in user-facing guidance.

Review uses a business header, category, location/address/timezone, labelled accent swatch and aligned hours, with section edit actions. Step navigation brings the heading into view and focuses it before paint; Back/Forward, reload and server resume remain. Routine progress saves use a quiet indicator. Completion copy describes the saved business rather than implementation phases.

## Additional issues found during browser review

- Showing blur validation while clicking submit moved the button and swallowed the first click; submit now owns validation in that case.
- The verified email CTA nested a button inside a link; it now uses the shared button's `asChild` link support.
- Helper/error text could become part of changing accessible names; affected inputs now have stable labels and described errors.
- Closed Radix selectors had unmounted their option definitions. Programmatically adding hours caused the hidden native form control to emit an empty value and clear the interval. Options now follow Radix's normal content lifecycle even when the popup is closed, while retaining the established selector presentation and keyboard behavior.
- The focused completion heading had a browser-default black outline; noninteractive headings now receive focus without a control-style outline. Button/input focus indicators remain.
- Draft updates no longer schedule another state update from inside an updater, and focus/scroll runs in the layout phase.

## Verification and limits

Screenshots and run logs are local artifacts under `/tmp/revuping-polish-browser` and `/tmp/rp-polish-*`. Test accounts, workspace/logo objects and captured Mailpit messages are scoped synthetic fixtures and cleaned by the existing scripts. No external test emails are sent.

No Android device/adb is available. Native unit/type checks and Metro/Hermes export are separate from Android runtime validation; gallery permission, native networking/image headers, keyboard/system Back, TalkBack and actual safe-area rendering remain device checks. Browser-rendered CID emails do not prove support in every email client. MiniStack's previously documented production-compatibility and unsigned-access limitations remain unchanged.

## Executed results (2026-10-04)

- `pnpm check`: all 29 lint/typecheck/test tasks passed, including native unit checks, legacy/explicit closed-day contracts and brand text contrast.
- Sequential `pnpm build`: all five web/admin/API and dependency tasks passed.
- `pnpm nx run api:migrate-deploy`: additive migration applied without reset.
- `pnpm nx run web:onboarding-check`: final real journey passed at 1280px and 390px in Light/Dark; signup validation and first-field focus, local Mailpit verification/reset links and actual CID bytes, blocked-image fallback, visible file picker, drag/drop replacement, corruption/outage/retry, long names/addresses, copied multiple intervals, white/black/yellow accents without changing appearance, step heading focus/scroll, Back/Forward, reload, completion/editing and persisted `Location.closedDays` were checked. Overlay screenshots use viewport captures; full-page captures show page layouts. The scroll check accounts for existing 100px navigation padding.
- `BASE_URL=http://localhost:3010 pnpm e2e:web`: two Chromium smoke tests passed.
- `PROTOTYPE_URL=http://localhost:3010 pnpm nx run web:product-check`: 150 route/theme/viewport combinations had no overflow; both-theme existing consumer interactions and keyboard/reduced-motion checks passed without browser errors.
- `pnpm nx run api-e2e:auth-check --excludeTaskDependencies`: all 13 security/authentication groups passed with local Mailpit; dependency-outage probes were not enabled for this polish pass.
- `pnpm nx run mobile:auth-native-bundle`: Android Metro/Hermes export passed. This is not an Android device run.

Actually inspected screenshots include desktop/narrow signup validation, upload rest/hover/focus/pending and failure, no-logo and contained wide-logo layouts, Light/Dark location with long address, explicit-destination copy dialog, unusual accent previews in both themes/widths, desktop/narrow review, the corrected completion heading, verification/reset emails and blocked-image fallback, plus existing narrow settings, login and customer controls. Representative artifacts are in `/tmp/revuping-polish-browser` and `/tmp/revuping-product`; not every regression capture was manually inspected. Earlier `failure.png` is a diagnostic from a corrected assertion/run, not the final outcome.

The isolated test API/preview were stopped after verification. Existing development servers, infrastructure and data volumes were retained. The existing `.gitignore` change, staged API example deletion and `docs/AUTHENTICATION.md` edits are excluded from the commit. No push or next feature phase was started.
