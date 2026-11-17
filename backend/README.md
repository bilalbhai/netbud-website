# NetBud backend foundation (Phase B)

Development only. This folder is not connected to the public website. Do not deploy it, publish the repository root as static output, or enable real email/payments. No changes to FormSubmit are needed.

## Local setup

Install Node.js 22+ and pnpm. From this folder:

```sh
pnpm install --frozen-lockfile --ignore-scripts
node --test test/*.test.mjs
node local.mjs
```

Dependencies are pinned in `package.json` and `pnpm-lock.yaml`. Installation runs no package lifecycle scripts. PGlite is the disposable PostgreSQL test engine, not the production database. Tests run actual SQL/PLpgSQL/RLS, not a SQLite approximation. `test/database.mjs` supplies test-only Supabase Auth/Storage catalogue stubs, 18 synthetic catalogue configurations and five synthetic staff UUIDs. The production migrations leave products inactive. No real customers or staff accounts are seeded.

The local API listens **only on 127.0.0.1:8787**, separate from website preview port 8765. All data is in memory and discarded on exit. Ctrl+C stops it. It deliberately has no working staff HTTP login; SQL staff permissions and JWT authentication are exercised in tests. There is no local admin UI in Phase B.

Example synthetic order in PowerShell, while the local process is running:

```powershell
$testOrder = @{
  customer = @{name='Test Customer'; email='customer@example.test'; phone='0000000000'}
  items = @(@{product_id=5; quantity=1})
  delivery = 'pickup'
} | ConvertTo-Json -Depth 5
$testHeaders = @{Origin='http://127.0.0.1:8787'; 'Idempotency-Key'=[guid]::NewGuid().ToString()}
Invoke-RestMethod -Uri 'http://127.0.0.1:8787/api/test/orders' -Method Post -ContentType 'application/json' -Headers $testHeaders -Body $testOrder
```

Reusing the same key/body returns the same order. Changed payload with the same key returns 409. Only `.test` email addresses are accepted, in API and SQL. Confirmation says mock email pending; it does not mean an email was sent to an inbox.

## Source and schema

- `migrations/001_foundation.sql`: private schema, normalized relationships, constraints, RLS, immutable financial/audit records and operational limits.
- `002_operations.sql`: server-only transaction RPCs for test orders, staff retrieval/update, artwork metadata and rate limits.
- `003_outbox_storage.sql`: leased mock notification processing, attempts, retry limits, private bucket configuration.
- `004_catalogue.sql`: all 18 baseline prices, inactive until scope/tax review. Test fixture activates them only in disposable local DB.
- `005_integrity.sql`: immutable ordered-line snapshots, same-order confirmed-fund allocation limits and validated-proof/customer approval checks.
- `src/api.mjs`: Fetch API handler with bounded JSON, strict inputs, Origin checks, rate budgets, safe errors and scoped staff routes.
- `src/auth.mjs`: Supabase asymmetric JWT signature/issuer/audience/expiry validation, live user check, aal2 enforcement. No login/signup/invite endpoint. Legacy HS256 is deliberately unsupported and fails closed.
- `src/repository.mjs`: bounded-timeout server-only Supabase RPC adapter; no generic table proxy.
- `src/outbox.mjs`: mock-only dispatcher with stable event keys; real provider instances rejected.
- `worker.mjs`: future edge adapter, outside the site's `functions/` directory. Both explicit development environment and enable flag required; no deployment configuration supplied.
- `.env.example`: variable names only. Nothing here requires production credentials for local tests.

The tables cover customers, products/options, orders/items, quotes/revisions/acceptances, payments/allocations, artwork/approvals, deliveries, enquiries, staff/assignments, public history, invoices, outbox/attempts, audit, future OTP challenges/sessions and rate limits. Orders/items snapshot prices and GST classification. Monetary amounts are integer AUD cents. Private timestamps are timestamptz; future UI displays Australia/Sydney.

Database relationships are intentionally a foundation: quote acceptance workflows, payment reconciliation, per-design aggregate upload reservations, invoice issuing and production release are not exposed yet. State mutation API currently permits owner acceptance/cancellation from received state only; production cannot be started through it. Future phases must add the corresponding transaction guards before exposing more transitions.

## Endpoints and identity boundary

| Route | Behaviour |
| --- | --- |
| `POST /api/test/orders` | Synthetic guest order only; no OTP/signup. Prices, totals and shipping calculated in SQL. Idempotency key required. |
| `GET /api/staff/orders/:uuid` | Verified aal2 staff; active membership plus owner/assignment checks. Field allowlist by role. |
| `GET /api/staff/orders/:uuid/artwork` | Owner/assigned designer metadata only; no object keys or signed URLs. |
| `PATCH /api/staff/orders/:uuid` | Owner only; recent TOTP within ten minutes; accepted/cancelled only; atomic audit/outbox. |

No public OTP, customer history, upload/download/signing, payment, registration or email-send HTTP endpoints exist. Future customer sessions have private tables only, with no active policies or retrieval route. Do not mistake staff retrieval for completed customer order tracking.

Supabase service role bypasses RLS. It must live only in server environment variables; every RPC checks server-supplied identity and permissions. Public browser roles cannot execute RPCs or use the private schema. JWT `sub` is obtained from verified authentication, never customer JSON. Worker IP header is trusted only behind Cloudflare; local runner uses socket address. Cookies are not used yet; protected mutations require same Origin and Bearer authentication, with no CORS allowlist granting foreign origins.

Before any authorized Supabase staging setup, disable public Auth signup in the provider dashboard and use controlled staff invitations. Create the owner through a reviewed privileged setup step and require enrolled TOTP. A new Supabase Auth user alone has no NetBud permissions. MFA must be real provider enrollment; test JWTs are generated ephemerally in tests, never deployed. See [Supabase JWT guidance](https://supabase.com/docs/guides/auth/jwts) and [MFA guidance](https://supabase.com/docs/guides/auth/auth-mfa).

## Running migrations against Supabase later

No external migration was performed. These numbered SQL files are intended for a **new, owner-authorized isolated development project**, in ascending order, with Supabase's existing `auth`/`storage` schemas and `anon`, `authenticated`, `service_role` roles. Use a migration ledger (e.g. the Supabase local migration runner) and apply each once; do not paste test bootstrap stubs into a real project. Each file is transactional. A failed file must roll back; do not mark it applied. Restrict RPC grants and verify Storage has no inherited permissive policies before treating staging as private. Full Supabase HTTP/RLS/storage integration is an outstanding staging test.

Never run `test/database.mjs` against a real project. It is PGlite-only. Never use actual customer data in test fixtures. No staging account, owner enrollment, remote grants, Storage HTTP request or live Auth/JWKS network response was verified here.

## Limits, failure and backups

`netbud.limits` defaults: database soft threshold 400 MB, artwork budget 900 MB, requests 80,000/day, email 90/day, uploads disabled. Request budget is checked in shared SQL; 60/network/ten minutes. HMAC network identifiers expire after ten minutes; expired counter cleanup is bounded. Database capacity check is a soft admission guard, not a hard quota guarantee; reconcile provider metrics before production. Email cap includes in-flight sends; account-level usage by other applications must also be counted operationally.

No upgrades or paid APIs are configured. Storage budget is preparatory: no upload reservation or signing is issued. At capacity or a backend outage, API returns safe 503 and does not claim successful order/payment. Idempotent retry handles ambiguous order response timeouts.

Outbox state: queued -> sending under lease -> mock sent, queued retry, failed after five attempts, or uncertain. Expired leases become uncertain instead of blind duplicate sending. Retry is bounded exponential delay; lease tokens prevent stale workers acknowledging sends. Durable unique business keys suppress duplicate inserts. `sent_at` records mock acceptance only; `delivered_at` remains empty. Real provider webhooks/delivery reconciliation remain later work.

Free Supabase pausing, lack of an authorized off-site backup destination/scheduler and object backup/restore remain launch blockers. Nothing in Phase B claims a tested recovery plan. Do not put dumps, artwork or customer exports in GitHub. Code rollback: revert development commits; no database deployment exists to undo. Later real deployments require backups, forward-compatible migrations and a rehearsed recovery plan.

## Artwork blocker

Extension/MIME/size/path constraints and private bucket denial are tested. They are **not full image validation**. Reliable decoding, pixel-bomb limits, metadata stripping, runtime CPU/memory benchmarks, atomic aggregate quota reservation and authorized short-lived viewing have not been demonstrated on the proposed free edge runtime. Therefore uploads and signed viewing stay unavailable. No actual customer image is uploaded. Foundation is ready to develop the validator; unsafe uploads are not an acceptable shortcut.
