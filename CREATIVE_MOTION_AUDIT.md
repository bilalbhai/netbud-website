# Creative motion baseline — 16 November 2026

Baseline: `69cc456`; recovery tag `netbud-before-creative-motion-20261116`; working branch `codex/netbud-creative-motion`. Production remains on `main`. This brief requires review and approval before publication.

The current website already has good photography, a consistent warm palette, clear entry scopes, distinct service mockups, a useful comparison and a working 3D carousel. These are retained. No new imagery or dependency is necessary for this motion brief.

Observed starting issues:

1. The short hero headline is clear but the first-screen composition is comparatively static. Its existing product animation is the strongest visual asset.
2. The shared entrance system targets nearly every paragraph, image and form. This creates too many similar fades instead of deliberate reading rhythm.
3. The pause control is hidden outside reduced-motion mode. Restore a clear control without reintroducing the removed Digital Desk heading or progress dots.
4. Several historic NFC keyframes use different milestones. Consolidate around the approved 3s scene: tap at .75s, hold/blink for .5s, contact transition .8s, then phone lift. Keep the straight card and .2s diagonal up-left exit.
5. Header scroll state, navigation underline, product lift and zoom already exist. Refine them instead of adding second controllers.
6. The process has a static/one-shot line, while FAQs open natively without a coordinated closing transition. These are suitable places for meaningful motion.
7. Informational cards should stop lifting merely because the pointer passes over them. Reserve tactile feedback for interactive surfaces.

Before evidence was captured from the current local repository: desktop/mobile hero and full home, desktop/mobile Shop, NFC and website detail pages, Services, Work and Contact. Evidence is saved under the local `creative-motion` review folder. Existing templates, 18 catalogue records, generated routes, scripts and styles were inspected before implementation.

Architecture: one shared motion observer in `js/motion.js`, called by the existing main initializer; existing specialized hero-story and section/carousel controllers remain responsible for their own state. The old broad reveal collector and duplicate preview-step observer are retired. Native CSS and small vanilla JS enhancements provide all 20 requested techniques selectively.
