# NetBud premium visual redesign — 16 November 2026

## Outcome and recovery

The existing HTML/CSS/plain-JavaScript website has been refined as one visual system. Hosting, domain, repository, commercial catalogue and enquiry model are retained. No framework, payment service, tracking service or build-time dependency has been added.

Recovery tag: `netbud-before-premium-redesign-20261116`, pointing to `c5602de`. `VISUAL_REDESIGN_AUDIT.md` records the starting assessment. Before/after browser screenshots and machine-readable review results are saved in the local evidence folder listed below.

## Shared design system

| Element | Final treatment |
| --- | --- |
| Base | Paper `#FAF9F6`, white `#FFFFFF`, ink `#24242B`, muted `#585762` |
| Accents | Coral `#E9634E`, rust `#A43B2C`, peach `#F8DDD4`, lavender `#EDE6FA`, blue `#E4EEFB` |
| Supporting surfaces | Warm neutral `#F5F2ED`, dark `#22242C`; soft blended gradients |
| Type | Existing Space Grotesk headings and DM Sans text; balanced headings and readable line lengths |
| Shape | 12px controls, 22px cards, 32px feature panels; retained curved home sections |
| Space | Shared 56–104px section scale, compact secondary sections and consistent grid gaps |
| Motion | 180–220ms controls, 300ms card lift, 450ms image zoom, 520ms scroll fades |

The latest brief's motion timings replace the previous 1.5-second ordinary hover treatment. First-screen content displays immediately; later content fades without making keyboard users wait. Reduced-motion styles disable decorative movement. The device story's existing timings are preserved; its manual switch appears for reduced-motion users only.

Legacy palette overrides and self-referencing colour variables have been removed from `style.css`. Compatibility aliases point to the shared palette. Presentation rules in `polish.css` are organised by controls, surfaces, homepage, services, products, supporting pages and responsive behaviour.

## Page changes

- **Home:** clearer custom-coded positioning; free-preview primary action and Shop secondary action; quieter glass-like hero panel; three asymmetric service groups; blue/lavender Work section; dark four-benefit custom website section; blended preview showcase with three steps and retained sticky comparison; four featured products; clearer FAQs and closing action. Laptop/NFC scenes, phone/card proportions, double blink and contact transition remain intact.
- **Shop:** softer borderless cards, consistent image proportions, restrained lift/zoom, aligned information and actions, compact filters and useful category links. All 18 entries remain available.
- **Product pages:** distinct service imagery, accessible enlarged-image dialog, consistent gallery and information layout, clear price/quote actions, paired scope panels, product questions, related services and enquiry form. Website packages retain their integrated custom-code benefits and qualifications.
- **Services:** alternating photographs/interfaces and text, expandable inclusions, editorial numbered custom benefits and a short sticky supporting panel. Existing service destinations and detailed copy remain available.
- **Work:** PACES is a full-width featured case study, with a purpose and approach derived from its existing description. Two fictional concepts follow separately. The homepage retains its user-controlled 3D carousel.
- **About:** original illustrative workspace image and the approved Bilal Zafar / Director and Backend Developer introduction. No invented founder photograph, staff, credentials or results.
- **Free Preview:** pastel introduction, original workspace image, clearer steps and form presentation. Eligibility, limited scope and three-business-day availability conditions remain.
- **Process:** cleaner numbered timeline, styled three-step introduction and removal of duplicate numbering.
- **Pricing:** a concise website/NFC/care starting-price guide linked to the full catalogue; one-time and recurring costs remain separate.
- **Contact:** shared palette, clearer direct-contact panel, improved inputs/progress/review surfaces; callback and general enquiries retained.
- **Basket:** softer summary and empty state; actual clean product links; quantities, removal, separate monthly/one-time estimates and draft enquiry remain functional.
- **Privacy, Terms, Thank You and 404:** consistent reading widths, jump links, surfaces, type and recovery actions. Draft/legal-review notices remain. The 404 skip-link was corrected.
- **Concept gallery:** new café/trades visual demonstrations and shared styles. Public editing placeholders were removed. Fictional status remains explicit; no client outcomes are implied.
- **Retired custom guide:** `/custom-websites/` still redirects to Services. Custom-code messaging remains integrated throughout existing pages, respecting the earlier instruction against a separate marketing page.

## Images

Retained the NetBud SVG marks, laptop asset, genuine PACES screenshot and four existing photographic WebP scenes: NFC review, NFC business card, logo design and website consultation.

Created three original generated photographic scenes: workspace, café and trade workbench. They are illustrative, not claims about NetBud's actual office, founder or clients. The workspace appears in relevant editorial sections; café and trade scenes support the fictional concepts.

Created 14 distinct catalogue interface mockups for landing pages, portfolios, e-commerce, redesign, profile setup/care, SEO setup/monthly work, social content, analytics, professional email, website care, booking and invoicing. Two additional mockups illustrate the café and trades concepts. Interface text and charts are explicitly sample content, not business results. The fictional store shows relevant ceramics, stationery and greenery rather than unrelated NetBud service photos.

All 18 catalogue images have smaller WebP variants configured through `imageSmall`, with responsive image selection on cards. Images have dimensions and descriptive alternatives; below-the-fold cards load lazily. Existing photos remain full quality for detail views. Physical product illustrations and fictional interfaces remain clearly labelled.

## Actual verification

- Rendered **33 routes × 6 widths = 198 checks** at 375, 430, 768, 1024, 1440 and 1920px. One H1 per route, no horizontal document overflow and no completed image-load failures were found. This used the in-app Chromium browser; it is not a claim of testing every browser or physical device.
- Individually loaded all **18 product detail pages**: correct names, approved starting prices, distinct loaded gallery image, enlargement button, required email and quote-basket action. Repeated product checks at 375px.
- Inspected actual browser screenshots of desktop and mobile pages, the catalogue, all product introductions, grouped services and the preview comparison. Fixed inherited compact carousel styling on the Work page and duplicate process numbers during review.
- Tested mobile menu opening/closing and floating callback navigation. Confirmed the home callback control hides when the callback section is reached.
- Tested category filtering (two NFC products), search for booking, monthly filtering, industry filtering, ascending prices and filter reset to all 18 entries.
- Opened and closed the enlarged product-image dialog.
- Tested adding one-time and monthly packages to the basket, increasing quantity, removal and emptying. Two A$39 cards produced an A$78 one-time estimate, separate from A$49/month care. No subscription or purchase was activated.
- Tested callback, free-preview, contact, product and basket draft preparation. Invalid email validation was exercised. Successful draft states explicitly say **nothing has been sent**. No test enquiry was sent externally.
- Tested the homepage carousel's Next control and comparison keyboard endpoints/increments, including restoring 55%. Both design panels reflow; the comparison retains its desktop sticky position.
- Checked rendered local links across the site (1,461 instances). Found and fixed the fictional gallery path and 404 skip-link, then separately verified both fixes. Dynamic enquiry anchors were inspected in browser-rendered pages.
- Static checker: **35 HTML source pages, 23 SVGs, 1,138 HTML references and 59 catalogue/config paths; zero failures or warnings**. Clean-route checker: **27 sitemap routes and their local asset/link targets passed**.
- JavaScript syntax checks passed. Hero controller checks: **25 passed**, including 3-second scenes, focused-action stability, hidden-page suspension and simulated reduced-motion behaviour. CSS blocks are balanced and no self-referencing custom properties remain. This was not a third-party CSS lint or Lighthouse certification.
- Compared the original and revised catalogue while excluding image fields: **all 18 commercial records, prices, billing, inclusions, exclusions, requirements and FAQs are unchanged**.
- Core text contrast calculations: ink/paper 14.64:1, muted/white 7.11:1, rust/paper 6.16:1, ink/coral 4.67:1. These are checks of core colour pairs, not a full WCAG certification.
- No browser warnings/errors appeared in the reviewed local browser log. No active analytics ID, payment integration or form delivery endpoint was introduced.

## Evidence

Local folder:

`C:/Users/mdbil/.codex/visualizations/2026/10/26/01a177dc-faf0-7402-93b8-a0c169ae0f0f/premium-redesign/`

Includes `before-home-1440.jpg`, `before-home-375.jpg`, before Shop/Services views, `after-home-375.jpg`, `after-home-1440.jpg`, all product introduction screenshots, supporting-page screenshots, `after-services-group-1440.jpg`, `after-preview-1440.jpg`, `after-portfolio-1440.jpg`, responsive/product review JSON and rendered-link records. Some early overview sheets capture the intermediate state; the final individual screenshots and final 198-check matrix take precedence.

## Files and maintenance

Primary edits: `css/style.css`, `css/shop.css`, `css/polish.css`, `js/main.js`, `js/hero-story.js`, image metadata in `js/products.js`, concept images in `js/config.js`, the existing HTML page templates, `previews/index.html`, `README.md` and this audit/report. New assets live under `images/`.

The existing `node scripts/build-catalogue.cjs` command refreshed all 18 product sources, clean directory routes and the sitemap. Those generated publication files are included with the source templates. No unrelated temporary business-card/university output is part of this change.

## Remaining business/integration items

- Direct form delivery still needs a genuine HTTPS endpoint. Current email/WhatsApp/copy drafts work without one and are clearly described.
- Social profile URLs and analytics remain optional and unconfigured. No fake live profiles or tracking were added.
- Privacy and Terms still require the business/legal review already stated on those pages.
- Final public-domain check: `https://netbud.com.au` serves the redesign successfully, but `https://www.netbud.com.au` failed certificate hostname validation. Public DNS returned the four correct GitHub Pages apex A records and `www CNAME bilalbhai.github.io`. The DNS values match GitHub's documented setup; the remaining issue needs review of the Pages domain/certificate provisioning in the GitHub account. No certificate checks were bypassed and no DNS records were changed during this redesign.
- A genuine founder/team/office photograph can replace the labelled illustration when supplied. None has been fabricated.
- Real-device Safari/Firefox checks and performance laboratory scores were not available in this browser review. The static architecture, responsive checks, lazy images and motion preferences were preserved and tested within the stated limits.

## Publication

Use the existing `main` branch and GitHub Pages workflow for `https://netbud.com.au`. The remote branch was checked before publication and matched the starting local commit. The deployment result and live-site verification are reported in the final handover.

Redesign commit `b7cb744` was pushed successfully. GitHub Pages run `43840228002` completed successfully. Live checks of Home, Shop, Work, E-commerce, Contact and the fictional gallery found the new palette and content, with no broken loaded images or horizontal overflow. The live browser log had no warnings or errors. A final screenshot is saved as `live-redesign-proof.jpg` in the evidence folder. The `www` certificate issue above remains separate from the successful apex-domain deployment.

Domain setup reference: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
