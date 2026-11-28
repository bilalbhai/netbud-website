# NetBud staging — verified read-only review and approval request

28 November 2026. Branch `codex/netbud-full-launch`, [PR #8](https://github.com/bilalbhai/netbud-website/pull/8). **Access restored. No database changes made.** This supersedes the earlier permission-denied status in the staging setup report.

## Independently verified target

| Field | Observed value |
| --- | --- |
| Project name | `netbud-staging` |
| Project ID/ref | `pzorzppbxgqespexuers` |
| API URL | `https://pzorzppbxgqespexuers.supabase.co` |
| Region | `ap-southeast-1` (Singapore) |
| Health | `ACTIVE_HEALTHY`; health advisor returned no findings |
| Database | PostgreSQL `17.12`, provider version `17.12.0.002` |

Only the newly reconnected account link and this exact project were used. Management identity was checked before database queries. No unrelated project, PACES or live NetBud asset was accessed or changed.

## Schema and migration comparison with PR #8

- Migration history: **empty**.
- Tables in `public` and `netbud`: **none**.
- `netbud` schema: **absent**.
- `public.netbud_*` functions: **none**.
- Intended `netbud-artwork` Storage bucket: **absent**.
- Existing non-system schemas are managed/default schemas: `auth`, `extensions`, `graphql`, `graphql_public`, `public`, `realtime`, `storage`, `vault`. Managed Auth/Storage were inspected for metadata only; their user records, credentials, session tokens and object contents were not read.
- Required `auth.users.id`, `auth.sessions.id/user_id/created_at/not_after` and Storage bucket columns exist with the expected types. The `anon`, `authenticated`, `service_role` and `postgres` roles exist.
- Native `gen_random_uuid()` is present. PL/pgSQL is installed; existing pgcrypto/uuid-ossp extensions need not be reinstalled. No additional extension is proposed.
- All **14 migration files exactly match** the LF-normalised SHA-256 values already reviewed in PR #8. No existing NetBud application records or naming conflicts were found in their target namespace. There are managed platform schemas; this is not a claim that the entire database is empty.

This supports applying the original fresh-schema sequence rather than a reset or upgrade of an existing NetBud installation. No test bootstrap, reset, data seed or migration was executed.

## Actual security findings — proposed correction only

The security advisor returned two warnings for **one pre-existing function**, `public.rls_auto_enable()`:

- [Anonymous roles can execute a SECURITY DEFINER function](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
- [Authenticated roles can execute that function](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

A read-only privilege inspection confirmed both execute grants. The function is owned by `postgres`, returns `event_trigger`, uses `search_path=pg_catalog` and is attached to the enabled `ensure_rls` DDL event trigger. Its body enables RLS for new **public-schema** tables only. The advisor finding is an unnecessary permission exposure; no exploitation or customer-data access was attempted or established.

**Proposed prerequisite, awaiting approval:**

```sql
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
FROM PUBLIC, anon, authenticated;
```

The [prepared transaction](../../backend/review/proposed-staging-rls-helper-permissions.sql) changes only these execute permissions. It does not disable automatic RLS, delete/replace the event trigger, change the function body or owner, alter Auth signup settings or grant service access to browser roles. Recheck the event-trigger registration and privileges after applying; rerun advisors. No correction has been applied yet.

Public-schema default privileges currently grant table/sequence/function access to browser roles for objects created by the platform's privileged creators. This is recorded rather than silently changed: the owner-reported automatic table API setting alone is not proof of effective privileges. The NetBud plan creates private tables in its separately denied `netbud` schema and explicitly revokes browser execution on its public RPCs before each migration commits. Do **not** grant private table access or make broad project-wide default-privilege changes. Verify the resulting ACLs and every overload after migration. Automatic RLS and public signup dashboard settings are not independently verified by these metadata tools; no settings were changed.

## Exact proposed execution sequence — approval required

**Target: `netbud-staging` / `pzorzppbxgqespexuers` only.** Recheck identity and the unchanged empty NetBud namespace immediately before writing. Apply the narrowly scoped prerequisite above as a recorded migration, then the existing checksum-pinned files **one at a time**:

| Order | File under `backend/migrations/` | Purpose |
| --- | --- | --- |
| 001 | `001_foundation.sql` | Private schema, business records, constraints, RLS and immutable history |
| 002 | `002_operations.sql` | Restricted server-side order/staff/rate RPCs |
| 003 | `003_outbox_storage.sql` | Outbox and private artwork bucket; no client upload policies |
| 004 | `004_catalogue.sql` | 18 existing prices, products inactive |
| 005 | `005_integrity.sql` | Financial/artwork/snapshot integrity |
| 006 | `006_guest_checkout.sql` | Server estimates, design metadata and references |
| 007 | `007_customer_tracking.sql` | OTP/session records and scoped customer retrieval |
| 008 | `008_admin.sql` | Private administration, assignments and reporting |
| 009 | `009_admin_actions.sql` | Audited quotes, receipt evidence and fulfilment operations |
| 010 | `010_tracking_quote_totals.sql` | Accepted-quote totals for customer tracking |
| 011 | `011_launch_operations.sql` | Mail budgets, bot replay and storage/retention preparation |
| 012 | `012_integration.sql` | Staging admission, live staff sessions, manual proofs and maintenance |
| 013 | `013_manual_refunds.sql` | Verified external-refund evidence and summaries |
| 014 | `014_manual_retention.sql` | Notice/hold/evidence checks for manual retention |

The [original manifest](supabase-staging-migrations.json) pins the 14 SQL contents. Approval does not cover changed SQL or later activation. Preserve each file's transaction and record migration history. Stop on any error; confirm rollback of the failed file, retain earlier successful migrations and obtain review before corrective changes. Never reset, truncate or drop the schema to force progress. No paid resource or new project is needed.

After applying the approved schema, inspect tables/RLS, client-role denial, function grants/search paths, private Storage rules and advisors. Genuine backend/Auth/OTP/customer-isolation testing will still require controlled synthetic fixtures, owner UUID/password/TOTP and the authorised hosted runtime/provider setup. Today's hosted checks are **metadata and security inspection**, not a successful admin login, checkout or email-delivery test.

## Changes explicitly excluded from approval

- No owner account creation or role grant based solely on email; the actual UUID and owner-controlled password/TOTP steps require their own verification.
- No product activation, real customer intake, payments, email sending, upload/preview activation, production deployment, merge, DNS/MX change or public signup change.
- No live marketing site, design, price, animation, cookie preference or PACES change.

**Approval requested:** the single-function permission correction plus migrations 001–014 above on this staging project, followed by security verification. Nothing has been applied while waiting.
