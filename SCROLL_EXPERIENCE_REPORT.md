# NetBud premium scroll experience — review edition

Implemented on `codex/netbud-scroll-stories`, based on published commit `288b757`. Not pushed or deployed. The hero headline, NFC controller, catalogue, prices, basket and enquiry logic are unchanged.

## Page-by-page changes

- **Home / custom websites:** replaced the short benefits panel with four chapters. A CSS laptop stays pinned on the left while the nearest chapter changes its screen. Numbered anchor links show progress and also allow direct navigation. The laptop releases within its own section. Demonstrations are identified as illustrative.
- **Home / service overview:** four photographic cards introduce custom-coded websites, NFC business cards, Google review cards, and branding/digital growth. Desktop cards stack at staggered offsets below the header; previous cards scale only from 1 to .96. Each retains a real service/product link. Existing featured product prices below are unchanged.
- **Home / featured work:** restrained movement inside the first PACES image. The project carousel retains its own transforms and controls.
- **Services:** subtle movement inside the large consultation photograph.
- **Portfolio:** subtle movement inside the first authorised project image. Other projects remain still.

## How it works

One new passive scroll listener schedules at most one pending animation frame. One IntersectionObserver limits work to visible scenes; hidden documents stop updating. Geometry reads are batched before writes. Images use nested transform wrappers to avoid competing with the carousel and reveal layers. Parallax is capped at 18px and additionally limited by image height; overscan prevents exposed edges. There are no wheel listeners, scroll interception, timers, libraries or new image downloads.

Desktop enhancement requires width >=1000px, height >=720px, JavaScript, IntersectionObserver and no reduced-motion preference. Smaller/shorter screens use ordinary vertical cards and one image per benefit. Reduced-motion users get the same static alternative. Without JavaScript all benefit text/images and service links remain available. Focused stack cards rise above adjacent cards and return to full scale.

## Changed files

| File | Role |
|---|---|
| index.html | Four-chapter story and four service cards; shared asset references |
| services.html | Scroll stylesheet and controller |
| services/index.html | Matching clean-route entry |
| portfolio.html | Scroll stylesheet and controller |
| portfolio/index.html | Matching clean-route entry |
| css/scroll-experience.css | Laptop, responsive story, stack, clipped photography and static fallbacks |
| js/scroll-experience.js | Shared visibility-gated scheduler and chapter selection |
| SCROLL_EXPERIENCE_REPORT.md | Implementation, verification and publication notes |

## Actual verification

- Before implementation: local desktop/mobile benefits screenshots, source audit of existing motion, hero controller, services, portfolio and overflow rules.
- Browser: Home, Services and Portfolio at **375, 430, 768, 1024, 1440 and 1920px**. All 18 route/width checks had no horizontal overflow or completed broken images.
- Rechecked stacking at all six widths: static below1000px, sticky above; links have visible layout boxes and no horizontal overflow.
- All four story chapters selected the matching image. Middle chapters held the visual at160px. Scrolling past the next section moved the visual above the viewport, confirming natural release.
- All four stack stages inspected and captured. Offsets145/167/189px and minimum .96 scaling observed. The final service link navigated to Services successfully.
- Start/middle/end photography samples captured on all three pages. An initial homepage image-edge failure was found and corrected with a full-frame surface; the corrected crop passed the follow-up geometry check. Services and Portfolio samples covered their clips.
- No-JavaScript fixture: zero scripts; static cards; visible benefit images; no pinned presentation.
- Reduced-motion **local fixture**: preference response and matching new CSS rules simulated; enhancement off, static cards, laptop hidden. This was not an operating-system preference/device test.
- Existing hero manually advanced to business-cards with its state still playing. Existing controller regression suite: **32 checks, zero failures**. New JavaScript syntax and git whitespace checks passed. Browser console contained no captured errors/warnings.
- Performance safeguards: no dependency or new imagery, bounded transforms, no continuous idle loop. No Lighthouse, CPU-throttled, field Core Web Vitals or physical-device performance measurement was performed; no numerical speed-up or frame-rate claim is made.

## Evidence

Screenshots and responsive JSON are in:
`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/scroll-stories/`

Includes story1–4, stack0–3, photography start/middle/end, mobile, no-JavaScript and reduced-motion fixture captures. `approval-story.jpg` is the current desktop proof. Baseline captures were taken before editing.

## Review and deployment

Preview: http://127.0.0.1:8765/?review=scroll1

No production approval has been given for this brief. After approval: fetch origin, verify main is still an ancestor of this branch, run the controller/syntax checks, then push this branch to main with plain git. If main has advanced, reconcile it first; never force-push. Confirm GitHub Pages succeeds and inspect the three published pages. No DNS or hosting changes are needed. The unrelated existing `tmp/` directory is excluded from this change.
