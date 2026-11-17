# NetBud FormSubmit setup and verification

Status: the owner confirmed recipient activation AND receipt of a second test enquiry on 17 November 2026. `formDeliveryVerified` is now true. Codex has not accessed the inbox or sent production test enquiries. This does not mean every individual form has been inbox-tested.

## Verification

Use FORM_VERIFICATION_CHECKLIST.md to check the 23 distinct form placements. Use your own real details, verify the email subject, source URL, fields and Reply-To, then tick each form. For the basket, select products and quantities before submitting. Old .html URLs and /product/?id=... are aliases of these forms, not additional enquiry types.

If changing the recipient or moving to a new origin, set `formDeliveryVerified` false, submit one test, open the recipient inbox yourself, confirm FormSubmit’s activation message, then submit a second test and confirm receipt before restoring true. An activation link alone is not proof of delivery.

## Behaviour

All callback, contact, preview, product and quote basket forms use `setupForms()` in `js/main.js`. They send JSON, remain on the page, lock controls during the request and time out after 20 seconds. The existing required-field checks, Australian phone validation and spam trap remain. Basket submissions contain human-readable product names and quantities, plus the existing summary.

Subjects are `NetBud | Callback Request`, `NetBud | Business Enquiry`, `NetBud | Free Homepage Preview Request`, `NetBud | [Product name] Enquiry`, or `NetBud | Quote Basket Enquiry`. Payloads contain `email` and `_replyto`, `_template: table`, `_honey`, enquiry type, page URL, selected product/service, all supplied fields, marketing preference and summary.

HTTP 200 alone is rejected as proof. The JSON must contain boolean `true` or string `"true"` in `success`, no service error, no activation/verification instruction, and the owner-verified configuration must be enabled. HTML, malformed JSON, negative responses, network errors and timeouts retain input and expose the existing email/WhatsApp/copy draft fallback. There are no automatic retries and no frontend secrets.

After verified acceptance, the message is: "Thanks! Your enquiry has been submitted. We'll be in touch soon." Changed basket/form details remain on the page; a request is never described as a confirmed order.

## Checks

Run `node scripts/check-forms.cjs` for 68 assertions using the actual shared handler with mocked fetch responses. No network requests are made. It covers six form placements/types, JSON true/false/string responses, malformed JSON/HTML, activation, unverified setup, HTTP/network errors, timeout, duplicate prevention, validation, honeypot, empty basket, payload contents and recovery.

The real service response and inbox receipt must be checked during the owner's two-test activation flow. Mocked results are not proof of delivery.

Documentation consulted: https://formsubmit.co/ajax-documentation and https://formsubmit.co/documentation
