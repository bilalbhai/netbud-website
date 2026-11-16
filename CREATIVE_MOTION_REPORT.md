# NetBud creative motion experience — approval edition

## A. Executive summary

Implemented in `codex/netbud-creative-motion`, starting from `69cc456`. Recovery tag: `netbud-before-creative-motion-20261116`.

**This edition is local and has not been published.** The brief explicitly requires review and approval before production deployment. Main, DNS, GitHub Pages settings and CNAME have not been changed.

The warm design system, photography and useful layouts are retained. The new experience adds a more expressive first screen, deliberate reading rhythm, tactile product feedback and a clearer process journey. Motion is selective: forms, prices, basket controls and legal reading remain stable.

## B. Hero redesign

- The headline is now **“Your business deserves a website that stands out.”** It communicates the website offer directly, with the final phrase in coral. Supporting copy retains custom-coded websites, NFC and practical digital support.
- The desktop composition pairs editorial text with the existing product stage. At 375px, the main preview action remains within the first screen. Device proportions and imagery are retained.
- Two diffused peach/lavender/blue light layers drift on separate 30/36-second cycles. Their transforms and opacity animate; large blur filters and gradient paint properties do not.
- Eight authored word spans preserve space and line wrapping. The H1 has one clean accessible name; decorative word content is hidden from assistive technology. The 600ms word sequence starts at 140ms with an 80ms stagger, finishing in about 1.3 seconds. No JavaScript text splitting or layout-changing font animation is used.
- Supporting copy enters over 550ms. The main CTA is immediately actionable. Arrows respond to hover/focus, and only selected primary actions receive a restrained shine.
- A separate laptop wrapper floats through 5px over eight seconds. Phone/card transforms are not used for floating or pointer tilt.
- **Pause and Next** are visible in a small control row above the stage. Pause also stops decorative ambient motion. Next starts the selected demonstration; reduced-motion users receive one manual preview control. Focus on the product CTA continues to hold its destination steady.
- The existing hero controller remains the only scene clock. NFC milestones are consolidated within its three-second scene: approach/tap at .75s; a .5s hold with two signal glows; an .8s contact transition; then the phone rises. The straight card exits diagonally up-left in .2s. A restrained ring shares this clock. Contact details, ivory logo medallion, natural copper lock screen and physical proportions are retained.

## C. Animation inventory

All 20 IDs were reviewed and assigned deliberately. “Retained/refined” means an existing suitable effect was improved rather than duplicated.

| ID / name | Location and implementation | Trigger / timing | Mobile | Reduced motion | Status |
| --- | --- | --- | --- | --- | --- |
| 1 · Pastel aurora | Two hero pseudo-elements; transform/opacity only | In-view; 30/36s cycles | Static pastel | Static pastel | Implemented |
| 4 · Word reveal | Eight semantic H1 word spans | Initial entry; 600ms, 80ms stagger, 140ms start | Same restrained 12px rise | Complete text immediately | Implemented |
| 7 · Subtitle rise | Hero supporting paragraph | Initial entry; 550ms, 380ms delay, 10px | Same small movement | Immediate text | Implemented |
| 9 · CTA arrow | Hero, text links and Shop primary card actions | Hover/focus; 220ms, 4px | No pointer-only movement | Static arrow | Retained/refined |
| 10 · Product float | Separate laptop wrapper | Playing scene; 8s, 5px total | Small movement retained | Static composition | Implemented |
| 40 · NFC demonstration | Existing two-scene hero and specialized controller | 3s scene; coordinated milestones above | Existing physical scale | Manual static previews | Retained/refined |
| 11 · Nav underline | Existing desktop navigation | Hover/focus; 220ms; active item remains marked | Existing calm menu | Immediate active state | Retained/refined |
| 12 · Glass header | Existing `has-scrolled` state, shared header | Scroll state; 220ms colour/border/shadow | Same stable header height | Immediate state change | Retained/refined |
| 15 · Button shine | Hero primary, Shop hero and closing primary CTA | Hover/focus only; 480ms | No continuous/touch shimmer | Omitted | Implemented selectively |
| 21 · Fade-up | Chosen headings, service groups and editorial panels | Shared observer; 520ms, 16px | 12px | Visible immediately | Refactored |
| 22 · Side reveals | Services columns, selected About/Preview editorial content | Shared observer; 520ms, 22px | Small upward fade | No translation | Implemented selectively |
| 24 · Mask wipe | Featured PACES image frame and selected preview visual | Shared observer; 720ms | One-time, limited use | Unmasked immediately | Implemented; opacity fallback |
| 25 · Card stagger | Featured products, catalogue's initial visible rows and service groups | 80ms per column, capped at 240ms; 520ms entrance | Limited row stagger | Immediate cards | Implemented; filters do not replay |
| 29 · Process timeline | Home process, five-step Process page and home preview steps | Shared observer; 650ms segment; capped milestone delay | Vertical home/process; compact preview steps | Complete line immediately | Implemented |
| 31 · Card lift | Interactive products, static portfolio and linked cards | Fine-pointer hover; 300ms, 3–4px | No hover dependency | No lift | Retained/refined; forms excluded |
| 33 · Image zoom | Product and portfolio frames | Fine-pointer hover; 450ms, approximately 1.025× | Stable frames | No zoom | Retained |
| 35 · Subtle tilt | One Shop featured image and physical-product galleries | Fine pointer; maximum 2.2°, RAF updates | Transform disabled; touch guard | Static image | Implemented selectively |
| 39 · Tap ripple | Existing NFC tap ring | Same scene clock; .75–1.25s | Same synchronized ring | Omitted | Refined; no independent loop |
| 46 · FAQ accordion | Native FAQ/details and supporting benefits | Summary click/Enter; 260ms height animation | Same semantic interaction | Native immediate toggle | Implemented; native fallback |
| 50 · Closing ambience | Closing CTA and footer | In-view; 34s, low opacity | Static dark glow | Static dark glow | Implemented |

Deliberate omissions: tilt is not applied to all 18 cards, the carousel, forms or the founder section. Masks are not applied to every thumbnail. Legal paragraphs, prices, totals, active form fields and long FAQ answers do not receive entrance sequences. Existing service photography and original demonstrations are reused; no decorative effects were added merely to fill the inventory.

## D. Files changed

The complete file inventory appears at the end of this report. Main implementation responsibilities:

- `css/motion.css`: reusable entrances, hero/closing atmosphere, safe pointer treatments, timeline and motion preferences.
- `js/motion.js`: one shared visibility observer, limited stagger, timeline milestones, cached-bounds pointer tilt, semantic accordion enhancement and pause integration.
- `js/main.js`: replaces the broad reveal collector with shared motion initialization; adds selected Shop action arrows.
- `js/hero-story.js`: preserves the specialized clock and adds manual Next / decorative-pause notification.
- `js/section-experience.js`: keeps the existing header and carousel logic; retires its duplicate preview-step observer.
- `css/style.css`: synchronizes the existing NFC keyframes and removes competing legacy entrance rules.
- `css/polish.css`: limits card lift to interactive surfaces and removes unnecessary transition precedence.
- `index.html`: authored headline, supporting copy and accessible product controls.
- Existing page templates and generated routes: shared motion asset references and cache version only, except the intentional homepage content above.
- `scripts/check-motion.cjs`: dependency-free controller regression checks.

## E. Existing features preserved

`js/products.js` and `js/config.js` are **byte-for-byte identical** to the saved starting files. All 18 amounts, GST statement, billing types, inclusions, exclusions, FAQs, commercial qualifications and business details remain unchanged. No new checkout, delivery endpoint, upload or analytics integration is introduced. The retired Custom Websites URL still redirects to the integrated Services content; it has not been rebuilt as a separate marketing page.

Actual functional checks covered:

- Shop categories, search, monthly filtering, industry filtering, ascending price sort and reset to 18 products. Re-rendered filter results appear immediately, without another entrance sequence.
- All 18 detail pages: correct heading/price, loaded main image, required email and working quote action; physical galleries retain image enlargement.
- Quote basket: add one-time and recurring items, quantity increase, removal, draft preparation and empty state. Two A$39 cards totalled A$78 separately from A$49/month care.
- Callback, contact, free-preview, product and basket draft paths; invalid email handling. Drafts state that nothing has been sent. No QA enquiry was sent externally.
- Mobile menu open/close and Escape; callback shortcut; carousel Next and Home; comparison endpoints and restoration to 55%; process milestones; native FAQ keyboard interaction.
- Hero Pause/Play and manual Next; tap/preview screenshots show card/signal present during the hold and absent when the contact preview is visible.

Automated checks: 32 controller assertions, JavaScript syntax, 27 clean sitemap routes and local targets, 18 catalogue records, and the HTML/SVG/reference audit. The audit covered 35 HTML source pages, 23 SVGs, 1,206 HTML references and 59 configured paths with zero failures/warnings.

## F. Visual evidence

Evidence folder:

`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/creative-motion/`

Contains before/after desktop/mobile hero and full-home views, Shop, NFC and website products, Services, Work, Contact, all 18 updated product introductions, tap/contact states, reduced-motion preview, tilt, timeline and viewport results. `desktop-overview.jpg` compares complete rendered baseline and revised pages. The saved baseline was rendered from the recovery version on a separate local server, without changing the working checkout.

Browser checks covered **33 routes at 375, 430, 768, 1024, 1440 and 1920px: 198 checks**, after the scripts completed initialization. No document overflow, duplicate H1 or completed image-load failure was found. Home was rechecked after its final control-row refinement. This was the in-app Chromium browser, not a claim of physical iPhone, Safari or Firefox testing.

Full-page captures were scrolled through before capture so the one-time entrances and lazy images were exposed. Earlier quick captures are retained as motion-state evidence; final settled views take precedence.

## G. Performance

No runtime dependency, animation library, new raster image or external script was added. Existing WebP assets, explicit dimensions and lazy loading are retained.

The shared observer replaces the old broad collector and duplicate preview observer. Pointer bounds are read on entry, then style updates are scheduled through one pending RAF. Continuous ambience uses a few CSS transform/opacity layers; it is static on small screens and stops outside view, while hidden, paused or reduced. Only an actively toggled FAQ animates height.

Final local samples (native browser measurements):

| Viewport | LCP sample | CLS sample | Long tasks ≥50ms | Frame interval p95 | Frames sampled |
| --- | --- | --- | --- | --- | --- |
| 1440px | 164ms | 0.00084 | 0 | 16.9ms | 237 |
| 375px | 200ms | 0 | 0 | 16.9ms | 237 |

The JSON observations are saved in the evidence folder. The measurement fixture uses native PerformanceObserver and a short RAF sample in the actual preview browser. It is local-only and is not shipped. Results are **unthrottled localhost samples**, not Lighthouse scores or real-user Core Web Vitals certification. INP, real mobile CPU/GPU/battery behaviour and throttled network measurements were not available and are not claimed.

The initial source-bundle comparison was approximately 369.5KB before / 394.7KB after, with estimated per-file gzip totals 83.8KB / 89.0KB: roughly 5.2KB compressed increase. This includes shared CSS/JS and catalogue data, excludes unchanged images/fonts and does not describe GitHub's actual transfer compression.

## H. Accessibility and fallbacks

- One H1 with a single accessible name; decorative layers and icons are not announced. Scene labels and contact information remain intact.
- Keyboard focus is visible. Focusing a reveal target or its containing link immediately exposes the content. Carousel and comparison keyboard behaviour are preserved.
- FAQs retain native details/summary semantics, cancel interrupted transitions and return focus to the summary if closing would hide a focused answer link.
- Reduced-motion fixtures confirmed immediate text, no hidden reveal targets, stopped ambience/phone animation and a manually reachable contact preview. The fixture applies the real reduced-motion CSS and preference path; it does not change the user's OS preference.
- Script-free fixtures confirmed visible hero content, working main action, contact fallback and static Business Website details/price/image with zero script elements. Native FAQ controls remain available.
- An unavailable-IntersectionObserver fixture confirmed visible content with no shared motion enhancement.
- Small-screen layouts disable tilt and ambient loops. Pointer tracking is guarded by fine-pointer/hover capability; real touch hardware was not emulated.

## I. Outstanding items

1. **Design approval** is required by this brief before publication.
2. Direct form delivery still requires a genuine endpoint; current reviewable email/WhatsApp drafts are preserved.
3. Social URLs and analytics remain optional/unconfigured. No fake account links or tracking were added.
4. The existing Privacy/Terms drafts still need the stated business/legal review. No legal approval is claimed.
5. Genuine founder/office photography can be supplied later; existing labelled illustrative scenes remain. No person or client outcome was invented.
6. Real-device/cross-browser and throttled performance checks remain separate from the completed local browser review. No DNS, certificate or hosting settings were touched.

## J. Deployment readiness after approval

Local preview: `http://127.0.0.1:8765/`. Review branch: `codex/netbud-creative-motion`. This version is not live.

After explicit design approval:

1. Run `node scripts/check-motion.cjs` and `node scripts/build-catalogue.cjs`, then review any generated changes.
2. Fetch `origin` and reconcile any production changes made while this design was being reviewed, preserving the approved business data and CNAME.
3. Merge the review branch into `main` normally; do not force-push or overwrite unrelated changes.
4. Push `main` to the existing `bilalbhai/netbud-website` repository. Keep the existing Pages main/root publishing setup.
5. Wait for the existing GitHub Pages build/deployment to succeed.
6. Verify the actual public Home, Shop, product, form and asset routes and capture a live screenshot before claiming publication.

The local server is retained for the approval handoff. No experimental change has been pushed to production.

Example Git commands, to run only after approval and any production changes have been reviewed:

```sh
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff codex/netbud-creative-motion
git push origin main
```

## Complete changed-file inventory

| File | Role |
| --- | --- |
| `404.html` | Existing page template; shared motion assets/cache references, content preserved |
| `CREATIVE_MOTION_AUDIT.md` | Baseline findings and recovery record |
| `CREATIVE_MOTION_REPORT.md` | Implementation inventory, verification, limits and approval handover |
| `README.md` | Motion maintenance and review workflow |
| `about.html` | Existing page template; shared motion assets/cache references, content preserved |
| `about/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `cart.html` | Existing page template; shared motion assets/cache references, content preserved |
| `cart/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `contact.html` | Existing page template; shared motion assets/cache references, content preserved |
| `contact/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `css/motion.css` | Shared motion styles, responsive and reduced-motion treatment |
| `css/polish.css` | Interactive-card hover restriction and transition precedence cleanup |
| `css/style.css` | Existing NFC milestone/keyframe consolidation and legacy entrance cleanup |
| `free-preview.html` | Existing page template; shared motion assets/cache references, content preserved |
| `free-preview/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `how-it-works.html` | Existing page template; shared motion assets/cache references, content preserved |
| `how-it-works/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `index.html` | Authored hero headline, supporting copy and product controls; shared asset versions |
| `js/hero-story.js` | Existing scene controller, manual Next and global pause notification |
| `js/main.js` | Motion integration, selected card arrows and observer cleanup after filtering |
| `js/motion.js` | Shared observer, timelines, selective tilt and semantic FAQ controller |
| `js/section-experience.js` | Retain carousel/header; remove duplicate preview-step observer |
| `portfolio.html` | Existing page template; shared motion assets/cache references, content preserved |
| `portfolio/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `previews/index.html` | Existing page template; shared motion assets/cache references, content preserved |
| `pricing.html` | Existing page template; shared motion assets/cache references, content preserved |
| `pricing/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `privacy.html` | Existing page template; shared motion assets/cache references, content preserved |
| `privacy/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `product.html` | Existing page template; shared motion assets/cache references, content preserved |
| `product/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `scripts/check-motion.cjs` | 32 dependency-free controller regression checks |
| `services.html` | Existing page template; shared motion assets/cache references, content preserved |
| `services/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop.html` | Existing page template; shared motion assets/cache references, content preserved |
| `shop/business-analytics-tracking-setup.html` | Generated product source/fallback; shared motion references |
| `shop/business-analytics-tracking-setup/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/business-website.html` | Generated product source/fallback; shared motion references |
| `shop/business-website/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/custom-nfc-business-card.html` | Generated product source/fallback; shared motion references |
| `shop/custom-nfc-business-card/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/digital-invoicing-system-setup.html` | Generated product source/fallback; shared motion references |
| `shop/digital-invoicing-system-setup/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/domain-professional-email-setup.html` | Generated product source/fallback; shared motion references |
| `shop/domain-professional-email-setup/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/ecommerce-website.html` | Generated product source/fallback; shared motion references |
| `shop/ecommerce-website/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/google-business-profile-management.html` | Generated product source/fallback; shared motion references |
| `shop/google-business-profile-management/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/google-business-profile-setup.html` | Generated product source/fallback; shared motion references |
| `shop/google-business-profile-setup/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/landing-page.html` | Generated product source/fallback; shared motion references |
| `shop/landing-page/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/monthly-seo-management.html` | Generated product source/fallback; shared motion references |
| `shop/monthly-seo-management/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/nfc-google-review-card.html` | Generated product source/fallback; shared motion references |
| `shop/nfc-google-review-card/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/online-booking-system-setup.html` | Generated product source/fallback; shared motion references |
| `shop/online-booking-system-setup/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/portfolio-website.html` | Generated product source/fallback; shared motion references |
| `shop/portfolio-website/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/professional-logo-design.html` | Generated product source/fallback; shared motion references |
| `shop/professional-logo-design/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/seo-setup-optimisation.html` | Generated product source/fallback; shared motion references |
| `shop/seo-setup-optimisation/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/social-media-content-management.html` | Generated product source/fallback; shared motion references |
| `shop/social-media-content-management/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/website-hosting-care.html` | Generated product source/fallback; shared motion references |
| `shop/website-hosting-care/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `shop/website-redesign.html` | Generated product source/fallback; shared motion references |
| `shop/website-redesign/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `terms.html` | Existing page template; shared motion assets/cache references, content preserved |
| `terms/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
| `thank-you.html` | Existing page template; shared motion assets/cache references, content preserved |
| `thank-you/index.html` | Generated clean-URL page; regenerated motion references, commercial content preserved |
