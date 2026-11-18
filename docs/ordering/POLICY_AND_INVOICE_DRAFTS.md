# Phase G — review drafts, not issued documents

Phase H preparation: `backend/src/tax-draft.mjs` specifies nearest-cent GST extraction per approved gross line and preserves gross advertised totals. It refuses unreviewed classifications and labels every result `draft_not_valid_for_issue`. Shipping must be an explicitly classified line; mixed taxable/GST-free examples are tested. This helper has no public issue endpoint and does not approve any actual product's classification, ABN or seller identity. Accountant must approve the rounding policy, deposits, refunds/adjustments and final template before use. No real tax invoice was generated. Manual customer-proof evidence and independently confirmed external-refund recording now have guarded development workflows; their proposed operational/privacy terms remain subject to the review below.

18 November 2026. **Do not publish or issue these drafts.** The owner supplied the name **NetBud** and confirmed GST registration in the brief. ABN, verified legal entity/trading-name relationship, effective registration details and accountant-reviewed product/shipping/deposit classifications remain pending. No final GST calculation or tax invoice is enabled by this phase.

## Proposed pricing wording after verification

Current runtime `js/config.js` says “NetBud is not registered for GST; no GST is charged.” Proposed replacement, subject to verification:

> All prices are in Australian dollars and include GST where applicable. Your agreed scope, total and any ongoing costs will be confirmed before work starts.

Review catalogue comments, generated products, basket/checkout, quotes, policies and invoice/email templates together. Do not add 10% to the existing advertised gross prices. Keep unverified classifications pending. Publish only after identity/ABN/classification approval; the public site has not changed here.

## Invoice layout specification

**DRAFT FOR ACCOUNTANT REVIEW — NOT VALID FOR ISSUE**

| Field | Source / release gate |
| --- | --- |
| Title | “Tax invoice” only after required information and tax logic are approved |
| Seller | NetBud; verified legal seller/trading-name relationship pending |
| ABN | **Pending — blocks issue** |
| Contact | 67–71 Great Western Highway, Parramatta NSW 2150; sales@netbud.com.au; owner to verify |
| Identifier/date | Unique immutable invoice number, issue date and related order reference |
| Buyer | Customer identity/contact; recipient identity or ABN where required, including totals at least A$1,000 |
| Lines | Description, quantity, agreed price, reviewed classification and GST treatment |
| Totals | Gross total and GST for reviewed taxable supplies; no calculation from unconfirmed classifications |
| Payments | Actual confirmed receipts/deposits, balance and due terms, separate from invoice total |
| Corrections | Versioned adjustments and audit trail; never overwrite issued invoices or accepted quotes |

Accountant to review against [ATO requirements](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/tax-invoices) and [official invoicing guidance](https://business.gov.au/finance/payments-and-invoicing/how-to-invoice), including mixed supplies, rounding, deposits, adjustments and retention. This layout alone is not a compliance determination. Immutable invoice storage is preparatory; no issue endpoint or real invoice is created here.

## Proposed ordering and payment terms

An order is a request for NetBud's review. Receipt does not mean acceptance, payment or production authorisation. NetBud confirms availability, personalisation, scope and custom quotes before requesting payment. Approval refers to a specific quote version; a draft is not approval. Quotes are normally valid for 14 days unless stated otherwise.

Payment instructions follow review. NetBud records a transfer only after checking received funds; screenshots or customer-entered references do not automatically confirm payment. Deposits and stages must be agreed before work starts. No invented bank details or unverified payment links. Gateway payments remain unavailable.

## Proposed artwork and delivery terms

Personalised products require agreed instructions and approval of a validated proof. Uploads and online final approval are not active; arrange artwork by email. Production requires recorded acceptance, payment and artwork approval. Confirm turnaround/delivery estimates individually; do not promise invented dispatch times or carrier scans.

Existing shipping terms: A$14.95 within Australia, free when physical products total at least A$99. Pickup at 67–71 Great Western Highway, Parramatta NSW 2150 is by arrangement, with readiness/collection confirmation. Review these terms before publication; no price changes here.

## Proposed consumer remedies

NetBud assesses faults, missing delivery and service concerns promptly. Australian Consumer Law rights and remedies remain available where applicable. Customised items are not automatically excluded from remedies for defects or failures to meet consumer guarantees. An optional change-of-mind policy must be separate and cannot remove statutory rights. Contact sales@netbud.com.au with the order reference and issue. Owner/legal review must establish the final process. See [ACCC consumer guarantees](https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees).

## Proposed privacy and retention notice

NetBud uses necessary contact, order, artwork and delivery information to respond, fulfil orders, support customers and maintain required records. Email verification provides short-lived access without customer accounts. Staff access is limited by assignment and role. Do not collect card details through forms or email. Before launch, identify approved providers, actual processing locations, retention periods and privacy contact procedures.

Temporary artwork is intended for deletion 90 days after completion, following advance notice and subject to legal holds/unresolved issues. Keep financial/transaction records separately for legal periods confirmed by the accountant/adviser. Real notices and deletion remain disabled until private-file safety, delivery and hold-aware deletion are verified. Review backup retention too; live-file deletion does not erase every backup.

## Sign-off still needed

- Verified legal seller, ABN and GST registration details.
- Product/service, shipping, mixed-order and deposit tax classifications.
- Invoice numbering, adjustments, retention, rounding and recipient fields.
- Production/dispatch commitments, consumer remedies and change-of-mind terms.
- Privacy locations, backups, holds and customer access/correction process.
- Separate personal Gmail destination for sales forwarding. `sales@netbud.com.au` is the alias/Reply-To; do not forward it to itself.
