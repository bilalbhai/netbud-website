# Hosting and free-tier assessment

Checked against primary provider documentation on 17 November 2026. Published limits can change. Account eligibility, actual delivery, deployment and restore have not been tested. Select free plans only; no automatic paid upgrades, add-ons or new monthly subscriptions are authorized.

## Hosting decision

| Arrangement | Assessment |
| --- | --- |
| GitHub Pages public shop + separate orders application | Not accepted as a compliance workaround. GitHub restricts running online businesses/e-commerce or sites primarily facilitating commercial transactions through Pages. Moving the payment form does not resolve the sales-focused site's policy question. |
| Same existing static site on Cloudflare Pages, API through Pages Functions | Recommended provisional architecture. No design rewrite; GitHub remains source. Same-origin `/checkout/`, `/orders/`, `/admin/`, `/api/` simplifies session isolation and avoids cross-origin API configuration. Owner must approve hosting/DNS migration separately. |
| Cloudflare app at `orders.netbud.com.au` only | Technically possible without moving apex DNS, but does not itself settle GitHub Pages compliance. Cross-origin requests, return URLs, cookies and phishing clarity require extra testing. |

See [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). This is a hosting-policy assessment, not a claim that GitHub has individually approved NetBud.

**Payment restriction found:** Cloudflare's self-serve terms, section 2.2.1(h), restrict processing or collecting credit-card information on properties receiving Free Services. Therefore do not embed card-entry widgets or proxy PAN/CVV through the proposed free site. Prefer redirecting to Revolut-hosted payment pages, with only opaque payment references/status in NetBud. Whether that exact integration is permitted must be confirmed before Phase F production approval; do not infer permission from technical capability. If a compliant free arrangement cannot be confirmed, payments remain disabled and this is a launch blocker. Free service can also be withdrawn. See [Cloudflare terms](https://www.cloudflare.com/terms/).

For ordinary static business pages and non-card order management, Cloudflare is the provisional alternative: the reviewed terms did not contain GitHub's equivalent general e-commerce hosting prohibition. This is an inference from the reviewed terms, conditional on current service-specific terms, account acceptance and the restriction above.

## Capacity and operating limits

| Service | Published free allowance / relevant condition | NetBud decision |
| --- | --- | --- |
| Cloudflare Pages | 500 builds/month, one build at a time, 20-minute build timeout; 20,000 files; 25 MiB per static asset. Functions consume Workers quota. | Build a public-file allowlist into staging output; never deploy the repository root indiscriminately once backend/test files exist. [Limits](https://developers.cloudflare.com/pages/platform/limits/) |
| Cloudflare Workers | 100,000 requests/day on Free; 10 ms CPU per request. | API mainly validation and I/O. Shared daily budget includes functions/background work. Do not promise image decoding fits. [Limits](https://developers.cloudflare.com/workers/platform/limits/), [pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Supabase Free | 500 MB database, 1 GB storage, 5 GB egress plus 5 GB cached egress; 50,000 monthly active users; two active projects. Low-activity free projects may pause after seven days. | Separate local/dev from production; reserve project slots. Private artwork mainly uses uncached egress. No artificial keepalive to evade pausing. Monitor database, storage, bandwidth and project state. [Pricing](https://supabase.com/pricing), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing) |
| Supabase Edge Functions | 500,000 free invocations; 256 MB memory; 2 seconds CPU/request, 150 seconds free wall-clock lifetime. | Possible private image-validation worker, subject to real decoder benchmarks and dependency review. Not an assurance that arbitrary images fit. [Invocation pricing](https://supabase.com/docs/guides/functions/pricing), [runtime limits](https://supabase.com/docs/guides/functions/limits) |
| Supabase TOTP MFA | TOTP MFA API is free and enabled by default. | Staff-only invited accounts; server verifies MFA assurance, not browser flags. [TOTP documentation](https://supabase.com/docs/guides/auth/auth-mfa/totp) |
| Turnstile | Free: up to 20 widgets, ten hostnames/widget and unlimited challenges. | Separate development/production hostnames; validate on server with action/hostname checks. It does not replace API rate limits. [Plans](https://developers.cloudflare.com/turnstile/plans/) |

Static asset serving and transactional API requests have different limits; do not interpret free static hosting as unlimited API execution. Set internal warnings at 60%, 75% and 85% of measured quotas. At capacity, show a truthful temporary-unavailable response before taking a new order; retain already committed records. Never claim payment success because an upstream service is unavailable.

### Artwork is the tightest storage constraint

Five designs × two images × 10 MB = **100 MB per order**, before proofs, replacements and refund evidence. A 1 GB bucket accommodates only about ten such maximum-size orders even before reserves. Ninety-day retention does not make this adequate for substantial sales volume. Ten downloads of a 100 MB order consume approximately 1 GB of egress.

Reserve bytes atomically before issuing upload permission; include quarantine, approved originals/proofs and temporary replacements in quota accounting. Keep at least 10% headroom, refuse reservations that exceed the operational ceiling, expire abandoned uploads and offer “I'll send artwork later.” Do not promise unlimited acceptance. Replacement upload must have temporary space before old data can be removed safely. Decode with pixel/dimension limits to prevent memory bombs; validate server-side before staff/customer viewing. Decoder feasibility within a free runtime is an explicit Phase B spike and launch gate, not solved in this document.

### Backups and availability

Free projects do not provide the downloadable managed backups needed for an independent restore plan. Supabase recommends free-tier exports and off-site backups. Database dumps do not by themselves back up stored image objects. See [backup guidance](https://supabase.com/docs/guides/platform/backups) and [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod).

Propose encrypted daily database exports and necessary private-object backups to an owner-approved off-site destination, with retention/permissions and actual restore drills. No destination or reliable always-on free scheduler has yet been authorized or tested. A sleeping personal PC is not an assured automated backup solution. Recovery targets must be agreed and measured; production readiness is blocked until a workable arrangement is demonstrated. Never put customer backups into GitHub. Free project pausing and lack of a paid availability commitment remain operational risks even with backups.

## Transactional email comparison

| Criterion | Resend Free | Brevo Free |
| --- | --- | --- |
| Capacity | 3,000/month; 100/day; one verified domain | 300/day; unused daily allowance does not roll over |
| Integration | REST API/SMTP; provider idempotency keys retained for 24 hours | Transactional API/SMTP; application must enforce durable event deduplication |
| Domain and OTP | Verify own sender domain; suitable API for transactional templates and OTP | Authenticate sender domain; transactional templates and OTP possible after account eligibility/setup |
| Delivery | Shared infrastructure; acceptance is not inbox delivery | Shared infrastructure; acceptance is not inbox delivery |
| Subscription | $0 plan within quota; no paid plan selected | $0 plan; no paid plan selected; review free branding/account conditions |

Sources: [Resend pricing](https://resend.com/pricing), [domain verification](https://resend.com/docs/dashboard/domains/introduction), [idempotency](https://resend.com/changelog/idempotency-keys), [Brevo plans](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans).

**Provisional selection: Resend**, for a small first release with explicit idempotency support and a simple transactional API. Brevo is a higher-daily-capacity alternative if owner prefers it or Resend account approval/delivery fails; do not switch providers automatically and risk duplicate messages. Neither provider's real sender approval, SPF/DKIM alignment or inbox delivery has been demonstrated here. Final selection requires owner account verification and test receipts.

Budget example, not a sales forecast: ten orders/day × six coalesced notifications = 60 emails, leaving 40 for OTP, staff invites, enquiries and alerts. Long projects can exceed six events; admission must use actual queued/reserved sends, not that estimate. Reserve OTP capacity, limit resend abuse, defer noncritical notifications, and alert before the 100/day or 3,000/month ceiling. Do not queue an OTP so long that it arrives expired. At provider acceptance timeout, reconcile before retry; after the 24-hour provider deduplication window, require review of uncertain sends. Never label a draft or accepted email as delivered.

## Revolut and Australian requirements

Australia is listed for Merchant eligibility, but a regular Business account is not Merchant approval. Verify the owner's actual approved product/API access. [Eligibility](https://help.revolut.com/en-AU/help/merchant-accounts/setting-up-a-merchant-account/who-can-apply-for-a-merchant-account/business/).

Manual capture is server-to-server; final authorizations default to a seven-day hold and have capture deadlines. Use only where owner acceptance fits the actual deadline; long website work needs new deposit/balance requests. Verify signed webhook payloads and fetch canonical payment status. [Capture later](https://developer.revolut.com/docs/guides/merchant/operations/capture-and-settlement/capture-later), [signature verification](https://developer.revolut.com/docs/guides/merchant/monitor-and-observe/webhooks/verify-the-payload-signature).

For GST, verify registered legal name, ABN and classifications before changing wording or issuing invoices. Preserve gross advertised prices. Tax invoices require specified information, with additional buyer identification for invoices of A$1,000 or more; relevant requested invoices generally must be provided within 28 days. [ATO tax invoices](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/tax-invoices). Generally retain business records for five years from the applicable transaction/record event, and longer where required. [ATO record keeping](https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/detailed-business-record-keeping-requirements/running-your-business-records/income-tax-return-records-business).

Do not make custom goods or deposits subject to blanket “no refunds.” Remedies depend on the failure and applicable consumer guarantees. Draft policies require owner/legal review. [ACCC business guidance](https://www.accc.gov.au/business/problem-with-a-product-or-service-you-sold/repair-replace-refund-cancel).

## Domain migration implications — no changes authorized

Cloudflare Pages apex-domain setup requires a Cloudflare zone and Cloudflare nameservers. A subdomain can instead use an external DNS CNAME, after first registering the custom domain in Pages. [Custom domain instructions](https://developers.cloudflare.com/pages/configuration/custom-domains/).

GoDaddy can remain the registrar. Before any future nameserver move, export and reconcile every existing record, including forwarding MX/TXT, DMARC and verification records; inspect DNSSEC/DS state. DNS hosting would move to Cloudflare, so merely preserving GoDaddy's old zone is insufficient. Verify incoming mail before and after. Exact assigned nameservers and sender records must come from the owner's dashboards; none are invented here. Never change production nameservers as part of development.
