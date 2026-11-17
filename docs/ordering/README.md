# NetBud ordering system — Phase A review

Date: 17 November 2026. Branch: `codex/netbud-ordering-phase-a`.
Baseline: `49e5708034e84d586bd08724e9734b4c5a6819b7`, verified against `origin/main` before this audit.

**Status: architecture prepared; backend implementation awaiting approval. No ordering system has been activated.**

The supplied master brief requires Phase A followed by approved phases in order. This change contains documentation and a catalogue snapshot only. No public pages, prices, forms, animations, PACES content, hosting, DNS or external accounts were changed.

## Review package

- [Current-code audit](AUDIT.md)
- [Hosting, providers, costs and sources](PROVIDERS.md)
- [Data flow, database and security design](ARCHITECTURE.md)
- [Phased implementation, owner setup and verification](PLAN.md)
- [Current catalogue snapshot](catalogue-baseline.json)

## Recommended decision

Keep the existing HTML/CSS/JavaScript website and GitHub repository. Develop a small server API with Supabase Postgres/private storage and Cloudflare Pages Functions, initially using local test data and unpaid orders. Use Resend provisionally for transactional email. Use Supabase Auth with TOTP MFA for invited staff only; customer order retrieval uses a separate short-lived email-code session, with no customer account registration.

For eventual production, prefer migrating the unchanged public static site to Cloudflare Pages rather than assuming GitHub Pages plus a checkout subdomain complies with GitHub's commercial restrictions. This is a proposed hosting change, not permission to make it.

There are important launch gates: owner account approvals, legal business name/ABN/tax classification, secure image-decoding feasibility, backup/restore arrangements, small free storage capacity and free-service payment restrictions. These are explained in the provider assessment. Zero new subscriptions is a low-volume target, not an unlimited or guaranteed service.

## Phase A verification

Executed against the unchanged application:

- `node scripts/check-forms.cjs`: 68 checks passed; network responses mocked.
- `node scripts/check-hero-scroll.cjs`: 18 checks passed.
- `node scripts/check-motion.cjs`: 15 checks passed.

These establish a baseline, not proof that future checkout, OTP, payments or admin work. No production customer submission, inbox access, payment, upload or backend request was made for this phase. No new UI exists to preview yet; open these Markdown documents in the editor. Existing local website preview remains unchanged.

## Approval requested

Approve Phase B's local backend foundation using this architecture. Phase B will provide migrations, test fixtures, private-storage rules, API validation, staff authorization, outbox and audit foundations. It will not migrate hosting, alter DNS, activate payments or deploy production. Any provider-account setup remains an explicit owner action.
