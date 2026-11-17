# NetBud cinematic hero — review edition

Branch: `codex/netbud-cinematic-hero`, based on deployed `6bf21d7`. Not published.

## What changed

- A separate wrapper introduces the existing laptop once per page load: .88 scale, 30px rise and 10° X tilt, easing to its normal position over1.6s after a .2s delay. The original photograph and its soft shadow remain in place.
- Two clipped surfaces add restrained peach/lavender/white studio reflections to the bezel and keyboard. A masked bezel excludes the website screen; the screen itself is not overlaid. Reflection starts at .8s and fades by2.5s, safely before the existing3s scene change.
- On phones, scale starts at .95, rise14px, tilt4°, with only the keyboard reflection. No full-screen blur, libraries, new images or ongoing reflection loop.
- The existing controller creates the wrapper, consumes the introduction on scene change, and shares Pause/Play state. No second scene timer/controller was introduced. The laptop's internal scrolling and the NFC keyframes were not edited.
- Completed or interrupted introductions cannot replay on later carousel cycles. Reduced motion immediately settles the laptop and hides both reflection layers. No JavaScript means the original, visible static laptop remains.
- Hero text, headline, primary CTA, phone contact details, product links and scroll-story sections remain unchanged.

## Changed files

| File | Purpose |
|---|---|
| index.html | Home-only cinematic stylesheet; hero script cache version |
| css/cinematic-hero.css | Perspective entrance, masked light, pause and reduced/mobile rules |
| js/hero-story.js | Small introduction helper integrated with existing scene lifecycle |
| CINEMATIC_HERO_REPORT.md | Implementation and verification record |

## Verification

- Desktop and mobile baseline screenshots captured before editing.
- Rendered browser checks at375,430,768,1440,1920px: no horizontal overflow, laptop image fits its stage, CTA has visible layout, original screen remains present. Mobile4° and desktop10° variables verified.
- Sampled the entrance mid-frame: perspective matrix observed; Pause froze it. Reflection opacity peaked at .28 while website screen opacity stayed1.
- Observed normal completion, then advanced scenes: wrapper remained settled with animation `none`. Interrupted introductions were also consumed on Next.
- NFC scene still reports `business-cards` with its existing `iphone17-tap-preview` animation. Pause/Play/Next remain available.
- Existing isolated controller regression suite:32 checks,0 failures. JavaScript syntax and git whitespace checks pass. No captured browser console errors/warnings.
- No-JavaScript fixture:0 scripts, visible original laptop and working free-preview link.
- Reduced-motion local fixture simulated the preference and matching new stylesheet rules: entrance `none`, reflection `display:none`. This was not an OS preference or physical-device test.
- Performance: finite transform/opacity animations, no additional timers, scroll listeners, libraries or assets. No throttled benchmark, Lighthouse measurement or numerical frame-rate claim. Screenshots captured; no video recording was made.

Evidence: `C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/cinematic-hero/`.

## Review

http://127.0.0.1:8765/?review=cinematic-approval

Reload to see the one-time entrance again. Production remains unchanged pending approval, as requested in this brief. After approval: fetch origin, verify main has not diverged, push the approved branch to main without force, verify the Pages deployment and inspect the live hero. No DNS changes are needed.
