# RevuPing implementation progress

The repository template is the UI reference. Real workspaces never receive demo records or simulated integration success. Admin remains deferred. Each phase receives a scoped commit after sequential checks and rendered browser inspection; nothing is pushed.

## Completed before this continuation

- Authentication, verification, web/native sessions, workspace authorization and branded onboarding: existing implementation.
- Phase 4 QR Studio, private customer feedback intake and public branded pages: `23d9b098efb60edd6d11dc09c9f7bbf89682ad03`.
- QR template parity and export/preview/retry verification: `1d3133c248924cbc7a00de9add19ae929bf9638d`.
- Detailed configuration and verified limitations: [QR Studio](phase4/QR-STUDIO.md), [authentication](AUTHENTICATION.md), [security audit](security/AUDIT-2026-10-04.md).

## Sequential continuation

1. Feedback Inbox: authorized search/pagination, persistent team notes, assignment, priorities, due dates, resolution and activity history; web/native integration.
2. Business/location/team settings and customer records/consent.
3. Requests, campaigns and reminders with a separate durable worker.
4. Review integrations and provider configuration boundaries.
5. Surveys/referrals and remaining non-admin template tools/insights.
6. Billing boundary, setup documentation and final regression/manual review checklist.

This sequence follows the existing non-admin template. Features requiring external provider access must show an honest unconfigured state until configured and verified. Any scope clarification will be recorded here.

## Current phase

Feedback Inbox commit: `4910823a9291a924269d671b36751f151bbc18fb`.

Feedback Inbox implemented and verified: real authorized web/native integration, search/status/overdue and pagination, immutable notes, assignments/priorities/dates/tags, revision-protected resolve/reopen, paginated activity and conflict recovery. See [phase details and commands](FEEDBACK_INBOX.md).

Verification: additive migration; all 29 sequential check tasks; sequential production builds; real API and Playwright inbox journey; actual native API adapter against the backend; desktop/mobile (1280/390) light/dark default/hover screenshots inspected against the template; Android JavaScript export; two existing Chromium smoke tests. No actual Android device/emulator verification.

Business/location/team settings implemented and verified: revision-protected business profile/logo, extra locations with stable links and archive/restore, owner/staff membership management and last-owner protection, secure verified-email invitations and genuine SMTP failure/resend recovery, notification preferences/templates, paginated team/inbox staff choices and business-timezone overdue handling. See [business/team details](BUSINESS_TEAM.md).

Verification: additive migration; all 29 sequential workspace check tasks; sequential production builds; real PostgreSQL/API/Mailpit settings journeys, native API adapter, 29-member pagination, owner/staff/join browser flows and preserved drafts after failure; 1280/390 light/dark settings/template/dialog screenshots visually inspected; default/hover dimensions stable, client navigation preserves the document; inbox regression; Android JavaScript export; two Chromium smoke tests. No actual Android device/emulator verification. SMTP acceptance is not recipient delivery. Preferences/templates do not yet dispatch customer messages.

Next: customer records/consent; then the remaining sequential phases above.

## Configuration and outstanding limits

PostgreSQL, Redis, Mailpit and MiniStack remain separate local services. Production S3 compatibility is not established by emulator tests. Real external credentials are not assumed. Native bundle checks and browser tests do not establish actual Android runtime behavior. Local environment files and the pre-existing generated Next declaration change are excluded from commits.
