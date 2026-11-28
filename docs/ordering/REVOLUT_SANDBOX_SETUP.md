# Revolut Sandbox preparation

28 November 2026. The development-only probe reads a synthetic existing Merchant Sandbox order. It is excluded from the allowlisted deployment and has no payment-writing or database-writing capability. No real provider request has been made.

In the Revolut API Console select Sandbox and privately configure an authorised key with order-read permission. Preserve the server environment names documented by Revolut.

Set REVOLUT_MERCHANT_API_BASE_URL to https://sandbox-merchant.revolut.com/ and REVOLUT_MERCHANT_API_KEY through a private local secret environment. Never paste the key into chat, command arguments or tracked configuration. Then run the following with a synthetic Sandbox order UUID.

```powershell
node backend/review/revolut-sandbox-probe.mjs YOUR-SANDBOX-ORDER-UUID
```

The probe pins the current documented API version 2026-10-06, rejects live origins and redirects, and prints only Sandbox state, amount and currency. A pending Sandbox order establishes no payment receipt. This preparation does not connect customer checkout, accept callbacks, reconcile payments, capture funds or process refunds.

Further integration needs authorised Sandbox access, signed-webhook verification, durable replay/idempotency records and canonical status reconciliation before any payment state can change. Keep PAYMENTS_MODE=disabled and guest ordering closed.

Official references reviewed on 28 November 2026.

- [Merchant environments](https://developer.revolut.com/docs/guides/merchant/test-and-go-live/environments)
- [Set up test environment](https://developer.revolut.com/docs/guides/merchant/test-and-go-live/set-up-test-environment)
- [Merchant API and version header](https://developer.revolut.com/docs/api/merchant)
