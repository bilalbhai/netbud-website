# NetBud Website

A website for NetBud, a Sydney-based business offering websites, NFC business cards, SEO, social media, paid advertising and digital support.

Built with HTML, CSS and plain JavaScript. The checked-in website runs without installing packages. Maintainers regenerate the smaller production assets after editing CSS or shared JavaScript (see below).

Ordering-system development is documented in [the phase review](docs/ordering/README.md). The Phase B foundation is isolated in `backend/` on a development branch; checkout, customer tracking and admin are not active. See [local backend setup](backend/README.md) for synthetic-data tests.

## Run locally

Start a local server if Python is installed. Clean page links and root-relative assets need HTTP, so use this preview instead of opening the file directly:

```sh
python -m http.server 8765
```

Then open http://localhost:8765. Keep the terminal open while using the preview. Stop it with Ctrl+C.

## Project files

- `index.html` and the other HTML files: website pages.
- `css/style.css`: colours, layout and responsive styling.
- `js/config.js`: contact details, prices and optional integrations.
- `js/products.js`: service packages.
- `js/`: navigation, forms, animations and other interactions.
- `images/`: logos, artwork and website images.
- `previews/`: demonstration layouts.
- `business-card-concepts/`: editable NetBud business card designs.
- `.nojekyll`: tells GitHub Pages to serve these static files directly.

## Publish with GitHub Pages

After uploading the repository:

1. Open the repository on GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose the **main** branch and **/ (root)** folder, then click **Save**.
5. GitHub will display the website address when deployment is ready.

A repository named `netbud-website` normally uses `https://YOUR-USERNAME.github.io/netbud-website/`. Custom domain setup for `netbud.com.au` is a separate step that requires DNS configuration.

## Before going live

Review `js/config.js`: the contact email is `bilal@netbud.com.au` and the office is at 67-71 Great Western Highway, Parramatta, NSW 2150. The production address is `https://netbud.com.au`; generated product pages and sitemap use that domain.

Forms need a configured external endpoint to deliver enquiries directly; GitHub Pages does not run a backend. Review the current form behaviour, draft privacy/terms pages, social links, `robots.txt` and `sitemap.xml` before launch. Never add passwords or secret API keys to browser JavaScript.

See `TESTING.md` for existing checks and `PROJECT_BRIEF.md` for project context.

## Repository contents

Temporary tooling, private environment files and unrelated university materials are excluded through `.gitignore`. Business card designs are concept proofs; consult their README before printing.

## Digital shop maintenance
See SHOP_LAUNCH.md. Catalogue data lives in js/products.js. Regenerate static detail pages with node scripts/build-catalogue.cjs after editing. The website stays buildless on GitHub Pages.

## Visual design maintenance

The shared palette, type and motion tokens are at the top of `css/style.css`; `css/polish.css` contains the organised premium layouts, controls and responsive refinements. Product imagery and smaller card variants are configured in `js/products.js`. Keep scopes and prices separate from visual edits. Run `node scripts/build-catalogue.cjs` after editing page templates or catalogue data to refresh the clean directory routes. See `VISUAL_REDESIGN_AUDIT.md` and `PREMIUM_REDESIGN_REPORT.md` for the November visual review.

## Creative motion review

`css/motion.css` and `js/motion.js` provide the selective entrance, timeline and pointer enhancements. `js/hero-story.js` remains the sole device-scene controller. Run `node scripts/check-motion.cjs` for its dependency-free regression checks. See `CREATIVE_MOTION_AUDIT.md` and `CREATIVE_MOTION_REPORT.md` for the separate review branch, animation inventory, evidence, limits and approval-before-deployment workflow.

## Rebuild public assets and metadata

Use Node.js 18+ and npm for maintenance only. These commands do not deploy the site:

```sh
npm ci --ignore-scripts
npm run build
npm test
```

Edit the readable `.css` and `.js` sources, not their generated `.min` copies. The build uses pinned esbuild 0.28.2 and updates asset version hashes, canonical/sharing metadata and clean directory routes. After changing the catalogue, run `npm run build:catalogue` instead. No server, customer checkout or paid service is introduced.

The growth audit, local measurements, screenshots and remaining owner decisions are in [the optimisation report](docs/NETBUD_GROWTH_OPTIMISATION_REPORT.md). Google and FormSubmit must be mocked during automated browser tests.
