# Phase E — private admin development review

18 November 2026 (Australia/Sydney). Branch: `codex/netbud-phase-e-admin`, based on Phase D `6816dff`, verified against the latest remote branch before work. The draft review targets `codex/netbud-phase-d-tracking`. No previous development PR was merged.

**Local development only. No production deployment, DNS/hosting change, real outgoing email, gateway payment, customer registration, paid service or PACES/public animation change. Phase F has not started.**

## Timing correction first

Confirmed the Phase D bug: `Math.max(0,150-Date.now())` compared a duration with an epoch timestamp and effectively skipped the intended delay. Corrected to `Math.max(0,150-(Date.now()-started))`. A new timing test measures the elapsed fast-request response and asserts the intended approximately 150 ms minimum. Existing tracking security tests were rerun before admin work. Timing is only a mitigation; it does not provide complete email-enumeration protection or identical network timing. The original generic responses, rate limits and verification requirements remain necessary.

## Implemented workspace

`/admin/` is served only by the existing loopback development runner. It reuses NetBud's logo, fonts/style tokens, coral/ivory palette and responsive controls, with a horizontally scrollable Excel-style table instead of a framework rewrite.

- **Overview:** real local counts for received/awaiting acceptance, payment/artwork queues, processing, physical items ready to dispatch, completed orders and new enquiries. Confirmed receipts less confirmed refunds are received revenue; unpaid orders and refund approvals are not revenue/refund transfers. Outstanding balances use current accepted quotes and recorded receipts.
- **Orders/tasks:** search (reference, customer/contact/product where permitted), status filters, sorting, 20-row pages and bounded server page sizes. Owner sees contact, product, amount/received/outstanding, status, assignments and tracking columns. Other roles see assigned tasks with field allowlists. Selecting an order opens readable details, item states, recorded quotes/payments/refund approvals, necessary shipping data and role-scoped notes/design instructions.
- **Owner actions:** accept/reject, assign existing staff, draft/prepare/revise quotes, record written approval for the current valid prepared quote version, request artwork/payment, prepare email drafts, queue mock updates, record attested manual receipts, approve (not process) refunds, authorize valid item progress and complete eligible orders.
- **Quotes:** immutable versions, scope, deposit, optional labelled payment stages, default 14-day validity (bounded owner setting 1–90 days). A draft is not approval. Older accepted versions remain intact. Preparing a revision queues a mock event; accepting the latest specific version requires evidence. Only accepted versions affect billable totals and customer tracking. No real payment link or final GST invoice is generated.
- **Payments:** owner attestation and evidence reference required; amounts bounded by outstanding balance; immutable records/allocations; unique manual receipt evidence and request idempotency prevent accidental duplicate recording. Partial deposits do not mark an item paid. These are synthetic manual bookkeeping actions, not bank verification or money movement. Refund approval records do not change receipts or send funds.
- **Production:** database triggers enforce owner acceptance, valid quote/payment allocation and artwork dependencies. Service workflow can progress after requirements are met. Physical production remains blocked while artwork validation is disabled. There is no final artwork approval button or invented preview. Tests alone simulate validated/approved proof records to exercise the future guarded physical path.
- **Dispatch/pickup:** assigned fulfilment or owner can create ready shipment records after approved production, then record Australia Post tracking/dispatch time or confirmed pickup collection. Shipment-item quantities support partial dispatch and prevent overshipment. Pickup collection requires explicit confirmation. Customer tracking shows recorded shipment information and dates; no carrier API or invented delivery events.
- **Enquiries:** owner-only synthetic intake, owner/assigned-support table with customer/contact/message/source/form/status, assignment and New/Contacted/Quoted/Closed workflow. The live FormSubmit path is untouched. No public intake cutover is enabled.
- **Communication:** Email Customer, Request Artwork, Prepare Revised Quote, Request Payment, Order Update and Tracking Details controls. Drafts include recipient/reference/subject/body and can be opened manually in an email app. Draft-prepared, mock-queued and delivered are distinct: no real delivery is claimed or sent.
- **Staff:** owner assigns tasks, prepares invitation drafts and changes existing non-owner staff permissions/active state. Draft invitations do not create Auth users or grant access. No public signup, fixed password or owner-role grant exists. Actual provider invitation/enrollment remains external setup.
- **Reports/CSV:** monthly order counts (Sydney time), confirmed receipts, pending balances, product demand, enquiry/shipping queues, refund approvals versus confirmed refunds, and recent staff audit actions. Tax classification/base-amount fields are preparatory; no definitive GST on unverified classifications. Owner-only financial CSV export is paginated and audited. Download the required pages; the UI labels it a page export rather than pretending it contains every order. Formula-leading text is neutralized and cells quoted; export dates are explicitly labelled created_at_sydney.

## Authentication and security

Existing Supabase staff verification architecture remains: signed token/issuer/audience/expiry checks, live user validation, aal2 and active staff membership. The new handler accepts that server authentication boundary, but **no hosted Supabase admin UI/session is activated**. The edge worker does not install the local admin adapter.

For isolated testing, the loopback runner generates cryptographically random, one-use, role-bound capabilities into an ignored local file. No browser role picker, shared password, static token or arbitrary actor override is available. Capabilities expire after ten minutes and are consumed at exchange. Local sessions last thirty minutes, use hashed token lookup and Secure/HttpOnly/SameSite=Strict `__Host-` cookies. Writes and exports require recent (ten-minute) authentication assurance. Local assurance is explicitly synthetic, not proof of actual MFA enrollment. Real owner/staff must enroll and verify Supabase MFA before any public admin activation.

All reads/mutations enforce role/assignment in SQL as well as the API. Owner-only amounts/refunds/exports/permissions cannot be unlocked by changing HTML. Disabled staff are checked again. Staff notes are owner-readable and otherwise limited to the author; customer history never selects these notes. Financial/provider evidence is owner-only. Mutations require same Origin, cookie-bound CSRF and stable idempotency keys; a reused key with changed data conflicts. Bearer-based future provider integration has no ambient-cookie authorization and still requires the exact Origin. Inputs, JSON body sizes, page sizes and quantities are bounded. Queries use RPC parameters and sorting allowlists. A candidate-source credential-pattern scan checked 54 text files with no findings; report/setup links were also checked. This is a targeted check, not a guarantee against every secret format. Existing network/global limits remain; admin requests have a separate 180/network/ten-minute budget and a tighter local-session exchange budget.

Audit events contain actor/action/order and necessary target identifiers/permission metadata, not OTPs, capability values, raw request bodies or banking evidence. Financial, quote and audit history is immutable where appropriate. No customer-controlled HTML is rendered. CSV exports guard formula injection. Logout clears private UI state and server session; periodic/visibility checks clear expired access. The local runner's asset allowlist excludes capabilities, environment files, SQL, backups and private inbox data.

## Local preview

Install the existing pinned backend dependencies per [backend setup](../../backend/README.md), then:

```sh
node backend/local.mjs
```

Open `http://127.0.0.1:8787/admin/`. In another local PowerShell terminal, obtain the synthetic owner's one-use token:

```powershell
(Get-Content -Raw -LiteralPath backend/.cache/admin-access.json | ConvertFrom-Json | Where-Object role -eq 'owner').token
```

Paste it into the local login field. For staff tests select designer, fulfilment or support in the filesystem command, not in the browser. Use `/checkout/` to create fictional `.test` orders, then refresh the admin Orders view. Invitations remain drafts. Do not enter real bank receipts or real customer data.

The file is ignored, not HTTP-served, and created with restrictive mode where supported; OS/filesystem permissions still matter. Do not share it. Each token works once. Normal shutdown removes it; forced termination can leave an inert file that the next startup overwrites. Restarting creates new capabilities **and discards all local database/session data**. The local test database, authentication and OTP secret are ephemeral. After ten minutes, sensitive actions require a fresh synthetic session; no production MFA refresh is simulated.

## Tests and evidence

Final command set:

```sh
node --test backend/test/*.test.mjs
node scripts/check-forms.cjs
node scripts/check-hero-scroll.cjs
node scripts/check-motion.cjs
```

Final results: **75 backend/security tests passed, zero failures**. Existing public suites passed **68 form + 18 hero + 15 motion checks (101 total)**. Admin browser review passed five responsive owner layouts, the quote-stage/CSV scenario and three staff-role scenarios; five tracking and five checkout browser regressions also passed.

The backend suite includes 16 admin cases plus the timing regression and all previous Phase B–D tests. Cases cover owner/staff/assignment denial, unauthorized prices/refunds/role grants, acceptance/rejection, request replay and audit uniqueness, immutable quote versions/specific approval, manual receipt/deposit integrity, production/payment/artwork guards, completed service workflow, synthetic enquiry assignment/filtering, drafts versus mock queues, staff invitation non-activation, formula-safe audited exports, private one-use local sessions/CSRF/logout, synthetic validated partial shipping, customer quote-total projection and stale/aal1 authentication denial. These were executed locally; no remote service testing is inferred from them.

Browser commands (run **sequentially**, since each starts/stops port 8787):

```sh
node backend/test/admin-browser.mjs
node backend/test/tracking-browser.mjs
node backend/test/browser-review.mjs
```

They require an installed Playwright package and Edge; set `PLAYWRIGHT_MODULE` to the installed package's `index.mjs` file URL if necessary. External browser network traffic is blocked. Admin tests cover owner at 375/430/768/1024/1440 px, no document overflow, private Secure/HttpOnly cookie, acceptance detail, payment-stage quote form/preparation, actual synthetic CSV download, and designer/fulfilment/support report denial and restricted task lists. Tracking and checkout browser regression scenarios cover the same five widths. Screenshots contain synthetic data only; no login capability, OTP or session token is shown.

Review images: [375px](phase-e-screenshots/admin-375.png), [430px](phase-e-screenshots/admin-430.png), [768px](phase-e-screenshots/admin-768.png), [1024px](phase-e-screenshots/admin-1024.png), [1440px](phase-e-screenshots/admin-1440.png). Desktop and mobile were visually inspected. Earlier phase screenshots regenerated by regression tests are excluded from this change.

Development failures corrected: a reserved SQL alias initially prevented migration parsing; it was renamed before tests passed. The browser's separate API request context did not send the Secure cookie over loopback HTTP; permission assertions now use same-origin browser fetch and pass. These are not reported as successful initial runs. No actual screen-reader audit, hosted multi-connection race/load test, provider MFA, real email, bank verification or carrier API test was performed. PGlite serializes concurrent queries. Timing delay does not guarantee full enumeration resistance.

## Changed files

- `backend/src/tracking.mjs`, `backend/test/otp-timing.test.mjs`: elapsed-time fix and minimum-delay regression.
- `backend/migrations/008_admin.sql`, `009_admin_actions.sql`, `010_tracking_quote_totals.sql`: private admin structures/indexes, projected reporting, role-checked transactional actions, workflow guards, immutable history and safe customer totals/shipment fields.
- `backend/src/admin.mjs`, `api.mjs`, `repository.mjs`: authorization/session/CSRF/validation, CSV, bounded RPC dispatch and error mapping.
- `backend/local.mjs`: private local capabilities and allowlisted admin assets; no edge deployment adapter activation.
- `backend/public/admin.html`, `admin.css`, `admin.js`: dashboard/table/forms; `tracking.js`: show recorded dispatch date when available.
- `backend/test/admin.test.mjs`, `admin-browser.mjs`: database/API/security and responsive browser cases.
- `backend/README.md`, `docs/ordering/README.md`, this report and five `phase-e-screenshots/` images: current review/setup/evidence.

## Limitations and Phase F readiness

**Ready for review and further authorized sandbox work, not production.** No new dependency, subscription or paid upgrade is required. Previously documented free DB/storage/request/email limits and pausing remain assumptions to recheck before launch; indexes and bounded pages suit the intended small business workload, but no 100-orders/month hosted capacity guarantee is claimed.

Unresolved: hosted Supabase staff signup/invite configuration, genuine MFA enrollment/recovery and session refresh; authenticated production admin routing; legal identity/ABN/tax review; sender/domain/Turnstile verification; secure artwork decoder/private preview/approval; backup/restore and persistent request/session/notification retention; real payment reconciliation/refund processing. Ready shipment quantity reservations are intentionally strict; editing/cancelling an existing reservation is not exposed. Manual receipt evidence and external quote approval are owner attestations, not automatic bank or customer-signature validation. CSV is page-based; broader customer/enquiry export tooling remains future work. Monetary records retain history; no policy/retention approval is implied.

**Phase F must wait for owner approval**, Revolut Merchant/sandbox access and the prior hosting/payment-policy gates. Do not create actual payment links, process refunds, issue final tax invoices, enable physical artwork approval, merge PRs, change DNS or deploy this branch. Rollback is code-only (revert Phase E commits or return to Phase D); no hosted schema or production records were changed. Do not reset/delete unrelated workspace files.
