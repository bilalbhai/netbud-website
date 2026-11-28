# NetBud staging database review — approval not yet requested

**Access-restored update, 28 November:** the reconnected account now confirms the exact healthy project and its empty NetBud namespace/migration history. One existing RLS-helper permission warning needs a proposed correction. See [the verified read-only findings and approval request](SUPABASE_READ_ONLY_REVIEW.md). The earlier connection-failure details below are historical. No migrations or settings changes have been applied.

28 November 2026. Branch `codex/netbud-full-launch`, [draft PR #8](https://github.com/bilalbhai/netbud-website/pull/8). NetBud only. No production website, prices, animations, DNS, mail routing or PACES changes.

## Connection and actual database status

Authorised target supplied by the owner:

- Name: `netbud-staging`.
- Ref: `pzorzppbxgqespexuers`.
- URL: `https://pzorzppbxgqespexuers.supabase.co`.
- Free plan and Singapore region: **owner supplied, not independently verified**.
- Data API enabled, automatic table API access disabled, automatic RLS enabled and public Auth signups disabled: **owner supplied, not independently verified**.

The two connected Supabase account links, labelled Supabase and Primary, both rejected read-only `get_project` and `list_migrations` requests for this exact ref with **“You do not have permission to perform this action.”** The migration-history check also rules out assuming that only the account-level metadata tool was unavailable. No other project's database was inspected or used. Documentation search works, but it is not proof of project access.

Therefore schema, existing rows, migration history, Auth users, grants, policies, project health and region remain **UNKNOWN**. This report does not assert that the database is empty. No hosted SQL, migration, owner creation, role assignment, invitation or hosted security test was executed. **Applied migrations: none by this task.** No secrets were requested, saved or committed.

## Reconnect the intended account

1. Open the [exact project dashboard](https://supabase.com/dashboard/project/pzorzppbxgqespexuers) yourself. Confirm its name/ref in **Project Settings → General**. Use the Supabase login that owns or is authorised for this project's organisation.
2. Open the Supabase plugin's connected-app/account settings in Codex/ChatGPT and reconnect that account. In the authorisation screen, include the organisation/project containing `netbud-staging`; a connection scoped to another project will not work. Do not grant unrelated project access. Use read-only access for inspection where supported. Database-write permission will be needed later, only after the migration plan is approved.
3. Return here and say the connection is ready. I will repeat only this project's identity/health check before database access. Do not paste access tokens, passwords, connection strings or service-role keys.

The provider's [MCP setup guide](https://supabase.com/docs/guides/ai-tools/mcp) supports project-scoped/read-only connections. If you deliberately use the separate CLI integration rather than the existing app connection, its documented OAuth setup is `codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=pzorzppbxgqespexuers&read_only=true"`, then `codex mcp login supabase`. Do not create a duplicate connection unnecessarily. Reauthorise the current app connection first.

## Concrete proposed migration plan — conditional on hosted preflight

**Do not execute yet.** First establish management identity `pzorzppbxgqespexuers`, `netbud-staging`, active health and the owner-supplied settings. Read migrations, tables, grants, policies, event triggers and advisors. Use [the read-only preflight](../../backend/review/staging-preflight.sql), then inspect the intended bucket only if `storage.buckets` exists. The metadata script does not read customer records or alter anything; the project identity must come from management access, not `current_database()`.

An empty NetBud namespace is required: no `netbud` schema, conflicting `public.netbud_*` functions or `netbud-artwork` bucket. Existing unrelated objects are not migration targets. If there is existing NetBud data/history or unexpected default grants/event-trigger effects, stop and reconcile rather than reset, drop or rerun. Confirm owner-managed settings in the dashboard where the integration cannot expose them.

After preflight, present the exact target, observed current state and checksum-pinned sequence below for **explicit owner approval**. Approval to inspect is not approval to migrate, provision the owner, activate products, allow real emails or deploy.

| Order | Exact file in `backend/migrations/` | Result / dependency |
| --- | --- | --- |
| 1 | `001_foundation.sql` | Private netbud schema, business tables, limits, constraints, immutability, RLS/revocations. Requires managed Auth users and standard roles. |
| 2 | `002_operations.sql` | Scoped staff/order/rate RPCs, service-role execute only. Depends on 001. |
| 3 | `003_outbox_storage.sql` | Outbox lease/retry RPCs and **private**, 10 MB JPG/PNG artwork bucket. Requires managed Storage; no client upload policies. |
| 4 | `004_catalogue.sql` | 18 unchanged advertised product/pricing configurations, all inactive and tax classifications unconfirmed. |
| 5 | `005_integrity.sql` | Allocation, customer/artwork and immutable line-snapshot guards. |
| 6 | `006_guest_checkout.sql` | Up to five design records, authoritative estimate/catalogue wrappers and order references. Renames/restricts base creator. |
| 7 | `007_customer_tracking.sql` | OTP/session/outbox relationships, limited single-use verification and customer-scoped order projection. |
| 8 | `008_admin.sql` | Assignments, quotes/refund approvals/notes, read/report RPCs and production/completion guards. Private admin view, no browser grants. |
| 9 | `009_admin_actions.sql` | Audited/idempotent owner/staff actions, versioned quotes, independently verified manual receipts and dispatch. |
| 10 | `010_tracking_quote_totals.sql` | Customer totals use accepted quote versions and recorded shipping, not draft amounts. |
| 11 | `011_launch_operations.sql` | Encrypted mail transport metadata, budgets/webhooks, bot replay and reserved storage/retention rules. No schedule or delivery activation. |
| 12 | `012_integration.sql` | Staging email admission, live Auth-session/30-minute check, manual-proof evidence and maintenance. Requires `auth.sessions` columns and reviewed function ownership. |
| 13 | `013_manual_refunds.sql` | Immutable confirmed external-refund evidence and corrected customer payment summaries. |
| 14 | `014_manual_retention.sql` | Delivered-notice/legal-hold gates and owner-attested external artwork deletion records; does not delete external bytes. |

[Checksum manifest](supabase-staging-migrations.json) records SHA-256 of each file after CRLF→LF normalisation. Any changed SQL requires a refreshed review/approval. Apply **one file at a time in order**, preserving each file's transaction and recording successful migration history through the authorised migration tool. Never run `backend/test/database.mjs`, reset/seed scripts or test-only Auth/Storage stubs on Supabase. Do not wrap all 14 files into an untracked paste.

If a file fails: stop immediately, confirm rollback/history and inspect the error. Previously committed files remain; there is no approval to drop the schema or erase data. Additive or amended unexecuted SQL must be reviewed before resuming. Files 006/012/013 rename/wrap functions; 007/011 replace NetBud constraints; 012 replaces a NetBud trigger; 012–014 use guarded `pg_get_functiondef` substitutions that must match the earlier version or fail. These are scoped changes to newly created NetBud objects, not database resets.

## Compatibility and permission review

- Native PostgreSQL `gen_random_uuid()`, JSONB, PL/pgSQL, advisory locks, partial indexes, row locks and built-in hashing are used. No migration installs pgcrypto or another extension. Confirm actual PostgreSQL/native function availability; local PGlite is not proof of hosted compatibility.
- Managed `auth.users(id)`, `auth.sessions(id,user_id,created_at,not_after)`, Storage bucket fields and `anon`/`authenticated`/`service_role` must exist. Never create substitute managed schemas on the hosted project. Confirm the migration executor/definer can read the necessary session metadata safely.
- Private `netbud` schema has no browser USAGE grant. All NetBud tables enable RLS; client policies intentionally grant no direct customer access. Check actual inherited/default grants and RLS automation instead of assuming a pristine configuration. Keep `netbud` out of exposed Data API schemas.
- Public RPCs are `SECURITY DEFINER` with empty search paths, explicit qualified relations, restricted execution and validated server-supplied identity/session. Because they accept actor UUIDs or session hashes, **service-role isolation is essential**: do not grant `anon`/`authenticated` execution or place a service key in the browser. The server verifies JWT issuer/signature/audience/expiry, live Auth user, aal2, session existence, active role, assignments and fresh MFA before sensitive operations.
- Preserve automatic API access **disabled**. There is no need to grant browser roles table access just because Data API is enabled. Only the existing explicitly approved service-role RPC grants are needed. Check schema `public` USAGE for that server role and PostgREST visibility without exposing private tables.
- `netbud.admin_orders` is an owner-privileged internal view with client privileges revoked, not a customer-facing view. RLS alone does not make a definer view safe: verify schema and view privileges separately.
- Files 011's private auxiliary tables rely in part on the denied schema/default privilege boundary plus RLS. If hosted default privileges unexpectedly grant clients table rights, fail preflight and prepare a reviewed narrowly scoped correction. Do not issue project-wide grants/revokes that affect unrelated application objects.
- Migrations deliberately leave products inactive, `orders.test_only=true`, uploads disabled, manual artwork disabled, runtime local/synthetic admission and real notification sending unactivated. Creating tables does not enable public orders or real payments.

## Owner/admin preparation

The template `backend/config/staging.example.json` now records only the supplied public Supabase URL and an empty publishable-key field. All existing approval gates remain false. This is preparation, **not an established server connection**. Service credentials must later be stored in the authorised staging host's secret store, never in this template or `js/config.js`.

After approved schema setup:

1. In [Authentication → Users](https://supabase.com/dashboard/project/pzorzppbxgqespexuers/auth/users), inspect whether `bilal@netbud.com.au` already exists. Do not duplicate it. Keep public signups off.
2. You must set the password privately. The existing staff UI supports password sign-in and TOTP enrollment/challenge; it does **not** implement an invitation/reset-link password-completion screen. For isolated testing, an owner-operated Dashboard **Add user → Create user** step can set the password privately, subject to the actual dashboard's verification options and confirmation of email ownership. Do not send an invitation to an unimplemented callback and claim onboarding works. Invitation/reset completion and recovery must be reviewed before relying on that route.
3. Verify the actual Auth UUID and confirmed owner identity within this specific project. No role is inferred from matching the email alone. Present the exact UUID-to-owner provisioning operation separately for approval; no `netbud.staff` row has been inserted. Use neither fixture UUIDs nor a default password.
4. Use the authorised HTTPS staging admin page when hosting is ready. Sign in, add the TOTP key to your authenticator privately, and enter one code to obtain aal2. Never share or record the secret in screenshots/logs. Database access alone does not make `/admin/` live.
5. Verify expired JWTs, missing/old sessions, staff deactivation, assignment isolation, recent-TOTP enforcement and logout using actual hosted Auth. The application enforces a 30-minute session age in SQL and ten-minute MFA freshness for sensitive actions; do not purchase provider session-control upgrades. Confirm asymmetric JWT/JWKS configuration: current code accepts ES256/RS256, not HS256.
6. Exercise recovery in a controlled owner-approved rehearsal. Do not disable MFA, grant access from email alone or introduce a backdoor. No successful login, factor enrollment, recovery or logout has been claimed here.

## Hosted test plan after approval

Read-only metadata/advisors first; then approved synthetic-only setup and tests on this staging project. Record real versus simulated evidence separately:

- All tables/functions/constraints exist; every private base table has RLS; client schema/table/view/sequence/function privileges deny access. Check default privileges, all public overloads and obsolete base functions, not names alone.
- Anonymous and authenticated browser-role direct-table/privileged-RPC requests are denied. Empty arrays alone are not enough to prove denied grants; inspect privileges and actual REST outcomes.
- Service-backed RPCs work over real PostgREST; unrecognised operations and invalid data fail safely. Owner/assigned designer/fulfilment/support requests enforce scope; unassigned access and unauthorised price/refund changes fail.
- Synthetic customer A's verified session cannot retrieve B; expired/reused/wrong OTPs fail, no enumeration, and no private notes/storage paths leak. These tests also require the approved host, bot and isolated email/test-delivery boundary; schema-only checks do not establish end-to-end OTP.
- Owner MFA/session/logout/revocation works with real Auth, not signed fixtures. Synthetic order/payment/refund evidence remains labelled as such, never genuine funds. Do not enable live intake, sending, uploads or manual production to test the schema.
- Take an approved encrypted staging backup and rehearse a disposable restore with sending off, sessions revoked and financial/proof counts reconciled. No backup from a different project, no destructive test on the target, no claim that local PGlite recovery covers hosted Auth/Storage.

## Results and next action

**Hosted tests executed: zero. Migrations applied: zero. Owner account provisioned: no. Dashboard publicly operational: no.** Connection permission must be fixed first. Local checks performed for this preparation are recorded in the PR update; previous launch-suite passes are historical, not current hosted evidence.

Re-run locally on 28 November: **134 backend tests passed**, zero failures, and **101 form/hero/motion checks passed**. The prepared preflight SQL executed successfully in a read-only transaction against the disposable local fixture (11 result sets; order count unchanged). These fixtures use synthetic Auth/Storage metadata and mock providers. They establish neither the hosted PostgreSQL version nor a real owner login. [Current local backend test output](supabase-staging-local-tests.txt). The 14-file sequence/checksums were generated locally; no migration SQL was changed by this preparation.

Reconnect the correct Supabase account/project, then I will inspect the actual database, resolve any compatibility blockers and ask for approval of the concrete migration plan. Only after approval will I apply the reviewed sequence to this ref. Cloudflare/Resend/Turnstile, real ordering/payments and deployment remain off.

Official references checked 28 November: [MCP/project scoping](https://supabase.com/docs/guides/ai-tools/mcp), [Auth sessions and live session lookup](https://supabase.com/docs/guides/auth/sessions), [roles/privileges](https://supabase.com/docs/guides/database/postgres/roles), [Auth users](https://supabase.com/docs/guides/auth/users), [Supabase changelog](https://supabase.com/changelog). No CLI upgrade or hosted change was performed.
