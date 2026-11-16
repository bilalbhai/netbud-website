# NetBud digital shop launch

## Editing and deployment

Edit product content, scope, proposed prices, billing labels, recommendations and images in `js/products.js`. Existing product IDs are retained for compatible legacy links and baskets; `catalogueNumber` matches the 001–018 launch brief.

Run `node scripts/build-catalogue.cjs` after catalogue or launch-pricing configuration changes. This dependency-free maintenance command generates the 18 standalone HTML detail pages, their static search/social metadata and the sitemap. Node is only an authoring tool; production remains HTML, CSS and vanilla JavaScript with no runtime or build service.

The homepage, `services.html`, `pricing.html`, `product.html?id=…` and quote basket remain usable. Legacy paid-campaign links 8/9 lead to a tailored campaign enquiry. Those discontinued basket entries are removed with an explanatory notice rather than silently mapped to a different service.

GitHub Pages deploys the existing `main` branch root. Preserve `CNAME` (`netbud.com.au`) and `.nojekyll`. No DNS changes are required. After pushing, check the repository's Pages deployment and open `/shop.html` and a product page on the live domain.

## Commercial decisions before public pricing

The brief explicitly marks proposed starting prices as draft and requires fulfilment verification before publication. The user explicitly confirmed all 18 prices and entry scopes, including ten human-designed logo concepts at A$79, on 16 November 2026. `launchPricingApproved` in `js/config.js` is true for launch; setting it false switches public pricing to quote-only. Proposed amounts remain in the central data; no payment or subscription is activated through the basket. Regenerate product pages whenever that flag or catalogue data changes.

Confirm especially:

- NFC supplier availability, supported personalisation, shipping cost, production time and replacement/defect handling.
- Whether ten genuinely different human-designed logo concepts are deliverable at A$79; revision count, file formats, editable source rights and IP transfer terms.
- Portfolio page limit and website revision allowance in the actual proposal.
- E-commerce platform, five-product scope, subscription/payment fees and supported checkout.
- Monthly Google profile task allowance, SEO hours/tasks, support response arrangements and cancellation notice.
- The actual hosting platform and a quantified maintenance allowance for the proposed A$49/month care plan.
- Social Content Starter preserves ten short-form videos from supplied/collected shop photos and website information, captions and a daily relevant hashtag pool subject to platform limits. One platform is scoped; filming, extra assets/platforms, paid ads and ongoing community management are separate.
- NetBud is a sole trader not registered for GST. No GST is added or GST tax invoice generated.

## Genuine integrations

- `formEndpoint` is blank. Enquiry forms prepare reviewable drafts; visitors choose email, WhatsApp or copy and must send through that chosen app. Draft preparation does not confirm delivery.
- No live card-payment integration or on-site secure checkout is configured. NFC actions are order enquiries only.
- No secure uploads are configured. Customers describe artwork needs and arrange transfer with NetBud after enquiry.
- No NFC dashboard or hosted digital-profile management is claimed. Existing websites/contact files can be linked; hosted profiles need a separate scoped service.
- No account credentials or private details are stored in the quote basket; only product IDs and quantities are saved in the visitor browser.
- No theme switch existed in the audited site. The existing light palette with dark feature sections is retained; no independent dark-mode feature is claimed.

## Sources used for product wording

Google review requests must invite genuine experiences without rewards, incentives or positive-review gating. Google controls verification, moderation and rankings: https://support.google.com/business/answer/3474122

## Verification record

The final QA results and publication commit are recorded in TESTING.md / the delivery response. Product illustrations are labelled illustrative and are not photos of actual supplied stock. The listed office and business contact details come from the user's existing approved configuration; no registration number or supplier is invented.

## Approved launch catalogue

| Product | Starting amount | Billing |
| --- | --- | --- |
| NFC Google Review Card | From A$39 | One-time purchase |
| Custom NFC Business Card | From A$39 | One-time purchase |
| Professional Logo Design | From A$79 | One-time project |
| Landing Page | From A$299 | One-time project |
| Portfolio Website | From A$399 | One-time project |
| Business Website | From A$599 | One-time project |
| E-commerce Website | From A$1,499 | One-time project |
| Website Redesign | From A$399 | One-time project |
| Google Business Profile Setup | From A$99 | One-time setup |
| Google Business Profile Management | From A$99/month | Monthly service |
| SEO Setup & Optimisation | From A$199 | One-time setup |
| Monthly SEO Management | From A$299/month | Monthly service |
| Social Media Content & Management | From A$299/month | Monthly service |
| Business Analytics & Tracking Setup | From A$149 | One-time setup |
| Domain & Professional Email Setup | From A$99 | One-time setup |
| Website Hosting & Care | From A$49/month | Monthly service |
| Online Booking System Setup | From A$149 | One-time setup |
| Digital Invoicing System Setup | From A$149 | One-time setup |
