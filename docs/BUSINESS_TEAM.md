# Business, locations and team settings

The real `/workspace/settings?workspace=<authorized id>` screen follows the existing `/dashboard/settings` template. Demo settings remain explicitly fictional and unchanged. Native accounts use `/account-settings`; joining an invitation does not require creating a separate business.

## Persisted behavior and authorization

- Owners save the business profile through the existing revision-protected onboarding API. Completion stays persisted; profile edits retain the primary location and public QR identifier. Private logo validation, replacement and cleanup remain in the existing storage adapter.
- Additional locations have independent metadata revisions and stable public IDs. Archiving disables public intake and excludes the location from QR Studio while retaining feedback history. Restoring does not silently reactivate public intake: enable it deliberately in QR Studio. The primary location remains editable through the authoritative business profile.
- Owners manage real OWNER/STAFF memberships. These are the implemented permissions; the template’s illustrative Manager/Viewer roles are not offered as unsupported permissions. Staff can read permitted settings and the roster, but cannot modify business/team/settings or retrieve other members’ contact emails.
- Membership revisions and workspace transaction locks prevent concurrent removal/demotion of the last owner. Removing access clears that workspace’s assignments, increments feedback revisions, records an immutable activity entry, and revokes pending invitations created by that member. Account sessions remain valid for other authorized workspaces.
- Team and invitation lists, and inbox assignment choices, page at 25 items. Locations and active team/invitation creation are bounded at 500. Archived locations count toward the limit because they preserve history.
- Notification preferences and message templates persist with shared strict validation. Templates permit only `{name}` and `{link}`, and require `{link}`. Saving preferences/templates does not send customer messages. Delivery requires the subsequent worker/provider phase.
- Inbox overdue calculations use the primary business timezone, including midnight/DST boundaries. Calendar due dates remain calendar dates.

## Invitations and email setup

Configure the existing server-only SMTP settings described in [authentication](AUTHENTICATION.md). Local tests use Mailpit; no real recipients are needed. `WEB_URL` must be the browser-reachable origin. Invitation links use `/join-team#token=...`; secrets stay out of HTTP access logs/referrers and are removed from the browser address after reading. Native users can paste the latest invitation link/token into the protected join screen; no new stock avatars or avatar backend are introduced.

Invitations require an owner, an explicit role, a verified account whose email matches the invitation, and confirmation of acceptance. Tokens use cryptographic randomness, expire after seven days, and are stored only as SHA-256 hashes. Resending rotates the token; revoked/expired links cannot grant access. Creation keys provide safe retries without sending duplicate mail. Only the latest email link should be used.

SMTP acceptance is reported as mail-server acceptance, not recipient delivery. Failed SMTP delivery retains the invitation with `FAILED` status and supports an explicit resend. A timeout/crash can leave `PENDING`; refresh and resend to obtain a new token. This phase does not claim a durable customer messaging worker or provider delivery tracking.

## Verification

Additive migration: `20261004030000_business_team`. Run `pnpm nx run api:migrate-deploy` and the normal sequential `pnpm check`, `pnpm build`.

`web:settings-check` uses isolated real APIs, PostgreSQL, Mailpit and Playwright synthetic fixtures. It also expects an isolated API on port 3303 with intentionally unreachable SMTP for failed-delivery recovery; do not change the shared Mailpit service. Its browser/API defaults are web 3010 and API 3302. It deletes only its UUID-scoped workspaces/users/emails.

Final checked flows and limitations are recorded in [progress](FEATURE_PROGRESS.md). Browser screenshots and native API-adapter/bundle checks do not establish actual Android device behavior. External SMTP delivery, production S3 IAM/privacy and provider delivery require separate deployment verification.
