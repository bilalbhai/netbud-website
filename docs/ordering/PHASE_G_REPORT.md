# Phase G — launch preparation without Revolut

18 November 2026, Australia/Sydney. Development branch: [`codex/netbud-phase-g-launch-prep`](https://github.com/bilalbhai/netbud-website/tree/codex/netbud-phase-g-launch-prep), based on verified Phase E commit `cdb1b99732997237fa03156668e4c8086ff44179`. Draft review targets `codex/netbud-phase-e-admin`.

**Phase F is postponed. No merge, deployment, DNS/hosting/forwarding change, real email, payment, customer submission, production storage or PACES modification. Public website assets, pricing, animations and verified FormSubmit remain unchanged.**

## Result and readiness

Local launch preparation is reviewable. **The ordering system is not ready for public activation.** Email, bot verification and staging administration have server integration candidates with default-off boundaries; real provider/hosting verification remains external work. Image uploads, final artwork approval, actual retention deletion and tax invoice issue remain blocked. An unpaid/manual-payment launch does not depend on Revolut, but still depends on the hosted security, business and recovery gates below.

The owner supplied **NetBud** as the business name, will provide ABN later, and supplied **sales@netbud.com.au**. It is retained as Reply-To. A distinct personal Gmail forwarding destination and reviewed GST classifications have not been supplied; there is no self-forwarding change or invented ABN/legal entity.

## Implemented preparation

### Transactional email and OTP

- Resend is the selected free-tier integration candidate after comparing current primary provider documentation with Brevo. Rationale, free allowances and precise account-dependent GoDaddy instructions are in [email setup](EMAIL_DNS_SETUP.md). No measured reliability superiority is claimed.
- Server-only Resend adapter uses the requested sender and Reply-To, a recipient allowlist and explicit sending/domain-verification/owner-approval gates. Default remains mock. No key is added to the public site or repository.
- Existing outbox events render plain-text order receipt/acceptance/cancellation, prepared quote versions, owner-prepared payment/artwork/status/tracking messages and retention notices. Customer messages never select staff notes, private object paths or banking evidence. Missing prepared content fails rather than inventing details. Quote amounts/scopes come from the recorded specific version.
- A reusable durable OTP delivery adapter attaches an AES-GCM encrypted transport envelope to the existing HMAC-verified challenge/outbox. Challenge ID authenticates the envelope. Existing five-minute expiry, attempt limits, resend invalidation, generic responses, secure cookies, CSRF, session expiry and customer isolation remain intact. Public real-email requests stay disabled; the existing `.test` restriction is preserved.
- The launch dispatcher rechecks challenge and lease immediately before handing off. Expired, consumed, superseded or missing-payload OTPs are not sent. Ciphertext is removed on terminal completion/expiry; no code appears in production responses or logs. A separate transport key must be held server-side.
- SQL claims serialize budgets and leases, prioritise OTP and reserve twenty daily slots for it. Conservative limits are 90 attempts/day and 2,700/month; every attempt costs budget. Explicit 429 rejections can retry with stable message identity, bounded backoff and five-attempt maximum. Timeout, 5xx/malformed success and expired leases are uncertain. Automatic retry stops before the provider's 24-hour idempotency window expires.
- API acceptance is a separate state from actual provider delivery. Default-off webhook integration verifies the raw-body HMAC signature and five-minute timestamp tolerance, deduplicates events and records delivery/bounce/failure. An unknown provider ID requests retry for a send-response/webhook race. A later old delivery event cannot erase a recorded bounce/failure. Real inbox placement and provider webhook operation are **not verified**.

### Bot protection and admin

- Shared Turnstile verifier checks server response success, exact hostname/action, challenge age and database replay hash, with network failure handled safely. Optional API guard boundaries cover guest order creation, OTP requests and future public enquiry/upload endpoints. Those new endpoints remain unpublished; local regression mode intentionally omits the external widget. FormSubmit is unchanged.
- Staging-only admin candidate permits authenticated `/api/admin/` operations, rejects local capability exchange and guest routes, and defaults to disabled. It reuses Supabase signed JWT/live-user verification, aal2, staff membership/assignment and fresh MFA checks for sensitive mutations/exports. No public synthetic login or role-header bypass is added.
- Owner-only operations RPC/GET exposes queue counts, conservative budget usage, DB/storage/reservation capacity and retention failures without recipient/code details. All new tables have RLS; only narrowly allowlisted service-role RPCs are callable. Existing admin orders, financial controls and staff scopes are retained.

### Manual payments, storage, retention and recovery

- Existing unpaid order/owner review/manual receipt/partial balance workflows are retained and regression-tested. The receipt email says payment instructions follow review. Owner-prepared payment instructions do not mark an order paid; verified manual evidence and existing SQL payment/artwork/acceptance guards still control production. No bank details, payment links or gateway were invented.
- Private artwork reservations add serialized aggregate capacity checks, ten-file/order admission, maximum 10 MB/file, expiry and idempotent reservation retries. Tests activate this only in disposable fixtures. **No upload permission, image decoder, reservation-to-object conversion or customer signer is activated.** File signatures, safe re-encoding/pixel limits and free-runtime resource feasibility remain unverified, so email-artwork remains the alternative.
- Retention preparation queues a single proposed notice at day 83. Dry deletion candidates require completion at least 90 days ago, a delivered notice at least seven days ago and no legal hold. No objects or financial records are deleted. Actual object deletion and hold/deletion fencing remain blocked on hosted storage tests; the jobs/failure fields are foundations, not a running cleanup service.
- Encrypted PGlite fixture backup/restore includes a database archive and hashed private-byte manifest. A fresh-engine restore verifies an order, a synthetic confirmed receipt, outbox records and private bytes; wrong keys and tampering are rejected. **This does not verify hosted Supabase/Postgres/Auth/MFA/Storage recovery.** The practical export/object-copy/off-site/restore runbook explicitly preserves that launch blocker.
- Prepared [invoice and consumer/privacy policy drafts](POLICY_AND_INVOICE_DRAFTS.md), including the proposed correction of outdated no-GST wording. No final tax calculation, document issue or public wording change occurs while ABN/legal identity/classifications remain pending.

## Schema and integration notes

Migration `011_launch_operations.sql` adds outbox encrypted payload, launch-managed flag, first attempt/acceptance timestamps and explicit delivery states; private mail budgets/events, bot replay hashes, artwork reservations and retention jobs; owner operations and service-only launch RPCs. Legacy mock sending remains compatible and cannot claim launch-managed messages. Outbox provider IDs and global admin request business keys are unique. Existing immutable quote/payment/invoice/audit structures remain intact.

No scheduler, public worker route or Supabase project was created. `backend/staging.mjs` and the email/webhook adapters require deliberate later wiring; adding environment values alone is insufficient to launch them. Scheduled expiry/dispatch, durable provider reconciliation, suppression handling and real-host auth/login/MFA setup are outstanding. No real browser challenge, multi-connection hosted concurrency/load test, screen-reader audit, carrier API or bank verification was performed.

## Tests actually executed

Final backend command:

```sh
node --test --test-concurrency=1 backend/test/*.test.mjs
```

**99 passed, 0 failed**: 75 existing checks plus 24 Phase G cases. PGlite executes all migrations and actual SQL/PLpgSQL against synthetic Supabase catalogue stubs. Provider HTTP is mocked; no network email was sent. New cases cover encrypted OTP transport and current handler integration, expiry/consumption, default-off/allowlist gates, actual response-shape/error handling, retries/leases/budgets, recorded notification contexts and private-note exclusion, signed webhook/deduplication, Turnstile failure/action/host/age/replay, protected intake boundaries, staff/anonymous operations denial, reservation limits, hold-aware dry retention, staging capability rejection and authenticated encrypted recovery.

Existing public checks executed:

```sh
node scripts/check-forms.cjs
node scripts/check-hero-scroll.cjs
node scripts/check-motion.cjs
```

**68 form + 18 hero + 15 motion checks passed (101 total)**. These verify the existing code/behaviour invariants and mocked forms, not new real inbox delivery.

Browser suites executed sequentially using Playwright and installed headless Edge, with external requests blocked:

```sh
node backend/test/admin-browser.mjs
node backend/test/tracking-browser.mjs
node backend/test/browser-review.mjs
```

All passed at **375, 430, 768, 1024 and 1440 px**. Admin additionally checked designer/fulfilment/support restrictions, quote stages and CSV download; tracking checked private sessions, isolation/truthful states/logout; checkout checked mixed baskets, personalisation, pickup, no file input and receipt. New synthetic admin regression evidence was visually inspected: [mobile](phase-g-screenshots/admin-regression-375.png), [desktop](phase-g-screenshots/admin-regression-1440.png). Existing phase images regenerated by tests were restored; public UI remains unchanged.

Development failures were corrected before the final pass: PostgreSQL rejected an oversized regex repetition and an ambiguous record/SQL alias in the new migration. A parallel full-suite rerun later hit the existing HTTP runner's ten-second startup timeout under local CPU contention; the final full suite ran sequentially and passed, without weakening the HTTP test or asserting that the failed run passed. Hosted concurrency remains a separate test requirement.

## External setup and launch blockers

1. Owner-verified Resend account/domain/DNS, least-privilege server secrets, allowlisted controlled real test, signed webhook and owner-confirmed received mail. Preserve incoming root MX/forwarding. Separate Gmail destination still pending.
2. Reviewed zero-subscription hosting migration and same-origin HTTPS API/security headers/routes. GitHub Pages' commercial restrictions require resolution; no migration is performed here.
3. Actual Supabase staging project, private staff provisioning/MFA/login UI, RLS/Storage/auth revocation tests, trusted network identity and multi-connection quota/idempotency testing. Public real-address OTP/checkout restrictions must not be relaxed before this sign-off.
4. Real accessible Turnstile widget/reset integration, exact host/action mapping and hosted abuse tests on every new public intake path.
5. Safe image processing, preview authorisation, reservation conversion, orphan reconciliation, aggregate quota accounting and hold-fenced deletion. Keep uploads/approval/deletion disabled until verified.
6. Owner-controlled encrypted off-site backup destination/key handling, scheduler, actual hosted database/private-object/Auth restore drill and recorded recovery objectives. Free-tier pauses/limits mean no unattended availability guarantee.
7. Verified legal seller/ABN/GST classifications and approved consumer/privacy/invoice wording before final tax information is issued/published. Keep existing gross prices unchanged.

Read [operations and free-tier safeguards](OPERATIONS.md) and [email/DNS setup](EMAIL_DNS_SETUP.md) for specific steps and primary provider references. No new subscription or automatic paid upgrade is enabled. Do not start Phase F or another phase, merge or deploy without approval.

## Changed files

- `.gitignore`: private backup outputs excluded.
- `backend/.env.example`, `backend/README.md`: secret-free server setup and preparation links.
- `backend/migrations/011_launch_operations.sql`: private launch schema/RPCs and compatibility guards.
- `backend/src/launch-email.mjs`: sealed OTP, templates, mock/Resend adapters, dispatcher and signed webhook candidate.
- `backend/src/bot-protection.mjs`: reusable Turnstile boundary.
- `backend/src/backup.mjs`: isolated encrypted fixture recovery proof.
- `backend/staging.mjs`: default-off authenticated staging admin candidate.
- `backend/src/api.mjs`, `admin.mjs`, `repository.mjs`: optional bot hook, owner operations and explicit RPC allowlist.
- `backend/test/launch.test.mjs`: 24 synthetic launch preparation cases.
- `docs/ordering/README.md`, `PHASE_G_REPORT.md`, `EMAIL_DNS_SETUP.md`, `OPERATIONS.md`, `POLICY_AND_INVOICE_DRAFTS.md`.
- `docs/ordering/phase-g-screenshots/admin-regression-375.png`, `admin-regression-1440.png`.

## Local review

Use existing pinned backend dependencies and setup instructions in `backend/README.md`. `node backend/local.mjs` serves the unchanged isolated `/checkout/`, `/track/` and `/admin/` review on port 8787. Obtain the synthetic one-use admin capability from the ignored local file as documented in Phase E. Use `.test` addresses only. No real credentials are needed. For browser suites set `PLAYWRIGHT_MODULE` to your installed Playwright `index.mjs` file URL if it is not on the module path. The local runner never selects Resend or a hosted Supabase project; all local data is disposable.
