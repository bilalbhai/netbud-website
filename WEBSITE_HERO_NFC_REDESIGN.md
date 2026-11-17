# NetBud website hero + separate NFC demonstration

Review branch: `codex/netbud-website-hero-nfc-section`, based on live `7586687`.
**Not pushed or deployed.** The brief requires approval before production publication.

## 1. New website-only hero

- Replaced the laptop/NFC carousel with a full-width browser presentation. Oversized editorial headline sits above an original, explicitly illustrative Morrow Café concept, using existing café photography, warm serif type, arched imagery and a clear visual hierarchy.
- The headline is still **“We make business tech easy.”** Only typography, placement and line breaks changed.
- Primary Free Homepage Preview and secondary Our Work actions are immediately visible. Coral glass and translucent ivory surfaces provide contrast, subtle blur and restrained hover feedback. They never depend on a first scroll.
- On capable desktops, a concise180svh region pins the visible stage. Native scrolling gently straightens and enlarges the browser, advances its website content and lets the editorial introduction recede. The action dock stays visible. The stage then releases naturally into the existing ribbon/callback content.
- Mobile, tablets, shorter windows, reduced-motion and no-JavaScript layouts use normal document flow. Their actions precede the large website visual, keeping the primary action within the first screen.
- NFC markup and its animation are completely outside the hero. There is no automatic scene switching or NFC timing inside the website presentation.

## 2. Separate NFC section

Placed after the existing main service stack, before featured work. “One tap. A better connection.” introduces the same approved card, iPhone body, warm lock screen, ivory NetBud avatar and configured business contact details. Existing custom-card and Google-review-card destinations remain correct.

The glass demonstration stage contains the existing card/phone components, with one newly synchronized10-second timeline:

| Time | Movement |
|---|---|
| 0–4s | Card remains centred; phone approaches from below |
| 4–4.5s | Two signal glows and a restrained tap ring |
| 4.5–4.7s | Straight card exits diagonally up-left |
| 4.5–5.3s | Lock screen fades to the contact preview |
| 5.3–7.2s | Phone rises into its final centred position |
| 7.2–10s | Contact preview remains visible |
| After10s | Final preview holds; explicit Replay is available |

Pause/Resume and Replay are46px-tall touch controls. Visibility changes pause/resume the CSS timeline without resetting it. Completion survives re-entry. Small scroll changes never restart the demo. A hidden document suspends playback. Replay explicitly resets all dependent keyframes together using one deliberate layout flush; no secondary animation timer or simulator was added.

Reduced-motion users get a static contact preview and explanatory status with motion controls disabled. Without JavaScript the same static preview remains readable and the controls are disabled. Business details use existing configuration and truthful source fallbacks. The demo does not access NFC hardware, save contacts or send enquiries.

## 3. Existing scroll effects preserved

These source files are unchanged from the deployed baseline:

- `js/motion.js` and `css/motion.css`: section reveals, stagger, masks and other useful motion.
- `js/scroll-experience.js` and `css/scroll-experience.css`: sticky custom-website benefits, stacking services and parallax photographs.
- `js/section-experience.js`: portfolio carousel/comparison/header interactions.
- `css/polish.css`, `js/products.js`, `js/config.js`: shared design system, catalogue, prices and business settings.

The existing callback, service stack, real work, sticky website-benefits story, free preview, products, process, FAQs and closing action remain. No duplicate sections were added. Hero-only `cinematic-hero.css` and `hero-editorial.css` remain in the repository but are no longer loaded by the homepage; their superseded scene effects do not compete with the new controller.

## 4. Modified files

| File | Role |
|---|---|
| index.html | Website-only showcase; immediately available actions; moved NFC markup and standalone section |
| css/website-hero-nfc.css | New editorial/glass design, responsive website scroll stage, NFC10-second keyframes and static fallbacks |
| js/hero-story.js | Refactored into independent website-scroll and reusable NFC-section initializers; retained phone clock/contact configuration |
| scripts/check-motion.cjs | Updated NFC lifecycle regression suite, replacing obsolete two-scene autoplay assumptions |
| scripts/check-hero-scroll.cjs | Website-only scroll invariants, clamping and responsive/reduced preference checks |
| WEBSITE_HERO_NFC_REDESIGN.md | This implementation, testing and publication record |

No image generation, new libraries, framework changes, DNS changes or unrelated page edits.

## 5. Actual checks performed

- Before: desktop/mobile screenshots of the previously deployed presentation.
- Browser-tested **375,430,768,1024,1440,1920px** at900px height: no horizontal overflow or completed broken images. Primary action bottom was within the viewport at all widths. NFC count in the hero was zero; its separate section was waiting offscreen.
- Additional1440×800 compact desktop: headline bottom308px, browser top370px, primary action bottom757px. No headline/showcase overlap; action visible.
- Observed website scroll progress and enlargement, continuous action visibility, and natural release into callback content.
- Inspected all dependent NFC animation names/durations: new section keyframes, all10s. At the tap sample the profile was still hidden and signal visible; Pause froze the phone timeline. After resume, completion had contact opacity1, card0 and signal0.
- Confirmed completion remained complete after scrolling away/back. Replay restored card1/contact0 and could be paused again. Mobile controls measured46px; no horizontal overflow.
- Retained sticky story selected benefit2 while its visual was sticky. Service cards stacked at145/167/189px with restrained .96–1 scale. Portfolio Next changed to the café concept. Existing parallax surface showed a live transform. No preserved-controller source changes were required.
- Reduced-motion **local fixture**: no pinning, immediate hero action, static contact opacity1 and phone animationnone. This simulates the preference and matching CSS branches; it is not an operating-system or physical-device test.
- No-JavaScript fixture:0 scripts, visible website and contact previews, immediate hero action, no pinning/overflow.
- **23 NFC lifecycle checks +18 website-scroll checks =41 passing controller checks.** These cover offscreen/user pause, resume, completion, replay, preference changes, contact values, progress clamping and responsive state cleanup.
-61 local HTML references checked:0 broken;27 unique source IDs; one H1. New CSS braces, JavaScript syntax and git whitespace checks pass. Final browser console contained no errors/warnings.

## 6. Performance and limits

Website scroll updates use one passive listener and at most one pending animation frame, with unchanged end progress avoiding repeated DOM writes. NFC animation is transform/opacity based, pauses outside view and has no per-frame JavaScript loop. Existing phone clock updates once per minute. No heavy animation library or extra remote service.

The reused new hero photograph is131,214bytes (WebP), compared with the old laptop PNG's1,803,155bytes. This is an asset-size comparison, not a measured LCP improvement. The new controller is about7.7KB and stylesheet13.1KB uncompressed. No Lighthouse run, CPU throttling, field Core Web Vitals or physical-device GPU/battery benchmark was performed. Screenshots are provided; no video recording was captured.

## 7. Evidence and approval

Preview: http://127.0.0.1:8765/?review=website-nfc-approval

Evidence folder:
`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/website-hero-nfc/`

Includes before desktop/mobile, six responsive hero images, `approval-hero.jpg`, immersive/release phases, `nfc-tap.jpg`, `nfc-complete.jpg`, mobile NFC, reduced/no-JavaScript fixtures, responsive JSON and retained-effect checks.

## 8. Publish after approval

```text
git fetch origin
git rev-list --left-right --count origin/main...HEAD
node scripts/check-motion.cjs
node scripts/check-hero-scroll.cjs
git push origin HEAD:main
```

If main diverged, reconcile first; never force-push. Check GitHub Pages success, then inspect the live hero and complete NFC playback at desktop and mobile sizes. No DNS/hosting changes are needed. The pre-existing unrelated `tmp/` folder is excluded.
