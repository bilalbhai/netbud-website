# Supplied NetBud photographic scenes

Installed 16 November 2026 from the owner's supplied AI-generated, four-scene collage. These are illustrative scenes, not photographs of delivered stock, staff or client projects. Visible captions distinguish the generated imagery from genuine portfolio work.

| Asset under images/ | Dimensions | File bytes | Mapping |
| --- | --- | --- | --- |
| nfc-google-review.webp | 764 × 515 | 49,510 | NFC Google Review Card (ID 10) |
| nfc-business-card.webp | 764 × 515 | 46,152 | Custom NFC Business Card (ID 5), Shop hero |
| professional-logo-design.webp | 764 × 501 | 47,178 | Professional Logo Design (ID 4) |
| business-website-consultation.webp | 764 × 501 | 44,230 | Business Website (ID 1), Services introduction |

The four crops exclude the collage's white separator lines and were encoded as WebP quality 88 without upscaling. Total asset size is 187,070 bytes. No filters, generated replacements or unrelated stock assets were used.

The central catalogue in js/products.js supplies image paths, native dimensions, descriptive alt text and generated-scene captions. Shared rendering updates homepage/pricing featured cards, Shop listings, related recommendations, detail heroes and quote-basket thumbnails consistently. scripts/build-catalogue.cjs also writes the images into static product fallback content, social metadata and structured data. Regenerate after changing catalogue image metadata.

Replaced the relevant use of product-review.svg, product-nfc.svg, product-branding.svg, product-website.svg and shop-nfc-duo.svg. Old SVG files remain available for unaffected uses and historical references. Other services retain their subject-specific illustrations. The homepage laptop/phone animation and genuine PACES portfolio photograph are preserved.

Below-fold cards and basket thumbnails use lazy loading; visible Shop and detail heroes load eagerly. Existing card proportions, rounded corners, restrained hover styles and colour system are retained. No independent light/dark mode toggle exists in this site; the existing light pages and dark sections remain unchanged.

Verification: see the 16 November image integration entry in TESTING.md. Publication commit and verified live deployment are reported in the delivery message.
