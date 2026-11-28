# NetBud ordering system — Phase A review

Current staging status: [hosted migration history, tests and owner actions](../NETBUD_FULL_LAUNCH_REPORT.md). All approved NetBud staging migrations were applied. Earlier preflight notes below are historical.

28 November staging update: [Supabase connection, migration review and approval plan](SUPABASE_STAGING_SETUP.md), current branch `codex/netbud-full-launch` / PR #8. Owner supplied the new `netbud-staging` project, but both connected accounts deny access. No hosted migrations or owner provisioning have been performed; the older account-readiness notes below are historical.

Current review: [Phase H final integration and honest launch-readiness assessment](PHASE_H_REPORT.md), branch `codex/netbud-phase-h-integration`, based on Phase G. [Owner setup, safe migrations, manual proof handling and rollout/rollback](OPERATIONS.md) are updated. Accounts are not ready: hosted tests, legal details, recovery and production approval remain blockers. All PRs remain drafts; nothing is merged/deployed.

Current review: [Phase G launch preparation without Revolut](PHASE_G_REPORT.md), branch `codex/netbud-phase-g-launch-prep`, based on Phase E. See [email/DNS](EMAIL_DNS_SETUP.md), [operations/recovery](OPERATIONS.md) and [policy/invoice drafts](POLICY_AND_INVOICE_DRAFTS.md). Development only; no merge/deployment. Phase F is postponed and hosted launch gates remain unresolved.

Latest review: [Phase E private admin dashboard](PHASE_E_REPORT.md), branch `codex/netbud-phase-e-admin`. Development only; no merges or deployment, and Phase F has not started.

Latest review: [Phase D local customer tracking](PHASE_D_REPORT.md), on `codex/netbud-phase-d-tracking`. Production remains unchanged; no customer accounts, real emails or artwork approval are activated.

Date: 17 November 2026. Branch: `codex/netbud-ordering-phase-a`.
Baseline: `49e5708034e84d586bd08724e9734b4c5a6819b7`, verified against `origin/main` before this audit.

**Current status: Phase B development foundation implemented for review. No ordering system has been activated.** See the [Phase B report](PHASE_B_REPORT.md) and [local testing instructions](../../backend/README.md). The Phase A findings below remain the planning baseline; the owner subsequently authorized Phase B only.

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
