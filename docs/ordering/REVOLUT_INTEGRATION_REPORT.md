# NetBud Merchant Sandbox integration

28 November 2026. Development branch codex/netbud-full-launch, PR #8.

## Actual hosted admin results

Read-only Supabase inspection confirmed the existing active owner UUID bf9b95f7-54f8-4d1a-9101-0188702a601e, one verified TOTP factor and one recent Auth session. The session-live database function returned true. In the owner's actual HTTPS browser session, the dashboard opened as Staff owner. Reports and Staff views loaded, including the correct owner UUID and active state. The existing overview showed zero orders and received revenue of A$0.

The agent clicked End session as part of the authorised logout test. The browser returned to Staff sign in, and a subsequent hosted Auth query counted zero remaining sessions for the owner. Backend authorisation checks require that live session record. Direct replay of a saved pre-logout bearer token was not performed, and no token was extracted. Natural 30-minute expiration and owner MFA recovery remain untested on the real provider. Mocked JWT/session expiration and revocation tests remain separately recorded in the backend suite. Other staff role denial and payment/quote operations are tested with synthetic local database identities; no additional real staff identities were provisioned.

To continue owner testing, sign in again with the existing password and authenticator. Keep setup keys, passwords and codes private. For recovery, retain owner-controlled access to the Supabase organisation and authenticator backup. A lost-factor recovery rehearsal needs verified owner identity and an approved recovery procedure. Do not disable MFA or grant privileges from an email match.

## Implemented development flow

- Merchant Sandbox API and Hosted Checkout Page. Server uses the documented API version 2026-10-06 and the fixed Sandbox API host. Production API origins are rejected.
- Owner demo at /admin/payments/ uses the existing password/TOTP frontend. Server checks active owner role, live Auth session and fresh MFA. Customer endpoints additionally require the existing verified guest session, CSRF token and guest staging gate.
- The private reservation RPC locks the NetBud order, checks ownership, acceptance and synthetic-only status, derives balance including shipping or an accepted quote deposit, and reserves exactly one unresolved provider attempt. Browsers cannot supply prices. Mixed baskets with unresolved quotes are refused until acceptance.
- Provider-created checkout_url is validated and returned for browser navigation. The redirect to /payment/ contains no order ID, bearer token or proof of payment. Customers verify their email and match their recorded order reference before reading or initiating payment.
- Create-order POST is issued once per reservation. The current create-order reference does not document an idempotency header. Network timeouts, invalid success responses and 5xx results leave an uncertain reservation that blocks another creation. A verified signed webhook can recover the mapping using server-generated intent metadata. Missing response plus missing webhook needs provider reconciliation before retrying. A definitive provider rejection permits a new attempt with a new key.
- Webhooks verify HMAC-SHA256 over the timestamp prefix and exact received bytes, with a five-minute tolerance, bounded body and rate limit. Current and time-limited previous signing secrets are supported. The event requests a canonical provider GET; its claimed payment state never directly records success.
- Canonical amount, AUD currency, metadata mapping, order ID and completed transaction amounts must match. References are unique, duplicate events are safe, stale provider snapshots are ignored, and completed/refunded results cannot regress to pending states. Authorised or failed attempts create no received-funds record. Refund amounts and dispute review flags are retained.

Sandbox receipts and transactions have separate private tables. They never add real business revenue, alter manual payments, issue refunds/captures or release fulfilment. Sandbox outstanding balances are derived separately. A future production payment ledger adapter requires explicit review and approval.

## New hosted database change awaiting approval

Prepared SQL is backend/review/015_revolut_sandbox.sql. It is deliberately outside the automatic migration directory and has not been applied to hosted Supabase.

LF-normalised SHA-256 is 6a0bde5394722070beb3092afc9e84cc1c4a9301e7da05300e8d3c9610357d32.

The transaction creates only three private tables (revolut_intents, revolut_events, revolut_transactions), their constraints/indexes, immutable evidence triggers, and one server-only public.netbud_revolut RPC. All three tables have RLS and denied client access. The RPC denies public/anon/authenticated execution and grants execution to service_role. Existing migrations, financial rows, Auth settings, staff roles and production records are unchanged.

Approval requested is to apply this exact additive transaction once to netbud-staging / pzorzppbxgqespexuers, then verify hosted ACLs, constraints and synthetic transactions. This does not enable payments or approve production use. Any SQL change requires a refreshed checksum and review.

## Cloudflare configuration

No Revolut bindings were present in the inspected staging settings. Enter secrets directly in Cloudflare Variables and secrets, never in chat or source control.

| Name | Type | Staging value or source |
| --- | --- | --- |
| REVOLUT_MERCHANT_API_BASE_URL | Text | https://sandbox-merchant.revolut.com/ |
| REVOLUT_MERCHANT_API_KEY | Secret | Authorised Merchant Sandbox key with Orders read/write |
| REVOLUT_WEBHOOK_SECRET | Secret | Signing secret from the Sandbox webhook registration |
| REVOLUT_WEBHOOK_PREVIOUS_SECRET | Secret | Optional old signing secret during provider rotation only |
| REVOLUT_WEBHOOK_PREVIOUS_UNTIL | Text | Optional ISO expiry matching the provider rotation window |
| REVOLUT_SANDBOX_APPROVED | Text | false until migration/configuration approval and provider eligibility checks |
| REVOLUT_WEBHOOK_APPROVED | Text | false until signed callback testing is approved |
| PAYMENTS_MODE | Text | disabled |

The future Sandbox callback URL is https://netbud-staging.pages.dev/api/revolut/events. Register it only after the approved migration and verified allowlisted build are deployed. Do not alter the existing email webhook setting. Guest ordering, emails, uploads and the scheduler remain disabled. Owner demonstrations can use the owner-only payment page while guest ordering remains closed.

The inspected browser had a Revolut sign-in page, not verified Merchant Sandbox API access. Approved Business status alone establishes neither Merchant eligibility nor order-create permissions. Owner must confirm Merchant/API access in the API Console and select Sandbox. Current official documentation makes request signing optional in Sandbox, while Production requirements depend on the API key's signing setup. This implementation supports Sandbox only.

## Tests executed

- Full backend suite passed 147 tests, including existing financial, checkout, tracking, auth and packaging regression checks.
- Final targeted rerun passed all 13 Revolut tests after fixes. Tests exercise quote deposits, server shipping totals, shared reservations/concurrent requests, declined attempts, authorisation, abandonment, uncertain timeouts, HMAC tampering/expiry/rotation, duplicates, delayed snapshots, unknown metadata, amount/currency mismatch, refunds, disputes and preservation of real revenue/fulfilment.
- Forms 68, hero 18, motion 15 and growth/SEO 428 checks passed.
- New mocked payment browser flow passed at 375, 430, 768, 1024 and 1440px. Existing HTTPS integration browser flow also passed at those widths with mocked Auth, mail and Turnstile.
- New allowlisted build verified 190 files. SQL, reviews, probe, fixtures, secrets and internal documents are excluded.
- Real Revolut Sandbox API calls, card tests and signed hosted callbacks performed: zero. Blocked on Sandbox credentials and migration approval. New Sandbox application code is not deployed.
- No migrations 001–014 were rerun. No live site, DNS, email routing or PACES changes were made.

Initial local failures exposed an ambiguous SQL column and two incorrect test expectations. They were corrected and the affected tests rerun. Mocked provider results do not establish real Merchant eligibility or actual Sandbox payment completion.

## Remaining launch gates and owner actions

1. Approve the exact reviewed staging-only SQL above.
2. Privately provide Merchant Sandbox credentials through Cloudflare, confirm Merchant/API eligibility, and authorise the Sandbox webhook registration. Then run the official test-card scenarios and canonical API reconciliation using synthetic orders.
3. Complete natural hosted session-expiration and owner recovery checks. Actual owner MFA, reports, staff view and logout were observed.
4. Verify real guest OTP delivery, customer checkout, backups/restore, refund operations, seller identity, terms and tax treatment before any public payment release.

Do not merge or enable real-money payments. On a failed staging rollout, disable Revolut gates and restore the previous verified artifact. Preserve reservations and immutable evidence, especially uncertain provider outcomes. Use a reviewed forward database correction instead of dropping the new tables or replaying schema migrations.

## Official references

- [Merchant get started](https://developer.revolut.com/docs/guides/merchant/get-started)
- [Hosted Checkout Page API](https://developer.revolut.com/docs/guides/merchant/accept-payments/online-payments/hosted-checkout-page/api)
- [Merchant API version and order reference](https://developer.revolut.com/docs/api/merchant)
- [Webhook verification](https://developer.revolut.com/docs/guides/merchant/monitor-and-observe/webhooks/verify-the-payload-signature)
- [Environments](https://developer.revolut.com/docs/guides/merchant/test-and-go-live/environments)
- [Signing requirements](https://developer.revolut.com/docs/guides/api-console/signing-requirements)
