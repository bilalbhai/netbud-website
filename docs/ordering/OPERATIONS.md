# Phase G — staging, storage and recovery runbook

Development instructions, 18 November 2026. No hosting/DNS/scheduler was installed. Phase F/Revolut is postponed. Unpaid orders do not require a merchant account.

## Proposed zero-subscription architecture

Keep GitHub as code source. Subject to owner approval, use Cloudflare Pages for static assets and a same-origin server API, Supabase Free for private Postgres/Staff Auth/Storage, Resend Free for notifications, and Turnstile Free for bot verification. Keep live FormSubmit enquiries until a separately approved intake migration. Do not expose a cross-origin guest-cookie API as a shortcut.

The present GitHub Pages deployment is unchanged. GitHub's published rules restrict sites primarily facilitating commercial transactions; do not assume moving only the API makes the shop compliant. Plan a reviewed hosting migration before commercial checkout activation. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

| Component | Provider allowance / local safeguard | Operational limitation |
| --- | --- | --- |
| Supabase Free | 500 MB DB, 1 GB files, 5 GB egress plus 5 GB cached; local soft DB guard 400 MB, artwork 900 MB | Pauses after one week of inactivity; two active free projects; egress includes recovery and previews |
| Workers Free | 100,000 requests/day, 10 ms CPU/invocation; existing app admission budget 80,000/day | Image decoding may exceed CPU/memory; benchmark before activation |
| Resend | 100/day, 3,000/month; candidate 90/day, 2,700/month | OTP and notices compete with order notifications; queued mail is not delivery |
| Turnstile | Free plan available | A widget alone is insufficient; server verification and hosted challenge tests required |

Primary sources checked: [Supabase pricing](https://supabase.com/pricing), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/), [Resend](https://resend.com/pricing). Free services can change. No automatic paid upgrade, paid resource, subscription or credit-card collection was configured. Cloudflare's apex custom domain setup may require nameserver migration; a preview subdomain can use external DNS. Neither change is authorised by this phase. [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Staging admin boundary

`backend/staging.mjs` is a candidate handler, not a deployment entry point. It defaults to 503. Only an explicit staging environment, HTTPS origin and owner-approved gate permit `/api/admin/` bearer-auth requests. Local capability exchange and public guest/checkout/enquiry/upload routes are rejected. Existing Supabase signed JWT validation, live user lookup, aal2, active staff/assignment checks and fresh MFA for mutations/financial exports apply. No synthetic capability fallback is installed.

Owner setup still required: create an isolated free staging project (not production); disable public signup; invite staff privately; enroll owner and relevant staff TOTP; register reviewed staff IDs/roles through a trusted administrative process; set narrowly scoped origins/redirects; store service-role/rate/OTP secrets server-side. Test role revocation, expired JWTs, owner MFA recovery and no anonymous table/Storage access using actual hosted Auth. No staff identity or fake assurance claim should be created through a public endpoint. The present admin page only has the local synthetic login; a hosted Supabase login/refresh/MFA UI remains a blocker.

`GET /api/admin/operations` provides owner-only queue-state counts, budget usage, DB/storage/reservation capacity and retention failure counts. The existing local admin session can access it with a same-origin fetch; there is no new public dashboard page. Check it daily after activation; inspect detailed queues privately with the owner/server database tools, never in public logs.

## Bot protection integration

`createTurnstile` validates Siteverify JSON, exact hostname/action, age, provider success and a database token hash for replay denial. The API accepts an optional `botGuard` before checkout, OTP requests, future public enquiries and future artwork uploads. Local regression mode deliberately omits it. Existing FormSubmit is untouched. Before installing any public handler, wire the guard, render accessible widgets/reset expired tokens, enforce trusted edge network identity, test mobile/challenge failures and retain SQL rate limits. Do not publish an unguarded handler or a test-key bypass. [Server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Artwork and retention

Uploads stay **disabled**. Existing bucket is private, JPG/PNG only, maximum 10 MB; no public policy, upload endpoint, signer or final approval is added. New server-only reservation RPC serializes file and aggregate admission, ten files/order maximum, ten-minute reservations, safe idempotent retries and the shared storage limit. Tests temporarily enable it only in disposable PGlite. Reservation is not an upload permission: future upload-to-metadata conversion must atomically consume it, authenticate order access, reconcile orphan objects and account for concurrent multipart/quarantine/backup bytes.

Still blocked: reliable signature validation, image decoding/re-encoding, metadata stripping, pixel/decompression-bomb limits, per-runtime CPU/memory tests and authorised short-lived previews. No claim is made that extension/MIME checks make files safe. Keep artwork-by-email and do not activate final artwork approval until validated private previews exist.

Retention preparation creates one notice per completed order at day 83 only where artwork exists. Dry candidate selection requires completion at least 90 days ago, an actual recorded delivered notice at least seven days ago, no legal hold and a live artwork reference. API acceptance is insufficient. Nothing deletes objects or financial records. Actual deletion remains blocked on hosted object-store verification, race-safe legal-hold/deletion fencing, retry/reconciliation and an approved scheduler. Delayed/bounced notice means delayed deletion, not silent deletion at day 90. Set holds privately for disputes; do not erase payment, quote, invoice or audit records with temporary images.

## Backups: practical free preparation

Git tracks code/migrations, **not customer data or private artwork**. Use encrypted local/off-site files on an owner-controlled device and existing off-site storage with adequate free space; no unauthorised cloud account or paid backup service was created. Keep the encryption key separately, preferably in an existing password manager, and test recovery access.

For a future approved hosted staging drill:

1. Freeze writes and outbox sending, record migration/version/time and capture row counts and financial sums. Inventory private object keys, byte sizes and SHA-256 hashes without publishing paths.
2. Follow Supabase's current export procedure to produce protected schema/data/role exports, including the private `netbud` schema; review Auth-managed schema limitations. Use a local credential store or temporary protected pgpass file, never connection passwords in shared command history. A generic `pg_dump --schema=public` would omit NetBud's data.
3. Download actual private bucket bytes separately through an authorised server tool. Database backups do not include those bytes. Encrypt the database exports, object bytes and manifest before moving them off-site. Verify copied hashes. Do not use GitHub artifacts or the public repository as a backup destination.
4. Restore into a separate disposable staging project following provider restore instructions. Restore reviewed roles/grants/schema/data and private objects, then reconcile financial sums, accepted quotes, order references, file counts/hashes and RLS. Do not overwrite a live project.
5. Revoke restored guest sessions, pending OTPs and staff sessions; rotate relevant secrets. Keep restored outbox sending off and quarantine all queued/uncertain events to avoid replaying old messages. Re-establish staff Auth/MFA safely; never assume database rows restore provider sessions or MFA factors.
6. Test owner login/MFA, cross-customer denial, quote/manual payment totals and private files. Record measured recovery time, recoverable timestamp and any gaps. Resume only after owner review; destroy the disposable copy under the approved retention plan.

[Supabase backup guidance](https://supabase.com/docs/guides/platform/backups) recommends off-site exports for Free projects and distinguishes database backups from Storage files. Hosted PostgreSQL tools, provider credentials, off-site destination/permissions, an always-on free scheduler and the full hosted restore drill remain unverified. Local machines sleeping/offline prevent dependable automation; no zero-cost unattended recovery guarantee is offered. A manual daily export before/after material business changes is a proposed target, not an implemented SLA.

`backupFixture` / `restoreFixture` demonstrate an authenticated encrypted PGlite archive plus private-byte manifest. Tests restore into a **fresh** engine, verify records and bytes and reject wrong keys/tampering. This small, in-memory fixture helper is not a production Supabase backup tool, does not cover hosted Auth/MFA and must not be used on real customer data. The successful fixture restore does not remove the hosted recovery blocker.

## Failure response

- Backend unavailable/cap reached: preserve input, fail safely, retry orders with the same idempotency key; never claim payment or mail delivery.
- Mail failed/uncertain: owner checks provider dashboard and message ID before any resend. Do not automatically replay a timeout or an event outside the idempotency window. Suppress bounced/complained recipients and investigate before future sends; an account-level suppression reconciliation drill remains required.
- Storage near 80% of the 900 MB local budget: review retained/quarantined/reserved/orphan data and future deletion notices. At capacity, deny admission. Compare DB bookkeeping with actual provider Storage usage before allowing uploads.
- DB nearing 400 MB: stop new write-heavy intake and investigate growth; don't automatically upgrade. Existing guard cannot perfectly measure concurrent provider overhead.
- Suspected compromise: disable new routes/sending, revoke sessions/keys, preserve minimal audit evidence, notify owner and follow reviewed incident/privacy procedures.

No cron, real outgoing message, image upload, customer order or payment was performed for this runbook.
