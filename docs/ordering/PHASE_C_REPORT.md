# Phase C — development guest checkout

Branch: `codex/netbud-phase-c-checkout`, based on Phase B commit `8eae4a4`. Development only; no merge/deployment, DNS, hosting, public website, PACES, catalogue prices, animations or FormSubmit changes. No customer accounts, real payments or real outgoing email.

## Implemented

Local mobile-friendly checkout uses existing NetBud CSS, logo, colours and the `netbud-quote-basket-v1` format. Customers provide name, test email and phone; business is optional. Physical orders require Australian shipping address or pickup by arrangement at 67–71 Great Western Highway, Parramatta NSW 2150. Services can coexist with fixed-price NFC items; quote-required services are shown separately without being charged.

Server catalogue and estimate endpoints read the private database. Server order creation independently calculates the actual total. Shipping is A$14.95, free at A$99 physical subtotal, with services excluded. Pickup is free, subject to confirmation. UUID-backed unique NB reference and pending-payment/pending-owner-review statuses are returned. Repeat requests with the same key replay the existing order; duplicate submissions are disabled while pending and retries retain their request key in the current page session. A payload digest and retry key (no customer fields) also survive reload in sessionStorage when available; resubmitting identical details reuses that key. If storage is blocked, do not restart an uncertain request after reload without checking the local database.

NFC personalisation captures up to five distinct designs with name/business, optional HTTPS destination and instructions. Per-product design count cannot exceed ordered quantity. Designs persist with the test order. No files are accepted: the screen explains the future two JPG/PNG files per design / 10 MB each limit and uses the send-artwork-later alternative. The email address is informational; no draft or outgoing mail is triggered.

Accessible labels, native required/email/postcode validation, focus indicators, live server summary, alert errors and focused receipt are included. Safe text nodes display catalogue/receipt data. Prices cannot be posted by the browser. Failed requests preserve customer inputs; order receipt never claims payment, artwork approval or inbox delivery.

## Local review

Install backend dependencies as described in [backend setup](../../backend/README.md), then run:

```sh
node backend/local.mjs
```

Open `http://127.0.0.1:8787/checkout/`. Use fictional information and `customer@example.test`. Choose products with the local basket editor. This deliberately does not add checkout links to existing public pages. Browser storage is origin-specific: to review a basket created on port 8765, use the checkout's import control to paste only the existing basket's product-ID/quantity JSON. Customer fields are not stored in browser storage; only basket IDs/quantities and a request digest/idempotency key are stored. No public checkout API is installed by the live site or this change. The loopback server exposes only an explicit static asset allowlist, not arbitrary project files.

## Tests actually executed

- `node --test backend/test/*.test.mjs`: **44 passed**, zero failed. Includes Phase B tests, migrations through 006, five-design persistence, excess-design rejection, unique/replayed reference and server estimate versus committed mixed-order totals. Existing order tests cover validation, duplicates, staff/private access, database and API errors, email retries, shipping and quote handling.
- Existing suites: forms **68**, hero **18**, motion **15** checks passed; no network deliveries.
- `backend/test/browser-review.mjs`: **five browser scenarios passed**, headless Edge at 375, 430, 768, 1024 and 1440 px. Each creates a synthetic mixed basket, adds design details, selects pickup, fills the required fields and receives a pending-payment receipt. Checks no horizontal overflow, no file input and no JavaScript exceptions. All external browser network traffic blocked. Desktop and mobile screenshots visually inspected.
- Browser screenshots: [375px](phase-c-screenshots/checkout-375.png), [430px](phase-c-screenshots/checkout-430.png), [768px](phase-c-screenshots/checkout-768.png), [1024px](phase-c-screenshots/checkout-1024.png), [1440px](phase-c-screenshots/checkout-1440.png). Only synthetic test data is shown.

Backend tests need loopback socket permission in restricted environments. Browser review additionally requires an installed Playwright package and Edge; set `PLAYWRIGHT_MODULE` to its installed `index.mjs` file URL if it is not installed in backend's module search path, then run `node backend/test/browser-review.mjs`. Browser screenshots are regenerated locally. No hosted provider integration or actual screen-reader session was performed; semantic/focus checks do not equal a complete accessibility certification.

## Changed files

- `backend/migrations/006_guest_checkout.sql`: customisation storage, restricted creation wrapper, server catalogue/estimate RPCs.
- `backend/src/core.mjs`, `api.mjs`, `repository.mjs`: personalisation validation and test-only estimate/catalogue handlers.
- `backend/local.mjs`: checkout/stylesheet/logo allowlisted local serving.
- `backend/public/checkout.html`, `checkout.css`, `checkout.js`: isolated guest checkout UI.
- `backend/test/checkout.test.mjs`, `browser-review.mjs`: checkout SQL/validation and responsive browser scenarios.
- This report and five screenshots under `docs/ordering/phase-c-screenshots/`.

## Blockers and next steps

Uploads remain disabled until secure image decoding, pixel limits, aggregate quota reservations, private object authorization and edge-runtime tests pass. No signed viewing/upload routes exist. All Phase B production gates remain: hosted Supabase/MFA/Storage verification, legal name/ABN/GST classifications, actual fixed-price entry scopes/options, production-safe idempotency recovery, backups/restore, capacity monitoring and provider approval. Free infrastructure is not guaranteed unlimited or permanently free.

Production catalogue migrations still leave products inactive; disposable fixtures enable them only for testing. A$39 NFC entry prices are preserved and are test fixtures, not newly approved fulfilment promises. Do not activate a production basket until scope/tax review. No extra GST is added. Existing provider and policy caveats are unchanged.

Phase D customer OTP/tracking and production integrations have **not** started. Review this development checkout before authorizing the next phase. Rollback: return to Phase B code or revert Phase C commits; there has been no hosted schema or production data change to undo. Never use destructive resets on unrelated local files.
