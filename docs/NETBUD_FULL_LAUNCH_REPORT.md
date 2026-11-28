# NetBud full launch execution report

## Staging execution · 28 November 2026

**Database installed and tested. Hosted admin login and production release are blocked.** The Supabase management API confirmed NetBud staging project `pzorzppbxgqespexuers` in Singapore, healthy on PostgreSQL 17.12. Before writing, its NetBud namespace and migration history were empty. Each file was rehashed immediately before submission. The history below was independently read back after the final commit. **Do not reapply these migrations.**

| Migration | Hosted version | SHA-256 (UTF-8, LF) | Result |
| --- | --- | --- | --- |
| netbud_staging_rls_helper_permissions | 20261128051737 | `072ba494fa457fdaed8e61408614951b12cb0873db29825ecc52f0aff674d993` | Applied |
| netbud_001_foundation | 20261128051811 | `74fdd3c4e0ff17ccfdcd6a134145b37dc9a433e239587e3eb2e34a170159c99e` | Applied |
| netbud_002_operations | 20261128051829 | `9c3a58157690051a2dcdd94848774f00768b1240ef95c24effb2979885146537` | Applied |
| netbud_003_outbox_storage | 20261128051836 | `a27306107ad5bfb66bb4d83b50ac031b415a90c038a399ef0d21d84849752d28` | Applied |
| netbud_004_catalogue | 20261128051841 | `764fd40d8640203db5570032b39b489bf3b1664c9003494606485b7e421744c0` | Applied |
| netbud_005_integrity | 20261128051848 | `169e7057a14e8b10417e1e7c145ffbfedc06e60582469e601cdea01f69502970` | Applied |
| netbud_006_guest_checkout | 20261128051853 | `012bd3471f3f64519f459e31f313f90afaf93129b50e2b8b8f6ae01e8f009f94` | Applied |
| netbud_007_customer_tracking | 20261128051859 | `cbf3f61d05a22011a6464af241a3142d922b15bf39031552cf47228997c9e076` | Applied |
| netbud_008_admin | 20261128051907 | `beffe770295da134fd112f811ae08fb5fc7e68a0750f49deb4da7b824d56aeb7` | Applied |
| netbud_009_admin_actions | 20261128051914 | `1681b9a4f1d5526551ce7fb399dba305e9e40ab08fe42ada5e89789fc74840ad` | Applied |
| netbud_010_tracking_quote_totals | 20261128051921 | `1ae71ba310846aeac176ebd239171d356585a96463d6f761136568dce6b02433` | Applied |
| netbud_011_launch_operations | 20261128052027 | `3a07b3eb0aedf66e679a326d7ce11117315886bdfe96d8d6f2da4de14704cd5a` | Applied |
| netbud_012_integration | 20261128052137 | `a0260c5c8ca90e4728db853f9f057eead3e7b226a0139bc7c2688931a06df204` | Applied |
| netbud_013_manual_refunds | 20261128052143 | `272aeb62cf9f2f5b89eb950b7b0e59817c06271156573fa5c2f89216879f5e84` | Applied |
| netbud_014_manual_retention | 20261128052149 | `5b1317cf252a3737ba20330dba181db9d996cebb69529c8aec0fe788af6b4b27` | Applied |

### Real hosted verification

Installed private tables (40): `admin_requests`, `artwork`, `artwork_approvals`, `artwork_reservations`, `assignments`, `audit`, `bot_tokens`, `communication`, `customer_updates`, `customers`, `deliveries`, `delivery_items`, `enquiries`, `guest_sessions`, `internal_notes`, `invoices`, `limits`, `mail_budget`, `mail_events`, `manual_proof_approvals`, `manual_proofs`, `order_items`, `orders`, `otp_challenges`, `outbox`, `outbox_attempts`, `payment_allocations`, `payments`, `products`, `quote_acceptances`, `quote_versions`, `quote_workflow`, `quotes`, `rate_limits`, `refund_approvals`, `refund_records`, `retention_jobs`, `runtime_policy`, `staff`, `staff_invites`.

Additional hosted checks confirmed OTP expiry, the five-attempt ceiling and repeat-request throttling. On 28 November a fresh read of the public GTM configuration confirmed that automatic email, phone, address and PII collection flags still resolve to true. This inspection did not execute a tag or establish that personal data was transmitted.

- Both browser roles lost EXECUTE on the automatic-RLS helper. The original event trigger remained enabled. Both prior warnings cleared.
- All 40 NetBud tables have RLS. Anonymous and authenticated roles have zero direct table/view grants, no schema usage and no execute privilege on any of the 35 public NetBud routines. Definer search paths are set. Actual SQL requests as each role were denied; a REST request with the staging publishable key returned HTTP 401 / SQLSTATE 42501. Project-wide default grants were preserved. The advisor reported 40 informational findings: private tables intentionally have no client policy. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- The private artwork bucket allows JPEG/PNG up to 10,000,000 bytes; zero object policies. Browser upload and emailed-artwork production handling still require independent validation.
- Rollback-only synthetic transactions exercised server-side order pricing (A$39 pickup, A$53.95 with shipping), mixed quotes, replay of an order key, pending-payment state, owner acceptance, quote draft/preparation/acceptance and refusal to record unverified funds.
- A synthetic customer's verified database session retrieved only its own order. Another customer's reference returned an empty list. Incorrect and reused OTPs failed; logout invalidated retrieval. No email was sent. Synthetic staff role tests checked reports for the owner, financial-export denial for other roles, denial of unassigned access and rejection of an unknown Auth session. These tests ran inside PostgreSQL; no owner password or MFA was simulated as a hosted login.
- Two concurrent replay-guard calls using the same synthetic digest returned exactly one acceptance and one denial. That test used one expiring replay marker. Products remained inactive, and the post-fixture check counted zero orders, staff and outbox messages.
- The live Auth settings endpoint confirmed public signup disabled. JWKS advertised ES256, supported by the existing verifier. No Auth identity exists for the intended owner. Verified end-to-end login, AAL2, token expiration, logout and revocation require the owner and a hosted runtime.

### Local and mocked evidence

134 backend tests passed after repeating the suite with loopback permission. Public form/hero/motion checks passed 68/18/15; growth/SEO passed 428. Public browser suite passed 486 checks and analytics passed 68 mocked browser assertions. Admin, guest checkout, tracking and HTTPS integration browser suites completed at 375, 430, 768, 1024 and 1440px. Mocked Auth, mail, Turnstile, Google and FormSubmit results are local evidence. Encrypted fixture recovery passed locally. No disposable hosted restore target or provider-level backup was available.

The allowlisted Pages build passed integrity verification for all 186 files. No Cloudflare project URL or authorised deploy session was available. The separate cron-only Worker in `backend/staging-scheduler.mjs` imports the existing bounded dispatcher; its staging-only configuration disables routes, previews and operations by default. The bundle and disabled invocation passed locally. Actual cron execution, alarms and delivery monitoring require Cloudflare. There is no hosted admin or Pages preview URL to give the owner yet.

### Owner actions and activation order

1. In [staging Authentication → Users](https://supabase.com/dashboard/project/pzorzppbxgqespexuers/auth/users), select **Add user → Create new user**, set your own unique password for **bilal@netbud.com.au**, and confirm the identity under your control. Verify the displayed user UUID independently before authorising the one-row owner assignment. Keep credentials and MFA codes in your possession. On the eventual staging admin page sign in, enrol your authenticator and complete the verification challenge. Test sign-out, revoked-session denial and owner-controlled recovery.
2. In [Cloudflare Workers & Pages](https://dash.cloudflare.com/) create a free staging Pages project and authorise deployment access scoped to NetBud. Provide its assigned HTTPS pages.dev origin. Generate the final deployment package with the exact project and origin using the command below. Set server variables and secrets listed in the setup section below. Enable admin testing first. For cron use the separate `backend/wrangler.scheduler.staging.jsonc` Worker configuration with its own server secrets and dashboard monitoring. Enable the scheduler only when its target and operating limits are verified.
3. Configure Turnstile for that exact hostname. For email, authorise a verified Resend sender, owner-only test recipients and webhook secret. Approve any sender DNS changes separately. Verify delivery, retries and signatures before enabling guest OTP. Keep customer ordering, uploads, online payments and unverified manual payment actions closed.
4. Authorise an encrypted backup destination, owner-controlled recovery keys and a disposable restore target. Follow [the recovery runbook](ordering/OPERATIONS.md). Verify the application schema/rows, Auth identity mapping and MFA recovery, object bytes, access controls, immutable payments, outbox deduplication and secrets before admitting orders. Suppress outgoing mail on restore and reconcile uncertain messages before resuming.
5. Complete the Google settings and seller/tax checks detailed below. Website consent and identifiers are preserved. Last published-container inspection detected automatic contact-data collection settings. Actual Google account remediation and GA4 receipt require authorised access.

**Rollback:** keep staging activation gates closed. On a later failed deployment, disable the scheduler and guest/admin routing and roll back the Pages artifact to the previously verified version. Retain migration history. For database issues use a reviewed forward correction or a verified isolated restore followed by reconciliation. Never replay the initial schema or reset the active database.

| Component | Current status |
| --- | --- |
| Supabase database | COMPLETE |
| Database migrations | COMPLETE |
| Database security | VERIFIED for the hosted database checks above |
| Owner authentication | BLOCKED |
| Admin dashboard | BLOCKED |
| Cloudflare staging | BLOCKED |
| Checkout | TESTED in hosted PostgreSQL and local browser; hosted HTTPS checkout blocked |
| Email OTP | BLOCKED on real delivery |
| Manual payment management | BLOCKED on authorised hosted operator |
| Backups and recovery | BLOCKED on hosted rehearsal |
| Production launch | BLOCKED |

## Historical preflight and previous launch evidence


**Latest 28 November read-only result:** access to the exact Supabase staging project is restored and its empty NetBud namespace is verified. The permission correction and original migrations remain unapplied, awaiting approval. [Current findings and exact approval plan](ordering/SUPABASE_READ_ONLY_REVIEW.md). No production deployment or account provisioning occurred.

**28 November update:** owner has created `netbud-staging` (`pzorzppbxgqespexuers`). Both connected Supabase accounts deny project and migration-history access; no hosted migration, test or owner provisioning has run. See [the current staging setup report and approval plan](ordering/SUPABASE_STAGING_SETUP.md). The 23 November report below is retained as historical launch evidence.

23 November 2026, Australia/Sydney. **Full operational launch: BLOCKED.** Marketing website remains live. Integration branch: `codex/netbud-full-launch`, based on current production `a5eb696`. No production deployment, merge, DNS/MX change, paid subscription, real order, real email or payment was performed.

## Deployment status

| Component | Status and evidence |
| --- | --- |
| Website | **LIVE**, existing [netbud.com.au](https://netbud.com.au), production source `a5eb696`; origin/main rechecked 23 November. Public HTTPS checked 20 November: apex 200, www HTTPS redirects to apex, valid certificate covering both names. This integration is not deployed. |
| Staging | **BLOCKED**; no Cloudflare account/project is ready, so there is no deployed URL or commit. A local package is not a hosted preview. |
| Admin dashboard | **BLOCKED**; no authorised NetBud Supabase project or hosted authentication. `/admin/` is not live; real owner password/TOTP/login/recovery not tested. |
| Customer ordering | **BLOCKED**; retained staging-only adapter and database admission rules. Production origins are rejected. |
| Email OTP | **BLOCKED**; no Resend account, verified sender, reliable hosted dispatcher or real inbox/latency evidence. |
| Manual payment recording | **BLOCKED** for real operations; implemented and tested locally, but requires the secured hosted owner dashboard. No bank details invented or payments activated. |
| Google Analytics | **BLOCKED** for production-readiness verification. Current consent-based flags remain enabled, as requested; published Google settings still conflict with the intended privacy restrictions. |

The owner confirmed that Supabase has not been created for NetBud and neither Cloudflare nor Resend is ready. Supabase connector discovery found only an unrelated project: it was not modified or used. Browser account access ended because computer control could not verify the current Windows browser URL reliably. No alternative browser access was used to bypass that stop.

## Integration completed

- Reconciled the stacked A–H backend into a separate branch from latest marketing main. PRs #1–#6 remain unmerged. Imported backend and ordering documentation from Phase H `7fcfe52`; did not replace current marketing sources with older Phase H files.
- Preserved the catalogue, prices, FormSubmit, cookie settings, design and readable animation/controller sources. Fixed outdated regression assertions that expected superseded GST wording and disabled analytics; updated the shop analytics fixture for the current rendered-product-list selector.
- Regenerated the public minified script and cache versions from current readable source. Added LF rules for generated assets to prevent Windows line endings invalidating content hashes. Public HTML changes are asset-version references, not a redesign.
- Excluded backend/docs HTML from the public marketing asset-build and SEO-check loops. Backend templates are packaged separately.
- Added `backend/prepare-cloudflare.mjs`: generates a **staging-only, disabled** Pages artifact and configuration in ignored `.cache/`. Its artifact audit rejects extra files, missing files, symlinks and modified assets. Private source, SQL, docs, dependencies, local authentication, environment files and backups are excluded. No secrets are read or written by preparation.
- Added negative packaging tests for production/custom-origin rejection, defaults remaining disabled, unexpected files and tampering. This is an upload candidate, not a deployment or a production adapter.

### Remaining code/operations blockers

The existing integrated API explicitly accepts staging only; SQL `runtime_policy` allows only local/staging and test/allowlisted emails. Real email sending is allowlisted. These are deliberate safety boundaries, not account-setup switches for a production launch. A reviewed production runtime/admission change and its hosted security tests remain required after isolated staging works. Do not bypass these checks or claim that creating accounts alone makes public checkout live.

Pages does not run the existing `scheduled` export automatically. A separately reviewed Worker/controlled runner with bounded dispatch and monitoring is required before OTP can be dependable. Web uploads and previews remain disabled. Manual artwork handling requires a real privacy/safe-file/proof-approval/archive-capacity/retention rehearsal. Hosted PostgreSQL/PostgREST/Auth/concurrency and full database/Auth/private-file restore tests remain outstanding; local PGlite recovery is not hosted recovery.

## Tests actually executed

Evidence is retained locally in ignored `.cache/full-launch/`; no real Google property, enquiry recipient or customer was used in automated tests.

- Backend suite: **134 passed, zero failures**, final combined run on 23 November, including two new release-package checks. [Full output](full-launch/backend-tests.txt).
- After extending checksums to the server bundle and route manifest, all **20 affected integration/package tests passed again**, including deliberate server-bundle tampering. [Output](full-launch/final-package-tests.txt).
- Public invariant checks: 68 forms + 18 hero + 15 motion = **101 passed**. Growth regression: **428 passed** after correcting outdated assertions and regenerating assets.
- Public browser review: **486 checks passed**, widths **375, 430, 768, 1024, 1440px**; consent, successful/failed mocked enquiries, navigation, basket, keyboard, responsive layout and animation smoke.
- Analytics browser suite: **68 assertions passed**, mocked Google/forms/APIs; private-area exclusions, withdrawal, order deduplication and blocked-analytics checkout covered.
- Checkout, tracking and admin browser suites passed all five widths, including role/assignment denial, truthful payment states, logout and financial CSV permissions.
- HTTPS integration browser evidence covers Secure/HttpOnly cookies, synthetic OTP, JWT/TOTP, enrollment, cross-customer denial and packaged app surfaces. These tests use a temporary loopback certificate and mocked providers; they do not establish public-provider security or email delivery.

[HTTPS browser output](full-launch/integration-browser.txt), [published-container inspection](full-launch/published-container-check.json), [public HTTPS/asset inspection](full-launch/live-checks.json). Synthetic screenshots: [admin desktop](full-launch/admin-1440.png), [checkout mobile](full-launch/checkout-430.png), [tracking mobile](full-launch/tracking-375.png), [marketing desktop](full-launch/marketing-1440.png). External public inspections are dated 20 November; final local integration and combined backend tests completed 23 November. No live-provider verification is inferred from either.

Initial failures were investigated rather than reported as passes: stale analytics/tax/DOM fixtures, stale generated asset versions, and restricted localhost network access. Tests requiring local networking were rerun with the appropriate execution access. Real service tests were not attempted without provider setup.

The staged text-file credential-pattern scan found no matching private keys, service-role secrets, token patterns or credential-bearing database URLs. This bounded scan is not a guarantee against every possible secret. Unrelated local chart outputs, emoji assets and temporary files remain excluded. [Changed-file inventory](full-launch/changed-files.txt).

## Exact owner setup needed

1. **Supabase:** open [dashboard](https://supabase.com/dashboard), choose your own organisation, **New project**, name `netbud-staging`, eligible **Free** plan, Australian region if available. Set the database password yourself and keep it in your password manager. Share only the project URL/name. Do not select the unrelated existing project. Disable public user signup under **Authentication → Sign In / Providers**. Staff accounts are privately invited; verify the actual Auth UUID before granting the owner role. You set your password and enroll TOTP. Do not paste passwords or keys into chat. Apply reviewed migrations 001–014 once to the empty authorised project, never test bootstrap/reset scripts; validate hosted grants/RLS and Auth before activation.
2. **Cloudflare:** create/sign into [dashboard](https://dash.cloudflare.com/), enable account MFA and create a free Pages staging project under **Workers & Pages**. No domain or nameserver changes are needed for its assigned `pages.dev` preview. Supply the project name/URL and authorise deployment access. Upload only the prepared `public/` directory through Wrangler advanced mode, never the repository root. Keep automatic deployments off until reviewed.
3. **Server settings:** in the Pages project **Settings → Variables and Secrets**, keep the staging gates false initially. Copy nonsecret variable names/defaults from `backend/config/staging.example.json`; set `APP_ORIGIN` to the exact assigned HTTPS staging origin. Store `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_HMAC_SECRET`, `OTP_HMAC_SECRET`, `OTP_TRANSPORT_KEY_HEX`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` only as server secrets. Public configuration may contain only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `TURNSTILE_SITE_KEY`; never a service-role key. Generate separate strong random secrets privately. Configure **Turnstile** with the exact staging hostname and server-validated actions. Do not activate guests before the hosted checks.
4. **Resend:** create an account at [dashboard](https://resend.com/), add a sender domain under **Domains**, and obtain the exact verification/DKIM records shown there. Before any DNS change, export the current GoDaddy zone/nameservers/DNSSEC and review the exact proposed records and rollback. Preserve existing incoming MX and forwarding. Sender currently expected by code is `NetBud <noreply@netbud.com.au>`, Reply-To `sales@netbud.com.au`; verify these are owner-controlled. Use an authorised owner recipient allowlist and authenticated webhook; mail gates stay off until review. An API acceptance is not confirmed delivery.
5. **Google privacy correction:** at [Google Analytics](https://analytics.google.com/), choose the intended property → **Admin → Data streams → NetBud web stream** and verify **G-4L3JN7WC5M**. In **Enhanced measurement**, disable unapproved automatic events, particularly forms/history/query capture. Under **Configure tag settings → Allow user-provided data capabilities**, turn off automatic user-provided data collection/detection (email, phone and address); keep enhanced conversions, remarketing and Google signals off. At [Tag Manager](https://tagmanager.google.com/), select **GTM-N9B3W4F5**, inspect the Google tag and all event/settings tags for duplicate or overriding collection. Keep `send_page_view=false`, explicit safe data-layer events only, `analytics_storage` required and advertising denied. Verify in Preview/Tag Assistant before publishing a corrected version; then verify consented GA4 DebugView/Realtime. This task has not changed or published Google settings. See [analytics setup](ordering/ANALYTICS_SETUP.md) for exact event fields. Website flags are preserved true; this is explicitly **not** a safe-container or live-receipt claim.

Dashboard labels may change; verify each setting in the current provider interface. Account signup, passwords, MFA and any terms acceptance remain owner-controlled. No paid plan or automatic paid upgrade is authorised.

### Business identity and tax

Owner supplied ABN `25 504 621 913`. [Official ABN Lookup](https://abr.business.gov.au/ABN/View?abn=25504621913) was read on 20 November: the number is active and identifies an individual/sole trader. The response did not establish the NetBud trading-name relationship. Confirm the actual contracting seller/trading name and accountant-approved offer classifications before publishing verified seller identity or issuing tax invoices. No promotional registration-status statement was added; the current neutral AUD/quote/tax wording and advertised prices are unchanged. Do not assume all offers have the same tax classification.

## Local reproduction and staging preparation

From repository root, with Node 22+ and pinned dependencies installed:

```powershell
node --test --test-concurrency=1 backend/test/*.test.mjs
node scripts/check-forms.cjs
node scripts/check-hero-scroll.cjs
node scripts/check-motion.cjs
node scripts/check-growth.cjs
# After Cloudflare assigns/approves your real staging project and origin:
node backend/prepare-cloudflare.mjs YOUR-STAGING-PROJECT https://YOUR-STAGING-PROJECT.pages.dev
```

The preparation command prints its fresh `.cache/netbud-release-...` path. The adjacent `wrangler.json` and `artifact-review.json` stay **outside** public output. Deploy only `public/` using the authorised Cloudflare Pages CLI/account; preparation itself performs no network call or deployment. The example project is a placeholder, not a claimed existing URL. Backend and browser scripts/runbooks live in [ordering operations](ordering/OPERATIONS.md); real provider variables are never needed by local fixtures.

## Production release and rollback

Do **not** merge this branch while GitHub Pages publishes repository root: that could expose backend source/docs. First approve and test an artifact-only deployment configuration, isolated staging, owner MFA/revocation/recovery, real recipient OTP/webhooks, concurrency, customer isolation, manual artwork and hosted recovery. Review production adapter/admission changes and legal/tax requirements. Capture current DNS/email records before presenting exact assigned-domain changes for owner approval. No DNS delta is proposed without an actual assigned hosting target.

Keep the existing marketing site/FormSubmit operating while staging is tested. Only after every gate passes, deploy the reviewed allowlisted production artifact, bind approved domains, verify both TLS names, recheck incoming mail and ordering, and record the actual deployed commit. No deployment is claimed in this report.

Rollback: disable new guest intake and outgoing dispatch first; preserve private orders, immutable quotes/payment/refund evidence and deduplication records. Restore the previously reviewed static artifact and working FormSubmit. Use captured DNS records only if a separately approved DNS change occurred, accounting for caches and mail continuity. Never reset a real database, replay an old outbox or reverse financial history as a code rollback. Recover data/Auth/private files only through a successful authorised recovery rehearsal.

- **WEBSITE — LIVE (existing production)**
- **ADMIN DASHBOARD — BLOCKED**
- **CUSTOMER ORDERING — BLOCKED**
- **EMAIL OTP — BLOCKED**
- **MANUAL PAYMENT RECORDING — BLOCKED**
- **GOOGLE ANALYTICS — BLOCKED (privacy correction and real verification; consented loading remains enabled)**
