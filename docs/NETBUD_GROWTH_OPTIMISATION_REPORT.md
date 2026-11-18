# NetBud growth and optimisation sprint

18 November 2026. Branch: `codex/netbud-growth-optimisation`. Baseline: latest fetched `origin/main`, **593c3bf** (consent-controlled marketing analytics release). Draft review targets `main`.

**Development review only: nothing deployed, merged or published to Google.** PRs #1–#6 are not merged. No ordering code, checkout, admin, Supabase, Resend, Revolut, payment settings, DNS or hosting configuration was introduced or activated. PACES's repository and assets were not changed. Existing NetBud portfolio descriptions, URLs and artwork references are unchanged and checked against main.

**Owner review remains essential:** GST registration is confirmed by the owner, but the ABN, responsible legal seller identity and GST classification/display basis of individual offers have not been supplied or independently verified. No ABN, tax rate breakdown, tax invoice or accountant approval has been invented. Starting amounts and all product promises are unchanged.

## Ten ranked findings

Rank reflects likely customer impact, evidence and the risk of a narrow correction, not an assertion of measured revenue uplift.

| Rank | Finding and customer impact | Severity | Confidence | Implementation risk | Outcome |
|---|---|---|---|---|---|
| 1 | Public configuration and shop FAQ falsely say NetBud is not GST-registered. Misleads customers about quotes. | High | High: owner confirmation + source | Low for factual wording; tax decisions remain external | Corrected registration statement; written quote confirms final total and applicable GST. No amount/rate change. |
| 2 | A keyboard/programmatic submit can blur the active field when inputs lock, clearing the analytics attempt ID. Enquiry succeeds but its lead event disappears. | High | High: reproduced in mocked browser, then verified fixed | Medium: shared submission lifecycle | Capture immutable submission attempt before locking inputs; preserve validation, recipient verification and duplicate guard. |
| 3 | At 375px the NFC gallery appears before the product heading, starting price and enquiry button, pushing the next action below the first viewport. | High | High: before screenshot | Low/medium: responsive and reading order | Product information and actions now precede the gallery on mobile. Desktop gallery-left composition remains. DOM and mobile reading order agree. |
| 4 | Most marketing pages lack a static canonical; `.html` aliases and directory routes expose duplicate copies. | High | High: static HTML audit | Low: head metadata | Absolute clean-path canonical and matching OG URL on both versions; sitemap remains clean. No hosting redirects added. |
| 5 | Relative OG/Twitter image paths resolve under `/about/images/…` etc on directory routes, breaking sharing previews. | Medium | High: URL resolution | Low | Absolute sharing URLs; product-specific artwork remains product-specific. |
| 6 | Large readable CSS/shared JS files block rendering and parsing on mobile; stale fixed query versions also make updates harder to cache correctly. | Medium/high | High: resource timings and byte counts | Low/medium: generated assets require build discipline | Pinned minification, checked-in assets and content-hash versions. Controllers and source artwork preserved. |
| 7 | Shop analytics searches for add buttons not present in product cards, then falls back to all 18 products after filtering. Internal industry links are also excluded by the analytics URL validator. | Medium | High: source + filtered browser events | Low: public-ID/enum allowlist only | Report actual visible product IDs; no invented empty impressions. Allow only known public industry values and existing service anchors. Sensitive URL data remains blocked. |
| 8 | Privacy wording describes the enabled form provider/hosting as hypothetical; draft legal identity and retention decisions are unresolved. | High for trust/privacy | High for configured providers; owner decisions unresolved | Medium: do not claim legal approval | Identify FormSubmit and GitHub Pages factually; retain explicit owner/legal-review status and flag unresolved ABN/seller/GST details. |
| 9 | Empty social URLs render non-functional profile buttons; repeated generic product-detail links have ambiguous accessible names out of context. | Medium | High: configuration/rendered DOM | Low | Render only configured real social links; name product-detail links for their product. No invented handles/testimonials. |
| 10 | Utility/legacy/draft legal pages advertise indexing, and structured business context is sparse. This can surface thin or unfinished information in search. | Medium | High: robots/meta/schema audit | Low/medium: no indexing guarantees | Noindex basket, generic product lookup, thank-you, 404 and draft legal pages; add confirmed Organization and product BreadcrumbList metadata without reviews, ABN or unsupported offers. |

The initial suspicion about callback anchors was **not confirmed**: the current contact page already has both `#callback` and `#enquiry`. Their routing and the single full contact form were preserved. This is intentionally not counted as a defect fixed.

## Implemented changes

- Correct factual GST registration wording in configuration, shop FAQ and catalogue source comment. Quote totals/tax detail are agreed in writing. Full catalogue data is deep-compared to main: all prices, package scopes, inclusions, exclusions, promises and quantities remain identical.
- Show mobile product heading, price and primary enquiry action before the gallery; retain desktop columns, image quality and image viewer.
- Fix loss of the lead attempt during field-lock blur/change events. Confirmed FormSubmit success still requires actual success JSON and the previously verified recipient flag. Failed/activation-pending responses never create lead conversions.
- Fix filtered product impressions; keep event data restricted to known catalogue IDs, quantities and public enum categories.
- Add static, absolute canonical/sharing metadata, more descriptive Sydney/Australia search titles, factual organization information and product breadcrumbs. Product/service schema and canonicals agree. No ratings, reviews, guaranteed rankings, legal seller name or ABN fabricated.
- Reduce shared payload with generated `.min` files, pinned esbuild 0.28.2 and content-versioned references. Config changes also get a content version; analytics helper gets a new version to avoid stale event code on a future approved release.
- Remove empty social buttons; improve accessible product link names; clarify that shop quote enquiries submit directly through the website.
- Identify current enquiry delivery and hosting in the privacy draft. Keep unresolved legal matters visible. Draft/utility pages are noindex; robots exclusions for internal review/tooling paths are crawl guidance, **not access control**.

## Before and after evidence

| View | Before | After |
|---|---|---|
| Mobile homepage, 375px | [Before](growth-optimisation/before-home-375.png) | [After](growth-optimisation/after-home-375.png) |
| Mobile NFC card, 375px | [Gallery before title/CTA](growth-optimisation/before-nfc-375.png) | [Product information and CTA first](growth-optimisation/after-nfc-375.png) |
| Desktop homepage, 1440px | [Before](growth-optimisation/before-home-1440.png) | [After](growth-optimisation/after-home-1440.png) |
| Desktop NFC card, 1440px | [Before](growth-optimisation/before-nfc-1440.png) | [After](growth-optimisation/after-nfc-1440.png) |
| Desktop contact, 1440px | [Before](growth-optimisation/before-contact-1440.png) | [After](growth-optimisation/after-contact-1440.png) |

[Normal-motion NFC/scroll screenshot](growth-optimisation/after-motion-1440.png). Desktop composition and the existing hero identity are preserved; desktop evidence screenshots use reduced motion to make comparison stable. Mobile measurement screenshots use normal motion. The screenshot files contain public website material only; no entered customer details.

## Performance measurements

Method: Edge headless, loopback HTTP, 375×900, cold browser cache, 4× CPU slowdown, 40ms simulated latency and 200 KB/s download. Google/font requests were blocked identically before and after. Observe for 6.5 seconds after page load; three fresh-context samples per route. These are **synthetic lab observations, not CrUX, Google field data or Lighthouse scores**.

| Measure | Homepage before → after | NFC business-card page before → after |
|---|---|---|
| Median observed LCP | **6,144 → 3,268 ms** | **4,524 → 2,728 ms** |
| LCP samples before | 10,748 / 6,144 / 5,608 ms | 5,412 / 4,056 / 4,524 ms |
| LCP samples after | 5,528 / 3,268 / 3,104 ms | 2,640 / 3,020 / 2,728 ms |
| Median maximum CLS session window | 0.00757 → 0.00757 | 0 → 0 |
| First-viewport first-party resource transfer median | 583,277 → 493,470 bytes | 478,979 → 395,634 bytes |
| Observed long-task excess median | 1,923 → 353 ms | 1,166 → 320 ms |

Across eleven shared production text assets, committed main's source totals **385,796 bytes**, versus **311,096 bytes** for the new minified assets: **74,700 bytes / 19.4% smaller**. A local per-file gzip estimate is **87,896 → 76,368 bytes** (13.1% smaller). This estimate does not assert live compression or cache headers.

Limitations:

- Three samples show substantial variance. Loopback scheduling, headless rendering and browser caches/compilation can affect results. No statistically established causal conversion or ranking uplift is claimed.
- The local server uses no-store and does not gzip; GitHub Pages/CDN/network behaviour will differ. Resource transfer includes only the observed initial viewport/window, not every image loaded by scrolling the entire site.
- External fonts were unavailable in this controlled test, so both phases use fallback fonts. Hosted webfont loading, font-related shifts and physical iOS/Safari testing remain follow-up checks. Self-hosting fonts was investigated as a future option but **not implemented**.
- Mobile product reordering can change which element becomes LCP. The numbers are not proof of faster image decoding alone.
- Long-task excess means the sum of observed task durations beyond 50ms in the window; it is not a Lighthouse TBT score. INP needs representative interactions/field collection and **was not established here**. The functional keyboard/tap tests pass but are not an INP metric.
- No attempt was made to shorten the owner's welcome, typing, cinematic scrolling or NFC timing. Controller sources are unchanged. The 1.8 MB legacy laptop image is not requested by the current hero and was left alone; actual current photographs already use small WebP variants/lazy loading.

[Raw before measurements](growth-optimisation/before-measurements.json), [raw after measurements](growth-optimisation/after-measurements.json), [size/median summary](growth-optimisation/performance-summary.json).

## Conversion and SEO journeys

1. **Custom websites:** same headline and homepage CTAs; custom-development information, entry product, free preview and enquiry remain connected. Product details still explain scope, ownership limitations and ongoing costs without adding guarantees.
2. **NFC business cards:** product heading, starting price and enquiry/basket actions appear before the gallery on small screens. Personalisation and QR backup explanations/scopes remain unchanged.
3. **Google review cards:** unchanged genuine-review explanation, Google Account/compatibility caveats, no incentives or promised positive reviews. Enquiry works through the same verified handler.
4. **Free preview:** existing eligibility/discovery/availability conditions and fields preserved; successful direct submission tested. No promise that every visitor receives a completed website.
5. **Callback/quote:** existing anchors and full contact form preserved; website submission and email/WhatsApp fallback remain. Direct email/phone are visible. Basket remains a **quote enquiry**, never checkout or payment.

Clean canonical paths consolidate the `.html` aliases without adding JS redirects or changing hosting. Canonicals are hints, not a guarantee Google will consolidate/index pages. Sitemap targets resolve to existing directory pages; no unsupported last-modified dates were invented. The generic product lookup is noindex but actual product pages remain indexable. Maintenance metadata resets real product robots appropriately so future catalogue builds do not inherit the generic template's noindex directive.

## Analytics protection

Compared main's public code with the Phase H analytics guide by reading it from its development ref; did **not** merge/import the ordering branches. Main's recent release already has owner-approved marketing switches enabled; this sprint preserves those existing values. It does not grant consent, publish GTM or re-approve private ordering analytics.

- GTM stays **GTM-N9B3W4F5**, GA4 stays **G-4L3JN7WC5M**; no standalone gtag loader.
- Before acceptance and after rejection: no Google loader/events/cookies. After opt-in: only the approved GTM URL, one explicit page view per document, ads denied.
- Withdrawal refreshes the document and prevents further page-load tracking. Unknown/sensitive URL parameters remain excluded. Industry/service-anchor allowances are fixed public catalogue values, not arbitrary customer strings.
- Customer names, addresses, emails, phone numbers and messages do not enter the data layer. Success conversions use random attempt keys locally; no raw key is sent to Google.
- Keyboard double-submit produces one network submission and one lead. Failure and recipient activation requests never produce leads; no purchase event exists.
- Google blocked does not prevent an enquiry. Admin/tracking/checkout routes remain absent from this public branch and do not load Google.

All browser Google and FormSubmit responses were intercepted. The real GA4 ID was replaced in served test responses with a mock-only ID. **No real Analytics data collection or recipient delivery was verified.** Existing private-route exclusions remain, but this sprint does not retest an ordering backend absent from main.

## Accessibility and tests actually executed

| Suite | Result |
|---|---|
| Existing actual-handler form checks (`check-forms.cjs`) | **68 passed** |
| Existing hero-scroll invariants (`check-hero-scroll.cjs`) | **18 passed** |
| Existing loop/reduced-motion invariants (`check-motion.cjs`) | **15 passed** |
| New SEO/catalogue/preservation/build checks (`check-growth.cjs`) | **428 passed** |
| New actual-generated-asset browser journeys (`review-growth.mjs`) | **486 passed** |

Browser widths: **375, 430, 768, 1024 and 1440 px**. At each width, checked homepage callback, full contact, free preview, business website, NFC business card, review card, shop filters/search/reset, basket quantities/persistence/quote submission, consent and no horizontal overflow. Checks include one H1, labelled visible form fields, alt attributes, unique IDs, menu keyboard opening/Escape/focus restoration, direct contact visibility, failure retention and duplicate prevention. Reduced-motion contexts were used for functional comparisons; existing source/virtual tests cover motion preferences, and a normal-motion desktop scenario exercises cinematic scrolling and visible NFC playback. Normal-motion mobile measurements/screenshots also retain the arrival experience.

This is not a complete WCAG certification or a screen-reader/physical-device audit. Some long product names can still require extra scrolling; the premium animations and all product information are intentionally retained.

QA caught an invalid local homepage preview route, a canonical-generation slash error and a line-ending comparison mismatch in the new harness; those were corrected and checks rerun. The keyboard blur/attempt issue was a real public-code defect discovered during the run and fixed before passing results. No test customer enquiry was actually sent.

[Machine-readable browser results](growth-optimisation/browser-results.json).

## Reproduce and maintain

The static site runs directly from the checked-in HTML and minified assets; Node/npm are maintenance tools only. With Node 18+ and npm:

```sh
npm ci --ignore-scripts
npm run build
npm test
# After editing the catalogue/template:
npm run build:catalogue
```

Do not hand-edit `.min` files. `scripts/build-public-assets.cjs` pins esbuild 0.28.2, minifies public CSS/shared JS and updates asset hashes. `build-clean-urls.cjs` plus `public-page-meta.cjs` generate consistent metadata/directory routes. No deployment command or CI publishing action was added.

The initial build used an already available pinned minifier. Then a temporary npm 11.6.2 archive was downloaded from the official registry, verified against its SHA-512 integrity and unpacked only into ignored `.cache/`. A clean `npm ci --ignore-scripts --no-audit --no-fund`, public build and all static/form/motion checks passed with the public project dependencies. No global install or backend dependency/application was added. The lockfile records official package URLs/integrity hashes.

Browser review requires an installed Playwright/Edge runtime:

```powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/mdbil/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/review-growth.mjs
node scripts/measure-growth.mjs after
```

`measure-growth.mjs before` is meaningful only against an unchanged baseline checkout; do not overwrite the recorded baseline by running it against this improved branch. Both test servers bind loopback only, serve public files and block/intercept external calls. Tests never contact PACES or send customer data.

## Remaining owner decisions and future work

1. Provide ABN and verified legal seller identity; obtain appropriate advice on the GST-inclusive display basis and product classifications. Review draft privacy/terms, provider locations, retention/request handling and effective dates. No tax invoice can be inferred from these pages.
2. Review the actual GTM/Google tag configuration and perform an owner-approved DebugView/Realtime check. Do not infer real collection from mock tests. Confirm account retention and advertising settings.
3. Review this draft PR. No live release is authorised by this report. Ordering PRs #1–#6 remain separate/unmerged; backend hosting/provider choices are outside this sprint.
4. The clean install/build rehearsal passed; test real fonts and physical devices with a screen reader, and check hosted compressed/cache responses before release approval.
5. Use Search Console with owner-approved access to verify canonicals/indexing and submit the sitemap; collect representative field Web Vitals and consented enquiry outcomes. No search ranking or revenue improvement is guaranteed.
6. Supply actual social profile URLs if wanted. Consider self-hosting the existing fonts after licensing/appearance review. Investigate unused CSS gradually with visual coverage instead of removing animation styles wholesale.
7. Use consented lead and quote events as directional funnel data, with FormSubmit receipts/customer conversations as business evidence. Do not add overlapping lead/quote key-event counts as unique customers or treat enquiries as payments.

## Changed files

The broad HTML diff is generated head metadata/asset references and matching clean routes, not a redesign. Readable runtime changes are limited to configuration/GST comment, shared main helper, shop CSS, analytics filtering/allowlists and factual shop/privacy/terms copy. Product data values and portfolio contents remain identical to main.

- Readable sources: `js/config.js`, `js/products.js` (comment only), `js/main.js`, `js/analytics.js`, `css/polish.css`, `shop.html`, `privacy.html`, `terms.html`.
- Generators/testing: existing clean-route builder plus new asset/meta builders, static guard, preview server, measurement and public-browser scripts.
- Generated outputs: minified CSS/shared JS, public source/directory metadata and version references, `robots.txt`, normalized sitemap.
- Maintenance/review: `package.json`, `package-lock.json`, `README.md`, this report and evidence under `docs/growth-optimisation/`.

[Exact file list](growth-optimisation/changed-files.txt) accompanies this report. Unrelated local `images/emoji/` and `tmp/` were left untouched and excluded.
