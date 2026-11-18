# Phase H — final integration and launch-readiness review

18 November 2026, Australia/Sydney. Branch `codex/netbud-phase-h-integration`, based on Phase G `405263e`. Draft review targets `codex/netbud-phase-g-launch-prep`.

**Local H1 integration and the available H2 tests are complete. NetBud is NOT verified ready for production launch.** The owner explicitly confirmed that the isolated Supabase staging project and verified Resend/Turnstile accounts are not ready, and authorised local integration plus setup documentation. No hosted deployment, account/billing/DNS/forwarding change, real email, real payment or customer-data submission was performed. No earlier PR was merged. Revolut remains postponed. PACES remains unchanged. The original Phase H integration preserved public marketing source; the later analytics addendum below lists its narrowly scoped consent/event and privacy-copy changes.

## Baseline and implementation

Reviewed the A–G audit/architecture/plan/reports, migrations, checkout, tracking, staff authorization, admin, email, storage and recovery foundations. Existing features were largely functional only in isolated fixtures. Phase G's hosted handler was staff-API-only; public guest wiring, real staff login screens, manual physical-proof approval and hosted operational verification were incomplete. Passing previous local tests did not establish production readiness.

### H1 integration completed locally

- **Packaging/routing:** a pinned esbuild development dependency creates a Cloudflare Pages advanced-mode staging artifact from a Git-tracked public-file allowlist. Backend sources, SQL, fixtures, docs, private configuration, backups and unrelated local files are excluded. Reserved `_worker.js` bundles only server dependencies, with no source map or local capability module. The worker guards private paths and app routes; sensitive pages get no-store/noindex, CSP, no-referrer and content-type protection. Marketing assets are copied byte-for-byte, not redesigned. No deploy command/CI or automatic production migration was installed.
- **Environment separation:** disabled staging/production example configurations are separate. The integrated adapter accepts explicitly approved HTTPS staging only and rejects the live apex/www hosts and all production environments. Production ordering is deliberately unavailable until real security/legal/recovery review; changing the production template alone cannot launch it.
- **Guest checkout/tracking:** `/api/ordering/` connects the existing checkout, catalogue/estimate, atomic order creation, durable OTP outbox and scoped guest history/logout. Real-address staging tests require matching explicit server/database allowlists; defaults remain fictional `.test` examples. Eight-digit codes, five-minute expiry, five-attempt/single-use rules, generic responses, secure thirty-minute cookies, CSRF and isolation are retained. Outbox attachment failures now preserve the generic request response instead of revealing which requests progressed.
- **Turnstile:** the staged browser adapter requests action-specific challenges and sends tokens to the mandatory server guard. Host/action/freshness/provider JSON/replay checks and SQL limits remain enforced. Missing configuration fails closed. There is no production test-key bypass. Live FormSubmit remains the existing public enquiry workflow; no duplicate backend enquiry delivery was activated.
- **Staff Auth:** packaged `/admin/` supports invited-staff password sign-in, TOTP enrollment/challenge/verification and logout through the Supabase protocol. JWTs are memory-only, not browser-storage sessions. Server signature/issuer/audience/expiry, live-user checks, aal2, active staff/assignments and recent TOTP still apply. A new private RPC also checks `auth.sessions` membership and a thirty-minute session age, addressing signed access tokens that can otherwise outlive logout. Roles are never granted by email alone. The local synthetic session implementation is split into an excluded module.
- **Email:** the same staged runtime connects the previously prepared Resend sender/webhook and bounded server maintenance/dispatch function. Sending, webhooks and scheduling each require separate approval gates; no schedule is registered. API acceptance remains distinct from delivery/inbox receipt. Resend's documented Svix headers and raw-payload signature format were checked against the official documentation; the reader now bounds raw webhook input before parsing. No real webhook or email was received/sent.
- **Manual artwork:** uploads and web previews remain disabled. A safe-manual-process integration registers immutable, reviewed proof versions covering every distinct design, with proof hashes/private archive references. Owner-only, recent-MFA approval recording requires the actual customer's reply identity, received time, exact current version, reply hash and evidence reference. A replacement invalidates old approval; proof changes after production starts are refused. The app does not inspect the owner's mailbox, certify an image from its hash or invent customer consent.
- **Payment/production:** independently verified manual receipts remain the only paid source. Shipping must also be funded before physical production. Accepted service quotes can begin processing after their agreed deposit, while ready/completed requires the full amount. Owner-approved external refunds have a separate verified-evidence record, immutable ledger, stable idempotency and customer-facing refund states. Approval/draft instructions never move funds or count as received revenue. Pending refund approvals no longer double-count already-recorded refunds. Production is held after confirmed refunds for review.
- **Retention:** new maintenance scrubs expired code secrets, expired sessions/rate/bot/reservation records, aged OTP identity and old terminal draft bodies without deleting financial/audit/approval records. Manual proofs now qualify for advance retention notices. Owner-only hold/deletion-evidence actions enforce completion age and delivered-notice grace before recording actual external deletion. This is explicitly a human attestation; software does not pretend to delete email/off-site bytes. Future uploaded-object deletion remains disabled pending safe storage fencing/reconciliation.
- **GST:** a draft-only, integer-cent calculation helper refuses unreviewed classes, preserves gross totals and specifies nearest-cent extraction per approved gross line. It has no invoice-issue API. ABN/legal seller/classifications and accountant approval remain missing; no final invoice, public tax wording or advertised price was changed.

Migrations `012_integration.sql`, `013_manual_refunds.sql` and `014_manual_retention.sql` are transactional and version-controlled. Private tables have RLS/revocations, RPCs are narrowly service-role-only, critical state changes lock records and audit evidence, and accepted financial/proof history remains immutable. They were executed only in disposable local PGlite databases.

## Real versus mocked integration evidence

| Component | Actually tested | Still unverified |
| --- | --- | --- |
| Database/RPC/RLS | All 14 migrations, real SQL/PLpgSQL and role-denial assertions in PGlite | Hosted PostgreSQL/PostgREST grants, inherited policies and multi-connection races |
| Staff Auth/MFA | Ephemerally signed JWT verification; browser password/TOTP/enrollment protocol with mocked Auth; DB session deletion/age denial | Actual invited accounts, TOTP factors/recovery, provider logout/revocation and hosted `auth.sessions` permissions |
| Guest OTP | Encrypted outbox → mock sender → code verification → private history → logout | Real recipient delivery/latency and the approved HTTPS domain |
| HTTPS/cookies | Real TLS loopback server using an ephemeral self-signed test certificate; Secure/HttpOnly/Strict cookie transport and JS denial | Public certificate chain/SANs, apex/www redirects and Cloudflare hosting |
| Turnstile | Browser adapter plus server validation using synthetic Siteverify results, invalid/action/replay rejection | Actual widget/challenge, provider failures and hostname configuration |
| Transactional email | Mocked HTTP/JSON outcomes, signatures, deduplication, retries/leases/budgets and expiry checks | Real sender/DNS, authenticated webhook traffic, inbox receipt, suppression/reconciliation and approved schedule |
| Artwork | Version/evidence/permission/production guards and owner-attestation retention, synthetic data only | Real safe file review, actual customer reply, archive capacity, delivered deletion notices and external deletion rehearsal |
| Backups | Authenticated encrypted database/private-byte archive restored into a fresh local engine; wrong-key/tamper tests | Hosted DB/Auth/private-file recovery, off-site access and measured recovery objectives |
| Public forms/animations | Existing mocked/invariant checks and reduced-motion browser smoke; assets unchanged | No new production enquiry/inbox delivery test was performed |

Read-only public documentation was retrieved successfully; it is **not** service-integration evidence. Sources checked on this date: [GitHub Pages restrictions](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Cloudflare terms](https://www.cloudflare.com/terms/), [Pages advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Supabase pricing](https://supabase.com/pricing), [Supabase sessions/logout](https://supabase.com/docs/guides/auth/sessions), [TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [Resend pricing](https://resend.com/pricing), [Resend verification](https://resend.com/docs/webhooks/verify-webhooks-requests), [Svix signature protocol](https://docs.svix.com/receiving/verifying-payloads/how-manual), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/).

## H2 tests actually executed

```sh
node --test --test-concurrency=1 backend/test/*.test.mjs
node scripts/check-forms.cjs
node scripts/check-hero-scroll.cjs
node scripts/check-motion.cjs
```

**116 backend/security tests passed, zero failures**: the 99 prior checks plus 17 Phase H cases. **101 existing checks passed**: 68 forms, 18 hero and 15 motion. Final full backend execution was sequential to avoid the previous local parallel-startup contention; no security assertion was weakened.

New integration cases cover default-off/live-host rejection, public-key filtering, mandatory bot/action/replay denial, authoritative mixed basket/shipping/five designs, duplicate keys, dual email admission gates, encrypted mock OTP and guest isolation/CSRF/logout, complete synthetic physical fulfilment with partial dispatch, stale/wrong-customer proof denial, shipping-payment guard, accepted service deposit versus final balance, owner-only external refund evidence/replay/ledger, staff session revocation, maintenance, held/early retention denial, GST-draft guards, encrypted recovery and the packaged private-file/auth boundary. The workflow passes **locally with explicitly mocked providers**, not as a real-service end-to-end acceptance test.

Executed browser suites:

```sh
node backend/test/admin-browser.mjs
node backend/test/tracking-browser.mjs
node backend/test/browser-review.mjs
./backend/test/tls.ps1
node backend/test/integration-browser.mjs
```

All prior admin/tracking/checkout responsive scenarios passed at **375, 430, 768, 1024 and 1440 px**. Admin also retained role/assignment denial, quote stages and CSV checks. The new HTTPS suite exercised all three packaged app surfaces at each width, real cookie transport, memory-only staff tokens, mock TOTP enrollment/challenge, structured proof registration, keyboard focus, reduced-motion preferences and logout. It also smoke-tested the unchanged marketing homepage and scrolling at all five widths. External browser requests were intercepted/mocked or blocked, including FormSubmit. No actual screen-reader certification, hosted load test, public SSL validation or real provider delivery is implied.

Development runs exposed a missing variable/import during refactoring, an SQL quoting error and two incorrect new fixture expectations; these were corrected before final passes. Negative tests still refuse bad payments, stale approvals, early deletion, access violations and invalid challenges. Generated local TLS keys stay in ignored cache and were not installed into Windows certificate stores or committed.

The staged change contains 53 files, including 15 synthetic screenshots. A targeted credential-pattern scan found no keys, private-key blocks, credential-bearing database URLs or encoded secret JWTs in staged text files; private caches/dependencies are excluded. This is a targeted check, not a replacement for hosted security review. GitHub review confirmed PRs #1–#5 are still open drafts and unmerged, with their stacked bases preserved.

### Screenshots

Fifteen synthetic-only screenshots are in `phase-h-screenshots/`; mobile/desktop samples were visually inspected. No credential, TOTP setup key, OTP or session token appears.

| Width | Checkout | Tracking | Staff workspace/proof form |
| --- | --- | --- | --- |
| 375 | [image](phase-h-screenshots/checkout-375.png) | [image](phase-h-screenshots/tracking-375.png) | [image](phase-h-screenshots/admin-375.png) |
| 430 | [image](phase-h-screenshots/checkout-430.png) | [image](phase-h-screenshots/tracking-430.png) | [image](phase-h-screenshots/admin-430.png) |
| 768 | [image](phase-h-screenshots/checkout-768.png) | [image](phase-h-screenshots/tracking-768.png) | [image](phase-h-screenshots/admin-768.png) |
| 1024 | [image](phase-h-screenshots/checkout-1024.png) | [image](phase-h-screenshots/tracking-1024.png) | [image](phase-h-screenshots/admin-1024.png) |
| 1440 | [image](phase-h-screenshots/checkout-1440.png) | [image](phase-h-screenshots/tracking-1440.png) | [image](phase-h-screenshots/admin-1440.png) |

Old phase screenshots regenerated by regression tests were restored rather than mixed into this review.

## Free-tier and hosting assessment

Proposed arrangement remains GitHub source → allowlisted Cloudflare Pages/Worker staging → private Supabase Free → Resend Free and Turnstile. It is conditional on account eligibility, actual hosted security and owner migration approval. GitHub Pages' commercial-transaction restrictions are unresolved for a future ordering release; moving only the API does not establish compliance. Cloudflare's reviewed free-service terms restrict credit-card information processing: no card details are collected and Revolut is not implemented. No individual provider approval is claimed.

Current assumptions remain Supabase 500 MB DB/1 GB files/5 GB egress plus 5 GB cached with free inactivity pauses; Workers 100,000 requests/day and 10 ms CPU; Resend 3,000/month and 100/day. Local limits remain conservative: 400 MB DB soft guard, 900 MB artwork budget, 80,000 requests/day, 90 mail attempts/day and 2,700/month with OTP reserve. Provider-wide usage, failover, image CPU and actual capacity need hosted checks. No subscription, paid upgrade, new external resource or automatic billing was configured. Emailed artwork does not create unlimited free capacity: the owner must verify private archive/mailbox/off-site space and recovery.

## Final launch checklist

### Completed and verified locally

- [x] Reused existing design/catalogue/basket, server totals and guest-only model.
- [x] Connected staged checkout/tracking/staff/email/bot boundaries with default-off gates.
- [x] Preserved unpaid state, independent manual receipt/refund evidence and immutable history.
- [x] Added a version-bound manual proof alternative and payment/shipping/production guards.
- [x] Enforced customer isolation, staff roles, MFA/session checks, CSRF and private bundle boundaries in tests.
- [x] Added retention cleanup/holds/owner-attested deletion and fresh-engine encrypted recovery evidence.
- [x] Completed the executable local/backend/browser/form/animation checks and screenshots above.

### Ready for owner-controlled setup — not permission to change services

- [ ] Create/authorise isolated Supabase/Cloudflare/Resend/Turnstile staging accounts with MFA and free limits.
- [ ] Authorise the staging deployment/origin and safe manual application of reviewed migrations; no reset scripts.
- [ ] Privately provision owner/staff UUIDs/roles, verify real TOTP/recovery, store server secrets and approved recipient allowlists.
- [ ] Approve sender DNS and a separate sales Gmail destination, preserving incoming MX/forwarding; authorise a controlled real-email test.
- [ ] Supply verified legal seller identity/ABN, approved GST classifications, saleable scopes and accountant/legal policy/invoice review.
- [ ] Provide an existing private artwork archive, safe file-review process, off-site encrypted backup destination, operator and retention plan.

### Blocked / must pass before production approval

- [ ] Real hosted migrations/RLS/Storage/service-role/session revocation and multi-connection concurrency tests.
- [ ] Actual Turnstile widget/server verification, sender/webhook/inbox/latency tests and reliable approved maintenance/dispatch scheduling.
- [ ] Real HTTPS/custom-domain/apex-www certificate/redirect/cookie tests; commercial-hosting migration approval.
- [ ] Actual hosted database **and** private-file/Auth recovery rehearsal, key retrieval and measured recovery objectives.
- [ ] Owner rehearsal of emailed artwork, all sides/designs, real reply evidence, verified bank funds, dispatch and notice/hold/deletion handling. Physical fulfilment is not launch-verified until this succeeds.
- [ ] Full real-service end-to-end acceptance evidence and remaining accessibility/performance/privacy review.
- [ ] Complete compliance correction and a separately reviewed production adapter/release; current production ordering stays disabled.

Secure web uploads/previews remain disabled because safe decoding/re-encoding/pixel limits, signed access, replacement/reservation conversion and orphan/deletion fencing have not been demonstrated on the free runtime. They are optional for the initial launch only if the manual alternative is operationally verified. If it is not, physical NFC fulfilment remains blocked.

### Deferred

- Revolut Merchant and live card payments.
- Automatic Australia Post integration; tracking remains recorded manually.
- Advanced analytics and optional business features.

## Owner instructions, DNS, integration order and rollback

The [updated operations runbook](OPERATIONS.md#phase-h-update--read-this-first) contains step-by-step account/secret setup, safe migration order, real staff enrollment/recovery, manual proof/payment/refund/retention steps, DNS change/rollback, stacked PR order and production rollback. [Email setup](EMAIL_DNS_SETUP.md) preserves incoming forwarding and identifies provider-specific records that cannot be invented before account creation. [Policy/invoice drafts](POLICY_AND_INVOICE_DRAFTS.md) remain unissued.

Do not merge the stacked branches while GitHub Pages publishes the repository root. Approve the safe hosting/build plan first; integrate #1 → #2 → #3 → #4 → #5 → H without dropping ancestor commits, keeping drafts until explicit merge approval. Do not publish the live domain or activate services automatically. A code rollback must preserve orders, audit, ledger and deduplication, not run destructive down migrations or replay emails/payments.

**Decision: ready for code review and owner-assisted isolated staging setup; not ready for launch approval.** Stop after Phase H. No further phase, merge, DNS change or deployment is authorised by this report.

## Changed files

The list below covers this development change only; unrelated untracked emoji/tmp files are excluded.

- `backend/.env.example`
- `backend/README.md`
- `backend/build.mjs`
- `backend/config/production.example.json`
- `backend/config/staging.example.json`
- `backend/entry.mjs`
- `backend/local.mjs`
- `backend/migrations/012_integration.sql`
- `backend/migrations/013_manual_refunds.sql`
- `backend/migrations/014_manual_retention.sql`
- `backend/package.json`
- `backend/pnpm-lock.yaml`
- `backend/public/admin.js`
- `backend/public/checkout.js`
- `backend/public/staff-auth.js`
- `backend/public/staging-bot.js`
- `backend/public/tracking.js`
- `backend/src/admin.mjs`
- `backend/src/api.mjs`
- `backend/src/auth.mjs`
- `backend/src/core.mjs`
- `backend/src/integration.mjs`
- `backend/src/launch-email.mjs`
- `backend/src/local-admin-session.mjs`
- `backend/src/repository.mjs`
- `backend/src/tax-draft.mjs`
- `backend/src/tracking.mjs`
- `backend/staging.mjs`
- `backend/test/admin.test.mjs`
- `backend/test/database.mjs`
- `backend/test/integration-browser.mjs`
- `backend/test/integration.test.mjs`
- `backend/test/tls.ps1`
- `docs/ordering/EMAIL_DNS_SETUP.md`
- `docs/ordering/OPERATIONS.md`
- `docs/ordering/PHASE_H_REPORT.md`
- `docs/ordering/POLICY_AND_INVOICE_DRAFTS.md`
- `docs/ordering/README.md`
- `docs/ordering/phase-h-screenshots/admin-1024.png`
- `docs/ordering/phase-h-screenshots/admin-1440.png`
- `docs/ordering/phase-h-screenshots/admin-375.png`
- `docs/ordering/phase-h-screenshots/admin-430.png`
- `docs/ordering/phase-h-screenshots/admin-768.png`
- `docs/ordering/phase-h-screenshots/checkout-1024.png`
- `docs/ordering/phase-h-screenshots/checkout-1440.png`
- `docs/ordering/phase-h-screenshots/checkout-375.png`
- `docs/ordering/phase-h-screenshots/checkout-430.png`
- `docs/ordering/phase-h-screenshots/checkout-768.png`
- `docs/ordering/phase-h-screenshots/tracking-1024.png`
- `docs/ordering/phase-h-screenshots/tracking-1440.png`
- `docs/ordering/phase-h-screenshots/tracking-375.png`
- `docs/ordering/phase-h-screenshots/tracking-430.png`
- `docs/ordering/phase-h-screenshots/tracking-768.png`

## Phase H addendum — consent-gated GA4/GTM (18 November 2026)

Implemented on this same development branch, without restarting Phase H or changing its backend-provider architecture. Configuration names the owner's **GTM-NK56RDLX**, but the actual GA4 Measurement ID is still blank and both owner-review/enable gates are **false**. Nothing has been published or activated. PR #6 remains a draft targeting Phase G; no previous PR was merged.

The new central first-party helper replaces the old standalone Google loader. It requires basic opt-in before GTM, uses explicit allowlisted page/product/basket/checkout/confirmed-lead events, keeps advertising denied and excludes customer-entered values, private routes and sensitive URLs. Withdrawal disables the known GA property and refreshes the document to unload executed tags; the preferences UI warns about unsaved input. Google never loads on admin or order-history/OTP pages. Generic consented lookup events use a short-lived local relay to the next public page, with no customer identifiers.

`order_submitted` is an unpaid, pending-approval order event, **not a purchase**. Random submission keys and locally hashed server order UUIDs prevent repeat conversions on the same browser/origin within bounded storage retention. IDs are not transmitted. There is no purchase/manual-payment analytics event. Existing forms still use their verified FormSubmit workflow, including safe failure drafts; only confirmed provider success generates leads. The new tests contact no actual analytics, email or order service.

Setup and schema: [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md). It contains the exact GTM tag/trigger/consent setup, GA4 ID instructions, owner container audit, DebugView/Realtime checks, key events, funnels, privacy draft review and attribution limitations. The account/container audit and real property checks remain unperformed and are required before any activation approval. Final cross-subdomain attribution depends on the owner's final hosting decision. Campaign/referrer detail and private-page events are deliberately restricted; these reports will not represent all visitors or all real orders.

### Addendum validation

- **131 backend/security/analytics tests passed**: the original 116, 14 new analytics-runtime tests and one packaging/CSP-boundary test. Executed with `node --test --test-concurrency=1 backend/test/*.test.mjs`.
- **101 existing public checks passed**: 68 form, 18 hero-scroll and 15 motion checks. No animation code, catalogue or prices changed.
- **68 new mocked browser assertions passed**, at 375/430/768/1024/1440px: no Google before consent/rejection, accept once, explicit page-view dedupe, confirmed and failed contact forms, safe data, withdrawal/reload, checkout stages, unpaid conversion/retry/reload dedupe, no Google on private pages, lookup relay, admin exclusion and ordering with GTM blocked.
- Existing checkout, tracking, owner-admin and integrated HTTPS browser suites all passed at 375/430/768/1024/1440px. Role-assignment denial, quote stages, financial CSV, secure OTP cookies, staff MFA/logout, keyboard focus, reduced motion and homepage/scroll smoke checks also passed. Previously generated screenshots were not replaced in the review commit.
- Tests use synthetic records only. GTM is stubbed/intercepted; no real GA collection, FormSubmit enquiry, real email or payment was sent. The existing browser scripts refresh historical synthetic screenshots during review; those timestamp-dependent image changes are excluded from the addendum commit.

### Exact addendum files

`js/config.js`, `js/analytics.js`, `js/main.js`, `privacy.html`, `privacy/index.html`, `backend/entry.mjs`, `backend/local.mjs`, `backend/public/checkout.html`, `backend/public/checkout.js`, `backend/public/tracking.html`, `backend/public/tracking.js`, `backend/test/analytics.test.mjs`, `backend/test/analytics-browser.mjs`, `backend/test/integration.test.mjs`, `docs/ordering/ANALYTICS_SETUP.md`, `docs/ordering/PHASE_H_REPORT.md`.

No admin UI, authentication, catalogue, order database, pricing, hero/NFC/scroll animations, form styling, layout, DNS, hosting settings, payment integration or PACES material was changed. This addendum is ready for development review only, not production activation.

### Confirmed Measurement ID follow-up

The owner supplied **G-4L3JN7WC5M**, now recorded in `js/config.js` alongside **GTM-NK56RDLX**. This supersedes the earlier missing-ID note; container configuration/audit, real DebugView testing and owner activation approval remain outstanding. Both `analyticsEnabled` and `analyticsContainerReviewed` remain **false**. No runtime event/consent/private-page logic changed.

Re-ran all **132 backend/security/analytics tests** (including a new confirmed-ID/dormant-switch guard), **101 public checks**, **68 mocked analytics browser assertions**, and existing checkout/tracking/admin/integrated HTTPS browser suites at **375, 430, 768, 1024 and 1440 px**; all passed. The browser harness always replaces the configured ID with its mock-only ID and intercepts Google requests. No real Analytics, email or payment request was sent. Updated setup instructions identify the exact ID to configure inside GTM. No container publication, merge or deployment performed.
