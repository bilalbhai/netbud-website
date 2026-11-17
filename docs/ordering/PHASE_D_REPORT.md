# Phase D — secure customer tracking (local development)

Branch: `codex/netbud-phase-d-tracking`, starting at Phase C `307805e`. Review PR targets `codex/netbud-phase-c-checkout`, not main. No earlier PR is merged. No production deployment, DNS/hosting changes, payment activation, real emails, customer accounts, paid services, PACES edits or public animation changes.

## Implemented

The local **Track My Order** page at `http://127.0.0.1:8787/track/` requests an email code, verifies it, lists all orders linked to that verified email, expands order details/timeline, allows another code request and securely ends the session. Existing checkout remains at `/checkout/`. No public navigation or existing FormSubmit handlers changed.

Order data comes from explicit database projections: NB reference, Sydney-local date/time, items/quantity/recorded amounts, tax classification, current owner status, item payment/artwork/production states, confirmed receipts less refunds, outstanding amount, shipping/pickup, manually recorded tracking and approved customer-visible updates. Another customer's order returns not found; staff assignments, private storage keys, provider/payment references and internal audit records are never selected. Only explicit `customer_updates` are shown in the timeline, alongside the recorded order-created time. Expandable order cards provide selection/detail without putting email, codes or credentials in URLs.

Zero confirmed receipts is not called paid. No shipment record means “No dispatch or tracking has been recorded.” A stored tracking number becomes an allowlisted official Australia Post link; NetBud does not fetch or invent carrier scans. Unconfirmed tax classifications are not represented as approved GST invoices; tax-inclusive entry amounts remain unchanged. The legal-name/ABN/tax review gate still applies.

Artwork approval is explicitly unavailable. There is no preview, final-approval button, signing/upload endpoint or customer approval mutation. Future activation requires validated private artwork, authorized short-lived preview access, correct current-proof version checks and explicit approval transactions.

## Security model

- Eight-digit codes generated with Web Crypto and rejection sampling; no `Math.random`. Five-minute SQL expiry and at most five guesses, persisted even when verification fails. Correct verification consumes the challenge under a row lock and inserts the session in the same transaction. Resends invalidate earlier challenges for the email.
- Database stores a keyed SHA-256 HMAC of challenge ID + code, not the raw code; per-run secret stays server-side. Email/network limiter identifiers are also HMACs, with no raw network address recorded. Codes are not included in API responses, browser logs, URLs, source fixtures or screenshots.
- One request per email/minute, five/hour, twenty/network/hour, eighty globally/day; verification additionally capped at thirty/network/ten minutes and one thousand/day. Existing API global/network caps also apply. Suppressed email requests return the same generic 202 message and an opaque random challenge; they do not reveal whether an email has orders. Known and unknown addresses use the same request/queue/verification shape, and unknown verified addresses receive an empty history without creating a customer record.
- Generic request responses have a 150 ms minimum target delay. This reduces obvious response differences; it is not a claim of mathematically identical network timings. Account existence is not a response field. Rate-limit suppression is intentionally silent at the per-email delivery layer.
- Random 256-bit opaque session token, hashed in SQL, sent only in a `__Host-netbud-guest` cookie: Secure, HttpOnly, SameSite=Strict, Path=/, no Domain. Thirty-minute absolute expiry is checked server-side on every lookup. Login rotates/revokes the old browser session; logout revokes SQL session and expires cookie. Raw token is never exposed in JSON or JavaScript-readable storage.
- Mutations require exact Origin checks. Logout additionally requires a session-bound CSRF HMAC read through same-origin verified response. No cross-origin permission is granted. Cross-site fetches are rejected, private replies use no-store, and the local HTML has self-only CSP, no framing and no-referrer headers. The dashboard rechecks sessions periodically and after returning to a visible/restored page.
- Private schema/RLS restrictions remain; only server service-role RPCs can start/verify challenges, list scoped orders or revoke sessions. Client-supplied customer IDs never determine access. New RPC grants exclude anon/authenticated/public.

## Mock delivery and local review

Start `node backend/local.mjs`, place synthetic orders with an email such as `customer@example.test`, then open `/track/` with that same email. The runner binds only to 127.0.0.1. No real email address is accepted. The tracking factory also requires an explicit local flag and loopback origin; the edge worker does **not** install the tracking adapter.

The adapter in `backend/test/mock-otp.mjs` extends the existing mock provider. Every issued challenge queues an OTP outbox event, then passes through the existing claim/lease/finish machinery. Raw code is held only in local mock memory and an ignored local test inbox; the outbox stores the challenge reference, recipient and status, not the raw code. Missing/expired mock payloads become uncertain rather than being sent as valid codes. Real provider instances remain forbidden by the mock dispatcher.

To retrieve a **local test code**, read the ignored inbox directly from the local filesystem, never through a browser endpoint:

```powershell
Get-Content -LiteralPath backend/.cache/otp-inbox.json
```

Enter the code into the verification field. This file contains only synthetic `.test` deliveries, is created with owner-only mode where supported, is excluded by `.gitignore`, and is absent from the server's explicit asset allowlist. OS/filesystem permissions still matter: it is a development mailbox, not a secure production delivery mechanism. Expired entries are pruned every ten seconds; normal stop removes the file; forced process termination can leave an inert file until next startup, which clears it. The database and secret are ephemeral, so codes cannot survive a restart. Do not share the file or commit it. No token is written to it.

Production integration boundary: replace the local-only adapter with a verified server-side transactional provider and encrypted/short-lived delivery payload handling; ensure retries cannot send an expired code. Validate Turnstile server-side (hostname/action/replay controls) and operational quotas **before** any public tracking route is activated. No fake bot-check success has been added. Without these gates, public activation remains blocked.

## Tests executed

- `node --test backend/test/*.test.mjs`: **58 passed, zero failures** in the final sequential run. Includes 14 new tracking cases: valid/incorrect/expired/reused codes, five-attempt lockout, known/unknown response shape, per-email/network/global limits, verification quotas, single-use concurrency, multi-order lookup, empty history, cross-customer denial, session expiry/forgery/logout/CSRF, resend invalidation, field projection and truthful states, default-disabled edge access. All existing Phase B/C migrations and tests remain included.
- Existing public form/animation checks: **68 + 18 + 15 passed**. No production enquiry requests.
- `backend/test/tracking-browser.mjs`: **five scenarios passed** in headless Edge at 375, 430, 768, 1024 and 1440 px. Each uses a synthetic email and two orders; obtains code from filesystem within the test harness; confirms Secure/HttpOnly/Strict cookie and that document.cookie cannot read it; expands details; checks unpaid/no-dispatch states, no password/upload controls, no overflow/JS exceptions and revoked access after logout. External browser traffic blocked.
- Phase C `backend/test/browser-review.mjs`: **five checkout scenarios passed** again after local-server changes.
- Desktop/mobile screenshots inspected: [375](phase-d-screenshots/tracking-375.png), [430](phase-d-screenshots/tracking-430.png), [768](phase-d-screenshots/tracking-768.png), [1024](phase-d-screenshots/tracking-1024.png), [1440](phase-d-screenshots/tracking-1440.png). Only synthetic orders shown, no OTP/session token visible.

Development failures: an enumeration test initially tried cloning an already-read response; its assertion was corrected. A simultaneous browser/HTTP run caused a shared-port conflict; the final suite was rerun sequentially and passed. No unresolved test failures are being presented as passes.

Tests use PGlite PostgreSQL with local Supabase catalogue stubs; concurrency is serialized in that engine. Hosted multi-connection races, real Supabase Auth/Storage/PostgREST, external email delivery, edge CPU, full screen-reader testing and production HTTPS/domain behaviour remain unverified. Native labels, keyboard-capable forms/details, focus and live regions are implemented, but no accessibility certification is claimed. Run browser/HTTP suites one at a time because all use local port 8787.

## Changed files

- `backend/migrations/007_customer_tracking.sql`: challenge/session relationships, OTP outbox source, limited challenge/verification/scoped-order/logout RPCs and indexes.
- `backend/src/tracking.mjs`, `api.mjs`, `repository.mjs`: crypto/session/CSRF orchestration, optional adapter dispatch, RPC allowlist.
- `backend/local.mjs`, `.env.example`: local mock wiring/cleanup, allowlisted page assets and security headers; server-only configuration name.
- `backend/public/tracking.html`, `tracking.js`: responsive verification and order dashboard using existing checkout/site styles.
- `backend/test/mock-otp.mjs`, `tracking.test.mjs`, `tracking-browser.mjs`: private test delivery, security/database/API/browser cases.
- This report and five images under `docs/ordering/phase-d-screenshots/`.
- `backend/README.md`, `docs/ordering/README.md`: links to the latest local tracking review.

## Limits and next steps

Still blocked: real sender/domain verification, Turnstile integration and public abuse tests, production session secret management/rotation, durable delivery recovery, OTP/session/outbox retention jobs for a persistent database, hosted row-policy and multi-connection testing, large-history pagination/performance, legal/GST review, backups/restore and existing free-tier capacity gates. The current local database resets on exit. No claim is made that the complete production tracking system is activated or externally verified.

Proceed only after Phase D review; **Phase E has not started**. Rollback is code-only: revert Phase D commits or return to Phase C. No hosted schema, live customer data or production configuration was changed. Do not merge or deploy without owner approval.
