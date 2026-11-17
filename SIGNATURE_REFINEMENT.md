# Current-preview refinement

Worked on the existing `codex/netbud-website-hero-nfc-section` branch, starting from `7d4743f`. No new branch, push or production deployment.

## Changes

- Moved the complete callback section to immediately after FAQs and before the final CTA. The entire callback markup is identical to the starting commit, including field IDs/names, required rules, honeypot, submission attributes and styling classes. Existing `#callback` links still reach it.
- Added `id="services"` to the existing services section and changed only the hero's Scroll to explore destination to `#services`.
- Restyled the existing NFC section as **NetBud Signature Product**, with charcoal/copper colour treatment, ivory product stage, concise custom-card benefits and a clear Create my NFC card action. Google review cards remain a quieter secondary link. No extra product section or image was added.
- Existing NFC markup, ten-second keyframes, Pause/Resume/Replay controller, phone proportions and contact details are unchanged. The card received only a subtle border/shadow treatment.

## Files

- `index.html`: section relocation, services anchor and signature-product copy.
- `css/signature-product.css`: home-only presentation overrides and services anchor spacing.
- `SIGNATURE_REFINEMENT.md`: this record.

## Verification

- Static comparison confirmed exact callback-section preservation and that the hero changed only its requested anchor. One callback section, after FAQs/before final CTA;28 unique source IDs.
- The animation/form controllers and existing design/motion styles remain byte-for-byte unchanged in Git.
- Browser checks at375,430,768,1024,1440,1920px: no horizontal overflow and all five existing inputs present (four contact fields plus honeypot).
- Callback header link navigated to the relocated form. Business name remains optional; name, phone and email remain required. A valid enquiry prepared the existing draft, explicitly stating nothing was sent. Invalid email produced its validation message and `aria-invalid="true"`. No email/WhatsApp draft was opened or sent. Test details were cleared.
- NFC replay completed its full ten-second animation, with final contact opacity1, card0 and complete state. Existing Pause/Resume remained usable.
- Hero scroll progress/zoom changed while the CTAs remained visible. Scroll to explore navigated to `#services`, with the callback still further down the page.
- Sticky benefit2 selected correctly; service cards remained sticky with .96–1 scaling; portfolio Next changed projects; parallax transform and four featured-card reveal targets remained present and functioning.
- Existing suites passed:23 NFC lifecycle checks and18 website-scroll checks. Git whitespace checks passed. No captured browser console errors/warnings.
- Desktop/mobile screenshots captured. This was browser-viewport testing, not physical-device or numerical performance benchmarking.

Evidence:
`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/signature-refinement/`

Preview: http://127.0.0.1:8765/?review=website-nfc-approval

The stopped local server was restarted from this current working folder. It remains available for review. Publish only after the user's approval; no DNS or hosting changes are required.
