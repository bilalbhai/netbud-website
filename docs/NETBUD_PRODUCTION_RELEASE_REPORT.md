# NetBud production release report

## Final launch verdict: BLOCKED

18 November 2026. Repository `bilalbhai/netbud-website`; draft PR **#7**, branch `codex/netbud-growth-optimisation`, target `main`. Latest fetched production baseline: **593c3bfd6e3deb23da2fb6903825ed59600e03cc**. Original PR candidate reviewed: **c7d9dd58c61e40bfa5fdab605ca6a630777a96f0**; the release-preparation follow-up is the latest commit on PR #7.

**The public marketing/enquiry candidate passes its automated technical checks. It is not approved for production launch.** Published Google configuration, hosting suitability and legal/tax sign-off remain unresolved. No merge, deployment, GTM publication, DNS/MX/forwarding change, real customer submission or payment occurred.

**Urgent live-site distinction:** the analytics hold described below is on this development branch only. The currently served site still has its previous configuration. This PR does not by itself disable the existing live container. The owner should address the live Google configuration or authorise a separately reviewed emergency analytics-off change; no such deployment is authorised or performed here.

## 1. Exact release blockers

| Gate | Evidence / unresolved issue | Required owner action |
|---|---|---|
| **G1 — Published analytics privacy configuration** | Read-only download of `GTM-N9B3W4F5`, resource version 2, shows automatic first-party email/phone/address detection enabled and automatic form/history/outbound/scroll/download/video measurement enabled. This conflicts with the intended anonymous event allowlist and no-user-provided-data requirement. This is configuration evidence, **not proof that personal information was actually transmitted**. | Correct the Google tag/GA4 settings and review the resulting published configuration before re-enabling analytics; **or explicitly approve a marketing release with analytics kept off**. Do not flip the release gates based only on mock tests. No tags were published by Codex. |
| **H1 — Hosting suitability not cleared** | Apex/www DNS and `Server: GitHub.com` establish the current GitHub Pages hosting. GitHub's official Pages limits say the service is not intended/allowed as free hosting to run an online business or a site primarily facilitating commercial transactions. NetBud is a commercial agency/enquiry site; suitability has not been cleared with the provider. | Obtain appropriate provider confirmation or approve a compliant static-hosting arrangement. Any migration or DNS change needs separate explicit scope/approval; this task changes neither. Do not assume that merely disabling payments resolves the hosting restriction. |
| **L1 — Legal identity and disclosures** | ABN and responsible legal seller identity have not been supplied. Privacy/terms still clearly identify owner-review work, including provider processing/retention and request handling. | Supply verified public business details and approve factual final privacy/terms/effective dates. Obtain appropriate advice where needed. This is an unresolved owner release requirement, not a claim that every marketing page universally must display an ABN. No legal certification is claimed. |
| **T1 — Advertised GST basis** | Owner confirms GST registration, but the inclusion basis and classifications for individual advertised starting amounts remain unconfirmed. The PR preserves every price and states that written quotes confirm applicable GST. | Confirm how the unchanged advertised amounts meet applicable total-price/GST display requirements and approve any precise disclosure correction needed. Do not add 10%, assume every offer's classification, invent an ABN or issue a tax invoice. |

[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) and [ACCC price-display guidance](https://www.accc.gov.au/consumers/pricing/price-displays) were read directly, without changing any account. The policy restriction and tax question must be resolved by the owner; these notes are not a legal determination.

## 2. Final review scope

Every one of the **110 original PR paths** was reviewed against the latest fetched `main`:

- Readable JS/config/CSS and build/test scripts: full text/diff and behavioural review.
- Eleven generated minified files: regenerated from readable sources using pinned esbuild 0.28.2 and compared exactly, normalising checkout line endings.
- HTML aliases/directory pages: static head, canonical, schema/resource review; body comparison against main limits changes to intended shop/legal/404 content. Rendered pages were also crawled.
- Eleven PNG evidence images: signature/dimensions and visual contact-sheet review. They contain public website content, not entered customer details. Historical screenshot churn from reruns was excluded.
- JSON/Markdown/lockfile/evidence: full content/structured parsing, dependency/source/provenance and credential-pattern review. No private backups or customer records were included.

The new release-preparation scripts/evidence/report were reviewed separately. [Exact follow-up changed-file list](production-release/release-changed-files.txt). [Per-file original-PR inventory and current candidate hashes](production-release/candidate-review.json).

The catalogue, advertised amounts, package scopes, product promises, portfolio configuration and PACES references match main's data exactly. No PACES repository, artwork or content was modified. The cinematic, arrival/typewriter, NFC, stacking, parallax and portfolio controller sources are unchanged. The existing premium design and the sprint's mobile product-information ordering remain intact.

No unfinished ordering app, admin, customer account, upload, Supabase, Resend, Revolut or payment activation is included. The basket is an enquiry basket, not paid checkout. Analytics helper names reserved for future ordering are not public ordering endpoints. [PRs #1–#6 were checked and remain open drafts, unmerged](production-release/pr-state.json).

## 3. Release-blocking defects addressed in code

### Published container safety hold

The source-only inspection found:

- Container and destination IDs are correct: **GTM-N9B3W4F5** and **G-4L3JN7WC5M**.
- The Google tag has `send_page_view=false`, Google signals/personalisation settings false, and the Google/event tags require `analytics_storage`. The event trigger uses the intended anchored allowlist. These are positive findings, but do not cancel the configuration problems below.
- `__ogt_1p_data_v2`: `vtp_isEnabled`, `vtp_isAutoEnabled`, `vtp_autoEmailEnabled`, `vtp_autoPhoneEnabled`, `vtp_autoAddressEnabled`, `vtp_isAutoCollectPiiEnabledFlag` are **true**.
- `__ogt_auto_events`: automatic form/history and the other listed enhanced measurements are **true**. They can bypass the site's intended manual-event schema or introduce duplicate/extra measurements.

The container was **not executed**. No GA4 collection endpoint was called and no actual transmission of personal information was demonstrated. Published source inspection does not replace owner workspace/property review or DebugView.

To avoid shipping unreviewed tracking, the candidate now has:

```js
googleTagManagerId: "GTM-N9B3W4F5",
googleAnalyticsId: "G-4L3JN7WC5M",
analyticsEnabled: false,
analyticsContainerReviewed: false,
```

Privacy copy accurately says analytics is currently disabled pending review. A persisted acceptance cannot override these source gates. Mock tests enable a **stub-only** configuration in intercepted test responses; they do not re-enable production tracking. No standalone GA loader was added.

[Published-container evidence](production-release/published-container-check.json). Raw Google script was kept only in ignored local cache, not committed.

### Product sharing metadata

The shared JS initialisation reset product-specific OG/Twitter images to the generic social image. Product rendering now reapplies the catalogue's own absolute image URL. All **18 actual product pages** are checked after JS rendering; their canonical/schema/sharing metadata is consistent. There is no visual redesign or price change.

### Nested 404 recovery

The custom 404 page used relative CSS/JS/image/navigation paths, which break when GitHub serves it for a nested missing URL. The clean-route build now normalises 404 resources/links in place, keeps HTTP 404/noindex behaviour and avoids manufacturing a canonical for the nonexistent URL. A nested-path browser test verifies loaded logo/scripts, readable page and homepage recovery. No extra public feature was added.

## 4. Automated final test evidence

All applicable public-site suites were executed. Ordering/backend suites from PRs #1–#6 were deliberately not imported or activated.

| Test group | Final result |
|---|---|
| Existing actual-handler forms | **68 passed** |
| Existing hero-scroll checks | **18 passed** |
| Existing looping/reduced-motion checks | **15 passed** |
| Growth metadata/catalogue/preservation checks | **428 passed** |
| Growth browser / analytics-consent checks | **486 passed** |
| Additional final per-file/crawl/hold/recovery audit | **1,144 passed** |
| Published-container privacy inspection | **BLOCKED — external configuration; candidate mitigated by analytics hold** |

The 101 existing checks are the first three rows. Browser journey widths: **375, 430, 768, 1024 and 1440 px**. They check callback, full contact, preview, three representative website/NFC product journeys, shop search/category/reset, basket edits/persistence/quote enquiry, mobile menu/Escape/focus, labels/alt/IDs, reduced motion, no horizontal overflow and no browser exceptions. Normal-motion hero scrolling and visible NFC playback are also exercised.

The final release audit additionally checks **32 rendered pages**, **all 18 products**, **127 distinct internal references**, visible image decoding, CSS image URLs, internal anchors, sitemap/robots, nested 404 recovery, and the actual disabled release configuration with stored consent. Its local form submission is mocked and succeeds with no Google requests.

Consent suite evidence: rejection prevents loading Google; acceptance loads one approved **mock** container; explicit page views and lead conversions do not duplicate; failure/activation requests do not become leads; customer-entered values do not enter the data layer; withdrawal blocks subsequent loads; Google blocked does not stop enquiries. Advertising remains denied in the helper. **These results do not validate the unsafe published container's behaviour.**

[Machine-readable final test summary](production-release/final-tests.json).

No real customer enquiry was sent. FormSubmit's activation and receipt were confirmed by the owner previously; this final run independently verifies only the mocked browser/service-response behaviour. Fresh mailbox receipt and live GA4 receipt are not claimed.

Commands executed:

```powershell
node .cache/npm-tool/package/bin/npm-cli.js run build
node .cache/npm-tool/package/bin/npm-cli.js test
$env:PLAYWRIGHT_MODULE='file:///C:/Users/mdbil/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/review-growth.mjs
node scripts/review-production-release.mjs
node scripts/audit-release-live.mjs
node scripts/review-published-container.mjs
```

The cached npm CLI is a previously integrity-checked local tool. Maintainers can use installed npm and the pinned lockfile: `npm ci --ignore-scripts`, `npm run build`, `npm test`. The build uses no deployment command. Existing sprint before/after performance evidence remains historical lab data; no fresh production field-speed or ranking claim is made.

## 5. Read-only production checks

Evidence timestamp: **2026-11-18T11:18:42.558Z**. [Raw live checks](production-release/live-checks.json).

- Apex A records resolve to the four GitHub Pages addresses: `185.199.108.153` through `185.199.111.153`. `www` CNAME resolves to `bilalbhai.github.io`.
- `https://netbud.com.au/`: **200**. `https://www.netbud.com.au/`: **301** to the apex. Both HTTP roots redirect to the HTTPS apex. No redirect loop observed.
- Both hostnames validated with normal certificate verification, **TLS 1.3**, Let's Encrypt, SANs covering apex and www. Certificate validity observed: **16 November 2026 to 14 February 2027**. No insecure TLS override was used.
- Live homepage, shop, contact, preview, basket, privacy, terms, sitemap/robots and the three primary website/NFC pages returned **200**.
- **36 asset references** taken from the current live HTML returned **200** using HEAD requests. They were not executed. This checks current main's assets; PR-specific minified assets were checked in the local candidate, not falsely claimed to be deployed.
- The currently served config contains the correct GTM/GA4 IDs but still has the old non-registration GST wording. The PR correction is **not live yet**.
- Published GTM source was fetched for inspection only. No browser executed it; no collection/email endpoint was contacted by this check.

GitHub Pages source-branch/folder settings and the Enforce HTTPS checkbox were **not inspected in an authenticated hosting dashboard**. Observable HTTPS works, but the owner must verify the actual release source before any approval. No DNS, MX or email-forwarding records were changed. HTTP/TLS checks do not establish hosting-policy permission, inbox delivery, legal approval or field Web Vitals.

## 6. Exact owner actions remaining

1. **Address the current live Google risk.** In the intended GA4 property/Google tag settings, disable user-provided-data capabilities and automatic email/phone/address detection; disable unwanted Enhanced Measurement, especially form/history tracking. Confirm the required consent checks, safe DLV mappings and manual event allowlist. Review the resulting published source/Tag Assistant configuration under an owner-approved process. Codex must not publish GTM. Alternatively approve keeping analytics completely off for the marketing release. Any emergency live analytics-off patch needs its own explicit approval.
2. **Clear hosting gate H1.** Resolve the relevant GitHub Pages commercial-use restriction with the provider or approve suitable hosting. A migration/DNS change is separate work, not authorised by this report. No paid subscription has been created or required by these code changes.
3. **Resolve L1/T1.** Supply/confirm legal seller identity, ABN, GST display basis/classifications and approved privacy/terms (providers, retention/request handling, dates). No prices were changed. See [official pricing guidance evidence](production-release/pricing-reference.json).
4. **Give operational sign-off.** Use the owner's own safe details for an explicitly approved manual enquiry and confirm inbox receipt/reply-to. If analytics remains disabled, no GA4 receipt is expected. If later re-enabled after remediation, verify opt-in/withdrawal, no PII, one page view and one conversion through Tag Assistant/DebugView with owner-approved testing. Do not send customer data to test systems.
5. **Approve the exact PR head and release target.** Verify GitHub Settings → Pages source and domain/HTTPS settings read-only; recognise that merging into a branch used by Pages can itself publish the website. Approve only PR #7, never PRs #1–#6. Keep both analytics gates false unless a separately reviewed change explicitly authorises reactivation.

## 7. Conditional production release instructions — NOT EXECUTED

Only after the gates above are closed and the owner approves the exact commit:

1. Record the approved candidate SHA and production baseline SHA. If `main` advanced, review the new diff and repeat applicable tests before approving. Keep the release candidate free of ordering/backend changes.
2. Run the pinned install/build/static tests and both mocked browser suites from a clean checkout. Confirm no unreviewed generated changes. Capture a tested, privacy-safe rollback candidate as described below.
3. Confirm the chosen host's source and the approved static artifact/branch. `CNAME` remains `netbud.com.au`; no DNS/MX/forwarding or payment-setting action is part of this release. Do not merge merely to discover how hosting behaves.
4. The owner may then approve/perform the single PR #7 merge/deployment through the previously agreed host workflow. No merge/deploy/publish command is installed or executed here.
5. After publication, check apex/www HTTP→HTTPS, certificate validity, homepage/shop/all products/contact/preview/basket/404, assets, canonical/sitemap/robots and mobile navigation. Confirm final approved legal/pricing copy. Repeat owner-approved inbox testing. With the hold in place, confirm no GTM/GA requests even when old consent exists.
6. Keep monitoring availability and enquiries. Do not activate checkout/admin/customer accounts, uploads, payments or PRs #1–#6 as part of this release.

## 8. Rollback plan — preserve the safety fixes

**Do not blindly redeploy baseline `593c3bf`.** It is the observed previous codebase, but contains the old GST claim and enabled analytics pointing at the problematic container. It is an availability reference, **not a privacy-safe rollback artifact**.

Before any release, prepare a reviewed recovery version/artifact which retains:

- `analyticsEnabled: false` and `analyticsContainerReviewed: false`;
- factual GST registration and owner-approved final legal/tax copy;
- the verified FormSubmit recipient/workflow and known working static asset references;
- no ordering/admin/payment activation and no DNS/MX/forwarding changes.

Preferred response to a defect is a narrow forward fix or backout of the affected visual/asset change while retaining those safeguards. If a full code revert is necessary, prepare it on a rollback branch for review:

```sh
git fetch origin
git switch -c codex/netbud-release-rollback origin/main
# For a squash release commit:
git revert --no-commit <actual-approved-release-commit>
# For a true merge commit, use instead:
# git revert -m 1 --no-commit <actual-approved-merge-commit>
```

Do **not** commit/merge/publish the raw revert until the analytics hold, correct GST statement and approved disclosures are retained or reapplied. Keep a consistent source/generated asset set; if the backout changes build/test tooling, restore the reviewed tools needed to validate that backout or explicitly adapt the validation plan. Never force-push or reset production history. Do not revert unrelated owner's changes.

Rerun form, navigation/mobile, catalogue/price, image/link, SEO, motion and privacy/hold checks for the actual rollback candidate. An unavailable/failed required check blocks that rollback's approval. The owner must approve the rollback PR or restoration of the pre-tested privacy-safe artifact. Validate apex/www HTTPS and mock/owner-controlled enquiries afterwards. Rollback must not touch DNS, mail forwarding or payment systems. A code rollback does not repair Google's account configuration.

## 9. Outcome and evidence limits

Automated technical failures have been resolved; external gates remain open. **READY is not claimed.** No real GA4 event receipt, actual new email delivery, hosting-policy clearance, legal certification, comprehensive screen-reader audit or production field-performance improvement is asserted.

New release work is limited to the analytics hold/privacy accuracy, rendered product-sharing fix, nested-404 recovery, regression/evidence tooling and this report. The original premium design, animation controllers, prices and product promises are preserved. A clean release-preparation commit is pushed to the existing draft PR; it is not a production deployment.
