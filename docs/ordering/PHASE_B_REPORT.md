# Phase B — backend foundation review

17 November 2026. Branch: `codex/netbud-ordering-phase-a`. [Draft PR #1](https://github.com/bilalbhai/netbud-website/pull/1). [Branch](https://github.com/bilalbhai/netbud-website/tree/codex/netbud-ordering-phase-a).

**Development foundation only. No production deployment, merge, DNS/hosting change, real email/payment or customer registration. Phase C has not started.** Public website source, prices, styling, animations, verified FormSubmit and PACES material are unchanged from the Phase A baseline.

## Implemented

- Five transactional SQL migrations: private schema and 24 tables covering the requested entities; foreign keys/checks, default-deny RLS/grants and immutable financial/audit/ordered-price records. All 18 catalogue starting prices are preserved, inactive outside disposable test fixtures.
- Atomic synthetic order creation with authoritative prices, physical-only shipping threshold, quote-required service lines, unpaid state, queued notification and stable request idempotency. Concurrent retries create one record; changed payload cannot reuse the key.
- Staff-only scoped retrieval and owner acceptance/cancellation RPCs. Role/active/assignment checks run in SQL, not hidden buttons. Designer, fulfilment and support receive different field allowlists. Owner updates produce one audit/outbox event even on retry.
- Supabase authentication adapter validates asymmetric JWT signature, issuer, audience and expiry; calls Auth user service; requires aal2. Sensitive updates require TOTP evidence within ten minutes. No public staff registration, owner bootstrap/password or customer Auth account.
- Private artwork metadata and bucket MIME/size/path restrictions, with no browser read/write policies. No uploads or signed URLs are issued. Approval records require validated artwork and matching customer; payment allocations require confirmed funds in the same order and cannot exceed that payment.
- Mock-only email outbox dispatcher: event deduplication, leased claims, daily budget, bounded retries, attempt records and uncertain/failed states. A send timeout/expired lease is not blindly retried. Mock sent is never described as inbox delivered.
- Strict/bounded JSON, safe error codes, HMAC network rate keys, shared SQL counters/budgets and minimal failure logs. Default-off edge adapter sits outside deployed site routes. Future OTP/session tables remain private and inactive.
- Pinned dependencies, secret-free environment template, synthetic fixtures, local-only disposable HTTP runner and setup/security/schema documentation.

## Test evidence

Executed on the development machine:

| Suite | Result | Scope |
| --- | --- | --- |
| `node --test backend/test/auth.test.mjs backend/test/foundation.test.mjs` | 41 passed, zero failed | Fresh PostgreSQL/PGlite migrations, constraints/RLS/grants, synthetic orders, rollback, duplicates, roles/field isolation, real ephemeral JWT signing/validation, mocks, outbox retries, capacity, safe API errors |
| `node --test backend/test/http.test.mjs` | 1 passed, zero failed | Starts/stops loopback process, HTTP 201 -> idempotent 200, staff request 401 |
| `node scripts/check-forms.cjs` | 68 checks passed | Existing forms; network mocked |
| `node scripts/check-hero-scroll.cjs` | 18 checks passed | Existing hero invariants |
| `node scripts/check-motion.cjs` | 15 checks passed | Existing motion invariants |

Total: **42 backend tests plus 101 existing website checks**. Initial development runs exposed SQL variable/alias ambiguity; corrected before final pass. The socket sandbox initially denied loopback access; rerunning the HTTP test with local socket permission passed. No production tests or external deliveries were attempted. PGlite serializes queries: concurrent idempotency tests do not replace hosted multi-connection load/race tests.

Tests use real PostgreSQL semantics with test-only Auth/Storage catalogue stubs. They do **not** verify hosted Supabase Auth enrollment, remote JWKS fetching, PostgREST grants, inherited bucket policies, actual Storage HTTP, owner MFA recovery, Cloudflare deployment/CPU or transactional email delivery. Offline JWT tests inject ephemeral verification keys and mock the Auth HTTP response. No real secrets are in fixtures.

No new UI exists, so screenshots would show the unchanged public website rather than Phase B. Browser checkout/admin/mobile screenshot work belongs to later approved UI phases.

## Security and free-tier limits / outstanding setup

1. **Image uploads blocked:** no proven edge decoder, pixel-bomb bounds, safe re-encoding, aggregate reservation or short-lived viewing flow. Bucket metadata restrictions alone do not make images safe. Upload/signing routes stay absent until that work passes. Five maximum designs could consume 100 MB/order; free storage remains tight.
2. **Hosted authentication unverified:** owner must authorize isolated staging, disable Supabase public signup, enroll genuine TOTP and create controlled staff membership. A verified Auth user has no NetBud role by default. Legacy HS256 projects fail closed; asymmetric signing-key configuration must be confirmed. Owner/user disabling must also be exercised against actual Auth.
3. **No direct service-role exposure:** the adapter alone holds credentials. A service-role compromise remains privileged; RLS cannot protect against it. Future endpoints must use narrow RPCs and verified actors. No generic SQL/table route exists.
4. **Payments/invoices not operational:** legal name/ABN/tax classification, owner scopes and Merchant/free-host policy approvals remain unresolved. Financial tables exist but payment acceptance, invoice issuance, quote acceptance, production release and refunds have no public handlers. Records must not be presented as real sales.
5. **Backup/availability unresolved:** no authorized off-site destination/scheduler or hosted restore drill. Free DB pausing, bandwidth, CPU and storage quotas remain risks. Soft database cap is admission control, not a substitute for actual provider monitoring. Request/email limits are configured in `netbud.limits`; uploads default false. No automatic upgrades.
6. **Email remains mock:** From/Reply-To domain verification and provider acceptance/delivery need later owner-assisted testing. Original FormSubmit remains the sole public enquiry delivery route. Enquiry tables are not a cutover.
7. **Future state workflows:** current mutation API is intentionally restricted to owner review. Per-design aggregate limits, latest-proof/version approvals, latest quote acceptance, allocation reconciliation and production guards must be completed transactionally before those workflows are exposed. Customer sessions/OTP have no routes yet.
8. **Staging boundary:** source is reviewable on GitHub, not a live preview deployment. Do not publish the whole repository root; `backend/`, tests and documentation must be excluded from future static hosting output, with secrets confined to server configuration.

## Local review

See [backend README](../../backend/README.md) for installation, test commands, synthetic PowerShell request, table/endpoint descriptions, roles, configuration and migration instructions. Local server binds 127.0.0.1:8787 only; it does not touch website preview 8765. All local DB data is discarded on exit. It cannot send email or take payments.

## Exact changed files in Phase B

- `README.md`, `docs/ordering/README.md`, `docs/ordering/PHASE_B_REPORT.md`.
- `backend/README.md`, `backend/.gitignore`, `backend/.env.example`, `backend/package.json`, `backend/pnpm-lock.yaml`.
- `backend/migrations/001_foundation.sql`, `002_operations.sql`, `003_outbox_storage.sql`, `004_catalogue.sql`, `005_integrity.sql`.
- `backend/src/core.mjs`, `auth.mjs`, `repository.mjs`, `api.mjs`, `outbox.mjs`.
- `backend/local.mjs`, `backend/worker.mjs`.
- `backend/test/database.mjs`, `foundation.test.mjs`, `auth.test.mjs`, `http.test.mjs`.

Unrelated untracked `images/emoji/` and `tmp/` were excluded. Dependencies/caches, populated environment files, backups and customer data are not committed.

## Phase C readiness

**Ready for owner review and further isolated development, not production checkout.** The tested order/auth/permissions/outbox foundation is available. Before enabling artwork uploads, resolve the decoder/storage-reservation gate. Before using real providers, authorize staging and verify Supabase policies/MFA, scope/tax configuration, capacity and backups. Phase C must be explicitly approved; no public guest checkout or existing basket/form replacement is included here.

Rollback is code-only: revert the Phase B development commits or return to the Phase A commit `4b63893`; no remote schema, hosting or production data was changed. Do not use a destructive reset or delete unrelated local work. If a database is provisioned later, follow the reviewed backup/forward-migration procedure in [PLAN.md](PLAN.md), not an assumed safe down migration.
