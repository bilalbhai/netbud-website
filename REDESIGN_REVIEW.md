# NetBud redesign audit and review record

Baseline audit: 26 October 2026. Final local review: 27 October 2026. Three substantive design rounds are complete. This record distinguishes the original findings, implemented refinements, rendered evidence and verification limits. Scores below are internal design judgements, not objective certification or measured conversion results.

## Baseline and preservation

The existing project contains 16 HTML pages, one primary stylesheet, three browser scripts and local assets. Source review covered every HTML/CSS/JavaScript/SVG file plus the project documentation. Baseline static checks passed with no missing local references, but the presentation had a repeated pattern and several targeted functional issues.

A recoverable backup was created before major edits at `.work/backups/netbud-before-redesign-2026-10-26.zip`. Before screenshots and page measurements are retained in:

`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/netbud-redesign/`

The evidence includes `before-home-desktop.jpg`, `before-home-mobile.jpg`, `before-home-full.jpg` and individual screenshots of every supporting page. These local review files are not site deployment dependencies.

The redesign preserves existing page URLs, all six service groups, product IDs, basket operations, the approved A$599 total website starting amount, quote-only remaining services, configured phone/email/WhatsApp, PACES authorisation and truthful concept labels. Form endpoints, payment links, analytics and social URLs remain unconfigured where they were previously blank. The site stays HTML, CSS and vanilla JavaScript with relative paths and no build step.

## Main problems and priorities

| Priority | Baseline weakness | Required improvement |
| --- | --- | --- |
| P1 — visual identity | Cream, green and interchangeable UI illustrations make the identity feel like a familiar template. | Establish one expressive NetBud-owned graphic system and recolour/rework the existing assets coherently. |
| P1 — composition | Services, packages, values and work repeatedly use a heading followed by equal cards. | Use an indexed service presentation, asymmetric work feature and distinct calm/action sections. |
| P1 — hierarchy | Supporting pages repeat large introductions with generous but uninformative space. | Give each page a useful introduction and tighter path to its main task. |
| P1 — first impression | Several abstract headlines describe a tone rather than what the business does. | Make websites, Google visibility, business tools and support understandable within the first screen. |
| P1 — mobile clarity | Small metadata/actions and repeated paragraph blocks make the long page harder to scan. | Increase useful secondary type, shorten copy and deliberately recompose at phone widths. |
| P2 — conversion | Repeated general pitches compete with the callback and limited-preview paths. | Give each section a different job and keep the main enquiry route recognisable. |
| P2 — maintainability | The stylesheet contains layers of later overrides; generated markup is difficult to read. | Consolidate the design system while retaining a single stylesheet and ordinary scripts. |

## Engineering issues to resolve and regress

The baseline source audit found four specific P2 issues. All four were fixed and regressed through browser fixtures and actual task journeys; the final results are recorded in `TESTING.md`.

1. **Physical delivery whitespace:** the required-text list was captured before the delivery address became required. The submit handler now reads currently required enabled fields and rejects whitespace-only values. Regress adding/removing physical products and an empty or space-only delivery address.
2. **Stale enquiry drafts:** editing fields or marketing consent left old draft text and messaging links active. Input/change handling now invalidates the prepared draft. Regress edits to details, consent and basket contents.
3. **Unnamed basket image links:** decorative thumbnail anchors were focusable without a name. Basket thumbnails now have product-specific accessible names. Verify the rendered accessibility names and keyboard journey.
4. **Mobile menu keyboard order:** opening the menu left focus on a toggle after the links. The open handler now moves focus to the first navigation link and retains Escape restoration. Regress the full keyboard sequence and close behaviour.

Secondary fixes cover coherent metadata for invalid product IDs, product-page gutters, field-specific error associations, future analytics preference controls, duplicate-submit prevention, storage recovery and cross-tab clearing. Deployment-specific nested 404 paths remain a launch check: relative assets on a custom 404 must be tested against the actual GitHub project path once known.

## Chosen visual system

| Role | Direction |
| --- | --- |
| Base | Warm cream `#FFFAF0` and charcoal `#251C2E` |
| Main action | Coral `#FF704E` |
| Helpful emphasis | Mango `#FFD35C` |
| Contrasting feature sections | Deep violet `#4933B8` and lavender `#ECE8FA` |
| Headings | Space Grotesk, with local sans-serif fallbacks |
| Body and controls | DM Sans, with local sans-serif fallbacks |
| Graphic language | Original connected shapes, purposeful service visuals and layered interface examples; genuine PACES imagery stays recognisable |
| Motion | Brief CSS/vanilla-JavaScript feedback and transitions that explain interaction; no content-gating loader, cursor requirement or mandatory animation |

Colour roles must be tested against actual foreground/background pairs. Coral and mango are expressive surfaces, not an assumption that white small text will be readable on them. Reduced-motion settings and keyboard/touch alternatives remain required.

## Three substantive review rounds

| Round | Scope and required visible change | Evidence to record | Status |
| --- | --- | --- | --- |
| 1 — structural quality | Recompose the homepage, simplify copy, improve page introductions and mobile hierarchy; retain working task routes. | Seven initial viewport captures reviewed: desktop/mobile homepage, services, contact, pricing, portfolio and product. Findings below feed Round 2. | Complete structural pass and first rendered review |
| 2 — visual excellence | Refine palette balance, type, original assets, section transitions, depth and purposeful interaction. | `round2-home-desktop.jpg`, `round2-home-mobile.jpg`, `round2-home-full.jpg` and supporting-page captures; real work shown sooner, clearer mobile type and contextual floating actions. | Complete |
| 3 — final polish | Correct line wrapping, padding, alignment, controls, focus feedback and phone spacing. | `round3-comparison-desktop.jpg`, `round3-comparison-mobile.jpg`, final `after-*.jpg` captures, 119 responsive checks and 272 fixture executions. | Complete within the documented local test limits |

Each round must produce a visible or measurable improvement. If a change worsens clarity or usability, refine or revert it. Do not copy the same unchanged critique into all three rows.

### Round 1 findings and changes

Implemented structural changes include a direct website/business-tech offer, a three-tab illustrative digital desk, an indexed homepage service presentation, a substantial authorised PACES feature and subordinate fictional concepts. The limited-preview area uses a clearly labelled illustrative comparison slider. The supporting pages now have shorter introductions; six service feature lists remain available through native disclosures, and the About values use compact rows instead of another equal-card grid. URLs, service anchors, form controls and pricing/contact settings remain in place.

The independent first-time-customer review inspected these actual files in the screenshot folder stated above:

- `round1-home-desktop.jpg` and `round1-home-mobile.jpg`
- `round1-services.jpg` and `round1-contact.jpg`
- `round1-pricing.jpg`, `round1-portfolio.jpg` and `round1-product.jpg`

The offer and primary callback were understandable from the first desktop and mobile screens. The headline, literal service description and two clear actions gave a useful starting point; A$599 remained visibly a starting price rather than an accepted order total.

Concrete weaknesses were recorded rather than treating the first implementation as final:

1. The desktop WhatsApp pill overlapped the callback email field in the contact capture and disclaimer text in the product capture. Round 2 must prevent this overlap and verify the new placement in a fresh viewport capture.
2. Portfolio used a decorative brand tile and a second large introduction before any project media. Remove that tile and repeated introduction so the actual PACES feature appears sooner.
3. Pricing spent too much of the next screen on another large introduction before the plan options. Shorten the heading and sentence, then tighten that section's spacing.
4. Services showed two plus signs on the same disclosure. The stylesheet now hides the redundant inline icon; confirm that the next capture shows only one expansion indicator.
5. “See a Free Homepage Preview” sounded like an immediate viewing action. Change the secondary hero action to “Request a Free Homepage Preview” to describe the destination accurately.

These are viewport observations. They do not establish full-page quality, all supporting-page mobile layouts, form outcomes or external-service delivery.

### Round 2 findings and changes

The desktop WhatsApp control previously covered useful contact/product content. It now responds to visible forms and product details; mobile callback controls also yield to visible enquiry actions and the open navigation. Actual contact and product captures show the formerly obscured fields and text. Observer fixtures separately verify focus protection, menu state and a no-observer fallback.

Portfolio now removes its decorative hero tile and repeated introduction, putting the genuine PACES feature approximately 604px from the top at the reviewed desktop width. The pricing options introduction is shorter. The homepage preview action says “Request a Free Homepage Preview”, accurately describing the next step. The redundant service disclosure plus sign is removed. Product enquiry actions now follow the price instead of sitting beneath the long details; their reviewed desktop position moved from approximately 830px to 640px.

The hero, product art, concept examples, wordmarks and social image use one coral/mango/violet system. The three digital-desk states have distinct website, calendar and map compositions. Café and trades concepts use their own appropriate palettes while remaining explicitly fictional. PACES imagery was preserved unchanged. Wordmarks use outlined lettering, so their SVG appearance does not depend on a remote font.

At 375px the homepage headline block reduced from approximately 215px to 149px in height. This made the introduction easier to scan without removing its explanation or enquiry actions. Desktop and phone captures were reviewed again after these changes.

### Round 3 findings and changes

The first comparison implementation could leave a blank violet pane because its copy was clipped with the image. It now uses two proportional panes with inner padding; both examples remain understandable at the default 55%. Keyboard endpoint checks prove that 0% and 100% fully hide the intended pane, and the native thumb aligns with the divider. A misleading decorative drag circle was removed. At tablet widths the preview section now becomes one column at 900px, giving the comparison enough space for its text.

The mango callback-card helper text originally measured approximately 4.29:1 contrast. Its scoped text colour now measures approximately 6.39:1. Contact-panel focus uses a visible mango outline. The 404 hero structure and tablet card headings were corrected, thank-you actions have consistent spacing, and the final stylesheet/HTML were formatted with token/content-equivalence checks.

During the earlier redesign testing the in-app browser retained stale HTML on previously visited addresses, even after a normal reload. That delivery versioned its CSS/scripts with `v=20261027-r3` and used fresh page-query addresses. Its matrices and screenshots remain historical iteration evidence. The subsequent motion refinement below uses `v=20261027-m4` and a separate `netbud-motion/` evidence folder.

Final `after-home-desktop.jpg`, `after-home-mobile.jpg`, `after-home-full.jpg` and paired desktop/mobile captures of services, contact, pricing, portfolio, product, catalogue and the preview offer are saved beside the original captures. Full-page capture follows actual scrolling to load lazy media; a blank unloaded image is not accepted as the final project evidence.

## Final independent perspectives

These are separate internal professional perspectives, not a commissioned external audit or a study with real customers.

- **Creative director:** the reviewed site has a coherent palette, original service art, varied section compositions and a substantial genuine work feature. Earlier peer critique drove clearer product actions, less portfolio decoration and a shorter mobile hero. Final comparison/contrast fixes were reviewed by the primary agent. A last additional creative-peer rerun was unavailable because its agent reached a usage limit; it is not represented as completed. Remaining subjective trade-offs are the bold illustration style and the intentionally extensive homepage; future real founder photography and approved client evidence would add depth.
- **First-time customer:** a separate peer review found that the first screen explains the offer and callback within a quick scan. Real work is easier to reach, the approved starting amount is explicit, and preview requests explain their limited scope. This is a café-owner perspective exercise, not measured customer research. No conversion improvement is claimed without traffic data.
- **Senior frontend engineer:** the final independent source review reported no remaining P1/P2 findings. Browser regressions cover drafts, validation, quantities, storage, keyboard navigation and integration states. The static stack remains straightforward to deploy; shared configuration and formatted sources improve maintenance. Long JavaScript-generated markup strings remain a minor maintainability trade-off. CPU-throttled mobile performance, assistive-technology coverage and production hosting/integrations remain unverified.

## Acceptance record

The following are final internal ratings of the locally reviewed design. Nine is a design target and judgement, not proof of perfection. The combined performance/accessibility category cannot receive a validated passing score from these local checks alone; its unverified parts remain explicit. Live delivery, payments, analytics, hosting and formal accessibility conformance are not proven by fixtures.

| Category | Final internal score | Supporting evidence / limits |
| --- | --- | --- |
| Visual identity | 9/10 | Consistent warm base, coral actions, violet feature areas and NetBud-owned art in final captures. |
| Creativity and originality | 9/10 | Distinct digital desk, service index, editorial PACES feature and illustrative comparison; no reference assets copied. |
| Colour harmony | 9/10 | Repeated controlled colour roles; helper-text contrast corrected; this is not a complete colour-accessibility audit. |
| Typography | 9/10 | Space Grotesk/DM Sans hierarchy, shorter phone headline and final checks for clipped headings at all seven widths. |
| Mobile experience | 9/10 locally | 119 page/width checks, deliberate tablet/phone composition and actual 375px captures; physical devices remain untested. |
| User experience | 9/10 locally | Catalogue, quote basket, menu, callback and comparison journeys work; clear editable drafts and error recovery. |
| Clarity of wording | 9/10 | Literal service descriptions, plain examples, limited-preview scope and explicit quote-only/starting amounts. |
| Conversion-focused design | 9/10 for design | Prominent callback, specific preview action, earlier work evidence and earlier product actions; no measured conversion claim. |
| Performance and accessibility | Not fully validated | Lightweight static stack, local assets, reduced motion, keyboard/focus/error checks and no observed own-site runtime errors. No throttled benchmark, screen-reader audit or WCAG certification. |
| Consistency and polish | 9/10 locally | Shared styles, 16-page static checks, reviewed key-page pairs and three substantive correction rounds. |

Within tested local journeys there are zero known critical bugs, broken local navigation references, nonfunctional primary controls, unintended document overflow, own-site JavaScript runtime errors, keyboard traps or false delivery claims. This is bounded local acceptance, not a guarantee about untested browsers or future external services. Final test evidence and limits are in `TESTING.md`; the twenty primary references and research limits are in `DESIGN_RESEARCH.md`. No further design approval is needed to inspect these files. Domain/repository selection, real social URLs and service-provider setup remain future configuration decisions already identified by the user.

## Subsequent motion and minimalist refinement — 27 October 2026

The later user brief requested implementation of the component-level motion specification. A verified 49-entry recovery ZIP was saved at `.work/backups/netbud-before-motion-2026-10-27.zip`. Its source was extracted into an ignored local baseline folder for genuine before captures; the original redesign screenshots were not relabelled as this refinement's baseline.

Implemented changes:

- Simplified the hero to one studio label, removed the sticker and repeated tagline, shortened the real preview action and replaced the illustration's faux button with content lines. The headline and real CTA are immediately visible. The illustration enters once over 600ms, with a 400ms underline draw.
- Added a 240ms incoming-image tab transition, with cancellation on rapid changes or reduced-motion preferences. The frame size, selection semantics and keyboard controls remain intact.
- Extended one shared reveal observer to selected service rows, benefits and PACES. Entrances run once, group delays are capped at 200ms and phones use smaller movement without stagger. Focus, restored history and reduced-motion handling expose content immediately. Unsupported APIs leave readable static content.
- Replaced service-row padding animation with a background layer and independent text/arrow transforms. Main button movement is smaller and gated to fine pointers; secondary controls remain calm. PACES card entrance and image zoom use separate elements. Product cards lift less; focused media links have inset rings inside clipped cards.
- Reduced secondary homepage spacing, changed the homepage process preview from five phases to three and the FAQ preview from ten questions to five. The complete five-step process page is retained, and useful removed FAQ details remain on the relevant services. Five primary navigation links keep Home on the logo and How It Works in content/footer routes.
- Added native disclosure-indicator transitions, stable form focus feedback, subtle pricing borders and small supporting illustration entrances. Prices, totals, fields and delivery wording retain their existing behaviour.

The first implementation was inspected and refined. A rendered service highlight exposed the existing muted text's 4.29:1 contrast against mango; its active colour now measures approximately 6.39:1. Further phone spacing moved the illustration earlier. A later keyboard capture exposed focus outlines clipped by media-card overflow; inset outlines were added and rechecked in six phone/desktop cases. A malformed mobile screenshot during a viewport change was identified as evidence failure and recaptured, rather than treated as a valid final view.

Capture-specific composition measurements:

| Reviewed condition | Before | After |
| --- | ---: | ---: |
| Desktop homepage height at 1440px | 7,739px | 7,173px |
| Phone homepage height at 375px | 12,011px | 11,419px |
| Phone hero height | 1,023px | 958px |
| Phone illustration position from document top | 652px | approximately 589px |
| Homepage process phases / FAQs | 5 / 10 | 3 / 5 |

These are layout measurements, not performance scores or conversion results. Source/asset size and animation smoothness were not assigned fabricated benchmarks.

Independent source review found no remaining P1/P2 integration defects. The creative/customer perspective review found the valid key-page captures clear, with the shorter navigation and calmer hero helping the enquiry route. Still images establish composition only; state transitions were checked separately. The review also caught the malformed evidence capture noted above.

Verification passed: 119 broad route/width observations, 418 overlapping fixture executions across 19 modes, six targeted focus checks after the final CSS-only fix, and 20 backup comparisons. Configuration/catalogue data and the genuine PACES image are byte-identical; all four static forms match the backup, and dynamic form/basket behaviour passed its regressions. Final static checks cover 16 HTML pages, 18 SVGs, 433 references and 17 configured paths with zero failures/warnings.

The latest evidence folder is `C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/netbud-motion/`. It contains before/after viewport captures, final responsive and fixture JSON, actual task journeys and the measured composition records. Detailed scope, m3/m4 test sequencing and limits are in `TESTING.md`. No production deployment, live provider delivery, physical-device benchmark or formal accessibility certification is claimed.
