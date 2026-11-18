# Phase H addendum — Google Analytics 4 through Google Tag Manager

18 November 2026. NetBud only. Development branch: `codex/netbud-phase-h-integration`.

## Activation status and decisions

- Owner-supplied container: **GTM-N9B3W4F5**.
- Owner-confirmed GA4 Measurement ID: **G-4L3JN7WC5M**, recorded in `js/config.js`. Configure this exact ID in the Google tag and GA4 event tags inside **GTM-N9B3W4F5** before activation.
- `analyticsEnabled` and `analyticsContainerReviewed` remain **false** in `js/config.js`.
- No Google account/container access was available to audit installed tags. Nothing has been published, deployed or activated. Real DebugView/Realtime and hosted attribution remain unverified.
- GTM is the only Google script loader. The previous standalone `gtag.js` loader was removed. Consent commands use the data layer; they do not install a second library.
- No new hosting/provider or monthly subscription is introduced by this addendum. Existing backend hosting decisions are unchanged.

Google's official async GTM bootstrap is created after consent. Its `gtm.start` event and `gtm.js?id=GTM-N9B3W4F5` script use the default `dataLayer`. There is deliberately no unconditional noscript iframe: it would contact Google before optional consent. No Google preconnect is added.

## Consent and private areas

The existing banner/button styling is reused. Accept analytics, Reject optional analytics and footer Analytics preferences work by keyboard. Consent is stored locally under `netbud-analytics-consent` as `v2:yes` or `v2:no`. Legacy rejection is respected; a legacy acceptance needs fresh consent for the upgraded integration.

Before acceptance: no GTM, GA, analytics events or optional analytics cookies. Rejected users retain functional baskets, forms and checkout. Both owner approval gates, a valid actual Measurement ID, an approved origin, a public route and a safe URL are required even after acceptance.

Consent Mode defaults deny analytics and all three advertising signals. Analytics alone is granted following opt-in; `ad_storage`, `ad_user_data` and `ad_personalization` stay denied. Google signals, advertising personalisation and URL passthrough stay off. Do not add advertising, user-provided-data collection, enhanced conversions, remarketing or Consent Mode advanced denied pings.

Withdrawal saves rejection, sets `ga-disable-<actual Measurement ID>`, expires recognised GA advertising/analytics cookies, clears local analytics dedupe/relay state and refreshes the page to unload already-executed Google code. The preferences panel warns that unsaved entries may be lost. This cannot recall already transmitted requests. A rejected fresh document does not load Google. Another tab withdrawing consent also stops/reloads the active document. The configuration must name the ONLY GA property used by the reviewed container; arbitrary other tags would invalidate this safeguard.

`/admin/`, staff login, financial reports, auth callbacks, artwork and unknown/private routes do not load analytics. `/track/` loads only the first-party helper, **never Google or a data layer**. If previously consented, two generic lookup event names can be queued locally for 30 minutes and emitted on the next allowed public page. No email, code, order ID, challenge, session token, order history or entered value enters this queue. Events are lost if the visitor does not return, withdraws consent or crosses origins. This is a deliberate privacy trade-off.

Unknown query parameters or hashes disable tracking for that document. Only catalogue-validated public product/service/category values, a fixed set of public anchors and explicitly allowlisted UTM values are accepted. Default UTM allowlist is empty. Event URLs omit **all** queries/hashes and customer paths; titles are generic, referrers empty. Do not loosen this to pass arbitrary campaign strings. No linker/decorated checkout URLs or analytics identifiers are added. Do not insert personal information into URLs even when analytics is off.

The privacy policy contains **draft owner-review wording** describing Google, purposes, choices, excluded fields and overseas processing. Before activation, confirm cookie/retention settings, Google's current processing terms and the final privacy disclosure. GA traffic identifiers are pseudonymous, not a promise that Google never processes an IP address.

## Central event schema

`js/analytics.js` is the single helper. Callers pass trusted product IDs/quantities or fixed enums, never form payloads. It reconstructs each event from an allowlist. Standard ecommerce data uses `ecommerce.currency = AUD` and `ecommerce.items` with trusted `item_id`, `item_name`, `item_category`, integer `quantity` and optional numeric `price` in dollars. Public prices describe advertised starting amounts; checkout uses the server catalogue, omitting prices for quote-required services. No browser estimate is treated as an accepted custom quote or paid amount.

All emitted events contain `page_category`, a sanitised `page_location`, generic `page_title` and blank `page_referrer`. Ecommerce/custom fields are cleared before each event to prevent stale data-layer inheritance.

| Event | Trigger and additional safe fields |
|---|---|
| `page_view` | One per allowed document after consent; no GTM automatic page view |
| `view_item_list` | Shop rendered/filtered list; `item_list_id=shop`, ecommerce items; only when IDs change |
| `select_item` | Link to a known public product; `item_list_id=shop` or `public`, one item |
| `view_item` | Known product detail page, one item |
| `add_to_cart` / `remove_from_cart` | Actual added/removed quantity, including quantity edits; not button impressions |
| `view_cart` | One quote-basket view per document, items, `basket_kind`, `item_count` |
| `begin_checkout` | Once nonempty basket has a successful server estimate; `checkout_stage=started`, items, kind/count |
| `add_shipping_info` | Explicit delivery change; `shipping_tier=shipping/pickup/none`, items, kind/count |
| `order_submitted` | Server creates/replays a successful order; `checkout_stage=order_received_unpaid`, items, kind/count and delivery type |
| `generate_lead` | Confirmed FormSubmit JSON success AND owner-verified recipient flag, category and service type only |
| `quote_requested` | Same confirmed delivery for product/quote-basket enquiry; category and service type only |
| `order_lookup_started` / `order_lookup_verified` | Generic consented local relay, later public-page event; no identifiers |

Form categories: callback, contact, preview, product, checkout (the existing quote-basket enquiry). Service types are fixed category enums: general, Websites, Digital Growth, Branding & Design, NFC Products, Business Systems & Support. Free text is never accepted as an event parameter. No names, emails, phone/address, messages, artwork names/content, private notes, bank information or staff details are passed.

No `purchase` is implemented. Manual payment confirmation/admin actions never send analytics. No synthetic abandonment events or keystroke/session replay tracking. Use actual funnel steps to infer drop-offs.

### Duplicate conversion protection

Successful forms use a random attempt UUID; failed unchanged retries keep the same attempt. Input changes start a new attempt. Orders use the server's random order UUID **only locally** to hash a dedupe key. Neither raw ID is sent to Google. The hashed event key is stored for 30 days (maximum 200 entries), with Web Locks for same-origin cross-tab atomic checks. Missing crypto/locks/working storage means conversion events are skipped rather than risk duplicate reporting; ordering still works. Reload/retry on the same browser/origin is covered. Cleared storage, different devices/origins and the bounded retention window prevent a global exactly-once guarantee. Never use customer data as a dedupe key.

`generate_lead` and `quote_requested` describe overlapping stages for a quote enquiry; do not add their counts together as unique customers. GA reports are consented estimates, not an accounting ledger or proof of payment.

## Owner setup — exact sequence before approval to activate

1. Sign in at [Google Tag Manager](https://tagmanager.google.com/). Select the NetBud web container and confirm its header shows **GTM-N9B3W4F5**. Do not click Submit/Publish yet.
2. In [Google Analytics](https://analytics.google.com/), select the intended NetBud GA4 property. Open **Admin → Data collection and modification → Data streams → Web → the NetBud stream**. Confirm its **Measurement ID is G-4L3JN7WC5M**. The GTM ID cannot substitute for it. Confirm stream URL is `https://netbud.com.au` and your account can inspect DebugView.
3. In the web stream's **Enhanced measurement** settings, turn off automatic measurement (particularly forms, history page changes, outbound links and search/query capture). Review Google signals, data collection, retention and data-sharing settings. Keep user-provided data, advertising features and enhanced conversions off. Do not enable automatic Google-tag page views.
4. In GTM, inspect **every existing tag, trigger, variable, custom template and installed Google tag**. Remove/disable duplicate GA installations and unapproved ads/remarketing, custom HTML, DOM/form variables and automatic URL capture. No all-pages analytics tag should remain outside the following consented event flow. Audit server-side destinations if any. This audit has **not** been performed by Codex.
5. Create Data Layer Variables (Version 2) for `page_location`, `page_referrer`, `page_title`, `page_category`, `item_list_id`, `shipping_tier`, `basket_kind`, `item_count`, `form_category`, `service_type`, and `checkout_stage`. Use the exact names in the table; no form/email/order variables.
6. Create a **Custom Event trigger** with event name `netbud_analytics_init`. Create one **Google tag**, Tag ID = **G-4L3JN7WC5M**, fired only by this trigger. In its Configuration settings set `send_page_view` to Boolean **false**, `allow_google_signals=false`, `allow_ad_personalization_signals=false`, `page_location={{DLV page_location}}`, `page_referrer={{DLV page_referrer}}`, `page_title={{DLV page_title}}`. Do not fire it on Initialization/All Pages. Do not add another inline/standalone gtag loader.
7. Create **GA4 Event** tags targeting that same Google tag/Measurement ID. Use a Custom Event trigger for each exact event in the schema. You can use one event tag with Event Name `{{Event}}` and a Custom Event trigger using this **anchored allowlist regex** (enable regex matching):
   ```text
   ^(page_view|view_item_list|select_item|view_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_shipping_info|order_submitted|generate_lead|quote_requested|order_lookup_started|order_lookup_verified)$
   ```
   Set safe page/custom parameters from the DLVs above. Enable **Send ecommerce data → Data Layer** for ecommerce fields (or map `currency`/`items` explicitly using DLVs `ecommerce.currency`/`ecommerce.items`, never both approaches). Do not forward the whole data layer, `gtm.element`, click URL, raw page URL, document title, form submission variables or `transaction_id`. Avoid a wildcard all-events trigger. Ensure the Google tag initializes before processing queued GA events.
8. In **Tag → Advanced settings → Consent settings**, require additional consent **analytics_storage** for **every Google/analytics event tag**, as well as built-in consent checks. Use GTM's consent overview to inspect all tags. No tag may override advertising denials or load before acceptance. Do not install a second consent platform that grants consent automatically.
9. The confirmed Measurement ID **G-4L3JN7WC5M** is already recorded in `js/config.js`; leave both review gates off. After the container audit and separate owner approval for an isolated manual test, add only the approved test origin to `analyticsAllowedOrigins` and enable the gates only in that isolated test configuration. Never point automated tests at the real property; they override config with a mock-only ID and intercept all Google traffic. A published container version is needed for ordinary hosted use; **do not publish it, enable production tracking or deploy website changes without separate owner approval**.
10. Click GTM **Preview**, enter the approved test URL and connect [Tag Assistant](https://tagassistant.google.com/). Preview may add `gtm_debug` query data: remove that debug query from the connected site's address while keeping the preview connection; the application deliberately refuses unknown query parameters. If your preview connection requires the parameter, use Tag Assistant's extension/clean-URL connection, not a production URL-allowlist relaxation. Test Reject first: no Google tag/request. Then Accept: one GTM load, one Google tag, one explicit page view. Test consent preferences, private pages and withdrawal/reload. Verify the consent panel shows analytics granted only after Accept, all ad consent denied.
11. In GA4 **Admin → Data display → DebugView**, check the test events. If needed add `debug_mode=true` only in an unpublished preview/testing tag setting; remove it before production approval. Check **Reports → Realtime** too. Inspect browser requests for sanitised page/title/referrer, no customer fields, no denied-mode requests, no automatic page views/forms, no duplicate conversions and no cookies before consent. No actual DebugView or delivery verification has been completed yet.
12. Under **Admin → Data display → Key events** (or the Events screen's Mark as key event control), mark **generate_lead**, **quote_requested**, **order_submitted**. Leave `purchase` unconfigured until verified payment + consent + secure delivery are implemented. Record the audited container version and owner approval before any future publish/deployment.

UI wording in Google's dashboard can change; the required values and event names above must remain exact. If additional-consent checks block all tags in Preview, inspect the queued consent commands before altering checks. Never solve it by granting advertising consent or tracking rejected visitors.

## Funnel and attribution setup

In GA4 **Explore → Blank → Funnel exploration**, add event-name steps:

- Ordering: `page_view` (home/landing) → `view_item` → `add_to_cart` → `begin_checkout` → `order_submitted`.
- Leads: `page_view` (landing) → `page_view` (page_category services/product) → `generate_lead`; optionally `quote_requested` for quote requests.

Register `page_category`, `form_category`, `service_type`, `checkout_stage`, `basket_kind`, `shipping_tier` as event-scoped custom dimensions under Admin → Custom definitions if required for breakdowns. Use an open funnel if visitors may enter on a product page; compare mobile/desktop. Lead received means provider accepted a verified workflow, not a guarantee a human read the email. Do not invent an enquiry-start event or count unsuccessful submissions as leads.

Marketing and checkout use one configuration and intended GA property. Same-origin GA cookies support browser attribution after consent. A future approved checkout subdomain needs the same reviewed container/property, consent on that origin and an approved-origin entry; configure cookie domain `auto` for the common parent domain. Do not decorate URLs with `_gl`, analytics IDs, OTPs or order credentials. Cross-origin local consent/dedupe/relay storage is intentionally not copied. Test the final hosting arrangement before claiming cross-subdomain deduplication or attribution. External referrer and campaign detail are deliberately restricted in this release; attribution can be incomplete. This is not full cross-domain linking. Ad blockers, cookie/storage restrictions, consent decisions and different devices also limit attribution.

## Tests and local review

All Google, FormSubmit and order responses in the new browser suite are mocked. No real property, customer order, enquiry or email is contacted. The ID `G-TESTONLY` exists only in isolated fixtures/intercepted script responses.

```powershell
node --test backend/test/analytics.test.mjs
$env:PLAYWRIGHT_MODULE='file:///C:/Users/mdbil/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node backend/test/analytics-browser.mjs
node --test --test-concurrency=1 backend/test/*.test.mjs
node scripts/check-forms.cjs
node scripts/check-hero-scroll.cjs
node scripts/check-motion.cjs
node backend/test/browser-review.mjs
node backend/test/tracking-browser.mjs
node backend/test/admin-browser.mjs
./backend/test/tls.ps1
node backend/test/integration-browser.mjs
```

Run browser suites sequentially; the existing checkout/tracking/admin suites share loopback port 8787. The new analytics harness uses 8965 and temporarily injects mock reviewed config only into served test responses; it does not change saved configuration. The normal local development server keeps analytics disabled. Git staging is required for a new public file to enter the existing staging bundle's Git-tracked asset allowlist.

Executed results and final file list are recorded below and in PHASE_H_REPORT.md. Real container audit, real GA property tests, hosted subdomain attribution and final privacy approval remain external blockers. No production activation is implied by passing mocked tests.

## Files changed

- `js/config.js`: dormant GTM/review/origin/campaign configuration.
- `js/analytics.js`: consent, single GTM loader, safe event schema, private exclusions, dedupe and lookup relay.
- `js/main.js`: replace old loader, preference entry point, basket and verified enquiry hooks.
- `privacy.html`, `privacy/index.html`: matching owner-review disclosure drafts.
- `backend/public/checkout.html`, `backend/public/tracking.html`: first-party shared module includes, no admin includes.
- `backend/public/checkout.js`, `backend/public/tracking.js`: safe stage hooks only.
- `backend/local.mjs`: first-party analytics assets in isolated server allowlist.
- `backend/entry.mjs`: Google script/connect/image CSP allowance on checkout only; admin/track remain excluded.
- `backend/test/analytics.test.mjs`, `backend/test/analytics-browser.mjs`: mocked privacy/schema/consent/conversion coverage.
- `backend/test/integration.test.mjs`: bundle/module/CSP boundary checks.
- `docs/ordering/ANALYTICS_SETUP.md`, `docs/ordering/PHASE_H_REPORT.md`: setup, boundaries and results.

No catalogue pricing, animations, enquiry layout, backend identity/permissions, payments, artwork handling, DNS, hosting configuration or PACES portfolio content was changed.

## Results

Passed after recording the confirmed Measurement ID: **132 backend/security/analytics tests**, **101 existing public checks**, and **68 new mocked analytics browser assertions**. Existing checkout, tracking, admin and integrated HTTPS browser suites all passed at **375, 430, 768, 1024 and 1440 px**. Google blocked did not prevent checkout. Confirmed FormSubmit success produced one lead; simulated failures produced none. Retry/reload produced no repeated order conversion. Initial test-harness runs exposed an incorrect Windows path boundary and a missing required service selection; both were fixed before the passing run. No live Google container, real property, email delivery or hosted cross-domain claim is made.

## Official references

- [GTM web installation](https://developers.google.com/tag-platform/tag-manager/web)
- [Consent implementation](https://developers.google.com/tag-platform/security/guides/consent)
- [Privacy and disabling automatic page views](https://developers.google.com/tag-platform/security/guides/privacy)
- [GA4 recommended event reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 enhanced measurement](https://support.google.com/analytics/answer/9216061)
