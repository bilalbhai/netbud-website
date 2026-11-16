# NetBud Website

A website for NetBud, a Sydney-based business offering websites, NFC business cards, SEO, social media, paid advertising and digital support.

Built with HTML, CSS and plain JavaScript. No build step or package installation is required.

## Run locally

Open `index.html` in a browser, or start a local server if Python is installed:

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
