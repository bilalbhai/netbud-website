# NetBud FormSubmit setup and verification

Status: implemented locally; recipient activation and inbox delivery are NOT verified. No production submissions or activation emails were triggered by Codex. Nothing has been deployed.

## Owner activation

1. Open the local preview and submit ONE enquiry using your own real contact details. Do not use fake customer details. This sends to `https://formsubmit.co/ajax/bilal@netbud.com.au`.
2. Open bilal@netbud.com.au yourself, including Spam/Junk. Find FormSubmit's activation message and follow its confirmation link. Codex does not access or confirm your inbox.
3. Submit another enquiry using your own real details. Confirm you actually receive it, including subject, source URL, customer details, and product/quantity information. Reply to confirm Reply-To points at your entered email.
4. Tell Codex when the second email has arrived. Only then set `formDeliveryVerified: true` in `js/config.js`. This flag is public configuration, not a credential.
5. Approve deployment separately. After deployment, repeat a test on https://netbud.com.au; an activation associated with a different site/origin may require confirmation again.

While the flag is false, the service still receives submissions (so activation and inbox testing work), but the website conservatively shows the preserved draft / unconfirmed-delivery state instead of claiming success or resetting fields. Activation is not evidence of inbox delivery. Never set the flag true solely because an activation link was clicked.

## Behaviour

All callback, contact, preview, product and quote basket forms use `setupForms()` in `js/main.js`. They send JSON, remain on the page, lock controls during the request and time out after 20 seconds. The existing required-field checks, Australian phone validation and spam trap remain. Basket submissions contain human-readable product names and quantities, plus the existing summary.

Subjects are `NetBud | Callback Request`, `NetBud | Business Enquiry`, `NetBud | Free Homepage Preview Request`, `NetBud | [Product name] Enquiry`, or `NetBud | Quote Basket Enquiry`. Payloads contain `email` and `_replyto`, `_template: table`, `_honey`, enquiry type, page URL, selected product/service, all supplied fields, marketing preference and summary.

HTTP 200 alone is rejected as proof. The JSON must contain boolean `true` or string `"true"` in `success`, no service error, no activation/verification instruction, and the owner-verified configuration must be enabled. HTML, malformed JSON, negative responses, network errors and timeouts retain input and expose the existing email/WhatsApp/copy draft fallback. There are no automatic retries and no frontend secrets.

After verified acceptance, the message is: "Thanks! Your enquiry has been submitted. We'll be in touch soon." Changed basket/form details remain on the page; a request is never described as a confirmed order.

## Checks

Run `node scripts/check-forms.cjs` for 68 assertions using the actual shared handler with mocked fetch responses. No network requests are made. It covers six form placements/types, JSON true/false/string responses, malformed JSON/HTML, activation, unverified setup, HTTP/network errors, timeout, duplicate prevention, validation, honeypot, empty basket, payload contents and recovery.

The real service response and inbox receipt must be checked during the owner's two-test activation flow. Mocked results are not proof of delivery.

Documentation consulted: https://formsubmit.co/ajax-documentation and https://formsubmit.co/documentation
