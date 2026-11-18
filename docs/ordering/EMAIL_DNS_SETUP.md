# Phase G — transactional email setup for owner review

Prepared 18 November 2026. **Instructions only: no account, DNS, forwarding or sending changes were made.** Existing FormSubmit enquiries remain separate and verified; their activation does not verify Resend.

## Provider decision

| Free option | Published allowance checked today | NetBud fit |
| --- | --- | --- |
| Resend | 3,000 messages/month, 100/day; one domain and one webhook | Selected integration candidate: small API, idempotency and signed delivery events |
| Brevo | 300 messages/day; unused allowance does not roll over | More daily headroom; viable alternative if NetBud exceeds Resend's cap |

Sources: [Resend pricing](https://resend.com/pricing), [Brevo free plan](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans). This is an engineering choice, not evidence that either provider has better measured inbox delivery. Neither free plan is an uptime or inbox-placement guarantee. At 100 orders/month and six notifications/order, roughly 600 messages plus OTP requests fit Resend's monthly allowance; daily peaks and abuse can still exhaust it. Do not automatically switch providers after an ambiguous send: that risks duplicate mail.

NetBud's candidate dispatcher budgets every attempt, including retries, at no more than 90/day and 2,700/month. Twenty daily slots are reserved for OTP. Messages wait when capped; expired OTP is discarded. These local caps do not know about other apps using the same account. Use a dedicated account/key/domain allocation and reconcile dashboard usage. No paid plan or automatic upgrade is configured.

## Owner setup, after approval

1. Create a free Resend account and enable account MFA. Add **netbud.com.au** as a sending domain. Do not enable inbound mail routing through Resend.
2. Export/screenshot existing GoDaddy DNS first. Keep nameservers, website A/AAAA/CNAME records, root MX, forwarding TXT and existing DMARC unchanged.
3. Open the new domain's Resend DNS panel. Add only its sending records in GoDaddy → netbud.com.au → DNS → Add Record. The usual relative hosts are below; **the account's actual panel is authoritative**. A unique DKIM key and selected-region MX cannot be known before this account exists.

| Type | GoDaddy Name/Host | Value | Priority / TTL |
| --- | --- | --- | --- |
| TXT | `resend._domainkey` (or exact selector shown) | Copy the entire generated DKIM public-key value from Resend | Default TTL |
| TXT | `send` (or configured return-path label) | Copy the exact Resend SPF value; commonly `v=spf1 include:amazonses.com ~all` | Default TTL |
| MX | `send` (same return-path label) | Copy Resend's **region-specific** `feedback-smtp…amazonses.com` target | Use displayed priority, commonly 10; default TTL |

Do not paste placeholder words into DNS. GoDaddy normally appends the domain to a relative host: check that the final host is `send.netbud.com.au`, not `send.netbud.com.au.netbud.com.au`. If `send` is already in use, stop and select a non-conflicting return-path in Resend before changing that label. Never add a second SPF TXT at the same hostname. Existing root SPF and `send` SPF are separate hosts. Follow [Resend's GoDaddy guide](https://resend.com/docs/knowledge-base/godaddy) and [MX conflict explanation](https://resend.com/docs/knowledge-base/how-do-i-avoid-conflicting-with-my-mx-records).

4. Wait for Resend to verify DKIM/SPF and sending. Preserve the existing `_dmarc` record; review alignment/reporting before changing its policy. No instruction here relaxes DMARC.
5. Keep `sales@netbud.com.au` receiving through the existing incoming mail/forwarding provider. The owner supplied **sales@netbud.com.au**, but has not supplied the separate personal Gmail destination. Do not forward sales to itself. Confirm the destination privately with the owner; preserve working catch-all or bilal forwarding until then. Do not create a Gmail account or change root MX for this step.
6. Store a least-privilege sending key and webhook signing secret in the future server secret store only. Use `noreply@netbud.com.au` as From and `sales@netbud.com.au` as Reply-To. Neither address requires moving incoming MX to Resend. Do not put keys in `js/config.js`, HTML, GitHub issues or screenshots.
7. After hosted staging is approved, register **one** HTTPS signed webhook for delivered, bounced, failed and complained events. `handleResendWebhook` is default-off and has no installed route. It verifies the raw body, signature and five-minute timestamp window. Unknown message IDs return retryable failure to handle a webhook arriving before the send response is saved. Verify actual provider retry behaviour in staging.
8. With explicit owner permission, allowlist one owner-controlled real recipient for a controlled test. Enable sending only after domain verification and approval gates. Test OTP expiry, resend, inbox delivery, Reply-To, bounce, webhook replay and quotas. The owner must confirm receipt; API acceptance and a provider delivery event do not prove inbox placement or reading.

## What the code currently does

`ResendSender` is an unconnected server adapter. It refuses sending without all three approval gates, a server key and a recipient allowlist. Tests replace HTTP with synthetic responses. All real sending remains off. Timeout, malformed success and 5xx results are uncertain, not automatically resent. Explicit 429 rejection can retry with the same provider idempotency key. Five attempts maximum; attempts older than 23 hours are held uncertain before the provider's 24-hour idempotency window ends. See [Resend send API](https://resend.com/docs/api-reference/emails/send-email).

OTP HMAC verification is retained. A separate AES-GCM key seals the short-lived transport code for the outbox, bound to its challenge ID. The envelope is removed on accepted/failed/expired/uncertain completion. Missing envelopes are never sent. Run expiry maintenance regularly once a worker is approved; no scheduler is installed here. Public real-address OTP requests remain disabled, and `.test` restrictions have not been removed.

**Do not activate by changing one environment flag.** Public routes, provider/domain verification, real browser challenges, durable scheduling, hosted security tests and owner approval are still required. The legacy mock dispatcher must never be used as the real sender.
