# Current NetBud code audit

Audited 17 November 2026 at commit `49e5708`; remote main matched this commit after fetching. No checkout backend or database was found.

| Area inspected | Current behaviour | Ordering implication |
| --- | --- | --- |
| `README.md`, `.nojekyll`, `CNAME`, repository deployment files | Static site; README describes GitHub Pages main/root deployment; domain is netbud.com.au. No Actions deployment workflow found. | Confirm actual dashboard settings with owner before migration. |
| `index.html`, `shop/index.html` | Existing branded homepage and catalogue; cinematic hero and dedicated NFC presentation. | Reuse styles and links; do not rebuild the site. |
| `cart/index.html`, basket functions in `js/main.js` | Quote basket with browser-calculated indicative totals; localStorage holds product IDs/quantities. | Keep existing basket until server-backed checkout passes tests. Browser prices must never authorize a charge. |
| `shop/custom-nfc-business-card/index.html`, `shop/nfc-google-review-card/index.html` | Generated product pages with shared controllers; currently enquiry flows. | Add approved order options later without changing advertised A$39 starting prices. |
| `js/products.js` | 18 products/services; starting prices; `purchasable: false`; two physical NFC products. | Snapshot preserved. Server catalogue needs explicit owner-approved scopes/options before fixed-price checkout. |
| `scripts/build-catalogue.cjs`, `scripts/build-clean-urls.cjs` | Catalogue generation and directory URLs plus compatibility pages. | Update generators when new links are introduced; avoid edits that regeneration overwrites. |
| `js/config.js` | Public business configuration; FormSubmit endpoint; delivery verified flag; payment links empty and UPI disabled. | No credentials belong here. GST wording conflicts with owner's new confirmation. |
| `js/main.js`, `js/form-experience.js` | Shared validation, honeypots, actual response checks, submission state and email/WhatsApp fallback. | Preserve working delivery until backend replacement is independently verified. |
| `privacy/index.html`, `terms/index.html` | Public policy drafts describe current enquiry operation. | New order processors, retention, tax and payment terms require reviewed updates before launch. |
| Backend/build infrastructure | No package manifest, order API, migrations, private bucket, guest OTP, staff authorization or payment webhook implementation. | These must be built; browser-only additions cannot securely provide the requested system. |

## Forms

There are **22 distinct enquiry placements**: homepage callback (1), full Contact enquiry (1), free homepage preview (1), product/service enquiries (18), quote basket (1). Legacy URL aliases are not extra enquiry types. The Contact page already has one full form following the prior duplicate-callback fix. Keep both `#callback` and `#enquiry` navigation compatibility.

Existing endpoint: `https://formsubmit.co/ajax/bilal@netbud.com.au`. Source records the owner's confirmation of activation and second test email on 17 November. That is prior owner evidence; this audit did not independently inspect the inbox or send another submission.

## Protected presentation

Leave `js/hero-story.js`, `js/brand-arrival.js`, `js/scroll-experience.js`, `js/motion.js`, `js/section-experience.js`, their styles and inline first-paint arrival code unchanged. Preserve hero scroll zoom/sticky release, logo arrival/typewriter, independent looping NFC demonstration, portfolio carousel, stacking cards, parallax, responsive navigation and custom scrollbar. PACES content and all client assets are outside this work.

New checkout should reuse brand tokens but use restrained, accessible interaction. No framework rewrite is needed.

## Tax discrepancy — unresolved, not silently corrected

`js/config.js` currently states NetBud is not GST-registered; catalogue comments also refer to no GST being added. The new brief confirms GST registration **and explicitly requires legal-name/ABN/tax verification before correction**. Leave runtime wording untouched in Phase A and flag this for prompt owner resolution before accepting orders. Preserve all advertised gross prices; do not add 10%. Record product tax classifications and reviewed invoice rules rather than assuming every service has identical treatment.

## Catalogue preservation

`catalogue-baseline.json` captures IDs, slugs, names, AUD starting prices, billing types, physical flags and current purchase flags from the executable catalogue. All 18 remain supported in the proposed model. Initially classify the two NFC products as physical/hybrid (entry scope and options need confirmation); classify the remaining 16 services as quote-required until their fixed scope is approved. Recurring services require explicit terms; do not silently initiate subscriptions.

## Baseline verification

Existing form, hero and motion suites passed (68 + 18 + 15 checks). No application files were edited. Existing untracked `images/emoji/` and `tmp/` are unrelated and excluded from this change. Future phases must add meaningful server, database-policy, authorization, upload and integration tests; the present suites do not exercise those systems.
