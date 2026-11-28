# NetBud full launch execution report

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
