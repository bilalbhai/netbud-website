# NetBud verification — 28 October 2026

## Current NFC update — iPhone 17 Pro Max contact preview, s10

Confirmed choices: iPhone 17 Pro Max body with Dynamic Island; contact layout based on the supplied screenshot; NetBud logo/name with existing phone/email; contact preview only. The phone now has a detailed black bezel/metal rail, action/volume/power/camera controls, status icons and home indicator. The contact layout uses rounded grouped rows, avatar and blue action tiles. The Add Contact control, saved overlay, saved bubble and old model caption are removed from the production markup.

Body proportions follow Apple's published [78.0 × 163.4mm dimensions](https://support.apple.com/en-la/125091). This is an original responsive HTML/CSS illustration, not an OS screenshot or claim of exact native behaviour. The supplied contact reference guided the layout; no sample portrait/person is reused.

Evidence folder: `netbud-section-revision/iphone17-preview/` in the existing visual evidence directory. `production-check.json` records the actual live NFC scene: 168 × 352px phone, `iphone17-tap-preview` animation with 3s duration, configured phone/email, 335px available/content height and **zero** saved/action decoration elements. `contact-fit.json` records seven final-frame layout checks at 320, 375, 390, 430, 768, 1024 and 1440px: profile content fits its height, contact rows do not overflow and there is no document overflow.

`contact-preview-detail.jpg` and `contact-preview-closeup.jpg` are static final-frame storyboards rendered from the production NFC markup and stylesheet. The ignored `.work/qa-iphone17-storyboard.html` disables animation only for visual inspection; it is not the delivered homepage or deployment dependency. Live animation/controller checks are recorded separately. The existing 25 controller checks still verify the unchanged order, timing, CTAs, Pause/focus/background and reduced-motion behaviour. Structural checks now cover **501 HTML references** because the contact avatar uses the shared icon asset.

Backup: `.work/backups/netbud-before-iphone17-contact-preview-2026-10-28.zip`. Current preview: `http://127.0.0.1:8765/index.html?preview=iphone17-contact-s10`. This update supersedes the older contact-save descriptions below.

## Current work-gallery update — s9

The homepage's “Work with a purpose” gallery now uses perspective, depth and angled neighbouring cards. The horizontal scrollbar and bottom control row are replaced by exactly two buttons, one on each side. Buttons wrap through all three projects. Arrow/Home/End keyboard navigation remains available, with one accessible active card and two inert inactive cards. The separate portfolio page is outside this change's visual scope.

Evidence: `netbud-section-revision/work-3d/` under the existing visual evidence directory. `navigation.json` records Next 1→2→0 and Previous wrapping to 2, with one accessible/two inert cards each time. Native keyboard Home and End select 0 and 2. `responsive-navigation.json` records **12 passing observations**: all three projects at 320, 375, 768 and 1440px, with two controls, no horizontal overflow and each active project link fully inside its card. An inherited mobile tag rule initially pushed concept links out of view; the final scoped rule hides those tags and all cases pass on rerun. Desktop and phone screenshots are retained. Static checks remain at 16 HTML pages, 21 SVGs, 500 references and 24 configured paths with zero failures/warnings; the changed script passes syntax checking.

The carousel is user controlled. Reduced-motion CSS removes transition movement. Physical touch-device and frame-rate testing are not claimed. Local preview: `http://127.0.0.1:8765/index.html?preview=work-3d-s9#work-title`.

## Latest correction: website-first hero, branding, clean joins and fixed mobile callback

Current assets: **s7**, branding **20261028-b1**. Websites now appear first with **Explore plans → pricing.html**; NFC follows with **Order your custom NFC card now → product.html?id=5**. Both native link journeys reach the intended page. The NFC CTA fits at 320px (client/scroll width both 239px). Both scenes retain 3,000ms timing; the revised isolated hero fixture passes **25 checks**, including both CTA labels/destinations and focus stability. The former illustrative hero footnotes are removed.

The supplied unboxed rust/coral mark replaces the purple tile in SVG branding, favicons, inline hero marks and the sharing JPG regenerated from its vector source. Asset queries refresh cached branding. The footer uses a warm backing for the same dark mark/wordmark.

All nine rounded homepage section joins have **72px radius / 72px overlap** on desktop, with **32px / 32px** on phones. The hero ribbon also overlaps its preceding surface. Rendered checks of both reported joins show continuous curves without the previous exposed strips. Mobile native checks at 375px show the callback fixed at the initial screen, hidden on reaching the chat section and visible again after scrolling above it. The 320px page has no horizontal overflow.

Evidence is in the previous evidence folder's `brand-fix/` subfolder: `clean-ribbon-join.jpg`, `clean-dark-join.jpg`, `section-joins.json`, `mobile-callback-states.json`, `mobile-callback-visible.jpg`, `mobile-callback-at-form.jpg` and `nfc-cta-check.json`. This correction supersedes the old hero order/caption descriptions retained below. Backup: `.work/backups/netbud-before-brand-and-hero-fix-2026-10-28.zip`.

`brand-fix/final-checks.json` records final s7 checks at 320, 375, 768 and 1440px: no horizontal overflow, Websites first, updated branding URL, no removed caption text, and matching curve/overlap dimensions at every section join. Structural checks and all 25 hero timing/CTA state checks pass. Current local preview: `http://127.0.0.1:8765/index.html?preview=brand-fixed-s7`.

## Current delivery: curved sections and interaction revision

Current assets use `20261027-s5`. This delivery implements curved/blended section surfaces, both comparison panels reflowing, a raised 3D browser, a short desktop pinned preview, equal project cards in a horizontal carousel, interactive forms with mandatory email/optional business, and social/paid-ad packages. The hero keeps two three-second scenes, removes bottom selectors, adds NFC Order now, demonstrates contact preview/confirmation/save and scrolls a native website surface inside the retained laptop photo.

Evidence: `C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/netbud-section-revision/`.

- `responsive-checks.json`: **140 observations**, 20 routes × 7 widths (320, 375, 390, 430, 768, 1024, 1440px), zero recorded document overflow, overflowing headings/labels/buttons or broken displayed images. This broad matrix used s3. Final s4/s5 refinements reset legacy first-project styling, compact phone cards and hide floating shortcuts around interactive previews/carousels; focused checks and rendered review cover these refinements separately.
- `comparison-reflow.json`: native keyboard changes from 25% to 75% alter **both** panel widths, text positions and heading sizes. Divider pointer dragging supplements the native keyboard/touch range.
- `sticky-checks.json`: scrolling the actual page from 4344.5px to 4494.5px leaves the comparison at **124px** from the viewport top. Mobile/short screens retain normal flow.
- `carousel-checks.json`: three equal 626 × 332px desktop cards; Next advances to the remaining projects. Final rendered mobile cards are all 301 × 310px at 375px with equal 275 × 172px image areas. Floating callback/WhatsApp shortcuts hide around the carousel/comparison to avoid covering controls.
- `form-semantics.json`: all **five** rendered forms have required email, optional business name, valid empty business inputs and one progress header each. Native callback checks reject blank/malformed email and prepare a review with valid email/blank business. `checkout-check.json` verifies the optional-business review path with a mixed basket.
- Mixed basket: website **A$599 one-time**, social package **A$299/month**, displayed/described separately. Test items were removed afterwards; no email/WhatsApp draft was opened or sent.
- `.work/check_hero_story.cjs`: **21 isolated clock/state checks**, zero failures, covering exact 2999/3000ms changes, wrap, Pause, focus, background state and reduced-motion manual access. These synthetic checks are separate from rendered observations and historical fixture totals.
- Final laptop review: each of its five miniature page sections has content height equal to available height, with no internal vertical text overflow. CSS scroll duration is 3s.
- `final-focused-layouts.json`: **14 final s5 observations**, homepage and portfolio at all seven widths. Every project card and image area has equal dimensions within its layout; no document overflow occurs. The phone profile's content height equals its available height at every homepage width. These checks are separate from the earlier 140-observation matrix.
- `divider-drag-check.json`: an actual pointer drag changes the native range from 55% to 26% and resizes both panels. The range's keyboard alternative was also exercised. Final screenshots include `curves-callback-desktop.jpg`, `comparison-desktop.jpg`, `hero-laptop-desktop.jpg` and `projects-mobile.jpg`.
- Structural check: **16 HTML pages, 21 SVGs, 500 HTML references, 24 catalogue/config paths**; zero failures/warnings. All seven JavaScript files pass syntax checks.
- `final-console.json`: zero captured warnings/errors with a production local-site source URL during the final review. External-source logs are not treated as application errors or silently claimed as tested integrations.

The iPhone scene is an illustrative contact-saving sequence with confirmation, not a claim that this website silently alters contacts. No contact API, social posting, advertising launch, payment, live form delivery or public deployment occurred. The unconfigured endpoint retains reviewable enquiry drafts. Physical devices, frame-rate benchmarks and live provider receipt are not claimed as tested. Earlier totals below are history and are not added to this delivery's counts.

Backup: `.work/backups/netbud-before-section-and-interaction-revision-2026-10-27.zip`. Local review: `http://127.0.0.1:8765/index.html?preview=sections-final-s5`.

## Previous delivery: two hero scenes and mobile navigation repair

The current homepage hero has exactly two panels: **Business cards first**, then **Websites for your business**, each configured for **3,000ms** before the next panel. The first is an original HTML/CSS NFC-card/phone demonstration; the second uses the local generated laptop image `images/hero-laptop-business.png` (1536 × 1024, approximately 1.8MB). The laptop screen is illustrative business-site artwork, not a claim about a live client or paid result. The broader theme, logo-intro and seven-section redesign remain deferred, as requested.

The current evidence folder is:

`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/netbud-two-scene/`

| Evidence | Recorded result |
| --- | --- |
| `regression-fixtures.json` | **22 modes / 456 overlapping check executions; zero final failures** |
| `responsive-checks.json` | **119 page/width observations; zero recorded overflow, clipped visible headings/controls or broken displayed images** |
| `actual-mobile-navigation.json` | Native browser pointer journeys at a 375px layout opened the menu and reached all five intended page destinations |
| `nfc-animation-samples.json` | A real CSS animation reports a 3s duration; recorded phone transforms differ, the sample profile becomes visible and the initial tap prompt fades away |
| `mobile-menu-open.jpg` | Rendered evidence of the corrected mobile dropdown |

The fixture total consists of the previous 439 executions plus **nine mobile-menu event checks** and **eight two-scene/timing checks**. These are overlapping executions, not 456 distinct tests. The JSON counts and failure arrays were cross-checked directly. Diagnostic fixtures run isolated clocks/API states and block external transport; their exact 3,000ms delay and wrap assertions are synthetic application checks. A partial native timing observation was not credited as a fully recorded real-browser two-panel cycle.

### Mobile menu defect and repair

The root reviewer reproduced the hamburger failure twice with the browser's native pointer click. The pointer landed on the SVG inside the toggle. Opening the menu replaced that SVG, detaching the original click target before the document-level outside-click handler ran. `header.contains(event.target)` then returned false, so that handler immediately closed the menu it had just opened.

The outside-click test now also checks the event's original composed path. A ninth targeted menu fixture covers the replaced-SVG click target. An additional touch-blur guard keeps a menu link present through pointer-driven blur until its click arrives; keyboard Tab departure, Escape, outside click and link selection retain their dismissal behaviour. Toggle and first-link focus use `preventScroll`.

After the repair, actual pointer journeys opened the dropdown and followed **Services → services.html**, **Work → portfolio.html**, **Pricing → pricing.html**, **About → about.html** and **Contact → contact.html**. Every expected path matches the recorded actual path. This is browser verification at a phone-sized viewport, not a claim of testing physical iOS/Android devices.

### Hero motion and scope

The scene wrapper receives an active state independently of its inner visual. The NFC phone approaches the card, shows the tap response and reveals an illustrative profile/contact screen over the three-second scene. The recorded transform and opacity samples establish changing states; they do not establish a measured frame rate or an exact match to another company's animation. The demonstration performs no real NFC action and submits no review or contact record.

Pause/Play, manual selection, keyboard focus, visibility/offscreen suspension and reduced-motion behaviour remain in the shared controller. The eight new fixture checks cover the two-panel order, three-second delay/wrap and the scene visual target. A fixture animation stub was corrected to record its target; no production requirement was weakened to obtain the pass.

The 456 fixture executions and 119 observations above used **`20261027-h3`**. Final asset key **`20261027-h4`** adds only a container-size adjustment to the illustrated phone's inner typography/spacing. A rendered mobile review caught the bottom action being crowded; the final `nfc-hero-mobile.jpg` shows it fully visible. `final-nfc-fit-checks.json` separately records seven h4 widths (320, 375, 390, 430, 768, 1024 and 1440px): profile scroll height equals its available height, the last action fits, and no document overflow was detected. These seven focused checks do not inflate the 119-observation count. Desktop scene captures and `laptop-hero-mobile.jpg` are also retained. `final-own-site-console.json` has zero captured production-source warning/error entries; diagnostic fixture URLs are excluded.

The final h4 structural check covers **16 HTML pages, 19 SVGs, 431 HTML references and 17 configured paths**, with zero failures/warnings. All **20 preservation comparisons**, including the four static forms, pass. Business configuration, catalogue data and genuine PACES imagery remain preserved. No form provider, payment service or analytics integration was enabled or sent data during this work.

The existing limits on direct-file automation, live form receipt, physical devices, hover hardware, FPS/Lighthouse measurements, accessibility certification and production deployment continue to apply. The local HTTP preview at `http://127.0.0.1:8765/index.html?preview=two-scene-h4` is retained for the user's requested visible review. It is bound to loopback and is not a public deployment. The durable source remains the workspace `index.html` and its local assets.

## Earlier extension: sitewide fades and automatic digital desk

The subsequent request replaces the earlier selective/manual-only motion direction. The digital desk now has four panels (Websites, Bookings, Get found, Business cards), a configured 1,000ms cycle and Pause/Play. A single timeout chain pauses for user choice, focus, fine-pointer hover, hidden/offscreen state and reduced motion. Selected illustration changes fade over 240ms without moving focus. Initial-render content throughout all 16 pages and the footer receives non-nested fade units. Later catalogue/basket replacements stay readable immediately.

The latest evidence is in `C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/netbud-fades/`:

- `regression-fixtures.json`: 20 modes, **439 overlapping check executions**, zero final failures. This combines the existing 418 with 21 new deterministic autoplay/fade assertions.
- `responsive-coverage.json`: **119 page/width observations**, zero detected overflow, clipped visible headings/controls or broken displayed images; all 17 routes (including both product states) have fade targets at all seven widths.
- `actual-loop.json`: the real browser selected Websites → Bookings → Get found → Business cards → Websites without manual selection. Observation timestamps include browser polling latency; they are not a precision timer benchmark. The isolated clock fixture verifies the configured one-second delay and wrap.
- `business-cards-desktop.jpg` and `business-cards-mobile.jpg`: final four-panel artwork/layout evidence. Playback was deliberately paused for the screenshots.

The new fixture covers single-timer scheduling, full-second delay, wrapping, manual resets, Pause/Play, focus and keyboard operation, fine-pointer versus touch-like entry, visibility/offscreen states, live reduced-motion changes, page lifecycle, non-nested groups and immediate readable form focus. It blocks external transport. These synthetic API cases do not establish physical-device performance.

Older fixture assumptions were updated for the new requested fade semantics and separate observer roles; existing validation/draft/storage checks were retained. A focus-state test exposed a transition specificity issue; focused reveal targets now cancel their transitions explicitly and the affected modes passed on rerun. Earlier failing diagnostic records do not supersede the final JSON.

Production asset key: `20261027-a4`. Static checks cover **16 HTML pages, 19 SVGs, 434 local references and 17 configured paths**, with zero failures/warnings. The 20 preservation comparisons also pass: contact/pricing configuration, catalogue data, genuine PACES imagery and all four static forms remain unchanged. Backup: `.work/backups/netbud-before-sitewide-fades-2026-10-27.zip`.

The Apple-inspired transformation brief has been reviewed for clarification; that new visual direction is not represented as implemented in this extension. The earlier review below is retained as history. Existing limits on live integrations, direct-file automation, physical devices and performance profiling still apply.

## Earlier motion-refinement verification

This report covers the latest minimalist/motion refinement and retains the original build and redesign history below. The site remains plain static HTML, CSS and vanilla browser JavaScript. Browser checks used the Codex in-app Chromium browser with a temporary Python HTTP preview. Python is a testing convenience, not a website dependency, required backend or build step.

## Current delivery and authoritative evidence

Latest evidence is retained in:

C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/netbud-motion/

- final-responsive.json: the final responsive matrix.
- preserved-function-fixtures.json: 12 existing functional fixture modes rerun against the motion delivery.
- motion-fixtures.json: seven new motion/fallback fixture modes.
- actual-journeys.json: interactions with the real homepage, menu and callback form.
- focused-media-checks.json: six targeted checks of the final inset media-link focus rings.
- before-metrics.json and after-metrics.json: capture-specific composition measurements.
- Before, pass-one and after screenshots retain the visual review evidence.
- after-home-full.jpg was captured after all displayed main images loaded and pending reveals were cleared through actual back-navigation handling. The final phone capture was recaptured after viewport settling and verified as a complete 360 × 780 pixel image of the 375 × 812 CSS-pixel test viewport.
- final-own-site-console.json records zero captured warning/error entries with a production local-site source URL; diagnostic fixture URLs are excluded.

Production assets now use v=20261027-m4. The broad 119-observation matrix and 418 fixture executions used m3 and fresh verify=motion-final3 page URLs to avoid previously cached HTML. A subsequent CSS-only correction moved media-link focus rings inside clipped containers; six targeted m4 checks are recorded separately below. No geometry or JavaScript changed in that correction, and the broad suites were not claimed as rerun against m4. These query values are verification/cache keys, not a runtime or build requirement. Earlier pass captures or older cached matrices do not supersede the latest records.

## Final responsive matrix

All 16 HTML pages were checked at **320, 375, 390, 430, 768, 1024 and 1440 CSS pixels**. The valid and invalid product URLs are separate routes: **17 routes × 7 widths = 119 observations**.

Routes: homepage, services, shop, product.html?id=1, product.html?id=999, cart, about, contact, pricing, portfolio, free preview, how it works, privacy, terms, thank-you, direct 404.html and previews/index.html.

| Measurement | Final result |
| --- | ---: |
| Route/width observations | 119 |
| Document-level horizontal overflow | 0 |
| Detected clipped headings, buttons or labels | 0 |
| Broken displayed images | 0 |

The clipping check excludes intentionally visually hidden .sr-only text. These measurements supplement rendered review; they do not establish every browser, zoom state, device or assistive technology. Direct 404.html checks do not establish host-served deep-path fallback behaviour.

After the final focus-ring correction, portfolio and shop media links were checked at 320, 375 and 1440px using m4: six additional targeted observations. The records show a solid 3px outline with a -5px inset offset and no document overflow. These focused checks are separate from the 119 layout observations and 418 fixture executions; they do not inflate either total.

## Actual page journeys in this delivery

- The homepage tabs were exercised with arrows, End and Home. One panel remained visible and the selected label matched it. The recorded frame stayed **557.195 × 476.836 CSS pixels** before and after the keyboard sequence, within the recorded browser precision.
- At 375px, opening the mobile menu focused Services and exposed the expanded state. Escape closed it and returned focus to the toggle. Competing sticky callback and WhatsApp controls were hidden while the menu was open.
- Australian callback phone input of 123 was rejected with an inline error and aria-invalid state. A valid 0400000000 fixture produced a review with “Draft ready. Nothing has been sent.”
- Editing the prepared callback removed the old review and reported “Details changed. Prepare your updated enquiry.” Floating callback/WhatsApp controls stayed hidden around the visible form.
- The main headline, approved starting amount and primary actions remain available immediately; scroll-driven motion is assigned to selected supporting content rather than form panels or price figures.
- Real back navigation displayed all reveal targets immediately and removed the hero entrance class. Native homepage FAQ and service-disclosure summaries were exercised with Enter; the service disclosure retained its six feature items.
- Visual refinements were inspected after the first implementation. Source and focus-state review covered stable service-row geometry and the shared control system. The browser API did not provide an actual pointer-hover action, so this report does not claim automated hover interaction coverage.

No email, WhatsApp message or real form request was sent during these journeys.

## Browser fixture results

Fixtures live in ignored .work/ and are not deployment files. Existing provider scenarios use reserved example.invalid endpoints and intercepted requests. Motion fixtures use deterministic media-query, intersection and animation stubs, local assets and blocked external transport.

| Fixture mode | Passed | Failed |
| --- | ---: | ---: |
| Catalogue/cart/currency, public pricing | 24 | 0 |
| Catalogue/cart/currency, hidden pricing | 24 | 0 |
| Blocked storage and in-memory fallback | 10 | 0 |
| Redesign regressions, standard | 34 | 0 |
| Redesign regressions, valid product | 35 | 0 |
| Redesign regressions, invalid product | 35 | 0 |
| Redesign regressions, reduced motion | 34 | 0 |
| Floating controls, synthetic observer | 15 | 0 |
| Floating controls, no-observer fallback | 3 | 0 |
| Optional integrations, AUD preview | 19 | 0 |
| Optional integrations, INR/UPI display | 19 | 0 |
| Optional integrations, product metadata | 20 | 0 |
| **Preserved functionality: 12 modes** | **272** | **0** |
| Motion, normal | 26 | 0 |
| Motion, reduced at load | 17 | 0 |
| Motion, no observer | 21 | 0 |
| Motion, observer construction failure | 21 | 0 |
| Motion, no animation API | 22 | 0 |
| Motion, no media-query API | 14 | 0 |
| Motion, persisted-page restore | 25 | 0 |
| **Motion: seven modes** | **146** | **0** |
| **Combined: 19 modes** | **418** | **0** |

**418 counts overlapping check executions, not 418 distinct tests.** Subtotals are not counted again in the combined figure.

The preserved modes cover malformed/stale storage, corrupt JSON, invalid product IDs/prices/quantities, capped duplicates, availability, cross-tab clearing, AUD/INR formatting and WhatsApp encoding. Basket IDs/quantities remain the only persisted enquiry-related data. One-time charges, monthly charges and unpriced services stay separate.

Form regressions cover dynamically required delivery addresses, whitespace rejection, field-specific errors, old-draft invalidation after edits/consent changes, pending-field locking/restoration, duplicate submission prevention and basket changes during pending delivery. Configured POST success, HTTP rejection and network failure are simulated and remain distinct from draft-only delivery. A failed response does not falsely confirm or deny provider receipt.

Integration checks include HTTPS payment filtering, hidden Australian UPI, deliberate INR-only fixture display, preview/product canonical and JPG metadata, optional consent, honeypot rejection and plain-text rendering of entered markup. Analytics fixtures intercept loading while checking preferences and duplicate-loader/page-view prevention.

New motion checks cover bounded grouped stagger, recomputing pending delays for compact layouts, one-shot reveal/unobserve behaviour, focus bypassing pending delays, fast batches, normal versus persisted pageshow, and live reduced-motion cancellation. Tab checks cover no initial JavaScript entrance, animating only the incoming illustration child, rapid cancellation, deliberately late old callbacks, keyboard states and stable frame dimensions. Missing/failed APIs retain usable content. Stable form text, PACES media ownership/destination, simplified navigation, absence of repeating timers and recorded runtime/rejection errors are also checked.

These stubs test application behaviour, not real viewport geometry, native animation smoothness, operating-system preference UI or a physical phone keyboard.

## Preservation and source checks

The local .work/motion-preservation.json records **20 passing comparisons, four static forms compared and zero failures**. It confirms byte-identical js/config.js, js/products.js and the authentic PACES JPG. Existing form markup is retained. The complete five-step how-it-works page remains unchanged apart from cache-version references, while the homepage now presents three concise phases.

The final .work/static_check.py result was:

    Checked 16 HTML pages, 18 SVGs, 433 HTML references, 17 catalogue/config paths.
    0 failures; 0 warnings.

Checks cover titles/descriptions, required metadata, duplicate IDs, labels, landmarks, local paths/fragments, configured assets and SVG XML. JPEG assets decode; the social image remains 1200 × 630.

The architecture still uses one primary stylesheet, three ordinary browser scripts, relative paths and no required local-data request, module import, animation library or framework. Reduced-motion handling preserves structural transforms. No critical issue remained in source review and tested journeys; this is not a guarantee that no undiscovered defect exists.

## Recorded composition changes

Both metric artifacts now exist. They describe the captured browser views, not performance benchmarks:

| Measurement | Before | After |
| --- | ---: | ---: |
| Homepage height at 1440px | 7,739px | 7,173px |
| Homepage height at 375px | 12,011px | 11,419px |
| Hero height at 375px | 1,023px | 958px |
| Illustration top at 375px | 652px | 589px |
| Homepage FAQs | 10 | 5 |
| Homepage process phases | 5 | 3 |

The full process page remains available. Font loading, viewport and content can change these measurements.

## Earlier build and redesign history retained

The original 26 October build was checked at seven homepage widths and at 375/1440px across all 16 pages. Navigation, mobile menu, product/error routes, catalogue search/filter/sort/reset, basket operations, delivery requirements and refresh persistence were exercised. Two/three starter packages produced A$1,198/A$1,797. Callback, contact, preview and basket forms were checked for validation and reviewable drafts, including optional callback email and separate marketing consent. Email/WhatsApp destinations, service preselection and blank social-profile feedback were inspected without sending messages. Labels, live status, native FAQs, tap targets, focus and reduced-motion rules were reviewed.

The original six fixture modes passed with counts 24, 24, 10, 19, 19 and 20. Original static counts were 16 HTML, 16 SVG, 407 references and 17 configured paths with no failures/warnings.

The earlier 27 October redesign records remain in the adjacent netbud-redesign/ evidence folder. They reported 119 responsive observations and 12 modes/272 overlapping fixture executions, with no final recorded failures; its static inventory was 16 HTML, 18 SVG, 430 references and 17 configured paths. Paired final screenshots and a console capture with zero local-source warnings/errors belong to that earlier review, not a new claim about every motion interaction. The current delivery reran those preserved modes as the 272-execution subtotal above.

Earlier price, catalogue, forms, contact details and authentic project evidence were not replaced by invented business claims.

## Limits and remaining deployment checks

- The browser API exposed viewport/visibility controls but no usable throttling or animation profiler. No FPS result, Lighthouse score, real-device benchmark or smooth-60Hz guarantee was measured or claimed.
- Actual pointer hover was unavailable through the browser API. Focus states were verified and hover/media-query CSS was reviewed. Touch-specific behaviour across physical devices remains unverified.
- Direct file:// automation had previously been blocked by the tool's protocol policy and was not retried or bypassed for this delivery. Source remains compatible with direct-file use in principle; double-click index.html in your browser to verify navigation and file-origin storage, which can differ between browsers/pages.
- Real form delivery/inbox receipt remains untested because no production endpoint is configured. Fixtures prove UI handling, not provider availability or email delivery. Providers may reject requests from local-file origins.
- Email/WhatsApp drafts were inspected, not sent. Successful app opening/sending depends on the visitor's device and setup.
- No live payment acceptance, UPI transaction or analytics collection was tested or enabled.
- No production repository/domain, DNS or deployment was verified. Production metadata, share crawling, allowed provider origins and a populated sitemap require the eventual HTTPS address.
- Direct 404.html works, but a host serving it at a missing nested URL may resolve relative assets/links below that missing directory. Configure and verify paths against the real deployment root before treating nested GitHub Pages fallback as complete.
- Social crawlers without JavaScript may require individual static product pages for unique share previews. Public preview files are not protected by noindex or robots.txt.
- No full WCAG, performance, security or legal certification is claimed. Broad screen-reader/device/zoom coverage and phone-keyboard behaviour are outside these checks. Policy drafts need review against actual business practices.
- Google Fonts and optional integrations need internet; system fonts and local graphics remain available without Google Fonts.

Temporary HTTP previews were used for verification. Their current running/stopped state is not asserted by this report. Open index.html to use the static website; maintenance and deployment guidance is in README.md.

## Front tap and live lock screen — s11

The NFC illustration now rises front-facing from below. Its top centre meets the card centre at 43% of the existing three-second animation, before moving into the contact-preview position. The black/copper ribbon wallpaper is original inline SVG inspired by the supplied reference. The large lock clock and status clock share the visitor device's current local time; the date also uses the visitor timezone. Updates align to minute boundaries and refresh after the page becomes visible. No internet time service or location permission is used. Device clock accuracy determines displayed accuracy.

Verification: 12 clock lifecycle/formatting checks and 25 hero controller checks pass. Static validation reports 16 HTML pages, 21 SVGs, 501 HTML references and 24 configuration paths with zero failures/warnings. Browser production DOM confirms matching live clocks and a 3s animation. Authored static keyframe fixtures visually verify wallpaper and contact states; the tap point was 1.08px horizontally and 2.08px vertically from card centre. Evidence: iphone17-preview/front-tap-lockscreen. Browser viewport override requests did not change the observed 1280px viewport, so this pass does not claim new mobile viewport verification. Existing responsive sizing remains in place.

## Straight card and matched proportions — s12
Card is level with animation disabled. Both objects use a single physical scale: 90 × 55mm card and 71.9 × 150mm phone; scaling stays at 1 throughout the animation. Front view does not expose the supplied 8.75mm phone depth. Browser measurements: card 416.633 × 254.609px; phone 332.844 × 694.398px, matching the supplied dimensions within pixel rounding. Phone screen uses grayscale and 72% brightness, with additional 68% lock-screen brightness. The card retains its brand colour. Centre tap alignment recalculated for these sizes. Evidence: straight-card-monochrome-s12.jpg. Desktop visual check completed; no new physical-device claim.

## NFC signal and centred phone — s14
Added pulsing blue wireless arcs at the tap point. Card stays level until 55%, then rotates 45 degrees and fades upward by 71.6667%: 500ms of the 3000ms scene. Phone finishes at translate(0,0), horizontally centred; physical scale and monochrome dimming retained. Reduced motion skips decorative signal and card motion. Static checks pass. Visual fixtures verify tap and final preview independently.
s18: Approved copper wallpaper, warm titanium frame and richer contact palette; contact contrast 85%, lock brightness 85%. Animation and dimensions unchanged. Static validation passed; visual fixtures checked.

## Digital shop launch — 16 November 2026

The owner confirmed all 18 starting amounts and entry scopes, including ten original human-designed logo concepts at A$79. Prices use From A$… and separate monthly billing; no GST is charged. CNAME remains netbud.com.au. No payment, upload or direct form-delivery backend was added.

Completed checks:
- Dependency-free catalogue audit: exactly 18 unique IDs/slugs, expected amounts, images, generated page files, canonical metadata, required detail arrays and valid related IDs. Domain file preserved.
- Static site checker expanded to generated product pages: 34 HTML pages, 23 SVGs, 1,052 references and 41 configured asset paths; zero failures or warnings.
- All seven production JavaScript files passed Node syntax checking. Git diff whitespace check passed.
- Browser category filter: NFC 2/18. Search logo: Professional Logo Design. Unknown keyword: empty state/reset. Monthly: 4/18. Tradies industry: 15/18.
- All 18 direct HTML product pages rendered the correct heading, selected product and expected price, two or three relevant FAQs, enabled enquiry action and no broken loaded images or horizontal overflow in the observed desktop viewport.
- Product enquiry tested with synthetic qa@example.com: chosen product and quantity carried into a reviewable draft and mailto/WhatsApp actions. No external message sent.
- Physical review card plus monthly SEO basket: one-time A$39 and monthly A$299 kept separate; enquiry draft contains both. Optional phone/delivery details did not block draft preparation. Empty basket restores its useful state. Test basket cleared.
- Generic contact prefill and legacy product.html?id=1 tested. Original homepage heading, two hero scenes and callback form remain present; homepage website price renders From A$599.
- Shop at 375px; product at 375px; shop and logo product at 768px; shop at 1440px: no horizontal overflow. Actual viewport dimensions recorded. Mobile navigation opens/closes with Our Work link visible.
- No independent theme switch existed; existing light design and dark sections retained. Reduced-motion support retained in existing CSS/JS; no new animated system introduced.
- Final observed browser error log was empty. These are browser-emulation checks, not physical-device or external provider tests.

Evidence: shop-launch/desktop-shop.jpg, mobile-product.jpg and qa-results.json in the existing visual evidence directory. Publishing status is reported with the final Git commit in the delivery response. Implementation and outstanding supplier/platform agreements: SHOP_LAUNCH.md.

## Supplied photographic image integration — 16 November 2026

- Created four optimised WebP crops from the owner's 1536 x 1024 collage, excluding white dividers. Native crops are 764 x 515 or 764 x 501; no upscaling. Visually inspected all four output files.
- Catalogue audit passed for all 18 products, approved prices, local image files, detail pages and retained domain. Static checker: 34 HTML pages, 23 SVGs, 1,052 references and 41 configured paths, zero failures/warnings. Shared JavaScript syntax and diff whitespace checks passed.
- Browser desktop at 1280px: Shop hero and four catalogue photo mappings checked; images loaded after scrolling. Search for logo returned 1/18. All four product heroes loaded with appropriate captions and unchanged prices. Services hero loaded; homepage hero/callback remained present with three updated featured cards. No horizontal overflow observed.
- Added the four relevant items using product buttons; basket rendered all four matching WebP thumbnails with object-fit cover. Basket checked at desktop and 375px, then cleared through its normal UI. No external enquiry was sent.
- Browser at 375px: Shop, four product pages, homepage, Services and basket checked without horizontal overflow. Visible hero photos loaded; below-fold images remain lazy until scrolled into view. Mobile menu opened and closed; Our Work link visible.
- Existing light design and dark sections preserved; no independent dark-mode feature exists to switch or test. No physical-device or provider integration test claimed. Final observed browser error log empty.
- No DNS, CNAME, payment, prices, service scope or homepage animation changes. Asset mapping and sizes: IMAGE_ASSETS.md. Live deployment verification is reported with the final commit in the delivery message.
