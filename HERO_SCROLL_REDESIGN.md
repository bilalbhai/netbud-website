# NetBud editorial scroll hero — approval edition

Branch: `codex/netbud-scroll-hero`. Built on the previous local cinematic revision `4bae7ff`; current production baseline is `6bf21d7`. This edition is **not published**.

## Complete composition change

The old two-column hero and rounded demonstration panel are replaced by a centred, full-width stage: editorial headline above a large laptop, atmospheric ivory/peach/lavender lighting, primary preview/work actions in a stable bottom dock, scene controls and a slim scroll-progress line. The laptop expands into its own website presentation, then gives way to a centred phone/contact preview with the heading “Good connections. One simple tap.”

The user's previously preferred **“We make business tech easy.”** remains, rather than adopting the brief's optional suggested headline. Supporting copy now describes websites, NFC and digital solutions; the secondary action opens Our Work. No prices, contact information, catalogue records, forms, other pages or frameworks were changed.

The visual direction responds to the supplied [Codrops reference](https://tympanus.net/codrops/2024/05/29/hover-motion-intro-animation/), while using the existing NetBud devices and vanilla JavaScript rather than importing its implementation or dependencies.

## Sequence

1. **Opening:** centred word reveal, laptop at restrained perspective, clear CTAs. Original laptop/website assets retained.
2. **Website:** normal scroll advances the laptop's perspective and scale, increases the screen's prominence and shifts its content. The headline recedes while the main action dock stays available. Reflections follow the same scroll progress.
3. **NFC:** website fades out; the existing NFC keyframes are scrubbed using paused animations with a negative delay. Card approach, signal, exit, phone lift and contact preview all use the original three-second virtual timeline. No second NFC simulator or timer was introduced.
4. **Exit:** final contact preview scales/fades slightly; the stage releases within its own region into the existing ribbon and callback section.

Capable desktop layout: width >=1000px, height >=760px, no reduced-motion preference, and requestAnimationFrame. The story region is220svh; the visible stage accounts for the header and selling-point strip. A compact composition covers760–899px-tall desktop windows. Shorter windows and mobile/tablets use ordinary vertical flow.

## One controller, no competing autoplay

`js/hero-story.js` remains the sole hero controller. Desktop scroll mode cancels its autoplay timer. One passive scroll listener coalesces changes into one pending animation frame; unchanged clamped progress avoids repeated DOM writes outside the sequence. There is no scroll interception, wheel handler or forced scroll speed.

Pause freezes the presentation without preventing document scrolling. Resume catches up. Next performs an explicit, user-requested scroll to the next scene. A focused product CTA keeps its destination stable until blur. Mobile retains the original three-second autoplay, Pause/Play and Next. Reduced motion disables pinning/autoplay and offers manual static previews, including the contact screen. Without JavaScript the original website visual, copy and links remain visible in normal document flow.

## Files

| File | Role |
|---|---|
| index.html | Editorial hero-stage structure, headline spans, work link, chapter/progress display and new stylesheet |
| css/hero-editorial.css | Full-width composition, desktop sticky/zoom layers, compact desktop, mobile/static alternatives |
| js/hero-story.js | Desktop scroll mode integrated with existing controller; original mobile timing preserved |
| scripts/check-hero-scroll.cjs | Desktop controller state regression checks |
| HERO_SCROLL_REDESIGN.md | Delivery, tests and publishing instructions |

The earlier cinematic stylesheet is reused for the simplified mobile introduction. Device transforms are separated from the stage zoom and existing inner screen/NFC animations.

## Actual tests and refinements

- Captured desktop/mobile before screenshots and opening, expanding website, NFC reveal, ending and mobile screenshots after implementation.
- Browser-tested widths **375,430,768,1024,1440,1920px** at1000px height: no horizontal overflow or completed broken hero images; primary action within the viewport. Phones/tablet used ordinary flow; desktop used sticky scroll mode.
- Also inspected **1440×800**. Found and corrected laptop/headline overlap with a compact layout. Final headline bottom286px, screen top373px, primary action bottom751px: all within the800px viewport, no horizontal overflow.
- Desktop remained in website/scrolling state after waiting longer than the old autoplay interval. Scroll, rather than time, selected the NFC scene. Pause held progress while document scrolling continued; Resume caught up.
- Observed website expansion around progress .27/.45 and NFC contact preview around .82/.94. Final phone fits its clipped area: at1440×1000, phone bottom812px versus clip bottom830px; shorter desktop phone bottom615px versus clip bottom630px.
- Next scene navigated within the story; the work CTA navigated to Portfolio. Normal scrolling passed the hero into the callback content without trapping the page.
- No-JavaScript fixture:0 scripts, visible laptop and free-preview link, no horizontal overflow, no sticky story.
- Reduced-motion fixture: preference response and stylesheet media branches simulated locally. No pinning or phone animation; manual NFC preview had contact-profile opacity1. This was not an OS preference or physical-device test.
- Existing mobile controller regression suite: **32 checks,0 failures**.
- New desktop invariants: **18 checks,0 failures**, including no competing timer, pause/resume, focused link stability, progress clamping, reduced preference, manual preview and desktop/mobile mode transitions.
- JavaScript syntax and git whitespace checks pass. Final browser log read contained no errors/warnings.
- No libraries or image downloads added. No physical-device GPU test, Lighthouse, CPU throttling or numerical frame-rate benchmark was performed. Screenshots are provided; no video recording was captured.

## Evidence and review

Preview: http://127.0.0.1:8765/?review=hero-approval

Evidence folder:
`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/scroll-hero/`

Useful files: `before-desktop.jpg`, `before-mobile.jpg`, `approval-opening.jpg`, `website-expanded-final.jpg`, `nfc-final.jpg`, `ending.jpg`, `mobile-nfc.jpg`, `reduced-fixture.jpg`, `nojs.jpg`, and `responsive.json`.

## Publish only after approval

The live site is unchanged. After the user approves:

```text
git fetch origin
git rev-list --left-right --count origin/main...HEAD
node scripts/check-motion.cjs
node scripts/check-hero-scroll.cjs
git push origin HEAD:main
```

If remote main has diverged, reconcile it before pushing; never force-push. Confirm GitHub Pages succeeds, then inspect the opening, scroll/NFC phases and mobile hero on the live domain. No DNS or hosting changes are required. Existing unrelated `tmp/` files are excluded.
